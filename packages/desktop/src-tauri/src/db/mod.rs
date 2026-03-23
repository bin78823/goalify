use crate::models::{CreateSubtaskRequest, Project, Subtask, Task, UpdateSubtaskRequest};
use rusqlite::{params, Connection, Result as SqliteResult};
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Connection>,
}

fn get_db_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let db_dir = std::path::PathBuf::from(&home).join(".goalify");
    std::fs::create_dir_all(&db_dir).ok();
    db_dir.join("goalify.db").to_string_lossy().to_string()
}

pub fn init_db() -> SqliteResult<Connection> {
    let conn = Connection::open(get_db_path())?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            icon TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            progress REAL DEFAULT 0,
            dependencies TEXT DEFAULT '[]',
            is_milestone INTEGER DEFAULT 0,
            color TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS subtasks (
            id TEXT PRIMARY KEY,
            parent_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'todo',
            order_index INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_subtasks_parent_id ON subtasks(parent_id);
        CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);",
    )?;

    Ok(conn)
}

pub fn create_project(
    conn: &Connection,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    icon: Option<&str>,
) -> SqliteResult<Project> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO projects (id, name, description, start_date, end_date, icon, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, name, description, start_date, end_date, icon, now, now],
    )?;

    Ok(Project {
        id,
        name: name.to_string(),
        description: description.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        icon: icon.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_all_projects(conn: &Connection) -> SqliteResult<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, start_date, end_date, icon, created_at, updated_at FROM projects ORDER BY created_at DESC"
    )?;

    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                start_date: row.get(3)?,
                end_date: row.get(4)?,
                icon: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(projects)
}

pub fn get_project_by_id(conn: &Connection, id: &str) -> SqliteResult<Option<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, start_date, end_date, icon, created_at, updated_at FROM projects WHERE id = ?1"
    )?;

    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            start_date: row.get(3)?,
            end_date: row.get(4)?,
            icon: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn update_project(
    conn: &Connection,
    id: &str,
    name: Option<&str>,
    description: Option<&str>,
    start_date: Option<&str>,
    end_date: Option<&str>,
    icon: Option<&str>,
) -> SqliteResult<Option<Project>> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(name) = name {
        conn.execute(
            "UPDATE projects SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, now, id],
        )?;
    }
    if let Some(description) = description {
        conn.execute(
            "UPDATE projects SET description = ?1, updated_at = ?2 WHERE id = ?3",
            params![description, now, id],
        )?;
    }
    if let Some(start_date) = start_date {
        conn.execute(
            "UPDATE projects SET start_date = ?1, updated_at = ?2 WHERE id = ?3",
            params![start_date, now, id],
        )?;
    }
    if let Some(end_date) = end_date {
        conn.execute(
            "UPDATE projects SET end_date = ?1, updated_at = ?2 WHERE id = ?3",
            params![end_date, now, id],
        )?;
    }
    if let Some(icon) = icon {
        conn.execute(
            "UPDATE projects SET icon = ?1, updated_at = ?2 WHERE id = ?3",
            params![icon, now, id],
        )?;
    }

    get_project_by_id(conn, id)
}

pub fn delete_project(conn: &Connection, id: &str) -> SqliteResult<bool> {
    let rows_affected = conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
    Ok(rows_affected > 0)
}

