import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wprdlhplkoxurxkfgjqb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwcmRsaHBsa294dXJ4a2ZnanFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODY0MTAsImV4cCI6MjA5MjM2MjQxMH0.TQHp6GzrH1er7YoGPMXpoS7Ndw-xB__DubxJlLBZEr8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
