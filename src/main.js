console.log("Main script loaded, waiting for file input...");
import { parseGedcomToJSON } from './parser.js';
import { render2D } from './view2D.js';
import { render3D } from './view3D.js';

const fileInput = document.getElementById('gedcomFile');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const consoleEl = document.getElementById('debug-console');
    consoleEl.innerHTML = `<div>> Chargement de ${file.name}...</div>`;

    const content = await file.text();
    const { data, logs, stats } = parseGedcomToJSON(content);

    // Affichage des statistiques
    consoleEl.innerHTML += `<div style="color: white;">✅ ${stats.total} individus trouvés. ${data.length} affichables.</div>`;
    
    // Affichage des logs d'erreurs/alertes
    logs.forEach(msg => {
        consoleEl.innerHTML += `<div>${msg}</div>`;
    });

    // Scroll automatique vers le bas
    consoleEl.scrollTop = consoleEl.scrollHeight;

    // Rendu des vues
    render2D(data, '#container-2d');
    render3D(data, '#container-3d');
});