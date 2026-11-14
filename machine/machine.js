import {Lab, MAT, GEO, THREE, approach} from "machine-kit";

// DSBC-32-100-PPVA-N3 case study. Bore 32 mm, stroke 100 mm, 6 bar advance
// force 483 N, retract 415 N. Nominal Ø12 mm rod verified by Festo catalog
// and the differential area. Teaching sections and mount are simplified.
// Assembly from bench up: stand/feet, profiles/end caps, supply fittings,
// piston cup + seals, grounded rod bearing and chrome rod, tip and lock nut.
const stroke = .100;
const bore = .032;
const rod = .012;
const areaPiston = Math.PI * bore * bore / 4;
const areaRod = Math.PI * rod * rod / 4;
const diameter = .047;
const span = .149;
const axis = .079;
const alongX = [0,0,-Math.PI/2];
const orange = MAT.anodised({color:[.89,.27,.055],roughness:.39});
const alu = MAT.aluminium({roughness:.43,finish:"brushed"});
const cast = MAT.aluminium({roughness:.50,finish:"cast",color:[.47,.5,.52]});
const dark = MAT.steelDark({roughness:.46});
const bearing = MAT.brass({roughness:.50});
const stem = MAT.chrome({roughness:.19});
const seal = MAT.rubber();
const fitting = MAT.brass({roughness:.36});
const blue = MAT.paint({color:[.026,.24,.44],roughness:.37});
const fixture = MAT.paint({color:[.078,.12,.152],roughness:.52});
const word = matchMedia("(max-width: 760px)").matches;
const lab = new Lab({
  prompt:"分拣工位 · 双作用气缸的两个受力面",
  pills:["交互仿真","施工台模型"],no:32,
  title:"一只气缸，两种力",sub:"活塞杆怎样改变受力面积",
  view:{az:26,el:20,dist:word?3.8:2.66,target:[.014,word?.033:.077,0],frameX:word?0:-.17,fov:34},
  cut:{a:[0,0,1],b:[0,1,0],center:[0,axis,0],reach:.30},
  size:.32
});
if (word || new URLSearchParams(location.search).has("fast")) { lab.ao.enabled=false; lab.bloom.enabled=false; }
const bar = (name,dims,pos,mat,extra={}) => {
  const [w,h,d]=dims;
  return lab.mesh(GEO.rbox(w,h,d,Math.min(w,h,d)*.16),mat,{name,pos,...extra});
};
const tube = (name,out,inside,len,x,mat,extra={}) =>
  lab.mesh(GEO.tube(out,inside,len,72),mat,{name,pos:[x,axis,0],rot:alongX,...extra});
const disc = (name,r,len,x,mat,extra={}) =>
  lab.mesh(GEO.disc(r,len,Math.min(r,len)*.08,64),mat,{name,pos:[x,axis,0],rot:alongX,...extra});

