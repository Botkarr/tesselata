// renderer.js
// HTML táblázat alapú renderelés.

import { CONFIG } from './config.js';

export class Renderer {
    constructor(world) {
        this.world = world;
        this.table = document.getElementById('gameTable');
        this.cellSize = CONFIG.CELL_SIZE;
        this.currentView = 'DEFAULT'; // Alapértelmezett nézet
        
        this.initializeTable();
    }

    initializeTable() {
        this.table.style.width = `${this.world.width * this.cellSize}px`;
        this.table.style.height = `${this.world.height * this.cellSize}px`;

        for (let y = 0; y < this.world.height; y++) {
            const row = this.table.insertRow();
            for (let x = 0; x < this.world.width; x++) {
                const cellData = this.world.grid[x][y];
                const td = row.insertCell();
                
                td.setAttribute('data-x', x);
                td.setAttribute('data-y', y);
                
                td.className = `${cellData.terrain} ${cellData.vegetation}`;
            }
        }
    }

    setView(view) {
        this.currentView = view;
    }

    draw(selectedCell) {
        // dataviewnél max érték megadása
        let maxValue = 1000;
        if (this.currentView === 'POPULATION') {
            maxValue = this.world.getMaxPopulation();}
        else if (this.currentView === 'BUILT_UP') {
            maxValue = this.world.getMaxBuiltUpLevel();} 
        else if (this.currentView === 'WELLNESS') {
            maxValue = CONFIG.MAX_WELLNESS;}
        else if (this.currentView === 'ROAD') {
            maxValue = CONFIG.ROAD_MAX_QUALITY;}

        else if (this.currentView === 'FOOD') {
            maxValue = this.world.getMaxStock('FOOD');}
        else if (this.currentView === 'GOLD') {
            maxValue = this.world.getMaxStock('GOLD');}
        else if (this.currentView === 'WOOD') {
            maxValue = this.world.getMaxStock('WOOD');}
        else if (this.currentView === 'STONE') {
            maxValue = this.world.getMaxStock('STONE');}
        else if (this.currentView === 'LUXURY_GOODS') {
            maxValue = this.world.getMaxStock('LUXURY_GOODS');}
        
        
        for (let x = 0; x < this.world.width; x++) {
            for (let y = 0; y < this.world.height; y++) {
                const cell = this.world.grid[x][y];
                const td = this.table.rows[y].cells[x];
                
                td.classList.remove('selected');
                if (selectedCell && cell.x === selectedCell.x && cell.y === selectedCell.y) {
                    td.classList.add('selected');
                }
                
                this.applyView(td, cell, maxValue);
                this.updateCellVisuals(td, cell);
            }
        }
    }

