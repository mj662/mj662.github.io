# Station submission intake

The custom form at `/stations.html` is hosted by GitHub Pages. Google Forms is no longer embedded. A Google Apps Script web app accepts submissions and appends them to the existing private intake spreadsheet. Earlier Google Forms and their response tabs remain intact as original evidence.

## Page and language behavior

English, Spanish, French and German are available. The page selects an explicit `?lang=` value, a saved manual preference, or a supported browser language, in that order, with English fallback. Switching language preserves entered station details and clears the permission checkbox so the representative can review the translated wording. A manual language choice is stored locally in the browser.

Four fields are required: station name, official website, representative name and station contact email. Optional details are collapsed initially: display name, short description, stream URL, artwork URL and restrictions/comments. Contact email is typed by the representative; no Google account is collected or required.

The optional display name allows 30 Unicode code points and the description 60, with live counters and server validation. These are intake limits, not fixed limits in the app or a promise that every screen can show every character. The app catalog uses a two-line name and one-line subtitle with truncation based on available width. Presets have smaller text containers. Keep the full station identity separate from a suggested display name. Do not modify the station database automatically.

The required, initially unchecked checkbox retains the exact versioned permission wording in `station-permission-v2026-10-27.txt` and its translated counterparts. The displayed and server-recorded wording must match. Preserve prior versions whenever permission wording changes.

## Backend setup and maintenance

`server/station-intake.gs` is deployed in an Apps Script project bound to the existing private spreadsheet. `server/appsscript.json` documents the required Sheets and send-mail scopes. The owner authorizes the project once. Google grants the Sheets scope broadly; the code only opens the spreadsheet ID captured by `initializeStationIntake()` and writes the `Website submissions` tab. It does not provide a public read operation. The send-mail function notifies only the fixed owner address, never a submitted contact address.

Run `initializeStationIntake()` from the bound script editor once. It stores the private spreadsheet ID in Script Properties, creates the new intake tab and checks its schema without altering old response tabs. Do not put spreadsheet IDs, response exports, contact details, tokens or private records in this public repository.

Deploy as a web app executing as the owner, accessible to anyone so representatives do not need Google accounts. Put only the resulting public `/exec` endpoint in `station-form-config.js`. Update the existing deployment to a new version for backend changes; preserve the URL. Update asset version queries when publishing frontend changes to avoid stale cached copy.

The page posts through a hidden transport frame. An iframe load is never interpreted as success. The backend validates required fields, permission version/language, text limits, URLs and email; applies a honeypot and hourly limits; serializes writes; and deduplicates unchanged retries by submission ID and payload digest. Spreadsheet formula prefixes are escaped for readable cells while original field values remain in JSON evidence.

The backend verifies the row write before returning a receipt containing only status, reference, request ID and a per-attempt nonce. The page requires the matching nonce/ID and a Google Apps Script content origin. It retains answers after an error or timeout and reuses an unchanged retry's ID. A successful receipt means intake was saved, not that the station was approved.

New submissions include a timestamp, submission ID, original station details, suggested display text, exact permission wording/version/language, conditions, source and pending-verification status. Owner email notifications are best effort; the Sheet is the authoritative intake log. Google service quotas apply. Review the notification-status column if delivery is unavailable. No automatic station reply is sent.

## Records and verification

Keep original rows and response exports intact. Verify the representative's authority against the official station contact, and resolve unclear apps, uses, URLs, territories or conditions before recording approval. Blank restrictions stay unspecified. Prepare follow-up correspondence for Mark's approval before sending.

Verified approvals belong in the existing station-agreements archive, with the unchanged original submission, exact permission wording, supplied URLs/artwork, restrictions and verification evidence. Pending submissions stay pending. Preserve user edits and previous evidence.

Run `node --test tests/station-form.test.cjs tests/station-intake.test.cjs`, JavaScript syntax and diff checks. Verify a signed-out technical submission reaches the private log before publishing a replacement endpoint. Clearly label test records; they do not grant station permission. Check mobile/desktop, optional-field counters, language switching, required/unchecked permission, rejected input, timeout/retry and the successful receipt. Do not use real station identities for testing.

## Layout references

Reviewed [TuneIn's station form](https://broadcasters.tunein.com/stations/add), [radio.net's listing process](https://radio.zendesk.com/hc/en-us/articles/224884947-How-can-I-list-my-station-podcast-on-radio-net) and [Radio Browser's add-station form](https://www.radio-browser.info/add). The custom form uses ordinary labeled station/contact fields and explicit permission, with fewer required details and no account registration.
