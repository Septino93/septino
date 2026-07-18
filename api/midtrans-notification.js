const {
  json,
  getEnv,
  readJson,
  supabaseRequest,
  verifyMidtransSignature
} = require('./_helpers');

function paymentState(payload) {
  const status = String(payload.transaction_status || '').toLowerCase();
  const fraud = String(payload.fraud_status || '').toLowerCase();

  if (status === 'settlement' || (status === 'capture' && fraud === 'accept')) {
    return 'paid';
  }

  if (['deny', 'cancel', 'expire', 'failure'].includes(status)) {
    return 'failed';
  }

  return 'pending';
}

function consultationNoFromPayload(payload) {
  if (payload.custom_field1) {
    return String(payload.custom_field1).trim().toUpperCase();
  }

  const orderId = String(payload.order_id || '').trim();

  // Format transaksi website:
  // CF-KS2607180014-1784362123456
  const match = orderId.match(/^CF-(.+)-(\d{13})$/i);
  return match ? match[1].toUpperCase() : '';
}

module.exports = async function handler(req, res) {
  /*
   * Midtrans Dashboard dapat melakukan pemeriksaan endpoint sebelum
   * mengirim notifikasi transaksi. GET/HEAD hanya menjadi health check
   * dan tidak pernah mengubah data.
   */
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (req.method === 'HEAD') {
      res.statusCode = 200;
      return res.end();
    }

    return json(res, 200, {
      ok: true,
      message: 'Midtrans notification endpoint aktif.'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    return json(res, 405, {
      ok: false,
      message: 'Method tidak diizinkan.'
    });
  }

  try {
    const payload = await readJson(req);
    const serverKey = getEnv('MIDTRANS_SERVER_KEY');

    /*
     * Notifikasi transaksi asli wajib memiliki signature yang valid.
     * Formula verifikasi:
     * SHA512(order_id + status_code + gross_amount + server_key)
     */
    if (!verifyMidtransSignature(payload, serverKey)) {
      return json(res, 401, {
        ok: false,
        message: 'Signature Midtrans tidak valid.'
      });
    }

    const consultationNumber = consultationNoFromPayload(payload);

    /*
     * Payload test atau transaksi yang bukan milik alur konsultasi ini
     * tetap dibalas 200 agar Midtrans tidak menganggap endpoint gagal.
     * Tidak ada perubahan database pada kondisi ini.
     */
    if (!consultationNumber) {
      return json(res, 200, {
        ok: true,
        ignored: true,
        message: 'Notifikasi valid diterima, tetapi bukan transaksi konsultasi.'
      });
    }

    const rows = await supabaseRequest(
      `consultations?consultation_no=eq.${encodeURIComponent(
        consultationNumber
      )}&select=id,client_id,amount,payment_status&limit=1`,
      { method: 'GET' }
    );

    const consultation = Array.isArray(rows) ? rows[0] : null;

    /*
     * Notifikasi yang signature-nya valid tetapi data konsultasinya sudah
     * dihapus atau berasal dari transaksi lama tidak perlu terus diulang.
     */
    if (!consultation) {
      return json(res, 200, {
        ok: true,
        ignored: true,
        message: 'Konsultasi tidak ditemukan.'
      });
    }

    const expectedAmount = Math.round(Number(consultation.amount || 0));
    const notifiedAmount = Math.round(Number(payload.gross_amount || 0));

    if (!expectedAmount || expectedAmount !== notifiedAmount) {
      return json(res, 400, {
        ok: false,
        message: 'Nominal notifikasi tidak sesuai.'
      });
    }

    const state = paymentState(payload);

    let consultationStatus = 'waiting_payment';
    if (state === 'paid') consultationStatus = 'waiting_schedule';

    /*
     * Idempotent:
     * - notifikasi berulang aman diproses;
     * - status paid tidak diturunkan kembali menjadi pending/failed.
     */
    const alreadyPaid = consultation.payment_status === 'paid';

    if (!alreadyPaid || state === 'paid') {
      await supabaseRequest(
        `consultations?id=eq.${encodeURIComponent(consultation.id)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            payment_status: state,
            consultation_status: consultationStatus
          })
        }
      );
    }

    await supabaseRequest('activity_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        client_id: consultation.client_id,
        consultation_id: consultation.id,
        event_type: 'midtrans_notification',
        description:
          state === 'paid'
            ? 'Pembayaran Midtrans berhasil'
            : `Status pembayaran Midtrans: ${state}`,
        metadata: {
          provider: 'midtrans',
          order_id: payload.order_id || null,
          transaction_id: payload.transaction_id || null,
          transaction_status: payload.transaction_status || null,
          payment_type: payload.payment_type || null,
          gross_amount: payload.gross_amount || null,
          fraud_status: payload.fraud_status || null
        }
      })
    });

    return json(res, 200, {
      ok: true,
      state,
      consultationNumber
    });
  } catch (error) {
    console.error('midtrans-notification:', error);

    return json(res, 500, {
      ok: false,
      message: error.message || 'Notifikasi gagal diproses.'
    });
  }
};
