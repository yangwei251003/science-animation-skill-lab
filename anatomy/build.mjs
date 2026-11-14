import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skill = resolve(process.argv.find((arg, i) => i > 1 && !arg.startsWith("--")) ??
  join(here, "../../evidence/mechanics/upstream/anatomy"));
const kit = await import(pathToFileURL(join(skill, "kit/iso-kit.mjs")));
const {kitScript} = await import(pathToFileURL(join(skill, "scripts/inline-kit.mjs")));
const theme = process.argv.includes("--light") ? "light" : "dark";

// Figure: a three-strip bench with one fixed stop contact, a momentary start,
// a moving holding bridge and a pilot lamp. The relay copies the PLC scan
// truth table: nextRun = !stop && (start || previousRun).
// Parts: one plate, four feet, three mounting rails, three actuator beds,
// three gland/sleeve layers per button, two pusher caps, core and pole shoes,
// eleven coil turns, contact pads and brass feet, crosshead and guide shoes,
// indicator mount/case/lens, earthing tab, eight terminal blocks and bolts.
const W = 780, H = 418;
const base = {x: -172, y: -72, w: 344, d: 146, r: 10};
const P = kit.fitProjection([...kit.boxCorners(base, -16, 0), [0, 0, 69]], W, H,
  {pad: 38, azimuth: 44, elevation: 35});
const p = (v) => kit.iso(v,P);
const chunks = [];
let parts = 0;
function slab(x,y,w,d,z,h,tone="mid",r=2,lit=false) {
  parts += 1;
  return kit.solidSvg(kit.slabOf({x,y,w,d,r},z,h,P,5,Math.min(h/4,.72)), {tone,lit});
}
const dots = (points, size=.75, tone="hi") => kit.dotsSvg(points.map(p), {size,tone});
const ticksOn = (x1,x2,y,z) => {
  const {minor,major}=kit.topTicks(x1,x2,4,5,y,z,[2,4],P);
  return kit.lineSvg(minor,{tone:"lo"})+kit.lineSvg(major,{tone:"mid"});
};
function fastener(x,y,z) {
  return kit.lineSvg(kit.ring(x,y,1.65,z,P,12), {tone:"lo"})+dots([[x,y,z]],.55,"mid");
}
function circuit(points,id){
  const d = points.map((v,i) => (i ? "L" : "M") + p(v).join(" ")).join(" ");
  return `<g class="trace" id="${id}"><path d="${d}"/>${dots([points[0],points.at(-1)],1.5,"hi")}</g>`;
}
function wrap(id,html){ return `<g id="${id}">${html}</g>`; }

chunks.push(`<path class="iso-halo" d="${kit.haloOf(base,-16,12,P)}"/>`);
for (const [x,y] of [[-163,-64],[149,-64],[-163,58],[149,58]]
  .sort((a,b) => kit.depthOf([...a,0],P)-kit.depthOf([...b,0],P))) {
  chunks.push(slab(x,y,14,12,-16,5,"lo",2), slab(x+2,y+1,10,10,-11,3,"mid",2));
}
chunks.push(slab(base.x,base.y,base.w,base.d,-8,8,"lo",10));
chunks.push(kit.lineSvg(kit.planOutline(kit.insetPlan(base,4.5),0,P),{tone:"lo"}));
for(const x of [-158,158]) for(const y of [-58,61]) chunks.push(fastener(x,y,0));
chunks.push(slab(-147,-61,289,8,0,.72,"lo",2),ticksOn(-143,137,-60.65,.72));
for (const [index,x] of [-134,-77,22,79].entries()) {
  const w = index===2 ? 50 : index===3 ? 53 : 36;
  chunks.push(slab(x,-20,w,72,0,3,"mid",2));
  for (const end of [-17,47]) chunks.push(fastener(x+4,end,3),fastener(x+w-4,end,3));
}
chunks.push(circuit([[-119,-22,0],[-119,-35,0],[-60,-35,0],[-60,-22,0]],"trace-start"));
chunks.push(circuit([[-60,-38,0],[-60,-49,0],[48,-49,0],[48,-22,0]],"trace-hold"));
chunks.push(circuit([[48,51,3],[48,62,0],[102,62,0],[102,51,3]],"trace-output"));
chunks.push(circuit([[-119,51,3],[-119,64,0],[-55,64,0],[-55,51,3]],"trace-feed"));

