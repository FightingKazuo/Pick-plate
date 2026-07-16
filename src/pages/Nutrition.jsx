import { useState, useEffect, useCallback } from 'react'

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

async function fetchNutrition(mealName, apiKey) {
  const cached = getCachedNutr(mealName)
  if (cached) return cached
  if (!apiKey) return null
  const text = await callGemini(
    `「${mealName}」一人前の栄養素を推定してJSON形式のみで返してください。前後に説明文不要。
{"calories":数値,"protein":数値,"fat":数値,"carbs":数値,"fiber":数値,"salt":数値,"vitaminC":数値}
calories=kcal, protein/fat/carbs/fiber/salt=g, vitaminC=mg。不明な場合0を入れること。`, apiKey)
  try {
    const clean = text.replace(/```json|```/g,'').trim()
    const parsed = JSON.parse(clean)
    if (typeof parsed.calories === 'number') { setCache(mealName, parsed); return parsed }
  } catch {}
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
function DayView({ date, meals, apiKey }) {
  const [nutritions, setNutritions] = useState({})
  const [loading,    setLoading]    = useState(new Set())
  const [expanded,   setExpanded]   = useState(null)

  const dayMeals = MEALS.flatMap(meal => {
    const v = meals[slotKey(date, meal)]
    return (Array.isArray(v)?v:v?[v]:[]).map(m=>({meal,name:m.name,ings:m.ings}))
  })

  // 栄養素取得
  useEffect(() => {
    dayMeals.forEach(m => {
      if (nutritions[m.name] !== undefined || loading.has(m.name)) return
      if (!apiKey) return
      const cached = getCachedNutr(m.name)
      if (cached) { setNutritions(p=>({...p,[m.name]:cached})); return }
      setLoading(p=>new Set([...p,m.name]))
      fetchNutrition(m.name, apiKey).then(d => {
        setNutritions(p=>({...p,[m.name]:d}))
        setLoading(p=>{const n=new Set(p);n.delete(m.name);return n})
      })
    })
  }, [dayMeals.map(m=>m.name).join(','), apiKey])

  const totals = dayMeals.reduce((acc,m) => {
    const n = nutritions[m.name]; if(!n) return acc
    return Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(acc[key]||0)+(n[key]||0)]))
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
            <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',marginBottom:4}}>{meal}</div>
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
function WeekView({ dates, meals, apiKey }) {
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
      fetchNutrition(name, apiKey).then(d => {
        if(d) setNutritions(p=>({...p,[name]:d}))
      })
    })
  }, [apiKey])

  // 日ごとの合計を計算
  const dayTotals = dates.map(date => {
    const dayMeals = MEALS.flatMap(meal => {
      const v = meals[slotKey(date,meal)]
      return Array.isArray(v)?v:v?[v]:[]
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
export default function Nutrition({ data }) {
  const [view,      setView]      = useState('day')   // 'day' | 'week'
  const [activeDay, setActiveDay] = useState(2)
  const dates  = getDisplayDates()
  const meals  = data?.meals || {}
  const apiKey = localStorage.getItem('geminiKey') || ''

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
          ? <DayView  key={activeDay} date={dates[activeDay]} meals={meals} apiKey={apiKey} />
          : <WeekView key="week"      dates={dates}           meals={meals} apiKey={apiKey} />
        }
      </div>
    </div>
  )
}
