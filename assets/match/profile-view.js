// The caregiver profile as families see it. One renderer, used by the family
// directory and by the caregiver's own "See what families see" preview, so the
// preview is exactly what families get.
import { esc, ICON } from './ui.js';
import { DAYS, DAY_LABEL, PARTS, PART_LABEL } from './shared/rules.js';

const CERT = { cpr: 'CPR', cna: 'CNA', first_aid: 'First aid' };
const PART_SHORT = { am: 'Morning', pm: 'Afternoon', eve: 'Evening', night: 'Overnight' };

export function weekGrid(av) {
  av = av || {};
  return `<div class="pv-week" role="table" aria-label="Weekly availability">
    <div class="pv-wrow head" role="row"><span role="columnheader"></span>${DAYS.map(d => `<span role="columnheader">${DAY_LABEL[d]}</span>`).join('')}</div>
    ${PARTS.filter(p => p !== 'night' || DAYS.some(d => (av[d] || []).includes('night'))).map(p => `<div class="pv-wrow" role="row"><span role="rowheader">${PART_SHORT[p]}</span>${DAYS.map(d => {
      const on = (av[d] || []).includes(p);
      return `<span role="cell" class="${on ? 'on' : ''}" aria-label="${DAY_LABEL[d]} ${PART_LABEL[p]}: ${on ? 'available' : 'not available'}">${on ? ICON.check : ''}</span>`;
    }).join('')}</div>`).join('')}
  </div>`;
}

// c: the family-facing profile object. opts.preview: caregiver's own preview.
export function profileHtml(c, opts = {}) {
  const complete = c.section === 'complete';
  const badge = complete ? `<span class="cm-pill ok">${ICON.shield} Screening complete</span>`
    : c.section === 'in_progress' ? `<span class="cm-pill prog">${ICON.clock} Screening in progress</span>` : `<span class="cm-pill mute">Not listed yet</span>`;
  const media = `
    <div class="pv-photo">${c.photo_url ? `<img src="${esc(c.photo_url)}" alt="Photo of ${esc(c.first_name)}">` : `<span class="pv-nophoto">${ICON.people}<span>Photo coming soon</span></span>`}</div>
    ${c.video_url ? `<div class="pv-vid-desk">${videoPlayer(c.video_url, c.first_name, c.photo_url)}</div>` : ''}`;
  return `<div class="pv-wrap"><article class="pv ${opts.preview ? 'is-preview' : ''}">
    <div class="pv-side">
      ${media}
      <div class="pv-cta-desk">${opts.cta || ''}</div>
    </div>
    <div class="pv-main">
      <div class="pv-head">
        <div class="cm-row between cm-wrap"><h1>${esc(c.first_name)}</h1>${badge}</div>
        <p class="pv-meta">${ICON.pin} ${esc(c.town || 'Town not set')}${(c.counties || []).length ? ' · works in ' + esc(c.counties.join(', ')) + (c.counties.length === 1 ? ' County' : ' counties') : ''}</p>
        <p class="pv-meta">${ICON.clock} Availability confirmed ${esc(c.confirmed_text || 'not yet')}${c.accepting === false ? '' : ' · <b class="pv-accept">Accepting introductions</b>'}</p>
      </div>
      ${c.section === 'in_progress' ? `<div class="cm-card warn"><p class="cm-sub"><b>Screening in progress.</b> ${esc(c.first_name)} is not yet cleared to begin CDS services. You can meet, but paid care can't start until the state screening is complete.</p></div>` : ''}
      ${c.about_me ? `<div class="pv-words"><span class="pv-label">In ${esc(c.first_name)}'s own words</span><p class="pv-quote">${esc(c.about_me)}</p></div>` : ''}
      ${c.fit && c.fit.total ? `<div class="pv-fit"><div class="cm-row between cm-wrap"><h2>How ${esc(c.first_name)} fits your needs</h2><b class="pv-fit-n">${c.fit.matched} of ${c.fit.total}</b></div>
        ${c.fit.outside_county ? `<p class="cm-small" style="margin:0">${esc(c.first_name)} doesn't list ${esc(c.fit.outside_county)} County. Worth asking.</p>` : ''}
        <ul>${c.fit.reasons.map(r => `<li class="ok">${ICON.check} ${esc(r)}</li>`).join('')}${(c.fit.gaps || []).map(g => `<li class="ask">Worth asking: ${esc(g.charAt(0).toLowerCase() + g.slice(1))}</li>`).join('')}</ul></div>` : ''}
      ${c.video_url ? `<div class="pv-vid-mob">${videoPlayer(c.video_url, c.first_name, c.photo_url)}</div>` : ''}
      <div class="pv-block"><h2>When ${esc(c.first_name)} is available</h2>
        ${weekGrid(c.availability)}
        <p class="cm-small">${c.hours_min ? 'Looking for ' + esc(c.hours_min + ' to ' + c.hours_max) + ' hours a week. ' : ''}Times are general. You'll work out an exact schedule together.</p></div>
      ${(c.help_types || []).length ? `<div class="pv-block"><h2>Comfortable helping with</h2><div class="pv-chips">${c.help_types.map(h => `<span>${ICON.check} ${esc(h)}</span>`).join('')}</div></div>` : ''}
      <div class="pv-block pv-facts">
        ${c.experience ? `<div><b>Experience</b><span>${esc(c.experience)}</span></div>` : ''}
        <div><b>Getting around</b><span>${c.has_car ? 'Has a car' + (c.travel_miles ? ', travels up to ' + c.travel_miles + ' miles' : '') : 'Doesn\'t drive'}</span></div>
        ${(c.certs_verified || []).length ? `<div><b>Training</b><span>${esc(c.certs_verified.map(x => CERT[x] || x).join(', '))} <em class="pv-ver">verified by our office</em></span></div>` : ''}
        ${(c.certs_pending || []).length ? `<div><b>Training</b><span>${esc(c.certs_pending.map(x => CERT[x] || x).join(', '))} <em class="pv-pend">shows once our office sees the card</em></span></div>` : ''}
        ${(c.languages || []).length ? `<div><b>Languages</b><span>${esc(c.languages.join(', '))}</span></div>` : ''}
        ${c.interests ? `<div><b>Enjoys</b><span>${esc(c.interests)}</span></div>` : ''}
      </div>
      ${c.enjoy_most ? `<div class="pv-block"><h2>What I enjoy most about caregiving</h2><p>${esc(c.enjoy_most)}</p></div>` : ''}
      ${c.setting_pref ? `<div class="pv-block"><h2>Where I do my best work</h2><p>${esc(c.setting_pref)}</p></div>` : ''}
      ${c.current_cds_hours ? `<p class="cm-small">${esc(c.first_name)} already works for another CDS consumer and is looking for more hours.</p>` : ''}
      <div class="pv-cta-mob">${opts.cta || ''}</div>
      <p class="cm-small">Last name, phone and address are shared only after you both agree to meet.</p>
    </div>
  </article></div>`;
}

function videoPlayer(url, name, poster) {
  if (url.startsWith('practice-video:')) {
    return `<div class="pv-video practice" role="img" aria-label="Practice stand-in for ${esc(name)}'s intro video">
      ${poster ? `<img src="${esc(poster)}" alt="">` : ''}
      <span class="pv-play">${ICON.video} Meet ${esc(name)} · 0:45</span>
      <span class="pv-vnote">Practice: the caregiver's own 30 to 60 second video plays here</span></div>`;
  }
  return `<video class="pv-video" src="${esc(url)}" controls playsinline preload="metadata" ${poster ? `poster="${esc(poster)}"` : ''}></video>`;
}
