// CS Tool site — hero globe, illustrative console, workspace explorer, setup tabs.
const root = document.documentElement;
const reduce = root.classList.contains('rm');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid) n.append(kid);
  return n;
}

/* ---------------- Workspaces (mirrors dashboard/lib/navigation.js) ---------------- */
const WORKSPACES = [
  { name: 'Home', rgb: '60,242,200', summary: 'Start here: the health of everything you run, and what needs attention now.', pages: [
    ['Overview', 'Monitor infrastructure health and the issues that need attention.'],
    ['Alerts', 'Review active alerts and follow up on operational issues.'],
    ['Notifications', 'Manage notification channels and delivery preferences.'],
  ] },
  { name: 'Observe', rgb: '92,200,255', summary: 'Dig into performance, map apps to servers, and compare machines side by side.', pages: [
    ['Products', 'Organize products and their infrastructure.'],
    ['Apps', 'Manage applications and their linked servers.'],
    ['Topology', 'Explore infrastructure connections and dependencies.'],
    ['Performance', 'Investigate resource usage and performance trends.'],
    ['Service metrics', 'Inspect application and service telemetry.'],
    ['PHP-FPM', 'Monitor PHP-FPM pools and worker activity.'],
    ['Compare', 'Compare server metrics side by side.'],
  ] },
  { name: 'Secure', rgb: '255,93,108', summary: 'Security events, vulnerabilities and posture across the fleet, with full access control.', pages: [
    ['Security', 'Review security events across your infrastructure.'],
    ['Vulnerability report', 'Review detected vulnerabilities and remediation priorities.'],
    ['Analysis', 'Investigate security findings and server posture.'],
    ['Audit log', 'Review recorded administrative and delivery activity.', 'admin'],
    ['Access control', 'Manage access permissions for users and products.', 'admin'],
  ] },
  { name: 'Deliver', rgb: '255,111,97', summary: 'Plan, approve and ship releases, and keep the agents themselves up to date.', pages: [
    ['Release dashboard', 'Review delivery activity and release status.'],
    ['Repositories', 'Manage source repositories used by your releases.'],
    ['Releases', 'Plan releases and track their progress.'],
    ['Release board', 'Track releases across workflow stages.'],
    ['Deployments', 'Monitor deployment jobs and their outcomes.'],
    ['Release metrics', 'Review delivery performance and release trends.'],
    ['Release calendar', 'View releases and scheduled delivery activity.'],
    ['Environments', 'Manage the environments used for delivery.'],
    ['Workflow configuration', 'Configure release workflow stages and transitions.', 'admin'],
    ['Agent updates', 'Manage monitoring agent versions and updates.', 'admin'],
    ['AI assistant', 'Get assistance with operational and delivery questions.'],
  ] },
  { name: 'FinOps', rgb: '255,181,71', summary: 'What your cloud costs, per project and service, and where money is being wasted.', pages: [
    ['Billing dashboard', 'Review infrastructure costs and billing trends.'],
    ['Services', 'Manage billable services and their product assignments.'],
    ['Service types', 'Manage service categories and billing units.'],
    ['Monthly entry', 'Record monthly service usage and costs.'],
    ['Billing history', 'Review and manage recorded billing entries.'],
    ['Billing report', 'Explore billing totals by period and product.'],
  ] },
  { name: 'Admin', rgb: '177,151,252', summary: 'Connect servers, manage people and roles, and secure your own account.', pages: [
    ['Setup guide', 'Set up monitoring agents and connect infrastructure.'],
    ['Users', 'Manage user accounts and roles.', 'admin'],
    ['My profile', 'Manage your account security, passkeys, and trusted devices.'],
    ['Settings', 'Manage appearance and view system configuration.'],
  ] },
];

function initWorkspaces() {
  const tabs = document.getElementById('ws-tabs');
  const panel = document.getElementById('ws-panel');
  const buttons = WORKSPACES.map((w, i) => {
    const b = el('button', { type: 'button', role: 'tab', id: `ws-${w.name}`, 'aria-controls': 'ws-panel', 'aria-selected': 'false', tabindex: '-1' },
      document.createTextNode(w.name), el('span', { text: String(w.pages.length).padStart(2, '0') }));
    b.style.setProperty('--ws-rgb', w.rgb);
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = (i + d + WORKSPACES.length) % WORKSPACES.length;
      select(n);
      buttons[n].focus();
    });
    tabs.append(b);
    return b;
  });
  function select(i) {
    const w = WORKSPACES[i];
    buttons.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    panel.setAttribute('aria-labelledby', buttons[i].id);
    panel.style.setProperty('--ws-rgb', w.rgb);
    panel.replaceChildren(
      el('span', { class: 'mono', text: `Workspace · ${w.pages.length} pages` }),
      el('h3', { text: w.name }),
      el('p', { text: w.summary }),
      el('ul', { class: 'ws-pages' }, ...w.pages.map(([label, desc, role], k) => {
        const li = el('li', {}, el('b', {}, el('i'), document.createTextNode(label), role ? el('span', { class: 'role', text: role }) : null), el('small', { text: desc }));
        li.style.setProperty('--i', k);
        return li;
      })),
    );
  }
  select(0);
}

