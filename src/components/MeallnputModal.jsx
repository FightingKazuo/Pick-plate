import { useState, useEffect, useRef, useCallback } from 'react'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

// 履歴の取得・保存
function getHistory() {
  try { return JSON.parse(localStorage.getItem('mealHistory') || '[]') } catch { return [] }
}
function addHistory(meal) {
  const cur = getHistory()
  const next = [meal, ...cur.filter(m => m.name !== meal.name)].slice(0, 30)
  localStorage.setItem('mealHistory', JSON.stringify(next))
}

// 除外食材
function getExcludedIngs(mealName) {
  try {
    const exc = JSON.parse(localStorage.getItem('mealExclusions') || '{}')
    return exc[mealName] || []
  } catch { return [] }
}
function toggleExcludeIng(mealName, ing) {
  try {
    const exc = JSON.parse(localStorage.getItem('mealExclusions') || '{}')
    const cur = exc[mealName] || []
    exc[mealName] = cur.includes(ing) ? cur.filter(x => x !== ing) : [...cur, ing]
    localStorage.setItem('mealExclusions', JSON.stringify(exc))
    return exc[mealName]
  } catch { return [] }
}

const s = {
  // オーバーレイ
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
    zIndex: 500, display: 'flex', flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  // モーダル本体（下から出てくるシート）
  sheet: {
    background: 'var(--surface)', borderRadius: '18px 18px 0 0',
    maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 -4px 24px rgba(0,0,0,.15)',
  },
  // ハンドル
  handle: {
    width: 36, height: 4, borderRadius: 2,
    background: 'var(--border2)', margin: '10px auto 0',
    flexShrink: 0,
  },
  // ヘッダー
  header: {
    padding: '10px 16px 12px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '.5px solid var(--border)', flexShrink: 0,
  },
  headerTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  closeBtn: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--surface2)', border: 'none',
    fontSize: 16, color: 'var(--text2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // スクロール本体
  body: { flex: 1, overflowY: 'auto', padding: '12px 14px', paddingBottom: 24 },

  // 確定済みメニュー
  confirmedSection: { marginBottom: 14 },
  confirmedLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 7 },
  confirmedList: { display: 'flex', flexDirection: 'column', gap: 6 },
  confirmedChip: { background: 'var(--green-l)', borderRadius: 'var(--rs)', overflow: 'hidden' },
  confirmedHead: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px' },
  confirmedName: { flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--green)', cursor: 'pointer' },
  confirmedDel: { fontSize: 16, color: 'var(--text3)', cursor: 'pointer', lineHeight: 1, padding: '0 2px' },

  // 食材パネル
  ingPanel: { padding: '8px 10px 10px', borderTop: '.5px solid rgba(45,106,79,.15)' },
  ingLabel: { fontSize: 10, color: 'var(--text3)', marginBottom: 6 },
  ingList: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  ingBtn: (excluded, staple) => ({
    fontSize: 11, padding: '3px 8px', borderRadius: 20,
    border: 'none', cursor: 'pointer',
    background: excluded ? '#eee' : staple ? 'var(--surface2)' : 'var(--green-l)',
    color: excluded ? '#bbb' : staple ? 'var(--text3)' : 'var(--green)',
    textDecoration: excluded ? 'line-through' : 'none',
    transition: 'all .12s',
  }),

  // テンプレート
  tmplSection: { marginBottom: 14 },
  tmplLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 7 },
  tmplGrid: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  tmplBtn: (sel) => ({
    padding: '6px 13px', borderRadius: 20, border: 'none',
    fontSize: 12, cursor: 'pointer', fontWeight: sel ? 500 : 400,
    background: sel ? 'var(--green)' : 'var(--surface2)',
    color: sel ? '#fff' : 'var(--text2)',
    transition: 'all .12s',
  }),
  addTmplBtn: {
    padding: '6px 13px', borderRadius: 20,
    border: '.5px dashed var(--border2)',
    fontSize: 12, cursor: 'pointer', background: 'none',
    color: 'var(--text3)',
  },

  // 検索
  searchSection: { marginBottom: 14 },
  searchLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 7 },
  searchWrap: { position: 'relative' },
  searchInp: {
    width: '100%', padding: '10px 12px',
    border: '.5px solid var(--border2)', borderRadius: 'var(--rs)',
    fontSize: 14, outline: 'none', background: 'var(--surface)',
    color: 'var(--text)',
  },
  searchInpFocus: { borderColor: 'var(--green)' },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    background: 'var(--surface)', border: '.5px solid var(--border)',
    borderRadius: 'var(--r)', boxShadow: '0 8px 24px rgba(0,0,0,.12)',
    zIndex: 600, maxHeight: 260, overflowY: 'auto',
  },
  dropItem: (hov) => ({
    padding: '10px 13px', cursor: 'pointer',
    borderBottom: '.5px solid var(--border)',
    background: hov ? 'var(--green-l)' : 'transparent',
    transition: 'background .1s',
  }),
  dropName: { fontSize: 14, fontWeight: 500 },
  dropIngs: { fontSize: 11, color: 'var(--text3)', marginTop: 2 },
  aiLabel: { fontSize: 9, background: 'var(--green-l)', color: 'var(--green)', borderRadius: 3, padding: '1px 5px', marginLeft: 5 },
  loadRow: { padding: '10px 13px', fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' },

  // 履歴
  histSection: { marginBottom: 8 },
  histLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 7 },
  histItem: (hov) => ({
    display: 'flex', alignItems: 'center', padding: '9px 10px',
    borderRadius: 'var(--rs)', cursor: 'pointer',
    background: hov ? 'var(--surface2)' : 'transparent',
    transition: 'background .1s',
  }),
  histName: { flex: 1, fontSize: 13 },
  histAdd: { fontSize: 13, color: 'var(--green)', fontWeight: 500, padding: '0 4px' },

  // 決定ボタン
  footer: {
    padding: '10px 14px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
    borderTop: '.5px solid var(--border)', flexShrink: 0,
    background: 'var(--surface)',
  },
  doneBtn: {
    width: '100%', padding: '12px', background: 'var(--green)', color: '#fff',
    border: 'none', borderRadius: 'var(--rs)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
}

