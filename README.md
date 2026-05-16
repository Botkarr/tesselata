# Dynamic World Simulation (Project)

This project is a complex, grid-based economic and social simulation where every single cell operates as an independent economic unit. The goal of the simulation is to model a living, breathing world where geographical features, resource management, and infrastructure interact with one another.

> **⚠️ Warning:** The project is currently **under heavy development**. Many features are in an experimental phase; the code structure and gameplay elements may change daily.

---

## 🌍 General Description

The simulation takes place on a procedurally generated map (based on Perlin noise), where different terrain types (water, plains, hills, mountains) and vegetation determine the possibilities for life. Each cell has its own stocks (food, wood, stone, gold, luxury goods) and population, which constantly evolve during the simulation steps.

### Current Core Mechanisms:
- **Economy:** Cells produce resources according to their attributes, trade with neighbors for missing goods, and consume resources to survive.
- **Dynamic Roads:** Intense trade traffic wears down the roads, while high road quality reduces transportation costs.
- **Urbanization:** Cells can upgrade their built-up level, increasing housing capacity, but this requires significant resource investment.

---

## 🎮 User Guide

### Running the Project
Since the project uses modern JavaScript (ES Modules), a simple local HTTP server is required to run it:
1. Download the project files.
2. Start a server in the root directory (e.g., VS Code "Live Server" extension, or in the terminal: `python -m http.server`).
3. Open `index.html` in your browser.

### Controls
- **Switch Views:** Use the icons on the left to switch between terrain, population, wellness, or specific resource views.
- **Select a Cell:** Click on any cell to display the detailed info panel on the right.
- **Interaction:** The player (as the Ruler) can donate gold or resources to the selected cell or improve its road network.
- **Statistics:** The "Statistics" button in the top bar opens a global overview of the world's state.

---

## 🚀 Key Upcoming Features (Roadmap)

In the next phases of development, the following major updates are expected:

1.  **Rework of Player Roles:** Introduction of a three-tier interaction system:
    -   **God Mode:** Full control over physics and geography (terraforming, global disasters).
    -   **King Mode:** Strategic management, state-level decisions, and economic regulation.
    -   **Knight Mode:** Character-focused micro-management and direct participation in world events.
2.  **States and Politics:** Formation of national borders, diplomatic relations, taxation systems, and management of political tensions.
3.  **Introduction of Characters:** Named NPCs with unique traits who influence the development of cells and states.
4.  **Economic Balancing:** Fine-tuning production chains, and more realistic modeling of inflation and scarcity-based economies.

---

## 🛠️ Technical Stack
- **Frontend:** Vanilla JavaScript, HTML5 Canvas, CSS3.
- **Architecture:** Modular structure (`World` -> `Cell` -> `CellLogic`).
- **Algorithms:** Perlin noise for map generation, custom cell-based trade AI.
