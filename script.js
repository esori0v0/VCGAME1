const game = document.getElementById('game');
const player = document.getElementById('player');
const obstacle = document.getElementById('obstacle');
const scoreText = document.getElementById('score');
const goalScoreText = document.getElementById('goalScore');
const stageText = document.getElementById('stageText');
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
const loseRankForm = document.getElementById('loseRankForm');
const loseNicknameInput = document.getElementById('loseNicknameInput');
const loseRankMessage = document.getElementById('loseRankMessage');
const rankingList = document.getElementById('rankingList');
const clearRankButton = document.getElementById('clearRankButton');

const WIN_SCORE = 15;
const OBSTACLE_SCORE = 3;
const RANKING_KEY = 'jumpTimingRanking';
const OBSTACLE_START_OFFSET = 70;

const STAGES = [
  { level: 1, minScore: 0, speed: 500, label: '1단계' },
  { level: 2, minScore: 6, speed: 620, label: '2단계' },
  { level: 3, minScore: 12, speed: 760, label: '3단계' }
];

let isPlaying = false;
let isJumping = false;
let score = 0;
let bestScore = Number(localStorage.getItem('jumpTimingBestScore')) || 0;
let currentStage = STAGES[0];
let obstacleSpeed = currentStage.speed;
let obstacleX = 0;
let animationFrameId = null;
let lastFrameTime = 0;
let audioContext = null;
let hasScoredCurrentObstacle = false;
let isRankSavedThisRound = false;
let currentResult = '패배';

goalScoreText.textContent = WIN_SCORE;
winScoreText.textContent = WIN_SCORE;
bestScoreText.textContent = bestScore;
stageText.textContent = currentStage.label;
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
  currentStage = STAGES[0];
  obstacleSpeed = currentStage.speed;
  hasScoredCurrentObstacle = false;
  isRankSavedThisRound = false;
  currentResult = '패배';

  player.classList.remove('jump');
  scoreText.textContent = score;
  stageText.textContent = currentStage.label;
  gameStatusText.textContent = '진행 중';
  rankMessage.textContent = '';
  loseRankMessage.textContent = '';
  nicknameInput.value = '';
  loseNicknameInput.value = '';
  nicknameInput.disabled = false;
  loseNicknameInput.disabled = false;
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

function getStageByScore(currentScore) {
  let selectedStage = STAGES[0];

  STAGES.forEach((stage) => {
    if (currentScore >= stage.minScore) {
      selectedStage = stage;
    }
  });

  return selectedStage;
}

function updateStage() {
  const nextStage = getStageByScore(score);

  if (nextStage.level !== currentStage.level) {
    currentStage = nextStage;
    obstacleSpeed = currentStage.speed;
    stageText.textContent = currentStage.label;
    gameStatusText.textContent = `${currentStage.label} 진행 중`;
  }
}

function addObstacleScore() {
  score += OBSTACLE_SCORE;
  scoreText.textContent = score;
  updateStage();

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
    result: currentResult,
    stage: currentStage.label,
    date: new Date().toLocaleDateString('ko-KR')
  });

  ranking.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.result === b.result) return 0;
    return a.result === '승리' ? -1 : 1;
  });

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
    const result = rank.result || '기록';
    const stage = rank.stage || '';
    li.innerHTML = `<strong>${rank.nickname}</strong> - ${rank.score}점 <span class="rank-result">${result}</span> <span class="rank-stage">${stage}</span> <span class="rank-date">${rank.date}</span>`;
    rankingList.appendChild(li);
  });
}

function saveCurrentRank(inputElement, messageElement) {
  if (isRankSavedThisRound) {
    messageElement.textContent = '이미 이번 기록을 등록했습니다.';
    return;
  }

  const nickname = inputElement.value.trim();

  if (nickname.length === 0) {
    messageElement.textContent = '닉네임을 입력해주세요.';
    return;
  }

  addRanking(nickname);
  isRankSavedThisRound = true;
  nicknameInput.disabled = true;
  loseNicknameInput.disabled = true;
  messageElement.textContent = '랭킹에 등록되었습니다!';
}

function endGame() {
  if (!isPlaying) return;

  isPlaying = false;
  currentResult = '패배';
  gameStatusText.textContent = '게임 오버';
  finalScoreText.textContent = score;
  playLoseSound();

  stopGameLoop();
  saveBestScore();

  gameOverPanel.classList.remove('hidden');
  loseNicknameInput.focus();
}

function winGame() {
  if (!isPlaying) return;

  isPlaying = false;
  currentResult = '승리';
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
  saveCurrentRank(nicknameInput, rankMessage);
});

loseRankForm.addEventListener('submit', (event) => {
  event.preventDefault();
  event.stopPropagation();
  saveCurrentRank(loseNicknameInput, loseRankMessage);
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
