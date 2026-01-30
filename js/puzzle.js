// ===== Config =====
const ROWS = 5;
const COLS = 5;
const SIZE = ROWS * COLS;

// Coloque sua imagem em /assets/foto.jpg
const PUZZLE_IMAGE_PATH = "assets/foto.jpg";

// Quanto maior, MAIS insano o embaralhamento.
// 5x5 precisa de bem mais passos pra ficar "bem longe" do resolvido.
const SCRAMBLE_MOVES = 12000;

let state = [];
let turns = 0;
let imageDataUrl = null;

const boardEl = document.getElementById("board");
const turnsEl = document.getElementById("turns");
const msgEl = document.getElementById("puzzleMsg");

const shuffleBtn = document.getElementById("shuffleBtn");
const resetBtn = document.getElementById("resetBtn");

const winModal = document.getElementById("winModal");
const winText = document.getElementById("winText");
const goFinalBtn = document.getElementById("goFinalBtn");

// Música
const bgm = document.getElementById("bgmPuzzle");

// ===== Utils =====
function setMessage(t){ msgEl.textContent = t || ""; }

function solvedState(){
  // [1..24, 0]
  return Array.from({ length: SIZE }, (_, i) => (i === SIZE - 1 ? 0 : i + 1));
}

function isSolved(arr){
  for (let i = 0; i < SIZE - 1; i++){
    if (arr[i] !== i + 1) return false;
  }
  return arr[SIZE - 1] === 0;
}

function indexToRC(i){
  return { r: Math.floor(i / COLS), c: i % COLS };
}

function manhattan(i, j){
  const a = indexToRC(i);
  const b = indexToRC(j);
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function neighbors(blankIndex){
  const { r, c } = indexToRC(blankIndex);
  const out = [];
  if (r > 0) out.push(blankIndex - COLS);
  if (r < ROWS - 1) out.push(blankIndex + COLS);
  if (c > 0) out.push(blankIndex - 1);
  if (c < COLS - 1) out.push(blankIndex + 1);
  return out;
}

// Embaralha por MUITOS movimentos válidos (sempre solucionável).
function scrambleByMoves(moves){
  const arr = solvedState();
  let blank = arr.indexOf(0);
  let prevBlank = -1;

  for (let i = 0; i < moves; i++){
    let opts = neighbors(blank);

    // evita desfazer o passo anterior (deixa mais "andado")
    if (prevBlank !== -1) opts = opts.filter(x => x !== prevBlank);

    const next = opts[Math.floor(Math.random() * opts.length)];
    [arr[blank], arr[next]] = [arr[next], arr[blank]];
    prevBlank = blank;
    blank = next;
  }

  if (isSolved(arr)) return scrambleByMoves(moves + 200);
  return arr;
}

function setTurns(n){
  turns = n;
  turnsEl.textContent = String(turns);
}

// ===== Image crop to square =====
function cropToSquareDataURL(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = Math.floor((img.naturalWidth - side) / 2);
      const sy = Math.floor((img.naturalHeight - side) / 2);

      const canvas = document.createElement("canvas");
      const out = 1200;
      canvas.width = out;
      canvas.height = out;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Não consegui carregar assets/foto.jpg. Verifique nome/caminho."));
    img.src = src;
  });
}

async function loadPuzzleImage(){
  try {
    imageDataUrl = await cropToSquareDataURL(PUZZLE_IMAGE_PATH);
    return true;
  } catch {
    imageDataUrl = null;
    return false;
  }
}

// ===== Render =====
function render(){
  boardEl.innerHTML = "";

  for (let pos = 0; pos < SIZE; pos++){
    const value = state[pos];
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.setAttribute("role", "button");

    if (value === 0){
      tile.classList.add("empty");
      tile.setAttribute("aria-label", "Vazio");
    } else {
      tile.setAttribute("aria-label", `Peça ${value}`);

      // value 1..24 -> idx 0..23 (posição correta no grid 5x5)
      const idx = value - 1;
      const r = Math.floor(idx / COLS);
      const c = idx % COLS;

      if (imageDataUrl){
        tile.style.backgroundImage = `url("${imageDataUrl}")`;
      }

      // IMPORTANTE: background-size proporcional ao grid
      tile.style.backgroundSize = `${COLS * 100}% ${ROWS * 100}%`;

      // mapeia a "janela" da peça (0..100%)
      const x = (COLS === 1) ? 0 : (c / (COLS - 1)) * 100;
      const y = (ROWS === 1) ? 0 : (r / (ROWS - 1)) * 100;
      tile.style.backgroundPosition = `${x}% ${y}%`;
    }

    tile.addEventListener("click", () => onTileTap(pos));
    boardEl.appendChild(tile);
  }
}

