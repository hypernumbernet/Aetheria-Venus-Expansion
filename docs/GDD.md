# Aetheria: Venus Expansion - Game Design Document

## 1. Game Overview

**Title**: Aetheria: Venus Expansion
**Genre**: Colony Simulation / Base Builder / Resource Management / Exploration
**Core Concept**: Players build and expand a modular floating continent on Venus at ~50km altitude using ISRU from atmospheric (H2SO4, CO2, N2) and surface resources. The goal is to achieve self-sufficiency by growing hexagonal prism units into a large "floating continent."

**Unique Features**:
- Physics-based buoyancy and weight management (extendable upper H2 layer)
- Modular hexagonal unit expansion with vertical zoning
- Dual-purpose exploration vehicle (submarine-type for dense atmosphere)
- AI Computation Resources for research/automation (power-intensive)
- SimCity-like transport infrastructure
- Decreasing Earth support as difficulty progression
- Scientific accuracy: Superrotation, cloud chemistry, surface conditions

## 2. World Setting

- Altitude: 50km (Earth-like pressure ~1atm, temperature 0-50°C)
- Atmosphere: 96.5% CO2, 3.5% N2, H2SO4 clouds with water
- Surface: 462°C, 92 bar, dense CO2 (~65 kg/m³)
- Key phenomenon: Superrotation (~4 Earth day cycle at cloud tops)

Players start with small floating units and expand using local resources while managing acid corrosion, wind loads, heat, and buoyancy.

## 3. Core Gameplay Loop

1. **Explore**: Send atmospheric drones and submarine-type surface vehicles to gather resources.
2. **Recover & Process**: Use ISRU to convert H2SO4 into H2/S/water, CO2 into fuels/O2, surface minerals into materials.
3. **Build & Expand**: Construct and connect hexagonal prism units. Extend upper H2 buoyancy layer to increase mass capacity.
4. **Manage**: Balance power (solar + fuel cells), AI compute, buoyancy, corrosion, and wind stress.
5. **Grow**: Expand the floating continent, unlock technologies, and achieve self-sufficiency as Earth support decreases.

## 4. Key Systems

### Modular Units
- Standard unit: Hexagonal prism (40m side, 40m height)
- Vertical layers: Upper (extendable H2 buoyancy), Middle (residential), Lower (industrial/mobility with dual-use fins)
- Connections: Flexible, redundant, acid-resistant mechanisms

### Resources & ISRU
- Atmospheric: H2 from H2SO4, Sulfur, limited Water
- Surface: Rocks, Iron sulfates, Phosphorus, Uranium (later)
- Key products: Sulfur concrete (limited use for ground facilities), Carbon fiber composites (post-plastic), Synthetic fuels

### AI Computation Resources
- Consumes significant power
- Boosts research speed and robot/automation efficiency
- Core progression driver in mid-to-late game

### Infrastructure
- Transport networks (roads/rails) between units (SimCity-inspired)
- Power grid management

### Exploration
- Submarine-type vehicle: Parachute descent, dense-atmosphere "swimming" movement with dual-use fins (propulsion + heat dissipation), resource collection, balloon/variable buoyancy ascent

## 5. Technology Tree (Detailed)

The technology tree is structured around 6 tiers with a focus on scientific realism. Key elements (S, C, H, N, P, K, Fe, U, H₂O) are required for progression, adding strategic depth.

### Tier 1: Basic Atmospheric Processing (Early Game)
- **Sulfuric Acid Cloud Recovery**: Recover H₂SO₄ from clouds. Requires S, H. Unlocks basic H₂ production and sulfur separation.
- **Simple Hydrogen Production**: Produce H₂ from H₂SO₄. Unlocks initial H₂ cells and first stage of upper H₂ layer extension (40m → 60m).
- **CO₂ Recovery & Oxygen Production**: Capture CO₂ and produce O₂. Requires C, O. Unlocks basic life support and fuel cells.
- **Nitrogen Recovery (Basic Fertilizer)**: Capture N₂ for simple fertilizer. Requires N. Starts basic agriculture.