bar("台面",[.290,.011,.112],[.012,.0055,0],fixture);
for(const x of [-.097,.122]) for(const z of [-.042,.042]){
  bar("防滑脚",[.024,.009,.023],[x,.002,z],seal);
  bar("脚座",[.030,.008,.025],[x,.014,z],dark);
}
for(const x of [-.056,.059]){
  bar("托架立座",[.018,.046,.065],[x,.034,0],fixture);
  bar("安装鞍座",[.023,.014,.062],[x,.060,0],dark);
  for(const z of [-.023,.023]) lab.mesh(GEO.disc(.0035,.003,.00024,12),stem,{name:"固定螺钉",pos:[x,.068,z]});
}
tube("铝制气缸筒",.021,.016,span,0,alu,{explode:[0,.064,-.032],xray:"shell",label:"缸筒",at:[0,.041,.010]});
for(const ySign of [-1,1]){
  for(const zSign of [-1,1]){
    const dy=ySign*.017, z=zSign*.017;
    bar("铝型材加强边",[span,.0105,.0105],[0,axis+dy,z],cast,{explode:[0,.064,-.032],xray:"shell"});
    bar("外侧传感器槽",[.143,.0032,.002],[0,axis+dy,z+zSign*.0052],dark,{explode:[0,.064,-.032],xray:"shell"});
  }
}
bar("接触式磁性开关座",[.022,.008,.011],[-.025,axis+.023,-.008],blue,{explode:[-.012,.082,-.035],xray:"shell"});
for(const x of [-.086,.086]){
  const end = Math.sign(x);
  const offset = [end*.055,0,0];
  if(end<0){
    bar("后端盖",[.019,diameter,diameter],[x,axis,0],cast,{explode:offset,xray:"shell"});
  }else{
    tube("有杆端法兰",.031,.0062,.020,x,cast,{explode:offset,xray:"shell"});
    tube("杆端铜衬套",.010,.00615,.015,x+.009,bearing,{explode:[.071,0,0]});
    tube("防尘圈",.0082,.0060,.004,x+.017,seal,{explode:[.077,0,0]});
  }
  for(const y of [-.017,.017]) for(const z of [-.017,.017]) {
    lab.mesh(new THREE.CylinderGeometry(.0038,.0038,.006,6),stem,{
      name:"端盖六角紧固件",pos:[x+end*.012,axis+y,z],rot:alongX,
      explode:[end*.058,0,0]
    });
  }
  lab.mesh(GEO.tube(.0049,.0027,.008,40),dark,{name:"G1/8 进排气口",pos:[x,axis+.025,0],explode:[end*.057,.009,0]});
  lab.mesh(new THREE.CylinderGeometry(.0059,.0059,.005,6),fitting,{
    name:"气口六角接头",pos:[x,axis+.031,0],explode:[end*.057,.014,0]
  });
  lab.mesh(GEO.tube(.005,.003,.004,40),blue,{name:"快插释放环",pos:[x,axis+.035,0],explode:[end*.057,.018,0]});
}
const piston = disc("活塞",.0158,.012,-.054,orange,{explode:[-.025,-.018,.061],label:"活塞",value:()=>((sim.x*1000).toFixed(1)+" mm")});
const rings=[-.0045,.0045].map((i)=>tube("活塞密封",.016,.0138,.002,-.054+i,seal,{explode:[-.025,-.018,.061]}));
const shaft = disc("镀铬活塞杆",.006,.185,.040,stem,{explode:[.027,.001,.057],label:"活塞杆",value:()=>"Ø12 mm"});
const nut = lab.mesh(new THREE.CylinderGeometry(.009,.009,.005,6),dark,{
  name:"活塞杆锁紧螺母",pos:[.135,axis,0],rot:alongX,explode:[.050,.002,.068]
});
const threaded = disc("外螺纹接头",.0048,.019,.146,stem,{explode:[.057,.002,.071]});
for(let i=0;i<6;i++){
  const ring=tube("螺纹牙",.0049,.0045,.0007,.138+i*.0021,dark,{explode:[.057,.002,.071]});
  ring.userData.strokeX=.138+i*.0021;
}
const threadedRings=lab.parts.map(({obj})=>obj).filter(o=>o.userData.strokeX!=null);

