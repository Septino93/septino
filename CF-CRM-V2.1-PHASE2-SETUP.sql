-- =========================================================
-- CERDAS FINANSIAL CRM V2.1 - PHASE 2
-- Smart Simulation Sync
--
-- Aman untuk Database v1.0:
-- - Tidak membuat tabel baru
-- - Tidak menambah/mengubah kolom
-- - Tidak menghapus RPC v1
-- - Hanya menambahkan RPC register_consultation_v2()
-- - Snapshot simulasi disimpan di activity_logs.metadata
-- =========================================================

create or replace function public.register_consultation_v2(
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_service_slug text,
  p_simulation_summary text default null
)
returns table (
  consultation_no text,
  public_token uuid,
  consultation_status text,
  payment_status text,
  amount numeric,
  remaining_credit integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_client public.clients%rowtype;
  v_whatsapp_norm text;
  v_credit_used integer := 0;
  v_amount numeric(14,2) := 0;
  v_payment_status text;
  v_consultation_status text;
  v_consultation public.consultations%rowtype;
begin
  if nullif(trim(p_full_name), '') is null then
    raise exception 'Nama lengkap wajib diisi';
  end if;

  if nullif(trim(p_whatsapp), '') is null then
    raise exception 'Nomor WhatsApp wajib diisi';
  end if;

  v_whatsapp_norm := public.normalize_whatsapp(p_whatsapp);

  select * into v_service
  from public.services
  where slug = p_service_slug and is_active = true;

  if not found then
    raise exception 'Layanan tidak ditemukan atau tidak aktif';
  end if;

  select * into v_client
  from public.clients
  where whatsapp_normalized = v_whatsapp_norm
     or (
       nullif(trim(p_email), '') is not null
       and lower(email) = lower(trim(p_email))
     )
  order by case when whatsapp_normalized = v_whatsapp_norm then 0 else 1 end
  limit 1
  for update;

  if not found then
    insert into public.clients (
      full_name, email, whatsapp, whatsapp_normalized, consultation_credit
    )
    values (
      trim(p_full_name),
      nullif(lower(trim(p_email)), ''),
      trim(p_whatsapp),
      v_whatsapp_norm,
      2
    )
    returning * into v_client;

    insert into public.activity_logs (client_id, event_type, description)
    values (v_client.id, 'client_created', 'Client baru dibuat dari Website Personal');
  else
    update public.clients
    set
      full_name = trim(p_full_name),
      email = coalesce(nullif(lower(trim(p_email)), ''), email),
      whatsapp = trim(p_whatsapp),
      whatsapp_normalized = v_whatsapp_norm
    where id = v_client.id
    returning * into v_client;
  end if;

  if v_service.uses_credit and v_client.consultation_credit > 0 then
    v_credit_used := 1;
    v_amount := 0;
    v_payment_status := 'not_required';
    v_consultation_status := 'waiting_schedule';

    update public.clients
    set consultation_credit = consultation_credit - 1
    where id = v_client.id
    returning * into v_client;
  else
    v_amount := v_service.price;
    v_payment_status := 'pending';
    v_consultation_status := 'waiting_payment';
  end if;

  insert into public.consultations (
    client_id, service_id, service_name_snapshot, amount, credit_used,
    payment_status, consultation_status
  )
  values (
    v_client.id, v_service.id, v_service.name, v_amount, v_credit_used,
    v_payment_status, v_consultation_status
  )
  returning * into v_consultation;

  insert into public.activity_logs (
    client_id, consultation_id, event_type, description, metadata
  )
  values (
    v_client.id,
    v_consultation.id,
    'consultation_registered',
    'Pendaftaran konsultasi dibuat',
    jsonb_build_object(
      'source', 'website_personal',
      'service_slug', v_service.slug,
      'service', v_service.name,
      'credit_used', v_credit_used,
      'amount', v_amount,
      'simulation_summary', nullif(trim(p_simulation_summary), '')
    )
  );

  return query
  select
    v_consultation.consultation_no,
    v_consultation.public_token,
    v_consultation.consultation_status,
    v_consultation.payment_status,
    v_consultation.amount,
    v_client.consultation_credit;
end;
$$;

revoke all on function public.register_consultation_v2(text,text,text,text,text) from public;
grant execute on function public.register_consultation_v2(text,text,text,text,text) to anon, authenticated;

select 'CF CRM V2.1 Phase 2 berhasil dipasang' as result;
