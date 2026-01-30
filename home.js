// Troque aqui a senha:
const PASSWORD = "300825";

const authCard = document.getElementById("authCard");
const enterCard = document.getElementById("enterCard");
const passwordEl = document.getElementById("password");
const unlockBtn = document.getElementById("unlockBtn");
const clearBtn = document.getElementById("clearBtn");
const lockBtn = document.getElementById("lockBtn");
const goPuzzleBtn = document.getElementById("goPuzzleBtn");
const authMsg = document.getElementById("authMsg");

const bgmHome = document.getElementById("bgmHome");
const audioMsg = document.getElementById("audioMsg");

function setError(msg){
  authMsg.textContent = msg || "";
}

function setAudioHint(msg){
  audioMsg.textContent = msg || "";
}

async function autoPlayWithFallback(audioEl){
  if (!audioEl) return;

  try {
    audioEl.muted = false;
    await audioEl.play();
    setAudioHint("");
    return;
  } catch {
    // fallback: tenta autoplay mudo (muitos celulares deixam), e depois desmuta no primeiro toque
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

function unlock(){
  localStorage.setItem("site_unlocked", "1");
  authCard.classList.add("hidden");
  enterCard.classList.remove("hidden");
  setError("");
}

function lock(){
  localStorage.removeItem("site_unlocked");
  enterCard.classList.add("hidden");
  authCard.classList.remove("hidden");
  passwordEl.value = "";
  setError("");
  passwordEl.focus();
}

function tryUnlock(){
  const val = (passwordEl.value || "").trim();
  if (!val){
    setError("Digite a senha.");
    passwordEl.focus();
    return;
  }
  if (val !== PASSWORD){
    setError("Senha incorreta 😅");
    authCard.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
      { duration: 220, easing: "ease-out" }
    );
    passwordEl.select();
    return;
  }
  unlock();
}

(function init(){
  autoPlayWithFallback(bgmHome);

  const isUnlocked = localStorage.getItem("site_unlocked") === "1";
  if (isUnlocked) unlock();

  unlockBtn.addEventListener("click", tryUnlock);
  clearBtn.addEventListener("click", () => {
    passwordEl.value = "";
    setError("");
    passwordEl.focus();
  });

  lockBtn?.addEventListener("click", lock);

  passwordEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock();
  });

  goPuzzleBtn?.addEventListener("click", () => {
    window.location.href = "puzzle.html";
  });

  passwordEl.focus();
})();
