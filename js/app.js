import { convertDocx } from "./converter.js";
import * as library from "./library.js";
import { loadSettings, saveSettings, applySettings } from "./settings.js";
import { buildToc } from "./toc.js";

const $ = (id) => document.getElementById(id);

const ui = {
  title: $("title"),
  btnHome: $("btn-home"),
  btnToc: $("btn-toc"),
  btnSettings: $("btn-settings"),
  fileInput: $("file-input"),
  viewLibrary: $("view-library"),
  viewReader: $("view-reader"),
  recentList: $("recent-list"),
  recentEmpty: $("recent-empty"),
  status: $("status"),
  doc: $("doc"),
  toc: $("toc"),
  tocDialog: $("toc-dialog"),
  settingsDialog: $("settings-dialog"),
  setFont: $("set-font"),
  setTheme: $("set-theme"),
  setKeep: $("set-keep"),
  btnClear: $("btn-clear"),
};

const state = {
  settings: loadSettings(),
  currentId: null,
};

/* ---------- Navigation entre écrans ---------- */

function showLibrary() {
  state.currentId = null;
  ui.viewReader.hidden = true;
  ui.viewLibrary.hidden = false;
  ui.btnHome.hidden = true;
  ui.btnToc.hidden = true;
  ui.title.textContent = "Lecteur DOCX";
  ui.doc.replaceChildren();
  renderRecent();
}

function showReader(name) {
  ui.viewLibrary.hidden = true;
  ui.viewReader.hidden = false;
  ui.btnHome.hidden = false;
  ui.title.textContent = name.replace(/\.docx$/i, "");
}

function setStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.classList.toggle("status--error", isError);
}

/* ---------- Ouverture d'un document ---------- */

async function openFromFile(file) {
  if (!/\.docx$/i.test(file.name)) {
    alert("Seuls les fichiers .docx sont pris en charge (pas les anciens .doc).");
    return;
  }
  const data = await file.arrayBuffer();
  const id = library.documentId(file);
  if (state.settings.keepRecent) {
    await library.saveDocument({ id, name: file.name, size: file.size, data }).catch(console.warn);
  }
  await render({ id, name: file.name, data, scroll: 0 });
}

async function openFromLibrary(id) {
  const doc = await library.getDocument(id);
  if (!doc) return renderRecent();
  await library.saveDocument(doc); // met à jour la date d'ouverture
  await render(doc);
}

async function render({ id, name, data, scroll = 0 }) {
  state.currentId = id;
  showReader(name);
  ui.doc.replaceChildren();
  setStatus("Ouverture…");

  try {
    const { fragment, warnings } = await convertDocx(data);
    ui.doc.append(fragment);
    setStatus(warnings.length ? "Certains éléments n'ont pas pu être affichés." : "");
    ui.btnToc.hidden = buildToc(ui.doc, ui.toc, () => ui.tocDialog.close()) === 0;
    requestAnimationFrame(() => window.scrollTo(0, scroll));
  } catch (err) {
    console.error(err);
    setStatus("Impossible de lire ce fichier. Est-ce bien un .docx valide ?", true);
  }
}

/* ---------- Bibliothèque ---------- */

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

async function renderRecent() {
  const docs = state.settings.keepRecent ? await library.listDocuments().catch(() => []) : [];
  ui.recentEmpty.hidden = docs.length > 0;
  ui.recentList.replaceChildren(...docs.map(recentItem));
}

function recentItem(doc) {
  const li = document.createElement("li");
  li.className = "recent-item";

  const open = document.createElement("button");
  open.className = "recent-item__open";
  const name = document.createElement("span");
  name.className = "recent-item__name";
  name.textContent = doc.name;
  const date = document.createElement("span");
  date.className = "recent-item__date";
  date.textContent = dateFmt.format(doc.openedAt);
  open.append(name, date);
  open.addEventListener("click", () => openFromLibrary(doc.id));

  const del = document.createElement("button");
  del.className = "recent-item__delete";
  del.setAttribute("aria-label", `Supprimer ${doc.name}`);
  del.textContent = "✕";
  del.addEventListener("click", async () => {
    await library.deleteDocument(doc.id);
    renderRecent();
  });

  li.append(open, del);
  return li;
}

/* ---------- Mémorisation de la position de lecture ---------- */

let scrollTimer;
window.addEventListener("scroll", () => {
  if (!state.currentId || !state.settings.keepRecent) return;
  clearTimeout(scrollTimer);
  const id = state.currentId;
  scrollTimer = setTimeout(() => library.saveScroll(id, window.scrollY).catch(() => {}), 400);
}, { passive: true });

/* ---------- Réglages ---------- */

function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  saveSettings(state.settings);
  applySettings(state.settings);
}

function initSettingsUi() {
  ui.setFont.value = state.settings.fontSize;
  ui.setTheme.value = state.settings.theme;
  ui.setKeep.checked = state.settings.keepRecent;

  ui.setFont.addEventListener("input", () => updateSettings({ fontSize: Number(ui.setFont.value) }));
  ui.setTheme.addEventListener("change", () => updateSettings({ theme: ui.setTheme.value }));
  ui.setKeep.addEventListener("change", async () => {
    updateSettings({ keepRecent: ui.setKeep.checked });
    if (!ui.setKeep.checked) await library.clearDocuments();
    renderRecent();
  });
  ui.btnClear.addEventListener("click", async () => {
    if (!confirm("Effacer tous les documents récents de cet appareil ?")) return;
    await library.clearDocuments();
    renderRecent();
  });
}

/* ---------- Démarrage ---------- */

function init() {
  applySettings(state.settings);
  initSettingsUi();

  ui.fileInput.addEventListener("change", () => {
    const [file] = ui.fileInput.files;
    ui.fileInput.value = "";
    if (file) openFromFile(file);
  });
  ui.btnHome.addEventListener("click", showLibrary);
  ui.btnToc.addEventListener("click", () => ui.tocDialog.showModal());
  ui.btnSettings.addEventListener("click", () => ui.settingsDialog.showModal());

  // Glisser-déposer (utile sur tablette / ordinateur)
  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => {
    e.preventDefault();
    const [file] = e.dataTransfer.files;
    if (file) openFromFile(file);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(console.warn);
  }

  showLibrary();
}

init();
