import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { boxCorners, cylinder, depthOf, extrude, figureSvg, fitProjection, iso, lineOnTop, lineSvg, pageHtml, pathOf, plateHtml, slabOf, solidSvg } from './anima-kit.mjs';
import { bioAudit } from './bio-audit.mjs';

// Teaching model of Celik et al. 2013 Fig. 2 and a separate control from the Results.
// Geometry is schematic; the single numeric readout comes from Fig. 2C, not from animation timing.
const width=800, height=428;
const base={x:-123,y:-91,w:246,d:182,r:12};
const P=fitProjection(boxCorners(base, -17, 31), width,height,{pad:18,azimuth:48,elevation:37});
const number=(x)=>x.toFixed(2);
const pixel=(a)=>iso(a,P).map(number).join(' ');
const slab=(x,y,w,d,z,h,r=5)=>slabOf({x,y,w,d,r},z,h,P,6,.65);
const colored=(part,cls,inner='')=>solidSvg(part,{tone:'hi',className:cls,inner});
const bracket=(x,y)=>colored(slab(x-7,y-7,14,14,5,5,3),'fastener')+colored(cylinder(x,y,4.1,10,1.5,P,22),'metal',lineSvg(lineOnTop([x-2.4,y],[x+2.4,y],11.5,P),{free:true}));
const z=13;
const channelRing=[[-111,-12],[111,-12],[111,12],[53,12],[53,37],[38,37],[38,12],[7,12],[7,38],[31,38],[31,77],[-31,77],[-31,38],[-7,38],[-7,12],[-38,12],[-38,37],[-53,37],[-53,12],[-111,12]];
const hex = [[0,-1],[Math.sqrt(3)/2,-.5],[Math.sqrt(3)/2,.5],[0,1],[-Math.sqrt(3)/2,.5],[-Math.sqrt(3)/2,-.5]];
const crystalRing=hex.map(([x,y])=>[x*26,y*18+57]);
const fluor=(points,r,cls)=>points.map((pt,i)=>{const xy=iso(pt,P);return '<circle class="'+cls+'" data-i="'+i+'" cx="'+number(xy[0])+'" cy="'+number(xy[1])+'" r="'+r+'"/>';}).join('');
const bound = crystalRing.flatMap(([x,y],i)=>{const q=crystalRing[(i+1)%6];return [.17,.43,.72].map(t=>[x+(q[0]-x)*t,y+(q[1]-y)*t,z+6.9]);});
const unbound = [
  ...Array.from({length:19},(_,i)=>[-103+i*11.4, Math.sin(i*3.17)*8,z+.8]),
  ...Array.from({length:12},(_,i)=>[-27+(i%6)*10.8, i<6?40+(i%3)*2:68+(i%3)*2,z+.8]),
].filter(([x,y])=>!(Math.abs(x)<19 && y>44 && y<67));
const flowPaths = [0,1,2].map(k=>{
  const points = [-110,-65,-20,25,70,110].map((x,i)=>[x,k*6-6+Math.sin(i*2+.2)*1.1,z+1]);
  return '<path class="fluid-route" d="'+pathOf(points.map(q=>iso(q,P)))+'"/>';
}).join('');
const mount=[[-108,-77],[-108,77],[108,77],[108,-77]].sort((a,b)=>depthOf([...a,0],P)-depthOf([...b,0],P));
const plateBody=[
  ...mount.map(([x,y])=>colored(slab(x-7,y-7,14,14,-14,5,4),'fastener')),
  colored(slab(-123,-91,246,182,-9,9,12),'base'),
  colored(slab(-118,-85,236,170,0,4,11),'deck'),
  colored(slab(-113,-81,226,162,4,9,8),'acrylic'),
  colored(extrude(channelRing,z,.55,P,{convex:false}), 'channel'),
  flowPaths,
  ...[-1,1].map(s=>colored(cylinder(s*92,-48,15,z,5,P,42,.7),'port')+colored(cylinder(s*92,-48,8,z+5,1,P,26),'port-hole')),
  ...mount.map(([x,y])=>bracket(x,y)),
  ...Array.from({length:9},(_,i)=>colored(slab(-50+i*12,-71,5,5,z,.7,1),'vernier')),
  ...Array.from({length:6},(_,i)=>colored(slab(77,-34+i*12,4,5,z,.7,1),'vernier')),
  '<g id="free-proteins">'+fluor(unbound,2.35,'free-protein')+'</g>',
  '<g id="ice" style="transform-origin:'+pixel([0,57,z+4]).replace(' ','px ')+'px">'+
    colored(extrude(crystalRing,z+.58,6.2,P,{bevel:.8}),'crystal')+
    '<path class="ice-facet" d="'+pathOf([iso([0,57,z+6.8],P),...crystalRing.slice(2,5).map(q=>iso([...q,z+6.8],P))],true)+'"/>'+
  '</g>',
  '<g id="bound-proteins">'+fluor(bound,2.7,'bound-protein')+'</g>',
  '<circle class="focus-ring" cx="'+iso([0,57,z+4],P)[0]+'" cy="'+iso([0,57,z+4],P)[1]+'" r="63"/>',
].join('');

