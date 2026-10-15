// Family screens F1 to F5: invite sign-in, browse, profile, request, My requests.
import { api, store, familySessionKey, MODE } from './api.js';
import { esc, $, $$, act, toast, fmtDate, fmtWhen, videoHtml, ICON } from './ui.js';
import { COUNTIES, HELP_TYPES, PART_LABEL, DAYS, DAY_LABEL, PARTS } from './shared/rules.js';
import { PROVIDER_CHOICE } from './shared/messages.js';
import { profileHtml, weekGrid } from './profile-view.js';

export function mountFamily(el, opts = {}) {
  AB = opts.assetBase || '';
  const invite = opts.invite || new URLSearchParams(location.search).get('i');
  const key = familySessionKey(invite);
  let session = store.get(key);
  const state = { view: 'browse', filters: { parts: [], help: [] }, me: null, profileId: null, mode: null, compare: [] };
  const call = (action, input = {}) => api('family', action, input, { session }).catch(e => {
    if (e.status === 401 || e.status === 403) { store.set(key, null); session = null; signIn(e.message); }
    throw e;
  });

  el.classList.add('cm');
  if (!invite && !session) { el.innerHTML = noInvite(); return; }
  session ? home() : signIn();

  // ---------- F1 sign-in ----------
  async function signIn(notice) {
    el.innerHTML = `<div class="cm-app"><p class="cm-muted">Loading your invitation…</p></div>`;
    let s;
    try { s = await api('family', 'startSignIn', { invite }); }
    catch (e) { el.innerHTML = `<div class="cm-app">${brand()}<div class="cm-card"><h2>We couldn't open this invitation</h2><p class="cm-sub">${esc(e.message)}</p>${callUs()}</div></div>`; return; }
    if (!s.open) { el.innerHTML = `<div class="cm-app">${brand()}<div class="cm-card"><h2>Hi ${esc(s.first_name)}</h2><p class="cm-sub">${esc(s.message)}</p>${callUs()}</div></div>`; return; }
    el.innerHTML = `<div class="cm-app">${brand()}
      ${notice ? `<div class="cm-card warn"><p class="cm-sub">${esc(notice)}</p></div>` : ''}
      <div class="cm-stack"><h1>Welcome, ${esc(s.first_name)}</h1>
      <p class="cm-sub">${esc(s.invited_by)} at Caring Companions CDS invited you to our private caregiver directory.</p></div>
      <div class="cm-card" id="codeStep1">
        <h3>We'll send a code to confirm it's you</h3>
        <div class="cm-stack" role="radiogroup" aria-label="Where to send your code">
          ${s.channels.map((c, i) => `<label class="cm-check"><input type="radio" name="ch" value="${c.channel}" ${i === 0 ? 'checked' : ''}> ${c.channel === 'sms' ? 'Text to' : 'Email to'} ${esc(c.to)}</label>`).join('')}
        </div>
        <button class="cm-btn block" id="send">Send my code</button>
      </div>
      <div class="cm-card" id="codeStep2" hidden>
        <h3>Enter your 6-digit code</h3>
        <p class="cm-sub" id="sentTo"></p>
        <div id="practiceCode"></div>
        <div class="cm-field"><label for="code">Code</label><input id="code" class="cm-codebox" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></div>
        <button class="cm-btn block" id="verify">Open the directory</button>
        <button class="cm-btn quiet" id="again">Send a new code</button>
      </div>
      <div class="cm-card flat"><h3 style="font-size:1rem">Got this link from someone else?</h3><p class="cm-sub">Each invitation is personal. Call us at 417-218-2888 (toll free 866-863-5151) and we'll send you your own.</p></div>
      <p class="cm-small">Your access is open until ${s.expires_at ? esc(fmtDate(s.expires_at)) : 'further notice'}. Caregiver details are private and shared with you only to help you choose.</p>
      </div>`;
    const send = async btn => {
      const channel = ($('input[name=ch]:checked', el) || {}).value;
      const r = await act(btn, () => api('family', 'sendCode', { invite, channel }));
      if (!r.sent) { toast(r.message, 'err'); return; }
      $('#codeStep1', el).hidden = true; $('#codeStep2', el).hidden = false;
      $('#sentTo', el).textContent = 'We sent it to ' + r.to + '. It expires in 10 minutes.';
      $('#practiceCode', el).innerHTML = r.practice_code ? `<div class="cm-card tint"><span class="cm-small">Practice mode: nothing was texted. This is the code the family would receive:</span><span class="cm-practice-code">${esc(r.practice_code)}</span></div>` : '';
      $('#code', el).focus();
    };
    $('#send', el).onclick = e => send(e.currentTarget);
    $('#again', el).onclick = () => { $('#codeStep1', el).hidden = false; $('#codeStep2', el).hidden = true; };
    $('#verify', el).onclick = async e => {
      const r = await act(e.currentTarget, () => api('family', 'verifyCode', { invite, code: $('#code', el).value }));
      session = r.session; store.set(key, session); home();
    };
    $('#code', el).addEventListener('keydown', e => { if (e.key === 'Enter') $('#verify', el).click(); });
  }

  // ---------- shell ----------
  async function home() {
    try { state.me = await call('me'); } catch { return; }
    state.mode = state.mode || (state.me.has_needs ? 'needs' : 'all');
    el.innerHTML = `<div class="cm-app fam">
      <div class="cm-topbar">${brand()}<button class="cm-btn quiet" id="out">Sign out</button></div>
      <div class="cm-tabs" role="tablist">
        <button role="tab" data-v="browse" aria-selected="true">Caregivers</button>
        <button role="tab" data-v="saved" aria-selected="false">Saved <span class="fam-count" id="savedCount">${state.me.saved_count || ''}</span></button>
        <button role="tab" data-v="requests" aria-selected="false">My requests</button>
      </div>
      <div id="view"></div>
      <p class="cm-notice">${esc(PROVIDER_CHOICE)} Finding a caregiver you like doesn't guarantee CDS eligibility, authorization or service availability.${state.me.access_expires ? ' Your access is open until ' + esc(fmtDate(state.me.access_expires)) + '.' : ''}</p>
    </div>`;
    $$('[role=tab]', el).forEach(b => b.onclick = () => go(b.dataset.v));
    $('#out', el).onclick = async () => { await call('signOut').catch(() => {}); store.set(key, null); session = null; signIn(); };
    go(state.view);
  }
  function go(v, id) {
    if (v === 'profile') state.prevList = ['saved', 'compare'].includes(state.view) ? 'saved' : 'browse';
    state.view = v; if (id) state.profileId = id;
    const tab = { profile: 'browse', needs: 'browse', compare: 'saved' }[v] || v;
    $$('[role=tab]', el).forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === tab)));
    ({ browse, saved, requests, profile, needs, compare })[v]();
    window.scrollTo({ top: 0 });
  }
  const setSavedCount = n => { state.me.saved_count = n; const x = $('#savedCount', el); if (x) x.textContent = n || ''; };
  async function toggleSave(btn, id) {
    const now = btn.getAttribute('aria-pressed') !== 'true';
    const r = await act(null, () => call('saveCaregiver', { pool_id: id, saved: now }), now ? 'Saved. Find it any time under Saved.' : 'Removed from Saved.');
    btn.setAttribute('aria-pressed', String(now)); btn.querySelector('.lbl') && (btn.querySelector('.lbl').textContent = now ? 'Saved' : 'Save');
    setSavedCount(r.saved_count);
  }
  const heart = (id, on, withLabel) => `<button class="fam-heart ${withLabel ? 'wide' : ''}" data-save="${id}" aria-pressed="${!!on}" aria-label="Save this caregiver">${HEART}${withLabel ? `<span class="lbl">${on ? 'Saved' : 'Save'}</span>` : ''}</button>`;
  const wireHearts = root => $$('[data-save]', root).forEach(b => b.onclick = e => { e.stopPropagation(); toggleSave(b, b.dataset.save); });

  // ---------- guided needs questions ----------
  async function needs() {
    const n = JSON.parse(JSON.stringify(state.me.needs || {}));
    n.days = n.days || []; n.parts = n.parts || []; n.help = n.help || [];
    let step = 0;
    const steps = [
      { t: 'Where is care needed?', h: 'We\'ll show caregivers who work in that county.', body: () => `<div class="cm-field"><label for="nc">County</label><select id="nc"><option value="">Choose a county</option>${COUNTIES.map(c => `<option ${n.county === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>` },
      { t: 'Which days and times?', h: 'Pick what usually works. You\'ll set an exact schedule with your caregiver.', body: () => `<span class="cm-label">Days</span><div class="cm-chips">${DAYS.map(d => chip('days', d, DAY_LABEL[d], n.days.includes(d))).join('')}</div>
          <span class="cm-label">Times</span><div class="cm-chips">${PARTS.map(x => chip('parts', x, PART_LABEL[x], n.parts.includes(x))).join('')}</div>` },
      { t: 'About how many hours a week?', h: 'A rough number is fine.', body: () => `<div class="cm-chips">${[5, 10, 20, 30, 40].map(h => chip('hours', String(h), h === 40 ? '40 or more' : 'About ' + h, Number(n.hours) === h)).join('')}</div>` },
      { t: 'What kind of help?', h: 'Choose all that apply.', body: () => `<div class="cm-chips">${Object.entries(HELP_TYPES).map(([k, l]) => chip('help', k, l, n.help.includes(k))).join('')}</div>` },
      { t: 'Anything else that matters?', h: 'Optional.', body: () => `<label class="cm-check"><input type="checkbox" id="ndr" ${n.drives ? 'checked' : ''}> The caregiver needs a car (for errands or appointments)</label>
          <div class="cm-field"><label for="nl">Language</label><select id="nl"><option value="">Any</option>${['English', 'Spanish'].map(l => `<option ${n.language === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>` },
    ];
    const chip = (k, v, l, on) => `<button class="cm-chip" data-k="${k}" data-v="${v}" aria-pressed="${on}">${esc(l)}</button>`;
    const draw = () => {
      const st = steps[step];
      $('#view', el).innerHTML = `<div class="fam-wiz cm-card">
        <div class="cm-row between"><span class="cm-small">Question ${step + 1} of ${steps.length}</span><button class="cm-btn quiet" id="skip">Skip, just browse</button></div>
        <div class="cm-progress"><i style="width:${(step + 1) / steps.length * 100}%"></i></div>
        <h2>${esc(st.t)}</h2><p class="cm-sub">${esc(st.h)}</p>
        <div class="cm-stack">${st.body()}</div>
        <div class="cm-row between">${step ? '<button class="cm-btn ghost" id="prev">Back</button>' : '<span></span>'}<button class="cm-btn" id="next">${step === steps.length - 1 ? 'Show my matches' : 'Next'}</button></div>
      </div>`;
      $$('.cm-chip', el).forEach(b => b.onclick = () => {
        const { k, v } = b.dataset;
        if (k === 'hours') { n.hours = Number(n.hours) === Number(v) ? null : Number(v); $$('[data-k=hours]', el).forEach(x => x.setAttribute('aria-pressed', String(Number(x.dataset.v) === n.hours))); return; }
        n[k] = n[k].includes(v) ? n[k].filter(x => x !== v) : [...n[k], v]; b.setAttribute('aria-pressed', String(n[k].includes(v)));
      });
      const keep = () => { if ($('#nc', el)) n.county = $('#nc', el).value || null; if ($('#ndr', el)) n.drives = $('#ndr', el).checked; if ($('#nl', el)) n.language = $('#nl', el).value || null; };
      $('#skip', el).onclick = () => { state.mode = 'all'; go('browse'); };
      if ($('#prev', el)) $('#prev', el).onclick = () => { keep(); step--; draw(); };
      $('#next', el).onclick = async e => {
        keep();
        if (step < steps.length - 1) { step++; draw(); return; }
        const r = await act(e.currentTarget, () => call('setNeeds', { needs: n }));
        state.me.needs = r.needs; state.me.has_needs = true; state.mode = 'needs'; go('browse');
      };
    };
    draw();
  }

  // ---------- F2 browse ----------
  async function browse() {
    const f = state.filters;
    const moreOn = () => f.parts.length + f.help.length + (f.weekends ? 1 : 0) + (f.drives ? 1 : 0) + (f.video ? 1 : 0) + (f.language ? 1 : 0);
    const chip = (k, v, label) => `<button class="cm-chip" data-k="${k}" data-v="${v}" aria-pressed="${k === 'parts' ? f.parts.includes(v) : k === 'help' ? f.help.includes(v) : !!f[k]}">${esc(label)}</button>`;
    const me = state.me;
    $('#view', el).innerHTML = `<div class="cm-stack">
      <h1>${state.mode === 'needs' ? 'Caregivers who fit your needs' : 'Caregivers you can meet'}</h1>
      ${me.has_needs ? `<div class="fam-mode" role="tablist" aria-label="How to show caregivers">
          <button role="tab" data-mode="needs" aria-selected="${state.mode === 'needs'}">Matches for your needs</button>
          <button role="tab" data-mode="all" aria-selected="${state.mode === 'all'}">Everyone</button></div>`
        : `<div class="cm-card tint fam-ask"><div><b>Tell us what you need, and we'll show who fits</b><p class="cm-small" style="margin:0">Five quick questions, about a minute. You can change them any time.</p></div><button class="cm-btn" id="askNeeds">Answer 5 questions</button></div>`}
      ${state.mode === 'needs' ? `<div class="fam-needs"><span class="cm-small">${esc(needsSummary(me.needs))}</span><button class="cm-btn quiet" id="editNeeds">Change my needs</button></div>` : `
      <div class="cm-card flat">
        <div class="cm-field"><label for="county">County</label><select id="county"><option value="">Any county</option>${COUNTIES.map(c => `<option ${f.county === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <details id="more" ${moreOn() ? 'open' : ''}><summary class="cm-btn quiet" style="justify-content:flex-start;padding-left:0">More filters${moreOn() ? ' (' + moreOn() + ' on)' : ''}</summary>
          <div class="cm-stack" style="margin-top:8px">
            <div class="cm-field"><label for="lang">Language</label><select id="lang"><option value="">Any</option>${['English', 'Spanish'].map(l => `<option ${f.language === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <span class="cm-label">When</span>
            <div class="cm-chips">${Object.entries(PART_LABEL).map(([k, v]) => chip('parts', k, v)).join('')}${chip('weekends', '1', 'Weekends')}</div>
            <span class="cm-label">Help with</span>
            <div class="cm-chips">${Object.entries(HELP_TYPES).map(([k, v]) => chip('help', k, v)).join('')}</div>
            <div class="cm-chips">${chip('drives', '1', 'Has a car')}${chip('video', '1', 'Has an intro video')}</div>
          </div>
        </details>
      </div>`}
      <div id="results" aria-live="polite"><p class="cm-muted">Loading caregivers…</p></div>
    </div>`;
    $$('[data-mode]', el).forEach(b => b.onclick = () => { state.mode = b.dataset.mode; browse(); });
    if ($('#askNeeds', el)) $('#askNeeds', el).onclick = () => go('needs');
    if ($('#editNeeds', el)) $('#editNeeds', el).onclick = () => go('needs');
    if ($('#county', el)) {
      $('#county', el).onchange = e => { f.county = e.target.value || undefined; load(); };
      $('#lang', el).onchange = e => { f.language = e.target.value || undefined; load(); };
      $$('#more .cm-chip', el).forEach(b => b.onclick = () => {
        const { k, v } = b.dataset;
        if (k === 'parts' || k === 'help') f[k] = f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v];
        else f[k] = !f[k];
        b.setAttribute('aria-pressed', String(k === 'parts' || k === 'help' ? f[k].includes(v) : f[k]));
        $('#more summary', el).textContent = 'More filters' + (moreOn() ? ' (' + moreOn() + ' on)' : '');
        load();
      });
    }
    load();
  }
  async function load() {
    let r;
    const useNeeds = state.mode === 'needs';
    try { r = await call('browse', { filters: useNeeds ? {} : state.filters, useNeeds }); } catch (e) { $('#results', el).innerHTML = `<div class="cm-card warn"><p class="cm-sub">${esc(e.message)}</p></div>`; return; }
    const done = r.caregivers.filter(c => c.section === 'complete'), prog = r.caregivers.filter(c => c.section === 'in_progress');
    $('#results', el).innerHTML = (r.caregivers.length ? '' : `<div class="cm-card cm-empty">${useNeeds ? 'No caregivers work in your county yet. Try "Everyone", or call us at 417-218-2888 and we\'ll let you know when someone joins.' : 'No one matches all of these yet. Try fewer filters, or call us at 417-218-2888.'}</div>`) +
      (done.length ? `<div class="cm-section-h"><h2>Screening complete</h2><span class="cm-small">All of the state's required screening is verified.</span></div><div class="fam-grid">${done.map(c => cgCard(c, useNeeds)).join('')}</div>` : '') +
      (prog.length ? `<div class="cm-section-h" style="margin-top:18px"><h2>Screening in progress</h2><span class="cm-small">Not yet cleared to begin services. You can still meet them while their screening finishes.</span></div><div class="fam-grid">${prog.map(c => cgCard(c, useNeeds)).join('')}</div>` : '') +
      `<p class="cm-small" style="margin-top:8px">Showing ${r.caregivers.length} of ${r.total} caregivers in the directory.</p>`;
    $$('.fam-card', el).forEach(b => b.onclick = e => { if (e.target.closest('[data-save]')) return; go('profile', b.dataset.id); });
    $$('.fam-card', el).forEach(b => b.onkeydown = e => { if (e.key === 'Enter' && !e.target.closest('[data-save]')) go('profile', b.dataset.id); });
    wireHearts(el);
  }
  function cgCard(c, useNeeds) {
    const m = c.match;
    return `<article class="fam-card" data-id="${c.id}" tabindex="0" role="button" aria-label="Open ${esc(c.first_name)}'s profile">
      <div class="fam-photo">${c.photo_url ? `<img src="${esc(c.photo_url)}" alt="" loading="lazy">` : ''}
        ${c.has_video ? `<span class="fam-vid">${ICON.video} Intro video</span>` : ''}${heart(c.id, c.saved)}</div>
      <div class="fam-body">
        <div class="cm-row between"><strong>${esc(c.first_name)}</strong>${badge(c.section)}</div>
        <span class="cm-small">${ICON.pin} ${esc(c.town)} · confirmed ${esc(c.confirmed_text)}</span>
        <span class="fam-when">${esc(c.availability_text)}${c.hours_min ? ' · ' + c.hours_min + ' to ' + c.hours_max + ' hrs/week' : ''}</span>
        ${c.quote ? `<p class="fam-q">"${esc(c.quote)}"</p>` : ''}
        ${useNeeds && m.total ? `<div class="fam-fit"><div class="fam-fit-h"><b>Fits ${m.matched} of ${m.total} of your needs</b><span class="fam-bar"><i style="width:${Math.round(m.matched / m.total * 100)}%"></i></span></div>
            ${m.reasons.slice(0, 3).map(x => `<span class="ok">${ICON.check} ${esc(x)}</span>`).join('')}${m.reasons.length > 3 ? `<span class="cm-small">+ ${m.reasons.length - 3} more on the profile</span>` : ''}
            ${(m.gaps || []).slice(0, 2).map(x => `<span class="ask">Worth asking: ${esc(x.charAt(0).toLowerCase() + x.slice(1))}</span>`).join('')}</div>`
          : m.reasons.length ? `<div class="cm-why"><b>Why we're showing you</b>${m.reasons.map(x => `<span>${ICON.check} ${esc(x)}</span>`).join('')}</div>` : ''}
      </div>
    </article>`;
  }

  // ---------- saved + compare ----------
  async function saved() {
    let r;
    try { r = await call('saved'); } catch { return; }
    state.savedList = r.saved;
    state.compare = (state.compare || []).filter(id => r.saved.some(x => x.id === id && !x.unavailable));
    $('#view', el).innerHTML = `<div class="cm-stack">
      <h1>Saved caregivers</h1>
      <p class="cm-sub">Your private shortlist. Saving doesn't contact anyone. Pick two or three to compare side by side.</p>
      ${r.saved.length ? `<div class="fam-grid">${r.saved.map(c => c.unavailable ? `<div class="cm-card flat"><b>${esc(c.first_name)}</b><p class="cm-small" style="margin:0">Not available in the directory right now.</p><button class="cm-btn sm ghost" data-save="${c.id}" aria-pressed="true"><span class="lbl">Remove</span></button></div>`
        : `<div class="fam-saved">${cgCard({ ...c, match: { reasons: [], gaps: [], matched: 0, total: 0 } }, false)}
            <label class="cm-check fam-cmp"><input type="checkbox" data-cmp="${c.id}" ${state.compare.includes(c.id) ? 'checked' : ''}> Compare</label></div>`).join('')}</div>
        <div class="fam-cmpbar" id="cmpbar" ${state.compare.length >= 2 ? '' : 'hidden'}><span><b id="cmpn">${state.compare.length}</b> selected</span><button class="cm-btn honey" id="doCmp">Compare side by side</button></div>`
      : `<div class="cm-card cm-empty">Nothing saved yet. Tap the heart on any caregiver to keep them here while you decide.</div>`}
    </div>`;
    $$('.fam-card', el).forEach(b => b.onclick = e => { if (e.target.closest('[data-save]')) return; go('profile', b.dataset.id); });
    $$('[data-save]', el).forEach(b => b.onclick = async e => { e.stopPropagation(); await toggleSave(b, b.dataset.save); saved(); });
    $$('[data-cmp]', el).forEach(x => x.onchange = () => {
      const id = x.dataset.cmp;
      if (x.checked) { if (state.compare.length >= 3) { x.checked = false; toast('Compare up to three at a time.', 'err'); return; } state.compare.push(id); }
      else state.compare = state.compare.filter(y => y !== id);
      $('#cmpn', el).textContent = state.compare.length; $('#cmpbar', el).hidden = state.compare.length < 2;
    });
    if ($('#doCmp', el)) $('#doCmp', el).onclick = () => go('compare');
  }
  async function compare() {
    if (!state.savedList) { const r = await call('saved'); state.savedList = r.saved; }
    const list = (state.compare || []).map(id => state.savedList.find(x => x.id === id)).filter(Boolean);
    if (list.length < 2) return go('saved');
    const row = (label, f) => `<tr><th scope="row">${label}</th>${list.map(c => `<td>${f(c)}</td>`).join('')}</tr>`;
    $('#view', el).innerHTML = `<div class="cm-stack">
      <button class="cm-back" id="back">${ICON.back} Back to saved</button>
      <h1>Side by side</h1>
      <div class="fam-cmp-wrap"><table class="fam-cmp-t">
        <thead><tr><th></th>${list.map(c => `<th scope="col"><div class="fam-cmp-head">${c.photo_url ? `<img src="${esc(c.photo_url)}" alt="">` : ''}<strong>${esc(c.first_name)}</strong>${badge(c.section)}</div></th>`).join('')}</tr></thead>
        <tbody>
          ${row('Lives in', c => esc(c.town) + '<br><span class="cm-small">Works in ' + esc(c.counties.join(', ')) + '</span>')}
          ${row('Available', c => weekGrid(c.availability) + `<span class="cm-small">Confirmed ${esc(c.confirmed_text)}</span>`)}
          ${row('Hours a week', c => c.hours_min ? esc(c.hours_min + ' to ' + c.hours_max) : 'Ask')}
          ${row('Your needs', c => c.fit && c.fit.total ? `<b>${c.fit.matched} of ${c.fit.total}</b>${(c.fit.gaps || []).length ? '<br><span class="cm-small">Worth asking: ' + esc(c.fit.gaps.join('; ').toLowerCase()) + '</span>' : ''}` : '<span class="cm-small">Answer the needs questions to see this</span>')}
          ${row('Helps with', c => (c.help_types || []).map(h => `<span class="fam-tag">${esc(h)}</span>`).join(' '))}
          ${row('Experience', c => esc(c.experience || ''))}
          ${row('Getting around', c => c.has_car ? 'Has a car' + (c.travel_miles ? ', up to ' + c.travel_miles + ' miles' : '') : 'No car listed')}
          ${row('Training', c => (c.certs_verified || []).length ? esc(c.certs_verified.map(x => ({ cpr: 'CPR', cna: 'CNA', first_aid: 'First aid' }[x])).join(', ')) + ' <span class="cm-small">verified</span>' : '<span class="cm-small">None listed</span>')}
          ${row('Languages', c => esc((c.languages || []).join(', ')))}
          ${row('Intro video', c => c.has_video ? 'Yes' : '<span class="cm-small">No</span>')}
          ${row('', c => `<div class="cm-stack" style="gap:6px"><button class="cm-btn sm" data-open="${c.id}">View profile</button></div>`)}
        </tbody></table></div>
    </div>`;
    $('#back', el).onclick = () => go('saved');
    $$('[data-open]', el).forEach(b => b.onclick = () => go('profile', b.dataset.open));
  }

  // ---------- F3 profile + F4 request ----------
  async function profile() {
    $('#view', el).innerHTML = `<p class="cm-muted">Loading…</p>`;
    let r;
    try { r = await call('profile', { id: state.profileId }); } catch (e) { $('#view', el).innerHTML = `<div class="cm-card warn"><p class="cm-sub">${esc(e.message)}</p><button class="cm-back" id="b">${ICON.back} Back to caregivers</button></div>`; $('#b', el).onclick = () => go('browse'); return; }
    const c = r.caregiver;
    const cta = (r.open_request
      ? `<div class="cm-card tint"><p class="cm-sub">You asked to meet ${esc(c.first_name)}. Status: <b>${esc(r.open_request)}</b>.</p><button class="cm-btn ghost seeReq">See My requests</button></div>`
      : `<button class="cm-btn honey block pv-meet">I'd like to meet ${esc(c.first_name)}</button>`) + heart(c.id, r.saved, true);
    $('#view', el).innerHTML = `<div class="cm-stack">
      <button class="cm-back" id="back">${ICON.back} Back</button>
      ${profileHtml({ ...c, accepting: true }, { cta })}
      <div class="cm-card cm-sheet" id="sheet" hidden>
        <h3>How would you like to meet ${esc(c.first_name)}?</h3>
        <div class="cm-stack">
          <label class="cm-check"><input type="radio" name="how" value="video" checked> A live video meet-and-greet</label>
          <label class="cm-check"><input type="radio" name="how" value="home"> In person at my home</label>
          <label class="cm-check"><input type="radio" name="how" value="elsewhere"> In person somewhere else</label>
        </div>
        <div class="cm-field"><label for="times">Best days and times for you</label><input id="times" placeholder="For example: weekday mornings"></div>
        <p class="cm-small">We'll ask ${esc(c.first_name)} if they're interested and call you to set it up. Meeting doesn't commit either of you.</p>
        <div class="cm-row cm-wrap"><button class="cm-btn" id="sendReq">Send my request</button><button class="cm-btn quiet" id="cancelReq">Not now</button></div>
      </div>
    </div>`;
    $('#back', el).onclick = () => go(state.prevList || 'browse');
    $$('.seeReq', el).forEach(b => b.onclick = () => go('requests'));
    $$('.pv-meet', el).forEach(b => b.onclick = () => { $('#sheet', el).hidden = false; $('#sheet', el).scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    if ($('#cancelReq', el)) $('#cancelReq', el).onclick = () => { $('#sheet', el).hidden = true; };
    wireHearts(el);
    if ($('#sendReq', el)) $('#sendReq', el).onclick = async e => {
      await act(e.currentTarget, () => call('requestIntro', { pool_id: c.id, how: $('input[name=how]:checked', el).value, preferred_times: $('#times', el).value }), 'Request sent. We\'ll call you soon.');
      go('requests');
    };
  }

  // ---------- F5 my requests ----------
  async function requests() {
    $('#view', el).innerHTML = `<p class="cm-muted">Loading…</p>`;
    let r;
    try { r = await call('myRequests'); } catch { return; }
    const pill = s => s === 'scheduled' || s === 'met' ? 'ok' : s === 'caregiver_no' || s === 'not_available' || s === 'closed' ? 'mute' : 'prog';
    const note = q => ({
      sent: 'We got your request and will ask ' + q.caregiver + ' soon.',
      asked: 'We asked ' + q.caregiver + '. We\'ll call you as soon as they answer.',
      caregiver_yes: q.caregiver + ' would like to meet you. We\'ll call you to set a time.',
      scheduled: q.how + ', ' + fmtWhen(q.meet_at) + '. ' + (q.meet_details || ''),
      met: 'You met ' + q.caregiver + '. Take your time deciding. Call us with any questions.',
      caregiver_no: q.caregiver + ' isn\'t available right now. Want help finding someone similar? Call us.',
      not_available: q.caregiver + ' isn\'t available right now. Want help finding someone similar? Call us.',
      closed: 'This request is closed.',
    })[q.status];
    $('#view', el).innerHTML = `<div class="cm-stack"><h1>My requests</h1>
      ${r.requests.length ? r.requests.map(q => `<div class="cm-req">
        <div class="cm-row between"><strong style="color:var(--navy);font-size:1.08rem">${esc(q.caregiver)}</strong><span class="cm-pill ${pill(q.status)}">${esc(q.status_text)}</span></div>
        <span class="cm-sub">${esc(note(q))}</span>
        ${['caregiver_no', 'not_available', 'closed'].includes(q.status) ? '' : `<div class="trail">${q.steps.map(st => `<span class="${st.done ? 'on' : ''}">${st.done ? '✓ ' : ''}${esc(st.label)}</span>`).join('')}</div>`}
        <span class="cm-small">Asked ${esc(fmtDate(q.created_at))} · ${esc(q.how)}</span>
      </div>`).join('') : `<div class="cm-card cm-empty">You haven't asked to meet anyone yet. When you do, you'll see each step here.</div>`}
      <p class="cm-small">Meeting a caregiver doesn't commit you or them. You decide who to hire.</p></div>`;
  }

  const badge = s => s === 'complete' ? `<span class="cm-pill ok">${ICON.shield} Screening complete</span>` : `<span class="cm-pill prog">${ICON.clock} Screening in progress</span>`;
}

const HEART = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>';
function needsSummary(n) {
  if (!n) return '';
  const parts = [];
  if (n.county) parts.push(n.county + ' County');
  if ((n.days || []).length) parts.push(n.days.map(d => DAY_LABEL[d]).join(', '));
  if ((n.parts || []).length) parts.push(n.parts.map(p => PART_LABEL[p].toLowerCase()).join(', '));
  if (n.hours) parts.push('about ' + n.hours + ' hours a week');
  if ((n.help || []).length) parts.push(n.help.length + ' kinds of help');
  if (n.drives) parts.push('needs a car');
  if (n.language) parts.push(n.language);
  return 'Your needs: ' + parts.join(' · ');
}
let AB = '';
const brand = () => `<div class="cm-brandline"><img src="${AB}assets/mark.png" alt="" class="cg-mark"><span><strong>Find CDS Caregivers</strong><span>Caring Companions CDS · private</span></span></div>`;
const callUs = () => `<p class="cm-sub">Call us at <b>417-218-2888</b> (toll free 866-863-5151), Monday to Friday.</p>`;
const noInvite = () => `<div class="cm-app">${brand()}<div class="cm-card"><h2>This directory is private</h2><p class="cm-sub">Families get a personal invitation from our office. To ask for one, call 417-218-2888 or request access on our home page.</p><a class="cm-btn" href="../">Request access</a></div></div>`;
