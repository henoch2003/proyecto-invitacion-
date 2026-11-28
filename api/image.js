// Entrega la foto que la dueña subió desde el panel (se guarda en Redis).
const { getImage } = require('../lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  const id = parseInt(req.query && req.query.id, 10);
  if (!Number.isInteger(id)) return res.status(400).end();
  try {
    const d = await getImage(id);
    const m = d && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(d);
    if (!m) return res.status(404).end();
    res.setHeader('Content-Type', m[1]);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(Buffer.from(m[2], 'base64'));
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
};