function button(x,label,id){
  const body=x-13;
  return [
    slab(body-5,0,36,30,3,5,"lo",4),
    slab(body,3,26,24,8,12,"mid",4),
    slab(body+2,5,22,20,20,4,"hi",3),
    wrap(id, slab(body+3,6,20,18,24,6,"hi",3)+slab(body+4,7,18,16,30,2,"mid",3)
      +kit.faceTextSvg(kit.topMatrix([x,18],32.04,P,"x"),label,{size:4.5,anchor:"middle",tone:"hi"}))
  ].join("");
}
chunks.push(button(-116,"STOP","stop-cap"));
chunks.push(button(-59,"START","start-cap"));

chunks.push(slab(22,-7,50,47,3,3,"lo",2));
chunks.push(slab(29,-4,5,25,6,8,"mid",1),slab(61,-4,5,25,6,8,"mid",1));
chunks.push(slab(38,0,16,10,6,24,"lo",1));
for(let turn=0;turn<11;turn++){
  const height=8+turn*1.62;
  chunks.push(slab(36,-2,20,14,height,.92,turn%2?"hi":"mid",2));
}
chunks.push(slab(37,-1,18,12,26,5,"hi",1));
chunks.push(slab(33,23,7,12,6,12,"mid",1),slab(60,23,7,12,6,12,"mid",1));
chunks.push(slab(35,25,7,8,18,2,"hi",1),slab(58,25,7,8,18,2,"hi",1));
const bridge = [
  slab(37,24,30,10,26,3,"hi",1,true),
  slab(37,25,5,8,24,2,"hi",1,true),slab(61,25,5,8,24,2,"hi",1,true)
].join("");
chunks.push(wrap("holding-bridge",bridge));
chunks.push(slab(85,-7,42,38,3,8,"mid",5),slab(89,-3,34,30,11,9,"lo",4));
chunks.push(slab(92,0,28,24,20,4,"mid",4));
chunks.push(wrap("run-lens",slab(95,3,22,18,24,4,"hi",4,true)));
for(const x of [-133,-118,-76,-61,32,52,86,105]){
  chunks.push(slab(x,39,12,10,3,5,"mid",1),fastener(x+6,44,8));
}
chunks.push(slab(118,-17,22,6,0,1,"mid",1),fastener(121,-14,1));
chunks.push(slab(-137,54,50,10,0,1,"mid",1));
chunks.push(kit.faceTextSvg(kit.topMatrix([-131,60],1.05,P,"x"),"RUN / HOLD",{size:4.5,tone:"hi"}));

