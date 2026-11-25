// El invitado elige un regalo. HSETNX es atómico: si dos personas lo eligen
// a la vez, solo una gana y la otra recibe 409.
const { claimGift } = require('../lib/store');
const { send, body, clean } = require('../lib/util');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  const b = body(req);
  const id = parseInt(b.id, 10);
  const name = clean(b.name, 80);
  if (!Number.isInteger(id)) return send(res, 400, { error: 'Regalo inválido' });
  if (name.length < 2) return send(res, 400, { error: 'Escribe tu nombre y apellido' });

  try {
    const r = await claimGift(id, name);
    if (r.status === 'missing') return send(res, 404, { error: 'Ese regalo ya no está en la lista' });
    if (r.status === 'taken') return send(res, 409, { error: 'Ese regalo ya fue elegido por otra persona' });
    send(res, 200, { ok: true, title: r.title });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'No se pudo guardar. Intenta de nuevo' });
  }
};
