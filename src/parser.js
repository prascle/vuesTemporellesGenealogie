console.log("Parser module loaded, ready to parse GEDCOM data.");
import GedcomTree from '@treeviz/gedcom-parser';

export function parseGedcomToJSON(gedcomString) {
    console.log("Parsing GEDCOM data...", gedcomString.slice(0, 100) + "...");
    const { gedcom } = GedcomTree.parse(gedcomString);
    const individuals = gedcom.indis();

    individuals.forEach(indi => {
    console.log(indi.toName()); // "John Doe"
    console.log(indi.getBirthDate()); // "*1850" (year only)
    //console.log(indi.getBirthDate(true)); // "*1850.05.15." (full date)
    console.log(indi.getBirthPlace()); // "New York, USA" 
    });
/*    const gedcom = readGedcom(gedcomString);
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
    */
}

function extractYear(event) {
    const dateStr = event?.getDate()[0]?.value;
    const match = dateStr?.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
}