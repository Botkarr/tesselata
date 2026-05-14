// cellLogic.js
// Tartalmazza a cella gazdasági és társadalmi logikáját, 
// független függvények formájában, amelyek a Cell objektumon dolgoznak.
import { CONFIG } from './config.js';


// --- 4. LÉPÉS: NÉPESSÉG ÉS JÓLÉT ---
export function updateWellness(cell) {
    // 1. Saját jólét számítása a fogyasztás alapján
    if (cell.population <= 0) {
        cell.wellness = CONFIG.BASE_WELLNESS;
        return;
    }

    // 1. Boldogság a fogyasztás alapján kaja, és luxuscikk
    const baseFoodNeed = cell.population * CONFIG.CONSUMPTION.FOOD_PER_POP;
    const baseLuxuriesNeed = cell.population * CONFIG.CONSUMPTION.LUXURIES_PER_POP;
    const foodWellnessRatio = Math.min(1.5, cell.lastConsumption.FOOD / baseFoodNeed);
    const luxuriesWellnessRatio = Math.min(1.5, cell.lastConsumption.LUXURY_GOODS / baseLuxuriesNeed);


    // 2. Boldogság a kiváltság alapján
    const privligeRatio = 1 + (cell.isVillage ? (cell.villageLevel * 1) : 0);


    // 3. Beépítettségi (Túlzsúfoltsági) Büntetés
    const popCapacity = cell.builtUpLevel * CONFIG.BUILTUP.POP_CAP_PER_LEVEL + CONFIG.BASIC_POP_CAP;
    let difference = Math.min(cell.population / popCapacity, 2);

    let popRatio_ = CONFIG.BUILTUP.OVERPOPULATION_PENALTY_BASE * (2- difference) ** CONFIG.BUILTUP.OVERPOPULATION_PENALTY_EXPONENT;

    const popRatio = Math.min(1.0, Math.max(0.01, popRatio_));
    

    // 4. Szomszédok jólétének hatása
    const avgNeighborWellnessRatio = cell.getAvgNeighborWellness() / CONFIG.BASE_WELLNESS;


    // 5. Előző kör jólétének hatása
    const previousWellnessRatio = cell.wellness / CONFIG.BASE_WELLNESS;


    // Végső jólét számítása a súlyozott geometriai közép alapján
    const wellness_multipled = (foodWellnessRatio ** CONFIG.WELLNESS_WEIGHT.FOOD *
                    luxuriesWellnessRatio ** CONFIG.WELLNESS_WEIGHT.LUXURIES *
                    avgNeighborWellnessRatio ** CONFIG.WELLNESS_WEIGHT.NEIGHBORS *
                    privligeRatio ** CONFIG.WELLNESS_WEIGHT.PRIVLIGE *
                    popRatio ** CONFIG.WELLNESS_WEIGHT.POPULATION * 
                    previousWellnessRatio ** CONFIG.WELLNESS_WEIGHT.PREVIOUS);
    if (wellness_multipled <= 0) {
        console.log(` - Cell (${cell.x}, ${cell.y}) wellness multiplier is non-positive: ${wellness_multipled}. Set to 0.`);
        cell.wellness = 1;
        return;}
    cell.wellness = CONFIG.BASE_WELLNESS * wellness_multipled ** 
    (1 / (CONFIG.WELLNESS_WEIGHT.FOOD + CONFIG.WELLNESS_WEIGHT.LUXURIES + CONFIG.WELLNESS_WEIGHT.NEIGHBORS + CONFIG.WELLNESS_WEIGHT.PRIVLIGE + CONFIG.WELLNESS_WEIGHT.POPULATION + CONFIG.WELLNESS_WEIGHT.PREVIOUS));
    cell.wellness = Math.max(1, Math.min(cell.wellness, 200));  // Jólét korlátok

    if (CONFIG.SRCH_NAN) {
        if (isNaN(cell.wellness)) {
            console.log(` - Cell (${cell.x}, ${cell.y}) final wellness is invalid: ${cell.wellness}. Set to 1.`);
            cell.wellness = 1;
        }

        const check_ = foodWellnessRatio * luxuriesWellnessRatio;
        if (isNaN(check_) || check_ <= 0) {
            console.log(` - Cell (${cell.x}, ${cell.y}) foodRatio * luxuriesRatio is invalid: ${check_}. Set to 0.`);
            cell.wellness = 1;
            return;
        }

        if (isNaN(privligeRatio) || privligeRatio <= 0) {
            console.log(` - Cell (${cell.x}, ${cell.y}) privligeRatio is invalid: ${privligeRatio}. Set to 0.`);
            cell.wellness = 1;
            return;
        }

        if (isNaN(popRatio) || popRatio <= 0) {
            console.log(` - Cell (${cell.x}, ${cell.y}) popRatio is invalid: ${popRatio}. Set to 0.1 .`);
            cell.wellness = 1;
        }

        if (isNaN(avgNeighborWellnessRatio) || avgNeighborWellnessRatio <= 0) {
            console.log(` - Cell (${cell.x}, ${cell.y}) avgNeighborWellnessRatio is invalid: ${avgNeighborWellnessRatio}. Set to 0.`);
            cell.wellness = 1;
            return;
        }

        if (isNaN(previousWellnessRatio) || previousWellnessRatio <= 0) {
            console.log(` - Cell (${cell.x}, ${cell.y}) previousWellnessRatio is invalid: ${previousWellnessRatio}. Set to 0.`);
            cell.wellness = 1;
            return;
        }
    }
}

