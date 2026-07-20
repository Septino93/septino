const { json, getEnv } = require('./_helpers');

function isProductionMode() {
  return String(process.env.MIDTRANS_IS_PRODUCTION || '')
    .trim()
    .toLowerCase() === 'true';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { ok: false, message: 'Method tidak diizinkan.' });
  }

  try {
    const isProduction = isProductionMode();

    return json(res, 200, {
      ok: true,
      environment: isProduction ? 'production' : 'sandbox',
      clientKey: getEnv('MIDTRANS_CLIENT_KEY'),
      snapUrl: isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js'
    });
  } catch (error) {
    return json(res, 500, { ok: false, message: error.message });
  }
};
