use crate::db::{self, AppState};
use crate::models::{CreateSubtaskRequest, Subtask, UpdateSubtaskRequest};
use crate::supabase::AppSupabaseState;
use tauri::State;

#[tauri::command]
pub fn create_subtask(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    request: CreateSubtaskRequest,
) -> Result<Subtask, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let owner_id = supabase_state.get_user().map(|u| u.id);

    let subtask =
        db::create_subtask(&conn, &request, owner_id.as_deref()).map_err(|e| e.to_string())?;

    if let Some(user_id) = owner_id {
        let payload = serde_json::json!({
            "id": subtask.id,
            "parent_id": subtask.parent_id,
            "name": subtask.name,
            "description": subtask.description,
            "status": subtask.status,
            "order_index": subtask.order_index,
            "owner_id": user_id,
            "created_at": subtask.created_at,
            "updated_at": subtask.updated_at,
        });
        let _ = db::add_to_sync_queue(
            &conn,
            "subtasks",
            &subtask.id,
            "INSERT",
            &payload.to_string(),
        );
    }

    Ok(subtask)
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
    supabase_state: State<'_, AppSupabaseState>,
    request: UpdateSubtaskRequest,
) -> Result<Option<Subtask>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let subtask = db::update_subtask(&conn, &request).map_err(|e| e.to_string())?;

    if let Some(ref s) = subtask {
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
            if let Some(ref status) = request.status {
                payload_map.insert(
                    "status".to_string(),
                    serde_json::Value::String(status.clone()),
                );
            }
            if let Some(order_index) = request.order_index {
                payload_map.insert(
                    "order_index".to_string(),
                    serde_json::Value::Number(order_index.into()),
                );
            }
            payload_map.insert(
                "updated_at".to_string(),
                serde_json::Value::String(s.updated_at.clone()),
            );

            let payload = serde_json::Value::Object(payload_map);
            let _ = db::add_to_sync_queue(
                &conn,
                "subtasks",
                &request.id,
                "UPDATE",
                &payload.to_string(),
            );
        }
    }

    Ok(subtask)
}

#[tauri::command]
pub fn delete_subtask(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    id: String,
) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let result = db::delete_subtask(&conn, &id).map_err(|e| e.to_string())?;

    if result && supabase_state.is_authenticated() {
        let payload = serde_json::json!({ "id": id });
        let _ = db::add_to_sync_queue(&conn, "subtasks", &id, "DELETE", &payload.to_string());
    }

    Ok(result)
}
