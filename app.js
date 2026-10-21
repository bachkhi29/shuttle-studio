'use strict';
const C=Tactics,$=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let project=C.sample(),selected=-1,person=0,playing=false,preview=false,elapsed=0,last=0,history=[],redo=[],drag=null,toastTimer,liveEdit=null,touchOrbit=false,receiverChoice=null,repeatPhase=null,designReady=false;
const colors=['#f7a8bc','#92d7bf','#e67fa1','#4ab8ac'],storeKey='shuttle-studio-v2';
try{const raw=localStorage.getItem(storeKey)||localStorage.getItem('shuttle-studio-v1');if(raw)project=C.validate(JSON.parse(raw));}catch(e){setTimeout(()=>toast('Bản tự lưu không hợp lệ; đã mở mẫu.'),200);}
const canvas=$('#court'),ctx=canvas.getContext('2d');
let W=800,H=500,DPR=1,zoom=1,cam={az:0,el:1.04,scale:35},items=[],hits=[],lastFrameIndex=-2;
const v=(x,y,z)=>({x,y,z}),mix=(a,b,t)=>a+(b-a)*t;
const total=()=>C.stepTime(project,project.steps.length),frameAt=t=>C.frameAt(project,t);
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',3200);}
function backup(){try{localStorage.setItem(storeKey,JSON.stringify(project));$('#saveStatus').textContent='Đã tự lưu';}catch(e){$('#saveStatus').textContent='Hãy lưu ra file';}}
function checkpoint(){history.push(C.clone(project));if(history.length>60)history.shift();redo=[];}
function selectForEdit(i=selected){playing=false;preview=false;selected=C.clamp(i,-1,project.steps.length-1);elapsed=selected<0?0:C.stepTime(project,selected);receiverChoice=null;repeatPhase=null;lastFrameIndex=-2;}
function currentEdit(){if(preview)selectForEdit(frameAt(elapsed).i);else selectForEdit(selected);}
function edit(fn){commitLive();currentEdit();checkpoint();fn();C.normalize(project);backup();ui();}
function commitLive(){if(liveEdit!==null){liveEdit=null;C.normalize(project);backup();}}
function pose(){if(preview&&project.steps.length){const f=frameAt(elapsed),a=C.start(project,f.i),b=project.steps[f.i].end,t=f.t*f.t*(3-2*f.t);return a.map((p,i)=>({x:mix(p.x,b[i].x,t),z:mix(p.z,b[i].z,t)}));}return selected<0?project.initial:project.steps[selected].end;}
function setView(name){if(name==='top'){cam.az=0;cam.el=Math.PI/2-.001;}else if(name==='back'){cam.az=0;cam.el=1.04;}else{cam.az=.38;cam.el=.83;}zoom=1;resize();$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
function resize(){const r=canvas.getBoundingClientRect();W=r.width||800;H=r.height||500;DPR=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
 // One scale for both axes: never stretch the court when panels change size.
 const extentX=Math.abs(Math.cos(cam.az))*9.5+Math.abs(Math.sin(cam.az))*16.2,extentZ=Math.abs(Math.sin(cam.az))*9.5+Math.abs(Math.cos(cam.az))*16.2;
 cam.scale=Math.min((W-55)/extentX,(H-55)/(extentZ*Math.sin(cam.el)+5*Math.cos(cam.el)))*zoom;cam.scale=Math.max(5,cam.scale);
}
function option(select,ids,current,mark){select.replaceChildren();for(const i of ids){const o=document.createElement('option');o.value=i;o.textContent=C.displayName(project,i)+(mark===i?' · gần nhất':'');select.append(o);}select.value=String(current);}
function choices(){if(selected<0)return;const s=project.steps[selected],near=C.receiver(project,selected),ids=C.active(project).filter(i=>C.side(i)!==C.side(s.hitter));if(!ids.includes(receiverChoice))receiverChoice=near;option($('#receiverSelect'),ids,receiverChoice,near);$('#receiver').textContent='Đưa '+C.displayName(project,receiverChoice)+' tới điểm cầu';}
function numbers(){const p=(selected<0?project.initial:project.steps[selected].end)[person];$('#posX').value=p.x.toFixed(2);$('#posZ').value=p.z.toFixed(2);$('#posZ').min=C.side(person)>0?.15:-8;$('#posZ').max=C.side(person)>0?8:-.15;if(selected>=0){const s=project.steps[selected];$('#targetX').value=s.target.x.toFixed(2);$('#targetZ').value=s.target.z.toFixed(2);}}
function warnings(){if(selected<0)return;const s=project.steps[selected],n=C.netHeight(project,selected),issues=[];
 if(n!==null&&n<1.524)issues.push('Đường cầu thấp hơn lưới. Tăng độ vồng hoặc độ cao nhận.');
 if(Math.abs(s.target.x)>(project.mode==='singles'?2.59:3.05)||Math.abs(s.target.z)>6.7)issues.push('Điểm đến ngoài biên.');
 if(['net','crossNet'].includes(s.type)&&Math.abs(C.origin(project,selected).z)>2.5)issues.push('Cầu lưới phù hợp khi điểm đánh gần lưới.');
 $('#warning').textContent=issues.join(' ')||(C.linked(project,selected)?'Đã nối đúng điểm nhận của pha trước.':'Bấm sân phía đối phương để đặt điểm cầu.');$('#warning').classList.toggle('warn',!!issues.length);
}
function timeline(){const box=$('#timeline'),scroll=box.scrollLeft;box.replaceChildren();project.steps.forEach((s,i)=>{const b=document.createElement('button');b.className='step'+(selected===i?' active':'');b.dataset.step=i;b.title='Dừng và chỉnh pha '+(i+1);const small=document.createElement('small');small.textContent='PHA '+String(i+1).padStart(2,'0')+' · '+C.stepTime(project,i).toFixed(1)+'s';const strong=document.createElement('strong');strong.textContent=C.presets[s.type].label;const sub=document.createElement('span');sub.textContent=C.displayName(project,s.hitter);b.append(small,strong,sub);b.onclick=()=>selectPhase(i);box.append(b);});box.scrollLeft=scroll;$('#initial').classList.toggle('active',selected<0);}
function syncPlayback(){const idx=preview?frameAt(elapsed).i:selected;$('#stepBadge').textContent=preview?(playing?'Đang phát':'Tạm dừng')+' · Pha '+(idx+1):selected<0?'Đội hình ban đầu':'Đang chỉnh · Pha '+(selected+1);$('#editorState').textContent=preview?(playing?'Đang phát':'Tạm dừng'):'Đang chỉnh';$('#editCurrent').hidden=!preview;$('#play').textContent=playing?'❚❚ Dừng':'▶ Phát';$('#clock').textContent=elapsed.toFixed(1)+' / '+total().toFixed(1)+'s';$('#scrub').value=total()?Math.round(elapsed/total()*1000):0;
 for(const b of $$('.step')){b.classList.toggle('playing',preview&&+b.dataset.step===idx);b.classList.toggle('active',+b.dataset.step===idx);}
}
function ui(){
 if(!C.active(project).includes(person))person=0;
 $('#projectTitle').value=project.title;$('#mode').value=project.mode;$('#modeBadge').textContent=project.mode==='singles'?'Đơn · 5,18 × 13,4 m':'Đôi · 6,10 × 13,4 m';$('#editorTitle').textContent=selected<0?'Đội hình ban đầu':'Pha '+(selected+1);
 const box=$('#players');box.replaceChildren();for(const i of C.active(project)){const row=document.createElement('div');row.className='player';const dot=document.createElement('span');dot.className='dot';dot.style.background=colors[i];const input=document.createElement('input');input.maxLength=30;input.value=project.names[i];input.placeholder=C.playerCode(i);input.setAttribute('aria-label','Tên người '+(i+1));input.onchange=()=>edit(()=>project.names[i]=input.value.trim());row.append(dot,input);box.append(row);}
 option($('#selectedPlayer'),C.active(project),person);$('#initialEditor').hidden=selected>=0;$('#stepEditor').hidden=selected<0;$('#targetFields').hidden=selected<0;
 $('#positionHelp').textContent=selected<0?'Vị trí ban đầu. Mỗi đội được giữ ở nửa sân của mình.':'Vị trí cuối pha. Người đánh pha tiếp theo đứng tại điểm nhận cầu.';
 if(selected>=0){const s=project.steps[selected];const ids=C.linked(project,selected)?C.active(project).filter(i=>C.side(i)!==C.side(project.steps[selected-1].hitter)):C.active(project);option($('#hitter'),ids,s.hitter);$('#shotType').value=s.type;$('#height').value=s.height;$('#heightVal').textContent=s.height.toFixed(2)+' m';$('#peak').value=s.peak??.5;$('#peakVal').textContent=Math.round((s.peak??.5)*100)+'%';$('#duration').value=s.duration;$('#landing').checked=s.landing;$('#breakBefore').checked=s.breakBefore;$('#endHeight').value=s.endHeight;$('#note').value=s.note;$('#shotHint').textContent=['net','crossNet'].includes(s.type)?'Vòng cung ngắn, gần lưới. Kéo điểm cầu để chỉnh vị trí nhận.':C.linked(project,selected)?'Điểm đánh tiếp nối cầu của pha trước.':'Điểm xuất phát tại người đang đánh.';choices();warnings();}
 numbers();timeline();$('#undo').disabled=!history.length;$('#redo').disabled=!redo.length;$('#play').disabled=!project.steps.length;$('#scrub').disabled=!project.steps.length;$('#prevPhase').disabled=selected<0;$('#nextPhase').disabled=selected>=project.steps.length-1;$('#repeatPhase').disabled=!project.steps.length;$('#phaseCount').textContent=project.steps.length+' PHA';$('#add').disabled=project.steps.length>=150;$('#duplicate').disabled=project.steps.length>=150;syncPlayback();if(designReady)renderDesigner();
}
function selectPhase(i){commitLive();selectForEdit(i);ui();const card=$('.step[data-step="'+i+'"]');if(card?.scrollIntoView)card.scrollIntoView({block:'nearest',inline:'nearest'});}
function playFrom(i){commitLive();selected=i;elapsed=C.stepTime(project,i);preview=true;playing=true;repeatPhase=$('#repeatPhase').checked?i:null;last=performance.now();receiverChoice=null;ui();}
function play(){commitLive();if(!project.steps.length)return;if(playing){playing=false;}else{if($('#repeatPhase').checked){repeatPhase=Math.max(0,selected);const start=C.stepTime(project,repeatPhase),end=start+project.steps[repeatPhase].duration;if(elapsed<start||elapsed>=end)elapsed=start;}else{repeatPhase=null;if(elapsed>=total())elapsed=selected>=0?C.stepTime(project,selected):0;}preview=true;playing=true;last=performance.now();}syncPlayback();}
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
const safeName=()=> (project.title.replace(/[^\p{L}\p{N}\-_ ]/gu,'').trim()||'chien-thuat').slice(0,80);
function loadProject(p){commitLive();checkpoint();project=p;selectForEdit(-1);person=0;backup();ui();}
function hideProject(){if($('#projectDialog').open)$('#projectDialog').close();}
$('#projectTitle').onchange=e=>edit(()=>project.title=e.target.value.trim()||'Chiến thuật của tôi');
$('#mode').onchange=e=>{const value=e.target.value;edit(()=>{project.mode=value;if(value==='singles')project.steps.forEach(s=>s.hitter%=2);});};
function addShot(){edit(()=>{if(project.steps.length<150){project.steps.push(C.add(project));selected=project.steps.length-1;person=project.steps[selected].hitter;elapsed=C.stepTime(project,selected);}});$('#timeline').scrollLeft=$('#timeline').scrollWidth;}
$('#add').onclick=addShot;$('#firstAdd').onclick=addShot;
$('#duplicate').onclick=()=>edit(()=>{if(selected>=0&&project.steps.length<150){project.steps.splice(selected+1,0,C.clone(project.steps[selected]));selected++;}});
$('#remove').onclick=()=>{if(selected>=0)edit(()=>{project.steps.splice(selected,1);selected=Math.min(selected,project.steps.length-1);});};
$('#undo').onclick=()=>{commitLive();if(history.length){redo.push(C.clone(project));project=history.pop();selectForEdit(Math.min(selected,project.steps.length-1));backup();ui();}};
$('#redo').onclick=()=>{commitLive();if(redo.length){history.push(C.clone(project));project=redo.pop();selectForEdit(Math.min(selected,project.steps.length-1));backup();ui();}};
for(const [id,mode] of [['sampleSingles','singles'],['sampleDoubles','doubles']])$('#'+id).onclick=()=>{if(confirm('Mở chiến thuật mẫu? Có thể Hoàn tác để quay lại.')){loadProject(C.sample(mode));hideProject();}};
$('#new').onclick=()=>{if(confirm('Tạo bảng trống? Có thể Hoàn tác để quay lại.')){loadProject(C.base());hideProject();}};
$('#save').onclick=()=>{commitLive();download(JSON.stringify(project,null,2),safeName()+'.json','application/json');toast('Đã tạo file JSON để lưu hoặc chia sẻ.');};
$('#open').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2e6)throw Error('Giới hạn file 2 MB.');const raw=JSON.parse(await f.text()),p=C.validate(raw);if(confirm('Mở file chiến thuật? Có thể Hoàn tác để quay lại.')){loadProject(p);toast(raw.version===1?'Đã mở file 1.0, nối đường cầu và đưa người về đúng nửa sân.':'Đã mở chiến thuật.');}}catch(err){toast('Không mở được: '+err.message);}e.target.value='';};
$('#help').onclick=()=>$('#guide').showModal();$('#projectButton').onclick=()=>$('#projectDialog').showModal();$$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
$('#initial').onclick=()=>{commitLive();selectForEdit(-1);ui();};$('#editCurrent').onclick=()=>{currentEdit();ui();};
$('#selectedPlayer').onchange=e=>{person=+e.target.value;numbers();};
function setPlayer(i,p){const point=C.onSide(p,i);if(selected<0)project.initial[i]=point;else{const s=project.steps[selected];s.end[i]=point;if(selected<project.steps.length-1&&C.linked(project,selected+1)&&project.steps[selected+1].hitter===i){s.target=C.targetOnSide(point,s.hitter);toast('Đã dịch cả điểm nhận cầu để giữ liên kết với pha sau.');}}}
for(const axis of ['X','Z'])$('#pos'+axis).onchange=e=>{const val=Number(e.target.value);if(!e.target.value||!Number.isFinite(val)){numbers();return;}edit(()=>{const p=C.clone((selected<0?project.initial:project.steps[selected].end)[person]);p[axis.toLowerCase()]=val;setPlayer(person,p);});};
function setTarget(p){const s=project.steps[selected];s.target=C.targetOnSide(p,s.hitter);receiverChoice=null;C.normalize(project);}
for(const axis of ['X','Z'])$('#target'+axis).onchange=e=>{const val=Number(e.target.value);if(selected<0||!e.target.value||!Number.isFinite(val)){numbers();return;}edit(()=>{const p=C.clone(project.steps[selected].target);p[axis.toLowerCase()]=val;setTarget(p);});};
$('#hitter').onchange=e=>{const i=+e.target.value;edit(()=>{project.steps[selected].hitter=i;project.steps[selected].target.z=-C.side(i)*Math.abs(project.steps[selected].target.z);person=i;});};
$('#receiverSelect').onchange=e=>{receiverChoice=+e.target.value;$('#receiver').textContent='Đưa '+C.displayName(project,receiverChoice)+' tới điểm cầu';};
$('#receiver').onclick=()=>{const choice=+$('#receiverSelect').value;edit(()=>{const s=project.steps[selected],i=C.active(project).includes(choice)&&C.side(choice)!==C.side(s.hitter)?choice:C.receiver(project,selected);s.end[i]=C.onSide(s.target,i);person=i;if(selected<project.steps.length-1&&C.linked(project,selected+1))project.steps[selected+1].hitter=i;});};
$('#shotType').onchange=e=>{const type=e.target.value;edit(()=>C.applyPreset(project,selected,type));};
$('#presetTarget').onclick=()=>edit(()=>C.defaultTarget(project,selected));
$('#height').oninput=e=>{if(selected<0)return;if(liveEdit===null){currentEdit();checkpoint();liveEdit=selected;}project.steps[selected].height=Number(e.target.value);$('#heightVal').textContent=Number(e.target.value).toFixed(2)+' m';warnings();draw();};
$('#height').onchange=()=>{commitLive();ui();};$('#height').onblur=()=>{commitLive();};
$('#peak').oninput=e=>{if(selected<0)return;if(liveEdit===null){currentEdit();checkpoint();liveEdit=selected;}project.steps[selected].peak=Number(e.target.value);$('#peakVal').textContent=Math.round(Number(e.target.value)*100)+'%';warnings();draw();};
$('#peak').onchange=()=>{commitLive();ui();};$('#peak').onblur=()=>{commitLive();};
for(const [id,key,min,max] of [['duration','duration',.3,8],['endHeight','endHeight',.1,3.5]])$('#'+id).onchange=e=>{const val=Number(e.target.value);if(!e.target.value||!Number.isFinite(val)){ui();return;}edit(()=>project.steps[selected][key]=C.clamp(val,min,max));};
$('#landing').onchange=e=>{const value=e.target.checked;edit(()=>project.steps[selected].landing=value);};$('#breakBefore').onchange=e=>{const value=e.target.checked;edit(()=>project.steps[selected].breakBefore=value);};$('#note').onchange=e=>edit(()=>project.steps[selected].note=e.target.value);
for(const group of ['Thường dùng','Biến thể']){const g=document.createElement('optgroup');g.label=group;for(const [key,p] of Object.entries(C.presets)){if(p.group===group){const o=document.createElement('option');o.value=key;o.textContent=p.label;g.append(o);}}$('#shotType').append(g);}
$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#fit').onclick=()=>{zoom=1;resize();};$('#zoomIn').onclick=()=>{zoom=C.clamp(zoom*1.12,.6,2.5);resize();};$('#zoomOut').onclick=()=>{zoom=C.clamp(zoom/1.12,.6,2.5);resize();};
$('#play').onclick=play;$('#restart').onclick=()=>{if(project.steps.length)selectPhase(0);};$('#scrub').oninput=e=>{commitLive();elapsed=(+e.target.value/1000)*total();preview=true;playing=false;const f=frameAt(elapsed);selected=f.i;receiverChoice=null;ui();};
$('#touchOrbit').onclick=()=>{touchOrbit=!touchOrbit;$('#touchOrbit').classList.toggle('active',touchOrbit);$('#touchOrbit').setAttribute('aria-pressed',String(touchOrbit));};
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||$$('dialog').some(d=>d.open))return;if(e.code==='Space'){e.preventDefault();play();}if(e.key==='Escape'){currentEdit();ui();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'#redo':'#undo').click();}});
canvas.oncontextmenu=e=>e.preventDefault();canvas.onwheel=e=>{e.preventDefault();zoom=C.clamp(zoom*Math.exp(-e.deltaY*.001),.6,2.5);resize();};
function mouse(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.onpointerdown=e=>{if(![0,2].includes(e.button))return;e.preventDefault();commitLive();const m=mouse(e);canvas.setPointerCapture(e.pointerId);
 if(e.button===2||e.altKey||e.pointerType==='touch'&&touchOrbit){drag={kind:'orbit',x:m.x,y:m.y,az:cam.az,el:cam.el};canvas.style.cursor='grabbing';return;}
 // Pick the visible player before leaving playback, so the user's click stays meaningful.
 const h=hits.filter(h=>Math.hypot(m.x-h.x,m.y-h.y)<h.radius).sort((a,b)=>Math.hypot(m.x-a.x,m.y-a.y)-Math.hypot(m.x-b.x,m.y-b.y))[0];const visible=pose();
 currentEdit();ui();
 if(h){checkpoint();person=h.i;const g=C.ground(m.x,m.y,cam,W,H),p=visible[person];drag={kind:'player',offsetX:p.x-g.x,offsetZ:p.z-g.z,moved:false};$('#selectedPlayer').value=String(person);numbers();canvas.style.cursor='grabbing';}
 else{const cp=selected>=0?curveScreenPoints(selected):[];let best=null;for(const pt of cp){const dd=Math.hypot(m.x-pt.x,m.y-pt.y);if(dd<16&&(!best||dd<best.dd))best={pt,dd};}if(best){checkpoint();drag={kind:'curve',x:m.x,y:m.y,height:project.steps[selected].height,peak:project.steps[selected].peak??.5};canvas.style.cursor='grabbing';}else{drag={kind:'target',x:m.x,y:m.y};}}
};
canvas.onpointermove=e=>{if(!drag)return;const m=mouse(e);if(drag.kind==='curve'){const s=project.steps[selected];s.height=C.clamp(drag.height-(m.y-drag.y)*.02,0,7);s.peak=C.clamp(drag.peak+(m.x-drag.x)*.0035,.15,.85);syncArcInputs();warnings();return;}if(drag.kind==='orbit'){cam.az=drag.az+(m.x-drag.x)*.007;cam.el=C.clamp(drag.el+(m.y-drag.y)*.005,.28,Math.PI/2-.001);$$('[data-view]').forEach(b=>b.classList.remove('active'));resize();}else if(drag.kind==='player'){const g=C.ground(m.x,m.y,cam,W,H);setPlayer(person,{x:g.x+drag.offsetX,z:g.z+drag.offsetZ});C.normalize(project);drag.moved=true;numbers();warnings();}};
function finishPointer(e){if(!drag)return;const d=drag;drag=null;canvas.style.cursor='crosshair';if(d.kind==='player'||d.kind==='curve'){C.normalize(project);backup();ui();}else if(d.kind==='target'&&e&&Math.hypot(mouse(e).x-d.x,mouse(e).y-d.y)<6){if(selected<0){toast('Thêm một cú đánh để đặt điểm cầu.');return;}const g=C.ground(d.x,d.y,cam,W,H);if(g.z*C.side(project.steps[selected].hitter)>=0){toast('Điểm cầu đến cần nằm phía đối phương.');return;}edit(()=>setTarget(g));}}
canvas.onpointerup=finishPointer;canvas.onpointercancel=()=>{if(drag?.kind==='player'){C.normalize(project);backup();}drag=null;canvas.style.cursor='crosshair';ui();};
function proj(p){return C.project(p,cam,W,H);}
function poly(points,fill,stroke=null,width=1){const ps=points.map(proj);items.push({d:ps.reduce((a,p)=>a+p.d,0)/ps.length,draw(){ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}});}
function line(points,color,width=1,dash=[]){const ps=points.map(proj);items.push({d:ps.reduce((a,p)=>a+p.d,0)/ps.length,draw(){ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}});}
function ring(x,y,z,r,color,width=2,fill=null){const ps=[];for(let i=0;i<40;i++){const a=i*Math.PI/20;ps.push(v(x+Math.cos(a)*r,y,z+Math.sin(a)*r));}poly(ps,fill,color,width);}
function cylinder(x,z,y0,y1,r0,r1,color){for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;const pts=[v(x+Math.cos(a)*r0,y0,z+Math.sin(a)*r0),v(x+Math.cos(b)*r0,y0,z+Math.sin(b)*r0),v(x+Math.cos(b)*r1,y1,z+Math.sin(b)*r1),v(x+Math.cos(a)*r1,y1,z+Math.sin(a)*r1)];poly(pts,color);const shade=(Math.cos(a+.8)+1)*.10;poly(pts,'rgba(0,0,0,'+shade+')');}}
function sphere(x,y,z,r,color){for(let j=0;j<6;j++){const a=-Math.PI/2+j*Math.PI/6,b=a+Math.PI/6;for(let i=0;i<12;i++){const q=i*Math.PI/6,k=q+Math.PI/6,point=(lat,lon)=>v(x+r*Math.cos(lat)*Math.cos(lon),y+r*Math.sin(lat),z+r*Math.cos(lat)*Math.sin(lon));poly([point(a,q),point(a,k),point(b,k),point(b,q)],color);poly([point(a,q),point(a,k),point(b,k),point(b,q)],'rgba(0,0,0,'+((Math.cos(q+.5)+1)*.08+Math.max(0,-Math.sin(a))*.12)+')');}}}
function hairDome(p,app,lat0){const cx=p.x,cz=p.z,r=.258,hy=1.65,facing=p.z>=0?Math.PI:0,F={x:Math.sin(facing),z:Math.cos(facing)};
 for(let j=0;j<6;j++){const a=(lat0+j*(90-lat0)/6)*Math.PI/180,b=(lat0+(j+1)*(90-lat0)/6)*Math.PI/180;for(let k=0;k<12;k++){const q=k*Math.PI/6,k2=q+Math.PI/6,mid=(q+k2)/2,front=Math.cos(mid)*F.x+Math.sin(mid)*F.z;if(a<.45&&front>.3)continue;const pt=(lat,lon)=>v(cx+r*Math.cos(lat)*Math.cos(lon),hy+r*Math.sin(lat),cz+r*Math.cos(lat)*Math.sin(lon));poly([pt(a,q),pt(a,k2),pt(b,k2),pt(b,q)],app.hair);}}}
