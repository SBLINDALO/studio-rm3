import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"
import webpush from "web-push"

// Configure VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    "mailto:your-email@example.com", // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 })
    }

    const { userId, title, body, data, tag } = await request.json()

    if (!userId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user's push subscription
    const { data: subscriptionData, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .eq('enabled', true)
      .single()

    if (error || !subscriptionData) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    // Send push notification
    const payload = JSON.stringify({
      title,
      body: body || "Promemoria studio",
      data: data || {},
      tag: tag || "study-reminder"
    })

    await webpush.sendNotification(subscriptionData.subscription, payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending push notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}