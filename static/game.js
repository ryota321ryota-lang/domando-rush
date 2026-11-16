/* DOMANDO RUSH: DREAM ARCADE v7.0 — original characters, art and gameplay.
   Single-player, browser-only save, no external assets or libraries. */
(()=>{'use strict';
const cvs=document.getElementById('game'), g=cvs.getContext('2d');
const W=960,H=600,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),irnd=(a,b)=>Math.floor(rnd(a,b+1));
const F={heading:'900 26px system-ui,"Noto Sans JP"',body:'700 16px system-ui,"Noto Sans JP"'};
const STORAGE='domando-rush-v5-luminous-atlas';
const newSave=()=>({coins:0,earned:0,clears:{survivor:0,platform:0,rpg:0,puzzle:0},records:{survivor:0,platform:0,rpg:0,puzzle:0},upgrades:{heart:0,boots:0,focus:0},sound:true,firstVisit:true,world:{x:750,y:955,found:[],chests:[],talked:[],claimedFinal:false,steps:0}});
function readSave(){
 let s=newSave();try{
  let current=JSON.parse(localStorage.getItem(STORAGE)||'null');
  const old4=JSON.parse(localStorage.getItem('domando-rush-v4-four-roads')||'null');
  const old3=JSON.parse(localStorage.getItem('domando-rush-v3-save')||'null');
  const v=current&&typeof current==='object'?current:old4&&typeof old4==='object'?old4:null;
  if(v){s={...s,...v,world:{...s.world,...(current?.world||{})},clears:{...s.clears,...(v.clears||{})},records:{...s.records,...(v.records||{})},upgrades:{...s.upgrades,...(v.upgrades||{})}};
    s.world.found=Array.isArray(s.world.found)?s.world.found:[];
    s.world.chests=Array.isArray(s.world.chests)?s.world.chests:[];
    s.world.talked=Array.isArray(s.world.talked)?s.world.talked:[];
    if(!current)s.firstVisit=true;
  }else if(old3&&typeof old3==='object'){s.coins=clamp(Number(old3.coins)||0,0,1e6);s.earned=Math.max(s.coins,Number(old3.totalCoins)||0);s.records.survivor=Number(old3.records?.adventure)||0;}
 }catch(e){console.warn('Save load failed:',e)}
 return s;
}
let save=readSave(),scene='town',tick=0,clock=performance.now(),mode=null,game=null,paused=false,result=null,shake=0,flash=0,camera=0,particles=[],buttons=[],keyHeld=new Set(),lastInfo='',infoTimer=0,dialogue='広い世界を歩くか、Qキーですぐ4つのゲームに挑戦しよう！',volume=!!save.sound;
const fmt=x=>Math.max(0,Math.floor(x)).toLocaleString('ja-JP');
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(save));}catch(_){}}
function announce(v){lastInfo=v;infoTimer=2.1;const el=document.getElementById('notice');el.textContent=v;el.classList.add('show');}
let audio=null;function beep(f=600,len=.1,wave='sine',v=.035){if(!volume)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;o.type=wave;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(75,f*.7),t+len);gain.gain.setValueAtTime(v,t);gain.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(gain).connect(audio.destination);o.start();o.stop(t+len+.02);}catch(_){}}
function chord(){beep(523,.19,'triangle');setTimeout(()=>beep(659,.20,'triangle'),90);setTimeout(()=>beep(784,.32,'triangle'),180)}
function rect(x,y,w,h,fill,r=0){g.fillStyle=fill;g.beginPath();g.roundRect(x,y,Math.max(0,w),Math.max(0,h),r);g.fill();}
function strokeRect(x,y,w,h,color,l=2,r=0){g.strokeStyle=color;g.lineWidth=l;g.beginPath();g.roundRect(x,y,w,h,r);g.stroke();}
function circle(x,y,r,fill){g.fillStyle=fill;g.beginPath();g.arc(x,y,Math.max(0,r),0,TAU);g.fill();}
function oval(x,y,rx,ry,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,TAU);g.fill();}
function line(x,y,xx,yy,col,l=2){g.strokeStyle=col;g.lineWidth=l;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();}
function poly(points,col){g.fillStyle=col;g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.closePath();g.fill();}
function text(s,x,y,size=18,col='#fff',align='left',weight=800,shadow=false){g.save();g.textAlign=align;g.textBaseline='middle';g.font=`${weight} ${size}px system-ui,"Noto Sans JP",sans-serif`;if(shadow){g.shadowColor='#17253599';g.shadowBlur=7;g.shadowOffsetY=2}g.fillStyle=col;g.fillText(String(s),x,y);g.restore();}
function grad(y,h,a,b){let z=g.createLinearGradient(0,y,0,y+h);z.addColorStop(0,a);z.addColorStop(1,b);return z}
function star(x,y,r,col='#ffdc6d',spikes=5){g.save();g.translate(x,y);g.rotate(tick*.005);g.fillStyle=col;g.beginPath();for(let i=0;i<spikes*2;i++){let ang=i*Math.PI/spikes-Math.PI/2,d=i%2?r*.46:r;let xx=Math.cos(ang)*d,yy=Math.sin(ang)*d;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.closePath();g.fill();g.restore()}
function badge(x,y,w,label,color='#3c6486'){rect(x,y,w,34,color,13);strokeRect(x,y,w,34,'#ffffff65',1,13);text(label,x+w/2,y+18,15,'#fff','center',900)}
function clickButton(x,y,w,h,label,action,opts={}){rect(x,y+4,w,h,'#2d415588',opts.radius??12);rect(x,y,w,h,opts.bg||'#fff3d4',opts.radius??12);strokeRect(x,y,w,h,opts.border||'#785c55',opts.stroke||2,opts.radius??12);text(label,x+w/2,y+h/2,opts.font||17,opts.fg||'#413b4a','center',900);buttons.push({x,y,w,h,action,label});}
function panel(x,y,w,h,title,fill='#f5e8cb'){rect(x+4,y+5,w,h,'#1229406a',15);rect(x,y,w,h,fill,15);strokeRect(x,y,w,h,'#463e55',4,15);rect(x+7,y+7,w-14,6,'#ffffff88',4);if(title)text(title,x+22,y+30,23,'#2f354c')}
function sparkle(x,y,col='#ffe98f',n=10){for(let i=0;i<n;i++){let a=Math.random()*TAU,s=rnd(60,220);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rnd(40,100),r:rnd(3,7),ttl:rnd(.4,1.05),max:1,color:col});}if(particles.length>500)particles.splice(0,particles.length-500)}
function particlesStep(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;p.ttl-=dt;if(p.ttl<=0)particles.splice(i,1);}}
function particlesDraw(){for(const p of particles){g.globalAlpha=clamp(p.ttl/p.max,0,1);circle(p.x,p.y,p.r,p.color)}g.globalAlpha=1;}
function navBack(){scene='town';game=null;paused=false;talkLines=[];adjustTouch();}
function winGame(won,score,details){if(scene==='results')return;const name=mode;const bonus=won?50:12;const reward=Math.max(8,Math.min(500,Math.floor(score/80)+bonus));save.coins+=reward;save.earned+=reward;if(won)save.clears[name]=(save.clears[name]||0)+1;save.records[name]=Math.max(save.records[name]||0,Math.floor(score));persist();result={won,score:Math.floor(score),reward,details,name};scene='results';game=null;paused=false;chord();for(let i=0;i<7;i++)sparkle(rnd(110,850),rnd(95,410),['#ffe47e','#f9a4ad','#92efd2'][i%3],20);}
function start(which){mode=which;paused=false;particles.length=0;flash=.15;beep(450,.15,'triangle');if(which==='survivor')initSurvivor();else if(which==='platform')initPlatform();else if(which==='rpg')initRPG();else if(which==='puzzle')initPuzzle();scene=which;adjustTouch();}
function countLabel(){return `🪙 ${fmt(save.coins)}`}
function topHUD(title,sub){rect(16,15,371,54,'#253c58dd',15);strokeRect(16,15,371,54,'#fce9c099',2,15);text(title,32,37,21,'#ffecb9');text(sub,34,58,11,'#fff8d0', 'left',700);badge(776,15,170,countLabel(),'#365773');}
function leaf(x,y,k=1){oval(x,y+4*k,18*k,7*k,'#314c4050');circle(x,y-15*k,18*k,'#2f976c');circle(x-10*k,y-23*k,15*k,'#54b87e');circle(x+9*k,y-27*k,15*k,'#71cc87');circle(x,y-31*k,12*k,'#89d797');rect(x-4*k,y-12*k,8*k,19*k,'#73584c',2)}
function cloud(x,y,scale=1){for(const [dx,dy,r] of [[-25,6,20],[-8,-8,24],[18,-8,19],[35,6,19]])circle(x+dx*scale,y+dy*scale,r*scale,'#fffdf1e0');oval(x,y+13*scale,57*scale,11*scale,'#fffdf1e0')}
function hero(x,y,s=1,hue='#d75f6a',moving=false){g.save();g.translate(x,y);g.scale(s,s);oval(0,21,22,8,'#213f4350');let bob=moving?Math.sin(tick*.28)*3:Math.sin(tick*.038)*1;g.translate(0,bob);poly([[-14,0],[-30,31],[0,22],[30,31],[14,0]],'#4657a5');rect(-16,0,32,31,hue,9);rect(-17,25,13,11,'#524b7f',4);rect(4,25,13,11,'#524b7f',4);circle(0,-17,22,'#ffddaf');circle(-7,-17,3,'#393d58');circle(8,-17,3,'#393d58');oval(0,-8,5,2,'#b77973');rect(-25,-40,50,14,'#425888',6);rect(-21,-50,42,21,'#5874aa',7);circle(0,-40,7,'#fce99b');circle(-16,-10,6,'#f29e9c60');circle(16,-10,6,'#f29e9c60');g.restore()}
function monster(x,y,r=18,kind=0,hit=0){g.save();g.translate(x,y);oval(0,r*.75,r,6,'#253b4c42');g.translate(0,Math.sin(tick*.08+x)*3);const cs=['#85caac','#f6b2aa','#adacdf','#ffda92'];circle(0,0,r,hit>0?'#fff':cs[kind%4]);circle(-r*.57,-r*.5,r*.5,cs[kind%4]);circle(r*.58,-r*.48,r*.52,cs[kind%4]);circle(-r*.33,0,r*.13,'#37485e');circle(r*.34,0,r*.13,'#37485e');oval(0,r*.35,r*.23,r*.11,'#745a68');circle(-r*.45,r*.24,r*.15,'#ffffff78');circle(r*.48,r*.24,r*.15,'#ffffff78');g.restore()}
function hill(x,y,r,col){oval(x,y,r,r*.55,col)}
function scenery(){g.fillStyle=grad(0,600,'#8ccee9','#c4e6b5');g.fillRect(0,0,W,H);circle(836,63,47,'#ffe9a9');cloud(127+Math.sin(tick*.006)*16,78,1.04);cloud(555-Math.sin(tick*.007)*16,95,.78);hill(100,195,280,'#81bb94');hill(420,206,300,'#6aa797');hill(824,206,280,'#83b88e');rect(0,199,960,401,'#9dd78c');for(let i=0;i<35;i++){const x=i*31.3,y=229+((i*37)%29);oval(x,y,18,5,i%3?'#8dcc80':'#79bf78')}
// Palace on the horizon, visually separate from the playable gates.
rect(444,105,72,102,'#f6e3cb');rect(430,115,22,91,'#fbe9d0');rect(508,114,23,91,'#fbe9d0');poly([[426,115],[441,76],[456,115]],'#b87576');poly([[502,114],[517,75],[533,114]],'#b87576');poly([[449,106],[479,64],[512,106]],'#986f90');rect(465,144,28,63,'#7485a7',12);text('✦',480,115,25,'#fcda85','center');
// Broad sand roads join the four game entrances.
poly([[440,600],[515,600],[526,367],[700,295],[664,265],[488,346],[295,270],[268,297],[438,369]],'#e6cf96');
for(const h of gates){poly([[h.x-22,h.y+22],[h.x+22,h.y+22],[h.x+42,397],[h.x-42,397]],'#e7d6a8');}
for(let i=0;i<150;i++){let x=((i*187+19)%960),y=275+((i*53)%323);if(y<333&&x>80&&x<900)continue;let c=['#fff7d1','#f7afba','#dce9f9','#fff0a1'][i%4];circle(x,y,(i%3)+2,c);if(i%7===0)line(x,y+4,x,y+11,'#589667',2)}
for(const [x,y,s] of [[24,290,1.1],[78,405,1],[903,324,1.1],[912,477,1.2],[45,539,1.14],[275,520,.64],[718,523,.73],[284,329,.55]])leaf(x,y,s);
for(const h of gates)drawHouse(h);
}

