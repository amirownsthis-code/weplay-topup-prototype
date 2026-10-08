# WePlay Recharge UI Prototype

A WePlay-style recharge website recreation built with HTML, CSS, vanilla JavaScript, and a Node.js/Express server. It combines product-selection screens and simulated checkout with an experimental browser-based WePlay profile lookup.

**Independent learning project. This is not an official WePlay service, and it does not process payments or deliver virtual items.** WePlay, WEJOY, payment-provider names, logos, and reference imagery belong to their respective owners. Brand text and informational pages are part of the UI recreation, not an affiliation claim.

## Features

- Gold coin package selection loaded from JSON configuration.
- Membership, red-envelope, advanced game-card, and level-card tabs.
- Promotional banner carousel and a gift countdown.
- Region selection with sample currency conversion.
- VISA, Mastercard, Apple Pay, and Google Pay checkout layouts.
- Email-entry interactions and a simulated success receipt.
- Player ID entry followed by an experimental profile lookup and confirmation screen.
- Browser-persisted profile state and a local JSON profile store.
- About, media, brand-assets, legal, and other reference information pages.

## Technology

- Frontend: HTML5, CSS3, vanilla JavaScript, JSON configuration, and `localStorage`.
- Backend: Node.js, Express, CORS, and filesystem JSON storage.
- Lookup: Puppeteer opens installed Google Chrome and reads a profile from the external WePlay recharge page.

There is no frontend build step, payment-provider API integration, account-password system, or SQL database.

## Requirements

- Node.js **22.12.0 or newer**, as required by the locked Puppeteer dependency.
- npm.
- Installed **Google Chrome**. The lookup uses `channel: 'chrome'` with a visible browser window.
- Internet access for the external profile lookup.

## Run locally

Open PowerShell in the project root, beside `server.js` and `package.json`:

```powershell
node --version
$env:PUPPETEER_SKIP_DOWNLOAD = 'true'
npm ci
npm start
```

Open `http://localhost:3000`. Keep the terminal open; use `Ctrl+C` to stop the server.

The skip-download setting avoids downloading Puppeteer's bundled browser because this server uses your installed Google Chrome. It applies to the current PowerShell session. Restart the server after changing `server.js`.

Run the root application. The separate `weplay-app` and `tiktok-app` folders are not required by it and are excluded from this repository.

Use the Node server for this project. Opening `index.html` directly or serving it with a static Python server does not provide the profile lookup APIs.

## Try the flow

1. Choose **Enter your WePlay account** and enter an ID you can use for the demonstration.
2. Click Next. Chrome opens the external recharge page, attempts to read the profile, and closes afterward.
3. If lookup succeeds, confirm the returned profile.
4. Choose a product, region, and payment method; optionally add a sample email address.
5. Open checkout and try a simulated payment.

Use dummy checkout details. An example accepted by the card form is card number `0000 0000 0000 0000`, expiry `12/30`, CVV `000`, and cardholder `Demo User`. These are only inputs for the prototype's format checks. The wallet layouts also provide a simulated checkout flow.

If lookup fails, a displayed "user doesn't exist" message does **not** prove the ID is invalid. Chrome launch problems, network failures, external page changes, and scraping failures can produce the same result. This lookup has not been established as reliable for production use.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Main recharge tabs, login overlay, checkout, and receipt UI |
| `assets/css/styles.css` | Active stylesheet |
| `assets/js/script.js` | Active frontend interactions |
| `assets/images/` | Referenced local images |
| `pages/` | Separate reference information and product pages |
| `server.js` | Website serving, profile lookup, and profile persistence |
| `package.json`, `package-lock.json` | Root Node dependency configuration |
| `data/packages.json` | Sample product configuration |
| `data/payment-methods.json` | Payment-method display configuration |
| `data/regions.json` | Region configuration |
| `data/site-data.json` | Sample site configuration |
| `data/users.json` | Runtime profile records; created when a profile is saved and excluded from Git |
| `check-assets.ps1` | Configuration parsing and static image-path checks |

Root-level `script.js`, `styles.css`, and `images/` are older copies not referenced by the reviewed application. They are excluded from this repository. Edit the active files under `assets/`.

## Important demo limits

- A profile lookup identifies display data; it does not verify account ownership or create an authenticated session.
- QR login is a static image and tab, not a working QR authentication flow.
- Card and wallet actions display success after a browser timer. No payment, receipt email, membership activation, or coin deposit occurs.
- Card validation checks basic format only. The "save card securely" checkbox has no card-saving implementation. Card inputs are cleared after the simulated payment; the reviewed frontend does not submit them to a payment API.
- Checkout email is held in page memory. Saving it does not verify the address or send email.
- Currency conversion uses fixed sample rates, not live exchange rates. The visible region menu is hardcoded separately from `regions.json`; its current USA default differs from the configuration's Macao selection.
- Gold coin packages and payment methods load from JSON. Other product tabs mainly use hardcoded HTML, so editing every product array in `packages.json` does not update all screens.
- Profile state in browser storage can be edited by the visitor. `/api/save-user` has no authentication, and JSON persistence is intended for a local demo.
- The profile store records successful lookups but is not used as a read cache: repeated ID requests still trigger a new scrape. Lookups are queued one at a time.
- Separate product pages contain placeholder links and presentation content; the interactive purchase flow is in the main page tabs.
- The layout has not been visually verified on mobile. Do not describe it as fully responsive without checking target screen sizes.

## Local data and serving

The server serves the main page, active asset directories, reference pages, and the four frontend configuration files. It does not serve `users.json`, server source, dependency files, or the nested server folders.

The configuration files are intentionally public. Keep runtime profiles in `users.json`; do not put private records into the public configuration files.

To reset profile display state, clear this site's browser storage. To reset local saved profiles, stop the server and remove `data/users.json`; a later save will recreate it.

## Check assets

From the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\check-assets.ps1
```

This verifies required file presence, JSON parsing, and statically referenced image paths with exact capitalization, including filenames containing spaces. It does not test image rendering, profile lookup, or checkout behavior.

Some pages/configuration reference `globe_icon.png`, while the main page references `globe-icon.png`. Check both paths before publishing; the asset checker will report whichever files are missing.

## Learning context

This AI-assisted frontend practice project recreates a reference interface and explores an experimental profile lookup. It is presented as a prototype rather than a production payment service or an original WePlay design.

Author: [Muhammad Amir](https://github.com/amirownsthis-code), Data Science student at UET Main Campus Lahore.
