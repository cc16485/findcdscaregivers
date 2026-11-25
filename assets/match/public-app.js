// Public screens P1 to P3: landing page, request access, join our caregiver list.
// Shows counts of fully screened caregivers by county. Never a person.
import { api, joinCaregiverList, MODE } from './api.js';
import { IHS_SECTION_APPROVED } from './mode.js';
import { esc, $, $$, act, ICON } from './ui.js';
import { COUNTIES, PROGRAMS, RELATIONSHIPS } from './shared/rules.js';
import { PROVIDER_CHOICE, FCSR_EXPLAINER } from './shared/messages.js';

// Top-of-page Call and Text buttons (her ask 11-25: "easy click to call and click to text").
// 417-218-2888 is the CDS line and takes texts.
const PH_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
const TX_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const TOP_CALL = `<div class="pl-top-call"><div class="pl-top-btns"><a class="pl-tc" href="tel:+14172182888" aria-label="Call 417-218-2888">${PH_ICON}<span>Call</span></a><a class="pl-tc" href="sms:+14172182888" aria-label="Text 417-218-2888">${TX_ICON}<span>Text</span></a></div><small><a href="tel:+14172182888">417-218-2888</a> · toll free <a href="tel:+18668635151">866-863-5151</a></small></div>`;

export function mountPublic(el, opts = {}) {
  el.classList.add('cm');
  const view = opts.view || 'landing';
  ({ landing, join })[view]();

  async function landing() {
    el.innerHTML = `<div class="pl">
      <header class="pl-top"><div class="pl-in pl-top-in">
        <img src="${esc(opts.logo || 'assets/logo.png')}" alt="Caring Companions Consumer Directed Services" class="pl-logo" width="770" height="206">
        ${TOP_CALL}
      </div></header>
      <section class="pl-hero"><div class="pl-in pl-hero-grid">
        <div class="pl-hero-text">
          <p class="pl-eyebrow">Find CDS Caregivers · a service of Caring Companions CDS</p>
          <h1>Need care at home, but no one to hire? We'll help you find a caregiver.</h1>
          <p class="pl-lede">Missouri's Consumer Directed Services (CDS) program lets you hire your own caregiver for care at home, paid through Medicaid. Many families never get started because they don't have someone in mind. We connect families in 27 Southwest Missouri counties with caregivers who want the work.</p>
          <div class="pl-cta">
            <a class="cm-btn honey pl-big" href="#req" id="cta">Help me find a caregiver</a>
            <a class="cm-btn pl-big pl-ghost-light" href="caregivers/">I want caregiving work</a>
          </div>
          <ul class="pl-pills"><li>${ICON.check} No cost to ask</li><li>${ICON.check} No obligation</li><li>${ICON.check} You choose who to hire</li></ul>
        </div>
        <figure class="pl-hero-photo"><img src="assets/scenes/kitchen.jpg" alt="A caregiver and an older woman laughing together over coffee at a kitchen table" width="1200" height="800"></figure>
      </div></section>

      <section class="pl-sec"><div class="pl-in">
        <div class="pl-head"><h2>Two ways to use Find CDS Caregivers</h2></div>
        <div class="pl-doors">
          <div class="cm-card pl-door">
            <h3>I need a caregiver</h3>
            <ul class="pl-ticks">
              <li>${ICON.check} For you or someone you love, at home</li>
              <li>${ICON.check} We help you meet caregivers near you</li>
              <li>${ICON.check} You choose who to hire, and you can say no as often as you need</li>
              <li>${ICON.check} Already have a caregiver? Find a backup near you for days they're sick or can't work</li>
            </ul>
            <a class="cm-btn honey block" href="#req" data-req>Help me find a caregiver</a>
          </div>
          <div class="cm-card pl-door">
            <h3>I want caregiving work</h3>
            <ul class="pl-ticks">
              <li>${ICON.check} $15 to $16 an hour, paid every Thursday</li>
              <li>${ICON.check} Full time, part time or fill-in, close to home</li>
              <li>${ICON.check} Know someone who needs help at home? We help them sign up for CDS, and they can hire you</li>
            </ul>
            <a class="cm-btn block" href="caregivers/">Join our caregiver list</a>
          </div>
        </div>
      </div></section>

      <section class="pl-sec pl-tint"><div class="pl-in">
        <div class="pl-head"><h2>What is CDS?</h2>
          <p class="cm-sub">Consumer Directed Services is a Missouri Medicaid program for people who need help at home with everyday things like bathing, meals and getting around.</p></div>
        <ul class="pl-facts">
          <li><b>You choose your caregiver.</b><span>You hire the person you want: someone we help you meet, or a friend or relative. (A husband or wife, or a legal guardian, can't be the paid caregiver.)</span></li>
          <li><b>Medicaid pays for the hours.</b><span>The state decides how many hours you can have. You don't pay the caregiver out of pocket.</span></li>
          <li><b>We handle the paperwork.</b><span>Caring Companions CDS runs payroll and taxes for your caregiver and helps with the program forms.</span></li>
        </ul>
        <div class="cm-card pl-tasks">
          <h3>What a CDS caregiver helps with</h3>
          <p class="cm-sub">Hands-on help at home, from the state's list of CDS personal care tasks:</p>
          <ul class="pl-tasklist">
            <li>${ICON.check} Bathing and showering</li>
            <li>${ICON.check} Dressing and grooming: hair, teeth, shaving and nails</li>
            <li>${ICON.check} Using the bathroom and incontinence care</li>
            <li>${ICON.check} Cooking meals, help eating, and cleanup</li>
            <li>${ICON.check} Getting around the house, in and out of bed or a chair</li>
            <li>${ICON.check} Help taking their own medicine, like opening bottles</li>
            <li>${ICON.check} Making the bed, changing sheets and their laundry</li>
            <li>${ICON.check} Shopping for what they need</li>
            <li>${ICON.check} Rides for essential shopping, errands, school or work</li>
          </ul>
          <p class="cm-small"><b>Not part of CDS:</b> standing by or reminders only, waiting at appointments, nursing care, and housework for the rest of the household. The state decides which of these tasks and how many hours each person gets.</p>
        </div>
      </div></section>

      <section class="pl-sec"><div class="pl-in">
        <div class="pl-head"><h2>How we help families find a caregiver</h2></div>
        <ol class="pl-steps">
          <li><span class="n">1</span><b>Tell us what you need.</b><span>A short call about the help you need and how CDS works, including what you're responsible for as the employer. With your permission, we also check your Missouri Medicaid coverage.</span></li>
          <li><span class="n">2</span><b>Meet caregivers near you.</b><span>See their profiles and, for many, a short intro video. Meet by live video or in person. Meeting doesn't commit you or the caregiver.</span></li>
          <li><span class="n">3</span><b>Choose who you'd like to hire.</b><span>You're the employer, so the choice is yours. We help with the paperwork to get started.</span></li>
        </ol>
        <div class="pl-scenes">
          <figure><img src="assets/scenes/porch.jpg" alt="A young caregiver steadying an older man with a cane on his porch steps" width="1200" height="800" loading="lazy"><figcaption>A steady arm on the porch steps</figcaption></figure>
          <figure><img src="assets/scenes/album.jpg" alt="A caregiver and an older woman in a wheelchair looking through a photo album" width="1200" height="800" loading="lazy"><figcaption>Help at home with the everyday things</figcaption></figure>
        </div>
        <div class="cm-card pl-countcard" id="countcard" hidden>
          <h3>Caregivers ready to meet families now</h3>
          <div class="cm-counts" id="counts"></div>
          <p class="cm-small">Counted live: caregivers whose state screening is complete, who are accepting new families, and who confirmed their availability in the last 45 days.</p>
        </div>
      </div></section>

      <section class="pl-sec pl-tint" id="req"><div class="pl-in pl-formwrap">
        <div class="cm-card pl-form">
          <div id="step1">
            <h2>Help me find a caregiver</h2>
            <p class="cm-sub">Three quick questions. We'll call you, answer your questions, and with your permission check your Medicaid coverage. Then we help you meet caregivers near you.</p>
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
              <button class="cm-btn block pl-big" type="submit">Call me about a caregiver</button>
              <p class="cm-small">No cost and no obligation. You don't have to switch programs or choose us to ask.</p>
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
          <div id="step3" hidden class="cm-stack"><h2>You're all set</h2><p class="cm-sub">We'll call you soon to talk about CDS and, with your permission, check your Medicaid coverage. Asking doesn't commit you to anything. Questions before then? Call 417-218-2888 (toll free 866-863-5151), Monday to Friday.</p></div>
        </div>
      </div></section>

      <section class="pl-sec pl-cg" id="work"><div class="pl-in pl-two">
        <div>
          <h2>Get paid to care for people near you</h2>
          <p class="cm-sub">Families across Southwest Missouri are looking for caregivers. With CDS, the family hires you directly, and Caring Companions CDS handles your pay.</p>
          <ul class="pl-ticks">
            <li>${ICON.check} $15 to $16 an hour, paid every Thursday by direct deposit or pay card</li>
            <li>${ICON.check} Full time, part time, or a few fill-in shifts</li>
            <li>${ICON.check} Families also need backup caregivers for sick days, so even a few shifts a month helps</li>
            <li>${ICON.check} You say yes or no to every family</li>
            <li>${ICON.check} No experience? Many great caregivers started with their own family</li>
            <li>${ICON.check} Know someone who needs help at home, like a parent, neighbor, or someone from church or work? Many people qualify for CDS and don't know it. We help them sign up, and they can hire you</li>
          </ul>
          <a class="cm-btn honey pl-big" href="caregivers/">Join our caregiver list</a>
          <p class="cm-small" style="margin-top:10px">Takes about a minute. Missouri requires every CDS caregiver to register with the Family Care Safety Registry (one-time $16 state fee, $16.57 online, none if you're already registered). We walk you through it.</p>
        </div>
        <div class="cm-card flat pl-choose">
          <h3>You choose. You hire. We help.</h3>
          <p class="cm-sub">With CDS, the person getting care (or their family) is the employer: they choose, hire, train and supervise their caregiver. Caring Companions CDS helps families meet caregivers and handles payroll and program paperwork. We don't assign caregivers or guarantee a match.</p>
          <p class="cm-sub">Find CDS Caregivers is a service of Caring Companions CDS. You're welcome to ask whether or not you choose us as your CDS agency.</p>
          <p class="cm-small"><b>Counties we serve:</b> ${COUNTIES.join(', ')}.</p>
        </div>
      </div></section>

      <footer class="pl-foot"><div class="pl-in"><p>${esc(PROVIDER_CHOICE)}</p></div></footer>
    </div>`;
    api('public', 'counts').then(r => {
      const rows = Object.entries(r.counts || {}).sort((a, b) => b[1] - a[1]);
      if (!rows.length) return;
      $('#counts', el).innerHTML = rows.map(([c, n]) => `<div><span>${esc(c)} County</span><b>${n}</b></div>`).join('');
      $('#countcard', el).hidden = false;
    }).catch(() => {});
    const toReq = e => { e.preventDefault(); $('#req', el).scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#fn', el).focus({ preventScroll: true }), 500); };
    $('#cta', el).onclick = toReq;
    $$('[data-req]', el).forEach(a => a.onclick = toReq);
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

  // P3: Join our caregiver list. Wording approved by Samantha 2026-10-16.
  // Saves through the server (Hub to-do + office email). If the server can't be
  // reached, it falls back to saving straight to the list so no one is lost;
  // the database still makes the Hub to-do.
  function join() {
    const params = new URLSearchParams(location.search);
    const invite = (params.get('i') || '').slice(0, 80);
    const radios = (name, items) => `<div class="cm-chips" role="radiogroup">${items.map(([v, l]) => `<label class="cm-check"><input type="radio" name="${name}" value="${esc(v)}"> ${esc(l)}</label>`).join('')}</div>`;
    const sel = (id, opts) => `<select id="${id}"><option value="">Choose one</option>${opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>`;
    const chips = (id, items) => `<div class="cm-chips" id="${id}">${items.map(c => `<button type="button" class="cm-chip" data-v="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>`;
    el.innerHTML = `<header class="pl-top"><div class="pl-in pl-top-in">
        <img src="${esc(opts.logo || 'assets/logo.png')}" alt="Caring Companions Consumer Directed Services" class="pl-logo" width="770" height="206">
        ${TOP_CALL}
      </div></header><div class="cm-app">
      ${opts.onNavigate ? `<button class="cm-back" id="back">${ICON.back} Back</button>` : ''}
      <div id="jtop">
        <h1 id="jh1">Join our caregiver list</h1>
        <p class="cm-sub" id="jwelcome" style="margin-bottom:10px;font-weight:600" hidden></p>
        <p class="cm-sub" id="jintro">Caring Companions has a new program: Missouri's Consumer Directed Services (CDS) program. In CDS, Medicaid pays for care at home, and the family chooses their own caregiver. We're building a directory of caregivers so families near you can find you.</p>
        <p class="cm-sub" style="margin-top:10px">It takes about a minute. Then you'll build your profile, and you can stop and come back any time. It doesn't commit you to anything, and you can say no to any family.</p>
      </div>
      <div class="cm-card tint" id="jpay"><div><strong style="font-size:1.5rem;color:var(--navy)">$15 to $16 per hour</strong></div><p class="cm-small" style="margin:0">Paid weekly, every Thursday, by direct deposit or pay card.</p></div>
      <div class="cm-card flat" id="jhow"><h2 style="margin:0">How the caregiver directory works</h2>
        <ol style="margin:0;padding-left:1.3em;display:grid;gap:6px">
          <li>You make a short profile: a photo, a few words about you, and the days you can work.</li>
          <li>Families near you look through the directory and find you, whether they need a main caregiver or a backup for days theirs is sick or can't work.</li>
          <li>When a family would like to meet you, they call or text you directly to set up an interview, if you choose to share your number. Or they ask us and we text you.</li>
          <li>If it's a fit, the family hires you. The family is your employer, and Caring Companions CDS handles payroll, taxes and the paperwork.</li>
        </ol>
        <p class="cm-small" style="margin:0">Your address and last name stay private. Your phone and email are shown only to signed-in families, and only if you say yes. <a href="/" target="_blank" rel="noopener">See the directory families use</a></p>
        <details class="pl-jobdetails"><summary>What the job involves</summary>
          <ul class="pl-tasklist">
            <li>${ICON.check} Bathing and showering</li>
            <li>${ICON.check} Dressing and grooming: hair, teeth, shaving and nails</li>
            <li>${ICON.check} Using the bathroom and incontinence care</li>
            <li>${ICON.check} Cooking meals, help eating, and cleanup</li>
            <li>${ICON.check} Getting around the house, in and out of bed or a chair</li>
            <li>${ICON.check} Help taking their own medicine, like opening bottles</li>
            <li>${ICON.check} Making the bed, changing sheets and their laundry</li>
            <li>${ICON.check} Shopping for what they need</li>
            <li>${ICON.check} Rides for essential shopping, errands, school or work</li>
          </ul>
          <p class="cm-small" style="margin:0">Hands-on help only. CDS doesn't pay for standing by, reminders only, waiting at appointments, or nursing care.</p>
        </details></div>
      <div class="cm-card tint" id="jknow"><h2 style="margin:0">Know someone who needs help at home?</h2>
        <p style="margin:0">Many people already know someone who qualifies for CDS and doesn't know it: a parent or grandparent, a neighbor, or someone from church, work or the community. If they have Missouri Medicaid and need help with things like bathing, dressing or meals, we can help them sign up for CDS. Then they can hire you, and you have someone to work for.</p>
        <p class="cm-small" style="margin:0">Tell us about them below, or call 417-218-2888 and we'll take it from there. It's the fastest way to start working.</p>
      </div>
      <form id="jf" class="cm-card" novalidate>
        <h2>About you</h2>
        <div class="cm-grid2">
          <div class="cm-field"><label for="jfn">First name</label><input id="jfn" required autocomplete="given-name"></div>
          <div class="cm-field"><label for="jln">Last name</label><input id="jln" required autocomplete="family-name"></div>
        </div>
        <div id="jphKnown" class="cm-card flat" style="margin:0" hidden><p style="margin:0">We'll text your profile link to the number we have for you, <b id="jphHint"></b>. <button type="button" class="cm-link" id="jphChange">Use a different number</button></p></div>
        <div class="cm-grid2" id="jphRow">
          <div class="cm-field"><label for="jph">Mobile phone</label><input id="jph" type="tel" required autocomplete="tel" inputmode="tel"></div>
          <div class="cm-field"><label for="jem">Email <span class="cm-muted">(optional)</span></label><input id="jem" type="email" autocomplete="email"></div>
        </div>
        <div class="cm-field"><label for="jci">Town you live in</label><input id="jci" autocomplete="address-level2"></div>

        <h2>Where you can work</h2>
        <p class="cm-small" style="margin:0">Tap every county you would work in.</p>
        ${chips('jco', COUNTIES)}

        <h2>Do you know someone who needs help at home?</h2>
        <p class="cm-small" style="margin:0">Family, a neighbor, or someone from church or work. If they could use help at home, we can check if they qualify for CDS and help them sign up. That's usually the fastest way to start working.</p>
        ${radios('jhas', [['Yes', 'Yes, I know someone'], ['No', 'No, I am looking for work'], ['Not sure', 'Not sure yet']])}
        <div id="jhasMore" hidden><div style="display:grid;gap:12px">
          <div class="cm-field"><label for="jcn">Their first name <span class="cm-muted">(optional)</span></label><input id="jcn"></div>
          <div class="cm-grid2">
            <div class="cm-field"><label for="jcr">They are your</label>${sel('jcr', ['Parent', 'Grandparent', 'Adult child', 'Brother or sister', 'Other relative', 'Friend', 'Neighbor', 'Someone from church or community', 'Coworker', 'No relation'])}</div>
            <div class="cm-field"><label for="jcm">Do they have Missouri Medicaid?</label>${sel('jcm', ['Yes, active Medicaid', 'Not sure', 'No'])}</div>
          </div>
          <p class="cm-small" style="margin:0">You cannot be paid to care for your husband or wife, or for someone whose legal guardian you are. That is a state rule. Everyone else is fine.</p>
        </div></div>

        <label class="cm-check" id="jbgw" style="margin-top:6px"><input type="checkbox" id="jbg"> <span>I understand Missouri requires every CDS caregiver to register with the Family Care Safety Registry (FCSR) and pass the state's screening, and I'm willing to do it. If I'm not registered yet, the one-time state fee is $16 ($16.57 online). If I already am, I don't pay again.</span></label>
        <input id="jweb" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">

        <p class="cm-small" style="margin:0">Next you'll add a photo, your days and times, and your experience to your profile. Families see your first name, photo, town, availability and your own words. They see your phone and email only if you choose to share them, and never your last name or address. Please don't put your Social Security number here.</p>
        <p class="cm-small" id="jerr" role="alert" style="margin:0;color:var(--bad);font-weight:600" hidden></p>
        <button class="cm-btn honey block" type="submit">Join and build my profile</button>
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
          <li>After we review your profile, invited families near you can see it and reach out to set up an interview. You decide if it's a fit.</li>
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
    // A former caregiver's personal link: fill what we know, keep the phone private.
    let usePhoneOnFile = false;
    if (invite && MODE === 'live') {
      api('public', 'inviteLookup', { invite }).then(v => {
        if (!v || !v.ok) return;
        if (v.first_name) $('#jfn', el).value = v.first_name;
        if (v.last_name) $('#jln', el).value = v.last_name;
        if (v.email) $('#jem', el).value = v.email;
        if (v.city) $('#jci', el).value = v.city;
        if (v.first_name) {
          // People who applied but were never hired get a greeting that fits them (2026-11-25).
          $('#jh1', el).textContent = (v.never_hired ? 'Hi, ' : 'Welcome back, ') + v.first_name;
          $('#jwelcome', el).textContent = v.never_hired
            ? 'Thanks for your interest in Caring Companions. We\'ve already filled in what we have for you.'
            : 'Thank you for the care you gave with Caring Companions. We\'ve already filled in what we have for you.';
          $('#jwelcome', el).hidden = false;
        }
        if (v.phone_hint) {
          usePhoneOnFile = true;
          $('#jphHint', el).textContent = v.phone_hint;
          $('#jphKnown', el).hidden = false;
          $('#jph', el).closest('.cm-field').hidden = true;
        }
      }).catch(() => {});
      $('#jphChange', el).onclick = () => { usePhoneOnFile = false; $('#jphKnown', el).hidden = true; $('#jph', el).closest('.cm-field').hidden = false; $('#jph', el).focus(); };
    }
    const picked = id => $$(`#${id} .cm-chip[aria-pressed="true"]`, el).map(b => b.dataset.v);
    const radio = n => ($(`input[name=${n}]:checked`, el) || {}).value || null;
    $('#jf', el).onsubmit = async e => {
      e.preventDefault();
      const err = $('#jerr', el);
      const problems = [];
      if (!$('#jfn', el).value.trim()) problems.push('your first name');
      if (!$('#jln', el).value.trim()) problems.push('your last name');
      if (!usePhoneOnFile && $('#jph', el).value.replace(/\D/g, '').length !== 10) problems.push('a 10-digit phone number');
      if (!picked('jco').length) problems.push('at least one county');
      if (!radio('jhas')) problems.push('whether you know someone who needs help at home');
      if (!$('#jbg', el).checked) problems.push('the state screening checkbox');
      if (problems.length) {
        err.textContent = 'Please add ' + problems.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.';
        err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      err.hidden = true;
      const has = radio('jhas');
      const input = {
        first_name: $('#jfn', el).value.trim(), last_name: $('#jln', el).value.trim(), phone: usePhoneOnFile ? '' : $('#jph', el).value.trim(), email: $('#jem', el).value.trim(),
        city: $('#jci', el).value.trim(), counties: picked('jco'), has_potential_consumer: has,
        consumer_name: has === 'Yes' ? $('#jcn', el).value.trim() : '', consumer_relationship: has === 'Yes' ? $('#jcr', el).value : '', consumer_has_medicaid: has === 'Yes' ? $('#jcm', el).value : '',
        background_ok: true, website: $('#jweb', el).value,
        ...(invite ? { invite } : {}),
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
            if (!input.phone) throw ex;
            await joinCaregiverList({
              first_name: input.first_name, last_name: input.last_name, phone: input.phone, email: input.email || null, city: input.city || null,
              counties: input.counties, has_potential_consumer: has, knows_consumer: input.consumer_name || null,
              consumer_relationship: input.consumer_relationship || null, consumer_has_medicaid: input.consumer_has_medicaid || null,
              how_heard: invite ? 'Former Caring Companions caregiver (personal link)' : null, worked_here_before: invite ? true : null,
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
