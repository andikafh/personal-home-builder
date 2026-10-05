/* =====================================================================
   DENAH AWAL
   ---------------------------------------------------------------------
   Data yang dimuat saat pertama kali dibuka atau saat "Kembalikan denah awal".
   Koordinat dalam meter, diukur dari as (garis tengah) dinding.
     x = jarak dari sisi BARAT lahan, y = jarak dari sisi UTARA lahan.

   versi       : ubah nilainya setiap kali file ini diedit; data tersimpan di browser
                 dengan versi berbeda otomatis diganti denah ini (versi lama masih bisa
                 dipulihkan lewat tombol Batalkan / Ctrl+Z).
   wallH       : tinggi dinding standar (m)
   wallHeights : tinggi khusus per segmen sekat { o, c, a, b, h }
   rooms    : ruang persegi panjang
     type   : kamar | publik | basah | dapur | mushola | carport | teras | taman
     walls  : true = ruang dikelilingi dinding
     group  : ruang dengan nama grup sama digabung tanpa sekat (bentuk L, dll.)
   openings : pintu / jendela / bukaan
     o : 'h' = pada dinding Barat-Timur (garis y = c), 'v' = pada dinding Utara-Selatan (garis x = c)
     p : titik tengah bukaan di sepanjang dinding, w = lebar bukaan
   items    : properti (lihat js/data/katalog.js)
     x, y = titik tengah barang, rot = 0 | 90 | 180 | 270 (derajat, searah jarum jam)
     w, d, h, elev (opsional) = ukuran / tinggi pasang khusus, menimpa katalog

   Denah v5 = editan pemilik (v4 + jendela utara & dapur dihapus, jendela Kamar ART ke servis)
   ditambah:
   - Dapur: kompor digeser agar ada meja landasan ≥45 cm di kedua sisi, cooker hood berducting
     ke dinding timur, kabinet gantung di atas bak cuci.
   - Makan (v6): partisi kisi digeser 80 cm ke selatan (y 3.8 → 4.6) sehingga Ruang Keluarga & Makan
     3.0 × 3.3 m muat meja makan 4 kursi berhadapan di depan bukaan dapur; Ruang Tamu jadi 3.0 × 5.2 m.
     Island tidak dipakai: dapur 2.35 m, sedangkan island + lorong kerja butuh ±3.4 m.
     Saran: meja extendable 120→160 cm, lampu gantung 70–80 cm di atas meja.
   - Laundry, alur timur → barat: cuci → jemur → setrika → simpan ke kamar:
     mesin cuci dekat Km. Mandi 2 (pipa pendek) · jemuran dinding lipat di tengah (tinggi pasang
     1.60 m, bisa diubah) · meja setrika lipat dinding di barat · kabinet deterjen di atas mesin cuci.
   - v7: dinding utara menempel rumah tetangga & dapur memang tanpa jendela, maka:
     exhaust fan di dapur (dekat kompor, melengkapi cooker hood) dan di Km. Mandi 2;
     skylight di atas jemuran/setrika (servis) dan di atas meja makan (Ruang Keluarga).
     Kamar ART mendapat cahaya pinjaman dari skylight servis lewat jendela dalamnya.
   - v8 (Konsep A, lihat ../rencana-konsep-a.html): dinding Dapur ↔ Ruang Keluarga dibongkar
     (ring balok tetap) — dapur & ruang keluarga jadi satu ruang terbuka. Island yang semula
     dipasang di sini pindah fungsi; lihat catatan v10.
   - v9 (Konsep B, lihat ../rencana-konsep-b-foyer.html): Kamar Tidur 2 dialihfungsikan menjadi
     Foyer (1.40 × 2.85 bersih) + Gudang (1.30 × 2.85) dengan sekat bata ringan di x 1.45.
     Pintu baru carport → foyer di dinding selatan ujung timur; pintu KT2 lama menjadi foyer → ruang tamu
     (engsel di utara); pintu carport → ruang tamu dan jendela selatan KT2 ditutup bata.
     Rak sepatu carport pindah ke foyer (bangku + rak sepatu), lemari foyer 40 cm, rak besi U di gudang.
     Mobil digeser 15 cm ke barat (stopper roda): jalur timur carport 0.55 → 0.70 m.
   - v10: sekat Ruang Tamu ↔ Ruang Keluarga/Dapur diluruskan kembali ke denah awal — garis y = 3.8
     dari x = 3 sampai x = 7, segaris dinding utara Mushola (sebelumnya bengkok bentuk L: x 3–6 di
     y = 4.6, x 6–7 / ceruk di y = 3.8, peninggalan v6). Konsekuensi: Ruang Keluarga kembali ke
     3.0 × 2.5 m (sama dalam dengan Dapur); dapur ↔ keluarga TETAP terbuka tanpa dinding (bagian
     Konsep A yang masih dipakai). Island + meja makan 4 kursi v8/v9 tidak muat lagi di 2.5 m, maka
     dipindah ke ujung utara Ruang Tamu — tepat di sebelah sekat kisi, sebelum area sofa — menyatu
     sebagai Ruang Tamu & Makan. Ruang Keluarga jadi nook terbuka di sisi dapur (skylight tetap).
   - v11: island kembali dipasang di bekas sekat Keluarga↔Dapur (kini muat karena meja makan sudah
     pindah ke Ruang Tamu, tidak berebut tempat lagi) — properti "kitchen_island", ukuran bisa
     diubah lewat panel/3D seperti biasa. Area masak & cuci dibalik: HANYA dinding timur Dapur
     (x = 9) yang menghadap luar lahan (dinding utara berbatasan Km. Mandi 2, jadi cooker hood/
     exhaust wajib tetap di timur) — maka kompor+hood+exhaust dipindah ke UJUNG UTARA dinding timur
     (dekat sudut freezer/kulkas, ada jeda ±15 cm dari sudut), dan bak cuci dipindah ke UJUNG
     SELATAN dinding timur (sebelumnya menempel freezer di dinding utara, sekarang dijauhkan).
     Ada jeda ±25 cm antara zona masak dan zona cuci di sepanjang dinding yang sama.
   Catatan yang belum bisa digambar aplikasi:
     * ring balok di atas bekas dinding tetap + kolom praktis di (6.0, 1.3) dan (6.0, 3.8)
     * sekat servis ↔ ruang makan: glass block di atas 2.1 m; pintu servis = pintu geser kaca buram
     * island: stop kontak di sisi island, lampu gantung 2–3 titik 70–80 cm di atas island & meja
     * saluran exhaust & cooker hood ditarik ke dinding timur; bila dinding timur juga menempel
       tetangga, gunakan ducting ke atap
     * skylight servis diberi roster/turbin ventilasi agar udara lembap jemuran bisa keluar
     * pintu servis sebaiknya pintu geser (daun pintu ayun menyentuh jemuran)
     * jendela Kamar ART ↔ servis sebaiknya jendela tinggi (ambang ±1.8 m) kaca buram/jalusi
     * kanopi jendela barat, floor drain servis, lampu gantung ruang makan, cek KDB/GSB
     * foyer: balok latei di atas pintu baru, lantai +5 cm dari carport + ambang & kanopi kecil,
       daun pintu berpanel kaca buram, lampu sensor gerak, saklar two-way di kedua pintu
     * gudang: jendela barat menjadi jalusi tinggi di atas rak, kisi di bawah pintu, 1 stop kontak
     * sisi barat mobil tinggal ±0.48 m: penumpang kiri turun sebelum mobil masuk
   ===================================================================== */
