import { useState, useRef, useEffect, useMemo } from 'react'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

const DAY_FULL  = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
const DAY_SHORT = ['日','月','火','水','木','金','土']
const MEALS     = ['朝','昼','夜']

// デフォルトMyセット（初回起動時）
export const DEFAULT_MYSETS = [
  {
    name: '和食の朝',
    meals: [
      { name: 'ごはん',     ings: [] },
      { name: '味噌汁',     ings: ['豆腐','わかめ','長ねぎ'] },
      { name: '納豆',       ings: ['納豆'] },
    ]
  },
  {
    name: '洋食の朝',
    meals: [
      { name: 'トースト',   ings: ['食パン','バター'] },
      { name: '目玉焼き',   ings: ['卵'] },
      { name: 'サラダ',     ings: ['レタス','トマト','きゅうり'] },
    ]
  },
  {
    name: '軽め朝食',
    meals: [
      { name: 'ヨーグルト', ings: [] },
      { name: 'バナナ',     ings: ['バナナ'] },
    ]
  },
]

// 後方互換のためのダミーエクスポート（Settings.jsxから参照）
export const DEFAULT_TEMPLATES = DEFAULT_MYSETS
export function getTemplatesForMeal() { return [] }

// ── 日付 ──
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
  return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate()
}
const TODAY_IDX = 2

// ── 除外食材 ──
function getExclusionMap() {
  try { return JSON.parse(localStorage.getItem('mealExclusions')||'{}') } catch { return {} }
}
function getExcludedIngs(mealName) { return getExclusionMap()[mealName]||[] }
function toggleExcludeIng(mealName, ing) {
  const exc = getExclusionMap()
  const cur = exc[mealName]||[]
  exc[mealName] = cur.includes(ing) ? cur.filter(x=>x!==ing) : [...cur, ing]
  localStorage.setItem('mealExclusions', JSON.stringify(exc))
  return exc[mealName]
}

// ── 履歴 ──
function getHistory() {
  try { return JSON.parse(localStorage.getItem('mealHistory')||'[]') } catch { return [] }
}
function addHistory(meal) {
  const next = [meal, ...getHistory().filter(m=>m.name!==meal.name)].slice(0,50)
  localStorage.setItem('mealHistory', JSON.stringify(next))
}
function removeHistory(name) {
  localStorage.setItem('mealHistory', JSON.stringify(getHistory().filter(m=>m.name!==name)))
}

// ── カスタムメニュー（ユーザーが追加した独自レシピ）──
function getCustomMenus() {
  try { return JSON.parse(localStorage.getItem('customMenus')||'[]') } catch { return [] }
}
function addCustomMenu(meal) {
  const cur = getCustomMenus()
  if (!cur.find(m=>m.name===meal.name)) {
    localStorage.setItem('customMenus', JSON.stringify([...cur, meal]))
  }
}

// ── マイセット（複数料理をまとめて登録）──
// localStorageから取得（Firebase版はdataから受け取る）
function getMySetsLocal() {
  try { return JSON.parse(localStorage.getItem('mySets') || '[]') } catch { return [] }
}

// ── アニメーション ──
if (typeof document!=='undefined' && !document.getElementById('pp-anim')) {
  const st = document.createElement('style')
  st.id='pp-anim'
  st.textContent='@keyframes pp-pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}} @keyframes pp-slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}'
  document.head.appendChild(st)
}