export function updatePopulation(cell) {
    if (cell.population <= 0) {
        cell.population = 0;
        return;
    }

    // 1. Belső növekedés (szaporulat)
    const growthFactor = (cell.wellness - 100) / 100;
    const internalGrowth = Math.round(cell.population * CONFIG.BASE_GROWTH_RATE * (1 + growthFactor));

    // 2. Migráció (elvándorlás)
    let netMigration = 0;
    for (const neighbor of cell.neighbors) {
        if (neighbor.terrain === "WATER") {continue}
        const wellnessDiff = cell.wellness - neighbor.wellness;
        
        if (wellnessDiff < 0) { 
            const migrationAmount = Math.round(cell.population * CONFIG.MIGRATION_RATE * (Math.abs(wellnessDiff) / 100));
            netMigration -= migrationAmount;
            // csak a kivándorlás
            neighbor.netMigration += migrationAmount; 

            cell.totalTraffic += Math.abs(migrationAmount);
            neighbor.totalTraffic += Math.abs(migrationAmount);
        } 
    }
    
    cell.population += internalGrowth;
    // A migráció a world-ban kerül hozzáadásra.
    const v = Math.max(netMigration, 0);
    if (cell.population < v) cell.population = v;
    // Megjegyzés: A netMigration kezelése a World szintjén talán tisztább lenne.
}

// --- 1. LÉPÉS: TERMELÉS ÉS FOGYASZTÁS ---
export function produce(cell) {
    if (cell.population <= 0) {
        cell.lastProduced = {
        FOOD: 0,
        WOOD: 0,
        STONE: 0,
        GOLD: 0};
        return;
    }

    // Elsődleges erőforrások termelése
    // A növekedési kitevő (alpha)
    // Hatványfüggvényt alkalmazunk.
    const ALPHA = CONFIG.DIMINISHING_RETURN_EXPONENT; 

    // --- ÉLELEM TERMELÉS ---
    const foodBaseYield = CONFIG.PRODUCTION.FOOD[cell.terrain] || 0;
    const foodProd = foodBaseYield * cell.population ** ALPHA;
    cell.inventory.FOOD += foodProd;

    // --- FA TERMELÉS ---
    const woodBaseYield = CONFIG.PRODUCTION.WOOD[cell.vegetation] || 0;
    const woodProd = woodBaseYield * cell.population ** ALPHA;
    cell.inventory.WOOD += woodProd;


    // --- KŐ TERMELÉS ---
    const stoneBaseYield = CONFIG.PRODUCTION.STONE[cell.terrain] || 0;
    const stoneProd = stoneBaseYield * cell.population ** ALPHA;
    cell.inventory.STONE += stoneProd;

    // másodlagos erőforrások termelése
    const BETA = CONFIG.SECONDARY_RESOURCE_RETURN_EXPONENT;

    // --- LUXUSCIKKEK TERMELÉS ---
    // FEJLESZTHETŐ: mi befolyásolja még?
    const luxuryGoodProd = CONFIG.PRODUCTION.LUXURY_GOODS * cell.population ** BETA; 
    cell.inventory.LUXURY_GOODS += luxuryGoodProd;
    if (isNaN(luxuryGoodProd)) {
        console.error(`Error: Luxury goods production is NaN for cell (${cell.x}, ${cell.y}). Setting to 0.`);
    }

    cell.lastProduced = {
        FOOD: foodProd,
        WOOD: woodProd,
        STONE: stoneProd,
        LUXURY_GOODS: luxuryGoodProd,
        GOLD: 0};
}

