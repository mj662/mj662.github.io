# Station permission intake

Owner: enjoyableapps@gmail.com. Station-facing contact: contact@beautifulclockradio.com.

## Languages

English, Spanish, French and German use separate versioned Google Forms connected to separate response tabs in the same private spreadsheet. Keep original response tabs intact. The station page chooses a supported language from an explicit `?lang=` link, a previously saved manual selection, or the browser’s language preferences, in that order, with English as fallback. A visible language selector allows an override. Changing language reloads the form; an accessible hint advises respondents to finish submitting first. The compact page invites stations to add their details, with a brief description of the fixed preset buttons. The embedded forms have short headings and no introductory description so the first field appears promptly. The privacy policy and app homepage remain in English and links identify the policy’s language.

`station-languages.js` contains public copy, exact translations and public form IDs only. The English baseline and each outgoing translation are preserved in the versioned permission files in this folder. Record the response’s language and exact accepted wording when verifying an approval. Adding another language requires a complete translated form, a response destination and its public form ID; do not route a translated page to an untranslated permission form.

## Form and response settings

- Four required short-answer fields: Station name, Official station website, Your name, Your station contact email.
- Optional fields: Stream URL, Station artwork URL, Restrictions or comments. Explain that restrictions may limit apps, countries or uses.
- Required checkbox question: Permission — version 2026-10-27. Put the exact text from station-permission-v2026-10-27.txt in its description, with one initially unchecked option, “I agree and grant the permission above.”
- Use typed/respondent-provided email, not verified Google-account email collection. Do not require Google sign-in, limit to one response, or add file uploads.
- Disable response editing and public response summaries. Keep the linked response spreadsheet and editor access private to the owner.
- Enable the owner’s built-in new-response email notification. No automatic station reply or follow-up is authorized by this setup.
- Confirmation message: “Thank you. Your station details and permission have been received. Enjoyable Apps will review your submission before adding or updating a listing. For changes, contact contact@beautifulclockradio.com.”

## Records

The linked Sheet is an intake log. It does not automatically update the station catalog or existing approved-stations records. Keep its original response tab intact; track verification separately using the response timestamp and station identity. Treat contact details and URLs as untrusted until checked.

Save an unchanged export of each response batch and a dated copy of the exact form/permission wording. Keep a version-specific form when changing the permission text so earlier submissions remain tied to the wording they accepted. Never reinterpret earlier permissions to cover new terms.

Before recording approval, verify the person’s authority using the official station website/contact and resolve ambiguous apps, uses, URLs, territories or conditions. Blank restrictions stay unspecified; they do not mean explicit worldwide authorization. If follow-up correspondence is needed, prepare it for Mark’s approval before sending.

Verified approvals belong in /Volumes/Delphi/Working/Clock Radio Modern/Radio Sation agreements/Approved Stations.xlsx and approved-stations.json. Retain the original response/export, exact permission text, date, supplied URLs and artwork, restrictions and verification evidence in a dated station subfolder under Approvals. Preserve original notification emails as .eml where available. Keep unresolved submissions pending in the outreach tracker. Do not overwrite prior evidence or user edits.

Station contacts, private response links, exports and evidence must never be committed to this public repository. Only the public form URL and consent wording belong in website source.

## Release checks

Verify that the embedded and direct-link forms open without Google sign-in, the checkbox starts unchecked, required fields are enforced, a clearly labeled test submission reaches the private Sheet, the notification setting is enabled, response summaries are unavailable to respondents, and mobile and desktop layouts are usable. Test records are not station approvals.