// ───────────────── VER.5 WORLD ADVENTURE ─────────────────
// All art and geography below are original procedural Canvas drawings.
const TW=72, MW=60, MH=42, WORLD_W=TW*MW, WORLD_H=TW*MH;
const town={x:save.world?.x??750,y:save.world?.y??955,moving:false,facing:2,target:null,trail:[],stepTime:0};
const worldCam={x:0,y:0};
let worldSeconds=0, worldArea='', atlasOpen=false, talkLines=[], talkWho='', talkIndex=0;
const worldRoutes=[
 [[740,950],[900,800],[1140,900],[1570,990]],
 [[1570,990],[2050,960],[2550,1000],[2950,650]],
 [[2050,960],[2450,1480],[2950,1580],[3110,2310]],
 [[740,950],[820,1370],[980,1770],[1210,2400]],
 [[2450,1480],[3030,1470],[3500,1490]],
 [[740,950],[720,740],[990,710]],
 [[740,950],[1100,930]],
 [[2950,1580],[3130,1960],[3110,2310]],
];
const gates=[
 {id:'survivor',x:1580,y:990,name:'翠環の森',subtitle:'風守りの祭壇',color:'#5bd6a1',icon:'🌿',kind:'grove',mode:'survivor'},
 {id:'platform',x:2960,y:650,name:'天雲の塔',subtitle:'空を跳ぶ試練',color:'#ffcf70',icon:'☁',kind:'tower',mode:'platform'},
 {id:'rpg',x:3110,y:2310,name:'月影の神殿',subtitle:'星の守護者',color:'#c6abff',icon:'✦',kind:'temple',mode:'rpg'},
 {id:'puzzle',x:1210,y:2410,name:'虹晶の遺跡',subtitle:'光の回路',color:'#74d9f0',icon:'◆',kind:'ruins',mode:'puzzle'}
];
const serviceSites=[
 {id:'forge',x:590,y:716,name:'紅炉の鍛冶屋',kind:'forge'},
 {id:'inn',x:969,y:701,name:'旅人の宿',kind:'inn'},
 {id:'library',x:1115,y:881,name:'旅の記録所',kind:'library'},
 {id:'port',x:3500,y:1490,name:'潮鳴りの港',kind:'port'},
 {id:'isleport',x:4080,y:1970,name:'海のほこら',kind:'isleport'},
 {id:'watch',x:2505,y:1500,name:'風見の灯台',kind:'watch'},
 {id:'cave',x:600,y:1990,name:'影石の洞窟',kind:'cave'},
];
const people=[
 {id:'elder',x:840,y:1028,name:'村の地図師リコ',color:'#db9a80',lines:['この世界には、4つの異なる試練があるの。','森・塔・神殿・遺跡を訪ねて、失われた四色の光を取り戻して！','Mキーで地図を開けるよ。迷ったら道しるべをたどってね。']},
 {id:'smith',x:570,y:846,name:'鍛冶職人ドルン',color:'#b0d2f6',lines:['遠くへ行くほど自分の弱さが分かる。','だが、それが鍛える理由だ。工房に立ち寄っていきな。']},
 {id:'scholar',x:1090,y:1014,name:'歴史家ミウ',color:'#dcc7ef',lines:['見える風景だけが世界のすべてじゃない。','海の向こうに古いほこらがあるって話よ。']},
 {id:'ranger',x:1820,y:1100,name:'森番のセナ',color:'#b5e8aa',lines:['森の試練は敵を倒すだけじゃない。','色をためて、一気に吹き飛ばすタイミングを見極めるんだ。']},
 {id:'mountaineer',x:2650,y:975,name:'登山家アオ',color:'#f9d5a0',lines:['山道では、雲の上にそびえる塔が目印だ。','塔の試練は敵の強さより、足場を読む目が大事さ。']},
 {id:'sailor',x:3550,y:1585,name:'船乗りカイ',color:'#8fceeb',lines:['潮鳴りの港から海のほこらまで船を出せるぜ。','波の向こうにはちょっとした宝物が眠ってる。']},
 {id:'sage',x:2890,y:2180,name:'神殿の番人',color:'#d1b2ed',lines:['月の光を宿す神殿で、3つの戦いに挑め。','攻撃に夢中にならず、敵が強く光ったら防御も考えるのだ。']}
];
const chests=[
 {id:'village',x:1220,y:1130,value:110},
 {id:'forest',x:1820,y:740,value:160},
 {id:'ridge',x:2660,y:540,value:210},
 {id:'coast',x:3750,y:1300,value:175},
 {id:'marsh',x:740,y:2260,value:240},
 {id:'temple',x:3220,y:2590,value:280},
 {id:'island',x:4050,y:1860,value:500},
 {id:'river',x:2420,y:1860,value:190}
];
const allSites=[...gates,...serviceSites];
const wh=(x,y)=>{let n=(Math.imul(x+13829,374761393)+Math.imul(y+7147,668265263))|0;n=Math.imul((n^(n>>>13)),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
function segDist(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)}
function roadAt(x,y){for(const path of worldRoutes)for(let i=1;i<path.length;i++)if(segDist(x,y,path[i-1],path[i])<53)return true;return false}
function nearStructure(x,y,r=150){return allSites.some(s=>Math.hypot(s.x-x,s.y-y)<r)||Math.hypot(x-740,y-950)<190}
function islandAt(x,y){return ((x-4100)/230)**2+((y-1980)/235)**2<1}
function classify(x,y){
 const n=wh(Math.floor(x/108),Math.floor(y/108));
 const ocean=x>3790+Math.sin(y*.005)*110||y>2880+Math.sin(x*.004)*56;
 const river=Math.abs(x-(2300+140*Math.sin(y*.0037)))<46 && y>1150&&y<2230;
 const lake=((x-2310)/280)**2+((y-1770)/205)**2<1;
 const water=(ocean||river||lake)&&!islandAt(x,y);
 const paved=roadAt(x,y);
 if(water)return paved?7:8;
 if(paved)return 6;
 if(x>3910&&islandAt(x,y))return 9;
 if(x>3550||y>2820)return 5; // beach
 if((y<570&&x>1520&&x<3510)||(x<500&&y>1440&&y<2780))return n>.24?4:3; // high ridges
 if(y<865&&x>2100&&x<3500)return 4; // upper mountains
 if(x>2850&&y>1970)return 10; // ancient highlands
 if(x>1110&&x<2150&&y>560&&y<1570)return 2; // forest
 if(x<1630&&y>1830)return 11; // mossy wetlands
 if(x>2270&&y>1190)return 3; // amber plain
 if(x>1850&&y<1130)return 1; // upland
 return 0;
}
const worldTiles=new Uint8Array(MW*MH);for(let j=0;j<MH;j++)for(let i=0;i<MW;i++)worldTiles[j*MW+i]=classify((i+.5)*TW,(j+.5)*TW);
function tileAt(px,py){const x=Math.floor(px/TW),y=Math.floor(py/TW);return x<0||y<0||x>=MW||y>=MH?8:worldTiles[y*MW+x]}
function collideWorld(px,py){return px<55||py<55||px>WORLD_W-55||py>WORLD_H-55||[8,4].includes(tileAt(px,py));}
function worldMove(dt){if(dt<=0)return;worldSeconds+=dt;const a=axis();town.moving=!!(a.x||a.y);let dx=a.x,dy=a.y;
 if(!town.moving&&town.target){let tx=town.target.x-town.x,ty=town.target.y-town.y,d=Math.hypot(tx,ty);if(d>15){dx=tx/d;dy=ty/d;town.moving=true;}else town.target=null;}
 if((a.x||a.y)&&town.target)town.target=null;
 if(dx||dy){town.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);const speed=(keyHeld.has('shift')?340:240);let nx=town.x+dx*speed*dt,ny=town.y+dy*speed*dt;
 if(!collideWorld(nx,town.y))town.x=nx;if(!collideWorld(town.x,ny))town.y=ny;
 town.stepTime+=dt;save.world.steps=(save.world.steps||0)+speed*dt*.055;if(town.stepTime>.44){town.stepTime=0;if(wh(Math.floor(town.x/100),Math.floor(town.y/100))>.25&&Math.random()>.3)sparkle(town.x-worldCam.x,town.y-worldCam.y+13,'#ffffc7',2);}
 }
 const zone=worldRegion(town.x,town.y);if(zone!==worldArea){worldArea=zone;announce('✦ '+zone);}
 for(const q of gates){if(Math.hypot(town.x-q.x,town.y-q.y)<235&&!save.world.found.includes(q.id)){save.world.found.push(q.id);announce('新しい冒険先を発見：'+q.name);beep(680,.17,'triangle');persist()}}
 if(worldSeconds%3<dt){save.world.x=Math.round(town.x);save.world.y=Math.round(town.y);persist()}
}
function worldRegion(x,y){
 if(x>3880)return '蒼の外海・海のほこら';
 if(x>3310&&y>1060&&y<2000)return '潮鳴りの海岸';
 if(x>2860&&y>1820)return '月影の高原';
 if(x>2400&&y<1170)return '天雲の連峰';
 if(x<1600&&y>1830)return '虹晶の湿原';
 if(x>1070&&x<2120&&y<1520)return '翠環の森';
 if(x>2120&&y>1200)return '琥珀の平原';
 if(x<1310&&y<1260)return '星灯の村';
 return '旅人の街道';
}
const terrainColors={0:['#82bd78','#87c17e'],1:['#a5c48c','#aaca8e'],2:['#4b966f','#519b74'],3:['#c9bb85','#cbbb88'],4:['#83979d','#879b9f'],5:['#eddaa6','#f0dcb0'],6:['#d9c69e','#ddcba5'],7:['#ac8e65','#b89b76'],8:['#398fb2','#4098b8'],9:['#a4d78b','#a9da91'],10:['#998cb7','#9e90be'],11:['#78b091','#7db799']};
function drawTile(i,j){const x=i*TW,y=j*TW,k=worldTiles[j*MW+i],v=wh(i,j),m=wh(i+100,j+20),col=terrainColors[k];rect(x,y,TW+1,TW+1,col[v>.48?0:1]);
 // Biome seams: gently blend neighboring ground rather than square-edged regions.
 if(k!==6&&k!==7&&k!==8){
  for(const [ox,oy,dir] of [[-1,0,0],[1,0,1],[0,-1,2],[0,1,3]]){
   const nx=i+ox,ny=j+oy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;
   const nk=worldTiles[ny*MW+nx];if(nk===k||nk===6||nk===7||nk===8)continue;
   const base=terrainColors[nk][0],gr=g.createLinearGradient(dir===0?x:dir===1?x+TW:0,dir===2?y:dir===3?y+TW:0,dir===0?x+20:dir===1?x+TW-20:0,dir===2?y+20:dir===3?y+TW-20:0);
   gr.addColorStop(0,base+'90');gr.addColorStop(1,base+'00');rect(x,y,TW,TW,gr);
  }
 }
 if(k===8){rect(x,y,TW,TW*.23,'#8bcce34d');for(let q=0;q<2;q++){let yy=y+13+q*30+Math.sin(tick*.045+i+j)*3;line(x+7+(v*20),yy,x+38+(m*14),yy,'#c4f1ef75',2);line(x+43,yy+9,x+54,yy+9,'#e2fff57f',1.7)}return}
 if(k===7){rect(x+3,y+8,TW-6,7,'#e9cfa1');rect(x+5,y+26,TW-10,7,'#8b684a');rect(x+3,y+44,TW-6,7,'#e9cfa1');rect(x+5,y+62,TW-10,6,'#8b684a');for(let q=0;q<5;q++)circle(x+10+q*13,y+5,1.3,'#543e2d');return}
 if(k===6){for(let q=0;q<4;q++){rect(x+q*17+(q%2)*4,y+5+(q%2)*29,13,23,v>.4?'#b5a37f60':'#e5d9b370',3)}line(x+8,y+64,x+56,y+64,'#806f5645',1);return}
 if(k===4){if(v>.61){poly([[x,y+66],[x+17,y+34],[x+36,y+44],[x+48,y+8],[x+72,y+43],[x+72,y+72],[x,y+72]],'#6d868c');poly([[x+36,y+44],[x+48,y+8],[x+72,y+43]],'#9cadaf');line(x+37,y+26,x+48,y+9,'#e2ebe6b0',2.5);line(x+48,y+9,x+58,y+27,'#e2ebe6b0',2.5)}else{for(let q=0;q<3;q++){let xx=x+12+q*23,yy=y+18+((q*19+v*35)%40);line(xx-12,yy+5,xx+6,yy,'#5d7b8380',3);line(xx+6,yy,xx+12,yy-7,'#ced9d678',2)}}return}
 if(k===10){for(let q=0;q<4;q++){let px=x+10+q*16,py=y+14+((q*19)%42);oval(px,py,9,4,'#c8b4d45c');if((i+j+q)%7===0)star(px,py,3,'#e9d2fb')}return}
 if(k===5){for(let q=0;q<3;q++){let xx=x+9+q*21,yy=y+20+q*17;circle(xx,yy,1.5,'#d6a974');if(q===2&&v>.6)line(xx-5,yy,xx+6,yy+1,'#fff6c6',2)}return}
 for(let q=0;q<5;q++){let px=x+7+wh(i*7+q,j)*57,py=y+9+wh(i,j*7+q)*52;line(px-3,py+3,px,py-2,k===2?'#2a785b88':'#4c976c80',1.5);line(px,py-2,px+4,py+3,k===2?'#2a785b88':'#4c976c80',1.5)}
 if(v>.7&&(k===0||k===1||k===3||k===11)){let xx=x+18+m*30,yy=y+14+wh(i,j+20)*36;circle(xx,yy,3.6,k===3?'#ef9579':v>.86?'#ffc3da':'#fff5bb');circle(xx,yy,1.5,'#fff7e6')}
 if(k===11&&m>.66)oval(x+30,y+45,18,8,'#3b8b9366');
}
function drawWorldTree(x,y,k,s=1){g.save();g.translate(x,y);g.scale(s,s);oval(0,3,31,11,'#1f4e4e48');rect(-7,-52,14,56,k===11?'#55566b':'#72533b',3);line(0,-25,-12,-45,'#77553a',6);
 const main=k===2?'#1f7454':k===11?'#4b8c78':k===3?'#9a9f55':'#3d9568';
 for(const [dx,dy,r] of [[-20,-62,24],[19,-68,27],[0,-91,30],[-6,-79,30]]){circle(dx,dy,r,main);circle(dx-8,dy-10,r*.55,k===2?'#328d64':k===11?'#78b3a2':k===3?'#c6bd6e':'#65ae76');}
 circle(16,-94,6,'#d0e8a776');g.restore()}
function drawWorldPine(x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);oval(0,6,23,8,'#283e4955');rect(-5,-47,10,51,'#75574b',3);for(let k=0;k<3;k++)poly([[-31+k*6,-36-k*21],[0,-105+k*17],[31-k*6,-36-k*21]],k===0?'#275f5a':k===1?'#34766b':'#459484');line(-11,-49,0,-79,'#a4d1ae65',2);g.restore()}
function drawWorldRock(x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);oval(0,5,23,10,'#35506555');poly([[-23,1],[-13,-21],[4,-30],[22,-15],[27,3]],'#566d75');poly([[-13,-21],[4,-30],[8,-6],[-2,1]],'#90a7aa');poly([[4,-30],[22,-15],[27,3],[8,-6]],'#6e828a');line(-10,-14,3,-20,'#d9e1d585',2);g.restore()}
function drawTerrainDeco(i,j){const k=worldTiles[j*MW+i],v=wh(i+17,j+72),x=i*TW+TW*(.2+.5*wh(i+42,j+5)),y=j*TW+TW*(.22+.62*wh(i+5,j+43));if(nearStructure(x,y,145)||k===6||k===7||k===8||k===5)return;
 if(k===2&&(v>.43))drawWorldTree(x,y,2,.7+.3*wh(i,j+22));
 else if(k===11&&v>.75)drawWorldTree(x,y,11,.65);
 else if(k===0&&v>.9)drawWorldTree(x,y,0,.66);
 else if(k===1&&v>.82)drawWorldPine(x,y,.68+.14*v);
 else if((k===4||k===3)&&v>.64)drawWorldRock(x,y,.6+.25*v);
 if(k===10&&v>.86){poly([[x-8,y],[x,y-23],[x+9,y],[x,y+9]],'#d3bde9');line(x,y-20,x,y+5,'#f7e7ff',2)}
}
function drawWorldHouse(s){let x=s.x,y=s.y;let kind=s.kind;g.save();g.translate(x,y);oval(0,20,100,28,'#173b465a');const roof=kind==='forge'?'#9b5b46':kind==='inn'?'#416c94':'#5e6f94';
 rect(-70,-92,140,108,'#c9b998',8);rect(-62,-85,124,93,'#f0e2ba',7);for(let v=-44;v<55;v+=46){rect(v,-56,25,31,'#477f94',4);strokeRect(v,-56,25,31,'#fff5ce',3,4);line(v+13,-55,v+13,-25,'#ebedc9',2)}
 poly([[-87,-91],[0,-163],[87,-91]],roof);poly([[-68,-99],[0,-157],[68,-99]],'#e2b78347');for(let i=0;i<9;i++)line(-62+i*15,-100,-48+i*13,-113,'#e8c3a075',2);
 rect(-26,-58,52,76,'#334d65',12);rect(-18,-49,36,66,'#456a80',10);circle(13,-19,4,'#ffe1a3');rect(-80,-2,160,19,'#a47a5e',5);
 if(kind==='forge'){rect(38,-190,24,68,'#6c6564',4);for(let i=0;i<3;i++)circle(50+Math.sin(tick*.015+i)*7,-193-i*17,11+i*4,'#e8e7dd6c');}
 if(kind==='inn'){rect(-26,-187,52,24,'#fbe3aa',6);text('INN',0,-175,16,'#87543c','center')}
 if(kind==='library'){poly([[-21,-167],[0,-195],[21,-167]],'#f7d889');circle(0,-153,9,'#f0c779')}
 rect(-89,19,178,37,'#233d52',10);strokeRect(-89,19,178,37,'#efdba7',2,10);text(s.name,0,39,18,'#fff0d2','center');g.restore();}
function drawWorldLocation(s){g.save();g.translate(s.x,s.y);let b=Math.sin(tick*.06)*3;oval(0,17,92,28,'#1b384352');if(s.kind==='grove'){
 for(let j=0;j<4;j++){const a=j*TAU/4+Math.PI/4;drawWorldTree(Math.cos(a)*87,Math.sin(a)*58,2,1.0)}
 rect(-58,-14,116,28,'#756957',8);rect(-45,-38,90,38,'#ead2a1',5);line(-45,-38,45,-38,'#ffedb6',4);circle(0,-68+b,40,'#49ba91');circle(0,-68+b,28,'#9ee5c1');star(0,-68+b,19,'#fff3b5');
 } else if(s.kind==='tower'){
 rect(-78,-11,156,31,'#617387',8);rect(-49,-172,98,162,'#dedecf',6);for(let i=0;i<3;i++){rect(-53+i*38,-182,33,24,'#d0dfdf',3);rect(-32+i*29,-119,13,42,'#4a7e95',5)}poly([[-72,-183],[0,-263],[72,-183]],'#7688a9');poly([[-46,-186],[0,-250],[46,-186]],'#a4b4c8');circle(0,-273+b,14,'#fff4bd');rect(-28,-52,56,44,'#445c75',16);
 }else if(s.kind==='temple'){
 rect(-100,-16,200,36,'#66648c',8);for(let i=0;i<5;i++)rect(-95+i*40,-90,25,78,'#e0d6db',6);poly([[-122,-99],[0,-181],[122,-99]],'#74638f');poly([[-87,-109],[0,-171],[87,-109]],'#ab90ad');circle(0,-145+b,25,'#eddbf5');star(0,-145+b,16,'#907bcc');rect(-37,-52,74,49,'#454568',18);
 }else if(s.kind==='ruins'){
 rect(-88,-9,176,29,'#597c76',6);for(let i=-1;i<=1;i++){rect(i*72-14,-113,28,111,'#91b4ae',5);rect(i*72-23,-117,46,13,'#d7dfc8',3)}rect(-91,-132,183,17,'#80a5a4',5);rect(-36,-82,72,75,'#344f67',19);poly([[-27,-76],[0,-119],[27,-76]],'#73d7d3');circle(0,-89+b,18,'#7ddcea');star(0,-89+b,11,'#ffffd5');
 }else if(s.kind==='cave'){
 poly([[-93,6],[-81,-80],[-46,-150],[16,-179],[76,-127],[105,-30],[99,14]],'#677e83');poly([[-76,4],[-55,-95],[-10,-150],[55,-118],[82,11]],'#8d9ca0');oval(0,-40,57,95,'#2c4058');oval(0,-30,40,79,'#1b253d');for(let j=0;j<3;j++)circle(-20+j*23,-97+j*3,7,'#8fd8d3');
 }else if(s.kind==='port'||s.kind==='isleport'){
 rect(-75,-30,150,51,'#a17b56',7);for(let i=-64;i<=64;i+=28)line(i,-25,i,12,'#e1ba87',3);rect(-9,-88,9,76,'#725746');poly([[0,-88],[0,-34],[62,-34]],'#f5eee3');line(-4,-91,2,-90,'#fbe4a2',3);rect(-80,17,160,8,'#6d5c4a',3);
 }else if(s.kind==='watch'){
 rect(-45,-8,90,21,'#677885');rect(-31,-130,62,125,'#f8e9bf',8);rect(-41,-148,82,24,'#7799a7',6);poly([[-50,-149],[0,-191],[50,-149]],'#a76b5e');circle(0,-153+b,13,'#fff4bd');
 }
 if(s.mode){circle(0,-18,23+Math.sin(tick*.06)*3,s.color+'55');circle(0,-18,11,s.color);star(0,-18,8,'#fff8d2');}
 g.restore();}
function drawWorldChest(s){if(save.world.chests.includes(s.id))return;const y=s.y+Math.sin(tick*.047+s.x)*3;g.save();g.translate(s.x,y);oval(0,7,29,11,'#1d3c4a5a');rect(-23,-15,46,28,'#9b5a39',6);rect(-23,-29,46,19,'#c77f4d',7);strokeRect(-21,-30,43,40,'#5d4238',2,5);rect(-5,-18,10,18,'#f9d171',2);circle(0,-18,3,'#fff7c3');g.restore();}
function worldNPC(s){hero(s.x,s.y-15,.62,s.color,true);rect(s.x-37,s.y-82,74,23,'#273e56d9',9);text(s.name.length>8?s.name.slice(0,8):s.name,s.x,s.y-69,11,'#ffecb8','center')}
function drawWorldHero(){g.save();g.translate(town.x,town.y);oval(0,12,22,9,'#112b466b');const bob=town.moving?Math.sin(worldSeconds*19)*3:Math.sin(worldSeconds*3)*1.3;g.translate(0,bob);
 // Decorative cape and clothes, original wandering cartographer character.
 poly([[-11,-17],[-23,12],[0,7],[23,12],[12,-17]],v6CloakColor());rect(-13,-19,26,31,'#356d8c',6);rect(-13,5,10,13,'#493a4e',3);rect(5,5,10,13,'#493a4e',3);circle(0,-27,18,'#f9d8b4');oval(-7,-26,2.3,2.8,'#343344');oval(7,-26,2.3,2.8,'#343344');rect(-21,-49,42,13,'#394d6b',6);rect(-18,-57,36,15,'#415b7c',6);circle(0,-45,5,'#eec779');line(-11,-2,-16,4,'#efc991',5);line(11,-2,16,4,'#efc991',5);
 if(town.moving){line(-12,9,-15,16,'#ffe4bc',2);line(12,10,17,16,'#ffe4bc',2)}g.restore()}
