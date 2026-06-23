const game = document.getElementById('game');
const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const scoreText = document.getElementById('score');
const bestScoreText = document.getElementById('bestScore');
const gameStatusText = document.getElementById('gameStatus');
const startPanel = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreText = document.getElementById('finalScore');

let isPlaying = false;
let isJumping = false;
let score = 0;
let bestScore = Number(localStorage.getItem('jumpTimingBestScore')) || 0;
let scoreTimer = null;
let collisionTimer = null;
let difficultyTimer = null;
let obstacleSpeed = 1.7;

bestScoreText.textContent = bestScore;

function startGame() {
  isPlaying = true;
  isJumping = false;
  score = 0;
  obstacleSpeed = 1.7;

  scoreText.textContent = score;
  gameStatusText.textContent = '진행 중';
  startPanel.classList.add('hidden');
  gameOverPanel.classList.add('hidden');

  obstacle.classList.remove('move');
  void obstacle.offsetWidth;
  obstacle.style.animationDuration = `${obstacleSpeed}s`;
  obstacle.classList.add('move');

  clearInterval(scoreTimer);
  clearInterval(collisionTimer);
  clearInterval(difficultyTimer);

  scoreTimer = setInterval(addScore, 100);
  collisionTimer = setInterval(checkCollision, 20);
  difficultyTimer = setInterval(increaseDifficulty, 3000);
}

function jump() {
  if (!isPlaying || isJumping) return;

  isJumping = true;
  player.classList.add('jump');

  setTimeout(() => {
    player.classList.remove('jump');
    isJumping = false;
  }, 520);
}

function addScore() {
  score += 1;
  scoreText.textContent = score;
}

function increaseDifficulty() {
  obstacleSpeed = Math.max(0.9, obstacleSpeed - 0.08);
  obstacle.style.animationDuration = `${obstacleSpeed}s`;
}

function checkCollision() {
  const playerBox = player.getBoundingClientRect();
  const obstacleBox = obstacle.getBoundingClientRect();

  const isColliding =
    playerBox.left < obstacleBox.right &&
    playerBox.right > obstacleBox.left &&
    playerBox.bottom > obstacleBox.top &&
    playerBox.top < obstacleBox.bottom;

  if (isColliding) {
    endGame();
  }
}

function endGame() {
  isPlaying = false;
  gameStatusText.textContent = '게임 오버';
  finalScoreText.textContent = score;

  obstacle.classList.remove('move');

  clearInterval(scoreTimer);
  clearInterval(collisionTimer);
  clearInterval(difficultyTimer);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('jumpTimingBestScore', bestScore);
    bestScoreText.textContent = bestScore;
  }

  gameOverPanel.classList.remove('hidden');
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
game.addEventListener('click', jump);

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();

    if (!isPlaying && !startPanel.classList.contains('hidden')) {
      startGame();
      return;
    }

    jump();
  }
});
