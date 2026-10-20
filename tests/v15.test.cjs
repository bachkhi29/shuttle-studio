/* v1.5.0: tay cam vot, doi dau san, chep thiet ke, phim mui ten */
const test = require('node:test'), assert = require('node:assert/strict'), C = require('../core.js');
const setup = require('./harness.cjs');

test('hand: mac dinh phai, validate chat', () => {
  const p = C.base();
  assert.equal(C.appearanceOf(p, 0).hand, 'right');
  p.appearance = [{ hand: 'left' }, {}, {}, {}];
  assert.equal(C.appearanceOf(p, 0).hand, 'left');
  assert.doesNotThrow(() => C.validate(JSON.parse(JSON.stringify(p))));
  const bad = C.base(); bad.appearance = [{ hand: 'up' }, {}, {}, {}];
  assert.throws(() => C.validate(bad));
});

test('swapEnds: doi 2 lan ve nhu cu, ten va thiet ke di theo nguoi', () => {
  const p = C.sample('doubles');
  p.appearance = [0, 1, 2, 3].map(j => C.appearanceOf(p, j));
  p.appearance[0].shirt = '#ffd166';
  const q = C.swapEnds(p);
  assert.equal(q.names[0], p.names[1]);
  assert.equal(q.names[1], p.names[0]);
  assert.equal(q.appearance[0].shirt, p.appearance[1].shirt);
  assert.equal(q.appearance[1].shirt, '#ffd166');
  q.initial.forEach((pt, i) => {
    const src = p.initial[[1, 0, 3, 2][i]];
    assert.ok(Math.abs(pt.x - src.x) < 1e-9 && Math.abs(pt.z + src.z) < 1e-9, 'initial ' + i);
    assert.ok(pt.z * C.side(i) >= .15, 'dung nua san ' + i);
  });
  assert.notEqual(C.side(q.steps[0].hitter), C.side(p.steps[0].hitter));
  assert.doesNotThrow(() => C.validate(JSON.parse(JSON.stringify(q))));
  const r = C.swapEnds(q);
  assert.deepEqual(r.initial, p.initial);
  assert.deepEqual(r.names, p.names);
  assert.deepEqual(r.steps.map(s => s.hitter), p.steps.map(s => s.hitter));
  assert.deepEqual(r.steps.map(s => s.target), p.steps.map(s => s.target));
  assert.deepEqual(r.steps.map(s => s.end), p.steps.map(s => s.end));
});

test('UI: chon tay trai luu vao appearance va ve khong loi', () => {
  const { d, w, a, close } = setup();
  const rows = d.querySelectorAll('#designer .dz-row');
  const handRow = rows[0];
  assert.equal(handRow.querySelector('.dz-label').textContent, 'Tay vợt');
  const left = [...handRow.querySelectorAll('.hairbtn')].find(b => b.textContent === 'Trái');
  left.click();
  assert.equal(a.state().project.appearance[0].hand, 'left');
  a.draw();
  assert.doesNotThrow(() => w.Tactics.validate(JSON.parse(w.localStorage.getItem('shuttle-studio-v2'))));
  close();
});

test('UI: tieu de muc Tuy chinh va nut chep cho dong doi o che do doi', async () => {
  const { d, a, close } = setup();
  assert.ok(d.querySelector('#designer b').textContent.includes('Tùy chỉnh nhân vật'));
  d.querySelector('#sampleDoubles').click();
  await new Promise(r => setTimeout(r, 30));
  const cp = [...d.querySelectorAll('#designer .dz-copy')][0];
  assert.ok(cp, 'co nut chep thiet ke');
  const rows = d.querySelectorAll('#designer .dz-row');
  const gold = [...rows[2].querySelectorAll('.sw')].find(b => b.title === '#ffd166');
  gold.click();
  assert.equal(a.state().project.appearance[0].shirt, '#ffd166');
  cp.click();
  assert.equal(a.state().project.appearance[2].shirt, '#ffd166');
  close();
});

test('UI: nut Doi dau san lat z doi hinh va Hoan tac khoi phuc', () => {
  const { d, a, close } = setup();
  const name0 = a.state().project.names[0], x2 = a.state().project.initial[2].x;
  d.querySelector('#swapEnds').click();
  assert.notEqual(a.state().project.names[0], name0, 'nguoi dung o slot 0 da doi');
  assert.equal(a.state().project.initial[2].x, -x2, 'vi tri doi qua dau san doi dien');
  d.querySelector('#undo').click();
  assert.equal(a.state().project.initial[2].x, x2);
  assert.equal(a.state().project.names[0], name0);
  close();
});

test('UI: phim mui ten chuyen pha tien va lui', () => {
  const { d, w, a, close } = setup();
  const fire = key => d.body.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true }));
  fire('ArrowRight');
  assert.equal(a.state().selected, 0);
  fire('ArrowRight');
  assert.equal(a.state().selected, 1);
  fire('ArrowLeft');
  assert.equal(a.state().selected, 0);
  fire('ArrowLeft');
  assert.equal(a.state().selected, -1);
  close();
});
