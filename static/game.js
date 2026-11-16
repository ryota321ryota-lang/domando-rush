/* DOMANDO RUSH: LUMINOUS ATLAS v5.0 — original characters, art and gameplay.
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
let save=readSave(),scene='town',tick=0,clock=performance.now(),mode=null,game=null,paused=false,result=null,shake=0,flash=0,camera=0,particles=[],buttons=[],keyHeld=new Set(),lastInfo='',infoTimer=0,dialogue='王国の4つの門が冒険へつながっています。気になる建物に近づいて E キー！',volume=!!save.sound;
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
 poly([[-11,-17],[-23,12],[0,7],[23,12],[12,-17]],'#843e53');rect(-13,-19,26,31,'#356d8c',6);rect(-13,5,10,13,'#493a4e',3);rect(5,5,10,13,'#493a4e',3);circle(0,-27,18,'#f9d8b4');oval(-7,-26,2.3,2.8,'#343344');oval(7,-26,2.3,2.8,'#343344');rect(-21,-49,42,13,'#394d6b',6);rect(-18,-57,36,15,'#415b7c',6);circle(0,-45,5,'#eec779');line(-11,-2,-16,4,'#efc991',5);line(11,-2,16,4,'#efc991',5);
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
 if(near.kind==='forge'){scene='forge';adjustTouch();return}
 if(near.kind==='library'){scene='journal';adjustTouch();return}
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
 g.fillStyle='#76b482';g.fillRect(0,0,W,H);g.save();g.translate(-Math.round(worldCam.x),-Math.round(worldCam.y));const a=drawWorldGround();drawWorldFeatures();drawWorldObjects(a);g.restore();
 // Late evening tint rotates over several minutes; never obscures important gameplay.
 let twilight=(Math.sin(worldSeconds/65)+1)/2;if(twilight>.76){rect(0,0,W,H,`rgba(32,51,83,${(twilight-.76)*.31})`)}
 drawWorldHUD();
 if(save.firstVisit){rect(215,120,535,206,'#20364dea',22);strokeRect(215,120,535,206,'#efd3a1',3,22);text('✦ ここから、あなただけの冒険が始まる',482,170,24,'#ffdc9b','center');text('歩けば地図の外まで、山・森・海が広がっている。',482,214,17,'#f2efdf','center');text('４つの試練と、隠された宝箱を見つけよう。',482,246,17,'#dfede7','center');clickButton(353,270,256,44,'▶ 冒険を始める',()=>{save.firstVisit=false;persist()},{bg:'#f2d38e',font:19});}
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
function drawHelp(){drawWorld(0);buttons=[];rect(0,0,W,H,'#1b2c4fb5');panel(130,76,700,452,'✦ 冒険のしおり');const rows=[['🗺 世界を冒険する','WASD/矢印：歩く　Shift：走る　E：調べる　M：地図'],['🌿 森と塔の試練','森：自動攻撃と範囲技　塔：ジャンプとダッシュ'],['✦ 神殿と光の遺跡','神殿：コマンド戦闘　遺跡：回路をつなぐ'],['⛵ 港・洞窟・宝箱','港から船で渡り、洞窟の秘宝や道中の宝箱を探そう']];rows.forEach((z,i)=>{text(z[0],165,168+i*72,20,'#39445d');text(z[1],165,198+i*72,15,'#616a77')});clickButton(339,463,283,48,'← 王国へ戻る',navBack,{bg:'#fae0a5'});}
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
// ───────────────── Cross-game state, menus and input ─────────────────
const names={survivor:'そよかぜの森',platform:'空跳びの塔',rpg:'月影の神殿',puzzle:'虹の研究所'};
function drawResult(){drawWorld(0);buttons=[];rect(0,0,W,H,'#192d52b3');panel(165,73,627,466,result.won?'👑 冒険達成！':'✦ 次の挑戦へ');text(`${result.won?'おめでとう！':'ナイスチャレンジ！'}  ${names[result.name]}`,477,167,23,'#4b5773','center');
rect(215,204,527,109,'#fff9e5',13);text(`⭐ スコア   ${fmt(result.score)}`,481,239,28,'#695179','center');text(`🪙 獲得コイン  +${fmt(result.reward)}`,480,284,23,'#ad7a3c','center');text(result.details,479,352,17,'#58667a','center');text(`このモードの最高記録：${fmt(save.records[result.name]||0)}`,479,383,15,'#5d7788','center');
clickButton(199,437,249,62,'🏡 王国へ戻る',navBack,{bg:'#f8e7c9',font:19});clickButton(511,437,244,62,'▶ もう一度',()=>start(result.name),{bg:'#ffda91',font:19});}
function drawPaused(){rect(0,0,W,H,'#1a2d48ad');panel(260,152,441,287,'⏸ 一時停止');text('冒険はいつでも再開できるよ',480,236,21,'#626c83','center');clickButton(315,281,331,59,'▶ 冒険を続ける',()=>paused=false,{bg:'#fbe0a4',font:20});clickButton(315,361,331,51,'🏡 王国へ戻る',navBack,{bg:'#dcecf0'});}
function draw(){g.clearRect(0,0,W,H);buttons=[];g.save();if(shake>0){g.translate(rnd(-shake,shake),rnd(-shake,shake));shake*=.86;}switch(scene){case 'town':drawWorld(paused?0:frameDelta);break;case 'atlas':drawAtlas();break;case 'journal':drawJournal();break;case 'dialog':drawDialogue();break;case 'cave':drawCave(paused?0:frameDelta);break;case 'forge':drawForge();break;case 'help':drawHelp();break;case 'survivor':drawSurvivor();break;case 'platform':drawPlatform();break;case 'rpg':drawRPG();break;case 'puzzle':drawPuzzle();break;case 'results':drawResult();break;default:scenery();break}g.restore();if(['survivor','platform','rpg','puzzle'].includes(scene)&&!paused){clickButton(856,9,92,39,'Ⅱ やすむ',()=>paused=true,{bg:'#fff2d1',font:13});}if(paused)drawPaused();particlesDraw();if(flash>0){g.fillStyle=`rgba(255,255,255,${Math.min(.5,flash)})`;g.fillRect(0,0,W,H);flash=Math.max(0,flash-frameDelta*2)}}
let frameDelta=1/60;
function frame(time){frameDelta=Math.min(.04,Math.max(0,(time-clock)/1000||0));clock=time;tick++;if(infoTimer>0){infoTimer-=frameDelta;if(infoTimer<=0)document.getElementById('notice').classList.remove('show')}if(!paused){particlesStep(frameDelta);if(scene==='survivor')stepSurvivor(frameDelta);else if(scene==='platform')stepPlatform(frameDelta);}draw();requestAnimationFrame(frame)}
function handlePress(k){
 if(k==='escape'){
  if(['forge','help','results','atlas','journal','dialog'].includes(scene)){navBack();return}
  if(scene==='cave'){navBack();return}
  if(scene!=='town'){paused=!paused;beep(360,.07);return}
  scene='atlas';adjustTouch();return;
 }
 if(paused){if(k===' '||k==='enter')paused=false;return}
 if(scene==='town'){
  if(save.firstVisit&&(k==='e'||k==='enter'||k===' ')){save.firstVisit=false;persist();return}
  if(k==='m'){scene='atlas';adjustTouch();return}
  if(k==='j'){scene='journal';adjustTouch();return}
  if(k==='e'||k==='enter'||k===' '){worldInteract();return}
 }
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
// Browser-console debug API for automated regression verification.
window.DOMANDO_RUSH_DEBUG={start,back:navBack,worldTeleport:(x,y)=>{town.x=clamp(x,50,WORLD_W-50);town.y=clamp(y,50,WORLD_H-50);scene='town';save.firstVisit=false;adjustTouch();},worldExplore:()=>({...town,region:worldArea,chests:save.world.chests,found:save.world.found}),worldTileCodes:()=>[...worldTiles],interact:worldInteract,atlas:()=>{scene='atlas';adjustTouch()},getState:()=>({scene,paused,coins:save.coins,record:save.records[mode],mode,world:{x:town.x,y:town.y,area:worldArea},game:game?JSON.parse(JSON.stringify({...game,charged:undefined})):null}),puzzleSolve:()=>{if(scene!=='puzzle')start('puzzle');game.grid.forEach(t=>t.rot=0);updateCircuit();},nextPuzzle:puzzleNext,act:rpgMove,skipPlatform:()=>{if(scene==='platform')game.p.x=3260},skipSurvivor:()=>{if(scene==='survivor')game.seconds=95},setCoins:n=>{save.coins=n;persist();},save:()=>({...save})};
adjustTouch();requestAnimationFrame(frame);
})();
