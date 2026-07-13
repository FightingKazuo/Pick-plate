import { useState, useEffect, useCallback } from 'react'
import { saveRoom, subscribeRoom } from './firebase'
import MealPlan from './pages/MealPlan'
import ShoppingList, { guessCategory } from './pages/ShoppingList'
import Settings from './pages/Settings'

const TABS = [
  {
    id: 'meal', label: '献立',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  },
  {
    id: 'list', label: '買い物',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
  },
  {
    id: 'settings', label: '設定',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  },
]

const css = {
  app: {
    display: 'flex', flexDirection: 'column',
    height: '100dvh', maxWidth: 480,
    margin: '0 auto', background: 'var(--surface)',
    boxShadow: '0 0 0 .5px var(--border)',
    position: 'relative',
  },
  header: {
    padding: '14px 18px 12px',
    borderBottom: '.5px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0, background: 'var(--surface)',
  },
  title: { fontFamily: 'var(--font)', fontSize: 17, fontWeight: 700, color: 'var(--green)' },
  roomBadge: {
    fontSize: 11, background: 'var(--green-l)', color: 'var(--green)',
    borderRadius: 20, padding: '4px 10px', fontWeight: 500,
  },
  content: { flex: 1, overflowY: 'auto' },
  tabBar: {
    display: 'flex', borderTop: '.5px solid var(--border)',
    background: 'var(--surface)', flexShrink: 0,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  tab: (active) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, padding: '9px 4px 8px', border: 'none',
    background: 'none', color: active ? 'var(--green)' : 'var(--text3)',
    fontSize: 10, fontWeight: active ? 500 : 400,
    transition: 'color .15s', cursor: 'pointer',
  }),
  syncDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#4CAF50', position: 'absolute', top: -2, right: -2,
  },
  offlineBanner: {
    background: 'var(--amber-l)', borderBottom: '.5px solid #E8C94A',
    padding: '7px 14px', fontSize: 12, color: 'var(--amber)', textAlign: 'center',
  },
}

const INITIAL_DATA = { meals: {}, items: [] }

export default function App() {
  const [tab, setTab] = useState('meal')
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('roomCode') || '')
  const [data, setData] = useState(INITIAL_DATA)
  const [syncing, setSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // オンライン状態監視
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Firebaseリアルタイム購読
  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeRoom(roomCode, (remoteData) => {
      setData(remoteData)
    })
    return () => unsub()
  }, [roomCode])

  // データ変更をFirebaseに保存
  const handleUpdate = useCallback(async (patch) => {
    const next = { ...data, ...patch }
    setData(next)
    if (!roomCode) return
    setSyncing(true)
    try {
      await saveRoom(roomCode, next)
    } catch (e) {
      console.error('save error:', e)
    } finally {
      setSyncing(false)
    }
  }, [data, roomCode])

  // ルームコード変更
  const handleRoomChange = (code) => {
    localStorage.setItem('roomCode', code)
    setRoomCode(code)
  }

  // 献立から食材をリストに追加
  const addToList = useCallback((ings, mealName) => {
    const currentItems = data.items || []
    const newItems = ings
      .filter(ing => !currentItems.find(i => i.name === ing))
      .map(ing => ({
        id: Date.now() + Math.random(),
        name: ing,
        category: guessCategory(ing),
        checked: false,
        source: 'meal',
        mealName,
      }))
    if (newItems.length > 0) {
      handleUpdate({ items: [...currentItems, ...newItems] })
    }
  }, [data.items, handleUpdate])

  return (
    <div style={css.app}>
      {/* Header */}
      <div style={css.header}>
        <div style={css.title}>🛒 おかいもの手帖</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {syncing && <span style={{ fontSize: 11, color: 'var(--text3)' }}>同期中...</span>}
          {roomCode
            ? <div style={css.roomBadge}>
                <span style={{ position: 'relative' }}>
                  {roomCode}
                  {syncing && <span style={css.syncDot} />}
                </span>
              </div>
            : <button
                style={{ ...css.roomBadge, border: 'none', cursor: 'pointer', background: 'var(--surface2)', color: 'var(--text2)' }}
                onClick={() => setTab('settings')}
              >
                共有設定
              </button>
          }
        </div>
      </div>

      {/* オフラインバナー */}
      {!isOnline && (
        <div style={css.offlineBanner}>オフライン中 — データは接続回復後に同期されます</div>
      )}

      {/* Content */}
      <div style={css.content}>
        {tab === 'meal' && (
          <MealPlan
            data={data}
            onUpdate={handleUpdate}
            onAddToList={addToList}
          />
        )}
        {tab === 'list' && (
          <ShoppingList
            data={data}
            onUpdate={handleUpdate}
          />
        )}
        {tab === 'settings' && (
          <Settings
            data={data}
            onUpdate={handleUpdate}
            roomCode={roomCode}
            onRoomChange={handleRoomChange}
          />
        )}
      </div>

      {/* Tab bar */}
      <div style={css.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={css.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
