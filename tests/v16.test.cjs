const test=require('node:test'),assert=require('node:assert/strict'),setup=require('./harness.cjs');

test('Rendered racket follows anatomical left/right on all four players, even after changing ends',()=>{
 const {d,a,close}=setup();
 d.querySelector('#sampleDoubles').click();
 for(let swapped=0;swapped<2;swapped++){
  for(let i=0;i<4;i++){
   d.querySelectorAll('#designer .dz-tabs button')[i].click();
   for(const [label,sign] of [['Phải',1],['Trái',-1]]){
    const button=[...d.querySelectorAll('#designer .hairbtn')].find(b=>b.textContent===label);button.click();
    const p=a.state().project.initial[i],lines=a.meshLines(p,i);
    // Inspect the actual geometry passed by personMesh to its draw primitive.
    const shaft=lines.find(l=>l.color==='#b9c8da');assert.ok(shaft);
    const worldRight=i%2===0?1:-1;
    assert.ok((shaft.points[0].x-p.x)*worldRight*sign>0,`${i}: ${label} racket is on the wrong side`);
    assert.ok((shaft.points[0].z-p.z)*(-worldRight)>0,'racket is forward of torso');
    const racket=lines.find(l=>l.points.length===25);assert.ok(racket);
    assert.ok(racket.points.every(q=>(q.x-p.x)*worldRight*sign>0));
   }
  }
  d.querySelector('#swapEnds').click();
 }
 close();
});

test('Appearance remains available while editing a phase, preserves phase and supports undo',()=>{
 const {d,a,close}=setup();d.querySelectorAll('.step')[2].click();
 d.querySelector('[data-panel="character"]').click();
 assert.equal(d.querySelector('#characterPanel').hidden,false);assert.equal(d.querySelector('#tacticsPanel').hidden,true);
 const before=JSON.stringify(a.state().project);
 [...d.querySelectorAll('.hairbtn')].find(b=>b.textContent==='Trái').click();
 assert.equal(a.state().selected,2);assert.equal(a.state().playing,false);
 d.querySelector('#undo').click();assert.equal(JSON.stringify(a.state().project),before);
 d.querySelector('[data-panel="tactics"]').click();assert.equal(a.state().selected,2);close();
});

test('Focus mode and phase navigation leave tactical data intact and pause playback',()=>{
 const {d,a,close}=setup(),data=JSON.stringify(a.state().project);
 d.querySelector('#focusMode').click();assert.ok(d.body.classList.contains('focus-mode'));
 assert.equal(d.querySelector('#focusMode').getAttribute('aria-pressed'),'true');
 d.querySelector('#nextPhase').click();assert.equal(a.state().selected,0);
 d.querySelector('#play').click();d.querySelector('#nextPhase').click();
 assert.equal(a.state().selected,1);assert.equal(a.state().playing,false);
 d.querySelector('#prevPhase').click();assert.equal(a.state().selected,0);
 assert.equal(JSON.stringify(a.state().project),data);close();
});

test('Repeat phase stays in chosen interval and switching phases pauses at exact start',()=>{
 const {d,w,a,close}=setup();d.querySelectorAll('.step')[1].click();
 const cb=d.querySelector('#repeatPhase');cb.checked=true;cb.dispatchEvent(new w.Event('change'));
 d.querySelector('#play').click();const p=a.state().project,start=w.Tactics.stepTime(p,1),end=start+p.steps[1].duration;
 let t=w.performance.now();for(let n=0;n<120;n++){t+=100;w.__raf(t);}
 assert.equal(a.state().selected,1);assert.ok(a.state().elapsed>=start&&a.state().elapsed<end);assert.ok(a.state().playing);
 d.querySelectorAll('.step')[2].click();assert.equal(a.state().playing,false);assert.equal(a.state().elapsed,w.Tactics.stepTime(p,2));
 d.querySelector('#play').click();for(let n=0;n<120;n++){t+=100;w.__raf(t);}
 assert.equal(a.state().selected,2);
 const loop=d.querySelector('#loop');loop.checked=true;loop.dispatchEvent(new w.Event('change'));assert.equal(cb.checked,false);
 close();
});

test('Cancelling arc drag finishes one undoable edit and a later move does not change it',()=>{
 const {d,w,a,close}=setup();d.querySelectorAll('.step')[0].click();
 const cv=d.querySelector('#arcPreview'),h=a.state().project.steps[0].height;
 const send=(type,x,y)=>cv.dispatchEvent(new w.MouseEvent(type,{clientX:x,clientY:y,bubbles:true}));
 send('pointerdown',100,40);send('pointermove',110,20);send('pointercancel',110,20);
 const after=a.state().project.steps[0].height;assert.ok(after>h);
 send('pointermove',110,0);assert.equal(a.state().project.steps[0].height,after);
 d.querySelector('#undo').click();assert.equal(a.state().project.steps[0].height,h);close();
});
