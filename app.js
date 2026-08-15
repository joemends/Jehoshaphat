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

async function renderPublicSite() {
  if (SITE_CONFIG.supabaseUrl.startsWith('YOUR_')) return;
  const settings = await getSettings();
  const map = {site_name:'JEHOSHAPHAT MENDS', hero_title:'JEHOSHAPHAT MENDS', hero_subtitle:'Brand & Graphic Designer', about_text:'I’m a designer with experience creating impactful visuals across brand design, graphic design, UX/UI design and website development.', about_image:'assets/About.jpg', hero_image:'assets/background.png'};
  const merged = {...map, ...(settings.site || {})};
  document.querySelectorAll('[data-setting]').forEach(el => { const key=el.dataset.setting; if (merged[key] !== undefined) { if(el.tagName==='IMG') el.src=assetPath(merged[key]); else el.textContent=merged[key]; } });
  if (merged.hero_image) { const hero=document.querySelector('.hero'); if(hero) hero.style.backgroundImage=`linear-gradient(rgba(23,23,23,.45),rgba(23,23,23,.96)),url("${assetPath(merged.hero_image)}")`; }
  const projects = await getProjects();
  document.querySelectorAll('[data-projects]').forEach(target => {
    if (!projects.length) return;
    target.innerHTML = projects.slice(0, target.dataset.limit ? Number(target.dataset.limit) : 99).map(p => `<article class="card reveal show"><img class="card-img" src="${esc(p.image_url)}" alt="${esc(p.title)}"><div class="card-body"><span class="tag">${esc(p.category || 'Project')}</span><h3>${esc(p.title)}</h3><p class="muted">${esc(p.description || '')}</p>${p.project_url?`<a class="btn" style="margin-top:14px" href="${esc(p.project_url)}" target="_blank" rel="noreferrer">View project</a>`:''}</div></article>`).join('');
  });
  const arts = await getArtboards();
  document.querySelectorAll('[data-artboards]').forEach(target => { if(!arts.length) return; target.innerHTML = arts.map(a=>`<img src="${esc(a.image_url)}" alt="${esc(a.title||'Artboard')}">`).join(''); });
}

document.addEventListener('DOMContentLoaded', renderPublicSite);
