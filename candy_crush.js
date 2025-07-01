document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const movesLeftElement = document.getElementById('moves-left'); // Récupérer l'élément pour les coups
    const restartButton = document.getElementById('restart-button'); // Récupérer le bouton

    // Dimensions de la grille et taille des bonbons (peuvent être ajustées)
    const numRows = 8;
    const numCols = 8;
    const candySize = 50; // en pixels

    // Types de bonbons (maintenant des emojis)
    const candyEmojis = ['🍎', '🍊', '🍓', '🍇', '🍋', '🍉'];
    const CANDY_TYPES_COUNT = candyEmojis.length;


    let grid = []; // Tableau 2D pour représenter la grille logique des bonbons
    let score = 0;

    // Initialisation du style de la grille
    gameBoardElement.style.width = `${numCols * candySize}px`;
    gameBoardElement.style.height = `${numRows * candySize}px`;


    // Fonction pour obtenir un type de bonbon aléatoire (maintenant un emoji)
    function getRandomCandyType() {
        return candyEmojis[Math.floor(Math.random() * CANDY_TYPES_COUNT)];
    }

    // Fonction pour vérifier les alignements à un endroit donné (pour l'initialisation)
    function hasInitialMatch(row, col, type, currentGrid) {
        if (col >= 2 &&
            currentGrid[row][col - 1] && currentGrid[row][col - 1].type === type &&
            currentGrid[row][col - 2] && currentGrid[row][col - 2].type === type) {
            return true;
        }
        if (row >= 2 &&
            currentGrid[row - 1][col] && currentGrid[row - 1][col].type === type &&
            currentGrid[row - 2][col] && currentGrid[row - 2][col].type === type) {
            return true;
        }
        return false;
    }

    // Fonction pour créer la grille logique
    function initializeGridLogic() {
        grid = [];
        for (let r = 0; r < numRows; r++) {
            grid[r] = [];
            for (let c = 0; c < numCols; c++) {
                let candyColor;
                // Choisir un type (emoji) jusqu'à ce qu'il ne crée pas d'alignement initial
                let candyType;
                do {
                    candyType = getRandomCandyType();
                } while (hasInitialMatch(r, c, candyType, grid));

                const candy = {
                    type: candyType, // Stocker l'emoji comme 'type'
                    row: r,
                    col: c,
                    id: `candy-${r}-${c}`,
                    specialType: null // Initialiser specialType
                };
                grid[r][c] = candy;
            }
        }
        console.log("Grille logique initialisée sans matchs initiaux:", grid);
    }

    // Fonction pour afficher la grille initiale (sera développée à l'étape suivante)
    function renderInitialGrid() {
        gameBoardElement.innerHTML = ''; // Vider le plateau de jeu HTML avant de redessiner

        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                const candy = grid[r][c];
                createCandyElement(candy);
            }
        }
        console.log("Grille affichée dans le DOM.");
    }

    // Fonction pour créer un élément DOM pour un bonbon
    function createCandyElement(candy) {
        const candyElement = document.createElement('div');
        candyElement.id = candy.id;
        candyElement.dataset.row = candy.row;
        candyElement.dataset.col = candy.col;
        candyElement.classList.add('candy');
        if (candy.specialType) {
            candyElement.classList.add(candy.specialType);
        }
        candyElement.textContent = candy.type;

        candyElement.style.left = `${candy.col * candySize}px`;
        candyElement.style.top = `${candy.row * candySize}px`;

        gameBoardElement.appendChild(candyElement);
        candy.element = candyElement;
        return candyElement;
    }

    // --- Logique de jeu (sera développée dans les prochaines étapes) ---

    let firstCandySelected = null;
    let secondCandySelected = null;
    let isSwapping = false; // Pour gérer l'état pendant l'animation et la logique de swap

    // Gestionnaire de clic sur les bonbons
    function handleCandyClick(event) {
        if (isSwapping) return; // Ignorer les clics pendant un échange

        const clickedElement = event.target.closest('.candy');
        if (!clickedElement) return; // Clic en dehors d'un bonbon

        // Lire r et c depuis les data-attributes
        const r = parseInt(clickedElement.dataset.row);
        const c = parseInt(clickedElement.dataset.col);

        // Vérifier si r et c sont des nombres valides
        if (isNaN(r) || isNaN(c)) {
            console.error("Impossible de récupérer les coordonnées du bonbon depuis les data-attributes:", clickedElement);
            return;
        }

        const clickedCandy = grid[r][c];

        if (!clickedCandy) {
            console.error(`Aucun bonbon trouvé en grid[${r}][${c}] pour l'élément`, clickedElement);
            // Cela peut arriver si la grille logique n'est pas synchronisée avec le DOM, ou si l'ID/dataset est incorrect.
            return;
        }


        if (!firstCandySelected) {
            firstCandySelected = clickedCandy;
            if (clickedCandy.element) clickedCandy.element.classList.add('selected');
        } else {
            if (firstCandySelected.id === clickedCandy.id) {
                firstCandySelected.element.classList.remove('selected');
                firstCandySelected = null;
                return;
            }

            secondCandySelected = clickedCandy;

            if (areAdjacent(firstCandySelected, secondCandySelected)) {
                attemptSwap();
            } else {
                firstCandySelected.element.classList.remove('selected');
                firstCandySelected = clickedCandy;
                clickedCandy.element.classList.add('selected');
                secondCandySelected = null;
            }
        }
    }

    function areAdjacent(candy1, candy2) {
        const rowDiff = Math.abs(candy1.row - candy2.row);
        const colDiff = Math.abs(candy1.col - candy2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    async function attemptSwap() {
        if (!firstCandySelected || !secondCandySelected || isSwapping) return;

        isSwapping = true;
        if (firstCandySelected.element) firstCandySelected.element.classList.remove('selected');
        if (secondCandySelected.element) secondCandySelected.element.classList.remove('selected');


        await visualSwap(firstCandySelected, secondCandySelected);
        logicalSwap(firstCandySelected, secondCandySelected);

        // TODO: Remplacer par la vraie logique de détection de match
        const matchFound = checkForMatchesAfterSwap(firstCandySelected, secondCandySelected);

        if (matchFound) {
            console.log("Alignement trouvé après swap !");
            // TODO: Lancer la suppression, cascade, etc.
            // La boucle de jeu principale (à venir) gérera la suite et isSwapping.
            // Pour l'instant on ne fait rien de plus, le isSwapping reste true
            // pour simuler que la boucle de jeu prend le contrôle.
            // On réinitialise les sélections car le swap est "consommé".
            firstCandySelected = null;
            secondCandySelected = null;
            // isSwapping = false; // SERA GÉRÉ PAR LA BOUCLE DE JEU
        } else {
            console.log("Aucun alignement, annulation du swap.");
            await visualSwap(firstCandySelected, secondCandySelected); // Re-swap visuel
            logicalSwap(firstCandySelected, secondCandySelected);    // Re-swap logique

            firstCandySelected = null;
            secondCandySelected = null;
            isSwapping = false; // On peut de nouveau interagir
        }
    }

    function visualSwap(candy1, candy2) {
        return new Promise(resolve => {
            if (!candy1.element || !candy2.element) {
                console.error("Éléments DOM manquants pour le swap visuel", candy1, candy2);
                resolve(); // Résoudre pour ne pas bloquer
                return;
            }
            const tempTop1 = candy1.element.style.top;
            const tempLeft1 = candy1.element.style.left;

            candy1.element.style.top = candy2.element.style.top;
            candy1.element.style.left = candy2.element.style.left;

            candy2.element.style.top = tempTop1;
            candy2.element.style.left = tempLeft1;

            setTimeout(() => {
                resolve();
            }, 300); // Durée de la transition CSS
        });
    }

    function logicalSwap(candy1, candy2) {
        grid[candy1.row][candy1.col] = candy2;
        grid[candy2.row][candy2.col] = candy1;

        const tempRow = candy1.row;
        const tempCol = candy1.col;
        candy1.row = candy2.row;
        candy1.col = candy2.col;
        candy2.row = tempRow;
        candy2.col = tempCol;
    }

    // Placeholder pour la vérification des alignements
    // function checkForMatchesAfterSwap(candyA, candyB) { // Ancienne fonction, remplacée par findAllMatches
    //     console.log("Vérification des alignements (placeholder).");
    //     return false;
    // }

    // Fonction principale pour trouver tous les alignements sur la grille et marquer les spéciaux potentiels
    function findAllMatchesAndMarkSpecials() {
        const candiesToRemove = new Set();
        const specialCandiesToCreate = []; // { row, col, type, color, originalCandy }

        // Horizontaux
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols - 2; ) { // c est incrémenté par matchLength
                const candy1 = grid[r][c];
                if (!candy1) { c++; continue; }

                let matchLength = 1;
                // Compter la longueur du match potentiel
                while (c + matchLength < numCols && grid[r][c + matchLength] && grid[r][c + matchLength].type === candy1.type) { // Compare .type
                    matchLength++;
                }

                if (matchLength >= 3) {
                    let specialCreatedInThisMatch = false;
                    let specialCandidate = grid[r][c];
                    // TODO: Affiner la sélection du specialCandidate basé sur swappedCandy1/2

                    if (matchLength >= 4) {
                        specialCandiesToCreate.push({
                            row: specialCandidate.row,
                            col: specialCandidate.col,
                            type: 'striped_v',
                            baseType: specialCandidate.type, // Stocker l'emoji de base
                            originalCandy: specialCandidate
                        });
                        specialCreatedInThisMatch = true;
                    }
                    // TODO: Ajouter logique pour match de 5 (color bomb) et L/T (wrapped)

                    for (let i = 0; i < matchLength; i++) {
                        const currentCandy = grid[r][c + i];
                        if (specialCreatedInThisMatch && currentCandy === specialCandidate && matchLength >=4) {
                            // Ne pas ajouter à la suppression
                        } else {
                            candiesToRemove.add(currentCandy);
                        }
                    }
                }
                c += matchLength > 0 ? matchLength : 1; // Avancer le curseur
            }
        }

        // Verticaux (logique similaire)
        for (let c = 0; c < numCols; c++) {
            for (let r = 0; r < numRows - 2; ) { // r est incrémenté par matchLength
                const candy1 = grid[r][c];
                if (!candy1) { r++; continue; }

                let matchLength = 1;
                while (r + matchLength < numRows && grid[r + matchLength][c] && grid[r + matchLength][c].type === candy1.type) { // Compare .type
                    matchLength++;
                }

                if (matchLength >= 3) {
                    let specialCreatedInThisMatch = false;
                    let specialCandidate = grid[r][c];
                    // TODO: Affiner la sélection du specialCandidate

                    if (matchLength >= 4) {
                        specialCandiesToCreate.push({
                            row: specialCandidate.row,
                            col: specialCandidate.col,
                            type: 'striped_h',
                            baseType: specialCandidate.type, // Stocker l'emoji de base
                            originalCandy: specialCandidate
                        });
                        specialCreatedInThisMatch = true;
                    }
                    // TODO: Ajouter logique pour match de 5 et L/T

                    for (let i = 0; i < matchLength; i++) {
                        const currentCandy = grid[r+i][c];
                        if (specialCreatedInThisMatch && currentCandy === specialCandidate && matchLength >=4) {
                            // Ne pas supprimer
                        } else {
                            candiesToRemove.add(currentCandy);
                        }
                    }
                }
                r += matchLength > 0 ? matchLength : 1;
            }
        }

        // S'assurer que les bonbons qui deviennent spéciaux ne sont pas dans la liste de suppression
        specialCandiesToCreate.forEach(specialInfo => {
            if (candiesToRemove.has(specialInfo.originalCandy)) {
                candiesToRemove.delete(specialInfo.originalCandy);
            }
        });

        return {
            candiesToRemove: Array.from(candiesToRemove),
            specialCandiesToCreate
        };
    }

    // Mettre à jour attemptSwap
    async function attemptSwap() {
        if (!firstCandySelected || !secondCandySelected || isSwapping) return;

        isSwapping = true;
        if (firstCandySelected.element) firstCandySelected.element.classList.remove('selected');
        if (secondCandySelected.element) secondCandySelected.element.classList.remove('selected');

        const candyToSwap1 = firstCandySelected;
        const candyToSwap2 = secondCandySelected;

        firstCandySelected = null;
        secondCandySelected = null;

        await visualSwap(candyToSwap1, candyToSwap2);
        logicalSwap(candyToSwap1, candyToSwap2);

        // Garder une trace de quel bonbon a été le point d'action du joueur pour le swap
        // Cela aidera à décider où un bonbon spécial devrait apparaître.
        // Si candyToSwap1 ou candyToSwap2 fait partie d'un match de 4+, il devrait devenir spécial.
        // Cette info sera passée à findAllMatchesAndMarkSpecials ou utilisée après.
        // Pour l'instant, la logique dans findAllMatchesAndMarkSpecials est simplifiée.

        const matchData = findAllMatchesAndMarkSpecials(); //findAllMatches();

        if (matchData.candiesToRemove.length > 0 || matchData.specialCandiesToCreate.length > 0) {
            console.log("Alignement(s) initial(aux) trouvé(s) après swap !");
            await gameLoopCycle(candyToSwap1, candyToSwap2); // Passer les bonbons swappés
        } else {
            console.log("Aucun alignement après swap, annulation.");
            await visualSwap(candyToSwap1, candyToSwap2);
            logicalSwap(candyToSwap1, candyToSwap2);
            isSwapping = false;
        }
    }

