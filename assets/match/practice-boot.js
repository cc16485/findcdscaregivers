// Practice mode only. Loads an in-browser copy of Postgres, runs the real
// Phase 1 SQL and server logic, and fills it with fictional people.
// Data stays in this browser (IndexedDB). Nothing leaves it.
const BASE = new URL('../../', import.meta.url);   // site root
const at = p => new URL(p, BASE).href;
const DB_NAME = 'idb://cds-match-practice-v9';

let booted = null;
export function boot() { return booted || (booted = start()); }

async function start() {
  const { PGlite } = await import(at('practice/pglite/index.js'));
  const { createMatch } = await import(at('practice/server/handlers.js'));
  const { practiceDeps } = await import(at('practice/server/deps.js'));
  // The engine's data file ships as base64 text because the preview host only serves web file types.
  const b64 = await (await fetch(at('practice/pglite/postgres-data.b64.txt'))).text();
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const fsBundle = new Blob([bytes]);
  let pg, persistent = true;
  try { pg = await PGlite.create(DB_NAME, { fsBundle }); }
  catch { pg = await PGlite.create({ fsBundle }); persistent = false; }   // private window: practice data lasts until reload
  const db = { query: (s, p) => pg.query(s, p) };
  const ready = await pg.query(`select to_regclass('public.practice_meta') as t`);
  let meta;
  if (!ready.rows[0].t) {
    const strip = s => s.replace(/notify pgrst[^;]*;/g, '');
    for (const f of ['practice/server/base.sql', 'practice/server/cds_public_insert_lock.sql', 'practice/server/caregiver_match_phase1.sql']) {
      await pg.exec(strip(await (await fetch(at(f))).text()));
    }
    await pg.exec('create table practice_meta (key text primary key, value jsonb)');
  }
  const deps = practiceDeps(db, { familyBase: at('directory/'), caregiverBase: at('caregiver/') });
  const match = createMatch(deps);
  const m = await pg.query(`select value from practice_meta where key='seed'`);
  if (m.rows[0]) meta = m.rows[0].value;
  else {
    const { seed } = await import(at('practice/server/seed.js'));
    const photoFor = async key => {
      try {
        const r = await fetch(at('practice/photos/' + key + '.jpg'));
        if (!r.ok) return null;
        const b = await r.blob();
        const data = await new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(f.result); f.onerror = rej; f.readAsDataURL(b); });
        return { mime: 'image/jpeg', data };
      } catch { return null; }
    };
    meta = await seed(match, db, { photoFor });
    await pg.query(`insert into practice_meta (key, value) values ('seed', $1::jsonb)`, [JSON.stringify(meta)]);
  }
  return {
    pg, db, match, meta, persistent,
    staffEmail: 'linda@caringcds.com',
    async asAnon(sql, params) {
      await pg.exec('set role anon');
      try { return await pg.query(sql, params); } finally { await pg.exec('reset role'); }
    },
    async reset() {
      await pg.close();
      await new Promise(res => { const r = indexedDB.deleteDatabase('/pglite/cds-match-practice-v9'); r.onsuccess = r.onerror = r.onblocked = () => res(); });
    },
  };
}
