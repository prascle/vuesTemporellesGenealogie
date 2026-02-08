import { readGedcom } from 'read-gedcom';

export function parseGedcomToJSON(gedcomString) {
    const gedcom = readGedcom(gedcomString);
    const individuals = gedcom.getIndividualRecord();
    
    const logs = [];
    const stats = { total: individuals.length, missingDates: 0, errors: 0 };

    const processed = individuals.map(indi => {
        const id = indi.pointer;
        const nameRaw = indi.getName()[0]?.value || "Inconnu";
        const cleanName = nameRaw.replace(/\//g, '');
        
        const birthYear = extractYear(indi.getEventBirth()[0]);
        const deathYear = extractYear(indi.getEventDeath()[0]);

        // Traces pour la console
        if (!birthYear) {
            stats.missingDates++;
            logs.push(`⚠️ [${id}] ${cleanName} : Date de naissance manquante.`);
        }

        if (birthYear && deathYear && birthYear > deathYear) {
            stats.errors++;
            logs.push(`❌ [${id}] ${cleanName} : Cohérence dates impossible (${birthYear} > ${deathYear}).`);
        }

        return {
            id,
            name: cleanName,
            sex: indi.getSex()[0]?.value || 'U',
            birth: birthYear,
            death: deathYear || new Date().getFullYear(),
            track: 0 // Sera calculé après
        };
    }).filter(p => p.birth !== null);

    return { data: processed, logs, stats };
}

function extractYear(event) {
    const dateStr = event?.getDate()[0]?.value;
    const match = dateStr?.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
}