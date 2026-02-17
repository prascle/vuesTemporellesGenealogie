console.log("Main script loaded, waiting for file input...");
import { parseGedcomToJSON } from './parser.js';
import { render2D } from './view2D.js';
import { render3D } from './view3D.js';
import { resetCamera3D } from './view3D.js';

const fileInput = document.getElementById('gedcomFile');

const btn2d = document.getElementById('btn-2d');
const btn3d = document.getElementById('btn-3d');
const btnReset3d = document.getElementById('btn-reset-3d');

function toggleView(type) {
    // 1. Gérer les classes CSS
    document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
    document.getElementById(`container-${type}`).classList.add('active');

    // 2. Correction cruciale pour Three.js
    if (type === '3d') {
        // On simule un resize pour que Three.js ajuste son rendu au conteneur devenu visible
        window.dispatchEvent(new Event('resize'));
        switchView('3d');
    }
    else {
        switchView('2d');
    }
}

btn2d.addEventListener('click', () => toggleView('2d'));
btn3d.addEventListener('click', () => toggleView('3d'));
btnReset3d.addEventListener('click', () => {
    resetCamera3D();
});

// Variable pour stocker les données chargées
let currentData = null;

// 1. Gestionnaire de chargement de fichier
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const consoleEl = document.getElementById('debug-console');
    consoleEl.innerHTML = `<div>> Chargement de ${file.name}...</div>`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    try {
        currentData = parseGedcomToJSON(uint8Array);
        consoleEl.innerHTML += `<div style="color: #4a90e2;">✅ ${currentData.length} individus chargés avec succès.</div>`;

        // On affiche la vue par défaut (2D)
        switchView('2d');
    } catch (err) {
        consoleEl.innerHTML += `<div style="color: #ff4a4a;">❌ Erreur : ${err.message}</div>`;
    }
});

// 2. Gestionnaire de changement de vue
// On remplace la fonction globale par une logique interne au module
window.switchView = function (type) {
    // Masquer tous les conteneurs
    document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));

    // Afficher le conteneur cible
    const activeContainer = document.getElementById(`container-${type}`);
    activeContainer.classList.add('active');

    // Si on a des données, on lance le rendu correspondant
    if (currentData) {
        if (type === '2d') {
            render2D(currentData, '#canvas'); // On cible #canvas selon votre HTML
        } else if (type === '3d') {
            render3D(currentData, '#container-3d');
            // Crucial : on force Three.js à recalculer sa taille
            window.dispatchEvent(new Event('resize'));
        }
    }
};