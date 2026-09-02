# Aetheria: Venus Expansion - Game Design Document

## 1. Game Overview

**Title**: Aetheria: Venus Expansion
**Genre**: Colony Simulation / Base Builder / Resource Management / Exploration
**Platform**: 2D browser game (HTML5 canvas, top-down or isometric hex map, 2D UI overlays)
**Core Concept**: Players build and expand a modular floating continent on Venus at ~50km altitude using ISRU from atmospheric (H₂SO₄, CO₂, N₂) and surface resources. The goal is to grow hexagonal prism units into a thriving floating continent—optionally achieving full self-sufficiency as a proud engineering milestone while Earth remains a cooperative partner.

**Unique Features**:
- Physics-based buoyancy and weight management (extendable upper H₂ layer)
- Modular hexagonal unit expansion with vertical zoning
- Dual-purpose exploration vehicle (submarine-type for dense atmosphere)
- AI Computation Resources for research/automation (power-intensive)
- SimCity-like transport infrastructure
- Ongoing Earth–Venus trade and joint research partnership (hopeful, never abandoned)
- Scientific accuracy: Superrotation, cloud chemistry, surface conditions

## 2. World Setting

### Scientific Details of the 50km Altitude Environment
At ~50km altitude on Venus, conditions approximate Earth's surface: pressure 0.5-1 atm, temperature 0-50°C, density ~0.5-1 kg/m³. Key similarities include habitable temperature and pressure ranges; differences center on the CO₂-dominated atmosphere and altitude-dependent strong winds from superrotation. This altitude band is optimal for floating structure operations.

### Atmospheric Composition and Cloud Structure
The atmosphere comprises 96.5% CO₂ and 3.5% N₂ as primary components, with trace SO₂ and H₂O. H₂SO₄ (sulfuric acid) clouds spanning 48-70km were shown by 2025 reanalysis to hold higher water content than prior models, intensifying acidity. Cloud layers divide into upper (thin haze in upper troposphere), middle (dense main deck), and lower (precipitation-bearing), driving corrosive fallout and visibility constraints.

### Superrotation Mechanism
Venus's atmosphere rotates at varying angular velocities by altitude, producing superrotation (~4 Earth-day cycle, winds >100 m/s) at cloud tops. Akatsuki observations identified thermal tidal waves and atmospheric gravity waves as primary angular momentum transporters, featuring day-night asymmetric meridional circulation (dayside upwelling, nightside downwelling) and vertical wind shear (gentle at lower altitudes, sharp at upper). This drives core wind load management challenges.

### Surface Environment Details
Surface conditions (462°C, 92 atm, 65 kg/m³ density) create a near-supercritical CO₂ fluid state. The terrain is dominated by basaltic rocks with iron sulfate (e.g., FeSO₄) deposits, necessitating extreme heat, pressure, and corrosion resistance for any surface probes.

### Scientific Rationale for Floating Bases
Earth-like temperature and pressure at 50km enable buoyancy-supported lightweight base construction and offer an accessible altitude for surface-reaching probes (parachute descent followed by dense-atmosphere "submarine" transit). Self-sufficiency via ISRU is a proud optional goal; Earth remains a reliable trading and research partner throughout the campaign.

### Historical Exploration Context
JAXA's Akatsuki orbiter, since its 2015 Venus orbit insertion, has mapped superrotation wave dynamics and atmospheric processes in detail, providing the scientific foundation and realism for this game's world.

Players start with small floating units and expand using local resources while managing acid corrosion, wind loads, heat, and buoyancy.

## 3. Core Gameplay Loop

The core loop is structured as interconnected short-, medium-, and long-term cycles to deliver sustained engagement and deep satisfaction typical of high-quality simulation games. Players experience immediate tangible feedback from actions, emergent complexity from system interactions, creative expression through base design, and meaningful progression toward ambitious goals. Key satisfaction drivers include visual spectacle of growth, "aha" moments from clever optimizations, narrative emergence from AI crew logs and event chains, and replayability via multiple viable strategies and dynamic challenges.

