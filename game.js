
// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 40;
const ENEMY_WIDTH = 38;
const ENEMY_HEIGHT = 30;
const BULLET_WIDTH = 2;
const BULLET_HEIGHT = 10;

// Game variables
let canvas, ctx;
let player, enemies, bullets;
let score, level;
let gameLoop;
let gameState = 'intro';
let playerImage, enemyImage;

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    playerImage = document.getElementById('playerImage');
    enemyImage = document.getElementById('enemyImage');

    player = {
        x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        y: CANVAS_HEIGHT - PLAYER_HEIGHT - 10,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        speed: 5
    };

    enemies = [];
    bullets = [];
    score = 0;
    level = 1;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    gameLoop = setInterval(update, 1000 / 60); // 60 FPS
}

// Create enemies for the current level
function createEnemies() {
    const rows = 3 + Math.min(level - 1, 2);
    const cols = 6 + Math.min(level - 1, 4);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            enemies.push({
                x: j * (ENEMY_WIDTH + 20) + 50,
                y: i * (ENEMY_HEIGHT + 20) + 50,
                width: ENEMY_WIDTH,
                height: ENEMY_HEIGHT,
                speed: 1 + level * 0.5
            });
        }
    }
}

// Handle keydown events
function handleKeyDown(e) {
    if (gameState === 'intro' && e.key === ' ') {
        startGame();
    } else if (gameState === 'playing') {
        if (e.key === 'ArrowLeft') player.moveLeft = true;
        if (e.key === 'ArrowRight') player.moveRight = true;
        if (e.key === ' ') shoot();
    }
}

// Handle keyup events
function handleKeyUp(e) {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
}

// Start the game
function startGame() {
    gameState = 'playing';
    document.getElementById('intro').style.display = 'none';
    createEnemies();
}

// Shoot a bullet
function shoot() {
    bullets.push({
        x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: player.y,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        speed: 7
    });
}

// Update game state
function update() {
    if (gameState === 'intro') {
        // Draw intro screen
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Malakai Cabal Invadooorz', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        return;
    }

    if (gameState !== 'playing') return;

    // Move player
    if (player.moveLeft && player.x > 0) player.x -= player.speed;
    if (player.moveRight && player.x < CANVAS_WIDTH - PLAYER_WIDTH) player.x += player.speed;

    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y + bullet.height < 0) bullets.splice(index, 1);
    });

    // Move enemies
    enemies.forEach(enemy => {
        enemy.x += enemy.speed;
        if (enemy.x <= 0 || enemy.x + ENEMY_WIDTH >= CANVAS_WIDTH) {
            enemies.forEach(e => {
                e.speed = -e.speed;
                e.y += 10;
            });
        }
    });

    // Check collisions
    checkCollisions();

    // Check if level is completed
    if (enemies.length === 0) {
        level++;
        if (level > 4) {
            gameOver(true);
        } else {
            createEnemies();
        }
    }

    // Draw everything
    draw();
}

// Check collisions between bullets and enemies
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                score += 10;
            }
        });
    });

    // Check if enemies reached the player
    enemies.forEach(enemy => {
        if (enemy.y + enemy.height >= player.y) {
            gameOver(false);
        }
    });
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw player
    if (playerImage.complete) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Draw enemies
    enemies.forEach(enemy => {
        if (enemyImage.complete) {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    // Draw bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw score and level
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${level}`, CANVAS_WIDTH - 100, 30);
}

// Game over
function gameOver(win) {
    gameState = 'gameOver';
    clearInterval(gameLoop);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(win ? 'You Win!' : 'Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// Start the game when the page loads
window.onload = init;
