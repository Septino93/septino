const { json, allowPost, readJson, supabaseRequest, getEnv } = require('./_helpers');
function cleanFileName(v){return String(v||'bukti').replace(/[^a-zA-Z0-9._-]/g,'-').slice(-100)}
module.exports=async function(req,res){
 if(!allowPost(req,res))return;
 try{
  const b=await readJson(req),no=String(b.consultationNumber||'').trim().toUpperCase(),token=String(b.publicToken||'').trim();
  if(!no||!token) return json(res,400,{ok:false,message:'Nomor konsultasi atau token tidak lengkap.'});
  const rows=await supabaseRequest(`consultations?select=id,client_id,consultation_no,payment_status,amount&consultation_no=eq.${encodeURIComponent(no)}&public_token=eq.${encodeURIComponent(token)}&limit=1`);
  const c=rows?.[0]; if(!c)return json(res,404,{ok:false,message:'Data konsultasi tidak ditemukan.'});
  const mime=String(b.mimeType||''); if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime))return json(res,400,{ok:false,message:'Format file tidak didukung.'});
  const buf=Buffer.from(String(b.data||''),'base64'); if(!buf.length||buf.length>5*1024*1024)return json(res,400,{ok:false,message:'Ukuran file tidak valid atau lebih dari 5 MB.'});
  const path=`payment-proofs/${c.id}/${Date.now()}-${cleanFileName(b.filename)}`;
  const base=getEnv('SUPABASE_URL').replace(/\/$/,''); const key=getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const up=await fetch(`${base}/storage/v1/object/client-documents/${path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':mime,'x-upsert':'false'},body:buf});
  if(!up.ok){const text=await up.text();throw new Error(text||'Storage gagal menyimpan file. Pastikan bucket client-documents tersedia.');}
  await supabaseRequest('activity_logs',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({client_id:c.client_id,consultation_id:c.id,event_type:'payment_proof_uploaded',description:'Bukti pembayaran diunggah oleh client',metadata:{path,filename:cleanFileName(b.filename),mime_type:mime,size:buf.length,source:'website_manual_transfer'}})});
  await supabaseRequest(`consultations?id=eq.${c.id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({payment_status:'pending',consultation_status:'waiting_payment'})});
  return json(res,200,{ok:true,message:'Bukti pembayaran berhasil dikirim.'});
 }catch(e){return json(res,500,{ok:false,message:e.message||'Gagal mengunggah bukti pembayaran.'})}
};