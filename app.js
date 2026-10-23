import { ORDRE_CHAMPS, appState, stateActions } from './state.js';
import { chargerDonnees, sauvegarderDonnees, exporterCSV, exporterPDF } from './storage.js';
import { initialiserClavier, afficherClavier, réinitialiserChampsClavier } from './keyboard.js';

appState.grumes = chargerDonnees();

initialiserClavier(receptionDonneesClavier);
mettreAJourVue();
setTimeout(() => { afficherClavier('ess'); }, 300);

ORDRE_CHAMPS.forEach(id => {
    document.getElementById(`block-${id}`)?.addEventListener('click', () => afficherClavier(id));
});

function receptionDonneesClavier() {
    animerFlash(`block-${appState.champActif}`, "rgba(46, 204, 113, 0.8)");

    const nouvelleGrume = stateActions.ajouterGrumeActive();
    if (!nouvelleGrume) return; // Saisie incomplète, le clavier poursuit son cycle automatiquement

    réinitialiserChampsClavier();
    mettreAJourVue();
    animerFlash(nouvelleGrume.id, "rgba(46, 204, 113, 0.6)");
    
    const scrollBox = document.querySelector('.table-scroll');
    if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;

    afficherClavier('ess');
}

/**
 * Gère le flash vert de validation et nettoie ses traces de style après exécution.
 * @param {string} id - L'identifiant de la ligne ou du bloc HTML à animer.
 * @param {string} rgbaColor - La couleur du flash sous forme de chaîne RGBA.
 */
function animerFlash(id, rgbaColor) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transition = "none";
    el.style.backgroundColor = rgbaColor;
    setTimeout(() => {
        el.style.transition = "background-color 1.2s ease-out";
        el.style.backgroundColor = id.startsWith('row-') ? "transparent" : "var(--bg-card)";
        
        // Point de vigilance : Nettoyage par chaîne vide après les 1,2s pour redonner le contrôle au CSS de suppression
        setTimeout(() => {
            if (el) el.style.transition = "";
        }, 1200);
    }, 90);
}

function mettreAJourVue() {
    const tbody = document.getElementById('logList');
    if (!tbody) return;
    tbody.innerHTML = '';
    let total = 0;

    appState.grumes.forEach((g, index) => {
        total += g.volume;
        const tr = document.createElement('tr');
        tr.id = g.id || ("row-" + index);
        
        tr.innerHTML = `
            <td><b>${g.plaquette}</b></td>
            <td style="color:#ffff00">${g.essence}</td>
            <td style="color:#2ecc71; text-align:center;">${g.qualite}</td>
            <td style="text-align:center;">${g.diametre.toFixed(0)}</td>
            <td style="text-align:center;">${g.longueur.toFixed(1)}</td>
            <td style="text-align:right; padding-right:6px;">${g.volume.toFixed(3)}</td>
            <td><button class="btn-del" data-index="${index}">✖</button></td>
        `;
        tbody.appendChild(tr);
    });

    const countEl = document.getElementById('logCount');
    if (countEl) countEl.innerText = `(${appState.grumes.length})`;

    document.getElementById('totalVolume').innerText = total.toFixed(3);
    sauvegarderDonnees(appState.grumes);
}

function restaurerBoutonsActions() {
    const btnExp = document.getElementById('btn-action-export');
    const btnClr = document.getElementById('btn-action-clear');
    const table = document.querySelector('table');
    if (!btnExp || !btnClr) return;
    
    table?.classList.remove('deleting-all');
    document.querySelectorAll('#logList tr').forEach(tr => tr.classList.remove('deleting'));
    
    appState.choixExportActif = false;
    appState.choixViderActif = false;
    appState.ligneASupprimer = null;
    
    btnExp.innerText = "EXPORTER";
    btnClr.innerText = "VIDER LA LISTE";
    btnClr.style.color = "var(--error-red)";
    btnClr.style.backgroundColor = "#333";
}

document.getElementById('logList')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-del')) {
        e.stopPropagation();
        restaurerBoutonsActions();
        const btnClr = document.getElementById('btn-action-clear');
        if (btnClr) {
            appState.ligneASupprimer = parseInt(e.target.getAttribute('data-index'), 10);
            
            const ligneCible = e.target.closest('tr');
            ligneCible?.classList.add('deleting');
            
            btnClr.innerText = "SUPPRIMER ?";
            btnClr.style.backgroundColor = "var(--error-red)";
            btnClr.style.color = "black";
        }
    }
});

document.getElementById('btn-action-export')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btnExp = document.getElementById('btn-action-export');
    const btnClr = document.getElementById('btn-action-clear');
    if (!btnExp || !btnClr || appState.choixViderActif || appState.ligneASupprimer !== null) return;

    if (!appState.choixExportActif) {
        appState.choixExportActif = true;
        btnExp.innerText = "CSV";
        btnClr.innerText = "PDF";
        btnClr.style.color = "white";
    } else {
        exporterCSV(appState.grumes);
        restaurerBoutonsActions();
    }
});

document.getElementById('btn-action-clear')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btnClr = document.getElementById('btn-action-clear');
    if (!btnClr) return;

    if (appState.choixExportActif) {
        exporterPDF(appState.grumes);
        restaurerBoutonsActions();
    } else if (appState.ligneASupprimer !== null) {
        appState.grumes.splice(appState.ligneASupprimer, 1);
        mettreAJourVue();
        restaurerBoutonsActions();
    } else {
        if (!appState.choixViderActif) {
            appState.choixViderActif = true;
            
            document.querySelector('table')?.classList.add('deleting-all');
            
            btnClr.innerText = "VIDER ?";
            btnClr.style.backgroundColor = "var(--error-red)";
            btnClr.style.color = "black";
        } else {
            appState.grumes = [];
            mettreAJourVue();
            restaurerBoutonsActions();
        }
    }
});

document.addEventListener('click', () => {
    if (appState.choixExportActif || appState.choixViderActif || appState.ligneASupprimer !== null) {
        restaurerBoutonsActions();
    }
});
