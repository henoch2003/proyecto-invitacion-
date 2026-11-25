// Libera un regalo para que otro invitado pueda elegirlo (por error o cambio de planes).
const { releaseGift } = require('../../lib/store');
const { send, body, isAdmin } = require('../../lib/util');

module.exports = async (req, res) => {
  if (!isAdmin(req)) return send(res, 401, { error: 'No autorizado' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  const id = parseInt(body(req).id, 10);
  if (!Number.isInteger(id)) return send(res, 400, { error: 'Regalo inválido' });
  try {
    await releaseGift(id);
    send(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Error del servidor' });
  }
};
