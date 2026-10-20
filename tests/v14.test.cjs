/* v1.4.0: quy dao lech dinh, keo duong cau, thiet ke nhan vat */
const test = require('node:test'), assert = require('node:assert/strict'), C = require('../core.js');
const setup = require('./harness.cjs');
const pev = (x, y) => ({ button: 0, pointerId: 1, clientX: x, clientY: y, preventDefault() {}, pointerType: 'mouse' });

test('peak=.5 trung khit cong thuc quy dao cu', () => {
  const p = C.sample('doubles');
  for (let i = 0; i < p.steps.length; i++) {
    const a = C.origin(p, i), b = C.endPoint(p, i), s = p.steps[i];
    for (let j = 0; j <= 20; j++) {
      const t = j / 20, legacy = a.y + (b.y - a.y) * t + 4 * s.height * t * (1 - t);
      assert.ok(Math.abs(C.ball(p, i, t).y - legacy) < 1e-9, 'step ' + i + ' t=' + t);
    }
  }
});

test('peak lech: dinh nam dung vi tri chon, hai dau khong doi', () => {
  const p = C.sample('singles');
  for (const pk of [.2, .35, .65, .8]) {
    p.steps[0].peak = pk;
    let am = 0, av = -1;
    for (let j = 0; j <= 200; j++) { const y = C.ball(p, 0, j / 200).y; if (y > av) { av = y; am = j / 200; } }
    assert.ok(Math.abs(am - pk) < .01, 'peak ' + pk + ' dinh o ' + am);
    const nearPt = (u, v) => assert.ok(Math.abs(u.x - v.x) < 1e-9 && Math.abs(u.y - v.y) < 1e-9 && Math.abs(u.z - v.z) < 1e-9, JSON.stringify(u) + ' vs ' + JSON.stringify(v));
    nearPt(C.ball(p, 0, 0), C.origin(p, 0));
    nearPt(C.ball(p, 0, 1), C.endPoint(p, 0));
  }
  const hMid = C.netHeight((() => { const q = C.sample('singles'); return q; })(), 0);
  p.steps[0].peak = .8;
  assert.ok(C.netHeight(p, 0) < hMid, 'dinh lech muon -> cau qua luoi thap hon');
});

test('validate: peak ngoai khoang bi tu choi, file cu thieu peak van mo duoc', () => {
  const p = C.sample();
  p.steps[0].peak = 2; assert.throws(() => C.validate(p));
  p.steps[0].peak = .3; assert.doesNotThrow(() => C.validate(JSON.parse(JSON.stringify(p))));
  const old = C.sample(); old.steps.forEach(s => delete s.peak);
  assert.doesNotThrow(() => C.validate(JSON.parse(JSON.stringify(old))));
  assert.deepEqual(C.ball(old, 0, .5).y, C.ball(C.sample(), 0, .5).y);
});

test('appearance: mac dinh dung mau doi, ghi de tung phan, validate chat', () => {
  const p = C.base();
  const a0 = C.appearanceOf(p, 0);
  assert.equal(a0.shirt, '#f7a8bc');
  assert.equal(a0.hairStyle, 'short');
  p.appearance = [{ shirt: '#ffd166' }, {}, {}, {}];
  assert.equal(C.appearanceOf(p, 0).shirt, '#ffd166');
  assert.equal(C.appearanceOf(p, 0).hairStyle, 'short');
  assert.equal(C.appearanceOf(p, 1).shirt, '#92d7bf');
  assert.doesNotThrow(() => C.validate(JSON.parse(JSON.stringify(p))));
  const bad = C.base(); bad.appearance = [{ hair: 'red' }, {}, {}, {}];
  assert.throws(() => C.validate(bad));
  const bad2 = C.base(); bad2.appearance = [{ hairStyle: 'mohawk' }, {}, {}, {}];
  assert.throws(() => C.validate(bad2));
  const m = C.mirror(p);
  assert.deepEqual(m.appearance, p.appearance);
});

