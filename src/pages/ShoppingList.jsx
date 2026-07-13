import { useState } from 'react'

export function guessCategory(name) {
  const map = {
    '野菜・果物': ['玉ねぎ','にんじん','じゃがいも','キャベツ','ほうれん草','トマト','きゅうり','レタス','ブロッコリー','なす','ピーマン','もやし','小松菜','大根','かぼちゃ','ごぼう','長ねぎ','生姜','にんにく','ズッキーニ','パプリカ','水菜','春菊','ゴーヤ','白菜'],
    '肉・魚':    ['豚','牛','鶏','ひき肉','鮭','さば','ツナ','あさり','えび','イカ','たら','ぶり','魚','肉','ベーコン','ハム','ウインナー','ソーセージ','いわし','あじ'],
    '乳製品・卵':['卵','牛乳','バター','チーズ','ヨーグルト','生クリーム','豆乳'],
    '調味料・乾物':['醤油','みりん','酒','砂糖','塩','味噌','酢','ごま油','サラダ油','オリーブ油','片栗粉','小麦粉','パスタ','だし','コンソメ','パン粉','白ごま','ナンプラー'],
    '豆腐・大豆': ['豆腐','厚揚げ','油揚げ','納豆','豆乳','こんにゃく','しらたき'],
    '缶詰・加工': ['トマト缶','デミグラスソース缶','ツナ缶','春巻きの皮','餃子の皮'],
  }
  for (const [cat, words] of Object.entries(map)) {
    if (words.some(w => name.includes(w))) return cat
  }
  return 'その他'
}

