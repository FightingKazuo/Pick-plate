import { useState, useEffect, useRef } from 'react'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

// ── 食品成分DB（nutritionDB.jsの内容をインライン） ──
const FOOD_DB = {
  '鶏もも肉':{cal:204,protein:16.6,fat:14.2,carbs:0,fiber:0,salt:0.2,vitC:3,stdG:150},
  '鶏むね肉':{cal:116,protein:22.3,fat:1.9,carbs:0,fiber:0,salt:0.1,vitC:3,stdG:150},
  '豚バラ':{cal:386,protein:14.4,fat:35.4,carbs:0.1,fiber:0,salt:0.1,vitC:1,stdG:100},
  '豚ロース':{cal:263,protein:19.3,fat:19.2,carbs:0.2,fiber:0,salt:0.1,vitC:1,stdG:120},
  '牛切り落とし':{cal:209,protein:16.5,fat:15.4,carbs:0.3,fiber:0,salt:0.1,vitC:2,stdG:120},
  '合いびき肉':{cal:224,protein:17.1,fat:16.3,carbs:0.3,fiber:0,salt:0.2,vitC:1,stdG:100},
  'ベーコン':{cal:405,protein:12.9,fat:39.1,carbs:0.3,fiber:0,salt:2.0,vitC:0,stdG:30},
  '鮭':{cal:133,protein:22.3,fat:4.1,carbs:0.1,fiber:0,salt:0.2,vitC:0,stdG:100},
  'えび':{cal:91,protein:18.4,fat:0.3,carbs:2.5,fiber:0,salt:0.7,vitC:0,stdG:80},
  'あさり':{cal:30,protein:6.0,fat:0.3,carbs:0.4,fiber:0,salt:2.2,vitC:1,stdG:100},
  '玉ねぎ':{cal:37,protein:1.0,fat:0.1,carbs:8.4,fiber:1.5,salt:0,vitC:8,stdG:100},
  '長ねぎ':{cal:34,protein:1.4,fat:0.1,carbs:7.3,fiber:2.2,salt:0,vitC:14,stdG:50},
  'にんじん':{cal:39,protein:0.7,fat:0.2,carbs:9.3,fiber:2.8,salt:0,vitC:6,stdG:80},
  'じゃがいも':{cal:76,protein:1.8,fat:0.1,carbs:17.3,fiber:8.9,salt:0,vitC:35,stdG:100},
  'キャベツ':{cal:23,protein:1.3,fat:0.2,carbs:5.2,fiber:1.8,salt:0,vitC:41,stdG:100},
  'トマト':{cal:20,protein:0.7,fat:0.1,carbs:4.7,fiber:1.0,salt:0,vitC:15,stdG:150},
  'なす':{cal:22,protein:1.1,fat:0.1,carbs:5.1,fiber:2.2,salt:0,vitC:4,stdG:100},
  'ほうれん草':{cal:20,protein:2.2,fat:0.4,carbs:3.1,fiber:2.8,salt:0,vitC:35,stdG:80},
  'もやし':{cal:37,protein:1.7,fat:0.1,carbs:6.5,fiber:1.3,salt:0,vitC:8,stdG:100},
  'ブロッコリー':{cal:37,protein:4.3,fat:0.5,carbs:6.6,fiber:4.4,salt:0,vitC:120,stdG:80},
  '豆腐':{cal:56,protein:4.9,fat:3.0,carbs:2.0,fiber:0.3,salt:0,vitC:0,stdG:150},
  '卵':{cal:151,protein:12.3,fat:10.3,carbs:0.3,fiber:0,salt:0.4,vitC:0,stdG:60},
  '牛乳':{cal:67,protein:3.3,fat:3.8,carbs:4.8,fiber:0,salt:0.1,vitC:1,stdG:200},
  'バター':{cal:745,protein:0.6,fat:81.0,carbs:0.2,fiber:0,salt:1.5,vitC:0,stdG:10},
  'ヨーグルト':{cal:62,protein:3.6,fat:3.0,carbs:4.9,fiber:0,salt:0.1,vitC:1,stdG:100},
  'ごはん':{cal:168,protein:2.5,fat:0.3,carbs:37.1,fiber:0.3,salt:0,vitC:0,stdG:150},
  '食パン':{cal:264,protein:9.3,fat:4.4,carbs:46.7,fiber:2.3,salt:1.3,vitC:0,stdG:60},
  'パスタ':{cal:378,protein:13.0,fat:1.9,carbs:73.9,fiber:5.7,salt:0,vitC:0,stdG:80},
  'うどん':{cal:105,protein:2.6,fat:0.4,carbs:21.6,fiber:0.8,salt:0.3,vitC:0,stdG:200},
  'カップ麺':{cal:355,protein:8.8,fat:14.1,carbs:47.5,fiber:2.0,salt:5.5,vitC:0,stdG:85},
  '袋ラーメン':{cal:449,protein:10.6,fat:17.7,carbs:60.8,fiber:2.8,salt:6.1,vitC:0,stdG:100},
  'レトルトカレー':{cal:121,protein:5.9,fat:5.5,carbs:12.3,fiber:2.1,salt:2.1,vitC:3,stdG:200},
  '醤油':{cal:71,protein:7.7,fat:0,carbs:10.1,fiber:0,salt:14.5,vitC:0,stdG:15},
  '味噌':{cal:217,protein:12.5,fat:6.0,carbs:21.9,fiber:4.9,salt:12.4,vitC:0,stdG:15},
  '砂糖':{cal:384,protein:0,fat:0,carbs:99.2,fiber:0,salt:0,vitC:0,stdG:5},
  'ごま油':{cal:921,protein:0,fat:100,carbs:0,fiber:0,salt:0,vitC:0,stdG:5},
  'サラダ油':{cal:921,protein:0,fat:100,carbs:0,fiber:0,salt:0,vitC:0,stdG:8},
  'オリーブ油':{cal:921,protein:0,fat:100,carbs:0,fiber:0,salt:0,vitC:0,stdG:8},
  'バナナ':{cal:86,protein:1.1,fat:0.2,carbs:22.5,fiber:1.1,salt:0,vitC:16,stdG:100},
  '納豆':{cal:200,protein:16.5,fat:10.0,carbs:12.1,fiber:6.7,salt:0,vitC:0,stdG:45},
}