pub fn create_task(
    conn: &Connection,
    project_id: &str,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    progress: f64,
    dependencies: &str,
    is_milestone: bool,
    color: Option<&str>,
) -> SqliteResult<Task> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let is_milestone_int = if is_milestone { 1 } else { 0 };

    conn.execute(
        "INSERT INTO tasks (id, project_id, name, description, start_date, end_date, progress, dependencies, is_milestone, color, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![id, project_id, name, description, start_date, end_date, progress, dependencies, is_milestone_int, color, now, now],
    )?;

    Ok(Task {
        id,
        project_id: project_id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        progress,
        dependencies: dependencies.to_string(),
        is_milestone,
        color: color.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_tasks_by_project(conn: &Connection, project_id: &str) -> SqliteResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, start_date, end_date, progress, dependencies, is_milestone, color, created_at, updated_at FROM tasks WHERE project_id = ?1 ORDER BY created_at ASC"
    )?;

    let tasks = stmt
        .query_map(params![project_id], |row| {
            let is_milestone_int: i32 = row.get(8)?;
            Ok(Task {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                start_date: row.get(4)?,
                end_date: row.get(5)?,
                progress: row.get(6)?,
                dependencies: row.get(7)?,
                is_milestone: is_milestone_int != 0,
                color: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(tasks)
}

pub fn get_task_by_id(conn: &Connection, id: &str) -> SqliteResult<Option<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, start_date, end_date, progress, dependencies, is_milestone, color, created_at, updated_at FROM tasks WHERE id = ?1"
    )?;

    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        let is_milestone_int: i32 = row.get(8)?;
        Ok(Some(Task {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            start_date: row.get(4)?,
            end_date: row.get(5)?,
            progress: row.get(6)?,
            dependencies: row.get(7)?,
            is_milestone: is_milestone_int != 0,
            color: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn update_task(
    conn: &Connection,
    id: &str,
    project_id: Option<&str>,
    name: Option<&str>,
    description: Option<&str>,
    start_date: Option<&str>,
    end_date: Option<&str>,
    progress: Option<f64>,
    dependencies: Option<&str>,
    is_milestone: Option<bool>,
    color: Option<&str>,
) -> SqliteResult<Option<Task>> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(project_id) = project_id {
        conn.execute(
            "UPDATE tasks SET project_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![project_id, now, id],
        )?;
    }
    if let Some(name) = name {
        conn.execute(
            "UPDATE tasks SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, now, id],
        )?;
    }
    if let Some(description) = description {
        conn.execute(
            "UPDATE tasks SET description = ?1, updated_at = ?2 WHERE id = ?3",
            params![description, now, id],
        )?;
    }
    if let Some(start_date) = start_date {
        conn.execute(
            "UPDATE tasks SET start_date = ?1, updated_at = ?2 WHERE id = ?3",
            params![start_date, now, id],
        )?;
    }
    if let Some(end_date) = end_date {
        conn.execute(
            "UPDATE tasks SET end_date = ?1, updated_at = ?2 WHERE id = ?3",
            params![end_date, now, id],
        )?;
    }
    if let Some(progress) = progress {
        conn.execute(
            "UPDATE tasks SET progress = ?1, updated_at = ?2 WHERE id = ?3",
            params![progress, now, id],
        )?;
    }
    if let Some(dependencies) = dependencies {
        conn.execute(
            "UPDATE tasks SET dependencies = ?1, updated_at = ?2 WHERE id = ?3",
            params![dependencies, now, id],
        )?;
    }
    if let Some(is_milestone) = is_milestone {
        let is_milestone_int = if is_milestone { 1 } else { 0 };
        conn.execute(
            "UPDATE tasks SET is_milestone = ?1, updated_at = ?2 WHERE id = ?3",
            params![is_milestone_int, now, id],
        )?;
    }
    if let Some(color) = color {
        conn.execute(
            "UPDATE tasks SET color = ?1, updated_at = ?2 WHERE id = ?3",
            params![color, now, id],
        )?;
    }

    get_task_by_id(conn, id)
}

pub fn delete_task(conn: &Connection, id: &str) -> SqliteResult<bool> {
    let rows_affected = conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
    Ok(rows_affected > 0)
}

// ============ Subtask CRUD ============

pub fn create_subtask(conn: &Connection, request: &CreateSubtaskRequest) -> SqliteResult<Subtask> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let status = request.status.as_deref().unwrap_or("todo");

    let order_index = if let Some(idx) = request.order_index {
        idx
    } else {
        let max_idx: Option<i32> = conn
            .query_row(
                "SELECT MAX(order_index) FROM subtasks WHERE parent_id = ?1 AND status = ?2",
                params![request.parent_id, status],
                |row| row.get(0),
            )
            .ok()
            .flatten();
        max_idx.unwrap_or(-1) + 1
    };

    conn.execute(
        "INSERT INTO subtasks (id, parent_id, name, description, status, order_index, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            id,
            request.parent_id,
            request.name,
            request.description.as_deref().unwrap_or(""),
            status,
            order_index,
            now,
            now
        ],
    )?;

    Ok(Subtask {
        id,
        parent_id: request.parent_id.clone(),
        name: request.name.clone(),
        description: request.description.clone().unwrap_or_default(),
        status: status.to_string(),
        order_index,
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_subtasks_by_parent(conn: &Connection, parent_id: &str) -> SqliteResult<Vec<Subtask>> {
    let mut stmt = conn.prepare(
        "SELECT id, parent_id, name, description, status, order_index, created_at, updated_at 
         FROM subtasks WHERE parent_id = ?1 
         ORDER BY status, order_index",
    )?;

    let subtasks = stmt
        .query_map(params![parent_id], |row| {
            Ok(Subtask {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                order_index: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(subtasks)
}

pub fn update_subtask(
    conn: &Connection,
    request: &UpdateSubtaskRequest,
) -> SqliteResult<Option<Subtask>> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(name) = &request.name {
        conn.execute(
            "UPDATE subtasks SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, now, request.id],
        )?;
    }
    if let Some(description) = &request.description {
        conn.execute(
            "UPDATE subtasks SET description = ?1, updated_at = ?2 WHERE id = ?3",
            params![description, now, request.id],
        )?;
    }
    if let Some(status) = &request.status {
        conn.execute(
            "UPDATE subtasks SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status, now, request.id],
        )?;
    }
    if let Some(order_index) = request.order_index {
        conn.execute(
            "UPDATE subtasks SET order_index = ?1, updated_at = ?2 WHERE id = ?3",
            params![order_index, now, request.id],
        )?;
    }

    get_subtask_by_id(conn, &request.id)
}

pub fn get_subtask_by_id(conn: &Connection, id: &str) -> SqliteResult<Option<Subtask>> {
    let mut stmt = conn.prepare(
        "SELECT id, parent_id, name, description, status, order_index, created_at, updated_at 
         FROM subtasks WHERE id = ?1",
    )?;

    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Subtask {
            id: row.get(0)?,
            parent_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            status: row.get(4)?,
            order_index: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn delete_subtask(conn: &Connection, id: &str) -> SqliteResult<bool> {
    let rows_affected = conn.execute("DELETE FROM subtasks WHERE id = ?1", params![id])?;
    Ok(rows_affected > 0)
}
