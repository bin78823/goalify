use crate::db::{self, AppState};
use crate::supabase::AppSupabaseState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub message: String,
    pub pushed_projects: u32,
    pub pushed_tasks: u32,
    pub pushed_subtasks: u32,
    pub pulled_projects: u32,
    pub pulled_tasks: u32,
    pub pulled_subtasks: u32,
    pub deleted_tasks: u32,
    pub deleted_subtasks: u32,
    pub deleted_projects: u32,
}

#[tauri::command]
pub async fn sync_push(
    state: State<'_, AppState>,
    supabase_state: State<'_, AppSupabaseState>,
) -> Result<SyncResult, String> {
    supabase_state.init_client();
    let client = supabase_state.get_client().ok_or("Failed to initialize client")?;
    let user = supabase_state.get_user().ok_or("Not authenticated")?;
    let user_id = user.id;

    // 记录同步开始时间（必须在获取数据之前）
    // 这样可以确保同步过程中发生的变更不会被遗漏
    let sync_start_time = chrono::Utc::now().to_rfc3339();

    // 获取上次同步时间
    let last_sync_time = {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        db::get_last_sync_time(&conn).ok().flatten()
    };

    // 获取变更的数据（增量同步）
    let (projects, tasks, subtasks) = {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        
        match &last_sync_time {
            Some(since) => {
                // 增量同步：只获取上次同步后更新的数据
                (
                    db::get_projects_updated_since(&conn, since).map_err(|e| e.to_string())?,
                    db::get_tasks_updated_since(&conn, since).map_err(|e| e.to_string())?,
                    db::get_subtasks_updated_since(&conn, since).map_err(|e| e.to_string())?,
                )
            }
            None => {
                // 首次同步：获取所有数据
                (
                    db::get_all_projects(&conn).map_err(|e| e.to_string())?,
                    db::get_all_tasks(&conn).map_err(|e| e.to_string())?,
                    db::get_all_subtasks(&conn).map_err(|e| e.to_string())?,
                )
            }
        }
    };

    let mut pushed_projects = 0u32;
    let mut pushed_tasks = 0u32;
    let mut pushed_subtasks = 0u32;
    let mut deleted_projects = 0u32;
    let mut deleted_tasks = 0u32;
    let mut deleted_subtasks = 0u32;

    // 处理 sync_queue 中的删除操作
    let pending_sync_items = {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        db::get_pending_sync_items(&conn).map_err(|e| e.to_string())?
    };

    for item in pending_sync_items {
        if item.operation == "DELETE" {
            let success = match item.table_name.as_str() {
                "tasks" => {
                    match client.delete_task(&item.record_id).await {
                        Ok(_) => {
                            deleted_tasks += 1;
                            true
                        }
                        Err(_) => false,
                    }
                }
                "subtasks" => {
                    match client.delete_subtask(&item.record_id).await {
                        Ok(_) => {
                            deleted_subtasks += 1;
                            true
                        }
                        Err(_) => false,
                    }
                }
                "projects" => {
                    match client.delete_project(&item.record_id).await {
                        Ok(_) => {
                            deleted_projects += 1;
                            true
                        }
                        Err(_) => false,
                    }
                }
                _ => false,
            };

            if success {
                let conn = state
                    .db
                    .lock()
                    .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
                let _ = db::mark_synced(&conn, &item.id);
            }
        }
    }

    // 同步变更的项目
    for project in projects {
        // 如果没有 owner_id，先设置当前用户为 owner
        if project.owner_id.is_none() {
            let conn = state
                .db
                .lock()
                .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
            let _ = db::update_project_owner(&conn, &project.id, &user_id);
        }

        let supabase_project = serde_json::json!({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "icon": project.icon,
            "owner_id": user_id
        });

        match client.create_project(&supabase_project).await {
            Ok(created) => {
                if !created.is_null() {
                    pushed_projects += 1;
                }
            }
            Err(_) => {}
        }
    }

    // 同步变更的任务
    for task in tasks {
        // 如果没有 owner_id，先设置当前用户为 owner
        if task.owner_id.is_none() {
            let conn = state
                .db
                .lock()
                .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
            let _ = db::set_task_owner(&conn, &task.id, &user_id);
        }

        let supabase_task = serde_json::json!({
            "id": task.id,
            "project_id": task.project_id,
            "name": task.name,
            "description": task.description,
            "start_date": task.start_date,
            "end_date": task.end_date,
            "dependencies": task.dependencies,
            "is_milestone": task.is_milestone,
            "color": task.color,
            "owner_id": user_id
        });

        match client.create_task(&supabase_task).await {
            Ok(created) => {
                if !created.is_null() {
                    pushed_tasks += 1;
                }
            }
            Err(_) => {}
        }
    }

    // 同步变更的子任务
    for subtask in subtasks {
        // 如果没有 owner_id，先设置当前用户为 owner
        if subtask.owner_id.is_none() {
            let conn = state
                .db
                .lock()
                .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
            let _ = db::set_subtask_owner(&conn, &subtask.id, &user_id);
        }

        let supabase_subtask = serde_json::json!({
            "id": subtask.id,
            "parent_id": subtask.parent_id,
            "name": subtask.name,
            "description": subtask.description,
            "status": subtask.status,
            "order_index": subtask.order_index,
            "owner_id": user_id
        });

        match client.create_subtask(&supabase_subtask).await {
            Ok(created) => {
                if !created.is_null() {
                    pushed_subtasks += 1;
                }
            }
            Err(_) => {}
        }
    }

    // 更新最后同步时间（使用同步开始时间，而不是结束时间）
    // 这样可以确保同步过程中发生的变更在下次同步时会被包含
    {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        let _ = db::set_last_sync_time(&conn, &sync_start_time);
    }

    Ok(SyncResult {
        success: true,
        message: "Sync completed".to_string(),
        pushed_projects,
        pushed_tasks,
        pushed_subtasks,
        pulled_projects: 0,
        pulled_tasks: 0,
        pulled_subtasks: 0,
        deleted_tasks,
        deleted_subtasks,
        deleted_projects,
    })
}

