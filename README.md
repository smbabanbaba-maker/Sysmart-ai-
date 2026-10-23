# SYSMART AI — from SYLUTION

Minimal, mobile-first agricultural assistant. Version 0.4 redesign.

## Product experience

- English-only clean Home, centered ask-anything composer, real-photo farming editorial.
- Primary tools: AI Farm Advisor, Plant Doctor, Crop Planner, Weather, My Farms, Farm Records.
- Removed filler feature cards, fake KPI statistics, promotional sidebar, imaginary live sensor data and sample farm records from the default user experience.
- Farmers' existing real saved records and chats remain in browser localStorage. Legacy demo entries are filtered out.
- Uses photographs hosted by Unsplash for agricultural backgrounds and farm covers; graceful gradient placeholders when imagery cannot load.
- Responsive for Android, iPhone, tablet and desktop.

## Limitations

AI Chat and Plant Doctor still require `OPENAI_API_KEY` on the server, proper authentication and abuse controls before unrestricted public use. Weather pulls public forecast data, not a guarantee. Farm data is stored locally in this MVP, not synced between devices. Smart sensors and marketplace are not connected.

## Running

`npm run preview` — local static preview. `npm run check` and `npm test` — syntax and unit checks. Production is a static Vercel web app with separate `/api` functions.

**SYSMART AI · from SYLUTION**
