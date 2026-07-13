// ============================================================
// ローカル料理DB（サジェスト用ベース）
// ============================================================
export const RECIPE_DB = [
  // 豚肉
  { name: '豚の生姜焼き', ings: ['豚ロース', '玉ねぎ', '生姜', '醤油', 'みりん', '酒', '砂糖'] },
  { name: '豚汁', ings: ['豚バラ', '大根', 'にんじん', 'こんにゃく', 'ごぼう', '味噌', '長ねぎ'] },
  { name: '豚の角煮', ings: ['豚バラブロック', '醤油', 'みりん', '酒', '砂糖', '生姜', '長ねぎ'] },
  { name: '回鍋肉', ings: ['豚バラ', 'キャベツ', 'ピーマン', '豆板醤', '甜麺醤', '醤油', 'にんにく'] },
  { name: '豚バラ大根', ings: ['豚バラ', '大根', '醤油', 'みりん', '酒', '砂糖', '生姜'] },
  { name: '豚キムチ炒め', ings: ['豚バラ', 'キムチ', '玉ねぎ', 'ごま油', '醤油', '長ねぎ'] },
  { name: 'ポークソテー', ings: ['豚ロース', '塩', 'こしょう', 'バター', '醤油', 'みりん'] },
  { name: '豚肉のトマト煮', ings: ['豚肩ロース', 'トマト缶', '玉ねぎ', 'にんじん', 'にんにく', 'オリーブ油'] },
  { name: '麻婆豆腐', ings: ['豚ひき肉', '豆腐', '豆板醤', '甜麺醤', 'にんにく', '生姜', 'ごま油', '長ねぎ'] },
  { name: '餃子', ings: ['豚ひき肉', 'キャベツ', 'にら', 'にんにく', '生姜', 'ごま油', '餃子の皮'] },
  { name: '豚丼', ings: ['豚バラ', '玉ねぎ', '醤油', 'みりん', '酒', '砂糖'] },
  { name: '肉じゃが', ings: ['豚バラ', 'じゃがいも', '玉ねぎ', 'にんじん', '糸こんにゃく', '醤油', 'みりん'] },
  { name: '焼きそば', ings: ['豚バラ', '中華麺', 'キャベツ', 'もやし', 'にんじん', '中濃ソース'] },
  { name: '豚の塩麹焼き', ings: ['豚ロース', '塩麹', 'サラダ油', 'レモン'] },
  { name: 'ルーロー飯', ings: ['豚バラ', '醤油', 'みりん', '酒', '砂糖', '五香粉', 'にんにく'] },
  // 鶏肉
  { name: '唐揚げ', ings: ['鶏もも肉', '醤油', '酒', '生姜', 'にんにく', '片栗粉', '揚げ油'] },
  { name: '親子丼', ings: ['鶏もも肉', '卵', '玉ねぎ', 'だし', '醤油', 'みりん', '酒'] },
  { name: '鶏の照り焼き', ings: ['鶏もも肉', '醤油', 'みりん', '酒', '砂糖', 'サラダ油'] },
  { name: '棒棒鶏', ings: ['鶏むね肉', 'きゅうり', '白ごま', 'ごま油', '醤油', '砂糖', '酢'] },
  { name: 'チキン南蛮', ings: ['鶏もも肉', '卵', '小麦粉', '酢', '醤油', '砂糖', 'マヨネーズ'] },
  { name: '鶏のトマト煮込み', ings: ['鶏もも肉', 'トマト缶', '玉ねぎ', 'にんにく', 'オリーブ油'] },
  { name: '水炊き', ings: ['鶏もも肉', '白菜', '豆腐', '春菊', '長ねぎ', 'ポン酢'] },
  { name: 'チキンカレー', ings: ['鶏もも肉', '玉ねぎ', 'にんじん', 'じゃがいも', 'カレールー'] },
  { name: '鶏そぼろ丼', ings: ['鶏ひき肉', '卵', '醤油', 'みりん', '酒', '砂糖'] },
  { name: 'よだれ鶏', ings: ['鶏むね肉', '醤油', '酢', '砂糖', 'ごま油', '豆板醤', 'にんにく'] },
  { name: 'ガパオライス', ings: ['鶏ひき肉', 'パプリカ', 'ピーマン', 'バジル', 'にんにく', 'ナンプラー', '卵'] },
  { name: '蒸し鶏のねぎ塩だれ', ings: ['鶏むね肉', '長ねぎ', '塩', 'ごま油', '酒', '生姜'] },
  // 牛肉
  { name: '牛丼', ings: ['牛切り落とし', '玉ねぎ', '醤油', 'みりん', '酒', '砂糖', 'だし'] },
  { name: 'ビーフシチュー', ings: ['牛すね肉', '玉ねぎ', 'にんじん', 'じゃがいも', 'デミグラスソース缶', '赤ワイン'] },
  { name: 'すき焼き', ings: ['牛ロース', '白菜', '長ねぎ', '豆腐', '春菊', 'しらたき', '醤油', 'みりん', '卵'] },
  { name: 'ハンバーグ', ings: ['合いびき肉', '玉ねぎ', 'パン粉', '牛乳', '卵', '塩', 'こしょう', 'ケチャップ'] },
  { name: 'ミートソースパスタ', ings: ['合いびき肉', '玉ねぎ', 'にんじん', 'トマト缶', 'にんにく', 'パスタ'] },
  { name: 'キーマカレー', ings: ['合いびき肉', '玉ねぎ', 'にんじん', 'トマト缶', 'カレールー', 'にんにく', '生姜'] },
  // 鮭
  { name: '鮭の塩焼き', ings: ['鮭', '塩', 'サラダ油', '大根おろし'] },
  { name: '鮭のムニエル', ings: ['鮭', '塩', 'こしょう', '小麦粉', 'バター', 'レモン'] },
  { name: '鮭の味噌バター焼き', ings: ['鮭', '味噌', 'バター', 'みりん', '酒', '玉ねぎ', 'もやし'] },
  { name: '鮭のホイル焼き', ings: ['鮭', '玉ねぎ', 'しめじ', 'バター', '醤油'] },
  { name: '鮭の南蛮漬け', ings: ['鮭', '玉ねぎ', 'にんじん', 'ピーマン', '酢', '醤油', '砂糖', '片栗粉'] },
  { name: '鮭のクリーム煮', ings: ['鮭', '玉ねぎ', 'しめじ', 'ほうれん草', '生クリーム', 'バター', 'コンソメ'] },
  // さば
  { name: 'さばの味噌煮', ings: ['さば', '味噌', 'みりん', '酒', '砂糖', '生姜'] },
  { name: 'さばの竜田揚げ', ings: ['さば', '醤油', '酒', '生姜', '片栗粉', '揚げ油'] },
  { name: 'さばの塩焼き', ings: ['さば', '塩', '大根おろし', '醤油'] },
  // ぶり・他の魚
  { name: 'ぶりの照り焼き', ings: ['ぶり', '醤油', 'みりん', '酒', '砂糖', 'サラダ油'] },
  { name: 'ぶり大根', ings: ['ぶり', '大根', '生姜', '醤油', 'みりん', '酒', '砂糖'] },
  { name: 'たらのホイル蒸し', ings: ['たら', '白菜', 'しめじ', 'バター', '醤油'] },
  { name: 'たらのムニエル', ings: ['たら', '塩', 'こしょう', '小麦粉', 'バター', 'レモン'] },
  { name: 'いわしの梅煮', ings: ['いわし', '梅干し', '醤油', 'みりん', '酒', '砂糖', '生姜'] },
  { name: 'あじの南蛮漬け', ings: ['あじ', '玉ねぎ', 'にんじん', 'ピーマン', '酢', '醤油', '砂糖'] },
  // えび・あさり
  { name: 'えびチリ', ings: ['えび', '豆板醤', 'ケチャップ', 'にんにく', '生姜', '長ねぎ'] },
  { name: 'えびの塩炒め', ings: ['えび', 'にんにく', '生姜', '塩', '酒', 'ごま油'] },
  { name: 'えびのアヒージョ', ings: ['えび', 'にんにく', 'オリーブ油', '塩', '唐辛子'] },
  { name: 'あさりの酒蒸し', ings: ['あさり', '酒', 'バター', 'にんにく', '長ねぎ'] },
  { name: 'ボンゴレビアンコ', ings: ['あさり', 'パスタ', 'にんにく', 'オリーブ油', '白ワイン', 'パセリ'] },
  // 野菜
  { name: '麻婆なす', ings: ['なす', '豚ひき肉', '豆板醤', '甜麺醤', 'にんにく', '生姜', 'ごま油'] },
  { name: 'なすの味噌炒め', ings: ['なす', 'ピーマン', '味噌', 'みりん', '酒', '砂糖', 'ごま油'] },
  { name: 'ラタトゥイユ', ings: ['なす', 'ズッキーニ', 'パプリカ', 'トマト', '玉ねぎ', 'にんにく', 'オリーブ油'] },
  { name: '野菜炒め', ings: ['キャベツ', 'もやし', 'にんじん', 'ピーマン', 'にんにく', '塩', 'ごま油'] },
  { name: 'かぼちゃの煮物', ings: ['かぼちゃ', 'だし', '醤油', 'みりん', '酒', '砂糖'] },
  { name: 'ポテトサラダ', ings: ['じゃがいも', 'にんじん', '玉ねぎ', 'きゅうり', 'ハム', 'マヨネーズ'] },
  { name: 'きんぴらごぼう', ings: ['ごぼう', 'にんじん', '醤油', 'みりん', '酒', '砂糖', 'ごま油'] },
  { name: 'ゴーヤチャンプルー', ings: ['ゴーヤ', '豆腐', '豚バラ', '卵', 'かつお節', '醤油'] },
  // 卵・豆腐
  { name: '卵焼き', ings: ['卵', 'だし', '砂糖', '塩', 'みりん', 'サラダ油'] },
  { name: '茶碗蒸し', ings: ['卵', 'だし', '醤油', 'みりん', '鶏もも肉', 'えび', '三つ葉'] },
  { name: '揚げ出し豆腐', ings: ['豆腐', '片栗粉', 'だし', '醤油', 'みりん', '大根おろし', '揚げ油'] },
  { name: '厚揚げの焼きびたし', ings: ['厚揚げ', 'だし', '醤油', 'みりん', '酒', '生姜'] },
  // パスタ・ご飯
  { name: 'カルボナーラ', ings: ['パスタ', 'ベーコン', '卵', 'パルメザンチーズ', '黒こしょう'] },
  { name: 'ナポリタン', ings: ['パスタ', 'ウインナー', '玉ねぎ', 'ピーマン', 'ケチャップ', 'バター'] },
  { name: 'ペペロンチーノ', ings: ['パスタ', 'にんにく', '唐辛子', 'オリーブ油', '塩'] },
  { name: 'ツナパスタ', ings: ['パスタ', 'ツナ缶', '玉ねぎ', 'にんにく', 'オリーブ油', '醤油'] },
  { name: 'たらこパスタ', ings: ['パスタ', 'たらこ', 'バター', '醤油', '大葉'] },
  { name: '炒飯', ings: ['ごはん', '卵', '長ねぎ', 'ベーコン', '醤油', '塩', 'ごま油'] },
  { name: 'オムライス', ings: ['ごはん', '卵', '鶏もも肉', '玉ねぎ', 'ケチャップ', 'バター'] },
  { name: 'カレーライス', ings: ['鶏もも肉', '玉ねぎ', 'にんじん', 'じゃがいも', 'カレールー'] },
  { name: '担々麺', ings: ['中華麺', '豚ひき肉', '豆板醤', '芝麻醤', '醤油', '鶏がらスープ', 'ラー油'] },
  // 汁物・鍋
  { name: '味噌汁', ings: ['豆腐', 'わかめ', '長ねぎ', 'だし', '味噌'] },
  { name: 'けんちん汁', ings: ['豆腐', '大根', 'にんじん', 'ごぼう', 'こんにゃく', 'だし', '醤油'] },
  { name: 'クラムチャウダー', ings: ['あさり', 'じゃがいも', '玉ねぎ', 'ベーコン', '牛乳', '生クリーム'] },
  { name: 'ミネストローネ', ings: ['トマト缶', '玉ねぎ', 'にんじん', 'じゃがいも', 'にんにく', 'オリーブ油'] },
  { name: '豆乳鍋', ings: ['豆乳', '鶏もも肉', '白菜', '豆腐', 'しめじ', 'にんじん', '味噌'] },
  { name: 'キムチ鍋', ings: ['豚バラ', 'キムチ', '白菜', '豆腐', 'もやし', '長ねぎ', 'ごま油'] },
  { name: 'おでん', ings: ['大根', '卵', 'こんにゃく', 'ちくわ', 'はんぺん', 'だし', '醤油', 'みりん'] },
  { name: 'しゃぶしゃぶ', ings: ['豚ロース', '白菜', '水菜', '豆腐', 'えのき', 'ポン酢'] },
  // 洋食
  { name: 'グラタン', ings: ['鶏もも肉', '玉ねぎ', 'マカロニ', 'バター', '小麦粉', '牛乳', 'シュレッドチーズ'] },
  { name: 'ロールキャベツ', ings: ['合いびき肉', 'キャベツ', '玉ねぎ', 'パン粉', '卵', 'コンソメ', 'トマト缶'] },
  { name: 'ポトフ', ings: ['鶏もも肉', 'ウインナー', 'にんじん', '玉ねぎ', 'じゃがいも', 'キャベツ', 'コンソメ'] },
]

