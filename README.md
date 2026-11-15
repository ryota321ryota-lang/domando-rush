# DOMANDO RUSH Ver.3.0 — COLOR STORM

新しいオリジナルソロアクションゲーム。Ver.2.0 の GitHub + Render 構成をそのまま使えます。

## このバージョンで追加したもの

- **ホーム**：モード選択、チャレンジ、獲得コイン・プレイヤーランク
- **4つのゲームモード**：カラーストーリー（3ボス）、ぬりぬりバトル（180マスを塗る）、60秒ドカン！（スコアアタック）、ボスパレード（3連戦）
- **オリジナルの色ぬり機構**：移動した地面がカラーに変化。色をためてカラーストームを発動
- **気持ちよさの演出**：コンボ、フィーバー、ヒット演出、ダメージ数字、効果音、画面シェイク
- **レベルアップで選ぶ12種類の能力**、恒久強化5種類、コスチューム6色、実績8種類
- **スマホ・PC対応**。外部素材・広告・課金・ユーザー登録・オンライン対戦なし

## Windowsで起動

```powershell
py -m pip install -r requirements.txt
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```

ブラウザで http://127.0.0.1:8000/ を開きます。すでにVer.2.0を起動中の場合は、PowerShell で Ctrl+C を押して終了してください。

## 操作

- PC：`WASD` / 矢印で移動、`Space` / `Shift` でダッシュ、`Q` / `C` で色切替、`F` / `E` でカラーストーム、`Esc` / `P` で一時停止
- スマホ：左スティックで移動、右下のダッシュ・色かえ・ストームボタン
- 攻撃は自動。近くの敵を狙います。

## GitHubを更新してRenderに自動デプロイ

公開済みのGitHub `ryota321ryota-lang/domando-rush` の `main` ブランチに、ZIPを**展開した中身をそのまま**アップロードしてコミットしてください。`main.py`、`requirements.txt`、`render.yaml`、`static/index.html` に加え、今回新しい `static/style.css` と `static/game.js` が必要です。前のファイルを上書きし、今回のファイルも追加してください。

既存の Render Web Service **`domando-rush`** に対して、GitHub自動デプロイが有効ならコミット後に再デプロイされます。既存サービスを削除したり、新しいサービスを作る必要はありません。

- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- 公開URL（既存）: https://domando-rush.onrender.com
- Health: `/health`

## セーブデータ

コインや育成等はブラウザの `localStorage` に保存され、**同じブラウザ・同じ端末でのみ**継続されます。機種変更・別ブラウザ・シークレットモードでは共有されません。Ver.2.0のベストスコアが同じブラウザに保存されていれば、最初の起動時に冒険モードの記録へ引き継ぎます。コイン・育成などはVer.3.0から開始します。実際のお金を使う課金やガチャはありません。