function personMesh(p,i,moving,f){const app=C.appearanceOf(project,i),hs=app.hand==='left'?-1:1,side=C.side(i),at=(x,y,z)=>v(p.x+x*side,y,p.z-z*side),stride=moving?Math.sin(f*12+i)*.16:0;
 ring(p.x,.025,p.z,.42,null,0,'#00000030');
 for(const side of [-1,1]){const hip=at(side*.13,.68,0),knee=at(side*.19,.38,side*stride+.02),ankle=at(side*.21,.12,side*stride+.08);line([hip,knee,ankle],app.skin,cam.scale*.15);line([at(side*.21,.045,side*stride),at(side*.21,.045,side*stride+.26)],'#ffffff',cam.scale*.2);line([at(side*.21,.1,side*stride),at(side*.21,.1,side*stride+.26)],app.shoes,cam.scale*.19);}
 cylinder(p.x,p.z,.62,.87,.24,.24,app.shorts);cylinder(p.x,p.z,.85,1.35,.21,.31,app.shirt);sphere(p.x,1.65,p.z,.24,app.skin);
 // Face and jersey collar make the player's forward direction unambiguous.
 for(const x of [-.075,.075]){const eye=at(x,1.68,.219);sphere(eye.x,eye.y,eye.z,.022,'#222733');}
 const nose=at(0,1.62,.24);sphere(nose.x,nose.y,nose.z,.03,app.skin);
 line([at(-.13,1.32,.23),at(0,1.22,.25),at(.13,1.32,.23)],'#ffffffb0',Math.max(1,cam.scale*.035));
 hairDome(p,app,app.hairStyle==='long'?-32:2);
 if(app.hairStyle==='spiky'){for(let k=0;k<5;k++){const a=k/5*Math.PI*2+i;cylinder(p.x+Math.cos(a)*.09,p.z+Math.sin(a)*.09,1.84,2.0,.055,.004,app.hair);}}
 if(app.hairStyle==='bun'){const bun=at(0,1.9,-.17);sphere(bun.x,bun.y,bun.z,.095,app.hair);}
 line([at(-hs*.27,1.27,0),at(-hs*.42,1.05,.15),at(-hs*.37,1.03,.36)],app.skin,cam.scale*.12);
 const hit=preview&&frameAt(elapsed).i>=0&&project.steps[frameAt(elapsed).i].hitter===i&&frameAt(elapsed).t<.22,armY=hit?1.7:1.06;
 line([at(hs*.27,1.27,0),at(hs*.44,armY,.1),at(hs*.48,armY,.44)],app.skin,cam.scale*.12);line([at(hs*.48,armY,.44),at(hs*.48,armY+.25,.7)],'#b9c8da',cam.scale*.045);
 const racket=[];for(let j=0;j<=24;j++){let a=j*Math.PI/12;racket.push(at(hs*.48+Math.cos(a)*.19,armY+.45+Math.sin(a)*.25,.77));}line(racket,app.shirt,Math.max(1.5,cam.scale*.035));for(let k=-1;k<=1;k++)line([at(hs*.48+k*.08,armY+.26,.77),at(hs*.48+k*.08,armY+.64,.77)],'#d0dfe77a',.6);
 const point=proj(v(p.x,.9,p.z));hits.push({i,x:point.x,y:point.y,radius:Math.max(18,cam.scale*.7)});
}
function drawCourt(){
 poly([v(-4.6,-.05,-7.8),v(4.6,-.05,-7.8),v(4.6,-.05,7.8),v(-4.6,-.05,7.8)],'#263b45','#3b535d');
 poly([v(-3.05,0,-6.7),v(3.05,0,-6.7),v(3.05,0,6.7),v(-3.05,0,6.7)],'#277d72');
 if(project.mode==='singles')for(const [a,b] of [[-3.05,-2.59],[2.59,3.05]])poly([v(a,.005,-6.7),v(b,.005,-6.7),v(b,.005,6.7),v(a,.005,6.7)],'#1d5e59');
 for(const [a,b] of C.courtLines())line([v(a.x,.012,a.z),v(b.x,.012,b.z)],'#e5ede4',Math.max(1,cam.scale*.04));
 // Ground center under the raised net makes the equal halves unambiguous.
 line([v(-3.05,.014,0),v(3.05,.014,0)],'#a8d9c3',1.2,[4,5]);
 if($('#dimensions').checked){for(const sign of [-1,1]){const x=-3.65,z=6.7*sign;line([v(x,.02,0),v(x,.02,z)],'#a9c4ca70',1);for(const zz of [0,z])line([v(x-.12,.02,zz),v(x+.12,.02,zz)],'#a9c4caa0',1);}}
 for(const item of items)item.draw();items=[];
 // Top view: lower opacity mesh so the center line remains legible.
 const netAlpha=cam.el>1.35?'#d9e7ef16':'#d9e7ef35';
 for(let x=-3.05;x<3.05;x+=.25){const top=1.524+.026*(x/3.05)**2;line([v(x,.76,0),v(x,top,0)],netAlpha,.65);}
 for(let y=.78;y<1.53;y+=.12)line([v(-3.05,y,0),v(3.05,y,0)],netAlpha,.65);
 const top=[];for(let k=0;k<=40;k++){const x=-3.05+6.1*k/40;top.push(v(x,1.524+.026*(x/3.05)**2,0));}line(top,'#f1eee4',2.5);
 for(const x of [-3.05,3.05])line([v(x,0,0),v(x,1.55,0)],'#dfe3d8',3);
}
function arrow(a,b,color){line([v(a.x,.04,a.z),v(b.x,.04,b.z)],color,1.5,[4,5]);const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.2)return;const ux=dx/len,uz=dz/len;line([v(b.x-ux*.3+uz*.15,.04,b.z-uz*.3-ux*.15),v(b.x,.04,b.z),v(b.x-ux*.3-uz*.15,.04,b.z-uz*.3+ux*.15)],color,1.5);}
function shotPath(i,alpha=1){const s=project.steps[i];for(let j=0;j<36;j++){const a=C.ball(project,i,j/36),b=C.ball(project,i,(j+1)/36);line([a,b],alpha===1?'#ffe8ab':'#ffdb9766',alpha===1?2.2:1.3);}ring(s.target.x,.04,s.target.z,.22,alpha===1?'#ffe5a5':'#ffe5a560',2);line([v(s.target.x,.04,s.target.z),v(s.target.x,C.endPoint(project,i).y,s.target.z)],'#ffe8ab88',1,[3,3]);}
function draw(){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);items=[];hits=[];drawCourt();const p=pose(),f=frameAt(elapsed),idx=preview?f.i:selected;
 if($('#paths').checked){if($('#allPaths').checked)for(let i=0;i<project.steps.length;i++)if(i!==idx)shotPath(i,.35);if(idx>=0){shotPath(idx);if(C.linked(project,idx)){for(let j=25;j<36;j++)line([C.ball(project,idx-1,j/36),C.ball(project,idx-1,(j+1)/36)],'#cbd9db80',1,[3,4]);}const a=C.start(project,idx),b=project.steps[idx].end;for(const i of C.active(project)){ring(a[i].x,.035,a[i].z,.28,colors[i]+'70',1.3);arrow(a[i],b[i],colors[i]+'aa');}}}
 if(!preview)ring(p[person].x,.05,p[person].z,.55,colors[person],2);
 C.active(project).forEach(i=>personMesh(p[i],i,preview&&playing,elapsed));
 if(idx>=0){const q=C.ball(project,idx,preview?f.t:0);ring(q.x,.02,q.z,.12,null,0,'#10282b50');sphere(q.x,q.y,q.z,.085,'#fff7d3');cylinder(q.x,q.z,q.y+.05,q.y+.30,.045,.14,'#f6f7ed');}
 items.sort((a,b)=>a.d-b.d);for(const item of items)item.draw();
 if($('#labels').checked){for(const i of C.active(project)){const pt=proj(v(p[i].x,2.1,p[i].z));ctx.font='600 11px system-ui';const text=C.displayName(project,i),width=ctx.measureText(text).width+15;ctx.fillStyle='#101b26df';ctx.beginPath();ctx.roundRect(pt.x-width/2,pt.y-12,width,23,7);ctx.fill();ctx.fillStyle=colors[i];ctx.textAlign='center';ctx.fillText(text,pt.x,pt.y+3);}}
 // Orientation marks stay on the ground plane.
 for(const [z,label,color] of [[7.25,'ĐỘI A',colors[0]],[-7.25,'ĐỘI B',colors[1]]]){const q=proj(v(0,.05,z));ctx.font='600 11px system-ui';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(label,q.x,q.y);}
 if($('#dimensions').checked){for(const sign of [-1,1]){const q=proj(v(-3.9,.05,sign*3.35));ctx.font='10px system-ui';ctx.fillStyle='#a7bfc6';ctx.textAlign='right';ctx.fillText('6,70 m',q.x-4,q.y);}}
 if(!preview&&idx>=0&&C.linked(project,idx)){const q=proj(C.origin(project,idx));ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillStyle='#d3e2dd';ctx.fillText('Nối pha '+idx,q.x+10,q.y+15);}
 drawArc();syncPlayback();
}

