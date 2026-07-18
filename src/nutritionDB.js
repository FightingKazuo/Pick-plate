// ============================================================
// 食品成分DB（文部科学省 日本食品標準成分表2020準拠）
// 単位：100gあたり { cal, protein, fat, carbs, fiber, salt, vitC }
// cal=kcal, protein/fat/carbs/fiber=g, salt=g, vitC=mg
// ============================================================
export const FOOD_DB = {
  // ── 肉類 ──
  '鶏もも肉':    { cal:204, protein:16.6, fat:14.2, carbs:0,   fiber:0,   salt:0.2, vitC:3,  stdG:150 },
  '鶏むね肉':    { cal:116, protein:22.3, fat:1.9,  carbs:0,   fiber:0,   salt:0.1, vitC:3,  stdG:150 },
  '鶏ひき肉':    { cal:171, protein:17.5, fat:10.4, carbs:0,   fiber:0,   salt:0.2, vitC:2,  stdG:100 },
  '豚バラ':      { cal:386, protein:14.4, fat:35.4, carbs:0.1, fiber:0,   salt:0.1, vitC:1,  stdG:100 },
  '豚ロース':    { cal:263, protein:19.3, fat:19.2, carbs:0.2, fiber:0,   salt:0.1, vitC:1,  stdG:120 },
  '豚ひき肉':    { cal:236, protein:17.7, fat:17.2, carbs:0,   fiber:0,   salt:0.1, vitC:1,  stdG:100 },
  '豚肩ロース':  { cal:253, protein:17.1, fat:19.7, carbs:0.1, fiber:0,   salt:0.1, vitC:1,  stdG:120 },
  '牛切り落とし':{ cal:209, protein:16.5, fat:15.4, carbs:0.3, fiber:0,   salt:0.1, vitC:2,  stdG:120 },
  '牛ロース':    { cal:240, protein:16.5, fat:17.1, carbs:0.5, fiber:0,   salt:0.1, vitC:2,  stdG:120 },
  '合いびき肉':  { cal:224, protein:17.1, fat:16.3, carbs:0.3, fiber:0,   salt:0.2, vitC:1,  stdG:100 },
  'ベーコン':    { cal:405, protein:12.9, fat:39.1, carbs:0.3, fiber:0,   salt:2.0, vitC:0,  stdG:30  },
  'ウインナー':  { cal:321, protein:11.5, fat:28.5, carbs:3.3, fiber:0,   salt:1.9, vitC:0,  stdG:50  },
  'ハム':        { cal:211, protein:16.5, fat:14.5, carbs:2.0, fiber:0,   salt:2.3, vitC:0,  stdG:30  },

  // ── 魚介類 ──
  '鮭':          { cal:133, protein:22.3, fat:4.1,  carbs:0.1, fiber:0,   salt:0.2, vitC:0,  stdG:100 },
  'さば':        { cal:247, protein:20.6, fat:16.8, carbs:0.3, fiber:0,   salt:0.3, vitC:1,  stdG:100 },
  'ぶり':        { cal:257, protein:21.4, fat:17.6, carbs:0.4, fiber:0,   salt:0.1, vitC:2,  stdG:100 },
  'たら':        { cal:77,  protein:17.6, fat:0.2,  carbs:0.1, fiber:0,   salt:0.3, vitC:0,  stdG:100 },
  'いわし':      { cal:169, protein:19.2, fat:9.2,  carbs:0.2, fiber:0,   salt:0.4, vitC:0,  stdG:80  },
  'あじ':        { cal:126, protein:19.7, fat:4.5,  carbs:0.1, fiber:0,   salt:0.3, vitC:1,  stdG:80  },
  'えび':        { cal:91,  protein:18.4, fat:0.3,  carbs:2.5, fiber:0,   salt:0.7, vitC:0,  stdG:80  },
  'あさり':      { cal:30,  protein:6.0,  fat:0.3,  carbs:0.4, fiber:0,   salt:2.2, vitC:1,  stdG:100 },
  'ツナ缶':      { cal:71,  protein:16.0, fat:0.7,  carbs:0.1, fiber:0,   salt:0.4, vitC:0,  stdG:70  },
  'カニカマ':    { cal:90,  protein:12.1, fat:0.7,  carbs:9.2, fiber:0,   salt:2.2, vitC:0,  stdG:50  },
  'たらこ':      { cal:140, protein:21.0, fat:4.7,  carbs:0.4, fiber:0,   salt:4.6, vitC:0,  stdG:50  },

  // ── 野菜 ──
  '玉ねぎ':      { cal:37,  protein:1.0,  fat:0.1,  carbs:8.4, fiber:1.5, salt:0,   vitC:8,  stdG:100 },
  '長ねぎ':      { cal:34,  protein:1.4,  fat:0.1,  carbs:7.3, fiber:2.2, salt:0,   vitC:14, stdG:50  },
  'にんじん':    { cal:39,  protein:0.7,  fat:0.2,  carbs:9.3, fiber:2.8, salt:0,   vitC:6,  stdG:80  },
  'じゃがいも':  { cal:76,  protein:1.8,  fat:0.1,  carbs:17.3,fiber:8.9, salt:0,   vitC:35, stdG:100 },
  'キャベツ':    { cal:23,  protein:1.3,  fat:0.2,  carbs:5.2, fiber:1.8, salt:0,   vitC:41, stdG:100 },
  'トマト':      { cal:20,  protein:0.7,  fat:0.1,  carbs:4.7, fiber:1.0, salt:0,   vitC:15, stdG:150 },
  'なす':        { cal:22,  protein:1.1,  fat:0.1,  carbs:5.1, fiber:2.2, salt:0,   vitC:4,  stdG:100 },
  'ピーマン':    { cal:22,  protein:0.9,  fat:0.2,  carbs:5.1, fiber:2.3, salt:0,   vitC:76, stdG:50  },
  'パプリカ':    { cal:30,  protein:1.0,  fat:0.2,  carbs:7.2, fiber:1.6, salt:0,   vitC:170,stdG:80  },
  'ほうれん草':  { cal:20,  protein:2.2,  fat:0.4,  carbs:3.1, fiber:2.8, salt:0,   vitC:35, stdG:80  },
  '白菜':        { cal:14,  protein:0.8,  fat:0.1,  carbs:3.2, fiber:1.3, salt:0,   vitC:19, stdG:150 },
  'もやし':      { cal:37,  protein:1.7,  fat:0.1,  carbs:6.5, fiber:1.3, salt:0,   vitC:8,  stdG:100 },
  'ブロッコリー':{ cal:37,  protein:4.3,  fat:0.5,  carbs:6.6, fiber:4.4, salt:0,   vitC:120,stdG:80  },
  'きゅうり':    { cal:14,  protein:1.0,  fat:0.1,  carbs:3.0, fiber:1.1, salt:0,   vitC:14, stdG:100 },
  'かぼちゃ':    { cal:91,  protein:1.9,  fat:0.3,  carbs:20.6,fiber:3.5, salt:0,   vitC:43, stdG:100 },
  '大根':        { cal:18,  protein:0.5,  fat:0.1,  carbs:4.1, fiber:1.4, salt:0,   vitC:12, stdG:100 },
  'ごぼう':      { cal:65,  protein:1.8,  fat:0.1,  carbs:15.4,fiber:5.7, salt:0,   vitC:3,  stdG:80  },
  '生姜':        { cal:30,  protein:0.9,  fat:0.3,  carbs:6.6, fiber:2.1, salt:0,   vitC:2,  stdG:10  },
  'にんにく':    { cal:136, protein:6.4,  fat:0.9,  carbs:27.5,fiber:6.2, salt:0,   vitC:12, stdG:10  },
  'にら':        { cal:21,  protein:1.7,  fat:0.3,  carbs:4.0, fiber:2.7, salt:0,   vitC:19, stdG:50  },
  'レタス':      { cal:12,  protein:0.6,  fat:0.1,  carbs:2.8, fiber:1.1, salt:0,   vitC:5,  stdG:80  },
  'アスパラ':    { cal:22,  protein:2.6,  fat:0.2,  carbs:3.9, fiber:1.8, salt:0,   vitC:15, stdG:60  },
  'ズッキーニ':  { cal:16,  protein:1.3,  fat:0.1,  carbs:2.8, fiber:1.3, salt:0,   vitC:20, stdG:100 },
  'バナナ':      { cal:86,  protein:1.1,  fat:0.2,  carbs:22.5,fiber:1.1, salt:0,   vitC:16, stdG:100 },
  'トマト缶':    { cal:17,  protein:0.9,  fat:0.1,  carbs:4.0, fiber:1.3, salt:0.3, vitC:9,  stdG:200 },
  'しめじ':      { cal:22,  protein:2.7,  fat:0.5,  carbs:4.8, fiber:3.7, salt:0,   vitC:0,  stdG:80  },
  'えのき':      { cal:34,  protein:2.7,  fat:0.2,  carbs:7.6, fiber:3.9, salt:0,   vitC:0,  stdG:80  },
  'エリンギ':    { cal:31,  protein:2.8,  fat:0.4,  carbs:6.4, fiber:4.3, salt:0,   vitC:0,  stdG:80  },
  'なめこ':      { cal:15,  protein:1.7,  fat:0.3,  carbs:5.4, fiber:3.3, salt:0,   vitC:0,  stdG:80  },

  // ── 豆腐・大豆製品 ──
  '豆腐':        { cal:56,  protein:4.9,  fat:3.0,  carbs:2.0, fiber:0.3, salt:0,   vitC:0,  stdG:150 },
  '厚揚げ':      { cal:143, protein:10.7, fat:10.7, carbs:0.9, fiber:0.7, salt:0,   vitC:0,  stdG:100 },
  '油揚げ':      { cal:410, protein:18.6, fat:34.4, carbs:5.6, fiber:1.4, salt:0,   vitC:0,  stdG:30  },
  '納豆':        { cal:200, protein:16.5, fat:10.0, carbs:12.1,fiber:6.7, salt:0,   vitC:0,  stdG:45  },
  '豆乳':        { cal:46,  protein:3.6,  fat:2.0,  carbs:3.1, fiber:0.2, salt:0,   vitC:0,  stdG:200 },

  // ── 乳製品・卵 ──
  '卵':          { cal:151, protein:12.3, fat:10.3, carbs:0.3, fiber:0,   salt:0.4, vitC:0,  stdG:60  },
  '牛乳':        { cal:67,  protein:3.3,  fat:3.8,  carbs:4.8, fiber:0,   salt:0.1, vitC:1,  stdG:200 },
  'バター':      { cal:745, protein:0.6,  fat:81.0, carbs:0.2, fiber:0,   salt:1.5, vitC:0,  stdG:10  },
  'シュレッドチーズ':{ cal:356,protein:25.7,fat:26.0,carbs:1.3,fiber:0,   salt:2.0, vitC:0,  stdG:30  },
  'パルメザンチーズ':{ cal:475,protein:44.0,fat:30.8,carbs:1.9,fiber:0,   salt:3.8, vitC:0,  stdG:10  },
  '生クリーム':  { cal:433, protein:2.0,  fat:45.0, carbs:3.1, fiber:0,   salt:0.1, vitC:1,  stdG:50  },
  'ヨーグルト':  { cal:62,  protein:3.6,  fat:3.0,  carbs:4.9, fiber:0,   salt:0.1, vitC:1,  stdG:100 },
  'マヨネーズ':  { cal:703, protein:1.5,  fat:76.0, carbs:3.6, fiber:0,   salt:1.9, vitC:0,  stdG:15  },

  // ── インスタント・カップ麺 ──
  'カップ麺':         { cal:355, protein:8.8,  fat:14.1, carbs:47.5, fiber:2.0, salt:5.5,  vitC:0,  stdG:85  },
  'カップラーメン':   { cal:355, protein:8.8,  fat:14.1, carbs:47.5, fiber:2.0, salt:5.5,  vitC:0,  stdG:85  },
  'カップうどん':     { cal:301, protein:7.8,  fat:8.2,  carbs:47.3, fiber:1.8, salt:5.9,  vitC:0,  stdG:87  },
  'カップそば':       { cal:319, protein:9.1,  fat:9.5,  carbs:47.8, fiber:2.1, salt:5.7,  vitC:0,  stdG:85  },
  '袋ラーメン':       { cal:449, protein:10.6, fat:17.7, carbs:60.8, fiber:2.8, salt:6.1,  vitC:0,  stdG:100 },
  'インスタントラーメン':{ cal:449, protein:10.6, fat:17.7, carbs:60.8, fiber:2.8, salt:6.1, vitC:0, stdG:100 },
  '日清チキンラーメン':{ cal:451, protein:9.8,  fat:17.5, carbs:62.0, fiber:2.5, salt:5.6,  vitC:0,  stdG:85  },
  'サッポロ一番':     { cal:453, protein:10.1, fat:18.1, carbs:61.5, fiber:2.3, salt:6.2,  vitC:0,  stdG:100 },

  // ── レトルト食品 ──
  'レトルトカレー':   { cal:121, protein:5.9,  fat:5.5,  carbs:12.3, fiber:2.1, salt:2.1,  vitC:3,  stdG:200 },
  'レトルトハヤシ':   { cal:108, protein:4.2,  fat:4.8,  carbs:12.5, fiber:1.8, salt:1.9,  vitC:2,  stdG:200 },
  'レトルトパスタソース':{ cal:98, protein:3.8, fat:4.2,  carbs:11.2, fiber:1.5, salt:2.3,  vitC:5,  stdG:130 },
  'レトルトご飯':     { cal:168, protein:2.5,  fat:0.3,  carbs:37.1, fiber:0.3, salt:0,    vitC:0,  stdG:200 },
  'レトルト丼':       { cal:135, protein:6.8,  fat:5.2,  carbs:15.3, fiber:1.2, salt:2.4,  vitC:1,  stdG:150 },

  // ── 調理キット・ミールキット ──
  'パスタソース':     { cal:98,  protein:3.8,  fat:4.2,  carbs:11.2, fiber:1.5, salt:2.3,  vitC:5,  stdG:130 },
  'カルボナーラソース':{ cal:148, protein:4.1,  fat:10.8, carbs:9.3,  fiber:0.5, salt:1.8,  vitC:0,  stdG:130 },
  'ミートソース':     { cal:88,  protein:5.2,  fat:3.8,  carbs:8.9,  fiber:1.8, salt:2.1,  vitC:4,  stdG:130 },
  'トマトソース':     { cal:45,  protein:1.8,  fat:1.2,  carbs:7.2,  fiber:1.6, salt:1.5,  vitC:12, stdG:130 },
  'ペペロンチーノソース':{ cal:122, protein:2.1, fat:9.8, carbs:7.5,  fiber:0.8, salt:2.4,  vitC:2,  stdG:70  },
  'カレーのもと':     { cal:498, protein:7.8,  fat:34.0, carbs:43.0, fiber:4.5, salt:11.5, vitC:2,  stdG:20  },
  'カレールー':       { cal:498, protein:7.8,  fat:34.0, carbs:43.0, fiber:4.5, salt:11.5, vitC:2,  stdG:20  },
  'シチューのもと':   { cal:466, protein:6.5,  fat:30.5, carbs:44.1, fiber:2.8, salt:11.8, vitC:1,  stdG:20  },
  'ハヤシルー':       { cal:490, protein:6.2,  fat:33.8, carbs:43.5, fiber:3.2, salt:12.1, vitC:1,  stdG:20  },
  '麻婆豆腐のもと':   { cal:121, protein:4.5,  fat:6.8,  carbs:10.5, fiber:1.2, salt:4.8,  vitC:2,  stdG:50  },
  '青椒肉絲のもと':   { cal:98,  protein:3.2,  fat:4.5,  carbs:11.8, fiber:1.0, salt:3.9,  vitC:3,  stdG:50  },
  '回鍋肉のもと':     { cal:105, protein:3.8,  fat:5.2,  carbs:11.2, fiber:1.1, salt:4.2,  vitC:2,  stdG:50  },
  'プルコギのもと':   { cal:115, protein:3.5,  fat:3.8,  carbs:16.5, fiber:0.8, salt:3.6,  vitC:2,  stdG:50  },

  // ── 冷凍食品 ──
  '冷凍唐揚げ':       { cal:228, protein:15.5, fat:13.2, carbs:11.8, fiber:0.5, salt:1.8,  vitC:0,  stdG:100 },
  '冷凍餃子':         { cal:197, protein:8.2,  fat:9.8,  carbs:20.5, fiber:1.2, salt:1.5,  vitC:3,  stdG:120 },
  '冷凍ピザ':         { cal:248, protein:9.5,  fat:9.8,  carbs:31.5, fiber:1.8, salt:2.1,  vitC:2,  stdG:200 },
  '冷凍チャーハン':   { cal:188, protein:4.8,  fat:6.5,  carbs:28.5, fiber:0.8, salt:1.6,  vitC:1,  stdG:250 },
  '冷凍パスタ':       { cal:162, protein:5.8,  fat:5.2,  carbs:23.5, fiber:1.5, salt:1.8,  vitC:2,  stdG:250 },
  '冷凍うどん':       { cal:105, protein:2.6,  fat:0.4,  carbs:21.6, fiber:0.8, salt:0.3,  vitC:0,  stdG:200 },

  // ── 総菜・外食系 ──
  'おにぎり':         { cal:179, protein:3.8,  fat:0.8,  carbs:38.5, fiber:0.5, salt:0.8,  vitC:0,  stdG:110 },
  'サンドイッチ':     { cal:232, protein:9.5,  fat:9.8,  carbs:27.5, fiber:2.1, salt:1.8,  vitC:5,  stdG:120 },
  'ハンバーガー':     { cal:261, protein:12.8, fat:10.5, carbs:30.2, fiber:1.5, salt:1.9,  vitC:2,  stdG:150 },
  '弁当':             { cal:550, protein:18.5, fat:15.2, carbs:82.5, fiber:3.2, salt:3.5,  vitC:8,  stdG:450 },
  'コンビニ弁当':     { cal:580, protein:19.2, fat:16.5, carbs:85.0, fiber:3.0, salt:3.8,  vitC:5,  stdG:450 },

  // ── 主食・炭水化物 ──
  'ごはん':      { cal:168, protein:2.5,  fat:0.3,  carbs:37.1,fiber:0.3, salt:0,   vitC:0,  stdG:150 },
  '食パン':      { cal:264, protein:9.3,  fat:4.4,  carbs:46.7,fiber:2.3, salt:1.3, vitC:0,  stdG:60  },
  'パスタ':      { cal:378, protein:13.0, fat:1.9,  carbs:73.9,fiber:5.7, salt:0,   vitC:0,  stdG:80  },
  '中華麺':      { cal:281, protein:8.6,  fat:1.2,  carbs:56.1,fiber:2.8, salt:0.4, vitC:0,  stdG:120 },
  'うどん':      { cal:105, protein:2.6,  fat:0.4,  carbs:21.6,fiber:0.8, salt:0.3, vitC:0,  stdG:200 },
  'そうめん':    { cal:356, protein:9.5,  fat:1.1,  carbs:72.7,fiber:2.5, salt:3.8, vitC:0,  stdG:80  },
  'そば':        { cal:346, protein:14.0, fat:2.3,  carbs:65.6,fiber:4.3, salt:0,   vitC:0,  stdG:80  },
  'パン粉':      { cal:373, protein:14.6, fat:6.8,  carbs:63.4,fiber:4.0, salt:1.3, vitC:0,  stdG:20  },
  '片栗粉':      { cal:330, protein:0.1,  fat:0.1,  carbs:81.6,fiber:0,   salt:0,   vitC:0,  stdG:8   },
  '小麦粉':      { cal:368, protein:8.3,  fat:1.5,  carbs:75.8,fiber:2.5, salt:0,   vitC:0,  stdG:15  },

  // ── 調味料（少量なのでsalt中心） ──
  '醤油':        { cal:71,  protein:7.7,  fat:0,    carbs:10.1,fiber:0,   salt:14.5,vitC:0,  stdG:15  },
  '味噌':        { cal:217, protein:12.5, fat:6.0,  carbs:21.9,fiber:4.9, salt:12.4,vitC:0,  stdG:15  },
  'みりん':      { cal:241, protein:0.3,  fat:0.1,  carbs:43.2,fiber:0,   salt:0,   vitC:0,  stdG:8   },
  '砂糖':        { cal:384, protein:0,    fat:0,    carbs:99.2,fiber:0,   salt:0,   vitC:0,  stdG:5   },
  '塩':          { cal:0,   protein:0,    fat:0,    carbs:0,   fiber:0,   salt:99.1,vitC:0,  stdG:2   },
  'ごま油':      { cal:921, protein:0,    fat:100,  carbs:0,   fiber:0,   salt:0,   vitC:0,  stdG:5   },
  'サラダ油':    { cal:921, protein:0,    fat:100,  carbs:0,   fiber:0,   salt:0,   vitC:0,  stdG:8   },
  'オリーブ油':  { cal:921, protein:0,    fat:100,  carbs:0,   fiber:0,   salt:0,   vitC:0,  stdG:8   },
  'ケチャップ':  { cal:119, protein:1.7,  fat:0.2,  carbs:27.6,fiber:1.8, salt:3.1, vitC:18, stdG:20  },
  'コンソメ':    { cal:233, protein:7.0,  fat:4.6,  carbs:40.4,fiber:0,   salt:43.2,vitC:0,  stdG:3   },
  'だし':        { cal:3,   protein:0.5,  fat:0,    carbs:0.4, fiber:0,   salt:0.1, vitC:0,  stdG:150 },
}

