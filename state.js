export const LISTE_ESSENCES = [
    ["SAP", "EPI", "DOU", "PIN", "CED", "MEL", "HTR", "CHN", "FRN"],
    ["CHR", "CHT", "ROB", "BOU", "ERA", "TIL", "AUL", "ORM", "SAU"],
    ["ALI", "MER", "SOR", "PEU", "TRB", "PLA", "MAR", "NOY", "AUTRE"]
];

// Ordre de saisie strict demandé pour le carrousel horizontal
export const ORDRE_CHAMPS = ['ess', 'diam', 'long', 'q', 'plaq'];

export const appState = {
    grumes: [], champActif: null, modeActuel: "essences", pageEssence: 0,
    choixExportActif: false, choixViderActif: false, ligneASupprimer: null,
    choixForceActif: false, // Armement du forçage calqué sur choixViderActif
    dataSaisie: { ess: "", diam: "", long: "", q: "", plaq: "" }
};

export const stateActions = {
    /**
     * Gère la saisie des caractères numériques et applique les verrous de sécurité forestiers.
     * @param {string} val - Le caractère tapé (chiffre ou point décimal).
     * @returns {boolean} Renvoie true si le caractère respecte les masques de saisie et a été ajouté.
     */
    taperChiffre(val) {
        if (!appState.champActif || appState.champActif === 'ess') return false;
        
        // Sécurité anti-zéro parasite : empêche "00" au début pour tout le monde SAUF pour le numéro de plaquette
        if (val === '0' && appState.dataSaisie[appState.champActif] === '0' && appState.champActif !== 'plaq') return false;
        
        // Point de vigilance : Le numéro de plaquette, la qualité et le diamètre sont des entiers stricts
        if (appState.champActif === 'plaq' && val === '.') return false;
        if (appState.champActif === 'q' && val === '.') return false;
        if (appState.champActif === 'diam' && val === '.') return false;
        
        // Sécurité pour le point décimal unique
        if (val === '.' && appState.dataSaisie[appState.champActif].includes('.')) return false;
        
        const valeurActuelle = appState.dataSaisie[appState.champActif];
        const valeurFuture = valeurActuelle + val;
        
        // Verrous de longueurs maximales stricts pour Diamètre (999 cm max) et Plaquette (4 chiffres max)
        if (appState.champActif === 'diam' && valeurFuture.length > 3) return false;
        if (appState.champActif === 'plaq' && valeurFuture.length > 4) return false;
        
        // Point de vigilance : Validation par Regex de la Longueur (2 chiffres max avant le point, 1 max après)
        if (appState.champActif === 'long') {
            const regexLongueur = /^\d{0,2}(\.\d{0,1})?$/;
            if (!regexLongueur.test(valeurFuture)) return false;
        }
        
        appState.dataSaisie[appState.champActif] = valeurFuture;
        return true;
    },

    /**
     * Assigne l'essence sélectionnée à la saisie en cours.
     * @param {number} idx - Index de l'essence dans la page actuelle du dictionnaire.
     * @returns {boolean} Renvoie true si l'essence a été validée.
     */
    taperEssence(idx) {
        const val = LISTE_ESSENCES[appState.pageEssence][idx];
        if (!val || appState.champActif !== 'ess') return false;
        appState.dataSaisie.ess = val;
        return true;
    },

    /**
     * Efface le dernier caractère du champ actif.
     * @returns {boolean} Renvoie toujours true après exécution.
     */
    effacer() {
        if (!appState.champActif) return false;
        const actuel = appState.dataSaisie[appState.champActif];
        appState.dataSaisie[appState.champActif] = appState.champActif === 'ess' ? "" : actuel.slice(0, -1);
        return true;
    },

    /**
     * Navigue entre les pages du dictionnaire d'essences (boucle sur 3 pages).
     * @param {string} dir - Direction de navigation : 'suivant' ou 'precedent'.
     */
    naviguerPage(dir) {
        appState.pageEssence = dir === 'suivant' ? (appState.pageEssence + 1) % 3 : (appState.pageEssence - 1 + 3) % 3;
    },

    /**
     * Valide et crée la grume, ou force sa création avec des tirets si choixForceActif est armé.
     * @returns {Object|null} Le nouvel objet grume créé ou null si la validation échoue.
     */
    ajouterGrumeActive() {
        const { ess, diam, long, q, plaq } = appState.dataSaisie;
        const estIncomplet = !ess || !diam || !long || !q || !plaq;
        
        if (estIncomplet && !appState.choixForceActif) return null;
        
        let volArrondi = "—";
        if (diam && long) {
            const d = parseFloat(diam);
            const l = parseFloat(long);
            const volBrut = Math.PI * Math.pow((d / 2) / 100, 2) * l;
            volArrondi = Math.round(volBrut * 1000) / 1000;
        }
        
        const nve = { 
            id: "row-" + Date.now(), 
            plaquette: plaq || "—", 
            essence: ess || "—", 
            qualite: q || "—", 
            diametre: diam ? parseFloat(diam) : "—", 
            longueur: long ? parseFloat(long) : "—", 
            volume: volArrondi,
            incomplete: estIncomplet
        };
        
        appState.grumes.push(nve);
        appState.dataSaisie = { ess: "", diam: "", long: "", q: "", plaq: "" };
        return nve;
    },

    /**
     * Calcule le prochain champ vide dans l'ordre de saisie pour orienter le focus du clavier.
     * @returns {string|null} Renvoie l'identifiant du prochain champ à activer, ou null si tout est rempli.
     */
    calculerSuivant() {
        let idx = ORDRE_CHAMPS.indexOf(appState.champActif);
        for (let i = 1; i < ORDRE_CHAMPS.length; i++) {
            let suiv = ORDRE_CHAMPS[(idx + i) % ORDRE_CHAMPS.length];
            if (appState.dataSaisie[suiv] === "") return suiv;
        }
        return null;
    }
};
