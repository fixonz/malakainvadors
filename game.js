// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 15;

// Enemy types
const ENEMY_TYPES = {
    BASIC: 'basic',
    FAST: 'fast',
    TOUGH: 'tough',
    BOSS: 'boss'
};

// Game variables
let canvas, ctx;
let player, enemies, bullets;
let score, level;
let gameLoop;
let gameState = 'intro';
let playerImage, enemyImages, bossImage;
let shootSound, hitSound;

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    playerImage = document.getElementById('playerImage');
    enemyImages = {
        [ENEMY_TYPES.BASIC]: document.getElementById('enemyBasicImage'),
        [ENEMY_TYPES.FAST]: document.getElementById('enemyFastImage'),
        [ENEMY_TYPES.TOUGH]: document.getElementById('enemyToughImage')
    };
    bossImage = document.getElementById('bossImage');
    shootSound = document.getElementById('shootSound');
    hitSound = document.getElementById('hitSound');

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

    // Ensure all images are loaded
    const imagesToLoad = [playerImage, ...Object.values(enemyImages), bossImage];
    Promise.all(imagesToLoad.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Handle missing images gracefully
        });
    })).then(() => {
        // Start game loop
        gameLoop = setInterval(update, 1000 / 60); // 60 FPS
    });
}

// Create enemies for the current level
function createEnemies() {
    if (level % 5 === 0) {
        createBossLevel();
    } else {
        createRegularLevel();
    }
}

function createRegularLevel() {
    const rows = Math.min(3 + Math.floor(level / 3), 7);
    const cols = Math.min(6 + Math.floor(level / 4), 12);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let type = ENEMY_TYPES.BASIC;
            let health = 1 + Math.floor(level / 10);
            let speed = 1 + (level * 0.1);

            if (Math.random() < 0.1 + (level * 0.01)) {
                type = ENEMY_TYPES.FAST;
                speed *= 1.5;
            } else if (Math.random() < 0.05 + (level * 0.005)) {
                type = ENEMY_TYPES.TOUGH;
                health *= 2;
                speed *= 0.75;
            }

            enemies.push({
                x: j * (ENEMY_WIDTH + 20) + 50,
                y: i * (ENEMY_HEIGHT + 20) + 50,
                width: ENEMY_WIDTH,
                height: ENEMY_HEIGHT,
                speed: speed,
                type: type,
                health: health,
                shootCooldown: type === ENEMY_TYPES.TOUGH ? Math.max(120 - level * 2, 30) : 0,
                canShoot: type === ENEMY_TYPES.TOUGH
            });
        }
    }
}

function createBossLevel() {
    const bossHealth = 50 + (level * 10);
    const bossSpeed = 2 + (level * 0.2);

    enemies.push({
        x: CANVAS_WIDTH / 2 - ENEMY_WIDTH * 2,
        y: 50,
        width: ENEMY_WIDTH * 4,
        height: ENEMY_HEIGHT * 4,
        speed: bossSpeed,
        type: ENEMY_TYPES.BOSS,
        health: bossHealth,
        shootCooldown: 60,
        canShoot: true
    });

    // Add some regular enemies to make it more challenging
    for (let i = 0; i < 10; i++) {
        createRegularLevel();
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
    } else if (gameState === 'gameOver' && e.key === ' ') {
        init();
        startGame();
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
    createEnemies();
}

// Shoot a bullet
function shoot() {
    bullets.push({
        x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: player.y,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        speed: 7,
        isEnemyBullet: false
    });
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
                speed: -6,
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

// Update game state
function update() {
    if (gameState === 'intro') {
        drawIntro();
        return;
    }

    if (gameState !== 'playing') return;

    // Move player
    if (player.moveLeft && player.x > 0) player.x -= player.speed;
    if (player.moveRight && player.x < CANVAS_WIDTH - PLAYER_WIDTH) player.x += player.speed;

    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y + bullet.height < 0 || bullet.y > CANVAS_HEIGHT) bullets.splice(index, 1);
    });

    // Move enemies
    enemies.forEach(enemy => {
        if (enemy.type === ENEMY_TYPES.BOSS) {
            enemy.x += enemy.speed;
            if (enemy.x <= 0 || enemy.x + enemy.width >= CANVAS_WIDTH) {
                enemy.speed = -enemy.speed;
            }
        } else {
            enemy.x += enemy.speed;
            if (enemy.x <= 0 || enemy.x + ENEMY_WIDTH >= CANVAS_WIDTH) {
                enemy.speed = -enemy.speed;
                enemy.y += 10;
            }
        }

        if (enemy.canShoot) {
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0) {
                enemyShoot(enemy);
                enemy.shootCooldown = enemy.type === ENEMY_TYPES.BOSS ? 60 : Math.max(120 - level * 2, 30);
            }
        }
    });

    // Check collisions
    checkCollisions();

    // Check if level is completed
    if (enemies.length === 0) {
        level++;
        createEnemies();
    }

    // Draw everything
    draw();
}

