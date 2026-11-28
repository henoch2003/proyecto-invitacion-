// Almacén de regalos en Upstash Redis (gratis, no se duerme).
//   hash "gifts"  : id -> { id, icon, title, note, url }
//   hash "claims" : "<id>|<clave>" -> { by, at }   (quién eligió el regalo; varios invitados pueden elegir el mismo)
//                   (los registros antiguos usaban solo "<id>" como clave y se siguen leyendo)
//   "gifts:seq"   : contador de ids
// Vercel crea KV_REST_API_URL y KV_REST_API_TOKEN al conectar la base.
const { Redis } = require('@upstash/redis');

let client = null;

// Busca la URL y el token sin importar el prefijo que Vercel haya puesto
// (KV_, KB_KV_, UPSTASH_, STORAGE_, etc.). Ignora el token de solo lectura.
function findEnv(suffixes, exclude) {
  const names = Object.keys(process.env);
  for (const suf of suffixes) {
    const hit = names.find((n) => n.endsWith(suf) && !(exclude && n.includes(exclude)));
    if (hit && process.env[hit]) return process.env[hit];
  }
  return '';
}

function redis() {
  if (client) return client;
  const url = findEnv(['REST_API_URL', 'REDIS_REST_URL']);
  const token = findEnv(['REST_API_TOKEN', 'REDIS_REST_TOKEN'], 'READ_ONLY');
  if (!url || !token) throw new Error('Falta conectar la base de datos Upstash Redis');
  client = new Redis({ url, token });
  return client;
}

const parse = (v) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch (e) { return null; }
};

// Agrupa las elecciones por regalo: id -> [{ key, by, at }]
function groupClaims(claims) {
  const out = {};
  Object.entries(claims || {}).forEach(([key, raw]) => {
    const c = parse(raw);
    if (!c || !c.by) return;
    const id = String(key).split('|')[0];
    (out[id] = out[id] || []).push({ key: String(key), by: c.by, at: c.at || null });
  });
  Object.values(out).forEach((arr) => arr.sort((a, b) => String(a.at).localeCompare(String(b.at))));
  return out;
}

async function listGifts() {
  const r = redis();
  const [gifts, claims] = await Promise.all([r.hgetall('gifts'), r.hgetall('claims')]);
  const byGift = groupClaims(claims);
  return Object.values(gifts || {})
    .map(parse).filter(Boolean)
    .sort((a, b) => a.id - b.id)
    .map((g) => ({ ...g, claims: byGift[g.id] || [] }));
}

// Imagen del regalo:
//   - link externo (https://...) -> se guarda tal cual en el regalo
//   - foto subida -> se guarda aparte en el hash "gift_images" (id -> data URL)
//     y el regalo apunta a /api/image?id=ID
async function applyImage(r, id, prev, img) {
  if (!img || img.mode === 'keep' || !img.mode) return prev || null;
  if (img.mode === 'upload') {
    await r.hset('gift_images', { [id]: img.data });
    return '/api/image?id=' + id + '&v=' + Date.now();
  }
  await r.hdel('gift_images', id);
  return img.mode === 'url' ? img.url : null;
}

async function addGift(f, img) {
  const r = redis();
  const id = await r.incr('gifts:seq');
  const image = await applyImage(r, id, null, img);
  await r.hset('gifts', { [id]: { id, ...f, image } });
  return id;
}

// Agrega muchos regalos de una sola vez (importar lista). Reserva los ids con un solo INCRBY.
async function addGifts(list) {
  if (!list.length) return 0;
  const r = redis();
  const last = await r.incrby('gifts:seq', list.length);
  const first = last - list.length + 1;
  const obj = {};
  list.forEach((f, i) => { const id = first + i; obj[id] = { id, ...f, image: f.image || null }; });
  await r.hset('gifts', obj);
  return list.length;
}

// Borra toda la lista (regalos, elecciones y fotos subidas)
async function deleteAll() {
  await redis().del('gifts', 'claims', 'gift_images');
}

async function updateGift(id, f, img) {
  const r = redis();
  const prev = parse(await r.hget('gifts', id));
  if (!prev) return false;
  const image = await applyImage(r, id, prev.image, img);
  await r.hset('gifts', { [id]: { id, ...f, image } });
  return true;
}

async function deleteGift(id) {
  const r = redis();
  await r.hdel('gifts', id);
  await releaseGift(id);
  await r.hdel('gift_images', id);
}

async function getImage(id) {
  const v = await redis().hget('gift_images', id);
  return typeof v === 'string' ? v : null;
}

// Un regalo puede ser elegido por varios invitados: cada elección se guarda con su propia clave,
// así que nunca se bloquea ni se pisa con otra. Si la misma persona lo vuelve a elegir, no se duplica.
async function claimGift(id, name) {
  const r = redis();
  const g = parse(await r.hget('gifts', id));
  if (!g) return { status: 'missing' };
  const same = (await listGifts().then((l) => (l.find((x) => x.id === g.id) || {}).claims || []))
    .some((c) => c.by.toLowerCase() === name.toLowerCase());
  if (!same) {
    const key = id + '|' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await r.hset('claims', { [key]: { by: name, at: new Date().toISOString() } });
  }
  return { status: 'ok', title: g.title };
}

// Quita una elección concreta (key) o, sin key, todas las de ese regalo.
async function releaseGift(id, key) {
  const r = redis();
  if (key) return r.hdel('claims', String(key));
  const all = await r.hgetall('claims');
  const keys = Object.keys(all || {}).filter((k) => String(k).split('|')[0] === String(id));
  if (keys.length) await r.hdel('claims', ...keys);
}

module.exports = { listGifts, addGift, addGifts, deleteAll, updateGift, deleteGift, claimGift, releaseGift, getImage };
