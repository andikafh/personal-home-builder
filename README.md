# Home Builder Lokal — Denah 3D Rumah 9 × 13 m

Aplikasi web statis (HTML + CSS + JavaScript, tanpa build) untuk:
- melihat denah dalam 3D dengan label garis penunjuk (nama ruang, ukuran, luas);
- menggeser sekat antar ruang, menambah/menghapus ruang, pintu, jendela, dan bukaan;
- menata properti (kasur, kulkas, freezer, sofa, kitchen set, kloset, mobil, dll.);
- memeriksa otomatis: ruang tumpang tindih, properti menembus dinding atau bertabrakan,
  bukaan yang lepas dari dinding;
- **menjelajah rumah jalan kaki** dalam tampilan 3D yang lebih realistis (`walkthrough.html`,
  lihat bagian [Jelajah 3D](#jelajah-3d) di bawah).

## Cara membuka

**Cara paling mudah:** klik dua kali `index.html` (Chrome/Edge/Firefox).

**Dari VS Code (disarankan saat mengedit):**
1. `File > Open Folder…` lalu pilih folder ini.
2. Pasang ekstensi **Live Server** (VS Code akan menyarankannya otomatis).
3. Klik kanan `index.html` → **Open with Live Server**. Setiap kali file disimpan, halaman ter-refresh.

Pustaka 3D (three.js r128) sudah disertakan di folder `vendor/`, jadi tetap jalan tanpa internet.
Font Archivo diambil dari Google Fonts; tanpa internet otomatis memakai font sistem.

## Struktur folder

```
index.html              kerangka halaman
css/style.css           tampilan & warna (variabel di :root)
js/data/katalog.js      daftar properti + bentuk 3D-nya   ← paling sering diubah
js/data/denah-awal.js   ruang, pintu/jendela, properti awal ← denah bawaan
js/core/geometri.js     aturan: dinding, sekat terhubung, tabrakan, peringatan
js/view/view3d.js       tampilan 3D + label garis penunjuk
js/view/editor2d.js     editor tampak atas (seret sekat, pindah properti)
js/view/panel.js        panel kontrol (tab Ruang, Properti, Rekap, Data)
js/main.js              state, undo, penyimpanan, keyboard
vendor/                 three.js & OrbitControls
walkthrough.html        halaman terpisah: Jelajah 3D (jalan kaki, lihat bagian di bawah)
js/view/walkthrough3d.js   scene 3D realistis + kontrol jalan untuk walkthrough.html
css/walkthrough.css     gaya overlay walkthrough (crosshair, joystick, kartu mulai)
```

## Menambah barang ke katalog

Buka `js/data/katalog.js`, tambahkan satu baris di `HB.KATALOG`:

```js
{ id: 'lemari_es_showcase', n: 'Lemari es showcase', kat: 'dapur', w: 0.6, d: 0.6, h: 1.8 },
```

Tanpa `parts`, barang digambar sebagai satu kotak. Untuk bentuk lebih detail, susun dari kotak-kotak
dengan helper `P(x, y, z, lebar, dalam, tinggi, warna, opasitas?)`:

```js
{ id: 'meja_bar', n: 'Meja bar', kat: 'dapur', w: 1.2, d: 0.5, h: 1.05,
  parts: [ ...meja(1.2, 0.5, 1.05, '#6b4a2f') ] },
```

Aturan koordinat bagian: `x` kiri→kanan, `y` belakang→depan, `z` naik. Sisi belakang (`y = 0`)
biasanya menempel ke dinding; pada rotasi 0° sisi belakang menghadap utara.
Opsi lain: `elev` (dipasang di ketinggian tertentu, mis. AC 2.3), `lantai: true` (boleh ditimpa barang lain, mis. karpet).

Barang juga bisa dibuat dari aplikasi (tab **Properti → Buat properti sendiri**) tanpa menyentuh kode;
hasilnya tersimpan di data denah (`customCatalog`).

## Mengubah denah bawaan

Edit `js/data/denah-awal.js`. Koordinat dalam meter dari **as dinding**:
`x` dari sisi barat, `y` dari sisi utara. Setelah mengubah file ini, ganti nilai `versi` di bagian atas
`HB.DENAH_AWAL` lalu refresh halaman: data tersimpan di browser dengan versi berbeda otomatis diganti
denah baru, dan denah lama masih bisa dipulihkan dengan **Batalkan** / Ctrl+Z.

Cara lain yang lebih cepat: atur denah langsung di aplikasi, lalu **Data → Unduh data (.json)**.
Isi file itu bisa ditempel menggantikan objek `HB.DENAH_AWAL`.

## Memindahkan data dari versi artifact

Di artifact: tombol **Salin data**. Di aplikasi ini: tab **Data** → tempel ke kotak → **Terapkan teks dari kotak**.
Format lama (tanpa properti) otomatis dilengkapi.

## Kontrol

| Aksi | Cara |
|---|---|
| Putar / zoom 3D | seret area kosong / cubit atau scroll |
| Pilih objek di 3D | ketuk lantai ruang, properti, atau dinding |
| Geser sekat | 3D: pilih ruang → tarik titik biru di tiap sisi · Edit denah: tarik garis biru · atau tombol ▲▼◀▶ di panel |
| Pindah ruang | Edit denah: ketuk ruang yang sudah terpilih lalu seret (properti di dalamnya ikut) |
| Pindah properti | seret langsung di 3D maupun Edit denah; menempel ke dinding bila "Tempel ke dinding" aktif |
| Ukuran properti | 3D: tarik titik merah (lebar), hijau (dalam), biru (tinggi) · atau isi Lebar/Dalam/Tinggi di panel |
| Tinggi dinding | semua dinding: tab Ruang & sekat → "Tinggi dinding standar" · satu sekat: klik dindingnya → isi tinggi / pilih preset, atau di 3D tarik titik biru di atasnya |
| Lihat tinggi asli | tombol **Dinding penuh** di pojok kanan bawah 3D (matikan untuk memotong dinding agar isi ruang terlihat) |
| Putar properti | tombol ⟲ ⟳ atau tombol **R** (Shift+R arah sebaliknya) |
| Geser presisi | panah (5 cm), Shift+panah (1 cm); saat menarik di 3D tahan Shift untuk langkah 1 cm |
| Batalkan | tombol Batalkan atau Ctrl/Cmd+Z |

## Jelajah 3D

`walkthrough.html` adalah halaman **terpisah** dari editor, khusus untuk "jalan kaki" di dalam
rumah dengan tampilan lebih realistis: plafon & atap (ruangan tertutup, bukan kotak terbuka),
tekstur lantai kayu/keramik/rumput, dinding bertekstur halus, cahaya matahari dari jendela
ditambah lampu hangat di tiap ruang (penting untuk ruang tanpa jendela luar seperti Dapur,
Ruang Keluarga, Area Servis), dan tidak bisa menembus dinding/properti saat berjalan.

- Buka lewat tombol **Jelajah 3D ↗** di pojok kanan bawah tampilan 3D editor (buka tab baru),
  atau langsung buka berkas `walkthrough.html`.
- Halaman ini **read-only**: ia membaca data tersimpan yang sama dengan editor
  (`localStorage` kunci `homebuilder-lokal.v2`, atau `js/data/denah-awal.js` bila belum ada data
  tersimpan), tapi tidak pernah menulis/mengubahnya. Edit denah tetap lewat `index.html`; cukup
  buka ulang `walkthrough.html` untuk melihat hasil terbaru.
- **Kontrol desktop**: klik tombol "Mulai jalan-jalan" untuk mengunci kursor, lalu **WASD** atau
  panah untuk jalan, **mouse** untuk menoleh, **Shift** untuk lari, **Esc** untuk melepas kursor.
- **Kontrol HP/tablet**: joystick di kiri bawah layar untuk jalan, geser jari di separuh kanan
  layar untuk menoleh.
- Atap pada walkthrough cuma slab datar penanda (bukan desain atap sesungguhnya) — bentuk atap
  yang benar tetap kerja arsitek terpisah. Pintu digambar sebagai bukaan terbuka (tanpa daun
  pintu), sama seperti pada tampilan 3D editor.

## Batasan yang perlu diketahui

- Ruang hanya persegi panjang; bentuk L dibuat dengan beberapa ruang dalam satu **grup tanpa sekat**.
- Ukuran ditampilkan as ke as dinding; aktifkan **Ukuran bersih** untuk ukuran dalam.
- Pemeriksaan tabrakan memakai kotak pembungkus (bounding box), jadi bentuk L seperti sofa L dihitung sebagai persegi penuh.
- Ukuran properti yang diubah menskalakan bentuk katalognya secara proporsional (mis. kasur dilebarkan → bantal ikut melebar).
- Tinggi sekat khusus disimpan per segmen dinding (di antara dua pertemuan dinding). Sekat yang digeser membawa tingginya;
  ruang yang dipindah utuh di Edit denah belum membawa tinggi sekat khususnya.
- Arah buka daun pintu belum dimodelkan, sehingga pintu yang terhalang properti tidak terdeteksi.
- Gambar 3D (.png) tidak menyertakan label; label adalah lapisan HTML di atas kanvas.
- Data tersimpan di penyimpanan browser (per browser, per perangkat). Unduh .json sebagai cadangan.
