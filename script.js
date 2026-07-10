'use strict';

/* ── CONFIG ─────────────────────────────────────────── */
const SB_URL  = 'https://qejdkzmanvcolfignqiq.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlamRrem1hbnZjb2xmaWducWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjAyMjcsImV4cCI6MjA5NzIzNjIyN30.XSGLfFlU-KgiRGuH-IjyITFRDvwIidqjzOQ_eXX8CSo';
const ADMIN_PW = 'victorh4k2025';

let sb = null;
try { if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY); } catch(e){}

/* ══════════════════════════════════════════════════════
   LOADER
══════════════════════════════════════════════════════ */
(function(){
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const l = document.getElementById('loader');
    if (l) l.classList.add('out');
    document.body.style.overflow = '';
    setTimeout(() => { if (l) l.style.display = 'none'; }, 900);
  }, 2200);
})();

/* ══════════════════════════════════════════════════════
   CURSOR
══════════════════════════════════════════════════════ */
(function(){
  const cur = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  if (!cur) return;
  let mx = 0, my = 0, cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function loop(){
    cx += (mx - cx) * 0.1;
    cy += (my - cy) * 0.1;
    cur.style.left = cx + 'px';
    cur.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  })();
})();

/* ══════════════════════════════════════════════════════
   THREE.JS — HELIOS ORB
   Dark background + large glowing energy sphere
   with atmospheric corona, star field and subtle
   parallax on mouse move.
══════════════════════════════════════════════════════ */
(function(){
  if (!window.THREE) return;

  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080808);
  scene.fog = new THREE.FogExp2(0x080808, 0.035);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 6);

  /* ── STAR FIELD ── */
  const starGeo = new THREE.BufferGeometry();
  const starCount = 2400;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPos[i] = (Math.random() - 0.5) * 120;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.06,
    transparent: true, opacity: 0.55,
    sizeAttenuation: true
  });
  scene.add(new THREE.Points(starGeo, starMat));

  /* ── CORE SPHERE ── */
  const coreGeo = new THREE.SphereGeometry(1.4, 64, 64);
  const coreMat = new THREE.MeshStandardMaterial({
    color:       new THREE.Color(0x0a0a12),
    emissive:    new THREE.Color(0xc8ff00),
    emissiveIntensity: 0.08,
    roughness: 0.6, metalness: 0.3,
    wireframe: false
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  /* ── WIREFRAME OVERLAY ── */
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xc8ff00, wireframe: true,
    transparent: true, opacity: 0.06
  });
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.42, 24, 24),
    wireMat
  );
  scene.add(wire);

  /* ── CORONA GLOW (additive sprite) ── */
  function makeGlow(radius, color, opacity) {
    const size = radius * 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(128,128,0, 128,128,128);
    g.addColorStop(0,   color.replace('1)', `${opacity})`));
    g.addColorStop(0.3, color.replace('1)', `${opacity * 0.5})`));
    g.addColorStop(1,   color.replace('1)', '0)'));
    ctx.fillStyle = g;
    ctx.fillRect(0,0,256,256);
    const tex = new THREE.CanvasTexture(cv);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(size);
    return sprite;
  }

  const glow1 = makeGlow(4.5, 'rgba(200,255,0,1)', 0.18);
  const glow2 = makeGlow(6.5, 'rgba(80,200,255,1)', 0.08);
  const glow3 = makeGlow(3.0, 'rgba(255,255,200,1)', 0.22);
  scene.add(glow1, glow2, glow3);

  /* ── RING ── */
  const ringGeo = new THREE.TorusGeometry(2.2, 0.008, 4, 180);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc8ff00, transparent: true, opacity: 0.25
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.4;
  scene.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.7, 0.004, 4, 180),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.1 })
  );
  ring2.rotation.x = Math.PI / 2.1;
  ring2.rotation.y = 0.4;
  scene.add(ring2);

  /* ── ORBITING PARTICLES ── */
  const orbitCount = 120;
  const orbitGeo = new THREE.BufferGeometry();
  const oPos = new Float32Array(orbitCount * 3);
  const oAngles = [];
  for (let i = 0; i < orbitCount; i++) {
    const angle  = (i / orbitCount) * Math.PI * 2;
    const r      = 1.55 + (Math.random() - 0.5) * 0.6;
    const tilt   = (Math.random() - 0.5) * 0.8;
    oAngles.push({ angle, r, tilt, speed: 0.003 + Math.random() * 0.004 });
    oPos[i*3]   = Math.cos(angle) * r;
    oPos[i*3+1] = tilt;
    oPos[i*3+2] = Math.sin(angle) * r;
  }
  orbitGeo.setAttribute('position', new THREE.BufferAttribute(oPos, 3));
  const orbitMat = new THREE.PointsMaterial({
    color: 0xc8ff00, size: 0.025,
    transparent: true, opacity: 0.7,
    sizeAttenuation: true
  });
  const orbitPoints = new THREE.Points(orbitGeo, orbitMat);
  scene.add(orbitPoints);

  /* ── LIGHTS ── */
  const ambLight = new THREE.AmbientLight(0x111111, 1);
  scene.add(ambLight);
  const pointLight = new THREE.PointLight(0xc8ff00, 3, 12);
  pointLight.position.set(2, 2, 3);
  scene.add(pointLight);
  const pointLight2 = new THREE.PointLight(0x00d4ff, 1.5, 10);
  pointLight2.position.set(-3, -1, 2);
  scene.add(pointLight2);

  /* ── MOUSE PARALLAX ── */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── RESIZE ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── ANIMATION LOOP ── */
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Core slow rotation
    core.rotation.y  = t * 0.08;
    core.rotation.x  = t * 0.03;
    wire.rotation.y  = -t * 0.05;
    wire.rotation.x  = t * 0.02;

    // Pulsing glow
    const pulse = 1 + Math.sin(t * 1.2) * 0.08;
    glow1.scale.setScalar(4.5 * 2 * pulse);
    glow3.scale.setScalar(3.0 * 2 * (1 + Math.sin(t * 2.1) * 0.06));
    coreMat.emissiveIntensity = 0.08 + Math.sin(t * 1.5) * 0.03;

    // Rings
    ring.rotation.z  = t * 0.12;
    ring2.rotation.z = -t * 0.07;

    // Orbiting particles
    const pos = orbitGeo.attributes.position;
    for (let i = 0; i < orbitCount; i++) {
      oAngles[i].angle += oAngles[i].speed;
      const { angle, r, tilt } = oAngles[i];
      pos.array[i*3]   = Math.cos(angle) * r;
      pos.array[i*3+1] = tilt + Math.sin(t * 0.5 + i) * 0.05;
      pos.array[i*3+2] = Math.sin(angle) * r;
    }
    pos.needsUpdate = true;

    // Camera parallax
    camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    // Scroll: move orb up as user scrolls
    const scrollY = window.scrollY;
    const maxScroll = window.innerHeight;
    const progress = Math.min(scrollY / maxScroll, 1);
    core.position.y = -progress * 1.2;
    glow1.position.y = core.position.y;
    glow2.position.y = core.position.y;
    glow3.position.y = core.position.y;
    ring.position.y  = core.position.y * 0.8;
    ring2.position.y = core.position.y * 0.6;
    orbitPoints.position.y = core.position.y;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ══════════════════════════════════════════════════════
   LENIS SMOOTH SCROLL
