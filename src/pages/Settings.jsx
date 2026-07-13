import { useState } from 'react'
import { checkRoom } from '../firebase'
import { DEFAULT_TEMPLATES } from './MealPlan'

const s = {
  page:   { padding: '14px', paddingBottom: 80 },
  sec:    { fontSize: 10, fontWeight: 500, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  card:   { background: 'var(--surface)', border: '.5px solid var(--border)', borderRadius: 'var(--r)', padding: '16px', marginBottom: 10 },
  label:  { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' },
  inp:    { width: '100%', padding: '9px 12px', border: '.5px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 14, outline: 'none', marginBottom: 8 },
  row:    { display: 'flex', gap: 7 },
  btn:    (c) => ({
    flex: 1, padding: '9px 0', border: 'none', borderRadius: 'var(--rs)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    background: c === 'green' ? 'var(--green)' : c === 'red' ? 'var(--red-l)' : 'var(--surface2)',
    color:      c === 'green' ? '#fff'         : c === 'red' ? 'var(--red)'   : 'var(--text)',
  }),
  roomCode: { fontSize: 28, fontWeight: 700, letterSpacing: 6, color: 'var(--green)', textAlign: 'center', background: 'var(--green-l)', borderRadius: 'var(--rs)', padding: '12px 0', marginBottom: 8, fontFamily: 'monospace' },
  hint:   { fontSize: 11, color: 'var(--text3)', lineHeight: 1.8 },

  // テンプレートリスト
  tmplItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '.5px solid var(--border)' },
  tmplName: { flex: 1, fontSize: 13 },
  tmplTag:  (skip) => ({
    fontSize: 10, borderRadius: 4, padding: '2px 7px',
    background: skip ? 'var(--surface2)' : 'var(--green-l)',
    color:      skip ? 'var(--text3)'    : 'var(--green)',
  }),
  tmplDel:  { fontSize: 16, color: 'var(--text3)', cursor: 'pointer', border: 'none', background: 'none' },

  // 新規追加フォーム
  addForm:   { marginTop: 12, padding: '12px', background: 'var(--surface2)', borderRadius: 'var(--rs)' },
  skipToggle:(on) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
    borderRadius: 'var(--rs)', border: 'none', cursor: 'pointer', fontSize: 12,
    background: on ? 'var(--surface2)' : 'var(--green-l)',
    color:      on ? 'var(--text3)'    : 'var(--green)',
    width: '100%', marginBottom: 8,
  }),
}

function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase() }

