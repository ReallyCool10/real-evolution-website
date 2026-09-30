# REAL intel — UK Land & Commercial Property Intelligence

A pure, modern, and minimalist GIS explorer that combines:
- **UK Map Interface** (MapLibre GL JS with Dark / Light / Satellite modes)
- **HM Land Registry (HMLR) INSPIRE Cadastral Parcels** (Free WMS boundary layer)
- **UK Commercial & Corporate Ownership Data** (CCOD)
- **Overseas Corporate Ownership Data** (OCOD)
- **High-Performance Local Query Engine** (Node 24 built-in SQLite)

---

## Quick Start

### 1. Build the Database

Source data lives outside git, in a `DATA` folder beside the website repo (`C:/Dev/DATA`) or
inside it (`DATA/`); set `REAL_INTEL_DATA_DIR` to use somewhere else. The database is
`server/cadastre.sqlite` (override with `REAL_INTEL_DB`).

Every script opens the database through `server/connection.js`, which creates or upgrades
the schema automatically (`server/schema.js`), so steps can be run on an empty or an
existing database. Run from `REAL-intel`, in this order:

| Step | Command | Needs | Does |
| :-- | :-- | :-- | :-- |
| 1 | `npm run ingest:full` | `CCOD_FULL_*/`, `OCOD_FULL_*/` CSVs | Loads all ~4.5M titles into `server/cadastre_staging.sqlite`, keeping your saved workspace and UPRN/OSM lookups from the live database. Then stop the server and replace `cadastre.sqlite` with the staging file. |
| 2 | `npm run geocode` | `ukpostcodes.csv` | Places each property at its unit postcode (outcode centre as a fallback). Leaves already-enriched properties alone. |
| 3 | `npm run download:uprn`, unzip into `NSUL/Data/`, then `npm run ingest:uprn` | internet | Loads OS Open UPRN address points for exact matching. |
| 4 | Enrichment, from the app's Settings panel or `node server/uprn-matcher.js --area=London` | step 3 | Moves properties to exact addresses and records `precision_level`. |
| 5 | `npm run summaries` | | Rebuilds the map's outcode/sector bubbles and proprietor search. Run after steps 2 and 4. |

For a quick sample instead of step 1, `npm run ingest` loads OCOD plus 100k CCOD rows straight
into the live database and builds the summaries (run it on an empty database: it appends).

`npm test` checks the schema, migrations, summaries and geocoding against temporary databases.

### 2. Desktop Applet (One-Click Launch)
Run `create-shortcut.ps1` once to put a **REAL intel** shortcut on your Windows Desktop:
- Double-click the desktop icon.
- It automatically boots the backend and frontend servers.
- As soon as services are ready, it launches the app directly into your browser / app window.
- Closing the small terminal window cleanly stops the server and frees all ports.

### Local-only by design

REAL intel has no login, so it only accepts connections from the machine it runs on: the API
listens on `127.0.0.1:3001`, sends no CORS headers (the app reaches it through the Vite proxy),
rejects requests whose `Host` isn't localhost, and only accepts JSON on POST. Keep it that way
unless you add authentication first.

### 3. Manual Command Line Launch
```bash
npm run dev
# Or from the website root:
npm run cadastre
```

---

## Features

- **Minimalist Interface**: Pure, edge-to-edge spatial viewer without decorative clutter.
- **HM Land Registry Cadastral Boundaries**: Zoom in ($\ge 16$) anywhere in England and Wales to see the official red property boundary lines rendered dynamically from the HMLR INSPIRE WMS service.
- **Fast Viewport Queries**: As you pan and zoom across the UK, properties are fetched within ~15ms and dynamically clustered.
- **Instant Search**: Search by company name (e.g. "Tesco", "British Land"), postcode, or title number.
- **Property Inspector**: Click any site or marker to view:
  - Title Number & Tenure (Freehold / Leasehold)
  - Proprietor Name & Overseas Incorporation Country
  - Price Paid & Date Added
  - Property & Registered Addresses
  - Direct links to Companies House and HM Land Registry portals
- **Pluggable Architecture**: Built with standard React + TypeScript components ready to be embedded into the main REAL Evolution website whenever desired.