// キーワードで絞り込む（前方一致・部分一致）
export function searchRecipes(keyword) {
  if (!keyword || keyword.length < 1) return []
  const kw = keyword.toLowerCase()
  return RECIPE_DB.filter(r =>
    r.name.toLowerCase().includes(kw)
  ).slice(0, 8)
}

// ============================================================
// Gemini APIでレシピサジェスト（家計簿アプリ geminiOcr.js v8 準拠）
// ・複数モデルへのフォールバック
// ・401時の認証方式切り替え
// ・429 Quota超過時は次モデルへ
// ・40秒タイムアウト
// ============================================================

const GEMINI_ENDPOINTS = [
  { base: 'https://generativelanguage.googleapis.com/v1beta/models', model: 'gemini-2.5-flash'      },
  { base: 'https://generativelanguage.googleapis.com/v1beta/models', model: 'gemini-2.5-flash-lite' },
  { base: 'https://generativelanguage.googleapis.com/v1/models',     model: 'gemini-2.5-flash'      },
  { base: 'https://generativelanguage.googleapis.com/v1/models',     model: 'gemini-2.5-flash-lite' },
]

const fetchWithTimeout = (url, options) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 40000)),
  ])

// AQ. 形式は見た目OAuthだが AI Studio の APIキーなので ?key= で送るのが正しい
// 家計簿 geminiOcr.js v8 と同じ判定ロジック
const isOAuthLike = (key) =>
  key.startsWith('AQ.') || key.startsWith('ya29.') || key.startsWith('AQ ')

