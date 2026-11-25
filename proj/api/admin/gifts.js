// Panel de la dueña: ver quién eligió qué, agregar, editar y borrar regalos.
const store = require('../../lib/store');
const { ICONS, send, body, clean, cleanUrl, isAdmin } = require('../../lib/util');

function fields(b) {
  return {
    icon: ICONS.includes(b.icon) ? b.icon : 'gift',
    title: clean(b.title, 100),
    note: clean(b.note, 200) || null,
    url: cleanUrl(b.url),
  };
}

module.exports = async (req, res) => {
  if (!isAdmin(req)) return send(res, 401, { error: 'No autorizado' });
  try {
    const b = body(req);

    if (req.method === 'GET') return send(res, 200, { gifts: await store.listGifts() });

    if (req.method === 'POST') {
      const f = fields(b);
      if (!f.title) return send(res, 400, { error: 'Escribe el nombre del regalo' });
      return send(res, 200, { ok: true, id: await store.addGift(f) });
    }

    const id = parseInt(b.id, 10);
    if (!Number.isInteger(id)) return send(res, 400, { error: 'Regalo inválido' });

    if (req.method === 'PUT') {
      const f = fields(b);
      if (!f.title) return send(res, 400, { error: 'Escribe el nombre del regalo' });
      if (!(await store.updateGift(id, f))) return send(res, 404, { error: 'Ese regalo ya no existe' });
      return send(res, 200, { ok: true });
    }

    if (req.method === 'DELETE') {
      await store.deleteGift(id);
      return send(res, 200, { ok: true });
    }

    send(res, 405, { error: 'Método no permitido' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Error del servidor' });
  }
};