// 食材除外パネル
function IngPanel({ mealName, ings, staples }) {
  const [excluded, setExcluded] = useState(() => getExcludedIngs(mealName))
  if (!ings?.length) return null
  const toggle = (ing) => {
    const next = toggleExcludeIng(mealName, ing)
    setExcluded([...next])
  }
  return (
    <div style={s.ingPanel}>
      <div style={s.ingLabel}>食材（タップで除外）</div>
      <div style={s.ingList}>
        {ings.map((ing, i) => {
          const isExc = excluded.includes(ing)
          const isSt  = staples?.some(st => ing.includes(st) || st.includes(ing))
          return (
            <button key={i} style={s.ingBtn(isExc, isSt)} onClick={() => toggle(ing)}>
              {isExc ? '✕ ' : isSt ? '' : '🛒 '}{ing}
            </button>
          )
        })}
      </div>
      {excluded.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 5 }}>
          ✕ {excluded.join('・')} は次回も自動除外
        </div>
      )}
    </div>
  )
}

// 検索＋Geminiサジェスト
function SearchBox({ onSelect, staples }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [aiLoad,   setAiLoad]   = useState(false)
  const [focused,  setFocused]  = useState(false)
  const [hovId,    setHovId]    = useState(null)
  const isComposing = useRef(false)
  const dropTouched = useRef(false)
  const timer       = useRef(null)

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); setAiLoad(false); return }
    const local = searchRecipes(query)
    setResults(local)
    const key = localStorage.getItem('geminiKey') || ''
    if (!key || isComposing.current) return
    clearTimeout(timer.current)
    setAiLoad(true)
    timer.current = setTimeout(async () => {
      try {
        const ai = await fetchGeminiSuggestions(query, key)
        const names = new Set(local.map(r => r.name))
        setResults([...local, ...ai.filter(r => !names.has(r.name)).map(r => ({ ...r, fromAI: true }))])
      } catch (e) { console.error(e) }
      finally { setAiLoad(false) }
    }, 600)
    return () => { clearTimeout(timer.current); setAiLoad(false) }
  }, [query])

  const pick = (r) => {
    onSelect(r)
    setQuery('')
    setResults([])
    setFocused(false)
  }

  const showDrop = focused && (results.length > 0 || aiLoad)

  return (
    <div style={s.searchWrap}>
      <input
        style={{ ...s.searchInp, ...(focused ? s.searchInpFocus : {}) }}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={e => {
          isComposing.current = false
          setQuery(e.target.value + ' ')
          setTimeout(() => setQuery(e.target.value), 0)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => {
          if (!dropTouched.current) { setFocused(false); setAiLoad(false) }
          dropTouched.current = false
        }, 300)}
        placeholder="料理名で検索（例：焼きそば）"
      />
      {showDrop && (
        <div style={s.dropdown}
          onTouchStart={() => { dropTouched.current = true }}
          onMouseDown={() => { dropTouched.current = true }}
        >
          {aiLoad && (
            <div style={s.loadRow}>
              {[0,1,2].map(i => <span key={i} style={{ ...s.dot, animation: `pp-pulse 1.2s ${i*.2}s infinite` }} />)}
              <span style={{ marginLeft: 4 }}>Geminiで検索中...</span>
            </div>
          )}
          {results.map((r, i) => (
            <div key={i}
              style={{ ...s.dropItem(hovId===i), borderBottom: i===results.length-1?'none':undefined }}
              onMouseEnter={() => setHovId(i)} onMouseLeave={() => setHovId(null)}
              onMouseDown={() => pick(r)} onTouchEnd={e => { e.preventDefault(); pick(r) }}
            >
              <div style={s.dropName}>{r.name}{r.fromAI && <span style={s.aiLabel}>✨ AI</span>}</div>
              {r.ings?.length > 0 && <div style={s.dropIngs}>{r.ings.slice(0,5).join('・')}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MealInputModal({ dayLabel, mealLabel, confirmed, templates, staples, onAdd, onRemove, onClose }) {
  const [selTmpls,   setSelTmpls]   = useState([])
  const [expandedIdx,setExpIdx]    = useState(null)
  const [hovHist,    setHovHist]   = useState(null)
  const [confirmed2, setConfirmed2]= useState(false) // 登録完了フラグ
  const history = getHistory().slice(0, 15)

  // スワイプ下で閉じる
  const sheetRef    = useRef(null)
  const touchStartY = useRef(0)
  const translateY  = useRef(0)

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY
    translateY.current  = 0
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }, [])

  const handleTouchMove = useCallback((e) => {
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy < 0) return // 上スワイプは無視
    translateY.current = dy
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform .25s ease'
      if (translateY.current > 120) {
        sheetRef.current.style.transform = 'translateY(100%)'
        setTimeout(onClose, 220)
      } else {
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }, [onClose])

  // テンプレ選択
  const toggleTmpl = (t) => setSelTmpls(prev => prev.find(x=>x.id===t.id) ? prev.filter(x=>x.id!==t.id) : [...prev, t])
  const confirmTmpls = () => {
    selTmpls.forEach(t => { onAdd({ name:t.name, ings:t.ings||[] }); addHistory({ name:t.name, ings:t.ings||[] }) })
    setSelTmpls([])
  }

  // 検索選択
  const handleSearchSelect = (recipe) => {
    onAdd({ name:recipe.name, ings:recipe.ings||[] })
    addHistory({ name:recipe.name, ings:recipe.ings||[] })
  }

  // 履歴選択
  const handleHistSelect = (meal) => {
    onAdd({ name:meal.name, ings:meal.ings||[] })
    addHistory(meal)
  }

  // 確定済みリストにないものだけ履歴表示
  const confirmedNames = new Set(confirmed.map(c=>c.name))
  const filteredHist   = history.filter(h => !confirmedNames.has(h.name))

  return (
    <div style={s.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={s.sheet} ref={sheetRef}>
        <div
          style={{ ...s.handle, cursor:'grab', touchAction:'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* ヘッダー */}
        <div style={s.header}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div style={s.headerTitle}>{dayLabel}　{mealLabel}</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 本体 */}
        <div style={s.body}>

          {/* 確定済みメニュー */}
          {confirmed.length > 0 && (
            <div style={s.confirmedSection}>
              <div style={s.confirmedLabel}>追加済み</div>
              <div style={s.confirmedList}>
                {confirmed.map((m, i) => (
                  <div key={i} style={s.confirmedChip}>
                    <div style={s.confirmedHead}>
                      <span style={s.confirmedName} onClick={() => setExpIdx(expandedIdx===i ? null : i)}>
                        🍽 {m.name}
                        {m.ings?.length > 0 && <span style={{ fontSize:9, background:'var(--green-l)', color:'var(--green)', borderRadius:3, padding:'1px 5px', marginLeft:5 }}>{expandedIdx===i?'▲':'▼'} 食材</span>}
                      </span>
                      <span style={s.confirmedDel} onClick={() => { onRemove(i); if(expandedIdx===i) setExpIdx(null) }}>×</span>
                    </div>
                    {expandedIdx===i && <IngPanel mealName={m.name} ings={m.ings} staples={staples} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* テンプレート */}
          <div style={s.tmplSection}>
            <div style={s.tmplLabel}>テンプレート</div>
            <div style={s.tmplGrid}>
              {templates.map(t => (
                <button key={t.id} style={s.tmplBtn(!!selTmpls.find(x=>x.id===t.id))} onClick={() => toggleTmpl(t)}>
                  {selTmpls.find(x=>x.id===t.id) ? '✓ ' : ''}{t.name}
                </button>
              ))}
            </div>
            {selTmpls.length > 0 && (
              <button
                style={{ width:'100%', marginTop:8, padding:'8px', background:'var(--green)', color:'#fff', border:'none', borderRadius:'var(--rs)', fontSize:13, fontWeight:500, cursor:'pointer' }}
                onClick={confirmTmpls}
              >
                {selTmpls.map(t=>t.name).join('・')} を追加
              </button>
            )}
          </div>

          {/* 検索 */}
          <div style={s.searchSection}>
            <div style={s.searchLabel}>料理を検索</div>
            <SearchBox onSelect={handleSearchSelect} staples={staples} />
          </div>

          {/* 履歴 */}
          {filteredHist.length > 0 && (
            <div style={s.histSection}>
              <div style={s.histLabel}>履歴</div>
              {filteredHist.map((m, i) => (
                <div key={i}
                  style={s.histItem(hovHist===i)}
                  onMouseEnter={() => setHovHist(i)} onMouseLeave={() => setHovHist(null)}
                  onClick={() => handleHistSelect(m)}
                >
                  <span style={s.histName}>{m.name}</span>
                  <span style={s.histAdd}>＋</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div style={s.footer}>
          <button style={{
              ...s.doneBtn,
              background: confirmed2 ? '#52B788' : 'var(--green)',
              transition: 'background .2s',
            }}
            onClick={() => {
              if (confirmed.length === 0) { onClose(); return }
              setConfirmed2(true)
              setTimeout(() => { setConfirmed2(false); onClose() }, 800)
            }}
          >
            {confirmed2
              ? `✓ ${confirmed.map(m=>m.name).join('・')} を登録しました`
              : confirmed.length > 0
                ? `${confirmed.map(m=>m.name).join('・')} で確定`
                : '閉じる'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