// ===== Game =====
function onTileTap(pos){
  const blank = state.indexOf(0);
  if (state[pos] === 0) return;

  if (manhattan(pos, blank) === 1){
    [state[pos], state[blank]] = [state[blank], state[pos]];
    setTurns(turns + 1);
    render();

    if (isSolved(state)){
      showWin();
    }
  }
}

function newHardStart(){
  state = scrambleByMoves(SCRAMBLE_MOVES);
  setTurns(0);
  hideWin();
  render();
  setMessage("Boa sorte kkkkkkkkkkkkkkkkk😈💙");
}

function resetGame(){
  // Reset agora volta pra um começo DIFÍCIL (bem embaralhado)
  newHardStart();
}

function shuffleGame(){
  newHardStart();
}

function showWin(){
  winText.textContent = `Você completou em ${turns} jogadas! 💙`;
  winModal.classList.remove("hidden");

  setTimeout(() => {
    window.location.href = "final.html";
  }, 2600);
}

function hideWin(){
  winModal.classList.add("hidden");
}

// ===== Autoplay helper =====
async function autoPlayWithFallback(audioEl){
  if (!audioEl) return;

  try {
    audioEl.muted = false;
    await audioEl.play();
    return;
  } catch {
    try {
      audioEl.muted = true;
      await audioEl.play();
    } catch {}

    const unlockSound = async () => {
      try {
        audioEl.muted = false;
        await audioEl.play();
      } catch {}
    };

    document.addEventListener("pointerdown", unlockSound, { once: true });
    document.addEventListener("touchstart", unlockSound, { once: true });
  }
}

function fmtTime(s){
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2,"0")}`;
}

async function autoPlayWithFallback(audioEl, hintEl){
  if (!audioEl) return;

  try {
    audioEl.muted = false;
    await audioEl.play();
    if (hintEl) hintEl.textContent = "";
    return;
  } catch {
    try {
      audioEl.muted = true;
      await audioEl.play();
    } catch {}

    if (hintEl) hintEl.textContent = "Toca na tela uma vez para música Tocar";

    const unlockSound = async () => {
      try {
        audioEl.muted = false;
        await audioEl.play();
        if (hintEl) hintEl.textContent = "";
      } catch {}
    };

    document.addEventListener("pointerdown", unlockSound, { once: true });
    document.addEventListener("touchstart", unlockSound, { once: true });
  }
}

function initSpotifyPlayer(root){
  if (!root) return;

  const audioId = root.dataset.audio;
  const audio = document.getElementById(audioId);

  const toggleBtn = root.querySelector('[data-role="toggle"]');
  const seek = root.querySelector('[data-role="seek"]');
  const cur = root.querySelector('[data-role="cur"]');
  const dur = root.querySelector('[data-role="dur"]');
  const hint = root.querySelector('[data-role="hint"]');

  // aplica título/capa do dataset (opcional)

  function syncBtn(){
    toggleBtn.textContent = audio.paused ? "▶" : "❚❚";
  }

  audio.addEventListener("loadedmetadata", () => {
    if (dur) dur.textContent = fmtTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (!seek) return;
    const p = audio.duration ? (audio.currentTime / audio.duration) : 0;
    seek.value = String(Math.floor(p * 1000));
    if (cur) cur.textContent = fmtTime(audio.currentTime);
  });

  audio.addEventListener("play", syncBtn);
  audio.addEventListener("pause", syncBtn);

  toggleBtn?.addEventListener("click", async () => {
    if (audio.paused) {
      try { await audio.play(); } catch {}
    } else {
      audio.pause();
    }
    syncBtn();
  });

  seek?.addEventListener("input", () => {
    if (!audio.duration) return;
    const p = Number(seek.value) / 1000;
    audio.currentTime = p * audio.duration;
  });

  // tenta tocar assim que entrar (com fallback)
  autoPlayWithFallback(audio, hint);
  syncBtn();
}


(function init(){
  (async () => {
    setMessage("Carregando…");
initSpotifyPlayer(document.querySelector(".spPlayer"));

    // render básico imediato
    state = solvedState();
    setTurns(0);
    render();

    const ok = await loadPuzzleImage();
    if (!ok){
      setMessage("⚠️ Coloque sua foto em /assets/foto.jpg (mesmo nome) para aparecer no puzzle.");
    }

    // começa DIRETO bem embaralhado com a foto já aplicada
    newHardStart();
    if (!ok) setMessage("⚠️ Foto não carregou. O puzzle funciona, mas sem imagem.");
  })();

  shuffleBtn.addEventListener("click", () => {
    shuffleGame();
    autoPlayWithFallback(bgm);
  });

  resetBtn.addEventListener("click", resetGame);

  goFinalBtn.addEventListener("click", () => {
    window.location.href = "final.html";
  });

  autoPlayWithFallback(bgm);
})();
