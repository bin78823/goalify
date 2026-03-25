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

    let (projects, tasks, subtasks) = {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        (
            db::get_all_projects(&conn).map_err(|e| e.to_string())?,
            db::get_all_tasks(&conn).map_err(|e| e.to_string())?,
            db::get_all_subtasks(&conn).map_err(|e| e.to_string())?,
        )
    };

    let mut pushed_projects = 0u32;
    let mut pushed_tasks = 0u32;
    let mut pushed_subtasks = 0u32;

    // 同步所有项目（包括已有 owner_id 的，使用 UPSERT 更新）
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

    // 同步所有任务（包括已有 owner_id 的，使用 UPSERT 更新）
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

    // 同步所有子任务（包括已有 owner_id 的，使用 UPSERT 更新）
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

    Ok(SyncResult {
        success: true,
        message: "Sync completed".to_string(),
        pushed_projects,
        pushed_tasks,
        pushed_subtasks,
        pulled_projects: 0,
        pulled_tasks: 0,
        pulled_subtasks: 0,
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

    let supabase_projects = client.get_projects(&user_id).await?;

    {
        let conn = state
            .db
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

        for proj in supabase_projects {
            if let (Some(id), Some(name)) = (proj.get("id").and_then(|v| v.as_str()), proj.get("name").and_then(|v| v.as_str())) {
                let existing = db::get_project_by_id(&conn, id).ok();
                if existing.is_none() {
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
                let existing = db::get_task_by_id(&conn, id).ok();
                if existing.is_none() {
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
                let existing = db::get_subtask_by_id(&conn, id).ok();
                if existing.is_none() {
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
            }
        }
    }

    Ok(SyncResult {
        success: true,
        message: "Sync completed".to_string(),
        pushed_projects: 0,
        pushed_tasks: 0,
        pushed_subtasks: 0,
        pulled_projects,
        pulled_tasks,
        pulled_subtasks,
    })
}

#[tauri::command]
pub async fn sync_all(
    state: State<'_, AppState>,
    supabase_state: State<'_, AppSupabaseState>,
) -> Result<SyncResult, String> {
    let push_result = sync_push(state.clone(), supabase_state.clone()).await?;
    let pull_result = sync_pull(state, supabase_state).await?;

    Ok(SyncResult {
        success: true,
        message: "Full sync completed".to_string(),
        pushed_projects: push_result.pushed_projects,
        pushed_tasks: push_result.pushed_tasks,
        pushed_subtasks: push_result.pushed_subtasks,
        pulled_projects: pull_result.pulled_projects,
        pulled_tasks: pull_result.pulled_tasks,
        pulled_subtasks: pull_result.pulled_subtasks,
    })
}
