// cell.js
// A szimuláció lelke. Minden cella egy önálló gazdasági és társadalmi egység.
// A metódusok a tényleges logikát a CellLogic.js-re delegálják.

import { CONFIG } from './config.js';
import * as Logic from './CellLogic.js'; // Importáljuk a teljes logikai modult

export class Cell {
    constructor(x, y, terrain, vegetation) {
        this.x = x;
        this.y = y;
        this.terrain = terrain;
        this.vegetation = vegetation;
        
        // Népesség a készleteknél (víz miatt lehet 0)
        this.netMigration = 0;

        // Beépítettség (ÚJ)
        this.builtUpLevel = 0; // Kezdeti beépítettség
        this.wantsToUpgradeBuiltUp = 0; // Szándék a fejlesztésre (Economic fázisban dől el)

        // Készletek
        if (this.terrain !== "WATER") {
            this.population = Math.random() < 0.05 ? Math.floor(Math.random() * 15) + 1 : 0;
            this.inventory = {
                FOOD: 100,
                WOOD: 20,
                STONE: 20,
                GOLD: 100,
                LUXURY_GOODS: 10
            };
            this.wellness = CONFIG.BASE_WELLNESS;
        }
        else { 
            this.population = 0;
            this.wellness = 0;
            this.inventory = {
                FOOD: 0,
                WOOD: 0,
                STONE: 0,
                GOLD: 0,
                LUXURY_GOODS: 0
            };
        };
        this.deathsThisTick = 0;
        this.deaths = 0;

        
        // Kereskedelmi kapcsolatok (szomszédok) és utak
        this.neighbors = [];
        this.totalTraffic = 0; // Forgalmi adat
        this.roadQuality = CONFIG.ROAD_MIN_QUALITY; // Útminőség
        this.offers = {};
        this.need = {
            FOOD: 0,
            WOOD: 0,
            STONE: 0,
            GOLD: 0,
            LUXURY_GOODS: 0
        };
        this.bought = {
            FOOD: 0,
            WOOD: 0,
            STONE: 0,
            GOLD: 0,
            LUXURY_GOODS: 0
        };

        // Falu Státusz
        this.isVillage = false;
        this.villageLevel = 0;
        
        // Fogyasztási és Termelési Statisztikák
        this.lastConsumption = { GOLD: 0, FOOD: 0, WOOD: 0, STONE: 0, LUXURY_GOODS: 0 };
        this.lastProduced = { GOLD: 0, FOOD: 0, WOOD: 0, STONE: 0, LUXURY_GOODS: 0 };
        this.lastChange = { FOOD: 0, GOLD: 0, WOOD: 0, STONE: 0, LUXURY_GOODS: 0 };

        this.maxStorage = 0;
        this.planToBuild = 0; // Tervezett beépítettség fejlesztés (Economic fázisban dől el)
    }

    // --- 1. LÉPÉS: NÉPESSÉG ÉS JÓLÉT (DELEGÁLÁS) ---

    updateWellness() {
        Logic.updateWellness(this);
    }

    updatePopulation() {
        Logic.updatePopulation(this);
    }

    // --- 2. LÉPÉS: TERMELÉS (DELEGÁLÁS) ---

    produce() {
        Logic.produce(this);
    }

    // --- 3. LÉPÉS: GAZDASÁGI DÖNTÉSEK (KERESLET/KÍNÁLAT) (DELEGÁLÁS) ---

    calculateEconomicDecisions() {
        Logic.calculateEconomicDecisions(this);
    }

    // --- 4. LÉPÉS: KERESKEDELEM (DELEGÁLÁS) ---
    // TODO: Refreshinventory stb bef.
    
    DoTrades() {
        // return a kereskedett mennyiség (stat a worldnek)
        return Logic.DoTrades(this);
    }

    refreshInventory() {
        Logic.refreshInventory(this);
    }

    // --- 5. LÉPÉS: FOGYASZTÁS (DELEGÁLÁS) ---

    consume() {
        Logic.consume(this);
    }

    // --- 6. LÉPÉS: UTAK FRISSÍTÉSE (ÚJ) (DELEGÁLÁS) ---
    
    updateRoadQuality() {
        Logic.updateRoadQuality(this);
    }

    // --- 7. LÉPÉS: FEJLESZTÉSEK VÉGREHAJTÁSA (BEÉPÍTETTSÉG) (DELEGÁLÁS) ---
    executeUpgrades() {
        Logic.executeUpgrades(this);
    }

    // --- SEGÉDFÜGGVÉNYEK (DELEGÁLÁS) ---

    maxStorage() {
        return Logic.maxStorage(this);
    }

    getBudgetRatio() {
        return Logic.getBudgetRatio(this);
    }

    getAvgNeighborWellness() {
        return Logic.getAvgNeighborWellness(this);
    }

    calculatePrice(res) {
        return Logic.calculatePrice(this, res);
    }

    // Út javítása (játékos akció) (ÚJ)
    improveRoad(qualityPoints) {
        Logic.improveRoad(this, qualityPoints);
    }

    // Nyersanyag átutalása:
    send(resource, amount, targetCell) {
        Logic.send(this, resource, amount, targetCell);
    }

    calculateOffer(resource) {
        Logic.calculateOffer(this, resource)
    }
}