// Quita una elección (si viene "key") o todas las elecciones de un regalo (por error o cambio de planes).
const { releaseGift } = require('../../lib/store');
const { send, body, isAdmin } = require('../../lib/util');

module.exports = async (req, res) => {
  if (!isAdmin(req)) return send(res, 401, { error: 'No autorizado' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  const id = parseInt(body(req).id, 10);
  if (!Number.isInteger(id)) return send(res, 400, { error: 'Regalo inválido' });
  const key = typeof body(req).key === 'string' ? body(req).key.slice(0, 80) : '';
  try {
    await releaseGift(id, key || undefined);
    send(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Error del servidor' });
  }
};