export function consume(cell) {
    if (cell.population <= 0) {
        cell.lastConsumption.FOOD = 0;
        cell.lastConsumption.LUXURY_GOODS = 0;
        return;
    }

    const baseFoodNeed = cell.population * CONFIG.CONSUMPTION.FOOD_PER_POP;
    const baseLuxuriesNeed = cell.population * CONFIG.CONSUMPTION.LUXURIES_PER_POP;

    const luxuryFoodNeed = (cell.inventory.FOOD > baseFoodNeed * CONFIG.LUXURY_THRESHOLD) ? baseFoodNeed * 0.5 : 0;
    const luxuryLuxuriesNeed = (cell.inventory.LUXURY_GOODS > baseLuxuriesNeed * CONFIG.LUXURY_THRESHOLD) ? baseLuxuriesNeed * 3 : 0;
    
    const totalFoodNeed = baseFoodNeed + luxuryFoodNeed;
    const totalLuxuriesNeed = baseLuxuriesNeed + luxuryLuxuriesNeed;

    if (cell.inventory.FOOD < baseFoodNeed) {
        const deficit = baseFoodNeed - cell.inventory.FOOD;
        const deaths = Math.min(Math.round(deficit / CONFIG.CONSUMPTION.FOOD_PER_POP * CONFIG.STARVING_RATIO), cell.population);
        cell.population -= deaths;
        cell.deathsThisTick = deaths;
        cell.deaths += deaths;
        if (cell.population < 0) {
            cell.population = 0;
            console.log(`Cell (${cell.x}, ${cell.y}) population dropped below 0 due to food shortage. Reset to 0.`);
        }
    }

    const consumedFood = Math.min(cell.inventory.FOOD, totalFoodNeed);
    const consumedLuxuries = Math.min(cell.inventory.LUXURY_GOODS, totalLuxuriesNeed);

    if (isNaN(consumedFood) || isNaN(consumedLuxuries)) {
        console.log(` - Cell (${cell.x}, ${cell.y}) consumption NaN detected. Food: ${consumedFood}, Gold: ${consumedLuxuries}. Setting to 0.`);
        cell.lastConsumption.FOOD = 0;
        cell.lastConsumption.LUXURY_GOODS = 0;
    }
    cell.inventory.FOOD -= consumedFood;
    cell.inventory.LUXURY_GOODS -= consumedLuxuries;

    cell.lastConsumption.FOOD = consumedFood;
    cell.lastConsumption.LUXURY_GOODS = consumedLuxuries;
}

// --- 3. LÉPÉS: GAZDASÁGI DÖNTÉSEK (KERESLET/KÍNÁLAT) ---
export function calculateEconomicDecisions(cell) {
    if (cell.population <= 0) return;

    // Döntés az építkezésekről (BuiltUp)
    const homeless = cell.population - (cell.builtUpLevel * CONFIG.BUILTUP.POP_CAP_PER_LEVEL);
    const homeDeficit = Math.max(0, homeless) / CONFIG.BUILTUP.POP_CAP_PER_LEVEL;
    let planToBuild = homeDeficit + (canUpgradeBuiltUp(cell) + 1);
    planToBuild *= CONFIG.BUILTUP.UPGRADE_MULTIPLE;
    planToBuild = Math.floor(planToBuild);
    planToBuild = Math.max(0, planToBuild);
    cell.planToBuild = planToBuild;

    // Ajánlatok kiszámítása minden erőforrásra
    cell.tradeOffers = {}; // Inicializáljuk az ajánlatokat
    cell.need = {FOOD: 0, WOOD: 0, STONE: 0, LUXURY_GOODS: 0};
    cell.bought = {FOOD: 0, WOOD: 0, STONE: 0, LUXURY_GOODS: 0};

    const cost = getAllUpgradesCost(cell.builtUpLevel, cell.builtUpLevel + planToBuild);
    cell.need.STONE += cost.stone;
    cell.need.WOOD += cost.wood;
    cell.need.FOOD += cell.population * CONFIG.CONSUMPTION.FOOD_PER_POP * CONFIG.BASIC_SAFETY_FOOD_RATIO;
    cell.need.LUXURY_GOODS += cell.population * CONFIG.CONSUMPTION.LUXURIES_PER_POP * CONFIG.BASIC_SAFETY_LUXURIES_RATIO;
}

