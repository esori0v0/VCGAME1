const game = document.getElementById('game');
const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const scoreText = document.getElementById('score');
const goalScoreText = document.getElementById('goalScore');
const bestScoreText = document.getElementById('bestScore');
const gameStatusText = document.getElementById('gameStatus');
const startPanel = document.getElementById('startPanel');
const gameOverPanel = document.getElementById('gameOverPanel');
const winPanel = document.getElementById('winPanel');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const winRestartButton = document.getElementById('winRestartButton');
const finalScoreText = document.getElementById('finalScore');
const winScoreText = document.getElementById('winScore');

const WIN_SCORE = 100;

let isPlaying = false;
let isJumping = false;
let score = 0;
let bestScore = Number(localStorage.getItem('jumpTimingBestScore')) || 0;
let scoreTimer = null;
let collisionTimer = null;
let difficultyTimer = null;
let obstacleSpeed = 1.7;
let audioContext = null;

goalScoreText.textContent = WIN_SCORE;
winScoreText.textContent = WIN_SCORE;
bestScoreText.textContent = bestScore;

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) return null;

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function playTone(frequency, startTime, duration, type = 'square', volume = 0.12) {
  const context = getAudioContext();

  if (!context) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playJumpSound() {
  const context = getAudioContext();

  if (!context) return;

  const now = context.currentTime;
  playTone(420, now, 0.12, 'square', 0.12);
  playTone(760, now + 0.04, 0.08, 'square', 0.08);
}

function playWinSound() {
  const context = getAudioContext();

  if (!context) return;

  const now = context.currentTime;
  playTone(523, now, 0.14, 'triangle', 0.13);
  playTone(659, now + 0.13, 0.14, 'triangle', 0.13);
  playTone(784, now + 0.26, 0.18, 'triangle', 0.15);
  playTone(1046, now + 0.42, 0.28, 'triangle', 0.16);
}

function playLoseSound() {
  const context = getAudioContext();

  if (!context) return;

  const now = context.currentTime;
  playTone(220, now, 0.18, 'sawtooth', 0.13);
  playTone(165, now + 0.16, 0.22, 'sawtooth', 0.12);
  playTone(110, now + 0.36, 0.32, 'sawtooth', 0.12);
}

function startGame() {
  isPlaying = true;
  isJumping = false;
  score = 0;
  obstacleSpeed = 1.7;

  player.classList.remove('jump');
  scoreText.textContent = score;
  gameStatusText.textContent = '진행 중';
  startPanel.classList.add('hidden');
  gameOverPanel.classList.add('hidden');
  winPanel.classList.add('hidden');

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
  playJumpSound();
  player.classList.add('jump');

  setTimeout(() => {
    player.classList.remove('jump');
    isJumping = false;
  }, 520);
}

function addScore() {
  score += 1;
  scoreText.textContent = score;

  if (score >= WIN_SCORE) {
    winGame();
  }
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

function stopGameLoop() {
  obstacle.classList.remove('move');

  clearInterval(scoreTimer);
  clearInterval(collisionTimer);
  clearInterval(difficultyTimer);
}

function saveBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('jumpTimingBestScore', bestScore);
    bestScoreText.textContent = bestScore;
  }
}

function endGame() {
  if (!isPlaying) return;

  isPlaying = false;
  gameStatusText.textContent = '게임 오버';
  finalScoreText.textContent = score;
  playLoseSound();

  stopGameLoop();
  saveBestScore();

  gameOverPanel.classList.remove('hidden');
}

function winGame() {
  if (!isPlaying) return;

  isPlaying = false;
  gameStatusText.textContent = '승리';
  playWinSound();

  stopGameLoop();
  saveBestScore();

  winPanel.classList.remove('hidden');
}

startButton.addEventListener('click', (event) => {
  event.stopPropagation();
  startGame();
});

restartButton.addEventListener('click', (event) => {
  event.stopPropagation();
  startGame();
});

winRestartButton.addEventListener('click', (event) => {
  event.stopPropagation();
  startGame();
});

game.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON') return;
  jump();
});

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
