from pathlib import Path
p=Path(__file__).parent/'static/game.js';s=p.read_text()
s=s.replace("function v6Selection(){scene='selection';paused=false;adjustTouch();beep(560,.09,'triangle')}","function v6Selection(){scene='selection';paused=false;infoTimer=0;document.getElementById('notice').classList.remove('show');adjustTouch();beep(560,.09,'triangle')}")
s=s.replace("function start(which){if(!V6Descriptions[which])return;V6.selected=which;", "function start(which){if(!V6Descriptions[which])return;infoTimer=0;document.getElementById('notice').classList.remove('show');V6.selected=which;")
s=s.replace("drawWorldObjects(a);g.restore();", "drawWorldObjects(a);g.restore();v6WorldAtmosphere();")
# put atmosphere at end inserted overrides before gameplay definitions
needle='/* -------------------------- GAME I: SURVIVOR ------------------------- */'
atmos='''
function v6WorldAtmosphere(){
 g.save();
 // Soft directional sun haze and subtle edge shadow, independent of map coordinates.
 const sun=g.createRadialGradient(765,78,30,740,180,780);
 sun.addColorStop(0,'rgba(255,247,205,0.15)');sun.addColorStop(.35,'rgba(255,237,195,0.05)');sun.addColorStop(1,'rgba(255,250,220,0)');
 g.fillStyle=sun;g.fillRect(0,0,W,H);
 const vignette=g.createRadialGradient(W*.48,H*.46,115,W*.48,H*.46,700);
 vignette.addColorStop(0,'rgba(12,36,35,0)');vignette.addColorStop(1,'rgba(6,28,44,0.19)');g.fillStyle=vignette;g.fillRect(0,0,W,H);
 // Drifting dust motes and fireflies: decoration only, no gameplay effects.
 for(let i=0;i<18;i++){let x=((i*237+Math.sin(worldSeconds*.28+i*5)*32-worldCam.x*.05)%1000+1000)%1000;
   let y=(i*137+Math.sin(worldSeconds*.32+i)*22)%570+18;
   let a=.15+.13*(Math.sin(worldSeconds*2+i*3)+1);g.globalAlpha=a;circle(x,y,2+(i%3),i%3===0?'#fff5bd':'#f1ffd4')}
 g.restore();
}
'''
s=s.replace(needle,atmos+needle)
# overlay visible in popups: draw opaque region background overlay, hides world labels
s=s.replace("rect(0,0,960,600,'#0e2339c9');", "rect(0,0,960,600,'#0e2339e0');")
# Survivor top-right timer: avoid pause button
s=s.replace("text(`残り ${Math.max(0,Math.ceil(s.duration-s.seconds))}秒`,824,35,21", "text(`残り ${Math.max(0,Math.ceil(s.duration-s.seconds))}秒`,746,35,21")
s=s.replace("v6Bar(695,63,212,15,p.hp/p.max", "v6Bar(682,63,143,15,p.hp/p.max")
s=s.replace("text(`HP ${Math.ceil(p.hp)}/${p.max}`,800,86,12", "text(`HP ${Math.ceil(p.hp)}/${p.max}`,756,86,12")
# Platform progress UI avoid pause
s=s.replace("text('距離',770,31,14", "text('距離',657,31,14")
s=s.replace("v6Bar(817,27,116,12,p.x/s.finish", "v6Bar(704,27,130,12,p.x/s.finish")
s=s.replace("text(`TIME ${s.seconds.toFixed(1)}s`,864,75,15", "text(`TIME ${s.seconds.toFixed(1)}s`,775,75,15")
# RPG HP bar avoid pause, and label
s=s.replace("v6Bar(540,30,385,18,s.enemyHp/s.enemyMax", "v6Bar(531,30,290,18,s.enemyHp/s.enemyMax")
s=s.replace("text(`HP ${Math.ceil(s.enemyHp)} / ${s.enemyMax}`,731,70,16", "text(`HP ${Math.ceil(s.enemyHp)} / ${s.enemyMax}`,690,70,16")
s=s.replace("text(`BREAK連携 ×${s.combo}`,430,443,14", "text(`BREAK連携 ×${s.combo}`,322,528,14")
# Color contrast: mouse accessible panels; no magic words copyrighted
p.write_text(s)
h=p.parent/'index.html';x=h.read_text().replace('DOMANDO RUSH 6.0 | LUMINOUS ATLAS','DOMANDO RUSH 6.0 | WORLD FESTIVAL');h.write_text(x)
print('JS patched',len(s))
