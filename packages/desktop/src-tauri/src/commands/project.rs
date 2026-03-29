use crate::db::{self, AppState, UserSession};
use crate::models::{CreateProjectRequest, Project, UpdateProjectRequest};
use crate::supabase::AppSupabaseState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectWithSync {
    pub project: Project,
    pub synced: bool,
}

#[tauri::command]
pub fn create_project(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    request: CreateProjectRequest,
) -> Result<Project, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let user = supabase_state.get_user();
    let owner_id = user.as_ref().map(|u| u.id.clone());

    if let Some(ref user_id) = owner_id {
        let is_member = user.as_ref().map(|u| u.is_member).unwrap_or(false);

        if !is_member {
            let project_count = db::count_projects_by_owner(&conn, Some(user_id))
                .map_err(|e| e.to_string())?;

            if project_count >= 1 {
                return Err("FREE_PROJECT_LIMIT_REACHED".to_string());
            }
        }
    } else {
        let local_count = db::count_all_projects(&conn)
            .map_err(|e| e.to_string())?;
        if local_count >= 1 {
            return Err("FREE_PROJECT_LIMIT_REACHED".to_string());
        }
    }

    let project = db::create_project(
        &conn,
        &request.name,
        &request.description,
        &request.start_date,
        &request.end_date,
        request.icon.as_deref(),
        owner_id.as_deref(),
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    if let Some(user_id) = owner_id {
        let payload = serde_json::json!({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "icon": project.icon,
            "owner_id": user_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        });
        let _ = db::add_to_sync_queue(
            &conn,
            "projects",
            &project.id,
            "INSERT",
            &payload.to_string(),
        );
    }

    Ok(project)
}

#[tauri::command]
pub fn get_all_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::get_all_projects(&conn).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn get_project(state: State<AppState>, id: String) -> Result<Option<Project>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::get_project_by_id(&conn, &id).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn update_project(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    request: UpdateProjectRequest,
) -> Result<Option<Project>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let project = db::update_project(
        &conn,
        &request.id,
        request.name.as_deref(),
        request.description.as_deref(),
        request.start_date.as_deref(),
        request.end_date.as_deref(),
        request.icon.as_deref(),
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    if let Some(ref p) = project {
        if supabase_state.is_authenticated() {
            let payload = serde_json::json!({
                "name": p.name,
                "description": p.description,
                "start_date": p.start_date,
                "end_date": p.end_date,
                "icon": p.icon,
                "updated_at": p.updated_at,
            });
            let _ = db::add_to_sync_queue(
                &conn,
                "projects",
                &request.id,
                "UPDATE",
                &payload.to_string(),
            );
        }
    }

    Ok(project)
}

#[tauri::command]
pub fn delete_project(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
    id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let result = db::delete_project(&conn, &id).map_err(|e: rusqlite::Error| e.to_string())?;

    if result && supabase_state.is_authenticated() {
        let payload = serde_json::json!({ "id": id });
        let _ = db::add_to_sync_queue(&conn, "projects", &id, "DELETE", &payload.to_string());
    }

    Ok(result)
}

#[tauri::command]
pub fn claim_local_projects(
    state: State<AppState>,
    supabase_state: State<'_, AppSupabaseState>,
) -> Result<i32, String> {
    let user = supabase_state.get_user().ok_or("Not authenticated")?;

    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;

    let local_projects =
        db::get_projects_without_owner(&conn).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut count = 0;
    for project in local_projects {
        if db::set_project_owner(&conn, &project.id, &user.id).is_ok() {
            let payload = serde_json::json!({
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "start_date": project.start_date,
                "end_date": project.end_date,
                "icon": project.icon,
                "owner_id": user.id,
                "created_at": project.created_at,
                "updated_at": project.updated_at,
            });
            let _ = db::add_to_sync_queue(
                &conn,
                "projects",
                &project.id,
                "INSERT",
                &payload.to_string(),
            );
            count += 1;
        }
    }

    Ok(count)
}

#[tauri::command]
pub fn get_local_user_session(state: State<AppState>) -> Option<UserSession> {
    let conn = match state.db.lock() {
        Ok(c) => c,
        Err(_) => return None,
    };
    db::get_user_session(&conn).ok().flatten()
}

#[tauri::command]
pub fn save_local_user_session(
    state: State<AppState>,
    user_id: String,
    email: String,
    refresh_token: String,
    expires_at: i64,
) -> Result<String, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::save_user_session(&conn, &user_id, &email, &refresh_token, expires_at)
        .map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn clear_local_user_session(state: State<AppState>) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    db::clear_user_session(&conn).map_err(|e: rusqlite::Error| e.to_string())
}
