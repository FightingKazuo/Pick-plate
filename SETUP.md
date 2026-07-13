# おかいもの手帖 セットアップガイド

## 必要なもの
- GitHubアカウント（FightingKazuo）
- Vercelアカウント（既存）
- Googleアカウント（Firebase用）

---

## ① Firebaseのセットアップ（10〜15分）

### 1. Firebaseプロジェクトを作成
1. https://console.firebase.google.com/ を開く
2. 「プロジェクトを追加」→ 名前は `meal-planner` など
3. Googleアナリティクスは「無効」でOK

### 2. Firestoreを有効化
1. 左メニュー「Firestore Database」→「データベースを作成」
2. ロケーション: `asia-northeast1`（東京）
3. セキュリティルール: **テストモード** で開始（後で変更可）

### 3. Webアプリを追加してconfig取得
1. プロジェクトのトップ画面 →「アプリを追加」→ Webアプリ（`</>`）
2. アプリ名は何でもOK
3. 表示されるconfigをコピーしておく：
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "xxx.firebaseapp.com",
  projectId: "xxx",
  storageBucket: "xxx.appspot.com",
  messagingSenderId: "000",
  appId: "1:000:web:xxx"
}
```

---

## ② GitHubにプッシュ

```bash
# GitHubで新しいリポジトリ作成（例: meal-planner）

cd meal-planner
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/FightingKazuo/meal-planner.git
git push -u origin main
```

---

## ③ Vercelにデプロイ

1. https://vercel.com/ → 「Import Project」
2. GitHubのリポジトリ `meal-planner` を選択
3. Framework: **Vite** が自動検出されるはず
4. **Environment Variables（環境変数）** を設定：

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | FirebaseのapiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_STORAGE_BUCKET` | storageBucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
| `VITE_FIREBASE_APP_ID` | appId |

5. 「Deploy」ボタンを押すとデプロイ完了！

---

## ④ Gemini APIキー（任意・無料）

1. https://aistudio.google.com/app/apikey を開く
2. 「APIキーを作成」→ キーをコピー
3. アプリの「設定」タブに貼り付けて保存

---

## ⑤ 彼女と共有する

1. アプリを開く
2. 「設定」タブ → 「新しいルームを作る」
3. 表示された6桁のコードを彼女にLINEで送る
4. 彼女がアプリを開いて「ルームに参加」→ コードを入力
5. 以降、同じルームのデータがリアルタイムで同期！

---

## ローカルで動かす場合

```bash
# .env.example を .env.local にコピーして値を入力
cp .env.example .env.local

npm install
npm run dev
```

---

## Firestoreセキュリティルール（本番用）

テストモードのまま公開するのはNG。以下を設定してください：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true; // ルームコード知ってる人なら誰でもOK
    }
  }
}
```
