/* ━━━━━━━━━━━━━━━━━ DOMANDO RUSH 6.0 — FOUR GENRES REBORN ━━━━━━━━━━━━━━━━━
   All abilities and art are original. Added after v5 definitions to preserve the
   large exploration world and user save. No paid RNG or pressure mechanics. */
const V6={level:0,lastMode:'survivor',selected:'survivor',toast:'',ribbons:[],palette:['#9cf4cc','#ffd27b','#f19fae','#b9b8ff'],bossColor:'#b781b7'};
save.v6=save.v6&&typeof save.v6==='object'?save.v6:{stars:{},runs:{},puzzleBest:{},cosmetics:0};
save.v6.stars=save.v6.stars||{};save.v6.runs=save.v6.runs||{};
const V6Names={survivor:'虹嵐の森',platform:'風渡りの塔',rpg:'月影の神殿',puzzle:'光環の工房'};
const V6Descriptions={survivor:['ひらめく魔法で敵の群れを突破！','ビルドを選び、色彩ストームで一掃'],platform:['ジャンプ・空中ダッシュで空を駆ける','コースごとに仕掛けが変わる'],rpg:['敵の次の行動を読み切る戦略RPG','弱点を突いてBREAKを狙え'],puzzle:['回転回路で宝石まで光を運べ','落ち着いて解ける8つの設計図']};
const V6Categories={survivor:'SURVIVAL • BUILD',platform:'PLATFORM • SKILL',rpg:'TACTICAL • STORY',puzzle:'PUZZLE • LOGIC'};
const V6Icons={survivor:'🌿',platform:'☁',rpg:'☾',puzzle:'◈'};
function v6ClipText(t,x,y,maxW,size=16,col='#fff',align='left'){g.save();g.fillStyle=col;g.textAlign=align;g.textBaseline='middle';g.font=`800 ${size}px system-ui,"Noto Sans JP",sans-serif`;g.fillText(t,x,y,maxW);g.restore()}
function v6Gradient(x,y,w,h,c1,c2,r=17){const gr=g.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,c1);gr.addColorStop(1,c2);rect(x,y,w,h,gr,r)}
function v6Pill(x,y,w,h,label,fill='#2e465c',fg='#fef2d8'){rect(x,y,w,h,fill,h/2);text(label,x+w/2,y+h/2,13,fg,'center',800)}
function v6Bar(x,y,w,h,v,a,b){rect(x,y,w,h,a,h/2);rect(x,y,w*clamp(v,0,1),h,b,h/2)}
function v6Ribbon(label,x,y,color='#ffdf87'){V6.ribbons.push({x,y,label,color,time:1.2});if(V6.ribbons.length>16)V6.ribbons.shift()}
function v6Ribbons(dt){for(let i=V6.ribbons.length-1;i>=0;i--){const z=V6.ribbons[i];z.y-=dt*28;z.time-=dt;if(z.time<=0)V6.ribbons.splice(i,1)}}
function v6DrawRibbons(){for(const z of V6.ribbons){g.save();g.globalAlpha=clamp(z.time/.4,0,1);text(z.label,z.x,z.y,17,z.color,'center',900,true);g.restore()}}
function v6Records(k){return save.v6.stars[k]||[0,0,0]}
function v6WinMedal(name,won,score){const arr=[...v6Records(name)];while(arr.length<3)arr.push(0);const level=clamp(V6.level,0,2);const medal=won?1+(score>2000?1:0)+(score>5200?1:0):0;arr[level]=Math.max(arr[level]||0,medal);save.v6.stars[name]=arr;save.v6.runs[name]=(save.v6.runs[name]||0)+1;return medal;}
function winGame(won,score,details){if(scene==='results')return;const name=mode,stars=v6WinMedal(name,won,score);const bonus=won?100+V6.level*70:24;const reward=Math.max(12,Math.min(780,Math.floor(score/75)+bonus));save.coins=Math.max(0,save.coins+reward);save.earned=(save.earned||0)+reward;if(won)save.clears[name]=(save.clears[name]||0)+1;save.records[name]=Math.max(save.records[name]||0,Math.floor(score));persist();result={won,score:Math.floor(score),reward,details,name,stars,level:V6.level};scene='results';game=null;paused=false;chord();for(let j=0;j<5;j++)sparkle(rnd(100,840),rnd(115,420),V6.palette[j%4],12);adjustTouch();}
function start(which){if(!V6Descriptions[which])return;V6.selected=which;V6.lastMode=which;mode=which;paused=false;V6.ribbons.length=0;particles.length=0;flash=.12;beep(460,.11,'triangle');if(which==='survivor')initSurvivor();else if(which==='platform')initPlatform();else if(which==='rpg')initRPG();else initPuzzle();scene=which;adjustTouch();}
function v6Selection(){scene='selection';paused=false;adjustTouch();beep(560,.09,'triangle')}
function v6SelectDifficulty(n){V6.level=clamp(n,0,2);beep(520+n*100,.07,'triangle')}
function v6DrawSelection(){drawWorld(0);buttons=[];rect(0,0,960,600,'#0e2339c9');
 v6Gradient(55,32,850,535,'#24445c','#13293e',23);strokeRect(55,32,850,535,'#d9bb83',3,23);
 text('冒険の扉を選ぶ',88,77,30,'#ffe4ae');text('4つのまったく違うジャンル。どこからでも挑戦できる。',89,111,14,'#c3dfdf');
 clickButton(789,56,91,39,'閉じる',navBack,{bg:'#e5dbc8',font:14});
 const keys=['survivor','platform','rpg','puzzle'];const colors=[['#2a856e','#134b5b'],['#5989c0','#2b4e81'],['#9060a1','#3e376b'],['#c28a4d','#79564b']];
 keys.forEach((k,i)=>{let x=82+(i%2)*410,y=144+Math.floor(i/2)*158;let [a,b]=colors[i],s=Math.max(...v6Records(k));v6Gradient(x,y,386,143,a,b,17);strokeRect(x,y,386,143,k===V6.selected?'#ffe0a0':'#ffffff63',k===V6.selected?4:1,17);
 circle(x+53,y+51,31,'#ffffff28');text(V6Icons[k],x+53,y+52,30,'#fff','center');text(V6Names[k],x+103,y+35,23,'#fff7d8');text(V6Categories[k],x+103,y+62,11,'#e7f2eb');text(V6Descriptions[k][0],x+19,y+100,14,'#fff8df');text(s?'★'.repeat(s)+'☆'.repeat(3-s):'未挑戦',x+18,y+125,14,'#fff5ab');clickButton(x+258,y+100,111,34,'選択する',()=>{V6.selected=k;beep(430,.08)},{bg:V6.selected===k?'#ffdb82':'#f8ead2',font:13,stroke:1})});
 rect(84,477,788,69,'#0e2238bc',13);text(`挑戦：${V6Names[V6.selected]}`,104,499,17,'#ffdf9e');
 ['のんびり','冒険','達人'].forEach((a,i)=>clickButton(120+i*123,518,115,29,a,()=>v6SelectDifficulty(i),{bg:V6.level===i?'#ffda86':'#d7e7e8',fg:'#253749',font:13,radius:9,stroke:1}));
 clickButton(580,490,268,49,'▶ この冒険を始める',()=>start(V6.selected),{bg:'#ffda89',font:19});}
