import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

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
  let lastUpdatedAt = null
  let stopped = false

  const check = async () => {
    if (stopped) return
    try {
      const { data } = await supabase
        .from('rooms')
        .select('data, updated_at')
        .eq('code', roomCode)
        .single()

      if (data && data.updated_at !== lastUpdatedAt) {
        lastUpdatedAt = data.updated_at
        callback(data.data)
      }
    } catch (e) {
      console.error('poll error:', e)
    }
  }

  check()
  const interval = setInterval(check, 2000)

  // タブが表示された瞬間・フォーカスされた瞬間に即チェック
  const onVisible = () => { if (document.visibilityState === 'visible') check() }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', check)

  return () => {
    stopped = true
    clearInterval(interval)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', check)
  }
}
