# SYSMART AI — from SYLUTION 🌱

**Smart farming intelligence for Nigerian and African growers.** A responsive, installable progressive web application inspired by the approved green-and-white SYSMART Agro AI showcase. Hausa-first UI, mobile/desktop workspace, and server-side agricultural AI APIs.

> **MVP / prototype.** The front-end is ready to try; AI Chat and Plant Doctor require an OpenAI key on the server. Weather is fetched live from Open-Meteo. Smart IoT and FarmX marketplace integrations are clearly marked as planned, not presented as connected.

## Features

- **Dashboard:** clean green agritech design, eight quick action tiles, farms, finance snapshot, persistent navigation.
- **AI Farm Advisor:** multi-turn chat in Hausa or English, saved locally, powered by a server-side `/api/chat` function when configured.
- **Plant Doctor:** upload a real crop photo, crop/symptom context and request a cautious image assessment with `/api/plant-doctor`.
- **Weather:** current readings and 5-day forecast for selectable Nigerian cities using Open-Meteo; gracefully handles network failure.
- **Crop Planner:** indicative planting milestones and projected harvest window by crop; save local plans.
- **My Farms:** add farms, select crops, locations, sizes and start dates; delete farms with confirmation.
- **Farm Finance:** income/expense records, farm filters, revenue/profit summary, simple graphs and CSV export.
- **Smart Sensors:** honest integration placeholders for irrigation/IoT — no simulated live readings.
- **FarmX:** prepared marketplace workspace — not connected yet.
- **Settings:** profile, default city, language preference for AI responses, remove explicitly marked sample data, full local data reset.
- **PWA:** installable interface and cached app shell (for HTTPS deployments), responsive layout for mobile and desktop.

## Quick start (zero npm dependencies)

Node.js 20+:

```bash
npm start
```

Open `http://localhost:4173`. This lightweight local server previews the **front-end only**; API endpoints return a clear not-configured response. Browser data is stored in `localStorage` **on the device**, not a SYLUTION server.

To run AI endpoints locally, use the Vercel CLI (`vercel dev`) in a standard development environment and configure the variables below. For deployment, import this GitHub repository into Vercel (root directory), with no build command required: the root `index.html` is a static app and `api/*.js` are Serverless Functions.

### Environment variables

Copy `.env.example` into your development environment or configure equivalent Vercel Environment Variables:

- `OPENAI_API_KEY` (required for live Chat and Plant Doctor; keep server-side, **never commit the key**)
- `OPENAI_MODEL` (optional, defaults to `gpt-4o-mini`)
- `OPENAI_VISION_MODEL` (optional image-model override)
- `ALLOWED_ORIGIN` (optional origin restriction; set to your production URL)

AI endpoints do **not** currently include account authentication, persistent backend database, or production-grade rate limiting. **Do not publish an API key on an unrestricted public deployment.** Add user authentication, tenant isolation, logging and per-user quotas/rate limits before a public launch.

## Safety and integrity

- Initial farms and transactions are **DEMO EXAMPLES**, marked in UI, and can be cleared without losing user-added entries.
- Farm finance totals are calculated from entries, **not** live revenue or banking data.
- AI crop health analysis is preliminary; never a guaranteed diagnosis or registered pesticide recommendation.
- Crop-plan growing windows are indicative only; verify cultivar, local environment and extension guidance.
- Weather predictions are model forecasts and not a substitute for local conditions or official severe-weather warnings.
- Plant images are sent to the configured AI provider when the user clicks **Analyze**; warn users in production privacy disclosures.
- Local browser data is not cross-device synced, encrypted as a database, or backed up in the cloud.

## Verification

```bash
npm run check
npm test
```

## Repository structure

```text
index.html             Entry point
styles.css             Responsive design system
app.js                 UI screens, navigation, forms and local state
core.js                Crops, finance math, dates and planning logic
api/chat.js            Agricultural AI text conversation API
api/plant-doctor.js    Vision-based crop image advisory API
api/weather.js         Open-Meteo proxy endpoint
assets/                Brand icon and farm illustration
manifest.webmanifest   Installable web app metadata
sw.js                  Offline shell cache on HTTPS
server.mjs             Dependency-free local preview server
tests/                 Node unit tests
```

## Next milestones

1. Authentication, Postgres/Supabase backend, secure storage, migration off localStorage, role controls.
2. Curated Hausa agricultural knowledge base and verified Nigeria-specific crop guidance.
3. Productized FarmX API integration and current market data.
4. SYLUTION ESP32/RS485 telemetry, device provisioning and fail-safe irrigation controls.
5. Android/iOS app distribution after usability, security and privacy reviews.

**Brand:** SYSMART AI — from SYLUTION.