/* ---------------- Illustrative console ---------------- */
function initConsole() {
  const rowsEl = document.getElementById('console-rows');
  const feedEl = document.getElementById('console-feed');
  const servers = [
    { name: 'web-01', cpu: 34 }, { name: 'web-02', cpu: 41 }, { name: 'api-01', cpu: 58 },
    { name: 'db-01', cpu: 72 }, { name: 'worker-01', cpu: 88 },
  ].map((s) => ({ ...s, hist: Array.from({ length: 24 }, () => s.cpu + (Math.random() - .5) * 14) }));
  const rows = servers.map((s) => {
    const st = el('span', { class: 'st' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 92 22');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    svg.append(line);
    const pct = el('span', { class: 'pct' });
    rowsEl.append(el('li', {}, st, el('span', { text: s.name }), svg, pct));
    return { s, st, line, pct };
  });
  const draw = () => rows.forEach(({ s, st, line, pct }) => {
    const v = s.hist[s.hist.length - 1];
    const level = v > 85 ? 'crit' : v > 70 ? 'warn' : 'ok';
    st.className = 'st st-' + level;
    line.setAttribute('stroke', level === 'crit' ? '#ff5d6c' : level === 'warn' ? '#ffb547' : '#3cf2c8');
    line.setAttribute('points', s.hist.map((h, i) => `${(i / (s.hist.length - 1)) * 92},${22 - clamp(h, 0, 100) * .22}`).join(' '));
    pct.textContent = `${Math.round(v)}%`;
  });
  const step = () => servers.forEach((s) => {
    const last = s.hist[s.hist.length - 1];
    const pull = (s.cpu - last) * .25;
    s.hist.push(clamp(last + pull + (Math.random() - .5) * 16, 4, 99));
    s.hist.shift();
  });

  const EVENTS = [
    ['crit', 'ssh', 'Failed login burst from 203.0.113.24'],
    ['warn', 'sudo', 'sudo by deploy on api-01'],
    ['info', 'ufw', 'Blocked 198.51.100.7 → :22'],
    ['warn', 'disk', '/var at 81% on db-01'],
    ['info', 'ssh', 'Accepted key for ops on web-02'],
    ['crit', 'cpu', 'worker-01 over CPU threshold'],
    ['info', 'ufw', 'Blocked 203.0.113.90 → :3306'],
  ];
  let k = 0;
  const pushEvent = () => {
    const [sev, src, msg] = EVENTS[k++ % EVENTS.length];
    feedEl.prepend(el('li', {}, el('b', { class: 's-' + sev, text: src.toUpperCase().padEnd(4, ' ') }), el('span', { text: msg })));
    while (feedEl.children.length > 3) feedEl.lastChild.remove();
  };
  draw();
  for (let i = 0; i < 3; i++) pushEvent();
  if (reduce) return;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(rowsEl);
  setInterval(() => { if (visible && !document.hidden) { step(); draw(); } }, 1200);
  setInterval(() => { if (visible && !document.hidden) pushEvent(); }, 2600);
}

/* ---------------- Setup tabs + copy buttons ---------------- */
function initStart() {
  const tabs = [...document.querySelectorAll('.start-tabs [role="tab"]')];
  const select = (t) => tabs.forEach((x) => {
    const on = x === t;
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      const n = tabs[(i + d + tabs.length) % tabs.length];
      select(n); n.focus();
    });
  });
  document.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', async () => {
    const text = b.parentElement.querySelector('code').innerText;
    try {
      await navigator.clipboard.writeText(text);
      b.textContent = 'Copied'; b.classList.add('done');
    } catch {
      b.textContent = 'Select & copy';
    }
    setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1800);
  }));
}