function v6WorldHUD(){
 rect(13,12,395,67,'#17354ae9',16);strokeRect(13,12,395,67,'#efd6a5a8',2,16);rect(20,19,5,52,'#f5ca7e',3);text('DOMANDO RUSH',37,34,21,'#fff0c9');text('V6.0  •  WORLD FESTIVAL',39,60,12,'#cfe5e4');
 v6Pill(418,17,170,52,`🪙  ${fmt(save.coins)}`,'#254b60');
 clickButton(601,20,151,43,'遊びを選ぶ Q',v6Selection,{bg:'#ffe0a3',fg:'#3c4251',font:16,stroke:2});
 clickButton(760,20,89,43,'地図 M',()=>{scene='atlas';adjustTouch()},{bg:'#e0eada',font:14,stroke:1});
 clickButton(858,20,87,43,volume?'♪ ON':'♪ OFF',()=>{volume=!volume;save.sound=volume;persist()},{bg:'#d7e3f1',font:14,stroke:1});
 let near=nearestInteract();if(near){let label=near.mode?'ゲーム開始':near.kind==='npc'?'話す':near.kind==='chest'?'宝箱を開く':near.kind==='port'||near.kind==='isleport'?'船に乗る':'調べる';rect(299,495,361,55,'#f5e5c0',13);strokeRect(299,495,361,55,'#ae8e63',2,13);v6ClipText(`${near.name}  •  E ${label}`,480,521,336,18,'#334c5b','center')}
 rect(13,555,392,30,'#17384dd8',11);text('WASD 移動   E 調べる   Q ゲーム   M 地図',25,570,13,'#e5edeb');
 rect(744,552,203,36,'#17384dc8',11);v6ClipText(worldArea,844,570,180,14,'#ffeab5','center');
 // Discoveries presented as a small non-intrusive route marker.
 const todo=gates.filter(z=>!save.world.found.includes(z.id)).sort((a,b)=>Math.hypot(a.x-town.x,a.y-town.y)-Math.hypot(b.x-town.x,b.y-town.y))[0];
 if(todo){let a=Math.atan2(todo.y-town.y,todo.x-town.x);circle(48,125,29,'#1a4055dc');g.save();g.translate(48,125);g.rotate(a+Math.PI/2);poly([[0,-20],[-10,12],[0,3],[10,12]],'#fbd388');g.restore()}
}
function drawWorldHUD(){v6WorldHUD()}
/* -------------------------- GAME I: SURVIVOR ------------------------- */
const S6Upgrades=[
 ['spark','✦ 光弾強化','光弾の威力 +25%'],['cadence','✦ 星の連射','連射速度 +20%'],
 ['triple','✦ 三つ星','弾が1個増える'],['orbit','◉ 守護の輪','周囲に星球を追加'],
 ['pulse','◎ 波紋の力','自動の範囲魔法を追加'],['speed','↟ 風の靴','移動速度 +11%'],
 ['heart','❤ 生命の葉','体力を30回復'],['magnet','◇ 引き寄せ','経験値の吸引範囲アップ'],
 ['burst','✶ 虹嵐強化','必殺技の範囲と威力が上昇'] ];
function initSurvivor(){const hp=114+21*(save.upgrades.heart||0);game={kind:'survivor',p:{x:900,y:650,r:18,hp,max:hp,inv:0,dash:0,cool:0},seconds:0,duration:[95,125,145][V6.level],score:0,kills:0,combo:0,lvl:1,xp:0,xpGoal:8,fire:0,spawn:.4,enemies:[],shots:[],drops:[],power:1,rate:1,spread:1,orbit:0,pulse:0,pulseTimer:2,magnet:140,ink:20,blast:0,choice:false,choices:[],boss:false,bossSpawned:false,bossKilled:false,trail:[],spawnPower:1+V6.level*.25,crit:0};}
function v6SpawnEnemy(){const s=game;if(s.enemies.length>=105)return;let a=rnd(0,TAU),dist=rnd(500,650),x=clamp(s.p.x+Math.cos(a)*dist,25,1775),y=clamp(s.p.y+Math.sin(a)*dist,25,1275);let kind=s.seconds>35?irnd(0,3):irnd(0,1);const hp=([30,20,46,68][kind])*(1+s.seconds/340+V6.level*.24);s.enemies.push({x,y,r:[20,15,24,25][kind],hp,max:hp,v:[68,116,73,81][kind]*(1+V6.level*.13),kind,hit:0,phase:rnd(0,TAU)});}
function v6EnemyDown(e){const s=game;s.kills++;s.combo++;s.ink=Math.min(100,s.ink+3.4);s.score+=Math.floor((e.kind===4?550:30+s.combo*.4)*(1+Math.min(3,s.combo/35)));if(e.kind===4){s.boss=false;s.bossKilled=true;announce('👑 巨大な虹守りを撃破！');flash=.4;shake=7;}
 s.drops.push({x:e.x,y:e.y,v:e.kind===4?15:1});for(let i=0;i<3;i++)particles.push({x:e.x-(s.p.x-480),y:e.y-(s.p.y-300),vx:rnd(-35,35),vy:rnd(-70,-20),r:rnd(3,6),ttl:.65,max:.65,color:'#ffe3a8'});}