function drawArc(){
 const cv=$('#arcPreview'),c=cv.getContext('2d');const rect=cv.getBoundingClientRect();const width=rect.width||260,height=rect.height||66;
 if(cv.width!==Math.round(width*DPR)||cv.height!==Math.round(height*DPR)){cv.width=Math.round(width*DPR);cv.height=Math.round(height*DPR);}c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,width,height);if(selected<0)return;
 const i=selected,a=C.origin(project,i),b=C.endPoint(project,i),steps=48,qs=Array.from({length:steps+1},(_,j)=>C.ball(project,i,j/steps));
 const ymax=Math.max(3,...qs.map(p=>p.y))+.25,X=t=>12+t*(width-24),Y=y=>height-14-y/ymax*(height-22);
 c.strokeStyle='#4b606c';c.lineWidth=1;c.beginPath();c.moveTo(12,Y(0));c.lineTo(width-12,Y(0));c.stroke();
 if(a.z*b.z<0){const t=C.netT(project,i);c.strokeStyle='#9daeb5';c.beginPath();c.moveTo(X(t),Y(0));c.lineTo(X(t),Y(1.55));c.stroke();c.font='8px system-ui';c.fillStyle='#94a5b1';c.fillText('LƯỚI',X(t)+3,Y(.1));}
 c.beginPath();qs.forEach((p,j)=>j?c.lineTo(X(j/steps),Y(p.y)):c.moveTo(X(0),Y(p.y)));c.strokeStyle='#ffe0a0';c.lineWidth=2;c.stroke();
 for(const [t,p] of [[0,a],[1,b]]){c.fillStyle=t?'#ffe0a0':'#b8d9cd';c.beginPath();c.arc(X(t),Y(p.y),3,0,Math.PI*2);c.fill();}
 const pkj=qs.reduce((m,p,j)=>p.y>qs[m].y?j:m,0);c.fillStyle='#ffd166';c.beginPath();c.arc(X(pkj/steps),Y(qs[pkj].y),4,0,Math.PI*2);c.fill();c.strokeStyle='#7a5b12';c.lineWidth=1;c.stroke();c.font='9px system-ui';c.fillStyle='#91a6b2';c.fillText('MẶT CẮT ĐƯỜNG CẦU',12,height-2);c.textAlign='right';c.fillText('Đỉnh '+Math.max(...qs.map(p=>p.y)).toFixed(2)+' m',width-10,10);c.textAlign='left';
}
function tick(now){
 if(playing){elapsed+=Math.min((now-last)/1000,.1)*Number($('#speed').value);if(repeatPhase!==null&&project.steps[repeatPhase]){const start=C.stepTime(project,repeatPhase),duration=project.steps[repeatPhase].duration;if(elapsed>=start+duration)elapsed=start+(elapsed-start)%duration;}else if(elapsed>=total()){if($('#loop').checked&&total()>0)elapsed%=total();else{elapsed=total();playing=false;}}}
 last=now;
 if(preview&&project.steps.length){const i=frameAt(elapsed).i;if(i!==selected){selected=i;receiverChoice=null;ui();}if(i!==lastFrameIndex){lastFrameIndex=i;const card=$('.step[data-step="'+i+'"]');if(card){const box=$('#timeline');if(card.offsetLeft<box.scrollLeft||card.offsetLeft+card.offsetWidth>box.scrollLeft+box.clientWidth)box.scrollLeft=Math.max(0,card.offsetLeft-box.clientWidth/2);}}}
 draw();requestAnimationFrame(tick);
}
$('#image').onclick=()=>{draw();const output=document.createElement('canvas');output.width=canvas.width;output.height=canvas.height+70*DPR;const c=output.getContext('2d');c.fillStyle='#172733';c.fillRect(0,0,output.width,output.height);c.drawImage(canvas,0,55*DPR);c.scale(DPR,DPR);c.fillStyle='#f5e5ea';c.font='600 18px system-ui';c.fillText(project.title,20,26);c.fillStyle='#a4bac5';c.font='11px system-ui';c.fillText('SHUTTLE STUDIO · '+(selected<0?'Đội hình ban đầu':'Pha '+(selected+1))+' · Minh họa chiến thuật',20,44);const a=document.createElement('a');a.download=safeName()+'.png';a.href=output.toDataURL('image/png');a.click();toast('Đã xuất ảnh góc nhìn hiện tại.');};
window.addEventListener('resize',resize);if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(canvas.parentElement);
ui();setView('orbit');requestAnimationFrame(tick);

