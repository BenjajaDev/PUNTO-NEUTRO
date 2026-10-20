"""
Genera docs/manual-de-uso.pdf a partir de portada.html y manual.html.

Requisitos: Node con Playwright (`npm i -g playwright` o NODE_PATH apuntando a él)
y Python con pypdf (`pip install pypdf`).

    python3 docs/manual/generar.py

Dos pasadas: la primera ubica en qué página cae cada título; la segunda imprime
el índice con esos números (los títulos no se mueven porque el índice reserva
el mismo espacio).
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from pypdf import PdfReader, PdfWriter

AQUI = Path(__file__).resolve().parent
SALIDA = AQUI.parent / 'manual-de-uso.pdf'


def render(html, pdf, paginas='-', *extra):
    res = subprocess.run(['node', str(AQUI / 'render.cjs'), str(html), str(pdf), str(paginas), *extra], capture_output=True, text=True, cwd=AQUI)
    if res.returncode != 0:
        sys.exit(res.stderr)
    salida = res.stdout.strip().splitlines()
    return json.loads(salida[-1]) if salida else []


def compacto(texto):
    return re.sub(r'\s+', '', texto).lower()


def ubicar(pdf, entradas):
    """Página (1 = primera del cuerpo) en que aparece cada título, en orden."""
    textos = [compacto(p.extract_text() or '') for p in PdfReader(pdf).pages]
    # El índice ocupa las primeras páginas: se busca desde la primera página
    # del capítulo 1 en adelante y siempre hacia adelante.
    inicio = next(i for i, t in enumerate(textos) if 'capítulo1' in t and 'bienvenida' in t and i > 0)
    paginas, desde = {}, inicio
    for e in entradas:
        buscado = compacto(e['text'])
        for i in range(desde, len(textos)):
            if buscado in textos[i]:
                paginas[e['id']] = i + 1
                desde = i
                break
        else:
            sys.exit(f'No encontré el título «{e["text"]}» en el PDF.')
    return paginas


def main():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        entradas = render(AQUI / 'manual.html', tmp / 'cuerpo1.pdf')
        paginas = ubicar(tmp / 'cuerpo1.pdf', entradas)
        (tmp / 'paginas.json').write_text(json.dumps(paginas))
        render(AQUI / 'manual.html', tmp / 'cuerpo.pdf', tmp / 'paginas.json')
        if ubicar(tmp / 'cuerpo.pdf', entradas) != paginas:
            sys.exit('Los números del índice cambiaron entre pasadas; revisa el diseño del índice.')
        render(AQUI / 'portada.html', tmp / 'portada.pdf', '-', '--sin-pie')

        escritor = PdfWriter()
        for pdf in (tmp / 'portada.pdf', tmp / 'cuerpo.pdf'):
            for pagina in PdfReader(pdf).pages:
                escritor.add_page(pagina)

        # Marcadores del lector de PDF (panel lateral). La página N del cuerpo
        # es la N+1 del archivo porque la portada va primero.
        escritor.add_outline_item('Portada', 0)
        escritor.add_outline_item('Índice', 1)
        capitulo = None
        for e in entradas:
            if e['chapter']:
                numero = e['id'].lstrip('c')
                capitulo = escritor.add_outline_item(f"{numero}. {e['text']}", paginas[e['id']])
            else:
                escritor.add_outline_item(e['text'], paginas[e['id']], parent=capitulo)
        escritor.page_mode = '/UseOutlines'
        escritor.add_metadata({
            '/Title': 'Manual de uso del panel · Punto Neutro',
            '/Author': 'Equipo Punto Neutro',
            '/Subject': 'Guía paso a paso para el equipo editorial',
            '/Keywords': 'Punto Neutro, manual, panel, buzón, neutralidad corporal',
        })
        with open(SALIDA, 'wb') as f:
            escritor.write(f)
    total = len(PdfReader(SALIDA).pages)
    print(f'Listo: {SALIDA.relative_to(AQUI.parent.parent)} ({total} páginas)')


if __name__ == '__main__':
    main()