// Draw intro screen
function drawIntro() {
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = '36px PrStart';
    ctx.textAlign = 'center';
    ctx.fillText('Malakai Cabal', CANVAS_WIDTH / 2, 100);
    ctx.fillText('Invadooorz', CANVAS_WIDTH / 2, 150);

    // Draw player ship
    if (playerImage.complete) {
        ctx.drawImage(playerImage, CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, CANVAS_HEIGHT - 150, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, CANVAS_HEIGHT - 150, PLAYER_WIDTH, PLAYER_HEIGHT);
    }

    // Draw enemy ships
    const enemyY = 250;
    const enemySpacing = 120;
    Object.values(enemyImages).forEach((img, index) => {
        if (img && img.complete) {
            ctx.drawImage(img, CANVAS_WIDTH / 2 - ENEMY_WIDTH / 2 + (index - 1) * enemySpacing, enemyY, ENEMY_WIDTH, ENEMY_HEIGHT);
        } else {
            ctx.fillStyle = ['red', 'green', 'purple'][index];
            ctx.fillRect(CANVAS_WIDTH / 2 - ENEMY_WIDTH / 2 + (index - 1) * enemySpacing, enemyY, ENEMY_WIDTH, ENEMY_HEIGHT);
        }
    });

    // Draw instructions
    ctx.fillStyle = 'white';
    ctx.font = '16px PrStart';
    ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);

    // Add some animation
    const time = Date.now() * 0.001; // Convert to seconds
    ctx.fillStyle = 'yellow';
    for (let i = 0; i < 50; i++) {
        const x = Math.sin(i * 0.5 + time) * CANVAS_WIDTH / 2 + CANVAS_WIDTH / 2;
        const y = Math.cos(i * 0.5 + time) * CANVAS_HEIGHT / 2 + CANVAS_HEIGHT / 2;
        ctx.fillRect(x, y, 2, 2);
    }
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
                gameOver(false);
            }
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
                        score += enemy.type === ENEMY_TYPES.FAST ? 15 :
                                 enemy.type === ENEMY_TYPES.TOUGH ? 20 :
                                 enemy.type === ENEMY_TYPES.BOSS ? 100 : 10;
                    }
                    hitSound.play();
                }
            });
        }
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
        const enemyImage = enemy.type === ENEMY_TYPES.BOSS ? bossImage : enemyImages[enemy.type];
        if (enemyImage && enemyImage.complete) {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            ctx.fillStyle = enemy.type === ENEMY_TYPES.BOSS ? 'gold' :
                            enemy.type === ENEMY_TYPES.FAST ? 'green' : 
                            enemy.type === ENEMY_TYPES.TOUGH ? 'purple' : 'red';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        // Draw health bar for boss
        if (enemy.type === ENEMY_TYPES.BOSS) {
            const healthPercentage = enemy.health / (50 + (level * 10));
            ctx.fillStyle = 'red';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercentage, 5);
        }
    });

    // Draw bullets
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        if (bullet.isEnemyBullet) {
            ctx.fillStyle = 'red';
        } else {
            ctx.fillStyle = 'yellow';
        }
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw score and level
    ctx.fillStyle = 'white';
    ctx.font = '16px PrStart';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 50, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Level: ${level}`, CANVAS_WIDTH - 50, 30);
}

// Game over
function gameOver(win) {
    if (win) {
        level++;
        createEnemies();
        return;
    }

    gameState = 'gameOver';
    clearInterval(gameLoop);
    ctx.fillStyle = 'white';
    ctx.font = '24px PrStart';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    ctx.font = '16px PrStart';
    ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText(`Levels Completed: ${level - 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// Start the game when the page loads
window.onload = init;