function drawWorldGround(){let startX=Math.max(0,Math.floor(worldCam.x/TW)-1),endX=Math.min(MW-1,Math.floor((worldCam.x+W)/TW)+1),startY=Math.max(0,Math.floor(worldCam.y/TW)-1),endY=Math.min(MH-1,Math.floor((worldCam.y+H)/TW)+1);
 for(let j=startY;j<=endY;j++)for(let i=startX;i<=endX;i++)drawTile(i,j);
 // Decorative riverbank coast and glimmer; small per-frame water animation.
 for(let j=startY;j<=endY;j++)for(let i=startX;i<=endX;i++)if(worldTiles[j*MW+i]===8){let x=i*TW,y=j*TW;for(let [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){let ni=i+dx,nj=j+dy;if(ni>=0&&nj>=0&&ni<MW&&nj<MH&&worldTiles[nj*MW+ni]!==8){line(x+(dx===1?TW:dx===-1?0:0),y+(dy===1?TW:dy===-1?0:0),x+(dx===1?TW:dx===-1?0:TW),y+(dy===1?TW:dy===-1?0:TW),'#d1f5dc9e',4);}}}
 return {startX,endX,startY,endY};}
function drawWorldFeatures(){
 // Hand-placed details are deliberately scenic, not additional game menus.
 const show=(x,y,m=200)=>Math.abs(x-worldCam.x)<W+m&&Math.abs(y-worldCam.y)<H+m;
 if(show(715,1180)){
  oval(714,1205,88,29,'#345e5366');circle(714,1184,72,'#cfcbb5');circle(714,1184,59,'#9ab8b6');circle(714,1184,48,'#3799ad');
  for(let i=0;i<10;i++){const a=i*TAU/10;circle(714+Math.cos(a)*65,1184+Math.sin(a)*65,7,'#e3dcb7')}
  circle(714,1173,16,'#e6d7ad');circle(714,1168+Math.sin(tick*.08)*2,7,'#daf6f4');
  for(let i=0;i<5;i++){let a=i*TAU/5+tick*.009;circle(714+Math.cos(a)*36,1184+Math.sin(a)*27,4,'#b9f0edbc')}
 }
 if(show(420,990)){
  for(let k=0;k<5;k++){rect(345+k*34,902,19,192,'#8d6a4d',5);for(let j=0;j<6;j++){let yy=921+j*29;line(351+k*34,yy+8,358+k*34,yy-4,'#3f8750',2);circle(357+k*34,yy-4,6,j%2?'#f1c57b':'#db8c73')}}
  line(340,899,522,899,'#b49a75',6);line(340,1097,522,1097,'#b49a75',6)
 }
 if(show(1950,1340)){
  oval(1940,1337,78,25,'#344d3c70');for(let i=0;i<7;i++){const ang=i*TAU/7;circle(1940+Math.cos(ang)*33,1333+Math.sin(ang)*15,9,'#666c66')}
  for(let i=0;i<5;i++){let ang=i*TAU/5+tick*.012;poly([[1940,1335],[1933+Math.cos(ang)*12,1325-Math.sin(tick*.05+i)*7],[1940,1306-Math.sin(tick*.05+i)*7],[1947+Math.sin(ang)*9,1325]],i%2?'#ffe6a0':'#ff926d')}
  rect(1984,1297,9,40,'#715541',2);poly([[1990,1296],[2050,1313],[1990,1323]],'#c17e66');text('CAMP',2019,1314,11,'#fff3da','center');
 }
 for(const [x,y,label] of [[1270,906,'森 →'],[2520,1006,'↑ 雲の塔'],[2930,1770,'神殿 ↓'],[1070,1868,'遺跡 ↓']])if(show(x,y)){
  rect(x-6,y-48,12,59,'#765842',3);rect(x-49,y-63,98,32,'#795b43',6);strokeRect(x-49,y-63,98,32,'#debe82',2,6);text(label,x,y-47,14,'#fff2cd','center')
 }
 // Lantern posts in the starter village.
 for(const [x,y] of [[500,1060],[1050,1200],[1035,690]])if(show(x,y)){
  oval(x,y,18,5,'#3e5b4e80');rect(x-5,y-74,10,78,'#584e4c',2);rect(x-16,y-81,32,23,'#394952',5);rect(x-12,y-77,24,16,'#f5d78e',4);g.save();g.globalAlpha=.1+.045*Math.sin(tick*.04);circle(x,y-70,42,'#ffeb9d');g.restore();
 }
}
function drawWorldObjects(area){let items=[];
 for(let j=area.startY-1;j<=area.endY+2;j++)for(let i=area.startX-1;i<=area.endX+1;i++){if(i<0||j<0||i>=MW||j>=MH)continue;let wx=i*TW+TW*(.2+.5*wh(i+42,j+5)),wy=j*TW+TW*(.22+.62*wh(i+5,j+43));if(wh(i+17,j+72)>.36&&![6,7,8,5].includes(worldTiles[j*MW+i]))items.push({y:wy,draw:()=>drawTerrainDeco(i,j)});}
 for(const s of allSites)if(Math.abs(s.x-worldCam.x)<W+220&&Math.abs(s.y-worldCam.y)<H+280)items.push({y:s.y,draw:()=>s.mode||['port','isleport','watch'].includes(s.kind)?drawWorldLocation(s):drawWorldHouse(s)});
 for(const s of people)if(Math.abs(s.x-worldCam.x)<W+130&&Math.abs(s.y-worldCam.y)<H+120)items.push({y:s.y,draw:()=>worldNPC(s)});
 for(const s of chests)if(!save.world.chests.includes(s.id)&&Math.abs(s.x-worldCam.x)<W+100&&Math.abs(s.y-worldCam.y)<H+100)items.push({y:s.y,draw:()=>drawWorldChest(s)});
 items.push({y:town.y,draw:drawWorldHero});items.sort((a,b)=>a.y-b.y);for(const o of items)o.draw();}
function nearestInteract(){let options=[];for(const s of allSites)options.push({...s,d:Math.hypot(town.x-s.x,town.y-s.y)});for(const s of people)options.push({...s,kind:'npc',d:Math.hypot(town.x-s.x,town.y-s.y)});for(const s of chests)if(!save.world.chests.includes(s.id))options.push({...s,kind:'chest',name:'宝箱',d:Math.hypot(town.x-s.x,town.y-s.y)});options.sort((a,b)=>a.d-b.d);return options[0]&&options[0].d<115?options[0]:null}
function setTalk(who,lines){talkWho=who;talkLines=lines;talkIndex=0;scene='dialog';adjustTouch();beep(550,.12,'triangle')}
function nextTalk(){talkIndex++;if(talkIndex>=talkLines.length){navBack()}else beep(510,.05,'triangle')}
function worldInteract(){if(scene==='dialog'){nextTalk();return}if(scene!=='town')return;const near=nearestInteract();if(!near){announce('人や光る場所に近づいて E で調べよう');return}
 if(near.mode){start(near.mode);return}
 if(near.kind==='npc'){if(!save.world.talked.includes(near.id)){save.world.talked.push(near.id);persist()}setTalk(near.name,near.lines);return}
 if(near.kind==='chest'){save.world.chests.push(near.id);save.coins+=near.value;save.earned+=near.value;persist();sparkle(town.x-worldCam.x,town.y-worldCam.y-40,'#ffd778',60);beep(840,.22,'triangle');announce(`宝箱を発見！ 🪙 +${near.value}`);return}
 if(near.kind==='cave'){scene='cave';cavePlayer={x:175,y:460};adjustTouch();announce('影石の洞窟に入った');return}
 if(near.kind==='forge'){scene='forge';infoTimer=0;document.getElementById('notice').classList.remove('show');adjustTouch();return}
 if(near.kind==='library'){scene='journal';infoTimer=0;document.getElementById('notice').classList.remove('show');adjustTouch();return}
 if(near.kind==='inn'){save.world.x=750;save.world.y=955;persist();setTalk('宿屋の主人',['ようこそ星灯亭へ。旅の記録はここに残しておくよ。','休息は無料！ ひと息ついたら、また広い世界へ。']);return}
 if(near.kind==='port'){town.x=4070;town.y=2040;town.target=null;save.world.x=town.x;save.world.y=town.y;persist();announce('⛵ 海を渡り、潮光の小島へ！');flash=.8;chord();return}
 if(near.kind==='isleport'){town.x=3460;town.y=1560;town.target=null;save.world.x=town.x;save.world.y=town.y;persist();announce('⛵ 船で本土に戻った');flash=.8;chord();return}
 if(near.kind==='watch'){setTalk('風見の灯台',['ここからなら、東の海と遠くの山まで見渡せる。','潮鳴りの港まで行けば、海の向こうに渡れるはずだ。']);return}
}

// A compact optional cavern: exploration beyond the four main game modes.
let cavePlayer={x:175,y:460};
const caveStones=[[395,240,60],[590,335,55],[735,435,62],[300,390,39],[700,170,35]];
function caveBlocked(x,y){return x<100||x>865||y<105||y>535||caveStones.some(([a,b,r])=>Math.hypot(a-x,b-y)<r+16)}
function caveAct(){if(Math.hypot(cavePlayer.x-175,cavePlayer.y-460)<85){navBack();announce('洞窟の外に出た');return}
 if(Math.hypot(cavePlayer.x-754,cavePlayer.y-210)<97){if(save.world.caveClaimed){announce('宝箱は空っぽだ');return}save.world.caveClaimed=true;save.coins+=320;save.earned+=320;persist();chord();sparkle(730,210,'#ffe199',55);announce('洞窟の秘宝を発見！ コイン +320');return}announce('光るものや出口に近づこう')}
function drawCave(dt){if(dt>0){const a=axis(),v=220,nx=cavePlayer.x+a.x*v*dt,ny=cavePlayer.y+a.y*v*dt;if(!caveBlocked(nx,cavePlayer.y))cavePlayer.x=nx;if(!caveBlocked(cavePlayer.x,ny))cavePlayer.y=ny}
 g.fillStyle=grad(0,H,'#1c293a','#304258');g.fillRect(0,0,W,H);for(let j=0;j<11;j++)for(let i=0;i<17;i++){let x=i*58,y=j*58,n=wh(i+99,j+72);rect(x+2,y+2,57,57,n>.5?'#495565':'#43505f',3);line(x+9,y+13,x+25,y+17,'#73808749',2);if(n>.7)circle(x+43,y+39,4,'#678e9090')}
 // Overhanging jagged walls with uneven edges.
 for(let i=0;i<17;i++){let x=i*59;poly([[x,0],[x+60,0],[x+49,84+(i*47)%45],[x+30,98+(i*11)%34],[x+4,88+(i*17)%27]],'#243445');poly([[x,600],[x+60,600],[x+53,552-(i*17)%26],[x+21,540-(i*5)%35]],'#263b4b')}
 for(const [x,y,r] of caveStones){oval(x,y+8,r*1.04,r*.4,'#1323357d');poly([[x-r*.9,y+8],[x-r*.52,y-r*.64],[x+r*.12,y-r*.92],[x+r*.94,y-r*.15],[x+r*.81,y+13]],'#7b8990');poly([[x-r*.53,y-r*.63],[x+r*.12,y-r*.92],[x+r*.21,y],[x-r*.2,y+8]],'#a3b2ad');line(x-10,y-r*.63,x+3,y-r*.82,'#d4e1d1a8',3)}
 for(const [x,y] of [[275,198],[812,345],[432,480]]){poly([[x-21,y+10],[x,y-48],[x+19,y+8]],'#a2c6c4');poly([[x-10,y+6],[x,y-40],[x+7,y+6]],'#c5f5e4');g.save();g.globalAlpha=.13+.03*Math.sin(tick*.047);circle(x,y-8,56,'#c6fff0');g.restore()}
 oval(174,472,76,28,'#8d675754');rect(114,428,118,89,'#736e68',12);rect(121,431,104,73,'#263a4a',12);text('出口',174,467,21,'#ebdbc7','center');
 if(!save.world.caveClaimed){oval(749,217,36,15,'#172b3877');rect(719,181,62,44,'#9f6046',7);rect(715,165,69,24,'#ca8b58',7);rect(742,170,14,43,'#ffe095',3);star(749,154+Math.sin(tick*.07)*6,13,'#f8e8b7');}
 hero(cavePlayer.x,cavePlayer.y,.9,'#41798f',!!(axis().x||axis().y));
 rect(16,13,517,64,'#182c3de8',14);strokeRect(16,13,517,64,'#dac48b',2,14);text('影石の洞窟',38,38,23,'#ffe1a3');text('地図の外にも、まだ見ぬ宝物が眠っている',40,63,12,'#dfe8e9');
 let ch=Math.hypot(cavePlayer.x-749,cavePlayer.y-210)<96&&!save.world.caveClaimed,exit=Math.hypot(cavePlayer.x-174,cavePlayer.y-460)<84;
 if(ch||exit){rect(310,497,344,55,'#f1dfba',11);text(ch?'[ E ] 秘宝の箱を開ける':'[ E ] 洞窟を出る',482,525,19,'#405064','center')}
 clickButton(787,18,150,48,'洞窟を出る',()=>{navBack()},{font:15,bg:'#e1d3b6'});
}

function drawWorldHUD(){
 // Top fantasy-style HUD, minimap, and floating action controls.
 rect(16,13,508,72,'#1b3043ec',16);strokeRect(16,13,508,72,'#dbc38b',2,16);rect(23,20,6,58,'#d8b56c',3);text('DOMANDO RUSH',45,36,24,'#ffdf9d');text('V 5.0  •  LUMINOUS ATLAS',47,64,13,'#d5e4dc');
 rect(531,13,225,72,'#1b3043ec',16);strokeRect(531,13,225,72,'#dbc38b',2,16);text('🪙 '+fmt(save.coins),549,36,23,'#fbe3a8');text('✦ 発見 '+save.world.found.length+'/4  • 宝箱 '+save.world.chests.length+'/'+chests.length,549,64,13,'#d9e9d9');
 clickButton(767,14,83,36,'地図 M',()=>{scene='atlas';adjustTouch()},{bg:'#e6d5b4',font:14,radius:9});clickButton(862,14,82,36,volume?'♪ ON':'♪ OFF',()=>{volume=!volume;save.sound=volume;persist()},{bg:'#d4e4dc',font:13,radius:9});
 rect(766,56,178,31,'#1b3043d9',10);text(worldArea,855,71,13,'#fce8c4','center');
 // Corner compass, directional path pointer towards the closest unexplored portal.
 const target=gates.filter(s=>!save.world.found.includes(s.id)).sort((a,b)=>Math.hypot(a.x-town.x,a.y-town.y)-Math.hypot(b.x-town.x,b.y-town.y))[0];
 if(target){const a=Math.atan2(target.y-town.y,target.x-town.x);circle(53,135,36,'#1f3e4bd8');g.save();g.translate(53,135);g.rotate(a+Math.PI/2);poly([[0,-26],[-11,11],[0,4],[11,11]],'#fbe0a4');g.restore();text('N',53,98,11,'#ffecbc','center');}
 const near=nearestInteract();if(near){let label=near.mode?'試練に挑む':near.kind==='chest'?'宝箱を開ける':near.kind==='npc'?'話す':near.kind==='port'||near.kind==='isleport'?'船に乗る':'調べる';rect(292,505,376,50,'#f8ebcb',14);strokeRect(292,505,376,50,'#88745a',3,14);text(`${near.name}   [ E：${label} ]`,480,530,18,'#34465a','center');}
 rect(18,556,524,30,'#20364ad5',8);text('移動 WASD / 矢印   走る Shift   調べる E   地図 M   記録 J',31,571,13,'#e9e6d9');
 rect(743,554,201,33,'#20364ad5',10);text('オートセーブ ●',842,569,13,'#a7e6ce','center');
 // World-scale visible progress strip.
 rect(568,570,135,7,'#2b4950',4);rect(568,570,135*save.world.found.length/4,7,'#f4c66b',4);
}
function drawWorld(dt=0){worldMove(dt);worldCam.x=clamp(town.x-W*.5,0,WORLD_W-W);worldCam.y=clamp(town.y-H*.5,0,WORLD_H-H);
 g.fillStyle='#76b482';g.fillRect(0,0,W,H);g.save();g.translate(-Math.round(worldCam.x),-Math.round(worldCam.y));const a=drawWorldGround();drawWorldFeatures();drawWorldObjects(a);g.restore();v6WorldAtmosphere();
 // Late evening tint rotates over several minutes; never obscures important gameplay.
 let twilight=(Math.sin(worldSeconds/65)+1)/2;if(twilight>.76){rect(0,0,W,H,`rgba(32,51,83,${(twilight-.76)*.31})`)}
 drawWorldHUD();
 if(save.firstVisit){rect(215,120,535,206,'#20364dea',22);strokeRect(215,120,535,206,'#efd3a1',3,22);text('✦ 旅する世界と、4つの本格ゲーム。',482,170,24,'#ffdc9b','center');text('歩けば地図の外まで、山・森・海が広がっている。',482,214,17,'#f2efdf','center');text('Qでゲームを直接選ぶこともできる！',482,246,17,'#dfede7','center');clickButton(353,270,256,44,'▶ 世界を冒険する',()=>{save.firstVisit=false;persist()},{bg:'#f2d38e',font:19});}
}
function drawDialogue(){drawWorld(0);buttons=[];rect(0,0,W,H,'#12233965');rect(77,365,807,195,'#1c3346f3',17);strokeRect(77,365,807,195,'#dfc58d',3,17);text(talkWho,105,396,20,'#ffdf98');text(talkLines[talkIndex]||'',110,463,20,'#fff3d8');text(`${talkIndex+1} / ${talkLines.length}`,799,400,13,'#c8d4d8','right');clickButton(684,506,164,38,talkIndex===talkLines.length-1?'閉じる [ E ]':'次へ [ E ]',nextTalk,{bg:'#f3ddaf',font:14});}
function drawAtlas(){drawWorld(0);buttons=[];rect(0,0,W,H,'#091e36ca');rect(82,42,794,515,'#e9dfc2',19);strokeRect(82,42,794,515,'#9e784b',5,19);
 text('世界地図 — LUMINOUS ATLAS',119,83,27,'#34455a');text('世界の東には海、北には連峰が広がる',120,118,15,'#6b6b62');
 const ax=132,ay=147,mw=698,mh=328,scx=mw/WORLD_W,scy=mh/WORLD_H;
 g.save();g.beginPath();g.roundRect(ax,ay,mw,mh,8);g.clip();for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const k=worldTiles[j*MW+i],col=terrainColors[k][0];rect(ax+i*mw/MW,ay+j*mh/MH,mw/MW+.4,mh/MH+.4,col)}
 for(const s of allSites){const x=ax+s.x*scx,y=ay+s.y*scy;circle(x,y,s.mode?9:6,s.mode?s.color:'#fbe6c2');circle(x,y,2.5,'#243e4c');}
 for(const c of chests)if(save.world.chests.includes(c.id)){circle(ax+c.x*scx,ay+c.y*scy,3,'#ffef87')}
 circle(ax+town.x*scx,ay+town.y*scy,12,'#1939508a');circle(ax+town.x*scx,ay+town.y*scy,6,'#fff');g.restore();
 rect(112,489,733,50,'#fff7e8',10);text('● あなた   ◆ ４つの冒険   • 施設と宝箱   /   M・Escで閉じる',133,514,15,'#4b5863');clickButton(585,66,130,39,'？ 遊び方',()=>{scene='help';adjustTouch()},{bg:'#e3e3c9',font:14});clickButton(730,66,107,39,'閉じる ×',()=>{scene='town';adjustTouch()},{bg:'#f5d8b1',font:15});}
