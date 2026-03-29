pub mod client;

pub use client::*;

use std::sync::Mutex;

pub struct AppSupabaseState {
    pub client: Mutex<Option<SupabaseClient>>,
}

impl AppSupabaseState {
    pub fn new() -> Self {
        Self {
            client: Mutex::new(None),
        }
    }

    pub fn init_client(&self) {
        let mut client_guard = self.client.lock().unwrap();
        if client_guard.is_none() {
            *client_guard = Some(create_client(
                "https://bvumnoyrcgazjbcznkkt.supabase.co",
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dW1ub3lyY2dhempiY3pua2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjY1MzUsImV4cCI6MjA4OTkwMjUzNX0.SjhK1Vk5qA_0Vmijvj--WOMtd_-JeSyBkttqGcSiP4Y",
            ));
        }
    }

    pub fn get_client(&self) -> Option<SupabaseClient> {
        self.client.lock().unwrap().clone()
    }

    pub fn set_session(&self, session: SupabaseSession) {
        if let Some(ref mut client) = *self.client.lock().unwrap() {
            client.set_session(session);
        }
    }

    pub fn is_authenticated(&self) -> bool {
        self.client
            .lock()
            .unwrap()
            .as_ref()
            .map(|c| c.is_authenticated())
            .unwrap_or(false)
    }

    pub fn get_user(&self) -> Option<SupabaseUser> {
        self.client
            .lock()
            .unwrap()
            .as_ref()
            .and_then(|c| c.get_session().map(|s| s.user))
    }

    pub fn update_user_membership(
        &self,
        is_member: bool,
        membership_started_at: Option<String>,
        membership_expires_at: Option<String>,
    ) {
        if let Some(ref mut client) = *self.client.lock().unwrap() {
            if let Some(mut session) = client.get_session() {
                session.user.is_member = is_member;
                session.user.membership_started_at = membership_started_at;
                session.user.membership_expires_at = membership_expires_at;
                client.set_session(session);
            }
        }
    }
}
