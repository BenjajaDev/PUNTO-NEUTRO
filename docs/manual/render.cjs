/**
 * Imprime una página HTML del manual a PDF con Chromium (Playwright).
 *   node render.cjs <entrada.html> <salida.pdf> [paginas.json] [--sin-pie]
 * paginas.json: { "<id de sección>": número de página } para completar el índice.
 */
const { pathToFileURL } = require('node:url');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const [input, output, pagesFile, flag] = process.argv.slice(2);
const pages = pagesFile && pagesFile !== '-' ? JSON.parse(readFileSync(pagesFile, 'utf8')) : {};
const footer = flag !== '--sin-pie';

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Índice: capítulos (h1.capitulo) y secciones (h2) con su número de página.
  const entries = await page.evaluate((pageMap) => {
    const list = document.getElementById('indice');
    if (!list) return [];
    const out = [];
    document.querySelectorAll('h1.capitulo[id], h2[id]').forEach((h) => {
      const isChapter = h.tagName === 'H1';
      const num = isChapter ? h.previousElementSibling?.textContent.replace('Capítulo', '').trim() : '';
      const label = isChapter ? `${num}. ${h.textContent.trim()}` : h.textContent.trim();
      const li = document.createElement('li');
      li.className = isChapter ? 'cap' : 'sub';
      li.innerHTML = `<span></span><span class="puntos"></span><span class="pag">${pageMap[h.id] ?? '00'}</span>`;
      li.firstChild.textContent = label;
      list.appendChild(li);
      out.push({ id: h.id, text: h.textContent.trim(), chapter: isChapter });
    });
    return out;
  }, pages);

  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: footer,
    headerTemplate: '<span></span>',
    footerTemplate: footer
      ? `<div style="width:100%;padding:0 18mm;font-family:Helvetica,Arial,sans-serif;font-size:8px;color:#54435E;display:flex;justify-content:space-between;">
           <span>Manual de uso del panel · Punto Neutro</span><span>Página <span class="pageNumber"></span></span>
         </div>`
      : '<span></span>',
  });
  if (entries.length) console.log(JSON.stringify(entries));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
