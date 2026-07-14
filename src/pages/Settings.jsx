import { useState } from 'react'
import { checkRoom } from '../firebase'
import { DEFAULT_TEMPLATES, getTemplatesForMeal } from './MealPlan'
import { DEFAULT_STAPLES } from '../App'


// ════════════════════════════════
// マイセット管理
// ════════════════════════════════
function MySetManager() {
  const [sets,      setSets]      = useState(() => { try { return JSON.parse(localStorage.getItem('mySets')||'[]') } catch { return [] } })
  const [creating,  setCreating]  = useState(false)
  const [editIdx,   setEditIdx]   = useState(null)
  const [setName,   setSetName]   = useState('')
  const [mealInput, setMealInput] = useState('')
  const [mealList,  setMealList]  = useState([])  // [{name, ings:[]}]
  const [expandIdx, setExpandIdx] = useState(null)

  const saveSets = (next) => {
    localStorage.setItem('mySets', JSON.stringify(next))
    setSets(next)
  }

  const openCreate = () => {
    setSetName(''); setMealList([]); setMealInput(''); setCreating(true); setEditIdx(null)
  }
  const openEdit = (i) => {
    setSetName(sets[i].name); setMealList([...sets[i].meals]); setMealInput(''); setEditIdx(i); setCreating(true)
  }

  const addMeal = () => {
    const v = mealInput.trim(); if (!v) return
    setMealList(prev => [...prev, { name: v, ings: [] }])
    setMealInput('')
  }
  const removeMeal = (i) => setMealList(prev => prev.filter((_,j)=>j!==i))

  const saveSet = () => {
    if (!setName.trim() || mealList.length === 0) return
    const entry = { name: setName.trim(), meals: mealList }
    const next = editIdx !== null
      ? sets.map((s,i) => i===editIdx ? entry : s)
      : [...sets, entry]
    saveSets(next)
    setCreating(false); setEditIdx(null)
  }
  const deleteSet = (i) => saveSets(sets.filter((_,j)=>j!==i))

  return (
    <div>
      {sets.length === 0 && !creating && (
        <div style={{fontSize:12, color:'var(--text3)', marginBottom:10}}>
          まだセットがありません。よく食べる料理の組み合わせを登録しておくと、献立入力時に一括追加できます。
        </div>
      )}

      {sets.map((set, i) => (
        <div key={i} style={{marginBottom:8, border:'.5px solid var(--border)', borderRadius:'var(--rs)', overflow:'hidden'}}>
          <div style={{display:'flex', alignItems:'center', padding:'9px 12px', background:'var(--surface2)', cursor:'pointer'}}
            onClick={() => setExpandIdx(expandIdx===i?null:i)}>
            <span style={{flex:1, fontSize:13, fontWeight:500}}>{set.name}</span>
            <span style={{fontSize:11, color:'var(--text3)', marginRight:10}}>{set.meals.length}品</span>
            <button onClick={e=>{e.stopPropagation();openEdit(i)}} style={{fontSize:11,padding:'2px 8px',border:'.5px solid var(--border2)',borderRadius:4,background:'none',cursor:'pointer',color:'var(--text2)',marginRight:4}}>編集</button>
            <button onClick={e=>{e.stopPropagation();deleteSet(i)}} style={{fontSize:11,padding:'2px 8px',border:'none',borderRadius:4,background:'var(--red-l)',cursor:'pointer',color:'var(--red)'}}>削除</button>
          </div>
          {expandIdx===i && (
            <div style={{padding:'8px 12px'}}>
              {set.meals.map((m,j)=>(
                <div key={j} style={{fontSize:12, padding:'3px 0', borderBottom:'.5px solid var(--border)', color:'var(--text2)'}}>🍽 {m.name}</div>
              ))}
            </div>
          )}
        </div>
      ))}

      {creating ? (
        <div style={{background:'var(--surface2)', borderRadius:'var(--rs)', padding:12, marginTop:8}}>
          <div style={{fontSize:11, color:'var(--text3)', marginBottom:8, fontWeight:500}}>
            {editIdx!==null ? 'セットを編集' : '新しいセットを作成'}
          </div>
          <input value={setName} onChange={e=>setSetName(e.target.value)} placeholder="セット名（例：夜の定番、週末ランチ）"
            style={{width:'100%',padding:'8px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none',marginBottom:8}} />

          <div style={{marginBottom:6}}>
            {mealList.map((m,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',padding:'5px 8px',background:'var(--green-l)',borderRadius:'var(--rs)',marginBottom:4}}>
                <span style={{flex:1,fontSize:13,color:'var(--green)',fontWeight:500}}>🍽 {m.name}</span>
                <button onClick={()=>removeMeal(i)} style={{fontSize:14,color:'var(--text3)',border:'none',background:'none',cursor:'pointer'}}>×</button>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:6,marginBottom:10}}>
            <input value={mealInput} onChange={e=>setMealInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addMeal()}
              placeholder="料理名を入力してEnter（例：ビーフシチュー）"
              style={{flex:1,padding:'8px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none'}} />
            <button onClick={addMeal} style={{padding:'8px 12px',background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer'}}>追加</button>
          </div>

          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>{setCreating(false);setEditIdx(null)}}
              style={{flex:1,padding:'8px',background:'var(--surface)',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',color:'var(--text2)'}}>
              キャンセル
            </button>
            <button onClick={saveSet} disabled={!setName.trim()||mealList.length===0}
              style={{flex:1,padding:'8px',background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',fontWeight:500,
                opacity:(!setName.trim()||mealList.length===0)?0.5:1}}>
              保存
            </button>
          </div>
        </div>
      ) : (
        <button onClick={openCreate}
          style={{width:'100%',marginTop:8,padding:'9px',background:'none',border:'.5px dashed var(--border2)',borderRadius:'var(--rs)',fontSize:13,color:'var(--text3)',cursor:'pointer'}}>
          ＋ 新しいセットを作成
        </button>
      )}
    </div>
  )
}

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
  const [activeMeal, setActiveMeal] = useState('朝')

  // 時間帯別テンプレ取得
  const mealTemplates = getTemplatesForMeal(templates, activeMeal)

  // テンプレ操作（時間帯別オブジェクト対応）
  const updateTemplates = (next) => onUpdate({ templates: next })

  const addTemplate = () => {
    const name = newTmplName.trim(); if (!name) return
    const ings = newTmplIngs.split(/[,、，]+/).map(s => s.trim()).filter(Boolean)
    const cur  = Array.isArray(templates) ? { 朝:[], 昼:[], 夜:[] } : { ...templates }
    cur[activeMeal] = [...(cur[activeMeal]||[]), { id: Date.now(), name, ings, skipList: newTmplSkip }]
    updateTemplates(cur)
    setNewTmplName(''); setNewTmplIngs(''); setNewTmplSkip(false); setShowAddTmpl(false)
  }
  const removeTmpl = (id) => {
    const cur = Array.isArray(templates) ? { 朝:[], 昼:[], 夜:[] } : { ...templates }
    cur[activeMeal] = (cur[activeMeal]||[]).filter(t => t.id !== id)
    updateTemplates(cur)
  }

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

      {/* ── マイセット ── */}
      <div style={{ ...s.sec, marginTop: 0 }}>Myセット</div>
      <div style={s.card}>
        <label style={s.label}>よく食べる料理の組み合わせをセットとして登録。献立入力時にワンタップで全品まとめて追加できます。</label>
        <MySetManager />
      </div>

      {/* ── テンプレート ── */}
      <div style={s.sec}>テンプレート</div>
      <div style={s.card}>
        <label style={s.label}>朝・昼・夜それぞれの入力時に表示されるワンタップ選択肢です。</label>

        {/* 時間帯タブ */}
        <div style={{display:'flex', gap:4, marginBottom:12}}>
          {['朝','昼','夜'].map(meal => (
            <button key={meal} onClick={() => setActiveMeal(meal)} style={{
              flex:1, padding:'6px 0', border:'none', borderRadius:'var(--rs)', cursor:'pointer', fontSize:13, fontWeight:activeMeal===meal?600:400,
              background: activeMeal===meal ? 'var(--green)' : 'var(--surface2)',
              color: activeMeal===meal ? '#fff' : 'var(--text2)',
              transition:'all .15s',
            }}>{meal}</button>
          ))}
        </div>

        {mealTemplates.map(t => (
          <div key={t.id} style={s.listItem}>
            <span style={s.itemName}>{t.name}</span>
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
