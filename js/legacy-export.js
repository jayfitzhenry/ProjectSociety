// Standalone page: reads the pre-sign-in save from this browser and offers it as a download.
// No API, no sign-in, so it works on the old GitHub Pages address as well as on Azure.
const KEY = 'project-society:v1';
const out = document.getElementById('legacy-out');
const raw = localStorage.getItem(KEY);
let data = null;
try { data = raw && JSON.parse(raw); } catch { data = null; }

if (!data) {
  out.innerHTML = '<p>Nothing saved in this browser. If you used the app on another phone or computer, open this page there.</p>';
} else {
  const chars = (data.characters || []).filter((c) => !c.dead).map((c) => c.name || 'Unnamed');
  const crew = data.crew?.name || 'the crew';
  out.innerHTML = `<p>Found <b>${(data.characters || []).length}</b> character(s)${chars.length ? ` (${chars.map((n) => n.replace(/[<>&]/g, '')).join(', ')})` : ''} and the sheet for <b>${crew.replace(/[<>&]/g, '')}</b>.</p>
    <p><button type="button" class="btn primary big" id="dl">⬇️ Download my save</button></p>`;
  document.getElementById('dl').onclick = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `project-society-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
}
