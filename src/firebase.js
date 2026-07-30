import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

console.log('[DEBUG] Supabase client created', import.meta.env.VITE_SUPABASE_URL)

export const saveRoom = async (roomCode, data) => {
  console.log('[DEBUG] saveRoom called', roomCode)
  const result = await supabase
    .from('rooms')
    .upsert({ code: roomCode, data, updated_at: new Date().toISOString() })
  console.log('[DEBUG] saveRoom result', result)
}

export const checkRoom = async (roomCode) => {
  const { data } = await supabase
    .from('rooms')
    .select('code')
    .eq('code', roomCode)
    .single()
  return !!data
}

export const subscribeRoom = (roomCode, callback) => {
  console.log('[DEBUG] subscribeRoom called', roomCode)

  const fetchAndCallback = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('data')
      .eq('code', roomCode)
      .single()
    console.log('[DEBUG] initial fetch', data, error)
    if (data) callback(data.data)
  }

  fetchAndCallback()

  const channel = supabase
    .channel(`room-${roomCode}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
      (payload) => {
        console.log('[DEBUG] realtime payload received', payload)
        if (payload.new && payload.new.data) callback(payload.new.data)
      }
    )
    .subscribe((status) => {
      console.log('[DEBUG] channel status', status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}
