import { useState, useRef, useEffect, useCallback } from 'react'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

const DAY_FULL  = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
const DAY_SHORT = ['日','月','火','水','木','金','土']
const MEALS     = ['朝','昼','夜']

export const DEFAULT_TEMPLATES = [
  { id:1, name:'ヨーグルト', ings:[] },
  { id:2, name:'豆腐',       ings:['豆腐'] },
  { id:3, name:'トースト',   ings:['食パン','バター'] },
  { id:4, name:'目玉焼き',   ings:['卵'] },
  { id:5, name:'おにぎり',   ings:[] },
  { id:6, name:'サラダ',     ings:['レタス','トマト','きゅうり'] },
  { id:7, name:'味噌汁',     ings:['豆腐','わかめ','長ねぎ'] },
  { id:8, name:'納豆',       ings:['納豆'] },
]

// ── 日付ユーティリティ ──
function getDisplayDates() {
  const today = new Date()
  const base  = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Array.from({length:7}, (_,i) => {
    const d = new Date(base); d.setDate(base.getDate() + i - 2); return d
  })
}
function slotKey(date, meal) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}-${meal}`
}
function isToday(d) {
  const t = new Date()
  return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate()
}
const TODAY_IDX = 2

// ── 除外食材（localStorage）──
function getExcludedIngs(mealName) {
  try { return (JSON.parse(localStorage.getItem('mealExclusions')||'{}')||{})[mealName]||[] } catch { return [] }
}
function toggleExcludeIng(mealName, ing) {
  try {
    const exc = JSON.parse(localStorage.getItem('mealExclusions')||'{}')
    const cur = exc[mealName]||[]
    exc[mealName] = cur.includes(ing) ? cur.filter(x=>x!==ing) : [...cur, ing]
    localStorage.setItem('mealExclusions', JSON.stringify(exc))
    return exc[mealName]
  } catch { return [] }
}

// ── 履歴（localStorage）──
function getHistory() {
  try { return JSON.parse(localStorage.getItem('mealHistory')||'[]') } catch { return [] }
}
function addHistory(meal) {
  const next = [meal, ...getHistory().filter(m=>m.name!==meal.name)].slice(0,30)
  localStorage.setItem('mealHistory', JSON.stringify(next))
}

// ── アニメーション注入 ──
if (typeof document!=='undefined' && !document.getElementById('pp-anim')) {
  const st = document.createElement('style')
  st.id = 'pp-anim'
  st.textContent = '@keyframes pp-pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}} @keyframes pp-slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}} @keyframes pp-slideOut{from{transform:translateX(0)}to{transform:translateX(100%)}}'
  document.head.appendChild(st)
}

// ════════════════════════════════════════════
// 入力ページ（全画面）
// ════════════════════════════════════════════
const ip = {
  page: {
    position:'fixed', inset:0, background:'var(--bg)',
    zIndex:500, display:'flex', flexDirection:'column',
    animation:'pp-slideIn .22s ease',
  },
  header: {
    padding:'14px 16px 12px', background:'var(--surface)',
    borderBottom:'.5px solid var(--border)', flexShrink:0,
    display:'flex', alignItems:'center', gap:12,
  },
  backBtn: {
    width:34, height:34, borderRadius:'50%', border:'none',
    background:'var(--surface2)', fontSize:18, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    color:'var(--text2)', flexShrink:0,
  },
  headerInfo: { flex:1 },
  headerTitle: { fontSize:15, fontWeight:600 },
  headerSub:   { fontSize:11, color:'var(--text3)', marginTop:1 },

  body: { flex:1, overflowY:'auto', padding:'14px', paddingBottom:100 },

  sec:     { fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:8, marginTop:18 },
  secFirst:{ marginTop:0 },

  // 追加済み
  addedList: { display:'flex', flexDirection:'column', gap:5, marginBottom:4 },
  addedChip: { background:'var(--green-l)', borderRadius:'var(--rs)', overflow:'hidden' },
  addedHead: { display:'flex', alignItems:'center', gap:6, padding:'9px 11px', cursor:'pointer' },
  addedName: { flex:1, fontSize:14, fontWeight:500, color:'var(--green)' },
  addedDel:  { fontSize:16, color:'var(--text3)', padding:'0 2px', cursor:'pointer', lineHeight:1 },
  addedBadge:{ fontSize:9, background:'rgba(45,106,79,.15)', color:'var(--green)', borderRadius:4, padding:'1px 5px', marginLeft:4 },

  // 食材パネル
  ingPanel: { padding:'8px 11px 11px', borderTop:'.5px solid rgba(45,106,79,.2)' },
  ingLabel: { fontSize:10, color:'var(--text3)', marginBottom:6 },
  ingList:  { display:'flex', flexWrap:'wrap', gap:4 },
  ingBtn:   (exc, st) => ({
    fontSize:11, padding:'3px 9px', borderRadius:20, border:'none', cursor:'pointer', transition:'all .12s',
    background: exc?'#eee': st?'var(--surface2)':'var(--green-l)',
    color:      exc?'#bbb': st?'var(--text3)':'var(--green)',
    textDecoration: exc?'line-through':'none',
  }),

  // テンプレート
  tmplGrid: { display:'flex', flexWrap:'wrap', gap:6 },
  tmplBtn:  (sel) => ({
    padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:13, fontWeight:sel?500:400, transition:'all .12s',
    background: sel?'var(--green)':'var(--surface2)',
    color:      sel?'#fff':'var(--text2)',
  }),
  addSelBtn: {
    width:'100%', marginTop:10, padding:'9px', background:'var(--green)', color:'#fff',
    border:'none', borderRadius:'var(--rs)', fontSize:13, fontWeight:500, cursor:'pointer',
  },

  // 検索
  searchInp: {
    width:'100%', padding:'11px 13px', border:'.5px solid var(--border2)',
    borderRadius:'var(--rs)', fontSize:14, outline:'none', background:'var(--surface)',
    color:'var(--text)', transition:'border-color .15s',
  },
  searchWrap: { position:'relative' },
  dropdown: {
    position:'absolute', top:'calc(100% + 4px)', left:0, right:0,
    background:'var(--surface)', border:'.5px solid var(--border)',
    borderRadius:'var(--r)', boxShadow:'0 8px 24px rgba(0,0,0,.12)',
    zIndex:600, maxHeight:280, overflowY:'auto',
  },
  dropItem: (hov) => ({
    padding:'10px 13px', cursor:'pointer', borderBottom:'.5px solid var(--border)',
    background: hov?'var(--green-l)':'transparent', transition:'background .1s',
  }),
  dropName: { fontSize:14, fontWeight:500 },
  dropIngs: { fontSize:11, color:'var(--text3)', marginTop:2 },
  aiLabel:  { fontSize:9, background:'var(--green-l)', color:'var(--green)', borderRadius:3, padding:'1px 5px', marginLeft:5 },
  loadRow:  { padding:'10px 13px', fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:6 },
  dot:      { width:5, height:5, borderRadius:'50%', background:'var(--green)', display:'inline-block' },

  // 履歴
  histItem: (hov) => ({
    display:'flex', alignItems:'center', padding:'10px 6px',
    borderBottom:'.5px solid var(--border)', cursor:'pointer',
    background: hov?'var(--surface2)':'transparent', borderRadius:'var(--rs)',
    transition:'background .1s',
  }),
  histName: { flex:1, fontSize:13 },
  histAdd:  { fontSize:18, color:'var(--green)', padding:'0 4px', fontWeight:300 },

  // フッター
  footer: {
    position:'fixed', bottom:0, left:0, right:0,
    padding:'10px 14px', paddingBottom:'calc(10px + env(safe-area-inset-bottom))',
    background:'var(--surface)', borderTop:'.5px solid var(--border)',
    display:'flex', gap:8,
  },
  doneBtn: (done) => ({
    flex:1, padding:'12px', border:'none', borderRadius:'var(--rs)',
    fontSize:14, fontWeight:600, cursor:'pointer', transition:'background .2s',
    background: done?'#52B788':'var(--green)', color:'#fff',
  }),
}

// 食材パネル
function IngPanel({ mealName, ings, staples }) {
  const [excluded, setExcluded] = useState(() => getExcludedIngs(mealName))
  if (!ings?.length) return null
  const toggle = (ing) => setExcluded(toggleExcludeIng(mealName, ing))
  return (
    <div style={ip.ingPanel}>
      <div style={ip.ingLabel}>食材をタップして除外（次回も自動除外）</div>
      <div style={ip.ingList}>
        {ings.map((ing,i) => {
          const isExc = excluded.includes(ing)
          const isSt  = staples?.some(s => ing.includes(s)||s.includes(ing))
          return <button key={i} style={ip.ingBtn(isExc,isSt)} onClick={() => toggle(ing)}>{isExc?'✕ ':isSt?'':'🛒 '}{ing}</button>
        })}
      </div>
      {excluded.length > 0 && <div style={{fontSize:10,color:'var(--text3)',marginTop:5}}>✕ {excluded.join('・')} は次回も自動除外</div>}
    </div>
  )
}

// 検索ボックス
function SearchBox({ onSelect, staples }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [aiLoad,  setAiLoad]  = useState(false)
  const [focused, setFocused] = useState(false)
  const [hovId,   setHovId]   = useState(null)
  const isComposing = useRef(false)
  const dropTouched = useRef(false)
  const timer       = useRef(null)

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); setAiLoad(false); return }
    const local = searchRecipes(query)
    setResults(local)
    const key = localStorage.getItem('geminiKey')||''
    if (!key || isComposing.current) return
    clearTimeout(timer.current)
    setAiLoad(true)
    timer.current = setTimeout(async () => {
      try {
        const ai = await fetchGeminiSuggestions(query, key)
        const names = new Set(local.map(r=>r.name))
        setResults([...local, ...ai.filter(r=>!names.has(r.name)).map(r=>({...r,fromAI:true}))])
      } catch(e) { console.error(e) } finally { setAiLoad(false) }
    }, 600)
    return () => { clearTimeout(timer.current); setAiLoad(false) }
  }, [query])

  const pick = (r) => { onSelect(r); setQuery(''); setResults([]); setFocused(false) }
  const showDrop = focused && (results.length > 0 || aiLoad)

  return (
    <div style={ip.searchWrap}>
      <input
        style={{...ip.searchInp, borderColor: focused?'var(--green)':'var(--border2)'}}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onCompositionStart={() => { isComposing.current=true }}
        onCompositionEnd={e => {
          isComposing.current=false
          setQuery(e.target.value+' ')
          setTimeout(()=>setQuery(e.target.value),0)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => {
          if (!dropTouched.current) { setFocused(false); setAiLoad(false) }
          dropTouched.current=false
        }, 300)}
        placeholder="料理名で検索（例：焼きそば）"
      />
      {showDrop && (
        <div style={ip.dropdown}
          onTouchStart={() => { dropTouched.current=true }}
          onMouseDown={() => { dropTouched.current=true }}
        >
          {aiLoad && (
            <div style={ip.loadRow}>
              {[0,1,2].map(i=><span key={i} style={{...ip.dot, animation:`pp-pulse 1.2s ${i*.2}s infinite`}}/>)}
              <span style={{marginLeft:4}}>Geminiで検索中...</span>
            </div>
          )}
          {results.map((r,i)=>(
            <div key={i}
              style={{...ip.dropItem(hovId===i), borderBottom:i===results.length-1?'none':undefined}}
              onMouseEnter={()=>setHovId(i)} onMouseLeave={()=>setHovId(null)}
              onMouseDown={()=>pick(r)} onTouchEnd={e=>{e.preventDefault();pick(r)}}
            >
              <div style={ip.dropName}>{r.name}{r.fromAI&&<span style={ip.aiLabel}>✨ AI</span>}</div>
              {r.ings?.length>0 && <div style={ip.dropIngs}>{r.ings.slice(0,5).join('・')}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 全画面入力ページ
function InputPage({ dayLabel, mealLabel, confirmed, templates, staples, onAdd, onRemove, onDone }) {
  const [selTmpls,  setSelTmpls]  = useState([])
  const [expandIdx, setExpandIdx] = useState(null)
  const [hovHist,   setHovHist]   = useState(null)
  const [doneAnim,  setDoneAnim]  = useState(false)
  const history = getHistory().slice(0,15)
  const confirmedNames = new Set(confirmed.map(c=>c.name))
  const filteredHist   = history.filter(h=>!confirmedNames.has(h.name))

  const toggleTmpl = (t) => setSelTmpls(prev => prev.find(x=>x.id===t.id) ? prev.filter(x=>x.id!==t.id) : [...prev,t])
  const confirmTmpls = () => {
    selTmpls.forEach(t => { onAdd({name:t.name,ings:t.ings||[]}); addHistory({name:t.name,ings:t.ings||[]}) })
    setSelTmpls([])
  }
  const handleSearch = (r) => { onAdd({name:r.name,ings:r.ings||[]}); addHistory({name:r.name,ings:r.ings||[]}) }
  const handleHist   = (m) => { onAdd({name:m.name,ings:m.ings||[]}); addHistory(m) }

  const handleDone = () => {
    if (confirmed.length > 0) {
      setDoneAnim(true)
      setTimeout(onDone, 700)
    } else {
      onDone()
    }
  }

  return (
    <div style={ip.page}>
      {/* ヘッダー */}
      <div style={ip.header}>
        <button style={ip.backBtn} onClick={onDone}>←</button>
        <div style={ip.headerInfo}>
          <div style={ip.headerTitle}>{dayLabel} {mealLabel}</div>
          <div style={ip.headerSub}>{confirmed.length>0 ? `${confirmed.map(m=>m.name).join('・')}` : '料理を選んでください'}</div>
        </div>
      </div>

      <div style={ip.body}>

        {/* 追加済み */}
        {confirmed.length > 0 && (
          <>
            <div style={{...ip.sec,...ip.secFirst}}>追加済み</div>
            <div style={ip.addedList}>
              {confirmed.map((m,i)=>(
                <div key={i} style={ip.addedChip}>
                  <div style={ip.addedHead}>
                    <span style={ip.addedName} onClick={()=>setExpandIdx(expandIdx===i?null:i)}>
                      🍽 {m.name}
                      {m.ings?.length>0 && <span style={ip.addedBadge}>{expandIdx===i?'▲':'▼'} 食材</span>}
                    </span>
                    <span style={ip.addedDel} onClick={()=>{onRemove(i);if(expandIdx===i)setExpandIdx(null)}}>×</span>
                  </div>
                  {expandIdx===i && <IngPanel mealName={m.name} ings={m.ings} staples={staples} />}
                </div>
              ))}
            </div>
          </>
        )}

        {/* テンプレート */}
        <div style={{...ip.sec, ...(confirmed.length===0?ip.secFirst:{})}}>テンプレート</div>
        <div style={ip.tmplGrid}>
          {templates.map(t=>(
            <button key={t.id} style={ip.tmplBtn(!!selTmpls.find(x=>x.id===t.id))} onClick={()=>toggleTmpl(t)}>
              {selTmpls.find(x=>x.id===t.id)?'✓ ':''}{t.name}
            </button>
          ))}
        </div>
        {selTmpls.length>0 && (
          <button style={ip.addSelBtn} onClick={confirmTmpls}>
            {selTmpls.map(t=>t.name).join('・')} を追加
          </button>
        )}

        {/* 検索 */}
        <div style={ip.sec}>料理を検索</div>
        <SearchBox onSelect={handleSearch} staples={staples} />

        {/* 履歴 */}
        {filteredHist.length>0 && (
          <>
            <div style={ip.sec}>履歴</div>
            {filteredHist.map((m,i)=>(
              <div key={i} style={ip.histItem(hovHist===i)}
                onMouseEnter={()=>setHovHist(i)} onMouseLeave={()=>setHovHist(null)}
                onClick={()=>handleHist(m)}
              >
                <span style={ip.histName}>{m.name}</span>
                <span style={ip.histAdd}>＋</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* フッター */}
      <div style={ip.footer}>
        <button style={ip.doneBtn(doneAnim)} onClick={handleDone}>
          {doneAnim
            ? `✓ ${confirmed.map(m=>m.name).join('・')} を登録しました`
            : confirmed.length>0 ? `${confirmed.map(m=>m.name).join('・')} で確定` : '閉じる'
          }
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// 一覧ページ
// ════════════════════════════════════════════
const lp = {
  page:    { paddingBottom:80 },
  dayList: { display:'flex', flexDirection:'column' },
  dayRow:  (past) => ({ display:'flex', alignItems:'stretch', borderBottom:'.5px solid var(--border)', opacity:past?.6:1 }),
  dayLabel:(today) => ({
    width:52, flexShrink:0, padding:'12px 6px',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start',
    gap:2, background: today?'var(--green)':'var(--surface2)',
    borderRight:'.5px solid var(--border)',
  }),
  dow:  (today) => ({ fontSize:11, fontWeight:600, color:today?'#fff':'var(--text3)' }),
  date: (today) => ({ fontSize:13, fontWeight:today?700:400, color:today?'#fff':'var(--text)' }),
  dayContent: { flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 },
  slotRow:    { display:'flex', alignItems:'flex-start', gap:7 },
  lbl:        { fontSize:10, color:'var(--text3)', width:22, flexShrink:0, paddingTop:9, fontWeight:600 },
  inner:      { flex:1, minWidth:0 },
  chipArea:   { display:'flex', flexDirection:'column', gap:3, marginBottom:3 },
  chip:       { display:'flex', alignItems:'center', gap:5, padding:'6px 10px', background:'var(--green-l)', borderRadius:'var(--rs)', cursor:'pointer' },
  chipName:   { flex:1, fontSize:13, fontWeight:500, color:'var(--green)' },
  chipDel:    { fontSize:15, color:'var(--text3)', lineHeight:1, padding:'0 2px', cursor:'pointer' },
  addBtn:     (has) => ({
    padding: has?'4px 10px':'7px 10px', fontSize:12, color:'var(--text3)',
    border:'.5px dashed var(--border2)', borderRadius:'var(--rs)',
    cursor:'pointer', background:'none', width:'100%', textAlign:'left',
  }),
}

export default function MealPlan({ data, onUpdate, onAddToList, staples }) {
  const dates     = getDisplayDates()
  const meals     = data?.meals     || {}
  const templates = data?.templates || DEFAULT_TEMPLATES
  const rowRefs   = useRef([])

  // 入力ページの状態
  const [inputTarget, setInputTarget] = useState(null) // { key, dayLabel, mealLabel }

  useEffect(() => {
    const el = rowRefs.current[TODAY_IDX]
    if (el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),100)
  }, [])

  const getList = (key) => { const v=meals[key]; return Array.isArray(v)?v:v?[v]:[] }

  const addMeal = (key, meal) => {
    const excluded = getExcludedIngs(meal.name)
    const addIngs  = (meal.ings||[]).filter(ing=>!excluded.includes(ing))
    if (addIngs.length>0) onAddToList(addIngs, meal.name)
    onUpdate({ meals:{...meals,[key]:[...getList(key),meal]} })
  }

  const removeMeal = (key, idx) => {
    const list = getList(key).filter((_,i)=>i!==idx)
    const next = {...meals}
    if (list.length===0) delete next[key]; else next[key]=list
    onUpdate({meals:next})
  }

  // 入力ページを開く
  const openInput = (key, dayLabel, mealLabel) => setInputTarget({key,dayLabel,mealLabel})
  const closeInput = () => setInputTarget(null)

  return (
    <>
      {/* 一覧 */}
      <div style={lp.page}>
        <div style={lp.dayList}>
          {dates.map((date,di) => {
            const today   = isToday(date)
            const past    = di < TODAY_IDX
            const dateStr = `${date.getMonth()+1}/${date.getDate()}`
            const dow     = DAY_SHORT[date.getDay()]
            const dayFull = DAY_FULL[date.getDay()]

            return (
              <div key={di} style={lp.dayRow(past)} ref={el=>rowRefs.current[di]=el}>
                <div style={lp.dayLabel(today)}>
                  <span style={lp.dow(today)}>{dow}</span>
                  <span style={lp.date(today)}>{dateStr}</span>
                </div>
                <div style={lp.dayContent}>
                  {MEALS.map(meal => {
                    const key  = slotKey(date, meal)
                    const list = getList(key)
                    return (
                      <div key={meal} style={lp.slotRow}>
                        <div style={lp.lbl}>{meal}</div>
                        <div style={lp.inner}>
                          {list.length>0 && (
                            <div style={lp.chipArea}>
                              {list.map((m,i)=>(
                                <div key={i} style={lp.chip} onClick={()=>openInput(key,dayFull,meal)}>
                                  <span style={lp.chipName}>🍽 {m.name}</span>
                                  <span style={lp.chipDel} onClick={e=>{e.stopPropagation();removeMeal(key,i)}}>×</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <button style={lp.addBtn(list.length>0)} onClick={()=>openInput(key,dayFull,meal)}>
                            ＋ {list.length>0?'もう一品':'料理を追加'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 全画面入力ページ */}
      {inputTarget && (
        <InputPage
          dayLabel={inputTarget.dayLabel}
          mealLabel={inputTarget.mealLabel}
          confirmed={getList(inputTarget.key)}
          templates={templates}
          staples={staples}
          onAdd={(meal)=>addMeal(inputTarget.key, meal)}
          onRemove={(idx)=>removeMeal(inputTarget.key, idx)}
          onDone={closeInput}
        />
      )}
    </>
  )
}
