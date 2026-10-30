const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname, '../server/station-intake.gs'), 'utf8');

function setup() {
  const rows = [];
  const cache = new Map();
  let writeFails = false;
  let notices = 0;
  const sheet = {
    getLastRow: () => rows.length,
    getRange(row, col, height = 1, width = 1) {
      return {
        getValues: () => Array.from({length: height}, (_, i) => Array.from({length: width}, (_, j) => rows[row - 1 + i]?.[col - 1 + j] ?? '')),
        getValue: () => rows[row - 1]?.[col - 1] ?? '',
        setValues(values) { if (writeFails) throw Error('Storage unavailable'); values.forEach((v, i) => { rows[row - 1 + i] ||= []; v.forEach((x, j) => rows[row - 1 + i][col - 1 + j] = x); }); return this; },
        setValue(value) { rows[row - 1][col - 1] = value; return this; },
        setNumberFormat() { return this; },
        createTextFinder(value) { return {matchEntireCell() { return this; }, findNext() { const i = rows.findIndex((r, index) => index >= row - 1 && r[col - 1] === value); return i < 0 ? null : {getRow: () => i + 1}; }}; }
      };
    }
  };
  const context = vm.createContext({
    console: {error() {}, log() {}},
    Utilities: {DigestAlgorithm: {SHA_256: 'sha256'}, Charset: {UTF_8: 'utf8'}, computeDigest: (_, value) => [...crypto.createHash('sha256').update(value).digest()]},
    PropertiesService: {getScriptProperties: () => ({getProperty: () => 'PRIVATE-SHEET-ID'})},
    SpreadsheetApp: {openById: () => ({getSheetByName: () => sheet}), flush() {}},
    CacheService: {getScriptCache: () => ({get: key => cache.get(key), put: (key, value) => cache.set(key, value)})},
    LockService: {getScriptLock: () => ({tryLock: () => true, releaseLock() {}})},
    MailApp: {getRemainingDailyQuota: () => 100, sendEmail: message => { assert.equal(message.to, 'contact@beautifulclockradio.com'); notices++; }},
    HtmlService: {XFrameOptionsMode: {ALLOWALL: 'ALLOWALL'}, createHtmlOutput: html => ({html, setXFrameOptionsMode() { return this; }})}
  });
  vm.runInContext(source, context);
  rows.push(vm.runInContext('HEADERS.slice()', context));
  const valid = () => ({origin: 'https://www.beautifulclockradio.com', submission_id: crypto.randomUUID(), response_token: crypto.randomUUID(), started_at: String(Date.now() - 5000), station_name: 'TEST ONLY — Not a station approval', display_name: 'Test Radio', description: 'Test description', website: 'example.com', representative: 'Technical test', email: 'test@example.com', stream_url: '', artwork_url: '', comments: '', language: 'en', permission: 'agree', permission_version: '2026-10-27', fax: ''});
  return {context, rows, valid, failWrites: () => writeFails = true, notices: () => notices};
}

test('validated submission preserves exact permission and separate display fields', () => {
  const {context, valid} = setup();
  const data = context.validateSubmission_(valid());
  assert.equal(data.website, 'https://example.com');
  assert.equal(data.display_name, 'Test Radio');
  assert.equal(data.description, 'Test description');
  assert.match(data.permission_wording, /^I am authorized/);
  assert.equal(data.permission_version, '2026-10-27');
});

test('rejects missing permission, invalid email, unsupported language and overlong display text', () => {
  const {context, valid} = setup();
  for (const changes of [{permission: ''}, {email: 'broken'}, {language: '__proto__'}, {display_name: 'a'.repeat(31)}, {description: 'a'.repeat(61)}, {website: 'javascript:alert(1)'}, {fax: 'bot'}]) {
    assert.throws(() => context.validateSubmission_({...valid(), ...changes}));
  }
});

test('unicode limits count code points consistently', () => {
  const {context, valid} = setup();
  assert.equal(context.validateSubmission_({...valid(), display_name: 'é'.repeat(30)}).display_name.length, 30);
  assert.doesNotThrow(() => context.validateSubmission_({...valid(), description: '🎵'.repeat(60)}));
  assert.throws(() => context.validateSubmission_({...valid(), description: '🎵'.repeat(61)}));
});

test('duplicate unchanged retry produces one durable row and one owner notice', () => {
  const {context, rows, valid, notices} = setup();
  const data = context.validateSubmission_(valid());
  assert.equal(context.storeSubmission_(data).ok, true);
  assert.equal(context.storeSubmission_(data).ok, true);
  assert.equal(rows.length, 2);
  assert.equal(notices(), 1);
  assert.equal(rows[1][16], 'Pending verification');
  assert.throws(() => context.storeSubmission_({...data, digest: 'different'}));
});

test('failed persistence never returns a successful receipt', () => {
  const {context, valid, failWrites} = setup();
  failWrites();
  const output = context.doPost({parameter: valid(), contentLength: 1000});
  assert.match(output.html, /"ok":false/);
  assert.doesNotMatch(output.html, /"ok":true/);
});

test('spreadsheet formulas are escaped while original evidence remains unchanged', () => {
  const {context, rows, valid} = setup();
  const raw = '=IMPORTXML("https://example.com","x")';
  const data = context.validateSubmission_({...valid(), comments: raw});
  context.storeSubmission_(data);
  assert.equal(rows[1][10], "'" + raw);
  assert.equal(JSON.parse(rows[1][18]).comments, raw);
});

test('receipt never includes contact data and escapes script markup', () => {
  const {context, valid} = setup();
  const p = {...valid(), submission_id: '</script><evil>'};
  const output = context.receipt_(p, {ok: false, code: 'invalid'});
  assert.doesNotMatch(output.html, /<evil>|test@example.com|PRIVATE-SHEET-ID/);
  assert.match(output.html, /\\u003c/);
});

test('all locale permission text matches the displayed version', () => {
  const {context} = setup();
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '../station-languages.js'), 'utf8'), {window: sandbox});
  for (const code of ['en', 'es', 'fr', 'de']) assert.equal(sandbox.STATION_LOCALES[code].permission, vm.runInContext('PERMISSIONS[' + JSON.stringify(code) + ']', context));
});
