// Almacén de regalos en Upstash Redis (gratis, no se duerme).
//   hash "gifts"  : id -> { id, icon, title, note, url }
//   hash "claims" : id -> { by, at }      (quién eligió el regalo)
//   "gifts:seq"   : contador de ids
// Vercel crea KV_REST_API_URL y KV_REST_API_TOKEN al conectar la base.
const { Redis } = require('@upstash/redis');

let client = null;
function redis() {
  if (client) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Falta conectar la base de datos Upstash Redis');
  client = new Redis({ url, token });
  return client;
}

const parse = (v) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch (e) { return null; }
};

async function listGifts() {
  const r = redis();
  const [gifts, claims] = await Promise.all([r.hgetall('gifts'), r.hgetall('claims')]);
  return Object.values(gifts || {})
    .map(parse).filter(Boolean)
    .sort((a, b) => a.id - b.id)
    .map((g) => {
      const c = parse((claims || {})[g.id]);
      return { ...g, claimed_by: c ? c.by : null, claimed_at: c ? c.at : null };
    });
}

async function addGift(f) {
  const r = redis();
  const id = await r.incr('gifts:seq');
  await r.hset('gifts', { [id]: { id, ...f } });
  return id;
}

async function updateGift(id, f) {
  const r = redis();
  if (!(await r.hget('gifts', id))) return false;
  await r.hset('gifts', { [id]: { id, ...f } });
  return true;
}

async function deleteGift(id) {
  const r = redis();
  await r.hdel('gifts', id);
  await r.hdel('claims', id);
}

// HSETNX es atómico: solo uno gana si dos personas eligen a la vez.
async function claimGift(id, name) {
  const r = redis();
  const g = parse(await r.hget('gifts', id));
  if (!g) return { status: 'missing' };
  const won = await r.hsetnx('claims', id, { by: name, at: new Date().toISOString() });
  return won ? { status: 'ok', title: g.title } : { status: 'taken' };
}

async function releaseGift(id) {
  await redis().hdel('claims', id);
}

module.exports = { listGifts, addGift, updateGift, deleteGift, claimGift, releaseGift };
