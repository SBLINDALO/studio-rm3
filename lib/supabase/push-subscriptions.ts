import { supabase } from "./client"
import type { PushSubscription } from "./client"

// Funzione per salvare una subscription
export async function savePushSubscription(userId: string, subscription: PushSubscriptionJSON): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        enabled: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving push subscription:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in savePushSubscription:', error)
    throw error
  }
}

// Funzione per ottenere la subscription di un utente
export async function getPushSubscription(userId: string): Promise<PushSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching push subscription:', error)
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Error in getPushSubscription:', error)
    throw error
  }
}

// Funzione per aggiornare lo stato enabled
export async function updatePushSubscriptionEnabled(userId: string, enabled: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        enabled,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating push subscription:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in updatePushSubscriptionEnabled:', error)
    throw error
  }
}

// Funzione per rimuovere una subscription
export async function removePushSubscription(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing push subscription:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in removePushSubscription:', error)
    throw error
  }
}