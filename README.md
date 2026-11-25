# World Leader

A text-driven geopolitical simulation and interactive world atlas. Choose any sovereign nation—starting from **1 Jan 2026** or across selectable historical and near-future eras—write what your government does in plain language, and watch the narrative chronicle, national figures, multilateral diplomacy, and world map respond to every directive.

## Features

- **Interactive Diplomatic World Atlas**: Real vector polygons for ~175 nations and territories (`world-atlas` + `d3-geo` Mercator projection) with smooth pan/zoom, hover dossiers, territory annexation and occupation hatching, and switchable **Political**, **Diplomatic**, and **Military** map layers.
- **Selectable Start Dates & Custom Scenarios**: Begin from the **1 Jan 2026** modern baseline or choose alternate eras (**1962**, **1991**, **2027**, **2030**), or toggle **Custom game** to pick any start date (`1900–2099`) and edit starting population, GDP, unemployment, inflation, armed forces, tanks, fighter jets, and aircraft carriers.
- **Free-Form Executive Directives**: Issue domestic reforms, budgets, trade treaties, sanctions, alliances, or military campaigns in natural language, with configurable turn pace (`Auto`, `1 mo`, `3 mo`, `6 mo`, `1 yr`) and contextual cabinet proposals.
- **Multilateral Diplomacy & Border Changes**: Maintain multiple simultaneous allies, partners, rivalries, sanctions, and wars; diplomatic shifts persist across turns and reflect directly on the Diplomatic map layer, while annexations, unions, and occupations dynamically repaint territories.
- **National Ledger & Historical Trends**: Track all 8 national metrics alongside public approval, stability, and budget balance (% of GDP), plus interactive SVG trend charts and local multi-campaign save management (`localStorage`).

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, `d3-geo`, `topojson-client`, `world-atlas`, `lucide-react`
- **Backend**: Express + Vite middleware (`server.ts`) running on port `3000`
- **Simulation Engine**: `@google/genai` (`gemini-3.1-flash-lite` with minimal thinking latency and structured JSON schemas)

## Getting Started

### Prerequisites

- Node.js 22+
- A Gemini API key (`GEMINI_API_KEY`)

### Installation & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables by copying `.env.example` to `.env` and adding your key:
   ```bash
   cp .env.example .env
   ```
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

3. Start the development server (Express API + Vite frontend on port `3000`):
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the full-stack Express + Vite dev server on port 3000 |
| `npm run build` | Builds the production frontend bundle into `dist/` |
| `npm run start` | Runs the production server (`NODE_ENV=production node server.ts`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

## Project Structure

```text
├── server.ts                  # Express server, Vite middleware, and /api/briefing & /api/turn routes
├── index.html                 # HTML entry point & editorial fonts
├── src/
│   ├── App.tsx                # Root state, local save orchestration, and view routing
│   ├── components/
│   │   ├── WorldMap.tsx       # Memoized 60fps SVG diplomatic atlas with layers & country inspector
│   │   ├── LobbyView.tsx      # Country & era selection, starting figures, and saved games list
│   │   ├── GameplayView.tsx   # Broadsheet chronicle, directive desk, ledger, and diplomacy panel
│   │   └── HistoryChart.tsx   # Multi-metric SVG trend chart across turns
│   ├── data/
│   │   └── countries.ts       # 2026 baseline data for ~175 nations, start eras, and bloc diplomacy
│   ├── types/
│   │   └── game.ts            # Shared TypeScript interfaces for client and server
│   └── utils/
│       ├── format.ts          # Tabular numeric and date formatters
│       └── storage.ts         # Browser localStorage persistence for campaigns
└── package.json
```
