console.log("Main script loaded, waiting for file input...");
import { parseGedcomToJSON } from './parser.js';
import { render2D } from './view2D.js';
import { render3D } from './view3D.js';

const fileInput = document.getElementById('gedcomFile');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];

    const consoleEl = document.getElementById('debug-console');
    consoleEl.innerHTML = `<div>> Chargement de ${file.name}...</div>`;

    // Au lieu de file.text(), on lit le buffer brut
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const data = parseGedcomToJSON(uint8Array);

    // Rendu des vues
    render2D(data, '#container-2d');
    render3D(data, '#container-3d');
});
