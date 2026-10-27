const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');

function setup(search = '', browserLanguage = 'en') {
  const handlers = {};
  const nodes = new Map();
  const inputs = [];
  class Node {
    constructor(id) { this.id = id; this.value = ''; this.hidden = false; this.checked = false; this.type = 'text'; this.dataset = {}; this.events = {}; this.attributes = {}; this.classList = {toggle() {}}; }
    addEventListener(name, callback) { this.events[name] = callback; }
    setAttribute(key, value) { this.attributes[key] = value; }
    removeAttribute(key) { delete this.attributes[key]; }
    setCustomValidity(message) { this.validationMessage = message; }
    focus() { this.focused = true; }
    closest() { return null; }
    replaceChildren(...children) { this.children = children; }
  }
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Node(id)); return nodes.get(id); };
  const names = ['station_name', 'website', 'representative', 'email', 'display_name', 'description', 'stream_url', 'artwork_url', 'comments', 'permission', 'language', 'permission_version', 'submission_id', 'response_token', 'started_at', 'origin', 'fax'];
  for (const name of names) { const node = get(name); node.name = name; inputs.push(node); }
  get('permission').type = 'checkbox';
  get('permission').value = 'agree';
  get('permission').checked = true;
  get('station_name').value = 'TEST ONLY — No station approval';
  get('website').value = 'https://example.com';
  get('email').value = 'test@example.com';
  get('representative').value = 'Technical test';
  get('display_name').dataset.limit = '30';
  get('description').dataset.limit = '60';
  const form = get('station-form');
  form.elements = {namedItem: get};
  form.querySelectorAll = () => inputs.filter(input => input.dataset.limit);
  form.reportValidity = () => true;
  form.reset = () => { inputs.forEach(input => { input.value = ''; input.checked = false; }); };
  get('success').hidden = true;
  let timer;
  let submits = 0;
  const localStorage = new Map();
  const window = {addEventListener: (name, callback) => handlers[name] = callback};
  const document = {getElementById: get, documentElement: {}, querySelectorAll: () => [], querySelector: selector => selector.includes('display_name') ? get('display-counter') : get('description-counter'), createElement: () => new Node('option')};
  const context = vm.createContext({window, document, location: {search, href: 'https://www.beautifulclockradio.com/stations.html' + search, origin: 'https://www.beautifulclockradio.com'}, navigator: {languages: [browserLanguage]}, history: {replaceState() {}}, localStorage: {getItem: key => localStorage.get(key), setItem: (key, value) => localStorage.set(key, value)}, URL, URLSearchParams, crypto, setTimeout: callback => { timer = callback; return 1; }, clearTimeout() {}, HTMLFormElement: {prototype: {submit() { submits++; }}}, FormData: class { constructor() { return inputs.filter(input => input.type !== 'checkbox' || input.checked).map(input => [input.name, input.value]); }} });
  window.STATION_FORM_CONFIG = {endpoint: 'https://script.google.com/macros/s/test-deployment/exec', permissionVersion: '2026-10-27'};
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../station-languages.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../station-form.js'), 'utf8'), context);
  const submit = () => form.events.submit({preventDefault() {}});
  const receipt = (overrides = {}, origin = 'https://n-test-script.googleusercontent.com') => handlers.message({origin, data: {type: 'enjoyableapps-station-receipt', id: get('submission_id').value, token: get('response_token').value, ok: true, reference: get('submission_id').value, ...overrides}});
  return {get, form, document, submit, receipt, timeout: () => timer(), submits: () => submits};
}

test('URL and browser language select translated forms with English fallback', () => {
  assert.equal(setup('', 'de-DE').document.documentElement.lang, 'de');
  assert.equal(setup('?lang=fr', 'de-DE').document.documentElement.lang, 'fr');
  assert.equal(setup('', 'ja-JP').document.documentElement.lang, 'en');
});

test('only a matching receipt from the Google service confirms success', () => {
  const s = setup();
  s.submit();
  assert.equal(s.submits(), 1);
  assert.equal(s.get('success').hidden, true);
  s.receipt({}, 'https://untrusted.example.com');
  s.receipt({token: 'incorrect'});
  s.receipt({reference: 'incorrect'});
  assert.equal(s.get('success').hidden, true);
  s.receipt();
  assert.equal(s.get('success').hidden, false);
  assert.equal(s.form.hidden, true);
});

test('timeout preserves answers and retry ID without claiming success', () => {
  const s = setup();
  s.submit();
  const id = s.get('submission_id').value;
  s.timeout();
  assert.equal(s.get('success').hidden, true);
  assert.equal(s.get('station_name').value, 'TEST ONLY — No station approval');
  assert.equal(s.get('submit-button').disabled, false);
  s.submit();
  assert.equal(s.get('submission_id').value, id);
  assert.equal(s.submits(), 2);
});

test('server rejection preserves answers and allows correction', () => {
  const s = setup();
  s.submit();
  s.receipt({ok: false, code: 'invalid', field: 'email'});
  assert.equal(s.form.hidden, false);
  assert.equal(s.get('email').value, 'test@example.com');
  assert.equal(s.get('email').attributes['aria-invalid'], 'true');
});

test('language changes preserve fields and require reviewing translated permission', () => {
  const s = setup();
  s.get('station-language').value = 'es';
  s.get('station-language').events.change();
  assert.equal(s.get('station_name').value, 'TEST ONLY — No station approval');
  assert.equal(s.get('permission').checked, false);
  assert.equal(s.get('language').value, 'es');
});

test('display and description counters enforce multilingual character limits', () => {
  const s = setup();
  s.get('display_name').value = 'a'.repeat(31);
  s.form.events.input({target: s.get('display_name')});
  assert.match(s.get('display_name').validationMessage, /30/);
  assert.equal(s.get('display-counter').textContent, '31/30 characters');
  s.get('description').value = '🎵'.repeat(60);
  s.form.events.input({target: s.get('description')});
  assert.equal(s.get('description').validationMessage, '');
  assert.equal(s.get('description-counter').textContent, '60/60 characters');
});
