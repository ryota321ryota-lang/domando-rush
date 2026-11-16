from pathlib import Path
p=Path(__file__).parent
src=(p/'static/game.js').read_text()
ovr=(p/'v6_overrides.js').read_text()
needle='// ───────────────── Cross-game state, menus and input ─────────────────'
assert needle in src
src=src.replace(needle,ovr+'\n'+needle)
src=src.replace("case 'atlas':drawAtlas();", "case 'selection':v6DrawSelection();break;case 'atlas':drawAtlas();")
src=src.replace("if(paused)drawPaused();particlesDraw();", "if(paused)drawPaused();particlesDraw();v6DrawRibbons();")
src=src.replace("if(!paused){particlesStep(frameDelta);", "if(!paused){v6Ribbons(frameDelta);particlesStep(frameDelta);")
src=src.replace("if(['forge','help','results','atlas','journal','dialog'].includes(scene))", "if(['forge','help','results','atlas','journal','dialog','selection'].includes(scene))")
src=src.replace("if(scene==='town'){\n  if(save.firstVisit", "if(scene==='town'){\n  if(k==='q'){v6Selection();return}\n  if(save.firstVisit")
src=src.replace("if(scene==='cave'&&(k==='e'", "if(scene==='selection'){if(['1','2','3','4'].includes(k))V6.selected=['survivor','platform','rpg','puzzle'][Number(k)-1];else if(k==='enter'||k===' ')start(V6.selected);else if(k==='arrowleft')v6SelectDifficulty(V6.level-1);else if(k==='arrowright')v6SelectDifficulty(V6.level+1);return}\n  if(scene==='cave'&&(k==='e'")
src=src.replace("getState:()=>({scene,paused,coins:save.coins", "getState:()=>({scene,difficulty:V6.level,paused,coins:save.coins")
src=src.replace("puzzleSolve:()=>{if(scene!=='puzzle')start('puzzle');game.grid.forEach(t=>t.rot=0);updateCircuit();}", "puzzleSolve:()=>{if(scene!=='puzzle')start('puzzle');game.grid.forEach(t=>t.rot=0);updateCircuit();},select:()=>v6Selection(),setDifficulty:n=>v6SelectDifficulty(n),finish:()=>{if(game)winGame(true,game.score||1000,'テストクリア')}")
# Upgrade intro text, mobile user help (original intro only for first visit)
src=src.replace("'✦ ここから、あなただけの冒険が始まる'", "'✦ 旅する世界と、4つの本格ゲーム。'")
src=src.replace("'４つの試練と、隠された宝箱を見つけよう。'", "'Qでゲームを直接選ぶこともできる！'")
src=src.replace("'▶ 冒険を始める'", "'▶ 世界を冒険する'")
# Additional world polish after objects drawn, before HUD (drawWorld after terrain)
src=src.replace("drawWorldObjects(a);g.restore();\n  // Late evening", "drawWorldObjects(a);g.restore();\n  // Late evening")  # no-op if single lines; see below
# Update initial banner, no removed saved progress
src=src.replace("'王国の4つの門が冒険へつながっています。気になる建物に近づいて E キー！'", "'広い世界を歩くか、Qキーですぐ4つのゲームに挑戦しよう！'")
# Optional list update texts in help
src=src.replace("'森：自動攻撃と範囲技　塔：ジャンプとダッシュ'", "'森：ビルドと虹嵐　塔：チェックポイントと空中ダッシュ'")
src=src.replace("'神殿：コマンド戦闘　遺跡：回路をつなぐ'", "'神殿：敵の行動を予測　遺跡：8つの回路を解く'")
src=src.replace("'WASD/矢印：歩く　Shift：走る　E：調べる　M：地図'", "'WASD/矢印：歩く　E：調べる　Q：ゲーム選択　M：地図'")
# Replace old v5 HUD game title with v6 elsewhere automatically not critical
(p/'static/game.js').write_text(src)

html=(p/'static/index.html').read_text().replace('DOMANDO RUSH 5.0', 'DOMANDO RUSH 6.0').replace('DOMANDO RUSH 5.0 | LUMINOUS ATLAS','DOMANDO RUSH 6.0 | WORLD FESTIVAL').replace('LUMINOUS ATLAS — 山、森、海を歩いて旅するオリジナル冒険RPG。4ジャンルのゲームを収録。','WORLD FESTIVAL — 広い冒険世界と本格4ジャンル。PC・スマホ対応。').replace('v=5.0.0','v=6.0.0')
(p/'static/index.html').write_text(html)
sw=(p/'static/sw.js').read_text().replace('5.0.0','6.0.0')
(p/'static/sw.js').write_text(sw)
main=(p/'main.py').read_text().replace('5.0', '6.0').replace('LUMINOUS ATLAS','WORLD FESTIVAL')
(p/'main.py').write_text(main)
manifest=(p/'static/manifest.webmanifest').read_text().replace('5.0','6.0').replace('LUMINOUS ATLAS','WORLD FESTIVAL')
(p/'static/manifest.webmanifest').write_text(manifest)
# Remove transient editing source from final package in later step
print('Created JS',len(src),'bytes; total',len(ovr),'new bytes')