function drawJournal(){drawWorld(0);buttons=[];rect(0,0,W,H,'#10243bcc');panel(123,61,714,474,'📜 冒険の記録  —  星灯の書');text('失われた四色の光を求めて',163,126,23,'#455471');
 const b=['survivor','platform','rpg','puzzle'];gates.forEach((s,i)=>{const y=166+i*68,found=save.world.found.includes(s.id),won=(save.clears[s.id]||0)>0;rect(162,y,634,58,'#fff8e8',12);circle(193,y+28,17,won?'#4caa8e':found?'#c6a35b':'#b9bdc7');text(won?'✓':found?'●':'?',193,y+29,18,'#fff','center');text(s.name,223,y+21,18,'#344d62');text(won?'試練達成':found?'場所を発見':'未発見',223,y+43,12,'#637787')});
 const all=b.every(k=>save.clears[k]>0);if(all&&!save.world.claimedFinal){clickButton(321,462,329,53,'👑 全制覇報酬を受け取る',()=>{save.coins+=800;save.earned+=800;save.world.claimedFinal=true;persist();chord();announce('四色の光が一つになった！ コイン +800')},{bg:'#ffdb85',font:17})}else{ text(all?'👑 4つの試練を踏破！　王国に光が戻った！':'4つの試練を制覇すると特別報酬を獲得',476,479,17,'#556b75','center');}
 clickButton(681,87,121,43,'閉じる',navBack,{font:16,bg:'#f5ddb3'});}