// Durée de l'animation de suppression des bonbons (doit correspondre au CSS)
const MATCH_ANIMATION_DURATION = 300; // ms, correspond à .candy.matched transition

async function dropCandies() {
    console.log("Début de la chute des bonbons.");
    let animationPromises = [];

    for (let c = 0; c < numCols; c++) {
        let emptyRowForColumn = numRows - 1; // Commence à chercher des bonbons à placer depuis la dernière ligne
        for (let r = numRows - 1; r >= 0; r--) {
            if (grid[r][c] !== null) { // Si on trouve un bonbon
                if (r < emptyRowForColumn) { // Et qu'il y a un espace vide en dessous de sa position actuelle ET au dessus ou égal à sa position actuelle
                    const candyToDrop = grid[r][c];

                    // Mise à jour logique
                    grid[emptyRowForColumn][c] = candyToDrop;
                    grid[r][c] = null;
                    candyToDrop.row = emptyRowForColumn;

                    // Animation visuelle
                    if (candyToDrop.element) {
                        const promise = new Promise(resolve => {
                            // Utiliser une fonction nommée pour pouvoir la retirer correctement
                            function onTransitionEnd() {
                                candyToDrop.element.removeEventListener('transitionend', onTransitionEnd);
                                resolve();
                            }
                            candyToDrop.element.addEventListener('transitionend', onTransitionEnd);
                            // Mettre à jour la position top pour l'animation CSS
                            candyToDrop.element.style.top = `${emptyRowForColumn * candySize}px`;
                            // Safety timeout si transitionend ne se déclenche pas (rare, mais possible)
                            setTimeout(() => {
                                // console.warn(`Timeout for candy ${candyToDrop.id}`);
                                onTransitionEnd(); // Forcer la résolution
                            }, 350); // Un peu plus que la durée de transition
                        });
                        animationPromises.push(promise);
                    }
                     emptyRowForColumn--; // Le prochain espace vide pour cette colonne est une ligne au-dessus
                } else { // Pas d'espace vide en dessous de ce bonbon, il est déjà à sa place ou le plus bas possible
                    emptyRowForColumn = r -1; // Le prochain espace vide possible est au-dessus de ce bonbon
                }
            }
        }
    }
    if (animationPromises.length > 0) {
        await Promise.all(animationPromises);
    }
    console.log("Chute des bonbons terminée.");
}