export default function Settings({ data, onUpdate, roomCode, onRoomChange }) {
  const [inputCode,  setInputCode]  = useState('')
  const [geminiKey,  setGeminiKey]  = useState(localStorage.getItem('geminiKey') || '')
  const [geminiSaved,setGeminiSaved]= useState(!!localStorage.getItem('geminiKey'))
  const [joining,    setJoining]    = useState(false)
  const [msg,        setMsg]        = useState('')
  const [showAdd,    setShowAdd]    = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newIngs,    setNewIngs]    = useState('')
  const [skipList,   setSkipList]   = useState(false)

  const templates = data?.templates || DEFAULT_TEMPLATES

  const updateTemplates = (next) => onUpdate({ templates: next })

  const addTemplate = () => {
    const name = newName.trim(); if (!name) return
    const ings = newIngs.split(/[,、，]+/).map(s => s.trim()).filter(Boolean)
    updateTemplates([...templates, { id: Date.now(), name, ings, skipList }])
    setNewName(''); setNewIngs(''); setSkipList(false); setShowAdd(false)
  }

  const removeTemplate = (id) => updateTemplates(templates.filter(t => t.id !== id))
  const toggleSkip = (id) => updateTemplates(templates.map(t => t.id === id ? { ...t, skipList: !t.skipList } : t))

  const createRoom = () => { const c = genCode(); onRoomChange(c); setMsg('ルームを作成しました！コードを彼女に送ってください。') }
  const joinRoom = async () => {
    const code = inputCode.trim().toUpperCase(); if (code.length < 4) { setMsg('コードを入力してください'); return }
    setJoining(true)
    const exists = await checkRoom(code); setJoining(false)
    if (exists) { onRoomChange(code); setMsg(`ルーム「${code}」に参加しました！`) }
    else setMsg('ルームが見つかりませんでした。コードを確認してください。')
  }
  const saveGemini = () => { localStorage.setItem('geminiKey', geminiKey); setGeminiSaved(true); setMsg('Gemini APIキーを保存しました') }

  return (
    <div style={s.page}>

      {/* 朝ごはんテンプレート */}
      <div style={{ ...s.sec, marginTop: 0 }}>朝ごはんテンプレート</div>
      <div style={s.card}>
        <label style={s.label}>献立の「朝」タップ時に表示されるワンタップ選択肢です。「リスト不要」にした項目は買い物リストに追加されません。</label>

        {templates.map(t => (
          <div key={t.id} style={s.tmplItem}>
            <span style={s.tmplName}>{t.name}</span>
            <button style={s.tmplTag(t.skipList)} onClick={() => toggleSkip(t.id)}>
              {t.skipList ? 'リスト不要' : 'リスト追加'}
            </button>
            <button style={s.tmplDel} onClick={() => removeTemplate(t.id)}>×</button>
          </div>
        ))}

        {showAdd ? (
          <div style={s.addForm}>
            <input style={{ ...s.inp, marginBottom: 6 }} value={newName} onChange={e => setNewName(e.target.value)} placeholder="料理名（例：ヨーグルト）" />
            <input style={{ ...s.inp, marginBottom: 6 }} value={newIngs} onChange={e => setNewIngs(e.target.value)} placeholder="食材（省略可）例：食パン, バター" />
            <button style={s.skipToggle(skipList)} onClick={() => setSkipList(!skipList)}>
              {skipList ? '⬜ リストに追加しない（前日の作り置き・常備品など）' : '✅ リストに追加する'}
            </button>
            <div style={s.row}>
              <button style={s.btn('white')} onClick={() => { setShowAdd(false); setNewName(''); setNewIngs('') }}>キャンセル</button>
              <button style={s.btn('green')} onClick={addTemplate}>追加</button>
            </div>
          </div>
        ) : (
          <button style={{ ...s.btn('white'), marginTop: 10, width: '100%' }} onClick={() => setShowAdd(true)}>
            ＋ テンプレートを追加
          </button>
        )}
      </div>

      {/* 共有ルーム */}
      <div style={s.sec}>共有ルーム</div>
      <div style={s.card}>
        {roomCode ? (
          <>
            <label style={s.label}>現在のルームコード</label>
            <div style={s.roomCode}>{roomCode}</div>
            <div style={s.hint}>このコードを彼女に送って、「ルームに参加」から入力してもらうと自動でリアルタイム同期されます。</div>
            <button style={{ ...s.btn('white'), marginTop: 10, width: '100%' }} onClick={createRoom}>新しいルームを作る</button>
          </>
        ) : (
          <>
            <label style={s.label}>ルームを作るか、既存コードで参加してください</label>
            <button style={{ ...s.btn('green'), width: '100%', marginBottom: 10 }} onClick={createRoom}>＋ 新しいルームを作る</button>
            <div style={{ ...s.hint, marginBottom: 8 }}>または</div>
            <input style={s.inp} value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} placeholder="ルームコードを入力" maxLength={8} />
            <button style={{ ...s.btn('green'), width: '100%' }} onClick={joinRoom} disabled={joining}>
              {joining ? '確認中...' : 'ルームに参加'}
            </button>
          </>
        )}
      </div>

      {/* Gemini API */}
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

      {/* メッセージ */}
      {msg && (
        <div style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 'var(--rs)', padding: '10px 14px', fontSize: 13, marginTop: 10 }}>
          {msg}
        </div>
      )}
    </div>
  )
}