// Check the traced schematic boundaries and the targets exposed by the legend.
// The kit requires a coordinate conversion factor; no biological dimensions are asserted.
const audit=bioAudit({unitsPerMicron:1, membranes:[
  {id:'ice-boundary',boundary:crystalRing.map(q=>[...q,0])},
  {id:'chip-channel',boundary:channelRing.map(q=>[...q,1])},
],parts:['ice','bound-proteins','free-proteins'],labels:[
  {text:'冰晶',partId:'ice'},{text:'表面蛋白',partId:'bound-proteins'},{text:'游离蛋白',partId:'free-proteins'}
]});
if(!audit.ok) throw new Error(audit.errors.join('\n'));
const figure = figureSvg({width,height,label:'等轴视图：控温微流控芯片内，荧光标记的抗冻蛋白随液体流动或附着在冰晶表面',body:plateBody,className:'chip-figure'});
const plate = plateHtml({fig:'FIG. 07 / ANIMA',title:'MICROFLUIDIC ASSAY',hint:'示意图 · 不按比例',readout:'观察：蛋白吸附',body:figure});
const stages=[
  {short:'先让蛋白附着',name:'吸附',detail:'把冰晶放在含荧光标记抗冻蛋白的溶液中。溶液里能看到游离蛋白，冰晶表面也逐渐出现荧光。',solution:'有荧光',edge:'有荧光',growth:'建立基线',free:1,bound:1,scale:1},
  {short:'洗走游离蛋白',name:'冲洗',detail:'保持温度，用不含蛋白的缓冲液缓慢换液。游离蛋白剩约 2%，冰晶表面的荧光几乎不变。已附着的蛋白依然能抑制生长。',solution:'约 2%¹',edge:'几乎不变',growth:'受抑制',free:.06,bound:1,scale:1},
  {short:'另做新冰晶对照',name:'对照',detail:'在蛋白已大量减少的溶液里重新形成一颗冰晶，再做降温测试。新晶的冻结滞后明显更小；图中亮点和大小只区分新旧示意。',solution:'大幅减少',edge:'保护较弱',growth:'更易生长',free:.06,bound:.13,scale:.8},
];
const css=`
  html{color-scheme:dark}body{--cyan:#71e9e2;--ink:#dcecf4;--muted:#9eafc0;--rule:#29414b;color:var(--ink);background:#0a141c;font-family:"Microsoft YaHei UI","PingFang SC",system-ui,sans-serif;}
  body[data-theme=light]{--cyan:#096456;--ink:#162d38;--muted:#46616c;--rule:#b7cdd1;background:#edf4f2;--anatomy-muted:#49636c;color-scheme:light}
  .iso-page{margin:20px auto 66px;width:min(1280px,100% - 48px)}a{color:inherit;text-underline-offset:.27em}a:hover{color:var(--cyan)}
  .topbar{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid var(--rule);padding:12px 0 15px;align-items:center}.topbar span,.eyebrow,.metric small,.protocol-label{font:12px/1.5 Consolas,monospace;letter-spacing:.15em;color:var(--cyan)}
  .hero{display:grid;grid-template-columns:1fr minmax(230px,34%);gap:26px;align-items:end;padding:36px 0 29px}.eyebrow{margin:0 0 10px}h1{font-family:"Noto Serif SC","Songti SC","SimSun",serif;font-size:clamp(35px,5vw,68px);line-height:1.05;letter-spacing:-.065em;margin:0;font-weight:800}h1 span{color:var(--cyan)}.intro{margin:0 0 1px;font-size:15px;color:var(--muted);max-width:34em}
  .board{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,300px);gap:18px}.iso-figure{margin:0}.iso-plate{background:radial-gradient(ellipse at 48% 56%,#17313c,#101e29 65%,#111b26);box-shadow:inset 0 0 0 1px var(--rule);padding:40px 16px 41px;isolation:isolate}.iso-plate:before{content:"";position:absolute;inset:1px;z-index:-1;background:repeating-linear-gradient(0deg,transparent 0 28px,#87cadd14 28px 29px),repeating-linear-gradient(90deg,transparent 0 28px,#87cadd14 28px 29px);mask-image:radial-gradient(ellipse,#000 7%,transparent 83%)}
  [data-theme=light] .iso-plate{background:radial-gradient(ellipse at 50% 42%,#fff,#e4f2f5 70%,#dce9ec)}.iso-plate-corner{color:var(--muted)}.iso-plate-corner[data-corner=fig],.iso-plate-corner[data-corner=readout]{color:var(--cyan)}
  .chip-figure{--anatomy-hi:#a4c0c8;--anatomy-paper:#213040;--anatomy-top:#374653;--anatomy-shade-0:#19272e;--anatomy-shade-1:#263643;--anatomy-shade-2:#293b4a;--anatomy-shade-3:#324a57;--anatomy-lo:#7baab8;--anatomy-weight:.75px;overflow:hidden}
  .base{--anatomy-top:#324d61;--anatomy-shade-0:#162836}.deck{--anatomy-top:#7d8e96;--anatomy-hi:#bfd3d7}.acrylic{--anatomy-top:#667e88;--anatomy-hi:#c2dce7;--anatomy-shade-0:#3a535e;--anatomy-shade-1:#536d79}.channel{--anatomy-top:#132f38;--anatomy-hi:#91c1c0}.port{--anatomy-top:#9bb0b6}.port-hole{--anatomy-top:#203843}.metal{--anatomy-top:#8299a2;--anatomy-hi:#cde8eb}.vernier{--anatomy-top:#a2b4b7;--anatomy-hi:#708c9a}
  .crystal{--anatomy-hi:#dcf9fa;--anatomy-top:#a3e4e5;--anatomy-shade-0:#246f84;--anatomy-shade-1:#317d90;--anatomy-shade-2:#4ea5b5;--anatomy-shade-3:#57bdcd}.ice-facet{fill:#dafdff6b;stroke:none}
  .free-protein{fill:#66d9ba;stroke:none}.bound-protein{fill:#d6ff89;stroke:#184337;stroke-width:.45;filter:drop-shadow(0 0 2px #adff9f)}.focus-ring{fill:none;stroke:#b3f2e6;stroke-width:1;stroke-dasharray:3 6;opacity:.45}
  .fluid-route{fill:none;stroke:#b6e7e7;stroke-width:1;stroke-dasharray:2 9;opacity:.45;vector-effect:non-scaling-stroke}
  .readings{border:1px solid var(--rule);padding:17px 17px 18px;display:flex;flex-direction:column;gap:12px}.protocol-label{margin:0}.stages{display:grid;gap:6px}button{cursor:pointer;border:1px solid var(--rule);padding:8px 11px;background:transparent;color:var(--ink);font:inherit;text-align:left}button:hover,button:focus-visible{border-color:var(--cyan)}button[aria-pressed=true]{background:#2b86785a;border-color:var(--cyan);color:var(--ink);font-weight:700}.stage-num{font:12px Consolas,monospace;color:var(--cyan);padding-right:10px}
  .metric-list{display:grid;gap:4px}.metric{display:flex;justify-content:space-between;gap:10px;align-items:baseline;border-top:1px solid var(--rule);padding-top:4px}.metric small{font-family:inherit;letter-spacing:.05em;color:var(--muted)}.metric b{font-size:13px;color:var(--cyan)}#detail{font-size:13px;line-height:1.65;color:var(--muted);margin:0;min-height:66px}.controls{margin-top:auto;display:flex;gap:6px}.controls button{font-size:12px}
  .caption{margin:19px 0 0;padding:15px 0;border-top:1px solid var(--rule);display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:13px;color:var(--muted)}.caption p{margin:0}.legend{display:flex;flex-wrap:wrap;gap:8px 17px;margin-top:8px}.legend i{display:inline-block;width:8px;height:8px;margin-right:5px;background:#ace4e8;border-radius:50%}.legend .free{background:#52bd9c}.legend .bound{background:#9fce3b}
  @media(max-width:840px){.board{grid-template-columns:1fr}.readings{display:grid;grid-template-columns:1fr 1fr}.protocol-label,.controls{grid-column:1/-1}.hero{grid-template-columns:1fr;gap:12px}.caption{grid-template-columns:1fr}}
  @media(max-width:475px){.iso-page{width:calc(100% - 24px);margin-top:10px}.readings{grid-template-columns:1fr;padding:12px}.iso-plate{padding:35px 4px}.iso-plate-corners{inset:13px 11px}.iso-plate-corner[data-corner=hint]{bottom:0}.hero{padding:24px 0 20px}}
`;
const body=`<style>${css}</style>
  <nav class="topbar"><a href="../index.html">← 样片展厅</a><span>07 / 科学实验</span></nav>
  <header class="hero"><div><p class="eyebrow">ANIMA / 生物实验图解</p><h1>冰晶边缘的<span>荧光</span></h1></div><p class="intro">从雪花的六角结构，到冰晶表面的一次实验：把水里的抗冻蛋白洗掉，冰晶还会受到保护吗？</p></header>
  <div class="board">${plate}<section class="readings" aria-label="实验步骤和结果"><p class="protocol-label">实验台 / TmAFP</p>
    <div class="stages">${stages.map((s,i)=>'<button class="stage" data-stage="'+i+'" aria-pressed="'+(i===0)+'"><span class="stage-num">0'+(i+1)+'</span>'+s.short+'</button>').join('')}</div>
    <div class="metric-list"><div class="metric"><small>溶液中的荧光蛋白</small><b id="solution">有荧光</b></div><div class="metric"><small>冰晶表面</small><b id="edge">有荧光</b></div><div class="metric"><small>生长读数</small><b id="growth">建立基线</b></div></div>
    <p id="detail" aria-live="polite">${stages[0].detail}</p><div class="controls"><button id="play" aria-pressed="false">连续播放</button><button id="theme" aria-pressed="false">浅色视图</button></div>
  </section></div>
  <footer class="caption"><div><p>黄粉虫抗冻蛋白（TmAFP）配绿色荧光标记。三步是对原研究的教学重构；图形、粒子数、流量及时间不按比例，研究中“新冰晶”是单独对照。这里的冰晶从液相生长，和雪晶在云里的生长环境不同。</p><div class="legend"><span><i></i>冰晶</span><span><i class="bound"></i>表面结合蛋白</span><span><i class="free"></i>游离蛋白</span></div></div>
    <p>¹ 约 2% 来自一次换液中邻近溶液荧光的相对读数，非普适浓度。<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3557080/#f02" target="_blank" rel="noopener">Celik 等，PNAS，2013，图 2 与结果段</a>。<a href="https://github.com/Garinmckayl/anima" target="_blank" rel="noopener">Anima 绘图库</a> · MIT</p>
  </footer>`;