// ── 1品の栄養素をDB+Geminiで計算 ──
// 食材リストからDBで計算し、不足分はGemini推定で補完する
export function calcNutritionFromDB(ings) {
  if (!ings || ings.length === 0) return null
  const result  = { cal:0, protein:0, fat:0, carbs:0, fiber:0, salt:0, vitC:0 }
  const covered = []
  const missing  = []

  for (const ing of ings) {
    // 表記ゆれを吸収（部分一致）
    const key = Object.keys(FOOD_DB).find(k =>
      ing.includes(k) || k.includes(ing)
    )
    if (key) {
      const d = FOOD_DB[key]
      const g = d.stdG  // 標準使用量(g)
      result.cal     += (d.cal     * g / 100)
      result.protein += (d.protein * g / 100)
      result.fat     += (d.fat     * g / 100)
      result.carbs   += (d.carbs   * g / 100)
      result.fiber   += (d.fiber   * g / 100)
      result.salt    += (d.salt    * g / 100)
      result.vitC    += (d.vitC    * g / 100)
      covered.push(ing)
    } else {
      missing.push(ing)
    }
  }

  // 丸め
  const round1 = v => Math.round(v * 10) / 10
  return {
    calories: Math.round(result.cal),
    protein:  round1(result.protein),
    fat:      round1(result.fat),
    carbs:    round1(result.carbs),
    fiber:    round1(result.fiber),
    salt:     round1(result.salt),
    vitaminC: Math.round(result.vitC),
    dbCoverage: covered.length,
    totalIngs:  ings.length,
    missingIngs: missing,
    _source: 'db',
  }
}
