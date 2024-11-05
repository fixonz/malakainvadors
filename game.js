// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 15;
const BARRIER_WIDTH = 60;
const BARRIER_HEIGHT = 20;

// Enemy types
const ENEMY_TYPES = {
BASIC: 'basic',
FAST: 'fast',
TOUGH: 'tough',
ZIGZAG: 'zigzag',
CIRCULAR: 'circular',
DIVING: 'diving',
BOSS: 'boss'
};

// Movement patterns
const MOVEMENT_PATTERNS = {
LINEAR: 'linear',
ZIGZAG: 'zigzag',
CIRCULAR: 'circular',
DIVING: 'diving'
};

// Difficulty levels
const DIFFICULTY = {
EASY: { label: 'Easy', multiplier: 1 },
MEDIUM: { label: 'Medium', multiplier: 1.5 },
HARD: { label: 'Hard', multiplier: 2 }
};
// Power-up types
const POWER_UP_TYPES = {
SHIELD: 'shield',
RAPID_FIRE: 'rapidFire',
EXTRA_LIFE: 'extraLife'
};

// Game variables
@@ -68,768 +62,771 @@

// Initialize the game
function init() {
canvas = document.getElementById('gameCanvas');
ctx = canvas.getContext('2d');
// Check if the device is mobile
isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// Set up the canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
playerImage = document.getElementById('playerImage');
enemyImages = {
    [ENEMY_TYPES.BASIC]: document.getElementById('enemyBasicImage'),
    [ENEMY_TYPES.FAST]: document.getElementById('enemyFastImage'),
    [ENEMY_TYPES.TOUGH]: document.getElementById('enemyToughImage'),
    [ENEMY_TYPES.ZIGZAG]: document.getElementById('enemyZigzagImage'),
    [ENEMY_TYPES.CIRCULAR]: document.getElementById('enemyCircularImage'),
    [ENEMY_TYPES.DIVING]: document.getElementById('enemyDivingImage')
};
shootSound = document.getElementById('shootSound');
hitSound = document.getElementById('hitSound');
powerUpSound = document.getElementById('powerUpSound');
player = {
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 5,
    shielded: false,
    rapidFire: false
};
enemies = [];
bullets = [];
powerUps = [];
barriers = [
    { x: CANVAS_WIDTH / 4 - BARRIER_WIDTH / 2, y: CANVAS_HEIGHT - 100, width: BARRIER_WIDTH, height: BARRIER_HEIGHT },
    { x: CANVAS_WIDTH * 3/4 - BARRIER_WIDTH / 2, y: CANVAS_HEIGHT - 100, width: BARRIER_WIDTH, height: BARRIER_HEIGHT }
];
score = 0;
level = 1;
lives = 3;
highScores = JSON.parse(localStorage.getItem('highScores')) || [];
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
// Add touch event listeners for mobile
if (isMobile) {
    document.getElementById('mobileControls').style.display = 'flex';
    document.getElementById('leftButton').addEventListener('touchstart', () => player.moveLeft = true);
    document.getElementById('leftButton').addEventListener('touchend', () => player.moveLeft = false);
    document.getElementById('rightButton').addEventListener('touchstart', () => player.moveRight = true);
    document.getElementById('rightButton').addEventListener('touchend', () => player.moveRight = false);
    document.getElementById('fireButton').addEventListener('touchstart', shoot);
}

// Start game loop
requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
const gameContainer = document.getElementById('gameContainer');
const containerWidth = gameContainer.clientWidth;
const containerHeight = gameContainer.clientHeight;
const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
let newWidth, newHeight;
if (containerWidth / containerHeight > aspectRatio) {
    newHeight = containerHeight;
    newWidth = newHeight * aspectRatio;
} else {
    newWidth = containerWidth;
    newHeight = newWidth / aspectRatio;
}

canvas.style.width = `${newWidth}px`;
canvas.style.height = `${newHeight}px`;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

scaleFactor = newWidth / CANVAS_WIDTH;
}

// Create enemies for the current level
function createEnemies() {
if (level % 10 === 0) {
createBossLevel();
} else {
createRegularLevel();
}
}