#[tauri::command]
pub async fn sync_pull(
    state: State<'_, AppState>,
    supabase_state: State<'_, AppSupabaseState>,
) -> Result<SyncResult, String> {
    supabase_state.init_client();
    let client = supabase_state.get_client().ok_or("Failed to initialize client")?;
    let user = supabase_state.get_user().ok_or("Not authenticated")?;
    let user_id = user.id;

    let mut pulled_projects = 0u32;
    let mut pulled_tasks = 0u32;
    let mut pulled_subtasks = 0u32;
    let mut updated_projects = 0u32;
    let mut updated_tasks = 0u32;
    let mut updated_subtasks = 0u32;

    let supabase_projects = client.get_projects(&user_id).await?;

    {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

        for proj in supabase_projects {
            if let (Some(id), Some(name)) = (proj.get("id").and_then(|v| v.as_str()), proj.get("name").and_then(|v| v.as_str())) {
                let cloud_updated = proj.get("updated_at").and_then(|v| v.as_str()).unwrap_or("");
                
                match db::get_project_by_id(&conn, id).ok().flatten() {
                    None => {
                        let _ = db::create_project_with_id(
                            &conn,
                            id,
                            name,
                            proj.get("description").and_then(|v| v.as_str()).unwrap_or(""),
                            proj.get("start_date").and_then(|v| v.as_str()).unwrap_or(""),
                            proj.get("end_date").and_then(|v| v.as_str()).unwrap_or(""),
                            proj.get("icon").and_then(|v| v.as_str()),
                            Some(&user_id),
                        );
                        pulled_projects += 1;
                    }
                    Some(local) => {
                        if cloud_updated > local.updated_at.as_str() {
                            let _ = db::update_project_from_sync(
                                &conn,
                                id,
                                name,
                                proj.get("description").and_then(|v| v.as_str()).unwrap_or(""),
                                proj.get("start_date").and_then(|v| v.as_str()).unwrap_or(""),
                                proj.get("end_date").and_then(|v| v.as_str()).unwrap_or(""),
                                proj.get("icon").and_then(|v| v.as_str()),
                                &user_id,
                                cloud_updated,
                            );
                            updated_projects += 1;
                        }
                    }
                }
            }
        }
    }

    let supabase_tasks = client.get_tasks_by_owner(&user_id).await?;

    {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

        for task in supabase_tasks {
            if let (Some(id), Some(project_id), Some(name)) = (
                task.get("id").and_then(|v| v.as_str()),
                task.get("project_id").and_then(|v| v.as_str()),
                task.get("name").and_then(|v| v.as_str()),
            ) {
                let cloud_updated = task.get("updated_at").and_then(|v| v.as_str()).unwrap_or("");
                
                match db::get_task_by_id(&conn, id).ok().flatten() {
                    None => {
                        let _ = db::create_task_with_id(
                            &conn,
                            id,
                            project_id,
                            name,
                            task.get("description").and_then(|v| v.as_str()).unwrap_or(""),
                            task.get("start_date").and_then(|v| v.as_str()).unwrap_or(""),
                            task.get("end_date").and_then(|v| v.as_str()).unwrap_or(""),
                            task.get("dependencies").and_then(|v| v.as_str()).unwrap_or(""),
                            task.get("is_milestone").and_then(|v| v.as_bool()).unwrap_or(false),
                            task.get("color").and_then(|v| v.as_str()),
                            Some(&user_id),
                        );
                        pulled_tasks += 1;
                    }
                    Some(local) => {
                        if cloud_updated > local.updated_at.as_str() {
                            let _ = db::update_task_from_sync(
                                &conn,
                                id,
                                project_id,
                                name,
                                task.get("description").and_then(|v| v.as_str()).unwrap_or(""),
                                task.get("start_date").and_then(|v| v.as_str()).unwrap_or(""),
                                task.get("end_date").and_then(|v| v.as_str()).unwrap_or(""),
                                task.get("dependencies").and_then(|v| v.as_str()).unwrap_or(""),
                                task.get("is_milestone").and_then(|v| v.as_bool()).unwrap_or(false),
                                task.get("color").and_then(|v| v.as_str()),
                                &user_id,
                                cloud_updated,
                            );
                            updated_tasks += 1;
                        }
                    }
                }
            }
        }
    }

    let supabase_subtasks = client.get_subtasks_by_owner(&user_id).await?;

    {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

        for subtask in supabase_subtasks {
            if let (Some(id), Some(parent_id), Some(name)) = (
                subtask.get("id").and_then(|v| v.as_str()),
                subtask.get("parent_id").and_then(|v| v.as_str()),
                subtask.get("name").and_then(|v| v.as_str()),
            ) {
                let cloud_updated = subtask.get("updated_at").and_then(|v| v.as_str()).unwrap_or("");
                
                match db::get_subtask_by_id(&conn, id).ok().flatten() {
                    None => {
                        let _ = db::create_subtask_with_id(
                            &conn,
                            id,
                            parent_id,
                            name,
                            subtask.get("description").and_then(|v| v.as_str()).unwrap_or(""),
                            subtask.get("status").and_then(|v| v.as_str()).unwrap_or("todo"),
                            subtask.get("order_index").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                            Some(&user_id),
                        );
                        pulled_subtasks += 1;
                    }
                    Some(local) => {
                        if cloud_updated > local.updated_at.as_str() {
                            let _ = db::update_subtask_from_sync(
                                &conn,
                                id,
                                parent_id,
                                name,
                                subtask.get("description").and_then(|v| v.as_str()).unwrap_or(""),
                                subtask.get("status").and_then(|v| v.as_str()).unwrap_or("todo"),
                                subtask.get("order_index").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                                &user_id,
                                cloud_updated,
                            );
                            updated_subtasks += 1;
                        }
                    }
                }
            }
        }
    }

    Ok(SyncResult {
        success: true,
        message: format!("Pull completed: {} new, {} updated", 
            pulled_projects + pulled_tasks + pulled_subtasks,
            updated_projects + updated_tasks + updated_subtasks),
        pushed_projects: 0,
        pushed_tasks: 0,
        pushed_subtasks: 0,
        pulled_projects,
        pulled_tasks,
        pulled_subtasks,
        deleted_tasks: 0,
        deleted_subtasks: 0,
        deleted_projects: 0,
    })
}

#[tauri::command]
pub async fn sync_all(
    state: State<'_, AppState>,
    supabase_state: State<'_, AppSupabaseState>,
) -> Result<SyncResult, String> {
    // 先 Pull 再 Push：先获取云端最新数据，再推送本地修改
    let pull_result = sync_pull(state.clone(), supabase_state.clone()).await?;
    let push_result = sync_push(state, supabase_state).await?;

    Ok(SyncResult {
        success: true,
        message: "Full sync completed".to_string(),
        pushed_projects: push_result.pushed_projects,
        pushed_tasks: push_result.pushed_tasks,
        pushed_subtasks: push_result.pushed_subtasks,
        pulled_projects: pull_result.pulled_projects,
        pulled_tasks: pull_result.pulled_tasks,
        pulled_subtasks: pull_result.pulled_subtasks,
        deleted_tasks: push_result.deleted_tasks,
        deleted_subtasks: push_result.deleted_subtasks,
        deleted_projects: push_result.deleted_projects,
    })
}
