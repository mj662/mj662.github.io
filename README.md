# Best Clock Radio App Landing Page

This repository contains the landing page for the Best Clock Radio app, a feature-rich podcast and streaming radio/music player for iPhone and iPad.

## Description

The Best Clock Radio app landing page is a single-page website that showcases the key features and benefits of the app. It's built using HTML and styled with Tailwind CSS for a responsive and modern design.

## Features

- Responsive design that works on desktop and mobile devices
- Hero section with app description and App Store download link
- Embedded YouTube demo video
- Feature highlights section
- Support section with email contact
- Privacy policy statement
- Footer with download link and copyright information

## Technologies Used

- HTML5
- Tailwind CSS
- Google Fonts (Alumni Sans and Fira Sans)
- YouTube embed for demo video

## Setup

1. Clone this repository to your local machine.
2. Open the `index.html` file in a web browser to view the landing page.

## Customization

- To modify styles, edit the Tailwind classes in the HTML file.
- Replace image assets in the `assets` folder with your own images as needed.
- Update the content in the HTML file to match your app's features and description.

## Deployment

This static website can be deployed to any web hosting service that supports HTML/CSS/JavaScript files.

## Radio station permission form

`stations.html` hosts the public Google Form for station permission. The linked response Sheet is private and is not part of this repository. See `docs/station-intake.md` for settings, verification and evidence retention. The exact initial permission wording is preserved in `docs/station-permission-v2026-10-27.txt`.

## Support

For support inquiries, please email enjoyableapps@gmail.com or use the support link provided in the app.

## License

© 2024 Best Clock Radio. All Rights Reserved.

## Localized homepages

The English homepage lives at `/`, with French at `/fr/`, German at `/de/`, and Spanish at `/es/`.
All four include a visible language switcher, self-canonical URLs, reciprocal
`hreflang` links and sitemap entries. The About page, full privacy policy and
video currently remain in English; localized links label this explicitly.
Beautiful Clock Radio screenshots currently use the English artwork.

After changing English homepage content, update matching entries in
`translations/home-fr.json`, `translations/home-de.json`, and `translations/home-es.json`, then run:

```sh
python3 tools/build-localized-pages.py
python3 tools/check-localized-pages.py
```

The builder rejects missing text and accessibility-attribute translations.
It uses the supplied localized screenshots in `assets/fr/`, `assets/de/`, and `assets/es/`
and Apple's official localized App Store badges. The slideshow reads its
translated play/pause labels from the generated pages. Commit the generated
`fr/index.html`, `de/index.html`, and `es/index.html` along with their sources.

### Automatic language selection

`language-preference.js` detects language only on `/` and `/index.html`, using
supported browser preferences (`en`, `fr`, `de`, `es`) with English fallback. A language
switcher click saves an explicit preference in localStorage, which takes priority
on later visits to the default entry page. Direct `/fr/`, `/de/`, and `/es/` URLs remain in
the requested language. If storage is blocked, switching still works and detection
falls back to browser preferences. Query strings and anchors survive redirects.
Verify with `node --test tests/language-preference.test.cjs`.
