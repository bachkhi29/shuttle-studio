/* v1.3.0: nhan ten gon, lat ngang, thong ke, toan man hinh */
const test = require('node:test'), assert = require('node:assert/strict'), C = require('../core.js');
const setup = require('./harness.cjs');
function change(w, d, id, value) { const el = d.querySelector(id); el.value = value; el.dispatchEvent(new w.Event('change')); }

test('displayName: co ten chi hien ten, trong thi hien ma', () => {
  const p = C.base();
  assert.equal(C.displayName(p, 0), 'Minh');
  assert.equal(C.displayName(p, 3), 'Linh');
  p.names[0] = ''; assert.equal(C.displayName(p, 0), 'A1');
  p.names[1] = '   '; assert.equal(C.displayName(p, 1), 'B1');
  p.names[2] = '  Bảo  '; assert.equal(C.displayName(p, 2), 'Bảo');
  assert.deepEqual([0, 1, 2, 3].map(C.playerCode), ['A1', 'B1', 'A2', 'B2']);
});

test('mirror: lat x moi vi tri, lat 2 lan ve nhu cu, file van hop le', () => {
  const p = C.sample('doubles');
  const q = C.mirror(p);
  const neg = (a, b) => assert.ok(Math.abs(a + b) < 1e-9, a + ' khong phai so doi cua ' + b);
  q.initial.forEach((pt, i) => neg(pt.x, p.initial[i].x));
  q.steps.forEach((s, i) => {
    neg(s.target.x, p.steps[i].target.x);
    s.end.forEach((pt, j) => neg(pt.x, p.steps[i].end[j].x));
    assert.equal(s.target.z, p.steps[i].target.z);
  });
  assert.deepEqual(C.mirror(C.mirror(p)).initial, p.initial);
  assert.deepEqual(C.mirror(C.mirror(p)).steps.map(s => s.target), p.steps.map(s => s.target));
  assert.deepEqual(C.mirror(C.mirror(p)).steps.map(s => s.end), p.steps.map(s => s.end));
  assert.doesNotThrow(() => C.validate(JSON.parse(JSON.stringify(q))));
});

test('stats: dem dung pha, thoi gian, loai cau, nguoi danh', () => {
  const p = C.sample('singles');
  const st = C.stats(p);
  assert.equal(st.steps, 4);
  assert.equal(st.totalTime, p.steps.reduce((n, s) => n + s.duration, 0));
  assert.deepEqual(st.byType, { clear: 1, drop: 1, lift: 1, smash: 1 });
  assert.equal(st.byHitter.reduce((a, b) => a + b, 0), 4);
  assert.equal(st.landings, p.steps.filter(s => s.landing).length);
});

test('UI: the pha va o chon chi hien ten; xoa ten thi hien ma', () => {
  const { d, w, a, close } = setup();
  assert.equal(d.querySelector('.step span').textContent, 'Minh');
  const nameInput = d.querySelector('#players input');
  assert.equal(nameInput.placeholder, 'A1');
  nameInput.value = ''; nameInput.dispatchEvent(new w.Event('change'));
  assert.equal(a.state().project.names[0], '');
  assert.equal(d.querySelector('.step span').textContent, 'A1');
  d.querySelectorAll('.step')[0].click();
  d.querySelector('#editCurrent').click();
  const hitterOptions = [...d.querySelector('#hitter').options].map(o => o.textContent);
  assert.ok(hitterOptions.includes('A1'), 'select nguoi danh hien ma khi ten trong: ' + hitterOptions.join(','));
  assert.ok(!hitterOptions.some(t => t.includes('· Minh') || t.startsWith('A1 ·')), 'khong con ghep ma + ten');
  close();
});

test('UI: nut Lat ngang lat that va Hoan tac khoi phuc', () => {
  const { d, a, close } = setup();
  const before = JSON.stringify(a.state().project.initial);
  const x2 = a.state().project.initial[2].x;
  d.querySelector('#mirror').click();
  assert.equal(a.state().project.initial[2].x, -x2);
  assert.doesNotThrow(() => C.validate(JSON.parse(JSON.stringify(a.state().project))));
  d.querySelector('#undo').click();
  assert.equal(JSON.stringify(a.state().project.initial), before);
  close();
});

test('UI: thong ke hien khi mo hop Du an; co nut Toan man hinh', () => {
  const { d, close } = setup();
  assert.ok(d.querySelector('#fullscreen'), 'co nut toan man hinh');
  d.querySelector('#projectButton').click();
  const txt = d.querySelector('#statsBox').textContent;
  assert.ok(txt.includes('Tổng: 4 pha'), 'thong ke tong pha: ' + txt);
  assert.ok(txt.includes('Phông cao sâu'), 'thong ke theo loai cau: ' + txt);
  close();
});