**Inner Tactical Loop (Real-time Operations - Minutes):**

1. **Explore**: Dispatch and pilot atmospheric drones for cloud sampling and high-altitude scouting, alongside the versatile submarine-type surface vehicle (parachute descent + dense-atmosphere swimming with dual-purpose fins for propulsion and thermal management). Exploration yields not only raw resources but scientific data logs, rare mineral hotspots, and dynamic events (e.g., acid precipitation fronts or superrotation wind shears) that players must navigate in real-time for bonus yields or risk mitigation.

2. **Recover & Process**: Activate ISRU refineries to break down collected H₂SO₄ into hydrogen, sulfur, and trace water; crack CO₂ for oxygen and carbon feedstocks; and smelt surface ores. Players optimize processing queues, temperature/pressure parameters, and by-product utilization to minimize waste and maximize efficiency. Logistics networks (conveyor-like pipes and automated drones) connect collection points to processing hubs, creating satisfying flow visualizations akin to factorio-style automation.

3. **Build & Expand**: Design modular hexagonal prism layouts on a physics-simulated grid. Construct new units, link them with flexible connectors, and extend the upper hydrogen buoyancy envelope to support added mass. Player creativity shines in vertical zoning (residential gardens in mid-layer, industrial fins below), aesthetic customization using material palettes, and spatial planning that affects traffic flow and structural integrity.

4. **Manage & Balance**: Monitor a central dashboard displaying real-time metrics for power generation/consumption, AI compute allocation, net buoyancy, corrosion rates, and wind-load stresses. Respond to alerts by rerouting power, deploying maintenance bots, or adjusting fin angles. Subtle imbalances create tension that resolves satisfyingly when optimized (e.g., using excess sulfur for protective coatings that unlock new build options).

5. **Adapt to Dynamics**: React to environmental events (gusts from superrotation, equipment degradation, population needs spikes) by improvising solutions that leverage prior tech investments. Successful adaptations generate crew morale bonuses and unlock flavor text or minor narrative arcs.

**Strategic Mid-Loop (Planning & Progression - Hours):**

- Allocate AI compute between urgent automation tasks, research projects, and predictive simulations that reveal future bottlenecks.
- Expand population through life-support scaling and agriculture, managing citizen happiness via amenities, recreation modules, and psychological factors (e.g., view of the clouds).
- Invest in infrastructure upgrades (transport rails, redundant power grids) that multiply the efficiency of the inner loop.

**Outer Campaign Loop (Long-term Vision - Multiple Sessions):**

- Scale the floating continent from a handful of modules to a sprawling megastructure, with visual milestones such as "continent tier" thresholds triggering celebratory 2D animations, new music layers, and Earth–Venus news bulletins.
- Progress through the technology tree, where each breakthrough delivers satisfying 2D schematic reveals and UI unlock animations demonstrating the new capability in context.
- Pursue optional self-sufficiency milestones while maintaining Earth trade routes and joint research exchanges, culminating in high-score calculation based on efficiency, sustainability, and exploration completeness, plus options for post-game sandbox or challenge scenarios.

This layered structure ensures players feel constant agency and reward: short-term actions produce visible progress and resource influx, medium-term decisions create powerful synergies and automation, and long-term play yields a personalized, living world that feels earned through skillful play and creative choices. Emergent stories arise naturally—e.g., a well-placed fin array surviving a major storm and enabling a rapid expansion surge—fostering emotional investment.

## 4. Key Systems

