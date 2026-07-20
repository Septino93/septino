(async function loadProfilePhoto(){
  const image = document.getElementById('profilePhoto');
  const cfg = window.SEPTINO_APP_CONFIG || {};
  if (!image || !window.supabase || !cfg.supabaseUrl || !cfg.supabasePublishableKey) return;

  try {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const { data, error } = await client
      .from('website_settings')
      .select('value')
      .eq('key', 'profile_photo_url')
      .maybeSingle();
    if (error) throw error;
    if (data?.value) image.src = data.value;
  } catch (error) {
    console.warn('Foto profil website tidak dapat dimuat:', error.message || error);
  }
})();