/* ---------------- Terminal: type the install steps when it scrolls into view ---------------- */
function initTerminal() {
  const code = document.querySelector('#term code');
  if (!code || reduce) return;
  const lines = code.innerHTML.split('\n');
  code.innerHTML = '';
  const cursor = el('span', { class: 'cursor' });
  let started = false;
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting || started) return;
    started = true; obs.disconnect();
    let i = 0;
    const next = () => {
      if (i >= lines.length) { code.append(cursor); return; }
      code.insertAdjacentHTML('beforeend', (i ? '\n' : '') + lines[i]);
      code.append(cursor);
      i++;
      setTimeout(next, lines[i - 1].includes('class="c"') ? 260 : 520);
    };
    next();
  }, { threshold: .4 }).observe(code);
}

/* ---------------- Reveal, progress, menu ---------------- */
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -10% 0px', threshold: .08 });
document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
addEventListener('scroll', () => {
  root.style.setProperty('--p', (scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(4));
}, { passive: true });
const nav = document.getElementById('nav');
const menuBtn = nav.querySelector('.menu-btn');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

/* ---------------- Self-host files: show the real downloads, so they can't disagree ---------------- */
function initFiles() {
  document.querySelectorAll('code[data-src]').forEach((code) => {
    fetch(code.dataset.src, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((text) => {
        code.replaceChildren(...text.split('\n').flatMap((line, i) => {
          const parts = i ? [document.createTextNode('\n')] : [];
          const m = /^(\s*)(#.*)$/.exec(line);
          if (m) { parts.push(document.createTextNode(m[1])); const c = document.createElement('span'); c.className = 'c'; c.textContent = m[2]; parts.push(c); }
          else parts.push(document.createTextNode(line));
          return parts;
        }));
      })
      .catch(() => { /* keep the fallback link */ });
  });
}

initWorkspaces();
initFiles();
initConsole();
initStart();
initTerminal();

/* ---------------- Hero globe (Three.js, loaded lazily; the page works without it) ---------------- */
import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js')
  .then((THREE) => initGlobe(THREE))
  .catch((err) => console.warn('Globe unavailable', err));

function initGlobe(THREE) {
  const canvas = document.getElementById('globe');
  const small = innerWidth < 760 || matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, 0, 10);

  const R = 2.4;
  const CORAL = 0xff6f61, TEAL = 0x3cf2c8, AMBER = 0xffb547, CRIT = 0xff5d6c;
  const world = new THREE.Group();
  world.rotation.set(.38, -.6, .08);
  scene.add(world);

  // glow texture
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.25, 'rgba(255,255,255,.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const GLOW = new THREE.CanvasTexture(c);
  const glow = (color, size, opacity) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(size); return s;
  };

  // planet body with a coral rim
  world.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(CORAL) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main(){ float f = 1. - max(dot(vN, vV), 0.); vec3 col = vec3(.02,.03,.06) + uColor * pow(f, 3.) * .9; gl_FragColor = vec4(col, 1.); }',
  })));
  const halo = glow(CORAL, 9, .22);
  scene.add(halo);

  // graticule
  const gratMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .07 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = []; const r = R * 1.002 * Math.cos(lat * Math.PI / 180), y = R * 1.002 * Math.sin(lat * Math.PI / 180);
    for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gratMat));
  }
  for (let lon = 0; lon < 180; lon += 30) {
    const pts = [];
    for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R * 1.002, Math.sin(a) * R * 1.002, 0)); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gratMat);
    l.rotation.y = lon * Math.PI / 180;
    world.add(l);
  }

  // surface dots
  {
    const n = small ? 900 : 1800, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const phi = Math.acos(1 - 2 * (i + .5) / n), th = Math.PI * (1 + Math.sqrt(5)) * (i + .5);
      pos.set([Math.cos(th) * Math.sin(phi) * R * 1.004, Math.cos(phi) * R * 1.004, Math.sin(th) * Math.sin(phi) * R * 1.004], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    world.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9aa6c4, size: .025, transparent: true, opacity: .45, depthWrite: false })));
  }

  // servers + the central backend (hub)
  const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const onSphere = (r) => { const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u); return new THREE.Vector3(s * Math.cos(a) * r, u * r, s * Math.sin(a) * r); };
  const hub = new THREE.Vector3(.6, 1.1, 1.9).normalize().multiplyScalar(R * 1.01);
  const hubMesh = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 16), new THREE.MeshBasicMaterial({ color: CORAL }));
  hubMesh.position.copy(hub);
  const hubGlow = glow(CORAL, 1.1, .9); hubGlow.position.copy(hub);
  world.add(hubMesh, hubGlow);

  const N = small ? 18 : 28;
  const servers = Array.from({ length: N }, (_, i) => {
    const p = onSphere(R * 1.01);
    const status = i % 9 === 4 ? 'crit' : i % 5 === 2 ? 'warn' : 'ok';
    const color = status === 'crit' ? CRIT : status === 'warn' ? AMBER : TEAL;
    const m = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 10), new THREE.MeshBasicMaterial({ color }));
    m.position.copy(p);
    const gl = glow(color, status === 'crit' ? .7 : .45, .8); gl.position.copy(p);
    world.add(m, gl);
    // arc to the hub
    const mid = p.clone().add(hub).multiplyScalar(.5);
    mid.normalize().multiplyScalar(R + p.distanceTo(hub) * .38);
    const curve = new THREE.QuadraticBezierCurve3(p, mid, hub);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
      new THREE.LineBasicMaterial({ color: status === 'ok' ? CORAL : color, transparent: true, opacity: status === 'ok' ? .14 : .32, blending: THREE.AdditiveBlending, depthWrite: false }));
    world.add(line);
    return { p, status, gl, curve, phase: rand(), speed: .22 + rand() * .3 };
  });

  // packets travelling to the backend
  const packets = servers.filter((_, i) => i % (small ? 2 : 1) === 0).map((s) => {
    const sp = glow(s.status === 'crit' ? CRIT : s.status === 'warn' ? AMBER : 0xffd0c9, .32, .95);
    world.add(sp);
    return { s, sp };
  });

  // radar sweep ring
  const radar = new THREE.Mesh(new THREE.RingGeometry(R * 1.18, R * 1.62, 128, 1), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(CORAL) } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vP;
      void main(){
        float a = atan(vP.y, vP.x);
        float sweep = mod(a - uTime * 1.1, 6.28318) / 6.28318;
        float trail = pow(1. - sweep, 6.);
        float r = length(vP);
        float rings = smoothstep(.02, 0., abs(fract(r * 2.2) - .5) - .47);
        float alpha = trail * .5 + rings * .08;
        gl_FragColor = vec4(uColor, alpha);
      }`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  radar.rotation.x = -Math.PI / 2 + .25;
  scene.add(radar);

  // faint stars
  {
    const n = small ? 250 : 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - .5) * 40, (Math.random() - .5) * 24, -8 - Math.random() * 20], i * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfd8ff, size: .06, transparent: true, opacity: .5, depthWrite: false })));
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // The canvas spans the whole window, so frame the globe from the window's shape: park it on the
    // right and keep the whole sphere (radius ~2.8 with glow) inside the view at any size. Only the
    // faint ring may run off the screen edge.
    const RAD = 2.8, aspect = w / h;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let z, x, y = 0;
    if (innerWidth > 1080) {
      z = Math.max(10, RAD / (0.66 * tanH)); // sphere never taller than ~2/3 of the window
      const halfW = z * tanH * aspect;
      x = Math.max(0, Math.min(halfW - RAD, halfW * 0.46));
    } else {
      // stacked layout: a smaller globe in the upper right, behind the intro
      z = Math.max(11, (RAD * 2) / (tanH * aspect));
      const halfW = z * tanH * aspect, halfH = z * tanH;
      x = halfW - RAD * 1.1;
      y = halfH * 0.3;
    }
    camera.position.z = z;
    [world, halo, radar].forEach((o) => o.position.set(x, y, 0));
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth - .5; pointer.y = e.clientY / innerHeight - .5; }, { passive: true });

  const clock = new THREE.Clock();
  let t = 0;
  let visible = true;
  let raf = 0;
  const frame = () => {
    const dt = Math.min(clock.getDelta(), .05);
    t += dt;
    world.rotation.y += dt * .07;
    pointer.sx += (pointer.x - pointer.sx) * .05;
    pointer.sy += (pointer.y - pointer.sy) * .05;
    camera.position.x = pointer.sx * .8;
    camera.position.y = -pointer.sy * .5;
    camera.lookAt(0, 0, 0);
    radar.material.uniforms.uTime.value = t;
    servers.forEach((s) => {
      if (s.status === 'crit') s.gl.material.opacity = .5 + .5 * Math.sin(t * 5 + s.phase * 6);
    });
    packets.forEach(({ s, sp }) => {
      const u = (t * s.speed + s.phase) % 1;
      sp.position.copy(s.curve.getPoint(u));
      sp.material.opacity = Math.sin(u * Math.PI) * .95;
    });
    hubGlow.scale.setScalar(1.1 + Math.sin(t * 3) * .15);
    renderer.render(scene, camera);
    raf = visible && !reduce ? requestAnimationFrame(frame) : 0;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf && !reduce) { clock.getDelta(); raf = requestAnimationFrame(frame); }
  }).observe(canvas);
  frame();
  requestAnimationFrame(() => root.classList.add('globe-ready'));
}
