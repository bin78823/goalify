mod commands;
mod db;
mod models;

use db::init_db;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = init_db().expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(db::AppState { db: Mutex::new(db) })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::get_all_projects,
            commands::project::get_project,
            commands::project::update_project,
            commands::project::delete_project,
            commands::task::create_task,
            commands::task::get_tasks_by_project,
            commands::task::get_task,
            commands::task::update_task,
            commands::task::delete_task,
            commands::subtask::create_subtask,
            commands::subtask::get_subtasks_by_parent,
            commands::subtask::update_subtask,
            commands::subtask::delete_subtask,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