function calcNutritionFromDB(ings) {
  if (!ings || ings.length === 0) return null
  const r = {cal:0,protein:0,fat:0,carbs:0,fiber:0,salt:0,vitC:0,iron:0,calcium:0,vitaminA:0}
  let covered = 0
  for (const ing of ings) {
    const key = Object.keys(FOOD_DB).find(k => ing.includes(k) || k.includes(ing))
    if (key) {
      const d = FOOD_DB[key]; const g = d.stdG
      r.cal+=d.cal*g/100; r.protein+=d.protein*g/100; r.fat+=d.fat*g/100
      r.carbs+=d.carbs*g/100; r.fiber+=d.fiber*g/100; r.salt+=d.salt*g/100; r.vitC+=d.vitC*g/100
      r.iron+=(d.iron||0)*g/100; r.calcium+=(d.calcium||0)*g/100; r.vitaminA+=(d.vitA||0)*g/100
      covered++
    }
  }
  const rd = v=>Math.round(v*10)/10
  return {calories:Math.round(r.cal),protein:rd(r.protein),fat:rd(r.fat),carbs:rd(r.carbs),fiber:rd(r.fiber),salt:rd(r.salt),vitaminC:Math.round(r.vitC),iron:rd(r.iron||0),calcium:Math.round(r.calcium||0),vitaminA:Math.round(r.vitaminA||0),dbCoverage:covered,totalIngs:ings.length,missingIngs:[],_source:'db'}
}

const DAY_SHORT = ['日','月','火','水','木','金','土']
const DAY_FULL  = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
const MEALS     = ['朝','昼','夜']
const DAILY_TARGET = { calories:2000, protein:60, fat:55, carbs:250, fiber:21, salt:7.5, vitaminC:100 }
const NUTR_LABELS = [
  { key:'calories', label:'カロリー',   unit:'kcal', color:'#F6AD55', max:2000 },
  { key:'protein',  label:'タンパク質', unit:'g',    color:'#68D391', max:60   },
  { key:'fat',      label:'脂質',       unit:'g',    color:'#FC8181', max:55   },
  { key:'carbs',    label:'炭水化物',   unit:'g',    color:'#76E4F7', max:250  },
  { key:'fiber',    label:'食物繊維',   unit:'g',    color:'#B794F4', max:21   },
  { key:'salt',     label:'塩分',       unit:'g',    color:'#F6E05E', max:7.5  },
  { key:'vitaminC', label:'ビタミンC',  unit:'mg',   color:'#F687B3', max:100  },
  { key:'iron',     label:'鉄分',       unit:'mg',   color:'#FC8181', max:10.5 },
  { key:'calcium',  label:'カルシウム', unit:'mg',   color:'#76E4F7', max:800  },
  { key:'vitaminA', label:'ビタミンA',  unit:'μg',  color:'#F6AD55', max:900  },
]

// ── ユーティリティ ──
function getDisplayDates(weekOffset = 0) {
  const today = new Date()
  const base  = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Array.from({length:7}, (_,i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i - 2 + weekOffset * 7)
    return d
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
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7日間でキャッシュ期限切れ
function getCachedNutr(name) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')[name]
    if (!c) return null
    // 0kcal・未計算・期限切れは無効
    if (c.calories <= 0) return null
    if (c._ts && Date.now() - c._ts > CACHE_TTL) return null
    return c
  } catch { return null }
}
function setCachedNutr(name, data) {
  try { const c=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}'); c[name]={...data,_ts:Date.now()}; localStorage.setItem(CACHE_KEY,JSON.stringify(c)) } catch {}
}
function clearAllNutrCache() {
  localStorage.removeItem(CACHE_KEY)
}

