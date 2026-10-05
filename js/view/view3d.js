/* =====================================================================
   TAMPILAN 3D
   - Klik ruang / properti / dinding untuk memilih
   - Seret properti untuk memindah (menempel ke dinding bila aktif)
   - Titik pegangan pada objek terpilih:
       properti : merah = lebar, hijau = dalam, biru = tinggi
       ruang    : biru di tiap sisi = geser sekat
       dinding  : biru di atas = tinggi dinding
   ===================================================================== */
(function () {
  const HB = window.HB, G = HB.geo, u = HB.u;
  const V = (HB.view3d = {});
  V.ok = typeof THREE !== 'undefined' && !!THREE.OrbitControls;

  let renderer, scene, camera, controls, root, hroot, stage, canvas, leaders, labelsEl, labelItems = [];
  let itemGroups = {}, drag = null, click = null, ray = null;
  const matCache = {}, hmatCache = {};
  const va = V.ok ? new THREE.Vector3() : null, vt = V.ok ? new THREE.Vector3() : null;
  const HC = { w: '#d9534f', d: '#3c9d5d', h: '#2f6fd6', edge: '#2451a6' };

  function mat(color, opts) {
    const k = color + JSON.stringify(opts || {});
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, opts || {}));
    return matCache[k];
  }
  function hmat(color) {
    if (!hmatCache[color]) hmatCache[color] = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 });
    return hmatCache[color];
  }
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const origin = () => { const S = HB.state.site; return { ox: S.w / 2, oz: S.d / 2 }; };

  V.init = function () {
    stage = document.getElementById('stage');
    canvas = document.getElementById('three');
    leaders = document.getElementById('leaders');
    labelsEl = document.getElementById('labels');
    if (!V.ok) return;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, maxPolarAngle: Math.PI * 0.49, minDistance: 3, maxDistance: 60 });
    ray = new THREE.Raycaster();

    scene.add(new THREE.HemisphereLight(0xffffff, 0x7d7568, 0.8));
    const dl = new THREE.DirectionalLight(0xffffff, 0.7);
    dl.position.set(-9, 20, 11);
    dl.castShadow = true;
    dl.shadow.mapSize.set(1536, 1536);
    Object.assign(dl.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
    dl.shadow.bias = -0.0005;
    scene.add(dl);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), mat('#cfd3cc'));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; ground.receiveShadow = true;
    scene.add(ground);
    root = new THREE.Group();
    hroot = new THREE.Group();
    scene.add(root, hroot);

    // fase capture di #stage: berjalan sebelum OrbitControls, sehingga seret objek tidak ikut memutar kamera
    stage.addEventListener('pointerdown', onDown, true);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    V.setCam('iso');
    V.applyTheme();
    V.resize();
    new ResizeObserver(V.resize).observe(stage);
    (function loop() {
      requestAnimationFrame(loop);
      if (HB.ui.mode !== '3d') return;
      controls.update();
      renderer.render(scene, camera);
      updateLabels();
    })();
  };

  V.applyTheme = () => { if (renderer) renderer.setClearColor(new THREE.Color(cssVar('--stage') || '#e3e8ec')); };
  function setRay(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera({ x: ((clientX - r.left) / r.width) * 2 - 1, y: -((clientY - r.top) / r.height) * 2 + 1 }, camera);
  }
  V.screenToFloor = function (clientX, clientY) {
    if (!camera || !renderer) return null;
    setRay(clientX, clientY);
    const target = new THREE.Vector3();
    if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), target)) {
      const S = HB.state.site;
      const x = target.x + S.w / 2;
      const y = target.z + S.d / 2;
      return { x: u.snap(Math.max(0, Math.min(S.w, x))), y: u.snap(Math.max(0, Math.min(S.d, y))) };
    }
    return null;
  };
  V.setCam = function (k) {
    if (!camera) return;
    const S = HB.state.site, m = Math.max(S.w, S.d);
    if (k === 'top') camera.position.set(0, m * 1.7, 0.01);
    else camera.position.set(m * 0.62, m * 1.15, m * 1.3);
    controls.target.set(0, 0, 0);
    controls.update();
  };
  V.resize = function () {
    if (!renderer) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    leaders.setAttribute('viewBox', `0 0 ${w} ${h}`);
  };
  V.snapshot = function () {
    if (!renderer) return null;
    hroot.visible = false;
    renderer.render(scene, camera);
    const url = canvas.toDataURL('image/png');
    hroot.visible = true;
    return url;
  };

  function clear(g) {
    g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    while (g.children.length) g.remove(g.children[0]);
  }
  function addBox(parent, w, h, d, m, x, y, z, shadow, ud) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 0.005), Math.max(h, 0.005), Math.max(d, 0.005)), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = !!shadow;
    mesh.receiveShadow = true;
    if (ud) mesh.userData = ud;
    parent.add(mesh);
    return mesh;
  }

  V.build = function () {
    if (!root) return;
    clear(root);
    itemGroups = {};
    const st = HB.state, { ox, oz } = origin(), T = st.wallT, H = HB.ui.viewH, sel = HB.sel;
    const selWall = sel.kind === 'wall' ? sel.id : null;
    const wallM = mat('#f6f4ef'), wallOnM = mat('#f6f4ef', { emissive: '#2451a6', emissiveIntensity: 0.4 }), capM = mat('#2f3338'),
      glassM = mat('#9cc8e0', { transparent: true, opacity: 0.45, roughness: 0.1 }), woodM = mat('#9a6a3f');

    // lantai ruang
    for (const r of st.rooms) {
      const t = HB.TYPES[r.type] || HB.TYPES.publik, h = r.type === 'taman' ? 0.14 : 0.04, on = sel.kind === 'room' && sel.id === r.id;
      const m = on ? mat(t.c, { emissive: '#2451a6', emissiveIntensity: 0.35 }) : mat(t.c);
      addBox(root, r.w, h, r.d, m, r.x + r.w / 2 - ox, h / 2, r.y + r.d / 2 - oz, false, { kind: 'room', id: r.id });
    }
    // dinding & bukaan: tinggi tiap segmen dipotong setinggi "potong tampilan"
    const seg = (o, c, a, b, y0, y1, m, th, ud) => {
      th = th || T;
      if (y1 - y0 < 0.005 || b - a < 0.005) return;
      const L = b - a, h = y1 - y0;
      if (o === 'h') addBox(root, L, h, th, m, (a + b) / 2 - ox, y0 + h / 2, c - oz, true, ud);
      else addBox(root, th, h, L, m, c - ox, y0 + h / 2, (a + b) / 2 - oz, true, ud);
    };
    const { pieces, ops } = G.computeWalls(st);
    for (const p of pieces) {
      const top = Math.min(p.h, H), ud = { kind: 'wall', id: p.key };
      seg(p.o, p.c, p.a, p.b, 0, top, p.key === selWall ? wallOnM : wallM, T, ud);
      seg(p.o, p.c, p.a, p.b, top, top + 0.02, capM, T + 0.005, ud);
    }
    for (const q of ops) {
      const t = q.op.type, top = Math.min(q.h, H), ud = q.key ? { kind: 'wall', id: q.key } : { kind: 'op', id: q.op.id };
      const wm = q.key && q.key === selWall ? wallOnM : wallM;
      if (t === 'door') {
        seg(q.o, q.c, q.a, q.b, 0.04, 0.06, woodM, T, { kind: 'op', id: q.op.id });
        if (top > 2.1) seg(q.o, q.c, q.a, q.b, 2.1, top, wm, T, ud);
      } else if (t === 'window') {
        seg(q.o, q.c, q.a, q.b, 0, Math.min(0.9, top), wm, T, ud);
        if (top > 0.9) seg(q.o, q.c, q.a, q.b, 0.9, Math.min(2.1, top), glassM, 0.03, { kind: 'op', id: q.op.id });
        if (top > 2.1) seg(q.o, q.c, q.a, q.b, 2.1, top, wm, T, ud);
      } else if (top > 2.4) seg(q.o, q.c, q.a, q.b, 2.4, top, wm, T, ud);
      if (t === 'window' || top > (t === 'door' ? 2.1 : 2.4)) seg(q.o, q.c, q.a, q.b, top, top + 0.02, capM, T + 0.005);
    }
    // properti
    for (const it of st.items) buildItem(it);
    buildHandles();
    buildLabels();
  };

  function buildItem(it) {
    const st = HB.state, b = G.itemBox(st, it), { ox, oz } = origin();
    if (!b) return;
    const c = b.c, s = b.s, g = new THREE.Group();
    g.position.set(it.x - ox, b.z1, it.y - oz);
    g.rotation.y = (-b.rot * Math.PI) / 180;
    // bentuk katalog diskalakan ke ukuran properti ini
    g.scale.set(s.w / c.w, s.h / c.h, s.d / c.d);
    const parts = c.parts && c.parts.length ? c.parts : [{ x: 0, y: 0, z: 0, w: c.w, d: c.d, h: c.h, c: c.c || '#9aa0a6' }];
    const ud = { kind: 'item', id: it.id };
    parts.forEach((p, i) => {
      const color = i === 0 && it.color ? it.color : p.c;
      const m = p.o ? mat(color, { transparent: true, opacity: p.o, roughness: 0.2 }) : mat(color);
      addBox(g, p.w, p.h, p.d, m, p.x + p.w / 2 - c.w / 2, p.z + p.h / 2, p.y + p.d / 2 - c.d / 2, p.h > 0.04, ud);
    });
    if (HB.sel.kind === 'item' && HB.sel.id === it.id) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(c.w, Math.max(c.h, 0.02), c.d)),
        new THREE.LineBasicMaterial({ color: 0x2451a6 }));
      e.position.set(0, c.h / 2, 0);
      g.add(e);
    }
    root.add(g);
    itemGroups[it.id] = g;
  }
  function rebuildItem(it) {
    const g = itemGroups[it.id];
    if (g) { clear(g); root.remove(g); }
    buildItem(it);
    buildHandles();
    buildLabels();
  }

  /* ---------- titik pegangan ---------- */
  function itemFrame(it) {
    const b = G.itemBox(HB.state, it), phi = (-b.rot * Math.PI) / 180;
    // sumbu lokal properti dalam koordinat denah (x ke timur, y ke selatan)
    return { b, ux: { x: Math.cos(phi), y: -Math.sin(phi) }, uz: { x: Math.sin(phi), y: Math.cos(phi) } };
  }
  function buildHandles() {
    if (!hroot) return;
    clear(hroot);
    const st = HB.state, sel = HB.sel, { ox, oz } = origin();
    const add = (x, y, z, ud, color, r = 0.09) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), hmat(color));
      m.position.set(x - ox, y, z - oz); m.renderOrder = 10; m.userData = ud;
      hroot.add(m);
    };
    if (sel.kind === 'item') {
      const it = st.items.find(x => x.id === sel.id);
      if (!it || !G.itemBox(st, it)) return;
      const { b, ux, uz } = itemFrame(it), s = b.s, zc = b.z1 + s.h / 2;
      add(it.x + ux.x * (s.w / 2 + 0.08), zc, it.y + ux.y * (s.w / 2 + 0.08), { handle: 'w' }, HC.w);
      add(it.x + uz.x * (s.d / 2 + 0.08), zc, it.y + uz.y * (s.d / 2 + 0.08), { handle: 'd' }, HC.d);
      add(it.x, b.z2 + 0.14, it.y, { handle: 'h' }, HC.h);
    } else if (sel.kind === 'room') {
      const r = st.rooms.find(x => x.id === sel.id);
      if (!r) return;
      const y = 0.3;
      add(r.x + r.w / 2, y, r.y, { handle: 'edge', edge: 'top' }, HC.edge, 0.11);
      add(r.x + r.w / 2, y, r.y + r.d, { handle: 'edge', edge: 'bottom' }, HC.edge, 0.11);
      add(r.x, y, r.y + r.d / 2, { handle: 'edge', edge: 'left' }, HC.edge, 0.11);
      add(r.x + r.w, y, r.y + r.d / 2, { handle: 'edge', edge: 'right' }, HC.edge, 0.11);
    } else if (sel.kind === 'wall') {
      const s = G.wallSegments(st).find(x => x.key === sel.id);
      if (!s) return;
      const m = (s.a + s.b) / 2;
      add(s.o === 'h' ? m : s.c, s.h + 0.14, s.o === 'h' ? s.c : m, { handle: 'wh' }, HC.h, 0.11);
    }
  }

  /* ---------- interaksi ---------- */
  const floorPlane = z => new THREE.Plane(new THREE.Vector3(0, 1, 0), -z);
  // bidang tegak menghadap kamera melalui titik (x, y) denah — dipakai untuk menarik tinggi
  function wallPlane(x, y) {
    const { ox, oz } = origin(), p = new THREE.Vector3(x - ox, 0, y - oz);
    const n = new THREE.Vector3(camera.position.x - p.x, 0, camera.position.z - p.z);
    if (n.lengthSq() < 1e-6) n.set(0, 0, 1);
    return new THREE.Plane().setFromNormalAndCoplanarPoint(n.normalize(), p);
  }
  function planeHit(plane) {
    const v = new THREE.Vector3();
    if (!ray.ray.intersectPlane(plane, v)) return null;
    const { ox, oz } = origin();
    return { x: v.x + ox, y: v.z + oz, z: v.y };
  }
  function beginDrag(e, d) {
    HB.pushUndo();
    drag = Object.assign({ moved: false }, d);
    controls.enabled = false;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
    e.stopPropagation();
    e.preventDefault();
  }

  function onDown(e) {
    click = null;
    if (!V.ok || HB.ui.mode !== '3d' || e.target !== canvas || (e.button != null && e.button > 0)) return;
    setRay(e.clientX, e.clientY);
    const st = HB.state, sel = HB.sel;
    const hh = ray.intersectObjects(hroot.children, false)[0];
    if (hh) {
      const k = hh.object.userData.handle;
      if (k === 'edge') {
        const r = st.rooms.find(x => x.id === sel.id);
        beginDrag(e, { k: 'edge', E: G.startEdge(st, r, hh.object.userData.edge, HB.ui.linked), plane: floorPlane(0) });
      } else if (k === 'wh') {
        const s = G.wallSegments(st).find(x => x.key === sel.id), m = (s.a + s.b) / 2;
        beginDrag(e, { k: 'wallh', seg: s, plane: s.o === 'h' ? wallPlane(m, s.c) : wallPlane(s.c, m) });
      } else {
        const it = st.items.find(x => x.id === sel.id), { b, ux, uz } = itemFrame(it);
        if (k === 'h') beginDrag(e, { k: 'h', it, z1: b.z1, plane: wallPlane(it.x, it.y) });
        else {
          const axis = k === 'w' ? ux : uz, size = k === 'w' ? b.s.w : b.s.d;
          beginDrag(e, { k: 'size', f: k, it, axis, A: { x: it.x - axis.x * size / 2, y: it.y - axis.y * size / 2 }, plane: floorPlane(b.z1 + b.s.h / 2) });
        }
      }
      return;
    }
    const hit = ray.intersectObjects(root.children, true).find(h => h.object.userData && h.object.userData.kind === 'item');
    if (hit) {
      const id = hit.object.userData.id;
      if (!(sel.kind === 'item' && sel.id === id)) HB.select('item', id);
      const it = st.items.find(x => x.id === id), b = G.itemBox(st, it), plane = floorPlane(b.z1), p = planeHit(plane);
      if (!p) return;
      beginDrag(e, { k: 'move', it, plane, dx: it.x - p.x, dy: it.y - p.y, pieces: G.computeWalls(st).pieces });
      return;
    }
    click = { x: e.clientX, y: e.clientY };
  }

  function onMove(e) {
    if (!drag) {
      if (!e.buttons && HB.ui.mode === '3d' && V.ok) {
        setRay(e.clientX, e.clientY);
        const overHandle = ray.intersectObjects(hroot.children, false).length > 0;
        canvas.style.cursor = overHandle ? 'grab' : '';
      }
      return;
    }
    setRay(e.clientX, e.clientY);
    const p = planeHit(drag.plane);
    if (!p) return;
    const st = HB.state, step = e.shiftKey ? 0.01 : 0.05, it = drag.it;
    if (drag.k === 'move') {
      it.x = u.snap(p.x + drag.dx, step);
      it.y = u.snap(p.y + drag.dy, step);
      if (HB.ui.snapWall) G.snapItemToWalls(st, it, drag.pieces);
      rebuildItem(it);
    } else if (drag.k === 'size') {
      const t = (p.x - drag.A.x) * drag.axis.x + (p.y - drag.A.y) * drag.axis.y, v = Math.max(0.05, u.snap(t, step));
      it[drag.f] = v;
      it.x = u.r3(drag.A.x + drag.axis.x * v / 2);
      it.y = u.r3(drag.A.y + drag.axis.y * v / 2);
      rebuildItem(it);
    } else if (drag.k === 'h') {
      it.h = Math.max(0.02, u.snap(p.z - drag.z1, step));
      rebuildItem(it);
    } else if (drag.k === 'edge') {
      if (G.applyEdge(drag.E, u.snap(drag.E.o === 'v' ? p.x : p.y, step))) V.build();
    } else if (drag.k === 'wallh') {
      G.setWallHeight(st, drag.seg, Math.min(6, Math.max(0.1, u.snap(p.z, step))));
      V.build();
    }
    drag.moved = true;
    canvas.style.cursor = 'grabbing';
  }

  function onUp(e) {
    if (drag) {
      const d = drag;
      drag = null;
      controls.enabled = true;
      canvas.style.cursor = '';
      if (!d.moved) HB.dropUndo();
      HB.renderAll();
      return;
    }
    if (!click || Math.hypot(e.clientX - click.x, e.clientY - click.y) > 6) { click = null; return; }
    click = null;
    setRay(e.clientX, e.clientY);
    const hit = ray.intersectObjects(root.children, true).find(h => h.object.userData && h.object.userData.kind);
    if (hit) HB.select(hit.object.userData.kind, hit.object.userData.id);
    else HB.select(null, null);
  }

  /* ---------- label dengan garis penunjuk ---------- */
  function buildLabels() {
    labelsEl.innerHTML = '';
    labelItems = [];
    const st = HB.state, ui = HB.ui, sel = HB.sel;
    if (ui.labels) st.rooms.filter(r => r.label).forEach(r => {
      const d = G.dims(st, r, ui.net), grp = r.group && st.rooms.some(s => s !== r && s.group === r.group);
      const a = grp ? G.groupArea(st, r, ui.net) : G.area(st, r, ui.net);
      addLabel({ kind: 'room', x: r.x + r.w / 2, y: r.y + r.d / 2, z: 0.1, top: Math.min(st.wallH, ui.viewH) + 1.0,
        on: sel.kind === 'room' && sel.id === r.id,
        html: `<b>${u.esc(r.name)}</b><span>${u.f2(d.w)} × ${u.f2(d.d)} m · ${u.f2(a)} m²${grp ? ' (gabungan)' : ''}</span>` });
    });
    st.items.forEach(it => {
      const on = sel.kind === 'item' && sel.id === it.id;
      if (!ui.itemLabels && !on) return;
      const b = G.itemBox(st, it);
      if (!b) return;
      addLabel({ kind: 'item', x: it.x, y: it.y, z: b.z2, top: b.z2 + 0.7, on,
        html: `<b>${u.esc(it.name || b.c.n)}</b><span>${u.f2(b.s.w)} × ${u.f2(b.s.d)} × ${u.f2(b.s.h)} m</span>` });
    });
    if (sel.kind === 'wall') {
      const s = G.wallSegments(st).find(x => x.key === sel.id);
      if (s) {
        const m = (s.a + s.b) / 2, x = s.o === 'h' ? m : s.c, y = s.o === 'h' ? s.c : m;
        addLabel({ kind: 'room', x, y, z: s.h, top: s.h + 0.8, on: true,
          html: `<b>Dinding ${u.f2(s.b - s.a)} m</b><span>tinggi ${u.f2(s.h)} m${s.h > ui.viewH ? ' · tampilan dipotong' : ''}</span>` });
      }
    }
    requestAnimationFrame(() => labelItems.forEach(L => { L.w = L.el.offsetWidth; L.h = L.el.offsetHeight; }));
  }
  function addLabel(o) {
    const el = document.createElement('div');
    el.className = 'lbl ' + o.kind + (o.on ? ' on' : '');
    el.innerHTML = o.html;
    labelsEl.appendChild(el);
    labelItems.push(Object.assign(o, { el, w: 0, h: 0 }));
  }
  function updateLabels() {
    const W = stage.clientWidth, Hh = stage.clientHeight, S = HB.state.site, ox = S.w / 2, oz = S.d / 2, items = [];
    for (const L of labelItems) {
      va.set(L.x - ox, L.z, L.y - oz).project(camera);
      vt.set(L.x - ox, L.top, L.y - oz).project(camera);
      if (va.z > 1 || vt.z > 1) { L.el.style.display = 'none'; continue; }
      L.el.style.display = '';
      items.push({ L, ax: ((va.x + 1) / 2) * W, ay: ((1 - va.y) / 2) * Hh, tx: ((vt.x + 1) / 2) * W, ty: ((1 - vt.y) / 2) * Hh });
    }
    // susun label agar tidak saling menutupi (dari bawah ke atas)
    items.sort((p, q) => q.ty - p.ty);
    const placed = [];
    for (const it of items) {
      const w = it.L.w || 90, h = it.L.h || 32;
      for (let k = 0; k < 12; k++) {
        let hit = false;
        for (const p of placed) {
          if (Math.abs(it.tx - p.tx) < (w + p.w) / 2 + 3 && it.ty > p.ty - p.h - 3 && it.ty - h < p.ty + 3) { it.ty = p.ty - p.h - 3; hit = true; }
        }
        if (!hit) break;
      }
      it.w = w; it.h = h;
      placed.push(it);
    }
    let s = '';
    for (const it of placed) {
      it.L.el.style.transform = `translate(${(it.tx - it.w / 2).toFixed(1)}px,${(it.ty - it.h).toFixed(1)}px)`;
      const cls = it.L.kind === 'item' ? ' class="it"' : '';
      s += `<line${cls} x1="${it.ax.toFixed(1)}" y1="${it.ay.toFixed(1)}" x2="${it.tx.toFixed(1)}" y2="${it.ty.toFixed(1)}"/><circle${cls} cx="${it.ax.toFixed(1)}" cy="${it.ay.toFixed(1)}" r="3.5"/>`;
    }
    leaders.innerHTML = s;
  }
})();
