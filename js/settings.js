/** Préférences d'affichage, conservées dans localStorage. */

const KEY = "docx-reader:settings";
const DEFAULTS = Object.freeze({ fontSize: 18, theme: "auto", keepRecent: true });

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* stockage indisponible (navigation privée) : on garde les réglages en mémoire */
  }
}

export function applySettings({ fontSize, theme }) {
  const root = document.documentElement;
  root.style.setProperty("--font-size", `${fontSize}px`);
  root.dataset.theme = theme;
}
