# Aetheria: Venus Expansion

Game Design Document and **2D browser prototype** for *Aetheria: Venus Expansion* — a simulation game about expanding a floating continent on Venus through atmospheric and surface resource utilization, modular hexagonal units, and ISRU.

## Contents

| Path | Description |
|------|-------------|
| [docs/GDD.md](docs/GDD.md) | Full Game Design Document (English) |
| [prototype/](prototype/) | Playable 2D browser prototype |

## Run the Prototype

The prototype is a static HTML5 canvas app (no build step). ES modules require a local web server — opening `index.html` directly via `file://` will not work in most browsers.

### Option A — Python (recommended)

```bash
cd prototype
python3 -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

### Option B — Node.js

```bash
npx --yes serve prototype -p 8080
```

Then open **http://localhost:8080**.

## How to Play (Prototype)

1. **Build modules** — Select ISRU Refinery, Solar Array, or H₂ Buoyancy Cell, then click a `+` hex adjacent to your continent.
2. **ISRU loop** — Each second, refineries harvest H₂SO₄ from Venusian clouds and (when power is positive) electrolyze it into H₂ and sulfur.
3. **Extend H₂** — Select a module and click **Extend H₂ Layer** to increase buoyancy (and wind load).
4. **Trade with Earth** — Exchange sulfur for Earth research credits; Earth remains a cooperative partner.
5. Watch the **dashboard** — buoyancy, mass, net lift, power, and resources update every tick.

## GDD Highlights

- **Platform**: 2D browser game (top-down hex map, flat UI)
- **Core loop**: Explore → ISRU → Build → Balance buoyancy/power
- **Science**: 50 km altitude, superrotation, acid corrosion, surface explorer heat-only
- **Tone**: Hopeful Earth–Venus partnership; self-sufficiency is an optional proud goal

See [docs/GDD.md](docs/GDD.md) for the complete design.
