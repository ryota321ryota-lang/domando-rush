# DOMANDO RUSH Ver.2.0 — COLOR QUEST

カラフルな一人用2Dアクションゲーム。未来風のデザインとオンライン協力機能を廃止し、3エリア、3ボス、敵4種類、レベルアップ強化9種、スコア保存、スマホ用ジョイスティック、効果音を搭載。

## Windowsで実行

```powershell
py -m pip install -r requirements.txt
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```

http://127.0.0.1:8000 を開く。前Ver.1.0が起動している場合はCtrl+Cで停止する。

## 操作

- PC: WASDまたは矢印で移動 / Spaceでダッシュ / Eでスペシャル
- スマホ: 左スティックで移動 / 右側の2ボタンでアクション
- 攻撃は自動。敵から落ちるスターで強化カードを選択。

## GitHubにアップロード

1. GitHubで新しいpublicまたはprivateリポジトリ `domando-rush` を作成。
2. ZIPを展開したフォルダの **中身** (`main.py`, `static/`, `requirements.txt`, `render.yaml`) をアップロード。
3. `main` ブランチへコミット。

## Renderで公開

Render Dashboard → New → Web Service → GitHub repo `domando-rush`。

- Name: `domando-rush`
- Runtime: Python
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`

`render.yaml` も付属（Blueprint方式でも使用可）。既存の同名サービスがある場合は別名を使用。Renderの起動と無料プラン条件はアカウントによって異なるため、公開の際に確認すること。

## 備考

完全ソロゲーム。スコアは各ブラウザのlocalStorageにのみ保存。ユーザー登録・友達対戦・オンライン同期・外部画像素材なし。音声は操作後に有効。
