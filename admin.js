let currentUser=null;
let messageChannel=null;
let knownMessageIds=new Set();
let unreadCount=0;
const $=id=>document.getElementById(id);
function status(id,msg){$(id).textContent=msg||'';}
function notifyNewMessage(message){
  unreadCount++;
  updateMessageBadge();
  const text=`New enquiry from ${message.name}`;
  status('messageNotice',`${text} — ${message.message.slice(0,120)}${message.message.length>120?'…':''}`);
  if('Notification' in window && Notification.permission==='granted'){
    new Notification('New portfolio enquiry',{body:`${message.name}: ${message.message.slice(0,120)}`,tag:'portfolio-message'});
  }
  try{const C=window.AudioContext||window.webkitAudioContext;if(C){const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.05;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.18);}}catch(e){}
}
function updateMessageBadge(){const b=$('messageBadge');if(!b)return;b.textContent=unreadCount;b.classList.toggle('hidden',unreadCount===0);}
async function requestNotifications(){
  if(!('Notification' in window)){status('messageNotice','This browser does not support desktop notifications.');return;}
  const permission=await Notification.requestPermission();
  status('messageNotice',permission==='granted'?'Notifications enabled. You will be alerted when a new enquiry arrives.': 'Notifications were not enabled. You can still see new enquiries in Messages.');
}
async function guard(){
  if(SITE_CONFIG.supabaseUrl.startsWith('YOUR_')) { status('loginStatus','First configure config.js with your Supabase URL and publishable key.'); return; }
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(user && await isAdmin()){ currentUser=user; $('loginBox').classList.add('hidden'); $('dashboard').classList.remove('hidden'); await loadAll(); startMessageRealtime(); }
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();status('loginStatus','Signing in...');const {data,error}=await supabaseClient.auth.signInWithPassword({email:$('loginEmail').value,password:$('loginPassword').value});if(error){status('loginStatus',error.message);return;}if(!(await isAdmin())){const u=data.user;status('loginStatus',`This account (${u?.email||'unknown'}) is not an administrator. Open Supabase SQL Editor and run: insert into public.admin_users(user_id) values ('${u.id}') on conflict (user_id) do nothing; Then sign in again.`);await supabaseClient.auth.signOut();return;}currentUser=data.user;$('loginBox').classList.add('hidden');$('dashboard').classList.remove('hidden');await loadAll();startMessageRealtime();});
$('logout').addEventListener('click',async()=>{if(messageChannel)await supabaseClient.removeChannel(messageChannel);await supabaseClient.auth.signOut();location.reload();});
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active'));$(btn.dataset.tab).classList.add('active');if(btn.dataset.tab==='messages'){unreadCount=0;updateMessageBadge();}}));
$('enableNotifications')?.addEventListener('click',requestNotifications);
$('markAllRead')?.addEventListener('click',()=>{unreadCount=0;updateMessageBadge();status('messageNotice','All new-message notifications cleared.');});
async function upload(file,folder){if(!file)return null;const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const path=`${folder}/${Date.now()}-${safe}`;const {error}=await supabaseClient.storage.from('portfolio').upload(path,file,{upsert:false,cacheControl:'3600'});if(error)throw error;return supabaseClient.storage.from('portfolio').getPublicUrl(path).data.publicUrl;}
async function removeStorageFile(publicUrl){try{if(!publicUrl||!publicUrl.includes('/storage/v1/object/public/portfolio/'))return;const path=decodeURIComponent(publicUrl.split('/storage/v1/object/public/portfolio/')[1]);if(path)await supabaseClient.storage.from('portfolio').remove([path]);}catch(e){console.warn('Could not remove old image:',e);}}
async function loadAll(){await Promise.all([loadProjects(),loadArtboards(),loadSettings(),loadMessages()]);}
async function loadProjects(){const rows=await getProjects();$('projectList').innerHTML=rows.map(p=>`<div class="admin-item"><div style="display:flex;gap:12px;align-items:center"><img src="${esc(p.image_url)}"><div><strong>${esc(p.title)}</strong><div class="muted">${esc(p.category||'')}</div></div></div><div class="actions"><button class="btn" onclick="editProject('${p.id}')">Edit</button><button class="btn" onclick="deleteProject('${p.id}')">Delete</button></div></div>`).join('')||'<p class="muted">No projects yet.</p>';window.projectRows=rows;}
window.editProject=id=>{const p=window.projectRows.find(x=>x.id===id);$('projectId').value=p.id;$('projectTitle').value=p.title;$('projectCategory').value=p.category||'';$('projectDescription').value=p.description||'';$('projectUrl').value=p.project_url||'';$('projectImage').required=false;window.scrollTo({top:0,behavior:'smooth'});};
window.deleteProject=async id=>{if(!confirm('Delete this project? This cannot be undone.'))return;const row=window.projectRows.find(x=>x.id===id);const {error}=await supabaseClient.from('projects').delete().eq('id',id);if(error){alert(error.message);return;}await removeStorageFile(row?.image_url);await loadProjects();};
$('projectForm').addEventListener('submit',async e=>{e.preventDefault();status('projectStatus','Saving...');try{const id=$('projectId').value;let imageUrl=id?window.projectRows.find(x=>x.id===id).image_url:null;const file=$('projectImage').files[0];if(file)imageUrl=await upload(file,'projects');const row={title:$('projectTitle').value,category:$('projectCategory').value,description:$('projectDescription').value,project_url:$('projectUrl').value,image_url:imageUrl,sort_order:0};const q=id?supabaseClient.from('projects').update(row).eq('id',id):supabaseClient.from('projects').insert(row);const {error}=await q;if(error)throw error;status('projectStatus','Saved.');$('projectForm').reset();$('projectId').value='';$('projectImage').required=true;await loadProjects();}catch(err){status('projectStatus',err.message);}});
$('cancelProject').onclick=()=>{$('projectForm').reset();$('projectId').value='';$('projectImage').required=true;};
async function loadArtboards(){const rows=await getArtboards();$('artboardList').innerHTML=rows.map(a=>`<div class="admin-item"><div style="display:flex;gap:12px;align-items:center"><img src="${esc(a.image_url)}"><strong>${esc(a.title||'Artboard')}</strong></div><div class="actions"><button class="btn" onclick="editArtboard('${a.id}')">Edit</button><button class="btn" onclick="deleteArtboard('${a.id}')">Delete</button></div></div>`).join('')||'<p class="muted">No artboards yet.</p>';window.artRows=rows;}
window.editArtboard=id=>{const a=window.artRows.find(x=>x.id===id);$('artboardId').value=a.id;$('artboardTitle').value=a.title||'';$('artboardImage').required=false;};
window.deleteArtboard=async id=>{if(!confirm('Delete this artboard? This cannot be undone.'))return;const row=window.artRows.find(x=>x.id===id);const {error}=await supabaseClient.from('artboards').delete().eq('id',id);if(error){alert(error.message);return;}await removeStorageFile(row?.image_url);await loadArtboards();};
$('artboardForm').addEventListener('submit',async e=>{e.preventDefault();status('artboardStatus','Saving...');try{const id=$('artboardId').value;let imageUrl=id?window.artRows.find(x=>x.id===id).image_url:null;const file=$('artboardImage').files[0];if(file)imageUrl=await upload(file,'artboards');const row={title:$('artboardTitle').value,image_url:imageUrl,sort_order:0};const q=id?supabaseClient.from('artboards').update(row).eq('id',id):supabaseClient.from('artboards').insert(row);const {error}=await q;if(error)throw error;status('artboardStatus','Saved.');$('artboardForm').reset();$('artboardId').value='';$('artboardImage').required=true;await loadArtboards();}catch(err){status('artboardStatus',err.message);}});
$('cancelArtboard').onclick=()=>{$('artboardForm').reset();$('artboardId').value='';$('artboardImage').required=true;};
async function loadSettings(){const settings=await getSettings();const s=settings.site||{};$('sName').value=s.site_name||'';$('sHero').value=s.hero_title||'';$('sSub').value=s.hero_subtitle||'';$('sAbout').value=s.about_text||'';$('sEmail').value=s.email||'';$('sPhone').value=s.phone||'';$('sLocation').value=s.location||'';$('sInstagram').value=s.instagram||'';$('sFacebook').value=s.facebook||'';}
$('siteForm').addEventListener('submit',async e=>{e.preventDefault();status('siteStatus','Saving...');try{const old=(await getSettings()).site||{};let heroImage=old.hero_image,aboutImage=old.about_image;if($('sHeroImage').files[0])heroImage=await upload($('sHeroImage').files[0],'site');if($('sAboutImage').files[0])aboutImage=await upload($('sAboutImage').files[0],'site');const site={...old,site_name:$('sName').value,hero_title:$('sHero').value,hero_subtitle:$('sSub').value,about_text:$('sAbout').value,hero_image:heroImage,about_image:aboutImage,email:$('sEmail').value,phone:$('sPhone').value,location:$('sLocation').value,instagram:$('sInstagram').value,facebook:$('sFacebook').value};const {error}=await supabaseClient.from('site_settings').upsert({key:'site',value:site,updated_at:new Date().toISOString()});if(error)throw error;status('siteStatus','Settings updated.');}catch(err){status('siteStatus',err.message);}});
async function loadMessages(){const {data,error}=await supabaseClient.from('messages').select('*').order('created_at',{ascending:false});if(error){$('messageList').innerHTML=`<p class="notice">${esc(error.message)}</p>`;return;}const rows=data||[];knownMessageIds=new Set(rows.map(m=>m.id));$('messageList').innerHTML=rows.map(m=>`<div class="admin-item ${m.read_at?'':'unread-message'}"><div><div class="message-title"><strong>${esc(m.name)}</strong>${m.read_at?'':'<span class="new-label">NEW</span>'}</div><div class="muted">${esc(m.email)} · ${new Date(m.created_at).toLocaleString()}</div><p style="margin-top:8px">${esc(m.message)}</p></div><div class="actions"><button class="btn" onclick="markMessageRead('${m.id}')">${m.read_at?'Read':'Mark read'}</button><button class="btn" onclick="deleteMessage('${m.id}')">Delete</button></div></div>`).join('')||'<p class="muted">No messages.</p>';
  if(!rows.some(m=>!m.read_at)) { unreadCount=0; updateMessageBadge(); }
}
window.markMessageRead=async id=>{const {error}=await supabaseClient.from('messages').update({read_at:new Date().toISOString()}).eq('id',id);if(error){alert(error.message);return;}unreadCount=Math.max(0,unreadCount-1);updateMessageBadge();await loadMessages();};
window.deleteMessage=async id=>{if(confirm('Delete message?')){const {error}=await supabaseClient.from('messages').delete().eq('id',id);if(error){alert(error.message);return;}knownMessageIds.delete(id);await loadMessages();}};
function startMessageRealtime(){
  if(messageChannel)return;
  messageChannel=supabaseClient.channel('admin-messages').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
    if(!knownMessageIds.has(payload.new.id)){knownMessageIds.add(payload.new.id);notifyNewMessage(payload.new);loadMessages();}
  }).on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages'},()=>loadMessages()).on('postgres_changes',{event:'DELETE',schema:'public',table:'messages'},()=>loadMessages()).subscribe();
}
guard();
