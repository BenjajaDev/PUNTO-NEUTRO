// Script síncrono y mínimo: solo aplica el tema guardado (ver src/lib/useTheme.ts).
try {
  var t = localStorage.getItem('pn-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
