# Garden Planner (Nuxt 3)

A local-first garden planning app to manage beds, crops, planting history, and simple crop-rotation checks.

## Features

- Dashboard with per-bed crop history (5 years)
- Garden bed management (create/edit/delete)
- Crop list management
- Planting records by bed and year
- Rotation warnings:
  - same family in last 3 years
  - repeated nutrient demand
  - optional incompatible combinations
- Local persistence with JSON import/export

## Tech Stack

- Nuxt 3 / Vue 3
- Pinia
- Tailwind CSS
- Vitest (unit tests)

## Getting Started

```bash
npm install
npm run dev
```

Open the app at:

- [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run unit tests
```

## Data Notes

- App data is stored in localStorage.
- Seed data is loaded when no local data exists.
- Use **Einstellungen** to export/import full JSON backups.

## UI Notes

- Dashboard crop chips include family/crop icons.
- `⚡` indicates a crop with **high** nutrient demand.
