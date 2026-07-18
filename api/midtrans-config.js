const { json, getEnv } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, message: 'Method tidak diizinkan.' });
  }
  try {
    return json(res, 200, {
      ok: true,
      environment: 'sandbox',
      clientKey: getEnv('MIDTRANS_CLIENT_KEY'),
      snapUrl: 'https://app.sandbox.midtrans.com/snap/snap.js'
    });
  } catch (error) {
    return json(res, 500, { ok: false, message: error.message });
  }
};
