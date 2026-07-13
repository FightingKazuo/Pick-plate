import { useState, useEffect, useRef } from 'react'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

const s = {
  wrap: { position: 'relative' },
  input: {
    width: '100%', padding: '10px 12px',
    border: '.5px solid var(--border2)', borderRadius: 'var(--rs)',
    fontSize: 14, background: 'var(--surface)', color: 'var(--text)',
    outline: 'none', transition: 'border-color .15s',
  },
  inputFocus: { borderColor: 'var(--green)' },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    background: 'var(--surface)', border: '.5px solid var(--border)',
    borderRadius: 'var(--r)', boxShadow: 'var(--sh2)',
    zIndex: 50, overflow: 'hidden', maxHeight: 280, overflowY: 'auto',
  },
  item: {
    padding: '10px 14px', cursor: 'pointer',
    borderBottom: '.5px solid var(--border)',
    transition: 'background .1s',
  },
  itemHover: { background: 'var(--green-l)' },
  itemName: { fontSize: 14, fontWeight: 500, color: 'var(--text)' },
  itemIngs: { fontSize: 11, color: 'var(--text3)', marginTop: 2 },
  loading: { padding: '10px 14px', fontSize: 12, color: 'var(--text3)' },
  aiLabel: {
    fontSize: 10, background: 'var(--green-l)', color: 'var(--green)',
    borderRadius: 4, padding: '1px 5px', marginLeft: 6,
  },
}

export default function RecipeSuggest({ value, onChange, onSelect, placeholder }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hoverId, setHoverId] = useState(null)
  const timerRef = useRef(null)
  const geminiKey = localStorage.getItem('geminiKey') || ''

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    if (!query || query.length < 1) { setSuggestions([]); return }

    // ローカルDBをまず即時表示
    const local = searchRecipes(query)
    setSuggestions(local)

    // Gemini APIで追加サジェスト（デバウンス600ms）
    if (geminiKey) {
      clearTimeout(timerRef.current)
      setLoading(true)
      timerRef.current = setTimeout(async () => {
        const ai = await fetchGeminiSuggestions(query, geminiKey)
        // ローカルDBにない名前だけ追加
        const localNames = new Set(local.map(r => r.name))
        const merged = [
          ...local,
          ...ai.filter(r => !localNames.has(r.name)).map(r => ({ ...r, fromAI: true }))
        ]
        setSuggestions(merged)
        setLoading(false)
      }, 600)
    }
    return () => clearTimeout(timerRef.current)
  }, [query, geminiKey])

  const handleChange = (e) => {
    const v = e.target.value
    setQuery(v)
    onChange?.(v)
  }

  const handleSelect = (recipe) => {
    setQuery(recipe.name)
    onChange?.(recipe.name)
    onSelect?.(recipe)
    setSuggestions([])
    setFocused(false)
  }

  const showDropdown = focused && suggestions.length > 0

  return (
    <div style={s.wrap}>
      <input
        style={{ ...s.input, ...(focused ? s.inputFocus : {}) }}
        value={query}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder || '料理名を入力（例：鮭、唐揚げ）'}
      />
      {showDropdown && (
        <div style={s.dropdown}>
          {loading && <div style={s.loading}>✨ Geminiで検索中...</div>}
          {suggestions.map((r, i) => (
            <div
              key={i}
              style={{ ...s.item, ...(hoverId === i ? s.itemHover : {}), borderBottom: i === suggestions.length - 1 ? 'none' : undefined }}
              onMouseEnter={() => setHoverId(i)}
              onMouseLeave={() => setHoverId(null)}
              onMouseDown={() => handleSelect(r)}
            >
              <div style={s.itemName}>
                {r.name}
                {r.fromAI && <span style={s.aiLabel}>AI</span>}
              </div>
              {r.ings && (
                <div style={s.itemIngs}>{r.ings.slice(0, 5).join('・')}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
