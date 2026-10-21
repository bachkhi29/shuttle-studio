const test=require('node:test'),assert=require('node:assert/strict'),C=require('../core.js'),setup=require('./harness.cjs');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
test('All strokes keep finite joints and fixed limb lengths for left and right handed players',()=>{
 for(const hand of ['left','right'])for(const technique of ['auto','forehand','backhand'])for(const type of Object.keys(C.presets)){
  const p=C.sample();p.appearance=[0,1,2,3].map(i=>({...C.appearanceOf(p,i),hand}));C.applyPreset(p,0,type);p.steps[0].technique=technique;
  for(const t of [0,.05,.15,.3,.7,.99,1])for(const i of [0,1]){const m=C.playerMotion(p,0,t,i,p.initial[i]);for(const arm of m.arms){assert.ok(Math.abs(dist(arm[0],arm[1])-.38)<1e-7);assert.ok(Math.abs(dist(arm[1],arm[2])-.36)<1e-7);}for(const leg of m.legs){assert.ok(Math.abs(dist(leg[0],leg[1])-.37)<1e-7);assert.ok(Math.abs(dist(leg[1],leg[2])-.37)<1e-7);}assert.ok(Number.isFinite(m.center.y));}
 }
});
test('Default preset contact places racket head at the shuttle, including jump smash',()=>{
 const {a,w,close}=setup(),p=a.state().project;
 for(const type of Object.keys(w.Tactics.presets)){
  w.Tactics.applyPreset(p,0,type);a.showContact(0);const pos=a.pose()[0],lines=a.meshLines(pos,0),rim=lines.find(l=>l.points.length===25),q=w.Tactics.origin(p,0);
  const center={x:(rim.points[0].x+rim.points[12].x)/2,y:(rim.points[0].y+rim.points[12].y)/2,z:(rim.points[0].z+rim.points[12].z)/2};assert.ok(dist(center,q)<1e-7,type);
 }
 close();
});
test('Smash raises the hitter and lowers defenders; drop and clear have distinct follow-through',()=>{
 const p=C.sample();C.applyPreset(p,0,'smash');const hit=C.playerMotion(p,0,0,0,p.initial[0]),def=C.playerMotion(p,0,.2,1,p.initial[1]);assert.ok(hit.jump>.3);assert.ok(def.drop<-.18);
 p.steps[0].jump=false;assert.equal(C.playerMotion(p,0,0,0,p.initial[0]).jump,0);
 C.applyPreset(p,0,'clear');const clear=C.playerMotion(p,0,.1,0,p.initial[0]);C.applyPreset(p,0,'drop');const drop=C.playerMotion(p,0,.1,0,p.initial[0]);assert.ok(dist(clear.center,drop.center)>.1);
});
test('Receiver preparation joins next contact pose continuously; backhand keeps racket in dominant hand',()=>{
 const p=C.sample(),i=p.steps[1].hitter,root=p.steps[0].end[i];const a=C.playerMotion(p,0,1,i,root),b=C.playerMotion(p,1,0,i,root);assert.ok(dist(a.center,b.center)<1e-8);assert.ok(dist(a.head,b.head)<1e-8);
 p.steps[1].technique='backhand';const m=C.playerMotion(p,1,0,i,root);assert.equal(m.hs,1);assert.equal(C.shotTechnique(p,1),'backhand');assert.ok(m.arms[1][0].x>m.arms[0][0].x);
 p.steps[1].technique='bad';assert.throws(()=>C.validate(p));
});
test('Animation controls are saved, undoable and file-compatible',()=>{
 const {d,w,a,close}=setup();d.querySelectorAll('.step')[0].click();const before=JSON.stringify(a.state().project),el=d.querySelector('#technique');el.value='backhand';el.dispatchEvent(new w.Event('change'));assert.equal(a.state().project.steps[0].technique,'backhand');assert.ok(w.Tactics.validate(JSON.parse(w.localStorage.getItem('shuttle-studio-v2'))));d.querySelector('#undo').click();assert.equal(JSON.stringify(a.state().project),before);close();
});