function createRegularLevel() {
const enemyCount = 5 + (level * 5); // Starts with 10 enemies, increases by 5 each level
const availableTypes = [ENEMY_TYPES.BASIC];
if (level >= 5) availableTypes.push(ENEMY_TYPES.FAST);
if (level >= 10) availableTypes.push(ENEMY_TYPES.TOUGH);
if (level >= 15) availableTypes.push(ENEMY_TYPES.ZIGZAG);
if (level >= 20) availableTypes.push(ENEMY_TYPES.CIRCULAR);
if (level >= 25) availableTypes.push(ENEMY_TYPES.DIVING);
for (let i = 0; i < enemyCount; i++) {
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    let health = 1 + Math.floor(level / 10);
    let speed = (1 + (level * 0.05)) * difficulty.multiplier;
    let movementPattern = MOVEMENT_PATTERNS.LINEAR;
    switch (type) {
        case ENEMY_TYPES.FAST:
            speed *= 1.5;
            break;
        case ENEMY_TYPES.TOUGH:
            health *= 2;
            speed *= 0.75;
            break;
        case ENEMY_TYPES.ZIGZAG:
            movementPattern = MOVEMENT_PATTERNS.ZIGZAG;
            break;
        case ENEMY_TYPES.CIRCULAR:
            movementPattern = MOVEMENT_PATTERNS.CIRCULAR;
            break;
        case ENEMY_TYPES.DIVING:
            movementPattern = MOVEMENT_PATTERNS.DIVING;
            break;
    }

    enemies.push({
        x: Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH),
        y: Math.random() * (CANVAS_HEIGHT / 2),
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
        speed: speed,
        type: type,
        health: health,
        shootCooldown: type === ENEMY_TYPES.TOUGH ? Math.max(120 - level * 2, 30) : 0,
        canShoot: type === ENEMY_TYPES.TOUGH,
        movementPattern: movementPattern,
        movementTimer: 0,
        initialX: Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH),
        initialY: Math.random() * (CANVAS_HEIGHT / 2)
    });
}
}

function createBossLevel() {
const bossHealth = 50 + (level * 5);
const bossSpeed = (1 + (level * 0.05)) * difficulty.multiplier;
const bossSize = 2 + Math.min(level / 20, 3); // Boss size increases with level, max 5x
enemies.push({
    x: CANVAS_WIDTH / 2 - (ENEMY_WIDTH * bossSize) / 2,
    y: 50,
    width: ENEMY_WIDTH * bossSize,
    height: ENEMY_HEIGHT * bossSize,
    speed: bossSpeed,
    type: ENEMY_TYPES.BOSS,
    health: bossHealth,
    shootCooldown: 250,
    canShoot: true,
    movementPattern: MOVEMENT_PATTERNS.LINEAR
});
// Add a few regular enemies
for (let i = 0; i < 3; i++) {
    createRegularLevel();
}
}

// Handle keydown events
function handleKeyDown(e) {
if (isMobile) return; // Ignore keyboard events on mobile devices
if (gameState === 'menu') {
    if (e.key === 'ArrowUp') {
        selectedMenuOption = (selectedMenuOption - 1 + 2) % 2;
    } else if (e.key === 'ArrowDown') {
        selectedMenuOption = (selectedMenuOption + 1) % 2;
    } else if (e.key === ' ' || e.key === 'Enter') {
        if (selectedMenuOption === 0) {
            gameState = 'difficultySelect';
        } else {
            gameState = 'highScores';
        }
    }
} else if (gameState === 'difficultySelect') {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        changeDifficulty(e.key === 'ArrowUp' ? -1 : 1);
    } else if (e.key === ' ' || e.key === 'Enter') {
        startGame();
    }
} else if (gameState === 'playing') {
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
    if (e.key === ' ') shoot();
} else if (gameState === 'gameOver' && (e.key === ' ' || e.key === 'Enter')) {
    gameState = 'menu';
    titleY = -50;
    titleVelocity = 2;
    optionsOpacity = 0;
} else if (gameState === 'highScores' && (e.key === ' ' || e.key === 'Enter')) {
    gameState = 'menu';
    titleY = -50;
    titleVelocity = 2;
    optionsOpacity = 0;
}
}

// Handle keyup events
function handleKeyUp(e) {
if (isMobile) return; // Ignore keyboard events on mobile devices

if (e.key === 'ArrowLeft') player.moveLeft = false;
if (e.key === 'ArrowRight') player.moveRight = false;
}

// Change difficulty
function changeDifficulty(direction) {
const difficulties = Object.values(DIFFICULTY);
let index = difficulties.findIndex(d => d === difficulty);
index = (index + direction + difficulties.length) % difficulties.length;
difficulty = difficulties[index];
}

