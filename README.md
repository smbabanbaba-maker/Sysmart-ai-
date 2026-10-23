# SYSMART AI — from SYLUTION

SYSMART AI is a mobile-first agricultural assistant for growers in Nigeria and beyond. The home interface is dark forest green with a responsive dashboard, quick AI advice, practical farming tools and real field photography. All interface text is in English.

## Version 0.5.0 — Premium forest redesign

- Home has a single dark, photographic hero, one prominent AI question composer and four essential farming actions.
- Removed promotional filler, mock statistics and unrelated cards from Home.
- Real user farms appear beneath the primary tools; the empty state provides an Add Farm action instead of fake data.
- Responsive layouts for 320px/390px phones, tablet and desktop widths; mobile navigation remains accessible.
- Desktop sidebar and mobile header/bottom navigation adopt a cohesive deeper forest palette.
- Weather values appear only if retrieved; no fabricated live readings are shown.
- Code preserves existing local storage keys and backend endpoint contracts.
- Updated PWA cache namespace to encourage loading latest styles.

## Running locally

With Node.js 20+: `npm run preview`, then visit `http://localhost:4173`. The zero-dependency preview server serves the frontend. Use `vercel dev` to test serverless APIs.

Run checks with `npm run check && npm test`.

## Feature status

The Crop Planner, local Farm Records and Farms workspace are functional in the browser. The weather endpoint uses Open-Meteo. AI Advisor and Plant Doctor require a server-side `OPENAI_API_KEY` and suitable provider access. Do not expose API keys in frontend code. This MVP has no cloud sync or production-grade user authentication; private farm records remain in local browser storage. Sensor and marketplace integrations are planned, not live.

## Deployment

Vercel serves `index.html`, `app.js`, `styles.css`, `core.js` and other static files. `api/*.js` are serverless handlers. `vercel.json` is configured for a static frontend. Update the linked `main` branch to trigger deployment and verify live runtime logs separately.
