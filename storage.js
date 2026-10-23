const STORAGE_KEY = 'fichier_cubage';

export function chargerDonnees() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function sauvegarderDonnees(grumes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grumes));
}

function obtenirDateFrancaise(separateur = '-') {
    const d = new Date();
    const jour = String(d.getDate()).padStart(2, '0');
    const mois = String(d.getMonth() + 1).padStart(2, '0');
    const annee = d.getFullYear();
    return `${jour}${separateur}${mois}${separateur}${annee}`;
}

/**
 * Exporte l'inventaire en format CSV avec séparateur point-virgule et virgule pour les décimales.
 * Point de vigilance : Alignement à 3 chiffres après la virgule pour la colonne Volume.
 */
export function exporterCSV(grumes) {
    if (!grumes || grumes.length === 0) return;
    
    let csvContent = "Plaquette;Essence;Qualite;Diametre_cm;Longueur_m;Volume_m3\n";
    grumes.forEach((g) => {
        const diam = g.diametre.toFixed(0);
        const long = g.longueur.toFixed(1).replace('.', ',');
        // Passage du volume à 3 décimales pour l'export tableur
        const vol = g.volume.toFixed(3).replace('.', ',');
        csvContent += `${g.plaquette};${g.essence};${g.qualite};${diam};${long};${vol}\n`;
    });
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const lienTelechargement = document.createElement("a");
    
    lienTelechargement.href = URL.createObjectURL(blob);
    lienTelechargement.setAttribute("download", `cubage_${obtenirDateFrancaise('-')}.csv`);
    document.body.appendChild(lienTelechargement);
    lienTelechargement.click();
    document.body.removeChild(lienTelechargement);
}

/**
 * Génère le rapport PDF officiel via jsPDF avec alignement strict des données.
 * Point de vigilance : Les volumes individuels et le total cumulé passent à 3 décimales.
 */
export function exporterPDF(grumes) {
    if (!grumes || grumes.length === 0) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RAPPORT DE CUBAGE FORESTIER", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date du rapport : ${obtenirDateFrancaise('/')}`, 14, 27);
    doc.text(`Nombre de bois : ${grumes.length}`, 14, 32);
    
    doc.setDrawColor(200);
    doc.line(14, 36, 196, 36);

    doc.setFont("helvetica", "bold");
    doc.text("Plaquette", 32, 43, { align: "right" });
    doc.text("Essence", 42, 43);
    doc.text("Q.", 72, 43); // Ajustement sémantique de l'en-tête qualité
    doc.text("Diam (cm)", 112, 43, { align: "right" });
    doc.text("Long (m)", 148, 43, { align: "right" });
    doc.text("Volume (m³)", 190, 43, { align: "right" });
    doc.line(14, 46, 196, 46);

    doc.setFont("helvetica", "normal");
    let y = 52;
    let totalVolume = 0;

    grumes.forEach((g) => {
        totalVolume += g.volume;

        if (y > 275) {
            doc.addPage();
            y = 20;
        }

        doc.text(String(g.plaquette), 32, y, { align: "right" });
        doc.text(g.essence, 42, y);
        doc.text(g.qualite, 72, y);
        doc.text(g.diametre.toFixed(0), 112, y, { align: "right" });
        doc.text(g.longueur.toFixed(1), 148, y, { align: "right" });
        // Affichage individuel calibré à 3 décimales
        doc.text(g.volume.toFixed(3), 190, y, { align: "right" });
        
        doc.setDrawColor(240);
        doc.line(14, y + 2, 196, y + 2);
        y += 8;
    });

    y += 2;
    if (y > 275) { doc.addPage(); y = 20; }
    
    doc.setDrawColor(100);
    doc.line(14, y, 196, y);
    y += 7;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("VOLUME TOTAL CUMULÉ :", 14, y);
    // Affichage du grand total cumulé bloqué à 3 décimales pour une correspondance parfaite à l'écran
    doc.text(`${totalVolume.toFixed(3)} m³`, 190, y, { align: "right" });

    doc.save(`cubage_${obtenirDateFrancaise('-')}.pdf`);
}