══════════════════════════════════════════════════════ */
let lenis;
if (window.Lenis) {
  lenis = new Lenis({ duration: 1.5, easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t)) });
  function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

/* ══════════════════════════════════════════════════════
   GSAP SCROLL ANIMATIONS
══════════════════════════════════════════════════════ */
(function(){
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Section labels + titles
  gsap.utils.toArray('.section-label').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%' },
      x: -24, opacity: 0, duration: .7, ease: 'power2.out'
    });
  });

  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      y: 40, opacity: 0, duration: .9, ease: 'power2.out', delay: .1
    });
  });

  // Services
  gsap.from('.svc', {
    scrollTrigger: { trigger: '.services-grid', start: 'top 78%' },
    y: 40, opacity: 0, stagger: .1, duration: .7, ease: 'power2.out'
  });

  // Review stats
  gsap.from('.rv-stat', {
    scrollTrigger: { trigger: '.rv-stats', start: 'top 85%' },
    y: 24, opacity: 0, stagger: .08, duration: .6, ease: 'power2.out'
  });

  // Contact links
  gsap.from('.contact-link', {
    scrollTrigger: { trigger: '.contact-links', start: 'top 85%' },
    x: -24, opacity: 0, stagger: .1, duration: .6, ease: 'power2.out'
  });

  // Footer
  gsap.from('footer', {
    scrollTrigger: { trigger: 'footer', start: 'top 92%' },
    y: 24, opacity: 0, duration: .6
  });
})();

