import * as T from "three";
import {runSim} from "teardown-kit/runtime.js";

// Case study: LC1D09BD envelope 45 × 77 × 95 mm, 24 V DC coil and 3 NO
// main poles. Internal dimensions are independently modeled for instruction.
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const state={power:false,exploded:false,cut:false,auto:false,part:"all",explode:0,opening:0,travel:0};
const pose={closed:false,stroke:0};
const controls=[
  ["all","全部零件","看整体合拢与装配方向。"],
  ["shell","绝缘外壳","隔开三组主触点，盖板遮住上方端子。"],
  ["contact","三极触点","三组动触桥共用一只绝缘横梁，同时闭合。"],
  ["return","回位弹簧","断电后把横梁推回原位，三组主触点恢复断开。"],
  ["armature","铁芯与衔铁","24 V 线圈通电后吸引衔铁，衔铁带动横梁。"],
  ["coil","控制线圈","控制回路只给线圈供电。主负载经独立主触点通断。"],
  ["base","底座与卡扣","导轨卡扣承担固定，绝缘底座支撑磁路和接线端。"]
];
const defaults={duration:22,fps:60,theme:"light",accent:"#a85635",hud:{enabled:false,title:"24 V 接触器解剖",subtitle:""},director:{enabled:false}};
runSim(defaults,async ({canvas,capture})=>{
  const app=document.querySelector("#app");
  canvas.insertAdjacentHTML("afterend",`
  <main class="lab-page">
    <header><a href="../index.html">‹ 科普动画实测</a><span>TEARDOWN / 接触器</span></header>
    <section class="hero"><div><h1>小信号怎样接通三路电？</h1><p>试着通电，再开盖看三组触点怎样一起落下。</p></div>
      <span class="voltage"><b>24</b> V DC</span></section>
    <div class="display"><div class="stage">
      <div class="stage-head"><span><i></i> 教学结构模型</span><span>拖动旋转 · 滚轮缩放</span></div>
      <div class="readings"><div><small>线圈</small><b id="supply">0 V</b></div><div><small>主触点</small><b id="status">三极已断开</b></div><div><small>衔铁行程</small><b id="travel">0.0 mm</b></div></div>
    </div><aside><h2>按部件查看</h2><div id="catalog">${controls.map(([id,label],i)=>`<button data-part="${id}" aria-pressed="${i===0}"><span>${label}</span><span>›</span></button>`).join("")}</div>
      <p id="note">${controls[0][2]}</p></aside></div>
    <section class="buttons"><button id="power" aria-pressed="false">给线圈通电</button><button id="peek" aria-pressed="false">开盖</button><button id="spread" aria-pressed="false">爆炸视图</button><button id="tour" aria-pressed="false">播放导览</button></section>
    <footer>结构依据施耐德 LC1D09BD 的外形与三极常开原理。内部尺寸、衔铁行程和动作时间作教学简化。
    <a href="https://iportal.se.com/Contents/docs/SQD-LC1D09BD.PDF" target="_blank" rel="noreferrer">产品数据表</a></footer>
  </main>`);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"default"});
  renderer.setClearColor(0xe9e8e0,1);
  renderer.setPixelRatio(Math.min(1.65,devicePixelRatio));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  const scene=new T.Scene();
  scene.background=new T.Color(0xe9e8e0);
  scene.fog=new T.Fog(0xe9e8e0,21,48);
  const camera=new T.PerspectiveCamera(36,1,.05,120);
  const target=new T.Vector3(0,3.6,0);
  const cameraPose={angle:.61,elevation:.43,distance:24};
  const stage=app.querySelector(".stage");
  stage.prepend(canvas);
  scene.add(new T.HemisphereLight(0xfffcf1,0x77776a,2.12));
  const key=new T.DirectionalLight(0xfff1d8,3.9);
  key.position.set(-5,11,8);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:34});
  key.shadow.normalBias=.04;
  scene.add(key);
  const rim=new T.DirectionalLight(0xd5e4ee,1.86);
  rim.position.set(8,5,-5);scene.add(rim);
  const floor = new T.Mesh(new T.PlaneGeometry(180,180),new T.MeshStandardMaterial({color:0xe9e8e0,roughness:.92}));
  floor.rotation.x=-Math.PI/2; floor.receiveShadow=true;scene.add(floor);

  const makeMat=(color,rough=.54,metal=.0)=>new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});
  const white=makeMat(0xb9bfba,.52), ceramic=makeMat(0xa9a49d,.51), char=makeMat(0x252d2f,.78),
    baseMat=makeMat(0x344246,.67), brass=makeMat(0xca9361,.52,.48), darkSteel=makeMat(0x444e4e,.58,.56),
    bolts=makeMat(0xaaa9a1,.37,.58), copper=makeMat(0xb75a34,.38,.43), clampMat=makeMat(0x6f7770,.47,.36),
    accent=makeMat(0xb24326,.49,.12), pad=makeMat(0xbac5c3,.31,.63), lidMat=makeMat(0x9da4a3,.47);
  const body=new T.Group();scene.add(body);
  const parts={};
  const offsets={shell:[0,5.8,.2],contact:[-3.7,2.25,0],return:[-1,.85,4.2],armature:[3.4,.7,1.2],coil:[2,0,-3.9],base:[0,0,0]};
  for(const id of Object.keys(offsets)){
    parts[id]=new T.Group();body.add(parts[id]);
  }
  const mesh=(g,m,x,y,z,p,rz=0)=>{
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.rotation.z=rz;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;
  };
  const box=(w,h,d,x,y,z,m,p)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
  const screw=(x,y,z,p)=>{
    mesh(new T.CylinderGeometry(.144,.147,.10,22),bolts,x,y,z,p);
    box(.165,.012,.034,x,y+.052,z,darkSteel,p);
  };
  const txt=(word,bg,fg,x,y,z,w,d,p)=>{
    const draw=document.createElement("canvas");draw.width=640;draw.height=144;const ctx=draw.getContext("2d");
    ctx.fillStyle=bg;ctx.fillRect(0,0,640,144);
    ctx.fillStyle=fg;ctx.textBaseline="middle";ctx.textAlign="center";ctx.font="700 52px Arial";
    ctx.fillText(word,320,73);
    const map=new T.CanvasTexture(draw);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
    const label=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map}));
    label.rotation.x=-Math.PI/2;label.position.set(x,y,z);p.add(label);
  };
  const b=parts.base;
  box(4.48,.42,8.45,0,.50,0,baseMat,b);
  box(3.45,.13,7.87,0,.78,0,char,b);
  box(4.80,.21,2.32,0,.245,.2,clampMat,b);
  for(const x of [-1.88,1.88])for(const z of [-3.51,3.51]){
    box(.57,.37,.86,x,.2,z,char,b);screw(x,.76,z,b);
  }
  for(const z of [-3.98,3.98]){
    box(4.40,.58,.48,0,1.04,z,baseMat,b);
    box(1.16,.19,.28,0,.83,z,clampMat,b);
  }
  for(const x of [-2.13,2.13]){
    box(.18,.59,7.32,x,1.04,0,baseMat,b);
    for(let i=0;i<10;i++) box(.16,.30,.10,x,1.34,-3.24+i*.72,char,b);
  }
  for(const x of [-1.03,1.03])box(.44,.82,4.31,x,1.15,0,char,b);

  const core=parts.armature;
  for(const x of [-.83,.83]){
    box(.44,.59,3.77,x,1.33,0,darkSteel,core);
    for(let i=0;i<7;i++)box(.458,.028,3.81,x,1.07+i*.081,0,clampMat,core);
  }
  box(1.71,.4,3.75,0,1.32,0,darkSteel,core);
  for(const z of [-1.28,1.28])box(1.68,1.34,.47,0,2.08,z,darkSteel,core);
  const movingCore=new T.Group();core.add(movingCore);
  box(1.50,.37,3.27,0,3.38,0,darkSteel,movingCore);
  box(.50,.19,3.04,0,3.63,0,clampMat,movingCore);
  for(const z of [-1.19,1.19])screw(0,3.73,z,movingCore);
  const c=parts.coil;
  box(2.46,.19,2.79,0,1.705,0,char,c);
  box(2.46,.17,2.79,0,2.95,0,char,c);
  const coilPath=new T.CatmullRomCurve3([[.99,0,-1.12],[1.15,0,-1.04],[1.15,0,1.04],[.99,0,1.12],[-.99,0,1.12],[-1.15,0,1.04],[-1.15,0,-1.04],[-.99,0,-1.12]].map(([x,y,z])=>new T.Vector3(x,y,z)),true,"centripetal");
  const turn=new T.TubeGeometry(coilPath,48,.04,6,true);
  for(let i=0;i<13;i++)mesh(turn,copper,0,1.83+i*.081,0,c);
  for(const x of [-1.10,1.10]){
    const start=new T.Vector3(x,1.92,1.05);
    const route=new T.CatmullRomCurve3([start,new T.Vector3(x*1.37,1.58,1.9),new T.Vector3(x*1.50,1.43,2.5),new T.Vector3(x*1.50,1.67,3.13)]);
    mesh(new T.TubeGeometry(route,25,.057,8),accent,0,0,0,c);
    box(.39,.31,.52,x*1.5,1.59,3.08,brass,c);screw(x*1.50,1.80,3.08,c);
  }
  const springGeometry = (length)=>{
    class Helix extends T.Curve {
      getPoint(t,res=new T.Vector3()){return res.set(.23*Math.cos(t*12*Math.PI),t*length,.23*Math.sin(t*12*Math.PI));}
    }
    return new T.TubeGeometry(new Helix(),72,.044,7,false);
  };
  const springRig=parts.return;
  const springGeo=springGeometry(1.56);
  const springs=[];
  for(const x of [-1.31,1.31]){
    box(.63,.23,.63,x,1.69,0,char,springRig);
    mesh(new T.CylinderGeometry(.112,.112,1.87,16),bolts,x,2.735,0,springRig);
    springs.push(mesh(springGeo,pad,x,1.80,0,springRig));
    mesh(new T.CylinderGeometry(.29,.29,.14,24),clampMat,x,1.89,0,springRig);
  }

  const con=parts.contact;
  const moving=new T.Group();con.add(moving);
  box(3.79,.33,.49,0,3.75,0,char,moving);
  for(const [i,x] of [-1.26,0,1.26].entries()){
    box(.60,.16,4.73,x,4.12,0,brass,moving);
    box(.49,.22,.45,x,3.97,-2.21,pad,moving);
    box(.49,.22,.45,x,3.97,2.21,pad,moving);
    box(.39,.43,.42,x,3.83,0,char,moving);
    for(const [j,z] of [-2.34,2.34].entries()){
      box(.78,.40,1.19,x,3.38,z,char,con);
      box(.55,.14,1.49,x,3.68,z+.18*Math.sign(z),brass,con);
      box(.49,.19,.45,x,3.79,z-.13*Math.sign(z),pad,con);
      screw(x,3.77,z+.53*Math.sign(z),con);
      txt((j===0 ? ["1/L1","3/L2","5/L3"] : ["2/T1","4/T2","6/T3"])[i],"#363c3e","#ffffff",x,3.616,z+.48*Math.sign(z),.65,.26,con);
    }
  }

  const sh=parts.shell;
  box(4.48,.22,7.18,0,6.05,0,lidMat,sh);
  box(4.50,.46,4.78,0,6.30,0,white,sh);
  box(4.00,.10,4.36,0,6.578,0,ceramic,sh);
  box(2.31,.084,1.92,0,6.667,.43,white,sh);
  txt("CONTACTOR / 3 NO","#c3c8c1","#253235",0,6.713,-.04,2.67,.56,sh);
  txt("24 V   DC","#c3c8c1","#8b412e",0,6.713,.63,1.56,.38,sh);
  for(const x of [-2.14,2.14]){
    box(.19,2.63,7.11,x,4.87,0,white,sh);
    box(.21,.36,5.57,x,3.59,0,char,sh);
    for(const z of [-1.5,-1,-.5,0,.5,1,1.5])box(.096,.108,.23,x*.99,5.91,z,clampMat,sh);
    for(const z of [-3.04,3.04])box(.25,.45,.33,x,5.96,z,baseMat,sh);
  }
  for(const z of [-3.26,3.26]){
    box(4.41,.34,1.30,0,5.75,z,baseMat,sh);
    for(const [i,x] of [-1.26,0,1.26].entries()){
      box(.88,.18,.88,x,5.96,z,char,sh);
      screw(x,6.115,z,sh);
      txt(String(z<0?i*2+1:i*2+2),"#27333b","#d1d7d0",x,6.061,z+.29,.28,.18,sh);
    }
  }
  for(const x of [-1.82,1.82])for(const z of [-1.93,1.93]) screw(x,6.65,z,sh);
  const LED=makeMat(0xa53122,.37);
  const tab=box(.56,.11,.88,0,6.713,1.48,LED,sh);
  box(.88,.07,1.03,0,6.647,1.48,char,sh);

  const btn=(id)=>document.getElementById(id);
  const setPower=(v)=>{
    if(state.exploded&&v)state.exploded=false;
    state.power=v;state.auto=false;updateLabels();
  };
  function updateLabels(){
    btn("power").setAttribute("aria-pressed",String(state.power));
    btn("power").textContent=state.power?"切断线圈电源":"给线圈通电";
    btn("peek").setAttribute("aria-pressed",String(state.cut));
    btn("peek").textContent=state.cut?"合上外壳":"开盖";
    btn("spread").setAttribute("aria-pressed",String(state.exploded));
    btn("spread").textContent=state.exploded?"重新组装":"爆炸视图";
    btn("tour").setAttribute("aria-pressed",String(state.auto));
    btn("tour").textContent=state.auto?"停止导览":"播放导览";
    for(const b of app.querySelectorAll("[data-part]")) b.setAttribute("aria-pressed",String(b.dataset.part===state.part));
    btn("note").textContent=controls.find(([id])=>id===state.part)[2];
  }
  btn("power").addEventListener("click",()=>setPower(!state.power));
  btn("peek").addEventListener("click",()=>{state.auto=false;state.cut=!state.cut;state.part="all";updateLabels();});
  btn("spread").addEventListener("click",()=>{state.auto=false;state.exploded=!state.exploded;state.power=false;state.part="all";updateLabels();});
  let clock=0;
  btn("tour").addEventListener("click",()=>{state.auto=!state.auto;clock=0;state.part="all";updateLabels();});
  for(const button of app.querySelectorAll("[data-part]"))button.addEventListener("click",()=>{
    state.auto=false;state.part=button.dataset.part;
    if(state.part!=="all"){state.power=false;state.exploded=true;}
    updateLabels();
  });
  let down=null;
  canvas.addEventListener("pointerdown",(e)=>{down=[e.clientX,e.clientY];state.auto=false;updateLabels();canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener("pointermove",(e)=>{
    if(!down)return;
    cameraPose.angle-=(e.clientX-down[0])*.008;
    cameraPose.elevation=T.MathUtils.clamp(cameraPose.elevation+(e.clientY-down[1])*.006,.17,1.25);
    down=[e.clientX,e.clientY];
  });
  for(const event of ["pointerup","pointercancel"])canvas.addEventListener(event,()=>{down=null;});
  canvas.addEventListener("wheel",(e)=>{
    e.preventDefault();state.auto=false;updateLabels();
    cameraPose.distance=T.MathUtils.clamp(cameraPose.distance+e.deltaY*.013,15.5,39);
  },{passive:false});
  function resize(){
    const {width,height}=stage.getBoundingClientRect();
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  function cameraAt(az,el,d,y){
    target.set(0,y,0);
    camera.position.set(d*Math.sin(az)*Math.cos(el),y+d*Math.sin(el),d*Math.cos(az)*Math.cos(el));
    camera.lookAt(target);
  }
  const beats=[
    [0,false,false,false,"all"],
    [3,false,true,false,"all"],
    [7,true,true,false,"contact"],
    [10,false,true,false,"return"],
    [13,false,false,true,"all"],
    [17,false,false,true,"coil"],
    [20,false,false,false,"all"]
  ];
  function tour(t){
    const phase=beats.findLast(b=>t>=b[0]);
    if(!phase)return;
    [state.power,state.cut,state.exploded,state.part]=phase.slice(1);
    updateLabels();
  }
  function draw(now,record=false){
    const previousTime=state.now??now;
    const dt=Math.min(.05,Math.max(0,now-previousTime));
    state.now=now;
    if(record){tour(now);cameraPose.angle=.52+Math.sin(now*.18)*.26;}
    else if(state.auto){clock=(clock+dt)%22;tour(clock);}
    const ease=(x,target,tau)=>record||reduce.matches?target:x+(target-x)*(1-Math.exp(-dt/tau));
    state.explode=ease(state.explode,+state.exploded,.22);
    state.opening=ease(state.opening,+state.cut,.19);
    state.travel=ease(state.travel,state.power&&state.explode<.02 ? .23 : 0,.065);
    pose.closed=state.travel>.226;
    pose.stroke=state.travel*10;
    movingCore.position.y=-state.travel;
    moving.position.y=-state.travel;
    for(const spring of springs)spring.scale.y=1-state.travel/1.56;
    copper.emissive.setHex(state.power?0x4f1404:0x000000);copper.emissiveIntensity=state.power?.45:0;
    tab.material.emissive.setHex(pose.closed?0xd94f23:0x0c0101);tab.material.emissiveIntensity=pose.closed?.60:.06;
    for(const [id,part] of Object.entries(parts)){
      const offset=offsets[id].map(v=>v*state.explode);
      part.position.set(...offset);
      if(id==="shell"){part.position.y+=state.opening*.25;part.position.z-=state.opening*5.2;}
      part.visible=state.part==="all"||id===state.part||(state.explode<.4&&(state.auto||record))||id==="base";
    }
    btn("status").textContent=pose.closed?"三极已闭合":"三极已断开";
    btn("supply").textContent=state.power?"24 V":"0 V";
    btn("travel").textContent=pose.stroke.toFixed(1)+" mm";
    const mobile=camera.aspect<.9;
    cameraAt(cameraPose.angle,cameraPose.elevation,cameraPose.distance+(mobile?8:0)+state.explode*(mobile?10:7.4),3.4+state.explode*1.85);
    renderer.render(scene,camera);
  }
  resize();
  new ResizeObserver(resize).observe(stage);
  window.machineEvidence={state,pose};
  if(!capture){
    const loop=(milliseconds)=>{draw(milliseconds/1000);requestAnimationFrame(loop);};
    requestAnimationFrame(loop);
  }
  return {resize,render:(t)=>draw(t,true),warm:()=>renderer.compileAsync(scene,camera)};
}).catch((e)=>{
  const fallback=document.createElement("p");
  fallback.className="fallback";
  fallback.textContent="此浏览器暂时无法启用 WebGL。可开启图形加速后重新打开本页。";
  document.querySelector(".stage")?.append(fallback);
  console.error(e);
});
