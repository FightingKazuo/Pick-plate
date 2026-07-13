import { useState, useEffect, useRef, useCallback } from 'react'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

const s = {
  wrap:       { position:'relative' },
  input:      { width:'100%', padding:'10px 12px', border:'.5px solid var(--border2)', borderRadius:'var(--rs)', fontSize:14, background:'var(--surface)', color:'var(--text)', outline:'none', transition:'border-color .15s' },
  inputFocus: { borderColor:'var(--green)' },
  dropdown:   { position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'var(--surface)', border:'.5px solid var(--border)', borderRadius:'var(--r)', boxShadow:'var(--sh2)', zIndex:9999, overflow:'hidden', maxHeight:300, overflowY:'auto' },
  loadRow:    { padding:'9px 14px', fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:6 },
  dot:        { width:5, height:5, borderRadius:'50%', background:'var(--green)', display:'inline-block' },
  item:       { padding:'10px 14px', cursor:'pointer', borderBottom:'.5px solid var(--border)', transition:'background .1s', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 },
  itemHov:    { background:'var(--green-l)' },
  itemName:   { fontSize:14, fontWeight:500, color:'var(--text)' },
  itemIngs:   { fontSize:11, color:'var(--text3)', marginTop:2 },
  aiLabel:    { fontSize:10, background:'var(--green-l)', color:'var(--green)', borderRadius:4, padding:'1px 5px', marginLeft:5, flexShrink:0 },
  noResult:   { padding:'10px 14px', fontSize:12, color:'var(--text3)' },
  errRow:     { padding:'9px 14px', fontSize:11, color:'var(--red)', background:'var(--red-l)' },
}

if (typeof document !== 'undefined' && !document.getElementById('pp-anim')) {
  const st = document.createElement('style')
  st.id = 'pp-anim'
  st.textContent = '@keyframes pp-pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}'
  document.head.appendChild(st)
}

export default function RecipeSuggest({ value, onChange, onSelect, placeholder }) {
  const [query,       setQuery]       = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [aiLoading,   setAiLoading]   = useState(false)
  const [aiError,     setAiError]     = useState('')
  const [focused,     setFocused]     = useState(false)
  const [hoverId,     setHoverId]     = useState(null)
  const timerRef         = useRef(null)
  const dropdownTouched  = useRef(false)  // iOSキーボード最小化対策
  const isComposing      = useRef(false)  // IME変換中フラグ（日本語入力対策）

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    setAiError('')
    if (!query || query.length < 1) { setSuggestions([]); setAiLoading(false); return }

    const local = searchRecipes(query)
    setSuggestions(local)

    const geminiKey = localStorage.getItem('geminiKey') || ''
    if (!geminiKey) return
    // IME変換中はGemini呼び出しをスキップ
    if (isComposing.current) return

    clearTimeout(timerRef.current)
    setAiLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const ai = await fetchGeminiSuggestions(query, geminiKey)
        const localNames = new Set(local.map(r => r.name))
        const merged = [
          ...local,
          ...ai.filter(r => !localNames.has(r.name)).map(r => ({ ...r, fromAI:true }))
        ]
        setSuggestions(merged)
      } catch(e) {
        console.error('Gemini error:', e)
        setAiError('Gemini APIエラー（設定タブでAPIキーを確認してください）')
      } finally {
        setAiLoading(false)
      }
    }, 600)

    return () => { clearTimeout(timerRef.current); setAiLoading(false) }
  }, [query])

  const handleSelect = useCallback((recipe) => {
    setQuery(recipe.name)
    onChange?.(recipe.name)
    onSelect?.(recipe)
    setSuggestions([])
    setFocused(false)
    setAiLoading(false)
  }, [onChange, onSelect])

  const showDropdown = focused && (suggestions.length > 0 || aiLoading || aiError)

  return (
    <div style={s.wrap}>
      <input
        style={{ ...s.input, ...(focused ? s.inputFocus : {}) }}
        value={query}
        onChange={e => { setQuery(e.target.value); onChange?.(e.target.value) }}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={e => {
          isComposing.current = false
          // 確定後に再トリガー（useEffectがcomposing中をスキップしているため）
          setQuery(e.target.value + ' ')
          setTimeout(() => setQuery(e.target.value), 0)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
              // iOSのキーボード最小化対応:
              // 300ms待って、その間にdropdownへのタッチがあれば閉じない
              setTimeout(() => {
                if (!dropdownTouched.current) {
                  setFocused(false)
                  setAiLoading(false)
                }
                dropdownTouched.current = false
              }, 300)
            }}
        placeholder={placeholder || '料理名を入力（例：鮭、唐揚げ）'}
      />

      {showDropdown && (
        <div style={s.dropdown}
          onTouchStart={() => { dropdownTouched.current = true }}
          onMouseDown={() =>  { dropdownTouched.current = true }}
        >
          {aiLoading && (
            <div style={s.loadRow}>
              {[0,1,2].map(i => <span key={i} style={{...s.dot, animation:`pp-pulse 1.2s ${i*0.2}s infinite`}} />)}
              <span style={{marginLeft:4}}>Geminiで検索中...</span>
            </div>
          )}
          {aiError && <div style={s.errRow}>⚠ {aiError}</div>}

          {suggestions.length === 0 && !aiLoading
            ? <div style={s.noResult}>候補が見つかりません</div>
            : suggestions.map((r,i) => (
                <div
                  key={i}
                  style={{ ...s.item, ...(hoverId===i ? s.itemHov : {}), borderBottom: i===suggestions.length-1 ? 'none' : undefined }}
                  onMouseEnter={() => setHoverId(i)}
                  onMouseLeave={() => setHoverId(null)}
                  onMouseDown={() => handleSelect(r)}
                  onTouchEnd={e => { e.preventDefault(); handleSelect(r) }}
                >
                  <div style={{flex:1, minWidth:0}}>
                    <div style={s.itemName}>
                      {r.name}
                      {r.fromAI && <span style={s.aiLabel}>✨ AI</span>}
                    </div>
                    {r.ings?.length > 0 && (
                      <div style={s.itemIngs}>{r.ings.slice(0,5).join('・')}</div>
                    )}
                  </div>

                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}
