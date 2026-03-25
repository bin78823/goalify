use crate::db::{self, AppState};
use crate::models::{CreateTaskRequest, Task, UpdateTaskRequest};
use crate::supabase::AppSupabaseState;
use tauri::State;

#[tauri::command]
pub fn create_task(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    request: CreateTaskRequest,
) -> Result<Task, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let owner_id = supabase_state.get_user().map(|u| u.id);

    let task = db::create_task(
        &conn,
        &request.project_id,
        &request.name,
        &request.description,
        &request.start_date,
        &request.end_date,
        &request.dependencies,
        request.is_milestone,
        request.color.as_deref(),
        owner_id.as_deref(),
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    if let Some(user_id) = owner_id {
        let payload = serde_json::json!({
            "id": task.id,
            "project_id": task.project_id,
            "name": task.name,
            "description": task.description,
            "start_date": task.start_date,
            "end_date": task.end_date,
            "dependencies": task.dependencies,
            "is_milestone": task.is_milestone,
            "color": task.color,
            "owner_id": user_id,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        });
        let _ = db::add_to_sync_queue(&conn, "tasks", &task.id, "INSERT", &payload.to_string());
    }

    Ok(task)
}

#[tauri::command]
pub fn get_tasks_by_project(
    state: State<AppState>,
    project_id: String,
) -> Result<Vec<Task>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::get_tasks_by_project(&conn, &project_id).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn get_task(state: State<AppState>, id: String) -> Result<Option<Task>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::get_task_by_id(&conn, &id).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn update_task(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    request: UpdateTaskRequest,
) -> Result<Option<Task>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let task = db::update_task(
        &conn,
        &request.id,
        request.project_id.as_deref(),
        request.name.as_deref(),
        request.description.as_deref(),
        request.start_date.as_deref(),
        request.end_date.as_deref(),
        request.dependencies.as_deref(),
        request.is_milestone,
        request.color.as_deref(),
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    if let Some(ref t) = task {
        if supabase_state.is_authenticated() {
            let mut payload_map = serde_json::Map::new();
            if let Some(ref name) = request.name {
                payload_map.insert("name".to_string(), serde_json::Value::String(name.clone()));
            }
            if let Some(ref description) = request.description {
                payload_map.insert(
                    "description".to_string(),
                    serde_json::Value::String(description.clone()),
                );
            }
            if let Some(ref start_date) = request.start_date {
                payload_map.insert(
                    "start_date".to_string(),
                    serde_json::Value::String(start_date.clone()),
                );
            }
            if let Some(ref end_date) = request.end_date {
                payload_map.insert(
                    "end_date".to_string(),
                    serde_json::Value::String(end_date.clone()),
                );
            }
            if let Some(ref dependencies) = request.dependencies {
                payload_map.insert(
                    "dependencies".to_string(),
                    serde_json::Value::String(dependencies.clone()),
                );
            }
            if let Some(is_milestone) = request.is_milestone {
                payload_map.insert(
                    "is_milestone".to_string(),
                    serde_json::Value::Bool(is_milestone),
                );
            }
            if let Some(ref color) = request.color {
                payload_map.insert(
                    "color".to_string(),
                    serde_json::Value::String(color.clone()),
                );
            }
            payload_map.insert(
                "updated_at".to_string(),
                serde_json::Value::String(t.updated_at.clone()),
            );

            let payload = serde_json::Value::Object(payload_map);
            let _ =
                db::add_to_sync_queue(&conn, "tasks", &request.id, "UPDATE", &payload.to_string());
        }
    }

    Ok(task)
}

#[tauri::command]
pub fn delete_task(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let result = db::delete_task(&conn, &id).map_err(|e: rusqlite::Error| e.to_string())?;

    if result && supabase_state.is_authenticated() {
        let payload = serde_json::json!({ "id": id });
        let _ = db::add_to_sync_queue(&conn, "tasks", &id, "DELETE", &payload.to_string());
    }

    Ok(result)
}
