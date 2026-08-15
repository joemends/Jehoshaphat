/* Supabase connection. Safe for GitHub Pages: use only the publishable/anon key here, never a service-role key. */
const supabaseClient = window.supabase.createClient(SITE_CONFIG.supabaseUrl, SITE_CONFIG.supabaseKey);

async function isAdmin() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return false;
  const { data } = await supabaseClient.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  return !!data;
}

async function getSettings() {
  const { data, error } = await supabaseClient.from('site_settings').select('key,value');
  if (error) return {};
  return Object.fromEntries((data || []).map(x => [x.key, x.value]));
}

async function getProjects() {
  const { data, error } = await supabaseClient.from('projects').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  return error ? [] : (data || []);
}

async function getArtboards() {
  const { data, error } = await supabaseClient.from('artboards').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  return error ? [] : (data || []);
}