### Tier 2: Basic Industry & Agriculture
- **Sulfur Basic Processing**: Process sulfur for corrosion-resistant coatings. Requires S. Strengthens lower industrial zones.
- **Basic Agricultural Systems**: Use nitrogen fertilizer for initial crops (slow growth). Requires N.
- **CO₂ to Methane Synthesis** (Sabatier reaction): Produce CH₄ from CO₂ + H₂. Requires C, H. Unlocks mid-scale fuel cells.
- **Surface Explorer Basics**: Basic submarine-type vehicle for surface rock collection. Requires Fe (from ground exploration).

### Tier 3: Resource Diversification & Material Foundations (Mid Game)
- **Ground Mineral Processing**: Refine iron and other minerals from surface. Requires Fe.
- **Phosphorus Recovery (Fertilizer Enhancement)**: Extract phosphorus from surface minerals. Requires P. Significantly improves crop growth (N-P-K balance begins).
- **Carbon Material Foundations**: Produce carbon black and basic carbon materials from atmospheric carbon. Requires C. Limited lightweighting effect.
- **AI Computation Resources (Basic)**: Build initial AI nodes. Requires significant power. Boosts research speed +20% and robot construction speed.

### Tier 4: Advanced Industry & Composite Materials
- **Artificial Petroleum Refining from CO₂**: Produce plastics, synthetic rubber, and high-performance fuels. Requires C, H. Unlocks plastics (prerequisite for advanced composites).
- **Carbon Fiber Composites (CFRP)**: Full carbon fiber + plastic matrix composites. Requires C + plastics. **Major milestone**: Enables significant lightweighting. Upper H₂ layer can now safely extend to 80-100m.
- **Advanced Agriculture**: Full N-P-K fertilizer system. Requires N, P, K. Enables diverse crops, wood production, and biomass utilization.
- **Sulfur Composite Materials**: Enhanced sulfur-based materials for industrial zones and ground facilities (limited use on main floating structure due to weight).

### Tier 5: Energy Revolution & Advanced Materials
- **Nuclear Fuel Refining**: Process uranium ore from surface exploration. Requires U. Unlocks early battery-type nuclear units.
- **Boiling Water Reactor Units**: Advanced nuclear power. Requires U + H₂O (water resource). Provides stable high power output but competes with agriculture for water.
- **High-Performance Carbon Composites**: Ultra-lightweight, high-strength materials. Requires advanced C processing. Allows upper H₂ layer extension up to 120m+.
- **Advanced AI Computation Resources**: Large-scale AI cores. Requires massive power. Boosts research speed +50% and enables full automation.

### Tier 6: Full Self-Sufficiency & Endgame
- **Closed-Loop Ecosystems**: Complete recycling of food, oxygen, and water.
- **Advanced Energy Systems**: Further nuclear or high-efficiency solar advancements.
- **Continent-Wide Climate Control**: Manage wind loads and temperature across the floating continent.
- **Ultimate H₂ Layer Extension**: Theoretical maximum height, enabling massive super-units.

**Key Progression Mechanic**: Extending the upper H₂ layer increases unit mass capacity but raises wind load and H₂ leakage risks. AI compute accelerates research and building but demands power management.

## 6. Challenges & Balance

The game features multiple interconnected challenge systems that create ongoing tension and strategic depth. Each challenge is grounded in Venus's scientific realities and designed to interact with core mechanics like unit expansion, AI usage, and resource management.

### 6.1 Acid Corrosion (Global Challenge)
- **Scientific Basis**: Venus clouds contain concentrated sulfuric acid aerosols that are highly corrosive to most materials.
- **Game Impact**: All structures (especially connections and lower layers) gradually degrade over time. Regular maintenance or acid-resistant coatings (using sulfur composites) are required.
- **Strategic Tension**: Players must balance resource allocation between expansion and maintenance. Neglect leads to connection failures or unit isolation.
- **Interaction**: Affects long-term continent stability and encourages investment in sulfur-based materials.

### 6.2 Wind Loads and Shear (Especially Upper Layer)
- **Scientific Basis**: Strong, consistent superrotation winds (~100 m/s at cloud level) create significant dynamic pressure. Height differences cause wind shear.
- **Game Impact**: Extending the upper H₂ layer increases wind exposure and connection stress. Excessive extension without reinforcement triggers "Wind Shear Events" that can damage connections or cause temporary buoyancy loss.
- **Strategic Tension**: Players must decide how far to push H₂ layer extension for mass capacity versus maintaining structural integrity. Reinforcement research becomes critical for large-scale growth.
- **Interaction**: Directly tied to the core progression mechanic of upper H₂ layer extension.

