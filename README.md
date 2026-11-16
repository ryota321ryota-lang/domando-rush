
# DOMANDO RUSH Ver.7.0 — DREAM ARCADE

子どもが見てワクワクしやすい見た目と、遊びやすさを最優先に強化したバージョンです。

## Ver.7.0の主な強化
- ホーム/ゲーム選択画面を豪華に改善
- 4ジャンルすべてに絵っぽい演出を追加
- サバイバル・ジャンプ・RPG・パズルの各画面をカラフルに強化
- 子ども向けに、表示や説明を少しわかりやすく改善
- 既存のRenderサービス `domando-rush` にそのまま上書き可能

## 使い方（ローカル）
```powershell
py -m pip install -r requirements.txt
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## GitHubアップロード
- GitHubアップロード画面：`https://github.com/ryota321ryota-lang/domando-rush/upload`
- Renderサービス名：`domando-rush`

ZIPはアップロードせず、**展開した中身**をそのままアップロードしてください。
