console.log("Parser module loaded, ready to parse GEDCOM data.");

import { readGedcom } from 'read-gedcom';

/**
 * Lit un contenu GEDCOM et retourne une liste d'individus structurée.
 * @param {string} gedcomString - Le contenu brut du fichier .ged
 * @returns {Array} Liste d'objets individus
 */
export function parseGedcomToJSON(gedcomString) {
    // 1. Initialisation du parser
     const gedcom = readGedcom(gedcomString);

    // 2. Récupération de tous les enregistrements d'individus (INDI)
    const nbIndividuals = gedcom.getIndividualRecord().length;
    console.log(`Nombre total d'individus trouvés dans le GEDCOM : ${nbIndividuals}`);
    const individuals = gedcom.getIndividualRecord();
    
    // 3. Transformation en format plus simple pour nos vues
    // On itère sur chaque individu et on extrait les infos clés
    // (ID, nom, sexe, dates de naissance/décès)
    // On nettoie aussi le nom pour enlever les "/" utilisés dans le format GEDCOM
    var indiMap = new Map();
    for (let i = 0; i < individuals.length; i++) {
        const indi = individuals.arraySelect()[i];
        const id = indi.pointer()[0].toString();
        console.log(`Parsing individual ${id}...`); // Trace pour le debug
        const nameRaw = indi.getName().valueAsParts()[0];
        if (!nameRaw) {
            console.warn(`⚠️ [${id}] Nom manquant, assignation "Anonyme".`);
        }
        const cleanName = nameRaw ? nameRaw.toString().replace(/\,/g, ' ').trim() : "Anonyme";
        console.log(`Parsing individual ${id}: raw name "${nameRaw}" -> cleaned name "${cleanName}"`);
        const sex = indi.getSex()[0]?.value.toString() || 'U';
        console.log(`Sexe de ${id} (${cleanName}): ${sex}`);
        function getYear (dateStr) {
            if (!dateStr) return null;
            const match = dateStr.match(/\d{4}/);
            return match ? parseInt(match[0]) : null;
        };
        const birthYear = getYear(indi.getEventBirth().toString());
        const deathYear = getYear(indi.getEventDeath().toString());
        console.log(`Dates de ${id} (${cleanName}): naissance ${birthYear || 'inconnue'}, décès ${deathYear || 'inconnu'}`);    
        indiMap.set(id, { id, name: cleanName, sex, birth: birthYear, death: deathYear });
    }
    return indiMap;
}