// Genera src/styles/tokens.generated.css desde src/theme/tokens.ts.
// Uso: node scripts/syncTokens.ts (Node ≥ 22.18 ejecuta TS directo).
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gradients, palette, themes } from '../src/theme/tokens.ts';

const here = dirname(fileURLToPath(import.meta.url));
const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function block(mode: 'light' | 'dark') {
  const colors = Object.entries(themes[mode]).map(([k, v]) => `  --color-${kebab(k)}: ${v};`);
  const grads = Object.entries(gradients[mode]).map(([k, v]) => `  --gradient-${kebab(k)}: ${v};`);
  return [`  color-scheme: ${mode};`, ...colors, ...grads].join('\n');
}

const raw = Object.entries(palette).map(([k, v]) => `  --palette-${kebab(k)}: ${v};`).join('\n');

const css = `/* Generado por scripts/syncTokens.ts — no editar a mano. */
:root {
${raw}
}

/* Claro por defecto (o forzado con data-theme="light"). */
:root {
${block('light')}
}

/* Sigue al sistema si no hay preferencia guardada (funciona sin JavaScript). */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${block('dark').replace(/^/gm, '  ')}
  }
}

:root[data-theme='dark'] {
${block('dark')}
}
`;

writeFileSync(resolve(here, '../src/styles/tokens.generated.css'), css);
console.log('tokens.generated.css actualizado');