const script=`
const data=${JSON.stringify(stages)};
const el=(x)=>document.getElementById(x);
const buttons=[...document.querySelectorAll('.stage')], motion=matchMedia('(prefers-reduced-motion: reduce)');
let i=0, visible=true, raf=0, last=0, clock=0, tour=false, elapsed=0;
const visual={free:1,bound:1,scale:1};
function choose(n){i=n;elapsed=0; const d=data[i]; document.body.dataset.stage=d.name; buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j))); ['solution','edge','growth','detail'].forEach(k=>el(k).textContent=d[k]);document.querySelector('[data-readout]').textContent='观察：蛋白'+d.name; tickOn();}
function play(next){tour=next;elapsed=0;el('play').setAttribute('aria-pressed',String(next));el('play').textContent=next?'暂停播放':'连续播放';tickOn();}
function tickOn(){if(visible&&!raf){last=0;raf=requestAnimationFrame(tick);}}
function tick(now){raf=0;if(!visible)return;const dt=last?Math.min((now-last)/1000,.05):.016;last=now;clock+=dt;
  if(tour){elapsed+=dt;if(elapsed>4.7){if(i===data.length-1)play(false);else choose(i+1);}}
  const d=data[i];let changing=false;
  for(const k of Object.keys(visual)){ const target=d[k]; const error=target-visual[k]; visual[k]=motion.matches||Math.abs(error)<.002?target:visual[k]+error*(1-Math.exp(-dt/.29));changing ||= visual[k]!==target; }
  el('free-proteins').style.opacity=visual.free;el('bound-proteins').style.opacity=visual.bound;el('ice').style.transform='scale('+visual.scale+')';
  const moving=!motion.matches&&(tour||changing);
  if(moving)document.querySelectorAll('.fluid-route').forEach((n,j)=>n.style.strokeDashoffset=-(clock*(i===1?27:13)+j*4));
  if(tour||changing)raf=requestAnimationFrame(tick);
}
buttons.forEach((b,j)=>{b.addEventListener('click',()=>{play(false);choose(j);}); b.addEventListener('keydown',(e)=>{if(!['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();buttons[(j+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+buttons.length)%buttons.length].focus();});});
el('play').onclick=()=>{if(tour){play(false);return;}choose(0);play(true);};
el('theme').onclick=(e)=>{const light=document.body.dataset.theme!=='light';document.body.dataset.theme=light?'light':'dark';e.target.setAttribute('aria-pressed',String(light));e.target.textContent=light?'深色视图':'浅色视图';};
if('IntersectionObserver' in window)new IntersectionObserver((items)=>{visible=items.at(-1).isIntersecting;if(visible)tickOn();}, {rootMargin:'100px 0px'}).observe(document.querySelector('.iso-plate'));
choose(0);
`;
const dest=fileURLToPath(new URL('./index.html',import.meta.url));
const result=pageHtml({title:'冰晶边缘的荧光 · Anima',theme:process.argv.includes('--light')?'light':'dark',body,script,width:1280}).replace('lang="en"','lang="zh-CN"');
writeFileSync(process.argv.includes('--light')?dest.replace('index.html','light.html'):dest,result);
console.log('Anima bio audit passed (schematic label targets and boundaries); built',process.argv.includes('--light')?'light.html':'index.html');
