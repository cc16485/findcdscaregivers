// Small helpers shared by every CDS Caregiver Match screen.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// A refusal already shown on screen stops the next step without a second report.
if (typeof window !== 'undefined' && !window.__cmRejections) {
  window.__cmRejections = true;
  window.addEventListener('unhandledrejection', e => { if (e.reason && e.reason.shown) e.preventDefault(); });
}

export function toast(msg, kind = 'ok') {
  let t = document.getElementById('cm-toast');
  if (!t) { t = document.createElement('div'); t.id = 'cm-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.className = 'cm-toast show ' + kind;
  t.textContent = msg;
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 4200);
}

// Runs an action with a busy button and shows any refusal on screen (never silent).
export async function act(btn, fn, okMsg) {
  const label = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Working…'; }
  try {
    const r = await fn();
    if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg);
    return r;
  } catch (e) {
    toast(e.message || 'Something went wrong.', 'err');
    if (e && typeof e === 'object') e.shown = true;
    throw e;
  } finally {
    if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = label; }
  }
}

export function fileToDataUrl(file, maxBytes) {
  return new Promise((res, rej) => {
    if (maxBytes && file.size > maxBytes) return rej(new Error('That file is too big. Please choose one under ' + Math.round(maxBytes / 1048576) + ' MB.'));
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('That file could not be read.'));
    r.readAsDataURL(file);
  });
}

// Shrinks a photo before upload so phones don't send 8 MB pictures.
export async function shrinkPhoto(file, max = 900) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { mime: file.type, data: await fileToDataUrl(file, 15 * 1048576) };
  const url = await fileToDataUrl(file, 25 * 1048576);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That photo could not be read.')); i.src = url; });
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { mime: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85) };
}

export const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' }) : '';
export const fmtWhen = iso => iso ? new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }) : '';

// A practice "video": the preview can't use the camera, so it shows a stand-in.
export function videoHtml(url, name) {
  if (!url) return '';
  if (url.startsWith('practice-video:')) {
    return `<div class="cm-video practice" role="img" aria-label="Practice stand-in for ${esc(name)}'s intro video">
      <span class="cm-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
      <span>Intro video · practice stand-in</span></div>`;
  }
  return `<video class="cm-video" src="${esc(url)}" controls playsinline preload="metadata"></video>`;
}

export const ICON = {
  check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
  shield: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M8.5 12l2.4 2.4L15.5 10"/></svg>',
  clock: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  video: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6.5" width="12.5" height="11" rx="2"/><path d="M15.5 10.5L21 7.5v9l-5.5-3"/></svg>',
  people: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.8 14.2c2.3.2 4 1.7 4.7 4.8"/></svg>',
  back: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6L8.5 12l6 6"/></svg>',
  car: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16v-3.5L6 8h12l2 4.5V16"/><path d="M3 16h18v2.5H3z"/><circle cx="7.5" cy="16" r="1.4"/><circle cx="16.5" cy="16" r="1.4"/></svg>',
  heart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
};
