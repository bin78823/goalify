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
            owner_id TEXT,
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
            dependencies TEXT DEFAULT '[]',
            is_milestone INTEGER DEFAULT 0,
            color TEXT,
            owner_id TEXT,
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
            owner_id TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            synced_at TEXT,
            retry_count INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            email TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS app_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_subtasks_parent_id ON subtasks(parent_id);
        CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_synced_at ON sync_queue(synced_at);
        CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
        CREATE INDEX IF NOT EXISTS idx_subtasks_updated_at ON subtasks(updated_at);",
    )?;

    conn.execute("ALTER TABLE projects ADD COLUMN owner_id TEXT", [])
        .ok();

    conn.execute("ALTER TABLE tasks ADD COLUMN owner_id TEXT", [])
        .ok();

    conn.execute("ALTER TABLE subtasks ADD COLUMN owner_id TEXT", [])
        .ok();

    Ok(conn)
}

pub fn create_project(
    conn: &Connection,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    icon: Option<&str>,
    owner_id: Option<&str>,
) -> SqliteResult<Project> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO projects (id, name, description, start_date, end_date, icon, owner_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, name, description, start_date, end_date, icon, owner_id, now, now],
    )?;

    Ok(Project {
        id,
        name: name.to_string(),
        description: description.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        icon: icon.map(|s| s.to_string()),
        owner_id: owner_id.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn create_project_with_id(
    conn: &Connection,
    id: &str,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    icon: Option<&str>,
    owner_id: Option<&str>,
) -> SqliteResult<Project> {
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO projects (id, name, description, start_date, end_date, icon, owner_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, name, description, start_date, end_date, icon, owner_id, now, now],
    )?;

    Ok(Project {
        id: id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        icon: icon.map(|s| s.to_string()),
        owner_id: owner_id.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_all_projects(conn: &Connection) -> SqliteResult<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, start_date, end_date, icon, owner_id, created_at, updated_at FROM projects ORDER BY created_at DESC"
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
                owner_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(projects)
}

pub fn get_project_by_id(conn: &Connection, id: &str) -> SqliteResult<Option<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, start_date, end_date, icon, owner_id, created_at, updated_at FROM projects WHERE id = ?1"
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
            owner_id: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
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

pub fn update_project_from_sync(
    conn: &Connection,
    id: &str,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    icon: Option<&str>,
    owner_id: &str,
    updated_at: &str,
) -> SqliteResult<bool> {
    let rows_affected = conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, start_date = ?3, end_date = ?4, icon = ?5, owner_id = ?6, updated_at = ?7 WHERE id = ?8",
        params![name, description, start_date, end_date, icon, owner_id, updated_at, id],
    )?;
    Ok(rows_affected > 0)
}

pub fn set_project_owner(
    conn: &Connection,
    project_id: &str,
    owner_id: &str,
) -> SqliteResult<bool> {
    let rows_affected = conn.execute(
        "UPDATE projects SET owner_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![owner_id, chrono::Utc::now().to_rfc3339(), project_id],
    )?;
    Ok(rows_affected > 0)
}

pub fn get_projects_without_owner(conn: &Connection) -> SqliteResult<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, start_date, end_date, icon, owner_id, created_at, updated_at FROM projects WHERE owner_id IS NULL"
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
                owner_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(projects)
}

pub fn create_task(
    conn: &Connection,
    project_id: &str,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    dependencies: &str,
    is_milestone: bool,
    color: Option<&str>,
    owner_id: Option<&str>,
) -> SqliteResult<Task> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let is_milestone_int = if is_milestone { 1 } else { 0 };

    conn.execute(
        "INSERT INTO tasks (id, project_id, name, description, start_date, end_date, dependencies, is_milestone, color, owner_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![id, project_id, name, description, start_date, end_date, dependencies, is_milestone_int, color, owner_id, now, now],
    )?;

    Ok(Task {
        id,
        project_id: project_id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        dependencies: dependencies.to_string(),
        is_milestone,
        color: color.map(|s| s.to_string()),
        owner_id: owner_id.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn create_task_with_id(
    conn: &Connection,
    id: &str,
    project_id: &str,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    dependencies: &str,
    is_milestone: bool,
    color: Option<&str>,
    owner_id: Option<&str>,
) -> SqliteResult<Task> {
    let now = chrono::Utc::now().to_rfc3339();
    let is_milestone_int = if is_milestone { 1 } else { 0 };

    conn.execute(
        "INSERT INTO tasks (id, project_id, name, description, start_date, end_date, dependencies, is_milestone, color, owner_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![id, project_id, name, description, start_date, end_date, dependencies, is_milestone_int, color, owner_id, now, now],
    )?;

    Ok(Task {
        id: id.to_string(),
        project_id: project_id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        dependencies: dependencies.to_string(),
        is_milestone,
        color: color.map(|s| s.to_string()),
        owner_id: owner_id.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_tasks_by_project(conn: &Connection, project_id: &str) -> SqliteResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, start_date, end_date, dependencies, is_milestone, color, owner_id, created_at, updated_at FROM tasks WHERE project_id = ?1 ORDER BY created_at ASC"
    )?;

    let tasks = stmt
        .query_map(params![project_id], |row| {
            let is_milestone_int: i32 = row.get(7)?;
            Ok(Task {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                start_date: row.get(4)?,
                end_date: row.get(5)?,
                dependencies: row.get(6)?,
                is_milestone: is_milestone_int != 0,
                color: row.get(8)?,
                owner_id: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(tasks)
}

pub fn get_task_by_id(conn: &Connection, id: &str) -> SqliteResult<Option<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, start_date, end_date, dependencies, is_milestone, color, owner_id, created_at, updated_at FROM tasks WHERE id = ?1"
    )?;

    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        let is_milestone_int: i32 = row.get(7)?;
        Ok(Some(Task {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            start_date: row.get(4)?,
            end_date: row.get(5)?,
            dependencies: row.get(6)?,
            is_milestone: is_milestone_int != 0,
            color: row.get(8)?,
            owner_id: row.get(9)?,
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

pub fn update_task_from_sync(
    conn: &Connection,
    id: &str,
    project_id: &str,
    name: &str,
    description: &str,
    start_date: &str,
    end_date: &str,
    dependencies: &str,
    is_milestone: bool,
    color: Option<&str>,
    owner_id: &str,
    updated_at: &str,
) -> SqliteResult<bool> {
    let is_milestone_int = if is_milestone { 1 } else { 0 };
    let rows_affected = conn.execute(
        "UPDATE tasks SET project_id = ?1, name = ?2, description = ?3, start_date = ?4, end_date = ?5, dependencies = ?6, is_milestone = ?7, color = ?8, owner_id = ?9, updated_at = ?10 WHERE id = ?11",
        params![project_id, name, description, start_date, end_date, dependencies, is_milestone_int, color, owner_id, updated_at, id],
    )?;
    Ok(rows_affected > 0)
}

// ============ Subtask CRUD ============

pub fn create_subtask(
    conn: &Connection,
    request: &CreateSubtaskRequest,
    owner_id: Option<&str>,
) -> SqliteResult<Subtask> {
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
        "INSERT INTO subtasks (id, parent_id, name, description, status, order_index, owner_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            id,
            request.parent_id,
            request.name,
            request.description.as_deref().unwrap_or(""),
            status,
            order_index,
            owner_id,
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
        owner_id: owner_id.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn create_subtask_with_id(
    conn: &Connection,
    id: &str,
    parent_id: &str,
    name: &str,
    description: &str,
    status: &str,
    order_index: i32,
    owner_id: Option<&str>,
) -> SqliteResult<Subtask> {
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO subtasks (id, parent_id, name, description, status, order_index, owner_id, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            id,
            parent_id,
            name,
            description,
            status,
            order_index,
            owner_id,
            now,
            now
        ],
    )?;

    Ok(Subtask {
        id: id.to_string(),
        parent_id: parent_id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        status: status.to_string(),
        order_index,
        owner_id: owner_id.map(|s| s.to_string()),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub fn get_subtasks_by_parent(conn: &Connection, parent_id: &str) -> SqliteResult<Vec<Subtask>> {
    let mut stmt = conn.prepare(
        "SELECT id, parent_id, name, description, status, order_index, owner_id, created_at, updated_at 
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
                owner_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(subtasks)
}

// ============ Project Count for Membership Limit ============

pub fn count_projects_by_owner(
    conn: &Connection,
    owner_id: Option<&str>,
) -> SqliteResult<i32> {
    let count: i32 = match owner_id {
        Some(id) => conn.query_row(
            "SELECT COUNT(*) FROM projects WHERE owner_id = ?1",
            params![id],
            |row| row.get(0),
        )?,
        None => conn.query_row(
            "SELECT COUNT(*) FROM projects WHERE owner_id IS NULL",
            [],
            |row| row.get(0),
        )?,
    };
    Ok(count)
}

pub fn count_all_projects(conn: &Connection) -> SqliteResult<i32> {
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM projects",
        [],
        |row| row.get(0),
    )?;
    Ok(count)
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
        "SELECT id, parent_id, name, description, status, order_index, owner_id, created_at, updated_at 
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
            owner_id: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn delete_subtask(conn: &Connection, id: &str) -> SqliteResult<bool> {
    let rows_affected = conn.execute("DELETE FROM subtasks WHERE id = ?1", params![id])?;
    Ok(rows_affected > 0)
}

pub fn update_subtask_from_sync(
    conn: &Connection,
    id: &str,
    parent_id: &str,
    name: &str,
    description: &str,
    status: &str,
    order_index: i32,
    owner_id: &str,
    updated_at: &str,
) -> SqliteResult<bool> {
    let rows_affected = conn.execute(
        "UPDATE subtasks SET parent_id = ?1, name = ?2, description = ?3, status = ?4, order_index = ?5, owner_id = ?6, updated_at = ?7 WHERE id = ?8",
        params![parent_id, name, description, status, order_index, owner_id, updated_at, id],
    )?;
    Ok(rows_affected > 0)
}

#[derive(Debug, Clone)]
pub struct SyncQueueItem {
    pub id: String,
    pub table_name: String,
    pub record_id: String,
    pub operation: String,
    pub payload: String,
    pub created_at: String,
    pub synced_at: Option<String>,
    pub retry_count: i32,
}

pub fn add_to_sync_queue(
    conn: &Connection,
    table_name: &str,
    record_id: &str,
    operation: &str,
    payload: &str,
) -> SqliteResult<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO sync_queue (id, table_name, record_id, operation, payload, created_at, retry_count) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, table_name, record_id, operation, payload, now, 0],
    )?;

    Ok(id)
}

pub fn get_pending_sync_items(conn: &Connection) -> SqliteResult<Vec<SyncQueueItem>> {
    let mut stmt = conn.prepare(
        "SELECT id, table_name, record_id, operation, payload, created_at, synced_at, retry_count 
         FROM sync_queue WHERE synced_at IS NULL ORDER BY created_at ASC",
    )?;

    let items = stmt
        .query_map([], |row| {
            Ok(SyncQueueItem {
                id: row.get(0)?,
                table_name: row.get(1)?,
                record_id: row.get(2)?,
                operation: row.get(3)?,
                payload: row.get(4)?,
                created_at: row.get(5)?,
                synced_at: row.get(6)?,
                retry_count: row.get(7)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(items)
}

pub fn mark_synced(conn: &Connection, id: &str) -> SqliteResult<bool> {
    let now = chrono::Utc::now().to_rfc3339();
    let rows_affected = conn.execute(
        "UPDATE sync_queue SET synced_at = ?1 WHERE id = ?2",
        params![now, id],
    )?;
    Ok(rows_affected > 0)
}

pub fn increment_retry_count(conn: &Connection, id: &str) -> SqliteResult<bool> {
    let rows_affected = conn.execute(
        "UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?1",
        params![id],
    )?;
    Ok(rows_affected > 0)
}

pub fn clear_synced_items(conn: &Connection) -> SqliteResult<u64> {
    let rows = conn.execute("DELETE FROM sync_queue WHERE synced_at IS NOT NULL", [])?;
    Ok(rows as u64)
}

#[derive(Debug, Clone)]
pub struct UserSession {
    pub id: String,
    pub user_id: String,
    pub email: String,
    pub refresh_token: String,
    pub expires_at: i64,
    pub created_at: String,
}

pub fn save_user_session(
    conn: &Connection,
    user_id: &str,
    email: &str,
    refresh_token: &str,
    expires_at: i64,
) -> SqliteResult<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute("DELETE FROM user_sessions", [])?;

    conn.execute(
        "INSERT INTO user_sessions (id, user_id, email, refresh_token, expires_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, user_id, email, refresh_token, expires_at, now],
    )?;

    Ok(id)
}

pub fn get_user_session(conn: &Connection) -> SqliteResult<Option<UserSession>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, email, refresh_token, expires_at, created_at FROM user_sessions LIMIT 1"
    )?;

    let mut rows = stmt.query([])?;

    if let Some(row) = rows.next()? {
        Ok(Some(UserSession {
            id: row.get(0)?,
            user_id: row.get(1)?,
            email: row.get(2)?,
            refresh_token: row.get(3)?,
            expires_at: row.get(4)?,
            created_at: row.get(5)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn clear_user_session(conn: &Connection) -> SqliteResult<bool> {
    let rows = conn.execute("DELETE FROM user_sessions", [])?;
    Ok(rows > 0)
}

pub fn set_task_owner(conn: &Connection, task_id: &str, owner_id: &str) -> SqliteResult<bool> {
    let rows_affected = conn.execute(
        "UPDATE tasks SET owner_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![owner_id, chrono::Utc::now().to_rfc3339(), task_id],
    )?;
    Ok(rows_affected > 0)
}

pub fn set_subtask_owner(
    conn: &Connection,
    subtask_id: &str,
    owner_id: &str,
) -> SqliteResult<bool> {
    let rows_affected = conn.execute(
        "UPDATE subtasks SET owner_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![owner_id, chrono::Utc::now().to_rfc3339(), subtask_id],
    )?;
    Ok(rows_affected > 0)
}

pub fn update_project_owner(
    conn: &Connection,
    project_id: &str,
    owner_id: &str,
) -> SqliteResult<bool> {
    let rows_affected = conn.execute(
        "UPDATE projects SET owner_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![owner_id, chrono::Utc::now().to_rfc3339(), project_id],
    )?;
    Ok(rows_affected > 0)
}

pub fn get_all_tasks(conn: &Connection) -> SqliteResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, start_date, end_date, dependencies, is_milestone, color, owner_id, created_at, updated_at FROM tasks ORDER BY created_at ASC"
    )?;

    let tasks = stmt
        .query_map([], |row| {
            let is_milestone_int: i32 = row.get(7)?;
            Ok(Task {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                start_date: row.get(4)?,
                end_date: row.get(5)?,
                dependencies: row.get(6)?,
                is_milestone: is_milestone_int != 0,
                color: row.get(8)?,
                owner_id: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(tasks)
}

pub fn get_all_subtasks(conn: &Connection) -> SqliteResult<Vec<Subtask>> {
    let mut stmt = conn.prepare(
        "SELECT id, parent_id, name, description, status, order_index, owner_id, created_at, updated_at FROM subtasks ORDER BY created_at ASC"
    )?;

    let subtasks = stmt
        .query_map([], |row| {
            Ok(Subtask {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                order_index: row.get(5)?,
                owner_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(subtasks)
}

// ============ Sync State Management ============

pub fn get_last_sync_time(conn: &Connection) -> SqliteResult<Option<String>> {
    let mut stmt = conn.prepare(
        "SELECT value FROM app_config WHERE key = 'last_sync_at' LIMIT 1"
    )?;

    let mut rows = stmt.query([])?;
    if let Some(row) = rows.next()? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}

pub fn set_last_sync_time(conn: &Connection, timestamp: &str) -> SqliteResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('last_sync_at', ?1, ?2)",
        params![timestamp, chrono::Utc::now().to_rfc3339()],
    )?;
    Ok(())
}

// ============ Incremental Sync Queries ============

pub fn get_projects_updated_since(conn: &Connection, since: &str) -> SqliteResult<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, start_date, end_date, icon, owner_id, created_at, updated_at 
         FROM projects 
         WHERE updated_at > ?1
         ORDER BY updated_at ASC"
    )?;

    let projects = stmt
        .query_map(params![since], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                start_date: row.get(3)?,
                end_date: row.get(4)?,
                icon: row.get(5)?,
                owner_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(projects)
}

pub fn get_tasks_updated_since(conn: &Connection, since: &str) -> SqliteResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, start_date, end_date, dependencies, is_milestone, color, owner_id, created_at, updated_at 
         FROM tasks 
         WHERE updated_at > ?1
         ORDER BY updated_at ASC"
    )?;

    let tasks = stmt
        .query_map(params![since], |row| {
            let is_milestone_int: i32 = row.get(7)?;
            Ok(Task {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                start_date: row.get(4)?,
                end_date: row.get(5)?,
                dependencies: row.get(6)?,
                is_milestone: is_milestone_int != 0,
                color: row.get(8)?,
                owner_id: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(tasks)
}

pub fn get_subtasks_updated_since(conn: &Connection, since: &str) -> SqliteResult<Vec<Subtask>> {
    let mut stmt = conn.prepare(
        "SELECT id, parent_id, name, description, status, order_index, owner_id, created_at, updated_at 
         FROM subtasks 
         WHERE updated_at > ?1
         ORDER BY updated_at ASC"
    )?;

    let subtasks = stmt
        .query_map(params![since], |row| {
            Ok(Subtask {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                order_index: row.get(5)?,
                owner_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(subtasks)
}
