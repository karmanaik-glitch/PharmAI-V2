/**
 * Groq Service — Routes through Supabase Edge Function
 * The API key is stored server-side. Client never sees it.
 */

import { supabase } from './supabase'

const EDGE_FN_URL = 'https://wprdlhplkoxurxkfgjqb.supabase.co/functions/v1/groq-proxy'

export async function sendToGroq(query, hist = [], filters = {}, imgBase64 = null) {
  const response = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabase.supabaseKey}`,
    },
    body: JSON.stringify({
      query,
      history: hist,
      filters,
      image: imgBase64
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || 'AI service request failed')
  }

  return await response.json()
}
