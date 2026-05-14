// world.js
// A Világ osztály, amely összefogja a cellákat és vezérli a szimulációs ciklust.

import { CONFIG } from './config.js';
import { Cell } from './cell.js';
import { perlin2D } from './PerlinNoise.js'; // Perlin-zaj importálása

export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = []; 
        this.generateMap();
        this.linkNeighbors();

        //  Statisztikák
        this.maxPopulation = 0;
        this.maxFoodStock = 0;
        this.maxWoodStock = 0;
        this.maxStoneStock = 0;
        this.maxLuxuriesStock = 0;
        this.maxGoldStock = 0;
        this.maxBuiltUpLevel = 0;

        this.sumPopulation = 0;
        this.sumFood = 0;
        this.sumWood = 0;
        this.sumStone = 0;
        this.sumLuxuryGoods = 0;
        this.sumGold = 0;
        this.sumBuiltUpLevel = 0;

        this.deathsThisTick = 0;
        this.deaths = 0;
        this.traded = 0; // az adott körben történt kereskedelmek.
        this.age = 0;
    }
    
    // --- Térképgenerálás (Perlin-zaj) ---
    generateMap() {
        const noiseSettings = CONFIG.NOISE_SETTINGS;

        for (let x = 0; x < this.width; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.height; y++) {
                
                // 1. Felszín (Terrain) generálása
                const terrainNoise = perlin2D(
                    x * noiseSettings.TERRAIN_SCALE, 
                    y * noiseSettings.TERRAIN_SCALE
                );

                let terrain;
                // Küszöbértékek alapján történő besorolás
                if (terrainNoise < noiseSettings.TERRAIN_THRESHOLD.WATER) {
                    terrain = "WATER";
                } else if (terrainNoise < noiseSettings.TERRAIN_THRESHOLD.PLAINS) {
                    terrain = "PLAINS";
                } else if (terrainNoise < noiseSettings.TERRAIN_THRESHOLD.HILLS) {
                    terrain = "HILLS";
                } else {
                    terrain = "MOUNTAIN";
                }
                
                // 2. Növényzet (Vegetation) generálása
                let vegetation = "NONE";
                const vegNoise = perlin2D(
                    x * noiseSettings.VEGETATION_SCALE,
                    y * noiseSettings.VEGETATION_SCALE
                );

                if (vegNoise < noiseSettings.VEGETATION_THRESHOLD[terrain].WASTELAND) {
                    vegetation = "WASTELAND";
                } else if (vegNoise < noiseSettings.VEGETATION_THRESHOLD[terrain].FIELD) {
                    vegetation = "FIELD";
                } else if (vegNoise < noiseSettings.VEGETATION_THRESHOLD[terrain].FOREST){
                    vegetation = "FOREST";
                } else {
                    vegetation = "SUPERFOREST"
                }

                if (terrain === "WATER") {vegetation = "NONE"}
                
                this.grid[x][y] = new Cell(x, y, terrain, vegetation);
            }
        }
    }

    // --- SZIMULÁCIÓS FÁZISOK ---
    simulationStep() {
        // 1. FÁZIS: Termelés és fogyasztás (függ a korábbi állapottól)
        for (const cell of this.grid.flat()) {
            cell.produce();
            cell.consume(); 
            // A decayPathTraffic átkerült
        }

        // 2. FÁZIS: Gazdasági döntések (mit vegyek/adjak el, mennyiért?)
        for (const cell of this.grid.flat()) {
            cell.calculateEconomicDecisions();
        }

        // 3. FÁZIS: Kereskedelem lebonyolítása
        for (const cell of this.grid.flat()) {
            this.traded += cell.DoTrades();
        }

        for (const cell of this.grid.flat()) {
            cell.refreshInventory();
        }

        // 4. FÁZIS: Jólét és Népesség frissítése
        for (const cell of this.grid.flat()) {
            cell.updateWellness();
            cell.updatePopulation();
            this.deathsThisTick += cell.deathsThisTick;
        }

        // 5. FÁZIS: Migráció kezelése
        for (const cell of this.grid.flat()) {
            cell.population += cell.netMigration;
            cell.netMigration = 0; // Visszaállítjuk a migrációs értéket
            if (cell.population < 0) {
                cell.population = 0;
                console.log(`Cell (${cell.x}, ${cell.y}) population dropped below 0. Reset to 0.`);
            }
        }

        // 6. FÁZIS: Utak frissítése és Forgalom csillapítása
        for (const cell of this.grid.flat()) {
            cell.updateRoadQuality(); // Használja a forgalmat
            cell.totalTraffic = 0; // Nullázza a forgalmat
        }

        // 7. FÁZIS: Fejlesztések végrehajtása (pl. beépítettség)
        for (const cell of this.grid.flat()) {
            cell.executeUpgrades();
        }

        // 8. FÁZIS: Statisztikáka main loopban kezelve


        // egy cella értékeinekk kiírása teszteléshez
        /*console.log("Cell (5,5) Population:", this.getCell(5,5).population + ", Wellness:", this.getCell(5,5).wellness.toFixed(2) +
            ", FOOD:", this.getCell(5,5).inventory.FOOD.toFixed(2) + ", GOLD:", this.getCell(5,5).inventory.GOLD.toFixed(2) +
            ", Road Quality:", this.getCell(5,5).roadQuality.toFixed(2));*/

        // Végsső scannelés NaN után
        if (CONFIG.SRCH_NAN) { this.checkForNaN(this, "End of simulation step"); }
    }


    // --- Szimulációs és segédfüggvények ---
    
    // Szomszédos cellák összekapcsolása
    linkNeighbors() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const cell = this.grid[x][y];
                const neighbors = [];
                const pot = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Csak négy irányban
                for (let i = 0; i < 4; i++) {
                    const nx = x + pot[i][0];
                    const ny = y + pot[i][1];
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        neighbors.push(this.grid[nx][ny]);
                    }
                }
                cell.neighbors = neighbors;
            }
        }
    }

    // Cella lekérése koordináták alapján
    getCell(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[x][y];
        }
        return null;
    }

    // Maximális népesség lekérése a térképen (térkép használja)
    getMaxPopulation() {
        let maxPop = 10;
        for (const cell of this.grid.flat()) {
            if (cell.population > maxPop) {
                maxPop = cell.population;
            }
        }
        return maxPop;
    }

    // Maximális készlet lekérése egy adott erőforrásból (térkép használja)
    getMaxStock(resource) {
        let maxStock = 100;
        for (const cell of this.grid.flat()) {
            if (cell.inventory[resource] > maxStock) {
                maxStock = cell.inventory[resource];
            }
        }
        return maxStock;
    }

    // Maximális beépítettség lekérése (térkép skálázáshoz)
    getMaxBuiltUpLevel() {
        let maxLevel = 8; // 8 a minimum
        for (const cell of this.grid.flat()) {
            if (cell.builtUpLevel > maxLevel) {
                maxLevel = cell.builtUpLevel;
            }
        }
        return maxLevel;
    }

    // Statisztikák frissítése
    refreshStatistics() {
        this.maxPopulation = this.getMaxPopulation();
        this.maxFoodStock = this.getMaxStock('FOOD');
        this.maxWoodStock = this.getMaxStock('WOOD');
        this.maxStoneStock = this.getMaxStock('STONE');
        this.maxLuxuriesStock = this.getMaxStock('LUXURY_GOODS');
        this.maxGoldStock = this.getMaxStock('GOLD');
        this.maxBuiltUpLevel = this.getMaxBuiltUpLevel();

        this.sumPopulation = 0;
        this.sumFood = 0;
        this.sumWood = 0;
        this.sumStone = 0;
        this.sumLuxuryGoods = 0;
        this.sumGold = 0;
        this.sumBuiltUpLevel = 0;
        for (const cell of this.grid.flat()) {
            this.sumPopulation += cell.population;
            this.sumFood += cell.inventory.FOOD;
            this.sumWood += cell.inventory.WOOD;
            this.sumStone += cell.inventory.STONE;
            this.sumLuxuryGoods += cell.inventory.LUXURY_GOODS;
            this.sumGold += cell.inventory.GOLD;
            this.sumBuiltUpLevel += cell.builtUpLevel;
        }

        this.deaths += this.deathsThisTick;
        this.deathsThisTick = 0;
        this.age ++;
    }

    // --- DEBUG: NaN diagnosztika ---
    checkForNaN(world, stepName = "unknown phase") {
        let errorFound = false;
        for (const cell of world.grid.flat()) {
            // Ellenőrizzük a fő mezőket
            const fields = {
                population: cell.population,
                wellness: cell.wellness,
                roadQuality: cell.roadQuality,
                totalTraffic: cell.totalTraffic,
                netMigration: cell.netMigration,
                builtUpLevel: cell.builtUpLevel,
                FOOD: cell.inventory.FOOD,
                WOOD: cell.inventory.WOOD,
                STONE: cell.inventory.STONE,
                LUXURY_GOODS: cell.inventory.LUXURY_GOODS,
                GOLD: cell.inventory.GOLD
            };

            for (const [key, val] of Object.entries(fields)) {
                if (isNaN(val) || !isFinite(val)) {
                    errorFound = true;
                    console.error(
                        `❌ NaN detected in ${stepName} at cell (${cell.x}, ${cell.y}): ${key} = ${val}`
                    );
                    console.table(cell);
                    }
                }
            }
        if (!errorFound) {
            console.log(`✅ Succesful: ${stepName}.`);}
        return false;
    }
}
