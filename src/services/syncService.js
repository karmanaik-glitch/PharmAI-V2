/**
 * SyncService — Bridges localStorage (offline) with Supabase (cloud)
 * 
 * Strategy:
 *   - Writes go to BOTH localStorage (instant) AND Supabase (async)
 *   - On app load, pull from Supabase and merge with local
 *   - If offline, queue writes and flush when back online
 *   - Firebase UID is used as the user_id in all tables
 */

import { supabase } from './supabase'

// ══ QUEUE FOR OFFLINE WRITES ══
let pendingWrites = []
let isOnline = navigator.onLine

window.addEventListener('online', () => {
  isOnline = true
  flushPendingWrites()
})
window.addEventListener('offline', () => { isOnline = false })

async function flushPendingWrites() {
  const writes = [...pendingWrites]
  pendingWrites = []
  for (const fn of writes) {
    try { await fn() } catch (e) { console.warn('[Sync] Flush failed:', e.message) }
  }
}

function enqueueOrExec(asyncFn) {
  if (isOnline) {
    asyncFn().catch(e => console.warn('[Sync]', e.message))
  } else {
    pendingWrites.push(asyncFn)
  }
}

// ══ WARD PATIENTS ══

export async function syncPatientsToCloud(userId, patients) {
  if (!userId) return
  enqueueOrExec(async () => {
    // Upsert each patient as a row
    const rows = patients.map(p => ({
      id: String(p.id),
      user_id: userId,
      data: p,
      status: p.status || 'active',
      updated_at: new Date().toISOString()
    }))

    if (rows.length === 0) return

    const { error } = await supabase
      .from('patients')
      .upsert(rows, { onConflict: 'id,user_id' })
    
    if (error) console.warn('[Sync] Patient upsert error:', error.message)
  })
}

export async function loadPatientsFromCloud(userId) {
  if (!userId || !isOnline) return null
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.warn('[Sync] Patient load error:', error.message)
      return null
    }
    return data?.map(r => r.data) || null
  } catch (e) {
    console.warn('[Sync] Patient load failed:', e.message)
    return null
  }
}

// ══ CHAT SESSIONS ══

export async function syncSessionsToCloud(userId, sessions) {
  if (!userId) return
  enqueueOrExec(async () => {
    const rows = sessions.map(s => ({
      id: String(s.id),
      user_id: userId,
      title: s.title || 'Untitled',
      messages: s.messages,
      updated_at: new Date().toISOString()
    }))

    if (rows.length === 0) return

    const { error } = await supabase
      .from('chat_sessions')
      .upsert(rows, { onConflict: 'id,user_id' })
    
    if (error) console.warn('[Sync] Session upsert error:', error.message)
  })
}

export async function loadSessionsFromCloud(userId) {
  if (!userId || !isOnline) return null
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, messages')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.warn('[Sync] Session load error:', error.message)
      return null
    }
    // Convert back to the store format
    return data?.map(r => ({
      id: Number(r.id),
      title: r.title,
      messages: r.messages
    })) || null
  } catch (e) {
    console.warn('[Sync] Session load failed:', e.message)
    return null
  }
}

export async function deleteSessionFromCloud(userId, sessionId) {
  if (!userId) return
  enqueueOrExec(async () => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', String(sessionId))
      .eq('user_id', userId)
    
    if (error) console.warn('[Sync] Session delete error:', error.message)
  })
}

// ══ USER SETTINGS ══

export async function syncSettingsToCloud(userId, settings) {
  if (!userId) return
  enqueueOrExec(async () => {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        groq_key: settings.groqKey || '',
        filters: settings.filters || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
    
    if (error) console.warn('[Sync] Settings upsert error:', error.message)
  })
}

export async function loadSettingsFromCloud(userId) {
  if (!userId || !isOnline) return null
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('groq_key, filters')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) return null
    return {
      groqKey: data.groq_key || '',
      filters: data.filters || {}
    }
  } catch (e) {
    return null
  }
}
