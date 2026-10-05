/* =====================================================================
   KATALOG PROPERTI
   ---------------------------------------------------------------------
   Tambah / ubah barang di sini. Satuan: meter.
     id    : kode unik (huruf kecil, tanpa spasi)
     n     : nama yang tampil
     kat   : id kategori (lihat HB.KATEGORI)
     w,d,h : lebar (kiri-kanan), dalam (belakang-depan), tinggi
     elev  : tinggi dasar dari lantai (mis. AC = 2.3). Default 0.
     lantai: true untuk barang yang boleh ditumpuk barang lain (karpet, sajadah)
     parts : bentuk 3D tersusun dari kotak. Opsional; jika kosong -> satu kotak.
             Koordinat lokal: x = kiri->kanan, y = belakang->depan, z = naik.
             Sisi belakang (y = 0) adalah sisi yang biasanya menempel ke dinding.
             Saat rotasi 0°, sisi belakang menghadap UTARA.
   ===================================================================== */
(function () {
  const HB = (window.HB = window.HB || {});

  HB.KATEGORI = [
    { id: 'kamar', n: 'Kamar tidur' },
    { id: 'tamu', n: 'Ruang tamu & keluarga' },
    { id: 'dapur', n: 'Dapur & makan' },
    { id: 'basah', n: 'Kamar mandi & cuci' },
    { id: 'ibadah', n: 'Ibadah' },
    { id: 'kerja', n: 'Kerja & belajar' },
    { id: 'elektronik', n: 'Elektronik' },
    { id: 'luar', n: 'Luar ruang & kendaraan' },
    { id: 'kustom', n: 'Buatan sendiri' }
  ];

  /* ---------- palet ---------- */
  const KAYU = '#8b5e3c', KAYU_M = '#b08658', KAB = '#cdbb9f', PUTIH = '#f2f0ea', SPREI = '#fbfaf7',
    ABU = '#9aa0a6', GELAP = '#33383e', HITAM = '#1d1f22', KAIN = '#6f8192', KACA = '#9cc8e0',
    HIJAU = '#4f7d3a', ES = '#dfe4e8';

  /* ---------- helper bentuk ---------- */
  const P = (x, y, z, w, d, h, c, o) => (o ? { x, y, z, w, d, h, c, o } : { x, y, z, w, d, h, c });
  const kaki = (W, D, H, c, t = 0.05) => [P(0, 0, 0, t, t, H, c), P(W - t, 0, 0, t, t, H, c), P(0, D - t, 0, t, t, H, c), P(W - t, D - t, 0, t, t, H, c)];
  const meja = (W, D, H, top, k) => [P(0, 0, H - 0.04, W, D, 0.04, top), ...kaki(W, D, H - 0.04, k || top)];
  const geser = (arr, dx, dy) => arr.map(p => Object.assign({}, p, { x: p.x + dx, y: p.y + dy }));
  const cermin = (arr, D) => arr.map(p => Object.assign({}, p, { y: D - p.y - p.d }));

  function kasur(W, D, rangka) {
    const t = rangka ? 0.3 : 0;
    const a = [];
    if (rangka) a.push(P(0, 0, 0, W, D, 0.3, KAYU), P(0, 0, 0, W, 0.08, 1.0, KAYU));
    a.push(P(0.03, 0.1, t, W - 0.06, D - 0.13, rangka ? 0.2 : 0.25, SPREI));
    const zb = t + (rangka ? 0.2 : 0.25);
    if (W > 1.2) a.push(P(0.12, 0.15, zb, W / 2 - 0.18, 0.35, 0.1, '#ffffff'), P(W / 2 + 0.06, 0.15, zb, W / 2 - 0.18, 0.35, 0.1, '#ffffff'));
    else a.push(P(0.12, 0.15, zb, W - 0.24, 0.35, 0.1, '#ffffff'));
    a.push(P(0.03, D * 0.55, zb, W - 0.06, D * 0.42, 0.03, '#7d8fa6'));
    return a;
  }
  function sofa(W, D, c) {
    return [P(0, 0, 0, W, D, 0.42, c), P(0, 0, 0.42, W, 0.2, 0.38, c), P(0, 0, 0.42, 0.18, D, 0.2, c), P(W - 0.18, 0, 0.42, 0.18, D, 0.2, c)];
  }
  function sofaL(W, D, c) {
    const s = 0.85;
    return [P(0, 0, 0, W, s, 0.42, c), P(0, 0, 0.42, W, 0.2, 0.38, c), P(0, s, 0, s, D - s, 0.42, c),
      P(0, 0, 0.42, 0.2, D, 0.38, c), P(W - 0.18, 0, 0.42, 0.18, s, 0.2, c)];
  }
  function lemari(W, D, H, c) {
    const n = Math.max(2, Math.round(W / 0.5)), a = [P(0, 0, 0, W, D, H, c)];
    for (let i = 1; i < n; i++) a.push(P((W * i) / n - 0.005, D - 0.005, 0.08, 0.01, 0.01, H - 0.16, GELAP));
    return a;
  }
  function kursi(W, D, c) {
    return [...kaki(W, D, 0.43, c, 0.04), P(0, 0, 0.42, W, D, 0.05, c), P(0, 0, 0.47, W, 0.05, 0.45, c)];
  }
  function setMakan(n) {
    const W = n === 4 ? 1.2 : 1.8, D = 0.8, DT = 1.7, off = (DT - D) / 2, cw = 0.45, per = n / 2;
    const a = geser(meja(W, D, 0.75, KAYU_M, KAYU), 0, off);
    for (let i = 0; i < per; i++) {
      const x = (W / per) * (i + 0.5) - cw / 2;
      a.push(...geser(kursi(cw, cw, KAYU), x, 0));
      a.push(...geser(cermin(kursi(cw, cw, KAYU), cw), x, DT - cw));
    }
    return a;
  }
  function kulkas(W, D, H, pintu) {
    const a = [P(0, 0, 0, W, D, H, ES)];
    if (pintu === 2) a.push(P(0, D, H * 0.7, W, 0.01, 0.01, GELAP), P(W - 0.08, D, H * 0.72, 0.02, 0.02, 0.25, ABU), P(W - 0.08, D, H * 0.35, 0.02, 0.02, 0.3, ABU));
    else if (pintu === 3) a.push(P(W / 2 - 0.005, D, 0.05, 0.01, 0.01, H - 0.1, GELAP), P(W / 2 - 0.06, D, H * 0.4, 0.02, 0.02, 0.4, ABU), P(W / 2 + 0.04, D, H * 0.4, 0.02, 0.02, 0.4, ABU));
    else a.push(P(W - 0.08, D, H * 0.45, 0.02, 0.02, 0.3, ABU));
    return a;
  }
  function kabinetBawah(W, D, sink, kompor) {
    const a = [P(0, 0, 0, W, D, 0.8, KAB), P(0, 0, 0.8, W, D, 0.05, '#5b5f63')];
    const n = Math.max(2, Math.round(W / 0.5));
    for (let i = 1; i < n; i++) a.push(P((W * i) / n - 0.005, D - 0.005, 0.08, 0.01, 0.01, 0.64, GELAP));
    if (sink) a.push(P(W / 2 - 0.3, 0.08, 0.85, 0.6, 0.4, 0.01, '#b9c2c9'), P(W / 2 - 0.03, 0.05, 0.85, 0.06, 0.06, 0.3, ABU));
    if (kompor) a.push(P(W / 2 - 0.35, 0.08, 0.85, 0.7, 0.45, 0.08, HITAM));
    return a;
  }
  function mobil(W, D, H, c) {
    const r = 0.33, a = [P(0, 0.1, 0.18, W, D - 0.2, H * 0.4, c), P(0.08, D * 0.28, 0.18 + H * 0.4, W - 0.16, D * 0.48, H * 0.45, KACA, 0.85)];
    [[0, 0.55], [W - 0.2, 0.55], [0, D - 0.55 - 2 * r], [W - 0.2, D - 0.55 - 2 * r]].forEach(([x, y]) => a.push(P(x, y, 0, 0.2, 2 * r, 2 * r, HITAM)));
    a.push(P(0.15, D - 0.1, 0.4, 0.3, 0.1, 0.12, '#f4f1d0'), P(W - 0.45, D - 0.1, 0.4, 0.3, 0.1, 0.12, '#f4f1d0'));
    return a;
  }
  function motor(W, D) {
    return [P(W / 2 - 0.05, 0, 0, 0.1, 0.6, 0.6, HITAM), P(W / 2 - 0.05, D - 0.6, 0, 0.1, 0.6, 0.6, HITAM),
      P(W / 2 - 0.15, 0.35, 0.35, 0.3, D - 0.7, 0.35, '#8c2f2f'), P(W / 2 - 0.14, 0.4, 0.7, 0.28, 0.7, 0.1, HITAM),
      P(0, D - 0.45, 0.95, W, 0.05, 0.05, GELAP)];
  }
  function rak(W, D, H, c, n) {
    const a = [P(0, 0, 0, 0.03, D, H, c), P(W - 0.03, 0, 0, 0.03, D, H, c), P(0, 0, 0, W, 0.02, H, c)];
    for (let i = 0; i <= n; i++) a.push(P(0, 0, (H - 0.03) * (i / n), W, D, 0.03, c));
    return a;
  }
  // jemuran dinding: 2 braket di dinding + batang jemur; lebar/tonjolan/tinggi pasang bisa diubah per barang
  function jemuranDinding(W, D) {
    const a = [P(0, 0, 0, 0.04, D, 0.1, ABU), P(W - 0.04, 0, 0, 0.04, D, 0.1, ABU), P(0, 0, 0.03, W, 0.03, 0.05, ABU)];
    const n = Math.max(3, Math.round(D / 0.09));
    for (let i = 1; i <= n; i++) a.push(P(0.02, (D - 0.03) * (i / n), 0.08, W - 0.04, 0.015, 0.015, '#c9ced3'));
    return a;
  }
  // island: kabinet + laci di sisi belakang (y = 0, sisi dapur), top menjorok 15 cm di sisi depan (sisi makan)
  function island(W, D, H) {
    const top = 0.04, cab = D - 0.15, n = Math.max(2, Math.round(W / 0.5));
    const a = [P(0, 0, 0, W, cab, H - top, KAB), P(0, 0, H - top, W, D, top, '#e9e6df'),
      P(0.03, -0.005, (H - top) * 0.55, W - 0.06, 0.005, 0.01, GELAP)];
    for (let i = 1; i < n; i++) a.push(P((W * i) / n - 0.005, -0.005, 0.08, 0.01, 0.005, H - top - 0.16, GELAP));
    return a;
  }
  function tanaman(W, H) {
    return [P(W * 0.2, W * 0.2, 0, W * 0.6, W * 0.6, H * 0.3, '#a0522d'), P(0, 0, H * 0.3, W, W, H * 0.7, HIJAU)];
  }

  /* ---------- daftar barang ---------- */
  HB.KATALOG = [
    // Kamar tidur
    { id: 'kasur_single', n: 'Kasur single 90×200', kat: 'kamar', w: 0.9, d: 2.0, h: 1.0, parts: kasur(0.9, 2.0, true) },
    { id: 'kasur_queen', n: 'Kasur queen 160×200', kat: 'kamar', w: 1.6, d: 2.0, h: 1.0, parts: kasur(1.6, 2.0, true) },
    { id: 'kasur_king', n: 'Kasur king 180×200', kat: 'kamar', w: 1.8, d: 2.0, h: 1.0, parts: kasur(1.8, 2.0, true) },
    { id: 'kasur_lantai', n: 'Kasur lantai / spring bed tanpa rangka 160×200', kat: 'kamar', w: 1.6, d: 2.0, h: 0.35, parts: kasur(1.6, 2.0, false) },
    { id: 'ranjang_susun', n: 'Ranjang susun 90×200', kat: 'kamar', w: 0.9, d: 2.0, h: 1.7,
      parts: [...kaki(0.9, 2.0, 1.7, KAYU, 0.06), P(0, 0, 0.25, 0.9, 2.0, 0.08, KAYU), P(0.03, 0.03, 0.33, 0.84, 1.94, 0.15, SPREI), P(0, 0, 1.1, 0.9, 2.0, 0.08, KAYU), P(0.03, 0.03, 1.18, 0.84, 1.94, 0.15, SPREI)] },
    { id: 'box_bayi', n: 'Box bayi', kat: 'kamar', w: 0.7, d: 1.2, h: 0.95,
      parts: [...kaki(0.7, 1.2, 0.95, PUTIH, 0.05), P(0, 0, 0.3, 0.7, 1.2, 0.05, PUTIH), P(0.03, 0.03, 0.35, 0.64, 1.14, 0.1, SPREI), P(0, 0, 0.9, 0.7, 0.03, 0.05, PUTIH), P(0, 1.17, 0.9, 0.7, 0.03, 0.05, PUTIH)] },
    { id: 'lemari_2', n: 'Lemari pakaian 2 pintu', kat: 'kamar', w: 1.0, d: 0.6, h: 2.0, parts: lemari(1.0, 0.6, 2.0, KAYU_M) },
    { id: 'lemari_3', n: 'Lemari pakaian 3 pintu', kat: 'kamar', w: 1.5, d: 0.6, h: 2.0, parts: lemari(1.5, 0.6, 2.0, KAYU_M) },
    { id: 'nakas', n: 'Nakas / meja samping', kat: 'kamar', w: 0.45, d: 0.4, h: 0.5, parts: [P(0, 0, 0, 0.45, 0.4, 0.5, KAYU_M), P(0.05, 0.395, 0.3, 0.35, 0.01, 0.01, GELAP)] },
    { id: 'meja_rias', n: 'Meja rias + cermin', kat: 'kamar', w: 1.0, d: 0.45, h: 1.6, parts: [...meja(1.0, 0.45, 0.75, KAYU_M), P(0.2, 0, 0.75, 0.6, 0.03, 0.85, KACA, 0.9)] },

    // Ruang tamu
    { id: 'sofa_2', n: 'Sofa 2 dudukan', kat: 'tamu', w: 1.5, d: 0.85, h: 0.8, parts: sofa(1.5, 0.85, KAIN) },
    { id: 'sofa_3', n: 'Sofa 3 dudukan', kat: 'tamu', w: 2.0, d: 0.85, h: 0.8, parts: sofa(2.0, 0.85, KAIN) },
    { id: 'sofa_l', n: 'Sofa L', kat: 'tamu', w: 2.4, d: 1.6, h: 0.8, parts: sofaL(2.4, 1.6, KAIN) },
    { id: 'kursi_tamu', n: 'Kursi tamu', kat: 'tamu', w: 0.7, d: 0.75, h: 0.8, parts: sofa(0.7, 0.75, KAIN) },
    { id: 'meja_tamu', n: 'Meja tamu', kat: 'tamu', w: 1.0, d: 0.55, h: 0.45, parts: meja(1.0, 0.55, 0.45, KAYU_M, KAYU) },
    { id: 'bufet_tv', n: 'Bufet TV', kat: 'tamu', w: 1.6, d: 0.4, h: 0.5, parts: [P(0, 0, 0, 1.6, 0.4, 0.5, KAYU), P(0.795, 0.395, 0.05, 0.01, 0.01, 0.4, GELAP)] },
    { id: 'karpet', n: 'Karpet 200×140', kat: 'tamu', w: 2.0, d: 1.4, h: 0.01, lantai: true, parts: [P(0, 0, 0, 2.0, 1.4, 0.01, '#b98f6a')] },
    { id: 'rak_sepatu', n: 'Rak sepatu', kat: 'tamu', w: 0.8, d: 0.35, h: 1.0, parts: rak(0.8, 0.35, 1.0, KAYU_M, 4) },
    { id: 'tanaman', n: 'Tanaman pot', kat: 'tamu', w: 0.4, d: 0.4, h: 1.0, parts: tanaman(0.4, 1.0) },

    // Dapur & makan
    { id: 'kulkas_1', n: 'Kulkas 1 pintu', kat: 'dapur', w: 0.55, d: 0.6, h: 1.2, parts: kulkas(0.55, 0.6, 1.2, 1) },
    { id: 'kulkas_2', n: 'Kulkas 2 pintu', kat: 'dapur', w: 0.65, d: 0.7, h: 1.7, parts: kulkas(0.65, 0.7, 1.7, 2) },
    { id: 'kulkas_sbs', n: 'Kulkas side-by-side', kat: 'dapur', w: 0.9, d: 0.75, h: 1.8, parts: kulkas(0.9, 0.75, 1.8, 3) },
    { id: 'freezer_box', n: 'Freezer box', kat: 'dapur', w: 1.0, d: 0.6, h: 0.85, parts: [P(0, 0, 0, 1.0, 0.6, 0.8, PUTIH), P(0, 0, 0.8, 1.0, 0.6, 0.05, '#c9ced3'), P(0.4, 0.6, 0.7, 0.2, 0.02, 0.04, ABU)] },
    { id: 'freezer_tegak', n: 'Freezer tegak', kat: 'dapur', w: 0.6, d: 0.65, h: 1.5, parts: kulkas(0.6, 0.65, 1.5, 1) },
    { id: 'kitchen_bawah', n: 'Kitchen set bawah 200 cm', kat: 'dapur', w: 2.0, d: 0.6, h: 0.85, parts: kabinetBawah(2.0, 0.6) },
    { id: 'kitchen_sink', n: 'Kitchen set + bak cuci 100 cm', kat: 'dapur', w: 1.0, d: 0.6, h: 1.15, parts: kabinetBawah(1.0, 0.6, true) },
    { id: 'kitchen_atas', n: 'Kabinet gantung 200 cm', kat: 'dapur', w: 2.0, d: 0.35, h: 0.7, elev: 1.5, parts: lemari(2.0, 0.35, 0.7, KAB) },
    { id: 'kompor', n: 'Kompor 2 tungku (di atas meja)', kat: 'dapur', w: 0.7, d: 0.45, h: 0.1, elev: 0.85,
      parts: [P(0, 0, 0, 0.7, 0.45, 0.08, HITAM), P(0.12, 0.12, 0.08, 0.18, 0.18, 0.02, ABU), P(0.4, 0.12, 0.08, 0.18, 0.18, 0.02, ABU)] },
    { id: 'meja_makan_4', n: 'Set meja makan 4 kursi', kat: 'dapur', w: 1.2, d: 1.7, h: 0.92, parts: setMakan(4) },
    { id: 'meja_makan_6', n: 'Set meja makan 6 kursi', kat: 'dapur', w: 1.8, d: 1.7, h: 0.92, parts: setMakan(6) },
    { id: 'dispenser', n: 'Dispenser galon', kat: 'dapur', w: 0.35, d: 0.35, h: 1.4, parts: [P(0, 0, 0, 0.35, 0.35, 1.0, PUTIH), P(0.04, 0.04, 1.0, 0.27, 0.27, 0.4, '#8fc1e0', 0.6)] },
    { id: 'kitchen_island', n: 'Kitchen island (kabinet + laci, top menjorok)', kat: 'dapur', w: 1.6, d: 0.7, h: 0.9, parts: island(1.6, 0.7, 0.9) },
    { id: 'meja_makan_konter', n: 'Meja makan konter 180×50 (satu sisi duduk)', kat: 'dapur', w: 1.8, d: 0.5, h: 0.75, parts: meja(1.8, 0.5, 0.75, KAYU_M, KAYU) },
    { id: 'kursi_makan', n: 'Kursi makan', kat: 'dapur', w: 0.45, d: 0.45, h: 0.9, parts: kursi(0.45, 0.45, KAYU) },
    { id: 'meja_bar', n: 'Meja bar 120×45', kat: 'dapur', w: 1.2, d: 0.45, h: 0.95, parts: meja(1.2, 0.45, 0.95, KAYU_M, GELAP) },
    { id: 'stool_bar', n: 'Stool bar', kat: 'dapur', w: 0.38, d: 0.38, h: 0.75,
      parts: [...kaki(0.38, 0.38, 0.72, GELAP, 0.03), P(0, 0, 0.72, 0.38, 0.38, 0.03, KAYU_M)] },
    { id: 'cooker_hood', n: 'Cooker hood + cerobong exhaust', kat: 'dapur', w: 0.7, d: 0.45, h: 0.55, elev: 1.55,
      parts: [P(0, 0, 0, 0.7, 0.45, 0.12, '#b9c0c6'), P(0.23, 0, 0.12, 0.24, 0.22, 0.43, '#b9c0c6')] },
    { id: 'rak_piring', n: 'Rak piring', kat: 'dapur', w: 0.8, d: 0.4, h: 1.4, parts: rak(0.8, 0.4, 1.4, '#b7bdc2', 4) },
    { id: 'tempat_sampah', n: 'Tempat sampah', kat: 'dapur', w: 0.35, d: 0.35, h: 0.6, parts: [P(0, 0, 0, 0.35, 0.35, 0.6, '#5f7a6a')] },

    // Kamar mandi & cuci
    { id: 'kloset_duduk', n: 'Kloset duduk', kat: 'basah', w: 0.4, d: 0.7, h: 0.75, parts: [P(0.05, 0.2, 0, 0.3, 0.5, 0.4, PUTIH), P(0, 0, 0, 0.4, 0.2, 0.75, PUTIH)] },
    { id: 'kloset_jongkok', n: 'Kloset jongkok', kat: 'basah', w: 0.45, d: 0.6, h: 0.15, parts: [P(0, 0, 0, 0.45, 0.6, 0.15, PUTIH), P(0.1, 0.15, 0.15, 0.25, 0.35, 0.005, '#c7d3da')] },
    { id: 'wastafel', n: 'Wastafel', kat: 'basah', w: 0.5, d: 0.45, h: 1.0, parts: [P(0.17, 0.05, 0, 0.16, 0.16, 0.7, PUTIH), P(0, 0, 0.7, 0.5, 0.45, 0.15, PUTIH), P(0.23, 0.02, 0.85, 0.04, 0.08, 0.15, ABU)] },
    { id: 'bak_mandi', n: 'Bak mandi', kat: 'basah', w: 0.8, d: 0.6, h: 0.7, parts: [P(0, 0, 0, 0.8, 0.6, 0.7, '#cfe0ea'), P(0.06, 0.06, 0.7, 0.68, 0.48, 0.005, '#7fb5d6')] },
    { id: 'shower', n: 'Area shower 90×90', kat: 'basah', w: 0.9, d: 0.9, h: 2.0, lantai: true, parts: [P(0, 0, 0, 0.9, 0.9, 0.03, '#d7e3ea'), P(0.4, 0.02, 0.03, 0.04, 0.04, 1.97, ABU), P(0, 0.88, 0.03, 0.9, 0.02, 1.9, KACA, 0.35)] },
    { id: 'mesin_cuci_fl', n: 'Mesin cuci bukaan depan', kat: 'basah', w: 0.6, d: 0.6, h: 0.85, parts: [P(0, 0, 0, 0.6, 0.6, 0.85, PUTIH), P(0.15, 0.6, 0.25, 0.3, 0.01, 0.3, '#5d6b75')] },
    { id: 'mesin_cuci_tl', n: 'Mesin cuci bukaan atas', kat: 'basah', w: 0.55, d: 0.55, h: 0.95, parts: [P(0, 0, 0, 0.55, 0.55, 0.9, PUTIH), P(0, 0, 0.9, 0.55, 0.55, 0.05, '#b8c2c9')] },
    { id: 'water_heater', n: 'Water heater (dinding)', kat: 'basah', w: 0.4, d: 0.4, h: 0.6, elev: 1.7, parts: [P(0, 0, 0, 0.4, 0.4, 0.6, PUTIH)] },
    { id: 'jemuran', n: 'Jemuran lipat', kat: 'basah', w: 1.5, d: 0.6, h: 1.2, parts: [...kaki(1.5, 0.6, 1.2, ABU, 0.03), P(0, 0.28, 1.15, 1.5, 0.04, 0.05, ABU)] },
    { id: 'jemuran_dinding', n: 'Jemuran dinding lipat (aluminium)', kat: 'basah', w: 1.2, d: 0.45, h: 0.1, elev: 1.6, parts: jemuranDinding(1.2, 0.45) },
    { id: 'setrika_dinding', n: 'Meja setrika lipat dinding', kat: 'basah', w: 1.0, d: 0.35, h: 0.93,
      parts: [P(0, 0, 0.85, 1.0, 0.35, 0.03, '#d9dde1'), P(0, 0, 0.35, 0.06, 0.03, 0.5, ABU), P(0.86, 0.14, 0, 0.04, 0.04, 0.85, ABU),
        P(0.15, 0.1, 0.88, 0.22, 0.13, 0.05, '#2f6fd6')] },
    { id: 'meja_setrika', n: 'Meja setrika berdiri', kat: 'basah', w: 1.2, d: 0.38, h: 0.9,
      parts: [P(0, 0, 0.87, 1.2, 0.38, 0.03, '#d9dde1'), P(0.3, 0.17, 0, 0.04, 0.04, 0.87, ABU), P(0.85, 0.17, 0, 0.04, 0.04, 0.87, ABU)] },
    { id: 'kabinet_laundry', n: 'Kabinet gantung laundry (deterjen)', kat: 'basah', w: 0.6, d: 0.3, h: 0.6, elev: 1.6, parts: lemari(0.6, 0.3, 0.6, PUTIH) },
    { id: 'keranjang_baju', n: 'Keranjang pakaian', kat: 'basah', w: 0.45, d: 0.35, h: 0.55, parts: [P(0, 0, 0, 0.45, 0.35, 0.55, '#c9b89a')] },

    // Ibadah
    { id: 'sajadah', n: 'Sajadah', kat: 'ibadah', w: 0.7, d: 1.2, h: 0.01, lantai: true, parts: [P(0, 0, 0, 0.7, 1.2, 0.01, '#3f6b3a')] },
    { id: 'rak_quran', n: "Rak Al-Qur'an", kat: 'ibadah', w: 0.6, d: 0.3, h: 1.0, parts: rak(0.6, 0.3, 1.0, KAYU, 3) },
    { id: 'lemari_mukena', n: 'Lemari mukena', kat: 'ibadah', w: 0.8, d: 0.4, h: 1.2, parts: lemari(0.8, 0.4, 1.2, KAYU_M) },

    // Kerja
    { id: 'meja_kerja', n: 'Meja kerja', kat: 'kerja', w: 1.2, d: 0.6, h: 0.75, parts: meja(1.2, 0.6, 0.75, KAYU_M, GELAP) },
    { id: 'kursi_kerja', n: 'Kursi kerja', kat: 'kerja', w: 0.6, d: 0.6, h: 1.0, parts: [P(0.27, 0.27, 0, 0.06, 0.06, 0.45, GELAP), P(0.05, 0.05, 0.45, 0.5, 0.5, 0.07, HITAM), P(0.05, 0.05, 0.52, 0.5, 0.06, 0.48, HITAM)] },
    { id: 'rak_buku', n: 'Rak buku', kat: 'kerja', w: 0.8, d: 0.3, h: 1.8, parts: rak(0.8, 0.3, 1.8, KAYU_M, 5) },

    // Elektronik
    { id: 'tv_43', n: 'TV 43" (dinding)', kat: 'elektronik', w: 0.97, d: 0.06, h: 0.57, elev: 1.0, parts: [P(0, 0, 0, 0.97, 0.06, 0.57, HITAM)] },
    { id: 'tv_55', n: 'TV 55" (dinding)', kat: 'elektronik', w: 1.24, d: 0.06, h: 0.72, elev: 1.0, parts: [P(0, 0, 0, 1.24, 0.06, 0.72, HITAM)] },
    { id: 'ac_split', n: 'AC split (indoor)', kat: 'elektronik', w: 0.8, d: 0.22, h: 0.3, elev: 2.3, parts: [P(0, 0, 0, 0.8, 0.22, 0.3, PUTIH), P(0.05, 0.22, 0.04, 0.7, 0.005, 0.05, ABU)] },
    { id: 'exhaust_fan', n: 'Exhaust fan (dinding / plafon)', kat: 'elektronik', w: 0.3, d: 0.15, h: 0.3, elev: 2.35,
      parts: [P(0, 0, 0, 0.3, 0.15, 0.3, PUTIH), P(0.04, 0.15, 0.06, 0.22, 0.005, 0.02, GELAP), P(0.04, 0.15, 0.12, 0.22, 0.005, 0.02, GELAP),
        P(0.04, 0.15, 0.18, 0.22, 0.005, 0.02, GELAP), P(0.04, 0.15, 0.24, 0.22, 0.005, 0.02, GELAP)] },
    { id: 'kipas', n: 'Kipas angin berdiri', kat: 'elektronik', w: 0.45, d: 0.45, h: 1.3, parts: [P(0.1, 0.1, 0, 0.25, 0.25, 0.04, GELAP), P(0.2, 0.2, 0.04, 0.05, 0.05, 0.9, ABU), P(0, 0.2, 0.94, 0.45, 0.08, 0.36, GELAP)] },

    // Luar & kendaraan
    { id: 'mobil_mpv', n: 'Mobil MPV (±4,4 m)', kat: 'luar', w: 1.75, d: 4.4, h: 1.7, parts: mobil(1.75, 4.4, 1.7, '#d4d7da') },
    { id: 'mobil_city', n: 'City car (±3,9 m)', kat: 'luar', w: 1.65, d: 3.9, h: 1.5, parts: mobil(1.65, 3.9, 1.5, '#a33b3b') },
    { id: 'motor', n: 'Sepeda motor', kat: 'luar', w: 0.7, d: 1.9, h: 1.1, parts: motor(0.7, 1.9) },
    { id: 'set_teras', n: 'Meja teras + 2 kursi', kat: 'luar', w: 1.4, d: 0.7, h: 0.8,
      parts: [...geser(sofa(0.55, 0.6, KAYU_M), 0, 0.05), ...geser(meja(0.3, 0.5, 0.5, KAYU), 0.55, 0.1), ...geser(sofa(0.55, 0.6, KAYU_M), 0.85, 0.05)] },
    { id: 'pot_besar', n: 'Pot tanaman besar', kat: 'luar', w: 0.6, d: 0.6, h: 1.4, parts: tanaman(0.6, 1.4) },
    // penanda bukaan atap: dipasang di bawah plafon (elev), tidak ikut dipotong tampilan dinding
    { id: 'skylight', n: 'Skylight / atap kaca (penanda di plafon)', kat: 'luar', w: 1.2, d: 1.2, h: 0.05, elev: 2.95,
      parts: [P(0, 0, 0, 1.2, 0.05, 0.05, ABU), P(0, 1.15, 0, 1.2, 0.05, 0.05, ABU), P(0, 0.05, 0, 0.05, 1.1, 0.05, ABU), P(1.15, 0.05, 0, 0.05, 1.1, 0.05, ABU),
        P(0.05, 0.05, 0.02, 1.1, 1.1, 0.01, KACA, 0.35)] },
    { id: 'tandon', n: 'Tandon air 1000 L', kat: 'luar', w: 1.0, d: 1.0, h: 1.3, parts: [P(0, 0, 0, 1.0, 1.0, 1.3, '#2f6ea5')] }
  ];
})();
