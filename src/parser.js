import { readGedcom } from 'read-gedcom';

export function parseGedcomToJSON(gedcomString) {
    const gedcom = readGedcom(gedcomString);
    const individuals = gedcom.getIndividualRecord();

    return individuals.map(indi => {
        // Extraction du nom (format GEDCOM : /Nom/)
        const nameRaw = indi.getName()[0]?.value || "Inconnu";
        const cleanName = nameRaw.replace(/\//g, '');

        // Extraction des dates (logique simplifiée)
        const birthEvent = indi.getEventBirth()[0];
        const deathEvent = indi.getEventDeath()[0];
        
        // On essaye d'extraire l'année (4 chiffres) du texte de la date
        const extractYear = (event) => {
            const dateStr = event?.getDate()[0]?.value;
            const match = dateStr?.match(/\d{4}/);
            return match ? parseInt(match[0]) : null;
        };

        return {
            id: indi.pointer,
            name: cleanName,
            sex: indi.getSex()[0]?.value || 'U',
            birth: extractYear(birthEvent),
            death: extractYear(deathEvent) || new Date().getFullYear(), // Si vivant
            details: `Sexe: ${indi.getSex()[0]?.value || 'Non défini'}`
        };
    }).filter(p => p.birth !== null); // On ne garde que ceux qui ont une date pour la timeline
}