const crypto = require('crypto');

const ICONS = ['dress', 'shoe', 'perfume', 'makeup', 'gem', 'gift'];
const COOKIE = 'admin_session';
const MAX_AGE = 12 * 60 * 60; // 12 horas

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || '';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof pw !== 'string') return false;
  return safeEqual(pw, real);
}

function makeSessionCookie() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const token = exp + '.' + sign(exp);
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}

function clearSessionCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function isAdmin(req) {
  if (!secret()) return false;
  const raw = req.headers.cookie || '';
  const m = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(COOKIE + '='));
  if (!m) return false;
  const token = m.slice(COOKIE.length + 1);
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, sign(exp));
}

function body(req) {
  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { b = {}; }
  }
  return b && typeof b === 'object' ? b : {};
}

function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanUrl(v) {
  const s = clean(v, 500);
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : null;
}

module.exports = {
  ICONS, send, body, clean, cleanUrl, isAdmin, checkPassword,
  makeSessionCookie, clearSessionCookie,
};