/* ══════════════════════════════════════════════════════
   SCROLL REVEAL — Project items
══════════════════════════════════════════════════════ */
(function(){
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.project-item').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.1) + 's';
    io.observe(el);
  });
})();

/* ══════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════ */
const navEl = document.getElementById('nav');
window.addEventListener('scroll', () => {
  navEl.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ══════════════════════════════════════════════════════
   HAMBURGER
══════════════════════════════════════════════════════ */
const hbgEl = document.getElementById('hbg');
const mobEl = document.getElementById('mob-menu');
if (hbgEl) hbgEl.addEventListener('click', () => {
  hbgEl.classList.toggle('open');
  mobEl.classList.toggle('open');
});
function closeMob(){
  if (hbgEl) hbgEl.classList.remove('open');
  if (mobEl) mobEl.classList.remove('open');
}

/* ══════════════════════════════════════════════════════
   SMOOTH SCROLL ANCHORS
══════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMob();
    if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ══════════════════════════════════════════════════════
   STAR PICKER
══════════════════════════════════════════════════════ */
let selStar = 0;
document.querySelectorAll('#srow .ss').forEach(s => {
  s.addEventListener('mouseover', () => {
    const v = +s.dataset.v;
    document.querySelectorAll('#srow .ss').forEach(x => x.classList.toggle('on', +x.dataset.v <= v));
  });
  s.addEventListener('mouseout', () => {
    document.querySelectorAll('#srow .ss').forEach(x => x.classList.toggle('on', +x.dataset.v <= selStar));
  });
  s.addEventListener('click', () => {
    selStar = +s.dataset.v;
    document.querySelectorAll('#srow .ss').forEach(x => x.classList.toggle('on', +x.dataset.v <= selStar));
  });
});

/* ══════════════════════════════════════════════════════
   CHAR COUNTER
══════════════════════════════════════════════════════ */
const rvTa = document.getElementById('rv-txt');
if (rvTa) rvTa.addEventListener('input', () => {
  const cc = document.getElementById('cc');
  if (cc) cc.textContent = `(${rvTa.value.length}/400)`;
});

/* ══════════════════════════════════════════════════════
   SUBMIT REVIEW
══════════════════════════════════════════════════════ */
async function submitRv() {
  const name = document.getElementById('rv-name').value.trim();
  const text = rvTa ? rvTa.value.trim() : '';
  const msg  = document.getElementById('rv-msg');
  if (!name) { msg.className='fmsg err'; msg.textContent='Ingresa tu nombre.'; return; }
  if (!selStar) { msg.className='fmsg err'; msg.textContent='Selecciona una calificación.'; return; }
  if (text.length < 10) { msg.className='fmsg err'; msg.textContent='Escribe al menos 10 caracteres.'; return; }
  const btn = document.querySelector('#reviews .submit-btn');
  btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    if (sb) await sb.from('reviews').insert([{ name, rating: selStar, text, status: 'pending', featured: false, created_at: new Date().toISOString() }]);
  } catch(e){}
  msg.className = 'fmsg ok'; msg.textContent = '✅ ¡Gracias! Tu opinión será revisada pronto.';
  document.getElementById('rv-name').value = '';
  if (rvTa) rvTa.value = '';
  const cc = document.getElementById('cc');
  if (cc) cc.textContent = '(0/400)';
  selStar = 0;
  document.querySelectorAll('#srow .ss').forEach(s => s.classList.remove('on'));
  btn.disabled = false; btn.textContent = 'Enviar opinión →';
}

/* ══════════════════════════════════════════════════════
   LOAD APPROVED REVIEWS
══════════════════════════════════════════════════════ */
async function loadRv() {
  if (!sb) return;
  try {
    const { data } = await sb.from('reviews').select('*').eq('status','approved').order('created_at',{ascending:false}).limit(5);
    if (!data || !data.length) return;
    const wrap = document.querySelector('.reviews-marquee');
    if (!wrap) return;
    data.forEach(r => {
      const stars = '★'.repeat(r.rating||5) + '☆'.repeat(5-(r.rating||5));
      const d = new Date(r.created_at).toLocaleDateString('es',{year:'numeric',month:'short'});
      const el = document.createElement('article'); el.className = 'rv';
      el.innerHTML = `<div class="rv-stars">${stars}</div><p class="rv-text">"${esc(r.text||r.comment||'')}"</p><div class="rv-author">${esc(r.name)}<span>${d}</span></div>`;
      wrap.appendChild(el);
    });
  } catch(e){}
}
loadRv();

/* ══════════════════════════════════════════════════════
   CONTACT → WHATSAPP
══════════════════════════════════════════════════════ */
function submitCt() {
  const n = document.getElementById('ct-n').value.trim();
  const m = document.getElementById('ct-m').value.trim();
  if (!n || !m) { alert('Completa nombre y mensaje.'); return; }
  const e2 = document.getElementById('ct-e').value.trim();
  const p  = document.getElementById('ct-p').value.trim();
  const txt = `Hola Victor! 👋\n\n👤 ${n}\n${p?'📱 '+p+'\n':''}${e2?'📧 '+e2+'\n':''}\n📝 ${m}`;
  window.open('https://wa.me/573026021232?text=' + encodeURIComponent(txt), '_blank');
}

/* ══════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════ */
function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════════════
   ADMIN
══════════════════════════════════════════════════════ */
if (location.search.includes('admin')) {
  const pw = prompt('Password:');
  if (pw === ADMIN_PW) {
    document.getElementById('adm-modal').classList.add('open');
    admLoad('pending');
  }
}
const admModalEl = document.getElementById('adm-modal');
if (admModalEl) admModalEl.addEventListener('click', e => { if (e.target === admModalEl) admModalEl.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key==='Escape') admModalEl?.classList.remove('open'); });