### Modular Units
Each 40m hexagonal prism unit serves as a self-contained voxel in the growing continent. Vertical zoning is fully player-directed: the extendable upper H₂ layer provides buoyancy that scales with envelope volume and gas pressure (visual gas cells inflate satisfyingly); the middle layer hosts configurable residential, agricultural, or research modules with windowed views of Venusian clouds for crew morale bonuses; the lower industrial layer integrates dual-use aerodynamic fins that double as heat radiators and propulsion surfaces. Connections use articulated, corrosion-proof joints that transmit power, data, and resources while flexing under wind loads—players witness stress visualizations and can reinforce proactively. Satisfaction arises from creative layouts (organic vs grid patterns), real-time physics feedback during construction (wobble warnings, buoyancy recalculations), and milestone "continent growth" animations when modules link successfully. Units can be upgraded in-place with new skins and functions unlocked via materials tech, encouraging iterative redesign.

### Resources & ISRU
Resource chains are deep, branching, and visually rich. Atmospheric scoops harvest H₂SO₄ mists that feed multi-stage refineries: electrolysis yields H₂ (for buoyancy and fuel cells), sulfur (coatings, composites), and reclaimed water; CO₂ Sabatier and Bosch reactors produce CH₄, O₂, carbon black, and eventually advanced polymers. Surface expeditions return basaltic rock and iron sulfates processed into sulfur concrete, phosphorus fertilizers, and trace metals. By-product synergies create "aha" moments—excess sulfur protects new builds, waste heat warms greenhouses, or CO₂-derived plastics enable lighter modules. Players optimize refinery recipes, storage buffers, and drone logistics routes on a live flow diagram, with color-coded efficiency scores and waste-heat recovery stats. Dynamic events (acid rain spikes, wind-driven dilution) force adaptive rerouting, rewarding foresight and creating emergent storytelling through automated log entries.

### AI Computation Resources
AI nodes are power-hungry crystalline server clusters whose pulsing blue glow intensifies with load. Players allocate compute across three competing pools via a radial UI: research (accelerating tech unlocks with holographic progress trees), automation (improving bot speed, refinery throughput, and predictive maintenance), and simulation (running "what-if" forecasts for buoyancy under upcoming storms or population growth curves). Higher AI investment yields satisfying exponential gains but risks brownouts if power fluctuates. Late-game quantum or optical upgrades unlock creative applications such as procedural interior design suggestions. Visual feedback includes node "awakening" sequences and crew celebration voice lines when breakthroughs occur, turning abstract compute into tangible progress and narrative flavor.

### Infrastructure
Transport and utility networks emulate SimCity depth with Venusian twists. Hexagonal grid roads/rails support autonomous cargo pods whose routes players optimize for minimal travel time and congestion (heat-map overlays highlight bottlenecks). Power flows through flexible superconducting spines that players can reroute during outages; solar arrays on upper surfaces compete with fuel-cell banks for surface area, creating meaningful placement dilemmas. Redundant loops and backup capacitors prevent cascading failures during superrotation gusts. Players derive satisfaction from watching smoothly animated logistics flows, achieving "perfect efficiency" badges on sub-networks, and unlocking aesthetic upgrades (glowing light strips, animated maintenance bots) that make the continent feel alive and personalized.

### Exploration
The submarine-type vehicle is a core source of wonder and risk. Players manually or semi-autonomously pilot it: parachute descent through turbulent cloud layers (with real-time turbulence audio), then "swimming" propulsion via fin vectoring in the dense lower atmosphere while managing heat buildup on specialized radiator fins. Resource collection involves scanning, drilling, and sample return with limited cargo; ascent uses variable-buoyancy balloons that players time against wind shear. Discoveries include not only bulk materials but rare data caches, geological anomalies, and occasional dynamic events (surface lava flows, probe wreckage). Every successful mission returns with a generated expedition log that populates a discoverable codex, fostering emotional attachment. Vehicle upgrades (better fins, stronger balloons, AI co-pilot) transform early hair-raising manual flights into elegant, high-yield automated runs, delivering clear mastery progression and cinematic replay value.

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

