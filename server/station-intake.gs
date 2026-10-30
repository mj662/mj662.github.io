/* Bound to the private intake spreadsheet. No spreadsheet ID is stored in website source. */
const INTAKE_VERSION = '2026-10-27';
const INTAKE_TAB = 'Website submissions';
const OWNER_EMAIL = 'contact@beautifulclockradio.com';
const ALLOWED_ORIGINS = ['https://www.beautifulclockradio.com', 'https://beautifulclockradio.com', 'http://127.0.0.1:8765'];
const HEADERS = ['Received', 'Submission ID', 'Station name', 'Display name', 'Short description', 'Website', 'Representative', 'Contact email', 'Stream URL', 'Artwork URL', 'Restrictions or comments', 'Permission version', 'Language', 'Permission wording', 'Agreed', 'Source', 'Review status', 'Payload digest', 'Original submission JSON', 'Owner notification'];
/* Exact, versioned permission translations are inserted here during preparation. */
const PERMISSIONS = {
  "en": "I am authorized to grant these permissions on behalf of this station. I give Enjoyable Apps permission to list this station, provide playback of its official live stream, and display station artwork that we supply or approve in its current and future radio-player apps, including Best Clock Radio and Beautiful Clock Radio. This includes live listening and, where available, radio alarms and sleep timer use, subject to the station’s geographic restrictions and any conditions entered above.",
  "es": "Tengo autorización para conceder estos permisos en nombre de esta emisora. Doy permiso a Enjoyable Apps para incluir esta emisora en sus listados, reproducir su emisión oficial en directo y mostrar el material gráfico de la emisora que proporcionemos o aprobemos en sus apps actuales y futuras de reproducción de radio, incluidas Best Clock Radio y Beautiful Clock Radio. Esto incluye la escucha en directo y, cuando estén disponibles, el uso de alarmas de radio y del temporizador de apagado, sujeto a las restricciones geográficas de la emisora y a las condiciones indicadas anteriormente.",
  "fr": "Je suis habilité à accorder ces autorisations au nom de cette station. J’autorise Enjoyable Apps à référencer cette station, à permettre l’écoute de son flux officiel en direct et à afficher les visuels de la station que nous fournissons ou approuvons dans ses apps actuelles et futures de lecture radio, notamment Best Clock Radio et Beautiful Clock Radio. Cela comprend l’écoute en direct et, lorsqu’ils sont disponibles, l’utilisation des réveils radio et de la minuterie de mise en veille, sous réserve des restrictions géographiques de la station et des conditions indiquées ci-dessus.",
  "de": "Ich bin befugt, diese Erlaubnisse im Namen dieses Senders zu erteilen. Ich erlaube Enjoyable Apps, diesen Sender aufzulisten, seinen offiziellen Livestream wiederzugeben und von uns bereitgestellte oder genehmigte Sendergrafiken in seinen aktuellen und zukünftigen Radioplayer-Apps anzuzeigen, darunter Best Clock Radio und Beautiful Clock Radio. Dies umfasst das Livehören und, soweit verfügbar, die Nutzung von Radioweckern und Einschlaftimer, vorbehaltlich der geografischen Einschränkungen des Senders und der oben angegebenen Bedingungen."
};

function initializeStationIntake() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('Open this script from the existing intake spreadsheet.');
  PropertiesService.getScriptProperties().setProperty('STATION_SHEET_ID', book.getId());
  let sheet = book.getSheetByName(INTAKE_TAB);
  if (!sheet) sheet = book.insertSheet(INTAKE_TAB, 0);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#eaf2ff').setWrap(true);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 155);
    sheet.setColumnWidths(2, HEADERS.length - 1, 180);
    sheet.setColumnWidth(5, 260);
    sheet.setColumnWidth(11, 300);
    sheet.setColumnWidth(14, 420);
    sheet.setColumnWidth(19, 420);
  }
  verifyHeaders_(sheet);
  console.log('Station intake ready. Existing language response tabs were preserved.');
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({service: 'Enjoyable Apps station intake', version: INTAKE_VERSION})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(event) {
  const p = event && event.parameter || {};
  let result;
  try {
    if (!event || event.contentLength > 16000) fail_('invalid');
    const record = validateSubmission_(p);
    result = storeSubmission_(record);
  } catch (error) {
    result = {ok: false, code: error.intakeCode || 'unavailable', field: error.intakeField || ''};
    // Log error class only. Contact details and permission evidence stay in the Sheet.
    console.error('Station intake: ' + result.code);
  }
  return receipt_(p, result);
}

function fail_(code, field) {
  const error = new Error(code);
  error.intakeCode = code;
  error.intakeField = field || '';
  throw error;
}

