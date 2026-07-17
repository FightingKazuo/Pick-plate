import { useState, useEffect, useRef } from 'react'
import { calcNutritionFromDB } from '../nutritionDB'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

const DAY_SHORT = ['日','月','火','水','木','金','土']
const DAY_FULL  = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
const MEALS     = ['朝','昼','夜']

const DAILY_TARGET = { calories:2000, protein:60, fat:55, carbs:250, fiber:21, salt:7.5, vitaminC:100 }
const NUTR_LABELS  = [
  { key:'calories', label:'カロリー',  unit:'kcal', color:'#F6AD55', max:2000 },
  { key:'protein',  label:'タンパク質',unit:'g',    color:'#68D391', max:60   },
  { key:'fat',      label:'脂質',      unit:'g',    color:'#FC8181', max:55   },
  { key:'carbs',    label:'炭水化物',  unit:'g',    color:'#76E4F7', max:250  },
  { key:'fiber',    label:'食物繊維',  unit:'g',    color:'#B794F4', max:21   },
  { key:'salt',     label:'塩分',      unit:'g',    color:'#F6E05E', max:7.5  },
  { key:'vitaminC', label:'ビタミンC', unit:'mg',   color:'#F687B3', max:100  },
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
  return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate()
}

// ── キャッシュ ──
const CACHE_KEY = 'nutritionCache'
const ADV_KEY   = 'nutritionAdvice'
function getCache()                { try { return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}') } catch { return {} } }
function setCache(name, data)      { const c=getCache(); c[name]={...data,_ts:Date.now()}; localStorage.setItem(CACHE_KEY,JSON.stringify(c)) }
function getCachedNutr(name)       { return getCache()[name] || null }

// ── Gemini呼び出し ──
async function callGemini(prompt, apiKey) {
  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
  ]
  for (const ep of endpoints) {
    try {
      const r = await fetch(`${ep}?key=${apiKey}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.2,maxOutputTokens:400}})
      })
      if (!r.ok) continue
      const d = await r.json()
      return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch { continue }
  }
  return ''
}

async function fetchNutrition(mealName, ings, apiKey) {
  const cached = getCachedNutr(mealName)
  if (cached) return cached

  // ① まずDBで計算
  const dbResult = calcNutritionFromDB(ings)
  const coverage = dbResult ? dbResult.dbCoverage / Math.max(dbResult.totalIngs, 1) : 0

  // ② DBカバレッジが低い（50%未満）かAPIキーがある場合はGeminiで補完
  if (apiKey && (!dbResult || coverage < 0.5 || dbResult.missingIngs?.length > 0)) {
    const ingDesc = ings?.length > 0
      ? `食材：${ings.join('、')}`
      : `料理名：${mealName}`
    const text = await callGemini(
      `「${mealName}」一人前の栄養素を推定してJSON形式のみで返してください。${ingDesc}。前後に説明文不要。
{"calories":数値,"protein":数値,"fat":数値,"carbs":数値,"fiber":数値,"salt":数値,"vitaminC":数値}
calories=kcal, protein/fat/carbs/fiber/salt=g, vitaminC=mg。不明な場合0を入れること。`, apiKey)
    try {
      const clean  = text.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean)
      if (typeof parsed.calories === 'number') {
        // DBとGeminiを合算（DBにある食材はDB値優先、ない食材はGemini推定分を加算）
        let final = parsed
        if (dbResult && dbResult.dbCoverage > 0) {
          // DB値がある食材のDB分 + Geminiの推定からDB分を差し引いた差分
          // ※簡略化: DBカバレッジが高い場合はDB優先、低い場合はGemini優先
          const w = coverage  // DB重み
          final = {
            calories: Math.round(dbResult.calories * w + parsed.calories * (1-w)),
            protein:  Math.round((dbResult.protein  * w + parsed.protein  * (1-w)) * 10) / 10,
            fat:      Math.round((dbResult.fat       * w + parsed.fat       * (1-w)) * 10) / 10,
            carbs:    Math.round((dbResult.carbs     * w + parsed.carbs     * (1-w)) * 10) / 10,
            fiber:    Math.round((dbResult.fiber     * w + parsed.fiber     * (1-w)) * 10) / 10,
            salt:     Math.round((dbResult.salt      * w + parsed.salt      * (1-w)) * 10) / 10,
            vitaminC: Math.round(dbResult.vitaminC   * w + parsed.vitaminC  * (1-w)),
            _source: `db+gemini(${Math.round(coverage*100)}%)`,
          }
        } else {
          final = { ...parsed, _source: 'gemini' }
        }
        setCache(mealName, final)
        return final
      }
    } catch {}
  }

  // DBのみの結果を返す
  if (dbResult) {
    const result = {
      calories: dbResult.calories,
      protein:  dbResult.protein,
      fat:      dbResult.fat,
      carbs:    dbResult.carbs,
      fiber:    dbResult.fiber,
      salt:     dbResult.salt,
      vitaminC: dbResult.vitaminC,
      _source:  `db(${Math.round(coverage*100)}%)`,
    }
    setCache(mealName, result)
    return result
  }
  return null
}

async function fetchWeeklyAdvice(weekSummary, apiKey) {
  if (!apiKey) return null
  return callGemini(
    `あなたは管理栄養士です。以下は1週間の食事データです：\n${weekSummary}\n
上記のデータから、簡潔で実践的な栄養アドバイスを3〜4点、日本語で箇条書きで教えてください。
良かった点1つ、改善点2〜3つを含めてください。200字以内で。`, apiKey)
}

// ── UI部品 ──
function NutrBar({ label, value, unit, max, color, showLabel=true }) {
  const pct = max ? Math.min((value/max)*100, 100) : 0
  const over = value > max
  return (
    <div style={{marginBottom:7}}>
      {showLabel && (
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
          <span style={{color:'var(--text2)'}}>{label}</span>
          <span style={{color: over?'#E53E3E':'var(--text)',fontWeight:500}}>
            {value?.toFixed(1) ?? '—'}<span style={{fontSize:9,color:'var(--text3)',marginLeft:2}}>{unit}</span>
            {over && <span style={{fontSize:9,color:'#E53E3E',marginLeft:3}}>↑超過</span>}
          </span>
        </div>
      )}
      <div style={{background:'var(--border)',borderRadius:4,height:5,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background: over?'#FC8181':color,borderRadius:4,transition:'width .5s'}}/>
      </div>
      {/* 食事追加モーダル */}
      {quickAdd && (
        <QuickAddModal
          date={quickAdd.date}
          mealSlot={quickAdd.meal}
          apiKey={apiKey}
          onAdd={(meal) => {
            // データはonUpdateがないのでwindow経由でApp.jsxのhandleUpdateを呼ぶ
            // → MealPlan.jsxのaddMealと同じ形式でdataに追加する
            // Nutritionは読み取り専用なので、App.jsxのonUpdateをpropsで受け取る必要あり
            // 今回は window.dispatchEvent でカスタムイベントを飛ばす簡易実装
            const date = quickAdd.date
            const y = date.getFullYear()
            const m = String(date.getMonth()+1).padStart(2,'0')
            const d = String(date.getDate()).padStart(2,'0')
            const key = `${y}-${m}-${d}-${meal.meal}`
            window.dispatchEvent(new CustomEvent('pickplate:addMeal', { detail: { key, meal } }))
            setQuickAdd(null)
          }}
          onClose={() => setQuickAdd(null)}
        />
      )}
    </div>
  )
}

function SummaryGrid({ totals }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px 8px'}}>
      {NUTR_LABELS.slice(0,4).map(({key,label,unit,color,max}) => {
        const val = totals[key] || 0
        const over = val > max
        return (
          <div key={key} style={{textAlign:'center',padding:'8px 4px',background:'var(--surface)',borderRadius:'var(--rs)',border:`.5px solid ${over?'#FC8181':'var(--border)'}`}}>
            <div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>{label}</div>
            <div style={{fontSize:15,fontWeight:700,color: over?'#E53E3E':'var(--text)',lineHeight:1.2}}>{val.toFixed(0)}</div>
            <div style={{fontSize:9,color:'var(--text3)'}}>{unit}</div>
            <div style={{background:'var(--border)',borderRadius:3,height:3,marginTop:4,overflow:'hidden'}}>
              <div style={{width:`${Math.min((val/max)*100,100)}%`,height:'100%',background: over?'#FC8181':color,borderRadius:3}}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 日別ビュー ──
function DayView({ date, meals, apiKey, person, members, onQuickAdd }) {
  const [nutritions, setNutritions] = useState({})
  const [loading,    setLoading]    = useState(new Set())
  const [expanded,   setExpanded]   = useState(null)

  const dayMeals = MEALS.flatMap(meal => {
    const v = meals[slotKey(date, meal)]
    return (Array.isArray(v)?v:v?[v]:[])
      .filter(m => !m.for || m.for === 'both' || m.for === person || person === 'both')
      .map(m => {
        // 2人分表示のとき、2人料理のカロリーは×2
        const multiplier = (person === 'both' && (!m.for || m.for === 'both')) ? 2 : 1
        return {meal, name:m.name, ings:m.ings, multiplier}
      })
  })

  // 栄養素取得
  useEffect(() => {
    dayMeals.forEach(m => {
      if (nutritions[m.name] !== undefined || loading.has(m.name)) return
      if (!apiKey) return
      const cached = getCachedNutr(m.name)
      if (cached) { setNutritions(p=>({...p,[m.name]:cached})); return }
      setLoading(p=>new Set([...p,m.name]))
      fetchNutrition(m.name, m.ings, apiKey).then(d => {
        setNutritions(p=>({...p,[m.name]:d}))
        setLoading(p=>{const n=new Set(p);n.delete(m.name);return n})
      })
    })
  }, [dayMeals.map(m=>m.name).join(','), apiKey])

  const totals = dayMeals.reduce((acc,m) => {
    const n = nutritions[m.name]; if(!n) return acc
    const mul = m.multiplier || 1
    return Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(acc[key]||0)+(n[key]||0)*mul]))
  }, {})
  const hasData = Object.values(totals).some(v=>v>0)

  if (dayMeals.length === 0) return (
    <div style={{textAlign:'center',padding:'32px 16px',color:'var(--text3)'}}>
      <div style={{fontSize:28,marginBottom:8}}>🍽</div>
      <div style={{fontSize:13}}>献立がありません</div>
    </div>
  )

  return (
    <>
      {/* 1日合計 */}
      {hasData && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>1日合計</div>
          <SummaryGrid totals={totals} />
          <div style={{marginTop:10}}>
            {NUTR_LABELS.slice(4).map(({key,label,unit,color,max})=>(
              <NutrBar key={key} label={label} value={totals[key]||0} unit={unit} max={max} color={color} />
            ))}
          </div>
        </div>
      )}

      {/* 食事ごと */}
      <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>食事別</div>
      {MEALS.map(meal => {
        const v = meals[slotKey(date,meal)]
        const items = Array.isArray(v)?v:v?[v]:[]
        if(!items.length) return null
        return (
          <div key={meal} style={{marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--text3)'}}>{meal}</div>
                <button onClick={() => onQuickAdd({date, meal})} style={{
                  fontSize:11,color:'var(--green)',background:'var(--green-l)',border:'none',
                  borderRadius:12,padding:'2px 9px',cursor:'pointer',fontFamily:'var(--font)',
                  touchAction:'manipulation',
                }}>＋ 追加</button>
              </div>
            {items.map((m,i) => {
              const n = nutritions[m.name]
              const isLoading = loading.has(m.name)
              const key = `${meal}-${i}`
              return (
                <div key={i} style={{marginBottom:5,borderRadius:'var(--rs)',overflow:'hidden',border:'.5px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'center',padding:'8px 10px',cursor:'pointer',background:'var(--surface)'}}
                    onClick={()=>setExpanded(expanded===key?null:key)}>
                    <span style={{flex:1,fontSize:13,fontWeight:500}}>🍽 {m.name}</span>
                    {isLoading
                      ? <span style={{fontSize:11,color:'var(--text3)'}}>計算中...</span>
                      : n
                        ? <span style={{fontSize:12,color:'var(--green)',fontWeight:600}}>{n.calories}kcal {expanded===key?'▲':'▼'}</span>
                        : <span style={{fontSize:11,color:'var(--text3)'}}>—</span>
                    }
                  </div>
                  {expanded===key && n && (
                    <div style={{padding:'8px 12px',background:'var(--surface2)',borderTop:'.5px solid var(--border)'}}>
                      {NUTR_LABELS.map(({key:k,label,unit,color,max})=>(
                        <NutrBar key={k} label={label} value={n[k]||0} unit={unit} max={max/3} color={color} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
      <div style={{fontSize:10,color:'var(--text3)',marginTop:8,lineHeight:1.7,padding:'7px 10px',background:'var(--surface2)',borderRadius:'var(--rs)'}}>
        💡 Gemini AIによる推定値。実際の値は食材量・調理法により異なります。
      </div>
    </>
  )
}

// ── 週間ビュー ──
function WeekView({ dates, meals, apiKey, person, members }) {
  const [nutritions,  setNutritions]  = useState({})
  const [advice,      setAdvice]      = useState('')
  const [advLoading,  setAdvLoading]  = useState(false)
  const [advError,    setAdvError]    = useState('')

  // 全料理の栄養素を取得
  useEffect(() => {
    const allMeals = new Set()
    dates.forEach(date => {
      MEALS.forEach(meal => {
        const v = meals[slotKey(date,meal)]
        ;(Array.isArray(v)?v:v?[v]:[]).forEach(m=>allMeals.add(m.name))
      })
    })
    allMeals.forEach(name => {
      if (nutritions[name]!==undefined) return
      const cached = getCachedNutr(name)
      if (cached) { setNutritions(p=>({...p,[name]:cached})); return }
      if (!apiKey) return
      fetchNutrition(name, null, apiKey).then(d => {
        if(d) setNutritions(p=>({...p,[name]:d}))
      })
    })
  }, [apiKey])

  // 日ごとの合計を計算
  const dayTotals = dates.map(date => {
    const dayMeals = MEALS.flatMap(meal => {
      const v = meals[slotKey(date,meal)]
      return (Array.isArray(v)?v:v?[v]:[])
        .filter(m => !m.for || m.for==='both' || m.for===person || person==='both')
    })
    return dayMeals.reduce((acc,m) => {
      const n = nutritions[m.name]; if(!n) return acc
      return Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(acc[key]||0)+(n[key]||0)]))
    }, {})
  })

  const weekTotals = dayTotals.reduce((acc,d) => {
    return Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(acc[key]||0)+(d[key]||0)]))
  }, {})

  const activeDays = dayTotals.filter(d=>Object.values(d).some(v=>v>0)).length

  const handleAdvice = async () => {
    if (!apiKey) { setAdvError('設定タブでGemini APIキーを登録してください'); return }
    setAdvLoading(true); setAdvError('')
    const summary = dates.map((date,i) => {
      const d = dayTotals[i]
      if (!Object.values(d).some(v=>v>0)) return null
      const dayMeals = MEALS.flatMap(meal => {
        const v = meals[slotKey(date,meal)]
        return (Array.isArray(v)?v:v?[v]:[]).map(m=>m.name)
      })
      return `${DAY_SHORT[date.getDay()]}：${dayMeals.join('、')}（${(d.calories||0).toFixed(0)}kcal）`
    }).filter(Boolean).join('\n')

    if (!summary) { setAdvError('献立データが不十分です'); setAdvLoading(false); return }
    const result = await fetchWeeklyAdvice(summary, apiKey)
    if (result) setAdvice(result)
    else setAdvError('アドバイスの取得に失敗しました')
    setAdvLoading(false)
  }

  return (
    <>
      {/* 週間カロリーグラフ */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8}}>カロリー推移</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80,padding:'0 2px'}}>
          {dates.map((date,i) => {
            const cal = dayTotals[i].calories || 0
            const pct = Math.min((cal/DAILY_TARGET.calories)*100, 100)
            const over = cal > DAILY_TARGET.calories
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:9,color:'var(--text3)'}}>{cal>0?`${(cal/1000).toFixed(1)}k`:''}</div>
                <div style={{width:'100%',height:60,display:'flex',alignItems:'flex-end',background:'var(--surface2)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{width:'100%',height:`${pct}%`,background:over?'#FC8181':'var(--green)',borderRadius:4,transition:'height .5s',minHeight: cal>0?2:0}}/>
                </div>
                <div style={{fontSize:9,color:isToday(date)?'var(--green)':'var(--text3)',fontWeight:isToday(date)?600:400}}>{DAY_SHORT[date.getDay()]}</div>
              </div>
            )
          })}
        </div>
        <div style={{fontSize:9,color:'var(--text3)',textAlign:'right',marginTop:2}}>目標: {DAILY_TARGET.calories}kcal/日</div>
      </div>

      {/* 週間平均 */}
      {activeDays > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>週間平均（{activeDays}日分）</div>
          <SummaryGrid totals={Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(weekTotals[key]||0)/activeDays]))} />
          <div style={{marginTop:10}}>
            {NUTR_LABELS.slice(4).map(({key,label,unit,color,max})=>(
              <NutrBar key={key} label={label} value={(weekTotals[key]||0)/activeDays} unit={unit} max={max} color={color} />
            ))}
          </div>
        </div>
      )}

      {/* AIアドバイス */}
      <div style={{marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase'}}>週間アドバイス</div>
          <button onClick={handleAdvice} disabled={advLoading} style={{
            padding:'5px 12px',background:'var(--green)',color:'#fff',border:'none',
            borderRadius:20,fontSize:12,cursor:'pointer',fontFamily:'var(--font)',
            opacity:advLoading?0.6:1,
          }}>
            {advLoading ? '分析中...' : '✨ アドバイスをもらう'}
          </button>
        </div>
        {advError && <div style={{fontSize:12,color:'var(--red)',padding:'8px',background:'var(--red-l)',borderRadius:'var(--rs)',marginBottom:8}}>{advError}</div>}
        {advice ? (
          <div style={{background:'var(--green-l)',borderRadius:'var(--rs)',padding:'12px 14px',fontSize:13,lineHeight:1.8,color:'var(--text)',border:'.5px solid rgba(45,106,79,.2)',whiteSpace:'pre-wrap'}}>
            {advice}
          </div>
        ) : !advLoading && (
          <div style={{background:'var(--surface2)',borderRadius:'var(--rs)',padding:'12px 14px',fontSize:12,color:'var(--text3)',lineHeight:1.7}}>
            1週間の献立を入力後、「アドバイスをもらう」を押すとAIが栄養バランスを分析してアドバイスします。
          </div>
        )}
      </div>
    </>
  )
}

// ── メイン ──
// ════════════════════════════════════════
// 食事追加モーダル（栄養タブから直接入力）
// ════════════════════════════════════════
function QuickAddModal({ date, mealSlot, onAdd, onClose, apiKey }) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState([])
  const [aiLoad,   setAiLoad]   = useState(false)
  const [category, setCategory] = useState(mealSlot) // 朝/昼/夜/間食
  const isComposing = useRef(false)
  const dropTouched = useRef(false)
  const timer       = useRef(null)
  const [focused,   setFocused]  = useState(false)
  const [hovId,     setHovId]    = useState(null)

  // カスタムメニュー（自由入力）
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    if (!query) { setResults([]); return }
    if (isComposing.current) return
    const local = searchRecipes(query)
    setResults(local)
    if (!apiKey) return
    clearTimeout(timer.current)
    setAiLoad(true)
    timer.current = setTimeout(async () => {
      try {
        const ai = await fetchGeminiSuggestions(query, apiKey)
        const names = new Set(local.map(r => r.name))
        setResults([...local, ...ai.filter(r => !names.has(r.name)).map(r => ({...r, fromAI:true}))])
      } catch(e) { console.error(e) } finally { setAiLoad(false) }
    }, 600)
    return () => clearTimeout(timer.current)
  }, [query])

  const pick = (r) => {
    onAdd({ name: r.name, ings: r.ings || [], meal: category })
    onClose()
  }
  const addCustom = () => {
    const name = customName.trim() || query.trim()
    if (!name) return
    onAdd({ name, ings: [], meal: category })
    onClose()
  }

  const MEAL_CATS = ['朝', '昼', '夜', '間食']

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:600,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{background:'var(--surface)',borderRadius:'18px 18px 0 0',maxHeight:'85dvh',display:'flex',flexDirection:'column',boxShadow:'0 -4px 24px rgba(0,0,0,.15)'}}>
        {/* ハンドル */}
        <div style={{width:36,height:4,borderRadius:2,background:'var(--border2)',margin:'10px auto 0',flexShrink:0}}/>

        {/* ヘッダー */}
        <div style={{padding:'10px 16px 12px',borderBottom:'.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontSize:15,fontWeight:600}}>食事を追加</div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',background:'var(--surface2)',border:'none',fontSize:16,cursor:'pointer',color:'var(--text2)'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'12px 14px',paddingBottom:24}}>
          {/* 食事区分 */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>食事区分</div>
            <div style={{display:'flex',gap:6}}>
              {MEAL_CATS.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  flex:1,padding:'6px 0',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:'var(--font)',
                  background: category===cat?'var(--green)':'var(--surface2)',
                  color:      category===cat?'#fff':'var(--text2)',
                }}>{cat}</button>
              ))}
            </div>
          </div>

          {/* 検索 */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>料理を検索</div>
            <div style={{position:'relative'}}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onCompositionStart={() => { isComposing.current = true }}
                onCompositionEnd={e => { isComposing.current = false; setQuery(e.target.value+' '); setTimeout(()=>setQuery(e.target.value),0) }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => { if(!dropTouched.current) setFocused(false); dropTouched.current=false }, 300)}
                placeholder="例：外食、ラーメン、コンビニ弁当"
                style={{width:'100%',padding:'10px 12px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:14,outline:'none',background:'var(--surface)',color:'var(--text)'}}
              />
              {/* ドロップダウン */}
              {focused && (results.length > 0 || aiLoad) && (
                <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'var(--surface)',border:'.5px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.12)',zIndex:700,maxHeight:220,overflowY:'auto'}}
                  onMouseDown={() => { dropTouched.current = true }}
                  onTouchStart={() => { dropTouched.current = true }}
                >
                  {aiLoad && <div style={{padding:'9px 13px',fontSize:12,color:'var(--text3)'}}>検索中...</div>}
                  {results.map((r,i) => (
                    <button key={i} onClick={() => pick(r)} style={{
                      display:'block',width:'100%',textAlign:'left',padding:'10px 13px',cursor:'pointer',
                      borderBottom:i===results.length-1?'none':'.5px solid var(--border)',
                      background:'var(--surface)',border:'none',fontFamily:'var(--font)',touchAction:'manipulation',
                    }}>
                      <div style={{fontSize:13,fontWeight:500}}>{r.name}{r.fromAI&&<span style={{fontSize:9,background:'var(--green-l)',color:'var(--green)',borderRadius:3,padding:'1px 5px',marginLeft:5}}>✨AI</span>}</div>
                      {r.ings?.length>0 && <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{r.ings.slice(0,4).join('・')}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 自由入力 */}
          <div>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>
              リストにないものを追加
            </div>
            <div style={{display:'flex',gap:6}}>
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && addCustom()}
                placeholder="外食・残り物など自由入力"
                style={{flex:1,padding:'9px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none'}}
              />
              <button onClick={addCustom} style={{padding:'9px 14px',background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',fontFamily:'var(--font)',fontWeight:500,touchAction:'manipulation'}}>
                追加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Nutrition({ data, members }) {
  const [view,      setView]      = useState('day')
  const [activeDay, setActiveDay] = useState(2)
  const [person,    setPerson]    = useState('both')
  const [quickAdd,  setQuickAdd]  = useState(null) // {date, meal}
  const dates  = getDisplayDates()
  const meals  = data?.meals || {}
  const apiKey = localStorage.getItem('geminiKey') || ''
  const m0 = members?.[0] || '自分'
  const m1 = members?.[1] || '相手'

  return (
    <div style={{paddingBottom:80}}>
      {/* ビュー切り替え */}
      <div style={{display:'flex',borderBottom:'.5px solid var(--border)',flexShrink:0}}>
        {[{id:'day',label:'日別'},{id:'week',label:'週間'}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{
            flex:1,padding:'10px 0',border:'none',background:'none',
            borderBottom: view===v.id?'2px solid var(--green)':'2px solid transparent',
            color: view===v.id?'var(--green)':'var(--text3)',
            fontSize:13,fontWeight:view===v.id?600:400,cursor:'pointer',fontFamily:'var(--font)',
          }}>{v.label}</button>
        ))}
      </div>

      {/* 人物フィルタ */}
      <div style={{display:'flex',gap:6,padding:'8px 14px',borderBottom:'.5px solid var(--border)'}}>
        {[{id:'both',label:'2人合計'},{id:'member0',label:m0},{id:'member1',label:m1}].map(p=>(
          <button key={p.id} onClick={()=>setPerson(p.id)} style={{
            padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,
            background: person===p.id?'var(--green)':'var(--surface2)',
            color: person===p.id?'#fff':'var(--text2)',
            fontFamily:'var(--font)',fontWeight:person===p.id?500:400,
          }}>{p.label}</button>
        ))}
      </div>

      {/* APIキーなし警告 */}
      {!apiKey && (
        <div style={{margin:'10px 14px 0',background:'var(--amber-l)',border:'.5px solid #E8C94A',borderRadius:'var(--rs)',padding:'9px 12px',fontSize:12,color:'var(--amber)'}}>
          ⚠️ 栄養素計算にはGemini APIキーが必要です。設定タブで登録してください。
        </div>
      )}

      {/* 日別：曜日タブ */}
      {view === 'day' && (
        <div style={{display:'flex',overflowX:'auto',scrollbarWidth:'none',borderBottom:'.5px solid var(--border)'}}>
          {dates.map((d,i)=>(
            <button key={i} onClick={()=>setActiveDay(i)} style={{
              flex:'0 0 auto',minWidth:46,padding:'7px 4px',border:'none',background:'none',
              borderBottom: i===activeDay?'2px solid var(--green)':'2px solid transparent',
              color: i===activeDay?'var(--green)':'var(--text3)',
              cursor:'pointer',fontFamily:'var(--font)',
              display:'flex',flexDirection:'column',alignItems:'center',gap:2,
            }}>
              <span style={{fontSize:10,fontWeight:600}}>{DAY_SHORT[d.getDay()]}</span>
              <span style={{fontSize:11,fontWeight:i===activeDay?600:400}}>{d.getMonth()+1}/{d.getDate()}</span>
              {isToday(d) && <div style={{width:4,height:4,borderRadius:'50%',background:'var(--green)'}}/>}
            </button>
          ))}
        </div>
      )}

      <div style={{padding:'14px'}}>
        {view === 'day'
          ? <DayView  key={`${activeDay}-${person}`} date={dates[activeDay]} meals={meals} apiKey={apiKey} person={person} members={[m0,m1]} onQuickAdd={setQuickAdd} />
          : <WeekView key={`week-${person}`} dates={dates} meals={meals} apiKey={apiKey} person={person} members={[m0,m1]} />
        }
      </div>
    </div>
  )
}
