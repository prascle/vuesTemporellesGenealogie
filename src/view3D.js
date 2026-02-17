console.log("view3D.js loaded, ready to render 3D visualization.");

// ... vos imports ...
import * as THREE from 'three';
import * as d3 from 'd3';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, animationId;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let hoveredObject = null;

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
    sprite.scale.set(canvas.width * 0.1, canvas.height * 0.1, 1);
    return sprite;
}

function createNameTexture(name, color, width, height) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // On définit une résolution interne assez haute pour que ce soit net
    canvas.width = width; 
    canvas.height = height;
    
    // 1. Fond : On remplit tout le canvas avec la couleur de l'individu
    // On convertit la couleur hexadécimale Three.js en string CSS (ex: #4a90e2)
    const cssColor = `#${new THREE.Color(color).getHexString()}`;
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Texte : On dessine le nom en blanc par-dessus
    ctx.fillStyle = 'white'; 
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Optionnel : un petit contour noir pour la lisibilité
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeText(name, canvas.width / 2, canvas.height / 2);
    
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    // On améliore la netteté de la texture
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    return texture;
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
        const boxHeight = 4;
        const boxDepth = 4;

        const geometry = new THREE.BoxGeometry(length, boxHeight, boxDepth);

        // Matériau de base (pour les côtés, le haut, le bas et l'arrière)
        const baseColor = p.sex === 'M' ? 0x4a90e2 : (p.sex === 'F' ? 0xe24a90 : 0x999999);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: baseColor });

        // Matériau pour la face avant avec le texte
        let dateDeath = "";
        if (p.death < new Date().getFullYear()) {
            dateDeath = p.death;
        };
        let texteIncruste = `${p.name} ${p.birth}—${dateDeath}`;

        const nameTexture = createNameTexture(texteIncruste, baseColor, length * 10, boxHeight * 10); // La taille du canvas est arbitraire, elle sera redimensionnée par le sprite
        const textMaterial = new THREE.MeshPhongMaterial({ 
            map: nameTexture,
            transparent: false,
            color: 0xffffff // Important : blanc pour ne pas teinter la texture
        });

        // L'ordre des faces dans BoxGeometry est : 
        // [0] Droite, [1] Gauche, [2] Haut, [3] Bas, [4] Avant (Z+), [5] Arrière (Z-)
        const materials = [
            baseMaterial, // Droite
            baseMaterial, // Gauche
            baseMaterial, // Haut
            baseMaterial, // Bas
            textMaterial, // Avant (Celle qu'on verra par défaut)
            baseMaterial  // Arrière
        ];

        const cube = new THREE.Mesh(geometry, materials);
 
        const posX = (p.birth - startYear) * scaleX + (length / 2);
        const posY = (p.track || 0) * 12; // Utilise 0 si track n'est pas encore défini

        cube.position.set(posX, posY, 0);
        cube.userData = p;
        scene.add(cube);

        // Optionnel : Ajout d'une étiquette texte simple (via Sprite ou Canvas)
        // [On peut appeler ici une fonction createLabel(p.name)]
        const label = createLabelSprite(`${p.name} ${p.birth}—${dateDeath}`);
        label.position.set(posX, posY, 10); // devant la barre
        label.visible = false; // On peut gérer la visibilité du label lors du hover avec un raycaster
        scene.add(label);
        // On crée un lien bidirectionnel pour le Raycaster
        cube.userData.label = label ;
    });

    // ... (Grille et Animation identiques) ...


    // --- 4. Boucle d'animation (À vérifier à la fin de render3D) ---
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        // Mise à jour du Raycaster avec la position de la souris
        raycaster.setFromCamera(mouse, camera);
        
        // On cherche les intersections avec les enfants de la scène (les cubes)
        const intersects = raycaster.intersectObjects(scene.children);

        // On réinitialise l'objet précédemment survolé
        if (hoveredObject) {
            hoveredObject.userData.label.visible = false;
            hoveredObject = null;
        }

        if (intersects.length > 0) {
            // On prend le premier objet touché (le plus proche)
            const object = intersects[0].object;
            
            // On vérifie que c'est bien un de nos cubes d'individus
            if (object.userData && object.userData.label) {
                hoveredObject = object;
                hoveredObject.userData.label.visible = true; // On affiche le sprite !
            }
        }

        controls.update();
        renderer.render(scene, camera);
    }
    animate(); // <--- IL FAUT APPELER LA FONCTION ICI 

    window.addEventListener('mousemove', (event) => {
        // Calcul de la position de la souris en coordonnées normalisées (-1 à +1)
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    });

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

export function resetCamera3D() {
    if (!scene || !camera || !controls) return;

    // Calculer la boîte qui englobe tous les objets de la scène
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Positionner la caméra en fonction de la taille de l'arbre
    const maxDim = Math.max(size.x, size.y, size.z);
    console.log(`Resetting camera. Scene center: ${center.toArray()}, Scene size: ${size.toArray()}`);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    cameraZ *= 0.4; // A ajuster pour se rapprocher ou s'éloigner selon la densité de l'arbre

    camera.position.set(center.x, center.y, cameraZ);
    
    // La caméra regarde le centre géométrique de l'arbre
    controls.target.copy(center);
    controls.update();
}

// export function resetCamera3D() {
//     if (!camera || !controls) return;

//     // 1. Définir la position "Idéale" 
//     // On se place au centre (X), un peu en hauteur (Y) 
//     // et bien en face/au-dessus sur l'axe Z
//     camera.position.set(200, 200, 800); 

//     // 2. Redonner une cible aux contrôles
//     // On veut que la caméra regarde vers le milieu de la timeline
//     controls.target.set(200, 0, 0);

//     // 3. Mettre à jour
//     controls.update();
    
//     console.log("Caméra 3D réinitialisée");
// }