// Start the game
function startGame() {
gameState = 'playing';
score = 0;
level = 1;
lives = 3;
player.shielded = false;
player.rapidFire = false;
playerPowerUp = null;
powerUpTimer = 0;
createEnemies();
}

// Shoot a bullet
function shoot() {
if (gameState !== 'playing') return;
if (player.rapidFire) {
    for (let i = -1; i <= 1; i++) {
        bullets.push({
            x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2 + (i * 10),
            y: player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT,
            speed: 7,
            isEnemyBullet: false
        });
    }
} else {
    bullets.push({
        x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: player.y,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        speed: 7,
        isEnemyBullet: false
    });
}
shootSound.play();
}

// Enemy shoot
function enemyShoot(enemy) {
if (enemy.type === ENEMY_TYPES.BOSS) {
// Boss shoots 3 bullets in a spread
for (let i = -1; i <= 1; i++) {
bullets.push({
x: enemy.x + enemy.width / 2 + (i * 20),
y: enemy.y + enemy.height,
width: BULLET_WIDTH * 2,
height: BULLET_HEIGHT * 2,
speed: -4,
isEnemyBullet: true
});
}
} else {
bullets.push({
x: enemy.x + ENEMY_WIDTH / 2,
y: enemy.y + ENEMY_HEIGHT,
width: BULLET_WIDTH,
height: BULLET_HEIGHT,
speed: -5,
isEnemyBullet: true
});
}
}

// Create power-up
function createPowerUp() {
const types = Object.values(POWER_UP_TYPES);
const type = types[Math.floor(Math.random() * types.length)];
powerUps.push({
x: Math.random() * (CANVAS_WIDTH - 30),
y: -30,
width: 30,
height: 30,
type: type,
speed: 2
});
}

// Collect power-up
function collectPowerUp(powerUp) {
playerPowerUp = powerUp.type;
powerUpTimer = powerUpDuration;
switch (powerUp.type) {
    case POWER_UP_TYPES.SHIELD:
        player.shielded = true;
        break;
    case POWER_UP_TYPES.RAPID_FIRE:
        player.rapidFire = true;
        break;
    case POWER_UP_TYPES.EXTRA_LIFE:
        lives = Math.min(lives + 1, 5);
        break;
}
powerUpSound.play();
}

// Move enemy based on its movement pattern
function moveEnemy(enemy, deltaTime) {
switch (enemy.movementPattern) {
case MOVEMENT_PATTERNS.LINEAR:
enemy.x += enemy.speed * (deltaTime / 16);
if (enemy.x <= 0 || enemy.x + enemy.width >= CANVAS_WIDTH) {
enemy.speed = -enemy.speed;
enemy.y += 10;
}
break;
case MOVEMENT_PATTERNS.ZIGZAG:
enemy.movementTimer += deltaTime / 1000;
enemy.x = enemy.initialX + Math.sin(enemy.movementTimer * 2) * 50;
enemy.y += enemy.speed * (deltaTime / 16) * 0.5;
break;
case MOVEMENT_PATTERNS.CIRCULAR:
enemy.movementTimer += deltaTime / 1000;
const radius = 50;
enemy.x = enemy.initialX + Math.cos(enemy.movementTimer) * radius;
enemy.y = enemy.initialY + Math.sin(enemy.movementTimer) * radius + enemy.speed * (deltaTime / 16) * 0.25;
break;
case MOVEMENT_PATTERNS.DIVING:
if (enemy.y < CANVAS_HEIGHT * 0.6) {
enemy.y += enemy.speed * (deltaTime / 16) * 2;
} else {
enemy.movementTimer += deltaTime / 1000;
enemy.x = enemy.initialX + Math.sin(enemy.movementTimer * 3) * 100;
}
break;
}
}

// Update game state
function update(deltaTime) {
if (gameState === 'menu') {
drawMenuScreen(deltaTime);
} else if (gameState === 'difficultySelect') {
drawDifficultyScreen();
} else if (gameState === 'highScores') {
drawHighScoresScreen();
} else if (gameState === 'playing') {
updateGameplay(deltaTime);
} else if (gameState === 'gameOver') {
drawGameOverScreen();
}
}

