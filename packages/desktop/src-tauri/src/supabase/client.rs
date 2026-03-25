use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub struct SupabaseClient {
    pub url: String,
    pub anon_key: String,
    pub client: Client,
    pub session: Mutex<Option<SupabaseSession>>,
}

impl Clone for SupabaseClient {
    fn clone(&self) -> Self {
        let session = self.session.lock().unwrap().clone();
        Self {
            url: self.url.clone(),
            anon_key: self.anon_key.clone(),
            client: Client::new(),
            session: Mutex::new(session),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupabaseSession {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
    pub user: SupabaseUser,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupabaseUser {
    pub id: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub expires_at: i64,
    pub user: SupabaseUser,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthError {
    pub message: String,
}

impl SupabaseClient {
    pub fn new(url: &str, anon_key: &str) -> Self {
        Self {
            url: url.to_string(),
            anon_key: anon_key.to_string(),
            client: Client::new(),
            session: Mutex::new(None),
        }
    }

    pub fn set_session(&self, session: SupabaseSession) {
        let mut s = self.session.lock().unwrap();
        *s = Some(session);
    }

    pub fn get_session(&self) -> Option<SupabaseSession> {
        self.session.lock().unwrap().clone()
    }

    pub fn clear_session(&self) {
        let mut s = self.session.lock().unwrap();
        *s = None;
    }

    pub fn is_authenticated(&self) -> bool {
        self.session.lock().unwrap().is_some()
    }

    pub fn auth_headers(&self) -> Option<Vec<(String, String)>> {
        self.get_session().map(|s| {
            vec![
                ("apikey".to_string(), self.anon_key.clone()),
                ("Authorization".to_string(), format!("Bearer {}", s.access_token)),
            ]
        })
    }

    pub async fn sign_up(&self, email: &str, password: &str) -> Result<Option<AuthResponse>, String> {
        let url = format!("{}/auth/v1/signup", self.url);
        
        let body = serde_json::json!({
            "email": email,
            "password": password,
            "email_confirm": true
        });

        let response = self.client
            .post(&url)
            .header("apikey", &self.anon_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let data: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
            if data.get("access_token").is_some() {
                let auth_resp: AuthResponse = serde_json::from_value(data).map_err(|e| e.to_string())?;
                Ok(Some(auth_resp))
            } else {
                Ok(None)
            }
        } else {
            let error: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
            Err(error.get("msg").or(error.get("error_description")).unwrap_or(&serde_json::Value::String("Unknown error".to_string())).to_string())
        }
    }

    pub async fn sign_in(&self, email: &str, password: &str) -> Result<AuthResponse, String> {
        let url = format!("{}/auth/v1/token?grant_type=password", self.url);
        
        let body = serde_json::json!({
            "email": email,
            "password": password
        });

        let response = self.client
            .post(&url)
            .header("apikey", &self.anon_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let auth_resp: AuthResponse = response.json().await.map_err(|e| e.to_string())?;
            Ok(auth_resp)
        } else {
            let error: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
            Err(error.get("msg").or(error.get("error_description")).unwrap_or(&serde_json::Value::String("Invalid credentials".to_string())).to_string())
        }
    }

    pub async fn sign_out(&self) -> Result<(), String> {
        let session = self.get_session().ok_or("Not authenticated")?;
        
        let url = format!("{}/auth/v1/logout", self.url);
        
        let response = self.client
            .post(&url)
            .header("apikey", &self.anon_key)
            .header("Authorization", format!("Bearer {}", session.access_token))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        self.clear_session();
        
        if response.status().is_success() {
            Ok(())
        } else {
            Ok(())
        }
    }

    pub async fn refresh_token(&self, refresh_token: &str) -> Result<AuthResponse, String> {
        let url = format!("{}/auth/v1/token?grant_type=refresh_token", self.url);
        
        let body = serde_json::json!({
            "refresh_token": refresh_token
        });

        let response = self.client
            .post(&url)
            .header("apikey", &self.anon_key)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let auth_resp: AuthResponse = response.json().await.map_err(|e| e.to_string())?;
            Ok(auth_resp)
        } else {
            self.clear_session();
            Err("Session expired".to_string())
        }
    }

    pub async fn get_projects(&self, owner_id: &str) -> Result<Vec<serde_json::Value>, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/projects?owner_id=eq.{}&select=*&order=created_at.desc", self.url, owner_id);
        
        let mut request = self.client.get(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;
        
        if response.status().is_success() {
            let projects: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(projects)
        } else {
            Err("Failed to fetch projects".to_string())
        }
    }

    pub async fn create_project(&self, project: &serde_json::Value) -> Result<serde_json::Value, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        // 使用 UPSERT - 如果存在则更新，不存在则插入
        let url = format!("{}/rest/v1/projects?on_conflict=id", self.url);
        
        let mut request = self.client.post(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request
            .header("Content-Type", "application/json")
            .header("Prefer", "resolution=merge-duplicates")
            .json(project)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() || response.status().as_u16() == 201 {
            let text = response.text().await.map_err(|e| e.to_string())?;
            if text.is_empty() || text == "null" {
                Ok(serde_json::Value::Null)
            } else {
                let created: serde_json::Value = serde_json::from_str(&text).unwrap_or(serde_json::Value::Null);
                Ok(created)
            }
        } else {
            let error: String = response.text().await.unwrap_or_default();
            Err(format!("Failed to create project: {}", error))
        }
    }

    pub async fn update_project(&self, id: &str, project: &serde_json::Value) -> Result<serde_json::Value, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/projects?id=eq.{}", self.url, id);
        
        let mut request = self.client.patch(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request
            .header("Content-Type", "application/json")
            .json(project)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let updated: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(updated.into_iter().next().unwrap_or(serde_json::Value::Null))
        } else {
            Err("Failed to update project".to_string())
        }
    }

    pub async fn delete_project(&self, id: &str) -> Result<(), String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/projects?id=eq.{}", self.url, id);
        
        let mut request = self.client.delete(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err("Failed to delete project".to_string())
        }
    }

    pub async fn get_tasks(&self, project_id: &str) -> Result<Vec<serde_json::Value>, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/tasks?project_id=eq.{}&select=*&order=created_at.asc", self.url, project_id);
        
        let mut request = self.client.get(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;
        
        if response.status().is_success() {
            let tasks: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(tasks)
        } else {
            Err("Failed to fetch tasks".to_string())
        }
    }

    pub async fn create_task(&self, task: &serde_json::Value) -> Result<serde_json::Value, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;

        // 使用 UPSERT - 如果存在则更新，不存在则插入
        let url = format!("{}/rest/v1/tasks?on_conflict=id", self.url);

        let mut request = self.client.post(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }

        let response = request
            .header("Content-Type", "application/json")
            .header("Prefer", "resolution=merge-duplicates")
            .json(task)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() || response.status().as_u16() == 201 {
            let text = response.text().await.map_err(|e| e.to_string())?;
            if text.is_empty() || text == "null" {
                Ok(serde_json::Value::Null)
            } else {
                let created: serde_json::Value = serde_json::from_str(&text).unwrap_or(serde_json::Value::Null);
                Ok(created)
            }
        } else {
            let error: String = response.text().await.unwrap_or_default();
            Err(format!("Failed to create task: {}", error))
        }
    }

    pub async fn update_task(&self, id: &str, task: &serde_json::Value) -> Result<serde_json::Value, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/tasks?id=eq.{}", self.url, id);
        
        let mut request = self.client.patch(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request
            .header("Content-Type", "application/json")
            .json(task)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let updated: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(updated.into_iter().next().unwrap_or(serde_json::Value::Null))
        } else {
            Err("Failed to update task".to_string())
        }
    }

