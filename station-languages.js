/* Public translations and versioned form links. No station submissions are stored here. */
(() => {
  "use strict";
  const locales = {
  "en": {
    "name": "English",
    "formId": "1FAIpQLScunfU1Xr44zUmVA2vM7pnvMm0rawGsvcClRjQQ0kvmA5W1xQ",
    "title": "For Radio Stations | Enjoyable Apps",
    "ourApps": "Our apps",
    "contact": "Contact",
    "language": "Language",
    "heading": "Add your station",
    "lead": "Best Clock Radio and Beautiful Clock Radio offer a full-featured clock radio for everyone. Fixed, non-scrolling preset buttons keep saved stations in predictable positions, helping older listeners and people with sight challenges.",
    "languageNote": "Changing language reloads the form. Complete your submission before switching.",
    "openForm": "Open form separately",
    "privacy": "Privacy policy (English)",
    "rights": "All rights reserved.",
    "iframeTitle": "Enjoyable Apps station details and permission form"
  },
  "es": {
    "name": "Español",
    "formId": "1FAIpQLSf88O0qbN4IKCc61auzqQor58Ay98JgVG6LjMNwzvxXzYtdlQ",
    "title": "Para emisoras de radio | Enjoyable Apps",
    "ourApps": "Nuestras apps",
    "contact": "Contacto",
    "language": "Idioma",
    "heading": "Añade tu emisora",
    "lead": "Best Clock Radio y Beautiful Clock Radio ofrecen un radio despertador completo para todos. Los botones fijos de emisoras guardadas, sin desplazamiento, mantienen posiciones predecibles y ayudan a los oyentes mayores y a las personas con dificultades de visión a encontrar sus emisoras.",
    "languageNote": "Al cambiar de idioma se vuelve a cargar el formulario. Envía tus respuestas antes de cambiar.",
    "openForm": "Abrir formulario por separado",
    "privacy": "Política de privacidad (en inglés)",
    "rights": "Todos los derechos reservados.",
    "iframeTitle": "Formulario de datos y permiso de la emisora de Enjoyable Apps"
  },
  "fr": {
    "name": "Français",
    "formId": "1FAIpQLSfD-ObJh34LQbRn-n62s0dWyECOSTLyeLbVZhtTuQnVg0mr8Q",
    "title": "Pour les stations de radio | Enjoyable Apps",
    "ourApps": "Nos apps",
    "contact": "Contact",
    "language": "Langue",
    "heading": "Ajoutez votre station",
    "lead": "Best Clock Radio et Beautiful Clock Radio offrent un radio-réveil complet pour tous. Les boutons fixes des stations mémorisées, sans défilement, restent à des emplacements prévisibles et aident les auditeurs âgés et les personnes ayant des difficultés visuelles à retrouver leurs stations.",
    "languageNote": "Changer de langue recharge le formulaire. Envoyez vos réponses avant de changer.",
    "openForm": "Ouvrir le formulaire séparément",
    "privacy": "Politique de confidentialité (en anglais)",
    "rights": "Tous droits réservés.",
    "iframeTitle": "Formulaire d’informations et d’autorisation de station Enjoyable Apps"
  },
  "de": {
    "name": "Deutsch",
    "formId": "1FAIpQLScVesPYDWw_vC2EyewhuFxisEV4iS0ZgF3aqWLqz4CtcF4saA",
    "title": "Für Radiosender | Enjoyable Apps",
    "ourApps": "Unsere Apps",
    "contact": "Kontakt",
    "language": "Sprache",
    "heading": "Fügen Sie Ihren Sender hinzu",
    "lead": "Best Clock Radio und Beautiful Clock Radio bieten einen voll ausgestatteten Radiowecker für alle. Feste Senderspeichertasten ohne Scrollen bleiben an vorhersehbaren Positionen und helfen älteren Hörern und Menschen mit Sehproblemen, ihre gespeicherten Sender zu finden.",
    "languageNote": "Ein Sprachwechsel lädt das Formular neu. Senden Sie Ihre Angaben vor dem Wechsel ab.",
    "openForm": "Formular separat öffnen",
    "privacy": "Datenschutzerklärung (auf Englisch)",
    "rights": "Alle Rechte vorbehalten.",
    "iframeTitle": "Formular für Senderangaben und Erlaubnis von Enjoyable Apps"
  }
};

  const available = Object.keys(locales).filter(code => locales[code].formId);
  const picker = document.getElementById("station-language");
  const savedKey = "enjoyableapps-station-language";
  const normalize = value => String(value || "").toLowerCase().split(/[-_]/)[0];
  const supported = value => available.includes(normalize(value)) ? normalize(value) : null;
  let saved = null;
  try { saved = localStorage.getItem(savedKey); } catch (_) {}
  const requested = new URLSearchParams(location.search).get("lang");
  const detected = (navigator.languages || [navigator.language]).map(supported).find(Boolean);
  const initial = supported(requested) || supported(saved) || detected || "en";
  picker.replaceChildren(...available.map(code => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = locales[code].name;
    return option;
  }));
  function applyLanguage(code) {
    const text = locales[code];
    document.documentElement.lang = code;
    document.title = text.title;
    document.querySelectorAll("[data-i18n]").forEach(element => {
      const value = text[element.dataset.i18n];
      if (typeof value === "string") element.textContent = value;
    });
    const url = "https://docs.google.com/forms/d/e/" + text.formId + "/viewform";
    document.getElementById("station-form-link").href = url + "?hl=" + code;
    const frame = document.querySelector("iframe");
    const embed = url + "?embedded=true&hl=" + code;
    if (frame.getAttribute("src") !== embed) frame.src = embed;
    frame.title = text.iframeTitle;
    picker.value = code;
  }
  document.getElementById("language-picker").hidden = available.length < 2;
  document.getElementById("language-note").hidden = available.length < 2;
  picker.addEventListener("change", () => {
    const code = supported(picker.value) || "en";
    applyLanguage(code);
    try { localStorage.setItem(savedKey, code); } catch (_) {}
    const url = new URL(location.href);
    url.searchParams.set("lang", code);
    history.replaceState(null, "", url);
  });
  applyLanguage(initial);
})();
