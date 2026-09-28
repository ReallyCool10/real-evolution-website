# REAL Cadastre — UK Land & Commercial Property Explorer

A pure, modern, and minimalist GIS explorer that combines:
- **UK Map Interface** (MapLibre GL JS with Dark / Light / Satellite modes)
- **HM Land Registry (HMLR) INSPIRE Cadastral Parcels** (Free WMS boundary layer)
- **UK Commercial & Corporate Ownership Data** (CCOD)
- **Overseas Corporate Ownership Data** (OCOD)
- **High-Performance Local Query Engine** (Node 24 built-in SQLite)

---

## Quick Start

### 1. Ingest Data (One-Time Setup)
From `tools/cadastre-explorer`:
```bash
# Ingests outcodes + OCOD (91k records) + 50k CCOD records
npm run ingest

# Or ingest more CCOD records
npm run ingest:all
```

### 2. Desktop Applet (One-Click Launch)
A Windows Desktop shortcut named **REAL Cadastre** has been placed directly on your Desktop (`C:\Users\MarkNewman\Desktop\REAL Cadastre.lnk`):
- Double-click the desktop icon.
- It automatically boots the backend and frontend servers.
- As soon as services are ready, it launches the app directly into your browser / app window.
- Closing the small terminal window cleanly stops the server and frees all ports.

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