### 6.3 Heat Management (Surface Explorer Only)
- **Scientific Basis**: Venus surface temperature reaches 462°C, creating extreme thermal stress.
- **Game Impact**: **This challenge applies exclusively to the submarine-type surface exploration vehicle.** The floating continent itself operates at Earth-like temperatures (~0-50°C) and does not suffer from surface-level heat issues.
  - The exploration vehicle accumulates heat during surface operations.
  - Players must manage active cooling via dual-use fins (heat dissipation + propulsion) and potassium-based heat pipes.
  - Prolonged surface stays without proper cooling lead to equipment failure or vehicle loss.
- **Strategic Tension**: Creates risk-reward decisions during surface resource runs. Players must balance exploration time against vehicle safety and repair costs.
- **Interaction**: Encourages technological investment in heat management systems and limits aggressive surface exploitation early on.

### 6.4 Buoyancy and Weight Management
- **Scientific Basis**: Buoyancy depends on displaced atmospheric volume versus vehicle mass. Extending structures increases both lift potential and wind exposure.
- **Game Impact**: Adding units or extending the upper H₂ layer increases total mass. Insufficient buoyancy causes gradual descent or emergency measures (H₂ venting or ballast discard).
- **Strategic Tension**: Core gameplay tension when expanding the continent. Players must proactively extend H₂ structures or add auxiliary buoyancy while managing wind risks.
- **Interaction**: Directly linked to unit expansion and upper layer mechanics. Creates meaningful trade-offs between growth speed and stability.

### 6.5 Power Management (Especially with AI)
- **Scientific Basis**: Solar power is available but intermittent due to clouds and the shortened day-night cycle from superrotation.
- **Game Impact**: AI Computation Resources consume large amounts of power. Over-investment in AI can starve other systems (ISRU, cooling, life support).
- **Strategic Tension**: Players must balance AI investment (faster research/building) against power generation capacity. Fuel cells (from H₂/CH₄) become critical backups.
- **Interaction**: Creates deep resource management gameplay and makes power infrastructure a constant priority.

### 6.6 Resource Bottlenecks
- **Scientific Basis**: Venus has limited water and specific mineral distributions.
- **Game Impact**: Water and Phosphorus become mid-to-late game bottlenecks for agriculture and nuclear power. Over-reliance on certain resources creates vulnerabilities.
- **Strategic Tension**: Forces players to diversify resource acquisition (atmospheric vs surface) and manage competing demands (e.g., water for farming vs nuclear).
- **Interaction**: Encourages exploration progression and creates meaningful late-game decisions.

### 6.7 Exploration Risks
- **Scientific Basis**: Surface conditions are extremely hostile (heat, pressure, corrosion).
- **Game Impact**: The submarine-type exploration vehicle can be lost or damaged during extended surface operations. Recovery missions may be required.
- **Strategic Tension**: High-risk, high-reward resource gathering. Players must weigh potential gains against vehicle replacement costs and lost progress.
- **Interaction**: Ties directly into the exploration loop and encourages technological upgrades to the vehicle.

### 6.8 Decreasing Earth Support
- **Game Impact**: Periodic support from Earth gradually diminishes over the campaign, eventually stopping entirely.
- **Strategic Tension**: Early game is more forgiving; late game forces complete self-reliance. Creates a natural difficulty curve and narrative progression.
- **Interaction**: Reinforces the importance of robust ISRU and automation systems.

## 7. Progression & Meta
- Research tree with explicit element requirements (S, C, H, N, P, K, Fe, U, H₂O)
- Unit expansion and continent growth
- AI allocation for automation vs manual control
- Earth support difficulty slider (decreases over campaign)

## 8. Visual & Audio Direction
- Beautiful contrast between orange Venus clouds and artificial hexagonal structures
- Visual growth as upper H₂ towers extend
- Tense environmental audio with achievement moments on expansion

---

*This document is generated based on iterative design discussions incorporating scientific accuracy of Venus (superrotation, atmospheric chemistry, ISRU feasibility, material science). Further details can be expanded.*