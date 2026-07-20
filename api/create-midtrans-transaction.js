const {
  json,
  allowPost,
  getEnv,
  readJson,
  supabaseRequest,
  midtransAuth,
  normalizePhone
} = require('./_helpers');

function isProductionMode() {
  return String(process.env.MIDTRANS_IS_PRODUCTION || '')
    .trim()
    .toLowerCase() === 'true';
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function sameIdentity(client, body) {
  const submittedEmail = cleanText(body.email, 120).toLowerCase();
  const submittedPhone = normalizePhone(body.whatsapp);
  const clientEmail = cleanText(client?.email, 120).toLowerCase();
  const clientPhone = normalizePhone(client?.whatsapp);
  return Boolean(
    (submittedEmail && clientEmail && submittedEmail === clientEmail) ||
    (submittedPhone && clientPhone && submittedPhone === clientPhone)
  );
}

function requestOrigin(req) {
  const configured = String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
}

module.exports = async function handler(req, res) {
  if (!allowPost(req, res)) return;

  try {
    const body = await readJson(req);
    const consultationNumber = cleanText(body.consultationNumber, 80).toUpperCase();
    if (!consultationNumber) return json(res, 400, { ok: false, message: 'Nomor konsultasi tidak tersedia.' });

    const query = `consultations?consultation_no=eq.${encodeURIComponent(consultationNumber)}&select=id,consultation_no,amount,payment_status,consultation_status,service_name_snapshot,client_id,clients(full_name,email,whatsapp)&limit=1`;
    const rows = await supabaseRequest(query, { method: 'GET' });
    const consultation = Array.isArray(rows) ? rows[0] : null;
    if (!consultation) return json(res, 404, { ok: false, message: 'Data konsultasi tidak ditemukan.' });

    const client = consultation.clients || {};
    if (!sameIdentity(client, body)) {
      return json(res, 403, { ok: false, message: 'Email atau WhatsApp tidak sesuai dengan data konsultasi.' });
    }

    const amount = Math.round(Number(consultation.amount || 0));
    if (!Number.isFinite(amount) || amount < 1) {
      return json(res, 400, { ok: false, message: 'Konsultasi ini tidak memerlukan pembayaran.' });
    }
    if (consultation.payment_status === 'paid') {
      return json(res, 409, { ok: false, message: 'Pembayaran konsultasi ini sudah lunas.' });
    }

    const orderId = `CF-${consultation.consultation_no}-${Date.now()}`.slice(0, 50);
    const serverKey = getEnv('MIDTRANS_SERVER_KEY');
    const isProduction = isProductionMode();
    const midtransBaseUrl = isProduction
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com';
    const midtransEnvironment = isProduction ? 'production' : 'sandbox';
    const origin = requestOrigin(req);
    const serviceName = cleanText(consultation.service_name_snapshot, 50) || 'Konsultasi';

    const transaction = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{ id: 'consultation', price: amount, quantity: 1, name: serviceName }],
      customer_details: {
        first_name: cleanText(client.full_name || body.name, 50) || 'Client',
        email: cleanText(client.email || body.email, 100),
        phone: normalizePhone(client.whatsapp || body.whatsapp)
      },
      custom_field1: consultation.consultation_no,
      custom_field2: consultation.id,
      expiry: { unit: 'hours', duration: 24 }
    };
    if (origin) transaction.callbacks = { finish: `${origin}/status-konsultasi.html` };

    const response = await fetch(`${midtransBaseUrl}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Authorization: midtransAuth(serverKey),
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(transaction)
    });

    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = null; }
    if (!response.ok || !data?.token) {
      const message = data?.error_messages?.[0] || data?.status_message || 'Midtrans gagal membuat transaksi.';
      return json(res, response.status || 502, { ok: false, message });
    }

    await supabaseRequest(`consultations?id=eq.${encodeURIComponent(consultation.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ payment_status: 'pending', consultation_status: 'waiting_payment' })
    });

    await supabaseRequest('activity_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        client_id: consultation.client_id,
        consultation_id: consultation.id,
        event_type: 'midtrans_transaction_created',
        description: `Transaksi Midtrans dibuat sebesar Rp${amount.toLocaleString('id-ID')}`,
        metadata: { provider: 'midtrans', environment: midtransEnvironment, order_id: orderId, amount }
      })
    });

    return json(res, 200, {
      ok: true,
      token: data.token,
      redirectUrl: data.redirect_url,
      orderId,
      amount,
      consultationNumber: consultation.consultation_no
    });
  } catch (error) {
    console.error('create-midtrans-transaction:', error);
    return json(res, 500, { ok: false, message: error.message || 'Transaksi tidak dapat dibuat.' });
  }
};
