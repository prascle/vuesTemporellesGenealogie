import { parseGedcomToJSON } from './parser.js';
import { render2D } from './view2D.js';
import { render3D } from './view3D.js';

const fileInput = document.getElementById('gedcomFile');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const content = await file.text();
    
    // 1. Transformer le GEDCOM en données exploitables
    const processedData = parseGedcomToJSON(content);
    
    // 2. Envoyer les données aux deux moteurs de rendu
    render2D(processedData, '#container-2d');
    render3D(processedData, '#container-3d');
});