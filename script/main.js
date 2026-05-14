import { CONFIG } from './config.js';
import { World } from './world.js';
import { Renderer } from './renderer.js';
import { Player } from './player.js';

window.addEventListener('DOMContentLoaded', () => {
    
    // 1. Inicializálás
    const world = new World(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT);
    const renderer = new Renderer(world); 
    const player = new Player(world);

    // 2. Kezdeti állapot
    renderer.draw(player.selectedCell);
    renderer.updateUI(player.selectedCell, player);

    // 3. Eseménykezelők
    const gameTable = document.getElementById('gameTable');
    
    // Cella kiválasztása
    gameTable.addEventListener('click', (event) => {
        const td = event.target.closest('td');
        if (td) {
            player.selectCellByElement(td);
            renderer.updateUI(player.selectedCell, player);
            renderer.draw(player.selectedCell); 
        }
    });

    // --- ERŐFORRÁS MENÜ (Bal oldal) ---
    const btnResourcesMain = document.getElementById('btn-resources-main');
    const resourceSubButtons = document.getElementById('resource-sub-buttons');

    btnResourcesMain.addEventListener('click', () => {
        resourceSubButtons.classList.toggle('hidden');
    });

    // Erőforrás választó gombok - ha valamelyik ID nincs a HTML-ben, itt fog elszállni
    const resourceMap = {
        'FOOD': { view: 'FOOD', icon: '🍞' },
        'WOOD': { view: 'WOOD', icon: '🌴' },
        'STONE': { view: 'STONE', icon: '🗿' },
        'GOLD': { view: 'GOLD', icon: '💰' },
        'LUXURY_GOODS': { view: 'LUXURY_GOODS', icon: '💎' }
    };

    Object.keys(resourceMap).forEach(id => {
        const btn = document.getElementById(id);
        btn.addEventListener('click', () => {
            const data = resourceMap[id];
            renderer.setView(data.view);
            renderer.draw(player.selectedCell);
            
            // 1. Ikon frissítése a főgombon
            btnResourcesMain.textContent = data.icon;
            
            // 2. MENÜ BEZÁRÁSA (visszatesszük a hidden osztályt)
            resourceSubButtons.classList.add('hidden');
        });
    });

    // Alapértelmezett térképnézetek (amiknek van data-view attribútuma)
    document.querySelectorAll('#map-control button[data-view]').forEach(button => {
        button.addEventListener('click', () => {
            const viewKey = button.getAttribute('data-view');
            btnResourcesMain.textContent = '📦'; // Visszaállítjuk az alap ikont
            resourceSubButtons.classList.add('hidden');
            renderer.setView(viewKey);
            renderer.draw(player.selectedCell);
        });
    });

    // --- ÖSSZEVONT ADOMÁNYOZÁS (Jobb oldal) ---
    const donateBtn = document.getElementById('btn-donate-action');
    const donateTypeSelect = document.getElementById('donate-type');
    const donateAmountInput = document.getElementById('donate-amount');

    donateBtn.addEventListener('click', () => {
        const type = donateTypeSelect.value;
        const amount = parseInt(donateAmountInput.value, 10);
        player.donate(type, amount);
        renderer.updateUI(player.selectedCell, player);
    });

    // Út javítása
    document.getElementById('btn-improve-road').addEventListener('click', () => {
        const amount = parseInt(donateAmountInput.value, 10);
        player.donateToRoad(amount);
        renderer.updateUI(player.selectedCell, player);
        renderer.draw(player.selectedCell);
    });

    // --- STATISZTIKA PANEL ---
    const statsOverlay = document.getElementById('stats-overlay');
    
    document.getElementById('btn-stats').addEventListener('click', () => {
        statsOverlay.classList.remove('hidden');
        renderer.updateStatsPanel();
    });

    document.getElementById('btn-close-stats').addEventListener('click', () => {
        statsOverlay.classList.add('hidden');
    });

    // 4. A Fő Játékhurok (Game Loop)
    function gameLoop() {
        world.simulationStep();
        renderer.draw(player.selectedCell);
        
        if (player.selectedCell) {
            renderer.updateUI(player.selectedCell, player);
        }
        
        // Statisztika frissítése (ha a metódus létezik a rendererben)
        renderer.updateStatsPanel();
        world.refreshStatistics();
        console.log("kör vége");
    }

    setInterval(gameLoop, CONFIG.SIM_TICK_MS);
});