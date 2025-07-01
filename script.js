// Logique du jeu de billard
console.log("Script.js chargé");

const canvas = document.getElementById('billardCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');

// Dimensions du canvas
canvas.width = 800;
canvas.height = 400;

// Couleurs
const TABLE_COLOR = 'darkgreen';
const BORDER_COLOR = 'saddlebrown';
const BALL_RADIUS = 10;
const POCKET_RADIUS = 15; // Utilisé pour la détection d'empochage
const BORDER_WIDTH = 20; // Épaisseur visuelle de la bordure
const POCKET_VISUAL_RADIUS = 18; // Rayon visuel du trou, légèrement plus grand pour un meilleur effet

// Propriétés des boules
let balls = [];
let cueBall = { x: canvas.width / 4, y: canvas.height / 2, radius: BALL_RADIUS, color: 'white', vx: 0, vy: 0, isCueBall: true };

// État du jeu
let gameStarted = false;
let currentPlayer = 1;
let shotTaken = false;
let turnEvaluated = true; // Au début, on considère le "tour" comme évalué pour permettre le premier tir
let ballsPocketedThisShot = { cueBall: false, objectBalls: 0 };
let objectBallsCount = 0; // Sera initialisé dans setupBalls

// Variable globale pour les messages à l'écran
let gameMessage = { text: "", timeLeft: 0 };
const MESSAGE_DISPLAY_TIME = 120; // en frames (environ 2 secondes à 60fps)


// Les trous (poches) - Ajustés pour BORDER_WIDTH
const pockets = [
    { x: BORDER_WIDTH, y: BORDER_WIDTH },                                          // Coin haut-gauche
    { x: canvas.width / 2, y: BORDER_WIDTH },                                    // Milieu haut
    { x: canvas.width - BORDER_WIDTH, y: BORDER_WIDTH },                          // Coin haut-droite
    { x: BORDER_WIDTH, y: canvas.height - BORDER_WIDTH },                          // Coin bas-gauche
    { x: canvas.width / 2, y: canvas.height - BORDER_WIDTH },                    // Milieu bas
    { x: canvas.width - BORDER_WIDTH, y: canvas.height - BORDER_WIDTH }           // Coin bas-droite
];

function drawTable() {
    // Surface de jeu (tapis vert)
    ctx.fillStyle = TABLE_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bordures marron
    ctx.fillStyle = BORDER_COLOR;
    // Bande supérieure
    ctx.fillRect(0, 0, canvas.width, BORDER_WIDTH);
    // Bande inférieure
    ctx.fillRect(0, canvas.height - BORDER_WIDTH, canvas.width, BORDER_WIDTH);
    // Bande gauche (attention à ne pas recouvrir les coins déjà faits par les bandes H)
    ctx.fillRect(0, BORDER_WIDTH, BORDER_WIDTH, canvas.height - 2 * BORDER_WIDTH);
    // Bande droite
    ctx.fillRect(canvas.width - BORDER_WIDTH, BORDER_WIDTH, BORDER_WIDTH, canvas.height - 2 * BORDER_WIDTH);

    // Trous noirs par-dessus
    ctx.fillStyle = 'black';
    pockets.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_VISUAL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

function drawBalls() {
    balls.forEach(drawBall);
}

function updateBallPosition(ball) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.99; // Friction
    ball.vy *= 0.99; // Friction
    if (Math.abs(ball.vx) < 0.05) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.05) ball.vy = 0;
}