    applyView(td, cell, maxValue) {
        // TODO: Kijelölések működésének ellenőrzése.
        td.style.backgroundColor = '';
        td.style.opacity = 1.0; 
        td.classList.remove('data-view');
        td.className = ''; 

        
        if (this.currentView === 'DEFAULT') {
            td.className = `${cell.terrain} ${cell.vegetation} ${"LVL" + String(cell.villageLevel)}`;
            return;
        }

        if (this.currentView === 'TERRAIN') {
            td.classList.add(cell.terrain);
            return;
        }

        if (this.currentView === 'VEGETATION') {
            td.classList.add(cell.terrain, cell.vegetation); 
            return;
        }

        td.classList.add('data-view');
        maxValue = Math.min(maxValue, 255); // Ez fölött úgyse látszik
        
        let value = 0;
        if (this.currentView === 'POPULATION') {
            value = cell.population;
        } else if (this.currentView === 'WELLNESS') {
            value = cell.wellness;
        } else if (this.currentView === 'BUILTUP') {
            value = cell.builtUpLevel;
        } else if (this.currentView === 'ROAD') {
            value = cell.roadQuality;
        
        } else if (this.currentView === 'FOOD') {
            value = cell.inventory.FOOD;
        } else if (this.currentView === 'GOLD') {
            value = cell.inventory.GOLD;
        } else if (this.currentView === 'WOOD') {
            value = cell.inventory.WOOD;
        } else if (this.currentView === 'STONE') {
            value = cell.inventory.STONE;
        } else if (this.currentView === 'LUXURY_GOODS') {
            value = cell.inventory.LUXURY_GOODS;
        }
        // {var} maxValue = 1000; // Alapértelmezett max érték, beállítva a draw() függvényben
        const ratio = Math.min(1, Math.max(0, value / maxValue));
        
        const base = Math.floor(ratio * 255);
        let r = base;
        let g = base;
        let b = base;

        if (this.currentView === 'POPULATION') {
            r = Math.min(255, base + 20); 
            g = Math.min(255, base + 10); 
        } else if (this.currentView === 'WELLNESS') {
            g = Math.min(255, base + 40); 
        } else if (this.currentView === 'BUILTUP') {
            r = Math.min(255, base + 10); 
            g = Math.min(255, base + 30);
        } else if (this.currentView === 'ROAD') {
            r = Math.min(255, base + 50); // Barnás-vöröses
            g = Math.min(255, base + 10);
            b = Math.max(0, base - 20);
        } else if (this.currentView === 'FOOD') {
            r = Math.min(255, base + 40);
            b = Math.max(0, base - 10);
        } else if (this.currentView === 'GOLD') {
            r = Math.min(255, base + 50); 
            g = Math.min(255, base + 50);
            b = Math.max(0, base - 50); 
        } else if (this.currentView === 'WOOD') {
            g = Math.min(255, base + 40); 
            b = Math.max(0, base - 20); 
        } else if (this.currentView === 'STONE') {
            r = Math.max(0, base - 20); 
            g = Math.max(0, base - 10); 
        } else if (this.currentView === 'LUXURY_GOODS') {
            r = Math.min(255, base - 30); 
            b = Math.min(255, base + 30); 
        }
        
        td.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    updateCellVisuals(td, cell) {
        let villageMarker = td.querySelector('.village');
        if (cell.isVillage && !villageMarker) {
            villageMarker = document.createElement('span');
            villageMarker.className = 'village';
            td.appendChild(villageMarker);
        } else if (!cell.isVillage && villageMarker) {
            td.removeChild(villageMarker);
        }
    }

    // UI Panel frissítése (Módosítva)
    updateUI(cell, player) {
        const infoDiv = document.getElementById('cell-info');
        // const playerGoldSpan = document.getElementById('player-gold'); // Ez okozott hibát
        const foundButton = document.getElementById('btn-found-village');
        const improveRoadButton = document.getElementById('btn-improve-road');

        if (!infoDiv || !foundButton || !improveRoadButton) {   // || !playerGoldSpan) eltávolítva
            console.error("Renderer.updateUI hiba: Hiányzik valamelyik DOM elem az UI-ban.");
            return;
        }

        if (!cell) {
            infoDiv.innerHTML = "<p>Válassz egy cellát a térképen.</p>";
            foundButton.disabled = true;
            improveRoadButton.disabled = true;
            return;
        }

        infoDiv.innerHTML = `
            <p>Pozíció: (${cell.x}, ${cell.y})</p>
            <p>Felszín: <strong>${cell.terrain}</strong></p>
            <p>Növényzet: <strong>${cell.vegetation}</strong></p>
            <p>Népesség: <strong>${Math.floor(cell.population)}</strong></p>
            <p>Jólét (Vonzóerő): <strong>${cell.wellness.toFixed(1)}%</strong></p>
            <p>Beépítettség: <strong>${cell.builtUpLevel.toFixed(1)}</strong></p>
            <hr>
            <p>Élelem: ${cell.inventory.FOOD.toFixed(0)}</p>
            <p>Fa: ${cell.inventory.WOOD.toFixed(0)}</p>
            <p>Kő: ${cell.inventory.STONE.toFixed(0)}</p>
            <p>Arany: ${cell.inventory.GOLD.toFixed(0)}</p>
            <p>Luxuscikk: ${cell.inventory.LUXURY_GOODS.toFixed(0)}</p>
            <hr>
            <p>Útminőség: <strong>${cell.roadQuality.toFixed(1)} / ${CONFIG.ROAD_MAX_QUALITY}</strong></p>
            <p>Falu: ${cell.isVillage ? 'Igen (Szint: ' + cell.villageLevel + ')' : 'Nem'}</p>
        `;
        
        // Falu alapítás gomb
        if (cell.isVillage || cell.population < 10 || player.gold < CONFIG.VILLAGE_FOUND_COST) {
            foundButton.disabled = true;
        } else {
            foundButton.disabled = false;
        }

        // Út fejlesztés gomb (ÚJ)
        if (cell.terrain === "WATER") {
            improveRoadButton.disabled = true;
        } else {
            improveRoadButton.disabled = false;
        }
    }

    updateStatsPanel() {
        const statsOverlay = document.getElementById('stats-overlay');
        if (statsOverlay.classList.contains('hidden')) return; // Ha nincs nyitva, ne számoljunk feleslegesen

        const dataDiv = document.getElementById('stats-data');
        const w = this.world;

        // HTML generálása a world adataiból
        dataDiv.innerHTML = `
            <div class="stats-row"><span>Össz Népesség:</span> <strong>${Math.floor(w.sumPopulation)}</strong></div>
            <div class="stats-row"><span>Halálozások (összes):</span> <strong>${w.deaths}</strong></div>
            <hr>
            <div class="stats-row"><span>Össz Élelem:</span> <strong>${Math.floor(w.sumFood)}</strong></div>
            <div class="stats-row"><span>Össz Fa:</span> <strong>${Math.floor(w.sumWood)}</strong></div>
            <div class="stats-row"><span>Össz Kő:</span> <strong>${Math.floor(w.sumStone)}</strong></div>
            <div class="stats-row"><span>Össz Arany:</span> <strong>${Math.floor(w.sumGold)}</strong></div>
            <div class="stats-row"><span>Össz Luxuscikk:</span> <strong>${Math.floor(w.sumLuxuryGoods)}</strong></div>
            <hr>
            <div class="stats-row"><span>Beépítettségi szint:</span> <strong>${w.sumBuiltUpLevel}</strong></div>
            <div class="stats-row"><span>Kereskedelem a körben:</span> <strong>${w.traded.toFixed(2)}</strong></div>
            <div class="stats-row"><span>Halálok a körben:</span> <strong>${w.deathsThisTick}</strong></div>
            <div class="stats-row"><span>Körök száma:</span> <strong>${w.age}</strong></div>
        `;
    }
}