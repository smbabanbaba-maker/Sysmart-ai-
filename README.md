# SYSMART AI — from SYLUTION

A premium, English-language, responsive farming dashboard for mobile and desktop, designed for Nigerian and African growers. This is a working **MVP** with a real responsive app interface; it is not a fully connected AI or IoT production platform yet.

## What's new in 0.3.0

- Fully rebuilt home dashboard: cinematic authentic-farm photography, clean hierarchy, prominent AI Advisor, four farm tool shortcuts, accurate farm metrics, activity-aware farm portfolio and weather check.\n- Responsive 320px–desktop home layout with accessible 44px actions, no horizontal overflow, and preserved navigation and storage.\n- Dark-forest desktop sidebar and compact mobile navigation.
- Real agricultural photography supplied through the Unsplash photo CDN, with color fallbacks when offline.
- English throughout the UI, app controls, dialogs, form labels, notices, crop planning and forecast labels.
- Mobile-first touch targets, tablet breakpoints, safe-area padding on iOS, responsive cards and scrolling charts.
- Workspace views: Dashboard, Farm Management, Crop Planner, AI Farm Advisor, Plant Doctor, Weather, Smart Monitoring, Farm Records, Marketplace, Settings.
- Preserves existing records and conversations stored under the prior localStorage key.
- Sample data is explicitly labeled; there are **no invented live readings, crop diagnoses, prices or yields**.

## Working features

- Add and inspect farm records; delete farms with confirmation
- Calculate farm income, expenses and net balance, add transactions and export CSV
- Create estimated crop schedules and save plans locally
- Fetch live weather forecasts from Open-Meteo (with a direct-source fallback)
- Submit farm questions or plant photos to optional secure API routes (`/api/chat`, `/api/plant-doctor`)
- Offline-friendly PWA shell and installation manifest

## Not yet connected

- AI chat and Plant Doctor require a server-side `OPENAI_API_KEY`. **Never commit an API key or expose it in browser code.** Public endpoints must have authentication, usage caps and rate limits before opening them to real users.
- Smart IoT devices, FarmX marketplace, account sign-in and cloud synchronization are planned, not represented as live services.
- Browser records stay on the individual device and can be cleared by the user.

## Setup

Node.js 20 or newer; there are no package dependencies.

```bash
npm run preview
npm run check
npm test
```

Open `http://localhost:4173` for the front-end preview. Local preview API routes return a not-configured response. On Vercel, deploy the repository root using **Framework Preset: Other**, with the included static `vercel.json` and `api/*.js` serverless handlers. Configure `OPENAI_API_KEY` in server-only environment variables for AI routes, plus authentication and abuse protection prior to public use.

## Photos and presentation

The real farm photography is delivered from [Unsplash](https://unsplash.com/license) and served via `images.unsplash.com` in the UI; it is **not AI-generated crop evidence**. These decorative photographs are separate from crop photos uploaded by farmers. The image placeholders use color backgrounds if the external photo host is unreachable. Users should only treat their own images and verified observations as diagnostic input.

Brand: **SYSMART AI — from SYLUTION**.
