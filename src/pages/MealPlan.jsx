import { useState, useRef, useEffect, useCallback } from 'react'
import RecipeSuggest from '../components/RecipeSuggest'

const DAY_SHORT = ['日','月','火','水','木','金','土']
const DAY_FULL  = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
const MEALS     = ['朝','昼','夜']

export const DEFAULT_TEMPLATES = [
  { id:1, name:'ヨーグルト', skipList:true,  ings:[] },
  { id:2, name:'豆腐',       skipList:true,  ings:['豆腐'] },
  { id:3, name:'トースト',   skipList:false, ings:['食パン','バター'] },
  { id:4, name:'おにぎり',   skipList:false, ings:[] },
  { id:5, name:'目玉焼き',   skipList:false, ings:['卵'] },
]

// 今日を基準に -2〜+4 の7日間を生成
function getDisplayDates() {
  const today = new Date()
  const base  = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Array.from({length:7}, (_,i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i - 2) // -2〜+4
    return d
  })
}

function slotKey(date, meal) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}-${meal}`
}

function isToday(date) {
  const t = new Date()
  return date.getFullYear() === t.getFullYear() &&
         date.getMonth()    === t.getMonth()    &&
         date.getDate()     === t.getDate()
}

// 今日が7日リストの何番目か（常に2番目 = index 2）
const TODAY_IDX = 2

const s = {
  page:     { paddingBottom:80 },

  // 縦一列の日付リスト
  dayList:  { display:'flex', flexDirection:'column' },
  dayRow:   (active, past) => ({
    display:'flex', alignItems:'stretch',
    borderBottom:'.5px solid var(--border)',
    opacity: past ? 0.6 : 1,
    transition:'opacity .15s',
  }),

  // 左の日付ラベル列
  dayLabel: (active, today) => ({
    width:56, flexShrink:0, padding:'14px 10px',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start',
    gap:3, cursor:'pointer',
    background: active ? 'var(--green)' : today ? 'var(--green-l)' : 'var(--surface2)',
    borderRight:'.5px solid var(--border)',
    transition:'background .15s',
  }),
  dayLabelDow: (active, today) => ({
    fontSize:11, fontWeight:600,
    color: active ? '#fff' : today ? 'var(--green)' : 'var(--text3)',
  }),
  dayLabelDate: (active) => ({
    fontSize:13, fontWeight: active?700:400,
    color: active ? '#fff' : 'var(--text)',
  }),
  todayDot: {
    width:5, height:5, borderRadius:'50%', background:'var(--green)', marginTop:2,
  },

  // 右の献立エリア
  dayContent: { flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 },

  slotRow:  { display:'flex', alignItems:'flex-start', gap:7 },
  lbl:      { fontSize:10, color:'var(--text3)', width:22, flexShrink:0, paddingTop:9, fontWeight:600 },
  inner:    { flex:1, minWidth:0, position:'relative' },

  // 折りたたみ（非選択日）
  collapsed:{ display:'flex', flexWrap:'wrap', gap:5, padding:'10px 0 6px' },
  collChip: { fontSize:12, color:'var(--text2)', padding:'3px 8px', borderRadius:4, background:'var(--surface2)' },
  emptyHint:{ fontSize:12, color:'var(--text3)', padding:'10px 0 6px', fontStyle:'italic' },

  // 入力済みチップ
  chip:     { display:'flex', alignItems:'center', gap:5, padding:'7px 10px', background:'var(--green-l)', borderRadius:'var(--rs)' },
  chipName: { flex:1, fontSize:13, fontWeight:500, color:'var(--green)' },
  chipDel:  { fontSize:15, color:'var(--text3)', lineHeight:1, padding:'0 2px', cursor:'pointer', flexShrink:0 },
  chipEdit: { fontSize:11, color:'var(--text3)', lineHeight:1, padding:'0 3px', cursor:'pointer', flexShrink:0 },
  skipBadge:{ fontSize:9, background:'rgba(0,0,0,.06)', color:'var(--text3)', borderRadius:4, padding:'1px 5px', marginLeft:3, verticalAlign:'middle' },
  aiBadge:  { fontSize:9, background:'var(--green-l)', color:'var(--green)', borderRadius:4, padding:'1px 5px', marginLeft:3, verticalAlign:'middle' },

  // 食材パネル
  ingPanel: { marginTop:5, padding:'8px 10px', background:'var(--surface)', border:'.5px solid var(--border)', borderRadius:'var(--rs)' },
  ingTitle: { fontSize:10, color:'var(--text3)', marginBottom:4, display:'flex', justifyContent:'space-between' },
  ingList:  { display:'flex', flexWrap:'wrap', gap:3 },
  ingTag:   (staple) => ({ fontSize:11, padding:'2px 6px', borderRadius:4, background: staple?'var(--surface2)':'var(--green-l)', color: staple?'var(--text3)':'var(--green)' }),

  // 空スロット
  empty:    { padding:'7px 10px', fontSize:12, color:'var(--text3)', border:'.5px dashed var(--border2)', borderRadius:'var(--rs)', cursor:'pointer', minHeight:34, display:'flex', alignItems:'center' },

  // 朝テンプレ
  tmplWrap: { display:'flex', flexDirection:'column', gap:5 },
  tmplRow:  { display:'flex', flexWrap:'wrap', gap:4 },
  tmplBtn:  { padding:'5px 11px', borderRadius:20, border:'none', fontSize:12, cursor:'pointer', background:'var(--surface2)', color:'var(--text2)', flexShrink:0 },
}

function IngPanel({ ings, staples }) {
  if (!ings?.length) return <div style={{...s.ingPanel, color:'var(--text3)', fontSize:12}}>食材情報なし</div>
  return (
    <div style={s.ingPanel}>
      <div style={s.ingTitle}><span>食材一覧</span><span>🟢 買うもの　グレー＝常備品</span></div>
      <div style={s.ingList}>
        {ings.map((ing,i) => {
          const isSt = staples?.some(st => ing.includes(st) || st.includes(ing))
          return <span key={i} style={s.ingTag(isSt)}>{isSt?'':' 🛒'}{ing}</span>
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
        <span style={s.chipName} onClick={() => setShowIngs(v=>!v)}>
          {assigned.skipList ? '⬜' : '🍽'} {assigned.name}
          {assigned.skipList && <span style={s.skipBadge}>リスト不要</span>}
          {assigned.ings?.length > 0 && <span style={s.aiBadge}>{showIngs?'▲':'▼'}</span>}
        </span>
        <span style={s.chipDel} onClick={() => { onRemove(key); setShowIngs(false) }}>×</span>
      </div>
      {showIngs && <IngPanel ings={assigned.ings} staples={staples} />}
    </div>
  )

  if (!open) return <div style={s.empty} onClick={() => setOpen(true)}>＋ 朝ごはんを選ぶ</div>

  return (
    <div style={s.tmplWrap}>
      <div style={s.tmplRow}>
        {templates.map(t => (
          <button key={t.id} style={s.tmplBtn} onClick={() => { onSelect(key,t); setOpen(false) }}>{t.name}</button>
        ))}
        <button style={{...s.tmplBtn, color:'var(--text3)'}} onClick={() => setOpen(false)}>✕</button>
      </div>
      <div style={{position:'relative', zIndex:300}}>
        <RecipeSuggest value="" onChange={() => {}} placeholder="その他を入力..."
          onSelect={(r) => { onSelect(key,{name:r.name,ings:r.ings||[],skipList:false}); setOpen(false) }} />
      </div>
    </div>
  )
}

// 昼・夜スロット
function MealSlot({ assigned, slotKey:key, staples, onSelect, onEdit, onRemove, isEditing }) {
  const [showIngs, setShowIngs] = useState(false)

  if (isEditing) return (
    <div style={{position:'relative', zIndex:300}}>
      <RecipeSuggest value={assigned?.name||''} onChange={() => {}} placeholder="料理名を入力..."
        onSelect={(r) => onSelect(key,r)} />
    </div>
  )
  if (assigned) return (
    <div>
      <div style={s.chip}>
        <span style={s.chipName} onClick={() => setShowIngs(v=>!v)}>
          🍽 {assigned.name}
          {assigned.ings?.length > 0 && <span style={s.aiBadge}>{showIngs?'▲':'▼'} 食材</span>}
        </span>
        <span style={s.chipEdit} onClick={() => onEdit(key)}>✏️</span>
        <span style={s.chipDel} onClick={() => { onRemove(key); setShowIngs(false) }}>×</span>
      </div>
      {showIngs && <IngPanel ings={assigned.ings} staples={staples} />}
    </div>
  )
  return <div style={s.empty} onClick={() => onEdit(key)}>＋ 料理を追加</div>
}

export default function MealPlan({ data, onUpdate, onAddToList, staples }) {
  const [activeIdx,   setActiveIdx]   = useState(TODAY_IDX) // 常にtoday=2番目
  const [editingSlot, setEditingSlot] = useState(null)
  const pageRef  = useRef(null)
  const rowRefs  = useRef([])

  const dates     = getDisplayDates()
  const meals     = data?.meals     || {}
  const templates = data?.templates || DEFAULT_TEMPLATES

  // 起動時に当日行へスクロール
  useEffect(() => {
    const el = rowRefs.current[TODAY_IDX]
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' })
  }, [])

  const setMeal    = (key, val) => onUpdate({ meals:{...meals,[key]:val} })
  const removeMeal = (key) => { const n={...meals}; delete n[key]; onUpdate({meals:n}) }

  const handleTmplSelect = (key, tmpl) => {
    setMeal(key,{name:tmpl.name,ings:tmpl.ings||[],skipList:tmpl.skipList})
    if (!tmpl.skipList && tmpl.ings?.length > 0) onAddToList(tmpl.ings, tmpl.name)
  }
  const handleRecipeSelect = (key, recipe) => {
    setMeal(key,{name:recipe.name,ings:recipe.ings||[],skipList:false})
    if (recipe.ings?.length > 0) onAddToList(recipe.ings, recipe.name)
    setEditingSlot(null)
  }

  return (
    <div style={s.page} ref={pageRef}>
      <div style={s.dayList}>
        {dates.map((date, di) => {
          const active  = di === activeIdx
          const today   = isToday(date)
          const past    = di < TODAY_IDX
          const dateStr = `${date.getMonth()+1}/${date.getDate()}`
          const dow     = DAY_SHORT[date.getDay()]
          const dayMeals= MEALS.map(m => ({m, v:meals[slotKey(date,m)]})).filter(x=>x.v)

          return (
            <div key={di} style={s.dayRow(active, past)} ref={el => rowRefs.current[di] = el}>

              {/* 左: 日付ラベル */}
              <div style={s.dayLabel(active, today)} onClick={() => { setActiveIdx(di); setEditingSlot(null) }}>
                <span style={s.dayLabelDow(active, today)}>{dow}</span>
                <span style={s.dayLabelDate(active)}>{dateStr}</span>
                {today && !active && <div style={s.todayDot} />}
              </div>

              {/* 右: コンテンツ */}
              <div style={s.dayContent}>
                {active ? (
                  // 選択中 → 朝昼夜スロット展開
                  MEALS.map(meal => {
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
                  })
                ) : (
                  // 非選択 → 入力済みをコンパクト表示
                  dayMeals.length > 0
                    ? <div style={s.collapsed}>
                        {dayMeals.map(({m,v}) => (
                          <span key={m} style={s.collChip}>{m}: {v.name}</span>
                        ))}
                      </div>
                    : <div style={s.emptyHint}>タップして入力</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
