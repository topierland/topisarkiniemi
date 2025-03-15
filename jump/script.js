// script.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    const player = document.getElementById('player');
    const obstacle = document.getElementById('obstacle');
    console.log('Player:', player);
    console.log('Obstacle:', obstacle);
    let isJumping = false;

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isJumping) {
            jump();
        }
    });

    function jump() {
        isJumping = true;
        let jumpHeight = 0;
        let jumpInterval = setInterval(() => {
            if (jumpHeight >= 100) {
                clearInterval(jumpInterval);
                let fallInterval = setInterval(() => {
                    if (jumpHeight <= 0) {
                        clearInterval(fallInterval);
                        isJumping = false;
                    } else {
                        jumpHeight -= 5;
                        player.style.bottom = jumpHeight + 'px';
                    }
                }, 20);
            } else {
                jumpHeight += 5;
                player.style.bottom = jumpHeight + 'px';
            }
        }, 20);
    }

    function checkCollision() {
        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();
        if (playerRect.left < obstacleRect.left + obstacleRect.width &&
            playerRect.left + playerRect.width > obstacleRect.left &&
            playerRect.top < obstacleRect.top + obstacleRect.height &&
            playerRect.height + playerRect.top > obstacleRect.top) {
            alert('Game Over');
            location.reload();
        }
    }

    setInterval(checkCollision, 10);
});
