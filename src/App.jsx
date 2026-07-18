import { useState, useEffect, useCallback, useRef } from 'react'
import { saveRoom, subscribeRoom } from './firebase'
import MealPlan from './pages/MealPlan'
import ShoppingList, { guessCategory, normalizeIngredient } from './pages/ShoppingList'
import Settings from './pages/Settings'

export const DEFAULT_STAPLES = [
  '醤油','みりん','酒','砂糖','塩','味噌','酢','ごま油','サラダ油','オリーブ油',
  '片栗粉','小麦粉','だし','コンソメ','鶏がらスープの素','白ごま','黒こしょう',
  'こしょう','ナツメグ','ラー油','豆板醤','甜麺醤','バジル','パセリ','唐辛子',
]

const TABS = [
  { id: 'meal', label: '献立',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'list', label: '買い物',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { id: 'settings', label: '設定',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

const css = {
  app: { display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 480, margin: '0 auto', background: 'var(--surface)', boxShadow: '0 0 0 .5px var(--border)', position: 'relative' },
  header: { padding: '14px 18px 12px', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--surface)' },
  title: { fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.5px' },
  badge: { fontSize: 11, background: 'var(--green-l)', color: 'var(--green)', borderRadius: 20, padding: '4px 10px', fontWeight: 500 },
  content: { flex: 1, overflowY: 'auto' },
  tabBar: { display: 'flex', borderTop: '.5px solid var(--border)', background: 'var(--surface)', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom)' },
  tab: (a) => ({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 4px 8px', border: 'none', background: 'none', color: a ? 'var(--green)' : 'var(--text3)', fontSize: 10, fontWeight: a ? 500 : 400, cursor: 'pointer' }),
  offlineBanner: { background: 'var(--amber-l)', borderBottom: '.5px solid #E8C94A', padding: '7px 14px', fontSize: 12, color: 'var(--amber)', textAlign: 'center' },
}

// ── localStorageバックアップ ──
const LS_BACKUP = 'pickplate-data-backup'
const LS_DEVICE = 'deviceId'
const LS_ROOM   = 'roomCode'

const INITIAL_DATA = { meals: {}, items: [], templates: [], staples: DEFAULT_STAPLES }

function loadBackup() {
  try {
    const s = localStorage.getItem(LS_BACKUP)
    if (s) return { ...INITIAL_DATA, ...JSON.parse(s) }
  } catch {}
  return INITIAL_DATA
}
function saveBackup(data) {
  try { localStorage.setItem(LS_BACKUP, JSON.stringify(data)) } catch {}
}

// deviceIdはアプリ起動時に1回だけ確定させる
function getOrCreateDeviceId() {
  let id = localStorage.getItem(LS_DEVICE)
  if (!id) {
    id = 'device-' + Math.random().toString(36).substring(2, 10)
    localStorage.setItem(LS_DEVICE, id)
  }
  return id
}

export default function App() {
  const [tab,      setTab]      = useState('meal')
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem(LS_ROOM) || '')
  const [data,     setData]     = useState(() => loadBackup())
  const [syncing,  setSyncing]  = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // ★ firebaseKeyをrefで固定 — 再レンダリングで変わらない
  const firebaseKeyRef = useRef(null)
  if (!firebaseKeyRef.current) {
    firebaseKeyRef.current = localStorage.getItem(LS_ROOM) || getOrCreateDeviceId()
  }
  const firebaseKey = roomCode || firebaseKeyRef.current

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Firebase購読
  useEffect(() => {
    const unsub = subscribeRoom(firebaseKey, (remoteData) => {
      if (!remoteData) return
      const merged = { ...INITIAL_DATA, ...remoteData, staples: remoteData.staples || DEFAULT_STAPLES }
      setData(merged)
      saveBackup(merged)
    })
    return () => unsub()
  }, [firebaseKey])

  // dataRefは常に最新のdataを指す（連続更新時のstale closure対策）
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])

  const handleUpdate = useCallback(async (patch) => {
    // dataRefから最新を取得（複数の連続更新でも古いstateを参照しない）
    const next = { ...dataRef.current, ...patch }
    dataRef.current = next   // refも即座に更新
    setData(next)
    saveBackup(next)
    setSyncing(true)
    try { await saveRoom(firebaseKey, next) }
    catch (e) { console.error('Firebase save error:', e) }
    finally { setSyncing(false) }
  }, [firebaseKey])

  const handleRoomChange = useCallback((code) => {
    localStorage.setItem(LS_ROOM, code)
    firebaseKeyRef.current = code // refも更新
    setRoomCode(code)
  }, [])

  // 常備品チェック（2文字以上の常備品が食材名に含まれる場合のみ除外）
  const staples = data?.staples || DEFAULT_STAPLES
  const isStaple = useCallback((name) =>
    staples.some(s => s.length >= 2 && (name === s || name.includes(s)))
  , [staples])

  // 買い物リストに追加（常備品・重複を除外）
  const addToList = useCallback((ings, mealName) => {
    const currentItems = dataRef.current.items || []
    const newItems = ings
      .map(ing => normalizeIngredient(ing))      // 表記ゆれを統一
      .filter(ing => !isStaple(ing))             // 常備品除外
      .filter(ing => !currentItems.find(i => i.name === ing)) // 重複除外
      .map(ing => ({
        id: Date.now() + Math.random(),
        name: ing, category: guessCategory(ing),
        checked: false, source: 'meal', mealName,
      }))
    if (newItems.length > 0) handleUpdate({ items: [...currentItems, ...newItems] })
  }, [isStaple, handleUpdate])

  // 栄養タブ・外部からの食事追加イベント（addToList/handleUpdateの後に定義）
  useEffect(() => {
    const handler = (e) => {
      const { key, meal } = e.detail
      const currentMeals = dataRef.current.meals || {}
      const cur = currentMeals[key]
      const list = Array.isArray(cur) ? cur : cur ? [cur] : []
      const updated = { ...currentMeals, [key]: [...list, meal] }
      dataRef.current = { ...dataRef.current, meals: updated }
      if (meal.ings?.length > 0) {
        const excluded = (() => {
          try { return (JSON.parse(localStorage.getItem('mealExclusions')||'{}')||{})[meal.name]||[] } catch { return [] }
        })()
        const addIngs = meal.ings.filter(ing => !excluded.includes(ing))
        if (addIngs.length > 0) addToList(addIngs, meal.name)
      }
      handleUpdate({ meals: updated })
    }
    window.addEventListener('pickplate:addMeal', handler)
    return () => window.removeEventListener('pickplate:addMeal', handler)
  }, [handleUpdate, addToList])

  return (
    <div style={css.app}>
      <div style={css.header}>
        <div style={css.title}>Pick Plate</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {syncing && <span style={{ fontSize: 11, color: 'var(--text3)' }}>同期中...</span>}
          {roomCode
            ? <div style={css.badge}>{roomCode}</div>
            : <button style={{ ...css.badge, border: 'none', cursor: 'pointer', background: 'var(--surface2)', color: 'var(--text2)' }} onClick={() => setTab('settings')}>共有設定</button>
          }
        </div>
      </div>

      {!isOnline && <div style={css.offlineBanner}>オフライン中 — 接続回復後に同期されます</div>}

      <div style={css.content}>
        {tab === 'meal'     && <MealPlan data={data} onUpdate={handleUpdate} onAddToList={addToList} staples={staples} members={data?.members || ['自分','相手']} />}
        {tab === 'list'     && <ShoppingList data={data} onUpdate={handleUpdate} />}
        {tab === 'settings' && <Settings data={data} onUpdate={handleUpdate} roomCode={roomCode} onRoomChange={handleRoomChange} />}
      </div>

      <div style={css.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={css.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
