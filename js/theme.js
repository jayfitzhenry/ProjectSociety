// Runs before the page draws, so there's no flash of the wrong theme.
// Dark by default; light if chosen in settings, or "match device" follows the system.
(function applyTheme() {
  var theme = 'dark';
  try {
    var s = JSON.parse(localStorage.getItem('project-society:settings') || '{}');
    if (s.theme === 'light') theme = 'light';
    if (s.theme === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) theme = 'light';
  } catch (e) { /* no storage: stay dark */ }
  document.documentElement.dataset.theme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#faf9f6' : '#0f1012';
}());