function handleWallCollision(ball) {
    // Les collisions avec les murs doivent maintenant prendre en compte BORDER_WIDTH
    // et le fait que la zone de jeu commence après BORDER_WIDTH.
    const playAreaX_start = BORDER_WIDTH;
    const playAreaX_end = canvas.width - BORDER_WIDTH;
    const playAreaY_start = BORDER_WIDTH;
    const playAreaY_end = canvas.height - BORDER_WIDTH;

    // Collision avec les murs verticaux (gauche/droite)
    if (ball.x + ball.radius > playAreaX_end) {
        ball.vx *= -1;
        ball.x = playAreaX_end - ball.radius;
    } else if (ball.x - ball.radius < playAreaX_start) {
        ball.vx *= -1;
        ball.x = playAreaX_start + ball.radius;
    }

    // Collision avec les murs horizontaux (haut/bas)
    if (ball.y + ball.radius > playAreaY_end) {
        ball.vy *= -1;
        ball.y = playAreaY_end - ball.radius;
    } else if (ball.y - ball.radius < playAreaY_start) {
        ball.vy *= -1;
        ball.y = playAreaY_start + ball.radius;
    }
}

function handleBallCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball1.radius + ball2.radius) {
        const nx = dx / distance;
        const ny = dy / distance;
        const tx = -ny;
        const ty = nx;
        const dpTan1 = ball1.vx * tx + ball1.vy * ty;
        const dpTan2 = ball2.vx * tx + ball2.vy * ty;
        const dpNorm1 = ball1.vx * nx + ball1.vy * ny;
        const dpNorm2 = ball2.vx * nx + ball2.vy * ny;
        const m1 = dpNorm2;
        const m2 = dpNorm1;
        ball1.vx = tx * dpTan1 + nx * m1;
        ball1.vy = ty * dpTan1 + ny * m1;
        ball2.vx = tx * dpTan2 + nx * m2;
        ball2.vy = ty * dpTan2 + ny * m2;

        const overlap = ball1.radius + ball2.radius - distance + 0.1; // 0.1 pour eviter le "sticky"
        ball1.x -= (overlap / 2) * nx;
        ball1.y -= (overlap / 2) * ny;
        ball2.x += (overlap / 2) * nx;
        ball2.y += (overlap / 2) * ny;
    }
}

function isBallPocketed(ball) {
    for (const pocket of pockets) {
        const dx = pocket.x - ball.x;
        const dy = pocket.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Utiliser POCKET_RADIUS pour la détection logique, POCKET_VISUAL_RADIUS est pour l'affichage
        if (distance < POCKET_RADIUS + ball.radius * 0.5) { // On peut affiner la zone de détection
            return true;
        }
    }
    return false;
}

function handleCueBallPocketed() {
    console.log(`Joueur ${currentPlayer} a empoché la blanche ! Faute.`);
    ballsPocketedThisShot.cueBall = true;
    cueBall.x = canvas.width / 4; // Replace cue ball
    cueBall.y = canvas.height / 2;
    cueBall.vx = 0;
    cueBall.vy = 0;
    // Ensure cueball is in balls array if it was removed (it shouldn't be removed by splice if handled correctly)
    if (!balls.some(b => b.isCueBall)) { // .some est plus performant si on cherche juste l'existence
        balls.push(cueBall); // La remettre si elle a disparu par erreur
    }
}

function handleObjectBallPocketed(ball, index) {
    console.log(`Joueur ${currentPlayer} a empoché une boule ${ball.color}.`);
    balls.splice(index, 1);
    ballsPocketedThisShot.objectBalls++;
}

function areBallsMoving() {
    return balls.some(b => b.vx !== 0 || b.vy !== 0);
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    console.log(`C'est au tour de Joueur ${currentPlayer}.`);
    gameMessage.text = `Au tour de Joueur ${currentPlayer}`;
    gameMessage.timeLeft = MESSAGE_DISPLAY_TIME;
}

