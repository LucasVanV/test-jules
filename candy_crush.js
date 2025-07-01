document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const movesLeftElement = document.getElementById('moves-left'); // Récupérer l'élément pour les coups
    const restartButton = document.getElementById('restart-button'); // Récupérer le bouton

    // Dimensions de la grille et taille des bonbons (peuvent être ajustées)
    const numRows = 8;
    const numCols = 8;
    const candySize = 50; // en pixels

    // Types de bonbons (couleurs pour l'instant)
    const candyColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

    let grid = []; // Tableau 2D pour représenter la grille logique des bonbons
    let score = 0;

    // Initialisation du style de la grille
    gameBoardElement.style.width = `${numCols * candySize}px`;
    gameBoardElement.style.height = `${numRows * candySize}px`;


    // Fonction pour obtenir un type de bonbon aléatoire
    function getRandomCandyType() {
        return candyColors[Math.floor(Math.random() * candyColors.length)];
    }

    // Fonction pour vérifier les alignements à un endroit donné (pour l'initialisation)
    // Retourne true s'il y a un alignement de 3 avec le nouveau bonbon, false sinon.
    function hasInitialMatch(row, col, color, currentGrid) {
        // Vérification horizontale: le nouveau bonbon (currentGrid[row][col]) forme-t-il un trio avec les deux à sa gauche ?
        if (col >= 2 &&
            currentGrid[row][col - 1] && currentGrid[row][col - 1].color === color &&
            currentGrid[row][col - 2] && currentGrid[row][col - 2].color === color) {
            return true;
        }

        // Vérification verticale: le nouveau bonbon forme-t-il un trio avec les deux au-dessus ?
        if (row >= 2 &&
            currentGrid[row - 1][col] && currentGrid[row - 1][col].color === color &&
            currentGrid[row - 2][col] && currentGrid[row - 2][col].color === color) {
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
                // Choisir une couleur jusqu'à ce qu'elle ne crée pas d'alignement initial
                do {
                    candyColor = getRandomCandyType();
                } while (hasInitialMatch(r, c, candyColor, grid));

                const candy = {
                    color: candyColor,
                    row: r, // Position logique
                    col: c, // Position logique
                    id: `candy-${r}-${c}`, // ID unique pour l'élément DOM
                    // element: null // Référence à l'élément DOM, sera ajoutée lors du rendu
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
        candyElement.classList.add('candy', `candy-${candy.color}`);
        // Positionner le bonbon en utilisant ses coordonnées de grille et la taille du bonbon
        candyElement.style.left = `${candy.col * candySize}px`;
        candyElement.style.top = `${candy.row * candySize}px`;
        // On pourrait ajouter un texte ou une image ici si on ne voulait pas juste des couleurs
        // candyElement.textContent = candy.color[0].toUpperCase();

        gameBoardElement.appendChild(candyElement);
        // On peut stocker la référence à l'élément DOM dans l'objet candy pour un accès facile plus tard
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

        // Retrouver l'objet bonbon logique à partir de l'ID de l'élément
        // L'objet candy est stocké sur l'élément lors de sa création (candy.element = candyElement)
        // Et l'élément est dans grid[r][c].element
        // On peut aussi retrouver r, c depuis l'id si on ne stocke pas la ref à l'objet logique sur l'élément
        const [prefix, rStr, cStr] = clickedElement.id.split('-');
        const r = parseInt(rStr);
        const c = parseInt(cStr);
        const clickedCandy = grid[r][c]; // Accès direct à l'objet bonbon logique

        if (!firstCandySelected) {
            firstCandySelected = clickedCandy;
            clickedCandy.element.classList.add('selected'); // Utiliser la réf stockée
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
                while (c + matchLength < numCols && grid[r][c + matchLength] && grid[r][c + matchLength].color === candy1.color) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    let specialCreatedInThisMatch = false;
                    // Logique pour décider quel bonbon devient spécial (celui cliqué/swappé)
                    // Pour l'instant, on prend le premier du segment de 4 ou 5.
                    // Ou, si un des bonbons swappés est dans ce match, c'est lui qui devient spécial.
                    // Cette logique sera affinée. Pour l'instant, on prend le premier bonbon de l'alignement.
                    let specialCandidate = grid[r][c];

                    if (matchLength >= 4) { // Condition pour bonbon rayé
                        specialCandiesToCreate.push({
                            row: specialCandidate.row,
                            col: specialCandidate.col,
                            type: 'striped_v', // Match H -> Rayure V
                            color: specialCandidate.color,
                            originalCandy: specialCandidate
                        });
                        specialCreatedInThisMatch = true;
                    }
                    // TODO: Ajouter logique pour match de 5 (color bomb) et L/T (wrapped)

                    for (let i = 0; i < matchLength; i++) {
                        const currentCandy = grid[r][c + i];
                        if (specialCreatedInThisMatch && currentCandy === specialCandidate && matchLength >=4) {
                            // Ne pas ajouter à la suppression si c'est le bonbon qui devient spécial
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
                while (r + matchLength < numRows && grid[r + matchLength][c] && grid[r + matchLength][c].color === candy1.color) {
                    matchLength++;
                }

                if (matchLength >= 3) {
                    let specialCreatedInThisMatch = false;
                    let specialCandidate = grid[r][c];

                    if (matchLength >= 4) {
                        specialCandiesToCreate.push({
                            row: specialCandidate.row,
                            col: specialCandidate.col,
                            type: 'striped_h', // Match V -> Rayure H
                            color: specialCandidate.color,
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
                    specialType: null // Les nouveaux bonbons ne sont pas spéciaux par défaut
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

        const matchData = findAllMatchesAndMarkSpecials(swappedCandy1, swappedCandy2, iterationCount === 1);
        let candiesToRemoveFromMatches = matchData.candiesToRemove;
        const specialCandiesToCreate = matchData.specialCandiesToCreate;

        let allCandiesToProcessForRemoval = new Set(candiesToRemoveFromMatches);
        let activatedSpecialsThisIteration = new Set();
        let pointsFromThisCycle = 0;

        // Boucle pour gérer l'activation en chaîne des spéciaux
        let newActivationsFoundInLoop;
        do {
            newActivationsFoundInLoop = false;
            let newlyAffectedByActivation = [];

            let candidatesForActivation = [...allCandiesToProcessForRemoval, ...specialCandiesToCreate.map(s => s.originalCandy)];

            for (const candy of candidatesForActivation) {
                if (candy && candy.specialType && !activatedSpecialsThisIteration.has(candy)) {
                    console.log(`Activation du bonbon spécial: ${candy.id} de type ${candy.specialType}`);
                    activatedSpecialsThisIteration.add(candy);
                    allCandiesToProcessForRemoval.add(candy);

                    if (candy.specialType === 'striped_h') {
                        for (let c = 0; c < numCols; c++) {
                            const targetCandy = grid[candy.row][c];
                            if (targetCandy && !allCandiesToProcessForRemoval.has(targetCandy)) {
                                newlyAffectedByActivation.push(targetCandy);
                                newActivationsFoundInLoop = true; // Marquer qu'une activation a eu lieu
                            }
                        }
                    } else if (candy.specialType === 'striped_v') {
                        for (let r = 0; r < numRows; r++) {
                            const targetCandy = grid[r][candy.col];
                            if (targetCandy && !allCandiesToProcessForRemoval.has(targetCandy)) {
                                newlyAffectedByActivation.push(targetCandy);
                                newActivationsFoundInLoop = true; // Marquer qu'une activation a eu lieu
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


        // Créer les nouveaux bonbons spéciaux (ceux formés par des matchs de 4, etc.)
        specialCandiesToCreate.forEach(specialInfo => {
            const { row, col, type, originalCandy } = specialInfo;
            if (allCandiesToProcessForRemoval.has(originalCandy) && !activatedSpecialsThisIteration.has(originalCandy)) {
                 console.log(`Le bonbon ${originalCandy.id} devait devenir ${type} mais il est emporté par un effet.`);
            } else if (!activatedSpecialsThisIteration.has(originalCandy)) {
                originalCandy.specialType = type;
                if (originalCandy.element) {
                    originalCandy.element.className = '';
                    originalCandy.element.classList.add('candy', `candy-${originalCandy.color}`, type);
                }
                // S'il devient spécial, il n'est pas "supprimé" par le match qui l'a créé.
                // Il faut le retirer de allCandiesToProcessForRemoval s'il y était à cause du match simple.
                if (candiesToRemoveFromMatches.includes(originalCandy)) {
                   allCandiesToProcessForRemoval.delete(originalCandy);
                }
                pointsFromThisCycle += 10;
                console.log(`Bonbon spécial ${type} créé à ${row},${col} (était ${originalCandy.id})`);
            }
        });

        matchesFoundThisCycle = allCandiesToProcessForRemoval.size > 0;

        if (matchesFoundThisCycle) {
            // Calcul du score basé sur TOUS les bonbons retirés.
            // Ceux qui sont devenus spéciaux ont déjà contribué 10 points.
            // Les autres (dans allCandiesToProcessForRemoval qui ne sont pas devenus spéciaux) rapportent 10 points.
            allCandiesToProcessForRemoval.forEach(candy => {
                const wasTransformedAndKept = specialCandiesToCreate.some(sci => sci.originalCandy === candy && sci.originalCandy.specialType !== null);
                if (!wasTransformedAndKept) {
                    pointsFromThisCycle += 10;
                }
            });
            // Note: la duplication potentielle de points (10 pour création + 10 pour suppression si pas géré) est à surveiller.
            // La logique ci-dessus tente de l'éviter : un bonbon transformé ne donne pas de points de suppression.
            // Un bonbon activé donne ses points de suppression.

            if (pointsFromThisCycle > 0) {
                 score += pointsFromThisCycle;
                 scoreElement.textContent = score;
                 console.log(`Score total pour ce cycle: ${pointsFromThisCycle}. Nouveau score global: ${score}`);
            }

            // Animer et supprimer TOUS les bonbons identifiés pour suppression effective
            allCandiesToProcessForRemoval.forEach(candy => {
                const isNowSpecialAndStays = specialCandiesToCreate.some(sci => sci.originalCandy === candy && sci.originalCandy.specialType !== null);
                if (candy.element && !isNowSpecialAndStays) { // Ne pas appliquer .matched à un bonbon qui vient d'être transformé et reste
                     candy.element.classList.add('matched');
                }
            });

            await new Promise(resolve => setTimeout(resolve, MATCH_ANIMATION_DURATION));

            allCandiesToProcessForRemoval.forEach(candy => {
                const isNowSpecialAndStays = specialCandiesToCreate.some(sci => sci.originalCandy === candy && sci.originalCandy.specialType !== null);
                if (!isNowSpecialAndStays) {
                    if (candy.element) candy.element.remove();
                    if (grid[candy.row] && grid[candy.row][candy.col] === candy) {
                        grid[candy.row][candy.col] = null;
                    }
                }
            });

            await dropCandies();
            await fillGrid();

            console.log("Cycle de match/activation/chute/remplissage terminé. Vérification de nouveaux matchs...");
        }
    } while (matchesFoundThisCycle);

    console.log("Plus de matchs trouvés après les cascades.");
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