const markers = new THREE.Group();
const chamberAxis = axis + .009;
const streaks=[];
for(let i=0;i<24;i++){
  const mat = new THREE.MeshBasicMaterial({color:0x168aaf,transparent:true,opacity:.65});
  const point = new THREE.Mesh(new THREE.SphereGeometry(.0014,9,7),mat);
  markers.add(point);
  streaks.push(point);
}
lab.machine.add(markers);
lab.hero({label:"理论可用推力",unit:"N",max:970});
const cmd=lab.slider({
  id:"pressure",label:"供气表压",min:1,max:12,step:.1,value:6,digits:1,unit:"bar",
  ends:["1 bar","12 bar"]
});
const direction=document.createElement("div");
direction.className="lab-direction on";
direction.innerHTML='<button data-direction="extend">伸出 A → B</button><button data-direction="retract">缩回 B → A</button>';
lab.$(".lab-ctls").append(direction);
direction.querySelectorAll("button").forEach((button)=>{
  button.addEventListener("click",()=>{sim.forward=button.dataset.direction==="extend";});
});
lab.$('.lab-ctl input').setAttribute("aria-label","供气表压");
const sim={forward:true,leak:0,x:.010,force:0};
lab.breakIt({label:"模拟窜气"});
lab.onTick((dt)=>{
  const supply=cmd.value*1e5;
  sim.leak = approach(sim.leak,lab.broken?0.6:0,.35,dt);
  const back=supply*sim.leak;
  const effectiveRodEnd=areaPiston-areaRod;
  const advance = supply*areaPiston-back*effectiveRodEnd;
  const returnForce = supply*effectiveRodEnd-back*areaPiston;
  sim.force=sim.forward?advance:returnForce;
  const desired=sim.forward?stroke:0;
  sim.x=approach(sim.x,desired,1.05/(.65+Math.max(0,sim.force)/460),dt);
  lab.place(piston,-.054+sim.x,axis,0);
  rings.forEach((o,i)=>lab.place(o,-.054+sim.x+(i===0?-.0045:.0045),axis,0));
  for(const [o,x] of [[shaft,.040],[nut,.135],[threaded,.146],...threadedRings.map(o=>[o,o.userData.strokeX])]){
    lab.place(o,x+sim.x,axis,0);
  }
  const active = sim.forward?"伸出 · 无杆腔进气":"缩回 · 有杆腔进气";
  lab.setHero(sim.force,{
    state:lab.broken?"密封窜气 · 背压升高":active,bad:lab.broken,
    sub:`6 bar 规格 483 / 415 N<br>本刻伸出 ${Math.round(advance)} N · 缩回 ${Math.round(returnForce)} N<br>行程 ${(sim.x*1000).toFixed(1)} / 100 mm`
  });
  for(const b of direction.querySelectorAll("button")) b.setAttribute("aria-pressed",String((b.dataset.direction==="extend")===sim.forward));
  markers.visible=lab.state.explode<.2&&(lab.state.cut>.20||lab.state.xray>.2);
  if(markers.visible){
    const pistonX=-.054+sim.x;
    for(const [i,point] of streaks.entries()){
      const phase=(i*.193+lab.time*(.32+cmd.value*.027))%1;
      point.position.set(sim.forward ? -.069 + (pistonX+.069)*phase : .071 - (.071-pistonX)*phase,
        chamberAxis + Math.sin(i*2.7)*.004, .004+Math.cos(i*1.9)*.004);
      point.material.opacity=(.20+.6*Math.sin(Math.PI*phase))*(lab.broken?.60:1);
    }
  }
});
lab.how('Festo DSBC-32-100-PPVA-N3，Ø32 mm 缸径、Ø12 mm 活塞杆、100 mm 行程。6 bar 规格为伸出 483 N、缩回 415 N。内部零件和时间响应为教学简化。窜气示例把排气侧表压提高到供气的 60%，忽略摩擦、泄漏流量曲线与动态负载。<br><a href="https://ftp.festo.com/Public/PNEUMATIC/SOFTWARE_SERVICE/DataSheet/1376426.html" target="_blank" rel="noreferrer">查阅 Festo 数据表</a>',[
  "A活塞 = π D² / 4                 A有杆 = π (D² − d²) / 4",
  "F伸 = p供 A活塞 − p背 A有杆     F缩 = p供 A有杆 − p背 A活塞"
]);
lab.$(".lab-how summary").textContent="受力怎么算";
lab.autoFilm({
  runBeat:"同为 6 bar，推动的面积不同。",runSub:"伸出用整个活塞面，缩回扣掉杆截面。",
  sliderTo:5/11,breakBeat:"密封窜气会让两腔互相抵消。",breakSub:"背压升高，表上剩下的是净力。",
  breakCut:true
});
const entrance=document.createElement("a");
entrance.className="machine-home";entrance.href="../index.html";entrance.textContent="‹ 科普动画实测";
if(!lab.filmMode) document.body.append(entrance);
lab.start();
const localized={run:"暂停",explode:"爆炸",cut:"剖切",xray:"透视",slow:"慢放",labels:"零件标签"};
for(const [key,label] of Object.entries(localized)) {
  const button=lab.$(`button[data-k="${key}"]`);
  button.firstChild.textContent=label;
  button.setAttribute("aria-label",label);
}
lab.$('button[data-k="run"]').addEventListener("click",()=>{
  lab.$('button[data-k="run"]').firstChild.textContent=lab.paused?"播放":"暂停";
});
window.machineEvidence={sim,cmd,areaPiston,areaRod};
