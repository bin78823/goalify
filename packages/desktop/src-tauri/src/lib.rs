mod commands;
mod creem;
mod db;
mod models;
mod supabase;

use supabase::AppSupabaseState;
use db::init_db;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = init_db().expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(db::AppState { db: Mutex::new(db) })
        .manage(AppSupabaseState::new())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::auth::sign_up,
            commands::auth::sign_in,
            commands::auth::sign_out,
            commands::auth::get_current_user,
            commands::auth::is_authenticated,
            commands::auth::refresh_session,
            commands::auth::verify_email,
            commands::project::create_project,
            commands::project::get_all_projects,
            commands::project::get_project,
            commands::project::update_project,
            commands::project::delete_project,
            commands::project::claim_local_projects,
            commands::project::save_local_user_session,
            commands::project::clear_local_user_session,
            commands::task::create_task,
            commands::task::get_tasks_by_project,
            commands::task::get_task,
            commands::task::update_task,
            commands::task::delete_task,
            commands::subtask::create_subtask,
            commands::subtask::get_subtasks_by_parent,
            commands::subtask::update_subtask,
            commands::subtask::delete_subtask,
            commands::sync::sync_push,
            commands::sync::sync_pull,
            commands::sync::sync_all,
            commands::membership::create_membership_checkout,
            commands::membership::get_membership_status,
            commands::membership::refresh_membership_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