function axis(){let x=(keyHeld.has('arrowright')||keyHeld.has('d')?1:0)-(keyHeld.has('arrowleft')||keyHeld.has('a')?1:0),y=(keyHeld.has('arrowdown')||keyHeld.has('s')?1:0)-(keyHeld.has('arrowup')||keyHeld.has('w')?1:0),d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:0,y:0}}
function startNearest(){worldInteract()}
function drawForge(){drawWorld(0);buttons=[];rect(0,0,W,H,'#1b2c4fb5');panel(151,73,658,467,'⚒ 鍛冶工房 — 冒険の準備');text(`所持コイン   ${fmt(save.coins)} 枚`,185,148,20,'#524562');const defs=[['heart','❤ 勇気のハート','サバイバーの最大HPが増える',90],['boots','☁ 風のブーツ','ジャンプアクションが有利になる',110],['focus','✦ 星の知恵','RPGの初期集中力が増える',95]];defs.forEach(([id,title,desc,base],i)=>{let y=174+i*86,l=save.upgrades[id]||0,price=Math.floor(base*(1+l*.85));rect(178,y,604,73,'#fff7e8',12);text(title,196,y+20,19,'#3b455c');text(`${desc}　Lv.${l}/4`,196,y+51,14,'#67718b');clickButton(644,y+16,121,40,l>=4?'MAX':`🪙 ${price}`,()=>{if(l>=4)return;if(save.coins<price){announce('コインが足りません');return}save.coins-=price;save.upgrades[id]=l+1;persist();beep(830,.16,'triangle');announce('能力アップ！')},{font:16,bg:l>=4?'#cbd4d7':'#f7cb75'})});clickButton(347,470,266,47,'← 王国へ戻る',navBack,{bg:'#fae0a5'});}
function drawHelp(){drawWorld(0);buttons=[];rect(0,0,W,H,'#1b2c4fb5');panel(130,76,700,452,'✦ 冒険のしおり');const rows=[['🗺 世界を冒険する','WASD/矢印：歩く　E：調べる　Q：ゲーム選択　M：地図'],['🌿 森と塔の試練','森：ビルドと虹嵐　塔：チェックポイントと空中ダッシュ'],['✦ 神殿と光の遺跡','神殿：敵の行動を予測　遺跡：8つの回路を解く'],['⛵ 港・洞窟・宝箱','港から船で渡り、洞窟の秘宝や道中の宝箱を探そう']];rows.forEach((z,i)=>{text(z[0],165,168+i*72,20,'#39445d');text(z[1],165,198+i*72,15,'#616a77')});clickButton(339,463,283,48,'← 王国へ戻る',navBack,{bg:'#fae0a5'});}
// ───────────────── 01: PRISM GROVE — survival action ─────────────────
function initSurvivor(){game={p:{x:850,y:650,r:22,hp:105+22*(save.upgrades.heart||0),max:105+22*(save.upgrades.heart||0),inv:0,dash:0,cool:0},seconds:0,score:0,kills:0,lvl:1,xp:0,xpGoal:9,fire:0,spawn:0,enemies:[],shots:[],drops:[],power:1,rate:1,spread:1,ink:0,blast:0,choice:false,choices:[],boss:false,bossSpawned:false};camera=0;}
function spawnEnemy(){const s=game,a=Math.random()*TAU,dist=610;let x=clamp(s.p.x+Math.cos(a)*dist,35,1670),y=clamp(s.p.y+Math.sin(a)*dist,35,1250);const kind=s.seconds>35?irnd(0,3):irnd(0,1),r=[18,16,21,24][kind];s.enemies.push({x,y,r,kind,hp:kind===3?65:kind===2?38:kind===1?20:32,max:kind===3?65:kind===2?38:kind===1?20:32,v:kind===1?126:kind===2?76:91,hit:0});}
const buffs=[['power','✦ 光のちから','威力 +30%'],['rate','💫 はやうち','連射 +22%'],['spread','🌟 星のわ','弾が1発増える'],['heart','❤ ぬくもり','HPを30回復'],['speed','☁ 風の足','移動速度 +10%']];
function survivorUpgrade(index){if(!game||!game.choice)return;let b=game.choices[index];if(!b)return;if(b[0]==='power')game.power*=1.3;if(b[0]==='rate')game.rate*=1.22;if(b[0]==='spread')game.spread=Math.min(5,game.spread+1);if(b[0]==='heart')game.p.hp=Math.min(game.p.max,game.p.hp+30);if(b[0]==='speed')game.speed=(game.speed||1)*1.1;game.choice=false;beep(820,.15,'triangle');announce(b[1]+'！')}
function survivorShot(){let s=game,p=s.p;if(!s.enemies.length)return;let close=s.enemies.filter(e=>e.hp>0).sort((a,b)=>((a.x-p.x)**2+(a.y-p.y)**2)-((b.x-p.x)**2+(b.y-p.y)**2))[0];if(!close)return;let a=Math.atan2(close.y-p.y,close.x-p.x);for(let i=0;i<s.spread;i++){let theta=a+(i-(s.spread-1)/2)*.16;s.shots.push({x:p.x,y:p.y,vx:Math.cos(theta)*590,vy:Math.sin(theta)*590,ttl:1.5,r:8,hit:false})}beep(610,.04,'triangle',.009)}
function survivorDash(){if(scene!=='survivor'||paused||game.choice||game.p.cool>0)return;let a=axis();if(!a.x&&!a.y)a.y=-1;game.p.x=clamp(game.p.x+a.x*145,27,1673);game.p.y=clamp(game.p.y+a.y*145,27,1273);game.p.cool=3.3;game.p.inv=.45;game.ink=Math.min(100,game.ink+12);sparkle(480,300,'#a3edc5',18);beep(440,.18,'sawtooth',.04)}
function survivorStorm(){const s=game;if(scene!=='survivor'||paused||s.choice||s.ink<100)return;s.ink=0;let n=0;for(const e of s.enemies){if(Math.hypot(e.x-s.p.x,e.y-s.p.y)<380){e.hp-=75*s.power;n++;if(e.hp<=0)s.kills++;}}s.enemies=s.enemies.filter(e=>e.hp>0);s.score+=n*43;flash=.6;shake=9;s.blast=.5;s.p.inv=.6;beep(860,.3,'sawtooth',.065);announce(`🌈 レインボー・ストーム！ ${n}HIT`);}
function stepSurvivor(dt){const s=game,p=s.p;if(s.choice)return;s.seconds+=dt;s.spawn-=dt;s.fire-=dt;p.inv-=dt;p.cool=Math.max(0,p.cool-dt);s.blast=Math.max(0,s.blast-dt);const a=axis();p.x=clamp(p.x+a.x*dt*240*(s.speed||1),23,1677);p.y=clamp(p.y+a.y*dt*240*(s.speed||1),25,1275);if(a.x||a.y)s.ink=Math.min(100,s.ink+dt*10);
if(s.fire<=0){survivorShot();s.fire=.65/s.rate}if(s.spawn<=0){for(let i=0;i<Math.min(4,1+Math.floor(s.seconds/28));i++)if(s.enemies.length<90)spawnEnemy();s.spawn=Math.max(.25,1.03-s.seconds*.008);}
if(s.seconds>67&&!s.bossSpawned){s.boss=true;s.bossSpawned=true;s.enemies.push({x:clamp(p.x+400,50,1650),y:clamp(p.y-280,50,1200),hp:720,max:720,r:65,kind:4,v:52,hit:0});announce('⚠ 森の守り手が現れた！');}
for(let i=s.shots.length-1;i>=0;i--){const b=s.shots[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;let hit=null;for(let j=s.enemies.length-1;j>=0;j--){let e=s.enemies[j];if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=19*s.power;e.hit=.12;hit=e;if(e.hp<=0){s.enemies.splice(j,1);s.kills++;s.score+=e.kind===4?600:35;s.ink=Math.min(100,s.ink+2);sparkle(480+rnd(-150,150),300+rnd(-150,150),'#ffd58e',3);s.drops.push({x:e.x,y:e.y,r:8,value:e.kind===4?15:1});if(e.kind===4){s.boss=false;s.seconds=Math.max(86,s.seconds);announce('👑 森の守り手を撃破！')}}break;}}
if(hit||b.ttl<0)s.shots.splice(i,1)}
for(let i=s.enemies.length-1;i>=0;i--){const e=s.enemies[i],d=Math.hypot(p.x-e.x,p.y-e.y)||1;e.x+=(p.x-e.x)/d*e.v*dt;e.y+=(p.y-e.y)/d*e.v*dt;e.hit-=dt;if(d<p.r+e.r+2&&p.inv<=0){p.hp-=e.kind===4?22:9;p.inv=.75;shake=6;flash=.12;beep(180,.16,'triangle');if(p.hp<=0){winGame(false,s.score,'森で力尽きた！また挑戦しよう');return}}}
for(let i=s.drops.length-1;i>=0;i--){const v=s.drops[i],d=Math.hypot(p.x-v.x,p.y-v.y)||1;if(d<150){v.x+=(p.x-v.x)/d*340*dt;v.y+=(p.y-v.y)/d*340*dt}if(d<30){s.xp+=v.value;s.drops.splice(i,1);beep(730,.025,'sine',.009);if(s.xp>=s.xpGoal){s.xp=0;s.lvl++;s.xpGoal+=5;s.choice=true;s.choices=[...buffs].sort(()=>Math.random()-.5).slice(0,3);announce('レベルアップ！3つから選ぼう');}}}
if(s.seconds>=95){winGame(true,s.score+800,'95秒生き残って森を守った！');return;}}
function drawSurvivor(){const s=game,p=s.p;g.fillStyle=grad(0,H,'#92d9a0','#cfeba8');g.fillRect(0,0,W,H);const cx=clamp(p.x-480,0,740),cy=clamp(p.y-330,0,700);camera=cx;g.save();g.translate(-cx+Math.sin(tick)*shake,-cy+Math.cos(tick*1.5)*shake);rect(0,0,1700,1300,'#ade09b',26);for(let i=0;i<350;i++){const x=(i*137)%1690,y=(i*223)%1290;circle(x,y,i%4+2,['#ffffbc','#f3c2ce','#84c5a4'][i%3])}for(let i=0;i<58;i++){let x=(i*203)%1690,y=(i*117)%1290;if(Math.hypot(x-p.x,y-p.y)<100)continue;leaf(x,y,.65)}for(const d of s.drops){star(d.x,d.y,10,'#ffe181')}
for(const b of s.shots){circle(b.x,b.y,13,'#fff7be88');circle(b.x,b.y,7,'#fffdf6')}
for(const e of s.enemies){if(e.kind===4){circle(e.x,e.y,68,e.hit>0?'#fff':'#a995d5');for(let j=0;j<8;j++)circle(e.x+Math.cos(j*TAU/8)*59,e.y+Math.sin(j*TAU/8)*59,16,'#bbaee8');circle(e.x-22,e.y-8,8,'#4b456c');circle(e.x+23,e.y-8,8,'#4b456c');oval(e.x,e.y+23,18,6,'#675481');rect(e.x-80,e.y-93,160,12,'#fff8dd',4);rect(e.x-78,e.y-91,156*Math.max(0,e.hp/e.max),8,'#e98896',4)}else{monster(e.x,e.y,e.r,e.kind,e.hit)}}
if(s.blast>0){g.globalAlpha=s.blast*1.8;circle(p.x,p.y,350*(1-s.blast),'#fff7b833');g.globalAlpha=1}hero(p.x,p.y,1.1,'#ce6678',true);g.restore();
rect(0,0,W,105,'#1b3f48da');text('🌿 そよかぜの森',22,29,24,'#fce8ac');text(`討伐 ${s.kills}　/　スコア ${fmt(s.score)}　/　LV ${s.lvl}`,22,64,17,'#fffdf4');text(`残り ${Math.ceil(95-s.seconds)} 秒`,618,32,24,'#fff4cc');rect(620,57,290,15,'#233b4d',8);rect(620,57,290*Math.max(0,p.hp/p.max),15,'#78e5aa',8);text('❤',604,65,17,'#fff');rect(17,547,237,32,'#213e4aa9',10);text(`★ EXP ${s.xp}/${s.xpGoal}`,30,563,17,'#fff9cf');rect(280,551,196,23,'#283e5baa',9);rect(281,552,194*s.ink/100,21,'#f6d46f',9);text(`🌈 ${Math.floor(s.ink)}%`,376,563,15,'#fff','center');badge(705,550,232,'Space:ストーム / Shift:ダッシュ','#476782');
if(s.choice){rect(0,0,W,H,'#182c49bd');panel(175,91,610,414,'✨ レベルアップ！');text('好きな能力を1つ選んでパワーアップ',480,179,19,'#596078','center');s.choices.forEach((b,i)=>{clickButton(208,213+i*76,546,59,`${i+1}. ${b[1]}   — ${b[2]}`,()=>survivorUpgrade(i),{bg:['#f7e4b3','#ddf6d5','#f8dbea'][i],font:17})});text('数字キー 1・2・3 でも選べるよ',480,464,15,'#586a7a','center');}
}
// ───────────────── 02: CLOUD HOP — scrolling platform game ───────────
const solids=[
 {x:0,y:510,w:670,h:130},{x:770,y:510,w:690,h:130},{x:1570,y:510,w:680,h:130},{x:2370,y:510,w:1050,h:130},
 {x:260,y:423,w:130,h:22},{x:570,y:397,w:130,h:23},{x:790,y:411,w:105,h:22},{x:1030,y:383,w:190,h:24},
 {x:1300,y:408,w:140,h:22},{x:1520,y:405,w:145,h:23},{x:1760,y:367,w:155,h:24},{x:1990,y:413,w:150,h:22},
 {x:2240,y:427,w:110,h:23},{x:2460,y:390,w:140,h:22},{x:2710,y:358,w:140,h:23},{x:2940,y:413,w:140,h:22}
];
const jewelPoints=[[255,386],[366,386],[612,351],[846,366],[1090,332],[1380,366],[1608,361],[1840,325],[2110,370],[2300,380],[2500,348],[2780,313],[3035,371],[3180,460]];
function initPlatform(){game={p:{x:72,y:455,vx:0,vy:0,w:27,h:45,ground:false,jumps:0,dash:0,dashCd:0,inv:0,face:1},seconds:0,stars:0,hp:3,respawn:75,score:0,collect:jewelPoints.map(([x,y])=>({x,y,got:false})),enemies:[{x:478,y:487},{x:1240,y:487},{x:2080,y:487},{x:2560,y:487},{x:2970,y:487}],checkpoints:[965,1800,2620],lastCheckpoint:0};camera=0;}
function platformJump(){if(scene!=='platform'||paused)return;let p=game.p;if(p.ground||p.jumps<(save.upgrades.boots>0?2:1)){p.vy=-525;p.ground=false;p.jumps++;beep(530,.15,'triangle');sparkle(clamp(p.x-camera,20,940),p.y+20,'#fff1ad',8)}}
function platformDash(){if(scene!=='platform'||paused||game.p.dashCd>0)return;let p=game.p;p.dash=.20;p.dashCd=1.5;p.inv=.38;beep(420,.12,'sawtooth');}
function platformHit(){const s=game,p=s.p;if(p.inv>0)return;s.hp--;p.inv=1.1;shake=7;beep(190,.15,'triangle');if(s.hp<=0){winGame(false,s.score,'星を集めながらコースを進もう！');return;}p.x=s.respawn;p.y=450;p.vy=0;p.vx=0;announce('チェックポイントから再開！')}
function stepPlatform(dt){const s=game,p=s.p;s.seconds+=dt;p.inv=Math.max(0,p.inv-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.dash=Math.max(0,p.dash-dt);
let ax=axis().x;p.face=ax>0?1:ax<0?-1:p.face;p.vx=ax*(p.dash>0?760:286);p.x=clamp(p.x+p.vx*dt,p.w/2,3370);let before=p.y+p.h;p.vy=Math.min(780,p.vy+1300*dt);p.y+=p.vy*dt;p.ground=false;
for(const a of solids){let left=p.x+p.w/2>a.x&&p.x-p.w/2<a.x+a.w;if(left&&p.vy>=0&&before<=a.y+12&&p.y+p.h>=a.y){p.y=a.y-p.h;p.vy=0;p.ground=true;p.jumps=0}}
for(const b of s.collect){if(!b.got&&Math.hypot(p.x-b.x,p.y+20-b.y)<30){b.got=true;s.stars++;s.score+=115;beep(860,.09,'triangle');sparkle(b.x-camera,b.y,'#ffe48b',10)}}
for(const e of s.enemies){if(Math.hypot(p.x-e.x,p.y+24-e.y)<33){platformHit();if(scene==='results')return;break}}
for(let i=0;i<s.checkpoints.length;i++)if(p.x>s.checkpoints[i]&&s.lastCheckpoint<i+1){s.lastCheckpoint=i+1;s.respawn=s.checkpoints[i]+35;announce(`旗のチェックポイント ${i+1} を通過！`);beep(670,.2,'triangle')}
if(p.y>660){platformHit();if(scene==='results')return;}
if(p.x>=3255){winGame(true,s.score+Math.max(0,1200-Math.floor(s.seconds*5)),'空跳びの塔を突破！');return;}camera=clamp(p.x-360,0,2410);}
function drawPlatform(){const s=game,p=s.p,cx=camera;g.fillStyle=grad(0,H,'#78c5e8','#e3f5dc');g.fillRect(0,0,W,H);circle(812,120,61,'#fff1bd');for(let i=0;i<9;i++){let x=(i*255-cx*.20)%1250;if(x<0)x+=1250;cloud(x,120+i%3*43,.8)}for(let i=0;i<11;i++){let x=(i*350-cx*.35)%1400;if(x<0)x+=1400;hill(x,510,240,i%2?'#75c7a3':'#99d5ac')}
rect(0,527,W,73,'#6badd0');for(let i=0;i<25;i++){let x=(i*79+tick*.7)%1020-50;oval(x,565+i%3*13,35,6,'#c5effcd5')}
g.save();g.translate(-cx,0);for(const a of solids){rect(a.x,a.y+10,a.w,a.h,'#7f9c6c',9);rect(a.x,a.y,a.w,23,'#75bd78',9);rect(a.x,a.y,a.w,9,'#cdf3a6',8);for(let i=0;i<a.w;i+=55){circle(a.x+i+17,a.y+7,3,'#f4fa9f')}}for(const x of s.checkpoints){line(x,405,x,511,'#f3f7d2',6);poly([[x,404],[x+56,425],[x,443]],'#ed8d8f');text('✓',x+15,426,20,'#fff')}
for(const v of s.collect)if(!v.got){star(v.x,v.y+Math.sin(tick*.07+v.x)*5,13,'#fbd472')}
for(const e of s.enemies){monster(e.x,e.y,18,2,0)}
rect(3275,396,40,115,'#e3c1b9',7);poly([[3255,406],[3295,341],[3335,406]],'#ba9ada');rect(3288,401,16,80,'#79698f',7);text('GOAL',3295,326,19,'#684e7a','center');hero(p.x,p.y+33,1,'#ff8f6d',Math.abs(p.vx)>0);g.restore();
rect(0,0,W,88,'#253d59e8');text('☁ 空跳びの塔',20,30,25,'#ffdf94');text(`⭐ ${s.stars}/${s.collect.length}　❤ ${s.hp}　⌛ ${Math.floor(s.seconds)}秒`,20,67,18,'#fffdf2');badge(600,22,230,'← → 移動 / A ジャンプ','#406781');rect(96,102,768,16,'#4557749e',8);rect(97,103,766*(p.x/3300),14,'#ffe58c',8);text(`${Math.floor(p.x/3300*100)}%`,870,110,16,'#2d475d');text('B / Shift：空中ダッシュ',480,564,17,'#234561','center');}
// ───────────────── 03: MOON TEMPLE — command RPG ─────────────────────
const encounters=[{name:'苔の精霊 モコ',kind:0,hp:65,atk:11,sky:['#b5dfb8','#e2efd1'],line:'森の声を聴いてほしい……'},
 {name:'星守り フウラ',kind:1,hp:94,atk:14,sky:['#aab5e1','#e7daee'],line:'君の勇気を確かめよう！'},
 {name:'月光王 ルミオ',kind:2,hp:155,atk:20,sky:['#6d7bb8','#e3baca'],line:'この神殿の光を取り戻せるか？'}];
function initRPG(){const max=105+15*(save.upgrades.heart||0);game={wave:0,hp:max,max,energy:2+Math.min(3,save.upgrades.focus||0),turn:0,guard:false,enemyHp:encounters[0].hp,enemyMax:encounters[0].hp,history:['神殿の扉が開いた！'],score:0,between:false,heals:0,damage:0};}
function combatMessage(s){game.history.unshift(s);game.history=game.history.slice(0,3)}
function rpgMove(index){if(scene!=='rpg'||paused||game.between)return;let s=game,f=encounters[s.wave],value=0;if(index===0){value=irnd(16,23);s.energy=Math.min(5,s.energy+1);combatMessage(`⭐ ひかりの一撃！ ${value} ダメージ`);beep(550,.11,'triangle')}
else if(index===1){if(s.energy<2){announce('集中力が2必要！');return}s.energy-=2;value=irnd(31,44);combatMessage(`✨ プリズム魔法！ ${value} ダメージ`);beep(790,.24,'triangle');flash=.28;}
else if(index===2){if(s.energy<2){announce('集中力が2必要！');return}s.energy-=2;let heal=irnd(28,36);s.hp=Math.min(s.max,s.hp+heal);combatMessage(`💚 いやしの風で HP +${heal}`);beep(640,.21,'sine');}
else if(index===3){s.guard=true;s.energy=Math.min(5,s.energy+2);combatMessage('🛡️ 心を落ち着けて集中力が2回復');beep(350,.18,'triangle');}
s.enemyHp=Math.max(0,s.enemyHp-value);s.score+=value*12;s.damage+=value;s.turn++;
if(s.enemyHp<=0){s.score+=300+80*s.wave;combatMessage(`${f.name}が光へ帰った！`);s.between=true;chord();sparkle(660,245,'#ffec97',55);return;}
// Telegraphed enemy behavior: guarding is especially valuable every third turn.
let big=(s.turn%3===0),damage=big?f.atk+9:f.atk-2;if(s.guard)damage=Math.ceil(damage*.2);s.hp=Math.max(0,s.hp-damage);combatMessage(`${f.name}の魔力！ HP −${damage}${big?'（強い波）':''}`);s.guard=false;shake=big?5:2;if(s.turn%4===0){s.hp=Math.min(s.max,s.hp+6);combatMessage('仲間のミオが応援！ HP +6');}if(s.hp<=0)winGame(false,s.score,'作戦を変えれば勝てる！ 守るタイミングに注目。');}
function nextRPG(){const s=game;if(!s?.between)return;if(s.wave===2){winGame(true,s.score+1500,'月影の神殿の物語をクリア！');return}s.wave++;const f=encounters[s.wave];s.enemyHp=f.hp;s.enemyMax=f.hp;s.between=false;s.hp=Math.min(s.max,s.hp+22);s.energy=Math.min(5,s.energy+1);s.turn=0;combatMessage(f.line);announce(`第${s.wave+1}章へ！ HPが少し回復`);}
function drawRPG(){const s=game,f=encounters[s.wave];g.fillStyle=grad(0,600,...f.sky);g.fillRect(0,0,W,H);circle(771,89,64,'#ffedc7a8');for(let i=0;i<9;i++){let x=i*145+12,h=100+(i*31)%110;rect(x,270-h,25,h+104,'#fff9ee5a',8);rect(x-14,275-h,54,18,'#fff9ee8a',4)}poly([[0,335],[250,270],[520,300],[700,245],[960,325],[960,600],[0,600]],'#7f92aab5');rect(0,361,W,239,'#dfcfc6');for(let i=0;i<14;i++){line(i*91,367,i*64,600,'#c5abb5',2)}for(let i=0;i<5;i++)line(0,385+i*48,W,385+i*48,'#bca8b5',3);
// Large, friendly fantasy adversary sprite.
circle(678,286,88,'#ffffff38');oval(678,373,106,23,'#30364e4e');monster(678,260,f.kind===2?76:61,f.kind===0?0:f.kind===1?2:3,0);if(f.kind===2){star(677,184,20,'#ffe4a8');circle(677,266,14,'#f0bca4');}
hero(244,359,1.65,'#c76477');hero(121,371,1.12,'#6cb5a8');text('仲間 ミオ',119,289,14,'#324255','center');
rect(0,0,W,93,'#283855ef');text(`✦ 月影の神殿 — 第${s.wave+1}章`,23,32,25,'#ffe3a4');text(f.name,31,68,18,'#e7e3fa');rect(448,24,355,22,'#fff5e0',9);rect(453,29,345*Math.max(0,s.enemyHp/s.enemyMax),12,'#da8097',7);text(`${s.enemyHp}/${s.enemyMax}`,825,72,17,'#f8f0da');
// Lower panel: this is a real turn-by-turn command battle, not auto-combat.
panel(18,419,923,164,'', '#273f5b');text(`❤ ${s.hp}/${s.max}`,41,445,20,'#ffe6da');text(`✦ 集中 ${s.energy}/5`,227,445,19,'#ffe3aa');text(`ROUND ${s.turn+1}`,427,445,17,'#bad4e6');text(s.history[0]||'攻撃方法を選ぼう！',39,475,17,'#fff4d6');if(s.history[1])text(s.history[1],39,499,13,'#bacee4');
if(s.between){rect(0,0,W,H,'#1b355c77');panel(187,135,585,276,'✨ 章クリア！');text(`${f.name}との冒険が終わった`,478,230,23,'#55617b','center');text(`次は ${s.wave===2?'王国へ報告！':encounters[s.wave+1].name}`,478,272,18,'#5d6282','center');clickButton(330,318,300,62,s.wave===2?'👑 物語を終える':'▶ 次の章へ進む',nextRPG,{bg:'#ffdda1',font:20});}
else {const choices=[['1. ⭐ ひかり',0],['2. ✨ 魔法 (2)',1],['3. 💚 回復 (2)',2],['4. 🛡️ まもる',3]];choices.forEach(([label,i],j)=>{clickButton(545+(j%2)*194,437+Math.floor(j/2)*65,181,51,label,()=>rpgMove(i),{font:16,bg:j===1?'#e6dafa':j===2?'#d2efde':j===3?'#dce8fa':'#f6e8c6'})});}
}
// ───────────────── 04: PRISM LAB — route-rotation logic puzzle ───────
const routes=[
[[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2]],
[[0,2],[1,2],[1,1],[2,1],[3,1],[3,2],[4,2],[5,2],[6,2]],
[[0,2],[0,1],[1,1],[1,0],[2,0],[3,0],[3,1],[4,1],[4,2],[5,2],[6,2]],
[[0,2],[1,2],[1,3],[2,3],[3,3],[3,2],[3,1],[4,1],[5,1],[5,2],[6,2]],
[[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[4,2],[4,1],[5,1],[6,1],[6,2]],
[[0,2],[1,2],[1,1],[2,1],[2,0],[3,0],[4,0],[4,1],[4,2],[5,2],[5,3],[6,3],[6,2]]];
const directions=[[0,-1],[1,0],[0,1],[-1,0]];
function dir(a,b){let x=b[0]-a[0],y=b[1]-a[1];return x===1?1:x===-1?3:y===1?2:0}
function buildPuzzle(n){const path=routes[n],grid=[];for(let y=0;y<5;y++)for(let x=0;x<7;x++)grid.push({x,y,ports:Math.random()<.5?[0,2]:[0,1],rot:irnd(0,3),path:false,gem:false});
for(let i=0;i<path.length;i++){let [x,y]=path[i],t=grid[y*7+x],ports=[];if(i>0)ports.push(dir(path[i],path[i-1]));if(i<path.length-1)ports.push(dir(path[i],path[i+1]));t.ports=ports;t.rot=(i===0||i===path.length-1)?0:irnd(1,3);t.path=true;t.gem=(i===Math.floor(path.length/3)||i===Math.floor(path.length*2/3));}return grid;}
function initPuzzle(){game={stage:0,grid:buildPuzzle(0),rotations:0,totalRotations:0,score:0,charged:new Set(),complete:false,undo:[],hints:0};updateCircuit();}
function actualPorts(t){return t.ports.map(p=>(p+t.rot)%4)}
function updateCircuit(){if(!game)return;const g0=game,queue=[14],on=new Set([14]);while(queue.length){let idx=queue.shift(),v=g0.grid[idx],ports=actualPorts(v);for(const d of ports){const xx=v.x+directions[d][0],yy=v.y+directions[d][1],other=yy*7+xx;if(xx<0||xx>=7||yy<0||yy>=5||on.has(other))continue;if(actualPorts(g0.grid[other]).includes((d+2)%4)){on.add(other);queue.push(other)}}}g0.charged=on;const gems=g0.grid.map((v,i)=>v.gem?i:-1).filter(i=>i>=0);g0.complete=on.has(20)&&gems.every(i=>on.has(i));}
function puzzleTurn(i){const s=game;if(scene!=='puzzle'||s.complete||i<0||i>=35)return;let t=s.grid[i];if((t.x===0&&t.y===2)||(t.x===6&&t.y===2))return;s.undo.push(i);t.rot=(t.rot+1)%4;s.rotations++;s.totalRotations++;updateCircuit();beep(470+s.rotations%5*90,.055,'triangle');if(s.complete){s.score+=Math.max(150,500-s.rotations*9);chord();sparkle(480,260,'#ffe790',90);announce('すべての宝石に光が届いた！');}}
function puzzleUndo(){const s=game;if(!s.undo.length||s.complete)return;const i=s.undo.pop(),t=s.grid[i];t.rot=(t.rot+3)%4;s.rotations=Math.max(0,s.rotations-1);updateCircuit();beep(330,.07)}
function puzzleHint(){const s=game;if(s.complete)return;const t=s.grid.find(t=>t.path&&t.rot!==0&&!((t.x===0&&t.y===2)||(t.x===6&&t.y===2)));if(t){s.hints++;announce(`ヒント：${t.x+1}列・${t.y+1}行の回路を確認！`);beep(630,.13,'sine')}else announce('ほかのパネルの接続を確認しよう！')}
function puzzleNext(){const s=game;if(!s.complete)return;if(s.stage>=5){winGame(true,s.score+1500,`6つの回路を解いた！ 回転 ${s.totalRotations} 回`);return;}s.stage++;s.grid=buildPuzzle(s.stage);s.rotations=0;s.undo=[];s.complete=false;updateCircuit();announce(`新しい設計図 ${s.stage+1}/6`)}
function drawPuzzle(){const s=game;g.fillStyle=grad(0,H,'#a3c3c3','#e3e8c8');g.fillRect(0,0,W,H);for(let i=0;i<24;i++){circle((i*189)%940,((i*67)%540)+50,19,'#ffffff26');}
rect(0,0,W,104,'#324b60e8');text('◆ 虹の研究所',24,35,27,'#ffe7aa');text(`設計図 ${s.stage+1}/6　　回転 ${s.rotations}回　　合計スコア ${fmt(s.score)}`,25,76,17,'#f9efcf');badge(716,67,213,countLabel(),'#476781');
// Circuit board
rect(159,123,640,401,'#506882',21);rect(171,135,617,375,'#d1d2c1',16);for(let i=0;i<35;i++){let t=s.grid[i],x=205+t.x*79,y=153+t.y*69,hot=s.charged.has(i);rect(x+3,y+4,68,62,'#3e516866',12);rect(x,y,68,62,hot?'#e8ffdb':'#f8efdf',11);strokeRect(x,y,68,62,hot?'#71b999':'#b5aa9d',3,11);circle(x+34,y+31,23,hot?'#b8e8c1':'#d8dbe0');let ports=actualPorts(t);for(let d of ports){const xx=x+34+directions[d][0]*27,yy=y+31+directions[d][1]*25;line(x+34,y+31,xx,yy,hot?'#329d8c':'#647d9c',12);circle(xx,yy,6,hot?'#ffe99b':'#7a9cbb');}circle(x+34,y+31,10,hot?'#ffe899':'#7aa1b9');if(t.gem)star(x+34,y+31,10,hot?'#ffe26f':'#9293ac');if(t.x===0&&t.y===2){rect(x-12,y+12,18,38,'#ffd18a',8);text('IN',x+34,y+54,11,'#3f536c','center')}if(t.x===6&&t.y===2){rect(x+62,y+12,18,38,'#e0b1e2',8);text('GOAL',x+34,y+54,11,'#3f536c','center')}}
text('パネルを押して回転。光を黄色い宝石2個と出口につなごう！',480,543,17,'#33506a','center');clickButton(25,521,121,51,'↶ 戻す',puzzleUndo,{font:16,bg:'#f5e4c8'});clickButton(808,521,130,51,'？ ヒント',puzzleHint,{font:15,bg:'#f5e4c8'});
if(s.complete){rect(0,0,W,H,'#192e497c');panel(190,151,578,294,'✨ 回路つながった！');text(`設計図 ${s.stage+1}/6 完了！`,479,239,25,'#424a69','center');text(`${s.rotations}回でクリア　+${Math.max(150,500-s.rotations*9)}点`,479,285,20,'#6b677c','center');clickButton(322,341,316,65,s.stage===5?'🎉 研究を完成させる':'▶ 次の設計図へ',puzzleNext,{bg:'#ffdc92',font:19});}}
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
function start(which){if(!V6Descriptions[which])return;infoTimer=0;document.getElementById('notice').classList.remove('show');V6.selected=which;V6.lastMode=which;mode=which;paused=false;V6.ribbons.length=0;particles.length=0;flash=.12;beep(460,.11,'triangle');if(which==='survivor')initSurvivor();else if(which==='platform')initPlatform();else if(which==='rpg')initRPG();else initPuzzle();scene=which;adjustTouch();}
function v6Selection(){scene='selection';paused=false;infoTimer=0;document.getElementById('notice').classList.remove('show');adjustTouch();beep(560,.09,'triangle')}
function v6SelectDifficulty(n){V6.level=clamp(n,0,2);beep(520+n*100,.07,'triangle')}
function v6DrawSelection(){drawWorld(0);buttons=[];rect(0,0,960,600,'#0e2339e0');
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
/* ─────────────────── FREE, SKILL-BASED LONG-TERM GOALS ────────────────── */
const V6Cloaks=[['旅人の赤','#a84c66',0],['蒼海の青','#327da5',170],['翠森の緑','#329675',350],['夕空の紫','#8566ad',520],['暁の黄金','#c18a3e',800]];
save.v6.cloaks=Array.isArray(save.v6.cloaks)?save.v6.cloaks:[0];
save.v6.cloakEquipped=Number.isInteger(save.v6.cloakEquipped)?save.v6.cloakEquipped:0;
function v6CloakColor(){return V6Cloaks[save.v6?.cloakEquipped||0]?.[1]||'#843e53'}
function v6CloakShop(i){const c=V6Cloaks[i];if(!c)return;if(save.v6.cloaks.includes(i)){save.v6.cloakEquipped=i;persist();beep(620,.13,'triangle');announce(`${c[0]}に着替えた`);return;}if(save.coins<c[2]){announce('コインが足りない！');return;}save.coins-=c[2];save.v6.cloaks.push(i);save.v6.cloakEquipped=i;persist();chord();announce(`${c[0]}を手に入れた！`)}
function drawForge(){drawWorld(0);buttons=[];rect(0,0,960,600,'#14273cca');v6Gradient(124,36,712,530,'#f9ead0','#dfe4dc',19);strokeRect(124,36,712,530,'#e5bc86',4,19);
 text('⚒ 星灯の工房 — 旅の準備',161,82,28,'#394b64');text(`所持  ${fmt(save.coins)} コイン`,606,81,20,'#96703f');
 const defs=[['heart','❤ 旅のハート','森のHPを増やす + RPGのHP',90],['boots','☁ 風の足取り','塔の2段ジャンプ解放',110],['focus','✦ 集中の書','RPGの初期集中が増える',95]];
 defs.forEach(([id,title,desc,base],i)=>{let y=121+i*88,l=save.upgrades[id]||0,price=Math.floor(base*(1+l*.85));rect(154,y,653,75,'#fff9e9',12);text(title,180,y+23,19,'#44566b');text(`${desc}  /  Lv.${l}/4`,180,y+52,14,'#6b7687');clickButton(653,y+18,137,42,l>=4?'MAX':`🪙 ${price}`,()=>{if(l>=4)return;if(save.coins<price){announce('コインが足りない！');return;}save.coins-=price;save.upgrades[id]=l+1;persist();chord();announce('能力アップ！')},{bg:l>=4?'#c2d4dc':'#f4d186',font:16})});
 text('🧥 旅人のマント — 見た目をカスタマイズ',160,424,18,'#415873');
 V6Cloaks.forEach((c,i)=>{let x=163+i*131,y=449;rect(x,y,118,45,save.v6.cloakEquipped===i?'#fee9b0':'#fff9ed',10);strokeRect(x,y,118,45,save.v6.cloakEquipped===i?'#c89b52':'#b7b1a6',2,10);circle(x+19,y+22,11,c[1]);text(save.v6.cloaks.includes(i)?c[0].slice(-2)+' ✓':`${fmt(c[2])}枚`,x+32,y+23,13,'#394e5e');buttons.push({x,y,w:118,h:45,action:()=>v6CloakShop(i),label:c[0]})});
 clickButton(321,504,321,44,'◀ ワールドへ戻る',navBack,{bg:'#e6c791',font:18});}
function drawJournal(){drawWorld(0);buttons=[];rect(0,0,960,600,'#16273cd1');v6Gradient(108,51,744,501,'#f6ecd5','#dce3df',21);strokeRect(108,51,744,501,'#e9c393',3,21);
 text('📖 冒険の記録 — 星明かりの書',144,99,25,'#3c5064');const starTotal=Object.values(save.v6.stars).flat().reduce((a,b)=>a+(Number(b)||0),0);
 text(`コイン総獲得 ${fmt(save.earned||0)}   |   宝箱 ${save.world.chests.length}/8   |   ★ ${starTotal}`,145,134,15,'#657281');
 ['survivor','platform','rpg','puzzle'].forEach((k,i)=>{let y=167+i*69;rect(143,y,671,59,'#fffaf0',11);circle(175,y+30,20,['#6fb7a1','#8aaaca','#b59ad0','#dbb274'][i]);text(V6Icons[k],175,y+30,20,'#fff','center');text(V6Names[k],213,y+20,18,'#3b5269');text(`クリア ${save.clears[k]||0}   BEST ${fmt(save.records[k]||0)}`,215,y+45,12,'#708193');let z=v6Records(k);text(['のんびり','冒険','達人'].map((a,j)=>`${a}${z[j]?'★'.repeat(z[j]):'−'}`).join('   '),802,y+30,13,'#95763c','right')});
 const all=['survivor','platform','rpg','puzzle'].every(k=>(save.clears[k]||0)>0);
 if(all&&!save.world.claimedFinal){clickButton(294,465,360,44,'👑 全4モード制覇の報酬を受け取る',()=>{save.world.claimedFinal=true;save.coins+=800;save.earned+=800;persist();chord();announce('4つの挑戦を制覇！ +800コイン')},{bg:'#f8d78a',font:16})}
 else text(all?'👑 4ジャンルすべてクリア済み！':'4ジャンルをすべてクリアすると特別報酬を獲得',480,490,17,'#626e78','center');
 clickButton(341,519,280,32,'◀ 戻る',navBack,{bg:'#e7d2af',font:15});}

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
 v6Gradient(10,9,940,94,'#1d4651ec','#193b4def',14);text('🌿 虹嵐の森',28,34,26,'#ffe5aa');text(`Lv.${s.lvl}    討伐 ${s.kills}    COMBO ${s.combo}    SCORE ${fmt(s.score)}`,31,72,16,'#f8fff2');text(`残り ${Math.max(0,Math.ceil(s.duration-s.seconds))}秒`,746,35,21,'#fff0c6','center');v6Bar(682,63,143,15,p.hp/p.max,'#354657','#72dca6');text(`HP ${Math.ceil(p.hp)}/${p.max}`,756,86,12,'#ebfaec','center');
 v6Gradient(14,532,294,53,'#244d53dd','#183948dd',12);text(`EXP ${s.xp}/${s.xpGoal}`,28,546,14,'#ffedaf');v6Bar(28,565,262,9,s.xp/s.xpGoal,'#334552','#ffcf74');
 v6Gradient(318,532,307,53,'#274d67d9','#233957e0',12);text(s.ink>=100?'Space：レインボーストーム！':`虹ゲージ ${Math.floor(s.ink)}%`,335,551,15,'#fff1c2');v6Bar(336,570,269,9,s.ink/100,'#344c68','#ffe07d');
 v6Gradient(634,532,304,53,'#304363df','#25334de8',12);text(`Shift ダッシュ ${p.cool?'あと'+p.cool.toFixed(1)+'秒':'READY'}`,649,551,16,'#e6f2f6');text(`成長：星の輪 ${s.orbit}　波紋 ${s.pulse}`,648,572,13,'#dce9ef');
 if(s.choice){rect(0,0,960,600,'#10263fc8');v6Gradient(172,103,616,401,'#fbf1d6','#dddbe6',22);strokeRect(172,103,616,401,'#d8ad7d',4,22);text('LEVEL UP!  新しい力を選ぼう',480,152,26,'#324158','center');text('武器の組み合わせが冒険の展開を変える',480,184,15,'#607080','center');s.choices.forEach((b,i)=>{let y=212+i*82;clickButton(205,y,549,65,`${i+1}   ${b[1]}  —  ${b[2]}`,()=>survivorUpgrade(i),{bg:['#ffdfb5','#d4eddf','#eee1f7'][i],font:18})});}}
/* ------------------------ GAME II: PLATFORM -------------------------- */
const P6Floors=[{x:0,y:510,w:570,h:120},{x:660,y:510,w:560,h:120},{x:1330,y:510,w:490,h:120},{x:1920,y:510,w:800,h:120}];
const P6Bridges=[{x:215,y:423,w:133,h:22},{x:510,y:385,w:100,h:22},{x:718,y:407,w:145,h:22},{x:1030,y:370,w:135,h:22},{x:1250,y:421,w:123,h:22},{x:1520,y:381,w:150,h:22},{x:1765,y:400,w:130,h:22},{x:2030,y:378,w:136,h:22},{x:2350,y:363,w:139,h:22}];
function initPlatform(){const t=V6.level;game={kind:'platform',p:{x:78,y:440,vx:0,vy:0,w:30,h:42,ground:false,jumps:0,coyote:.12,buffer:0,dash:0,dashCd:0,inv:0,face:1},stage:t,seconds:0,hp:[5,4,3][t]+Math.min(1,save.upgrades.heart||0),falls:0,score:0,stars:0,collect:[...Array(19)].map((_,i)=>({x:190+i*125+(i%2)*20,y:420-(i%3)*33,got:false})),checkpoints:[715,1500,2180],lastCheckpoint:0,respawn:78,enemies:[{x:427,y:485,dir:1},{x:975,y:485,dir:-1},{x:1710,y:485,dir:1},{x:2420,y:485,dir:-1}],solids:[...P6Floors,...P6Bridges].map(z=>({...z})),finish:2640};
 if(t>=1){game.solids.push({x:1160,y:311,w:97,h:20},{x:1664,y:286,w:114,h:20});game.enemies.push({x:1515,y:485,dir:1});}if(t>=2){game.solids.push({x:370,y:303,w:105,h:20},{x:2240,y:287,w:98,h:20});game.enemies.push({x:2203,y:485,dir:-1});}}
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
 v6Gradient(12,10,938,84,'#233f60ee','#273d52ee',14);text(`☁ 風渡りの塔   STAGE ${s.stage+1}/3`,28,37,24,'#ffe6ad');text(`★ ${s.stars}     SCORE ${fmt(s.score)}     ❤ ${s.hp}`,30,73,17,'#ecf4e7');text('距離',657,31,14,'#fff0d5');v6Bar(704,27,130,12,p.x/s.finish,'#364b5b','#f5c477');text(`TIME ${s.seconds.toFixed(1)}s`,775,75,15,'#fff1d4','center');
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
 v6Gradient(12,12,935,94,'#263d59f5','#203855f2',14);text(`☾ 月影の神殿　第 ${s.wave+1}/3 章`,29,38,25,'#ffe6af');text(f.name,30,75,17,'#e8edf2');v6Bar(531,30,290,18,s.enemyHp/s.enemyMax,'#3e445b','#f2a0b2');text(`HP ${Math.ceil(s.enemyHp)} / ${s.enemyMax}`,690,70,16,'#fff1e4','center');
 const next=R6Intents[s.intent%4];rect(511,124,413,65,'#2d4862e5',12);text(`次の敵行動：${next[1]}`,531,149,20,'#fff2c5');text(`敵の結界 ${s.shield}/${s.shieldMax}  •  BREAKで一時行動不能`,529,173,13,'#dfebee');
 v6Gradient(10,414,942,178,'#1c354df7','#28374cf8',17);text(`❤ ${s.hp}/${s.max}`,30,442,23,'#ffdfd1');text(`✦ 集中 ${s.energy}/5`,250,442,19,'#fae9ae');text(`BREAK連携 ×${s.combo}`,322,528,14,'#b8f4e1');text(s.history[0],30,474,16,'#fff5da');text(s.history[1]||'相手の動きを読んでコマンドを選ぼう',30,500,13,'#cee1eb');
 if(!s.between){[['1 星剣　+1集中',0],['2 魔法　−2集中',1],['3 回復　−2集中',2],['4 防御　+2集中',3]].forEach(([label,n],i)=>clickButton(521+(i%2)*210,432+Math.floor(i/2)*68,200,52,label,()=>rpgMove(n),{bg:['#f6dfb1','#d6d7f8','#bfe5da','#d9e4f4'][i],font:15}));}
 else{rect(0,0,960,600,'#172d49a2');panel(203,156,553,266,s.wave===2?'👑 全章クリア！':'✨ 章クリア！');text(`${f.name}を突破した！`,481,245,21,'#41526c','center');clickButton(322,317,315,64,s.wave===2?'★ 冒険を終える':'▶ 次の章へ',nextRPG,{bg:'#ffe19c',font:20});}}
/* ----------------------------- GAME IV: PUZZLE ----------------------- */
const V6ExtraRoutes=[[[0,2],[0,3],[1,3],[1,4],[2,4],[3,4],[3,3],[4,3],[4,2],[5,2],[5,1],[6,1],[6,2]],[[0,2],[1,2],[1,1],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[4,3],[5,3],[5,2],[6,2]]];
const V6Routes=[...routes,...V6ExtraRoutes];
function buildPuzzle(n){const path=V6Routes[n],grid=[];for(let y=0;y<5;y++)for(let x=0;x<7;x++)grid.push({x,y,ports:Math.random()<.5?[0,2]:[0,1],rot:irnd(0,3),path:false,gem:false});
 for(let i=0;i<path.length;i++){const [x,y]=path[i],t=grid[y*7+x],ports=[];if(i>0)ports.push(dir(path[i],path[i-1]));if(i<path.length-1)ports.push(dir(path[i],path[i+1]));t.ports=ports;t.rot=i===0||i===path.length-1?0:(V6.level===0&&Math.random()<.27?0:irnd(1,3));t.path=true;t.gem=i===Math.floor(path.length/3)||i===Math.floor(path.length*2/3)}return grid;}
function initPuzzle(){game={stage:0,grid:buildPuzzle(0),rotations:0,totalRotations:0,score:0,charged:new Set(),complete:false,undo:[],hints:0,stars:0};updateCircuit()}
function puzzleTurn(i){const s=game;if(scene!=='puzzle'||s.complete||i<0||i>=35)return;const t=s.grid[i];if(t.x===0&&t.y===2||t.x===6&&t.y===2)return;s.undo.push(i);t.rot=(t.rot+1)%4;s.rotations++;s.totalRotations++;updateCircuit();beep(450+(s.rotations%6)*80,.047,'triangle',.014);if(s.complete){const perfect=s.rotations<=V6Routes[s.stage].length*1.85;s.score+=perfect?700:430;s.stars+=perfect?3:2;chord();sparkle(477,295,'#ffe08f',45);announce(perfect?'PERFECT ROUTE! ★★★':'回路完成！ ★★');}}
function puzzleHint(){const s=game;if(s.complete)return;if(V6.level===2){announce('達人モードはヒントなし！');return;}const next=s.grid.find(t=>t.path&&t.rot!==0&&!(t.x===0&&t.y===2)&&!(t.x===6&&t.y===2));if(next){s.hints++;announce(`💡 ヒント：${next.x+1}列 ${next.y+1}行 が正解ルート`);v6Ribbon('HINT',500,102,'#fff5b5');}else announce('残りは線のつながりを確認してみよう！')}
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

// ───────────────── Cross-game state, menus and input ─────────────────
const names={survivor:'そよかぜの森',platform:'空跳びの塔',rpg:'月影の神殿',puzzle:'虹の研究所'};
function drawResult(){drawWorld(0);buttons=[];rect(0,0,W,H,'#192d52b3');panel(165,73,627,466,result.won?'👑 冒険達成！':'✦ 次の挑戦へ');text(`${result.won?'おめでとう！':'ナイスチャレンジ！'}  ${names[result.name]}`,477,167,23,'#4b5773','center');
rect(215,204,527,109,'#fff9e5',13);text(`⭐ スコア   ${fmt(result.score)}`,481,239,28,'#695179','center');text(`🪙 獲得コイン  +${fmt(result.reward)}`,480,284,23,'#ad7a3c','center');text(result.details,479,352,17,'#58667a','center');text(`このモードの最高記録：${fmt(save.records[result.name]||0)}`,479,383,15,'#5d7788','center');
clickButton(199,437,249,62,'🏡 王国へ戻る',navBack,{bg:'#f8e7c9',font:19});clickButton(511,437,244,62,'▶ もう一度',()=>start(result.name),{bg:'#ffda91',font:19});}
function drawPaused(){rect(0,0,W,H,'#1a2d48ad');panel(260,152,441,287,'⏸ 一時停止');text('冒険はいつでも再開できるよ',480,236,21,'#626c83','center');clickButton(315,281,331,59,'▶ 冒険を続ける',()=>paused=false,{bg:'#fbe0a4',font:20});clickButton(315,361,331,51,'🏡 王国へ戻る',navBack,{bg:'#dcecf0'});}
function draw(){g.clearRect(0,0,W,H);buttons=[];g.save();if(shake>0){g.translate(rnd(-shake,shake),rnd(-shake,shake));shake*=.86;}switch(scene){case 'town':drawWorld(paused?0:frameDelta);break;case 'selection':v6DrawSelection();break;case 'atlas':drawAtlas();break;case 'journal':drawJournal();break;case 'dialog':drawDialogue();break;case 'cave':drawCave(paused?0:frameDelta);break;case 'forge':drawForge();break;case 'help':drawHelp();break;case 'survivor':drawSurvivor();break;case 'platform':drawPlatform();break;case 'rpg':drawRPG();break;case 'puzzle':drawPuzzle();break;case 'results':drawResult();break;default:scenery();break}g.restore();if(['survivor','platform','rpg','puzzle'].includes(scene)&&!paused){clickButton(856,9,92,39,'Ⅱ やすむ',()=>paused=true,{bg:'#fff2d1',font:13});}if(paused)drawPaused();particlesDraw();v6DrawRibbons();if(flash>0){g.fillStyle=`rgba(255,255,255,${Math.min(.5,flash)})`;g.fillRect(0,0,W,H);flash=Math.max(0,flash-frameDelta*2)}}
let frameDelta=1/60;
function frame(time){frameDelta=Math.min(.04,Math.max(0,(time-clock)/1000||0));clock=time;tick++;if(infoTimer>0){infoTimer-=frameDelta;if(infoTimer<=0)document.getElementById('notice').classList.remove('show')}if(!paused){v6Ribbons(frameDelta);particlesStep(frameDelta);if(scene==='survivor')stepSurvivor(frameDelta);else if(scene==='platform')stepPlatform(frameDelta);}draw();requestAnimationFrame(frame)}
function handlePress(k){
 if(k==='escape'){
  if(['forge','help','results','atlas','journal','dialog','selection'].includes(scene)){navBack();return}
  if(scene==='cave'){navBack();return}
  if(scene!=='town'){paused=!paused;beep(360,.07);return}
  scene='atlas';adjustTouch();return;
 }
 if(paused){if(k===' '||k==='enter')paused=false;return}
 if(scene==='town'){
  if(k==='q'){v6Selection();return}
  if(save.firstVisit&&(k==='e'||k==='enter'||k===' ')){save.firstVisit=false;persist();return}
  if(k==='m'){scene='atlas';adjustTouch();return}
  if(k==='j'){scene='journal';infoTimer=0;document.getElementById('notice').classList.remove('show');adjustTouch();return}
  if(k==='e'||k==='enter'||k===' '){worldInteract();return}
 }
 if(scene==='selection'){if(['1','2','3','4'].includes(k))V6.selected=['survivor','platform','rpg','puzzle'][Number(k)-1];else if(k==='enter'||k===' ')start(V6.selected);else if(k==='arrowleft')v6SelectDifficulty(V6.level-1);else if(k==='arrowright')v6SelectDifficulty(V6.level+1);return}
  if(scene==='cave'&&(k==='e'||k==='enter'||k===' ')){caveAct();return}
 if(scene==='dialog'&&(k==='e'||k==='enter'||k===' ')){nextTalk();return}
 if(scene==='atlas'&&(k==='m'||k==='enter')){navBack();return}
 if(scene==='journal'&&(k==='j'||k==='enter')){navBack();return}
 if(scene==='forge'||scene==='help'){if(k==='enter'||k===' '||k==='backspace')navBack();return}
 if(scene==='survivor'){if(k===' '||k==='f')survivorStorm();if(k==='shift')survivorDash();if(game?.choice&&['1','2','3'].includes(k))survivorUpgrade(Number(k)-1);return}if(scene==='platform'){if(k===' '||k==='w'||k==='arrowup')platformJump();if(k==='shift')platformDash();return}if(scene==='rpg'&&['1','2','3','4'].includes(k)){rpgMove(Number(k)-1);return}if(scene==='rpg'&&(k==='enter'||k===' ')){if(game.between)nextRPG();return}if(scene==='puzzle'){if(k==='z'||k==='backspace')puzzleUndo();if(k==='h')puzzleHint();if((k==='enter'||k===' ')&&game.complete)puzzleNext();return}if(scene==='results'&&(k==='enter'||k===' '))navBack();}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowdown','arrowup','arrowleft','arrowright',' ','backspace','shift'].includes(k))e.preventDefault();if(e.repeat)return;keyHeld.add(k);handlePress(k)});addEventListener('keyup',e=>keyHeld.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keyHeld.clear();if(['survivor','platform','rpg','puzzle'].includes(scene))paused=true});document.addEventListener('visibilitychange',()=>{if(document.hidden&&['survivor','platform','rpg','puzzle'].includes(scene))paused=true;});
cvs.addEventListener('pointerdown',e=>{e.preventDefault();const b=cvs.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*W,y=(e.clientY-b.top)/b.height*H;if(paused){let bb=buttons.filter(z=>z.y>=281&&z.y<=420&&z.x>=310&&z.x<=650);for(let i=bb.length-1;i>=0;i--){let a=bb[i];if(x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h){a.action();beep(420,.06);return}}return;}
for(let i=buttons.length-1;i>=0;i--){const a=buttons[i];if(x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h){a.action();if(scene!=='rpg'&&scene!=='survivor')beep(440,.055);return}}
if(scene==='cave'){const wx=x,wy=y;if(Math.hypot(wx-749,wy-210)<62&&Math.hypot(cavePlayer.x-749,cavePlayer.y-210)<97){caveAct();return}if(Math.hypot(wx-174,wy-460)<90&&Math.hypot(cavePlayer.x-174,cavePlayer.y-460)<88){caveAct();return}return}
if(scene==='town'){
 if(save.firstVisit)return;
 const wx=x+worldCam.x,wy=y+worldCam.y;
 const nearby=nearestInteract();
 if(nearby&&Math.hypot(nearby.x-wx,nearby.y-wy)<70){worldInteract();return}
 if(!collideWorld(wx,wy)){town.target={x:wx,y:wy};return}
 }
 if(scene==='dialog'){nextTalk();return}
 if(scene==='atlas'||scene==='journal')return;
 if(scene==='puzzle'&&!game.complete){const col=Math.floor((x-205)/79),row=Math.floor((y-153)/69);if(col>=0&&col<7&&row>=0&&row<5&&x<=205+col*79+68&&y<=153+row*69+62){puzzleTurn(row*7+col);return}}});
const touch=document.getElementById('touch');function adjustTouch(){const yes=['town','cave','platform','survivor'].includes(scene);touch.classList.toggle('show',yes);document.getElementById('actA').textContent=scene==='platform'?'ジャンプ':scene==='survivor'?'ストーム':'調べる';document.getElementById('actB').textContent=scene==='platform'?'ダッシュ':scene==='survivor'?'ダッシュ':'走る'}
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keyHeld.add(k);b.classList.add('pressed');handlePress(k)});const release=()=>{keyHeld.delete(k);b.classList.remove('pressed')};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release)});