### 6.8 Earth Partnership & Trade
- **Narrative Basis**: Earth and the Venus floating colony maintain an ongoing cooperative relationship—supply exchanges, scientific data sharing, and cultural contact continue throughout the campaign.
- **Game Impact**: Players can request periodic trade shipments (metals, specialty equipment, research data) in exchange for Venusian exports (sulfur composites, atmospheric samples, exploration logs). Trade volume scales with reputation earned through milestones, not through abandonment.
- **Strategic Tension**: Relying heavily on imports is viable but costly in trade goods and logistics; pursuing self-sufficiency unlocks prestige bonuses and reduces trade dependency without severing Earth ties.
- **Interaction**: Reinforces ISRU mastery as a proud optional path while keeping the tone hopeful and collaborative.

## 7. Progression & Meta

Progression in Aetheria: Venus Expansion is deliberately multi-dimensional, rewarding players who master the interplay of physics, chemistry, and automation rather than simple resource accumulation. Growth occurs along three tightly interwoven axes—technical, physical, and systemic—creating a satisfying arc from fragile outpost to thriving floating nation. The meta layer adds long-term narrative depth through the evolving Earth–Venus partnership and meaningful playstyle choices that shape each player’s unique continent identity.

### 7.1 Progression (Three Growth Axes)

**1. Technical Growth (Research Progression)**  
The technology tree is gated by acquisition and sophisticated use of key elements (S, C, H, N, P, K, Fe, U, H₂O). Early tiers focus on basic atmospheric cracking and life support; mid tiers unlock carbon-fiber composites, full N-P-K agriculture, and initial AI nodes; late tiers enable nuclear power, advanced composites, and near-total automation. Each breakthrough delivers clear visual and auditory payoffs: new holographic schematics, upgraded module appearances, and crew voice lines celebrating milestones. AI compute can be heavily invested to accelerate research, but this creates a constant power trade-off that forces players to optimize their energy economy. The result is a deep sense of mastery as players discover synergistic element chains (e.g., sulfur coatings enabling safer H₂ extension, which in turn supports more AI nodes).

**2. Physical Growth (Continent Expansion)**  
Physical scale increases through the addition and interconnection of hexagonal prism units and the controlled extension of the upper H₂ buoyancy envelope. Each new module or envelope stage raises mass capacity while simultaneously increasing wind exposure and connection stress—maintaining the core tension of buoyancy versus structural integrity. Players experience visceral satisfaction from watching the continent visibly grow: upper towers inflate with shimmering hydrogen cells, new residential gardens bloom under the orange sky, and lower industrial fins deploy with satisfying mechanical animations. Over-expansion without proper reinforcement triggers dramatic (but recoverable) Wind Shear Events, teaching players to balance ambition with engineering discipline. Late-game megastructures feel genuinely earned and visually spectacular.

**3. Systemic Growth (Automation & Efficiency)**  
Early gameplay centers on hands-on management of drones, refineries, and power routing. As players invest in AI nodes and infrastructure, routine tasks migrate to autonomous systems, freeing cognitive bandwidth for higher-level planning and creative design. Transport networks evolve from simple drone paths into optimized rail-and-pod grids; power grids gain redundant spines and predictive load balancing. The satisfaction curve is steep: players witness their once-chaotic resource flows become elegant, self-regulating circulatory systems. However, larger continents introduce more variables (corrosion spread, population needs, cumulative wind loads), ensuring that systemic mastery remains an ongoing, rewarding challenge rather than a solved problem.

### 7.2 Meta (Long-term Framework & Player Expression)

**Earth Partnership & Optional Self-Sufficiency**  
Earth remains a cooperative trading and research partner for the entire campaign. Regular exchanges bring specialty goods, shared scientific breakthroughs, and uplifting news bulletins that celebrate Venusian milestones alongside terrestrial achievements. Players who choose to pursue full self-sufficiency earn “Independence Threshold” accolades—a proud engineering feat, not an abandonment narrative. Difficulty scales through environmental challenges (wind, acid, resource bottlenecks) and player-chosen goals rather than dwindling external aid.

