const zoomOutButton = document.querySelector("#zoom-out");
const zoomInButton = document.querySelector("#zoom-in");
const zoomValue = document.querySelector("#zoom-value");
const chapterValue = document.querySelector("#current-chapter");
const mainContent = document.querySelector("main");
const scenes = [...document.querySelectorAll("main > .scene, .creator-credit")];
let pageZoom = 1;
let activeScene = Math.max(0, scenes.findIndex((scene) => `#${scene.id}` === window.location.hash));
let isTransitioning = false;
let sceneTimer;
let entranceTimer;
let touchStartY = null;

document.body.classList.add("is-presentation");

function updateZoom() {
  mainContent.style.zoom = String(pageZoom);
  zoomValue.value = `${Math.round(pageZoom * 100)}%`;
  zoomValue.textContent = `${Math.round(pageZoom * 100)}%`;
  zoomOutButton.disabled = pageZoom <= 0.8;
  zoomInButton.disabled = pageZoom >= 1.2;
}

zoomOutButton.addEventListener("click", () => {
  pageZoom = Math.max(0.8, Math.round((pageZoom - 0.1) * 10) / 10);
  updateZoom();
});

zoomInButton.addEventListener("click", () => {
  pageZoom = Math.min(1.2, Math.round((pageZoom + 0.1) * 10) / 10);
  updateZoom();
});

function showScene(nextScene, updateHistory = true) {
  if (nextScene < 0 || nextScene >= scenes.length || nextScene === activeScene || isTransitioning) return;

  isTransitioning = true;
  const previous = scenes[activeScene];
  const next = scenes[nextScene];
  previous.classList.add("scene-leaving");
  next.classList.add("scene-current");
  activeScene = nextScene;
  chapterValue.textContent = String(activeScene + 1).padStart(2, "0");

  if (updateHistory) {
    window.history.pushState(null, "", `#${next.id}`);
  }

  window.clearTimeout(sceneTimer);
  window.clearTimeout(entranceTimer);
  scenes.forEach((scene) => scene.classList.remove("scene-entering"));
  next.classList.add("scene-entering");

  sceneTimer = window.setTimeout(() => {
    previous.classList.remove("scene-current", "scene-leaving");
    isTransitioning = false;
  }, 520);
  entranceTimer = window.setTimeout(() => {
    next.classList.remove("scene-entering");
  }, 1500);
}

function moveScene(direction) {
  showScene(activeScene + direction);
}

window.addEventListener("wheel", (event) => {
  if (event.ctrlKey || event.deltaY === 0) return;

  event.preventDefault();
  if (Math.abs(event.deltaY) < 12) return;
  moveScene(event.deltaY > 0 ? 1 : -1);
}, { passive: false });

window.addEventListener("touchstart", (event) => {
  touchStartY = event.changedTouches[0]?.clientY ?? null;
}, { passive: true });

window.addEventListener("touchend", (event) => {
  if (touchStartY === null) return;

  const touchEndY = event.changedTouches[0]?.clientY;
  if (touchEndY === undefined) {
    touchStartY = null;
    return;
  }

  const distance = touchStartY - touchEndY;
  touchStartY = null;
  if (Math.abs(distance) < 50) return;
  if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [contenteditable='true']")) return;

  moveScene(distance > 0 ? 1 : -1);
}, { passive: true });

window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [contenteditable='true']")) return;

  if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    moveScene(1);
  } else if (event.key === "ArrowUp" || event.key === "PageUp") {
    event.preventDefault();
    moveScene(-1);
  }
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href").slice(1);
    const targetScene = scenes.findIndex((scene) => scene.id === targetId);
    if (targetScene === -1) return;

    event.preventDefault();
    showScene(targetScene);
  });
});

window.addEventListener("popstate", () => {
  const targetScene = scenes.findIndex((scene) => `#${scene.id}` === window.location.hash);
  if (targetScene !== -1) showScene(targetScene, false);
});

scenes[activeScene].classList.add("scene-current", "scene-entering");
chapterValue.textContent = String(activeScene + 1).padStart(2, "0");
updateZoom();
entranceTimer = window.setTimeout(() => {
  scenes[activeScene].classList.remove("scene-entering");
}, 1500);

const artUpload = document.querySelector("#art-upload");
const artUploadStatus = document.querySelector("#art-upload-status");
const galleryImage = document.querySelector(".gallery-feature > img");
let selectedArtworkUrl;

artUpload.addEventListener("change", () => {
  const [file] = artUpload.files;
  if (!file) return;

  if (selectedArtworkUrl) URL.revokeObjectURL(selectedArtworkUrl);
  selectedArtworkUrl = URL.createObjectURL(file);
  galleryImage.src = selectedArtworkUrl;
  galleryImage.alt = `Artwork selected from your device: ${file.name}`;
  artUploadStatus.textContent = `${file.name} — looking lovely!`;
});

document.querySelectorAll(".memory-upload").forEach((input) => {
  input.addEventListener("change", () => {
    const [file] = input.files;
    if (!file) return;

    const picture = input.closest(".memory-card").querySelector(".memory-picture");
    const [background, character] = picture.querySelectorAll("img");
    background.src = URL.createObjectURL(file);
    background.alt = `Birthday memory selected from your device: ${file.name}`;
    character.hidden = true;
  });
});
