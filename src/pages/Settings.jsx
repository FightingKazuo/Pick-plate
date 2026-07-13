import { useState } from 'react'
import { checkRoom } from '../firebase'
import { DEFAULT_TEMPLATES } from './MealPlan'
import { DEFAULT_STAPLES } from '../App'


// 料理ごとの除外食材管理
function ExclusionManager() {
  const [exc, setExc] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mealExclusions') || '{}') } catch { return {} }
  })
  const entries = Object.entries(exc).filter(([,ings]) => ings.length > 0)

  const removeIng = (meal, ing) => {
    const next = { ...exc, [meal]: exc[meal].filter(x => x !== ing) }
    if (next[meal].length === 0) delete next[meal]
    localStorage.setItem('mealExclusions', JSON.stringify(next))
    setExc({ ...next })
  }
  const clearAll = () => {
    if (!confirm('除外食材の記録をすべてリセットしますか？')) return
    localStorage.setItem('mealExclusions', '{}')
    setExc({})
  }

  if (entries.length === 0) return (
    <div style={{fontSize:12, color:'var(--text3)'}}>
      まだ記録はありません。献立で料理を選んで食材をタップすると除外が記録されます。
    </div>
  )
  return (
    <div>
      {entries.map(([meal, ings]) => (
        <div key={meal} style={{marginBottom:10}}>
          <div style={{fontSize:12, fontWeight:500, marginBottom:5}}>🍽 {meal}</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
            {ings.map(ing => (
              <span key={ing} style={{fontSize:12, padding:'3px 9px', borderRadius:20, background:'var(--red-l)', color:'var(--red)', display:'flex', alignItems:'center', gap:3}}>
                {ing}
                <span style={{cursor:'pointer', fontSize:13, lineHeight:1}} onClick={() => removeIng(meal, ing)}>×</span>
              </span>
            ))}
          </div>
        </div>
      ))}
      <button style={{fontSize:12, padding:'6px 12px', border:'.5px solid var(--border2)', borderRadius:'var(--rs)', background:'none', cursor:'pointer', color:'var(--text2)', marginTop:4}} onClick={clearAll}>
        すべてリセット
      </button>
    </div>
  )
}

