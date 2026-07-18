const {
  json,
  allowPost,
  getEnv,
  readJson,
  supabaseRequest,
  midtransAuth
} = require('./_helpers');

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

module.exports = async function handler(req, res) {
  if (!allowPost(req, res)) return;

  try {
    const body = await readJson(req);
    const consultationNumber = cleanText(body.consultationNumber, 80).toUpperCase();
    if (!consultationNumber) return json(res, 400, { ok: false, message: 'Nomor konsultasi tidak tersedia.' });

    const query = `consultations?consultation_no=eq.${encodeURIComponent(consultationNumber)}&select=id,consultation_no,amount,payment_status,consultation_status,service_name_snapshot,client_id,clients(full_name,email,whatsapp)&limit=1`;
    const consultations = await supabaseRequest(query, { method: 'GET' });
    const consultation = Array.isArray(consultations) ? consultations[0] : null;

    if (!consultation) return json(res, 404, { ok: false, message: 'Data konsultasi tidak ditemukan.' });

    const amount = Math.round(Number(consultation.amount || 0));
    if (!Number.isFinite(amount) || amount < 1) {
      return json(res, 400, { ok: false, message: 'Konsultasi ini tidak memerlukan pembayaran.' });
    }
    if (consultation.payment_status === 'paid') {
      return json(res, 409, { ok: false, message: 'Pembayaran konsultasi ini sudah lunas.' });
    }

    const client = consultation.clients || {};
    const orderId = `PAY-${consultation.consultation_no}-${Date.now()}`;
    const serverKey = getEnv('MIDTRANS_SERVER_KEY');

    const transaction = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      item_details: [{
        id: cleanText(consultation.service_name_snapshot, 50) || 'consultation',
        price: amount,
        quantity: 1,
        name: cleanText(consultation.service_name_snapshot, 50) || 'Konsultasi'
      }],
      customer_details: {
        first_name: cleanText(client.full_name || body.name, 50) || 'Client',
        email: cleanText(client.email || body.email, 100),
        phone: cleanText(client.whatsapp || body.whatsapp, 30)
      },
      custom_field1: consultation.consultation_no,
      custom_field2: consultation.id,
      callbacks: {
        finish: `${String(req.headers.origin || '').replace(/\/$/, '')}/status-konsultasi.html`
      }
    };

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
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
      throw new Error(message);
    }

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
