import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CREEM_WEBHOOK_SECRET = Deno.env.get("CREEM_WEBHOOK_SECRET")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

async function verifySignature(payload: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(CREEM_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  const signatureArray = new Uint8Array(signatureBuffer)
  const signatureHex = Array.from(signatureArray)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
  return signature === signatureHex
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, creem-signature",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const signature = req.headers.get("creem-signature")
  const payload = await req.text()

  if (signature) {
    const isValid = await verifySignature(payload, signature)
    if (!isValid) {
      console.error("Invalid webhook signature")
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  } else if (CREEM_WEBHOOK_SECRET) {
    console.error("Missing webhook signature")
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  let event
  try {
    event = JSON.parse(payload)
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  // Creem 使用 eventType（驼峰命名）
  const eventType = event.eventType || event.event_type

  console.log("Event type:", eventType)

  // Creem 使用 subscription.paid 或 checkout.completed
  if (eventType !== "subscription.paid" && eventType !== "checkout.completed") {
    console.log("Skipping event type:", eventType)
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  }

  // 从 object 中获取客户信息
  const customerEmail = event.object?.customer?.email || event.object?.customer_email

  console.log("Customer email:", customerEmail)

  if (!customerEmail) {
    console.error("Missing customer email in payload:", JSON.stringify(event, null, 2))
    return new Response("Missing customer email", { status: 400 })
  }

  // 尝试从 Creem payload 获取过期时间，否则默认一年
  const expiresAtFromCreem = event.object?.current_period_end || event.object?.expires_at
  const expiresAt = expiresAtFromCreem
    ? new Date(expiresAtFromCreem * 1000).toISOString()
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  console.log("Membership expires at:", expiresAt)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error("Failed to list users:", authError)
    return new Response(JSON.stringify({ error: authError.message }), { status: 500 })
  }

  const user = authUser.users.find((u) => u.email === customerEmail)

  if (!user) {
    console.error("User not found in auth:", customerEmail)
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
  }

  const { data: existingProfile, error: queryError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (queryError && queryError.code !== "PGRST116") {
    console.error("Failed to query profile:", queryError)
    return new Response(JSON.stringify({ error: queryError.message }), { status: 500 })
  }

  let error
  if (existingProfile) {
    const result = await supabase
      .from("user_profiles")
      .update({
        is_member: true,
        membership_started_at: new Date().toISOString(),
        membership_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
    error = result.error
  } else {
    const result = await supabase.from("user_profiles").insert({
      id: user.id,
      email: customerEmail,
      is_member: true,
      membership_started_at: new Date().toISOString(),
      membership_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    error = result.error
  }

  if (error) {
    console.error("Failed to update membership:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  console.log("Membership updated for:", customerEmail)
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