function v6LevelOffer(){const s=game;const pool=[...S6Upgrades];for(let i=pool.length-1;i>0;i--){let j=irnd(0,i);[pool[i],pool[j]]=[pool[j],pool[i]];}s.choice=true;s.choices=pool.slice(0,3);beep(890,.18,'triangle');announce('LEVEL UP! 好きな力を3つから選ぼう');}
function survivorUpgrade(index){if(!game?.choice)return;const b=game.choices[index];if(!b)return;const s=game;if(b[0]==='spark')s.power*=1.25;if(b[0]==='cadence')s.rate*=1.2;if(b[0]==='triple')s.spread=Math.min(6,s.spread+1);if(b[0]==='orbit')s.orbit=Math.min(4,s.orbit+1);if(b[0]==='pulse')s.pulse=Math.min(4,s.pulse+1);if(b[0]==='speed')s.speed=(s.speed||1)*1.11;if(b[0]==='heart')s.p.hp=Math.min(s.p.max,s.p.hp+30);if(b[0]==='magnet')s.magnet=Math.min(440,s.magnet+65);if(b[0]==='burst')s.burst=(s.burst||1)*1.35;s.choice=false;chord();v6Ribbon(b[1],480,251,'#fff4b7')}
function survivorShot(){const s=game,p=s.p,near=s.enemies.slice().sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!near)return;const a=Math.atan2(near.y-p.y,near.x-p.x);for(let i=0;i<s.spread;i++){const t=a+(i-(s.spread-1)/2)*.14;s.shots.push({x:p.x,y:p.y,vx:Math.cos(t)*650,vy:Math.sin(t)*650,ttl:1.3,r:7,damage:24*s.power});}if(s.shots.length>175)s.shots.splice(0,s.shots.length-175);if(s.kills%3===0)beep(520,.03,'sine',.006)}
function survivorDash(){if(scene!=='survivor'||paused||game.choice||game.p.cool>0)return;let s=game,a=axis();if(!a.x&&!a.y)a={x:0,y:-1};s.p.x=clamp(s.p.x+a.x*169,26,1774);s.p.y=clamp(s.p.y+a.y*169,26,1274);s.p.cool=2.7;s.p.inv=.5;s.ink=Math.min(100,s.ink+7);s.trail.push({x:s.p.x,y:s.p.y,t:.8});beep(500,.14,'sawtooth',.035);}
function survivorStorm(){const s=game;if(scene!=='survivor'||paused||s.choice||s.ink<100)return;s.ink=0;s.blast=.6;s.p.inv=.75;let n=0;for(let i=s.enemies.length-1;i>=0;i--){const e=s.enemies[i];if(Math.hypot(e.x-s.p.x,e.y-s.p.y)<460){e.hp-=105*s.power*(s.burst||1);e.hit=.3;n++;if(e.hp<=0){s.enemies.splice(i,1);v6EnemyDown(e)}}}s.score+=n*16;flash=.35;shake=8;beep(760,.24,'sawtooth',.06);announce(`🌈 COLOR STORM ×${n}HIT`)}
function stepSurvivor(dt){const s=game,p=s.p;if(!s||s.choice)return;s.seconds+=dt;s.fire-=dt;s.spawn-=dt;p.inv=Math.max(0,p.inv-dt);p.cool=Math.max(0,p.cool-dt);s.blast=Math.max(0,s.blast-dt);s.pulseTimer-=dt;
 const a=axis(),speed=260*(s.speed||1);p.x=clamp(p.x+a.x*dt*speed,22,1778);p.y=clamp(p.y+a.y*dt*speed,22,1278);if(a.x||a.y){s.ink=Math.min(100,s.ink+dt*6);if(tick%4===0)s.trail.push({x:p.x,y:p.y,t:1});}
 for(let i=s.trail.length-1;i>=0;i--){s.trail[i].t-=dt;if(s.trail[i].t<=0)s.trail.splice(i,1)}if(s.trail.length>75)s.trail.splice(0,s.trail.length-75);
 if(s.fire<=0){survivorShot();s.fire=Math.max(.14,.51/s.rate)}
 if(s.spawn<=0){let count=Math.min(4,1+Math.floor(s.seconds/26));for(let k=0;k<count;k++)v6SpawnEnemy();s.spawn=Math.max(.26,1.05-s.seconds*.0059)}
 if(!s.bossSpawned&&s.seconds>s.duration*.73){s.bossSpawned=true;s.boss=true;const hp=(430+V6.level*180);s.enemies.push({x:clamp(p.x+380,60,1660),y:clamp(p.y-240,60,1200),r:58,hp,max:hp,v:57+V6.level*7,kind:4,hit:0,phase:0});announce('⚠ 虹守りが現れた！');}
 if(s.pulse>0&&s.pulseTimer<=0){s.pulseTimer=3.3;for(let i=s.enemies.length-1;i>=0;i--){const e=s.enemies[i];if(Math.hypot(e.x-p.x,e.y-p.y)<166+s.pulse*24){e.hp-=18*s.pulse*s.power;e.hit=.23;if(e.hp<=0){s.enemies.splice(i,1);v6EnemyDown(e)}}}s.blast=Math.max(s.blast,.22);beep(460,.1,'sine',.02)}
 for(let j=s.shots.length-1;j>=0;j--){let b=s.shots[j];b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;let gone=b.ttl<=0;for(let i=s.enemies.length-1;!gone&&i>=0;i--){let e=s.enemies[i];if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=b.damage;e.hit=.16;gone=true;if(e.hp<=0){s.enemies.splice(i,1);v6EnemyDown(e)}}}if(gone)s.shots.splice(j,1)}
 for(let i=s.enemies.length-1;i>=0;i--){const e=s.enemies[i],dist=Math.hypot(p.x-e.x,p.y-e.y)||1;e.x+=(p.x-e.x)/dist*e.v*dt;e.y+=(p.y-e.y)/dist*e.v*dt;e.hit=Math.max(0,e.hit-dt);if(s.orbit){for(let k=0;k<s.orbit;k++){const angle=s.seconds*2.9+k*TAU/s.orbit,ox=p.x+Math.cos(angle)*82,oy=p.y+Math.sin(angle)*82;if(Math.hypot(ox-e.x,oy-e.y)<e.r+16&&(!e.orbitHit||e.orbitHit<=s.seconds)){e.hp-=18*s.power;e.hit=.18;e.orbitHit=s.seconds+.27;if(e.hp<=0){s.enemies.splice(i,1);v6EnemyDown(e);break}}}}
 if(s.enemies[i]===e&&dist<e.r+p.r&&p.inv<=0){p.hp-=e.kind===4?18:9;p.inv=.85;s.combo=0;shake=4;beep(190,.1,'triangle');if(p.hp<=0){winGame(false,s.score,'次は組み合わせを変えてみよう！');return}}}
 for(let i=s.drops.length-1;i>=0;i--){let d=s.drops[i],dist=Math.hypot(p.x-d.x,p.y-d.y)||1;if(dist<s.magnet){d.x+=(p.x-d.x)/dist*420*dt;d.y+=(p.y-d.y)/dist*420*dt}if(dist<32){s.xp+=d.v;s.drops.splice(i,1);if(s.xp>=s.xpGoal){s.xp-=s.xpGoal;s.lvl++;s.xpGoal=Math.floor(s.xpGoal*1.26+3);v6LevelOffer();break}}}
 if(s.seconds>=s.duration){winGame(s.bossKilled,s.score+(s.bossKilled?1200:350),s.bossKilled?'虹守りを倒して森に光を取り戻した！':'時間内に虹守りを倒すとクリア！');}}
