console.log("view3D.js loaded, ready to render 3D visualization.");

// ... vos imports ...
import * as THREE from 'three';
import * as d3 from 'd3';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, animationId;

function createLabelSprite(text, color = 'white', fontSize = 32) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}px Arial`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Mesurer le texte pour dimensionner le canvas
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.5; // Ajustement pour la hauteur réelle du texte avec padding

    canvas.width = textWidth + 20; // Ajouter un peu de padding
    canvas.height = textHeight + 10;
    
    // Redessiner le texte après avoir redimensionné le canvas
    context.font = `${fontSize}px Arial`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    // Ajuster la taille du sprite dans la scène 3D. C'est une valeur à ajuster selon votre échelle.
    sprite.scale.set(canvas.width * 0.2, canvas.height * 0.2, 1); 
    return sprite;
}

export function render3D(data, containerId) {
    console.log("Rendering 3D view with data:", data);
    const container = document.querySelector(containerId);
    if (!container) return;
    console.log(`Container dimensions: ${container.clientWidth}x${container.clientHeight}`);

    // 1. Nettoyage (Assurez-vous que l'ancien canvas est bien supprimé)
    if (renderer) {
        cancelAnimationFrame(animationId);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
    }
    console.log("Previous renderer cleaned up, initializing new 3D scene...");
    // 2. Dimensions dynamiques
    // Si le container est masqué, on utilise window par défaut pour ne pas avoir 0
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 600;
    console.log(`Using dimensions for 3D rendering: ${width}x${height}`);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
    camera.position.set(200, 200, 500); // Reculé un peu pour mieux voir l'ensemble
    console.log("Camera initialized at position:", camera.position);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); // Pour la netteté sur écrans Retina/4K
    container.appendChild(renderer.domElement);
    console.log("Renderer initialized and appended to container.");

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Rendu plus fluide lors de la rotation

    // ... (Lumières identiques) ...
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);
    console.log("Lights added to the scene.");

    let startYear = 2000;
    for (const indi of data.values()) {
        if (indi.birth) {
            if (indi.birth < startYear) {
                startYear = indi.birth;
            }
        } else {
            if (indi.death) {
                if (indi.death < startYear) {
                    startYear = indi.death - 100; // Si on n'a que la date de décès, on suppose une naissance 100 ans avant
                }
            } else {
                console.warn(`⚠️ Individu ${indi.name} (ID: ${indi.id}) ignoré pour le rendu 3D car il manque la date de naissance.`);
            }
        }
    }
    // // On utilise d3.min qui gère les tableaux de toute taille et ignore les null/undefined
    // const startYear = d3.min(data, p => {
    //     if (p.birth) return p.birth;
    //     if (p.death) return p.death - 100;
    //     return 1827; // Valeur de secours si aucune date n'est disponible (1827 = 2024 - 197 ans, pour couvrir une génération très longue)
    // }) || 1700; // Valeur de secours si le fichier est vide ou sans dates
    // console.log(`Calculated start year for timeline: ${startYear}`);

    // 3. Création des Objets
    const scaleX = 2;
    console.log(`Start year: ${startYear}, Scale: ${scaleX} units/year`);
    data.forEach((p) => {
        // ... (votre logique d'estimation de date est correcte) ...
        if (!p.birth && !p.death) {
            console.warn(`⚠️ Individu ${p.name} (ID: ${p.id}) ignoré pour le rendu 3D car il manque la date de naissance et de décès.`);
            return;
        }
        if (!p.birth) {
            p.birth = p.death - 60; // Estimation arbitraire de 60 ans de vie si seule la date de décès est connue
            console.warn(`⚠️ Individu ${p.name} (ID: ${p.id}) a une date de naissance estimée à ${p.birth} basée sur la date de décès ${p.death}.`);
        } else if (!p.death) {
            p.death = p.birth + 110; // Estimation arbitraire de 110 ans de vie max si seule la date de naissance est connue
            if (p.death > new Date().getFullYear()) {
                p.death = new Date().getFullYear(); // Ne pas dépasser l'année en cours
            } else {
                console.warn(`⚠️ Individu ${p.name} (ID: ${p.id}) a une date de décès estimée à ${p.death} basée sur la date de naissance ${p.birth}.`);
            }
        }
        console.log(`Creating 3D object for ${p.name} (ID: ${p.id}) - Birth: ${p.birth}, Death: ${p.death}`);

        const length = (p.death - p.birth) * scaleX;
        if (length <= 0) return;

        const geometry = new THREE.BoxGeometry(length, 4, 4);
        const color = p.sex === 'M' ? 0x4a90e2 : (p.sex === 'F' ? 0xe24a90 : 0x999999);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const cube = new THREE.Mesh(geometry, material);

        const posX = (p.birth - startYear) * scaleX + (length / 2);
        const posY = (p.track || 0) * 12; // Utilise 0 si track n'est pas encore défini

        cube.position.set(posX, posY, 0);
        cube.userData = p;
        scene.add(cube);

        // Optionnel : Ajout d'une étiquette texte simple (via Sprite ou Canvas)
        // [On peut appeler ici une fonction createLabel(p.name)]
        let dateDeath = "";
        if (p.death < new Date().getFullYear()) {
            dateDeath = p.death;
        };
        const label = createLabelSprite(`${p.name} ${p.birth}—${dateDeath}`);
        label.position.set(posX, posY + 10, 0); // Au-dessus de la barre
        scene.add(label);

        // --- 4. Boucle d'animation (À vérifier à la fin de render3D) ---
        function animate() {
            animationId = requestAnimationFrame(animate);
            controls.update(); // Important pour le damping
            renderer.render(scene, camera); // C'EST CETTE LIGNE QUI DESSINE
        }
        animate(); // <--- IL FAUT APPELER LA FONCTION ICI 
    });

    // ... (Grille et Animation identiques) ...


    // 5. Gestion robuste du redimensionnement
    function onResize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return; // Ne rien faire si le container est caché

        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    window.addEventListener('resize', onResize);

    // TRÈS IMPORTANT : On force un resize immédiat au cas où le container 
    // vient juste d'être affiché par switchView
    setTimeout(onResize, 10);
}