function updateGameplay(deltaTime) {
// Move player
if (player.moveLeft && player.x > 0) player.x -= player.speed * (deltaTime / 16);
if (player.moveRight && player.x < CANVAS_WIDTH - PLAYER_WIDTH) player.x += player.speed * (deltaTime / 16);
// Move bullets
bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed * (deltaTime / 16);
    if (bullet.y + bullet.height < 0 || bullet.y > CANVAS_HEIGHT) bullets.splice(index, 1);
});
// Move enemies
enemies.forEach(enemy => {
    if (enemy.type === ENEMY_TYPES.BOSS) {
        enemy.x += enemy.speed * (deltaTime / 16);
        if (enemy.x <= 0 || enemy.x + enemy.width >= CANVAS_WIDTH) {
            enemy.speed = -enemy.speed;
        }
    } else {
        moveEnemy(enemy, deltaTime);
    }

    if (enemy.canShoot) {
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0) {
            enemyShoot(enemy);
            enemy.shootCooldown = enemy.type === ENEMY_TYPES.BOSS ? 120 : Math.max(120 - level * 2, 30);
        }
    }
});
// Move and check power-ups
powerUps.forEach((powerUp, index) => {
    powerUp.y += powerUp.speed;
    if (powerUp.y > CANVAS_HEIGHT) {
        powerUps.splice(index, 1);
    } else if (
        player.x < powerUp.x + powerUp.width &&
        player.x + player.width > powerUp.x &&
        player.y < powerUp.y + powerUp.height &&
        player.y + player.height > powerUp.y
    ) {
        collectPowerUp(powerUp);
        powerUps.splice(index, 1);
    }
});
// Update power-up timer
if (playerPowerUp) {
    powerUpTimer -= deltaTime;
    if (powerUpTimer <= 0) {
        player.shielded = false;
        player.rapidFire = false;
        playerPowerUp = null;
    }
}

// Spawn power-ups
if (Math.random() < 0.001 * difficulty.multiplier) {
    createPowerUp();
}

// Check collisions
checkCollisions();

// Check if level is completed
if (enemies.length === 0) {
    level++;
    createEnemies();
}

// Draw everything
drawGameplay();
}

// Draw menu screen
function drawMenuScreen(deltaTime) {
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
// Animate title
titleY += titleVelocity * (deltaTime / 16);
if (titleY > 120) {
    titleY = 120;
    titleVelocity = -titleVelocity * 0.5;
}
if (titleY < 100 && titleVelocity < 0) {
    titleVelocity = -titleVelocity * 0.5;
}

ctx.fillStyle = 'white';
ctx.font = `${36 * scaleFactor}px PrStart`;
ctx.textAlign = 'center';
ctx.fillText('Malakai Cabal', CANVAS_WIDTH / 2, titleY * scaleFactor);
ctx.fillText('Invadooorz', CANVAS_WIDTH / 2, (titleY + 50) * scaleFactor);
// Fade in options
optionsOpacity += 0.02 * (deltaTime / 16);
if (optionsOpacity > 1) optionsOpacity = 1;
ctx.globalAlpha = optionsOpacity;
ctx.font = `${24 * scaleFactor}px PrStart`;
ctx.fillStyle = selectedMenuOption === 0 ? 'yellow' : 'white';
ctx.fillText('Start', CANVAS_WIDTH / 2, 300 * scaleFactor);
ctx.fillStyle = selectedMenuOption === 1 ? 'yellow' : 'white';
ctx.fillText('High Scores', CANVAS_WIDTH / 2, 350 * scaleFactor);
ctx.fillStyle = 'white';
ctx.font = `${16 * scaleFactor}px PrStart`;
ctx.fillText('Use arrow keys to navigate', CANVAS_WIDTH / 2, 450 * scaleFactor);
ctx.fillText('Press SPACE to select', CANVAS_WIDTH / 2, 480 * scaleFactor);
ctx.globalAlpha = 1;
// Draw player ship
if (playerImage.complete) {
    ctx.drawImage(playerImage, CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, CANVAS_HEIGHT - PLAYER_HEIGHT - 50, PLAYER_WIDTH, PLAYER_HEIGHT);
} else {
    ctx.fillStyle = 'blue';
    ctx.fillRect(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, CANVAS_HEIGHT - PLAYER_HEIGHT - 50, PLAYER_WIDTH, PLAYER_HEIGHT);
}

// Draw some enemy ships
const enemyTypes = [ENEMY_TYPES.BASIC, ENEMY_TYPES.FAST, ENEMY_TYPES.TOUGH, ENEMY_TYPES.ZIGZAG, ENEMY_TYPES.CIRCULAR, ENEMY_TYPES.DIVING];
enemyTypes.forEach((type, index) => {
    const x = (CANVAS_WIDTH / (enemyTypes.length + 1)) * (index + 1);
    const y = CANVAS_HEIGHT - 150 + Math.sin(Date.now() / 500 + index) * 20; // Add movement
    const enemyImage = enemyImages[type];
    if (enemyImage && enemyImage.complete) {
        ctx.drawImage(enemyImage, x - ENEMY_WIDTH / 2, y, ENEMY_WIDTH, ENEMY_HEIGHT);
    } else {
        ctx.fillStyle = type === ENEMY_TYPES.FAST ? 'green' : 
                        type === ENEMY_TYPES.TOUGH ? 'purple' :
                        type === ENEMY_TYPES.ZIGZAG ? 'orange' :
                        type === ENEMY_TYPES.CIRCULAR ? 'cyan' :
                        type === ENEMY_TYPES.DIVING ? 'magenta' : 'red';
        ctx.fillRect(x - ENEMY_WIDTH / 2, y, ENEMY_WIDTH, ENEMY_HEIGHT);
    }
});
}