// ── Gemini ──
async function callGemini(prompt, apiKey) {
  const eps = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
  ]
  for (const ep of eps) {
    try {
      const r = await fetch(`${ep}?key=${apiKey}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:400}})
      })
      if (!r.ok) continue
      const d = await r.json()
      return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch { continue }
  }
  return ''
}

async function fetchNutrition(mealName, ings, apiKey) {
  // キャッシュ確認（0kcalは無効とみなして再計算）
  const cached = getCachedNutr(mealName)
  if (cached && cached.calories > 0) return cached

  // DBで計算
  const dbResult = calcNutritionFromDB(ings)
  const coverage = dbResult ? dbResult.dbCoverage / Math.max(dbResult.totalIngs, 1) : 0

  // Gemini呼び出し条件：
  // ① APIキーあり
  // ② DBカバレッジが80%未満、またはDBカロリーが50kcal未満（明らかに過小）、または食材なし
  // Geminiを基本的に常に呼ぶ（DBは補助として使う）
  // 例外：APIキーなし、またはDBで完全カバーかつカロリー十分な場合のみスキップ
  const needsGemini = apiKey && (
    !dbResult ||
    dbResult.calories < 100 ||   // 100kcal未満は再推定
    coverage < 0.9 ||             // DBカバレッジ90%未満
    (ings || []).length === 0     // 食材リストなし（料理名のみ）
  )

  if (needsGemini) {
    const ingDesc = ings?.length > 0
      ? `食材リスト：${ings.join('、')}`
      : `料理名のみ：${mealName}`
    const text = await callGemini(
      `「${mealName}」を一人前食べた場合の栄養素を推定してください。${ingDesc}。
JSONのみ返答（説明・コードブロック不要）：
{"calories":数値,"protein":数値,"fat":数値,"carbs":数値,"fiber":数値,"salt":数値,"vitaminC":数値,"iron":数値,"calcium":数値,"vitaminA":数値}
calories=kcal、protein/fat/carbs/fiber/salt=g、vitaminC/iron=mg、calcium=mg、vitaminA=μg。0は使わず必ず推定値を入れること。`, apiKey)
    try {
      const clean = text.replace(/\`\`\`json|\`\`\`/g,'').trim()
      const parsed = JSON.parse(clean)
      if (typeof parsed.calories === 'number' && parsed.calories > 0) {
        // DBとGeminiの加重平均（DBカバレッジが高いほどDB値を重視）
        let result
        if (dbResult && dbResult.calories > 50 && coverage >= 0.5) {
          const w = coverage
          result = {
            calories: Math.round(dbResult.calories * w + parsed.calories * (1-w)),
            protein:  Math.round((dbResult.protein * w + parsed.protein * (1-w)) * 10)/10,
            fat:      Math.round((dbResult.fat     * w + parsed.fat     * (1-w)) * 10)/10,
            carbs:    Math.round((dbResult.carbs   * w + parsed.carbs   * (1-w)) * 10)/10,
            fiber:    Math.round((dbResult.fiber   * w + parsed.fiber   * (1-w)) * 10)/10,
            salt:     Math.round((dbResult.salt    * w + parsed.salt    * (1-w)) * 10)/10,
            vitaminC: Math.round(dbResult.vitaminC * w + parsed.vitaminC * (1-w)),
            iron:     Math.round((dbResult.iron||0) * w + (parsed.iron||0) * (1-w) * 10)/10,
            calcium:  Math.round((dbResult.calcium||0) * w + (parsed.calcium||0) * (1-w)),
            vitaminA: Math.round((dbResult.vitaminA||0) * w + (parsed.vitaminA||0) * (1-w)),
            _source: `db+ai(${Math.round(coverage*100)}%)`,
          }
        } else {
          result = {
              ...parsed,
              iron:    parsed.iron    ?? (dbResult?.iron    || 0),
              calcium: parsed.calcium ?? (dbResult?.calcium || 0),
              vitaminA:parsed.vitaminA?? (dbResult?.vitaminA|| 0),
              _source: 'ai'
            }
        }
        setCachedNutr(mealName, result)
        return result
      }
    } catch(e) { console.warn('Gemini parse error:', e) }
  }

  // DBのみ（Geminiなし・呼び出し失敗時）
  if (dbResult && dbResult.calories > 0) {
    const result = {
      calories: dbResult.calories, protein: dbResult.protein, fat: dbResult.fat,
      carbs: dbResult.carbs, fiber: dbResult.fiber, salt: dbResult.salt,
      vitaminC: dbResult.vitaminC,
      iron: dbResult.iron || 0, calcium: dbResult.calcium || 0, vitaminA: dbResult.vitaminA || 0,
      _source: `db(${Math.round(coverage*100)}%)`
    }
    setCachedNutr(mealName, result)
    return result
  }

  return null
}

async function fetchWeeklyAdvice(summary, apiKey) {
  if (!apiKey || !summary) return null
  return callGemini(`管理栄養士として、以下の1週間の食事データに基づき実践的なアドバイスを3〜4点、日本語箇条書きで。良かった点1つ、改善点2〜3つ。200字以内。\n${summary}`, apiKey)
}

// ── UI部品 ──
function NutrBar({ label, value, unit, max }) {
  const pct = max ? Math.min((value/max)*100, 100) : 0
  const over = value > max
  return (
    <div style={{marginBottom:7}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
        <span style={{color:'var(--text2)'}}>{label}</span>
        <span style={{color:over?'#E53E3E':'var(--text)',fontWeight:500}}>
          {value?.toFixed(1)??'—'}<span style={{fontSize:9,color:'var(--text3)',marginLeft:2}}>{unit}</span>
          {over&&<span style={{fontSize:9,color:'#E53E3E',marginLeft:3}}>↑超過</span>}
        </span>
      </div>
      <div style={{background:'var(--border)',borderRadius:4,height:5,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:over?'#FC8181':NUTR_LABELS.find(n=>n.unit===unit||n.label===label)?.color||'var(--green)',borderRadius:4,transition:'width .5s'}}/>
      </div>
    </div>
  )
}

function SummaryGrid({ totals }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px 8px'}}>
      {NUTR_LABELS.slice(0,4).map(({key,label,unit,color,max})=>{
        const val=totals[key]||0; const over=val>max
        return (
          <div key={key} style={{textAlign:'center',padding:'8px 4px',background:'var(--surface)',borderRadius:'var(--rs)',border:`.5px solid ${over?'#FC8181':'var(--border)'}`}}>
            <div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>{label}</div>
            <div style={{fontSize:15,fontWeight:700,color:over?'#E53E3E':'var(--text)',lineHeight:1.2}}>{val.toFixed(0)}</div>
            <div style={{fontSize:9,color:'var(--text3)'}}>{unit}</div>
            <div style={{background:'var(--border)',borderRadius:3,height:3,marginTop:4,overflow:'hidden'}}>
              <div style={{width:`${Math.min((val/max)*100,100)}%`,height:'100%',background:over?'#FC8181':color,borderRadius:3}}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 食事追加モーダル ──
function QuickAddModal({ date, mealSlot, onAdd, onClose, apiKey }) {
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState([])
  const [aiLoad,     setAiLoad]     = useState(false)
  const [category,   setCategory]   = useState(mealSlot)
  const [customName, setCustomName] = useState('')
  const [focused,    setFocused]    = useState(false)
  const isComposing = useRef(false)
  const dropTouched = useRef(false)
  const timer       = useRef(null)

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
        const names = new Set(local.map(r=>r.name))
        setResults([...local, ...ai.filter(r=>!names.has(r.name)).map(r=>({...r,fromAI:true}))])
      } catch(e){} finally { setAiLoad(false) }
    }, 600)
    return () => clearTimeout(timer.current)
  }, [query])

  const pick = (r) => { onAdd({name:r.name, ings:r.ings||[], meal:category}); onClose() }
  const addCustom = () => { const n=(customName||query).trim(); if(n){onAdd({name:n,ings:[],meal:category});onClose()} }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:600,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{background:'var(--surface)',borderRadius:'18px 18px 0 0',maxHeight:'85dvh',display:'flex',flexDirection:'column'}}>
        <div style={{width:36,height:4,borderRadius:2,background:'var(--border2)',margin:'10px auto 0',flexShrink:0}}/>
        <div style={{padding:'10px 16px 12px',borderBottom:'.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{fontSize:15,fontWeight:600}}>食事を追加</div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',background:'var(--surface2)',border:'none',fontSize:16,cursor:'pointer',color:'var(--text2)'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'12px 14px 30px'}}>
          {/* 食事区分 */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>食事区分</div>
            <div style={{display:'flex',gap:6}}>
              {['朝','昼','夜','間食'].map(cat=>(
                <button key={cat} onClick={()=>setCategory(cat)} style={{
                  flex:1,padding:'6px 0',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:'var(--font)',
                  background:category===cat?'var(--green)':'var(--surface2)',
                  color:category===cat?'#fff':'var(--text2)',
                  touchAction:'manipulation',
                }}>{cat}</button>
              ))}
            </div>
          </div>
          {/* 検索 */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>料理を検索</div>
            <div style={{position:'relative'}}>
              <input value={query} onChange={e=>setQuery(e.target.value)}
                onCompositionStart={()=>{isComposing.current=true}}
                onCompositionEnd={e=>{isComposing.current=false;setQuery(e.target.value+' ');setTimeout(()=>setQuery(e.target.value),0)}}
                onFocus={()=>setFocused(true)}
                onBlur={()=>setTimeout(()=>{if(!dropTouched.current)setFocused(false);dropTouched.current=false},300)}
                placeholder="例：ラーメン、コンビニ弁当、外食"
                style={{width:'100%',padding:'10px 12px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:14,outline:'none',background:'var(--surface)',color:'var(--text)'}}
              />
              {focused && (results.length>0||aiLoad) && (
                <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'var(--surface)',border:'.5px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.12)',zIndex:700,maxHeight:220,overflowY:'auto'}}
                  onMouseDown={()=>{dropTouched.current=true}} onTouchStart={()=>{dropTouched.current=true}}>
                  {aiLoad&&<div style={{padding:'9px 13px',fontSize:12,color:'var(--text3)'}}>検索中...</div>}
                  {results.map((r,i)=>(
                    <button key={i} onClick={()=>pick(r)} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 13px',cursor:'pointer',borderBottom:i===results.length-1?'none':'.5px solid var(--border)',background:'var(--surface)',border:'none',fontFamily:'var(--font)',touchAction:'manipulation'}}>
                      <div style={{fontSize:13,fontWeight:500}}>{r.name}{r.fromAI&&<span style={{fontSize:9,background:'var(--green-l)',color:'var(--green)',borderRadius:3,padding:'1px 5px',marginLeft:5}}>✨AI</span>}</div>
                      {r.ings?.length>0&&<div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{r.ings.slice(0,4).join('・')}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* 自由入力 */}
          <div>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>リストにないものを追加</div>
            <div style={{display:'flex',gap:6}}>
              <input value={customName} onChange={e=>setCustomName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustom()}
                placeholder="外食・残り物など自由入力"
                style={{flex:1,padding:'9px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none'}}/>
              <button onClick={addCustom} style={{padding:'9px 14px',background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',fontFamily:'var(--font)',fontWeight:500,touchAction:'manipulation'}}>追加</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 日別ビュー ──
function DayView({ date, meals, apiKey, person, onQuickAdd, onRemoveMeal }) {
  const [nutritions, setNutritions] = useState({})
  const [loading,    setLoading]    = useState(new Set())
  const [expanded,   setExpanded]   = useState(null)

  const allSlotMeals = [...MEALS, '間食'].flatMap(meal => {
    const v = meals[slotKey(date, meal)]
    return (Array.isArray(v)?v:v?[v]:[])
      .filter(m => !m.for||m.for==='both'||m.for===person||person==='both')
      .map(m => ({ meal, name:m.name, ings:m.ings, multiplier:(person==='both'&&(!m.for||m.for==='both'))?2:1 }))
  })

  useEffect(() => {
    allSlotMeals.forEach(m => {
      if (nutritions[m.name]!==undefined||loading.has(m.name)) return
      const cached = getCachedNutr(m.name)
      if (cached) { setNutritions(p=>({...p,[m.name]:cached})); return }
      if (!apiKey) return
      setLoading(p=>new Set([...p,m.name]))
      fetchNutrition(m.name, m.ings, apiKey).then(d => {
        if(d) setNutritions(p=>({...p,[m.name]:d}))
        setLoading(p=>{const n=new Set(p);n.delete(m.name);return n})
      })
    })
  }, [allSlotMeals.map(m=>m.name).join(','), apiKey])

  const totals = allSlotMeals.reduce((acc,m)=>{
    const n=nutritions[m.name]; if(!n) return acc
    const mul=m.multiplier||1
    return Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(acc[key]||0)+(n[key]||0)*mul]))
  }, {})
  const hasData = Object.values(totals).some(v=>v>0)

  if (allSlotMeals.length===0) return (
    <div style={{textAlign:'center',padding:'32px 16px',color:'var(--text3)'}}>
      <div style={{fontSize:28,marginBottom:8}}>🍽</div>
      <div style={{fontSize:13}}>献立がありません</div>
      <button onClick={()=>onQuickAdd({date,meal:'朝'})} style={{marginTop:12,padding:'8px 18px',background:'var(--green)',color:'#fff',border:'none',borderRadius:20,fontSize:13,cursor:'pointer',fontFamily:'var(--font)',touchAction:'manipulation'}}>＋ 食事を追加</button>
    </div>
  )

  return (
    <>
      {hasData && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>1日合計</div>
          <SummaryGrid totals={totals} />
          <div style={{marginTop:10}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.6px',marginBottom:6}}>ミネラル・ビタミン</div>
            {NUTR_LABELS.slice(4).map(({key,label,unit,max})=>(
              <NutrBar key={key} label={label} value={totals[key]||0} unit={unit} max={max} />
            ))}
          </div>
        </div>
      )}

      <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>食事別</div>
      {[...MEALS,'間食'].map(meal=>{
        const v = meals[slotKey(date,meal)]
        const items = (Array.isArray(v)?v:v?[v]:[]).filter(m=>!m.for||m.for==='both'||m.for===person||person==='both')
        return (
          <div key={meal} style={{marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text3)'}}>{meal}</div>
              <button onClick={()=>onQuickAdd({date,meal})} style={{fontSize:11,color:'var(--green)',background:'var(--green-l)',border:'none',borderRadius:12,padding:'2px 9px',cursor:'pointer',fontFamily:'var(--font)',touchAction:'manipulation'}}>＋ 追加</button>
            </div>
            {items.map((m,i)=>{
              const n=nutritions[m.name]; const isLoad=loading.has(m.name); const ky=`${meal}-${i}`
              return (
                <div key={i} style={{marginBottom:4,borderRadius:'var(--rs)',overflow:'hidden',border:'.5px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'center',padding:'8px 10px',background:'var(--surface)'}}>
                    <div style={{flex:1,cursor:'pointer',display:'flex',alignItems:'center',gap:6}} onClick={()=>setExpanded(expanded===ky?null:ky)}>
                      <span style={{fontSize:13,fontWeight:500}}>🍽 {m.name}</span>
                      {isLoad ? <span style={{fontSize:11,color:'var(--text3)'}}>計算中...</span>
                              : n ? <span style={{fontSize:12,color:'var(--green)',fontWeight:600}}>{n.calories}kcal {expanded===ky?'▲':'▼'}</span>
                                  : <span style={{fontSize:11,color:'var(--text3)'}}>—</span>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();onRemoveMeal(date,meal,i)}} style={{
                      fontSize:16,color:'var(--text3)',background:'var(--surface2)',border:'none',
                      cursor:'pointer',padding:'6px 10px',lineHeight:1,touchAction:'manipulation',
                      flexShrink:0,borderRadius:8,minWidth:36,minHeight:36,
                      display:'flex',alignItems:'center',justifyContent:'center',
                    }}>×</button>
                  </div>
                  {expanded===ky&&n&&(
                    <div style={{padding:'8px 12px',background:'var(--surface2)',borderTop:'.5px solid var(--border)'}}>
                      {NUTR_LABELS.map(({key,label,unit,max})=>(
                        <NutrBar key={key} label={label} value={n[key]||0} unit={unit} max={max/3} />
                      ))}
                      <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>計算方法: {n._source||'推定'}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
      <div style={{fontSize:10,color:'var(--text3)',marginTop:8,lineHeight:1.7,padding:'7px 10px',background:'var(--surface2)',borderRadius:'var(--rs)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <span>💡 Gemini AIによる推定値。実際の値は食材量・調理法により異なります。</span>
        <button onClick={()=>{clearAllNutrCache();window.location.reload()}} style={{fontSize:10,color:'var(--text3)',background:'none',border:'.5px solid var(--border2)',borderRadius:6,padding:'3px 8px',cursor:'pointer',whiteSpace:'nowrap',touchAction:'manipulation',flexShrink:0}}>
          再計算
        </button>
      </div>
    </>
  )
}

// ── 週間ビュー ──
function WeekView({ dates, meals, apiKey, person }) {
  const [nutritions, setNutritions] = useState({})
  const [advice,     setAdvice]     = useState('')
  const [advLoad,    setAdvLoad]    = useState(false)
  const [advErr,     setAdvErr]     = useState('')

  useEffect(() => {
    // まずキャッシュ済みを即反映、API呼び出しは順次（同時実行数を制限）
    const allItems = []
    dates.forEach(date => {
      ;[...MEALS,'間食'].forEach(meal => {
        const v = meals[slotKey(date,meal)]
        ;(Array.isArray(v)?v:v?[v]:[]).forEach(m => {
          if (!allItems.find(x=>x.name===m.name)) allItems.push({name:m.name,ings:m.ings})
        })
      })
    })
    // キャッシュを即反映
    const cached = {}
    allItems.forEach(({name,ings}) => {
      const c = getCachedNutr(name)
      if (c) cached[name] = c
    })
    if (Object.keys(cached).length > 0) setNutritions(p=>({...p,...cached}))
    // APIが必要なものを順次取得（並列制限3）
    if (!apiKey) return
    const needFetch = allItems.filter(({name}) => !cached[name])
    let idx = 0
    const CONCURRENCY = 3
    const fetchNext = () => {
      if (idx >= needFetch.length) return
      const {name, ings} = needFetch[idx++]
      fetchNutrition(name, ings, apiKey).then(d => {
        if (d) setNutritions(p=>({...p,[name]:d}))
        fetchNext()
      })
    }
    for (let i = 0; i < Math.min(CONCURRENCY, needFetch.length); i++) fetchNext()
  }, [apiKey, dates.map(d=>d.toDateString()).join()])

  const dayTotals = dates.map(date => {
    const ms = [...MEALS,'間食'].flatMap(meal=>{
      const v=meals[slotKey(date,meal)]
      return (Array.isArray(v)?v:v?[v]:[]).filter(m=>!m.for||m.for==='both'||m.for===person||person==='both')
    })
    return ms.reduce((acc,m)=>{
      const n=nutritions[m.name]; if(!n) return acc
      return Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(acc[key]||0)+(n[key]||0)]))
    },{})
  })

  const activeDays = dayTotals.filter(d=>Object.values(d).some(v=>v>0)).length
  const weekTotals = dayTotals.reduce((acc,d)=>Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(acc[key]||0)+(d[key]||0)])),{})

  const handleAdvice = async () => {
    if (!apiKey) { setAdvErr('設定タブでGemini APIキーを登録してください'); return }
    setAdvLoad(true); setAdvErr('')
    const summary = dates.map((date,i)=>{
      const d=dayTotals[i]
      if(!Object.values(d).some(v=>v>0)) return null
      const ms=[...MEALS,'間食'].flatMap(meal=>{const v=meals[slotKey(date,meal)];return(Array.isArray(v)?v:v?[v]:[]).map(m=>m.name)})
      return `${DAY_SHORT[date.getDay()]}：${ms.join('、')}（${(d.calories||0).toFixed(0)}kcal）`
    }).filter(Boolean).join('\n')
    if (!summary) { setAdvErr('献立データが不十分です'); setAdvLoad(false); return }
    const result = await fetchWeeklyAdvice(summary, apiKey)
    if (result) setAdvice(result); else setAdvErr('アドバイスの取得に失敗しました')
    setAdvLoad(false)
  }

  return (
    <>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8}}>カロリー推移</div>
        <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80}}>
          {dates.map((date,i)=>{
            const cal=dayTotals[i].calories||0; const pct=Math.min((cal/DAILY_TARGET.calories)*100,100)
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:9,color:'var(--text3)'}}>{cal>0?`${(cal/1000).toFixed(1)}k`:''}</div>
                <div style={{width:'100%',height:60,display:'flex',alignItems:'flex-end',background:'var(--surface2)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{width:'100%',height:`${pct}%`,background:cal>DAILY_TARGET.calories?'#FC8181':'var(--green)',borderRadius:4,transition:'height .5s',minHeight:cal>0?2:0}}/>
                </div>
                <div style={{fontSize:9,color:isToday(date)?'var(--green)':'var(--text3)',fontWeight:isToday(date)?600:400}}>{DAY_SHORT[date.getDay()]}</div>
              </div>
            )
          })}
        </div>
        <div style={{fontSize:9,color:'var(--text3)',textAlign:'right',marginTop:2}}>目標: {DAILY_TARGET.calories}kcal/日</div>
      </div>

      {activeDays>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:7}}>週間平均（{activeDays}日分）</div>
          <SummaryGrid totals={Object.fromEntries(NUTR_LABELS.map(({key})=>[key,(weekTotals[key]||0)/activeDays]))} />
          <div style={{marginTop:10}}>
            {NUTR_LABELS.slice(4).map(({key,label,unit,max})=>(
              <NutrBar key={key} label={label} value={(weekTotals[key]||0)/activeDays} unit={unit} max={max} />
            ))}
          </div>
        </div>
      )}

      <div style={{marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'.8px',textTransform:'uppercase'}}>週間アドバイス</div>
          <button onClick={handleAdvice} disabled={advLoad} style={{padding:'5px 12px',background:'var(--green)',color:'#fff',border:'none',borderRadius:20,fontSize:12,cursor:'pointer',fontFamily:'var(--font)',opacity:advLoad?0.6:1,touchAction:'manipulation'}}>
            {advLoad?'分析中...':'✨ アドバイスをもらう'}
          </button>
        </div>
        {advErr&&<div style={{fontSize:12,color:'var(--red)',padding:'8px',background:'var(--red-l)',borderRadius:'var(--rs)',marginBottom:8}}>{advErr}</div>}
        {advice ? (
          <div style={{background:'var(--green-l)',borderRadius:'var(--rs)',padding:'12px 14px',fontSize:13,lineHeight:1.8,color:'var(--text)',border:'.5px solid rgba(45,106,79,.2)',whiteSpace:'pre-wrap'}}>{advice}</div>
        ) : !advLoad&&(
          <div style={{background:'var(--surface2)',borderRadius:'var(--rs)',padding:'12px 14px',fontSize:12,color:'var(--text3)',lineHeight:1.7}}>
            1週間の献立を入力後、「アドバイスをもらう」を押すとAIが栄養バランスを分析します。
          </div>
        )}
      </div>
    </>
  )
}

// ── メイン ──
export default function Nutrition({ data, members, onUpdate }) {
  const [view,      setView]      = useState('day')
  const [activeDay, setActiveDay] = useState(2)
  const [person,    setPerson]    = useState('both')
  const [quickAdd,  setQuickAdd]  = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const dates  = getDisplayDates(weekOffset)
  const meals  = data?.meals || {}
  const apiKey = localStorage.getItem('geminiKey') || ''
  const m0 = members?.[0] || '自分'
  const m1 = members?.[1] || '相手'

  const handleRemoveMeal = (date, mealTime, idx) => {
    const key = slotKey(date, mealTime)
    const cur = (data?.meals || {})[key]
    const list = Array.isArray(cur) ? cur : cur ? [cur] : []
    const updated = list.filter((_, i) => i !== idx)
    window.dispatchEvent(new CustomEvent('pickplate:removeMeal', { detail: { key, meals: updated } }))
  }

  const handleQuickAdd = (meal) => {
    const { date, meal: mealTime } = quickAdd
    const key = slotKey(date, mealTime)
    window.dispatchEvent(new CustomEvent('pickplate:addMeal', { detail: { key, meal: { ...meal, meal: mealTime } } }))
    setQuickAdd(null)
  }

  return (
    <div style={{paddingBottom:80}}>
      {/* 日別/週間タブ */}
      <div style={{display:'flex',borderBottom:'.5px solid var(--border)',flexShrink:0}}>
        {[{id:'day',label:'日別'},{id:'week',label:'週間'}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)} style={{flex:1,padding:'10px 0',border:'none',background:'none',borderBottom:view===v.id?'2px solid var(--green)':'2px solid transparent',color:view===v.id?'var(--green)':'var(--text3)',fontSize:13,fontWeight:view===v.id?600:400,cursor:'pointer',fontFamily:'var(--font)'}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* 人物フィルタ */}
      <div style={{display:'flex',gap:6,padding:'8px 14px',borderBottom:'.5px solid var(--border)'}}>
        {[{id:'both',label:'2人合計'},{id:'member0',label:m0},{id:'member1',label:m1}].map(p=>(
          <button key={p.id} onClick={()=>setPerson(p.id)} style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:12,background:person===p.id?'var(--green)':'var(--surface2)',color:person===p.id?'#fff':'var(--text2)',fontFamily:'var(--font)',fontWeight:person===p.id?500:400,touchAction:'manipulation'}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* APIキーなし警告 */}
      {!apiKey&&(
        <div style={{margin:'10px 14px 0',background:'var(--amber-l)',border:'.5px solid #E8C94A',borderRadius:'var(--rs)',padding:'9px 12px',fontSize:12,color:'var(--amber)'}}>
          ⚠️ 栄養素計算にはGemini APIキーが必要です。設定タブで登録してください。
        </div>
      )}

      {/* 週移動ナビ */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 14px',borderBottom:'.5px solid var(--border)'}}>
        <button onClick={()=>setWeekOffset(o=>o-1)} style={{padding:'4px 11px',border:'.5px solid var(--border2)',borderRadius:20,background:'none',cursor:'pointer',fontSize:12,color:'var(--text2)',fontFamily:'var(--font)',touchAction:'manipulation'}}>← 前</button>
        <button onClick={()=>setWeekOffset(0)} style={{padding:'4px 11px',border:'none',borderRadius:20,background:weekOffset===0?'var(--green)':'var(--surface2)',cursor:'pointer',fontSize:11,color:weekOffset===0?'#fff':'var(--text3)',fontFamily:'var(--font)',touchAction:'manipulation'}}>
          {weekOffset===0 ? '今週' : weekOffset<0 ? `${-weekOffset}週前` : `${weekOffset}週後`}
        </button>
        <button onClick={()=>setWeekOffset(o=>o+1)} style={{padding:'4px 11px',border:'.5px solid var(--border2)',borderRadius:20,background:'none',cursor:'pointer',fontSize:12,color:'var(--text2)',fontFamily:'var(--font)',touchAction:'manipulation'}}>次 →</button>
      </div>

      {/* 日別：曜日タブ */}
      {view==='day'&&(
        <div style={{display:'flex',overflowX:'auto',scrollbarWidth:'none',borderBottom:'.5px solid var(--border)'}}>
          {dates.map((d,i)=>(
            <button key={i} onClick={()=>setActiveDay(i)} style={{flex:'0 0 auto',minWidth:46,padding:'7px 4px',border:'none',background:'none',borderBottom:i===activeDay?'2px solid var(--green)':'2px solid transparent',color:i===activeDay?'var(--green)':'var(--text3)',cursor:'pointer',fontFamily:'var(--font)',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
              <span style={{fontSize:10,fontWeight:600}}>{DAY_SHORT[d.getDay()]}</span>
              <span style={{fontSize:11,fontWeight:i===activeDay?600:400}}>{d.getMonth()+1}/{d.getDate()}</span>
              {isToday(d)&&<div style={{width:4,height:4,borderRadius:'50%',background:'var(--green)'}}/>}
            </button>
          ))}
        </div>
      )}

      <div style={{padding:'14px'}}>
        {view==='day'
          ? <DayView key={`${activeDay}-${person}`} date={dates[activeDay]} meals={meals} apiKey={apiKey} person={person} onQuickAdd={setQuickAdd} onRemoveMeal={handleRemoveMeal} />
          : <WeekView key={`week-${person}`} dates={dates} meals={meals} apiKey={apiKey} person={person} />
        }
      </div>

      {/* 食事追加モーダル */}
      {quickAdd&&(
        <QuickAddModal
          date={quickAdd.date}
          mealSlot={quickAdd.meal}
          apiKey={apiKey}
          onAdd={handleQuickAdd}
          onClose={()=>setQuickAdd(null)}
        />
      )}
    </div>
  )
}