function drawSurvivor(){const s=game,p=s.p,cx=clamp(p.x-480,0,840),cy=clamp(p.y-300,0,700);g.fillStyle='#acd996';g.fillRect(0,0,960,600);
 g.save();g.translate(-cx,-cy);rect(0,0,1800,1300,'#a7d89c');for(let i=0;i<490;i++){let x=(i*217)%1798,y=(i*373)%1292;circle(x,y,1+i%3,['#f4ffd5','#7fbd83','#e2e8a2'][i%3])}for(let i=0;i<64;i++){let x=(i*273)%1800,y=(i*177)%1300;if(Math.abs(x-p.x)>90||Math.abs(y-p.y)>90)drawWorldTree(x,y,2,.48+((i%3)*.07))}
 for(const t of s.trail){g.globalAlpha=.2*t.t;circle(t.x,t.y,20,'#fff2aa');}g.globalAlpha=1;
 for(const d of s.drops){circle(d.x,d.y,10,'#ffe99c');star(d.x,d.y,7,'#fff')}
 for(const b of s.shots){circle(b.x,b.y,11,'#fff9ba90');circle(b.x,b.y,6,'#fff7ec')}
 for(const e of s.enemies){if(e.kind===4){oval(e.x,e.y+47,62,14,'#304c4b77');circle(e.x,e.y,e.r,e.hit?'#fff5e9':'#b480b7');for(let i=0;i<7;i++){let a=i*TAU/7+tick*.008;circle(e.x+Math.cos(a)*50,e.y+Math.sin(a)*50,13,'#e6b7dc')}circle(e.x-18,e.y-11,8,'#433f65');circle(e.x+20,e.y-11,8,'#433f65');v6Bar(e.x-76,e.y-83,152,10,e.hp/e.max,'#382f59','#ffbad1');}else monster(e.x,e.y,e.r,e.kind,e.hit)}
 for(let i=0;i<s.orbit;i++){let a=s.seconds*2.9+i*TAU/s.orbit,xx=p.x+Math.cos(a)*82,yy=p.y+Math.sin(a)*82;circle(xx,yy,16,'#d7ecff88');star(xx,yy,10,'#fff3ab')}
 if(s.blast>0){g.strokeStyle='#fdf4b8';g.lineWidth=13*s.blast;g.beginPath();g.arc(p.x,p.y,166+s.pulse*22+(1-s.blast)*310,0,TAU);g.stroke()}
 hero(p.x,p.y,1.08,'#df737d',true);g.restore();
 v6Gradient(10,9,940,94,'#1d4651ec','#193b4def',14);text('🌿 虹嵐の森',28,34,26,'#ffe5aa');text(`Lv.${s.lvl}    討伐 ${s.kills}    COMBO ${s.combo}    SCORE ${fmt(s.score)}`,31,72,16,'#f8fff2');text(`残り ${Math.max(0,Math.ceil(s.duration-s.seconds))}秒`,824,35,21,'#fff0c6','center');v6Bar(695,63,212,15,p.hp/p.max,'#354657','#72dca6');text(`HP ${Math.ceil(p.hp)}/${p.max}`,800,86,12,'#ebfaec','center');
 v6Gradient(14,532,294,53,'#244d53dd','#183948dd',12);text(`EXP ${s.xp}/${s.xpGoal}`,28,546,14,'#ffedaf');v6Bar(28,565,262,9,s.xp/s.xpGoal,'#334552','#ffcf74');
 v6Gradient(318,532,307,53,'#274d67d9','#233957e0',12);text(s.ink>=100?'Space：レインボーストーム！':`虹ゲージ ${Math.floor(s.ink)}%`,335,551,15,'#fff1c2');v6Bar(336,570,269,9,s.ink/100,'#344c68','#ffe07d');
 v6Gradient(634,532,304,53,'#304363df','#25334de8',12);text(`Shift ダッシュ ${p.cool?'あと'+p.cool.toFixed(1)+'秒':'READY'}`,649,551,16,'#e6f2f6');text(`成長：星の輪 ${s.orbit}　波紋 ${s.pulse}`,648,572,13,'#dce9ef');
 if(s.choice){rect(0,0,960,600,'#10263fc8');v6Gradient(172,103,616,401,'#fbf1d6','#dddbe6',22);strokeRect(172,103,616,401,'#d8ad7d',4,22);text('LEVEL UP!  新しい力を選ぼう',480,152,26,'#324158','center');text('武器の組み合わせが冒険の展開を変える',480,184,15,'#607080','center');s.choices.forEach((b,i)=>{let y=212+i*82;clickButton(205,y,549,65,`${i+1}   ${b[1]}  —  ${b[2]}`,()=>survivorUpgrade(i),{bg:['#ffdfb5','#d4eddf','#eee1f7'][i],font:18})});}}