function validateSubmission_(p) {
  if (!ALLOWED_ORIGINS.includes(p.origin)) fail_('invalid');
  if (!/^[a-f0-9-]{36}$/i.test(p.submission_id || '') || !/^[a-f0-9-]{36}$/i.test(p.response_token || '')) fail_('invalid');
  if (p.fax || p.permission !== 'agree' || p.permission_version !== INTAKE_VERSION) fail_('invalid', 'permission');
  if (!Object.prototype.hasOwnProperty.call(PERMISSIONS, p.language)) fail_('invalid', 'language');
  const elapsed = Date.now() - Number(p.started_at);
  if (!Number.isFinite(elapsed) || elapsed < 800 || elapsed > 7 * 86400000) fail_('invalid');
  const limits = {station_name: 120, display_name: 30, description: 60, website: 2048, representative: 120, email: 254, stream_url: 2048, artwork_url: 2048, comments: 2000};
  const data = {};
  Object.keys(limits).forEach(function(key) {
    const raw = String(p[key] || '');
    if (Array.from(raw).length > limits[key] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw)) fail_('invalid', key);
    data[key] = raw.trim();
  });
  ['station_name', 'website', 'representative', 'email'].forEach(function(key) { if (!data[key]) fail_('invalid', key); });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fail_('invalid', 'email');
  ['website', 'stream_url', 'artwork_url'].forEach(function(key) {
    if (!data[key]) return;
    if (key === 'website' && !/^[a-z][a-z0-9+.-]*:/i.test(data[key])) data[key] = 'https://' + data[key];
    if (!/^https?:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/i.test(data[key])) fail_('invalid', key);
  });
  data.language = p.language;
  data.permission_version = INTAKE_VERSION;
  data.permission_wording = PERMISSIONS[p.language];
  data.submission_id = p.submission_id;
  data.origin = p.origin;
  // Retain original field values, independently of any display/Sheet escaping.
  data.original = {};
  Object.keys(limits).forEach(function(key) { data.original[key] = String(p[key] || ''); });
  data.digest = digest_(JSON.stringify([data.original, data.language, data.permission_version, data.permission_wording]));
  return data;
}

function digest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8).map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

function sheetText_(value) {
  const text = String(value || '');
  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}

function verifyHeaders_(sheet) {
  if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]) !== JSON.stringify(HEADERS)) throw new Error('Intake schema mismatch');
}

function storeSubmission_(data) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) fail_('unavailable');
  let sheet, row, bookId, duplicate = false;
  try {
    bookId = PropertiesService.getScriptProperties().getProperty('STATION_SHEET_ID');
    if (!bookId) throw new Error('Intake not initialized');
    sheet = SpreadsheetApp.openById(bookId).getSheetByName(INTAKE_TAB);
    verifyHeaders_(sheet);
    const last = sheet.getLastRow();
    const existing = last > 1 ? sheet.getRange(2, 2, last - 1, 1).createTextFinder(data.submission_id).matchEntireCell(true).findNext() : null;
    if (existing) {
      row = existing.getRow();
      if (sheet.getRange(row, 18).getValue() !== data.digest) fail_('invalid');
      duplicate = true;
    } else {
      const cache = CacheService.getScriptCache();
      const hour = Math.floor(Date.now() / 3600000);
      const allKey = 'intake-hour-' + hour;
      const senderKey = allKey + '-' + digest_(data.email.toLowerCase());
      const count = Number(cache.get(allKey) || 0);
      const senderCount = Number(cache.get(senderKey) || 0);
      if (count >= 100 || senderCount >= 5) fail_('rate_limited');
      row = last + 1;
      const values = [new Date(), data.submission_id, data.station_name, data.display_name, data.description, data.website, data.representative, data.email, data.stream_url, data.artwork_url, data.comments, data.permission_version, data.language, data.permission_wording, true, data.origin, 'Pending verification', data.digest, JSON.stringify(data.original), 'Pending'];
      sheet.getRange(row, 1, 1, values.length).setValues([values.map(function(value) { return typeof value === 'string' ? sheetText_(value) : value; })]);
      sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
      SpreadsheetApp.flush();
      // A success receipt is possible only after verifying the durable write.
      if (sheet.getRange(row, 2).getValue() !== data.submission_id || sheet.getRange(row, 18).getValue() !== data.digest) throw new Error('Write verification failed');
      cache.put(allKey, String(count + 1), 3600);
      cache.put(senderKey, String(senderCount + 1), 3600);
    }
  } finally {
    lock.releaseLock();
  }
  if (!duplicate) {
    let notification = 'Not sent';
    try {
      if (MailApp.getRemainingDailyQuota() > 10) {
        MailApp.sendEmail({to: OWNER_EMAIL, subject: 'New Enjoyable Apps station submission', body: 'A station submission is ready for verification.\n\nStation: ' + data.station_name + '\nContact: ' + data.representative + '\nEmail: ' + data.email + '\nLanguage: ' + data.language + '\nReference: ' + data.submission_id + '\n\nPrivate log:\nhttps://docs.google.com/spreadsheets/d/' + bookId + '/edit\n\nThis is an intake record, not a verified station approval.'});
        notification = 'Sent';
      } else notification = 'Daily email allowance low; review Sheet';
    } catch (error) { notification = 'Email unavailable; review Sheet'; }
    try { sheet.getRange(row, 20).setValue(notification); } catch (error) { console.error('Notification status update unavailable'); }
  }
  return {ok: true, reference: data.submission_id};
}

function receipt_(p, result) {
  const message = {type: 'enjoyableapps-station-receipt', id: String(p.submission_id || ''), token: String(p.response_token || ''), ok: Boolean(result.ok), code: result.code || '', field: result.field || '', reference: result.reference || ''};
  const origin = ALLOWED_ORIGINS.includes(p.origin) ? p.origin : ALLOWED_ORIGINS[0];
  const safe = JSON.stringify(message).replace(/</g, '\\u003c');
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.top.postMessage(' + safe + ',' + JSON.stringify(origin) + ');</script></body></html>';
  // This hidden receipt contains no submitted station or contact data.
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
