# Garden Planner (Nuxt 3)

A local-first garden planning app to manage beds, crops, planting history, and simple crop-rotation checks.

## Features

- Dashboard with clickable bed cards and compact 5-year history
- Current-year view per bed with `Hauptkultur` and `Nebenkulturen`
- Garden bed management (create/edit/delete)
- Crop management via `/kulturen` (list, edit, add)
- Planting records by bed, year, and role (`main` / `companion`)
- Year planner with:
  - crop quantity selection (duplicates allowed)
  - automatic Hauptkultur distribution per bed
  - drag-and-drop reassignment between beds
  - optional Nebenkulturen per bed
  - companion compatibility ranking and warnings
- Mischkultur neighbor system with reciprocal `Gute Nachbarn` / `Schlechte Nachbarn`
- Rotation warnings:
  - same family in last 3 years
  - high nutrient demand warning (based on last 4 years)
  - optional incompatible combinations
- Local persistence with JSON import/export

## Main Pages

- `/` Dashboard
- `/beds` Beete verwalten
- `/beds/:id` Beetdetails + Historie + neue Pflanzung
- `/planung` Planung für das aktuelle Jahr
- `/kulturen` Kulturliste und Kultur hinzufügen
- `/settings` Import & Export

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
- Use **/settings** to export/import full JSON backups.
- `gardenHistory.json` now stores optional `goodNeighbors` / `badNeighbors` on crops.
- Planting records support optional `role` (`main` or `companion`).

## UI Notes

- Dashboard crop chips include family/crop icons.
- `⚡` indicates a crop with **high** nutrient demand.

## License

This project is open source and released under the **MIT License**.
You are free to use, modify, and distribute it, including for commercial use.
See `LICENSE` for details.

## Disclaimer

Large parts of this codebase were generated with AI assistance.
The software is provided **as is** and should be used at your own risk.
