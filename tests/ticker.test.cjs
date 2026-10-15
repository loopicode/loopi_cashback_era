const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../assets/custom-scripts.js'), 'utf8');
const ticker = source.slice(source.indexOf('// TICKET TAPE'), source.indexOf('// MEGA MENU'));
function fixture(tapes, home = true) {
  const pending = new Map();
  let id = 0;
  const document = {
    body: {classList: {contains: name => name === 'gradient' || (name === 'page-home' && home)}},
    querySelectorAll: () => tapes,
    createElement: () => ({style: {}, innerHTML: ''}),
    addEventListener: (name, fn) => {if (name === 'DOMContentLoaded') fn();},
  };
  vm.runInNewContext(ticker, {document, setTimeout: fn => {pending.set(++id, fn); return id;}, clearTimeout: key => pending.delete(key)});
  return {pending, tick() {const [key, fn] = pending.entries().next().value; pending.delete(key); fn();}};
}
function tape(hasText = true) {
  return {offsetWidth: 200, style: {height: '30px'}, innerHTML: '', children: [],
    querySelector: () => hasText ? {offsetWidth: 50, innerHTML: 'Hello'} : null,
    appendChild(node) {this.children.push(node);}};
}
let passed = 0;
function test(name, fn) {fn();passed++;console.log('PASS '+name);}
test('Homepage without ticker creates no timer and throws no error', () => assert.equal(fixture([]).pending.size, 0));
test('Ticker without expected text creates no timer and throws no error', () => assert.equal(fixture([tape(false)]).pending.size, 0));
test('Valid ticker keeps moving with one scheduled frame', () => {
  const el = tape();const state = fixture([el]);const initial = el.ary[0].style.left;
  for (let i = 0; i < 10; i++) {assert.equal(state.pending.size, 1);state.tick();}
  assert.notEqual(el.ary[0].style.left, initial);assert.equal(state.pending.size, 1);
});
test('Valid ticker still pauses and resumes on pointer hover', () => {
  const el = tape();const state = fixture([el]);el.onmouseover();assert.equal(state.pending.size, 0);el.onmouseout();assert.equal(state.pending.size, 1);
});
test('Non-home pages do not start ticker animation', () => assert.equal(fixture([tape()], false).pending.size, 0));
console.log(passed+' ticker regression tests passed');