/* ------------------------ GAME II: PLATFORM -------------------------- */
const P6Floors=[{x:0,y:510,w:570,h:120},{x:660,y:510,w:560,h:120},{x:1330,y:510,w:490,h:120},{x:1920,y:510,w:800,h:120}];
const P6Bridges=[{x:215,y:423,w:133,h:22},{x:510,y:385,w:100,h:22},{x:718,y:407,w:145,h:22},{x:1030,y:370,w:135,h:22},{x:1250,y:421,w:123,h:22},{x:1520,y:381,w:150,h:22},{x:1765,y:400,w:130,h:22},{x:2030,y:378,w:136,h:22},{x:2350,y:363,w:139,h:22}];
function initPlatform(){const t=V6.level;game={kind:'platform',p:{x:78,y:440,vx:0,vy:0,w:30,h:42,ground:false,jumps:0,coyote:.12,buffer:0,dash:0,dashCd:0,inv:0,face:1},stage:t,seconds:0,hp:4+Math.min(1,save.upgrades.heart||0),falls:0,score:0,stars:0,collect:[...Array(19)].map((_,i)=>({x:190+i*125+(i%2)*20,y:420-(i%3)*33,got:false})),checkpoints:[715,1500,2180],lastCheckpoint:0,respawn:78,enemies:[{x:427,y:485,dir:1},{x:975,y:485,dir:-1},{x:1710,y:485,dir:1},{x:2420,y:485,dir:-1}],solids:[...P6Floors,...P6Bridges].map(z=>({...z})),finish:2640};
 if(t>=1){game.solids.push({x:1160,y:311,w:97,h:20},{x:1664,y:286,w:114,h:20});}if(t>=2){game.solids.push({x:370,y:303,w:105,h:20},{x:2240,y:287,w:98,h:20});}}