async function fillGrid() {
    console.log("Remplissage de la grille...");
    let newCandyPromises = [];

    for (let c = 0; c < numCols; c++) {
        let newCandiesInColCount = 0;
        for (let r = numRows - 1; r >= 0; r--) {
            if (grid[r][c] === null) {
                newCandiesInColCount++;
                let candyColor = getRandomCandyType();

                const newCandy = {
                    color: candyColor,
                    row: r,
                    col: c,
                    id: `candy-${r}-${c}-new-${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`,
                    type: candyType, // Stocker l'emoji comme 'type'
                    specialType: null
                };
                grid[r][c] = newCandy;

                const candyElement = createCandyElementForFilling(newCandy, newCandiesInColCount);
                newCandy.element = candyElement;

                const promise = new Promise(resolve => {
                    void candyElement.offsetWidth;

                    function onTransitionEnd() {
                        candyElement.removeEventListener('transitionend', onTransitionEnd);
                        resolve();
                    }
                    candyElement.addEventListener('transitionend', onTransitionEnd);

                    candyElement.style.top = `${r * candySize}px`;

                    setTimeout(() => {
                        onTransitionEnd();
                    }, 350);
                });
                newCandyPromises.push(promise);
            }
        }
    }
    if (newCandyPromises.length > 0) {
        await Promise.all(newCandyPromises);
    }
    console.log("Grille remplie.");
}

