/** Construit le sommaire à partir des titres du document. */

export function buildToc(docEl, navEl, onNavigate) {
  navEl.replaceChildren();
  const headings = docEl.querySelectorAll("h1, h2, h3");

  headings.forEach((h, i) => {
    h.id ||= `section-${i}`;
    const link = document.createElement("a");
    link.href = `#${h.id}`;
    link.textContent = h.textContent.trim() || "(sans titre)";
    link.className = `toc-l${h.tagName[1]}`;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: "smooth" });
      onNavigate?.();
    });
    navEl.append(link);
  });

  return headings.length;
}
