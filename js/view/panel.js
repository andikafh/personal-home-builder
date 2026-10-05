/* =====================================================================
   PANEL KONTROL
   ===================================================================== */
(function () {
  const HB = window.HB, G = HB.geo, u = HB.u;
  const Pn = (HB.panel = {});
  let panel;
  const TABS = [['ruang', 'Ruang & sekat'], ['properti', 'Properti'], ['rekap', 'Rekap'], ['data', 'Data']];

  Pn.init = function () {
    panel = document.getElementById('panel');
    panel.addEventListener('click', onClick);
    panel.addEventListener('change', onChange);
    panel.addEventListener('input', onInput);
    panel.addEventListener('dragstart', onDragStart);
    panel.addEventListener('dragend', onDragEnd);
  };

  Pn.render = function () {
    const st = HB.state, ui = HB.ui;
    let h = selectedEditor();
    const W = G.warnings(st);
    h += `<div class="sec">${W.length
      ? `<details class="warn"${ui.warnOpen ? ' open' : ''} data-warn><summary>${W.length} hal perlu dicek</summary><ul>${W.map(w => `<li><button class="lnk" data-sel="${w.k}:${w.id}">${u.esc(w.t)}</button></li>`).join('')}</ul></details>`
      : '<div class="ok">Tidak ada ruang tumpang tindih, properti menembus dinding, atau bukaan yang lepas dari dinding.</div>'}</div>`;
    h += `<div class="tabs" role="tablist">${TABS.map(([k, n]) => `<button role="tab" aria-selected="${ui.tab === k}" data-tab="${k}">${n}</button>`).join('')}</div>`;
    h += { ruang: tabRuang, properti: tabProperti, rekap: tabRekap, data: tabData }[ui.tab]();
    panel.innerHTML = h;
  };

  /* ---------- editor objek terpilih ---------- */
  function selectedEditor() {
    const st = HB.state, sel = HB.sel, ui = HB.ui;
    if (sel.kind === 'room') {
      const r = st.rooms.find(x => x.id === sel.id);
      if (!r) return '';
      const nb = (e, d, a, lbl) => `<button data-nudge="${e}" data-d="${d}" aria-label="${lbl}">${a}</button>`;
      return `<div class="sec selbox"><h2>${u.esc(r.name)}</h2><div class="grid">
        <label class="fld wide">Nama<input data-f="name" value="${u.esc(r.name)}"></label>
        <label class="fld wide">Jenis<select data-f="type">${Object.entries(HB.TYPES).map(([k, v]) => `<option value="${k}" ${k === r.type ? 'selected' : ''}>${v.n}</option>`).join('')}</select></label>
        <label class="fld">X (dari barat)<input type="number" step="0.05" data-f="x" value="${r.x}"></label>
        <label class="fld">Y (dari utara)<input type="number" step="0.05" data-f="y" value="${r.y}"></label>
        <label class="fld">Lebar B–T<input type="number" step="0.05" min="0.3" data-f="w" value="${r.w}"></label>
        <label class="fld">Panjang U–S<input type="number" step="0.05" min="0.3" data-f="d" value="${r.d}"></label>
        <label class="fld wide">Grup tanpa sekat<input data-f="group" value="${u.esc(r.group || '')}" placeholder="mis. tamu"></label>
        <label class="tog"><input type="checkbox" data-f="walls" ${r.walls ? 'checked' : ''}> Berdinding</label>
        <label class="tog"><input type="checkbox" data-f="label" ${r.label ? 'checked' : ''}> Label</label>
      </div>
      <div class="nudge">
        <span>Sekat utara</span>${nb('top', -0.1, '▲', 'Geser sekat utara ke utara')}${nb('top', 0.1, '▼', 'Geser sekat utara ke selatan')}
        <span>Sekat selatan</span>${nb('bottom', -0.1, '▲', 'Geser sekat selatan ke utara')}${nb('bottom', 0.1, '▼', 'Geser sekat selatan ke selatan')}
        <span>Sekat barat</span>${nb('left', -0.1, '◀', 'Geser sekat barat ke barat')}${nb('left', 0.1, '▶', 'Geser sekat barat ke timur')}
        <span>Sekat timur</span>${nb('right', -0.1, '◀', 'Geser sekat timur ke barat')}${nb('right', 0.1, '▶', 'Geser sekat timur ke timur')}
      </div>
      <p class="note">Tombol sekat menggeser dinding 10 cm${ui.linked ? '; ruang di seberang dinding ikut menyesuaikan' : ''}. Di 3D tarik titik <span class="hkey" style="background:#2451a6"></span>di tiap sisi ruang.</p>
      <div class="row"><button class="btn" data-act="dupRoom">Duplikat</button><button class="btn dng" data-act="delRoom">Hapus ruang</button></div></div>`;
    }
    if (sel.kind === 'op') {
      const op = st.openings.find(x => x.id === sel.id);
      if (!op) return '';
      return `<div class="sec selbox"><h2>${HB.OPN[op.type]}</h2><div class="grid">
        <label class="fld wide">Jenis<select data-o="type">${Object.entries(HB.OPN).map(([k, v]) => `<option value="${k}" ${k === op.type ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="fld wide">Lebar (m)<input type="number" step="0.05" min="0.3" data-o="w" value="${op.w}"></label></div>
        <p class="note">Tarik garisnya di mode Edit denah; bukaan menempel ke dinding terdekat.</p>
        <div class="row"><button class="btn dng" data-act="delOp">Hapus ${HB.OPN[op.type].toLowerCase()}</button></div></div>`;
    }
    if (sel.kind === 'item') {
      const it = st.items.find(x => x.id === sel.id), b = it && G.itemBox(st, it);
      if (!b) return '';
      const rm = G.roomAt(st, it.x, it.y), c = b.c, base = (c.parts && c.parts[0] && c.parts[0].c) || c.c || '#9aa0a6';
      return `<div class="sec selbox"><h2>${u.esc(it.name || c.n)}</h2><div class="grid">
        <label class="fld wide">Catatan / nama<input data-i="name" value="${u.esc(it.name || '')}" placeholder="${u.esc(c.n)}"></label>
        <label class="fld">Warna utama<input type="color" data-i="color" value="${it.color || base}"></label>
        <label class="fld">Elevasi (m)<input type="number" step="0.05" min="0" data-i="elev" value="${it.elev != null ? it.elev : ''}" placeholder="${c.elev || 0}"></label>
        <label class="fld">X tengah<input type="number" step="0.05" data-i="x" value="${it.x}"></label>
        <label class="fld">Y tengah<input type="number" step="0.05" data-i="y" value="${it.y}"></label>
        <label class="fld">Lebar (m)<input type="number" step="0.05" min="0.05" data-i="w" value="${u.r2(b.s.w)}"></label>
        <label class="fld">Dalam (m)<input type="number" step="0.05" min="0.05" data-i="d" value="${u.r2(b.s.d)}"></label>
        <label class="fld">Tinggi (m)<input type="number" step="0.05" min="0.02" data-i="h" value="${u.r2(b.s.h)}"></label>
        <label class="fld wide">Posisi<span class="val">${rm ? u.esc(rm.name) : 'di luar ruang'} · menghadap ${['selatan', 'barat', 'utara', 'timur'][b.rot / 90]}</span></label>
      </div>
      <p class="note">Ukuran katalog ${u.f2(c.w)} × ${u.f2(c.d)} × ${u.f2(c.h)} m.${it.w || it.d || it.h ? ' Properti ini memakai ukuran sendiri.' : ''}
        Di 3D: seret barangnya untuk memindah, tarik titik <span class="hkey" style="background:#d9534f"></span>lebar
        <span class="hkey" style="background:#3c9d5d"></span>dalam <span class="hkey" style="background:#2f6fd6"></span>tinggi (Shift = langkah 1 cm).
        Keyboard: R putar, panah geser 5 cm, Delete hapus.</p>
      <div class="row"><button class="btn" data-act="rotL">⟲ Putar</button><button class="btn" data-act="rotR">⟳ Putar</button>
        ${it.w || it.d || it.h ? '<button class="btn" data-act="resetSize">Ukuran katalog</button>' : ''}
        <button class="btn" data-act="dupItem">Duplikat</button><button class="btn dng" data-act="delItem">Hapus</button></div></div>`;
    }
    if (sel.kind === 'wall') {
      const s = G.wallSegments(st).find(x => x.key === sel.id);
      if (!s) return '';
      const m = (s.a + s.b) / 2, own = Math.abs(s.h - st.wallH) > 1e-3;
      const sides = st.rooms.filter(r => r.walls && G.EDGES.some(e => G.edgeAxis(e) === s.o && Math.abs(G.edgeCoord(r, e) - s.c) < G.EPS
        && (([a, b]) => m > a && m < b)(G.span(r, s.o)))).map(r => u.esc(r.name));
      const pre = (v, t) => `<button class="btn sm" data-wh="${v}">${t}</button>`;
      return `<div class="sec selbox"><h2>Dinding / sekat</h2><div class="grid">
        <label class="fld">Tinggi (m)<input type="number" step="0.05" min="0.1" max="6" data-w="h" value="${u.r2(s.h)}"></label>
        <label class="fld">Panjang<span class="val">${u.f2(s.b - s.a)} m</span></label>
        <label class="fld wide">Arah<span class="val">${s.o === 'h' ? 'Barat – Timur' : 'Utara – Selatan'}${own ? ' · tinggi khusus' : ' · tinggi standar'}</span></label></div>
        <div class="row">${pre('std', `Standar ${u.f2(st.wallH)} m`)}${pre(2.1, '2.10 setinggi kusen')}${pre(1.2, '1.20 sekat rendah')}${pre(0.9, '0.90 meja bar')}</div>
        <p class="note">Membatasi: ${sides.join(' ↔ ') || '—'}. Di 3D tarik titik <span class="hkey" style="background:#2f6fd6"></span>di atas dinding untuk mengubah tinggi.
        ${s.h > ui.viewH ? `Tampilan 3D sedang dipotong di ${u.f2(ui.viewH)} m — tekan <b>Dinding penuh</b> di pojok kanan bawah untuk melihat tinggi sebenarnya.` : ''}</p></div>`;
    }
    return '';
  }

  /* ---------- tab ---------- */
  function tabRuang() {
    const st = HB.state, ui = HB.ui, sel = HB.sel;
    return `<div class="sec"><div class="row">
        <button class="btn" data-act="addRoom">+ Ruang</button>
        <button class="btn" data-act="addOp" data-t="door">+ Pintu</button>
        <button class="btn" data-act="addOp" data-t="window">+ Jendela</button>
        <button class="btn" data-act="addOp" data-t="open">+ Bukaan</button></div>
      <div class="row" style="margin-top:8px;gap:14px">
        <label class="tog"><input type="checkbox" data-ui="linked" ${ui.linked ? 'checked' : ''}> Sekat terhubung</label>
        <label class="tog"><input type="checkbox" data-ui="labels" ${ui.labels ? 'checked' : ''}> Label ruang</label>
        <label class="tog"><input type="checkbox" data-ui="net" ${ui.net ? 'checked' : ''}> Ukuran bersih</label></div>
      <div class="grid" style="margin-top:8px">
        <label class="fld wide">Tinggi dinding standar (m)<input type="number" step="0.05" min="1" max="6" data-st="wallH" value="${u.r2(st.wallH)}"></label>
        <label class="fld wide">Sekat bertinggi khusus<span class="val">${(st.wallHeights || []).length} segmen</span></label></div>
      <label class="slider">Potong tampilan 3D <input type="range" min="0.3" max="6" step="0.1" value="${ui.viewH}" data-ui="viewH"><span>${u.f2(ui.viewH)} m</span></label>
      <p class="note">Klik dinding di 3D atau Edit denah untuk mengatur tinggi sekat itu sendiri. Potong tampilan hanya memengaruhi gambar 3D, bukan tinggi dinding.</p></div>
      <div class="sec"><h2>Pilih ruang</h2><div class="chips">${st.rooms.map(r => `<button class="chip${sel.kind === 'room' && sel.id === r.id ? ' on' : ''}" data-sel="room:${r.id}">${u.esc(r.name)}</button>`).join('')}</div></div>`;
  }

  function tabProperti() {
    const ui = HB.ui;
    return `<div class="sec"><div class="row" style="gap:14px">
        <label class="tog"><input type="checkbox" data-ui="snapWall" ${ui.snapWall ? 'checked' : ''}> Tempel ke dinding</label>
        <label class="tog"><input type="checkbox" data-ui="itemLabels" ${ui.itemLabels ? 'checked' : ''}> Label properti di 3D</label></div>
      <input type="search" class="search" data-q placeholder="Cari: kulkas, freezer, kasur, sofa…" value="${u.esc(ui.q)}">
      <div class="chips" style="margin-top:8px"><button class="chip${ui.kat === 'semua' ? ' on' : ''}" data-kat="semua">Semua</button>${HB.KATEGORI.map(k => `<button class="chip${ui.kat === k.id ? ' on' : ''}" data-kat="${k.id}">${k.n}</button>`).join('')}</div>
      <p class="note">${addTargetNote()}</p>
      <div id="catlist" class="catlist">${catList()}</div></div>
      <div class="sec"><details><summary><b>Buat properti sendiri</b></summary>
        <div class="grid" style="margin-top:8px">
          <label class="fld full">Nama<input id="c-n" placeholder="mis. Lemari es showcase"></label>
          <label class="fld">Lebar (m)<input id="c-w" type="number" step="0.05" value="1"></label>
          <label class="fld">Dalam (m)<input id="c-d" type="number" step="0.05" value="0.6"></label>
          <label class="fld">Tinggi (m)<input id="c-h" type="number" step="0.05" value="1"></label>
          <label class="fld">Elevasi (m)<input id="c-e" type="number" step="0.05" value="0"></label>
          <label class="fld">Warna<input id="c-c" type="color" value="#8fa3b5"></label>
          <label class="tog wide"><input id="c-l" type="checkbox"> Barang lantai (boleh ditimpa)</label>
        </div>
        <div class="row" style="margin-top:8px"><button class="btn pri" data-act="saveCat">Simpan ke katalog & tambahkan</button></div>
        <p class="note">Properti buatan sendiri tersimpan bersama data denah. Untuk bentuk 3D yang lebih detail, tambahkan di <code>js/data/katalog.js</code>.</p>
      </details></div>`;
  }
  function addTargetNote() {
    const r = targetRoom();
    return r ? `Klik "Tambah" menaruh di <b>${u.esc(r.name)}</b>, atau <b>seret langsung barangnya</b> ke denah.` : 'Klik "Tambah" menaruh di tengah lahan, atau <b>seret langsung barangnya</b> ke denah.';
  }
  function catList() {
    const st = HB.state, ui = HB.ui, q = ui.q.trim().toLowerCase();
    const list = G.catalog(st).filter(c => (ui.kat === 'semua' || c.kat === ui.kat) && (!q || c.n.toLowerCase().includes(q)));
    if (!list.length) return '<p class="note">Tidak ada barang yang cocok. Coba kata lain atau buat properti sendiri di bawah.</p>';
    return list.map(c => `<div class="catrow" draggable="true" data-dragcat="${c.id}" title="Seret langsung ke denah untuk menaruh di posisi yang diinginkan"><div><b>${u.esc(c.n)}</b><span>${u.f2(c.w)} × ${u.f2(c.d)} × ${u.f2(c.h)} m${c.elev ? ` · dipasang ${u.f2(c.elev)} m dari lantai` : ''}</span></div>
      <div class="row">${c.kat === 'kustom' ? `<button class="btn dng sm" data-delcat="${c.id}" aria-label="Hapus dari katalog">Hapus</button>` : ''}<button class="btn sm" data-add="${c.id}">Tambah</button></div></div>`).join('');
  }

  function tabRekap() {
    const st = HB.state, ui = HB.ui;
    let tot = 0, built = 0;
    const rows = st.rooms.map(r => {
      const d = G.dims(st, r, ui.net), a = d.w * d.d;
      tot += a; if (r.walls) built += a;
      return `<tr><td>${u.esc(r.name)}</td><td class="n">${u.f2(d.w)} × ${u.f2(d.d)}</td><td class="n">${u.f2(a)}</td></tr>`;
    }).join('');
    const irows = st.items.map(it => {
      const b = G.itemBox(st, it);
      if (!b) return '';
      const rm = G.roomAt(st, it.x, it.y);
      return { r: rm ? rm.name : '—', h: `<tr><td><button class="lnk" data-sel="item:${it.id}">${u.esc(it.name || b.c.n)}</button></td><td>${u.esc(rm ? rm.name : '—')}</td><td class="n">${u.f2(b.s.w)} × ${u.f2(b.s.d)} × ${u.f2(b.s.h)}</td></tr>` };
    }).filter(Boolean).sort((a, b) => a.r.localeCompare(b.r)).map(x => x.h).join('');
    return `<div class="sec"><h2>Ukuran ruang</h2><table><thead><tr><th>Ruang</th><th class="n">Ukuran (m)</th><th class="n">Luas (m²)</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td>Ruang berdinding</td><td></td><td class="n">${u.f2(built)}</td></tr><tr><td>Semua area</td><td></td><td class="n">${u.f2(tot)}</td></tr>
      <tr><td>Lahan</td><td class="n">${u.f2(st.site.w)} × ${u.f2(st.site.d)}</td><td class="n">${u.f2(st.site.w * st.site.d)}</td></tr></tfoot></table>
      <p class="note">${ui.net ? `Ukuran bersih = as-dinding dikurangi tebal dinding ${u.f2(st.wallT)} m (khusus ruang berdinding).` : 'Ukuran dihitung as ke as dinding. Aktifkan "Ukuran bersih" di tab Ruang & sekat untuk ukuran dalam ruang.'}</p></div>
      <div class="sec"><h2>Daftar properti (${st.items.length})</h2>${st.items.length ? `<table><thead><tr><th>Properti</th><th>Ruang</th><th class="n">L × D × T (m)</th></tr></thead><tbody>${irows}</tbody></table>` : '<p class="note">Belum ada properti. Tambahkan dari tab Properti.</p>'}</div>`;
  }

  function tabData() {
    return `<div class="sec"><h2>Simpan & pindahkan</h2>
      <p class="note" style="margin-top:0">Perubahan tersimpan otomatis di browser ini. Untuk cadangan atau berbagi, unduh berkas data.</p>
      <div class="row"><button class="btn pri" data-act="dlJson">Unduh data (.json)</button><button class="btn" data-act="openJson">Buka data (.json)</button>
        <button class="btn" data-act="dlPng">Unduh gambar 3D (.png)</button></div>
      <input type="file" id="fileJson" accept=".json,application/json" hidden>
      <textarea id="json" spellcheck="false">${u.esc(JSON.stringify(HB.state))}</textarea>
      <div class="row"><button class="btn" data-act="copy">Salin teks data</button><button class="btn" data-act="import">Terapkan teks dari kotak</button><span id="msg" class="note" style="margin:0"></span></div>
      <p class="note">Data dari versi artifact (tombol "Salin data") bisa ditempel ke kotak ini lalu diterapkan.</p></div>
      <div class="sec"><div class="row"><button class="btn dng" data-act="clearItems">Hapus semua properti</button><button class="btn dng" data-act="reset">Kembalikan denah awal</button></div></div>`;
  }

  /* ---------- aksi ---------- */
  function targetRoom() {
    const st = HB.state, sel = HB.sel;
    if (sel.kind === 'room') return st.rooms.find(r => r.id === sel.id) || null;
    if (sel.kind === 'item') { const it = st.items.find(x => x.id === sel.id); if (it) return G.roomAt(st, it.x, it.y); }
    return null;
  }
  function addItem(catId, pos) {
    const st = HB.state, r = targetRoom();
    const x = pos ? pos.x : (r ? u.r3(r.x + r.w / 2) : st.site.w / 2);
    const y = pos ? pos.y : (r ? u.r3(r.y + r.d / 2) : st.site.d / 2);
    const it = { id: u.uid('i'), cat: catId, x, y, rot: 0 };
    if (HB.ui.snapWall) G.snapItemToWalls(st, it, G.computeWalls(st).pieces);
    HB.pushUndo();
    st.items.push(it);
    HB.select('item', it.id);
  }
  Pn.addItem = addItem;
  function download(name, href) {
    const a = document.createElement('a');
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  const msg = t => { const m = document.getElementById('msg'); if (m) m.textContent = t; };

  function onDragStart(e) {
    const row = e.target.closest('[data-dragcat]');
    if (!row) return;
    const catId = row.dataset.dragcat;
    row.classList.add('dragging');
    e.dataTransfer.setData('text/plain', catId);
    e.dataTransfer.setData('application/x-hb-item', catId);
    e.dataTransfer.effectAllowed = 'copy';
  }
  function onDragEnd(e) {
    const row = e.target.closest('[data-dragcat]');
    if (row) row.classList.remove('dragging');
    const stage = document.getElementById('stage');
    if (stage) stage.classList.remove('dragover');
  }

  function onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const st = HB.state, ui = HB.ui, sel = HB.sel;
    if (b.dataset.tab) { ui.tab = b.dataset.tab; Pn.render(); return; }
    if (b.dataset.sel) { const [k, id] = b.dataset.sel.split(':'); HB.select(k, id); return; }
    if (b.dataset.kat) { ui.kat = b.dataset.kat; Pn.render(); return; }
    if (b.dataset.add) { addItem(b.dataset.add); return; }
    if (b.dataset.delcat) {
      if (st.items.some(i => i.cat === b.dataset.delcat)) { alert('Barang ini masih dipakai di denah. Hapus dulu dari denah.'); return; }
      HB.pushUndo(); st.customCatalog = st.customCatalog.filter(c => c.id !== b.dataset.delcat); HB.renderAll(); return;
    }
    if (b.dataset.wh) {
      const s = G.wallSegments(st).find(x => x.key === sel.id);
      if (!s) return;
      HB.pushUndo();
      G.setWallHeight(st, s, b.dataset.wh === 'std' ? null : +b.dataset.wh);
      HB.renderAll(); return;
    }
    if (b.dataset.nudge) {
      const r = st.rooms.find(x => x.id === sel.id);
      if (!r) return;
      HB.pushUndo();
      const E = G.startEdge(st, r, b.dataset.nudge, ui.linked);
      if (!G.applyEdge(E, E.c0 + +b.dataset.d)) HB.dropUndo();
      HB.renderAll(); return;
    }
    const a = b.dataset.act, it = sel.kind === 'item' ? st.items.find(x => x.id === sel.id) : null;
    switch (a) {
      case 'addRoom': {
        HB.pushUndo();
        const r = { id: u.uid('r'), name: 'Ruang Baru', type: 'publik', x: 0.5, y: 0.5, w: 2.5, d: 2.5, walls: true, label: true, group: '' };
        st.rooms.push(r); HB.select('room', r.id); break;
      }
      case 'dupRoom': {
        const r = st.rooms.find(x => x.id === sel.id); if (!r) return;
        HB.pushUndo();
        const c = Object.assign(u.clone(r), { id: u.uid('r'), name: r.name + ' (salinan)', x: u.r2(Math.min(st.site.w - r.w, r.x + 0.3)), y: u.r2(Math.min(st.site.d - r.d, r.y + 0.3)) });
        st.rooms.push(c); HB.select('room', c.id); break;
      }
      case 'delRoom': HB.pushUndo(); st.rooms = st.rooms.filter(r => r.id !== sel.id); HB.select(null, null); break;
      case 'addOp': {
        HB.pushUndo();
        const t = b.dataset.t, w = { door: 0.8, window: 1.0, open: 1.2 }[t];
        const cur = sel.kind === 'room' && st.rooms.find(x => x.id === sel.id);
        const r = cur && cur.walls ? cur : st.rooms.find(x => x.walls);
        const op = { id: u.uid('o'), type: t, o: 'h', c: r ? r.y : 0, p: r ? u.r2(r.x + r.w / 2) : 1, w };
        st.openings.push(op); HB.select('op', op.id); break;
      }
      case 'delOp': HB.pushUndo(); st.openings = st.openings.filter(o => o.id !== sel.id); HB.select(null, null); break;
      case 'rotL': case 'rotR': if (it) { HB.pushUndo(); it.rot = (((it.rot || 0) + (a === 'rotR' ? 90 : -90)) % 360 + 360) % 360; HB.renderAll(); } break;
      case 'resetSize': if (it) { HB.pushUndo(); delete it.w; delete it.d; delete it.h; HB.renderAll(); } break;
      case 'dupItem': if (it) { HB.pushUndo(); const c = Object.assign(u.clone(it), { id: u.uid('i'), x: u.r3(it.x + 0.3), y: u.r3(it.y + 0.3) }); st.items.push(c); HB.select('item', c.id); } break;
      case 'delItem': if (it) { HB.pushUndo(); st.items = st.items.filter(x => x !== it); HB.select(null, null); } break;
      case 'saveCat': {
        const v = id => document.getElementById(id);
        const n = v('c-n').value.trim(), w = +v('c-w').value, d = +v('c-d').value, h = +v('c-h').value;
        if (!n || !(w > 0) || !(d > 0) || !(h > 0)) { alert('Isi nama, lebar, dalam, dan tinggi lebih dari 0.'); return; }
        HB.pushUndo();
        const c = { id: u.uid('k'), n, kat: 'kustom', w, d, h, elev: +v('c-e').value || 0, c: v('c-c').value };
        if (v('c-l').checked) c.lantai = true;
        st.customCatalog.push(c);
        addItem(c.id); HB.dropUndo(); break;
      }
      case 'clearItems': if (confirm('Hapus semua properti dari denah?')) { HB.pushUndo(); st.items = []; HB.select(null, null); } break;
      case 'reset': if (confirm('Kembalikan ke denah awal? Perubahan bisa dibatalkan dengan tombol Batalkan.')) HB.resetState(); break;
      case 'dlJson': download('denah-rumah.json', URL.createObjectURL(new Blob([JSON.stringify(st, null, 2)], { type: 'application/json' }))); break;
      case 'openJson': { const f = document.getElementById('fileJson'); f.onchange = () => { const file = f.files[0]; if (!file) return; file.text().then(t => HB.applyJson(t, msg)); }; f.click(); break; }
      case 'dlPng': {
        const url = HB.view3d.snapshot();
        if (!url) { msg('Tampilan 3D tidak tersedia.'); break; }
        if (ui.mode !== '3d') msg('Gambar diambil dari sudut kamera 3D terakhir.');
        download('denah-3d.png', url); break;
      }
      case 'copy': {
        const t = document.getElementById('json');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(() => msg('Data disalin.'), () => { t.select(); msg('Salin manual: teks sudah dipilih.'); });
        else { t.select(); msg('Salin manual: teks sudah dipilih.'); }
        break;
      }
      case 'import': HB.applyJson(document.getElementById('json').value, msg); break;
    }
  }

  function onChange(e) {
    const t = e.target, st = HB.state, ui = HB.ui, sel = HB.sel;
    if (t.matches('[data-warn]')) return;
    if (t.dataset.ui) { ui[t.dataset.ui] = t.type === 'checkbox' ? t.checked : +t.value; HB.renderAll(); return; }
    if (t.dataset.st === 'wallH') {
      const v = u.r2(+t.value);
      if (!(v >= 1 && v <= 6)) { Pn.render(); return; }
      HB.pushUndo(); st.wallH = v; HB.renderAll(); return;
    }
    if (t.dataset.w === 'h') {
      const s = G.wallSegments(st).find(x => x.key === sel.id), v = u.r2(+t.value);
      if (!s || !(v >= 0.1 && v <= 6)) { Pn.render(); return; }
      HB.pushUndo(); G.setWallHeight(st, s, v); HB.renderAll(); return;
    }
    if (t.dataset.f) {
      const r = st.rooms.find(x => x.id === sel.id); if (!r) return;
      HB.pushUndo();
      const f = t.dataset.f;
      if (t.type === 'checkbox') r[f] = t.checked;
      else if (t.type === 'number') { let v = u.r2(+t.value); if (isNaN(v)) { HB.dropUndo(); return; } if ((f === 'w' || f === 'd') && v < 0.3) v = 0.3; r[f] = v; }
      else r[f] = f === 'group' ? t.value.trim() : t.value;
      HB.renderAll(); return;
    }
    if (t.dataset.o) {
      const op = st.openings.find(x => x.id === sel.id); if (!op) return;
      HB.pushUndo();
      if (t.dataset.o === 'w') op.w = Math.max(0.3, u.r2(+t.value) || 0.8); else op.type = t.value;
      HB.renderAll(); return;
    }
    if (t.dataset.i) {
      const it = st.items.find(x => x.id === sel.id); if (!it) return;
      HB.pushUndo();
      const f = t.dataset.i;
      if (f === 'name') it.name = t.value.trim() || undefined;
      else if (f === 'color') it.color = t.value;
      else if (f === 'elev') it.elev = t.value === '' ? undefined : Math.max(0, u.r2(+t.value));
      else if (f === 'w' || f === 'd' || f === 'h') {
        const v = u.r2(+t.value), c = G.cat(st, it.cat);
        if (!(v >= (f === 'h' ? 0.02 : 0.05))) { HB.dropUndo(); Pn.render(); return; }
        if (c && Math.abs(v - c[f]) < 1e-3) delete it[f]; else it[f] = v;   // sama dengan katalog → tidak perlu disimpan
      }
      else { const v = u.r3(+t.value); if (!isNaN(v)) it[f] = v; }
      HB.renderAll();
    }
  }

  function onInput(e) {
    const t = e.target;
    if (t.dataset.ui === 'viewH') { HB.ui.viewH = +t.value; t.nextElementSibling.textContent = u.f2(HB.ui.viewH) + ' m'; HB.view3d.build(); }
    else if (t.hasAttribute('data-q')) { HB.ui.q = t.value; document.getElementById('catlist').innerHTML = catList(); }
  }
  document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('[data-warn]')) HB.ui.warnOpen = e.target.open; }, true);
})();
