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
  s.target=targetOnSide(s.target,s.hitter);
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
function ball(p,i,t){const s=p.steps[i],a=origin(p,i),b=endPoint(p,i);t=clamp(t,0,1);const tc=typeof s.peak==='number'?clamp(s.peak,.1,.9):.5,bump=t<=tc?1-((tc-t)/tc)*((tc-t)/tc):1-((t-tc)/(1-tc))*((t-tc)/(1-tc));return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,y:a.y+(b.y-a.y)*t+s.height*bump};}
function netT(p,i){const a=origin(p,i),b=p.steps[i].target;return a.z*b.z>=0?null:-a.z/(b.z-a.z);}
function netHeight(p,i){const t=netT(p,i);return t===null?null:ball(p,i,t).y;}
function stepTime(p,i){return p.steps.slice(0,Math.max(i,0)).reduce((n,s)=>n+s.duration,0);}
function frameAt(p,time){let sum=0;for(let i=0;i<p.steps.length;i++){const end=sum+p.steps[i].duration;if(time<end-1e-9||i===p.steps.length-1)return {i,t:clamp((time-sum)/p.steps[i].duration,0,1)};sum=end;}return {i:-1,t:0};}
const playerCode=i=>(i%2===0?'A':'B')+(i<2?'1':'2');
const displayName=(p,i)=>{const n=p&&typeof p.names[i]==='string'?p.names[i].trim():'';return n||playerCode(i);};
function mirror(p){const q=clone(p);const flip=pt=>{pt.x=-pt.x;if(pt.x===0)pt.x=0;};q.initial.forEach(flip);for(const s of q.steps){s.end.forEach(flip);flip(s.target);}return normalize(q);}
function stats(p){const byType={},byHitter=[0,0,0,0];let landings=0;for(const s of p.steps){byType[s.type]=(byType[s.type]||0)+1;byHitter[s.hitter]++;if(s.landing)landings++;}return {steps:p.steps.length,totalTime:stepTime(p,p.steps.length),byType,byHitter,landings};}
const shirtDefaults=['#f7a8bc','#92d7bf','#e67fa1','#4ab8ac'],skinDefaults=['#ffd9b8','#f0cdb4','#c98d64','#8d5a3b'],hairDefaults=['#2b2320','#3a2a1c','#17130f','#54382a'];
function appearanceOf(p,i){const d={shirt:shirtDefaults[i],shorts:'#27354e',shoes:'#f2f5f5',skin:skinDefaults[i],hair:hairDefaults[i],hairStyle:'short',hand:'right'},a=p&&Array.isArray(p.appearance)?p.appearance[i]:null;if(a)for(const k of Object.keys(d))if(a[k]!==undefined)d[k]=a[k];return d;}
function swapEnds(p){const q=clone(p),perm=[1,0,3,2],fz=pt=>{const r={x:pt.x,z:-pt.z};if(r.z===0)r.z=0;return r;};q.names=perm.map(i=>p.names[i]);if(Array.isArray(q.appearance))q.appearance=perm.map(i=>q.appearance[i]);q.initial=perm.map(i=>fz(p.initial[i]));for(let k=0;k<q.steps.length;k++){const s=q.steps[k];s.hitter=perm[s.hitter];s.target=fz(s.target);s.end=perm.map(i=>fz(s.end[i]));}return normalize(q);}
function validate(d){
 if(!d||d.format!=='shuttle-tactics'||![1,2].includes(d.version))throw Error('File không đúng định dạng Shuttle Studio.');
 if(!['singles','doubles'].includes(d.mode))throw Error('Chế độ thi đấu không hợp lệ.');
 const pt=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<=5&&Math.abs(p.z)<=9;
 const pose=p=>Array.isArray(p)&&p.length===4&&p.every(pt);
 if(!pose(d.initial)||!Array.isArray(d.names)||d.names.length!==4||!d.names.every(x=>typeof x==='string'&&x.length<=30))throw Error('Tên hoặc vị trí người chơi không hợp lệ.');
 if(d.appearance!==undefined){const hex=v=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);if(!Array.isArray(d.appearance)||d.appearance.length!==4||!d.appearance.every(a=>a&&typeof a==='object'&&['shirt','shorts','shoes','skin','hair'].every(k=>a[k]===undefined||hex(a[k]))&&(a.hairStyle===undefined||['short','spiky','long','bun'].includes(a.hairStyle))&&(a.hand===undefined||a.hand==='right'||a.hand==='left')))throw Error('Thiết kế nhân vật không hợp lệ.');}
 if(typeof d.title!=='string'||d.title.length>100||!Array.isArray(d.steps)||d.steps.length>150)throw Error('Tối đa 150 pha và tên tối đa 100 ký tự.');
 for(const s of d.steps){if(!s||!pose(s.end)||!pt(s.target)||!active(d).includes(s.hitter)||!Object.hasOwn(presets,s.type)||!Number.isFinite(s.height)||s.height<0||s.height>7||!Number.isFinite(s.duration)||s.duration<.3||s.duration>8||s.peak!==undefined&&(!Number.isFinite(s.peak)||s.peak<.1||s.peak>.9)||typeof s.landing!=='boolean'||typeof s.note!=='string'||s.note.length>500||s.breakBefore!==undefined&&typeof s.breakBefore!=='boolean'||s.endHeight!==undefined&&(!Number.isFinite(s.endHeight)||s.endHeight<.1||s.endHeight>3.5))throw Error('Có pha cầu chứa dữ liệu không hợp lệ.');}
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
const api={clone,clamp,court,presets,base,active,side,onSide,targetOnSide,start,linked,nearest,receiver,normalize,add,origin,endPoint,ball,netHeight,stepTime,frameAt,validate,applyPreset,defaultTarget,sample,project,ground,courtLines,playerCode,displayName,mirror,stats,netT,appearanceOf,swapEnds};if(typeof module!=='undefined')module.exports=api;root.Tactics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
