const { json, allowPost, readJson, supabaseRequest } = require('./_helpers');
function normalizePhone(v){let p=String(v||'').replace(/\D/g,'');if(p.startsWith('0'))p=`62${p.slice(1)}`;if(p.startsWith('8'))p=`62${p}`;return p}
module.exports=async function(req,res){
 if(!allowPost(req,res))return;
 try{
  const b=await readJson(req);
  const no=String(b.consultationNumber||'').trim().toUpperCase();
  const identity=String(b.identity||'').trim();
  if(!no||!identity)return json(res,400,{ok:false,message:'Kode layanan dan identitas wajib diisi.'});
  const rows=await supabaseRequest(`consultations?select=id,consultation_no,payment_status,consultation_status,amount,clients(full_name,email,whatsapp)&consultation_no=eq.${encodeURIComponent(no)}&limit=1`);
  const c=rows?.[0];
  if(!c)return json(res,404,{ok:false,message:'Data layanan tidak ditemukan.'});
  const client=c.clients||{};
  const valid=identity.includes('@')?String(client.email||'').trim().toLowerCase()===identity.toLowerCase():normalizePhone(client.whatsapp)===normalizePhone(identity);
  if(!valid)return json(res,403,{ok:false,message:'Identitas tidak cocok.'});
  const logs=await supabaseRequest(`activity_logs?select=id,event_type,created_at,metadata&consultation_id=eq.${c.id}&event_type=in.(payment_proof_uploaded,manual_payment_approved,manual_payment_rejected)&order=created_at.desc&limit=20`);
  let status=c.payment_status||'pending';
  const latestDecision=(logs||[]).find(x=>x.event_type==='manual_payment_approved'||x.event_type==='manual_payment_rejected');
  const latestProof=(logs||[]).find(x=>x.event_type==='payment_proof_uploaded');
  if(latestDecision?.event_type==='manual_payment_approved')status='paid';
  else if(latestDecision?.event_type==='manual_payment_rejected' && (!latestProof || new Date(latestDecision.created_at)>=new Date(latestProof.created_at)))status='failed';
  else if(latestProof && status==='pending')status='verification';
  return json(res,200,{ok:true,paymentStatus:status,consultationStatus:c.consultation_status,hasProof:Boolean(latestProof)});
 }catch(e){return json(res,500,{ok:false,message:e.message||'Status pembayaran gagal diperiksa.'})}
};
