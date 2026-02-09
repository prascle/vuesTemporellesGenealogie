console.log("view3D.js loaded, ready to render 3D visualization.");
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, animationId;

export function render3D(data, containerId) {
    const container = document.querySelector(containerId);
    
    // 1. Nettoyage si une instance existe déjà
    if (renderer) {
        cancelAnimationFrame(animationId);
        renderer.dispose();
        container.removeChild(renderer.domElement);
    }

    // 2. Initialisation de la Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    camera.position.set(200, 100, 300);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    
    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    scene.add(dirLight);

    // 3. Création des Objets (Barres de vie)
    const scaleX = 2; // 1 an = 2 unités
    const startYear = d3.min(data, d => d.birth);

    data.forEach((p) => {
        const length = (p.death - p.birth) * scaleX;
        if (length <= 0) return;

        const geometry = new THREE.BoxGeometry(length, 4, 4);
        const color = p.sex === 'M' ? 0x4a90e2 : (p.sex === 'F' ? 0xe24a90 : 0x999999);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const cube = new THREE.Mesh(geometry, material);

        // Positionnement
        // X : Temps, Y : Piste (track), Z : Lignée (pour l'instant 0)
        const posX = (p.birth - startYear) * scaleX + (length / 2);
        const posY = p.track * 10; 
        
        cube.position.set(posX, posY, 0);
        cube.userData = p; // Stockage pour le raycaster
        scene.add(cube);

        // Optionnel : Ajout d'une étiquette texte simple (via Sprite ou Canvas)
        // [On peut appeler ici une fonction createLabel(p.name)]
    });

    // Grille de référence
    const grid = new THREE.GridHelper(2000, 100, 0x444444, 0x222222);
    grid.position.y = -10;
    scene.add(grid);

    // 4. Boucle d'animation
    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Gestion du redimensionnement
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}