function evaluateTurn() {
    if (turnEvaluated) return; // Évite les évaluations multiples pour un même coup

    console.log("Évaluation du tour...");
    turnEvaluated = true; // Marquer comme évalué pour ce coup

    if (ballsPocketedThisShot.cueBall) {
        console.log("Faute (blanche empochée). Changement de joueur.");
        gameMessage.text = "Faute ! Boule blanche empochée.";
        gameMessage.timeLeft = MESSAGE_DISPLAY_TIME;
        // switchPlayer sera appelé et affichera "Au tour de Joueur X" après ce message,
        // mais on peut le forcer ici pour que le message de faute soit le dernier avant le changement.
        const previousPlayer = currentPlayer; // Garder une trace pour le message
        switchPlayer();
        gameMessage.text = `Faute Joueur ${previousPlayer}! Au tour de Joueur ${currentPlayer}.`; // Message plus précis
        gameMessage.timeLeft = MESSAGE_DISPLAY_TIME * 1.5; // Un peu plus longtemps

    } else if (ballsPocketedThisShot.objectBalls > 0) {
        console.log("Boule(s) de couleur empochée(s). Joueur " + currentPlayer + " rejoue.");
        gameMessage.text = `Joueur ${currentPlayer} rejoue !`;
        gameMessage.timeLeft = MESSAGE_DISPLAY_TIME;
        // Le joueur rejoue, donc on ne change pas de joueur.
    } else {
        console.log("Aucune boule empochée. Changement de joueur.");
        // Message avant de changer de joueur pour qu'il soit pertinent
        gameMessage.text = `Aucune boule empochée. Au tour de Joueur ${currentPlayer === 1 ? 2 : 1}.`;
        gameMessage.timeLeft = MESSAGE_DISPLAY_TIME;
        switchPlayer(); // switchPlayer mettra à jour le message pour le nouveau joueur si besoin, mais celui-ci est plus contextuel.
    }
    shotTaken = false; // Permet au joueur (actuel ou suivant) de tirer.
    ballsPocketedThisShot = { cueBall: false, objectBalls: 0 }; // Réinitialiser pour le prochain coup.
}


