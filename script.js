let BRANI = {}, TESTI = {}, GLOSSARI = {};
let currentBranoId = null;
let currentAudio = "";
let fumettoVisibile = false;

let audioPlayer = null;

// Verifica se un file locale esiste
async function fileLocaleEsiste(percorso) {
  try {
    const r = await fetch(percorso, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

// Inizializzazione completa
async function init() {

  audioPlayer = document.getElementById("audioPlayer");

  const audioLocale = await fileLocaleEsiste("./audio/1.mp3");
  const videoLocale = await fileLocaleEsiste("./video/1.mp4");
  const dataLocale = await fileLocaleEsiste("./data/brani.json");

  window.AUDIO_BASE = audioLocale
    ? "./audio/"
    : "https://brevecanto.netlify.app/audio/";

  window.VIDEO_BASE = videoLocale
    ? "./video/"
    : "https://brevecanto.netlify.app/video/";

  window.DATA_BASE = dataLocale
    ? "./data/"
    : "https://brevecanto.netlify.app/data/";

  BRANI = await fetch(DATA_BASE + "brani.json").then(r => r.json());
  TESTI = await fetch(DATA_BASE + "testi.json").then(r => r.json());
  GLOSSARI = await fetch(DATA_BASE + "glossari.json").then(r => r.json());

  renderBrani();
  renderTesti();
  renderContesto();
  mostraSchermata("home");
}

init();

function mostraSchermata(id) {
  stopVideo();
  chiudiFumetto();
  document.querySelectorAll(".screen").forEach(screen => {
    screen.style.display = screen.id === id ? "block" : "none";
  });
}

function playAudio(src) {
  if (!audioPlayer) return;

  if (audioPlayer.src.split("/").pop() !== src.split("/").pop()) {
    audioPlayer.src = src;
  }
  audioPlayer.play();
}

function pausaAudio() {
  if (!audioPlayer) return;
  audioPlayer.pause();
}

function stopAudio() {
  if (!audioPlayer) return;
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
}

function avantiAudio() {
  if (!audioPlayer) return;
  audioPlayer.currentTime += 5;
}

function indietroAudio() {
  if (!audioPlayer) return;
  audioPlayer.currentTime -= 5;
}

function playVideo(src) {
  const video = document.getElementById("videoPlayer");
  if (!video) return;

  video.src = src;
  video.currentTime = 0;
  video.play();
}

function stopVideo() {
  const video = document.getElementById("videoPlayer");
  if (!video) return;

  video.pause();
  video.currentTime = 0;
  video.removeAttribute("src");
  video.load();
}

function renderBrani() {
  const lista = document.getElementById("listaBrani");
  lista.innerHTML = "";

  Object.values(BRANI).forEach(b => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${b.titolo}</strong><br>
      <button onclick="apriAudio(${b.id})">Audio</button>
      <button onclick="apriVideo(${b.id})">Video</button>
      <button onclick="apriTesto(${b.id})">Testo</button>
    `;
    lista.appendChild(div);
  });
}

function renderTesti() {
  const lista = document.getElementById("listaTesti");
  lista.innerHTML = "";

  Object.entries(TESTI).forEach(([id, t]) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${t.titolo}</strong><br>
      <button onclick="apriTesto(${id})">Apri testo</button>
    `;
    lista.appendChild(div);
  });
}

function apriAudio(id) {
  currentBranoId = id;
  const brano = BRANI[id];

  document.getElementById("titoloAudio").innerText = brano.titolo;
  mostraSchermata("audio");

  const nomeFile = brano.audio.split("/").pop();
  const urlAudio = AUDIO_BASE + nomeFile;

  currentAudio = urlAudio;
  audioPlayer.src = urlAudio;
  audioPlayer.currentTime = 0;
}

function apriVideo(id) {
  currentBranoId = id;
  const brano = BRANI[id];

  document.getElementById("titoloVideo").innerText = brano.titolo;
  mostraSchermata("video");
  stopAudio();

  const nomeFile = brano.video.split("/").pop();
  const urlVideo = VIDEO_BASE + nomeFile;

  const video = document.getElementById("videoPlayer");
  video.src = urlVideo;
  video.currentTime = 0;
}

function apriTesto(id) {
  currentBranoId = id;
  const testo = TESTI[id];
  const gloss = GLOSSARI[id];

  document.getElementById("titoloTesto").innerText = testo.titolo;

  let contenuto = testo.contenuto.replace(/\n/g, "<br>");

  if (gloss && gloss.voci) {
    gloss.voci.forEach(voce => {
      const parola = voce.parola.replace(/’/g, "'");
      const spiegazione = voce.spiegazione;

      const escaped = parola.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");

      contenuto = contenuto.replace(
        regex,
        `<span class="linkParola" data-parola="${parola}" data-spiegazione="${spiegazione}">${parola}</span>`
      );
    });
  }

  const box = document.getElementById("contenutoTesto");
  box.innerHTML = contenuto;

  chiudiFumetto();

  document.querySelectorAll(".linkParola").forEach(el => {
    el.addEventListener("click", ev => {
      mostraFumetto(el.dataset.parola, el.dataset.spiegazione, ev);
    });
  });

  mostraSchermata("testoBrano");
}

function mostraFumetto(parola, spiegazione, ev) {
  const fumetto = document.getElementById("fumetto");

  if (fumettoVisibile) return chiudiFumetto();

  fumetto.innerHTML = `<strong>${parola}</strong><br>${spiegazione}`;
  fumetto.style.display = "block";

  const rect = ev.target.getBoundingClientRect();
  fumetto.style.left = rect.left + "px";
  fumetto.style.top = rect.bottom + window.scrollY + 8 + "px";

  fumettoVisibile = true;
}

function chiudiFumetto() {
  const fumetto = document.getElementById("fumetto");
  fumetto.style.display = "none";
  fumettoVisibile = false;
}

function apriGlossario(id) {
  const gloss = GLOSSARI[id];
  const lista = document.getElementById("listaGlossario");

  lista.innerHTML = gloss && gloss.voci
    ? gloss.voci.map(v => `<p><strong>${v.parola}</strong>: ${v.spiegazione}</p>`).join("")
    : "<p>Nessun glossario disponibile.</p>";

  mostraSchermata("glossario");
}

function renderContesto() {
  document.getElementById("contenutoContesto").innerHTML = `
    <p style="text-align: center;"><strong>Finalità</strong></p>
    <br>
    <p style="text-align: center;">Raccontare un cammino.<br>Per gratitudine, per amor di carità, per gioco.</p>
    <br>
    <p style="text-align: center;"><strong>Radici</strong></p>
    <br>
    <p style="text-align: center;">Ci sono dietro le eterne colonne della tradizione,<br>vivificate dalle arterie d'un uomo moderno.<br>La Bhagavad Ghita si mescola con Gesù di Nazareth e con l'uomo.<br>La stella polare resta la verità.</p>
  `;
}

function stopMedia() {
  stopAudio();
  stopVideo();
  chiudiFumetto();
}

function tornaAiBrani() {
  stopMedia();
  mostraSchermata("brani");
}

function tornaAiTesti() {
  stopMedia();
  mostraSchermata("testi");
}

function tornaAlBrano() {
  if (currentBranoId) {
    stopMedia();
    apriAudio(currentBranoId);
  }
}