let admCur = 'pending';
function admTab(t, btn){
  admCur = t;
  document.querySelectorAll('.adm-tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  admLoad(t);
}
async function admLoad(status){
  const list = document.getElementById('adm-list');
  if (!list) return;
  list.innerHTML = '<div class="adm-empty">Cargando...</div>';
  if (!sb){ list.innerHTML = '<div class="adm-empty">Supabase no disponible.</div>'; return; }
  try {
    const { data, error } = await sb.from('reviews').select('*').eq('status',status).order('created_at',{ascending:false});
    if (error) throw error;
    if (!data||!data.length){ list.innerHTML='<div class="adm-empty">Sin opiniones.</div>'; return; }
    list.innerHTML = data.map(r=>`
      <div class="adm-item" id="ai-${r.id}">
        <div>
          <div class="ai-name">${esc(r.name)}</div>
          <div class="ai-stars">${'★'.repeat(r.rating||5)}</div>
          <div class="ai-text">"${esc(r.text||r.comment||'')}"</div>
          <div style="font-size:10px;color:var(--tx3);margin-top:4px">${new Date(r.created_at).toLocaleString('es')}</div>
        </div>
        <div class="adm-acts">
          ${status!=='approved'?`<button class="ab ab-ok" onclick="admAct('${r.id}','approve')">✓</button>`:''}
          ${status!=='rejected'?`<button class="ab ab-no" onclick="admAct('${r.id}','reject')">✗</button>`:''}
          <button class="ab ab-st" onclick="admAct('${r.id}','feature')">⭐</button>
          <button class="ab ab-dl" onclick="admAct('${r.id}','del')">🗑</button>
        </div>
      </div>`).join('');
  } catch(e){ list.innerHTML=`<div class="adm-empty">Error: ${esc(e.message)}</div>`; }
}
async function admAct(id, action){
  if (!sb) return;
  try {
    if (action==='del'){ if(!confirm('¿Eliminar?'))return; await sb.from('reviews').delete().eq('id',id); }
    else if (action==='approve') await sb.from('reviews').update({status:'approved'}).eq('id',id);
    else if (action==='reject')  await sb.from('reviews').update({status:'rejected'}).eq('id',id);
    else if (action==='feature'){
      const {data} = await sb.from('reviews').select('featured').eq('id',id).single();
      await sb.from('reviews').update({featured:!(data&&data.featured)}).eq('id',id);
    }
    document.getElementById('ai-'+id)?.remove();
  } catch(e){ alert('Error: '+e.message); }
}
