const test=require('node:test'),assert=require('node:assert/strict'),C=require('../core.js'),setup=require('./harness.cjs');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;

test('Shuttle cork follows rising/falling tangent for every preset, stable finite frame at apex and endpoints',()=>{
 for(const type of Object.keys(C.presets)){
  const p=C.sample();C.applyPreset(p,0,type);
  for(const t of [0,.01,.1,.5,.9,1]){const f=C.shuttleFrame(p,0,t);for(const v of Object.values(f))near(Math.hypot(v.x,v.y,v.z),1);near(dot(f.forward,f.right),0);near(dot(f.forward,f.up),0);
   const a=C.ball(p,0,Math.max(0,t-1e-5)),b=C.ball(p,0,Math.min(1,t+1e-5));assert.ok(dot(f.forward,{x:b.x-a.x,y:b.y-a.y,z:b.z-a.z})>0);
  }
 }
 const p=C.sample();assert.ok(C.shuttleFrame(p,0,.05).forward.y>0);assert.ok(C.shuttleFrame(p,0,.95).forward.y<0);
});

test('Linked contact orientation starts continuously and settles to outgoing flight; seeking is deterministic',()=>{
 const p=C.sample(),prev=C.shuttleFrame(p,0,1).forward,next=C.shuttleFrame(p,1,0).forward;near(dot(prev,next),1);
 near(dot(C.shuttleFrame(p,1,.3).forward,C.flightDirection(p,1,.3)),1);
 const a=C.shuttleFrame(p,1,.02);C.shuttleFrame(p,2,.9);assert.deepEqual(C.shuttleFrame(p,1,.02),a);
 p.steps[1].breakBefore=true;near(dot(C.shuttleFrame(p,1,0).forward,C.flightDirection(p,1,0)),1);
});

test('Zones and saved alternative survive JSON, mirror, ends swap; invalid extensions rejected',()=>{
 const p=C.sample();p.steps[0].zones=[{kind:'target',x:1,z:-4,w:1.2,h:2}];p.steps[0].comparison=C.captureShot(p.steps[0]);
 assert.deepEqual(C.validate(JSON.parse(JSON.stringify(p))),p);
 assert.deepEqual(C.mirror(C.mirror(p)),p);assert.deepEqual(C.swapEnds(C.swapEnds(p)),p);
 for(const bad of [{kind:'target',x:3,z:0,w:2,h:1},{kind:'x',x:0,z:0,w:1,h:1},{kind:'space',x:NaN,z:0,w:1,h:1}]){const q=C.clone(p);q.steps[0].zones=[bad];assert.throws(()=>C.validate(q));}
 for(const mutate of [s=>s.comparison.height=Infinity,s=>s.comparison.target.z=100,s=>s.comparison.comparison={}]){const q=C.clone(p);mutate(q.steps[0]);assert.throws(()=>C.validate(q));}
});

test('Comparison keeps same shot origin, separate target and does not mutate the current tactic',()=>{
 const p=C.sample();p.steps[1].comparison=C.captureShot(p.steps[1]);p.steps[1].target.x=-2;
 const before=JSON.stringify(p),a=C.comparisonProject(p,1);assert.deepEqual(C.origin(a,1),C.origin(p,1));assert.notEqual(C.ball(a,1,1).x,C.ball(p,1,1).x);assert.equal(JSON.stringify(p),before);
 const first=C.sample();first.steps[0].comparison=C.captureShot(first.steps[0]);C.applyPreset(first,0,'serve');assert.deepEqual(C.comparisonBall(first,0,0),C.origin(first,0));
});

