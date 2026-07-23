import { useState, useEffect, useRef } from 'react'
import { checkRoom } from '../firebase'
import { DEFAULT_STAPLES } from '../App'
import { searchRecipes, fetchGeminiSuggestions } from '../recipes'

// ── 確認ダイアログ ──
function ConfirmDialog({ message, onOk, onCancel }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:900,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:'var(--surface)',borderRadius:'var(--r)',padding:20,width:'100%',maxWidth:320,boxShadow:'0 8px 32px rgba(0,0,0,.18)'}}>
        <div style={{fontSize:14,color:'var(--text)',marginBottom:18,lineHeight:1.7}}>{message}</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onCancel} style={{flex:1,padding:'9px',background:'var(--surface2)',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',fontFamily:'var(--font)',color:'var(--text2)'}}>キャンセル</button>
          <button onClick={onOk}     style={{flex:1,padding:'9px',background:'var(--red-l)',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',fontFamily:'var(--font)',color:'var(--red)',fontWeight:600}}>リセット</button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// メンバー名設定
// ════════════════════════════════════════
function MemberSettings({ data, onUpdate }) {
  const members = data?.members || ['自分', '相手']
  const [name0, setName0] = useState(members[0])
  const [name1, setName1] = useState(members[1])
  const [saved, setSaved] = useState(false)
  const save = () => {
    onUpdate({ members: [name0.trim()||'自分', name1.trim()||'相手'] })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div>
      <div style={{fontSize:11,color:'var(--text3)',marginBottom:10,lineHeight:1.7}}>
        料理ごとに「誰用か」を指定できます。栄養素も個人別に計算されます。
      </div>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        {[{label:'メンバー1',val:name0,set:setName0,ph:'例：かずお'},{label:'メンバー2',val:name1,set:setName1,ph:'例：彼女'}].map(({label,val,set,ph})=>(
          <div key={label} style={{flex:1}}>
            <label style={{fontSize:11,color:'var(--text3)',display:'block',marginBottom:4}}>{label}</label>
            <input value={val} onChange={e=>set(e.target.value)} placeholder={ph}
              style={{width:'100%',padding:'8px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none'}}/>
          </div>
        ))}
      </div>
      <button onClick={save} style={{width:'100%',padding:'8px',background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)'}}>
        {saved ? '✓ 保存しました' : '保存'}
      </button>
    </div>
  )
}

// ════════════════════════════════════════
// マイセット管理
// ════════════════════════════════════════
function MySetManager({ data, onUpdate }) {
  const [sets, setSetsLocal] = useState(() => { try { return JSON.parse(localStorage.getItem('mySets')||'[]') } catch { return [] } })
  const fireSets   = data?.mySets
  const activeSets = (fireSets && fireSets.length > 0) ? fireSets : sets
  const saveSets   = (next) => { localStorage.setItem('mySets', JSON.stringify(next)); setSetsLocal(next); onUpdate?.({ mySets: next }) }

  const [creating,   setCreating]   = useState(false)
  const [editIdx,    setEditIdx]    = useState(null)
  const [setName,    setSetName]    = useState('')
  const [mealList,   setMealList]   = useState([])
  const [expandIdx,  setExpandIdx]  = useState(null)
  const [sgQuery,    setSgQuery]    = useState('')
  const [sgResults,  setSgResults]  = useState([])
  const [sgLoading,  setSgLoading]  = useState(false)
  const [sgFocused,  setSgFocused]  = useState(false)
  const sgDropRef   = useRef(false)
  const sgTimer     = useRef(null)
  const sgComposing = useRef(false)

  useEffect(() => {
    if (!sgQuery) { setSgResults([]); return }
    if (sgComposing.current) return
    const local = searchRecipes(sgQuery)
    setSgResults(local)
    const key = localStorage.getItem('geminiKey') || ''
    if (!key) return
    clearTimeout(sgTimer.current)
    setSgLoading(true)
    sgTimer.current = setTimeout(async () => {
      try {
        const ai = await fetchGeminiSuggestions(sgQuery, key)
        const names = new Set(local.map(r=>r.name))
        setSgResults([...local, ...ai.filter(r=>!names.has(r.name)).map(r=>({...r,fromAI:true}))])
      } catch(e){} finally { setSgLoading(false) }
    }, 600)
    return () => clearTimeout(sgTimer.current)
  }, [sgQuery])

  const pickSuggestion = (r) => {
    setMealList(prev => prev.find(m=>m.name===r.name) ? prev : [...prev, {name:r.name, ings:r.ings||[]}])
    setSgQuery(''); setSgResults([]); setSgFocused(false)
  }
  const addManual = () => {
    const v = sgQuery.trim(); if (!v) return
    setMealList(prev => prev.find(m=>m.name===v) ? prev : [...prev, {name:v, ings:[]}])
    setSgQuery(''); setSgResults([])
  }
  const removeMeal  = (i) => setMealList(prev => prev.filter((_,j)=>j!==i))
  const openCreate  = () => { setSetName(''); setMealList([]); setSgQuery(''); setCreating(true); setEditIdx(null) }
  const openEdit    = (i) => { setSetName(activeSets[i].name); setMealList([...activeSets[i].meals]); setSgQuery(''); setEditIdx(i); setCreating(true) }
  const deleteSet   = (i) => saveSets(activeSets.filter((_,j)=>j!==i))
  const saveSet     = () => {
    if (!setName.trim() || mealList.length === 0) return
    const entry = { name:setName.trim(), meals:mealList }
    saveSets(editIdx!==null ? activeSets.map((s,i)=>i===editIdx?entry:s) : [...activeSets, entry])
    setCreating(false); setEditIdx(null)
  }

  const showDrop = sgFocused && (sgResults.length > 0 || sgLoading)

  return (
    <div>
      {activeSets.length===0 && !creating && (
        <div style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>まだセットがありません。献立入力時にワンタップで全品追加できます。</div>
      )}
      {activeSets.map((set,i) => (
        <div key={i} style={{marginBottom:8,border:'.5px solid var(--border)',borderRadius:'var(--rs)',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',padding:'9px 12px',background:'var(--surface2)',cursor:'pointer'}} onClick={()=>setExpandIdx(expandIdx===i?null:i)}>
            <span style={{flex:1,fontSize:13,fontWeight:500}}>{set.name}</span>
            <span style={{fontSize:11,color:'var(--text3)',marginRight:10}}>{set.meals.length}品</span>
            <button onClick={e=>{e.stopPropagation();openEdit(i)}} style={{fontSize:11,padding:'2px 8px',border:'.5px solid var(--border2)',borderRadius:4,background:'none',cursor:'pointer',color:'var(--text2)',marginRight:4}}>編集</button>
            <button onClick={e=>{e.stopPropagation();deleteSet(i)}} style={{fontSize:11,padding:'2px 8px',border:'none',borderRadius:4,background:'var(--red-l)',cursor:'pointer',color:'var(--red)'}}>削除</button>
          </div>
          {expandIdx===i && (
            <div style={{padding:'8px 12px'}}>
              {set.meals.map((m,j)=>(
                <div key={j} style={{fontSize:12,padding:'4px 0',borderBottom:'.5px solid var(--border)',color:'var(--text2)'}}>
                  🍽 {m.name}{m.ings?.length>0&&<span style={{fontSize:10,color:'var(--text3)',marginLeft:6}}>{m.ings.slice(0,3).join('・')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {creating ? (
        <div style={{background:'var(--surface2)',borderRadius:'var(--rs)',padding:12,marginTop:8}}>
          <div style={{fontSize:11,color:'var(--text3)',marginBottom:8,fontWeight:500}}>{editIdx!==null?'セットを編集':'新しいセットを作成'}</div>
          <input value={setName} onChange={e=>setSetName(e.target.value)} placeholder="セット名（例：和食の夜）"
            style={{width:'100%',padding:'8px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none',marginBottom:10}}/>
          {mealList.length>0&&(
            <div style={{marginBottom:8}}>
              {mealList.map((m,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',padding:'6px 9px',background:'var(--green-l)',borderRadius:'var(--rs)',marginBottom:4}}>
                  <span style={{flex:1,fontSize:13,color:'var(--green)',fontWeight:500}}>🍽 {m.name}</span>
                  {m.ings?.length>0&&<span style={{fontSize:10,color:'var(--green)',opacity:.7,marginRight:6}}>{m.ings.slice(0,3).join('・')}</span>}
                  <button onClick={()=>removeMeal(i)} style={{fontSize:15,color:'var(--text3)',border:'none',background:'none',cursor:'pointer',lineHeight:1}}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{position:'relative',marginBottom:10}}>
            <div style={{display:'flex',gap:6}}>
              <input value={sgQuery} onChange={e=>setSgQuery(e.target.value)}
                onCompositionStart={()=>{sgComposing.current=true}}
                onCompositionEnd={e=>{sgComposing.current=false;setSgQuery(e.target.value+' ');setTimeout(()=>setSgQuery(e.target.value),0)}}
                onFocus={()=>setSgFocused(true)}
                onBlur={()=>setTimeout(()=>{if(!sgDropRef.current)setSgFocused(false);sgDropRef.current=false},250)}
                onKeyDown={e=>e.key==='Enter'&&addManual()}
                placeholder="料理名を検索して追加"
                style={{flex:1,padding:'8px 11px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,outline:'none'}}/>
              {sgQuery&&<button onClick={addManual} style={{padding:'8px 12px',background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',flexShrink:0}}>追加</button>}
            </div>
            {showDrop&&(
              <div onMouseDown={()=>{sgDropRef.current=true}}
                style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'var(--surface)',border:'.5px solid var(--border)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.12)',zIndex:600,maxHeight:200,overflowY:'auto'}}>
                {sgLoading&&<div style={{padding:'9px 13px',fontSize:12,color:'var(--text3)'}}>検索中...</div>}
                {sgResults.map((r,i)=>(
                  <div key={i} onClick={()=>pickSuggestion(r)}
                    style={{padding:'9px 13px',cursor:'pointer',borderBottom:i===sgResults.length-1?'none':'.5px solid var(--border)'}}>
                    <div style={{fontSize:13,fontWeight:500}}>{r.name}{r.fromAI&&<span style={{fontSize:9,background:'var(--green-l)',color:'var(--green)',borderRadius:3,padding:'1px 5px',marginLeft:5}}>✨AI</span>}</div>
                    {r.ings?.length>0&&<div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>{r.ings.slice(0,4).join('・')}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>{setCreating(false);setEditIdx(null)}} style={{flex:1,padding:'9px',background:'var(--surface)',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',color:'var(--text2)',fontFamily:'var(--font)'}}>キャンセル</button>
            <button onClick={saveSet} disabled={!setName.trim()||mealList.length===0}
              style={{flex:2,padding:'9px',background:'var(--green)',color:'#fff',border:'none',borderRadius:'var(--rs)',fontSize:13,cursor:'pointer',fontWeight:600,fontFamily:'var(--font)',opacity:(!setName.trim()||mealList.length===0)?0.5:1}}>保存</button>
          </div>
        </div>
      ) : (
        <button onClick={openCreate} style={{width:'100%',marginTop:8,padding:'9px',background:'none',border:'.5px dashed var(--border2)',borderRadius:'var(--rs)',fontSize:13,color:'var(--text3)',cursor:'pointer',fontFamily:'var(--font)'}}>
          ＋ 新しいセットを作成
        </button>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// 除外食材管理
// ════════════════════════════════════════
function ExclusionManager() {
  const [exc, setExc] = useState(() => { try { return JSON.parse(localStorage.getItem('mealExclusions')||'{}') } catch { return {} } })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const entries = Object.entries(exc).filter(([,ings])=>ings.length>0)
  const removeIng = (meal, ing) => {
    const next = {...exc, [meal]:exc[meal].filter(x=>x!==ing)}
    if (next[meal].length===0) delete next[meal]
    localStorage.setItem('mealExclusions', JSON.stringify(next)); setExc({...next})
  }
  const clearAll = () => { localStorage.setItem('mealExclusions','{}'); setExc({}); setConfirmOpen(false) }
  if (entries.length===0) return <div style={{fontSize:12,color:'var(--text3)'}}>まだ記録はありません。献立で料理の食材をタップすると記録されます。</div>
  return (
    <div>
      {confirmOpen && <ConfirmDialog message="除外食材の記録をすべてリセットしますか？" onOk={clearAll} onCancel={()=>setConfirmOpen(false)} />}
      {entries.map(([meal,ings])=>(
        <div key={meal} style={{marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:500,marginBottom:5}}>🍽 {meal}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {ings.map(ing=>(
              <span key={ing} style={{fontSize:12,padding:'3px 9px',borderRadius:20,background:'var(--red-l)',color:'var(--red)',display:'flex',alignItems:'center',gap:3}}>
                {ing}<span style={{cursor:'pointer',fontSize:13,lineHeight:1}} onClick={()=>removeIng(meal,ing)}>×</span>
              </span>
            ))}
          </div>
        </div>
      ))}
      <button onClick={()=>setConfirmOpen(true)} style={{fontSize:12,padding:'6px 12px',border:'.5px solid var(--border2)',borderRadius:'var(--rs)',background:'none',cursor:'pointer',color:'var(--text2)',marginTop:4}}>すべてリセット</button>
    </div>
  )
}

// ════════════════════════════════════════
// メイン Settings
// ════════════════════════════════════════
const s = {
  page:  { padding:'14px', paddingBottom:80 },
  sec:   { fontSize:10, fontWeight:500, color:'var(--text3)', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:10, marginTop:20 },
  card:  { background:'var(--surface)', border:'.5px solid var(--border)', borderRadius:'var(--r)', padding:'14px', marginBottom:10 },
  label: { fontSize:12, color:'var(--text2)', marginBottom:8, display:'block', lineHeight:1.7 },
  inp:   { width:'100%', padding:'9px 12px', border:'.5px solid var(--border2)', borderRadius:'var(--rs)', fontSize:14, outline:'none', marginBottom:8 },
  row:   { display:'flex', gap:7 },
  btn:   (c) => ({ flex:1, padding:'9px 0', border:'none', borderRadius:'var(--rs)', fontSize:13, fontWeight:500, cursor:'pointer', background:c==='green'?'var(--green)':c==='red'?'var(--red-l)':'var(--surface2)', color:c==='green'?'#fff':c==='red'?'var(--red)':'var(--text)' }),
  roomCode: { fontSize:26, fontWeight:700, letterSpacing:5, color:'var(--green)', textAlign:'center', background:'var(--green-l)', borderRadius:'var(--rs)', padding:'12px 0', marginBottom:8, fontFamily:'monospace' },
  hint:  { fontSize:11, color:'var(--text3)', lineHeight:1.8 },
  stapleWrap: { display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 },
  stapleTag:  { fontSize:12, padding:'4px 10px', borderRadius:20, background:'var(--surface2)', color:'var(--text2)', display:'flex', alignItems:'center', gap:4 },
  stapleDel:  { fontSize:13, color:'var(--text3)', cursor:'pointer', lineHeight:1 },
  addForm: { marginTop:10, display:'flex', gap:7 },
  addInp:  { flex:1, padding:'8px 11px', border:'.5px solid var(--border2)', borderRadius:'var(--rs)', fontSize:13, outline:'none' },
  addBtn:  { padding:'8px 14px', background:'var(--green)', color:'#fff', border:'none', borderRadius:'var(--rs)', fontSize:13, cursor:'pointer' },
}

function genCode() { return Math.random().toString(36).substring(2,8).toUpperCase() }

export default function Settings({ data, onUpdate, roomCode, onRoomChange }) {
  const [inputCode,       setInputCode]       = useState('')
  const [geminiKey,       setGeminiKey]       = useState(localStorage.getItem('geminiKey')||'')
  const [geminiSaved,     setGeminiSaved]     = useState(!!localStorage.getItem('geminiKey'))
  const [joining,         setJoining]         = useState(false)
  const [msg,             setMsg]             = useState('')
  const [newStaple,       setNewStaple]       = useState('')
  const [stapleConfirm,   setStapleConfirm]   = useState(false)

  const staples = data?.staples || DEFAULT_STAPLES
  const updateStaples = (next) => onUpdate({ staples: next })
  const addStaple     = () => { const v=newStaple.trim(); if(!v||staples.includes(v)) return; updateStaples([...staples,v]); setNewStaple('') }
  const removeStaple  = (s) => updateStaples(staples.filter(x=>x!==s))
  const resetStaples  = () => updateStaples(DEFAULT_STAPLES)

  const createRoom = () => { const c=genCode(); onRoomChange(c); setMsg('ルームを作成しました！コードを彼女に送ってください。') }
  const joinRoom   = async () => {
    const code=inputCode.trim().toUpperCase(); if(code.length<4){setMsg('コードを入力してください');return}
    setJoining(true)
    const exists=await checkRoom(code); setJoining(false)
    if(exists){onRoomChange(code);setMsg(`ルーム「${code}」に参加しました！`)} else setMsg('ルームが見つかりませんでした。')
  }
  const saveGemini = () => { localStorage.setItem('geminiKey',geminiKey); setGeminiSaved(true); setMsg('Gemini APIキーを保存しました') }

  return (
    <div style={s.page}>

      {/* メンバー設定 */}
      <div style={{...s.sec, marginTop:0}}>メンバー設定</div>
      <div style={s.card}><MemberSettings data={data} onUpdate={onUpdate} /></div>

      {/* Myセット */}
      <div style={s.sec}>Myセット</div>
      <div style={s.card}>
        <label style={s.label}>よく食べる料理の組み合わせをセットで登録。献立入力時にワンタップで全品まとめて追加できます。</label>
        <MySetManager data={data} onUpdate={onUpdate} />
      </div>

      {/* 常備品 */}
      <div style={s.sec}>常備品（買い物リストに出さないもの）</div>
      <div style={s.card}>
        <label style={s.label}>ここに登録した食材は買い物リストに追加されません。</label>
        <div style={s.stapleWrap}>
          {staples.map(st=>(
            <span key={st} style={s.stapleTag}>{st}<span style={s.stapleDel} onClick={()=>removeStaple(st)}>×</span></span>
          ))}
        </div>
        <div style={s.addForm}>
          <input style={s.addInp} value={newStaple} onChange={e=>setNewStaple(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addStaple()} placeholder="追加する常備品（例：バター）"/>
          <button style={s.addBtn} onClick={addStaple}>追加</button>
        </div>
        <>
          {stapleConfirm && <ConfirmDialog message="常備品リストをデフォルトに戻しますか？" onOk={()=>{resetStaples();setStapleConfirm(false)}} onCancel={()=>setStapleConfirm(false)} />}
          <button style={{...s.btn('white'),marginTop:10,width:'100%',fontSize:12}} onClick={()=>setStapleConfirm(true)}>デフォルトに戻す</button>
        </>
      </div>

      {/* 除外食材 */}
      <div style={s.sec}>料理ごとの除外食材</div>
      <div style={s.card}>
        <label style={s.label}>献立で食材をタップして除外した記録です。次回同じ料理を選んだとき自動で除外されます。</label>
        <ExclusionManager />
      </div>

      {/* 共有ルーム */}
      <div style={s.sec}>共有ルーム</div>
      <div style={s.card}>
        {roomCode ? (
          <>
            <label style={s.label}>現在のルームコード</label>
            <div style={s.roomCode}>{roomCode}</div>
            <div style={s.hint}>このコードを彼女に送って「ルームに参加」から入力してもらうとリアルタイム同期されます。</div>
            <button style={{...s.btn('white'),marginTop:10,width:'100%'}} onClick={createRoom}>新しいルームを作る</button>
          </>
        ) : (
          <>
            <label style={s.label}>ルームを作成するか、受け取ったコードで参加してください。<br/><span style={{color:'var(--green)'}}>※ルームなしでも献立はFirebaseに自動保存されます。</span></label>
            <button style={{...s.btn('green'),width:'100%',marginBottom:10}} onClick={createRoom}>＋ 新しいルームを作る</button>
            <div style={{...s.hint,marginBottom:8}}>または受け取ったコードで参加</div>
            <input style={s.inp} value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} placeholder="ルームコードを入力" maxLength={8}/>
            <button style={{...s.btn('green'),width:'100%'}} onClick={joinRoom} disabled={joining}>{joining?'確認中...':'ルームに参加'}</button>
          </>
        )}
      </div>

      {/* Gemini API */}
      <div style={s.sec}>Gemini API（任意）</div>
      <div style={s.card}>
        <label style={s.label}>料理名入力時のAIサジェストと栄養素計算に使います。</label>
        <input style={s.inp} type="text" value={geminiKey} onChange={e=>{setGeminiKey(e.target.value);setGeminiSaved(false)}} placeholder="AIzaSy..."/>
        <div style={s.row}>
          <button style={s.btn('white')} onClick={()=>window.open('https://aistudio.google.com/app/apikey','_blank')}>取得する →</button>
          <button style={s.btn('green')} onClick={saveGemini}>{geminiSaved?'✓ 保存済み':'保存'}</button>
        </div>
        <div style={{...s.hint,marginTop:8}}>Gemini 1.5 Flash は1日1,500リクエスト無料です。</div>
      </div>

      {msg&&<div style={{background:'var(--green-l)',color:'var(--green)',borderRadius:'var(--rs)',padding:'10px 14px',fontSize:13,marginTop:10}}>{msg}</div>}
    </div>
  )
}
