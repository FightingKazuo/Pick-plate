import { useState, useRef, useEffect } from 'react'
import RecipeSuggest from '../components/RecipeSuggest'

const DAY_SHORT = ['日','月','火','水','木','金','土']
const MEALS     = ['朝','昼','夜']

export const DEFAULT_TEMPLATES = [
  { id:1, name:'ヨーグルト', ings:[] },
  { id:2, name:'豆腐',       ings:['豆腐'] },
  { id:3, name:'トースト',   ings:['食パン','バター'] },
  { id:4, name:'目玉焼き',   ings:['卵'] },
  { id:5, name:'おにぎり',   ings:[] },
  { id:6, name:'サラダ',     ings:['レタス','トマト','きゅうり'] },
  { id:7, name:'味噌汁',     ings:['豆腐','わかめ','長ねぎ','味噌'] },
  { id:8, name:'納豆',       ings:['納豆'] },
]

// 今日基準に -2〜+4 の7日間
function getDisplayDates() {
  const today = new Date()
  const base  = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Array.from({length:7}, (_,i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i - 2)
    return d
  })
}

function slotKey(date, meal) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}-${meal}`
}

function isToday(date) {
  const t = new Date()
  return date.getFullYear()===t.getFullYear() && date.getMonth()===t.getMonth() && date.getDate()===t.getDate()
}

const TODAY_IDX = 2

// 料理ごとの除外食材を取得・保存（localStorage）
function getExclusions() {
  try { return JSON.parse(localStorage.getItem('mealExclusions') || '{}') } catch { return {} }
}
function saveExclusions(obj) {
  localStorage.setItem('mealExclusions', JSON.stringify(obj))
}
function getExcludedIngs(mealName) {
  return getExclusions()[mealName] || []
}
function toggleExcludeIng(mealName, ing) {
  const exc = getExclusions()
  const cur = exc[mealName] || []
  if (cur.includes(ing)) {
    exc[mealName] = cur.filter(x => x !== ing)
  } else {
    exc[mealName] = [...cur, ing]
  }
  saveExclusions(exc)
  return exc[mealName]
}

const s = {
  page: { paddingBottom: 100 },

  // 縦一列
  dayList: { display:'flex', flexDirection:'column' },
  dayRow:  (past) => ({
    display:'flex', alignItems:'stretch',
    borderBottom:'.5px solid var(--border)',
    opacity: past ? 0.65 : 1,
  }),

  // 左: 日付ラベル
  dayLabel: (today) => ({
    width:52, flexShrink:0, padding:'12px 6px',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start',
    gap:2, background: today ? 'var(--green)' : 'var(--surface2)',
    borderRight:'.5px solid var(--border)',
  }),
  dow: (today) => ({ fontSize:11, fontWeight:600, color: today?'#fff':'var(--text3)' }),
  date:(today) => ({ fontSize:13, fontWeight:today?700:400, color: today?'#fff':'var(--text)' }),

  // 右: 献立エリア
  dayContent: { flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 },

  slotRow:  { display:'flex', alignItems:'flex-start', gap:7 },
  lbl:      { fontSize:10, color:'var(--text3)', width:22, flexShrink:0, paddingTop:9, fontWeight:600, letterSpacing:'.3px' },
  inner:    { flex:1, minWidth:0, position:'relative' },

  // 入力済みチップ
  mealChip: { background:'var(--green-l)', borderRadius:'var(--rs)', overflow:'hidden', marginBottom:3 },
  chipHead: { display:'flex', alignItems:'center', gap:5, padding:'7px 10px', cursor:'pointer' },
  chipName: { flex:1, fontSize:13, fontWeight:500, color:'var(--green)' },
  chipBadge:(col) => ({ fontSize:9, borderRadius:4, padding:'1px 5px', background: col==='gray'?'rgba(0,0,0,.06)':'var(--green-l)', color: col==='gray'?'var(--text3)':'var(--green)', marginLeft:3, verticalAlign:'middle', flexShrink:0 }),
  chipDel:  { fontSize:15, color:'var(--text3)', lineHeight:1, padding:'0 2px', cursor:'pointer', flexShrink:0 },
  chipEdit: { fontSize:11, color:'var(--text3)', lineHeight:1, padding:'0 3px', cursor:'pointer', flexShrink:0 },

  // 食材パネル
  ingPanel: { padding:'8px 10px 10px', borderTop:'.5px solid rgba(45,106,79,.15)' },
  ingTitle: { fontSize:10, color:'var(--text3)', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' },
  ingList:  { display:'flex', flexWrap:'wrap', gap:5 },
  ingBtn:   (excluded, staple) => ({
    fontSize:11, padding:'3px 8px', borderRadius:20,
    border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3,
    background: excluded ? '#f0f0f0' : staple ? 'var(--surface2)' : 'var(--green-l)',
    color:      excluded ? '#bbb'    : staple ? 'var(--text3)'    : 'var(--green)',
    textDecoration: excluded ? 'line-through' : 'none',
    transition:'all .15s',
  }),

  // 空スロット
  empty:   { padding:'7px 10px', fontSize:12, color:'var(--text3)', border:'.5px dashed var(--border2)', borderRadius:'var(--rs)', cursor:'pointer', minHeight:34, display:'flex', alignItems:'center' },

  // テンプレートドロワー
  tmplDrawer:{ background:'var(--surface2)', borderRadius:'var(--rs)', padding:'10px', marginTop:4 },
  tmplTitle: { fontSize:10, color:'var(--text3)', marginBottom:7, display:'flex', justifyContent:'space-between', alignItems:'center' },
  tmplGrid:  { display:'flex', flexWrap:'wrap', gap:5, marginBottom:7 },
  tmplBtn:   (sel) => ({
    padding:'5px 11px', borderRadius:20, border:'none', fontSize:12, cursor:'pointer', flexShrink:0,
    background: sel?'var(--green)':'var(--surface)',
    color:      sel?'#fff':'var(--text2)',
    fontWeight: sel?500:400,
  }),
  tmplClose: { fontSize:12, color:'var(--text3)', border:'none', background:'none', cursor:'pointer', padding:'2px 6px' },
}

// 食材パネル（除外トグル付き）
function IngPanel({ mealName, ings, staples, onExcludeChange }) {
  const [excluded, setExcluded] = useState(() => getExcludedIngs(mealName))

  const handleToggle = (ing) => {
    const next = toggleExcludeIng(mealName, ing)
    setExcluded([...next])
    onExcludeChange?.()
  }

  if (!ings?.length) return (
    <div style={s.ingPanel}>
      <div style={{fontSize:12, color:'var(--text3)'}}>食材情報なし</div>
    </div>
  )

  return (
    <div style={s.ingPanel}>
      <div style={s.ingTitle}>
        <span>食材（タップで買い物リストから除外）</span>
        <span style={{color:'var(--text3)', fontSize:10}}>取消線=除外</span>
      </div>
      <div style={s.ingList}>
        {ings.map((ing, i) => {
          const isExcluded = excluded.includes(ing)
          const isStaple   = staples?.some(st => ing.includes(st) || st.includes(ing))
          return (
            <button key={i} style={s.ingBtn(isExcluded, isStaple)} onClick={() => handleToggle(ing)}>
              {isExcluded ? '✕ ' : isStaple ? '' : '🛒 '}{ing}
            </button>
          )
        })}
      </div>
      {excluded.length > 0 && (
        <div style={{fontSize:10, color:'var(--text3)', marginTop:6}}>
          ✕ {excluded.join('・')} は次回も自動で除外されます
        </div>
      )}
    </div>
  )
}

// 1つの食事チップ（複数メニューの1つ）
function MealChip({ mealName, assigned, staples, onRemove, onEdit, onExcludeChange }) {
  const [showIngs, setShowIngs] = useState(false)

  return (
    <div style={s.mealChip}>
      <div style={s.chipHead}>
        <span style={s.chipName} onClick={() => setShowIngs(v=>!v)}>
          🍽 {assigned.name}
          {assigned.ings?.length > 0 && (
            <span style={s.chipBadge('green')}>{showIngs?'▲':'▼'} 食材</span>
          )}
        </span>
        <span style={s.chipEdit} onClick={onEdit}>✏️</span>
        <span style={s.chipDel} onClick={onRemove}>×</span>
      </div>
      {showIngs && (
        <IngPanel
          mealName={assigned.name}
          ings={assigned.ings}
          staples={staples}
          onExcludeChange={onExcludeChange}
        />
      )}
    </div>
  )
}

// スロット（朝/昼/夜 共通 — 複数メニュー対応）
function MealSlot({ slotKey:key, assigned, staples, templates, onAddMeal, onRemoveMeal, onEditMeal, onExcludeChange }) {
  const [open,      setOpen]      = useState(false)
  const [editing,   setEditing]   = useState(null) // index
  const [selTmpls,  setSelTmpls]  = useState([])   // 複数テンプレ選択用

  const meals = Array.isArray(assigned) ? assigned : assigned ? [assigned] : []

  const handleTmplToggle = (tmpl) => {
    setSelTmpls(prev =>
      prev.find(t=>t.id===tmpl.id) ? prev.filter(t=>t.id!==tmpl.id) : [...prev, tmpl]
    )
  }

  const confirmTmpls = () => {
    selTmpls.forEach(tmpl => onAddMeal(key, { name:tmpl.name, ings:tmpl.ings||[] }))
    setSelTmpls([])
    setOpen(false)
  }

  const handleRecipeSelect = (recipe) => {
    if (editing !== null) {
      onEditMeal(key, editing, { name:recipe.name, ings:recipe.ings||[] })
      setEditing(null)
    } else {
      onAddMeal(key, { name:recipe.name, ings:recipe.ings||[] })
    }
    setOpen(false)
  }

  return (
    <div>
      {/* 入力済みメニュー一覧 */}
      {meals.map((m, i) => (
        <MealChip
          key={i}
          assigned={m}
          staples={staples}
          onRemove={() => onRemoveMeal(key, i)}
          onEdit={() => { setEditing(i); setOpen(true) }}
          onExcludeChange={onExcludeChange}
        />
      ))}

      {/* 編集中のサジェスト入力 */}
      {open && editing !== null && (
        <div style={{position:'relative', zIndex:300, marginTop:4}}>
          <RecipeSuggest
            value={meals[editing]?.name||''}
            onChange={() => {}}
            onSelect={handleRecipeSelect}
            placeholder="料理名を変更..."
          />
        </div>
      )}

      {/* ＋追加ドロワー */}
      {open && editing === null ? (
        <div style={s.tmplDrawer}>
          <div style={s.tmplTitle}>
            <span>よく使うメニュー（複数選択可）</span>
            <button style={s.tmplClose} onClick={() => { setOpen(false); setSelTmpls([]) }}>✕ 閉じる</button>
          </div>
          <div style={s.tmplGrid}>
            {templates.map(t => (
              <button key={t.id} style={s.tmplBtn(selTmpls.find(x=>x.id===t.id))}
                onClick={() => handleTmplToggle(t)}>
                {selTmpls.find(x=>x.id===t.id) ? '✓ ' : ''}{t.name}
              </button>
            ))}
          </div>
          {selTmpls.length > 0 && (
            <button
              style={{width:'100%', padding:'7px', background:'var(--green)', color:'#fff', border:'none', borderRadius:'var(--rs)', fontSize:13, cursor:'pointer', marginBottom:7}}
              onClick={confirmTmpls}>
              {selTmpls.map(t=>t.name).join('・')} を追加
            </button>
          )}
          {/* その他サジェスト */}
          <div style={{position:'relative', zIndex:300}}>
            <RecipeSuggest
              value="" onChange={() => {}}
              onSelect={handleRecipeSelect}
              placeholder="その他を検索..."
            />
          </div>
        </div>
      ) : editing === null && (
        <div style={{...s.empty, marginTop: meals.length>0?4:0}} onClick={() => setOpen(true)}>
          ＋ {meals.length>0 ? 'もう一品追加' : '料理を追加'}
        </div>
      )}
    </div>
  )
}

export default function MealPlan({ data, onUpdate, onAddToList, staples }) {
  const dates     = getDisplayDates()
  const meals     = data?.meals     || {}
  const templates = data?.templates || DEFAULT_TEMPLATES
  const rowRefs   = useRef([])

  // 起動時に今日へスクロール
  useEffect(() => {
    const el = rowRefs.current[TODAY_IDX]
    if (el) setTimeout(() => el.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
  }, [])

  // meal追加（複数対応）
  const addMeal = (key, meal) => {
    const cur  = meals[key]
    const list = Array.isArray(cur) ? cur : cur ? [cur] : []
    // 除外食材を除いてリストに追加
    const excluded = getExcludedIngs(meal.name)
    const addIngs  = (meal.ings||[]).filter(ing => !excluded.includes(ing))
    if (addIngs.length > 0) onAddToList(addIngs, meal.name)
    onUpdate({ meals:{ ...meals, [key]:[...list, meal] } })
  }

  // meal削除
  const removeMeal = (key, idx) => {
    const list = Array.isArray(meals[key]) ? meals[key] : meals[key] ? [meals[key]] : []
    const next = list.filter((_,i)=>i!==idx)
    const updated = { ...meals }
    if (next.length === 0) delete updated[key]
    else updated[key] = next
    onUpdate({ meals: updated })
  }

  // meal編集（差し替え）
  const editMeal = (key, idx, newMeal) => {
    const list = Array.isArray(meals[key]) ? meals[key] : meals[key] ? [meals[key]] : []
    const next = list.map((m,i) => i===idx ? newMeal : m)
    onUpdate({ meals:{ ...meals, [key]:next } })
  }

  // 除外食材変更時は何もしない（次回addMeal時に反映される）
  const handleExcludeChange = () => {}

  return (
    <div style={s.page}>
      <div style={s.dayList}>
        {dates.map((date, di) => {
          const today   = isToday(date)
          const past    = di < TODAY_IDX
          const dateStr = `${date.getMonth()+1}/${date.getDate()}`
          const dow     = DAY_SHORT[date.getDay()]

          return (
            <div key={di} style={s.dayRow(past)} ref={el => rowRefs.current[di] = el}>
              {/* 左: 日付 */}
              <div style={s.dayLabel(today)}>
                <span style={s.dow(today)}>{dow}</span>
                <span style={s.date(today)}>{dateStr}</span>
              </div>

              {/* 右: 朝昼夜スロット */}
              <div style={s.dayContent}>
                {MEALS.map(meal => {
                  const key      = slotKey(date, meal)
                  const assigned = meals[key]
                  return (
                    <div key={meal} style={s.slotRow}>
                      <div style={s.lbl}>{meal}</div>
                      <div style={s.inner}>
                        <MealSlot
                          slotKey={key}
                          assigned={assigned}
                          staples={staples}
                          templates={templates}
                          onAddMeal={addMeal}
                          onRemoveMeal={removeMeal}
                          onEditMeal={editMeal}
                          onExcludeChange={handleExcludeChange}
                        />
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
  )
}
