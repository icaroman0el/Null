const bgmFinal = document.getElementById("bgmFinal");
const audioFinalMsg = document.getElementById("audioFinalMsg");

function setAudioHint(msg){
  if (audioFinalMsg) audioFinalMsg.textContent = msg || "";
}

async function autoPlayWithFallback(audioEl){
  if (!audioEl) return;

  try {
    audioEl.muted = false;
    await audioEl.play();
    setAudioHint("");
    return;
  } catch {
    try {
      audioEl.muted = true;
      await audioEl.play();
      setAudioHint("🔊 Toque na tela uma vez para ativar o som.");
    } catch {
      setAudioHint("🔊 Toque na tela uma vez para ativar o som.");
    }

    const unlockSound = async () => {
      try {
        audioEl.muted = false;
        await audioEl.play();
        setAudioHint("");
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

    if (hintEl) hintEl.textContent = "🔊 Toque na tela uma vez para ativar o som.";

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
  initSpotifyPlayer(document.querySelector(".spPlayer"));

  autoPlayWithFallback(bgmFinal);
})();
