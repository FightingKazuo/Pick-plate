import { useState } from 'react'
import RecipeSuggest from '../components/RecipeSuggest'

const DAYS = ['月', '火', '水', '木', '金', '土', '日']
const DAY_FULL = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日']
const MEALS = ['朝', '昼', '夜']

// デフォルトテンプレート（初回起動時に使われる）
export const DEFAULT_TEMPLATES = [
  { id: 1, name: 'ヨーグルト', skipList: true,  ings: [] },
  { id: 2, name: '豆腐',       skipList: true,  ings: ['豆腐'] },
  { id: 3, name: 'トースト',   skipList: false, ings: ['食パン', 'バター'] },
  { id: 4, name: 'おにぎり',   skipList: false, ings: [] },
  { id: 5, name: '目玉焼き',   skipList: false, ings: ['卵', 'サラダ油'] },
]

function getWeekDates() {
  const today = new Date()
  const dow = today.getDay()
  const off = dow === 0 ? -6 : 1 - dow
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + off + i)
    return d
  })
}
function slotKey(date, meal) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${meal}`
}
function todayIdx() {
  const dow = new Date().getDay()
  return dow === 0 ? 6 : dow - 1
}

// ── スタイル ──
const s = {
  page:    { padding: '14px', paddingBottom: 80 },
  dayTabs: { display: 'flex', gap: 4, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' },
  dayTab:  (a) => ({
    flex: '0 0 auto', padding: '6px 13px', borderRadius: 20, border: 'none',
    background: a ? 'var(--green)' : 'var(--surface2)',
    color: a ? '#fff' : 'var(--text2)',
    fontSize: 13, fontWeight: a ? 500 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
  }),
  card:   { background: 'var(--surface)', border: '.5px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 10 },
  cardHd: { padding: '9px 14px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  slots:  { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  row:    { display: 'flex', alignItems: 'flex-start', gap: 8 },
  lbl:    { fontSize: 11, color: 'var(--text3)', width: 26, flexShrink: 0, paddingTop: 9 },
  inner:  { flex: 1 },

  // 入力済み
  chip: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
    background: 'var(--green-l)', borderRadius: 'var(--rs)', cursor: 'pointer' },
  chipName: { flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--green)' },
  chipDel:  { fontSize: 16, color: 'var(--text3)', lineHeight: 1, flexShrink: 0 },
  skipBadge: { fontSize: 9, background: 'var(--surface2)', color: 'var(--text3)',
    borderRadius: 4, padding: '1px 5px', marginLeft: 4 },

  // 空スロット
  emptySlot: { padding: '7px 10px', fontSize: 12, color: 'var(--text3)',
    border: '.5px dashed var(--border2)', borderRadius: 'var(--rs)',
    cursor: 'pointer', minHeight: 34, display: 'flex', alignItems: 'center' },

  // 朝テンプレートドロワー
  tmplWrap: { marginTop: 4 },
  tmplList: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  tmplChip: (sel) => ({
    padding: '5px 11px', borderRadius: 20, border: 'none', fontSize: 12, cursor: 'pointer',
    background: sel ? 'var(--green)' : 'var(--surface2)',
    color: sel ? '#fff' : 'var(--text2)',
    transition: 'all .12s',
  }),

  // 週まとめ
  sec:   { fontSize: 10, fontWeight: 500, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 8 },
  sumCard: { marginBottom: 8, padding: '10px 12px', background: 'var(--surface)',
    border: '.5px solid var(--border)', borderRadius: 'var(--rs)' },
  sumDay:  { fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text2)' },
  sumRow:  { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 },
  sumLbl:  { fontSize: 10, color: 'var(--text3)', width: 24 },
}

// 朝スロット: テンプレ選択 or サジェスト入力
function MorningSlot({ assigned, slotKey: key, templates, onSelect, onRemove }) {
  const [open, setOpen] = useState(false)

  if (assigned) {
    return (
      <div style={s.chip} onClick={() => onRemove(key)}>
        <span style={s.chipName}>
          {assigned.skipList ? '⬜' : '🍽'} {assigned.name}
          {assigned.skipList && <span style={s.skipBadge}>リスト不要</span>}
        </span>
        <span style={s.chipDel}>×</span>
      </div>
    )
  }

  return (
    <div style={s.tmplWrap}>
      {open ? (
        <>
          <div style={s.tmplList}>
            {templates.map(t => (
              <button key={t.id} style={s.tmplChip(false)} onClick={() => { onSelect(key, t); setOpen(false) }}>
                {t.name}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 6 }}>
            <RecipeSuggest
              value=""
              onChange={() => {}}
              onSelect={(r) => { onSelect(key, { name: r.name, ings: r.ings || [], skipList: false }); setOpen(false) }}
              placeholder="その他を入力..."
            />
          </div>
        </>
      ) : (
        <div style={s.emptySlot} onClick={() => setOpen(true)}>
          ＋ 朝ごはんを選ぶ
        </div>
      )}
    </div>
  )
}

// 昼・夜スロット: サジェスト入力
function MealSlot({ assigned, slotKey: key, onSelect, onEdit, onRemove, isEditing }) {
  if (assigned && !isEditing) {
    return (
      <div style={s.chip}>
        <span style={s.chipName} onClick={() => onEdit(key)}>🍽 {assigned.name}</span>
        <span style={s.chipDel} onClick={() => onRemove(key)}>×</span>
      </div>
    )
  }
  if (isEditing) {
    return (
      <RecipeSuggest
        value={assigned?.name || ''}
        onChange={() => {}}
        onSelect={(r) => onSelect(key, r)}
        placeholder="料理名を入力（例：鮭のホイル焼き）"
      />
    )
  }
  return (
    <div style={s.emptySlot} onClick={() => onEdit(key)}>
      ＋ 料理を追加
    </div>
  )
}

export default function MealPlan({ data, onUpdate, onAddToList }) {
  const [activeDay, setActiveDay] = useState(todayIdx())
  const [editingSlot, setEditingSlot] = useState(null)
  const dates = getWeekDates()

  const meals     = data?.meals     || {}
  const templates = data?.templates || DEFAULT_TEMPLATES

  const setMeal = (key, value) => onUpdate({ meals: { ...meals, [key]: value } })
  const removeMeal = (key) => {
    const next = { ...meals }; delete next[key]; onUpdate({ meals: next })
  }

  // テンプレ選択（skipList=true なら食材追加しない）
  const handleTmplSelect = (key, tmpl) => {
    setMeal(key, { name: tmpl.name, ings: tmpl.ings || [], skipList: tmpl.skipList })
    if (!tmpl.skipList && tmpl.ings?.length > 0) onAddToList(tmpl.ings, tmpl.name)
  }

  // レシピサジェスト選択
  const handleRecipeSelect = (key, recipe) => {
    setMeal(key, { name: recipe.name, ings: recipe.ings || [], skipList: false })
    if (recipe.ings?.length > 0) onAddToList(recipe.ings, recipe.name)
    setEditingSlot(null)
  }

  const date    = dates[activeDay]
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
  const tidx    = todayIdx()

  return (
    <div style={s.page}>

      {/* 曜日タブ */}
      <div style={s.dayTabs}>
        {DAYS.map((d, i) => (
          <button key={i} style={s.dayTab(activeDay === i)} onClick={() => { setActiveDay(i); setEditingSlot(null) }}>
            {d}{i === tidx && '●'}
          </button>
        ))}
      </div>

      {/* 選択曜日カード */}
      <div style={s.card}>
        <div style={s.cardHd}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{DAY_FULL[activeDay]}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{dateStr}</span>
        </div>
        <div style={s.slots}>
          {MEALS.map(meal => {
            const key      = slotKey(date, meal)
            const assigned = meals[key]
            return (
              <div key={meal} style={s.row}>
                <div style={s.lbl}>{meal}</div>
                <div style={s.inner}>
                  {meal === '朝'
                    ? <MorningSlot
                        assigned={assigned} slotKey={key}
                        templates={templates}
                        onSelect={handleTmplSelect}
                        onRemove={removeMeal}
                      />
                    : <MealSlot
                        assigned={assigned} slotKey={key}
                        isEditing={editingSlot === key}
                        onSelect={handleRecipeSelect}
                        onEdit={setEditingSlot}
                        onRemove={removeMeal}
                      />
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 今週まとめ */}
      <div style={{ marginTop: 16 }}>
        <div style={s.sec}>今週の献立</div>
        {dates.map((d, di) => {
          const dayMeals = MEALS.map(m => ({ m, v: meals[slotKey(d, m)] })).filter(x => x.v)
          if (!dayMeals.length) return null
          return (
            <div key={di} style={s.sumCard}>
              <div style={s.sumDay}>{DAY_FULL[di]}</div>
              {dayMeals.map(({ m, v }) => (
                <div key={m} style={s.sumRow}>
                  <span style={s.sumLbl}>{m}</span>
                  <span style={{ fontSize: 13 }}>{v.name}</span>
                  {v.skipList && <span style={s.skipBadge}>リスト不要</span>}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
