(() => {
  'use strict';
  const locales = window.STATION_LOCALES;
  const config = window.STATION_FORM_CONFIG || {};
  const form = document.getElementById('station-form');
  const picker = document.getElementById('station-language');
  const button = document.getElementById('submit-button');
  const status = document.getElementById('form-status');
  const success = document.getElementById('success');
  const supported = value => {
    const code = String(value || '').toLowerCase().split(/[-_]/)[0];
    return Object.prototype.hasOwnProperty.call(locales, code) ? code : null;
  };
  const savedKey = 'enjoyableapps-station-language';
  let saved;
  try { saved = localStorage.getItem(savedKey); } catch (_) {}
  let language = supported(new URLSearchParams(location.search).get('lang')) || supported(saved) || (navigator.languages || [navigator.language]).map(supported).find(Boolean) || 'en';
  let pending = null;
  let lastAttempt = null;
  let timeout = null;
  let currentStatus = '';
  const values = name => form.elements.namedItem(name);
  const text = key => locales[language][key];
  const count = value => Array.from(value).length;
  const format = (message, replacements) => message.replace(/\{(\w+)\}/g, (_, key) => replacements[key]);
  const uuid = () => crypto.randomUUID();

  function validateLimits() {
    form.querySelectorAll('[data-limit]').forEach(input => {
      const maximum = Number(input.dataset.limit);
      const tooLong = count(input.value) > maximum;
      input.setCustomValidity(tooLong ? format(text('limit'), {max: maximum}) : '');
      if (!tooLong) input.removeAttribute('aria-invalid');
      const counter = document.querySelector('[data-counter="' + input.id + '"]');
      if (counter) {
        counter.textContent = format(text('counter'), {count: count(input.value), max: maximum});
        counter.classList.toggle('over-limit', tooLong);
      }
    });
  }

  function setStatus(key) {
    currentStatus = key;
    status.textContent = key ? text(key) : '';
    status.hidden = !key;
  }

  function applyLanguage(code, manual) {
    language = code;
    document.documentElement.lang = code;
    document.title = text('title');
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = text(element.dataset.i18n);
      if (typeof value === 'string') element.textContent = value;
    });
    document.querySelectorAll('[data-placeholder]').forEach(element => { element.placeholder = text(element.dataset.placeholder); });
    picker.value = code;
    values('language').value = code;
    // The accepted wording and recorded language must match what was reviewed.
    if (manual) values('permission').checked = false;
    validateLimits();
    if (currentStatus) setStatus(currentStatus);
    if (pending) button.textContent = text('sending');
  }

  picker.replaceChildren(...Object.keys(locales).map(code => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = locales[code].name;
    return option;
  }));
  document.getElementById('language-picker').hidden = false;
  picker.addEventListener('change', () => {
    applyLanguage(supported(picker.value) || 'en', true);
    try { localStorage.setItem(savedKey, language); } catch (_) {}
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
  });
  form.addEventListener('input', event => {
    event.target.removeAttribute('aria-invalid');
    validateLimits();
    lastAttempt = null;
  });
  form.addEventListener('invalid', event => {
    event.target.setAttribute('aria-invalid', 'true');
    const details = event.target.closest('details');
    if (details) details.open = true;
  }, true);

  function finishPending() {
    clearTimeout(timeout);
    timeout = null;
    pending = null;
    button.disabled = false;
    picker.disabled = false;
    button.textContent = text('submit');
    form.removeAttribute('aria-busy');
  }

  function trustedReceipt(event) {
    if (!pending || !/^https:\/\/(?:script|[a-z0-9-]+-script)\.googleusercontent\.com$/.test(event.origin)) return false;
    const message = event.data;
    return message && message.type === 'enjoyableapps-station-receipt' && message.id === pending.id && message.token === pending.token && typeof message.ok === 'boolean';
  }

  window.addEventListener('message', event => {
    if (!trustedReceipt(event)) return;
    const message = event.data;
    if (message.ok && message.reference !== pending.id) return;
    finishPending();
    if (message.ok) {
      document.getElementById('submission-reference').textContent = message.reference;
      setStatus('');
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } else {
      setStatus(message.code === 'rate_limited' ? 'rateError' : 'error');
      const input = message.field && values(message.field);
      if (input && input.type !== 'hidden') {
        input.setAttribute('aria-invalid', 'true');
        const details = input.closest('details');
        if (details) details.open = true;
        input.focus();
      } else status.focus();
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (pending) return;
    validateLimits();
    if (!form.reportValidity()) return;
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.endpoint || '')) {
      setStatus('unavailable');
      status.focus();
      return;
    }
    // The same unchanged retry reuses its ID, preventing duplicate Sheet rows.
    const snapshot = JSON.stringify(Array.from(new FormData(form)).filter(([key]) => !['submission_id', 'response_token', 'started_at', 'origin'].includes(key)));
    if (!lastAttempt || lastAttempt.snapshot !== snapshot) lastAttempt = {snapshot, id: uuid()};
    pending = {id: lastAttempt.id, token: uuid()};
    values('submission_id').value = pending.id;
    values('response_token').value = pending.token;
    values('origin').value = location.origin;
    values('permission_version').value = config.permissionVersion;
    form.action = config.endpoint;
    setStatus('');
    button.disabled = true;
    picker.disabled = true;
    button.textContent = text('sending');
    form.setAttribute('aria-busy', 'true');
    timeout = setTimeout(() => { finishPending(); setStatus('error'); status.focus(); }, 45000);
    // A hidden iframe load is never treated as success. Only the server's
    // nonce-matched receipt, sent after the Sheet write, confirms acceptance.
    HTMLFormElement.prototype.submit.call(form);
  });

  document.getElementById('another-station').addEventListener('click', () => {
    form.reset();
    lastAttempt = null;
    values('started_at').value = Date.now();
    applyLanguage(language, false);
    success.hidden = true;
    form.hidden = false;
    values('station_name').focus();
  });
  values('started_at').value = Date.now();
  values('permission_version').value = config.permissionVersion;
  applyLanguage(language, false);
  button.disabled = false;
})();
