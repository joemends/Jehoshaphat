const ready = () => {
  document.documentElement.style.setProperty('--reveal-duration', `${SITE_CONFIG.animations.revealDuration}ms`);
  document.documentElement.style.setProperty('--reveal-distance', `${SITE_CONFIG.animations.revealDistance}px`);
  document.documentElement.style.setProperty('--logo-speed', `${SITE_CONFIG.animations.logoSpeed}s`);
  document.documentElement.style.setProperty('--artboard-speed', `${SITE_CONFIG.animations.artboardSpeed}s`);

  document.querySelectorAll('[data-menu]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelector('[data-mobile-links]')?.classList.toggle('open');
  }));

  const observer = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('show')), { threshold:.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  const year = document.querySelector('[data-year]'); if (year) year.textContent = new Date().getFullYear();
};
document.addEventListener('DOMContentLoaded', ready);

function esc(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function assetPath(path) { return path || 'assets/background.png'; }
function safePublicImage(path) { return path || 'assets/background.png'; }
function dbImage(row) { return row?.image_path ? supabaseClient.storage.from('portfolio').getPublicUrl(row.image_path).data.publicUrl : safePublicImage(row?.image_url); }

async function renderPublicSite() {
  if (SITE_CONFIG.supabaseUrl.startsWith('YOUR_')) return;
  const settings = await getSettings();
  const map = {site_name:'JEHOSHAPHAT MENDS', hero_title:'JEHOSHAPHAT MENDS', hero_subtitle:'Brand & Graphic Designer', about_text:'I’m a designer with experience creating impactful visuals across brand design, graphic design, UX/UI design and website development.', about_image:'assets/About.jpg', hero_image:'assets/background.png'};
  const merged = {...map, ...(settings.site || {})};
  document.querySelectorAll('[data-setting]').forEach(el => { const key=el.dataset.setting; if (merged[key] !== undefined) { if(el.tagName==='IMG') el.src=assetPath(merged[key]); else el.textContent=merged[key]; } });
  const projects = await getProjects();
  document.querySelectorAll('[data-projects]').forEach(target => {
    if (!projects.length) return;
    target.innerHTML = projects.slice(0, target.dataset.limit ? Number(target.dataset.limit) : 99).map(p => `<a class="card reveal show work-card-link" href="work.html?type=project&id=${encodeURIComponent(p.id)}"><img class="card-img" src="${esc(dbImage(p))}" onerror="this.onerror=null;this.src='assets/background.png'" alt="${esc(p.title)}"><div class="card-body"><span class="tag">${esc(p.category || 'Project')}</span><h3>${esc(p.title)}</h3><p class="muted">${esc(p.description || '')}</p><span class="btn" style="margin-top:14px">View details</span></div></a>`).join('');
  });
  const arts = await getArtboards();
  document.querySelectorAll('[data-artboards]').forEach(target => { if(!arts.length) return; target.innerHTML = arts.map(a=>`<a class="artboard-link" href="work.html?type=artboard&id=${encodeURIComponent(a.id)}"><img src="${esc(dbImage(a))}" onerror="this.onerror=null;this.src='assets/background.png'" alt="${esc(a.title||'Artboard')}"></a>`).join(''); });
}

document.addEventListener('DOMContentLoaded', renderPublicSite);