/* === v1.3.0: thong ke, lat ngang, toan man hinh === */
function renderStats(){const st=C.stats(project),box=$('#statsBox');if(!box)return;box.replaceChildren();const lines=['Tổng: '+st.steps+' pha · '+st.totalTime.toFixed(1)+'s · cầu chạm sân '+st.landings+' lần','Theo loại cầu: '+(Object.entries(st.byType).map(([k,n])=>C.presets[k].label+' ×'+n).join(' · ')||'—'),'Theo người đánh: '+C.active(project).map(i=>C.displayName(project,i)+' ×'+st.byHitter[i]).join(' · ')];for(const line of lines){const d=document.createElement('div');d.textContent=line;box.append(d);}}
$('#projectButton').addEventListener('click',renderStats);
$('#mirror').onclick=()=>{edit(()=>{project=C.mirror(project);});toast('Đã lật ngang toàn bộ chiến thuật (trái ↔ phải). Có thể Hoàn tác để quay lại.');};
$('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();};

/* === v1.4.0: keo duong cau + thiet ke nhan vat === */
function curveScreenPoints(i){const pts=[];for(let j=0;j<=36;j++){const b=C.ball(project,i,j/36),s=proj(b);pts.push({x:s.x,y:s.y,t:j/36});}return pts;}
function syncArcInputs(){if(selected<0)return;const s=project.steps[selected];$('#height').value=s.height;$('#heightVal').textContent=s.height.toFixed(2)+' m';const pk=s.peak??.5;$('#peak').value=pk;$('#peakVal').textContent=Math.round(pk*100)+'%';}
const arcCv=$('#arcPreview');let arcDrag=null;
arcCv.addEventListener('pointerdown',e=>{if(selected<0)return;e.preventDefault();if(liveEdit===null){currentEdit();checkpoint();liveEdit=selected;}const s=project.steps[selected];arcDrag={x:e.clientX,y:e.clientY,h:s.height,pk:s.peak??.5};try{arcCv.setPointerCapture(e.pointerId);}catch(err){}});
arcCv.addEventListener('pointermove',e=>{if(!arcDrag||selected<0)return;const s=project.steps[selected];s.height=C.clamp(arcDrag.h-(e.clientY-arcDrag.y)*.02,0,7);s.peak=C.clamp(arcDrag.pk+(e.clientX-arcDrag.x)*.0035,.15,.85);syncArcInputs();warnings();draw();});
function finishArc(){if(arcDrag){arcDrag=null;commitLive();ui();}}
arcCv.addEventListener('pointerup',finishArc);arcCv.addEventListener('pointercancel',finishArc);arcCv.addEventListener('lostpointercapture',finishArc);
let designIdx=0;
const DZ_PARTS=[['shirt','Áo'],['shorts','Quần'],['shoes','Giày'],['skin','Da'],['hair','Tóc']];
const DZ_COLORS={shirt:['#f7a8bc','#92d7bf','#e67fa1','#4ab8ac','#ffd166','#7bdff2','#c3f584','#f2a65a','#e63946','#4361ee','#ffffff','#222831'],shorts:['#27354e','#11151c','#5b2a86','#0f766e','#b91c1c','#f59e0b','#f8fafc','#64748b'],shoes:['#f2f5f5','#11151c','#ef4444','#f59e0b','#3b82f6','#22c55e','#ec4899','#a855f7'],skin:['#ffe0bd','#ffd9b8','#f0cdb4','#e0ac82','#c98d64','#a06a42','#8d5a3b','#5f3d26'],hair:['#17130f','#2b2320','#3a2a1c','#54382a','#7a4a21','#b06a2c','#d9d9d9','#e8c66a','#c94f6d','#3b5bdb']};
const DZ_HAIR=[['short','Ngắn'],['spiky','Dựng'],['long','Dài'],['bun','Búi']];
function ensureAppearance(){if(!Array.isArray(project.appearance))project.appearance=[0,1,2,3].map(j=>C.appearanceOf(project,j));}
function renderDesigner(){const box=$('#designer');if(!box)return;const act=C.active(project);if(!act.includes(designIdx))designIdx=act[0];const ap=C.appearanceOf(project,designIdx);box.replaceChildren();
 const head=document.createElement('b');head.textContent='Tùy chỉnh nhân vật';box.append(head);
 const tabs=document.createElement('div');tabs.className='dz-tabs';for(const i of act){const b=document.createElement('button');b.textContent=C.displayName(project,i);if(i===designIdx)b.className='on';b.onclick=()=>{designIdx=i;person=i;numbers();renderDesigner();};tabs.append(b);}box.append(tabs);
 const mkRow=(label)=>{const row=document.createElement('div');row.className='dz-row';const lb=document.createElement('span');lb.className='dz-label';lb.textContent=label;row.append(lb);const sw=document.createElement('div');sw.className='swatches';row.append(sw);box.append(row);return sw;};
 const handWrap=mkRow('Tay vợt');
 for(const [val,label] of [['right','Phải'],['left','Trái']]){const b=document.createElement('button');b.className='hairbtn'+(ap.hand===val?' on':'');b.textContent=label;b.setAttribute('aria-pressed',String(ap.hand===val));b.onclick=()=>{edit(()=>{ensureAppearance();project.appearance[designIdx].hand=val;});renderDesigner();};handWrap.append(b);}
 const hairWrap=mkRow('Kiểu tóc');
 for(const [val,label] of DZ_HAIR){const b=document.createElement('button');b.className='hairbtn'+(ap.hairStyle===val?' on':'');b.textContent=label;b.onclick=()=>{edit(()=>{ensureAppearance();project.appearance[designIdx].hairStyle=val;});renderDesigner();};hairWrap.append(b);}
 for(const [key,label] of DZ_PARTS){const sw=mkRow(label);
  for(const col of DZ_COLORS[key]){const s=document.createElement('button');s.className='sw'+(ap[key]===col?' on':'');s.style.background=col;s.title=col;s.setAttribute('aria-label',label+' '+col);s.onclick=()=>{edit(()=>{ensureAppearance();project.appearance[designIdx][key]=col;});renderDesigner();};sw.append(s);}
  const custom=document.createElement('input');custom.type='color';custom.value=ap[key];custom.title='Màu tự chọn';custom.onchange=()=>{edit(()=>{ensureAppearance();project.appearance[designIdx][key]=custom.value;});renderDesigner();};sw.append(custom);}
 if(project.mode==='doubles'){const cp=document.createElement('button');cp.className='dz-copy';cp.textContent='Chép thiết kế này cho đồng đội';cp.onclick=()=>{edit(()=>{ensureAppearance();project.appearance[designIdx^2]={...project.appearance[designIdx]};});renderDesigner();toast('Đã chép thiết kế cho '+C.displayName(project,designIdx^2)+'.');};box.append(cp);}
 const note=document.createElement('p');note.className='micro';note.textContent='Trái / phải tính theo cơ thể nhân vật, không theo phía màn hình. Thiết kế được lưu cùng file chiến thuật.';box.append(note);}
designReady=true;renderDesigner();

/* === v1.5.0: doi dau san + mui ten chuyen pha === */
$('#swapEnds').onclick=()=>{edit(()=>{project=C.swapEnds(project);});toast('Đã đổi đầu sân: hai đội hoán đổi hai đầu sân, tên và thiết kế đi theo người. Có thể Hoàn tác.');};
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||$$('dialog').some(d=>d.open))return;
 if(e.key==='ArrowRight'&&project.steps.length){e.preventDefault();selectPhase(Math.min(selected+1,project.steps.length-1));ui();}
 else if(e.key==='ArrowLeft'&&project.steps.length){e.preventDefault();selectPhase(Math.max(selected-1,-1));ui();}});

/* 1.6: persistent game workspace controls; display preferences never alter a tactic. */
function showPanel(name){
 const character=name==='character';
 $('#tacticsPanel').hidden=character;$('#characterPanel').hidden=!character;
 for(const b of $$('[data-panel]')){const active=b.dataset.panel===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
 if(character){designIdx=person;renderDesigner();}
}
$$('[data-panel]').forEach(b=>b.onclick=()=>showPanel(b.dataset.panel));
$('#focusMode').onclick=()=>{const active=document.body.classList.toggle('focus-mode');$('#focusMode').setAttribute('aria-pressed',String(active));$('#focusMode').textContent=active?'Hiện bảng chỉnh':'Tập trung';resize();};
$('#prevPhase').onclick=()=>selectPhase(Math.max(-1,selected-1));
$('#nextPhase').onclick=()=>selectPhase(Math.min(project.steps.length-1,selected+1));
$('#repeatPhase').onchange=()=>{repeatPhase=null;if($('#repeatPhase').checked){$('#loop').checked=false;if(playing)repeatPhase=Math.max(0,selected);}};
$('#loop').onchange=()=>{if($('#loop').checked){$('#repeatPhase').checked=false;repeatPhase=null;}};
