/* =====================================================================
   JELAJAH 3D — walkthrough realistis (halaman terpisah dari editor)
   ---------------------------------------------------------------------
   Membaca data yang SAMA dengan editor (localStorage lalu js/data/denah-awal.js
   sebagai cadangan) lewat js/core/geometri.js, tanpa mengubah apa pun — halaman
   ini read-only. Lihat README.md bagian "Jelajah 3D" untuk kontrolnya.
   ===================================================================== */
(function () {
  const HB = window.HB, G = HB.geo, u = HB.u;
  const LS = 'homebuilder-lokal.v2';

  function loadState() {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) { const s = G.normalize(JSON.parse(raw)); if (s) return s; }
    } catch (e) { /* abaikan, pakai denah awal */ }
    return G.normalize(u.clone(HB.DENAH_AWAL));
  }
  const state = loadState(), S = state.site;

  const $ = id => document.getElementById(id);
  const stage = $('wtStage'), canvas = $('wtCanvas'), startEl = $('wtStart'), startText = $('wtStartText'),
    startBtn = $('wtStartBtn'), hintEl = $('wtHint'), crossEl = $('wtCrosshair'), roomLabelEl = $('wtRoomLabel'),
    joyMove = $('wtJoyMove'), joyKnob = joyMove && joyMove.querySelector('.wtJoyKnob'), joyLook = $('wtJoyLook');

  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  startText.textContent = isTouch
    ? 'Geser joystick kiri bawah untuk jalan. Geser layar kanan untuk menoleh.'
    : 'Klik tombol di bawah untuk mengunci kursor.\nWASD / panah = jalan, Shift = lari, mouse = menoleh, Esc = lepas kursor.';

  const ok = typeof THREE !== 'undefined';
  if (!ok) { startText.textContent = 'Tampilan 3D gagal dimuat (cek folder vendor/three.min.js).'; startBtn.disabled = true; return; }

  /* ---------- tekstur prosedural (kanvas, tanpa gambar dari internet) ---------- */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16), clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  const mkCanvas = size => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
  function finish(c) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (THREE.sRGBEncoding != null) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function woodTexture(base) {
    const c = mkCanvas(256), ctx = c.getContext('2d'), plank = 32;
    ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += plank) {
      ctx.fillStyle = shade(base, (Math.random() - 0.5) * 16); ctx.fillRect(0, y, 256, plank - 2);
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, y + plank - 2, 256, 2);
      ctx.strokeStyle = 'rgba(0,0,0,.05)';
      for (let i = 0; i < 3; i++) { const gy = y + 3 + Math.random() * (plank - 6); ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(256, gy + (Math.random() - 0.5) * 8); ctx.stroke(); }
    }
    return finish(c);
  }
  function tileTexture(base) {
    const c = mkCanvas(256), ctx = c.getContext('2d'), n = 4, cell = 256 / n, pad = 5;
    ctx.fillStyle = '#c7cdd2'; ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ctx.fillStyle = shade(base, (Math.random() - 0.5) * 10);
      ctx.fillRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2);
    }
    return finish(c);
  }
  function speckle(base, size, amt, n) {
    const c = mkCanvas(size), ctx = c.getContext('2d');
    ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
    if (n) { for (let i = 0; i < n; i++) { ctx.fillStyle = shade(base, (Math.random() - 0.5) * amt); ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2); } return finish(c); }
    const id = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < id.data.length; i += 4) { const d = (Math.random() - 0.5) * amt; id.data[i] += d; id.data[i + 1] += d; id.data[i + 2] += d; }
    ctx.putImageData(id, 0, 0);
    return finish(c);
  }

  const matCache = {}, texCache = {};
  function stdMat(color, opts) {
    const k = color + JSON.stringify(opts || {});
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: 0 }, opts || {}));
    return matCache[k];
  }
  function baseTex(kind, color) {
    const k = kind + ':' + color;
    if (!texCache[k]) texCache[k] = kind === 'wood' ? woodTexture(color) : kind === 'tile' ? tileTexture(color)
      : kind === 'concrete' ? speckle(color, 128, 14) : kind === 'grass' ? speckle(color, 128, 30, 900) : speckle(color, 128, 8);
    return texCache[k];
  }
  function repeatedTex(kind, color, rx, rz) {
    const tex = baseTex(kind, color).clone();
    tex.needsUpdate = true; tex.repeat.set(Math.max(1, rx), Math.max(1, rz));
    return tex;
  }
  function floorMat(type, w, d) {
    const t = HB.TYPES[type] || HB.TYPES.publik;
    const kind = (type === 'basah' || type === 'dapur' || type === 'teras') ? 'tile'
      : type === 'carport' ? 'concrete' : type === 'taman' ? 'grass' : 'wood';
    const rough = kind === 'tile' ? .3 : kind === 'concrete' ? .9 : kind === 'grass' ? 1 : .55;
    return new THREE.MeshStandardMaterial({ map: repeatedTex(kind, t.c, w / 2, d / 2), roughness: rough });
  }
  function wallMatFor(len, h) {
    return new THREE.MeshStandardMaterial({ map: repeatedTex('wall', '#f3f1ea', len / 2, h / 2), roughness: .92 });
  }
  // sedikit variasi kilap per kategori katalog, biar tidak semua terasa plastik matte
  function finishHint(c) {
    if (c.kat === 'basah') return { roughness: .12 };
    if (c.kat === 'elektronik') return { roughness: .25, metalness: .15 };
    if (/kasur|sofa|kursi|karpet|sajadah/.test(c.id)) return { roughness: .95 };
    return { roughness: .6 };
  }

  /* ---------- scene, kamera, renderer ---------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bcd4e8');
  const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 150);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.sRGBEncoding != null) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping != null) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  scene.add(new THREE.HemisphereLight(0xdce8f5, 0x6b6150, 0.55));
  const sun = new THREE.DirectionalLight(0xfff3e0, 1.15);
  sun.position.set(S.w * 1.3, Math.max(S.w, S.d) * 1.4, -S.d * 0.25);
  sun.target.position.set(S.w / 2, 0, S.d / 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -S.w * 0.5, right: S.w * 1.5, top: S.d * 0.6, bottom: -S.d * 0.6, near: 1, far: Math.max(S.w, S.d) * 3.5 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshStandardMaterial({ map: repeatedTex('grass', '#7da35a', 70, 70), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(S.w / 2, -0.03, S.d / 2); ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- geometri rumah (dipakai ulang dari G.computeWalls, pola sama seperti js/view/view3d.js) ---------- */
  const root = new THREE.Group(); scene.add(root);
  const T = state.wallT, WALL_H = state.wallH;
  function addBox(parent, w, h, d, m, x, y, z, shadow) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, .01), Math.max(h, .01), Math.max(d, .01)), m);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    if (shadow) mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // lantai & plafon per ruang
  for (const r of state.rooms) {
    addBox(root, r.w, 0.04, r.d, floorMat(r.type, r.w, r.d), r.x + r.w / 2, 0.02, r.y + r.d / 2, false);
    if (r.walls) addBox(root, r.w, 0.04, r.d, stdMat('#f7f6f2', { roughness: .95 }), r.x + r.w / 2, WALL_H - 0.02, r.y + r.d / 2, false);
  }

  // atap: satu slab datar di atas bounding box seluruh ruang berdinding (lihat README: bentuk atap sesungguhnya
  // tetap perlu digambar terpisah oleh arsitek — ini hanya penanda supaya interior tidak terbuka ke langit)
  const walled = state.rooms.filter(r => r.walls);
  if (walled.length) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of walled) { minX = Math.min(minX, r.x); minY = Math.min(minY, r.y); maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.d); }
    const ov = 0.35;
    addBox(root, (maxX - minX) + ov * 2, 0.15, (maxY - minY) + ov * 2, stdMat('#5d6670', { roughness: .7 }),
      (minX + maxX) / 2, WALL_H + 0.25, (minY + maxY) / 2, true);
  }

  // dinding + bukaan — tinggi penuh per segmen (termasuk sekat rendah seperti partisi kisi), tanpa potong tampilan
  const { pieces, ops } = G.computeWalls(state);
  const capMat = stdMat('#2f3338', { roughness: .6 });
  const glassMat = stdMat('#bfe0f2', { transparent: true, opacity: .4, roughness: .05 });
  const woodMat = stdMat('#8a5a35', { roughness: .5 });
  function wallSeg(o, c, a, b, y0, y1, m, th) {
    th = th || T; if (y1 - y0 < .005 || b - a < .005) return;
    const L = b - a, h = y1 - y0;
    if (o === 'h') addBox(root, L, h, th, m, (a + b) / 2, y0 + h / 2, c, true);
    else addBox(root, th, h, L, m, c, y0 + h / 2, (a + b) / 2, true);
  }
  for (const p of pieces) {
    wallSeg(p.o, p.c, p.a, p.b, 0, p.h, wallMatFor(p.b - p.a, p.h), T);
    wallSeg(p.o, p.c, p.a, p.b, p.h, p.h + .03, capMat, T + .01);
  }
  for (const q of ops) {
    const t = q.op.type, top = q.h, wm = wallMatFor(q.b - q.a, top);
    if (t === 'door') {
      wallSeg(q.o, q.c, q.a, q.b, .04, .06, woodMat, T);
      if (top > 2.1) wallSeg(q.o, q.c, q.a, q.b, 2.1, top, wm, T);
    } else if (t === 'window') {
      wallSeg(q.o, q.c, q.a, q.b, 0, Math.min(.9, top), wm, T);
      if (top > .9) wallSeg(q.o, q.c, q.a, q.b, .9, Math.min(2.1, top), glassMat, .04);
      if (top > 2.1) wallSeg(q.o, q.c, q.a, q.b, 2.1, top, wm, T);
    } else if (top > 2.4) wallSeg(q.o, q.c, q.a, q.b, 2.4, top, wm, T);
  }

  // properti — pola sama seperti buildItem() di js/view/view3d.js
  function buildItem(it) {
    const b = G.itemBox(state, it); if (!b) return;
    const c = b.c, s = b.s, g = new THREE.Group();
    g.position.set(it.x, b.z1, it.y);
    g.rotation.y = (-b.rot * Math.PI) / 180;
    g.scale.set(s.w / c.w, s.h / c.h, s.d / c.d);
    const parts = c.parts && c.parts.length ? c.parts : [{ x: 0, y: 0, z: 0, w: c.w, d: c.d, h: c.h, c: c.c || '#9aa0a6' }];
    parts.forEach((p, i) => {
      const color = i === 0 && it.color ? it.color : p.c;
      const m = p.o ? stdMat(color, { transparent: true, opacity: p.o, roughness: .25 }) : stdMat(color, finishHint(c));
      addBox(g, p.w, p.h, p.d, m, p.x + p.w / 2 - c.w / 2, p.z + p.h / 2, p.y + p.d / 2 - c.d / 2, p.h > .04);
    });
    root.add(g);
  }
  state.items.forEach(buildItem);

  // lampu hangat per ruang berdinding (penting untuk ruang tanpa jendela luar: Dapur, Ruang Keluarga, Servis, Km.Mandi 2, dll.)
  for (const r of walled) {
    const light = new THREE.PointLight(0xffe3b0, 0.9, Math.max(r.w, r.d) * 2.2, 2);
    light.position.set(r.x + r.w / 2, WALL_H - 0.25, r.y + r.d / 2);
    scene.add(light);
    addBox(root, 0.18, 0.04, 0.18, stdMat('#fff6df', { emissive: '#fff2cc', emissiveIntensity: .8, roughness: .4 }),
      r.x + r.w / 2, WALL_H - 0.08, r.y + r.d / 2, false);
  }

  /* ---------- collision: dinding & properti sebagai rect [x1,x2,y1,y2] ----------
     (ditentukan dulu, dipakai juga untuk mencari titik awal yang bebas di bawah)
     karpet/sajadah (lantai:true) boleh diinjak; barang terpasang tinggi (z1 ≥ 1.5 m — skylight,
     exhaust, kabinet gantung, AC) dilewati karena pemain berjalan di bawahnya. */
  const RADIUS = 0.28;
  const wallRects = pieces.map(p => p.o === 'h'
    ? { x1: p.a - T / 2, x2: p.b + T / 2, y1: p.c - T / 2, y2: p.c + T / 2 }
    : { x1: p.c - T / 2, x2: p.c + T / 2, y1: p.a - T / 2, y2: p.b + T / 2 });
  const itemRects = state.items.map(it => G.itemBox(state, it))
    .filter(b => b && !b.c.lantai && b.z1 < 1.5 && b.s.h > 0.05)
    .map(b => ({ x1: b.x1, x2: b.x2, y1: b.y1, y2: b.y2 }));
  const obstacles = wallRects.concat(itemRects);
  function collides(x, y) {
    for (const r of obstacles) if (x > r.x1 - RADIUS && x < r.x2 + RADIUS && y > r.y1 - RADIUS && y < r.y2 + RADIUS) return true;
    return false;
  }
  function tryMove(dx, dz) {
    if (dx) { const nx = player.x + dx; if (nx > 0.1 && nx < S.w - 0.1 && !collides(nx, player.y)) player.x = nx; }
    if (dz) { const ny = player.y + dz; if (ny > 0.1 && ny < S.d - 0.1 && !collides(player.x, ny)) player.y = ny; }
  }

  /* ---------- pemain: posisi & arah pandang ----------
     player.x / player.y memakai sumbu denah (x = barat→timur, y = utara→selatan);
     di dunia three.js, denah-y dipetakan langsung ke sumbu Z (tanpa offset), tinggi kamera = EYE tetap.
     Titik awal generik (tidak terikat id ruang tertentu, supaya tetap benar walau denah diedit):
     mulai dari tengah ruang terbuka pertama (teras bila ada), lalu digeser ke titik bebas terdekat
     bila kebetulan tertimpa furniture/dinding. */
  const EYE = 1.62, SPEED = 1.9, RUN_MUL = 1.6, LOOK_SPEED = 0.0024, TOUCH_LOOK_SPEED = 0.006;
  function nearestFreeSpot(room) {
    const cx = room.x + room.w / 2, cy = room.y + room.d / 2;
    if (!collides(cx, cy)) return { x: cx, y: cy };
    const step = 0.3, inX = x => x > room.x + 0.15 && x < room.x + room.w - 0.15, inY = y => y > room.y + 0.15 && y < room.y + room.d - 0.15;
    for (let ring = 1; ring <= 12; ring++) {
      for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const x = cx + dx * step, y = cy + dy * step;
        if (inX(x) && inY(y) && !collides(x, y)) return { x, y };
      }
    }
    return { x: cx, y: cy }; // jarang terjadi: ruang penuh furniture, tetap pakai tengah
  }
  const player = { x: S.w / 2, y: S.d / 2, yaw: 0, pitch: 0 };
  (function initPos() {
    const start = state.rooms.find(r => r.type === 'teras') || state.rooms.find(r => !r.walls) || state.rooms[0];
    if (!start) return;
    const spot = nearestFreeSpot(start);
    player.x = u.r2(spot.x); player.y = u.r2(spot.y);
  })();
  camera.position.set(player.x, EYE, player.y);

  /* ---------- input: keyboard + mouse (desktop), joystick ganda (sentuh) ---------- */
  const keys = Object.create(null);
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  let locked = false;
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas;
    crossEl.style.display = locked ? 'block' : 'none';
  });
  canvas.addEventListener('mousemove', e => {
    if (!locked) return;
    player.yaw -= e.movementX * LOOK_SPEED;
    player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - e.movementY * LOOK_SPEED));
  });

  let started = false;
  startBtn.addEventListener('click', () => {
    started = true;
    startEl.classList.add('hide');
    hintEl.classList.add('on'); setTimeout(() => hintEl.classList.remove('on'), 6000);
    if (!isTouch) canvas.requestPointerLock();
    else { joyMove.classList.add('show'); joyLook.classList.add('show'); }
  });
  canvas.addEventListener('click', () => { if (started && !isTouch && !locked) canvas.requestPointerLock(); });

  let moveVec = { x: 0, y: 0 };
  (function touchMove() {
    let active = null, cx = 0, cy = 0; const R = 45;
    joyMove.addEventListener('pointerdown', e => {
      active = e.pointerId; const r = joyMove.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      try { joyMove.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
    });
    joyMove.addEventListener('pointermove', e => {
      if (active !== e.pointerId) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy); if (len > R) { dx = dx / len * R; dy = dy / len * R; }
      joyKnob.style.transform = `translate(${dx}px,${dy}px)`;
      moveVec.x = dx / R; moveVec.y = dy / R;
    });
    const end = e => { if (active !== e.pointerId) return; active = null; moveVec.x = 0; moveVec.y = 0; joyKnob.style.transform = ''; };
    joyMove.addEventListener('pointerup', end); joyMove.addEventListener('pointercancel', end);
  })();
  (function touchLook() {
    let active = null, lx = 0, ly = 0;
    joyLook.addEventListener('pointerdown', e => { active = e.pointerId; lx = e.clientX; ly = e.clientY; try { joyLook.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ } });
    joyLook.addEventListener('pointermove', e => {
      if (active !== e.pointerId) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      player.yaw -= dx * TOUCH_LOOK_SPEED; player.pitch = Math.max(-1.3, Math.min(1.3, player.pitch - dy * TOUCH_LOOK_SPEED));
    });
    const end = e => { if (active === e.pointerId) active = null; };
    joyLook.addEventListener('pointerup', end); joyLook.addEventListener('pointercancel', end);
  })();

  /* ---------- gerak per-frame ---------- */
  const eulerYaw = new THREE.Euler(), eulerLook = new THREE.Euler(0, 0, 0, 'YXZ');
  const fwd = new THREE.Vector3(), right = new THREE.Vector3();
  function frameMove(dt) {
    let mx = 0, mz = 0; // mx: kanan(+)/kiri(-) · mz: maju(+)/mundur(-), relatif arah hadap
    if (!isTouch) {
      if (keys.KeyW || keys.ArrowUp) mz += 1;
      if (keys.KeyS || keys.ArrowDown) mz -= 1;
      if (keys.KeyD || keys.ArrowRight) mx += 1;
      if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    } else { mx = moveVec.x; mz = -moveVec.y; }
    const len = Math.hypot(mx, mz);
    if (len < 0.01) return;
    const k = isTouch ? Math.min(1, len) : 1;
    mx /= len; mz /= len;
    eulerYaw.set(0, player.yaw, 0);
    fwd.set(0, 0, -1).applyEuler(eulerYaw); right.set(1, 0, 0).applyEuler(eulerYaw);
    const run = (!isTouch && (keys.ShiftLeft || keys.ShiftRight)) ? RUN_MUL : 1;
    const speed = SPEED * run * k * dt;
    tryMove((fwd.x * mz + right.x * mx) * speed, (fwd.z * mz + right.z * mx) * speed);
  }

  let curRoom = null;
  function updateRoomLabel() {
    const r = G.roomAt(state, player.x, player.y), id = r ? r.id : null;
    if (id === curRoom) return;
    curRoom = id;
    if (r && r.label) { roomLabelEl.textContent = r.name; roomLabelEl.classList.add('on'); }
    else roomLabelEl.classList.remove('on');
  }

  /* ---------- render loop ---------- */
  let last = performance.now();
  function render() {
    requestAnimationFrame(render);
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (started) {
      frameMove(dt);
      camera.position.set(player.x, EYE, player.y);
      eulerLook.set(player.pitch, player.yaw, 0);
      camera.quaternion.setFromEuler(eulerLook);
      updateRoomLabel();
    }
    renderer.render(scene, camera);
  }
  resize();
  new ResizeObserver(resize).observe(stage);
  render();

  // handle debug read-only (tidak dipakai aplikasi, berguna untuk pengujian/pemecahan masalah di console)
  window.__wt = { state, player, camera, scene, collides };
})();
