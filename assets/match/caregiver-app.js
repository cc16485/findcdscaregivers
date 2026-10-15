// Caregiver screens C1 to C7, opened from the caregiver's private link (no password).
import { api, MODE } from './api.js';
import { esc, $, $$, act, toast, fileToDataUrl, shrinkPhoto, fmtWhen, videoHtml, ICON } from './ui.js';
import { COUNTIES, HELP_TYPES, DAYS, DAY_LABEL, PARTS, PART_LABEL } from './shared/rules.js';
import { FCSR_HOWTO_URL, FCSR_PHONE } from './shared/messages.js';
import { profileHtml } from './profile-view.js';

const PROMPTS = [
  'Tell us a little about yourself.',
  'What do you enjoy most about helping others?',
  'What caregiving experience do you have?',
  'What would you like a family to know about you?',
];

export function mountCaregiver(el, opts = {}) {
  AB = opts.assetBase || '';
  const link = opts.link || new URLSearchParams(location.search).get('c');
  const first = opts.view || (location.hash || '').replace('#', '') || 'home';
  const call = (action, input = {}) => api('caregiver', action, { link, ...input });
  let d = null;
  el.classList.add('cm');
  if (!link) { el.innerHTML = `<div class="cm-app">${brand()}<div class="cm-card"><h2>This page needs your private link</h2><p class="cm-sub">Open the link we texted or emailed you. If you can't find it, call us at 417-218-2888 (toll free 866-863-5151) and we'll send a new one.</p></div></div>`; return; }
  go(first);

  async function refresh() { d = await call('home'); return d; }
  async function go(view) {
    try { await refresh(); }
    catch (e) { el.innerHTML = `<div class="cm-app">${brand()}<div class="cm-card"><h2>We couldn't open your page</h2><p class="cm-sub">${esc(e.message)}</p></div></div>`; return; }
    const views = { home, requirements, profile, photo, video, availability, consent, intros };
    el.innerHTML = `<div class="cm-app cg ${view === 'consent' ? 'cg-wide' : ''}">${brand()}<div id="v"></div></div>`;
    (views[view] || home)($('#v', el));
    window.scrollTo({ top: 0 });
  }
  const back = () => `<button class="cm-back" data-go="home">${ICON.back} Back to my checklist</button>`;
  const wireBack = root => $$('[data-go]', root).forEach(b => b.onclick = () => go(b.dataset.go));

  // ---------- C1 home ----------
  function home(v) {
    const done = d.checklist.filter(c => c.done && !c.optional).length, total = d.checklist.filter(c => !c.optional).length;
    const target = { requirements: 'requirements', profile: 'profile', photo: 'photo', video: 'video', availability: 'availability', consent: 'consent' };
    const hint = { requirements: 'Register with the FCSR and sign the screening authorization', profile: 'Your story, in your own words', photo: 'A friendly photo of just you',
      video: '30 to 60 seconds from your phone', availability: 'Update any time, it shows right away', consent: 'Preview your profile and give your OK' };
    v.innerHTML = `<div class="cm-stack">
      <div class="cg-hello">${d.photo_url ? `<img src="${esc(d.photo_url)}" alt="">` : '<span class="cg-hello-ph"></span>'}
        <div><h1>Hi ${esc(d.first_name)}</h1><span class="cm-pill ${d.listing_text.includes('complete') ? 'ok' : d.listing_text.includes('progress') ? 'prog' : 'mute'}">${esc(d.listing_text)}</span></div></div>
      <p class="cm-sub">${esc(d.listing_note)}</p>
      <div class="cm-row between"><span class="cm-small">Your steps</span><span class="cm-small">${done} of ${total} done</span></div>
      <div class="cm-progress" aria-hidden="true"><i style="width:${Math.round(done / total * 100)}%"></i></div>
      ${d.review_note ? `<div class="cm-card warn"><b style="color:var(--navy)">Our office asked for a change</b><p class="cm-sub">${esc(d.review_note)}</p></div>` : ''}
      ${d.intros.length ? `<button class="cm-card cm-cgcard" data-go="intros" style="border-color:var(--honey)"><strong style="color:var(--navy)">${d.intros.filter(i => i.status === 'asked').length ? 'A family would like to meet you' : 'Your meetings'}</strong><span class="cm-sub">${d.intros.length} ${d.intros.length === 1 ? 'request' : 'requests'}. Tap to see.</span></button>` : ''}
      <ul class="cm-checklist">${d.checklist.map(c => `<li class="${c.done ? 'done' : ''}"><button data-go="${target[c.key]}"><span class="cg-step"><b>${esc(c.label)}</b><small>${esc(hint[c.key] || '')}</small></span><span class="tick">${c.done ? ICON.check : ''}</span></button></li>`).join('')}</ul>
      <div class="cm-card flat"><div class="cm-row between"><div><b style="color:var(--navy)">Accepting introductions</b><p class="cm-small" style="margin:0">Turn off any time you're full. Your profile is kept.</p></div>
        <button class="cm-btn sm ${d.accepting_intros && !d.paused ? '' : 'ghost'}" id="tog">${d.accepting_intros && !d.paused ? 'On' : 'Off'}</button></div></div>
      <button class="cm-btn ghost" data-go="availability">Update my days and times</button>
      <p class="cm-small">Days and times last confirmed ${esc(d.availability_confirmed_text)}.</p>
    </div>`;
    wireBack(v);
    $('#tog', v).onclick = async e => { await act(e.currentTarget, () => call('setPaused', { paused: d.accepting_intros && !d.paused }), d.accepting_intros && !d.paused ? 'Introductions paused.' : 'You\'re accepting introductions again.'); go('home'); };
  }

  // ---------- C2 requirements ----------
  function requirements(v) {
    const r = d.requirements;
    v.innerHTML = `<div class="cm-stack">${back()}
      <h1>State requirements</h1>
      ${r.explainer.map(p => `<p class="cm-sub">${esc(p)}</p>`).join('')}
      <div class="cm-card">
        <h3>Step 1 · Register with the FCSR</h3>
        ${r.registered_told_us ? `<span class="cm-pill ok">${ICON.check} Thanks, you told us you're registered</span><p class="cm-small">Our office will check the registry and continue your screening.</p>` : `
        <p class="cm-sub">One-time state fee: $16, or $16.57 online. If you were already registered before, you don't pay again. Just tap "I was already registered before."</p>
        <a class="cm-btn ghost block" href="https://${esc(FCSR_HOWTO_URL)}" target="_blank" rel="noopener">Open the official Missouri instructions</a>
        <p class="cm-small">Questions about the state's site: FCSR, <a href="tel:+18664226872">${esc(FCSR_PHONE)}</a>, weekdays 9 to 3.</p>
        <button class="cm-btn block" data-reg="done">I've registered</button>
        <button class="cm-btn ghost block" data-reg="already">I was already registered before</button>`}
      </div>
      <div class="cm-card">
        <h3>Step 2 · Screening authorization</h3>
        ${r.authorization_done ? `<span class="cm-pill ok">${ICON.check} Signed</span><p class="cm-small">Thank you. We use this only for the state screening.</p>` : `
        <p class="cm-sub">The state's screening request asks for your legal name, date of birth and Social Security number, exactly as you registered. We use them only to request your state screening, and we delete your full Social Security number once the result is in.</p>
        ${MODE === 'practice' ? `<div class="cm-card warn"><p class="cm-small" style="margin:0"><b>Practice mode:</b> never type a real Social Security number. Use a made-up number that starts with 9.</p></div>` : ''}
        <div class="cm-grid2">
          <div class="cm-field"><label for="lf">Legal first name</label><input id="lf" autocomplete="given-name"></div>
          <div class="cm-field"><label for="lm">Middle name</label><input id="lm" autocomplete="additional-name"></div>
        </div>
        <div class="cm-grid2">
          <div class="cm-field"><label for="ll">Legal last name</label><input id="ll" autocomplete="family-name"></div>
          <div class="cm-field"><label for="lsx">Suffix</label><select id="lsx"><option value="">None</option><option>Jr.</option><option>Sr.</option><option>II</option><option>III</option><option>IV</option></select></div>
        </div>
        <div class="cm-field"><label for="lon">Other last names you've used (optional)</label><input id="lon" placeholder="For example, a maiden name"><span class="cm-help">Helps us match your registry record.</span></div>
        <div class="cm-grid2">
          <div class="cm-field"><label for="dob">Date of birth</label><input id="dob" type="date"></div>
          <div class="cm-field"><label for="ssn">Social Security number</label><input id="ssn" inputmode="numeric" autocomplete="off" maxlength="11" placeholder="•••-••-••••"></div>
        </div>
        <label class="cm-check"><input type="checkbox" id="agree"> I authorize Caring Companions CDS to request my Family Care Safety Registry screening and the other checks the state requires.</label>
        <button class="cm-btn block" id="auth">Sign and send</button>`}
      </div>
      <div class="cm-card flat"><h3>Step 3 · We do the rest</h3><p class="cm-sub">We request your screening and let you know when it's complete. Status now: <b>${esc(r.screening_text)}</b>.</p>
        <p class="cm-small">Registering doesn't mean screening is complete, and screening doesn't by itself mean you can start paid care. We'll walk you through each step.</p></div>
    </div>`;
    wireBack(v);
    $$('[data-reg]', v).forEach(b => b.onclick = async () => { await act(b, () => call('setRegistration', { answer: b.dataset.reg }), 'Thanks! We\'ll take it from here.'); go('requirements'); });
    if ($('#auth', v)) $('#auth', v).onclick = async e => {
      await act(e.currentTarget, () => call('submitAuthorization', { legal_first: $('#lf', v).value, legal_middle: $('#lm', v).value, legal_last: $('#ll', v).value, legal_suffix: $('#lsx', v).value, other_names: $('#lon', v).value,
        dob: $('#dob', v).value, ssn: $('#ssn', v).value, agree: $('#agree', v).checked }), 'Signed. Thank you.');
      go('requirements');
    };
  }

  // ---------- C3 profile ----------
  function profile(v) {
    const p = d.draft;
    const ta = (id, label, help, max) => `<div class="cm-field"><label for="${id}">${label}</label><textarea id="${id}" maxlength="${max}">${esc(p[id] || '')}</textarea>${help ? `<span class="cm-help">${help}</span>` : ''}</div>`;
    v.innerHTML = `<div class="cm-stack">${back()}
      <h1>About you</h1><p class="cm-sub">Write it the way you'd say it. Families read this before they ask to meet you. Our office reviews changes before they show.</p>
      <div class="cm-card">
        ${ta('about_me', 'About me', 'A few sentences about you.', 700)}
        ${ta('enjoy_most', 'What I enjoy most about caregiving', '', 400)}
        <div class="cm-field"><label for="experience">My caregiving experience</label><input id="experience" maxlength="400" value="${esc(p.experience || '')}"></div>
        <div class="cm-field"><label for="interests">Interests and hobbies</label><input id="interests" maxlength="300" value="${esc(p.interests || '')}"></div>
        <div class="cm-field"><label for="setting_pref">Where I do my best work</label><input id="setting_pref" maxlength="300" value="${esc(p.setting_pref || '')}" placeholder="For example: quiet homes, mornings"></div>
      </div>
      <div class="cm-card">
        <div class="cm-field"><label for="town">Town you live in</label><input id="town" maxlength="60" value="${esc(p.town || '')}"></div>
        <span class="cm-label">Counties you'll work in</span>
        <div class="cm-chips" id="counties">${COUNTIES.map(c => `<button class="cm-chip" data-v="${c}" aria-pressed="${(p.counties || []).includes(c)}">${c}</button>`).join('')}</div>
        <div class="cm-grid2">
          <label class="cm-check"><input type="checkbox" id="has_car" ${p.has_car ? 'checked' : ''}> I have a car</label>
          <div class="cm-field"><label for="miles">Miles I'll travel</label><input id="miles" type="number" min="0" max="100" value="${esc(p.travel_miles ?? '')}"></div>
        </div>
      </div>
      <div class="cm-card">
        <span class="cm-label">Help I'm comfortable giving</span>
        <div class="cm-chips" id="help">${Object.entries(HELP_TYPES).map(([k, l]) => `<button class="cm-chip" data-v="${k}" aria-pressed="${(p.help_types || []).includes(k)}">${l}</button>`).join('')}</div>
        <span class="cm-label">Training I have (our office verifies before it shows)</span>
        <div class="cm-chips" id="certs">${[['cpr', 'CPR'], ['first_aid', 'First aid'], ['cna', 'CNA']].map(([k, l]) => `<button class="cm-chip" data-v="${k}" aria-pressed="${(p.certs || []).includes(k)}">${l}</button>`).join('')}</div>
        <div class="cm-field"><label for="languages">Languages I speak (optional)</label><input id="languages" value="${esc((p.languages || []).join(', '))}" placeholder="English, Spanish"></div>
        <label class="cm-check"><input type="checkbox" id="cds_hours" ${p.current_cds_hours ? 'checked' : ''}> I already work for a CDS consumer and want more hours</label>
      </div>
      <button class="cm-btn block" id="save">Save</button>
    </div>`;
    wireBack(v);
    $$('.cm-chips .cm-chip', v).forEach(b => b.onclick = () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
    const picked = id => $$('#' + id + ' .cm-chip[aria-pressed="true"]', v).map(b => b.dataset.v);
    $('#save', v).onclick = async e => {
      await act(e.currentTarget, () => call('saveProfile', { draft: {
        about_me: $('#about_me', v).value, enjoy_most: $('#enjoy_most', v).value, experience: $('#experience', v).value, interests: $('#interests', v).value,
        setting_pref: $('#setting_pref', v).value, town: $('#town', v).value, counties: picked('counties'), help_types: picked('help'), certs: picked('certs'),
        languages: $('#languages', v).value.split(','), has_car: $('#has_car', v).checked, travel_miles: $('#miles', v).value, current_cds_hours: $('#cds_hours', v).checked } }), 'Saved.');
      go('home');
    };
  }

  // ---------- photo ----------
  function photo(v) {
    v.innerHTML = `<div class="cm-stack">${back()}
      <h1>Your photo</h1><p class="cm-sub">A friendly, recent photo of just you, with your face clearly visible. Our office approves it before families see it.</p>
      ${d.photo_url ? `<div class="cg-photo"><img src="${esc(d.photo_url)}" alt="Your photo"><span class="cm-pill ${d.review_status === 'approved' ? 'ok' : 'prog'}">${d.review_status === 'approved' ? 'Approved' : 'Waiting for office review'}</span></div>` : ''}
      <div class="cm-card flat"><b style="color:var(--navy)">Tips for a great photo</b>
        <ul class="cg-tips"><li>${ICON.check} Face a window for soft, natural light</li><li>${ICON.check} Just you, from the shoulders up</li><li>${ICON.check} A real smile, no sunglasses or filters</li><li>${ICON.check} A plain or tidy background</li></ul></div>
      <label class="cm-btn block" for="pf">${d.photo_url ? 'Choose a different photo' : 'Choose or take a photo'}</label>
      <input id="pf" type="file" accept="image/*" capture="user" hidden>
    </div>`;
    wireBack(v);
    $('#pf', v).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      await act(null, async () => { const p = await shrinkPhoto(f); await call('uploadMedia', { kind: 'photo', mime: p.mime, data: p.data }); }, 'Photo saved.');
      go('photo');
    };
  }

  // ---------- C4 video ----------
  function video(v) {
    let stream = null, rec = null, chunks = [], blob = null, timer = null, secs = 0, pi = 0;
    v.innerHTML = `<div class="cm-stack">${back()}
      <h1>Intro video <span class="cm-pill mute">Optional</span></h1>
      <p class="cm-sub">30 to 60 seconds, from your phone. Just talk naturally. You can preview it, retake it, and replace or remove it later. Our office reviews it before families see it.</p>
      ${d.video_url ? `<div class="cm-card flat"><b style="color:var(--navy)">Your current video</b> <span class="cm-pill ${d.video_status === 'approved' ? 'ok' : 'prog'}">${d.video_status === 'approved' ? 'Approved' : 'Waiting for review'}</span>${videoHtml(d.video_url, d.first_name)}<button class="cm-btn danger sm" id="rm">Remove my video</button></div>` : ''}
      <div class="cm-card flat" id="plan"><b style="color:var(--navy)">You'll answer four short questions, one at a time</b>
        <ol class="cg-prompts">${PROMPTS.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
        <span class="cm-small">About 15 seconds each. Each question stays on screen while you talk.</span></div>
      <div class="cm-card" style="background:#0f2236;color:#fff;border:0">
        <span class="cm-kicker" id="pn">Prompt 1 of 4</span>
        <b style="font-size:1.15rem" id="pt">${esc(PROMPTS[0])}</b>
        <video id="live" playsinline muted style="width:100%;border-radius:12px;background:#092842;aspect-ratio:3/4;object-fit:cover" hidden></video>
        <video id="play" playsinline controls style="width:100%;border-radius:12px" hidden></video>
        <div class="cm-row between"><span id="clock" style="font-variant-numeric:tabular-nums;font-weight:700">0:00</span><span class="cm-small" style="color:rgba(255,255,255,.75)">Aim for under 60 seconds</span></div>
        <div class="cm-progress" style="background:rgba(255,255,255,.18)"><i id="bar" style="width:0;background:var(--honey)"></i></div>
        <div class="cm-row cm-wrap">
          <button class="cm-btn honey" id="start">Start recording</button>
          <button class="cm-btn ghost" id="next" hidden>Next prompt</button>
          <button class="cm-btn ghost" id="stop" hidden>Stop</button>
          <button class="cm-btn ghost" id="retake" hidden>Retake</button>
          <button class="cm-btn" id="keep" hidden>Use this video</button>
        </div>
        <label class="cm-btn quiet" for="vf2" style="color:#9fe3dd;justify-content:flex-start;padding-left:0">Or upload a video from your phone</label><input id="vf2" type="file" accept="video/*" capture="user" hidden>
      </div>
      <div class="cm-card flat" id="fallback" hidden>
        <p class="cm-sub" id="fbmsg">Recording here isn't available on this device. You can record with your phone's camera instead and upload it.</p>
        <label class="cm-btn ghost block" for="vf">Upload a video</label><input id="vf" type="file" accept="video/*" capture="user" hidden>
        ${MODE === 'practice' ? `<button class="cm-btn quiet" id="stand">Practice: use a stand-in video</button>` : ''}
      </div>
      ${!d.consents.video ? `<label class="cm-check"><input type="checkbox" id="vc"> ${esc(d.consent_wording.video.text)}</label>` : `<p class="cm-small">${ICON.check} You agreed to show your video. You can remove it any time.</p>`}
    </div>`;
    wireBack(v);
    const show = (id, on) => { $('#' + id, v).hidden = !on; };
    const setPrompt = () => { $('#pn', v).textContent = 'Prompt ' + (pi + 1) + ' of 4'; $('#pt', v).textContent = PROMPTS[pi]; };
    const fallback = msg => { show('fallback', true); if (msg) $('#fbmsg', v).textContent = msg; };
    const needConsent = async () => {
      if (d.consents.video) return true;
      if (!$('#vc', v).checked) { toast('Please check the box to agree to show your video.', 'err'); return false; }
      await call('giveConsent', { kind: 'video' }); return true;
    };
    const save = async (mime, data) => { if (!(await needConsent())) return; await act(null, () => call('uploadMedia', { kind: 'video', mime, data }), 'Video sent for review.'); go('video'); };
    if (!navigator.mediaDevices || !window.MediaRecorder) fallback();
    $('#start', v).onclick = async () => {
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }); }
      catch { fallback('We couldn\'t use the camera here. You can record with your phone\'s camera and upload it instead.'); return; }
      const live = $('#live', v); live.srcObject = stream; live.hidden = false; live.play();
      chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' }); stream.getTracks().forEach(t => t.stop()); live.hidden = true;
        const p = $('#play', v); p.src = URL.createObjectURL(blob); p.hidden = false; show('retake', true); show('keep', true); show('next', false); show('stop', false); clearInterval(timer); };
      rec.start(); secs = 0; pi = 0; setPrompt(); $('#plan', v).hidden = true;
      show('start', false); show('next', true); show('stop', true);
      timer = setInterval(() => { secs++; $('#clock', v).textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
        $('#bar', v).style.width = Math.min(100, secs / 60 * 100) + '%'; if (secs >= 90) rec.stop(); }, 1000);
    };
    $('#next', v).onclick = () => { pi = Math.min(3, pi + 1); setPrompt(); if (pi === 3) show('next', false); };
    $('#stop', v).onclick = () => rec && rec.state === 'recording' && rec.stop();
    $('#retake', v).onclick = () => { show('play', false); show('retake', false); show('keep', false); show('start', true); $('#clock', v).textContent = '0:00'; $('#bar', v).style.width = 0; };
    $('#keep', v).onclick = async () => save(blob.type, await fileToDataUrl(blob, 20 * 1048576));
    ['#vf', '#vf2'].forEach(id => { $(id, v).onchange = async e => { const f = e.target.files[0]; if (f) save(f.type || 'video/mp4', await fileToDataUrl(f, 20 * 1048576)); }; });
    if ($('#stand', v)) $('#stand', v).onclick = () => save('video/practice', 'practice-video:' + d.first_name);
    if ($('#rm', v)) $('#rm', v).onclick = async e => { await act(e.currentTarget, () => call('removeVideo'), 'Video removed.'); go('video'); };
  }

  // ---------- C5 availability ----------
  function availability(v) {
    const av = JSON.parse(JSON.stringify(d.availability || {}));
    v.innerHTML = `<div class="cm-stack">${back()}
      <h1>Your days and times</h1><p class="cm-sub">Update these any time. Changes show to families right away, with today's date as "last confirmed".</p>
      <div class="cm-card">
        <span class="cm-label">Quick picks</span>
        <div class="cm-chips">${[['wkam', 'Weekday mornings'], ['wkday', 'Weekdays, all day'], ['eve', 'Weekday evenings'], ['wkend', 'Weekends'], ['clear', 'Clear all']].map(([k, l]) => `<button class="cm-chip" data-preset="${k}">${l}</button>`).join('')}</div>
        <div class="cm-days">
        <div class="d"><span></span>${PARTS.map(p => `<span class="head">${{ am: 'Morning', pm: 'Afternoon', eve: 'Evening', night: 'Overnight' }[p]}</span>`).join('')}</div>
        ${DAYS.map(day => `<div class="d"><span>${DAY_LABEL[day]}</span>${PARTS.map(p => `<button data-d="${day}" data-p="${p}" aria-pressed="${(av[day] || []).includes(p)}" aria-label="${DAY_LABEL[day]} ${PART_LABEL[p]}">${(av[day] || []).includes(p) ? 'Yes' : ''}</button>`).join('')}</div>`).join('')}
      </div></div>
      <div class="cm-card"><span class="cm-label">Hours a week you'd like</span>
        <div class="cm-grid2 cg-hours"><div class="cm-field"><label for="hmin">At least</label><input id="hmin" type="number" min="0" max="80" value="${esc(d.hours_min ?? '')}"></div>
        <div class="cm-field"><label for="hmax">Up to</label><input id="hmax" type="number" min="0" max="80" value="${esc(d.hours_max ?? '')}"></div></div>
        <label class="cm-check"><input type="checkbox" id="acc" ${d.accepting_intros && !d.paused ? 'checked' : ''}> I'm accepting introductions to new families</label></div>
      <button class="cm-btn block" id="save">Save and confirm</button>
    </div>`;
    wireBack(v);
    const paint = () => $$('.cm-days button', v).forEach(b => { const on = (av[b.dataset.d] || []).includes(b.dataset.p); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Yes' : ''; });
    const WK = ['mon', 'tue', 'wed', 'thu', 'fri'];
    $$('[data-preset]', v).forEach(b => b.onclick = () => {
      const k = b.dataset.preset;
      if (k === 'clear') DAYS.forEach(d => { av[d] = []; });
      const add = (days, parts) => days.forEach(d => { av[d] = [...new Set([...(av[d] || []), ...parts])]; });
      if (k === 'wkam') add(WK, ['am']);
      if (k === 'wkday') add(WK, ['am', 'pm']);
      if (k === 'eve') add(WK, ['eve']);
      if (k === 'wkend') add(['sat', 'sun'], ['am', 'pm']);
      paint();
    });
    $$('.cm-days button', v).forEach(b => b.onclick = () => {
      const { d: day, p } = b.dataset; av[day] = av[day] || [];
      av[day] = av[day].includes(p) ? av[day].filter(x => x !== p) : [...av[day], p];
      b.setAttribute('aria-pressed', String(av[day].includes(p))); b.textContent = av[day].includes(p) ? 'Yes' : '';
    });
    $('#save', v).onclick = async e => { await act(e.currentTarget, () => call('saveAvailability', { availability: av, hours_min: $('#hmin', v).value, hours_max: $('#hmax', v).value, accepting_intros: $('#acc', v).checked }), 'Saved. Thanks for keeping this current!'); go('home'); };
  }

  // ---------- C6 preview + consent ----------
  function consent(v) {
    const p = d.draft;
    const preview = {
      first_name: d.first_name, town: p.town, counties: p.counties || [], photo_url: d.photo_url, video_url: d.consents.video ? d.video_url : null,
      section: d.listing_text.includes('complete') ? 'complete' : 'in_progress', availability: d.availability, hours_min: d.hours_min, hours_max: d.hours_max,
      confirmed_text: d.availability_confirmed_text, accepting: d.accepting_intros && !d.paused,
      about_me: p.about_me, enjoy_most: p.enjoy_most, interests: p.interests, setting_pref: p.setting_pref, experience: p.experience,
      help_types: (p.help_types || []).map(h => HELP_TYPES[h]), languages: p.languages || [], has_car: !!p.has_car, travel_miles: p.travel_miles,
      certs_verified: (p.certs || []).filter(x => (d.verified_certs || []).includes(x)),
      certs_pending: (p.certs || []).filter(x => !(d.verified_certs || []).includes(x)), current_cds_hours: !!p.current_cds_hours,
    };
    v.innerHTML = `<div class="cm-stack">${back()}
      <h1>See what families see</h1>
      <p class="cm-sub">This is exactly how your profile will look to invited families once our office approves it. Changes to your words, photo or video are reviewed first. Days and times update right away.</p>
      <div class="cg-preview"><span class="cg-preview-tag">Preview</span>${profileHtml(preview, { preview: true, cta: `<button class="cm-btn honey block" disabled>Families tap here to ask to meet you</button>` })}</div>
      <div class="cm-row cm-wrap"><button class="cm-btn ghost" data-go="profile">Edit my words</button><button class="cm-btn ghost" data-go="photo">Change photo</button><button class="cm-btn ghost" data-go="availability">Change days and times</button></div>
      <div class="cm-card">
        <label class="cm-check"><input type="checkbox" id="pc" ${d.consents.profile ? 'checked disabled' : ''}> ${esc(d.consent_wording.profile.text)}</label>
        <button class="cm-btn block" id="submit" ${d.review_status === 'approved' ? 'disabled' : ''}>${d.review_status === 'submitted' ? 'Sent for review' : d.review_status === 'approved' ? 'Approved. Families can see this.' : 'Send to our office for review'}</button>
      </div>
      <div class="cm-card flat">
        <b style="color:var(--navy)">Need a break?</b>
        <p class="cm-small" style="margin:0">Pausing hides you from families but keeps your profile. Removing takes your listing, photo and video down.</p>
        <div class="cm-row cm-wrap"><button class="cm-btn ghost" id="pauseBtn">${d.accepting_intros && !d.paused ? 'Pause introductions' : 'Start introductions again'}</button><button class="cm-btn danger" id="withdraw">Remove my listing</button></div>
      </div>
      <div class="cm-card warn" id="confirmW" hidden><p class="cm-sub">Remove your listing? Families won't see you anymore, and your photo and video are taken down. You can set it up again later.</p>
        <div class="cm-row cm-wrap"><button class="cm-btn danger" id="yesW">Yes, remove it</button><button class="cm-btn ghost" id="noW">Keep my listing</button></div></div>
    </div>`;
    $('#pauseBtn', v).onclick = async e => { await act(e.currentTarget, () => call('setPaused', { paused: d.accepting_intros && !d.paused }), d.accepting_intros && !d.paused ? 'Introductions paused. Your profile is kept.' : 'You\'re accepting introductions again.'); go('consent'); };
    wireBack(v);
    $('#submit', v).onclick = async e => {
      await act(e.currentTarget, async () => { if (!d.consents.profile) { if (!$('#pc', v).checked) throw new Error('Please check the box to agree to be listed.'); await call('giveConsent', { kind: 'profile' }); } await call('submitForReview'); }, 'Sent! Our office will review it soon.');
      go('home');
    };
    $('#withdraw', v).onclick = () => { $('#confirmW', v).hidden = false; };
    $('#noW', v).onclick = () => { $('#confirmW', v).hidden = true; };
    $('#yesW', v).onclick = async e => { await act(e.currentTarget, () => call('withdrawListing'), 'Your listing was removed.'); go('home'); };
  }

  // ---------- C7 introductions ----------
  function intros(v) {
    v.innerHTML = `<div class="cm-stack">${back()}<h1>Families who'd like to meet you</h1>
      ${d.intros.length ? d.intros.map(i => `<div class="cm-req">
        <div class="cm-row between"><strong style="color:var(--navy);font-size:1.08rem">${esc(i.family)} · near ${esc(i.town || 'you')}</strong>
          <span class="cm-pill ${i.status === 'asked' ? 'prog' : 'ok'}">${i.status === 'asked' ? 'Waiting for your answer' : i.status === 'scheduled' ? 'Meeting set' : 'You said yes'}</span></div>
        <span class="cm-sub">${esc(i.how)}${i.preferred_times ? ' · ' + esc(i.preferred_times) : ''}</span>
        ${i.status === 'scheduled' ? `<span class="cm-sub"><b>${esc(fmtWhen(i.meet_at))}</b> ${esc(i.meet_details || '')}</span>` : ''}
        ${i.status === 'asked' ? `<div class="cm-row cm-wrap"><button class="cm-btn" data-a="yes" data-id="${i.id}">Yes, I'd like to meet</button><button class="cm-btn ghost" data-a="no" data-id="${i.id}">Not this time</button></div>` : ''}
        ${i.status === 'caregiver_yes' ? `<span class="cm-small">Our office will call you both to set a time.</span>` : ''}
      </div>`).join('') : `<div class="cm-card cm-empty">No requests right now. Keep your days and times current so families can find you.</div>`}
      <p class="cm-small">Meeting doesn't commit you to anything.</p></div>`;
    wireBack(v);
    $$('[data-a]', v).forEach(b => b.onclick = async () => { await act(b, () => call('respondIntro', { id: b.dataset.id, answer: b.dataset.a }), b.dataset.a === 'yes' ? 'Thanks! Our office will call to set a time.' : 'Thanks for letting us know.'); go('intros'); });
  }
}
let AB = '';
const brand = () => `<div class="cm-brandline"><img src="${AB}assets/mark.png" alt="" class="cg-mark"><span><strong>Caring Companions CDS</strong><span>Your caregiver profile · private</span></span></div>`;
