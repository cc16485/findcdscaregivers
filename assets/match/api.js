// One way for every screen to talk to the server, in practice or live.
import { MODE, LIVE_FN, LIVE_KEY } from './mode.js';

let practicePromise = null;
export function practice() {
  if (!practicePromise) practicePromise = import('./practice-boot.js').then(m => m.boot());
  return practicePromise;
}

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};
export const familySessionKey = invite => 'cds-family-session:' + (invite || 'default');

export class ApiError extends Error { constructor(m, status) { super(m); this.status = status; } }

// ctx: { session, staffJwt }
export async function api(role, action, input = {}, ctx = {}) {
  if (MODE === 'practice') {
    const p = await practice();
    const i = { ...input };
    if (role === 'family') i.session = ctx.session;
    if (role === 'staff') i.staff = p.staffEmail;
    try { return await p.match.handle(role, action, i); }
    catch (e) { throw new ApiError(e.message || 'Something went wrong', e.status || 400); }
  }
  const headers = { 'Content-Type': 'application/json', apikey: LIVE_KEY };
  if (role === 'family' && ctx.session) headers['x-cds-session'] = ctx.session;
  if (role === 'staff') headers.Authorization = 'Bearer ' + ctx.staffJwt;
  let r;
  try { r = await fetch(LIVE_FN, { method: 'POST', headers, body: JSON.stringify({ role, action, input }) }); }
  catch { throw new ApiError('We couldn\'t reach our server. Check your connection, or call 417-218-2888.', 0); }
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(body.error || 'Something went wrong. Please call 417-218-2888.', r.status);
  return body;
}

// The caregiver sign-up form writes straight to the existing caregiver list,
// exactly as the live form does today (insert only, the public can't read it back).
export async function joinCaregiverList(row) {
  if (MODE === 'practice') {
    const p = await practice();
    await p.asAnon(`insert into attendant_pool (agency_id, first_name, last_name, phone, email, city, zip, counties, experience, applicant_notes, source, fcsr_registered_answer, background_ok)
      values ('caring-companions-cds',$1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,'findcdscaregivers.com',$10,true)`,
      [row.first_name, row.last_name, row.phone, row.email || null, row.city || null, row.zip || null, JSON.stringify(row.counties || []), row.experience || null, row.applicant_notes || null, row.fcsr_registered_answer]);
    return;
  }
  const r = await fetch('https://siivpekcaryeyttszwav.supabase.co/rest/v1/attendant_pool', { method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: LIVE_KEY, Authorization: 'Bearer ' + LIVE_KEY, Prefer: 'return=minimal' },
    body: JSON.stringify({ agency_id: 'caring-companions-cds', ...row, counties: row.counties || [], source: 'findcdscaregivers.com', background_ok: true }) });
  if (!r.ok) throw new ApiError('We couldn\'t save that. Please call 417-218-2888 and we\'ll add you by hand.', r.status);
}

export { store, MODE };
