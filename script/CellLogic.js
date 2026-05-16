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

// 2. Migrációs szándékok összegyűjtése és súlyozása
    let totalMigrationDesire = 0;
    const migrationTargets = [];

    for (const neighbor of cell.neighbors) {
        if (neighbor.terrain === "WATER") continue;
        
        const wellnessDiff = cell.wellness - neighbor.wellness;
        
        // Csak akkor vándorolnak ki, ha a szomszéd jobb hely
        if (wellnessDiff < 0) {
            const attractionScore = Math.abs(wellnessDiff); // Minél jobb a szomszéd, annál vonzóbb
            migrationTargets.push({ neighbor, attractionScore });
            totalMigrationDesire += attractionScore;
        }
    }

    // Ha van bárki, aki elvágyódik
    if (totalMigrationDesire > 0 && cell.population > 0) {
        // Kiszámoljuk a GLOBÁLIS kivándorlási rátát erre a körre
        // Például a maximum elvándorlási ráta CONFIG.MIGRATION_RATE (pl. 0.4, azaz max 40%)
        const averageWellnessDiff = totalMigrationDesire / cell.neighbors.length;
        const globalMigrationRatio = CONFIG.MIGRATION_RATE * averageWellnessDiff / 100;
        
        // Meghatározzuk a cellát elhagyó emberek TÉNYLEGES maximális számát
        const totalEmigrants = Math.min(cell.population, Math.round(cell.population * globalMigrationRatio));
        
        let actualEmigrantsDistributed = 0;

        // Szétosztjuk az emigránsokat a célpontok között a vonzerő (attractionScore) arányában
        for (const target of migrationTargets) {
            const share = target.attractionScore / totalMigrationDesire;
            // Az utolsó elemnél a kerekítési hibák elkerülésére a maradékot adjuk oda
            const amount = target === migrationTargets[migrationTargets.length - 1] 
                ? (totalEmigrants - actualEmigrantsDistributed)
                : Math.round(totalEmigrants * share);

            if (amount > 0) {
                cell.netMigration -= amount; // A saját csökkenés (World-ben adódik hozzá)
                target.neighbor.netMigration += amount; // A szomszéd növekedése
                
                // Forgalmi adatok frissítése
                cell.totalTraffic += amount;
                target.neighbor.totalTraffic += amount;

                actualEmigrantsDistributed += amount;
            }
        }
    }
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
    if (!cell.population || cell.population <= 0) return 0;
    
    let localTraded = 0;

    // Minden erőforrást külön-külön értékelünk ki a szomszédokkal
    for (const resource of ["FOOD", "WOOD", "STONE", "LUXURY_GOODS"]) {
        if (cell.need[resource] <= 0) continue; // Ha nincs szükség rá, kihagyjuk
        const cellPrice = calculatePrice(cell, resource, "CellPrice");
        const buyFrom = [];
        let totalAttraction = 0;
        for (const neighbor of cell.neighbors) {
            if (!neighbor.population || neighbor.population <= 0) continue;

            // 1. Lokális árak lekérése az aktuális fizikai készlet alapján
            const priceNeighbor = calculatePrice(neighbor, resource, "NeighborPrice");

            // 2. Szállítási veszteségi ráta számítása az utak állapota alapján
            // roadQuality 50 és 100 között mozog. Átlagolunk, majd skálázunk.
            const avgRoadQuality = (cell.roadQuality + neighbor.roadQuality) / 2;
            
            // Ha az út 100-as (MAX), a veszteség 0. Ha 50-es (MIN), a veszteség a ROAD_TRANSPORT_COST_FACTOR maximuma.
            const roadDeficitRatio = (CONFIG.ROAD_MAX_QUALITY - avgRoadQuality) / (CONFIG.ROAD_MAX_QUALITY - CONFIG.ROAD_MIN_QUALITY);
            const transportLossRate = roadDeficitRatio * CONFIG.ROAD_TRANSPORT_COST_FACTOR;

            // 3. Végső ár/db:
            const finalPriceCell = priceNeighbor / (1 - transportLossRate);

            // 4. Vonzerő (minél olcsóbb, annál vonzóbb) és maximum számítása, és hozzáadás, ha megfelelő
            if (finalPriceCell < cellPrice) {
                const attraction = (cellPrice - finalPriceCell) ** CONFIG.TRADE_ATTRACTION_EXPONENT;
                const maxAmount = Math.min(neighbor.inventory[resource], Math.floor(cell.need[resource] / (1 - transportLossRate)));
                buyFrom.push({ neighbor, attraction, maxAmount, price: finalPriceCell, transportLossRate });
                totalAttraction += attraction;
            }
        }

        //5. Szükséglet beszerzése a vonzerő arányában
        for (const offer of buyFrom) {
            const share = offer.attraction / totalAttraction;
            const desiredAmount = Math.min(offer.maxAmount, Math.round(cell.need[resource] * share / (1 - offer.transportLossRate)));
            const price = offer.price;
            if (desiredAmount > 0) {
                send(offer.neighbor, resource, desiredAmount, cell, offer.transportLossRate);
                send(cell, "GOLD", desiredAmount * price, offer.neighbor); // Arany küldése visszafelé
                localTraded += desiredAmount;
            }
        }
        // TODO: Hiány miatt meg nem vett összegek pótlása
    }
    return localTraded;
}

export function refreshInventory(cell) {
    for (let res of ["GOLD", "FOOD", "WOOD", "STONE", "LUXURY_GOODS"]) {
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

export function send(senderCell, resource, amount, targetCell, lossRate = 0) {
    if (isNaN(amount) || amount <= 0 || !isFinite(amount)) {
        return;
    }

    // Biztonsági korrekció, hogy ne vonjunk le többet, mint ami létezik
    if (amount > senderCell.inventory[resource]) {
        amount = senderCell.inventory[resource];
        console.log(`Adjusted send amount to available inventory: ${amount} for resource ${resource} 
            from cell (${senderCell.x}, ${senderCell.y}) to cell (${targetCell.x}, ${targetCell.y}).`);
    }

    const lostAmount = amount * lossRate;
    const deliveredAmount = amount - lostAmount;

    // Az eladótól/küldőtől levonjuk a teljes feladott mennyiséget
    senderCell.inventory[resource] -= amount;
    
    // A célobjektum a veszteséggel csökkentett értéket kapja meg virtuálisan
    targetCell.bought[resource] += deliveredAmount;

    // Logisztikai statisztika (forgalom) növelése a fizikai mozgás alapján
    senderCell.totalTraffic += amount;
    targetCell.totalTraffic += deliveredAmount;
}

export function calculatePrice(cell, res, loc="idk") {
    // TODO: bought létjogosultságának felülvizsgálata
    let price = (cell.need[res] + 0.01) / (cell.inventory[res] + (cell.bought[res] / 2) + 0.01);
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