/* ---------------------- VER.7 VISUAL / UX POLISH ---------------------- */
const V7Names={survivor:'虹嵐バトル',platform:'スカイジャンプ',rpg:'ムーンナイトRPG',puzzle:'キラピカ工房'};
const V7Tag={survivor:'みんなでワイワイ敵をふきとばせ！',platform:'ジャンプとダッシュで空の道を進め！',rpg:'読みあいバトルでボスをやっつけよう！',puzzle:'光をつないで宝石をキラキラ点灯！'};
const V7CardColors={survivor:['#2b9b81','#154b5b'],platform:['#5b91d2','#314f8d'],rpg:['#a170bb','#4a3c72'],puzzle:['#d39d56','#7e574d']};
function v7SoftPanel(x,y,w,h,a,b,r=22){v6Gradient(x,y,w,h,a,b,r);strokeRect(x,y,w,h,'#fff6d4',2,r)}
function v7Glow(x,y,r,c){g.save();const gd=g.createRadialGradient(x,y,2,x,y,r);gd.addColorStop(0,c.replace(')',',0.95)').replace('rgb','rgba'));gd.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gd;g.fillRect(x-r,y-r,r*2,r*2);g.restore()}
function v7MascotFace(x,y,c1,c2,s=1){g.save();g.translate(x,y);g.scale(s,s);oval(0,18,28,8,'#00000024');circle(0,0,24,c1);circle(-8,-5,5,'#fff');circle(8,-5,5,'#fff');circle(-8,-5,2.2,'#2d3342');circle(8,-5,2.2,'#2d3342');oval(0,4,6,4,c2);line(-8,13,-3,18,'#ffffffaa',2);line(8,13,3,18,'#ffffffaa',2);g.restore()}
function v7ModePoster(mode,x,y,w,h,selected){
 const C=V7CardColors[mode]||['#678','#345'];
 g.save();
 v6Gradient(x,y,w,h,C[0],C[1],20);
 g.beginPath();
 roundRectPath(x,y,w,h,20); g.clip();
 for(let i=0;i<7;i++){circle(x+35+i*58,y+24+(i%2)*14,48,'#ffffff0f')}
 if(mode==='survivor'){
   for(let i=0;i<7;i++)drawWorldTree(x+42+i*48,y+h-16,2,0.34+(i%3)*0.04);
   circle(x+w-64,y+34,18,'#ffd773');
   for(let i=0;i<5;i++)monster(x+122+i*34,y+94+(i%2)*11,12+(i%3),i%4,0);
   hero(x+82,y+104,0.82,'#de7b85',true);
   for(let i=0;i<3;i++){star(x+180+i*30,y+56+i*6,8,'#fff6a8');}
 }
 if(mode==='platform'){
   for(let i=0;i<4;i++)cloud(x+45+i*82,y+28+(i%2)*12,.55);
   hill(x+8,y+h+4,122,'#86c0a4'); hill(x+120,y+h+12,142,'#99d0b0'); hill(x+250,y+h+8,152,'#7bb1aa');
   rect(x+56,y+104,122,18,'#7f6a74',9); rect(x+56,y+104,122,7,'#6ec18c',4);
   rect(x+206,y+86,92,18,'#7f6a74',9); rect(x+206,y+86,92,7,'#6ec18c',4);
   hero(x+92,y+84,0.74,'#6c9ed4',true); star(x+246,y+58,13,'#ffe29e');
 }
 if(mode==='rpg'){
   circle(x+w-60,y+40,22,'#f5e2b1');
   rect(x+242,y+42,90,88,'#e1d6de',8); poly([[x+232,y+48],[x+286,y+6],[x+341,y+48]],'#8e6ba6');
   hero(x+76,y+104,0.82,'#c36f8b',true); monster(x+160,y+99,24,3,0);
   rect(x+34,y+118,144,9,'#ffffff40',4); rect(x+34,y+118,100,9,'#f3a0b2',4);
 }
 if(mode==='puzzle'){
   rect(x+48,y+40,296,78,'#f3ecd9',18);
   for(let gy=0;gy<2;gy++)for(let gx=0;gx<4;gx++){
     let px=x+66+gx*62,py=y+54+gy*30; rect(px,py,38,22,'#d8e4e7',7); circle(px+19,py+11,7,(gx+gy)%2?'#8db7bd':'#e5b783');
     line(px+19,py+11,px+19+((gx%2)?10:-10),py+11,'#6a8ba0',5);
   }
   star(x+308,y+79,12,'#ffe080'); star(x+238,y+49,9,'#d2c2f3');
   v7MascotFace(x+86,y+92,'#7fd4dd','#f4d06f',0.55);
 }
 if(selected){strokeRect(x+4,y+4,w-8,h-8,'#ffe39a',4,18)}
 g.restore();
}
function v7HUDGem(x,y,c){circle(x,y,8,c);circle(x,y,3,'#fff8db')}
function drawWorldHUD(){
 rect(10,9,940,86,'#14324ae8',18); strokeRect(10,9,940,86,'#efd7a0',3,18);
 text('DOMANDO RUSH',28,34,28,'#ffe9b0'); text('VER 7.0  •  DREAM ARCADE',31,63,13,'#d6ece7');
 v7HUDGem(227,29,'#81e2cc'); v7HUDGem(247,29,'#ffd977'); v7HUDGem(267,29,'#d2c1ff');
 v6Pill(730,18,157,46,`🪙 ${fmt(save.coins)}`,'#274c61');
 clickButton(510,18,152,43,'ゲームを選ぶ Q',v6Selection,{bg:'#ffe09d',fg:'#384556',font:16,stroke:2});
 clickButton(690,18,102,43,'地図 M',()=>{scene='atlas';adjustTouch()},{bg:'#e5efdf',font:15,stroke:1});
 clickButton(893,18,47,43,volume?'♪':'×',()=>{volume=!volume;save.sound=volume;persist()},{bg:'#d8e3f0',font:18,stroke:1});
 let near=nearestInteract();
 if(near){rect(289,488,384,58,'#f7e7c3',15);strokeRect(289,488,384,58,'#b08f61',2,15);v6ClipText(`${near.icon||'★'}  ${near.name}  •  Eでアクション`,480,520,350,18,'#304b5a','center')}
 rect(16,548,406,36,'#18384eca',12); text('WASD移動   E調べる   Qゲーム   M地図   J記録',31,571,13,'#edf5ef');
 rect(760,548,181,36,'#18384eca',12); v6ClipText(worldArea,850,570,160,14,'#ffe8b2','center');
 const todo=gates.filter(z=>!save.world.found.includes(z.id)).sort((a,b)=>Math.hypot(a.x-town.x,a.y-town.y)-Math.hypot(b.x-town.x,b.y-town.y))[0];
 if(todo){const ang=Math.atan2(todo.y-town.y,todo.x-town.x);circle(62,139,31,'#173e54e0');circle(62,139,18,'#f6d98d');g.save();g.translate(62,139);g.rotate(ang+Math.PI/2);poly([[0,-13],[-10,8],[0,2],[10,8]],'#365671');g.restore();text('NEXT',62,173,11,'#ffe7b7','center')}
}
function v6DrawSelection(){drawWorld(0);buttons=[];rect(0,0,960,600,'#0f2238da');v6Gradient(32,20,896,560,'#213c59','#13263a',28);strokeRect(32,20,896,560,'#efd4a1',3,28);
 text('わくわくゲームセレクト',66,67,30,'#ffe7ad');text('人気ゲームの遊びやすさを参考にした、4つのオリジナル冒険！',67,99,14,'#d2ebe7');
 clickButton(825,43,79,34,'戻る',navBack,{bg:'#ece1cb',font:14});
 const keys=['survivor','platform','rpg','puzzle'];
 keys.forEach((k,i)=>{let x=64+(i%2)*416,y=126+Math.floor(i/2)*177;let s=Math.max(...v6Records(k)); v7ModePoster(k,x,y,390,158,k===V6.selected); text(V7Names[k],x+18,y+27,24,'#fff7dd'); text(V6Categories[k],x+18,y+50,11,'#eef6ee'); text(V7Tag[k],x+18,y+135,14,'#fff6dc'); text(s?'★'.repeat(s)+'☆'.repeat(3-s):'はじめてあそぶ',x+18,y+114,14,'#fff2a2'); });
 keys.forEach((k,i)=>{let x=64+(i%2)*416,y=126+Math.floor(i/2)*177; clickButton(x+248,y+108,122,36,k===V6.selected?'選択中':'このゲーム',()=>{V6.selected=k;beep(460,.08)},{bg:V6.selected===k?'#ffd98c':'#f5e6ca',font:14,stroke:1});});
 v7SoftPanel(61,494,806,60,'#10233cde','#173349de',16); text(`選択中：${V7Names[V6.selected]}　　${V7Tag[V6.selected]}`,82,518,17,'#ffe7a4');
 ['やさしい','ふつう','むずかしい'].forEach((a,i)=>clickButton(86+i*120,534,110,28,a,()=>v6SelectDifficulty(i),{bg:V6.level===i?'#ffd98a':'#d7e7e8',fg:'#24384b',font:13,radius:9,stroke:1}));
 clickButton(602,510,236,38,'▶ このゲームで遊ぶ',()=>start(V6.selected),{bg:'#ffdd91',font:18});
 clickButton(602,551,236,24,'J 記録 / 工房で強化もできる',()=>{scene='journal';adjustTouch()},{bg:'#d9e9ea',font:12});
}
function drawSurvivor(){const s=game,p=s.p,cx=clamp(p.x-480,0,840),cy=clamp(p.y-300,0,700);g.fillStyle='#abd89b';g.fillRect(0,0,960,600); const sky=g.createLinearGradient(0,0,0,600); sky.addColorStop(0,'#a7e2d6'); sky.addColorStop(.7,'#bfe79d'); sky.addColorStop(1,'#98d178'); g.fillStyle=sky; g.fillRect(0,0,960,600);
 g.save();g.translate(-cx,-cy); rect(0,0,1800,1300,'#a5d88f'); for(let i=0;i<42;i++){circle((i*140)%1800,80+(i*73)%1150,4,'#f6efb422')} for(let i=0;i<64;i++){let x=(i*273)%1800,y=(i*177)%1300;if(Math.abs(x-p.x)>90||Math.abs(y-p.y)>90)drawWorldTree(x,y,2,.48+((i%3)*.07))}
 for(let i=0;i<48;i++){let bx=(i*119)%1770,by=120+(i*157)%1120; if(Math.abs(bx-p.x)>120||Math.abs(by-p.y)>120){circle(bx,by,4,i%3===0?'#f9c481':i%3===1?'#fff1a8':'#c7a5ff');line(bx,by,bx,by+12,'#6ca36d',2)}}
 for(const t of s.trail){g.globalAlpha=.2*t.t;circle(t.x,t.y,20,'#fff2aa');}g.globalAlpha=1;
 for(const d of s.drops){circle(d.x,d.y,12,'#ffe99c');star(d.x,d.y,8,'#fff')}
 for(const b of s.shots){circle(b.x,b.y,12,'#fff4b790');circle(b.x,b.y,6,'#fff7ec')}
 for(const e of s.enemies){if(e.kind===4){oval(e.x,e.y+47,62,14,'#304c4b77');circle(e.x,e.y,e.r,e.hit?'#fff5e9':'#b480b7');for(let i=0;i<7;i++){let a=i*TAU/7+tick*.008;circle(e.x+Math.cos(a)*50,e.y+Math.sin(a)*50,13,'#e6b7dc')}circle(e.x-18,e.y-11,8,'#433f65');circle(e.x+20,e.y-11,8,'#433f65');v6Bar(e.x-76,e.y-83,152,10,e.hp/e.max,'#382f59','#ffbad1');}else monster(e.x,e.y,e.r,e.kind,e.hit)}
 for(let i=0;i<s.orbit;i++){let a=s.seconds*2.9+i*TAU/s.orbit,xx=p.x+Math.cos(a)*82,yy=p.y+Math.sin(a)*82;circle(xx,yy,16,'#d7ecff88');star(xx,yy,10,'#fff3ab')}
 if(s.blast>0){g.strokeStyle='#fdf4b8';g.lineWidth=13*s.blast;g.beginPath();g.arc(p.x,p.y,166+s.pulse*22+(1-s.blast)*310,0,TAU);g.stroke()}
 hero(p.x,p.y,1.08,'#df737d',true); g.restore();
 v7SoftPanel(12,10,936,98,'#173f52f0','#17344ce9',16); text('🌿 虹嵐バトル',30,36,28,'#ffe7ad'); text(`Lv.${s.lvl}  討伐 ${s.kills}  COMBO ${s.combo}  SCORE ${fmt(s.score)}`,31,73,16,'#f7fff0'); text(`残り ${Math.max(0,Math.ceil(s.duration-s.seconds))}秒`,786,37,22,'#fff1c7','center'); v6Bar(715,67,165,15,p.hp/p.max,'#354657','#72dca6'); text(`HP ${Math.ceil(p.hp)}/${p.max}`,798,90,12,'#ebfaec','center');
 v7SoftPanel(12,529,297,58,'#234c53e0','#183644e8',14); text(`EXP ${s.xp}/${s.xpGoal}`,28,548,14,'#ffefad'); v6Bar(30,570,262,9,s.xp/s.xpGoal,'#334552','#ffcf74');
 v7SoftPanel(320,529,308,58,'#284c67db','#233957e0',14); text(s.ink>=100?'Space：カラーストーム！':`虹ゲージ ${Math.floor(s.ink)}%`,336,550,15,'#fff1c2'); v6Bar(336,570,274,9,s.ink/100,'#344c68','#ffe07d');
 v7SoftPanel(639,529,298,58,'#304363df','#25334de8',14); text(`Shift ダッシュ ${p.cool?'あと'+p.cool.toFixed(1)+'秒':'READY'}`,652,549,16,'#e6f2f6'); text(`成長：星の輪 ${s.orbit} / 波紋 ${s.pulse}`,651,572,13,'#dce9ef');
 if(s.choice){rect(0,0,960,600,'#10263fc8');v6Gradient(172,103,616,401,'#fbf1d6','#dddbe6',22);strokeRect(172,103,616,401,'#d8ad7d',4,22);text('LEVEL UP!  新しい力を選ぼう',480,152,26,'#324158','center');text('わかりやすい説明つき。好きな強化をえらぼう！',480,184,15,'#607080','center');s.choices.forEach((b,i)=>{let y=212+i*82;clickButton(205,y,549,65,`${i+1}   ${b[1]}  —  ${b[2]}`,()=>survivorUpgrade(i),{bg:['#ffdfb5','#d4eddf','#eee1f7'][i],font:18})});}}
