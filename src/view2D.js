console.log("view2D.js loaded, ready to render 2D visualization.");
import * as d3 from 'd3';

export function render2D(data, containerId) {
    // 1. Nettoyage du conteneur (évite les doublons au rechargement)
    const container = d3.select(containerId);
    container.selectAll("*").remove();

    // 2. Configuration des dimensions
    const margin = { top: 40, right: 50, bottom: 60, left: 20 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const barHeight = 25;
    const barPadding = 8;

    // 3. Calcul des pistes (Y) - On le refait ici pour être sûr du placement

    const allIndividus = [...data.values()]; // Convertir la Map en tableau pour le tri et l'itération
    const individus = [];
    allIndividus.forEach(indi => {
        indi.notes = ""; // Placeholder pour les notes éventuelles à afficher dans le tooltip
        if (indi.birth && indi.death) {
            individus.push(indi);
        } else {
            if (!indi.birth) {
                if (!indi.death) {
                    console.warn(`⚠️ Individu ${indi.name} (ID: ${indi.id}) ignoré pour le rendu 2D car il manque à la fois la date de naissance et de décès.`);
                } else {
                    indi.birth = indi.death - 60; // Estimation arbitraire de 60 ans de vie si seule la date de décès est connue
                    indi.notes = "Date de naissance estimée";
                    individus.push(indi);
                    console.warn(`⚠️ Individu ${indi.name} (ID: ${indi.id}) a une date de naissance estimée à ${indi.birth} basée sur la date de décès ${indi.death}.`);
                }
            } else if (!indi.death) {
                indi.death = indi.birth + 110; // Estimation arbitraire de 110 ans de vie max si seule la date de naissance est connue
                if (indi.death > new Date().getFullYear()) {
                    indi.death = new Date().getFullYear(); // Ne pas dépasser l'année en cours
                } else {
                    indi.notes = "Date de décès estimée";
                }
                individus.push(indi);
                console.warn(`⚠️ Individu ${indi.name} (ID: ${indi.id}) a une date de décès estimée à ${indi.death} basée sur la date de naissance ${indi.birth}.`);
            }
        }
    });

    individus.sort((a, b) => a.birth - b.birth);
    let tracks = [];
    let i = 0;
    individus.forEach(p => {
        let trackIndex = tracks.findIndex(tEnd => tEnd < p.birth);
        if (trackIndex === -1) {
            trackIndex = tracks.length;
            tracks.push(p.death);
        } else {
            tracks[trackIndex] = p.death;
        }
        tracks.push(p.death);
        //trackIndex = i++; // For debugging, assign a unique track index even if it overlaps
        p.track = trackIndex;
        console.log(`Assigning ${p.name} (born ${p.birth}) to track ${trackIndex} (current track end: ${tracks[trackIndex]})`); // Trace pour le debug
    });

    const height = (tracks.length * (barHeight + barPadding)) + margin.top + margin.bottom;

    // 4. Création du SVG
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 5. Échelles
    const x = d3.scaleLinear()
        .domain([d3.min(individus, d => d.birth) - 10, d3.max(individus, d => d.death) + 10])
        .range([0, width]);

    // Couleurs par genre
    const getGenderColor = (sex) => {
        if (sex === 'M') return "#4a90e2"; // Bleu
        if (sex === 'F') return "#e24a90"; // Rose
        return "#999"; // Gris (Inconnu)
    };

    // 6. Dessin des Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .attr("class", "axis-x")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // 7. Dessin des barres
    const bars = svg.selectAll(".person-group")
        .data(individus)
        .enter().append("g")
        .attr("class", "person-group");

    bars.append("rect")
        .attr("class", "person-bar")
        .attr("x", d => x(d.birth))
        .attr("y", d => d.track * (barHeight + barPadding))
        .attr("width", d => Math.max(x(d.death) - x(d.birth), 2))
        .attr("height", barHeight)
        .attr("fill", d => getGenderColor(d.sex))
        .attr("rx", 5)
        .style("cursor", "pointer")
        .on("mouseover", (event, d) => showTooltip(event, d))
        .on("mouseout", () => hideTooltip())
        .on("mousemove", (event) => {
            d3.select("#tooltip")
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 20) + "px");
        });

    // 8. Ajout des noms
    bars.append("text")
        .attr("x", d => x(d.birth) + 10)
        .attr("y", d => d.track * (barHeight + barPadding) + (barHeight / 1.5))
        .text(d => d.name)
        .style("fill", "white")
        .style("font-size", "11px")
        .style("pointer-events", "none")
        .style("opacity", d => (x(d.death) - x(d.birth) > 60) ? 1 : 0);
}

// Fonctions utilitaires pour le tooltip (à adapter selon votre HTML)
function showTooltip(event, d) {
    const tooltip = d3.select("#tooltip");
    let dateDeath = "";
    if (d.death < new Date().getFullYear()) {
        dateDeath = d.death;
    };
    tooltip.style("visibility", "visible")
        .html(`<strong>${d.name}</strong><br>${d.birth} — ${dateDeath} --${d.id} ${d.notes}`)
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 20) + "px");
}

function hideTooltip() {
    d3.select("#tooltip").style("visibility", "hidden");
}