**Playstyle Choice & Continent Identity**  
Players can lean toward manual control (minimizing AI investment for fine-grained oversight and higher peak efficiency) or full automation (heavy AI allocation for scalable, low-intervention operation). Hybrid approaches are viable and often optimal. These choices manifest visibly: manual-heavy continents feature intricate, hand-optimized layouts and frequent player interventions; automation-heavy ones display sweeping, efficient mega-structures with glowing AI nodes and minimal human presence. Both paths are valid, generate distinct emergent stories, and support high replayability through different starting conditions or self-imposed challenges.

**Ultimate Long-term Goal**  
The overarching objective transcends mere survival. Players strive to establish a permanent floating nation capable of supporting a thriving population and advancing science in partnership with Earth. Completion is marked by a celebratory closure sequence: a full-continent ceremony with panning 2D camera work, a comprehensive “Legacy Score” evaluating efficiency, sustainability, exploration breadth, and aesthetic harmony, plus options to continue in endless sandbox mode or attempt harder challenge scenarios. This structure gives every playthrough a clear sense of purpose and lasting achievement.

## 8. Visual & Audio Direction

The audiovisual direction blends rigorous scientific realism with a subtle, dreamlike fantasy quality that makes the floating continent feel both plausible and wondrous. Venus itself remains a hostile, orange-hued world of dense clouds and dramatic superrotation, yet the player’s artificial structures possess a soft, almost ethereal glow that hints at humanity’s hopeful foothold in an alien sky. This contrast—harsh planetary reality versus the delicate, luminous human presence—forms the emotional core of the visual identity.

### Platform & Presentation Constraints (2D Browser)
The game ships as a **2D browser experience** using HTML5 canvas (or equivalent 2D renderer) with a **top-down or isometric hex map** and flat 2D UI panels. All systems fantasy from this document—buoyancy, ISRU, wind loads, exploration—maps to readable 2D representations:

- **Hex map**: Modules render as layered 2D sprites or vector shapes showing upper H₂ envelope, mid-layer habitat, and lower industrial fins as distinct color bands or icon stacks.
- **Exploration**: Surface missions use a separate 2D side-view or simplified top-down mini-map; heat buildup displays as gauge overlays rather than full 3D vehicle models.
- **Infrastructure**: Transport and power networks appear as animated 2D lines and flow arrows on the hex grid.
- **UI**: Holographic-style panels, resource dashboards, and tech-tree nodes are flat 2D elements with scan-line shaders where supported.
- **Cutscenes & milestones**: Replaced by 2D pan/zoom camera moves, schematic reveal animations, particle overlays (hex motes, aurora ribbons), and full-screen UI celebrations—no cinematic 3D camera orbits.
- **Performance target**: Runs smoothly in modern browsers without WebGL-heavy requirements; graceful degradation on lower-end devices.

### Visual Style
Environments use a rich 2D art style with layered parallax cloud backgrounds, wind-driven particle sprites, and warm Venusian color grading (oranges, deep teals, amber haze). Structures feature gentle painterly edge softening, warm rim highlights, and faint iridescent accents on hydrogen cells and carbon-fiber surfaces. Hexagonal modules catch the perpetual twilight in rich oranges and deep teals, while interior indicators glow with soft bioluminescent accents on 2D module icons. As the continent grows, upper H₂ towers extend with visible 2D scale animations showing gas-cell inflation. New modules deploy via unfolding sprite sequences accompanied by drifting condensation particle effects. Exploration of the surface reveals heat-shimmer overlays and occasional volcanic glow sprites, all rendered with scientific fidelity but softened by a light fantasy haze that evokes wonder rather than pure desolation. Dynamic time-of-day tint shifts (shortened by superrotation) and weather events (acid mist, wind shear) further enrich the living world.