(function () {
  const HB = (window.HB = window.HB || {});
  HB.DENAH_AWAL = {
    versi: '2026-10-05-v11',
    site: { w: 9, d: 13 },
    wallT: 0.15,
    wallH: 3.0,
    wallHeights: [
      { o: 'h', c: 3.8, a: 3, b: 6, h: 2.1 }   // sekat tengah = partisi kisi, segaris dinding Mushola (v10: lurus kembali)
    ],
    rooms: [
      // Kolom barat
      { id: 'art', name: 'Kamar ART', type: 'kamar', x: 0, y: 0, w: 3.0, d: 2.1, walls: true, label: true, group: '' },
      { id: 'kt4', name: 'Kamar Tidur 4', type: 'kamar', x: 0, y: 2.1, w: 3.0, d: 3.0, walls: true, label: true, group: '' },
      // v9 (Konsep B): bekas Kamar Tidur 2 → Gudang + Foyer (pintu masuk keluarga dari carport)
      { id: 'gudang', name: 'Gudang', type: 'publik', x: 0, y: 5.1, w: 1.45, d: 3.0, walls: true, label: true, group: '' },
      { id: 'foyer', name: 'Foyer', type: 'publik', x: 1.45, y: 5.1, w: 1.55, d: 3.0, walls: true, label: true, group: '' },
      { id: 'carport', name: 'Carport', type: 'carport', x: 0, y: 8.1, w: 3.0, d: 4.9, walls: false, label: true, group: '' },
      // Kolom tengah
      { id: 'servis', name: 'Area Servis / Laundry', type: 'basah', x: 3.0, y: 0, w: 3.0, d: 1.3, walls: true, label: true, group: '' },
      // v8 (Konsep A): Ruang Keluarga & Dapur satu grup → dinding pemisah x = 6 dibongkar (ring balok tetap)
      // v10: kedalaman kembali 2.5 m (sekat tamu lurus di y = 3.8, lihat catatan di atas)
      { id: 'keluarga', name: 'Ruang Keluarga', type: 'publik', x: 3.0, y: 1.3, w: 3.0, d: 2.5, walls: true, label: true, group: 'dapur' },
      { id: 'tamu', name: 'Ruang Tamu & Makan', type: 'publik', x: 3.0, y: 3.8, w: 3.0, d: 6.0, walls: true, label: true, group: 'tamu' },
      { id: 'ceruk', name: 'Ruang Tamu (ceruk)', type: 'publik', x: 6.0, y: 3.8, w: 1.0, d: 2.6, walls: true, label: false, group: 'tamu' },
      // Kolom timur
      { id: 'km2', name: 'Km. Mandi 2', type: 'basah', x: 6.0, y: 0, w: 3.0, d: 1.3, walls: true, label: true, group: '' },
      { id: 'dapur', name: 'Dapur', type: 'dapur', x: 6.0, y: 1.3, w: 3.0, d: 2.5, walls: true, label: true, group: 'dapur' },
      { id: 'mushola', name: 'Mushola', type: 'mushola', x: 7.0, y: 3.8, w: 2.0, d: 1.4, walls: true, label: true, group: '' },
      { id: 'km1', name: 'Km. Mandi 1', type: 'basah', x: 7.0, y: 5.2, w: 2.0, d: 1.2, walls: true, label: true, group: '' },
      { id: 'kt1', name: 'Kamar Tidur 1', type: 'kamar', x: 6.0, y: 6.4, w: 3.0, d: 3.4, walls: true, label: true, group: '' },
      // Luar
      { id: 'teras', name: 'Teras Depan', type: 'teras', x: 3.0, y: 9.8, w: 4.0, d: 1.5, walls: false, label: true, group: '' },
      { id: 'taman1', name: 'Taman Timur', type: 'taman', x: 7.0, y: 9.8, w: 2.0, d: 1.0, walls: false, label: true, group: '' },
      { id: 'taman2', name: 'Taman Depan', type: 'taman', x: 3.0, y: 11.3, w: 2.3, d: 1.7, walls: false, label: true, group: '' },
      { id: 'tangga', name: 'Tangga', type: 'teras', x: 5.3, y: 11.3, w: 1.0, d: 1.7, walls: false, label: true, group: '' },
      { id: 'parkirmotor', name: 'Parkir Motor', type: 'carport', x: 7.0, y: 10.8, w: 2.0, d: 2.2, walls: false, label: true, group: '' }
    ],
    openings: [
      // Pintu
      { id: 'd_art', type: 'door', o: 'v', c: 3.0, p: 1.7, w: 0.8 },
      { id: 'd_kt4', type: 'door', o: 'v', c: 3.0, p: 2.7, w: 0.8 },
      { id: 'd_kt2', type: 'door', o: 'v', c: 3.0, p: 5.7, w: 0.8 },      // v9: pintu foyer → ruang tamu (engsel utara)
      { id: 'd_foyer', type: 'door', o: 'h', c: 8.1, p: 2.45, w: 0.8 },    // v9: pintu carport → foyer
      { id: 'd_gudang', type: 'door', o: 'v', c: 1.45, p: 6.65, w: 0.7 },  // v9: pintu foyer → gudang
      { id: 'd_sekat', type: 'door', o: 'h', c: 3.8, p: 3.5, w: 0.8 },
      { id: 'd_servis', type: 'door', o: 'h', c: 1.3, p: 4.6, w: 0.8 },     // disarankan pintu geser
      { id: 'd_km2', type: 'door', o: 'v', c: 6.0, p: 0.65, w: 0.6 },
      { id: 'd_mushola', type: 'door', o: 'v', c: 7.0, p: 4.2, w: 0.7 },
      { id: 'd_km1', type: 'door', o: 'v', c: 7.0, p: 5.8, w: 0.6 },
      { id: 'd_kt1', type: 'door', o: 'h', c: 6.4, p: 6.5, w: 0.8 },
      { id: 'd_utama', type: 'door', o: 'h', c: 9.8, p: 5.4, w: 1.0 },
      // Jendela
      { id: 'w_art_servis', type: 'window', o: 'v', c: 3.0, p: 0.85, w: 0.75 },
      { id: 'w_kt4', type: 'window', o: 'v', c: 0, p: 3.6, w: 0.8 },
      { id: 'w_kt2', type: 'window', o: 'v', c: 0, p: 6.6, w: 0.8 },
      { id: 'w_mushola', type: 'window', o: 'v', c: 9, p: 4.5, w: 0.6 },
      { id: 'w_km1', type: 'window', o: 'v', c: 9, p: 5.8, w: 0.5 },
      { id: 'w_kt1', type: 'window', o: 'v', c: 9, p: 8.1, w: 0.8 },
      { id: 'w_tamu', type: 'window', o: 'h', c: 9.8, p: 4.1, w: 1.4 },
      { id: 'w_kt1b', type: 'window', o: 'h', c: 9.8, p: 7.8, w: 1.2 }
    ],
    items: [
      // Kamar ART
      { id: 'i1', cat: 'kasur_single', x: 1.075, y: 0.525, rot: 270 },
      { id: 'i2', cat: 'lemari_2', x: 0.575, y: 1.725, rot: 180 },
      // Kamar Tidur 4
      { id: 'i3', cat: 'kasur_queen', x: 1.075, y: 3.7, rot: 270 },
      { id: 'i4', cat: 'lemari_3', x: 0.825, y: 2.475, rot: 0 },
      // Foyer: lemari (jaket, helm, payung) + bangku dengan rak sepatu di samping pintu masuk; jalur bebas 1.00 m
      { id: 'i70', cat: 'lemari_2', x: 1.725, y: 5.675, rot: 90, w: 1.0, d: 0.4, name: 'Lemari foyer (jaket, helm, payung)' },
      { id: 'i71', cat: 'rak_sepatu', x: 1.725, y: 7.575, rot: 90, w: 0.9, d: 0.4, h: 0.45, name: 'Bangku + rak sepatu' },
      // Gudang: rak besi 45 cm bentuk U, lorong 0.85 m
      { id: 'i72', cat: 'rak_buku', x: 0.3, y: 5.875, rot: 90, w: 1.4, d: 0.45, h: 2.0, name: 'Rak besi gudang (barat-utara)' },
      { id: 'i73', cat: 'rak_buku', x: 0.3, y: 7.325, rot: 90, w: 1.4, d: 0.45, h: 2.0, name: 'Rak besi gudang (barat-selatan)' },
      { id: 'i74', cat: 'rak_buku', x: 0.95, y: 5.4, rot: 0, w: 0.85, d: 0.45, h: 2.0, name: 'Rak besi gudang (utara)' },
      { id: 'i75', cat: 'rak_buku', x: 0.95, y: 7.8, rot: 0, w: 0.85, d: 0.45, h: 2.0, name: 'Rak besi gudang (selatan)' },
      // Carport & parkir motor
      { id: 'i26', cat: 'mobil_mpv', x: 1.35, y: 10.75, rot: 0 },          // v9: 15 cm ke barat (stopper roda)
      { id: 'i27', cat: 'motor', x: 8.0, y: 11.9, rot: 0 },
      // Area servis: setrika (barat) · jemuran dinding (tengah) · mesin cuci + kabinet (timur, dekat Km. Mandi 2)
      { id: 'i40', cat: 'setrika_dinding', x: 3.575, y: 0.25, rot: 0 },
      { id: 'i43', cat: 'keranjang_baju', x: 4.35, y: 0.25, rot: 0, name: 'Keranjang pakaian kering (siap setrika)' },
      { id: 'i41', cat: 'jemuran_dinding', x: 4.7, y: 0.3, rot: 0 },
      { id: 'i29', cat: 'mesin_cuci_fl', x: 5.625, y: 0.3, rot: 0, d: 0.45 },
      { id: 'i42', cat: 'kabinet_laundry', x: 5.625, y: 0.225, rot: 0 },
      // skylight di atas jemuran & setrika: matahari + udara untuk jemur (dinding utara menempel tetangga)
      { id: 'i50', cat: 'skylight', x: 4.5, y: 0.65, rot: 0, w: 1.5, d: 1.0, name: 'Skylight servis (polycarbonate + roster/turbin ventilasi)' },
      // v10: meja makan pindah ke ujung utara Ruang Tamu (sekat sudah lurus, keluarga tak lagi cukup dalam)
      // jalur: barat 0.88 (ke pintu sekat/keluarga) · timur 0.78 (ke ceruk/mushola) · utara 0.05 (ke kisi, wajar—backrest)
      { id: 'i61', cat: 'meja_makan_konter', x: 4.55, y: 4.775, rot: 0, w: 1.2, d: 0.8, name: 'Meja makan 120×80' },
      { id: 'i62', cat: 'kursi_makan', x: 4.275, y: 4.15, rot: 0 },
      { id: 'i63', cat: 'kursi_makan', x: 4.825, y: 4.15, rot: 0 },
      { id: 'i64', cat: 'kursi_makan', x: 4.275, y: 5.4, rot: 180 },
      { id: 'i65', cat: 'kursi_makan', x: 4.825, y: 5.4, rot: 180 },
      { id: 'i52', cat: 'skylight', x: 4.5, y: 2.55, rot: 0, name: 'Skylight Ruang Keluarga (kaca laminated buram + louver)' },
      { id: 'i20', cat: 'dispenser', x: 6.25, y: 3.55, rot: 0 },          // sudut barat daya dapur
      // v11: island di bekas sekat Keluarga↔Dapur (muat sekarang, meja makan sudah pindah ke Ruang Tamu)
      { id: 'i60', cat: 'kitchen_island', x: 5.65, y: 2.55, rot: 90, w: 1.4, d: 0.65, h: 0.9, name: 'Island dapur' },
      // Dapur L: freezer + kulkas (dinding utara, berbatasan Km. Mandi 2 — tidak bisa exhaust di sini).
      // Dinding timur (x=9) satu-satunya sisi menghadap luar lahan, jadi kompor/hood/exhaust tetap
      // di sana — v11: dipindah ke ujung utara (dekat sudut freezer, jeda ±15 cm); bak cuci ke
      // ujung selatan (area masak & cuci dibalik, jeda ±25 cm antar zona).
      { id: 'i18', cat: 'freezer_box', x: 6.375, y: 1.675, rot: 90, w: 0.6 },
      { id: 'i17', cat: 'kulkas_1', x: 7.0, y: 1.675, rot: 0 },
      { id: 'i14', cat: 'kitchen_bawah', x: 8.675, y: 1.975, rot: 90, w: 0.9, d: 0.5, h: 0.82, name: 'Meja landasan kompor' },
      { id: 'i16', cat: 'kompor', x: 8.7, y: 1.975, rot: 270, w: 0.7, h: 0.2 },
      { id: 'i49', cat: 'cooker_hood', x: 8.7, y: 1.975, rot: 90 },
      { id: 'i51', cat: 'exhaust_fan', x: 8.85, y: 1.975, rot: 90, name: 'Exhaust fan dapur (dinding timur)' },
      { id: 'i33', cat: 'kitchen_sink', x: 8.675, y: 3.125, rot: 90, w: 1.0, d: 0.5, h: 1.15, name: 'Bak cuci piring' },
      { id: 'i15', cat: 'kitchen_atas', x: 8.75, y: 3.125, rot: 90, w: 1.0, name: 'Kabinet gantung atas bak cuci' },
      // Km. Mandi 2
      { id: 'i22', cat: 'wastafel', x: 6.85, y: 0.3, rot: 0 },
      { id: 'i21', cat: 'kloset_duduk', x: 7.6, y: 0.425, rot: 0 },
      { id: 'i34', cat: 'shower', x: 8.475, y: 0.525, rot: 0 },
      { id: 'i53', cat: 'exhaust_fan', x: 8.85, y: 0.5, rot: 90, name: 'Exhaust fan Km. Mandi 2' },
      // Mushola
      { id: 'i24', cat: 'sajadah', x: 8.325, y: 4.775, rot: 90 },
      { id: 'i25', cat: 'rak_quran', x: 8.775, y: 4.175, rot: 90, elev: 1.0, h: 0.6 },
      // Km. Mandi 1
      { id: 'i23', cat: 'kloset_duduk', x: 8.575, y: 5.6, rot: 90 },
      { id: 'i35', cat: 'wastafel', x: 7.6, y: 5.5, rot: 0 },
      // Ruang tamu
      { id: 'i10', cat: 'sofa_3', x: 3.5, y: 7.2, rot: 270 },
      { id: 'i11', cat: 'meja_tamu', x: 4.475, y: 7.2, rot: 90 },
      { id: 'i12', cat: 'bufet_tv', x: 5.725, y: 7.2, rot: 90 },
      { id: 'i13', cat: 'tv_43', x: 5.895, y: 7.2, rot: 90 },
      // Kamar Tidur 1
      { id: 'i7', cat: 'kasur_king', x: 7.925, y: 8.1, rot: 90 },
      { id: 'i8', cat: 'lemari_3', x: 6.375, y: 8.35, rot: 270 },
      { id: 'i9', cat: 'nakas', x: 8.725, y: 6.975, rot: 90 },
      { id: 'i36', cat: 'nakas', x: 8.725, y: 9.225, rot: 90 },
      // Teras
      { id: 'i28', cat: 'set_teras', x: 4.1, y: 10.35, rot: 0 }
    ],
    customCatalog: []
  };
})();