// Draw difficulty select screen
function drawDifficultyScreen() {
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
ctx.fillStyle = 'white';
ctx.font = `${36 * scaleFactor}px PrStart`;
ctx.textAlign = 'center';
ctx.fillText('Select Difficulty', CANVAS_WIDTH / 2, 100 * scaleFactor);
ctx.font = `${24 * scaleFactor}px PrStart`;
Object.values(DIFFICULTY).forEach((diff, index) => {
    ctx.fillStyle = diff === difficulty ? 'yellow' : 'white';
    ctx.fillText(diff.label, CANVAS_WIDTH / 2, (250 + index * 50) * scaleFactor);
});
ctx.fillStyle = 'white';
ctx.font = `${16 * scaleFactor}px PrStart`;
ctx.fillText('Use arrow keys to navigate', CANVAS_WIDTH / 2, 450 * scaleFactor);
ctx.fillText('Press SPACE to select', CANVAS_WIDTH / 2, 480 * scaleFactor);
}

// Draw high scores screen
function drawHighScoresScreen() {
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

ctx.fillStyle = 'white';
ctx.font = `${36 * scaleFactor}px PrStart`;
ctx.textAlign = 'center';
ctx.fillText('High Scores', CANVAS_WIDTH / 2, 100 * scaleFactor);

ctx.font = `${18 * scaleFactor}px PrStart`;
highScores.slice(0, 10).forEach((score, index) => {
    ctx.fillText(`${index + 1}. ${score.name}: ${score.score}`, CANVAS_WIDTH / 2, (200 + index * 30) * scaleFactor);
});

ctx.font = `${16 * scaleFactor}px PrStart`;
ctx.fillText('Press SPACE to return to menu', CANVAS_WIDTH / 2, 550 * scaleFactor);
}

// Check collisions between bullets and enemies
function checkCollisions() {
bullets.forEach((bullet, bulletIndex) => {
if (bullet.isEnemyBullet) {
// Check collision with player
if (
bullet.x < player.x + player.width &&
bullet.x + bullet.width > player.x &&
bullet.y < player.y + player.height &&
bullet.y + bullet.height > player.y
) {
bullets.splice(bulletIndex, 1);
if (!player.shielded) {
lives--;
if (lives <= 0) {
gameOver();
}
}
}
// Check collision with barriers
barriers.forEach((barrier, barrierIndex) => {
if (
bullet.x < barrier.x + barrier.width &&
bullet.x + bullet.width > barrier.x &&
bullet.y < barrier.y + barrier.height &&
bullet.y + bullet.height > barrier.y
) {
bullets.splice(bulletIndex, 1);
barriers[barrierIndex].health--;
if (barriers[barrierIndex].health <= 0) {
barriers.splice(barrierIndex, 1);
}
}
});
} else {
// Check collision with enemies
enemies.forEach((enemy, enemyIndex) => {
if (
bullet.x < enemy.x + enemy.width &&
bullet.x + bullet.width > enemy.x &&
bullet.y < enemy.y + enemy.height &&
bullet.y + bullet.height > enemy.y
) {
bullets.splice(bulletIndex, 1);
enemy.health--;
if (enemy.health <= 0) {
enemies.splice(enemyIndex, 1);
score += (enemy.type === ENEMY_TYPES.FAST ? 15 :
enemy.type === ENEMY_TYPES.TOUGH ? 20 :
enemy.type === ENEMY_TYPES.BOSS ? 100 : 10) * difficulty.multiplier;
}
hitSound.play();
}
});
}
});
// Check if enemies reached the player
enemies.forEach(enemy => {
    if (enemy.y + enemy.height >= player.y) {
        lives--;
        if (lives <= 0) {
            gameOver();
        } else {
            enemies = [];
            createEnemies();
        }
    }
});
}