export async function fetchGeminiSuggestions(keyword, apiKey) {
  if (!apiKey || !keyword) return []

  const prompt = `日本の家庭料理のサジェストをしてください。
「${keyword}」を使った、または「${keyword}」という名前を含む料理を8品提案してください。
必ずJSON配列のみで返答し、前後に説明文・コードブロック記号は絶対に含めないこと。
形式: [{"name":"料理名","ings":["主な食材1","食材2","食材3"]}]`

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
  })

  const errors = []

  for (const { base, model } of GEMINI_ENDPOINTS) {
    const urlParam  = `${base}/${model}:generateContent?key=${apiKey}`
    const urlBearer = `${base}/${model}:generateContent`
    // AQ.キーはAPIキー方式（?key=）を先に試す（家計簿と同じ）
    // OAuthトークンに見えるが AI Studio の APIキーは ?key= が正しい
    const attempts = isOAuthLike(apiKey)
      ? [
          { url: urlParam,  headers: { 'Content-Type': 'application/json' } },
          { url: urlBearer, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` } },
        ]
      : [
          { url: urlParam,  headers: { 'Content-Type': 'application/json' } },
          { url: urlBearer, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` } },
        ]

    let res = null
    for (const attempt of attempts) {
      try {
        const r = await fetchWithTimeout(attempt.url, { method: 'POST', headers: attempt.headers, body })
        if (r.status === 401) continue
        res = r
        break
      } catch (e) {
        if (e.message === 'TIMEOUT') throw new Error('⏱ タイムアウト（40秒）\nGeminiに接続できません。')
        throw new Error(`ネットワークエラー: ${e.message}`)
      }
    }

    if (!res) { errors.push(`${model}: 認証失敗(401)`); continue }

    // 429: Quota超過なら次モデルへ、レート制限ならエラー
    if (res.status === 429) {
      let isQuota = false
      try {
        const errBody = await res.json()
        const status  = errBody?.error?.status || ''
        const msg     = errBody?.error?.message || ''
        isQuota = status === 'RESOURCE_EXHAUSTED' || msg.toLowerCase().includes('quota')
      } catch {}
      if (isQuota) { errors.push(`${model}(429 QUOTA): 次のモデルへ`); continue }
      throw new Error('⚠️ レート上限（429）\n1〜2分待ってから再試行してください。')
    }

    if (res.status === 404) { errors.push(`${model}(404): not found`); continue }

    if (res.status === 400) {
      const err = await res.json().catch(() => ({}))
      const msg = err?.error?.message || ''
      if (msg.includes('API_KEY') || msg.includes('key')) {
        throw new Error(`❌ APIキーエラー\n設定タブでAPIキーを確認してください。`)
      }
      errors.push(`${model}(400): ${msg.slice(0, 50)}`); continue
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      errors.push(`${model}(${res.status}): ${(err?.error?.message || '').slice(0, 50)}`); continue
    }

    // 成功
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!text) { errors.push(`${model}: 応答が空`); continue }

    // JSON配列を抽出
    const arrMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/)
    const clean    = arrMatch ? arrMatch[0] : text.replace(/```json|```/g, '').trim()
    try {
      const parsed = JSON.parse(clean)
      if (!Array.isArray(parsed)) { errors.push(`${model}: 配列でない`); continue }
      return parsed.filter(r => r.name && typeof r.name === 'string')
    } catch {
      errors.push(`${model}: JSON解析失敗`); continue
    }
  }

  // 全モデル失敗
  throw new Error(`Gemini APIエラー\n${errors.map(e => `・${e}`).join('\n')}`)
}
