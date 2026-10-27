/* Shuttle Studio — model, court geometry, continuous rally paths. */
(function(root){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const court={halfLength:6.7,doublesHalfWidth:3.05,singlesHalfWidth:2.59,shortService:1.98,longService:5.94};
const presets={
 clear:{label:'Phông cao sâu',height:4.3,duration:2.4,y:2.2,endY:2.2,group:'Thường dùng'},
 drop:{label:'Bỏ nhỏ',height:.55,duration:1.5,y:2.2,endY:1.15,group:'Thường dùng'},
 smash:{label:'Đập cầu',height:.12,duration:.75,y:2.8,endY:.9,group:'Thường dùng'},
 lift:{label:'Hất cầu',height:4,duration:2.3,y:.8,endY:2.2,group:'Thường dùng'},
 drive:{label:'Đánh ngang',height:.25,duration:.9,y:1.6,endY:1.6,group:'Thường dùng'},
 net:{label:'Kê lưới',height:.15,duration:.8,y:1.45,endY:1.4,group:'Thường dùng'},
 serve:{label:'Giao cầu ngắn',height:.6,duration:1.3,y:1,endY:1.1,group:'Thường dùng'},
 flatClear:{label:'Phông lao',height:1.5,duration:1.3,y:2.2,endY:2.1,group:'Biến thể'},
 crossNet:{label:'Kéo lưới chéo',height:.24,duration:1.1,y:1.5,endY:1.35,group:'Biến thể'},
 slice:{label:'Chém cầu',height:.4,duration:1.2,y:2.35,endY:1.15,group:'Biến thể'},
 chop:{label:'Chặt cầu',height:.35,duration:1.35,y:2.3,endY:1.05,group:'Biến thể'},
 push:{label:'Đẩy cầu',height:.18,duration:.85,y:1.7,endY:1.5,group:'Biến thể'},
 longServe:{label:'Giao cầu cao sâu',height:4.5,duration:2.6,y:1,endY:2.2,group:'Biến thể'}
};
const base=()=>({format:'shuttle-tactics',version:2,title:'Chiến thuật của tôi',mode:'singles',names:['Minh','An','Bảo','Linh'],initial:[{x:0,z:3.2},{x:0,z:-3.2},{x:1.8,z:4.7},{x:-1.8,z:-4.7}],steps:[]});
const active=p=>p.mode==='doubles'?[0,1,2,3]:[0,1];
const side=i=>i%2===0?1:-1;
const onSide=(p,i)=>({x:clamp(p.x,-4.5,4.5),z:side(i)*clamp(p.z*side(i),.15,8)});
const targetOnSide=(p,h)=>onSide(p,h%2===0?1:0);
const start=(p,i)=>i<=0?p.initial:p.steps[i-1].end;
const linked=(p,i)=>i>0&&!p.steps[i-1].landing&&!p.steps[i].breakBefore;
function nearest(p,positions,point,team){return active(p).filter(i=>side(i)===team).reduce((a,b)=>Math.hypot(positions[a].x-point.x,positions[a].z-point.z)<=Math.hypot(positions[b].x-point.x,positions[b].z-point.z)?a:b);}
function receiver(p,i){const s=p.steps[i];return nearest(p,s.end,s.target,-side(s.hitter));}
function normalize(p){
 p.version=2;p.initial=p.initial.map(onSide);
 for(let i=0;i<p.steps.length;i++){
  const s=p.steps[i];s.end=s.end.map(onSide);s.breakBefore=!!s.breakBefore;
  if(!active(p).includes(s.hitter))s.hitter%=2;
  if(linked(p,i)){
   const prev=p.steps[i-1];
   if(side(s.hitter)===side(prev.hitter)){s.hitter=nearest(p,prev.end,prev.target,-side(prev.hitter));s.target.z=-side(s.hitter)*Math.abs(s.target.z);}
   // The next hitter is the receiver of the previous flight; move only that receiver.
   prev.end[s.hitter]=onSide(prev.target,s.hitter);
  }
  s.target=targetOnSide(s.target,s.hitter);if(s.comparison)s.comparison.target=targetOnSide(s.comparison.target,s.hitter);
  if(!Number.isFinite(s.endHeight))s.endHeight=presets[s.type].endY;
 }
 return p;
}
function add(p){const last=p.steps.at(-1),end=clone(last?last.end:p.initial),h=last?nearest(p,end,last.target,-side(last.hitter)):0;
 if(last&&!last.landing){last.end[h]=onSide(last.target,h);end[h]=clone(last.end[h]);}
 return {hitter:h,target:{x:0,z:-side(h)*5.2},type:'clear',height:4.3,peak:.5,endHeight:2.2,duration:2.4,landing:false,breakBefore:!!last?.landing,end,note:''};
}
function endPoint(p,i){const s=p.steps[i];return {...s.target,y:s.landing?0:s.endHeight};}
function origin(p,i){if(linked(p,i))return endPoint(p,i-1);return {...start(p,i)[p.steps[i].hitter],y:presets[p.steps[i].type].y};}
function ball(p,i,t,from=origin(p,i)){const s=p.steps[i],a=from,b=endPoint(p,i);t=clamp(t,0,1);const tc=typeof s.peak==='number'?clamp(s.peak,.1,.9):.5,bump=t<=tc?1-((tc-t)/tc)*((tc-t)/tc):1-((t-tc)/(1-tc))*((t-tc)/(1-tc));return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:a.y+(b.y-a.y)*t+s.height*bump};}

// Deterministic orientation: independent of frame rate, camera and scrubbing order.
const unit=(v,fallback={x:0,y:-1,z:0})=>{const n=Math.hypot(v.x,v.y,v.z);return n>1e-9?{x:v.x/n,y:v.y/n,z:v.z/n}:{...fallback};};
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
function flightDirection(p,i,t){const s=p.steps[i],a=origin(p,i),b=endPoint(p,i),k=clamp(s.peak??.5,.1,.9);t=clamp(t,0,1);const slope=t<=k?2*(k-t)/(k*k):-2*(t-k)/((1-k)*(1-k));return unit({x:b.x-a.x,y:b.y-a.y+s.height*slope,z:b.z-a.z});}
function shuttleFrame(p,i,t){
 let forward=flightDirection(p,i,t);
 // Short illustrative turnover after linked contact; not an aerodynamic solver.
 const blend=clamp(t*p.steps[i].duration/.08,0,1);
 if(linked(p,i)&&blend<1){const from=flightDirection(p,i-1,1),cos=clamp(dot(from,forward),-1,1),angle=Math.acos(cos),u=blend*blend*(3-2*blend);
  let axis=cross(from,forward);if(Math.hypot(axis.x,axis.y,axis.z)<1e-8)axis=cross(from,Math.abs(from.y)<.9?{x:0,y:1,z:0}:{x:1,y:0,z:0});axis=unit(axis);
  const a=angle*u,c=Math.cos(a),sn=Math.sin(a),ax=cross(axis,from),d=dot(axis,from);
  forward=unit({x:from.x*c+ax.x*sn+axis.x*d*(1-c),y:from.y*c+ax.y*sn+axis.y*d*(1-c),z:from.z*c+ax.z*sn+axis.z*d*(1-c)});
 }
 const ref=Math.abs(forward.y)<.98?{x:0,y:1,z:0}:{x:1,y:0,z:0},right=unit(cross(forward,ref)),up=unit(cross(right,forward));return {forward,right,up};
}
const compareKeys=['type','height','peak','duration','endHeight','landing','target'];
function captureShot(s){const q={};for(const key of compareKeys)if(s[key]!==undefined)q[key]=clone(s[key]);return q;}
function comparisonProject(p,i){const q={...p,steps:p.steps.slice()};q.steps[i]={...p.steps[i],...p.steps[i].comparison};return q;}
function comparisonBall(p,i,t){return ball(comparisonProject(p,i),i,t,origin(p,i));}
function validComparison(s){return s&&Object.keys(s).every(k=>compareKeys.includes(k))&&Object.hasOwn(presets,s.type)&&Number.isFinite(s.height)&&s.height>=0&&s.height<=7&&Number.isFinite(s.duration)&&s.duration>=.3&&s.duration<=8&&Number.isFinite(s.endHeight)&&s.endHeight>=.1&&s.endHeight<=3.5&&typeof s.landing==='boolean'&&(s.peak===undefined||Number.isFinite(s.peak)&&s.peak>=.1&&s.peak<=.9)&&s.target&&Number.isFinite(s.target.x)&&Number.isFinite(s.target.z)&&Math.abs(s.target.x)<=5&&Math.abs(s.target.z)<=9;}
function validZones(zones){return Array.isArray(zones)&&zones.length<=6&&zones.every(z=>z&&['target','space'].includes(z.kind)&&[z.x,z.z,z.w,z.h].every(Number.isFinite)&&z.w>=.2&&z.h>=.2&&z.w<=6.1&&z.h<=13.4&&Math.abs(z.x)+z.w/2<=3.051&&Math.abs(z.z)+z.h/2<=6.701);}

function netT(p,i){const a=origin(p,i),b=p.steps[i].target;return a.z*b.z>=0?null:-a.z/(b.z-a.z);}
function netHeight(p,i){const t=netT(p,i);return t===null?null:ball(p,i,t).y;}
function stepTime(p,i){return p.steps.slice(0,Math.max(i,0)).reduce((n,s)=>n+s.duration,0);}
function frameAt(p,time){let sum=0;for(let i=0;i<p.steps.length;i++){const end=sum+p.steps[i].duration;if(time<end-1e-9||i===p.steps.length-1)return {i,t:clamp((time-sum)/p.steps[i].duration,0,1)};sum=end;}return {i:-1,t:0};}
const playerCode=i=>(i%2===0?'A':'B')+(i<2?'1':'2');
const displayName=(p,i)=>{const n=p&&typeof p.names[i]==='string'?p.names[i].trim():'';return n||playerCode(i);};
function mirror(p){const q=clone(p);const flip=pt=>{pt.x=-pt.x;if(pt.x===0)pt.x=0;};q.initial.forEach(flip);for(const s of q.steps){s.end.forEach(flip);flip(s.target);for(const z of s.zones||[])z.x=-z.x;if(s.comparison)flip(s.comparison.target);}return normalize(q);}
function stats(p){const byType={},byHitter=[0,0,0,0];let landings=0;for(const s of p.steps){byType[s.type]=(byType[s.type]||0)+1;byHitter[s.hitter]++;if(s.landing)landings++;}return {steps:p.steps.length,totalTime:stepTime(p,p.steps.length),byType,byHitter,landings};}
const shirtDefaults=['#f7a8bc','#92d7bf','#e67fa1','#4ab8ac'],skinDefaults=['#ffd9b8','#f0cdb4','#c98d64','#8d5a3b'],hairDefaults=['#2b2320','#3a2a1c','#17130f','#54382a'];
function appearanceOf(p,i){const d={shirt:shirtDefaults[i],shorts:'#27354e',shoes:'#f2f5f5',skin:skinDefaults[i],hair:hairDefaults[i],hairStyle:'short',hand:'right'},a=p&&Array.isArray(p.appearance)?p.appearance[i]:null;if(a)for(const k of Object.keys(d))if(a[k]!==undefined)d[k]=a[k];return d;}
function swapEnds(p){const q=clone(p),perm=[1,0,3,2],fz=pt=>{const r={x:pt.x,z:-pt.z};if(r.z===0)r.z=0;return r;};q.names=perm.map(i=>p.names[i]);if(Array.isArray(q.appearance))q.appearance=perm.map(i=>q.appearance[i]);q.initial=perm.map(i=>fz(p.initial[i]));for(let k=0;k<q.steps.length;k++){const s=q.steps[k];s.hitter=perm[s.hitter];s.target=fz(s.target);for(const z of s.zones||[])z.z=-z.z;if(s.comparison)s.comparison.target=fz(s.comparison.target);s.end=perm.map(i=>fz(s.end[i]));}return normalize(q);}
function validate(d){
 if(!d||d.format!=='shuttle-tactics'||![1,2].includes(d.version))throw Error('File không đúng định dạng Shuttle Studio.');
 if(!['singles','doubles'].includes(d.mode))throw Error('Chế độ thi đấu không hợp lệ.');
 const pt=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<=5&&Math.abs(p.z)<=9;
 const pose=p=>Array.isArray(p)&&p.length===4&&p.every(pt);
 if(!pose(d.initial)||!Array.isArray(d.names)||d.names.length!==4||!d.names.every(x=>typeof x==='string'&&x.length<=30))throw Error('Tên hoặc vị trí người chơi không hợp lệ.');
 if(d.appearance!==undefined){const hex=v=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);if(!Array.isArray(d.appearance)||d.appearance.length!==4||!d.appearance.every(a=>a&&typeof a==='object'&&['shirt','shorts','shoes','skin','hair'].every(k=>a[k]===undefined||hex(a[k]))&&(a.hairStyle===undefined||['short','spiky','long','bun'].includes(a.hairStyle))&&(a.hand===undefined||a.hand==='right'||a.hand==='left')))throw Error('Thiết kế nhân vật không hợp lệ.');}
 if(typeof d.title!=='string'||d.title.length>100||!Array.isArray(d.steps)||d.steps.length>150)throw Error('Tối đa 150 pha và tên tối đa 100 ký tự.');
 for(const s of d.steps){if(s?.technique!==undefined&&!['auto','forehand','backhand'].includes(s.technique))throw Error('Động tác không hợp lệ.');if(s?.jump!==undefined&&typeof s.jump!=='boolean')throw Error('Tùy chọn bật nhảy không hợp lệ.');if(s?.zones!==undefined&&!validZones(s.zones))throw Error('Vùng minh họa không hợp lệ (tối đa 6 vùng mỗi pha).');if(s?.comparison!==undefined&&!validComparison(s.comparison))throw Error('Phương án A không hợp lệ.');if(!s||!pose(s.end)||!pt(s.target)||!active(d).includes(s.hitter)||!Object.hasOwn(presets,s.type)||!Number.isFinite(s.height)||s.height<0||s.height>7||!Number.isFinite(s.duration)||s.duration<.3||s.duration>8||s.peak!==undefined&&(!Number.isFinite(s.peak)||s.peak<.1||s.peak>.9)||typeof s.landing!=='boolean'||typeof s.note!=='string'||s.note.length>500||s.breakBefore!==undefined&&typeof s.breakBefore!=='boolean'||s.endHeight!==undefined&&(!Number.isFinite(s.endHeight)||s.endHeight<.1||s.endHeight>3.5))throw Error('Có pha cầu chứa dữ liệu không hợp lệ.');}
 const p=clone(d);if(d.version===1)for(const s of p.steps)s.endHeight=1.2;
 return normalize(p);
}
function applyPreset(p,i,type){const s=p.steps[i],q=presets[type];s.type=type;s.height=q.height;s.duration=q.duration;s.endHeight=q.endY;s.peak=.5;}
function defaultTarget(p,i){const s=p.steps[i],a=origin(p,i),sign=-side(s.hitter);let x=0,z=5.2;
 if(['net','crossNet','drop','slice','chop'].includes(s.type)){z=s.type==='net'?.6:1.25;x=s.type==='crossNet'?(a.x>=0?-1.8:1.8):a.x;}
 else if(s.type==='serve'){z=2.2;x=a.x>=0?-.9:.9;}
 else if(['smash','drive','push'].includes(s.type)){z=s.type==='push'?3.3:4.2;x=a.x>=0?-1.4:1.4;}
 s.target=targetOnSide({x,z:z*sign},s.hitter);
}
function sample(mode='singles'){
 const p=base();p.mode=mode;p.title=mode==='singles'?'Kéo cuối sân · mở khoảng trống':'Đôi · tấn công trước–sau';
 const plan=mode==='singles'?[[0,'clear',-1.8,-5.4],[1,'drop',1.7,1.5],[0,'lift',1.8,-5.5],[1,'smash',-1.8,4.5]]:[[0,'serve',-.8,-2.2],[1,'lift',1.7,5.5],[2,'smash',-1.5,-4],[3,'drive',-1.6,2.2]];
 for(const [h,type,x,z] of plan){const s=add(p);s.hitter=h;p.steps.push(s);applyPreset(p,p.steps.length-1,type);s.target={x,z};const rec=nearest(p,s.end,s.target,-side(h));s.end[rec]={x,z};s.end[h]={x:h%2===0?.4:-.4,z:side(h)*3};s.note='Ví dụ minh họa. Kéo người hoặc bấm sân để điều chỉnh.';normalize(p);}
 // This illustrative drive is struck after a low defensive contact.
 if(mode==='doubles')p.steps[3].height=.65;
 return p;
}
function project(v,c,w,h){const ca=Math.cos(c.az),sa=Math.sin(c.az),ce=Math.cos(c.el),se=Math.sin(c.el),rx=ca*v.x-sa*v.z,rz=sa*v.x+ca*v.z;return {x:w/2+rx*c.scale,y:h*.54+(rz*se-(v.y||0)*ce)*c.scale,d:rz*ce+(v.y||0)*se};}
function ground(px,py,c,w,h){const rx=(px-w/2)/c.scale,rz=(py-h*.54)/c.scale/Math.sin(c.el),ca=Math.cos(c.az),sa=Math.sin(c.az);return {x:clamp(ca*rx+sa*rz,-4.5,4.5),z:clamp(-sa*rx+ca*rz,-8,8)};}
function courtLines(){const out=[];for(const x of [-3.05,-2.59,2.59,3.05])out.push([{x,z:-6.7},{x,z:6.7}]);for(const z of [-6.7,-5.94,-1.98,1.98,5.94,6.7])out.push([{x:-3.05,z},{x:3.05,z}]);for(const sign of [-1,1])out.push([{x:0,z:sign*1.98},{x:0,z:sign*6.7}]);return out;}
// Procedural coaching poses. Coordinates below are character-local: +X right, +Z forward.
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const lerp3=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const add3=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const mul3=(a,k)=>({x:a.x*k,y:a.y*k,z:a.z*k});
const sub3=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
function jointIK(a,target,l1,l2,pole){
 const delta=sub3(target,a),raw=Math.hypot(delta.x,delta.y,delta.z),dir=unit(delta,{x:0,y:-1,z:0}),d=clamp(raw,Math.abs(l1-l2)+.001,l1+l2-.001),end=add3(a,mul3(dir,d));
 let bend=sub3(pole,mul3(dir,dot(pole,dir)));if(Math.hypot(bend.x,bend.y,bend.z)<1e-6)bend=cross(dir,Math.abs(dir.y)<.9?{x:0,y:1,z:0}:{x:1,y:0,z:0});bend=unit(bend);
 const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));return {joint:add3(add3(a,mul3(dir,along)),mul3(bend,height)),end,reachable:Math.abs(raw-d)<.015};
}
function shotTechnique(p,k){const s=p.steps[k];if(s.technique&&s.technique!=='auto')return s.technique;const h=s.hitter,hs=appearanceOf(p,h).hand==='left'?-1:1,a=origin(p,k),before=k>0?start(p,k-1)[h]:start(p,k)[h];return (a.x-before.x)*side(h)*hs<-.55?'backhand':'forehand';}
function shotFamily(p,k){const s=p.steps[k],y=origin(p,k).y;if(['net','crossNet','push'].includes(s.type))return 'net';if(['lift','longServe','serve'].includes(s.type)||y<1.15)return 'lift';if(s.type==='drive'||y<1.75)return 'drive';return s.type==='smash'?'smash':['drop','slice','chop'].includes(s.type)?'drop':'clear';}
function motionLabel(p,k){const family=shotFamily(p,k),hand=shotTechnique(p,k)==='backhand'?'trái tay':'thuận tay';return (p.steps[k].type==='serve'?'Giao cầu ngắn':({net:'Kê / đẩy cầu',lift:'Hất cầu',drive:'Chặn / đánh ngang',smash:'Đập cầu',drop:'Bỏ nhỏ / cắt cầu',clear:'Phông cầu'})[family])+' · '+hand;}
function strokeDuration(p,k){return ({net:.28,lift:.48,drive:.32,smash:.48,drop:.38,clear:.56})[shotFamily(p,k)];}
function playerMotion(p,k,t,i,root){
 const hs=appearanceOf(p,i).hand==='left'?-1:1,sgn=side(i),s=p.steps[k];
 let drop=-.035,jump=0,lean=.035,yaw=0,spread=.23,lunge=0,stroke=null,stage=1;
 let center={x:hs*.48,y:1.51,z:.77},axis=unit({x:0,y:.45,z:.33}),label='Sẵn sàng';
 if(s){
  if(side(i)!==side(s.hitter)&&s.type==='smash'){const pressure=1-smooth((t-.72)/.28);drop-=.20*pressure;spread+=.12*pressure;lean+=.12*pressure;center={x:hs*.3,y:1.25,z:.7};label='Hạ trọng tâm phòng thủ';}
  if(s.hitter===i&&t*s.duration<strokeDuration(p,k)){stroke=k;stage=t*s.duration/strokeDuration(p,k);}
  const next=k+1;if(stroke===null&&t>.65&&next<p.steps.length&&linked(p,next)&&p.steps[next].hitter===i){stroke=next;stage=-clamp((1-t)/.35,0,1);}
 }
 if(stroke!==null){
  const ready={center,axis,drop,lean,spread};
  const family=shotFamily(p,stroke),back=shotTechnique(p,stroke)==='backhand',hside=back?-hs:hs,contact=origin(p,stroke),over=['smash','drop','clear'].includes(family),power=family==='smash';
  const recover=stage>=0?1-smooth(stage):1,wind=stage<0?smooth(-stage):0;
  const liftJump=power&&p.steps[stroke].jump!==false?clamp((contact.y-2.05)*.60,.12,.55):0;
  jump=liftJump*(stage<0?smooth((stage+1)*1.5):1-smooth(stage/.75));
  lunge=over?0:(family==='drive'?.10:.42)*recover;drop=(over?-.02:-.16)*recover;jump=Math.max(0,jump);lean=(over?.04:.15)*recover;
  yaw=(wind*.55-stage*.25)*hs*(back?-1:1)*recover;
  const hit={x:(contact.x-root.x)*sgn,y:contact.y,z:-(contact.z-root.z)*sgn};
  const hitAxis=unit(over?{x:back?-.5*hs:.18*hs,y:1,z:.14}:family==='lift'?{x:hs*.12,y:-.88,z:.48}:{x:hs*.12,y:.8,z:.6});
  const prep=over?{x:hside*.50,y:1.92+jump,z:-.24}:{x:hside*.55,y:family==='lift'?.55:1.25,z:.35};
  const follow=over?{x:family==='drop'?hside*.12:-hside*.42,y:power?.95:family==='drop'?1.65:1.1,z:family==='drop'?.45:.65}:{x:hside*.30,y:family==='lift'?1.75:1.45,z:.9};
  if(stage<0){const swing=smooth((stage+1));center=lerp3(prep,hit,swing);axis=unit(lerp3(over?{x:hside*.2,y:.6,z:-.7}:{x:hs*.1,y:-.8,z:.4},hitAxis,swing));}
  else{const followT=smooth(stage/.50),returnT=smooth((stage-.5)/.5);center=lerp3(lerp3(hit,follow,followT),{x:hs*.48,y:1.51,z:.77},returnT);axis=unit(lerp3(lerp3(hitAxis,{x:-hside*.2,y:.15,z:1},followT),{x:0,y:.45,z:.33},returnT));}
  if(stage<0){const intro=smooth((stage+1)/.35);center=lerp3(ready.center,center,intro);axis=unit(lerp3(ready.axis,axis,intro));drop=ready.drop+(drop-ready.drop)*intro;lean=ready.lean+(lean-ready.lean)*intro;yaw*=intro;lunge*=intro;jump*=intro;}
  label=motionLabel(p,stroke)+(jump>.06?' · bật nhảy':'');
 }
 const lift=drop+jump,rot=(x,y,z)=>({x:x*Math.cos(yaw)+z*Math.sin(yaw),y:y+lift,z:-x*Math.sin(yaw)+z*Math.cos(yaw)+lean});
 const shoulders=[rot(-.27,1.27,0),rot(.27,1.27,0)],h=hs>0?1:0,shoulder=shoulders[h];
 const grip=jointIK(shoulder,sub3(center,mul3(axis,.52)),.38,.36,{x:hs*.65,y:-.25,z:-.35});
 center=add3(grip.end,mul3(axis,.52));
 const free=jointIK(shoulders[1-h],rot(-hs*.42,stroke!==null&&['clear','drop','smash'].includes(shotFamily(p,stroke))?1.4:1.02,.33),.38,.36,{x:-hs,y:-.3,z:0});
 const arms=[];arms[h]=[shoulder,grip.joint,grip.end];arms[1-h]=[shoulders[1-h],free.joint,free.end];
 let movement={x:0,z:1},stride=0,footLift=0;
 if(s){const a=start(p,k)[i],b=s.end[i],dx=(b.x-a.x)*sgn,dz=-(b.z-a.z)*sgn,dist=Math.hypot(dx,dz),envelope=Math.sin(Math.PI*t);if(dist>.08){movement={x:dx/dist,z:dz/dist};stride=Math.sin(t*Math.PI*2*Math.max(1,Math.ceil(dist/1.4)))*.25*envelope;footLift=.12*envelope;}}
 const legs=[];for(const leg of [-1,1]){const hip=rot(leg*.13,.70,0),advance=leg*stride+leg*hs*lunge,foot={x:leg*spread+movement.x*advance,y:.10+jump+Math.max(0,leg*stride)*footLift*4,z:.05+movement.z*advance};const ik=jointIK(hip,foot,.37,.37,{x:leg*.12,y:0,z:1});legs.push([hip,ik.joint,ik.end]);}
 return {arms,legs,center,axis,head:rot(0,1.65,.03),hip:rot(0,.73,0),chest:rot(0,1.23,0),lift,lean,yaw,jump,drop,hs,label,reachable:grip.reachable,stroke};
}

const api={jointIK,playerMotion,motionLabel,shotFamily,shotTechnique,comparisonBall,flightDirection,shuttleFrame,captureShot,comparisonProject,validZones,clone,clamp,court,presets,base,active,side,onSide,targetOnSide,start,linked,nearest,receiver,normalize,add,origin,endPoint,ball,netHeight,stepTime,frameAt,validate,applyPreset,defaultTarget,sample,project,ground,courtLines,playerCode,displayName,mirror,stats,netT,appearanceOf,swapEnds};if(typeof module!=='undefined')module.exports=api;root.Tactics=api;
})(typeof globalThis!=='undefined'?globalThis:this);