### Audio Direction – Ambient & Meditative
The default musical palette is contemplative and emotionally resonant: warm electric piano, soft brush drums, upright bass, and layered atmospheric pads interwoven with processed field recordings of Venusian wind and distant thunder. Pieces evolve slowly, mirroring the patient, long-term nature of colony building. Subtle jazz phrasing—gentle improvisational runs on piano or muted trumpet—occasionally surfaces during calm periods, lending a sophisticated, lived-in warmth without breaking immersion. Environmental audio is equally rich: low-frequency wind shear across the H₂ envelope, the soft hiss of refineries, the rhythmic clack of cargo pods on rails, and faint crew chatter that grows livelier as population increases. All elements mix dynamically; during storms the jazz elements recede in favor of tense, dissonant pads and howling wind layers.

### Achievement & Milestone Audio-Visual Feedback
Major accomplishments—new continent tier, successful self-sufficiency milestone, major tech breakthrough, or record-efficiency quarter—trigger deliberately exaggerated, celebratory sequences. The screen gently slows as triumphant orchestral brass and choir swell over the base jazz-ambient bed. A large, elegant Legacy Score display fades in at center screen with 2D particle confetti (glowing hexagonal motes and soft aurora-like ribbons in Venusian oranges and cyans). Crew voice lines cheer in multiple languages, and the view performs a smooth 2D pan-and-zoom across the newly expanded continent section. These moments are intentionally over-the-top to deliver cathartic payoff after long periods of careful management, reinforcing emotional investment and a sense of genuine achievement.

### UI and Feedback Polish
All interface elements adopt a clean, holographic aesthetic with subtle scan-line and lens-flare touches that feel both futuristic and slightly magical. Resource flow diagrams pulse gently when efficiency improves. Damage or stress warnings appear as elegant amber glyphs rather than harsh red alerts. These small touches maintain readability while preserving the overall tone of hopeful, almost fantastical human ingenuity against the vast Venusian backdrop.

## 9. Documentation Hierarchy & Terminology (Next Sprint)

**Playable rules source of truth**: For the next prototype sprint, the Japanese rules document **[ゲームルール.md](./ゲームルール.md)** overrides this GDD where they differ—especially **scale**, **terminology**, and **atmospheric resource handling**.

| Topic | GDD (this file) | ゲームルール.md (authoritative for sprint) |
|-------|-----------------|---------------------------------------------|
| One hex on the map | Historically described as a "40m hexagonal prism unit" | A **small module** with **~100 m² floor area** (regular hex ≈ 6.2 m side). Never called a continent. |
| Floating continent | Growth of linked modules | The **connected assembly** of many units only (**浮遊大陸**). |
| Atmospheric harvest | Various chains | **CO₂-first** mix from real Venus composition; **CO₂** and **C** as first-class elements; **CORE** passive intake. |
| Iron | Surface / trade | Not atmospheric; **required to build**; Earth market is a hopeful partner (no dwindling support). **Difficulty** sets free periodic **H₂O + Fe** aid only (see ゲームルール.md §8). |

Implementers should read ゲームルール.md before changing prototype behavior. Short GDD edits (like this section) may be added to reduce contradiction; a full GDD rewrite is not required each sprint.

## 10. Prototype Sprint Notes

The browser prototype (`prototype/`) validates core tension loops before full production:

- **Construction costs inventory** — Placing ISRU, solar, or H₂ modules deducts catalog materials (H₂SO₄, H₂, sulfur, iron). Iron is required for every buildable module and is purchased from the Earth market in this sprint. Players cannot build without sufficient holdings; starting stock is intentionally tight.
- **Earth as a market** — Credits purchase materials (including iron) from Earth; sulfur exports earn credits. Earth is a cooperative trading partner, not a dwindling lifeline.
- **Game over: sinking** — When net buoyancy (lift − mass) stays negative for a short countdown (~10 ticks), the floating continent sinks. Tone is hopeful retry, not abandonment.
- **Next sprint** — Carbon material loop (stubbed in catalog as locked); surface iron mining as an alternative to Earth purchase.