// Draw game objects
function drawGameplay() {
// Clear canvas
ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
// Draw player
if (playerImage.complete) {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
} else {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}
// Draw shield effect
if (player.shielded) {
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 
            Math.max(player.width, player.height) / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw enemies
enemies.forEach(enemy => {
    const enemyImage = enemyImages[enemy.type] || enemyImages[ENEMY_TYPES.BASIC];
    if (enemyImage && enemyImage.complete) {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
        ctx.fillStyle = enemy.type === ENEMY_TYPES.BOSS ? 'gold' :
                        enemy.type === ENEMY_TYPES.FAST ? 'green' : 
                        enemy.type === ENEMY_TYPES.TOUGH ? 'purple' :
                        enemy.type === ENEMY_TYPES.ZIGZAG ? 'orange' :
                        enemy.type === ENEMY_TYPES.CIRCULAR ? 'cyan' :
                        enemy.type === ENEMY_TYPES.DIVING ? 'magenta' : 'red';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

    // Draw health bar for boss
    if (enemy.type === ENEMY_TYPES.BOSS) {
        const healthPercentage = enemy.health / (50 + (level * 5));
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercentage, 5);
    }
});

    // Draw bullets
ctx.fillStyle = 'green';
bullets.forEach(bullet => {
    if (bullet.isEnemyBullet) {
        ctx.fillStyle = 'red';
    } else {
        ctx.fillStyle = 'green';
    }
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
});
// Draw power-ups
powerUps.forEach(powerUp => {
    ctx.font = `${30 * scaleFactor}px Arial`;
    ctx.fillText(
        powerUp.type === POWER_UP_TYPES.SHIELD ? '🛡️' :
        powerUp.type === POWER_UP_TYPES.RAPID_FIRE ? '🔥' : '❤️',
        powerUp.x, powerUp.y + 30
    );
});
// Draw barriers
ctx.fillStyle = 'gray';
barriers.forEach(barrier => {
    ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);
});
// Draw score, level, and lives
ctx.fillStyle = 'gray';
ctx.font = `${16 * scaleFactor}px PrStart`;
ctx.textAlign = 'left';
ctx.fillText(`Score: ${score}`, 20 * scaleFactor, 30 * scaleFactor);
ctx.textAlign = 'right';
ctx.fillText(`LVL: ${level}`, (CANVAS_WIDTH - 20) * scaleFactor, 30 * scaleFactor);
ctx.textAlign = 'center';
ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, CANVAS_WIDTH / 2, 30 * scaleFactor);
// Draw power-up timer
if (playerPowerUp) {
    ctx.fillStyle = 'white';
    ctx.font = `${14 * scaleFactor}px PrStart`;
    ctx.textAlign = 'center';
    ctx.fillText(`${playerPowerUp}: ${Math.ceil(powerUpTimer / 1000)}s`, 
                 CANVAS_WIDTH / 2, (CANVAS_HEIGHT - 20) * scaleFactor);
}
}

// Game over
function gameOver() {
gameState = 'gameOver';
// Update high scores
const playerName = prompt("Enter your name for the high score:");
highScores.push({ name: playerName || "Anonymous", score: score });
highScores.sort((a, b) => b.score - a.score);
highScores = highScores.slice(0, 10);
localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Draw game over screen
function drawGameOverScreen() {
ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

ctx.fillStyle = 'white';
ctx.font = `${36 * scaleFactor}px PrStart`;
ctx.textAlign = 'center';
ctx.fillText('Game Over', CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2 - 50) * scaleFactor);

ctx.font = `${24 * scaleFactor}px PrStart`;
ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2 + 10) * scaleFactor);
ctx.fillText(`Levels Completed: ${level - 1}`, CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2 + 50) * scaleFactor);

ctx.font = `${18 * scaleFactor}px PrStart`;
ctx.fillText('Press SPACE to return to menu', CANVAS_WIDTH / 2, (CANVAS_HEIGHT / 2 + 100) * scaleFactor);
}

// Game loop
function gameLoop(currentTime) {
const deltaTime = currentTime - lastTime;
lastTime = currentTime;

update(deltaTime);
requestAnimationFrame(gameLoop);
}

// Start the game when the page loads
window.addEventListener('load', function() {
document.getElementById('loading').style.display = 'none';
init();
});