function platformJump(){if(scene!=='platform'||paused)return;const p=game.p;p.buffer=.15;if(p.ground||p.coyote>0||p.jumps<2&&((save.upgrades.boots||0)>0)){p.vy=-605;p.ground=false;p.coyote=0;p.buffer=0;p.jumps++;beep(605,.12,'triangle');sparkle(clamp(p.x-camera,35,925),p.y+30,'#fff3c1',8)}}
function platformDash(){if(scene!=='platform'||paused||game.p.dashCd>0)return;game.p.dash=.19;game.p.dashCd=1.25;game.p.inv=.24;beep(580,.12,'sawtooth',.028)}
function v6PlatformDamage(){const s=game,p=s.p;if(p.inv>0)return;s.hp--;s.falls++;p.inv=1.2;shake=5;beep(210,.13,'triangle');if(s.hp<=0){winGame(false,s.score,'次はチェックポイントを使って進もう');return;}p.x=s.respawn;p.y=420;p.vy=0;p.vx=0;p.dash=0;announce('チェックポイントからすぐ再開！')}
function stepPlatform(dt){const s=game,p=s.p;s.seconds+=dt;p.inv=Math.max(0,p.inv-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.dash=Math.max(0,p.dash-dt);p.coyote=Math.max(0,p.coyote-dt);p.buffer=Math.max(0,p.buffer-dt);
 const a=axis();if(a.x!==0)p.face=a.x>0?1:-1;const target=a.x*(p.dash>0?760:310),accel=p.ground?14:9;p.vx+=(target-p.vx)*Math.min(1,accel*dt);p.x=clamp(p.x+p.vx*dt,15,2720);
 let oldY=p.y,foot=p.y+p.h;p.vy=Math.min(920,p.vy+1600*dt);if(p.vy<0&&!(keyHeld.has(' ')||keyHeld.has('w')||keyHeld.has('arrowup')))p.vy+=1000*dt;
 p.y+=p.vy*dt;let was=p.ground;p.ground=false;
 for(const plat of s.solids){if(p.x+p.w*.5<plat.x||p.x-p.w*.5>plat.x+plat.w)continue;let top=plat.y;if(p.vy>=0&&foot<=top+14&&p.y+p.h>=top){p.y=top-p.h;p.vy=0;p.ground=true;p.jumps=0;p.coyote=.11;break}if(p.vy<0&&oldY>=plat.y+plat.h-3&&p.y<=plat.y+plat.h&&plat.h<60){p.y=plat.y+plat.h;p.vy=0;break}}
 if(was&&!p.ground)p.coyote=.12;if(p.buffer>0&&(p.ground||p.coyote>0)){p.vy=-605;p.ground=false;p.coyote=0;p.buffer=0;p.jumps=1;beep(600,.09,'triangle')}
 if(p.y>680){v6PlatformDamage();if(scene!=='platform')return}
 for(const x of s.checkpoints){if(p.x>x&&s.respawn<x){s.respawn=x+14;s.lastCheckpoint=x;s.score+=100;announce('★ チェックポイントを通過！');chord()}}
 for(const c of s.collect){if(!c.got&&Math.hypot(c.x-p.x,c.y-(p.y+18))<39){c.got=true;s.stars++;s.score+=135;beep(920,.07,'triangle');v6Ribbon('+135',c.x-camera,c.y,'#ffec9b')}}
 for(const e of s.enemies){e.x+=e.dir*45*dt;if(e.x<60||e.x>2620)e.dir*=-1;if(Math.hypot(e.x-p.x,485-(p.y+22))<37&&p.inv<=0){if(p.vy>105){p.vy=-370;s.score+=120;e.x+=160;beep(700,.12,'triangle');}else{v6PlatformDamage();if(scene!=='platform')return;}}}
 if(p.x>=s.finish){winGame(true,s.score+1600+Math.max(0,600-s.seconds*5),`コース${V6.level+1}完走！ 星 ${s.stars}個、ミス ${s.falls}回`);return;}camera=clamp(p.x-300,0,1760);}
function drawPlatform(){const s=game,p=s.p,cx=camera;const sky=g.createLinearGradient(0,0,0,600);sky.addColorStop(0,['#72bde1','#9695c9','#e99f91'][s.stage]);sky.addColorStop(.8,'#dbf2e4');g.fillStyle=sky;g.fillRect(0,0,960,600);circle(832,103,49,'#ffe9ae');for(let i=0;i<11;i++){let x=((i*231-cx*.2)%1280+1280)%1280;cloud(x-50,94+i%3*42,.75)}
 for(let i=0;i<10;i++){let x=((i*310-cx*.39)%1270+1270)%1270;hill(x,517,285,i%2?'#81b6af':'#9ccbb2')}
 g.save();g.translate(-cx,0);
 for(const a of s.solids){rect(a.x,a.y,a.w,a.h,a.h>40?'#8b765d':'#785e68',a.h>40?2:10);rect(a.x,a.y,a.w,12,'#67bc86',4);rect(a.x,a.y+10,a.w,9,'#acd99b',4);if(a.h>40)for(let i=0;i<a.w;i+=34){line(a.x+i+10,a.y+24,a.x+i+14,a.y+38,'#d9b28d74',2)}}
 for(const c of s.collect)if(!c.got){circle(c.x,c.y,22,'#fff1bc55');star(c.x,c.y,13,'#ffe18d')}
 for(const e of s.enemies)monster(e.x,484,19,1,0);
 for(const x of s.checkpoints){rect(x,444,7,65,'#4b6476',2);poly([[x,439],[x+44,451],[x,464]],s.respawn>=x?'#8af0ca':'#e6bd89')}
 rect(s.finish,390,9,120,'#3c6170',4);poly([[s.finish+6,391],[s.finish+65,412],[s.finish+6,438]],'#f9d487');star(s.finish+22,414,12,'#fff4c3');
 if(p.dash>0){for(let i=1;i<=4;i++){g.globalAlpha=.14*i;hero(p.x-p.face*i*21,p.y+22,1,'#ffffff',true)}g.globalAlpha=1}hero(p.x,p.y+24,1.0,'#db7a81',true);g.restore();
 v6Gradient(12,10,938,84,'#233f60ee','#273d52ee',14);text(`☁ 風渡りの塔   STAGE ${s.stage+1}/3`,28,37,24,'#ffe6ad');text(`★ ${s.stars}     SCORE ${fmt(s.score)}     ❤ ${s.hp}`,30,73,17,'#ecf4e7');text('距離',770,31,14,'#fff0d5');v6Bar(817,27,116,12,p.x/s.finish,'#364b5b','#f5c477');text(`TIME ${s.seconds.toFixed(1)}s`,864,75,15,'#fff1d4','center');
 rect(12,551,420,34,'#223d51d8',9);text('←→ 移動   Space ジャンプ   Shift ダッシュ',27,569,15,'#ffedcb');rect(719,549,217,36,'#243d52db',9);text('星を集めてゴールへ！',829,568,15,'#fff1c4','center');}
/* ---------------------------- GAME III: RPG -------------------------- */
const R6Foes=[{name:'森の案内精霊　モコ',hp:91,atk:14,shield:30,kind:0,sky:['#9ad0bd','#dbecc9']},{name:'月の騎士　オルヴァ',hp:131,atk:18,shield:45,kind:2,sky:['#aaa9da','#e0d1de']},{name:'夜明けを守る　ルノア',hp:184,atk:21,shield:62,kind:3,sky:['#cbaac7','#f6d8c5']}];
const R6Intents=[['attack','通常攻撃','攻撃'],['charge','強撃の構え','次のターン強攻撃'],['magic','光波','魔力攻撃'],['guard','結界','シールド増加']];
function initRPG(){const hp=134+15*(save.upgrades.heart||0);game={kind:'rpg',wave:0,hp,max:hp,energy:2+Math.min(2,save.upgrades.focus||0),turn:0,guard:false,enemyHp:R6Foes[0].hp+V6.level*20,enemyMax:R6Foes[0].hp+V6.level*20,shield:R6Foes[0].shield,shieldMax:R6Foes[0].shield,history:['旅人を待つ者が現れた……'],score:0,between:false,heals:0,damage:0,stunned:false,intent:0,combo:0,sparks:0};}
function v6Log(s){game.history.unshift(s);game.history=game.history.slice(0,3)}
function rpgMove(index){const s=game;if(scene!=='rpg'||paused||s.between)return;let f=R6Foes[s.wave],dmg=0,sh=0;
 if(index===0){dmg=15+irnd(3,9)+s.combo*2;sh=14;s.energy=Math.min(5,s.energy+1);v6Log(`✨ 星剣  ${dmg}ダメージ  / 結界−${sh}`)}
 if(index===1){if(s.energy<2){announce('集中力が足りない！ 星剣で回復');return}s.energy-=2;dmg=30+irnd(3,12)+s.combo*3;sh=26;v6Log(`💫 プリズム魔法  ${dmg}ダメージ / 結界−${sh}`)}
 if(index===2){if(s.energy<2){announce('集中力が足りない！');return}s.energy-=2;let h=Math.min(s.max-s.hp,32);s.hp+=h;s.combo=0;v6Log(`🌱 癒しの歌 HP +${h}`)}
 if(index===3){s.guard=true;s.energy=Math.min(5,s.energy+2);s.combo++;v6Log('🛡️ 防御！ 被ダメ軽減・集中 +2')}
 if(dmg){const shieldNow=s.shield; s.shield=Math.max(0,s.shield-sh);let effective=Math.max(1,dmg-Math.ceil(shieldNow*.2));if(shieldNow>0&&s.shield===0){s.stunned=true;s.combo=Math.min(5,s.combo+1);effective+=20;v6Log('BREAK！ 相手の結界が崩れた！');beep(890,.19,'triangle')}s.enemyHp=Math.max(0,s.enemyHp-effective);s.score+=effective*8;shake=2;beep(index===1?670:540,.12,'triangle')}
 if(s.enemyHp<=0){s.score+=450+(s.wave+1)*220;s.between=true;s.shield=0;v6Log('勝利！ 次の門が開いた');chord();return}
 s.turn++;let intent=s.intent%4;
 if(s.stunned){v6Log('敵はBREAKで行動不能！');s.stunned=false;}
 else if(intent===3){s.shield=Math.min(s.shieldMax,s.shield+20+V6.level*4);v6Log('敵が結界を張り直した！')}
 else if(intent===1){s.enemyCharge=true;v6Log('敵は次の強撃をためている！')}
 else{let damage=f.atk+(intent===2?5:0)+(s.enemyCharge?12:0)+V6.level*3;s.enemyCharge=false;if(s.guard)damage=Math.ceil(damage*.23);s.hp=Math.max(0,s.hp-damage);v6Log(`${f.name}の攻撃　HP −${damage}`);shake=3;if(s.hp<=0){winGame(false,s.score,'敵の予告を見て、守るタイミングを選ぼう');return}}
 s.guard=false;s.intent=(s.intent+1)%4;}
function nextRPG(){const s=game;if(!s?.between)return;if(s.wave>=2){winGame(true,s.score+2100+Math.ceil(s.hp)*10,'月影の神殿を3章クリア！');return}
 s.wave++;const f=R6Foes[s.wave];s.enemyMax=f.hp+V6.level*30;s.enemyHp=s.enemyMax;s.shield=f.shield;s.shieldMax=f.shield;s.hp=Math.min(s.max,s.hp+36);s.energy=Math.min(5,s.energy+2);s.between=false;s.turn=0;s.intent=0;s.combo=0;s.enemyCharge=false;announce(`第${s.wave+1}章  HPが回復した！`)}
function drawRPG(){const s=game,f=R6Foes[s.wave];g.fillStyle=grad(0,600,...f.sky);g.fillRect(0,0,960,600);circle(790,115,66,'#fff2d96b');for(let i=0;i<10;i++){let x=i*113;rect(x,170+(i%3)*36,25,260,'#ffffff38',5);rect(x-12,155+(i%3)*36,51,26,'#fef5e766',4)}poly([[0,358],[220,299],[480,336],[727,280],[960,346],[960,600],[0,600]],'#536c8a88');rect(0,387,960,213,'#e8dace');for(let i=0;i<12;i++)line(i*102,390,i*91,600,'#bcaeb7',1.4);
 oval(693,373,114,24,'#34465b4d');circle(690,259,99,'#ffffff57');monster(689,269,s.wave===2?76:64,f.kind,0);if(s.shield>0){g.strokeStyle='#f5e0ae';g.lineWidth=5;g.beginPath();g.arc(690,267,97,Math.PI*.2,Math.PI*1.93);g.stroke()}hero(238,381,1.6,'#be6680');hero(124,398,1.05,'#70b0a5');
 v6Gradient(12,12,935,94,'#263d59f5','#203855f2',14);text(`☾ 月影の神殿　第 ${s.wave+1}/3 章`,29,38,25,'#ffe6af');text(f.name,30,75,17,'#e8edf2');v6Bar(540,30,385,18,s.enemyHp/s.enemyMax,'#3e445b','#f2a0b2');text(`HP ${Math.ceil(s.enemyHp)} / ${s.enemyMax}`,731,70,16,'#fff1e4','center');
 const next=R6Intents[s.intent%4];rect(511,124,413,65,'#2d4862e5',12);text(`次の敵行動：${next[1]}`,531,149,20,'#fff2c5');text(`敵の結界 ${s.shield}/${s.shieldMax}  •  BREAKで一時行動不能`,529,173,13,'#dfebee');
 v6Gradient(10,414,942,178,'#1c354df7','#28374cf8',17);text(`❤ ${s.hp}/${s.max}`,30,442,23,'#ffdfd1');text(`✦ 集中 ${s.energy}/5`,250,442,19,'#fae9ae');text(`BREAK連携 ×${s.combo}`,430,443,14,'#b8f4e1');text(s.history[0],30,474,16,'#fff5da');text(s.history[1]||'相手の動きを読んでコマンドを選ぼう',30,500,13,'#cee1eb');
 if(!s.between){[['1 星剣　+1集中',0],['2 魔法　−2集中',1],['3 回復　−2集中',2],['4 防御　+2集中',3]].forEach(([label,n],i)=>clickButton(521+(i%2)*210,432+Math.floor(i/2)*68,200,52,label,()=>rpgMove(n),{bg:['#f6dfb1','#d6d7f8','#bfe5da','#d9e4f4'][i],font:15}));}
 else{rect(0,0,960,600,'#172d49a2');panel(203,156,553,266,s.wave===2?'👑 全章クリア！':'✨ 章クリア！');text(`${f.name}を突破した！`,481,245,21,'#41526c','center');clickButton(322,317,315,64,s.wave===2?'★ 冒険を終える':'▶ 次の章へ',nextRPG,{bg:'#ffe19c',font:20});}}
/* ----------------------------- GAME IV: PUZZLE ----------------------- */
const V6ExtraRoutes=[[[0,2],[0,3],[1,3],[1,4],[2,4],[3,4],[3,3],[4,3],[4,2],[5,2],[5,1],[6,1],[6,2]],[[0,2],[1,2],[1,1],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[4,3],[5,3],[5,2],[6,2]]];
const V6Routes=[...routes,...V6ExtraRoutes];
function buildPuzzle(n){const path=V6Routes[n],grid=[];for(let y=0;y<5;y++)for(let x=0;x<7;x++)grid.push({x,y,ports:Math.random()<.5?[0,2]:[0,1],rot:irnd(0,3),path:false,gem:false});
 for(let i=0;i<path.length;i++){const [x,y]=path[i],t=grid[y*7+x],ports=[];if(i>0)ports.push(dir(path[i],path[i-1]));if(i<path.length-1)ports.push(dir(path[i],path[i+1]));t.ports=ports;t.rot=i===0||i===path.length-1?0:irnd(1,3);t.path=true;t.gem=i===Math.floor(path.length/3)||i===Math.floor(path.length*2/3)}return grid;}
function initPuzzle(){game={stage:0,grid:buildPuzzle(0),rotations:0,totalRotations:0,score:0,charged:new Set(),complete:false,undo:[],hints:0,stars:0};updateCircuit()}
function puzzleTurn(i){const s=game;if(scene!=='puzzle'||s.complete||i<0||i>=35)return;const t=s.grid[i];if(t.x===0&&t.y===2||t.x===6&&t.y===2)return;s.undo.push(i);t.rot=(t.rot+1)%4;s.rotations++;s.totalRotations++;updateCircuit();beep(450+(s.rotations%6)*80,.047,'triangle',.014);if(s.complete){const perfect=s.rotations<=V6Routes[s.stage].length*1.85;s.score+=perfect?700:430;s.stars+=perfect?3:2;chord();sparkle(477,295,'#ffe08f',45);announce(perfect?'PERFECT ROUTE! ★★★':'回路完成！ ★★');}}
function puzzleHint(){const s=game;if(s.complete)return;const next=s.grid.find(t=>t.path&&t.rot!==0&&!(t.x===0&&t.y===2)&&!(t.x===6&&t.y===2));if(next){s.hints++;announce(`💡 ヒント：${next.x+1}列 ${next.y+1}行 が正解ルート`);v6Ribbon('HINT',500,102,'#fff5b5');}else announce('残りは線のつながりを確認してみよう！')}
function puzzleNext(){const s=game;if(!s.complete)return;if(s.stage>=V6Routes.length-1){winGame(true,s.score+1300,`8設計図完成！ 最高評価 ★${s.stars}`);return;}s.stage++;s.grid=buildPuzzle(s.stage);s.rotations=0;s.undo=[];s.complete=false;updateCircuit();announce(`設計図 ${s.stage+1}/${V6Routes.length}`)}
function drawPuzzle(){const s=game;g.fillStyle=grad(0,600,'#8dabbc','#e6dbb5');g.fillRect(0,0,960,600);for(let i=0;i<22;i++)circle((i*157)%960,80+(i*113)%510,15,'#ffffea22');
 v6Gradient(13,11,935,96,'#263d58f1','#244d60f1',14);text('◈ 光環の工房',29,38,26,'#ffe4ae');text(`設計図 ${s.stage+1}/8   •   回転 ${s.rotations}   •   獲得 ★${s.stars}   •   SCORE ${fmt(s.score)}`,31,80,15,'#f5f4e8');
 v6Gradient(161,125,636,391,'#4d687d','#3b526f',16);rect(173,137,611,367,'#f3e8d0',14);
 for(let i=0;i<35;i++){const t=s.grid[i],x=205+t.x*79,y=151+t.y*69,hot=s.charged.has(i);v6Gradient(x,y,68,62,hot?'#dbf9df':'#fffbec',hot?'#a9ded0':'#e5ddcd',10);strokeRect(x,y,68,62,hot?'#54ae93':'#b8b3ac',2,10);circle(x+34,y+31,25,hot?'#97dac4':'#cdd4d9');for(const d of actualPorts(t)){const xx=x+34+directions[d][0]*25,yy=y+31+directions[d][1]*24;line(x+34,y+31,xx,yy,hot?'#239b88':'#66879e',12);circle(xx,yy,6,hot?'#fef1b0':'#87a7ba')}circle(x+34,y+31,9,hot?'#ffeeba':'#94b0bc');if(t.gem)star(x+34,y+31,10,hot?'#ffe079':'#afb1d3');if(t.x===0&&t.y===2)v6Pill(x+2,y+47,64,16,'START','#f3c982','#324860');if(t.x===6&&t.y===2)v6Pill(x+2,y+47,64,16,'GOAL','#c5abd9','#243d57')}
 text('クリックで回転。START → ★2個 → GOAL をつなごう',480,540,16,'#284c61','center');clickButton(15,531,135,48,'↶ 取り消す',puzzleUndo,{bg:'#f8e1b6',font:16});clickButton(811,531,134,48,'💡 ヒント',puzzleHint,{bg:'#f3e2b3',font:15});
 if(s.complete){rect(0,0,960,600,'#192c4c9a');panel(191,137,576,315,'✨ 回路クリア！');text(`設計図 ${s.stage+1}/8 を完成した！`,480,237,25,'#445671','center');text(`今の回転数 ${s.rotations}   獲得評価 ★${s.rotations<=V6Routes[s.stage].length*1.85?3:2}`,480,290,18,'#647285','center');clickButton(326,345,312,62,s.stage===7?'🏆 全設計図を完成！':'▶ 次の設計図へ',puzzleNext,{bg:'#ffe0a0',font:19});}}
function drawResult(){drawWorld(0);buttons=[];rect(0,0,960,600,'#142742cc');v6Gradient(150,65,660,484,'#fdf0d5','#d8e5e7',21);strokeRect(150,65,660,484,'#e5bd87',4,21);
 text(result.won?'QUEST COMPLETE!':'NICE TRY!',480,120,31,'#375164','center');text(V6Names[result.name]||names[result.name],480,160,24,'#646277','center');
 text((result.won?'★'.repeat(Math.max(1,result.stars)):'☆')+(result.won?'☆'.repeat(Math.max(0,3-result.stars)):'☆☆'),480,217,35,'#dba550','center');
 rect(199,247,559,149,'#ffffffb9',13);text(`スコア  ${fmt(result.score)}`,480,286,28,'#384e64','center');text(`獲得コイン  +${fmt(result.reward)}`,480,337,22,'#bc8546','center');v6ClipText(result.details,480,378,516,15,'#637489','center');
 text(`BEST ${fmt(save.records[result.name])}    •    今回の難易度 ${['のんびり','冒険','達人'][result.level]}`,480,427,16,'#5d6a7b','center');
 clickButton(187,458,258,60,'◀ ワールドへ戻る',navBack,{bg:'#d8e5df',font:18});clickButton(511,458,258,60,'▶ もう一度挑戦',()=>start(result.name),{bg:'#ffdb91',font:19});}
function drawPaused(){rect(0,0,960,600,'#10253bbb');v6Gradient(260,155,442,308,'#fdf0d8','#dbe5de',16);strokeRect(260,155,442,308,'#debd89',3,16);text('Ⅱ PAUSE',480,205,28,'#344e66','center');text('自分のペースで続けよう',480,254,17,'#677283','center');clickButton(310,301,344,57,'▶ ゲームを再開',()=>paused=false,{bg:'#ffe0a4',font:20});clickButton(310,378,344,56,'◀ ワールドへ戻る',navBack,{bg:'#d4e8e7',font:18});}
