/**
 * Conversion .docx -> HTML, entièrement dans le navigateur (mammoth.js).
 * La sortie est nettoyée avant d'être insérée dans la page.
 */

const STYLE_MAP = [
  "p[style-name='Title'] => h1.doc-title:fresh",
  "p[style-name='Titre'] => h1.doc-title:fresh",
  "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
  "p[style-name='Sous-titre'] => p.doc-subtitle:fresh",
];

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{ fragment: DocumentFragment, warnings: string[] }>}
 */
export async function convertDocx(arrayBuffer) {
  const mammoth = globalThis.mammoth;
  if (!mammoth) throw new Error("Moteur de conversion introuvable.");

  const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap: STYLE_MAP });
  return {
    fragment: sanitize(result.value),
    warnings: result.messages.filter((m) => m.type === "error").map((m) => m.message),
  };
}

const SAFE_URL = /^(https?:|mailto:|tel:|#)/i;
const SAFE_IMG = /^data:image\//i;

/** Parse le HTML hors du document et retire tout ce qui pourrait s'exécuter. */
function sanitize(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const root = tpl.content;

  root.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((el) => el.remove());

  for (const el of root.querySelectorAll("*")) {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    }
  }

  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href").trim();
    if (!SAFE_URL.test(href)) {
      a.removeAttribute("href");
    } else if (!href.startsWith("#")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  }

  for (const img of root.querySelectorAll("img")) {
    if (!SAFE_IMG.test(img.getAttribute("src") || "")) img.remove();
    else img.loading = "lazy";
  }

  return root;
}
