use crate::db::{self, AppState};
use crate::models::{CreateTaskRequest, Task, UpdateTaskRequest};
use tauri::State;

#[tauri::command]
pub fn create_task(state: State<AppState>, request: CreateTaskRequest) -> Result<Task, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::create_task(
        &conn,
        &request.project_id,
        &request.name,
        &request.description,
        &request.start_date,
        &request.end_date,
        &request.dependencies,
        request.is_milestone,
        request.color.as_deref(),
    )
    .map_err(|e: rusqlite::Error| e.to_string())
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
    request: UpdateTaskRequest,
) -> Result<Option<Task>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::update_task(
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
    .map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn delete_task(state: State<AppState>, id: String) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::delete_task(&conn, &id).map_err(|e: rusqlite::Error| e.to_string())
}
