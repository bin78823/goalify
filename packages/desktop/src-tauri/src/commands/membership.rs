use crate::creem::get_creem_client;
use crate::supabase::AppSupabaseState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct MembershipStatus {
    pub is_member: bool,
    pub membership_started_at: Option<String>,
    pub membership_expires_at: Option<String>,
}

#[tauri::command]
pub async fn create_membership_checkout(
    supabase_state: State<'_, AppSupabaseState>,
    success_url: String,
) -> Result<String, String> {
    supabase_state.get_user().ok_or("Not authenticated")?;
    let creem = get_creem_client()?;

    let product_id = "prod_3WIyoiPwSOmRQAQyG8zy3C";

    let checkout_url = creem.create_checkout(product_id, &success_url).await?;

    Ok(checkout_url)
}

#[tauri::command]
pub fn get_membership_status(
    supabase_state: State<'_, AppSupabaseState>,
) -> Result<MembershipStatus, String> {
    let user = supabase_state.get_user().ok_or("Not authenticated")?;

    Ok(MembershipStatus {
        is_member: user.is_member,
        membership_started_at: user.membership_started_at,
        membership_expires_at: user.membership_expires_at,
    })
}

#[tauri::command]
pub async fn refresh_membership_status(
    supabase_state: State<'_, AppSupabaseState>,
) -> Result<MembershipStatus, String> {
    let user = supabase_state.get_user().ok_or("Not authenticated")?;
    let client = supabase_state
        .get_client()
        .ok_or("Supabase client not initialized")?;

    let updated_user = client.refresh_membership(&user.id).await?;

    supabase_state.update_user_membership(
        updated_user.is_member,
        updated_user.membership_started_at.clone(),
        updated_user.membership_expires_at.clone(),
    );

    Ok(MembershipStatus {
        is_member: updated_user.is_member,
        membership_started_at: updated_user.membership_started_at,
        membership_expires_at: updated_user.membership_expires_at,
    })
}
