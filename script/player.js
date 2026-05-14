// player.js
// A "Király" osztály, amely a játékos interakcióit kezeli.
// TODO: Bővítés, és felülvisgálás = szinte teljes átdolgozás.

import { CONFIG } from './config.js';

export class Player {
    constructor(world) {
        this.world = world;
        this.gold = CONFIG.STARTING_PLAYER_GOLD;
        this.selectedCell = null;
    }

    // A cella kiválasztása most a HTML elem attribútumai alapján történik
    selectCellByElement(tdElement) {
        const x = parseInt(tdElement.getAttribute('data-x'), 10);
        const y = parseInt(tdElement.getAttribute('data-y'), 10);
        this.selectedCell = this.world.getCell(x, y);
    }

    foundVillage() {
        if (!this.selectedCell || this.selectedCell.isVillage) return;
        
        const cost = CONFIG.VILLAGE_FOUND_COST;
        this.selectedCell.isVillage = true;
        this.selectedCell.villageLevel = +1;
        console.log(`Falu alapítva/fejlesztve: (${this.selectedCell.x}, ${this.selectedCell.y})`);
    }
    
    donate(resource, amount) {
        if (!this.selectedCell || amount <= 0) return;
        
        if (resource === 'GOLD') {
            this.selectedCell.inventory.GOLD += amount;
        } else if (resource === 'FOOD') {
            this.selectedCell.inventory.FOOD += amount;
        } else if (resource === 'LUXURY_GOODS') {
            this.selectedCell.inventory.LUXURY_GOODS += amount;
        } else {
            this.selectedCell.inventory[resource] += amount
        }
    }

    // ÚJ: Út fejlesztése adománnyal
    donateToRoad(goldAmount) {
        if (!this.selectedCell || goldAmount <= 0) return;
        if (this.selectedCell.terrain === "WATER") return; // Vízbe nem építünk

        if (this.gold >= goldAmount) {
            // Kiszámoljuk, mennyi minőségpontot "vett" a játékos
            const qualityPoints = goldAmount / CONFIG.ROAD_IMPROVEMENT_COST_PER_POINT;
            
            //this.gold -= goldAmount;
            this.selectedCell.improveRoad(qualityPoints); // Meghívjuk a cella függvényét
            
            console.log(`Út fejlesztve ${qualityPoints.toFixed(1)} ponttal a cellán: (${this.selectedCell.x}, ${this.selectedCell.y})`);
        }
    }
}