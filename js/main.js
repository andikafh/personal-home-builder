/* =====================================================================
   MAIN — state aplikasi, undo, penyimpanan lokal, mode tampilan
   ===================================================================== */
(function () {
  const HB = window.HB, G = HB.geo, u = HB.u;
  const LS = 'homebuilder-lokal.v2';

  function load() {
    try { const s = localStorage.getItem(LS); return s ? G.normalize(JSON.parse(s)) : null; } catch (e) { return null; }
  }
  HB.save = () => { try { localStorage.setItem(LS, JSON.stringify(HB.state)); } catch (e) { /* penyimpanan tidak tersedia */ } };

  // Denah bawaan dengan versi baru menggantikan data tersimpan; data lama masuk undo agar bisa dipulihkan.
  const stored = load(), upgrade = !!stored && stored.versi !== HB.DENAH_AWAL.versi;
  HB.state = stored && !upgrade ? stored : G.normalize(u.clone(HB.DENAH_AWAL));
  if (upgrade) stored.versi = HB.DENAH_AWAL.versi;
  HB.ui = { mode: '3d', tab: 'ruang', linked: true, snapWall: true, labels: true, itemLabels: false, net: false, viewH: 2.2, q: '', kat: 'semua', warnOpen: false };
  HB.sel = { kind: null, id: null };

  /* ---------- undo ---------- */
  const undo = upgrade ? [JSON.stringify(stored)] : [];
  HB.pushUndo = () => { undo.push(JSON.stringify(HB.state)); if (undo.length > 80) undo.shift(); };
  HB.dropUndo = () => { undo.pop(); };
  HB.doUndo = () => {
    if (!undo.length) return;
    HB.state = JSON.parse(undo.pop());
    const s = HB.sel, st = HB.state;
    const exists = (s.kind === 'room' && st.rooms.some(r => r.id === s.id)) || (s.kind === 'op' && st.openings.some(o => o.id === s.id)) || (s.kind === 'item' && st.items.some(i => i.id === s.id))
      || (s.kind === 'wall' && G.wallSegments(st).some(w => w.key === s.id));
    if (!exists) HB.sel = { kind: null, id: null };
    HB.renderAll();
  };
  HB.resetState = () => { HB.pushUndo(); HB.state = G.normalize(u.clone(HB.DENAH_AWAL)); HB.sel = { kind: null, id: null }; HB.editor2d.reset(); HB.renderAll(); };
  HB.applyJson = (text, msg) => {
    try {
      const o = G.normalize(JSON.parse(text));
      if (!o) throw new Error('format');
      o.versi = HB.DENAH_AWAL.versi; // data impor tidak ditimpa denah bawaan saat dibuka ulang
      HB.pushUndo(); HB.state = o; HB.sel = { kind: null, id: null }; HB.editor2d.reset(); HB.renderAll();
      if (msg) msg('Data diterapkan.');
    } catch (e) { if (msg) msg('Data tidak terbaca. Pastikan isinya berkas/teks data denah.'); }
  };

  HB.select = (kind, id) => { HB.sel = { kind, id }; HB.renderAll(); };

  // potong tampilan dinding 3D: VIEW_CUT agar isi ruang terlihat, VIEW_FULL = setinggi dinding sebenarnya
  const VIEW_CUT = 2.2, VIEW_FULL = 6;
  HB.renderAll = () => {
    HB.save();
    HB.view3d.build();
    if (HB.ui.mode === '2d') HB.editor2d.render();
    HB.panel.render();
    document.getElementById('undo').disabled = !undo.length;
    document.querySelector('#fb3d [data-cam="full"]').setAttribute('aria-pressed', HB.ui.viewH >= VIEW_FULL);
  };

  /* ---------- mode ---------- */
  const $ = id => document.getElementById(id);
  HB.setMode = m => {
    HB.ui.mode = m;
    const is3 = m === '3d';
    $('m3d').setAttribute('aria-pressed', is3); $('m2d').setAttribute('aria-pressed', !is3);
    $('three').style.display = is3 ? 'block' : 'none';
    $('leaders').style.display = $('labels').style.display = is3 ? '' : 'none';
    $('svg2d').style.display = is3 ? 'none' : 'block';
    $('fb3d').style.display = is3 ? '' : 'none';
    $('fb2d').style.display = is3 ? 'none' : '';
    $('hint').textContent = is3
      ? (HB.view3d.ok ? 'Geser area kosong untuk memutar, scroll untuk zoom. Seret properti untuk memindah; klik ruang/properti/dinding lalu tarik titik warnanya untuk mengubah ukuran.' : 'Tampilan 3D gagal dimuat (cek folder vendor). Mode Edit denah tetap bisa dipakai.')
      : 'Ketuk ruang untuk memilih, ketuk lagi lalu geser untuk memindah. Tarik garis biru untuk menggeser sekat. Klik dinding untuk atur tingginya. Properti bisa langsung ditarik.';
    if (is3) HB.view3d.resize(); else { HB.editor2d.reset(); HB.editor2d.render(); }
  };

  /* ---------- keyboard (desktop) ---------- */
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); HB.doUndo(); return; }
    const s = HB.sel, st = HB.state;
    if (s.kind === 'item') {
      const it = st.items.find(x => x.id === s.id); if (!it) return;
      const step = e.shiftKey ? 0.01 : 0.05, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (mv) { e.preventDefault(); HB.pushUndo(); it.x = u.r3(it.x + mv[0]); it.y = u.r3(it.y + mv[1]); HB.renderAll(); }
      else if (e.key === 'r' || e.key === 'R') { HB.pushUndo(); it.rot = ((it.rot || 0) + (e.shiftKey ? 270 : 90)) % 360; HB.renderAll(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); HB.pushUndo(); st.items = st.items.filter(x => x !== it); HB.select(null, null); }
    } else if (s.kind === 'op' && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault(); HB.pushUndo(); st.openings = st.openings.filter(o => o.id !== s.id); HB.select(null, null);
    } else if (e.key === 'Escape') HB.select(null, null);
  });

  /* ---------- lebar panel kanan (layar lebar) ---------- */
  const PW = 'homebuilder-lokal.panelW', PW_DEF = 380;
  let panelW = PW_DEF;
  function setPanelW(w, save) {
    const max = Math.max(260, Math.min(760, window.innerWidth - 320));
    panelW = w = Math.round(Math.max(260, Math.min(max, w)));
    document.documentElement.style.setProperty('--panel-w', w + 'px');
    $('gutter').setAttribute('aria-valuenow', w);
    if (save) try { localStorage.setItem(PW, w); } catch (e) { /* penyimpanan tidak tersedia */ }
  }
  const refit2d = () => { if (HB.ui.mode === '2d') { HB.editor2d.reset(); HB.editor2d.render(); } };
  function initGutter() {
    const g = $('gutter');
    let w0 = PW_DEF;
    try { w0 = +localStorage.getItem(PW) || PW_DEF; } catch (e) { /* abaikan */ }
    setPanelW(w0);
    let drag = null;
    g.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, w: panelW };
      g.classList.add('drag'); document.body.classList.add('resizing');
      try { g.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
      e.preventDefault();
    });
    g.addEventListener('pointermove', e => { if (drag) setPanelW(drag.w - (e.clientX - drag.x)); });
    const end = () => {
      if (!drag) return;
      drag = null;
      g.classList.remove('drag'); document.body.classList.remove('resizing');
      setPanelW(panelW, true);
      w0 = panelW;
      refit2d();
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
    g.addEventListener('dblclick', () => { setPanelW(PW_DEF, true); w0 = panelW; refit2d(); });
    g.addEventListener('keydown', e => {
      const d = { ArrowLeft: 20, ArrowRight: -20 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      setPanelW(panelW + (e.shiftKey ? d * 5 : d), true);
      w0 = panelW;
      refit2d();
    });
    // w0 = lebar pilihan pengguna; saat jendela menyempit lalu melebar lagi, lebar itu dipulihkan
    window.addEventListener('resize', () => setPanelW(w0));
  }

  /* ---------- drag & drop barang dari katalog ke kanvas ---------- */
  function initCatalogDrop() {
    const stage = $('stage');
    stage.addEventListener('dragover', e => {
      const types = e.dataTransfer ? Array.from(e.dataTransfer.types || []) : [];
      if (types.includes('application/x-hb-item') || types.includes('text/plain')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        stage.classList.add('dragover');
      }
    });
    stage.addEventListener('dragleave', e => {
      if (e.relatedTarget && stage.contains(e.relatedTarget)) return;
      stage.classList.remove('dragover');
    });
    stage.addEventListener('drop', e => {
      e.preventDefault();
      stage.classList.remove('dragover');
      const catId = e.dataTransfer.getData('application/x-hb-item') || e.dataTransfer.getData('text/plain');
      if (!catId) return;

      let pos = null;
      if (HB.ui.mode === '2d' && HB.editor2d && HB.editor2d.toSvg) {
        const pt = HB.editor2d.toSvg(e);
        const S = HB.state.site;
        pos = {
          x: u.snap(Math.max(0, Math.min(S.w, pt.x))),
          y: u.snap(Math.max(0, Math.min(S.d, pt.y)))
        };
      } else if (HB.ui.mode === '3d' && HB.view3d && HB.view3d.screenToFloor) {
        pos = HB.view3d.screenToFloor(e.clientX, e.clientY);
      }
      HB.panel.addItem(catId, pos);
    });
  }

  /* ---------- mulai ---------- */
  function start() {
    HB.view3d.init();
    HB.editor2d.init();
    HB.panel.init();
    initGutter();
    initCatalogDrop();
    $('m3d').onclick = () => HB.setMode('3d');
    $('m2d').onclick = () => HB.setMode('2d');
    $('undo').onclick = HB.doUndo;
    $('tpanel').onclick = () => {
      const closed = $('panel').classList.toggle('closed');
      $('main').classList.toggle('nopanel', closed);
      $('tpanel').setAttribute('aria-expanded', !closed);
      setTimeout(() => { HB.view3d.resize(); if (HB.ui.mode === '2d') { HB.editor2d.reset(); HB.editor2d.render(); } }, 30);
    };
    $('fb3d').addEventListener('click', e => {
      const c = e.target.dataset.cam;
      if (c === 'full') { HB.ui.viewH = HB.ui.viewH >= VIEW_FULL ? VIEW_CUT : VIEW_FULL; HB.renderAll(); }
      else if (c) HB.view3d.setCam(c);
    });
    $('fb2d').addEventListener('click', e => {
      const z = e.target.dataset.z; if (!z) return;
      if (z === 'fit') { HB.editor2d.reset(); HB.editor2d.render(); } else HB.editor2d.zoom(z === 'in' ? 1 / 1.25 : 1.25);
    });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', HB.view3d.applyTheme);
    HB.renderAll();
    HB.setMode('3d');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
