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

  // P3: the existing join form, with the FCSR question added.
  function join() {
    el.innerHTML = `<header class="pl-top"><div class="pl-in pl-top-in">
        <img src="${esc(opts.logo || 'assets/logo.png')}" alt="Caring Companions Consumer Directed Services" class="pl-logo" width="770" height="206">
        <span class="pl-top-call">Call <b>417-218-2888</b><small>Toll free 866-863-5151</small></span>
      </div></header><div class="cm-app">
      ${opts.onNavigate ? `<button class="cm-back" id="back">${ICON.back} Back</button>` : ''}
      <h1>Join our caregiver list</h1>
      <p class="cm-sub">Families who direct their own care through Missouri's CDS program are looking for caregivers like you. Tell us about yourself and our office will call you.</p>
      <form id="jf" class="cm-card" novalidate>
        <div class="cm-grid2">
          <div class="cm-field"><label for="jfn">First name</label><input id="jfn" required autocomplete="given-name"></div>
          <div class="cm-field"><label for="jln">Last name</label><input id="jln" required autocomplete="family-name"></div>
        </div>
        <div class="cm-grid2">
          <div class="cm-field"><label for="jph">Phone</label><input id="jph" type="tel" required autocomplete="tel"></div>
          <div class="cm-field"><label for="jem">Email</label><input id="jem" type="email" autocomplete="email"></div>
        </div>
        <div class="cm-grid2">
          <div class="cm-field"><label for="jci">Town</label><input id="jci" autocomplete="address-level2"></div>
          <div class="cm-field"><label for="jzi">ZIP</label><input id="jzi" inputmode="numeric" maxlength="5"></div>
        </div>
        <span class="cm-label">Counties you'd work in</span>
        <div class="cm-chips" id="jco">${COUNTIES.map(c => `<button type="button" class="cm-chip" data-v="${c}" aria-pressed="false">${c}</button>`).join('')}</div>
        <div class="cm-field"><label for="jex">Caregiving experience</label><select id="jex"><option value="">Choose</option><option>Less than 1 year</option><option>1 to 3 years</option><option>3 to 5 years</option><option>More than 5 years</option><option>Family caregiving only</option></select></div>
        <fieldset class="cm-card tint" style="border:0">
          <legend class="cm-label" style="padding:0">Missouri Family Care Safety Registry (FCSR)</legend>
          <p class="cm-small" style="margin:0">${esc(FCSR_EXPLAINER[0])}</p>
          <span style="font-weight:600">Are you already registered with the Missouri Family Care Safety Registry?</span>
          <label class="cm-check"><input type="radio" name="fcsr" value="yes"> Yes</label>
          <label class="cm-check"><input type="radio" name="fcsr" value="no"> No</label>
          <label class="cm-check"><input type="radio" name="fcsr" value="not_sure"> Not sure</label>
          <p class="cm-small" style="margin:0">Already registered? You don't pay again. If you're not registered, we'll send you the official steps. The one-time state fee is $16, or $16.57 online.</p>
        </fieldset>
        <div class="cm-field"><label for="jno">Anything else you'd like us to know?</label><textarea id="jno"></textarea></div>
        <button class="cm-btn block" type="submit">Join the list</button>
        <p class="cm-small">Joining doesn't list you in the directory. Our office reviews every caregiver first, and you approve your profile before any family sees it. Never send your Social Security number by email or text.</p>
      </form>
      <div class="cm-card tint" id="jthanks" hidden><h2>Thank you!</h2><p class="cm-sub">You're on our caregiver list. Our office will call you to talk about next steps.</p></div>
    </div>`;
    if ($('#back', el)) $('#back', el).onclick = () => opts.onNavigate('landing');
    $$('#jco .cm-chip', el).forEach(b => b.onclick = () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
    $('#jf', el).onsubmit = async e => {
      e.preventDefault();
      const fcsr = ($('input[name=fcsr]:checked', el) || {}).value;
      await act($('button[type=submit]', el), async () => {
        if (!$('#jfn', el).value.trim() || !$('#jln', el).value.trim() || !$('#jph', el).value.trim()) throw new Error('Please add your first name, last name and phone.');
        if (!fcsr) throw new Error('Please answer the FCSR question. "Not sure" is fine.');
        await joinCaregiverList({ first_name: $('#jfn', el).value.trim(), last_name: $('#jln', el).value.trim(), phone: $('#jph', el).value.trim(), email: $('#jem', el).value.trim(),
          city: $('#jci', el).value.trim(), zip: $('#jzi', el).value.trim(), counties: $$('#jco .cm-chip[aria-pressed="true"]', el).map(b => b.dataset.v),
          experience: $('#jex', el).value, applicant_notes: $('#jno', el).value, fcsr_registered_answer: fcsr });
      });
      $('#jf', el).hidden = true; $('#jthanks', el).hidden = false;
    };
  }
}