// --- 3. LÉPÉS: KERESKEDELEM ---
export function DoTrades(cell) {
    //TODO: tőzsdeszerű optimalizálás. (kereslet kínálat áttekinthető megvalósítása.)

    if (!cell.population) return 0; // Biztonsági ellenőrzés
    let traded = 0
    for (const neighbor of cell.neighbors) {
        if (!neighbor.population) {continue;} // Biztonsági ellenőrzés
        // csak egyszer számolva minden szomszédságot:
        if (neighbor.x < cell.x || neighbor.y < cell.y) {continue;}

        // Iterálás az összes erőforráson
        for (const resource of ["FOOD", "WOOD", "STONE", "LUXURY_GOODS"]) {
            const s_price = calculatePrice(cell, resource, "DT-1" + resource)
            const n_price = calculatePrice(neighbor, resource, "DT-2" + resource);

            // ÚT MINŐSÉG SZÁMÍTÁSA
            // console.log('cell.roadQuality:', cell.roadQuality, ' neighbor.roadQuality:', neighbor.roadQuality);
            const qualityFactor = (cell.roadQuality + neighbor.roadQuality) / 200; // skálázás 0-1 közé
            const connectionQuality = 1.0 - qualityFactor;
            const transPrice = connectionQuality * CONFIG.ROAD_TRANSPORT_COST_FACTOR;
            // azaz a szállítási költség egy darab árura

            // EGY GYORS ELLENŐRZÉS
            if (CONFIG.SRCH_NAN) {
                if (isNaN(n_price * s_price)) {
                    console.log(` - Trade calculation price NaN detected between cell (${cell.x}, ${cell.y}) and neighbor (${neighbor.x}, ${neighbor.y}) for resource ${resource}.`);
                    continue;
                }
                if (isNaN(transPrice)) {console.log('transPrice NaN in cell: ', cell.x, cell.y); continue;}
            }
            
            // ALKU
            let seller, buyer;
            // Ha így is olcsóbb, veszek.
            if (n_price + transPrice < s_price && neighbor.inventory[resource] > 0) {
                seller = neighbor;
                buyer = cell;
            }
            // Ha így is drágábban veszi, eladok.
            else if (n_price - transPrice > s_price && cell.inventory[resource] > 0) {
                seller = cell;
                buyer = neighbor;
            }
            // Nincs üzlet
            else {
                continue;}

            let priceSeller = calculatePrice(seller, resource, "dt-3");
            let priceBuyer = calculatePrice(buyer, resource, "dt-4");

            // Egységár számítása
            let priceDiff = priceBuyer - priceSeller - transPrice;
            let amount = Math.min(1 + Math.floor(priceDiff * CONFIG.BUY_AMOUNT_MULTIPLIER), seller.inventory[resource]);

            // Végrehajtás
            send(seller, resource, amount, buyer);
            send(buyer, 'GOLD', priceSeller * amount, seller);
            // traffic a send-ben

            traded += amount;
        }
    }
    return traded;
}

export function refreshInventory(cell) {
    for (let res in ["GOLD", "FOOD", "WOOD", "STONE", "LUXURY_GOODS"]) {
        cell.inventory[res] += cell.bought[res];
        cell.bought[res] = 0;
    }
}

// --- 6. LÉPÉS: UTAK FRISSÍTÉSE ---
export function updateRoadQuality(cell) {
    // TODO: víz területmechanika kidolgozása után ezen függvény felülvizsgálata
    const improvement = cell.totalTraffic * CONFIG.ROAD_TRAFFIC_TO_QUALITY_FACTOR;
    
    const terrainMod = CONFIG.ROAD_TERRAIN_MAINTENANCE_MODIFIER[cell.terrain] || CONFIG.ROAD_TERRAIN_MAINTENANCE_MODIFIER['DEFAULT'];
    const decay = CONFIG.ROAD_BASE_DECAY * terrainMod;

    let error_ = false;
    if (isNaN(cell.roadQuality)) { error_ = true; }
    cell.roadQuality += (improvement - decay);
    cell.roadQuality = Math.max(CONFIG.ROAD_MIN_QUALITY, Math.min(cell.roadQuality, CONFIG.ROAD_MAX_QUALITY));
    if (isNaN(cell.roadQuality) && error_) {
        console.log(`Error: Road quality became NaN for cell (${cell.x}, ${cell.y}).`);
    }
}

