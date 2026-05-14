// config.js
// Ebben a fájlban tároljuk a szimuláció összes "mágikus számát"
// a könnyebb hangolhatóság érdekében.

export const CONFIG = {
    // --- VILÁG GENERÁLÁS ÉS RENDSZER BEÁLLÍTÁSOK ---

    // ---DEBUG---
    SRCH_NAN: false,

    // Rács és Cella méretek
    GRID_WIDTH: 46,      // Cellák száma széltében
    GRID_HEIGHT: 48,     // Cellák száma magasságban
    CELL_SIZE: 18,       // Egy cella mérete pixelben

    // Felszín és Növényzet típusok
    TERRAIN_TYPES: ["WATER", "PLAINS", "HILLS", "MOUNTAIN"], // A sorrend fontos!
    VEGETATION_TYPES: ["NONE", "FIELD", "FOREST", "WASTELAND", "SUPERFOREST"],
    
    // Perlin-zaj beállítások
    NOISE_SETTINGS: {
        TERRAIN_SCALE: 0.09,  // A zaj "nagyítása" (alacsonyabb érték = nagyobb formák)
        TERRAIN_THRESHOLD: { // Magassági küszöbök (0 és 1 között)
            WATER: 0.35,     // 0.0 - 0.35: Víz (legalacsonyabb)
            PLAINS: 0.55,    // 0.35 - 0.55: Síkság
            HILLS: 0.75,     // 0.55 - 0.75: Domb
            MOUNTAIN: 1.0,   // 0.75 - 1.0: Hegység (legmagasabb) (fix 1.0)
        },
        VEGETATION_SCALE: 0.2, // Kisebb formák, mint a felszínen
        VEGETATION_THRESHOLD: {
            WATER:      {WASTELAND: 1.0, FIELD: 1.0, FOREST: 1.0, SUPERFOREST: 1.0},
            PLAINS:     {WASTELAND: 0.18, FIELD: 0.58, FOREST: 0.75, SUPERFOREST: 1.0},
            HILLS:      {WASTELAND: 0.25, FIELD: 0.54, FOREST: 0.75, SUPERFOREST: 1.0},
            MOUNTAIN:   {WASTELAND: 0.8, FIELD: 1.0, FOREST: 1.0, SUPERFOREST: 1.0}
        },
    },

    // --- SZIMULÁCIÓS ÉS PLAYER BEÁLLÍTÁSOK ---

    // Nyersanyag típusok
    RESUORCE_LVL: {
        FOOD: 0,
        WOOD: 0,
        STONE: 0,
        LUXURY_GOODS: 1,
        GOLD: 2,
    },

    // Szimulációs sebesség
    SIM_TICK_MS: 800 ,   // Egy szimulációs kör hossza (ms)

    // Játékos
    STARTING_PLAYER_GOLD: 10000,
    VILLAGE_FOUND_COST: 1000,

    // --- NÉPESSÉG JOLLÓT TERMELÉS FOGYASZTÁS KERESKEDELEM---
    
    // Népesség és Jólét
    BASE_WELLNESS: 100,  // Alap jólét 
    MAX_WELLNESS: 200,   // Maximális jólét
    WELLNESS_WEIGHT: {      // FONTOS! az összege nem lehet 0!
        FOOD : 0.7,
        LUXURIES: 0.5,
        NEIGHBORS: 0.3,
        POPULATION: 0.4,
        PRIVLIGE: 0.8,
        PREVIOUS: 1.0
    },
    BASE_GROWTH_RATE: 0.1,  // Alap szaporodási ráta (5%)
    MIGRATION_RATE: 0.4,     // Migrációs ráta (jólét-különbség alapján) ha ott 100 %ponttal jobb az élet, akkor ekkora hányad költözik
    POPULATION_PER_VILLAGE_LEVEL: 100, // Max pop / faluszint


    LUXURY_THRESHOLD: 2.5, // Hányszoros raktárkészletnél kezdődik a kényelmi fogyasztás
    STARVING_RATIO:0.51, // Az emberek ekkora hányada hal meg azonnal, ha nem eszik.
    // Fogyasztás (Népességenként és körönként)
    CONSUMPTION: {
        FOOD_PER_POP: 0.4,    // Alap élelemigény
        LUXURIES_PER_POP: 0.6,    // Alap luxuscikk igény
    },

    // Termelés (Népességenként és körönként)
    DIMINISHING_RETURN_EXPONENT: 0.8, // Hatványkitevő az elsődleges anyagtermelésnél
    SECONDARY_RESOURCE_RETURN_EXPONENT: 1.5, // Hatványkitevő a másodlagos anyagtermelésnél
    PRODUCTION: {
        FOOD: {
            PLAINS: 0.6,
            HILLS: 0.3,
            MOUNTAIN: 0.1,
            // WATER: 0.2, // Halászat, de jelneleg a víz-területek nincsenek rendesen kezelve.
        },
        WOOD: {
            SUPERFOREST: 0.8,
            FOREST: 0.45,
            FIELD: 0.1,
            WASTELAND: 0.1,
        },
        STONE: {
            MOUNTAIN: 0.7,
            HILLS: 0.3,
            PLAINS: 0,
        },
        LUXURY_GOODS: 0.3
    },

    // Kereskedelem
    BASE_PRICE: 10,
    SELLER_PRICE_MULTIPLIER: 1, // Eladási ár szorzó
    BASIC_SAFETY_FOOD_RATIO: 1.8, // Alap biztonsági készlet (a fogyasztás * szerese)
    BASIC_SAFETY_LUXURIES_RATIO: 1.2,
    BUY_AMOUNT_MULTIPLIER: 1,   // a kereskedett árumennyiség 1 arany eltérés esetén

    BASE_GOLD_PER_POP: 15, // Ennyi aranyt éreznek normális tartaléknak az emberek


    // --- BEÉPÍTETTSÉG RENDSZER ---

    // kapacitás
    BASIC_POP_CAP: 10,
    BUILTUP:{
        POP_CAP_PER_LEVEL: 9,       // Népességkapacitás / szint
        
        // Túlzsúfoltsági büntetés (Wellness) popRatio = szorzó * (túlnép ^ kitevő)
        OVERPOPULATION_PENALTY_BASE: 0.1, // Jólét csökkenés (szorzó)
        OVERPOPULATION_PENALTY_EXPONENT: 1.35, // (kitevő)
        
        // Karbantartás (Consume fázis)
        MAINTENANCE_WOOD_PER_LEVEL: 0.05, // Fa karbantartás / szint / kör
        MAINTENANCE_STONE_PER_LEVEL: 0.1, // Kő karbantartás / szint / kör
        DECAY_RATE: 0.4,                  // Ekkora hányada romlik le a karban nem tartott résznek.

        // Fejlesztés (Economic Decision + Consume fázis)
        UPGRADE_COST_WOOD_BASE: 30,    // Fejlesztés (1. szint) Fa költség
        UPGRADE_COST_STONE_BASE: 50,  // Fejlesztés (1. szint) Kő költség
        UPGRADE_COST_EXPONENT: 1.2,   // Fejlesztési költség emelkedése szintenként (HATVÁNYKITEVŐ)
        
        // Fejlesztési sebesség és szándék
        UPGRADE_MULTIPLE: 0.4, // A hajléktalanok ekkora hányadát szállásolják el egy körben
    },

    // --- ÚT RENDSZER ---
    ROAD_MIN_QUALITY: 50, // Minimális útminőség
    ROAD_MAX_QUALITY: 100, // Maximális útminőség
    ROAD_BASE_DECAY: 0.02,  // Mennyit romlik körönként (fix érték)
    ROAD_TRAFFIC_TO_QUALITY_FACTOR: 0.01, // Mennyire javítja a forgalom (forgalom * factor)
    ROAD_IMPROVEMENT_COST_PER_POINT: 8, // Mennyi aranyba kerül 1 minőségpont
    ROAD_TERRAIN_MAINTENANCE_MODIFIER: { // Mennyivel nehezebb fenntartani (szorzó a romláson)
        WATER: 0,
        PLAINS: 1.0,
        HILLS: 1.5,
        MOUNTAIN: 2.5,
        DEFAULT: 1.0
    },
    // TODO: Kezdeni valamit a szállítási költség felvételével, ezt meg növelni.
    ROAD_TRANSPORT_COST_FACTOR: 0, // Szorzó a szállítási költséghez az útminőség függvényében


    // --- Megjelenítés Színei ---
    COLORS: {
        TERRAIN: {
            PLAINS: "#5a8a44",
            HILLS: "#8a6e44",
            MOUNTAIN: "#6b6b6b",
            WATER: "#446e8a",
        },
        VEGETATION: {
            SUPERFOREST: "rgb(22, 66, 11)",
            FOREST: "rgba(34, 87, 21, 0.8)", // Sötétzöld áttetsző
            FIELD: "rgba(218, 215, 61, 0.3)", // Sárgás áttetsző
            WASTELAND: "rgba(139, 107, 76, 0.77)", // Barnás áttetsző
        },
        VILLAGE: "#FFFFFF", // Fehér
        SELECTED: "#FF0000", // Piros
        PATH_LOW: "rgba(139, 69, 19, 0.3)", // Ösvény (barna)
        PATH_HIGH: "rgba(80, 80, 80, 0.8)", // Út (szürke)
    }
};