const svg=kit.figureSvg({
  width:W,height:H,label:"开盖的自保持教学台，左边是停止和启动按钮，中间是线圈和保持触点，右边是运行指示灯。",
  body:chunks
});
const body=kit.plateHtml({
  fig:"接线台",title:"自保持回路",hint:"按下启动后松手，再按停止",
  readout:"停机 · 保持触点断开",
  keys:[{mark:"lit",label:"保持触点与运行灯"},{mark:"raised",label:"按钮与安装底座"}],
  caption:"启动按钮只需短按。线圈吸合后，保持触点为它接上一条并联路径。停止按钮串联在两条路径之前，一旦按下，两条路一起断开。",
  body:`<div class="iso-stage" aria-label="启停自保持结构和运行状态">${svg}</div>`
});
const css=`
body{margin:0!important}.iso-page{width:min(1040px,100% - 18px)!important;max-width:none!important;margin:0 auto 40px!important}
.workbench{max-width:940px;margin:0 auto;padding:clamp(20px,4.2vw,64px) clamp(14px,4vw,48px);font-family:"Microsoft YaHei",sans-serif}
.nav{font-size:12px;font-weight:700;letter-spacing:.09em;color:var(--sub,#7997ae);text-decoration:none}
.mast{display:flex;align-items:end;justify-content:space-between;margin:21px 0 17px;gap:12px}
h1{margin:0;font-size:clamp(28px,5vw,49px);letter-spacing:-.045em;line-height:1.06}
.kicker{color:#4ea0c2;font:700 11px/1.3 ui-monospace,monospace;letter-spacing:.15em;margin:0 0 12px}
.mast small{white-space:nowrap;font:500 13px ui-monospace,monospace;color:#7795ac}
.control-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:14px 0 12px}
.control-row button,.control-row a{border:1px solid color-mix(in srgb,currentColor 22%,transparent);padding:8px 12px;border-radius:6px;background:transparent;color:inherit;text-decoration:none;font:600 13px/1.2 "Microsoft YaHei",sans-serif;min-height:34px;cursor:pointer}
.control-row button:hover,.control-row a:hover{border-color:#56bce7}
.control-row button[aria-pressed="true"]{background:#2294bf;color:white}
.iso .iso-stage{position:relative;background-image:radial-gradient(ellipse at center,transparent 35%,#090f1817),linear-gradient(#7895af19 1px,transparent 1px),linear-gradient(90deg,#7895af19 1px,transparent 1px);background-size:auto,24px 24px,24px 24px}
.iso-stage svg{display:block;max-width:100%;margin:auto}
.trace > path{fill:none;stroke:#65737e;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.trace.live > path{stroke:#4ecdf1;stroke-width:2.8;filter:drop-shadow(0 0 4px #4ecdf1a0)}
#run-lens.live{filter:drop-shadow(0 0 9px #3cc5f9);opacity:1}
#run-lens{opacity:.72}
#explanation{line-height:1.65;font-size:13px;margin:0 0 17px;color:#7795ac}
[data-theme="light"] #explanation,[data-theme="light"] .mast small,[data-theme="light"] .nav{color:#47677b}
body a:focus-visible,body button:focus-visible{outline:2px solid #56bce7;outline-offset:3px}
@media(max-width:500px){.mast small{display:none}.control-row button,.control-row a{padding:7px 9px}.workbench{padding-top:22px}}
`;
const controls=`<div class="control-row">
  <button id="start" type="button">启动</button><button id="stop" type="button">停止</button>
  <button id="together" type="button">同时按下</button><button id="tour" type="button" aria-pressed="false">播放演示</button>
  <a href="${theme==="light"?"./index.html":"./light.html"}">${theme==="light"?"切换深色":"切换浅色"}</a>
</div>`;
const live = `
const projection = ${JSON.stringify(P)};
const state = {run:false,start:false,stop:false};
const still = matchMedia("(prefers-reduced-motion: reduce)");
const bridge = document.getElementById("holding-bridge");
const stage = document.querySelector(".iso-stage");
const readout = document.querySelector("[data-readout]");
const reason = document.getElementById("explanation");
const lens = document.getElementById("run-lens");
const tours = document.getElementById("tour");
const settle = [0,0,0];
const moving = [document.getElementById("start-cap"),document.getElementById("stop-cap"),bridge];
let release = 0, frame = 0, last = 0, tourTimers = [], runningTour = false, interact = false, idle = 0, visible = true;
function draw(now) {
  const dt = Math.min(.033,(now-last)/1000||.016);
  last=now;
  let needsFrame=false;
  const target = [state.start ? 3 : 0,state.stop ? 3 : 0,state.run ? 4 : 0];
  moving.forEach((part,i) => {
    const delta = target[i]-settle[i];
    settle[i]=still.matches || Math.abs(delta)<.02 ? target[i] : settle[i]+delta*(1-Math.exp(-dt/.075));
    if(settle[i]!==target[i]) needsFrame=true;
    part.setAttribute("transform",translateAlong(projection,[0,0,-settle[i]]));
  });
  const closed = settle[2] === 4;
  for (const [id,active] of [["trace-start",state.start&&!state.stop],["trace-hold",closed],["trace-output",closed],["trace-feed",!state.stop]]) {
    document.getElementById(id).classList.toggle("live",active);
  }
  lens.classList.toggle("live",closed);
  readout.textContent = closed ? "运行 · 保持触点闭合" : settle[2]>0 ? "保持触点正在动作" : "停机 · 保持触点断开";
  frame = visible&&needsFrame ? requestAnimationFrame(draw) : 0;
}
function go(){if(!frame && visible){last=0;frame=requestAnimationFrame(draw);}}
function scan(start,stop){
  const previous = state.run;
  state.start = start;
  state.stop = stop;
  state.run = !stop && (start || previous);
  reason.textContent = stop ? (start?"启动和停止同时按下。停止优先，运行灯熄灭。":"停止触点开路。保持触点释放，松开停止按钮也不会重启。")
    : start ? "启动按钮接通线圈。开盖看中间的保持触点如何合上。"
    : state.run ? "手已经离开启动按钮。闭合的保持触点继续为线圈供电。"
    : "按一次启动，观察线圈怎样通过自己的触点维持通电。";
  go();
}
function pulse(start,stop){
  clearTimeout(release);
  scan(start,stop);
  release=setTimeout(()=>scan(false,false), stop ? 1050 : 620);
}
function cancelTour(){
  clearTimeout(idle);
  for (const timer of tourTimers) clearTimeout(timer);
  tourTimers=[];runningTour=false;
  tours.setAttribute("aria-pressed","false");
  tours.textContent="播放演示";
}
function runTour(){
  cancelTour();
  clearTimeout(release);
  runningTour=true; tours.setAttribute("aria-pressed","true"); tours.textContent="停止演示";
  scan(false,true);
  const beats=[[260,()=>scan(false,false)],[900,()=>pulse(true,false)],[3500,()=>pulse(false,true)],
    [5400,()=>pulse(true,true)],[7600,cancelTour]];
  tourTimers=beats.map(([time,fn])=>setTimeout(fn,time));
}
function manual(start,stop){interact=true;cancelTour();pulse(start,stop);}
document.getElementById("start").addEventListener("click",()=>manual(true,false));
document.getElementById("stop").addEventListener("click",()=>manual(false,true));
document.getElementById("together").addEventListener("click",()=>manual(true,true));
tours.addEventListener("click",()=>{interact=true;if(runningTour)cancelTour();else runTour();});
stage.addEventListener("pointerenter",()=>clearTimeout(idle));
new IntersectionObserver((e)=>{visible=e.at(-1).isIntersecting;if(visible)go(); else if(runningTour)cancelTour();},{rootMargin:"100px"}).observe(stage);
document.querySelector(".control-row").addEventListener("focusin",()=>clearTimeout(idle));
if(!still.matches) idle=setTimeout(()=>{if(visible&&!interact)runTour();},6500);
window.__sealIn=state;
draw(performance.now());
`;
const layout=`<main class="workbench"><a class="nav" href="../index.html">‹ 科普动画实测</a>
  <div class="mast"><div><p class="kicker">ANATOMY / 等轴测</p><h1>松开启动，为什么还在转？</h1></div><small>24 V 控制回路</small></div>
  ${controls}<p id="explanation" aria-live="polite">按一次启动，观察线圈怎样通过自己的触点维持通电。</p>${body}</main>`;
const html=kit.pageHtml({title:"松开启动，为什么还在转？",theme,body:layout,script:kitScript()+live})
  .replace('lang="en"','lang="zh-CN"').replace("</head>",`<style>${css}</style></head>`);
writeFileSync(join(here,theme==="light"?"light.html":"index.html"),html);
writeFileSync(join(here,"ANATOMY-LICENSE.txt"),readFileSync(join(skill,"LICENSE")));
console.log(`Anatomy Figure: ${parts} modeled solids, ${theme} theme.`);
