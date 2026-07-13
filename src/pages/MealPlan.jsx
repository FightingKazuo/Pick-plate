import { useState, useRef, useEffect } from 'react'
import RecipeSuggest from '../components/RecipeSuggest'

const DAYS     = ['月','火','水','木','金','土','日']
const DAY_FULL = ['月曜日','火曜日','水曜日','木曜日','金曜日','土曜日','日曜日']
const MEALS    = ['朝','昼','夜']

export const DEFAULT_TEMPLATES = [
  { id:1, name:'ヨーグルト', skipList:true,  ings:[] },
  { id:2, name:'豆腐',       skipList:true,  ings:['豆腐'] },
  { id:3, name:'トースト',   skipList:false, ings:['食パン','バター'] },
  { id:4, name:'おにぎり',   skipList:false, ings:[] },
  { id:5, name:'目玉焼き',   skipList:false, ings:['卵'] },
]

function getWeekDates() {
  const today = new Date()
  const off = today.getDay() === 0 ? -6 : 1 - today.getDay()
  return Array.from({length:7}, (_,i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + off + i)
    return d
  })
}
// キーはゼロ埋めで統一して衝突防止
function slotKey(date, meal) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}-${meal}`
}
function todayIdx() {
  const d = new Date().getDay()
  return d === 0 ? 6 : d - 1
}

// ── スタイル ──
const s = {
  page:      { padding:'14px', paddingBottom:80 },
  dayTabs:   { display:'flex', gap:4, marginBottom:12, overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' },
  dayTab:    (a) => ({ flex:'0 0 auto', padding:'6px 14px', borderRadius:20, border:'none', background: a?'var(--green)':'var(--surface2)', color: a?'#fff':'var(--text2)', fontSize:13, fontWeight: a?500:400, cursor:'pointer', whiteSpace:'nowrap' }),
  card:      { background:'var(--surface)', border:'.5px solid var(--border)', borderRadius:'var(--r)', overflow:'visible', marginBottom:10 },
  cardHd:    { padding:'9px 14px', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:'var(--r) var(--r) 0 0' },
  slots:     { padding:'10px 14px', display:'flex', flexDirection:'column', gap:10 },
  slotRow:   { display:'flex', alignItems:'flex-start', gap:8 },
  lbl:       { fontSize:11, color:'var(--text3)', width:26, flexShrink:0, paddingTop:10, fontWeight:500 },
  inner:     { flex:1, minWidth:0, position:'relative' },

  // 入力済みチップ
  chip:      { display:'flex', alignItems:'center', gap:6, padding:'8px 11px', background:'var(--green-l)', borderRadius:'var(--rs)', cursor:'pointer' },
  chipName:  { flex:1, fontSize:13, fontWeight:500, color:'var(--green)' },
  chipDel:   { fontSize:16, color:'var(--text3)', lineHeight:1, flexShrink:0, padding:'0 2px' },
  chipEdit:  { fontSize:12, color:'var(--text3)', lineHeight:1, flexShrink:0, padding:'0 4px' },
  skipBadge: { fontSize:9, background:'rgba(0,0,0,.06)', color:'var(--text3)', borderRadius:4, padding:'1px 5px', marginLeft:4, verticalAlign:'middle' },
  aiBadge:   { fontSize:9, background:'var(--green-l)', color:'var(--green)', borderRadius:4, padding:'1px 5px', marginLeft:4, verticalAlign:'middle' },

  // 食材パネル
  ingPanel:  { marginTop:6, padding:'9px 11px', background:'var(--surface)', border:'.5px solid var(--border)', borderRadius:'var(--rs)' },
  ingTitle:  { fontSize:10, color:'var(--text3)', marginBottom:5, display:'flex', justifyContent:'space-between' },
  ingList:   { display:'flex', flexWrap:'wrap', gap:4 },
  ingTag:    (staple) => ({ fontSize:11, padding:'2px 7px', borderRadius:5, background: staple?'var(--surface2)':'var(--green-l)', color: staple?'var(--text3)':'var(--green)' }),

  // 空スロット
  empty:     { padding:'8px 11px', fontSize:12, color:'var(--text3)', border:'.5px dashed var(--border2)', borderRadius:'var(--rs)', cursor:'pointer', minHeight:36, display:'flex', alignItems:'center' },

  // 朝テンプレ
  tmplWrap:  { display:'flex', flexDirection:'column', gap:6 },
  tmplRow:   { display:'flex', flexWrap:'wrap', gap:5 },
  tmplBtn:   { padding:'6px 13px', borderRadius:20, border:'none', fontSize:12, cursor:'pointer', background:'var(--surface2)', color:'var(--text2)', flexShrink:0 },

  // 週まとめ
  sec:       { fontSize:10, fontWeight:500, color:'var(--text3)', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:8 },
  sumCard:   { marginBottom:6, background:'var(--surface)', border:'.5px solid var(--border)', borderRadius:'var(--rs)', overflow:'hidden' },
  sumHead:   { padding:'9px 12px', background:'var(--surface2)', fontSize:12, fontWeight:500, color:'var(--text2)', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' },
  sumBody:   { padding:'9px 12px', display:'flex', flexDirection:'column', gap:5 },
  sumRow:    { display:'flex', gap:8, alignItems:'center' },
  sumLbl:    { fontSize:10, color:'var(--text3)', width:24, flexShrink:0 },
}

function IngPanel({ ings, staples }) {
  if (!ings?.length) return <div style={{...s.ingPanel, color:'var(--text3)', fontSize:12}}>食材情報なし</div>
  return (
    <div style={s.ingPanel}>
      <div style={s.ingTitle}>
        <span>食材一覧</span>
        <span>🟢 買うもの　グレー = 常備品</span>
      </div>
      <div style={s.ingList}>
        {ings.map((ing,i) => {
          const isStaple = staples?.some(s => ing.includes(s) || s.includes(ing))
          return <span key={i} style={s.ingTag(isStaple)}>{isStaple ? '' : '🛒 '}{ing}</span>
        })}
      </div>
    </div>
  )
}

// 朝スロット
function MorningSlot({ assigned, slotKey:key, templates, staples, onSelect, onRemove }) {
  const [open, setOpen]         = useState(false)
  const [showIngs, setShowIngs] = useState(false)

  if (assigned) return (
    <div>
      <div style={s.chip}>
        <span style={s.chipName} onClick={() => setShowIngs(v => !v)}>
          {assigned.skipList ? '⬜' : '🍽'} {assigned.name}
          {assigned.skipList && <span style={s.skipBadge}>リスト不要</span>}
          {assigned.ings?.length > 0 && <span style={s.aiBadge}>{showIngs ? '▲' : '▼'}</span>}
        </span>
        <span style={s.chipDel} onClick={() => { onRemove(key); setShowIngs(false) }}>×</span>
      </div>
      {showIngs && <IngPanel ings={assigned.ings} staples={staples} />}
    </div>
  )

  if (!open) return (
    <div style={s.empty} onClick={() => setOpen(true)}>＋ 朝ごはんを選ぶ</div>
  )

  return (
    <div style={s.tmplWrap}>
      <div style={s.tmplRow}>
        {templates.map(t => (
          <button key={t.id} style={s.tmplBtn}
            onClick={() => { onSelect(key, t); setOpen(false) }}>
            {t.name}
          </button>
        ))}
        <button style={{...s.tmplBtn, color:'var(--text3)'}} onClick={() => setOpen(false)}>✕ 閉じる</button>
      </div>
      {/* その他入力 — z-indexを上げてサジェストが確実に表示されるように */}
      <div style={{ position:'relative', zIndex:100 }}>
        <RecipeSuggest
          value="" onChange={() => {}}
          onSelect={(r) => { onSelect(key, { name:r.name, ings:r.ings||[], skipList:false }); setOpen(false) }}
          placeholder="その他を入力..."
        />
      </div>
    </div>
  )
}

// 昼・夜スロット
function MealSlot({ assigned, slotKey:key, staples, onSelect, onEdit, onRemove, isEditing }) {
  const [showIngs, setShowIngs] = useState(false)

  if (isEditing) return (
    // z-indexを高くしてドロップダウンが他要素に隠れないようにする
    <div style={{ position:'relative', zIndex:200 }}>
      <RecipeSuggest
        value={assigned?.name || ''} onChange={() => {}}
        onSelect={(r) => onSelect(key, r)}
        placeholder="料理名を入力（例：鮭のホイル焼き）"
      />
    </div>
  )

  if (assigned) return (
    <div>
      <div style={s.chip}>
        <span style={s.chipName} onClick={() => setShowIngs(v => !v)}>
          🍽 {assigned.name}
          {assigned.ings?.length > 0 && <span style={s.aiBadge}>{showIngs ? '▲' : '▼'} 食材</span>}
        </span>
        <span style={s.chipEdit} onClick={() => onEdit(key)}>✏️</span>
        <span style={s.chipDel} onClick={() => { onRemove(key); setShowIngs(false) }}>×</span>
      </div>
      {showIngs && <IngPanel ings={assigned.ings} staples={staples} />}
    </div>
  )

  return <div style={s.empty} onClick={() => onEdit(key)}>＋ 料理を追加</div>
}

// 週まとめのアコーディオンカード
function SumDayCard({ dayLabel, dayMeals, staples }) {
  const [open, setOpen]           = useState(false)
  const [expandedMeal, setExpMeal]= useState(null)
  return (
    <div style={s.sumCard}>
      <div style={s.sumHead} onClick={() => setOpen(v => !v)}>
        <span>{dayLabel}</span>
        <span style={{fontSize:11, color:'var(--text3)'}}>
          {dayMeals.map(x => x.v.name).join('・')}
          <span style={{marginLeft:6}}>{open ? '▲' : '▼'}</span>
        </span>
      </div>
      {open && (
        <div style={s.sumBody}>
          {dayMeals.map(({m,v}) => (
            <div key={m}>
              <div style={s.sumRow}>
                <span style={s.sumLbl}>{m}</span>
                <span style={{flex:1, fontSize:13, cursor: v.ings?.length?'pointer':'default', color: expandedMeal===m?'var(--green)':'var(--text)'}}
                  onClick={() => setExpMeal(expandedMeal===m ? null : m)}>
                  {v.name}
                </span>
                {v.skipList && <span style={s.skipBadge}>リスト不要</span>}
                {v.ings?.length > 0 && <span style={{fontSize:10, color:'var(--text3)'}}>{expandedMeal===m?'▲':'▼'}</span>}
              </div>
              {expandedMeal===m && <div style={{marginLeft:32, marginTop:4}}><IngPanel ings={v.ings} staples={staples} /></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MealPlan({ data, onUpdate, onAddToList, staples }) {
  const [activeDay,   setActiveDay]   = useState(todayIdx())
  const [editingSlot, setEditingSlot] = useState(null)
  const dates     = getWeekDates()
  const meals     = data?.meals     || {}
  const templates = data?.templates || DEFAULT_TEMPLATES
  const tidx      = todayIdx()

  const setMeal    = (key, value) => onUpdate({ meals:{ ...meals, [key]:value } })
  const removeMeal = (key) => { const n={...meals}; delete n[key]; onUpdate({meals:n}) }

  const handleTmplSelect = (key, tmpl) => {
    setMeal(key, { name:tmpl.name, ings:tmpl.ings||[], skipList:tmpl.skipList })
    if (!tmpl.skipList && tmpl.ings?.length > 0) onAddToList(tmpl.ings, tmpl.name)
  }
  const handleRecipeSelect = (key, recipe) => {
    setMeal(key, { name:recipe.name, ings:recipe.ings||[], skipList:false })
    if (recipe.ings?.length > 0) onAddToList(recipe.ings, recipe.name)
    setEditingSlot(null)
  }

  const date    = dates[activeDay]
  const dateStr = `${date.getMonth()+1}月${date.getDate()}日`

  return (
    <div style={s.page}>

      {/* 曜日タブ */}
      <div style={s.dayTabs}>
        {DAYS.map((d,i) => (
          <button key={i} style={s.dayTab(activeDay===i)}
            onClick={() => { setActiveDay(i); setEditingSlot(null) }}>
            {d}{i===tidx && '●'}
          </button>
        ))}
      </div>

      {/* 選択曜日カード — overflow:visible でドロップダウンが隠れないように */}
      <div style={s.card}>
        <div style={s.cardHd}>
          <span style={{fontSize:14, fontWeight:500}}>{DAY_FULL[activeDay]}</span>
          <span style={{fontSize:11, color:'var(--text3)'}}>{dateStr}</span>
        </div>
        <div style={s.slots}>
          {MEALS.map(meal => {
            const key      = slotKey(date, meal)
            const assigned = meals[key]
            return (
              <div key={meal} style={s.slotRow}>
                <div style={s.lbl}>{meal}</div>
                <div style={s.inner}>
                  {meal==='朝'
                    ? <MorningSlot assigned={assigned} slotKey={key} templates={templates} staples={staples} onSelect={handleTmplSelect} onRemove={removeMeal} />
                    : <MealSlot    assigned={assigned} slotKey={key} staples={staples} isEditing={editingSlot===key} onSelect={handleRecipeSelect} onEdit={setEditingSlot} onRemove={removeMeal} />
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 週まとめ */}
      <div style={{marginTop:16}}>
        <div style={s.sec}>今週の献立</div>
        {dates.map((d,di) => {
          const dayMeals = MEALS.map(m => ({m, v:meals[slotKey(d,m)]})).filter(x=>x.v)
          if (!dayMeals.length) return null
          return <SumDayCard key={di} dayLabel={DAY_FULL[di]} dayMeals={dayMeals} staples={staples} />
        })}
      </div>
    </div>
  )
}
