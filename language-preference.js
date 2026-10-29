(() => {
  const paths = { en: '/', fr: '/fr/', de: '/de/' };
  const key = 'clock-radio-language';
  const supported = (value) => Object.prototype.hasOwnProperty.call(paths, value);
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('.language-switcher a[hreflang]');
    if (!link || !supported(link.hreflang)) return;
    try { localStorage.setItem(key, link.hreflang); } catch (_) { /* Navigation still works without storage. */ }
  });
  // Explicit localized URLs stay shareable. Only the default entry page detects language.
  if (!['/', '/index.html'].includes(location.pathname)) return;
  let preferred;
  try { preferred = localStorage.getItem(key); } catch (_) { /* Use browser preferences. */ }
  if (!supported(preferred)) {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
    preferred = languages.map(language => language.toLowerCase().split(/[-_]/)[0]).find(supported) || 'en';
  }
  if (preferred !== 'en') location.replace(paths[preferred] + location.search + location.hash);
})();
