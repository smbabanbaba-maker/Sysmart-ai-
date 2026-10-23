# SYSMART AI — from SYLUTION

SYSMART AI is a mobile-first agricultural assistant for growers in Nigeria and beyond. The home interface is dark forest green with a responsive dashboard, quick AI advice, practical farming tools and real field photography. All interface text is in English.

## Version 0.9.0 — Photo-only Plant Doctor

- Farmers can choose **Take Photo** (rear camera where available) or **Choose Photo** (gallery/device storage) and then tap **Analyze Plant**. No crop dropdown or symptoms form is required.
- With a configured server-side vision AI key, the app attempts plant identification and explains visible symptoms, likely issue, practical low-risk steps, prevention, uncertainty, and when to seek local help.
- The frontend compresses large Android/iPhone photos before sending them through the secure API route; no automatic image upload happens until Analyze is tapped.
- The model is instructed not to invent a plant or disease diagnosis, claim false confidence percentages, or issue pesticide/dosing instructions.
- The structured report and controls use responsive midnight-forest/ivory/lime styling with reduced-motion accessibility.
- Without `OPENAI_API_KEY` in the hosting environment, a clear error is shown. No simulated plant analysis is displayed.

## Version 0.8.0 — Premium color system

This release applies a single premium agricultural design language to Home, weather, navigation, and other workspaces:

- Midnight Forest (`#061D16`) main background and Almost-Black Green (`#04150F`) navigation.
- Rich Emerald (`#103A2B`) weather surfaces, Luxury Lime (`#C8EFA9`) main actions, Soft Ivory (`#F6F8F2`) AI composition and reading surfaces.
- Muted Sage (`#A6C1B1`) supporting text, Aqua (`#74CCD1`) humidity, Blue (`#7BAFF1`) rainfall, and Gold (`#F5C96C`) sunshine.
- A time-appropriate farmer greeting with compact weather instead of a giant hero banner.
- iPhone/Android-friendly input sizing, touch targets, contrast and reduced-motion preferences.
- Updated mobile browser and PWA theme, cache namespace, and app metadata.

This is a working front-end styling release, not a claim that AI provider credentials, user accounts, or FarmX/IoT integrations are configured.

## Version 0.6.0 — Real weather intelligence on Home

- Automatic weather for the selected Nigerian city, showing actual forecast temperature, humidity, wind speed, today's highest forecast rain probability and a three-day outlook.
- Includes refresh, forecast detail, Open-Meteo attribution and the data update time. Values are not fabricated.
- Most recent reading is cached for up to 15 minutes; if a refresh fails, saved weather is marked as such instead of mislabeling it as live.
- A location change in Settings or on the Weather page refreshes the Home card.
- Works across phones, tablets and desktop widths; no weather API key required.
- MVP AI Advisor and Plant Doctor still need a configured server-side API key.

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
