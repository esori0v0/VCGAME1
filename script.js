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
const rankForm = document.getElementById('rankForm');
const nicknameInput = document.getElementById('nicknameInput');
const rankMessage = document.getElementById('rankMessage');
const rankingList = document.getElementById('rankingList');
const clearRankButton = document.getElementById('clearRankButton');

const WIN_SCORE = 15;
const OBSTACLE_SCORE = 3;
const RANKING_KEY = 'jumpTimingRanking';

const START_OBSTACLE_SPEED = 540;
const SPEED_UP_PER_OBSTACLE = 35;
const MAX_OBSTACLE_SPEED = 760;
const OBSTACLE_START_OFFSET = 70;

let isPlaying = false;
let isJumping = false;
let score = 0;
let bestScore = Number(localStorage.getItem('jumpTimingBestScore')) || 0;
let obstacleSpeed = START_OBSTACLE_SPEED;
let obstacleX = 0;
let animationFrameId = null;
let lastFrameTime = 0;
let audioContext = null;
let hasScoredCurrentObstacle = false;
let isRankSavedThisRound = false;

goalScoreText.textContent = WIN_SCORE;
winScoreText.textContent = WIN_SCORE;
bestScoreText.textContent = bestScore;
renderRanking();

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
  obstacleSpeed = START_OBSTACLE_SPEED;
  hasScoredCurrentObstacle = false;
  isRankSavedThisRound = false;

  player.classList.remove('jump');
  scoreText.textContent = score;
  gameStatusText.textContent = '진행 중';
  rankMessage.textContent = '';
  nicknameInput.value = '';
  nicknameInput.disabled = false;
  startPanel.classList.add('hidden');
  gameOverPanel.classList.add('hidden');
  winPanel.classList.add('hidden');

  cancelAnimationFrame(animationFrameId);
  resetObstaclePosition();
  lastFrameTime = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
  if (!isPlaying) return;

  const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.033);
  lastFrameTime = currentTime;

  obstacleX -= obstacleSpeed * deltaTime;
  obstacle.style.transform = `translateX(${obstacleX}px)`;

  checkGameState();

  if (isPlaying && obstacleX < -obstacle.offsetWidth - 10) {
    resetObstaclePosition();
    hasScoredCurrentObstacle = false;
    obstacleSpeed = Math.min(MAX_OBSTACLE_SPEED, obstacleSpeed + SPEED_UP_PER_OBSTACLE);
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function resetObstaclePosition() {
  const gameWidth = game.clientWidth;
  obstacleX = gameWidth + OBSTACLE_START_OFFSET;
  obstacle.style.transform = `translateX(${obstacleX}px)`;
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

function addObstacleScore() {
  score += OBSTACLE_SCORE;
  scoreText.textContent = score;

  if (score >= WIN_SCORE) {
    winGame();
  }
}

function checkGameState() {
  const playerBox = player.getBoundingClientRect();
  const obstacleBox = obstacle.getBoundingClientRect();

  const isColliding =
    playerBox.left < obstacleBox.right &&
    playerBox.right > obstacleBox.left &&
    playerBox.bottom > obstacleBox.top &&
    playerBox.top < obstacleBox.bottom;

  if (isColliding) {
    endGame();
    return;
  }

  const passedObstacle = obstacleBox.right < playerBox.left;

  if (passedObstacle && !hasScoredCurrentObstacle) {
    hasScoredCurrentObstacle = true;
    addObstacleScore();
  }
}

function stopGameLoop() {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

function saveBestScore() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('jumpTimingBestScore', bestScore);
    bestScoreText.textContent = bestScore;
  }
}

function getRanking() {
  const savedRanking = localStorage.getItem(RANKING_KEY);

  if (!savedRanking) return [];

  try {
    return JSON.parse(savedRanking);
  } catch (error) {
    return [];
  }
}

function saveRanking(ranking) {
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
}

function addRanking(nickname) {
  const ranking = getRanking();

  ranking.push({
    nickname,
    score,
    date: new Date().toLocaleDateString('ko-KR')
  });

  ranking.sort((a, b) => b.score - a.score);
  saveRanking(ranking.slice(0, 10));
  renderRanking();
}

function renderRanking() {
  const ranking = getRanking();

  rankingList.innerHTML = '';

  if (ranking.length === 0) {
    rankingList.innerHTML = '<li class="empty-rank">아직 등록된 기록이 없습니다.</li>';
    return;
  }

  ranking.forEach((rank) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${rank.nickname}</strong> - ${rank.score}점 <span class="rank-date">${rank.date}</span>`;
    rankingList.appendChild(li);
  });
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
  nicknameInput.focus();
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

rankForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (isRankSavedThisRound) {
    rankMessage.textContent = '이미 이번 기록을 등록했습니다.';
    return;
  }

  const nickname = nicknameInput.value.trim();

  if (nickname.length === 0) {
    rankMessage.textContent = '닉네임을 입력해주세요.';
    return;
  }

  addRanking(nickname);
  isRankSavedThisRound = true;
  nicknameInput.disabled = true;
  rankMessage.textContent = '랭킹에 등록되었습니다!';
});

clearRankButton.addEventListener('click', () => {
  localStorage.removeItem(RANKING_KEY);
  renderRanking();
});

game.addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT' || event.target.tagName === 'LABEL') return;
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