// ════════════════════════════════════════════
// マイセットセクション
// ════════════════════════════════════════════
function MySetsSection({ mySets, onAddSet, confirmedNames }) {
  const sets = mySets
  const [hov, setHov] = useState(null)

  if (sets.length === 0) return null

  return (
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8}}>
        Myセット
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {sets.map((set, i) => {
          const alreadyAdded = set.meals.every(m => confirmedNames.has(m.name))
          return (
            <div key={i}
              onClick={() => !alreadyAdded && onAddSet(set.meals)}
              onTouchEnd={e => { e.preventDefault(); if (!alreadyAdded) onAddSet(set.meals) }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{
                padding:'10px 13px', borderRadius:'var(--rs)', cursor: alreadyAdded?'default':'pointer',
                border:'.5px solid var(--border)',
                background: alreadyAdded ? 'var(--surface2)' : hov===i ? 'var(--green-l)' : 'var(--surface)',
                transition:'background .1s', opacity: alreadyAdded ? 0.5 : 1,
              }}>
              <div style={{fontSize:13,fontWeight:500,marginBottom:3,color: alreadyAdded?'var(--text3)':'var(--text)'}}>
                {alreadyAdded ? '✓ ' : ''}{set.name}
              </div>
              <div style={{fontSize:11,color:'var(--text3)'}}>
                {set.meals.map(m=>m.name).join('・')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// 食材パネル（編集・除外・カスタム保存対応）
// ════════════════════════════════════════════
function IngPanel({ mealName, defaultIngs, staples }) {
  // カスタム食材 or デフォルト食材
  const [ings,     setIngs]     = useState(() => resolveIngs(mealName, defaultIngs))
  const [excluded, setExcluded] = useState(() => getExcludedIngs(mealName))
  const [editing,  setEditing]  = useState(false)
  const [newIng,   setNewIng]   = useState('')

  const toggleExclude = (ing) => setExcluded(toggleExcludeIng(mealName, ing))

  const removeIng = (ing) => {
    const next = ings.filter(x => x !== ing)
    setIngs(next)
    saveCustomIngs(mealName, next)
  }

  const addIng = () => {
    const v = newIng.trim()
    if (!v || ings.includes(v)) return
    const next = [...ings, v]
    setIngs(next)
    saveCustomIngs(mealName, next)
    setNewIng('')
  }

  const resetToDefault = () => {
    saveCustomIngs(mealName, defaultIngs || [])
    setIngs(defaultIngs || [])
  }

  return (
    <div style={{padding:'8px 11px 11px', borderTop:'.5px solid rgba(45,106,79,.2)'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <span style={{fontSize:10, color:'var(--text3)'}}>
          {editing ? '食材を編集（タップで削除）' : '食材をタップで除外（次回も自動除外）'}
        </span>
        <div style={{display:'flex', gap:4}}>
          <button onClick={() => setEditing(v=>!v)} style={{fontSize:10, padding:'2px 7px', border:'.5px solid var(--border2)', borderRadius:10, background:'none', cursor:'pointer', color:'var(--text3)'}}>
            {editing ? '完了' : '✏️ 編集'}
          </button>
          {editing && (
            <button onClick={resetToDefault} style={{fontSize:10, padding:'2px 7px', border:'.5px solid var(--border2)', borderRadius:10, background:'none', cursor:'pointer', color:'var(--text3)'}}>
              リセット
            </button>
          )}
        </div>
      </div>

      <div style={{display:'flex', flexWrap:'wrap', gap:4, marginBottom: editing?8:0}}>
        {ings.map((ing,i) => {
          const isExc = excluded.includes(ing)
          const isSt  = staples?.some(s=>ing.includes(s)||s.includes(ing))
          if (editing) {
            return (
              <button key={i} onClick={() => removeIng(ing)} style={{
                fontSize:11, padding:'3px 9px', borderRadius:20, border:'none', cursor:'pointer',
                background:'var(--red-l)', color:'var(--red)',
              }}>✕ {ing}</button>
            )
          }
          return (
            <button key={i} onClick={() => toggleExclude(ing)} style={{
              fontSize:11, padding:'3px 9px', borderRadius:20, border:'none', cursor:'pointer', transition:'all .12s',
              background: isExc?'#eee': isSt?'var(--surface2)':'var(--green-l)',
              color:      isExc?'#bbb': isSt?'var(--text3)':'var(--green)',
              textDecoration: isExc?'line-through':'none',
            }}>
              {isExc?'✕ ': isSt?'':'🛒 '}{ing}
            </button>
          )
        })}
      </div>

      {editing && (
        <div style={{display:'flex', gap:5, marginTop:4}}>
          <input
            value={newIng}
            onChange={e=>setNewIng(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addIng()}
            placeholder="食材を追加..."
            style={{flex:1, padding:'6px 9px', border:'.5px solid var(--border2)', borderRadius:'var(--rs)', fontSize:12, outline:'none'}}
          />
          <button onClick={addIng} style={{padding:'6px 10px', background:'var(--green)', color:'#fff', border:'none', borderRadius:'var(--rs)', fontSize:12, cursor:'pointer'}}>追加</button>
        </div>
      )}

      {!editing && excluded.length>0 && (
        <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>✕ {excluded.join('・')} は今後も自動除外</div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// 全画面入力ページ
// ════════════════════════════════════════════
const SUGGEST_INIT = 20   // 初期表示件数
const SUGGEST_MORE = 20   // 「もっと見る」で追加する件数

function InputPage({ dayLabel, mealLabel, confirmed, mySets, staples, onAdd, onRemove, onDone }) {
  const [query,      setQuery]      = useState('')
  const [aiResults,  setAiResults]  = useState([])
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiError,    setAiError]    = useState('')
  const [expandIdx,  setExpandIdx]  = useState(null)
  const [showCount,  setShowCount]  = useState(SUGGEST_INIT)
  const [doneAnim,   setDoneAnim]   = useState(false)
  const [histList,   setHistList]   = useState(getHistory)
  const [addingCustom, setAddingCustom] = useState(false)
  const [customName,   setCustomName]   = useState('')
  const [customIngs,   setCustomIngs]   = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const isComposing = useRef(false)
  const timer       = useRef(null)

  const confirmedNames = new Set(confirmed.map(c=>c.name))
  const customMenus    = getCustomMenus()

  // ── サジェスト一覧（ローカルDB＋カスタム）──
  // queryあり→絞り込み、queryなし→全DB（先頭20件）＋カスタムメニュー
  const localResults = useMemo(() => {
    const cm = customMenus.filter(m =>
      !query || m.name.includes(query) || (m.ings||[]).some(i=>i.includes(query))
    )
    const db = searchRecipes(query || '')  // 空文字で全件返る
    const dbFiltered = db.filter(r => !cm.find(c => c.name === r.name))
    return [...cm, ...dbFiltered]
  }, [query])

  // AI検索（queryあり時のみ）
  useEffect(() => {
    setAiError('')
    if (!query || query.length < 1) { setAiResults([]); setAiLoading(false); return }
    if (isComposing.current) return
    clearTimeout(timer.current)
    setAiLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const key = localStorage.getItem('geminiKey')||''
        if (!key) { setAiLoading(false); return }
        const ai = await fetchGeminiSuggestions(query, key)
        const localNames = new Set(localResults.map(r=>r.name))
        setAiResults(ai.filter(r=>!localNames.has(r.name)).map(r=>({...r,fromAI:true})))
      } catch(e) {
          console.error(e)
          setAiError(e.message?.slice(0,80) || 'Gemini APIエラー')
          setTimeout(() => setAiError(''), 5000) // 5秒後に消す
        } finally { setAiLoading(false) }
    }, 600)
    return () => { clearTimeout(timer.current); setAiLoading(false) }
  }, [query])

  // 全候補（ローカル＋AI）、確定済みを除外
  const allResults = useMemo(() => {
    return [...localResults, ...aiResults].filter(r => !confirmedNames.has(r.name))
  }, [localResults, aiResults, confirmed])

  const visibleResults = allResults.slice(0, showCount)
  const hasMore        = allResults.length > showCount

  const pick = (r) => {
    onAdd({name:r.name, ings:r.ings||[]})
    addHistory({name:r.name, ings:r.ings||[]})
    setHistList(getHistory())
    setQuery('')
    setAiResults([])
    setShowCount(SUGGEST_INIT)
  }

  // テンプレ


  // カスタムメニュー追加
  const saveCustom = () => {
    const name = customName.trim()
    if (!name) return
    const ings = customIngs.split(/[,、，]+/).map(s=>s.trim()).filter(Boolean)
    const meal = {name, ings}
    addCustomMenu(meal)
    addHistory(meal)
    onAdd(meal)
    setCustomName(''); setCustomIngs(''); setAddingCustom(false)
    setHistList(getHistory())
  }

  // 履歴削除
  const deleteHist = (name, e) => {
    e.stopPropagation()
    removeHistory(name)
    setHistList(getHistory())
  }

  const filteredHist = histList.filter(h => !confirmedNames.has(h.name) && (!query || h.name.includes(query)))

  const handleDone = () => {
    if (confirmed.length > 0) { setDoneAnim(true); setTimeout(onDone, 700) }
    else onDone()
  }

  return (
    <div style={{position:'fixed',inset:0,background:'var(--bg)',zIndex:500,display:'flex',flexDirection:'column',animation:'pp-slideIn .22s ease'}}>

      {/* ヘッダー */}
      <div style={{padding:'14px 16px 12px',background:'var(--surface)',borderBottom:'.5px solid var(--border)',flexShrink:0,display:'flex',alignItems:'center',gap:12}}>
        <button onClick={onDone} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'var(--surface2)',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text2)',flexShrink:0}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:600}}>{dayLabel} {mealLabel}</div>
          <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>
            {confirmed.length>0 ? confirmed.map(m=>m.name).join('・') : '料理を選んでください'}
          </div>
        </div>
      </div>

      {/* 本体 */}
      <div style={{flex:1,overflowY:'auto',padding:'14px',paddingBottom:90}}>

        {/* 追加済み */}
        {confirmed.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8}}>追加済み</div>
            {confirmed.map((m,i)=>(
              <div key={i} style={{background:'var(--green-l)',borderRadius:'var(--rs)',overflow:'hidden',marginBottom:5}}>
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'9px 11px',cursor:'pointer'}} onClick={()=>setExpandIdx(expandIdx===i?null:i)}>
                  <span style={{flex:1,fontSize:14,fontWeight:500,color:'var(--green)'}}>
                    🍽 {m.name}
                    {m.ings?.length>0 && <span style={{fontSize:9,background:'rgba(45,106,79,.15)',color:'var(--green)',borderRadius:4,padding:'1px 5px',marginLeft:4}}>{expandIdx===i?'▲':'▼'} 食材</span>}
                  </span>
                  <span onClick={e=>{e.stopPropagation();onRemove(i);if(expandIdx===i)setExpandIdx(null)}} style={{fontSize:16,color:'var(--text3)',padding:'0 2px',cursor:'pointer',lineHeight:1}}>×</span>
                </div>
                {expandIdx===i && <IngPanel mealName={m.name} ings={m.ings} staples={staples} />}
              </div>
            ))}
          </div>
        )}

        {/* Myセット */}
        <MySetsSection mySets={mySets} onAddSet={(meals) => {
          meals.forEach(m => {
            onAdd({ name: m.name, ings: m.ings || [] })
            addHistory({ name: m.name, ings: m.ings || [] })
          })
        }} confirmedNames={confirmedNames} />



        {/* 検索 */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8}}>料理を選ぶ</div>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:6}}>料理名でも食材名でも検索できます（例：なす、鮭、豚バラ）</div>
          <input
            value={query}
            onChange={e=>{setQuery(e.target.value);setShowCount(SUGGEST_INIT)}}
            onFocus={()=>setSearchFocused(true)}
            onBlur={()=>setTimeout(()=>setSearchFocused(false),200)}
            onCompositionStart={()=>{isComposing.current=true}}
            onCompositionEnd={e=>{isComposing.current=false;setQuery(e.target.value+' ');setTimeout(()=>setQuery(e.target.value),0)}}
            placeholder="絞り込み検索（空欄で全件表示）"
            style={{width:'100%',padding:'10px 12px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:14,outline:'none',background:'var(--surface)',color:'var(--text)',marginBottom:8}}
          />

          {/* AIローディング・エラー */}
          {aiLoading && (
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 2px',fontSize:12,color:'var(--text3)',marginBottom:6}}>
              {[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:`pp-pulse 1.2s ${i*.2}s infinite`}}/>)}
              <span style={{marginLeft:4}}>Geminiで検索中...</span>
            </div>
          )}
          {aiError && !aiLoading && (
            <div style={{
              borderRadius:'var(--rs)', padding:'10px 12px', marginBottom:8,
              background: aiError.includes('無料枠') ? 'var(--amber-l)' : 'var(--red-l)',
              border: `.5px solid ${aiError.includes('無料枠') ? '#E8C94A' : '#F8C4B4'}`,
            }}>
              <div style={{fontSize:12, fontWeight:500, marginBottom:3,
                color: aiError.includes('無料枠') ? 'var(--amber)' : 'var(--red)',
              }}>
                {aiError.includes('無料枠') ? '⏰ Gemini AI：本日の無料枠終了' : '⚠️ Gemini AI：接続エラー'}
              </div>
              <div style={{fontSize:11, color:'var(--text2)', lineHeight:1.6}}>
                {aiError}
                {aiError.includes('無料枠') && (
                  <span style={{display:'block', marginTop:3, color:'var(--text3)'}}>
                    ※ DBからの候補は引き続き表示されます
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 候補一覧（検索ありの時のみ表示） */}
          {(query || localResults.length > 0) && <div style={{border:'.5px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
            {visibleResults.length===0 && !aiLoading && (
              <div style={{padding:'12px 13px'}}>
                <div style={{fontSize:13,color:'var(--text3)',marginBottom: aiError?6:0}}>候補が見つかりません</div>
                {aiError && (
                  <div style={{fontSize:11,color:'var(--amber)',background:'var(--amber-l)',borderRadius:'var(--rs)',padding:'6px 9px',marginTop:4,border:'.5px solid #E8C94A'}}>
                    ⏰ {aiError}
                  </div>
                )}
              </div>
            )}
            {visibleResults.map((r,i)=>(
              <div key={i}
              onClick={()=>pick(r)}
              onTouchEnd={e=>{e.preventDefault();pick(r)}}
              style={{
                padding:'11px 13px',cursor:'pointer',
                borderBottom: i===visibleResults.length-1&&!hasMore?'none':'.5px solid var(--border)',
                background:'var(--surface)',
                transition:'background .1s',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--green-l)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}
              >
                <div style={{fontSize:14,fontWeight:500}}>
                  {r.name}
                  {r.fromAI && <span style={{fontSize:9,background:'var(--green-l)',color:'var(--green)',borderRadius:3,padding:'1px 5px',marginLeft:5}}>✨ AI</span>}
                  {r.isCustom && <span style={{fontSize:9,background:'var(--purple-l)',color:'var(--purple)',borderRadius:3,padding:'1px 5px',marginLeft:5}}>マイメニュー</span>}
                </div>
                {r.ings?.length>0 && <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{r.ings.slice(0,5).join('・')}</div>}
              </div>
            ))}
            {hasMore && (
              <div onClick={()=>setShowCount(c=>c+SUGGEST_MORE)} onTouchEnd={e=>{e.preventDefault();setShowCount(c=>c+SUGGEST_MORE)}} style={{padding:'11px 13px',cursor:'pointer',fontSize:13,color:'var(--green)',fontWeight:500,textAlign:'center',borderTop:'.5px solid var(--border)',background:'var(--green-l)'}}>
                もっと見る（残り{allResults.length-showCount}件）
              </div>
            )}
          </div>}
        </div>

        {/* カスタムメニュー追加 */}
        <div style={{marginBottom:16}}>
          {!addingCustom ? (
            <button onClick={()=>setAddingCustom(true)} style={{width:'100%',padding:'9px',background:'none',border:'.5px dashed var(--border2)',borderRadius:'var(--rs)',fontSize:13,color:'var(--text3)',cursor:'pointer'}}>
              ＋ リストにないメニューを追加
            </button>
          ) : (
            <div style={{background:'var(--surface2)',borderRadius:'var(--rs)',padding:12}}>
              <div style={{fontSize:11,color:'var(--text3)',marginBottom:8,fontWeight:500}}>新しいメニューを登録（次回から候補に出ます）</div>
              <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="料理名 *" style={{width:'100%',padding:'8px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none',marginBottom:6}}/>
              <input value={customIngs} onChange={e=>setCustomIngs(e.target.value)} placeholder="食材（カンマ区切り）" style={{width:'100%',padding:'8px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none',marginBottom:8}}/>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>{setAddingCustom(false);setCustomName('');setCustomIngs('')}} style={{flex:1,padding:'8px',background:'var(--surface)',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',color:'var(--text2)'}}>キャンセル</button>
                <button onClick={saveCustom} style={{flex:1,padding:'8px',background:'var(--green)',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',color:'#fff',fontWeight:500}}>登録して追加</button>
              </div>
            </div>
          )}
        </div>

        {/* 履歴 */}
        {filteredHist.length > 0 && (
          <div>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8}}>履歴</div>
            {filteredHist.map((m,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',padding:'10px 6px',borderBottom:'.5px solid var(--border)',cursor:'pointer'}}
                onClick={()=>{onAdd({name:m.name,ings:m.ings||[]});addHistory(m);setHistList(getHistory())}}
                onTouchEnd={e=>{e.preventDefault();onAdd({name:m.name,ings:m.ings||[]});addHistory(m);setHistList(getHistory())}}
                onTouchStart={e=>e.currentTarget.style.background='var(--surface2)'}
                onTouchEnd={e=>e.currentTarget.style.background=''}
              >
                <span style={{flex:1,fontSize:13}}>{m.name}</span>
                <button
                  onClick={e=>deleteHist(m.name,e)}
                  style={{fontSize:11,color:'var(--text3)',padding:'3px 7px',borderRadius:'var(--rs)',border:'.5px solid var(--border)',background:'none',cursor:'pointer',marginRight:6}}
                >削除</button>
                <span style={{fontSize:18,color:'var(--green)',fontWeight:300,padding:'0 4px'}}>＋</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッター */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,padding:'10px 14px',paddingBottom:'calc(10px + env(safe-area-inset-bottom))',background:'var(--surface)',borderTop:'.5px solid var(--border)'}}>
        <button onClick={handleDone} style={{
          width:'100%',padding:'13px',border:'none',borderRadius:'var(--rs)',fontSize:14,fontWeight:600,cursor:'pointer',transition:'background .2s',
          background:doneAnim?'#52B788':'var(--green)',color:'#fff',
        }}>
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
export default function MealPlan({ data, onUpdate, onAddToList, staples }) {
  const dates     = getDisplayDates()
  const meals     = data?.meals     || {}
  // Myセット：Firebase保存 or localStorageフォールバック
  const mySets    = (data?.mySets && data.mySets.length > 0)
    ? data.mySets
    : getMySetsLocal().length > 0 ? getMySetsLocal() : DEFAULT_MYSETS

  const rowRefs   = useRef([])

  const [inputTarget, setInputTarget] = useState(null)

  useEffect(() => {
    const el = rowRefs.current[TODAY_IDX]
    if (el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),100)
  }, [])

  const getList = (key) => { const v=meals[key]; return Array.isArray(v)?v:v?[v]:[] }

  const addMeal = (key, meal) => {
    const excluded  = getExcludedIngs(meal.name)
    // カスタム食材があればそちらを優先
    const baseIngs  = resolveIngs(meal.name, meal.ings || [])
    const addIngs   = baseIngs.filter(ing => !excluded.includes(ing))
    if (addIngs.length > 0) onAddToList(addIngs, meal.name)
    // mealオブジェクトにも最新の食材を反映
    const mealToSave = { ...meal, ings: baseIngs }
    onUpdate({ meals:{...meals,[key]:[...getList(key), mealToSave]} })
  }
  const removeMeal = (key, idx) => {
    const list = getList(key).filter((_,i)=>i!==idx)
    const next = {...meals}
    if (list.length===0) delete next[key]; else next[key]=list
    onUpdate({meals:next})
  }

  return (
    <>
      <div style={{paddingBottom:80}}>
        <div style={{display:'flex',flexDirection:'column'}}>
          {dates.map((date,di) => {
            const today   = isToday(date)
            const past    = di < TODAY_IDX
            const dateStr = `${date.getMonth()+1}/${date.getDate()}`
            const dayFull = DAY_FULL[date.getDay()]

            return (
              <div key={di} style={{display:'flex',alignItems:'stretch',borderBottom:'.5px solid var(--border)',opacity:past?.6:1}} ref={el=>rowRefs.current[di]=el}>
                {/* 日付ラベル */}
                <div style={{width:52,flexShrink:0,padding:'12px 6px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',gap:2,background:today?'var(--green)':'var(--surface2)',borderRight:'.5px solid var(--border)'}}>
                  <span style={{fontSize:11,fontWeight:600,color:today?'#fff':'var(--text3)'}}>{DAY_SHORT[date.getDay()]}</span>
                  <span style={{fontSize:13,fontWeight:today?700:400,color:today?'#fff':'var(--text)'}}>{dateStr}</span>
                </div>

                {/* 朝昼夜 */}
                <div style={{flex:1,padding:'10px 12px',display:'flex',flexDirection:'column',gap:6}}>
                  {MEALS.map(meal => {
                    const key  = slotKey(date, meal)
                    const list = getList(key)
                    return (
                      <div key={meal} style={{display:'flex',alignItems:'flex-start',gap:7}}>
                        <div style={{fontSize:10,color:'var(--text3)',width:22,flexShrink:0,paddingTop:9,fontWeight:600}}>{meal}</div>
                        <div style={{flex:1,minWidth:0}}>
                          {list.length>0 && (
                            <div style={{display:'flex',flexDirection:'column',gap:3,marginBottom:3}}>
                              {list.map((m,i)=>(
                                <div key={i} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 10px',background:'var(--green-l)',borderRadius:'var(--rs)',cursor:'pointer'}}
                                  onClick={()=>setInputTarget({key,dayLabel:dayFull,mealLabel:meal})}>
                                  <span style={{flex:1,fontSize:13,fontWeight:500,color:'var(--green)'}}>🍽 {m.name}</span>
                                  <span onClick={e=>{e.stopPropagation();removeMeal(key,i)}} style={{fontSize:15,color:'var(--text3)',lineHeight:1,padding:'0 2px',cursor:'pointer'}}>×</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={()=>setInputTarget({key,dayLabel:dayFull,mealLabel:meal})}
                            style={{padding:list.length>0?'4px 10px':'7px 10px',fontSize:12,color:'var(--text3)',border:'.5px dashed var(--border2)',borderRadius:'var(--rs)',cursor:'pointer',background:'none',width:'100%',textAlign:'left'}}>
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

      {inputTarget && (
        <InputPage
          dayLabel={inputTarget.dayLabel}
          mealLabel={inputTarget.mealLabel}
          confirmed={getList(inputTarget.key)}
          mySets={mySets}
          staples={staples}
          onAdd={meal=>addMeal(inputTarget.key,meal)}
          onRemove={idx=>removeMeal(inputTarget.key,idx)}
          onDone={()=>setInputTarget(null)}
        />
      )}
    </>
  )
}
