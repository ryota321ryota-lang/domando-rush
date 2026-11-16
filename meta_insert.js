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