function drawPlatform(){const s=game,p=s.p,cx=camera; const sky=g.createLinearGradient(0,0,0,600); sky.addColorStop(0,['#71bee1','#94a0d8','#edaf96'][s.stage]); sky.addColorStop(.55,'#d7f3ee'); sky.addColorStop(1,'#f7e8c2'); g.fillStyle=sky; g.fillRect(0,0,960,600); circle(830,92,50,'#ffe6a9'); for(let i=0;i<11;i++){let x=((i*231-cx*.2)%1280+1280)%1280;cloud(x-50,88+i%3*36,.82)}
 for(let i=0;i<7;i++){let x=((i*360-cx*.33)%1400+1400)%1400; hill(x,520,290,i%2?'#85bcae':'#a3d0b6');}
 g.save(); g.translate(-cx,0); for(const a of s.solids){rect(a.x,a.y,a.w,a.h,a.h>40?'#8b765d':'#785e68',a.h>40?2:10);rect(a.x,a.y,a.w,12,'#67bc86',4);rect(a.x,a.y+10,a.w,9,'#acd99b',4);if(a.h>40)for(let i=0;i<a.w;i+=34){line(a.x+i+10,a.y+24,a.x+i+14,a.y+38,'#d9b28d74',2)}}
 for(let i=0;i<10;i++){let tx=260+i*265; drawWorldPine(tx,508,.5); if(i%2===0)drawWorldPine(tx+85,506,.4)}
 for(const c of s.collect)if(!c.got){circle(c.x,c.y,24,'#fff1bc55');star(c.x,c.y,14,'#ffe18d')}
 for(const e of s.enemies){monster(e.x,484,19,1,0); if((tick+e.x)%30<15)star(e.x-2,454,5,'#ffd694')}
 for(const x of s.checkpoints){rect(x,444,7,65,'#4b6476',2);poly([[x,439],[x+44,451],[x,464]],s.respawn>=x?'#8af0ca':'#e6bd89')}
 rect(s.finish,390,9,120,'#486070',2); poly([[s.finish+9,390],[s.finish+79,408],[s.finish+9,427]],'#ffda8f'); text('GOAL',s.finish+44,419,13,'#3f5367','center'); hero(p.x,p.y+4,1.0,'#6e9eda',true); g.restore();
 v7SoftPanel(12,10,936,90,'#173f52f0','#17344ce9',16); text('☁ スカイジャンプ',28,36,27,'#ffe7ad'); text(`チェック ${s.lastCheckpoint?1+game.checkpoints.filter(v=>v<=s.lastCheckpoint).length:0}  星 ${s.stars}  ミス ${s.falls}  SCORE ${fmt(s.score)}`,31,72,16,'#f8fff2'); text(`HP ${s.hp}`,778,37,22,'#fff0c6','center'); text(`TIME ${Math.floor(s.seconds)}秒`,883,37,19,'#fff0c6','center');
 v7SoftPanel(22,538,335,42,'#204c5fd7','#1a3649df',12); text('Aボタン/Spaceでジャンプ　B/Shiftでダッシュ',36,563,14,'#eef6ee');
 v7SoftPanel(618,536,320,44,'#294865d7','#1f3448df',12); text(`ゴールまで ${(Math.max(0,s.finish-p.x)/10|0)}m`,638,562,16,'#fff0c0');}