test('Pause-at-contact stops exactly at endpoint, preserves receiving pose, resumes into following phase',()=>{
 const {d,w,a,close}=setup();d.querySelectorAll('.step')[0].click();d.querySelector('#pauseContact').checked=true;d.querySelector('#pauseContact').dispatchEvent(new w.Event('change'));d.querySelector('#play').click();
 let now=w.performance.now();for(let j=0;j<32;j++){now+=100;w.__raf(now);}const st=a.state();assert.equal(st.playing,false);assert.equal(st.selected,0);near(st.elapsed,st.project.steps[0].duration);assert.equal(a.displayFrame().t,1);assert.deepEqual(a.pose(),st.project.steps[0].end);
 d.querySelector('#play').click();now+=100;w.__raf(now);assert.equal(a.state().selected,1);assert.equal(a.state().playing,true);
 d.querySelectorAll('.step')[2].click();assert.equal(a.state().contactFrame,null);assert.equal(a.state().playing,false);close();
});

test('Contact controls and presentation preserve data and navigation remains paused',()=>{
 const {d,a,w,close}=setup(),before=JSON.stringify(a.state().project);d.querySelectorAll('.step')[1].click();d.querySelector('#contactEnd').click();assert.equal(a.displayFrame().i,1);assert.equal(a.displayFrame().t,1);
 d.querySelector('#present').click();assert.equal(a.state().presenting,true);d.querySelector('#nextPhase').click();assert.equal(a.displayFrame().i,2);assert.equal(a.displayFrame().t,0);assert.equal(a.state().playing,false);
 d.querySelector('#court').onpointerdown(new w.MouseEvent('pointerdown',{button:0,clientX:500,clientY:200}));d.querySelector('#court').onpointerup(new w.MouseEvent('pointerup',{button:0,clientX:500,clientY:200}));assert.equal(JSON.stringify(a.state().project),before);
 d.querySelector('#present').click();assert.equal(a.state().presenting,false);close();
});

test('Draw/delete zone, save/restore, undo and cancel work without moving player or target',()=>{
 const {d,w,a,close}=setup();d.querySelectorAll('.step')[0].click();d.querySelector('[data-panel="explain"]').click();
 const original=JSON.stringify(a.state().project),cv=d.querySelector('#court');
 const send=(type,x,y)=>cv['on'+type](new w.MouseEvent(type,{button:0,clientX:x,clientY:y}));
 d.querySelector('#zoneTarget').click();send('pointerdown',450,300);send('pointermove',500,330);send('pointerup',500,330);
 assert.equal(a.state().project.steps[0].zones.length,1);assert.ok(w.Tactics.validate(JSON.parse(w.localStorage.getItem('shuttle-studio-v2'))));
 d.querySelector('#undo').click();assert.equal(JSON.stringify(a.state().project),original);
 d.querySelector('#zoneSpace').click();send('pointerdown',450,300);send('pointermove',500,330);send('pointercancel',500,330);assert.equal(JSON.stringify(a.state().project),original);
 close();
});

test('Live note persists before blur, is text-safe and undoable; comparison capture/remove are undoable',()=>{
 const {d,w,a,close}=setup();d.querySelectorAll('.step')[1].click();d.querySelector('[data-panel="explain"]').click();const before=JSON.stringify(a.state().project);
 const note=d.querySelector('#note');note.value='<img src=x onerror=alert(1)>\nMở khoảng trống';note.dispatchEvent(new w.Event('input'));note.dispatchEvent(new w.Event('blur'));a.draw();assert.equal(d.querySelector('#coachNote').textContent,note.value);assert.equal(d.querySelector('#coachNote img'),null);assert.equal(JSON.parse(w.localStorage.getItem('shuttle-studio-v2')).steps[1].note,note.value);
 d.querySelector('#undo').click();assert.equal(JSON.stringify(a.state().project),before);
 d.querySelector('#captureA').click();const saved=JSON.stringify(a.state().project.steps[1].comparison);d.querySelector('#clearA').click();assert.equal(a.state().project.steps[1].comparison,undefined);d.querySelector('#undo').click();assert.equal(JSON.stringify(a.state().project.steps[1].comparison),saved);close();
});