    pub async fn delete_task(&self, id: &str) -> Result<(), String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/tasks?id=eq.{}", self.url, id);
        
        let mut request = self.client.delete(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err("Failed to delete task".to_string())
        }
    }

    pub async fn get_subtasks(&self, parent_id: &str) -> Result<Vec<serde_json::Value>, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/subtasks?parent_id=eq.{}&select=*&order=order_index.asc", self.url, parent_id);
        
        let mut request = self.client.get(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;
        
        if response.status().is_success() {
            let subtasks: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(subtasks)
        } else {
            Err("Failed to fetch subtasks".to_string())
        }
    }

    pub async fn create_subtask(&self, subtask: &serde_json::Value) -> Result<serde_json::Value, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;

        // 使用 UPSERT - 如果存在则更新，不存在则插入
        let url = format!("{}/rest/v1/subtasks?on_conflict=id", self.url);

        let mut request = self.client.post(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }

        let response = request
            .header("Content-Type", "application/json")
            .header("Prefer", "resolution=merge-duplicates")
            .json(subtask)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() || response.status().as_u16() == 201 {
            let text = response.text().await.map_err(|e| e.to_string())?;
            if text.is_empty() || text == "null" {
                Ok(serde_json::Value::Null)
            } else {
                let created: serde_json::Value = serde_json::from_str(&text).unwrap_or(serde_json::Value::Null);
                Ok(created)
            }
        } else {
            let error: String = response.text().await.unwrap_or_default();
            Err(format!("Failed to create subtask: {}", error))
        }
    }

    pub async fn update_subtask(&self, id: &str, subtask: &serde_json::Value) -> Result<serde_json::Value, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/subtasks?id=eq.{}", self.url, id);
        
        let mut request = self.client.patch(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request
            .header("Content-Type", "application/json")
            .json(subtask)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            let updated: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(updated.into_iter().next().unwrap_or(serde_json::Value::Null))
        } else {
            Err("Failed to update subtask".to_string())
        }
    }

    pub async fn delete_subtask(&self, id: &str) -> Result<(), String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/subtasks?id=eq.{}", self.url, id);
        
        let mut request = self.client.delete(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;

        if response.status().is_success() {
            Ok(())
        } else {
            Err("Failed to delete subtask".to_string())
        }
    }

    pub async fn get_tasks_by_owner(&self, owner_id: &str) -> Result<Vec<serde_json::Value>, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/tasks?owner_id=eq.{}&select=*&order=created_at.asc", self.url, owner_id);
        
        let mut request = self.client.get(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;
        
        if response.status().is_success() {
            let tasks: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(tasks)
        } else {
            Err("Failed to fetch tasks".to_string())
        }
    }

    pub async fn get_subtasks_by_owner(&self, owner_id: &str) -> Result<Vec<serde_json::Value>, String> {
        let headers = self.auth_headers().ok_or("Not authenticated")?;
        
        let url = format!("{}/rest/v1/subtasks?owner_id=eq.{}&select=*&order=created_at.asc", self.url, owner_id);
        
        let mut request = self.client.get(&url);
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
        
        let response = request.send().await.map_err(|e| e.to_string())?;
        
        if response.status().is_success() {
            let subtasks: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
            Ok(subtasks)
        } else {
            Err("Failed to fetch subtasks".to_string())
        }
    }
}

pub fn create_client(url: &str, anon_key: &str) -> SupabaseClient {
    SupabaseClient::new(url, anon_key)
}