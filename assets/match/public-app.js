// Public screens P1 to P3: landing page, request access, join our caregiver list.
// Shows counts of fully screened caregivers by county. Never a person.
import { api, joinCaregiverList, MODE } from './api.js';
import { IHS_SECTION_APPROVED } from './mode.js';
import { SAMPLES } from './samples.js';
import { esc, $, $$, act, ICON } from './ui.js';
import { COUNTIES, PROGRAMS, RELATIONSHIPS } from './shared/rules.js';
import { PROVIDER_CHOICE, FCSR_EXPLAINER } from './shared/messages.js';

export function mountPublic(el, opts = {}) {
  el.classList.add('cm');
  const view = opts.view || 'landing';
  ({ landing, join })[view]();

  async function landing() {
    const showIhs = IHS_SECTION_APPROVED || MODE === 'practice';
    el.innerHTML = `<div class="pl">
      <header class="pl-top"><div class="pl-in pl-top-in">
        <img src="${esc(opts.logo || 'assets/logo.png')}" alt="Caring Companions Consumer Directed Services" class="pl-logo" width="770" height="206">
        <span class="pl-top-call">Call <b>417-218-2888</b><small>Toll free 866-863-5151</small></span>
      </div></header>
      <section class="pl-hero"><div class="pl-in pl-hero-grid">
        <div class="pl-hero-text">
          <h1>Find a caregiver. Find your fit.</h1>
          <p class="pl-lede">Discover potential caregivers, watch introduction videos, and meet someone before deciding whether CDS is right for you.</p>
          <div class="pl-cta">
            <a class="cm-btn honey pl-big" href="#req" id="cta">Explore Our Private Caregiver Network</a>
            <span class="pl-call">Or call us: <b>417-218-2888</b> · toll free <b>866-863-5151</b></span>
          </div>
          <ul class="pl-pills"><li>${ICON.check} Free to look</li><li>${ICON.check} No obligation</li><li>${ICON.check} You choose who to hire</li></ul>
        </div>
        <div class="pl-hero-card" aria-hidden="true">${sampleCard(SAMPLES[0], true)}</div>
      </div></section>

      <section class="pl-sec"><div class="pl-in">
        <div class="pl-head"><h2>Meet caregivers who may be a great fit</h2>
          <p class="cm-sub">Every caregiver has a profile in their own words, their general availability, and many have a short intro video.</p></div>
        <div class="pl-samples" id="samples" aria-label="Sample caregiver profiles">${SAMPLES.map(x => sampleCard(x, false)).join('')}</div>
        <div class="pl-dots" id="dots" aria-hidden="true">${SAMPLES.map((x, i) => `<span class="${i === 0 ? 'on' : ''}"></span>`).join('')}<em>Swipe to see more</em></div>
        <p class="cm-small pl-note">Illustrative examples with sample photos, not real caregivers. Real caregiver profiles are available by private invitation.</p>
        <div class="pl-after"><a class="cm-btn honey pl-big" href="#req" data-req>Request Your Private Invitation</a></div>
      </div></section>

      <section class="pl-sec pl-tint"><div class="pl-in">
        <div class="pl-head"><h2>How it works</h2></div>
        <ol class="pl-steps">
          <li><span class="n">1</span><b>Tell us what you're looking for.</b><span>A short call about the help you need and how CDS works, including what you're responsible for as the employer. With your permission, we also check your Missouri Medicaid coverage.</span></li>
          <li><span class="n">2</span><b>Browse caregiver profiles and optional videos.</b><span>Your private invitation opens the directory on your phone or computer.</span></li>
          <li><span class="n">3</span><b>Request an introduction and decide who you'd like to hire.</b><span>Meet by live video or in person. Meeting doesn't commit you or the caregiver.</span></li>
        </ol>
      </div></section>

      <section class="pl-sec"><div class="pl-in pl-two">
        ${showIhs ? `<div class="cm-card pl-ihs">
          ${IHS_SECTION_APPROVED ? '' : '<span class="cm-pill prog">Practice only: held until the legal review is done</span>'}
          <h2>Already receiving in-home care?</h2>
          <p class="cm-sub">You can explore potential caregivers before deciding whether to pursue CDS. Browsing doesn't change your existing services.</p>
          <p class="cm-sub">If you do decide to make a change, it goes through the Division of Senior and Disability Services, and your current services continue until new services are authorized. You can choose any CDS provider.</p>
        </div>` : ''}
        <div class="cm-card">
          <h2>Caregivers ready to meet families in your area</h2>
          <div class="cm-counts" id="counts"><span class="cm-muted">Loading…</span></div>
          <p class="cm-small">Counted live from our records: caregivers whose state screening is fully verified, who are accepting new introductions, and who have confirmed their availability in the last 45 days. Profiles are shared only with invited families.</p>
        </div>
      </div></section>

      <section class="pl-sec pl-tint" id="req"><div class="pl-in pl-formwrap">
        <div class="cm-card pl-form">
          <div id="step1">
            <h2>Request your private invitation</h2>
            <p class="cm-sub">Three quick questions. We'll call you, answer your questions, check your Medicaid coverage with your permission, and then send your personal invitation.</p>
            <form id="rf" novalidate class="cm-stack">
              <div class="cm-grid2">
                <div class="cm-field"><label for="fn">First name</label><input id="fn" autocomplete="given-name" required></div>
                <div class="cm-field"><label for="ln">Last name <span class="pl-opt">optional</span></label><input id="ln" autocomplete="family-name"></div>
              </div>
              <div class="cm-grid2">
                <div class="cm-field"><label for="ph">Phone</label><input id="ph" type="tel" autocomplete="tel" required></div>
                <div class="cm-field"><label for="tw">Town</label><input id="tw" autocomplete="address-level2" required></div>
              </div>
              <fieldset class="pl-prog"><legend class="cm-label">Which describes you? <span class="pl-opt">optional</span></legend>
                <div class="cm-chips">${Object.entries(PROGRAMS).map(([k, l]) => `<label class="pl-radio"><input type="radio" name="prog" value="${k}"><span>${esc(l)}</span></label>`).join('')}</div>
              </fieldset>
              <div style="position:absolute;left:-9999px" aria-hidden="true"><label for="website">Website</label><input id="website" tabindex="-1" autocomplete="off"></div>
              <button class="cm-btn block pl-big" type="submit">Request my invitation</button>
              <p class="cm-small">Free, and no obligation. You don't have to switch programs or choose us to look.</p>
            </form>
          </div>
          <div id="step2" hidden class="cm-stack">
            <h2 id="thx">Thank you!</h2>
            <p class="cm-sub">We'll call you soon. If you'd like, add a few details to help us prepare. All of these are optional.</p>
            <div class="cm-grid2">
              <div class="cm-field"><label for="em">Email</label><input id="em" type="email" autocomplete="email"></div>
              <div class="cm-field"><label for="co">County</label><select id="co"><option value="">Choose</option>${COUNTIES.map(c => `<option>${c}</option>`).join('')}</select></div>
            </div>
            <div class="cm-grid2">
              <div class="cm-field"><label for="rel">Who needs care?</label><select id="rel"><option value="">Choose</option>${Object.entries(RELATIONSHIPS).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></div>
              <div class="cm-field"><label for="bt">Best time to call</label><input id="bt" placeholder="Mornings, after 3…"></div>
            </div>
            <div class="cm-row cm-wrap"><button class="cm-btn" id="more">Save these details</button><button class="cm-btn quiet" id="skip">Skip</button></div>
          </div>
          <div id="step3" hidden class="cm-stack"><h2>You're all set</h2><p class="cm-sub">We'll call you soon to talk about CDS and, with your permission, check your Medicaid coverage. Browsing caregivers doesn't commit you to anything. Questions before then? Call 417-218-2888 (toll free 866-863-5151), Monday to Friday.</p></div>
        </div>
      </div></section>

      <section class="pl-sec"><div class="pl-in pl-two">
        <div class="cm-card flat pl-choose">
          <h2>You choose. You hire. We help with introductions.</h2>
          <p class="cm-sub">With CDS, you're the employer: you choose, hire, train and supervise your caregiver. Caring Companions CDS helps you meet caregivers and handles the program paperwork. We don't assign caregivers or guarantee a match.</p>
          <p class="cm-sub">The directory is a service of Caring Companions CDS. You're welcome to look whether or not you choose us as your CDS agency.</p>
        </div>
        <div class="cm-card pl-join">
          <h2>Interested in becoming a CDS caregiver?</h2>
          <p class="cm-sub">Join our caregiver network. Missouri requires every CDS caregiver to register with the Family Care Safety Registry and pass the state's screening. Registration is a one-time $16 state fee ($16.57 online). If you're already registered, you don't pay again. We complete the screening and walk you through each step.</p>
          <button class="cm-btn ghost" id="toJoin">Join our caregiver list</button>
        </div>
      </div></section>

      <footer class="pl-foot"><div class="pl-in"><p>${esc(PROVIDER_CHOICE)}</p></div></footer>
    </div>`;
    api('public', 'counts').then(r => {
      const rows = Object.entries(r.counts).sort((a, b) => b[1] - a[1]);
      $('#counts', el).innerHTML = rows.length ? rows.map(([c, n]) => `<div><span>${esc(c)} County</span><b>${n}</b></div>`).join('') : '<span class="cm-muted">Our network is growing. Call us about your county.</span>';
    }).catch(() => { $('#counts', el).innerHTML = '<span class="cm-muted">Call us to ask about your county.</span>'; });
    const toReq = e => { e.preventDefault(); $('#req', el).scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#fn', el).focus({ preventScroll: true }), 500); };
    $('#cta', el).onclick = toReq;
    $$('[data-req]', el).forEach(a => a.onclick = toReq);
    // Dots follow the swipe position on phones.
    const sc = $('#samples', el), dots = $$('#dots span', el);
    sc.addEventListener('scroll', () => {
      const cards = Array.from(sc.children), mid = sc.scrollLeft + sc.clientWidth / 2;
      let best = 0, bd = Infinity;
      cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      dots.forEach((d, i) => d.classList.toggle('on', i === best));
      if (sc.scrollLeft > 20) $('#dots em', el).hidden = true;
    }, { passive: true });
    $('#toJoin', el).onclick = () => (opts.onNavigate ? opts.onNavigate('join') : (location.href = 'caregivers/'));
    let followup = null;
    $('#rf', el).onsubmit = async e => {
      e.preventDefault();
      const r = await act($('button[type=submit]', el), () => api('public', 'requestAccess', { first_name: $('#fn', el).value, last_name: $('#ln', el).value, phone: $('#ph', el).value,
        town: $('#tw', el).value, program: ($('input[name=prog]:checked', el) || {}).value, website: $('#website', el).value }));
      followup = r.followup;
      $('#thx', el).textContent = 'Thank you, ' + $('#fn', el).value.trim() + '!';
      $('#step1', el).hidden = true; $('#step2', el).hidden = false;
    };
    $('#more', el).onclick = async e => {
      await act(e.currentTarget, () => api('public', 'requestAccessMore', { followup, email: $('#em', el).value, county: $('#co', el).value, relationship: $('#rel', el).value, best_time: $('#bt', el).value }));
      $('#step2', el).hidden = true; $('#step3', el).hidden = false;
    };
    $('#skip', el).onclick = () => { $('#step2', el).hidden = true; $('#step3', el).hidden = false; };
  }

  function sampleCard(x, big) {
    return `<article class="pl-card ${big ? 'big' : ''}">
      <div class="pl-photo">${x.photo ? `<img src="${esc(x.photo)}" alt="Sample photo for the example profile ${esc(x.name)}" loading="lazy">` : x.svg}${x.video ? `<span class="pl-play">${ICON.video} Intro video</span>` : ''}<span class="pl-sample">Sample profile</span></div>
      <div class="pl-body"><div class="cm-row between"><strong>${esc(x.name)}</strong><span class="cm-pill ok">${ICON.shield} Screening complete</span></div>
        <span class="cm-small">${esc(x.town)} · ${esc(x.when)} · ${esc(x.hours)}</span>
        <p class="pl-q">"${esc(x.quote)}"</p></div>
    </article>`;
  }

  // P3: Join our caregiver list. Wording approved by Samantha 2026-10-16.
  // Saves through the server (Hub to-do + office email). If the server can't be
  // reached, it falls back to saving straight to the list so no one is lost;
  // the database still makes the Hub to-do.
  function join() {
    const AVAIL = ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Saturdays', 'Sundays', 'Overnights', 'Short notice', 'Flexible'];
    const sel = (id, opts) => `<select id="${id}"><option value="">Choose one</option>${opts.map(o => Array.isArray(o) ? `<option value="${esc(o[0])}">${esc(o[1])}</option>` : `<option>${esc(o)}</option>`).join('')}</select>`;
    const chips = (id, items) => `<div class="cm-chips" id="${id}">${items.map(c => `<button type="button" class="cm-chip" data-v="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>`;
    const radios = (name, items) => `<div class="cm-chips" role="radiogroup">${items.map(([v, l]) => `<label class="cm-check"><input type="radio" name="${name}" value="${esc(v)}"> ${esc(l)}</label>`).join('')}</div>`;
    el.innerHTML = `<header class="pl-top"><div class="pl-in pl-top-in">
        <img src="${esc(opts.logo || 'assets/logo.png')}" alt="Caring Companions Consumer Directed Services" class="pl-logo" width="770" height="206">
        <span class="pl-top-call">Call <b>417-218-2888</b><small>Toll free 866-863-5151</small></span>
      </div></header><div class="cm-app">
      ${opts.onNavigate ? `<button class="cm-back" id="back">${ICON.back} Back</button>` : ''}
      <div id="jtop">
        <h1>Join our caregiver list</h1>
        <p class="cm-sub">Families across Southwest Missouri use the Consumer Directed Services (CDS) program to hire their own caregiver. Some need someone full time, some part time, and some need a person who can fill in now and then. Join our list and we'll help families near you meet you.</p>
        <p class="cm-sub" style="margin-top:10px">Signing up takes about two minutes, then you'll go straight to building your profile. It doesn't commit you to anything, and you can say no to any family.</p>
      </div>
      <div class="cm-card tint" id="jpay"><div><strong style="font-size:1.5rem;color:var(--navy)">$15 to $16 per hour</strong></div><p class="cm-small" style="margin:0">Paid weekly, every Thursday, by direct deposit or pay card.</p></div>
      <div class="cm-card flat" id="jhow"><p style="margin:0"><strong>How CDS works:</strong> the family is your employer. They choose, hire and supervise you. Caring Companions CDS handles payroll, taxes and the program paperwork, and we help with introductions.</p></div>
      <form id="jf" class="cm-card" novalidate>
        <h2>Your contact information</h2>
        <div class="cm-grid2">
          <div class="cm-field"><label for="jfn">First name</label><input id="jfn" required autocomplete="given-name"></div>
          <div class="cm-field"><label for="jln">Last name</label><input id="jln" required autocomplete="family-name"></div>
        </div>
        <div class="cm-grid2">
          <div class="cm-field"><label for="jph">Phone</label><input id="jph" type="tel" required autocomplete="tel" inputmode="tel"></div>
          <div class="cm-field"><label for="jem">Email</label><input id="jem" type="email" autocomplete="email"></div>
        </div>
        <div class="cm-grid2">
          <div class="cm-field"><label for="jci">Town you live in</label><input id="jci" autocomplete="address-level2"></div>
          <div class="cm-field"><label for="jzi">ZIP</label><input id="jzi" inputmode="numeric" maxlength="5" autocomplete="postal-code"></div>
        </div>

        <h2>Most important question</h2>
        <p class="cm-small" style="margin:0">Many people come to us because there is already someone they look after, or want to. If that's you, say so here. It usually means we can move much faster.</p>
        <span style="font-weight:600">Do you already have someone you would be caring for?</span>
        ${radios('jhas', [['Yes', 'Yes, I have someone'], ['No', 'No, I am looking for work'], ['Not sure', 'Not sure yet']])}
        <div id="jhasMore" hidden><div style="display:grid;gap:12px">
          <div class="cm-field"><label for="jcn">Their name</label><input id="jcn"></div>
          <div class="cm-grid2">
            <div class="cm-field"><label for="jcr">They are your</label>${sel('jcr', ['Parent', 'Grandparent', 'Adult child', 'Brother or sister', 'Other relative', 'Friend', 'Neighbor', 'No relation'])}</div>
            <div class="cm-field"><label for="jcm">Do they have Missouri Medicaid?</label>${sel('jcm', ['Yes, active Medicaid', 'Not sure', 'No'])}</div>
          </div>
          <p class="cm-small" style="margin:0">You cannot be paid to care for your husband or wife, or for someone whose legal guardian you are. That is a state rule. Everyone else is fine.</p>
        </div></div>

        <h2>Where you can work</h2>
        <p class="cm-small" style="margin:0">Tap every county you would be willing to work in.</p>
        ${chips('jco', COUNTIES)}
        <div class="cm-grid2">
          <div class="cm-field"><label for="jmi">How far will you drive?</label>${sel('jmi', [['10', 'Up to 10 miles'], ['20', 'Up to 20 miles'], ['30', 'Up to 30 miles'], ['45', 'Up to 45 miles'], ['100', 'Distance is not a problem']])}</div>
          <div class="cm-field"><label for="jtr">Reliable transportation?</label>${sel('jtr', [['yes', 'Yes'], ['no', 'No']])}</div>
        </div>

        <h2>When you are available</h2>
        <p class="cm-small" style="margin:0">Tap anything that could work. This is just a rough idea, not a schedule.</p>
        ${chips('jav', AVAIL)}
        <div class="cm-field"><label for="jhw">What kind of position are you looking for?</label>${sel('jhw', ['Full time, 30+ hours a week', 'Part time, around 10 to 25 hours a week', 'A few hours a week', 'Fill-in shifts only', 'Whatever is available'])}</div>

        <h2>Your experience</h2>
        <p class="cm-small" style="margin:0">No experience is fine. Many of our best caregivers started by caring for their own family.</p>
        <div class="cm-field"><label for="jex">Caregiving experience</label>${sel('jex', ['No experience, willing to learn', 'I have cared for a family member', 'Some paid caregiving experience', 'Several years of paid caregiving', 'Professional or certified caregiver'])}</div>
        <label class="cm-check"><input type="checkbox" id="jcpr"> I have current CPR or First Aid certification</label>
        <label class="cm-check"><input type="checkbox" id="jcna"> I am a CNA, CMT, LPN, RN or similar</label>
        <label class="cm-check"><input type="checkbox" id="jwb"> I have worked for Caring Companions before</label>
        <div class="cm-field"><label for="jco2">Any other certifications or training</label><input id="jco2" placeholder="Optional"></div>
        <div class="cm-field"><label for="jen">Anything else about your experience</label><textarea id="jen" placeholder="Optional. For example: I cared for my grandmother for three years."></textarea></div>

        <h2>State screening</h2>
        <fieldset class="cm-card tint" style="border:0;margin:0">
          <legend class="cm-label" style="padding:0">Missouri Family Care Safety Registry (FCSR)</legend>
          <span style="font-weight:600">Are you already registered with the Missouri Family Care Safety Registry?</span>
          ${radios('jfcsr', [['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure']])}
          <label class="cm-check" id="jbgw"><input type="checkbox" id="jbg"> <span>I understand Missouri requires every CDS caregiver to register with the Family Care Safety Registry and pass the state's screening, and I'm willing to complete it. If I'm not registered yet, the one-time state fee is $16 ($16.57 online). If I'm already registered, I don't pay again.</span></label>
        </fieldset>

        <h2>A few last questions</h2>
        <div class="cm-field"><label for="jhh">How did you hear about us?</label>${sel('jhh', ['A current caregiver told me', 'A consumer or family member told me', 'Facebook or social media', 'Found your website', 'Job posting', 'Someone at Caring Companions contacted me', 'Other'])}</div>
        <div class="cm-field"><label for="jno">Anything you would like us to know</label><textarea id="jno" placeholder="Optional"></textarea></div>
        <input id="jweb" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">

        <div class="cm-card flat" style="margin:0"><p style="margin:0"><strong>About your profile:</strong> After you sign up, you can build a profile for our private caregiver directory. Families see only what you approve: your first name, photo, town, availability and your own words. Your last name, phone, email and address are never shown.</p></div>
        <p class="cm-small" style="margin:0">Please don't put your Social Security number on this form, and never send it by email or text. We ask for it later through your private, secure link, only to run your state screening.</p>
        <p class="cm-small" id="jerr" role="alert" style="margin:0;color:var(--bad);font-weight:600" hidden></p>
        <button class="cm-btn honey block" type="submit">Add me to the caregiver list</button>
        <p class="cm-small" style="margin:0;text-align:center">Questions? Call 417-218-2888, or toll free 866-863-5151, Monday to Friday 9am to 4pm.</p>
      </form>
      <div class="cm-card tint" id="jthanks" hidden>
        <h2 id="jthx">You're on our caregiver list.</h2>
        <p id="jrepeat" style="margin:0" hidden>We already have your phone number on file, so for your privacy we'll send your private profile link to that number instead of showing it here.</p>
        <p style="margin:0;font-weight:600">What happens next:</p>
        <ol style="margin:0;padding-left:1.3em;display:grid;gap:6px">
          <li>Someone from our office calls or texts you to say hello and answer your questions.</li>
          <li>We send your private link to build your profile: a photo, a few words about you, your availability, and an optional short intro video.</li>
          <li>We walk you through the state screening.</li>
          <li>After we review your profile, invited families near you can see it and ask to meet you. You say yes or no to every request.</li>
        </ol>
        <p style="margin:0">There's nothing else you need to do right now.</p>
        <p class="cm-small" style="margin:0">Need us before then? Call 417-218-2888, or toll free 866-863-5151.</p>
      </div>
    </div>`;
    if ($('#back', el)) $('#back', el).onclick = () => opts.onNavigate('landing');
    $$('.cm-chips .cm-chip', el).forEach(b => b.onclick = () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
    $$('input[name=jhas]', el).forEach(r => r.onchange = () => { $('#jhasMore', el).hidden = r.value !== 'Yes'; });
    const ph = $('#jph', el);
    ph.oninput = () => {
      const d = ph.value.replace(/\D/g, '').replace(/^1(?=\d{10})/, '').slice(0, 10);
      ph.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d.length ? `(${d}` : '';
    };
    const picked = id => $$(`#${id} .cm-chip[aria-pressed="true"]`, el).map(b => b.dataset.v);
    const radio = n => ($(`input[name=${n}]:checked`, el) || {}).value || null;
    $('#jf', el).onsubmit = async e => {
      e.preventDefault();
      const err = $('#jerr', el);
      const problems = [];
      if (!$('#jfn', el).value.trim()) problems.push('your first name');
      if (!$('#jln', el).value.trim()) problems.push('your last name');
      if ($('#jph', el).value.replace(/\D/g, '').length !== 10) problems.push('a 10-digit phone number');
      if (!radio('jhas')) problems.push('whether you already have someone to care for');
      if (!picked('jco').length) problems.push('at least one county');
      if (!$('#jbg', el).checked) problems.push('the state screening checkbox');
      if (problems.length) {
        err.textContent = 'Please add ' + problems.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.';
        err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      err.hidden = true;
      const has = radio('jhas');
      const input = {
        first_name: $('#jfn', el).value.trim(), last_name: $('#jln', el).value.trim(), phone: $('#jph', el).value.trim(), email: $('#jem', el).value.trim(),
        city: $('#jci', el).value.trim(), zip: $('#jzi', el).value.trim(), counties: picked('jco'), availability: picked('jav'),
        max_miles: $('#jmi', el).value ? Number($('#jmi', el).value) : null,
        has_transport: $('#jtr', el).value === 'yes' ? true : $('#jtr', el).value === 'no' ? false : null,
        hours_wanted: $('#jhw', el).value || null, experience: $('#jex', el).value || null, experience_notes: $('#jen', el).value.trim(),
        cert_cpr: $('#jcpr', el).checked, cert_cna: $('#jcna', el).checked, cert_other: $('#jco2', el).value.trim(), worked_here_before: $('#jwb', el).checked,
        has_potential_consumer: has,
        consumer_name: has === 'Yes' ? $('#jcn', el).value.trim() : '', consumer_relationship: has === 'Yes' ? $('#jcr', el).value : '', consumer_has_medicaid: has === 'Yes' ? $('#jcm', el).value : '',
        fcsr_registered_answer: radio('jfcsr'), background_ok: true, how_heard: $('#jhh', el).value || null, applicant_notes: $('#jno', el).value.trim(),
        website: $('#jweb', el).value,
      };
      let res = null;
      try {
        await act($('button[type=submit]', el), async () => {
          try { res = await api('public', 'joinList', input); }
          catch (ex) {
            // A real answer from the server (like a missing field) is shown as is.
            // Only an unreachable, broken or older server falls back to the direct save.
            if (ex.status && ex.status < 500 && ex.status !== 404) throw ex;
            if (input.website) return;
            await joinCaregiverList({
              first_name: input.first_name, last_name: input.last_name, phone: input.phone, email: input.email || null, city: input.city || null, zip: input.zip || null,
              counties: input.counties, availability: input.availability, max_miles: input.max_miles, has_transport: input.has_transport, hours_wanted: input.hours_wanted,
              experience: input.experience, experience_notes: input.experience_notes || null, cert_cpr: input.cert_cpr, cert_cna: input.cert_cna, cert_other: input.cert_other || null,
              worked_here_before: input.worked_here_before, has_potential_consumer: has, knows_consumer: input.consumer_name || null,
              consumer_relationship: input.consumer_relationship || null, consumer_has_medicaid: input.consumer_has_medicaid || null,
              how_heard: input.how_heard, applicant_notes: input.applicant_notes || null, fcsr_registered_answer: input.fcsr_registered_answer,
            });
          }
        });
      } catch { return; }
      // New sign-up: straight into their profile, starting with how it works.
      if (res && res.link) {
        const u = new URL(res.link, location.href);
        u.searchParams.set('view', 'welcome');
        $('#jf button[type=submit]', el).disabled = true;
        $('#jf button[type=submit]', el).textContent = 'Opening your profile…';
        location.href = u.toString();
        return;
      }
      if (res && res.repeat) $('#jrepeat', el).hidden = false;
      $('#jthx', el).textContent = (res && res.repeat ? 'You\'re on our caregiver list. Thanks again, ' : 'You\'re on our caregiver list. Thank you, ') + input.first_name + '.';
      ['#jf', '#jtop', '#jpay', '#jhow'].forEach(s => { $(s, el).hidden = true; });
      $('#jthanks', el).hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }
}
