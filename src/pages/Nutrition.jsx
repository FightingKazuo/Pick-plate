import { useState, useEffect, useRef } from 'react'

const DAY_SHORT = ['日','月','火','水','木','金','土']
const DAY_FULL  = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
const MEALS     = ['朝','昼','夜']

// 今日基準 -2〜+4 の7日間（MealPlanと同じ）
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

// 栄養素キャッシュ（localStorage）
const CACHE_KEY = 'nutritionCache'
function getNutritionCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}') } catch { return {} }
}
function setNutritionCache(name, data) {
  const cache = getNutritionCache()
  cache[name] = { ...data, _ts: Date.now() }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

// Geminiで栄養素を取得
async function fetchNutrition(mealName, apiKey) {
  const cache = getNutritionCache()
  if (cache[mealName]) return cache[mealName]  // キャッシュヒット
  if (!apiKey) return null

  const prompt = `「${mealName}」（一人前）の栄養素を推定してください。
必ずJSON形式のみで返答し、前後に説明文やコードブロック記号は含めないこと。
{"calories":数値,"protein":数値,"fat":数値,"carbs":数値,"fiber":数値,"salt":数値,"vitaminC":数値}
単位: calories=kcal, protein/fat/carbs/fiber=g, salt=g, vitaminC=mg
値が不明な場合は0を入れること。`

  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  ]

  for (const base of endpoints) {
    try {
      const res = await fetch(`${base}?key=${apiKey}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.1,maxOutputTokens:200} })
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const clean = text.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean)
      setNutritionCache(mealName, parsed)
      return parsed
    } catch(e) { continue }
  }
  return null
}

// 栄養素バー
function NutrBar({ label, value, unit, max, color }) {
  const pct = max ? Math.min((value/max)*100, 100) : 0
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
        <span style={{color:'var(--text2)'}}>{label}</span>
        <span style={{color:'var(--text)',fontWeight:500}}>{value?.toFixed(1) ?? '—'}{unit}</span>
      </div>
      <div style={{background:'var(--border)',borderRadius:4,height:5,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:4,transition:'width .5s'}}/>
      </div>
    </div>
  )
}

// 1食分の栄養素カード
function MealNutrCard({ mealName, nutrition, loading }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{marginBottom:4,borderRadius:'var(--rs)',overflow:'hidden',border:'.5px solid var(--border)'}}>
      <div style={{display:'flex',alignItems:'center',padding:'8px 10px',cursor:'pointer',background:'var(--surface)'}}
        onClick={() => setOpen(v=>!v)}>
        <span style={{flex:1,fontSize:13,fontWeight:500}}>🍽 {mealName}</span>
        {loading
          ? <span style={{fontSize:11,color:'var(--text3)'}}>計算中...</span>
          : nutrition
            ? <span style={{fontSize:12,color:'var(--green)',fontWeight:500}}>{nutrition.calories}kcal {open?'▲':'▼'}</span>
            : <span style={{fontSize:11,color:'var(--text3)'}}>データなし</span>
        }
      </div>
      {open && nutrition && (
        <div style={{padding:'8px 12px',background:'var(--surface2)',borderTop:'.5px solid var(--border)'}}>
          <NutrBar label="エネルギー" value={nutrition.calories} unit="kcal" max={700}  color="#F6AD55"/>
          <NutrBar label="タンパク質" value={nutrition.protein}  unit="g"    max={30}   color="#68D391"/>
          <NutrBar label="脂質"       value={nutrition.fat}      unit="g"    max={25}   color="#FC8181"/>
          <NutrBar label="炭水化物"   value={nutrition.carbs}    unit="g"    max={90}   color="#76E4F7"/>
          <NutrBar label="食物繊維"   value={nutrition.fiber}    unit="g"    max={7}    color="#B794F4"/>
          <NutrBar label="塩分"       value={nutrition.salt}     unit="g"    max={2.5}  color="#F6E05E"/>
          <NutrBar label="ビタミンC"  value={nutrition.vitaminC} unit="mg"   max={100}  color="#F687B3"/>
          <div style={{fontSize:10,color:'var(--text3)',marginTop:6}}>※ Gemini AIによる推定値。目安としてご利用ください。</div>
        </div>
      )}
    </div>
  )
}

// 合計サマリー
function DaySummary({ totals, mealCount }) {
  if (mealCount === 0) return null
  const targets = { calories:2000, protein:60, fat:55, carbs:250, fiber:21, salt:7.5 }
  return (
    <div style={{background:'var(--green-l)',borderRadius:'var(--rs)',padding:'12px 14px',marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:600,color:'var(--green)',marginBottom:8}}>1日合計（{mealCount}食分）</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px 12px'}}>
        {[
          {label:'カロリー', val:totals.calories, unit:'kcal', target:targets.calories, color:'#F6AD55'},
          {label:'タンパク質',val:totals.protein,  unit:'g',    target:targets.protein,  color:'#68D391'},
          {label:'脂質',      val:totals.fat,      unit:'g',    target:targets.fat,      color:'#FC8181'},
          {label:'炭水化物',  val:totals.carbs,    unit:'g',    target:targets.carbs,    color:'#76E4F7'},
          {label:'食物繊維',  val:totals.fiber,    unit:'g',    target:targets.fiber,    color:'#B794F4'},
          {label:'塩分',      val:totals.salt,     unit:'g',    target:targets.salt,     color:'#F6E05E'},
        ].map(({label,val,unit,target,color}) => (
          <div key={label} style={{textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--text3)',marginBottom:2}}>{label}</div>
            <div style={{fontSize:14,fontWeight:700,color: val > target ? '#E53E3E' : 'var(--text)'}}>{val.toFixed(0)}</div>
            <div style={{fontSize:9,color:'var(--text3)'}}>{unit} / {target}{unit}</div>
            <div style={{background:'var(--border)',borderRadius:3,height:3,marginTop:3,overflow:'hidden'}}>
              <div style={{width:`${Math.min((val/target)*100,100)}%`,height:'100%',background:color,borderRadius:3}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Nutrition({ data }) {
  const [activeDay,   setActiveDay]   = useState(2) // 今日
  const [nutritions,  setNutritions]  = useState({}) // {mealName: nutritionData}
  const [loadingSet,  setLoadingSet]  = useState(new Set())
  const dates  = getDisplayDates()
  const meals  = data?.meals || {}
  const apiKey = localStorage.getItem('geminiKey') || ''

  const date     = dates[activeDay]
  const today    = isToday(date)
  const dayMeals = MEALS.flatMap(meal => {
    const key = slotKey(date, meal)
    const list = meals[key]
    if (!list) return []
    return (Array.isArray(list) ? list : [list]).map(m => ({ meal, ...m }))
  })

  // 表示中の料理の栄養素を取得
  useEffect(() => {
    if (!apiKey) return
    dayMeals.forEach(m => {
      if (nutritions[m.name] || loadingSet.has(m.name)) return
      setLoadingSet(prev => new Set([...prev, m.name]))
      fetchNutrition(m.name, apiKey).then(data => {
        if (data) setNutritions(prev => ({...prev, [m.name]: data}))
        setLoadingSet(prev => { const n=new Set(prev); n.delete(m.name); return n })
      })
    })
  }, [activeDay, JSON.stringify(dayMeals.map(m=>m.name)), apiKey])

  // 合計
  const totals = dayMeals.reduce((acc, m) => {
    const n = nutritions[m.name]
    if (!n) return acc
    return {
      calories: acc.calories + (n.calories||0),
      protein:  acc.protein  + (n.protein||0),
      fat:      acc.fat      + (n.fat||0),
      carbs:    acc.carbs    + (n.carbs||0),
      fiber:    acc.fiber    + (n.fiber||0),
      salt:     acc.salt     + (n.salt||0),
    }
  }, {calories:0,protein:0,fat:0,carbs:0,fiber:0,salt:0})

  const nutritionCount = dayMeals.filter(m => nutritions[m.name]).length

  return (
    <div style={{paddingBottom:80}}>
      {/* 曜日タブ */}
      <div style={{display:'flex',overflowX:'auto',scrollbarWidth:'none',borderBottom:'.5px solid var(--border)',flexShrink:0}}>
        {dates.map((d,i) => {
          const t = isToday(d)
          return (
            <button key={i} onClick={() => setActiveDay(i)} style={{
              flex:'0 0 auto', minWidth:46, padding:'8px 4px', border:'none', background:'none',
              borderBottom: i===activeDay ? '2px solid var(--green)' : '2px solid transparent',
              color: i===activeDay ? 'var(--green)' : 'var(--text3)',
              cursor:'pointer', fontFamily:'var(--font)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            }}>
              <span style={{fontSize:10,fontWeight:600}}>{DAY_SHORT[d.getDay()]}</span>
              <span style={{fontSize:12,fontWeight:i===activeDay?600:400}}>{d.getMonth()+1}/{d.getDate()}</span>
              {t && <div style={{width:4,height:4,borderRadius:'50%',background:'var(--green)'}}/>}
            </button>
          )
        })}
      </div>

      <div style={{padding:'14px'}}>
        {/* APIキーなし警告 */}
        {!apiKey && (
          <div style={{background:'var(--amber-l)',border:'.5px solid #E8C94A',borderRadius:'var(--rs)',padding:'10px 12px',marginBottom:12,fontSize:12,color:'var(--amber)'}}>
            ⚠️ 栄養素の計算にはGemini APIキーが必要です。設定タブで登録してください。
          </div>
        )}

        {/* 1日合計 */}
        {nutritionCount > 0 && <DaySummary totals={totals} mealCount={nutritionCount} />}

        {/* 料理リスト */}
        {dayMeals.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px 16px',color:'var(--text3)'}}>
            <div style={{fontSize:28,marginBottom:10}}>🍽</div>
            <div style={{fontSize:13}}>この日の献立がありません<br/>献立タブで料理を追加してください</div>
          </div>
        ) : (
          <>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8}}>
              {DAY_FULL[date.getDay()]}の食事
            </div>
            {MEALS.map(meal => {
              const key  = slotKey(date, meal)
              const list = meals[key]
              if (!list) return null
              const items = Array.isArray(list) ? list : [list]
              return (
                <div key={meal} style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',marginBottom:5}}>{meal}</div>
                  {items.map((m,i) => (
                    <MealNutrCard
                      key={i}
                      mealName={m.name}
                      nutrition={nutritions[m.name]}
                      loading={loadingSet.has(m.name)}
                    />
                  ))}
                </div>
              )
            })}
          </>
        )}

        {/* 注記 */}
        {dayMeals.length > 0 && (
          <div style={{fontSize:11,color:'var(--text3)',marginTop:12,lineHeight:1.7,padding:'8px 10px',background:'var(--surface2)',borderRadius:'var(--rs)'}}>
            💡 栄養素はGemini AIによる推定値です。実際の値は食材の量・調理方法により異なります。医療・ダイエット目的には専門家にご相談ください。
          </div>
        )}
      </div>
    </div>
  )
}
