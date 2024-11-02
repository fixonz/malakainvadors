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
let canvas, ctx;
let player, enemies, bullets, powerUps, barriers;
let score, highScores, level, lives;
let gameState = 'menu';
let playerImage, enemyImages, bulletImage;
let shootSound, hitSound, powerUpSound;
let difficulty = DIFFICULTY.MEDIUM;
let selectedMenuOption = 0;
let isMobile = false;
let scaleFactor = 1;
let lastTime = 0;

// Animation variables
let titleY = -50;
let titleVelocity = 2;
let optionsOpacity = 0;

// Power-up variables
let playerPowerUp = null;
let powerUpDuration = 10000; // 10 seconds
let powerUpTimer = 0;

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
    bulletImage = document.getElementById('bulletImage');
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

// ... [rest of the code remains the same until the drawGameplay function]

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
    bullets.forEach(bullet => {
        if (bulletImage && bulletImage.complete) {
            ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        } else {
            ctx.fillStyle = bullet.isEnemyBullet ? 'red' : 'yellow';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
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
    ctx.fillStyle = 'white';
    ctx.font = `${16 * scaleFactor}px PrStart`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20 * scaleFactor, 30 * scaleFactor);
    ctx.textAlign = 'right';
    ctx.fillText(`Level: ${level}`, (CANVAS_WIDTH - 20) * scaleFactor, 30 * scaleFactor);
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

// ... [rest of the code remains the same]

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
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        if (bullet.isEnemyBullet) {
            ctx.fillStyle = 'red';
        } else {
            ctx.fillStyle = 'yellow';
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
    ctx.fillStyle = 'white';
    ctx.font = `${16 * scaleFactor}px PrStart`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20 * scaleFactor, 30 * scaleFactor);
    ctx.textAlign = 'right';
    ctx.fillText(`Level: ${level}`, (CANVAS_WIDTH - 20) * scaleFactor, 30 * scaleFactor);
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
