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

// Imagen: 'keep' (no tocar), 'url' (link externo), 'upload' (foto subida), 'remove' (quitar)
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
function imageOp(b) {
  const mode = b.image_mode;
  if (mode === 'url') {
    const url = cleanUrl(b.image_url);
    if (!url) return { error: 'El link de la imagen no es válido (debe empezar con https://)' };
    return { mode, url };
  }
  if (mode === 'upload') {
    const d = b.image_data;
    if (typeof d !== 'string' || d.length > 700000 || !DATA_URL.test(d)) {
      return { error: 'La imagen no es válida o es muy pesada. Prueba con otra foto' };
    }
    return { mode, data: d };
  }
  if (mode === 'remove') return { mode };
  return { mode: 'keep' };
}

module.exports = async (req, res) => {
  if (!isAdmin(req)) return send(res, 401, { error: 'No autorizado' });
  try {
    const b = body(req);

    if (req.method === 'GET') return send(res, 200, { gifts: await store.listGifts() });

    if (req.method === 'POST' && Array.isArray(b.bulk)) {
      const items = b.bulk.slice(0, 300).map((x) => ({ ...fields(x || {}), image: cleanUrl((x || {}).image) })).filter((f) => f.title);
      if (!items.length) return send(res, 400, { error: 'No hay regalos válidos en la lista' });
      return send(res, 200, { ok: true, added: await store.addGifts(items) });
    }

    if (req.method === 'POST') {
      const f = fields(b);
      if (!f.title) return send(res, 400, { error: 'Escribe el nombre del regalo' });
      const img = imageOp(b);
      if (img.error) return send(res, 400, { error: img.error });
      return send(res, 200, { ok: true, id: await store.addGift(f, img) });
    }

    if (req.method === 'DELETE' && b.all === true) {
      await store.deleteAll();
      return send(res, 200, { ok: true });
    }

    const id = parseInt(b.id, 10);
    if (!Number.isInteger(id)) return send(res, 400, { error: 'Regalo inválido' });

    if (req.method === 'PUT') {
      const f = fields(b);
      if (!f.title) return send(res, 400, { error: 'Escribe el nombre del regalo' });
      const img = imageOp(b);
      if (img.error) return send(res, 400, { error: img.error });
      if (!(await store.updateGift(id, f, img))) return send(res, 404, { error: 'Ese regalo ya no existe' });
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
