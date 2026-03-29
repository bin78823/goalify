use crate::supabase::{AppSupabaseState, SupabaseSession, SupabaseUser};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SignUpRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignInRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResult {
    pub success: bool,
    pub user: Option<SupabaseUser>,
    pub message: Option<String>,
}

#[tauri::command]
pub async fn sign_up(
    request: SignUpRequest,
    state: State<'_, AppSupabaseState>,
) -> Result<AuthResult, String> {
    state.init_client();

    let client = state.get_client().ok_or("Failed to initialize client")?;

    match client.sign_up(&request.email, &request.password).await {
        Ok(Some(auth_response)) => {
            let session = SupabaseSession {
                access_token: auth_response.access_token.clone(),
                refresh_token: auth_response.refresh_token.clone(),
                expires_at: auth_response.expires_at,
                user: auth_response.user.clone(),
            };
            state.set_session(session);

            Ok(AuthResult {
                success: true,
                user: Some(auth_response.user),
                message: Some("Account created successfully".to_string()),
            })
        }
        Ok(None) => Ok(AuthResult {
            success: true,
            user: None,
            message: Some("Please check your email to confirm your account".to_string()),
        }),
        Err(e) => Ok(AuthResult {
            success: false,
            user: None,
            message: Some(e),
        }),
    }
}

#[tauri::command]
pub async fn sign_in(
    request: SignInRequest,
    state: State<'_, AppSupabaseState>,
) -> Result<AuthResult, String> {
    state.init_client();

    let client = state.get_client().ok_or("Failed to initialize client")?;

    match client.sign_in(&request.email, &request.password).await {
        Ok(auth_response) => {
            let session = SupabaseSession {
                access_token: auth_response.access_token,
                refresh_token: auth_response.refresh_token,
                expires_at: auth_response.expires_at,
                user: auth_response.user.clone(),
            };
            state.set_session(session);

            Ok(AuthResult {
                success: true,
                user: Some(auth_response.user),
                message: Some("Signed in successfully".to_string()),
            })
        }
        Err(e) => Ok(AuthResult {
            success: false,
            user: None,
            message: Some(e),
        }),
    }
}

#[tauri::command]
pub async fn sign_out(state: State<'_, AppSupabaseState>) -> Result<AuthResult, String> {
    let client = state.get_client();

    if let Some(c) = client {
        let _ = c.sign_out().await;
    }

    Ok(AuthResult {
        success: true,
        user: None,
        message: Some("Signed out successfully".to_string()),
    })
}

#[tauri::command]
pub fn get_current_user(state: State<'_, AppSupabaseState>) -> Option<SupabaseUser> {
    state.get_user()
}

#[tauri::command]
pub fn is_authenticated(state: State<'_, AppSupabaseState>) -> bool {
    state.is_authenticated()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshSessionRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerifyEmailRequest {
    pub token_hash: String,
}

#[tauri::command]
pub async fn verify_email(
    request: VerifyEmailRequest,
    state: State<'_, AppSupabaseState>,
) -> Result<AuthResult, String> {
    state.init_client();

    let client = state.get_client().ok_or("Failed to initialize client")?;

    match client.verify_email(&request.token_hash).await {
        Ok(auth_response) => {
            let session = SupabaseSession {
                access_token: auth_response.access_token,
                refresh_token: auth_response.refresh_token,
                expires_at: auth_response.expires_at,
                user: auth_response.user.clone(),
            };
            state.set_session(session);

            Ok(AuthResult {
                success: true,
                user: Some(auth_response.user),
                message: Some("Email verified successfully".to_string()),
            })
        }
        Err(e) => Ok(AuthResult {
            success: false,
            user: None,
            message: Some(e),
        }),
    }
}

#[tauri::command]
pub async fn refresh_session(
    request: RefreshSessionRequest,
    state: State<'_, AppSupabaseState>,
) -> Result<AuthResult, String> {
    state.init_client();

    let client = state.get_client().ok_or("Failed to initialize client")?;

    match client.refresh_token(&request.refresh_token).await {
        Ok(auth_response) => {
            let session = SupabaseSession {
                access_token: auth_response.access_token,
                refresh_token: auth_response.refresh_token,
                expires_at: auth_response.expires_at,
                user: auth_response.user.clone(),
            };
            state.set_session(session);

            Ok(AuthResult {
                success: true,
                user: Some(auth_response.user),
                message: Some("Session refreshed".to_string()),
            })
        }
        Err(e) => Ok(AuthResult {
            success: false,
            user: None,
            message: Some(e),
        }),
    }
}
