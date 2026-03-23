use crate::db::{self, AppState};
use crate::models::{CreateSubtaskRequest, Subtask, UpdateSubtaskRequest};
use tauri::State;

#[tauri::command]
pub fn create_subtask(
    state: State<AppState>,
    request: CreateSubtaskRequest,
) -> Result<Subtask, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::create_subtask(&conn, &request).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_subtasks_by_parent(
    state: State<AppState>,
    parent_id: String,
) -> Result<Vec<Subtask>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::get_subtasks_by_parent(&conn, &parent_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_subtask(
    state: State<AppState>,
    request: UpdateSubtaskRequest,
) -> Result<Option<Subtask>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::update_subtask(&conn, &request).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_subtask(state: State<AppState>, id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    db::delete_subtask(&conn, &id).map_err(|e| e.to_string())
}