function displayWinMessage() {
    gameMessage.timeLeft = 0; // Cacher les autres messages de jeu
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.fillStyle = "gold";
    ctx.textAlign = "center";
    const winnerText = `Joueur ${currentPlayer} a gagné !`;
    ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial, sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("Toutes les boules ont été empochées.", canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Cliquez sur 'Commencer' pour rejouer.", canvas.width / 2, canvas.height / 2 + 50);
    ctx.restore();
    gameStarted = false;
}

function gameLoop() {
    // La boucle tourne toujours pour l'animation et les messages.
    // La logique de jeu (mouvement des boules, etc.) est conditionnée par gameStarted.

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTable();

    if (gameStarted) {
        for (let i = balls.length - 1; i >= 0; i--) {
            updateBallPosition(balls[i]);
            handleWallCollision(balls[i]);

            for (let j = i - 1; j >= 0; j--) {
                handleBallCollision(balls[i], balls[j]);
            }

            if (isBallPocketed(balls[i])) {
                if (balls[i].isCueBall) {
                    handleCueBallPocketed();
                } else {
                    handleObjectBallPocketed(balls[i], i);
                }
            }
        }

        if (shotTaken && !areBallsMoving() && !turnEvaluated) {
            evaluateTurn();
        }

        const currentObjectBalls = balls.filter(b => !b.isCueBall).length;
        if (objectBallsCount > 0 && currentObjectBalls === 0) { // Vérifier si toutes les boules de couleur sont empochées
            displayWinMessage();
        }
    } else {
        // Si le jeu n'a pas commencé (ex: écran de titre ou après victoire), on dessine quand même les boules pour l'init.
        // Cela peut être affiné. Si un message de victoire est affiché, on ne veut pas redessiner les boules par-dessus.
        // La logique de displayWinMessage dessine un overlay, donc c'est ok.
    }


    drawBalls(); // Toujours dessiner les boules
    if (gameStarted && isAiming) { // Dessiner la ligne de visée seulement si le jeu est en cours et on vise
        drawAimLine();
    }

    // Afficher le joueur actuel et les messages
    if (gameStarted) {
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Joueur Actuel: ${currentPlayer}`, 20, canvas.height - 20);
        const objectBallsLeft = balls.filter(b => !b.isCueBall).length;
        ctx.fillText(`Boules de couleur restantes: ${objectBallsLeft}`, canvas.width - 250, canvas.height - 20);

    }

    // Afficher les messages de jeu (même si gameStarted est false, pour le message de victoire)
    if (gameMessage.timeLeft > 0) {
        ctx.save();
        ctx.font = "bold 20px Arial";
        // Choisir une couleur de message qui se démarque
        let messageColor = "rgba(255, 255, 100, 0.95)"; // Jaune pour info
        if (gameMessage.text.toLowerCase().includes("faute")) {
            messageColor = "rgba(255, 100, 100, 0.95)"; // Rougeâtre pour faute
        } else if (gameMessage.text.toLowerCase().includes("rejoue")) {
            messageColor = "rgba(100, 255, 100, 0.95)"; // Verdâtre pour rejouer
        }
        ctx.fillStyle = messageColor;
        ctx.textAlign = "center";
        // Calculer la largeur du texte pour un meilleur placement ou un fond
        // const textWidth = ctx.measureText(gameMessage.text).width;
        // ctx.fillRect(canvas.width / 2 - textWidth / 2 - 10, 10, textWidth + 20, 30); // Fond optionnel
        ctx.fillText(gameMessage.text, canvas.width / 2, 30);
        ctx.restore();
        gameMessage.timeLeft--;
        if (gameMessage.timeLeft === 0 && gameMessage.text.includes("Faute Joueur")) {
            // Après un message de faute long, afficher le message standard du joueur suivant
             if (gameStarted) { // Seulement si le jeu est toujours en cours
                gameMessage.text = `Au tour de Joueur ${currentPlayer}`;
                gameMessage.timeLeft = MESSAGE_DISPLAY_TIME / 2; // Plus court
             }
        }
    }


    requestAnimationFrame(gameLoop);
}

function setupBalls() {
    balls = [];
    // Réinitialiser la boule blanche
    cueBall = { x: canvas.width / 4, y: canvas.height / 2, radius: BALL_RADIUS, color: 'white', vx: 0, vy: 0, isCueBall: true };
    balls.push(cueBall);

    const initialObjectBallsSetup = [
        // Ligne 1 (pointe du triangle)
        { x: canvas.width * 0.65, y: canvas.height / 2, color: 'yellow', isCueBall: false }, // Jaune (1) souvent en pointe
        // Ligne 2
        { x: canvas.width * 0.65 + BALL_RADIUS * 2 * 0.866, y: canvas.height / 2 - BALL_RADIUS, color: 'blue', isCueBall: false }, // Bleu (2)
        { x: canvas.width * 0.65 + BALL_RADIUS * 2 * 0.866, y: canvas.height / 2 + BALL_RADIUS, color: 'red', isCueBall: false },  // Rouge (3)
        // Ligne 3
        { x: canvas.width * 0.65 + BALL_RADIUS * 4 * 0.866, y: canvas.height / 2 - BALL_RADIUS * 2, color: 'purple', isCueBall: false }, // Violet (4)
        // { x: canvas.width * 0.65 + BALL_RADIUS * 4 * 0.866, y: canvas.height / 2, color: 'black', isCueBall: false }, // NOIRE (8) au centre de la 3e ligne pour jeu de la 8
        { x: canvas.width * 0.65 + BALL_RADIUS * 4 * 0.866, y: canvas.height / 2, color: 'orange', isCueBall: false }, // Orange (5) si pas la noire
        { x: canvas.width * 0.65 + BALL_RADIUS * 4 * 0.866, y: canvas.height / 2 + BALL_RADIUS * 2, color: 'green', isCueBall: false }, // Vert (6)
    ];

    initialObjectBallsSetup.forEach(setup => {
        balls.push({ ...setup, vx: 0, vy: 0, radius: BALL_RADIUS });
    });
    objectBallsCount = initialObjectBallsSetup.length;
    console.log("Nombre initial de boules de couleur: ", objectBallsCount);
}

function init() {
    console.log("Initialisation du jeu...");
    gameStarted = true;
    currentPlayer = 1;
    shotTaken = false;
    turnEvaluated = true; // Prêt pour le premier tir
    ballsPocketedThisShot = { cueBall: false, objectBalls: 0 };

    // Réinitialiser la position de la boule blanche au centre de sa zone de départ
    cueBall.x = canvas.width / 4; // Position de départ standard
    cueBall.y = canvas.height / 2;
    cueBall.vx = 0;
    cueBall.vy = 0;

    setupBalls(); // Place la blanche et les autres boules

    gameMessage.text = `Joueur ${currentPlayer} commence !`;
    gameMessage.timeLeft = MESSAGE_DISPLAY_TIME;
    console.log(`Nouvelle partie ! C'est au tour de Joueur ${currentPlayer}.`);
}

startButton.addEventListener('click', () => {
    init();
});

// Appel initial pour dessiner la table et les boules au chargement.
// La boucle gameLoop() est démarrée à la fin du script et tourne en continu.
// Elle dessinera l'état initial basé sur gameStarted = false au début.
// init() n'est appelé que par le bouton "Commencer".

// Pour le tout premier affichage avant que "Commencer" ne soit cliqué :
// On s'assure que les boules sont configurées pour être dessinées par gameLoop.
// Mais init() n'est pas appelé, donc gameStarted reste false.
setupBalls(); // Configure les positions initiales des boules.
// gameLoop s'occupera du premier dessin.


// --- Section pour les contrôles du joueur ---
let isAiming = false;
let aimLine = { x1: 0, y1: 0, x2: 0, y2: 0 };
const MAX_POWER = 15;

function drawAimLine() {
    if (!isAiming || !cueBall || !gameStarted || areBallsMoving() || shotTaken) return;

    ctx.beginPath();
    ctx.moveTo(aimLine.x1, aimLine.y1);
    ctx.lineTo(aimLine.x2, aimLine.y2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const currentPower = Math.sqrt((aimLine.x2 - aimLine.x1) ** 2 + (aimLine.y2 - aimLine.y1) ** 2) / 10;
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`Puissance: ${Math.min(currentPower, MAX_POWER).toFixed(1)}`, cueBall.x + 15, cueBall.y - 15);
}

canvas.addEventListener('mousedown', (event) => {
    if (!gameStarted || areBallsMoving() || shotTaken || !cueBall) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const distToCueBall = Math.sqrt((mouseX - cueBall.x) ** 2 + (mouseY - cueBall.y) ** 2);
    if (distToCueBall < cueBall.radius + 20) { // Zone de clic élargie
        isAiming = true;
        aimLine.x1 = cueBall.x;
        aimLine.y1 = cueBall.y;
        aimLine.x2 = mouseX;
        aimLine.y2 = mouseY;
        turnEvaluated = false; // Prêt à évaluer le tour après ce tir
        ballsPocketedThisShot = { cueBall: false, objectBalls: 0 }; // Réinitialiser pour ce tir
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (!isAiming || !gameStarted) return;

    const rect = canvas.getBoundingClientRect();
    aimLine.x2 = event.clientX - rect.left;
    aimLine.y2 = event.clientY - rect.top;
});

canvas.addEventListener('mouseup', (event) => {
    if (!isAiming || !cueBall || !gameStarted || areBallsMoving() || shotTaken) return;

    isAiming = false;
    shotTaken = true; // Le tir est effectué

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const dx = mouseX - cueBall.x;
    const dy = mouseY - cueBall.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let power = distance / 10;
    if (power > MAX_POWER) power = MAX_POWER;
    if (power < 0.5) { // Tir trop faible, annuler
        shotTaken = false; // Annuler le tir
        turnEvaluated = true; // Pas besoin d'évaluer si pas de tir
        return;
    }
    if (distance === 0) { // Clic sur la boule sans bouger
        shotTaken = false;
        turnEvaluated = true;
        return;
    }

    cueBall.vx = (dx / distance) * power;
    cueBall.vy = (dy / distance) * power;
});

// Démarrer la boucle de jeu principale une seule fois au chargement du script.
// On retire le flag _isRunningFlag de gameLoop et on l'appelle directement.
gameLoop();
