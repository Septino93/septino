const crypto = require('crypto');

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function allowPost(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    json(res, 405, { ok: false, message: 'Method tidak diizinkan.' });
    return false;
  }
  return true;
}

function getEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`Environment Variable ${name} belum diatur.`);
  return value;
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { throw new Error('Format data tidak valid.'); }
}

function supabaseHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
}

async function supabaseRequest(path, options = {}) {
  const baseUrl = getEnv('SUPABASE_URL').replace(/\/$/, '');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(serviceRoleKey),
      ...(options.headers || {})
    }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = raw; }
  if (!response.ok) {
    const message = data?.message || data?.details || data?.hint || 'Supabase gagal memproses data.';
    throw new Error(message);
  }
  return data;
}

function midtransAuth(serverKey) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

function verifyMidtransSignature(payload, serverKey) {
  const source = `${payload.order_id || ''}${payload.status_code || ''}${payload.gross_amount || ''}${serverKey}`;
  const expected = crypto.createHash('sha512').update(source).digest('hex');
  const received = String(payload.signature_key || '');
  if (!received || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

module.exports = {
  json,
  allowPost,
  getEnv,
  readJson,
  supabaseRequest,
  midtransAuth,
  verifyMidtransSignature
};