test('UI: slider Vi tri dinh doi peak cua pha', () => {
  const { d, w, a, close } = setup();
  d.querySelectorAll('.step')[0].click();
  d.querySelector('#editCurrent').click();
  const slider = d.querySelector('#peak');
  assert.ok(slider, 'co slider peak');
  slider.value = '0.7';
  slider.dispatchEvent(new w.Event('input'));
  assert.ok(Math.abs(a.state().project.steps[0].peak - .7) < 1e-9);
  assert.equal(d.querySelector('#peakVal').textContent, '70%');
  slider.dispatchEvent(new w.Event('change'));
  close();
});

test('UI: keo tren bieu do mat cat doi do vong va dinh', () => {
  const { d, w, a, close } = setup();
  d.querySelectorAll('.step')[0].click();
  d.querySelector('#editCurrent').click();
  const cv = d.querySelector('#arcPreview'), before = { h: a.state().project.steps[0].height, pk: a.state().project.steps[0].peak ?? .5 };
  const fire = (type, x, y) => cv.dispatchEvent(new w.MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
  fire('pointerdown', 100, 30);
  fire('pointermove', 160, 10);
  const mid = a.state().project.steps[0];
  assert.ok(mid.height > before.h, 'keo len -> do vong tang: ' + before.h + ' -> ' + mid.height);
  assert.ok(mid.peak > before.pk, 'keo ngang -> dinh dich phai: ' + before.pk + ' -> ' + mid.peak);
  fire('pointerup', 160, 10);
  close();
});

test('UI: keo duong vang tren san doi quy dao', () => {
  const { d, w, a, close } = setup();
  d.querySelectorAll('.step')[0].click();
  d.querySelector('#editCurrent').click();
  a.draw();
  const s = a.state(), step = s.project.steps[0];
  const mid = w.Tactics.ball(s.project, 0, .5), scr = w.Tactics.project(mid, s.cam, 1000, 650);
  const beforeH = step.height, beforePeak = step.peak ?? .5;
  const cv = d.querySelector('#court');
  cv.onpointerdown(pev(scr.x, scr.y));
  cv.onpointermove(pev(scr.x + 60, scr.y - 40));
  cv.onpointerup(pev(scr.x + 60, scr.y - 40));
  const after = a.state().project.steps[0];
  assert.ok(after.height > beforeH, 'do vong tang: ' + beforeH + ' -> ' + after.height);
  assert.ok(after.peak > beforePeak, 'dinh dich phai: ' + beforePeak + ' -> ' + after.peak);
  d.querySelector('#undo').click();
  assert.equal(a.state().project.steps[0].height, beforeH);
  close();
});

test('UI: thiet ke nhan vat doi ao va kieu toc, luu hop le', () => {
  const { d, w, a, close } = setup();
  const rows = d.querySelectorAll('#designer .dz-row');
  assert.ok(rows.length >= 7, 'designer co du dong (tay vot, toc, 5 mau): ' + rows.length);
  const shirtRow = [...rows].find(r => r.querySelector('.dz-label').textContent === 'Áo');
  const gold = [...shirtRow.querySelectorAll('.sw')].find(b => b.title === '#ffd166');
  assert.ok(gold, 'co o mau vang cho ao');
  gold.click();
  assert.equal(a.state().project.appearance[0].shirt, '#ffd166');
  const hairRow = [...rows].find(r => r.querySelector('.dz-label').textContent === 'Kiểu tóc');
  const spiky = [...hairRow.querySelectorAll('.hairbtn')].find(b => b.textContent === 'Dựng');
  spiky.click();
  assert.equal(a.state().project.appearance[0].hairStyle, 'spiky');
  assert.doesNotThrow(() => w.Tactics.validate(JSON.parse(w.localStorage.getItem('shuttle-studio-v2'))));
  a.draw();
  close();
});