// --- 7. LÉPÉS: FEJLESZTÉSEK VÉGREHAJTÁSA (BEÉPÍTETTSÉG) ---
export function executeUpgrades(cell) {
    if (cell.planToBuild <= 0) return;
    const maxUpgrades = canUpgradeBuiltUp(cell);
    const upgrades = Math.min(cell.planToBuild, maxUpgrades);
    for (let i = 0; i < upgrades; i++) {
        const { wood: woodCost, stone: stoneCost } = getBuiltUpUpgradeCost(cell.builtUpLevel + 1);
        cell.inventory.WOOD -= woodCost;
        cell.inventory.STONE -= stoneCost;
        cell.builtUpLevel++;
    }
}

// --- 8. LÉPÉS: STATISZTIKÁK FRISSÍTÉSE ---


// --- SEGÉDFÜGGVÉNYEK (a Cell osztályból áthelyezve) ---
export function maxStorage(cell) {
    return cell.population * CONFIG.MAX_STORAGE_PER_POP + (cell.isVillage ? cell.villageLevel * 1000 : 0);
}

export function getBudgetRatio(cell) {
    if (cell.population <= 0) return 1.0;
    return cell.inventory.GOLD / (cell.population * CONFIG.BASE_GOLD_PER_POP);
}

export function getAvgNeighborWellness(cell) {
    if (cell.neighbors.length === 0) return CONFIG.BASE_WELLNESS;
    let totalWellness = 0;
    for (const neighbor of cell.neighbors) {
        totalWellness += neighbor.wellness;
    }
    return totalWellness / cell.neighbors.length;
}

export function improveRoad(cell, qualityPoints) {
    if (cell.terrain === "WATER") return;
    cell.roadQuality += qualityPoints;
    cell.roadQuality = Math.min(cell.roadQuality, CONFIG.ROAD_MAX_QUALITY);
}

export function send(senderCell, resource, amount, targetCell) {
    if (isNaN(amount) || amount <= 0 || !isFinite(amount)) {
        console.log(`Invalid amount to send: ${amount}. cell (${senderCell.x}, ${senderCell.y}) to cell (${targetCell.x}, ${targetCell.y}). Resource: ${resource}`);
        amount = 0;
    }
    senderCell.inventory[resource] -= amount;
    targetCell.bought[resource] += amount;
    senderCell.totalTraffic += amount;
    targetCell.totalTraffic += amount;
}

export function calculatePrice(cell, res, loc) {
    let price = (cell.need[res] + 0.01) / (cell.inventory[res] + cell.bought[res] + 0.01);
    if(!isFinite(price)) {
    price = 1; console.log("invalid price in calculateprice " + loc)
    console.log("inventory: " + cell.inventory[res] + ", need: " + cell.need[res] + ", bought: " + cell.bought[res] + ". res:" + res);
    }
    return price * CONFIG.BASE_PRICE;
}

// --- Belső segédfüggvények ---

function getBuiltUpUpgradeCost(nextLevel) {
    if (nextLevel <= 0) return { wood: 0, stone: 0 };
    
    const woodCost = CONFIG.BUILTUP.UPGRADE_COST_WOOD_BASE * Math.pow(nextLevel, CONFIG.BUILTUP.UPGRADE_COST_EXPONENT);
    const stoneCost = CONFIG.BUILTUP.UPGRADE_COST_STONE_BASE * Math.pow(nextLevel, CONFIG.BUILTUP.UPGRADE_COST_EXPONENT);
    
    return { 
        wood: Math.floor(woodCost), 
        stone: Math.floor(stoneCost) 
    };
}

function getAllUpgradesCost(fromLevel, toLevel) {
    let totalWood = 0;
    let totalStone = 0;
    for (let level = fromLevel + 1; level <= toLevel; level++) {
        const { wood, stone } = getBuiltUpUpgradeCost(level);
        totalWood += wood;
        totalStone += stone;
    }
    return { wood: totalWood, stone: totalStone };
}

function canUpgradeBuiltUp(cell) {
    let max = 0;
    let woodCost = 0;
    let stoneCost = 0;
    while (true) {
        const { wood: woodCost_, stone: stoneCost_ } = getBuiltUpUpgradeCost(cell.builtUpLevel + max + 1);
        woodCost += woodCost_;
        stoneCost += stoneCost_;
        if (cell.inventory.WOOD < woodCost || cell.inventory.STONE < stoneCost) {
            return max;
        }
        max += 1;
    }
}

function checkNumber(value, location, negative = false, zero = true) {
    if (isNaN(value) || (!negative && value < 0) || (!zero && value === 0)) {
        console.log("Error by:" + location + "\n value: " + value)
    }
}