function createCandyElementForFilling(candy, dropOffsetFactor) {
    const candyElement = document.createElement('div');
    candyElement.id = candy.id;
    candyElement.classList.add('candy', `candy-${candy.color}`);
    // Si le bonbon a un type spécial, ajouter la classe correspondante
    if (candy.specialType) {
        candyElement.classList.add(candy.specialType); // ex: 'striped-h' ou 'striped-v'
    }

    candyElement.style.left = `${candy.col * candySize}px`;
    candyElement.style.top = `-${dropOffsetFactor * candySize * 0.5}px`;

    gameBoardElement.appendChild(candyElement);
    return candyElement;
}

// Boucle principale pour gérer les matchs, la chute, et le remplissage en cascade
async function gameLoopCycle(swappedCandy1, swappedCandy2) { // Ajout des bonbons swappés comme paramètres
    let matchesFoundThisCycle;
    let iterationCount = 0;
    const MAX_CASCADE_ITERATIONS = 10;

    do {
        iterationCount++;
        if (iterationCount > MAX_CASCADE_ITERATIONS) {
            console.error("Nombre maximum d'itérations de cascade atteint.");
            isSwapping = false;
            return;
        }

        // 1. Détecter les matchs au début de ce cycle de cascade
        const matchData = (iterationCount === 1) ?
                          findAllMatchesAndMarkSpecials(swappedCandy1, swappedCandy2, true) :
                          findAllMatchesAndMarkSpecials(null, null, false);

        let candiesToRemoveFromMatches = matchData.candiesToRemove;
        const specialCandiesToCreate = matchData.specialCandiesToCreate;

        // La condition pour continuer est si des matchs ont été trouvés OU des spéciaux doivent être créés
        continueCascading = candiesToRemoveFromMatches.length > 0 || specialCandiesToCreate.length > 0;

        if (continueCascading) {
            console.log(`Cycle de cascade ${iterationCount}: ${candiesToRemoveFromMatches.length} à suppr (matchs), ${specialCandiesToCreate.length} à créer.`);

            let allCandiesToProcessForRemoval = new Set(candiesToRemoveFromMatches);
            let activatedSpecialsThisIteration = new Set();
            let pointsFromThisCycle = 0;

            // Boucle pour gérer l'activation en chaîne des spéciaux
            let newActivationsFoundInLoop;
            do {
                newActivationsFoundInLoop = false;
                let newlyAffectedByActivation = [];
                // On itère sur une copie car allCandiesToProcessForRemoval peut être modifié
                let candidatesForActivation = [...allCandiesToProcessForRemoval, ...specialCandiesToCreate.map(s => s.originalCandy)];


                for (const candy of candidatesForActivation) {
                    if (candy && candy.specialType && !activatedSpecialsThisIteration.has(candy)) {
                        console.log(`Activation du bonbon spécial: ${candy.id} de type ${candy.specialType}`);
                        activatedSpecialsThisIteration.add(candy);
                        allCandiesToProcessForRemoval.add(candy);

                        if (candy.specialType === 'striped_h') {
                            for (let c_idx = 0; c_idx < numCols; c_idx++) {
                                const targetCandy = grid[candy.row][c_idx];
                                if (targetCandy && !allCandiesToProcessForRemoval.has(targetCandy)) {
                                    newlyAffectedByActivation.push(targetCandy);
                                    newActivationsFoundInLoop = true;
                                }
                            }
                        } else if (candy.specialType === 'striped_v') {
                            for (let r_idx = 0; r_idx < numRows; r_idx++) {
                                const targetCandy = grid[r_idx][candy.col];
                                if (targetCandy && !allCandiesToProcessForRemoval.has(targetCandy)) {
                                    newlyAffectedByActivation.push(targetCandy);
                                    newActivationsFoundInLoop = true;
                                }
                            }
                        }
                        candy.specialType = null;
                        if(candy.element) {
                            candy.element.classList.remove('striped_h', 'striped_v');
                        }
                    }
                }
                newlyAffectedByActivation.forEach(c => allCandiesToProcessForRemoval.add(c));
            } while (newActivationsFoundInLoop);
            // Fin de la logique d'activation des spéciaux

            // Début de la création des nouveaux spéciaux
            specialCandiesToCreate.forEach(specialInfo => {
                const { row, col, type, baseType, originalCandy } = specialInfo;
                if (allCandiesToProcessForRemoval.has(originalCandy) && !activatedSpecialsThisIteration.has(originalCandy)) {
                     console.log(`Le bonbon ${originalCandy.id} (${originalCandy.type}) devait devenir ${type} mais il est emporté par un autre effet.`);
                } else if (!activatedSpecialsThisIteration.has(originalCandy)) {
                    originalCandy.specialType = type;
                    originalCandy.type = baseType;
                    if (originalCandy.element) {
                        originalCandy.element.className = '';
                        originalCandy.element.classList.add('candy', type);
                        originalCandy.element.textContent = originalCandy.type;
                    }
                    // Si le bonbon devient spécial, il n'est pas "supprimé" par le match qui l'a créé directement.
                    // Il est retiré de allCandiesToProcessForRemoval s'il y était uniquement à cause du match simple.
                    if (candiesToRemoveFromMatches.includes(originalCandy)) {
                       allCandiesToProcessForRemoval.delete(originalCandy);
                    }
                    pointsFromThisCycle += 10; // Point pour la création du spécial
                    console.log(`Bonbon spécial ${type} avec base ${baseType} créé à ${row},${col}`);
                }
            });
            // Fin de la création des nouveaux spéciaux

            // Recalculer les points pour les bonbons effectivement retirés
            allCandiesToProcessForRemoval.forEach(candy => {
                const isTransformedAndStays = specialCandiesToCreate.some(sci => sci.originalCandy === candy && !activatedSpecialsThisIteration.has(sci.originalCandy));
                if (!isTransformedAndStays) { // Ne pas recompter les points pour un bonbon qui devient spécial
                    pointsFromThisCycle += 10;
                }
            });


            if (pointsFromThisCycle > 0) {
                 score += pointsFromThisCycle;
                 scoreElement.textContent = score;
                 console.log(`Score pour ce cycle: ${pointsFromThisCycle}. Nouveau score global: ${score}`);
            }

            // Animation et suppression
            allCandiesToProcessForRemoval.forEach(candy => {
                // Ne pas animer comme 'matched' un bonbon qui vient d'être transformé en spécial et qui reste
                const isNowSpecialAndStays = specialCandiesToCreate.some(sci => sci.originalCandy === candy && !activatedSpecialsThisIteration.has(sci.originalCandy) );
                if (candy.element && !isNowSpecialAndStays) {
                     candy.element.classList.add('matched');
                }
            });

            await new Promise(resolve => setTimeout(resolve, MATCH_ANIMATION_DURATION));

            allCandiesToProcessForRemoval.forEach(candy => {
                // Ne pas supprimer un bonbon qui vient d'être transformé en spécial et qui reste
                const isNowSpecialAndStays = specialCandiesToCreate.some(sci => sci.originalCandy === candy && !activatedSpecialsThisIteration.has(sci.originalCandy));
                if (!isNowSpecialAndStays) {
                    if (candy.element) candy.element.remove();
                    if (grid[candy.row] && grid[candy.row][candy.col] === candy) {
                        grid[candy.row][candy.col] = null;
                    }
                }
            });

            await dropCandies();
            await fillGrid();

            console.log(`Fin du cycle de cascade ${iterationCount}. Vérification pour prochaine cascade...`);
        }
    } while (continueCascading);

    console.log("Plus de matchs trouvés après toutes les cascades. Le jeu est stable.");
    isSwapping = false;
}


    // Initialiser le jeu
    function startGame() {
        score = 0;
        scoreElement.textContent = score;
        movesLeftElement.textContent = "--"; // Initialiser l'affichage des coups

        initializeGridLogic();
        renderInitialGrid();

        // Le listener pour handleCandyClick est attaché une seule fois ci-dessous
        // pour éviter les duplications lors des redémarrages.

        isSwapping = false;
        console.log("Nouvelle partie démarrée !");
    }

    // Attacher les gestionnaires d'événements une seule fois au chargement du DOM
    gameBoardElement.addEventListener('click', handleCandyClick);
    restartButton.addEventListener('click', startGame);

    // Démarrer le jeu au chargement initial
    startGame();

});

console.log("candy_crush.js chargé");
