// Lista pública: el invitado NO ve quién eligió cada regalo, solo si ya está tomado.
const { listGifts } = require('../lib/store');
const { send } = require('../lib/util');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Método no permitido' });
  try {
    const gifts = (await listGifts()).map((g) => ({
      id: g.id, icon: g.icon, title: g.title, note: g.note, url: g.url, taken: !!g.claimed_by,
    }));
    send(res, 200, { gifts });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'No se pudo cargar la lista' });
  }
};
