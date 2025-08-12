const PHOTO_COUNT = 5;
const MAX_PHOTO = 5;
const MAX_BOMB = 10;

const playfield = document.getElementById('playfield');
const scoreDisplay = document.getElementById('score-display');
const highscoreDisplay = document.getElementById('highscore-display');
const startBtn = document.getElementById('start-btn');
const gameoverModal = document.getElementById('gameover-modal');
const finalScoreP = document.getElementById('final-score');
const retryBtn = document.getElementById('retry-btn');

let score = 0;
let highscore = 0;
let running = false;
let objects = [];
let animId = null;
let startTime = null;

const photos = [];
for (let i = 1; i <= PHOTO_COUNT; i++) {
  photos.push(`assets/photo${i}.png`);
}
const bombs = [];
for (let i = 1; i <= PHOTO_COUNT; i++) {
  bombs.push(`assets/bomb${i}.png`);
}

const popSound = new Audio('assets/pop_sound.mp3');
const explosionSound = new Audio('assets/explosion_sound.mp3');

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function createBloodEffect(playfield, x, y) {
  const effect = document.createElement('div');
  effect.className = 'blood-splash';
  effect.style.left = `${x - 40}px`;
  effect.style.top = `${y - 40}px`;
  playfield.appendChild(effect);

  setTimeout(() => {
    effect.remove();
  }, 2000);
}

// 사진 오브젝트 5개 고정 생성
function spawnPhotos() {
  const rect = playfield.getBoundingClientRect();
  for (let i = 0; i < MAX_PHOTO; i++) {
    const el = document.createElement('img');
    el.src = photos[i % photos.length];
    el.className = 'target';
    el.draggable = false;
    playfield.appendChild(el);

    const vx = rand(-3, 3);
    const vy = rand(-3, 3);
    const x = rand(0, rect.width - 64);
    const y = rand(0, rect.height - 64);
    el.style.transform = `translate(${x}px,${y}px)`;

    const obj = { el, vx, vy, type: 'photo', w: 64, h: 64 };
    objects.push(obj);

    el.addEventListener(
      'pointerdown',
      (ev) => {
        ev.preventDefault();
        if (!running) return;

        score += 10;
        scoreDisplay.textContent = `점수: ${score}`;
        popSound.currentTime = 0;
        popSound.play();

        const tr = el.style.transform;
        const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tr);
        if (m) {
          const x = parseFloat(m[1]);
          const y = parseFloat(m[2]);
          createBloodEffect(playfield, x, y);
        }

        el.style.transition = 'transform 150ms ease, opacity 200ms ease';
        el.style.transform += ' scale(0.2)';
        el.style.opacity = '0';

        setTimeout(() => {
          if (!running) return;
          const newX = rand(0, rect.width - obj.w);
          const newY = rand(0, rect.height - obj.h);
          el.style.transition = '';
          el.style.transform = `translate(${newX}px,${newY}px)`;
          el.style.opacity = '1';
        }, 1000);
      },
      { passive: false }
    );
  }
}

// 폭탄 추가 함수 (한 개씩 추가)
function addBomb() {
  if (!running) return;
  const rect = playfield.getBoundingClientRect();

  // 현재 폭탄 개수 체크
  const currentBombs = objects.filter((o) => o.type === 'bomb').length;
  if (currentBombs >= MAX_BOMB) return;

  const index = currentBombs % bombs.length;
  const el = document.createElement('img');
  el.src = bombs[index];
  el.className = 'bomb';
  el.draggable = false;
  playfield.appendChild(el);

  const vx = rand(-1.5, 1.5);
  const vy = rand(-1.5, 1.5);
  const x = rand(0, rect.width - 64);
  const y = rand(0, rect.height - 64);
  el.style.transform = `translate(${x}px,${y}px)`;

  const obj = { el, vx, vy, type: 'bomb', w: 64, h: 64 };
  objects.push(obj);

  el.addEventListener(
    'pointerdown',
    (ev) => {
      ev.preventDefault();
      if (!running) return;

      explosionSound.currentTime = 0;
      explosionSound.play();
      showGameOver();
    },
    { passive: false }
  );
}

function step() {
  if (!running) return;

  const rect = playfield.getBoundingClientRect();

  objects.forEach((o) => {
    const tr = o.el.style.transform;
    const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(tr);
    let x = 0,
      y = 0;
    if (m) {
      x = parseFloat(m[1]);
      y = parseFloat(m[2]);
    }

    x += o.vx * 3;
    y += o.vy * 3;

    if (x <= 0) {
      x = 0;
      o.vx *= -1;
    }
    if (y <= 0) {
      y = 0;
      o.vy *= -1;
    }
    if (x + o.w >= rect.width) {
      x = rect.width - o.w;
      o.vx *= -1;
    }
    if (y + o.h >= rect.height) {
      y = rect.height - o.h;
      o.vy *= -1;
    }

    o.el.style.transform = `translate(${x}px,${y}px)`;
  });

  animId = requestAnimationFrame(step);
}

let bombIntervalId = null;

function startGame() {
  if (running) return;
  running = true;
  score = 0;
  scoreDisplay.textContent = `점수: 0`;
  highscoreDisplay.textContent = `최고점수: ${highscore}`;
  gameoverModal.classList.add('hidden');
  startTime = Date.now();

  // 기존 객체 다 지우기
  objects.forEach((o) => o.el.remove());
  objects = [];

  spawnPhotos();

  // 첫 폭탄 1개 바로 추가
  addBomb();

  // 5초마다 폭탄 1개씩 추가, 최대 10개
  if (bombIntervalId) clearInterval(bombIntervalId);
  bombIntervalId = setInterval(() => {
    addBomb();
    if (
      objects.filter((o) => o.type === 'bomb').length >= MAX_BOMB
    ) {
      clearInterval(bombIntervalId);
    }
  }, 5000);

  animId = requestAnimationFrame(step);
}

function showGameOver() {
  running = false;
  cancelAnimationFrame(animId);
  clearInterval(bombIntervalId);
  finalScoreP.textContent = `점수: ${score}`;
  if (score > highscore) {
    highscore = score;
  }
  highscoreDisplay.textContent = `최고점수: ${highscore}`;
  gameoverModal.classList.remove('hidden');
}

retryBtn.addEventListener('click', () => {
  gameoverModal.classList.add('hidden');
  startGame();
});

startBtn.addEventListener('click', startGame);