function drawRPG(){const s=game,f=R6Foes[s.wave]; const sky=grad(0,600,'#667099','#213a57'); g.fillStyle=sky; g.fillRect(0,0,960,600); circle(792,94,52,'#ffe8b0aa'); for(let i=0;i<6;i++){rect(80+i*145,180+(i%2)*8,36,220,'#ffffff2a',5); rect(70+i*145,160+(i%2)*8,56,25,'#efe6d666',4);} poly([[0,358],[220,299],[480,336],[727,280],[960,346],[960,600],[0,600]],'#536c8a88'); rect(0,387,960,213,'#e8dace'); for(let i=0;i<12;i++)line(i*102,390,i*91,600,'#bcaeb7',1.4);
 oval(696,373,118,26,'#34465b4d'); circle(690,259,99,'#ffffff57'); monster(689,269,s.wave===2?76:64,f.kind,0); if(s.shield>0){g.strokeStyle='#f5e0ae';g.lineWidth=5;g.beginPath();g.arc(690,267,97,Math.PI*.2,Math.PI*1.93);g.stroke()} hero(238,381,1.6,'#be6680'); hero(124,398,1.05,'#70b0a5');
 v7SoftPanel(12,12,936,95,'#263d59f5','#203855f2',16); text(`☾ ムーンナイトRPG　第 ${s.wave+1}/3 章`,28,39,26,'#ffe7ad'); text(f.name,30,76,17,'#e8edf2'); v6Bar(531,31,290,18,s.enemyHp/s.enemyMax,'#3e445b','#f2a0b2'); text(`HP ${Math.ceil(s.enemyHp)} / ${s.enemyMax}`,690,71,16,'#fff1e4','center');
 rect(508,124,416,67,'#2d4862e5',13); text(`つぎの敵行動：${R6Intents[s.intent%4][1]}`,529,149,20,'#fff2c5'); text(`敵の結界 ${s.shield}/${s.shieldMax}  •  BREAKで動きを止めよう`,528,173,13,'#dfebee');
 v7SoftPanel(10,414,942,178,'#1c354df7','#28374cf8',18); text(`❤ ${s.hp}/${s.max}`,30,442,23,'#ffdfd1'); text(`✦ 集中 ${s.energy}/5`,250,442,19,'#fae9ae'); text(`BREAK連携 ×${s.combo}`,322,528,14,'#b8f4e1'); text(s.history[0],30,474,16,'#fff5da'); text(s.history[1]||'相手の動きを読んでコマンドを選ぼう',30,500,13,'#cee1eb');
 if(!s.between){[['1 星剣　+1集中',0],['2 魔法　−2集中',1],['3 回復　−2集中',2],['4 防御　+2集中',3]].forEach(([label,n],i)=>clickButton(521+(i%2)*210,432+Math.floor(i/2)*68,200,52,label,()=>rpgMove(n),{bg:['#f6dfb1','#d6d7f8','#bfe5da','#d9e4f4'][i],font:15}));}
 else{rect(0,0,960,600,'#172d49a2');panel(203,156,553,266,s.wave===2?'👑 全章クリア！':'✨ 章クリア！');text(`${f.name}を突破した！`,481,245,21,'#41526c','center');clickButton(322,317,315,64,s.wave===2?'★ 冒険を終える':'▶ 次の章へ',nextRPG,{bg:'#ffe19c',font:20});}}
function drawPuzzle(){const s=game;g.fillStyle=grad(0,600,'#90afc5','#efe2bb');g.fillRect(0,0,960,600); for(let i=0;i<22;i++)circle((i*157)%960,80+(i*113)%510,15,'#ffffea22'); rect(0,456,960,144,'#d5b89255');
 v7SoftPanel(13,11,935,96,'#263d58f1','#244d60f1',16); text('◈ キラピカ工房',29,38,26,'#ffe4ae'); text(`設計図 ${s.stage+1}/8   •   回転 ${s.rotations}   •   ★${s.stars}   •   SCORE ${fmt(s.score)}`,31,80,15,'#f5f4e8');
 v7SoftPanel(161,125,636,391,'#4d687d','#3b526f',18); rect(173,137,611,367,'#f3e8d0',14);
 for(let i=0;i<35;i++){const t=s.grid[i],x=205+t.x*79,y=151+t.y*69,hot=s.charged.has(i);v6Gradient(x,y,68,62,hot?'#dbf9df':'#fffbec',hot?'#a9ded0':'#e5ddcd',10);strokeRect(x,y,68,62,hot?'#54ae93':'#b8b3ac',2,10);circle(x+34,y+31,25,hot?'#97dac4':'#cdd4d9');for(const d of actualPorts(t)){const xx=x+34+directions[d][0]*25,yy=y+31+directions[d][1]*24;line(x+34,y+31,xx,yy,hot?'#239b88':'#66879e',12);circle(xx,yy,6,hot?'#fef1b0':'#87a7ba')}circle(x+34,y+31,9,hot?'#ffeeba':'#94b0bc');if(t.gem)star(x+34,y+31,10,hot?'#ffe079':'#afb1d3');if(t.x===0&&t.y===2)v6Pill(x+2,y+47,64,16,'START','#f3c982','#324860');if(t.x===6&&t.y===2)v6Pill(x+2,y+47,64,16,'GOAL','#c5abd9','#243d57')}
 v7MascotFace(92,189,'#7fd4dd','#f4d06f',0.85); v7MascotFace(875,189,'#f5c885','#d18cc3',0.85);
 text('クリックで回転。START → ★2個 → GOAL をつなごう',480,540,16,'#284c61','center');clickButton(15,531,135,48,'↶ 取り消す',puzzleUndo,{bg:'#f8e1b6',font:16});clickButton(811,531,134,48,'💡 ヒント',puzzleHint,{bg:'#f3e2b3',font:15});
 if(s.complete){rect(0,0,960,600,'#192c4c9a');panel(191,137,576,315,'✨ 回路クリア！');text(`設計図 ${s.stage+1}/8 を完成した！`,480,237,25,'#445671','center');text(`今の回転数 ${s.rotations}   獲得評価 ★${s.rotations<=V6Routes[s.stage].length*1.85?3:2}`,480,290,18,'#647285','center');clickButton(326,345,312,62,s.stage===7?'🏆 全設計図を完成！':'▶ 次の設計図へ',puzzleNext,{bg:'#ffe0a0',font:19});}}
function drawResult(){drawWorld(0);buttons=[];rect(0,0,960,600,'#142742cc');v6Gradient(146,58,668,491,'#fdf0d5','#d8e5e7',24);strokeRect(146,58,668,491,'#e5bd87',4,24); text(result.won?'QUEST COMPLETE!':'NICE TRY!',480,119,31,'#375164','center'); text(V7Names[result.name]||V6Names[result.name]||names[result.name],480,159,24,'#646277','center'); text((result.won?'★'.repeat(Math.max(1,result.stars)):'☆')+(result.won?'☆'.repeat(Math.max(0,3-result.stars)):'☆☆'),480,214,35,'#dba550','center'); rect(199,240,559,156,'#ffffffb9',15); text(`スコア  ${fmt(result.score)}`,480,284,28,'#384e64','center'); text(`獲得コイン  +${fmt(result.reward)}`,480,336,22,'#bc8546','center'); v6ClipText(result.details,480,379,516,15,'#637489','center'); text(`BEST ${fmt(save.records[result.name])}  •  難易度 ${['やさしい','ふつう','むずかしい'][result.level]||['のんびり','冒険','達人'][result.level]}`,480,427,16,'#5d6a7b','center'); clickButton(187,458,258,60,'◀ ワールドへ戻る',navBack,{bg:'#d8e5df',font:18}); clickButton(511,458,258,60,'▶ もう一度挑戦',()=>start(result.name),{bg:'#ffdb91',font:19});}
function drawPaused(){rect(0,0,960,600,'#10253bbb');v6Gradient(260,155,442,308,'#fdf0d8','#dbe5de',16);strokeRect(260,155,442,308,'#debd89',3,16);text('Ⅱ PAUSE',480,205,28,'#344e66','center');text('休憩して、またすぐ遊べるよ',480,254,17,'#677283','center');clickButton(310,301,344,57,'▶ ゲームを再開',()=>paused=false,{bg:'#ffe0a4',font:20});clickButton(310,378,344,56,'◀ ワールドへ戻る',navBack,{bg:'#d4e8e7',font:18});}

// Browser-console debug API for automated regression verification.
if(['localhost','127.0.0.1',''].includes(location.hostname))window.DOMANDO_RUSH_DEBUG={start,back:navBack,worldTeleport:(x,y)=>{town.x=clamp(x,50,WORLD_W-50);town.y=clamp(y,50,WORLD_H-50);scene='town';save.firstVisit=false;adjustTouch();},worldExplore:()=>({...town,region:worldArea,chests:save.world.chests,found:save.world.found}),worldTileCodes:()=>[...worldTiles],interact:worldInteract,atlas:()=>{scene='atlas';adjustTouch()},getState:()=>({scene,difficulty:V6.level,paused,coins:save.coins,record:save.records[mode],mode,world:{x:town.x,y:town.y,area:worldArea},game:game?JSON.parse(JSON.stringify({...game,charged:undefined})):null}),puzzleSolve:()=>{if(scene!=='puzzle')start('puzzle');game.grid.forEach(t=>t.rot=0);updateCircuit();},select:()=>v6Selection(),setDifficulty:n=>v6SelectDifficulty(n),finish:()=>{if(game)winGame(true,game.score||1000,'テストクリア')},nextPuzzle:puzzleNext,act:rpgMove,skipPlatform:()=>{if(scene==='platform')game.p.x=3260},skipSurvivor:()=>{if(scene==='survivor')game.seconds=95},setCoins:n=>{save.coins=n;persist();},save:()=>({...save})};
adjustTouch();requestAnimationFrame(frame);
})();
