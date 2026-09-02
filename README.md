# Aetheria: Venus Expansion

Game Design Document and **2D browser prototype** for *Aetheria: Venus Expansion* — a simulation game about expanding a floating continent on Venus through atmospheric and surface resource utilization, modular hexagonal units, and ISRU.

## Contents

| Path | Description |
|------|-------------|
| [docs/GDD.md](docs/GDD.md) | Full Game Design Document (English) |
| [docs/ゲームルール.md](docs/ゲームルール.md) | **Playable rules (Japanese)** — source of truth for the next prototype sprint |
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

1. **Choose difficulty** — On new game, pick **Easy / Normal / Hard**. This sets **Earth periodic aid** (free H₂O + Fe every 120 ticks). Aid does not decay and is separate from the paid Earth market.
2. **Open inventory** — Click **在庫・地球市場** to view holdings and buy **Fe** and **H₂O** with credits.
3. **CORE intake** — Your core (and any **Atmospheric Intake** modules) continuously harvests Venus air: mostly **CO₂**, some **N₂**, trace **H₂SO₄** and **H₂O**.
4. **Build modules** — Select Intake, ISRU Refinery, Solar Array, or H₂ Buoyancy Cell, then click a `+` hex adjacent to your continent. Every build costs **Fe** from inventory; intake and H₂ cells also need **C** (from ISRU). Your first ISRU only needs **Fe + S**. **H₂ Buoyancy Cell** costs **1 Fe**, 1 H₂, and 1 C.
5. **ISRU loop** — With positive power, each ISRU refinery per tick tries, in order:
   - **Acid split**: H₂SO₄ → H₂ + S + H₂O
   - **Bosch** (primary C route): CO₂ + H₂ → C + H₂O — runs when H₂ ≥ 1
   - **CO₂ electrolysis** (fallback): CO₂ → C (0.05) + O₂ — only when Bosch cannot run; low C yield when hydrogen is scarce
6. **Buoyancy** — H₂ Buoyancy Cells add lift and **base wind load**; **extend** H₂ layers (costs H₂) for more buoyancy and wind load, or **lower** layers to reduce wind load (minimum 1 layer). **Carried inventory adds mass** (Fe, H₂O, S, H₂, O₂, H₂SO₄ count; **C and CO₂ do not**). **Carbon composite** on a selected module spends C to reduce mass and add buoyancy.
7. **Life support** — CORE continuously consumes **O₂** from inventory, so electrolysis byproduct does not pile up as cargo mass.
8. **Corrosion** — Acidic clouds raise corrosion. Select a module and apply **Sulfur Coating** (1 t S) to reduce corrosion and slow further rise; trace S upkeep can slow corrosion fleet-wide.
9. **Trade with Earth** — Sell sulfur for credits to fund market purchases.
10. **Watch net lift** — If net lift stays negative for ~10 ticks, the continent sinks (game over). Restart and try again.

## GDD Highlights

- **Platform**: 2D browser game (top-down hex map, flat UI)
- **Core loop**: Explore → ISRU → Build → Balance buoyancy/power
- **Science**: 50 km altitude, superrotation, acid corrosion, surface explorer heat-only
- **Tone**: Hopeful Earth–Venus partnership; self-sufficiency is an optional proud goal

See [docs/GDD.md](docs/GDD.md) for the complete design. For implementation-ready rules (scale, Venus atmosphere harvest, CO₂/C, CORE intake, unit vs continent terminology), see **[docs/ゲームルール.md](docs/ゲームルール.md)**.