const s = {
  page:  { padding: '14px', paddingBottom: 80 },
  sec:   { fontSize: 10, fontWeight: 500, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  card:  { background: 'var(--surface)', border: '.5px solid var(--border)', borderRadius: 'var(--r)', padding: '14px', marginBottom: 10 },
  label: { fontSize: 12, color: 'var(--text2)', marginBottom: 8, display: 'block', lineHeight: 1.7 },
  inp:   { width: '100%', padding: '9px 12px', border: '.5px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 14, outline: 'none', marginBottom: 8 },
  row:   { display: 'flex', gap: 7 },
  btn:   (c) => ({ flex: 1, padding: '9px 0', border: 'none', borderRadius: 'var(--rs)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: c==='green'?'var(--green)':c==='red'?'var(--red-l)':'var(--surface2)', color: c==='green'?'#fff':c==='red'?'var(--red)':'var(--text)' }),
  roomCode: { fontSize: 26, fontWeight: 700, letterSpacing: 5, color: 'var(--green)', textAlign: 'center', background: 'var(--green-l)', borderRadius: 'var(--rs)', padding: '12px 0', marginBottom: 8, fontFamily: 'monospace' },
  hint:  { fontSize: 11, color: 'var(--text3)', lineHeight: 1.8 },

  // テンプレリスト
  listItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '.5px solid var(--border)' },
  itemName: { flex: 1, fontSize: 13 },
  tagBtn:   (on) => ({ fontSize: 10, borderRadius: 4, padding: '3px 8px', border: 'none', cursor: 'pointer', background: on?'var(--surface2)':'var(--green-l)', color: on?'var(--text3)':'var(--green)' }),
  delBtn:   { fontSize: 15, color: 'var(--text3)', cursor: 'pointer', border: 'none', background: 'none', padding: '0 2px' },

  // 常備品タグ群
  stapleWrap: { display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  stapleTag:  { fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 },
  stapleDel:  { fontSize: 13, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 },

  addForm: { marginTop: 10, display: 'flex', gap: 7 },
  addInp:  { flex: 1, padding: '8px 11px', border: '.5px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 13, outline: 'none' },
  addBtn:  { padding: '8px 14px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: 13, cursor: 'pointer' },
}

function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase() }

export default function Settings({ data, onUpdate, roomCode, onRoomChange }) {
  const [inputCode,   setInputCode]   = useState('')
  const [geminiKey,   setGeminiKey]   = useState(localStorage.getItem('geminiKey') || '')
  const [geminiSaved, setGeminiSaved] = useState(!!localStorage.getItem('geminiKey'))
  const [joining,     setJoining]     = useState(false)
  const [msg,         setMsg]         = useState('')
  const [showAddTmpl, setShowAddTmpl] = useState(false)
  const [newTmplName, setNewTmplName] = useState('')
  const [newTmplIngs, setNewTmplIngs] = useState('')
  const [newTmplSkip, setNewTmplSkip] = useState(false)
  const [newStaple,   setNewStaple]   = useState('')

  const templates = data?.templates || DEFAULT_TEMPLATES
  const staples   = data?.staples   || DEFAULT_STAPLES

  // テンプレ操作
  const updateTemplates = (next) => onUpdate({ templates: next })
  const addTemplate = () => {
    const name = newTmplName.trim(); if (!name) return
    const ings = newTmplIngs.split(/[,、，]+/).map(s => s.trim()).filter(Boolean)
    updateTemplates([...templates, { id: Date.now(), name, ings, skipList: newTmplSkip }])
    setNewTmplName(''); setNewTmplIngs(''); setNewTmplSkip(false); setShowAddTmpl(false)
  }
  const removeTmpl  = (id) => updateTemplates(templates.filter(t => t.id !== id))
  const toggleSkip  = (id) => updateTemplates(templates.map(t => t.id === id ? { ...t, skipList: !t.skipList } : t))

  // 常備品操作
  const updateStaples = (next) => onUpdate({ staples: next })
  const addStaple     = () => { const v = newStaple.trim(); if (!v || staples.includes(v)) return; updateStaples([...staples, v]); setNewStaple('') }
  const removeStaple  = (s) => updateStaples(staples.filter(x => x !== s))
  const resetStaples  = () => { if (confirm('常備品リストをデフォルトに戻しますか？')) updateStaples(DEFAULT_STAPLES) }

  // ルーム
  const createRoom = () => { const c = genCode(); onRoomChange(c); setMsg('ルームを作成しました！コードを彼女に送ってください。') }
  const joinRoom   = async () => {
    const code = inputCode.trim().toUpperCase(); if (code.length < 4) { setMsg('コードを入力してください'); return }
    setJoining(true)
    const exists = await checkRoom(code); setJoining(false)
    if (exists) { onRoomChange(code); setMsg(`ルーム「${code}」に参加しました！`) }
    else setMsg('ルームが見つかりませんでした。コードを確認してください。')
  }
  const saveGemini = () => { localStorage.setItem('geminiKey', geminiKey); setGeminiSaved(true); setMsg('Gemini APIキーを保存しました') }

  return (
    <div style={s.page}>

      {/* ── 朝ごはんテンプレート ── */}
      <div style={{ ...s.sec, marginTop: 0 }}>朝ごはんテンプレート</div>
      <div style={s.card}>
        <label style={s.label}>「朝」タップ時のワンタップ選択肢。「リスト不要」の項目は買い物リストに追加されません。</label>
        {templates.map(t => (
          <div key={t.id} style={s.listItem}>
            <span style={s.itemName}>{t.name}</span>
            <button style={s.tagBtn(t.skipList)} onClick={() => toggleSkip(t.id)}>{t.skipList ? 'リスト不要' : 'リスト追加'}</button>
            <button style={s.delBtn} onClick={() => removeTmpl(t.id)}>×</button>
          </div>
        ))}
        {showAddTmpl ? (
          <div style={{ marginTop: 10, background: 'var(--surface2)', borderRadius: 'var(--rs)', padding: 12 }}>
            <input style={{ ...s.inp, marginBottom: 6 }} value={newTmplName} onChange={e => setNewTmplName(e.target.value)} placeholder="料理名（例：バナナ）" />
            <input style={{ ...s.inp, marginBottom: 6 }} value={newTmplIngs} onChange={e => setNewTmplIngs(e.target.value)} placeholder="食材（省略可）例：食パン, バター" />
            <button style={{ width: '100%', padding: '7px', border: 'none', borderRadius: 'var(--rs)', marginBottom: 8, cursor: 'pointer', fontSize: 12, background: newTmplSkip ? 'var(--surface2)' : 'var(--green-l)', color: newTmplSkip ? 'var(--text3)' : 'var(--green)' }} onClick={() => setNewTmplSkip(v => !v)}>
              {newTmplSkip ? '⬜ リストに追加しない（常備品・作り置き）' : '✅ リストに追加する'}
            </button>
            <div style={s.row}>
              <button style={s.btn('white')} onClick={() => { setShowAddTmpl(false); setNewTmplName('') }}>キャンセル</button>
              <button style={s.btn('green')} onClick={addTemplate}>追加</button>
            </div>
          </div>
        ) : (
          <button style={{ ...s.btn('white'), marginTop: 10, width: '100%' }} onClick={() => setShowAddTmpl(true)}>＋ テンプレートを追加</button>
        )}
      </div>

      {/* ── 常備品管理 ── */}
      <div style={s.sec}>常備品（買い物リストに出さないもの）</div>
      <div style={s.card}>
        <label style={s.label}>ここに登録した食材は、料理を選んでも買い物リストに追加されません。醤油・みりんなど常にストックしているものを登録してください。</label>
        <div style={s.stapleWrap}>
          {staples.map(st => (
            <span key={st} style={s.stapleTag}>
              {st}
              <span style={s.stapleDel} onClick={() => removeStaple(st)}>×</span>
            </span>
          ))}
        </div>
        <div style={s.addForm}>
          <input style={s.addInp} value={newStaple} onChange={e => setNewStaple(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStaple()} placeholder="追加する常備品（例：バター）" />
          <button style={s.addBtn} onClick={addStaple}>追加</button>
        </div>
        <button style={{ ...s.btn('white'), marginTop: 10, width: '100%', fontSize: 12 }} onClick={resetStaples}>デフォルトに戻す</button>
      </div>

      {/* ── 共有ルーム ── */}
      <div style={s.sec}>共有ルーム</div>
      <div style={s.card}>
        {roomCode ? (
          <>
            <label style={s.label}>現在のルームコード</label>
            <div style={s.roomCode}>{roomCode}</div>
            <div style={s.hint}>このコードを彼女に送って「ルームに参加」から入力してもらうとリアルタイム同期されます。</div>
            <button style={{ ...s.btn('white'), marginTop: 10, width: '100%' }} onClick={createRoom}>新しいルームを作る</button>
          </>
        ) : (
          <>
            <label style={s.label}>ルームを作成するか、受け取ったコードで参加してください。<br /><span style={{ color: 'var(--green)' }}>※ルームなしでも献立はFirebaseに自動保存されます。</span></label>
            <button style={{ ...s.btn('green'), width: '100%', marginBottom: 10 }} onClick={createRoom}>＋ 新しいルームを作る</button>
            <div style={{ ...s.hint, marginBottom: 8 }}>または受け取ったコードで参加</div>
            <input style={s.inp} value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} placeholder="ルームコードを入力" maxLength={8} />
            <button style={{ ...s.btn('green'), width: '100%' }} onClick={joinRoom} disabled={joining}>{joining ? '確認中...' : 'ルームに参加'}</button>
          </>
        )}
      </div>

      {/* ── Gemini API ── */}
      <div style={s.sec}>Gemini API（任意）</div>
      <div style={s.card}>
        <label style={s.label}>料理名入力時にAIサジェストが使えます。未登録でもDBから候補が出ます。</label>
        <input style={s.inp} type="text" value={geminiKey} onChange={e => { setGeminiKey(e.target.value); setGeminiSaved(false) }} placeholder="AIzaSy..." />
        <div style={s.row}>
          <button style={s.btn('white')} onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}>取得する →</button>
          <button style={s.btn('green')} onClick={saveGemini}>{geminiSaved ? '✓ 保存済み' : '保存'}</button>
        </div>
        <div style={{ ...s.hint, marginTop: 8 }}>Gemini 1.5 Flash は1日1,500リクエスト無料です。</div>
      </div>


      {/* ── 非表示レシピ管理 ── */}
      <div style={s.sec}>出さない料理リスト（学習データ）</div>
      <div style={s.card}>
        <label style={s.label}>献立で料理の食材をタップして除外した記録です。次回同じ料理を選んだとき自動で除外されます。このデバイスのみに保存されます。</label>
        <ExclusionManager />
      </div>

      {msg && <div style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 'var(--rs)', padding: '10px 14px', fontSize: 13, marginTop: 10 }}>{msg}</div>}
    </div>
  )
}
