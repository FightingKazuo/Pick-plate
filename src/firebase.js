import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

window.__pickplateDebug = { channelStatus: 'not yet', lastPayload: null, subscribeCalls: 0 }

export const saveRoom = async (roomCode, data) => {
  await supabase
    .from('rooms')
    .upsert({ code: roomCode, data, updated_at: new Date().toISOString() })
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
  window.__pickplateDebug.subscribeCalls++

  const fetchAndCallback = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('data')
      .eq('code', roomCode)
      .single()
    if (data) callback(data.data)
  }

  fetchAndCallback()

  const channel = supabase
    .channel(`room-${roomCode}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
      (payload) => {
        window.__pickplateDebug.lastPayload = payload
        if (payload.new && payload.new.data) callback(payload.new.data)
      }
    )
    .subscribe((status) => {
      window.__pickplateDebug.channelStatus = status
    })

  return () => {
    supabase.removeChannel(channel)
  }
}
