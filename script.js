let audioContext;
let soundEnabled = true;
let burstClicks = 0;
let burstTimer;
let score = 0;
let seconds = 15;
let gameInterval;

const palettes = [
  { tubes: ['#c7ff56', '#8be3c7', '#8c75ed'], lights: ['#c7ff56', '#67d8ff', '#e982df', '#ffb15e'] },
  { tubes: ['#f967fb', '#53bc28', '#6958d5'], lights: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'] },
  { tubes: ['#54dbff', '#a886ff', '#fb8b61'], lights: ['#66dfff', '#ba74ff', '#ff7d9b', '#c5ff57'] },
  { tubes: ['#ffb950', '#ff6f91', '#7a74ff'], lights: ['#ffbd56', '#ff6f91', '#7a74ff', '#b2fa68'] },
];
let paletteIndex = 0;
let clickShapeIndex = 0;

document.addEventListener('click', (event) => {
  const stamp = document.createElement('span');
  const shape = clickShapeIndex++ % 2 === 0 ? 'triangle' : 'square';
  const bounds = event.target instanceof Element ? event.target.getBoundingClientRect() : null;
  const x = event.detail === 0 && bounds ? bounds.left + bounds.width / 2 : event.clientX;
  const y = event.detail === 0 && bounds ? bounds.top + bounds.height / 2 : event.clientY;
  stamp.className = `click-stamp click-stamp-${shape}`;
  stamp.setAttribute('aria-hidden', 'true');
  stamp.style.left = `${x}px`;
  stamp.style.top = `${y}px`;
  stamp.innerHTML = shape === 'triangle'
    ? '<svg viewBox="0 0 32 32"><path d="M16 3 29 28H3L16 3Z"/></svg>'
    : '<svg viewBox="0 0 32 32"><path d="M7 7h18v18H7z"/></svg>';
  document.body.appendChild(stamp);
  stamp.addEventListener('animationend', () => stamp.remove(), { once: true });
});

function playTick() {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(640, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(370, audioContext.currentTime + 0.075);
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.09);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.09);
  } catch { /* Sound is optional on browsers that do not support Web Audio. */ }
}

function changeTubePalette() {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  window.portfolioTubePalette = palettes[paletteIndex];
  window.dispatchEvent(new CustomEvent('portfolio-tube-colors', { detail: palettes[paletteIndex] }));
}

const soundToggle = document.querySelector('.sound-toggle');
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute('aria-pressed', String(!soundEnabled));
  soundToggle.querySelector('span:last-child').textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF';
  if (soundEnabled) playTick();
});

const discovery = document.querySelector('.game-discovery');
const hudCount = document.querySelector('.hud-copy b');
document.addEventListener('click', (event) => {
  if (event.target.closest('a, button, input, textarea, select, .hero-photo-wrap')) return;
  playTick();
  changeTubePalette();
  if (!discovery.hidden) return;
  burstClicks = Math.min(5, burstClicks + 1);
  hudCount.textContent = `${burstClicks} / 5`;
  document.querySelector('.signal-hud').classList.add('is-awake');
  clearTimeout(burstTimer);
  burstTimer = setTimeout(() => {
    burstClicks = 0;
    hudCount.textContent = '0 / 5';
    document.querySelector('.signal-hud').classList.remove('is-awake');
  }, 2400);
  if (burstClicks === 5) {
    discovery.hidden = false;
    discovery.classList.add('is-found');
    hudCount.textContent = 'FOUND';
    playTick();
  }
});

const overlay = document.querySelector('.game-overlay');
const board = document.querySelector('#game-board');
const target = document.querySelector('.signal-target');
const scoreOutput = document.querySelector('#game-score');
const timeOutput = document.querySelector('#game-time');
const startButton = document.querySelector('.game-start');
function openGame() {
  overlay.hidden = false;
  document.body.classList.add('game-open');
  document.querySelector('.game-close').focus();
}
function closeGame() {
  overlay.hidden = true;
  document.body.classList.remove('game-open');
  clearInterval(gameInterval);
  startButton.innerHTML = 'Start the hunt <span>↗</span>';
  discovery.focus();
}
function moveTarget() {
  const maxX = Math.max(0, board.clientWidth - target.offsetWidth - 28);
  const maxY = Math.max(0, board.clientHeight - target.offsetHeight - 28);
  target.style.left = `${14 + Math.random() * maxX}px`;
  target.style.top = `${14 + Math.random() * maxY}px`;
}
function finishGame() {
  clearInterval(gameInterval);
  target.hidden = true;
  board.querySelector('.game-start-note').textContent = `Signal secured: ${String(score).padStart(2, '0')} ${score === 1 ? 'point' : 'points'}. Go again?`;
  startButton.hidden = false;
  startButton.innerHTML = 'Play again <span>↗</span>';
}
function startGame() {
  clearInterval(gameInterval);
  score = 0;
  seconds = 15;
  scoreOutput.textContent = '00';
  timeOutput.textContent = '15';
  board.querySelector('.game-start-note').textContent = 'Find the signal. Stay sharp.';
  startButton.hidden = true;
  target.hidden = false;
  moveTarget();
  gameInterval = setInterval(() => {
    seconds -= 1;
    timeOutput.textContent = String(seconds).padStart(2, '0');
    if (seconds <= 0) finishGame();
  }, 1000);
}
discovery.addEventListener('click', openGame);
document.querySelector('.game-close').addEventListener('click', closeGame);
overlay.addEventListener('click', (event) => { if (event.target === overlay) closeGame(); });
startButton.addEventListener('click', startGame);
target.addEventListener('click', () => {
  score += 1;
  scoreOutput.textContent = String(score).padStart(2, '0');
  playTick();
  moveTarget();
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !overlay.hidden) closeGame(); });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.experience-card, .project-card, .stat-row > div').forEach((item) => observer.observe(item));
