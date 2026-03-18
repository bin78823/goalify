use tauri::State;
use crate::db::{self, AppState};
use crate::models::{Project, CreateProjectRequest, UpdateProjectRequest};

#[tauri::command]
pub fn create_project(state: State<AppState>, request: CreateProjectRequest) -> Result<Project, String> {
    let conn = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::create_project(
        &conn,
        &request.name,
        &request.description,
        &request.start_date,
        &request.end_date,
    ).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn get_all_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::get_all_projects(&conn).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn get_project(state: State<AppState>, id: String) -> Result<Option<Project>, String> {
    let conn = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::get_project_by_id(&conn, &id).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn update_project(state: State<AppState>, request: UpdateProjectRequest) -> Result<Option<Project>, String> {
    let conn = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::update_project(
        &conn,
        &request.id,
        request.name.as_deref(),
        request.description.as_deref(),
        request.start_date.as_deref(),
        request.end_date.as_deref(),
    ).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn delete_project(state: State<AppState>, id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::delete_project(&conn, &id).map_err(|e: rusqlite::Error| e.to_string())
}
