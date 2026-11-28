const { send, body, checkPassword, makeSessionCookie, clearSessionCookie, isAdmin } = require('../../lib/util');

module.exports = async (req, res) => {
  if (req.method === 'GET') return send(res, 200, { admin: isAdmin(req) });
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!process.env.ADMIN_PASSWORD) return send(res, 500, { error: 'Falta ADMIN_PASSWORD en Vercel' });
  if (!checkPassword(body(req).password)) return send(res, 401, { error: 'Contraseña incorrecta' });
  res.setHeader('Set-Cookie', makeSessionCookie());
  send(res, 200, { ok: true });
};
