import { useState, useRef, useEffect } from 'react'
import MealInputModal from '../components/MealInputModal'

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
function getExcludedIngs(mealName) {
  try { return (JSON.parse(localStorage.getItem('mealExclusions')||'{}')||{})[mealName]||[] } catch { return [] }
}
const TODAY_IDX = 2

const s = {
  page:    { paddingBottom:80 },
  dayList: { display:'flex', flexDirection:'column' },
  dayRow:  (past) => ({ display:'flex', alignItems:'stretch', borderBottom:'.5px solid var(--border)', opacity:past?.55:1 }),

  // 左: 日付ラベル
  dayLabel: (today) => ({
    width:52, flexShrink:0, padding:'12px 6px',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start',
    gap:2, background: today?'var(--green)':'var(--surface2)',
    borderRight:'.5px solid var(--border)',
  }),
  dow:  (today) => ({ fontSize:11, fontWeight:600, color:today?'#fff':'var(--text3)' }),
  date: (today) => ({ fontSize:13, fontWeight:today?700:400, color:today?'#fff':'var(--text)' }),

  // 右: 献立
  dayContent: { flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 },
  slotRow:    { display:'flex', alignItems:'flex-start', gap:7 },
  lbl:        { fontSize:10, color:'var(--text3)', width:22, flexShrink:0, paddingTop:9, fontWeight:600 },
  inner:      { flex:1, minWidth:0 },

  // 入力済みチップ
  chipArea:   { display:'flex', flexDirection:'column', gap:4 },
  chip:       { display:'flex', alignItems:'center', gap:5, padding:'7px 10px', background:'var(--green-l)', borderRadius:'var(--rs)', cursor:'pointer' },
  chipName:   { flex:1, fontSize:13, fontWeight:500, color:'var(--green)' },
  chipDel:    { fontSize:15, color:'var(--text3)', lineHeight:1, padding:'0 2px', cursor:'pointer' },

  // 追加ボタン
  addBtn: (hasItem) => ({
    padding: hasItem?'5px 10px':'7px 10px',
    fontSize:12, color:'var(--text3)',
    border:'.5px dashed var(--border2)', borderRadius:'var(--rs)',
    cursor:'pointer', background:'none', width:'100%', textAlign:'left',
    marginTop: hasItem?3:0,
  }),
}

export default function MealPlan({ data, onUpdate, onAddToList, staples }) {
  const dates     = getDisplayDates()
  const meals     = data?.meals     || {}
  const templates = data?.templates || DEFAULT_TEMPLATES
  const rowRefs   = useRef([])

  // モーダルの状態
  const [modal, setModal] = useState(null) // { key, dayLabel, mealLabel }

  useEffect(() => {
    const el = rowRefs.current[TODAY_IDX]
    if (el) setTimeout(() => el.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
  }, [])

  // slotのmealsリストを取得（常に配列で）
  const getList = (key) => {
    const v = meals[key]
    return Array.isArray(v) ? v : v ? [v] : []
  }

  // 料理を追加
  const addMeal = (key, meal) => {
    const list = getList(key)
    const excluded = getExcludedIngs(meal.name)
    const addIngs  = (meal.ings||[]).filter(ing => !excluded.includes(ing))
    if (addIngs.length > 0) onAddToList(addIngs, meal.name)
    onUpdate({ meals:{ ...meals, [key]:[...list, meal] } })
  }

  // 料理を削除
  const removeMeal = (key, idx) => {
    const list = getList(key).filter((_,i)=>i!==idx)
    const next = { ...meals }
    if (list.length===0) delete next[key]; else next[key]=list
    onUpdate({ meals:next })
  }

  // モーダルを開く
  const openModal = (key, dayLabel, mealLabel) => setModal({ key, dayLabel, mealLabel })
  const closeModal = () => setModal(null)

  return (
    <div style={s.page}>
      <div style={s.dayList}>
        {dates.map((date, di) => {
          const today   = isToday(date)
          const past    = di < TODAY_IDX
          const dateStr = `${date.getMonth()+1}/${date.getDate()}`
          const dow     = DAY_SHORT[date.getDay()]
          const dayFull = DAY_FULL[date.getDay()]

          return (
            <div key={di} style={s.dayRow(past)} ref={el => rowRefs.current[di]=el}>
              {/* 左: 日付 */}
              <div style={s.dayLabel(today)}>
                <span style={s.dow(today)}>{dow}</span>
                <span style={s.date(today)}>{dateStr}</span>
              </div>

              {/* 右: 朝昼夜 */}
              <div style={s.dayContent}>
                {MEALS.map(meal => {
                  const key  = slotKey(date, meal)
                  const list = getList(key)
                  return (
                    <div key={meal} style={s.slotRow}>
                      <div style={s.lbl}>{meal}</div>
                      <div style={s.inner}>
                        {list.length > 0 && (
                          <div style={s.chipArea}>
                            {list.map((m, i) => (
                              <div key={i} style={s.chip} onClick={() => openModal(key, dayFull, meal)}>
                                <span style={s.chipName}>🍽 {m.name}</span>
                                <span style={s.chipDel} onClick={e => { e.stopPropagation(); removeMeal(key, i) }}>×</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <button style={s.addBtn(list.length>0)} onClick={() => openModal(key, dayFull, meal)}>
                          ＋ {list.length>0 ? 'もう一品' : '料理を追加'}
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

      {/* 入力モーダル */}
      {modal && (
        <MealInputModal
          dayLabel={modal.dayLabel}
          mealLabel={modal.mealLabel}
          confirmed={getList(modal.key)}
          templates={templates}
          staples={staples}
          onAdd={(meal) => addMeal(modal.key, meal)}
          onRemove={(idx) => removeMeal(modal.key, idx)}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
