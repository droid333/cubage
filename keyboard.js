import { LISTE_ESSENCES, ORDRE_CHAMPS, appState, stateActions } from './state.js';

let callbackValidation = null;

export function initialiserClavier(onValiderGrume) {
    const conteneur = document.getElementById('keyboard-container');
    if (!conteneur) return;
    callbackValidation = onValiderGrume;

    conteneur.addEventListener('click', (e) => {
        const touche = e.target;
        if (!touche.classList.contains('key')) return;

        const action = touche.getAttribute('data-key');
        const indexEssence = touche.getAttribute('data-idx');
        const valeurQualite = touche.getAttribute('data-q');
        const optionMenu = touche.getAttribute('data-opt');

        if (action) gererActionClavier(action);
        if (indexEssence !== null) {
            if (stateActions.taperEssence(parseInt(indexEssence, 10))) {
                document.getElementById('val-ess').innerText = appState.dataSaisie.ess;
            }
        }
        if (valeurQualite !== null && appState.champActif === 'q') {
            appState.dataSaisie.q = valeurQualite;
            document.getElementById('val-q').innerText = valeurQualite;
        }
    });
    mettreAJourBoutonsEssences();
}

export function afficherClavier(idChamp) {
    appState.champActif = idChamp;
    document.querySelectorAll('.input-block').forEach(b => b.classList.remove('active'));
    
    const blocActif = document.getElementById(`block-${idChamp}`);
    if (blocActif) {
        blocActif.classList.add('active');
        
        const conteneur = document.querySelector('.inputs-grid');
        if (conteneur) {
            const rectConteneur = conteneur.getBoundingClientRect();
            const rectBloc = blocActif.getBoundingClientRect();
            
            const estMasqueADroite = rectBloc.right > rectConteneur.right + 1;
            const estMasqueAGauche = rectBloc.left < rectConteneur.left - 1;
            
            if (estMasqueADroite || estMasqueAGauche) {
                blocActif.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    }
    
    if (idChamp === 'ess') basculerModeVisuel('essences');
    else if (idChamp === 'q') basculerModeVisuel('qualite');
    else basculerModeVisuel('chiffres');
    
    // Point de vigilance : Seule la longueur conserve le point normal, tout le reste le grise
    const touchePoint = document.querySelector('.key[data-key="."]');
    if (touchePoint) {
        touchePoint.style.opacity = (idChamp === 'long') ? "1" : "0.3";
    }
    document.getElementById('custom-keyboard')?.classList.add('open');
}

export function masquerClavier() {
    document.getElementById('custom-keyboard')?.classList.remove('open');
    document.querySelectorAll('.input-block').forEach(b => b.classList.remove('active'));
    appState.champActif = null;
}

export function réinitialiserChampsClavier() {
    ORDRE_CHAMPS.forEach(k => {
        const el = document.getElementById(`val-${k}`);
        if (el) el.innerText = "";
    });
    document.getElementById(`block-${ORDRE_CHAMPS}`)?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
}

function basculerModeVisuel(nouveauMode) {
    appState.modeActuel = nouveauMode;
    if (appState.modeActuel === 'essences') {
        appState.pageEssence = 0;
        mettreAJourBoutonsEssences();
    }
    document.getElementById('mode-essences')?.classList.toggle('hidden-mode', appState.modeActuel !== 'essences');
    document.getElementById('mode-chiffres')?.classList.toggle('hidden-mode', appState.modeActuel !== 'chiffres');
    document.getElementById('mode-qualite')?.classList.toggle('hidden-mode', appState.modeActuel !== 'qualite');
    document.getElementById('mode-options')?.classList.toggle('hidden-mode', appState.modeActuel !== 'options');
}

function gererCycleClavier() {
    if (appState.modeActuel === 'essences') basculerModeVisuel('chiffres');
    else if (appState.modeActuel === 'chiffres') basculerModeVisuel('qualite');
    else if (appState.modeActuel === 'qualite') basculerModeVisuel('options');
    else if (appState.modeActuel === 'options') basculerModeVisuel('essences');
}

function mettreAJourBoutonsEssences() {
    const boutons = document.querySelectorAll('#mode-essences .key[data-idx]');
    boutons.forEach(btn => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const nomEssence = LISTE_ESSENCES[appState.pageEssence][idx];
        btn.innerText = nomEssence || " ";
        btn.style.pointerEvents = nomEssence === "" ? "none" : "auto";
        btn.style.fontSize = (nomEssence && nomEssence.length > 3) ? "0.9rem" : "1.3rem";
        btn.style.opacity = nomEssence === "" ? "0.2" : "1";
    });
    const indicator = document.getElementById('ess-page-indicator');
    if (indicator) indicator.innerText = `${appState.pageEssence + 1}/3`;
}

function toucheSuivant() {
    if (!appState.champActif) return;
    const { ess, diam, long, q, plaq } = appState.dataSaisie;

    if (ess && diam && long && q && plaq && callbackValidation) {
        callbackValidation();
        return;
    }
    if (callbackValidation) callbackValidation();
    const suiv = stateActions.calculerSuivant();
    if (suiv) afficherClavier(suiv);
}

function gererActionClavier(action) {
    if (action === 'close') { masquerClavier(); return; }
    if (action === 'cycle') { gererCycleClavier(); return; }
    if (action === 'next') { toucheSuivant(); return; }
    if (action === 'prev-page' || action === 'next-page') {
        stateActions.naviguerPage(action === 'next-page' ? 'suivant' : 'precedent');
        mettreAJourBoutonsEssences();
        return;
    }
    if (action === 'back') {
        if (stateActions.effacer()) document.getElementById(`val-${appState.champActif}`).innerText = appState.dataSaisie[appState.champActif];
        return;
    }
    if (stateActions.taperChiffre(action)) {
        document.getElementById(`val-${appState.champActif}`).innerText = appState.dataSaisie[appState.champActif];
    }
}