// ── 食材名の正規化（重複判定用）──
function normName(s) {
  return s.replace(/\s/g, '').replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

// ── 重複食材をマージして count を立てる ──
export function mergeItems(items) {
  const map = new Map() // normName → item
  for (const item of items) {
    const key = normName(item.name)
    if (map.has(key)) {
      const existing = map.get(key)
      existing.count = (existing.count || 1) + 1
      // mealNames を集約
      if (item.mealName && !existing.mealNames?.includes(item.mealName)) {
        existing.mealNames = [...(existing.mealNames || [existing.mealName].filter(Boolean)), item.mealName]
      }
    } else {
      map.set(key, { ...item, count: 1, mealNames: item.mealName ? [item.mealName] : [] })
    }
  }
  return [...map.values()]
}

// ── スタイル ──
const s = {
  page:    { padding: '14px', paddingBottom: 80 },
  addRow:  { display: 'flex', gap: 7, marginBottom: 12 },
  addInp:  { flex: 1, padding: '9px 12px', border: '.5px solid var(--border2)', borderRadius: 'var(--rs)', fontSize: 14, outline: 'none' },
  addBtn:  { padding: '9px 14px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: 13, fontWeight: 500 },
  toolRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clearBtn:{ padding: '5px 10px', background: 'var(--red-l)', color: 'var(--red)', border: 'none', borderRadius: 'var(--rs)', fontSize: 12 },
  sec:     { fontSize: 10, fontWeight: 500, color: 'var(--text3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 5, paddingBottom: 4, borderBottom: '.5px solid var(--border)' },
  catWrap: { marginBottom: 14 },
  item:    (chk) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', cursor: 'pointer', opacity: chk ? .4 : 1, borderBottom: '.5px solid var(--border)' }),
  circle:  (chk) => ({
    width: 20, height: 20, flexShrink: 0,
    border: `1.5px solid ${chk ? 'var(--green)' : 'var(--border2)'}`,
    borderRadius: '50%', background: chk ? 'var(--green)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  nameWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  name:    (chk) => ({ fontSize: 14, textDecoration: chk ? 'line-through' : 'none' }),
  sub:     { fontSize: 10, color: 'var(--text3)' },
  countBadge: { fontSize: 11, background: 'var(--amber-l)', color: 'var(--amber)', borderRadius: 4, padding: '1px 6px', flexShrink: 0 },
  mealBadge:  { fontSize: 9,  background: 'var(--green-l)', color: 'var(--green)', borderRadius: 4, padding: '1px 5px' },
  delBtn:  { fontSize: 16, color: 'var(--text3)' },
  prog:    { background: 'var(--surface2)', borderRadius: 'var(--rs)', padding: '9px 12px', marginBottom: 12 },
  progRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 5 },
  progBg:  { background: 'var(--border)', borderRadius: 4, height: 4, overflow: 'hidden' },
  progBar: (p) => ({ background: 'var(--green)', height: '100%', width: `${p}%`, transition: 'width .3s', borderRadius: 4 }),
  empty:   { textAlign: 'center', padding: '40px 16px', color: 'var(--text3)' },
}

const CHECK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="11" height="11">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function ShoppingList({ data, onUpdate }) {
  const [newItem, setNewItem]   = useState('')
  const [hovered, setHovered]   = useState(null)

  const rawItems = data?.items || []
  // 表示用にマージ（checked は rawItems の先頭アイテムの状態を使う）
  const items = mergeItems(rawItems)

  const updateRaw = (next) => onUpdate({ items: next })

  // 追加（rawItemsに追記）
  const addItem = (name) => {
    const n = name.trim(); if (!n) return
    if (rawItems.find(i => normName(i.name) === normName(n))) return
    updateRaw([...rawItems, { id: Date.now() + Math.random(), name: n, category: guessCategory(n), checked: false, source: 'manual', count: 1, mealNames: [] }])
    setNewItem('')
  }

  // チェック: 同名アイテム全部トグル
  const toggle = (displayItem) => {
    const key = normName(displayItem.name)
    const next = rawItems.map(i => normName(i.name) === key ? { ...i, checked: !displayItem.checked } : i)
    updateRaw(next)
  }

  // 削除: 同名アイテム全部削除
  const remove = (displayItem) => {
    const key = normName(displayItem.name)
    updateRaw(rawItems.filter(i => normName(i.name) !== key))
  }

  const clearChecked = () => updateRaw(rawItems.filter(i => !i.checked))

  const checkedCount = items.filter(i => i.checked).length
  const pct = items.length ? Math.round(checkedCount / items.length * 100) : 0

  // カテゴリ別グループ
  const byCat = {}
  items.forEach(item => {
    const cat = item.category || 'その他'
    if (!byCat[cat]) byCat[cat] = []
    byCat[cat].push(item)
  })

  return (
    <div style={s.page}>

      {/* 追加フォーム */}
      <div style={s.addRow}>
        <input
          style={s.addInp}
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem(newItem)}
          placeholder="アイテムを追加（Enterで確定）"
        />
        <button style={s.addBtn} onClick={() => addItem(newItem)}>追加</button>
      </div>

      {items.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🛒</div>
          <div style={{ fontSize: 13 }}>献立タブで料理を選ぶと<br />食材が自動で追加されます</div>
        </div>
      ) : (
        <>
          {/* 進捗 */}
          <div style={s.prog}>
            <div style={s.progRow}><span>進捗</span><span>{checkedCount} / {items.length} 件</span></div>
            <div style={s.progBg}><div style={s.progBar(pct)} /></div>
          </div>

          {/* ツール */}
          <div style={s.toolRow}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{items.length}件</span>
            <button style={s.clearBtn} onClick={clearChecked}>チェック済みを削除</button>
          </div>

          {/* カテゴリ別リスト */}
          {Object.entries(byCat).map(([cat, catItems]) => (
            <div key={cat} style={s.catWrap}>
              <div style={s.sec}>{cat}</div>
              {catItems.map(item => (
                <div
                  key={item.id}
                  style={s.item(item.checked)}
                  onClick={() => toggle(item)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* チェックサークル */}
                  <div style={s.circle(item.checked)}>
                    {item.checked && CHECK_SVG}
                  </div>

                  {/* 名前・サブ情報 */}
                  <div style={s.nameWrap}>
                    <span style={s.name(item.checked)}>{item.name}</span>
                    {item.mealNames?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {item.mealNames.map(mn => (
                          <span key={mn} style={s.mealBadge}>📅 {mn}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ×個バッジ */}
                  {item.count > 1 && (
                    <span style={s.countBadge}>×{item.count}</span>
                  )}

                  {/* 削除ボタン */}
                  <span
                    style={{ ...s.delBtn, opacity: hovered === item.id ? 1 : 0 }}
                    onClick={e => { e.stopPropagation(); remove(item) }}
                  >×</span>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
