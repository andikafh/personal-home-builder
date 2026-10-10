/* =====================================================================
   DENAH AWAL
   ---------------------------------------------------------------------
   Berkas ini ditulis otomatis oleh tombol "Simpan" di tab Data, dari denah
   yang sedang terbuka saat itu. Untuk format datanya, lihat README.md
   bagian "Mengubah denah bawaan". Menulis manual ke berkas ini tetap bisa,
   asal tetap diakhiri "HB.DENAH_AWAL = {...};" di dalam IIFE seperti ini.
   Disimpan otomatis: 10/10/2026, 23.42.42
   ===================================================================== */
(function () {
  const HB = (window.HB = window.HB || {});
  HB.DENAH_AWAL = {
  "versi": "2026-10-10T23-42-42",
  "site": {
    "w": 9,
    "d": 13
  },
  "wallT": 0.15,
  "wallH": 3,
  "wallHeights": [
    {
      "o": "h",
      "c": 3.8,
      "a": 3,
      "b": 6,
      "h": 2.1
    }
  ],
  "rooms": [
    {
      "id": "art",
      "name": "Kamar ART",
      "type": "kamar",
      "x": 0,
      "y": 0,
      "w": 3,
      "d": 2.1,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "kt4",
      "name": "Kamar Tidur 4",
      "type": "kamar",
      "x": 0,
      "y": 2.1,
      "w": 3,
      "d": 3,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "gudang",
      "name": "Gudang",
      "type": "publik",
      "x": 0,
      "y": 5.1,
      "w": 1.45,
      "d": 3,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "foyer",
      "name": "Foyer",
      "type": "publik",
      "x": 1.45,
      "y": 5.1,
      "w": 1.55,
      "d": 3,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "carport",
      "name": "Carport",
      "type": "carport",
      "x": 0,
      "y": 8.1,
      "w": 3,
      "d": 4.9,
      "walls": false,
      "label": true,
      "group": ""
    },
    {
      "id": "servis",
      "name": "Area Servis / Laundry",
      "type": "basah",
      "x": 3,
      "y": 0,
      "w": 3,
      "d": 1.3,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "keluarga",
      "name": "Ruang Keluarga",
      "type": "publik",
      "x": 3,
      "y": 1.3,
      "w": 3,
      "d": 2.5,
      "walls": true,
      "label": true,
      "group": "dapur"
    },
    {
      "id": "tamu",
      "name": "Ruang Tamu & Makan",
      "type": "publik",
      "x": 3,
      "y": 3.8,
      "w": 3,
      "d": 6,
      "walls": true,
      "label": true,
      "group": "tamu"
    },
    {
      "id": "ceruk",
      "name": "Ruang Tamu (ceruk)",
      "type": "publik",
      "x": 6,
      "y": 3.8,
      "w": 1,
      "d": 2.6,
      "walls": true,
      "label": false,
      "group": "tamu"
    },
    {
      "id": "km2",
      "name": "Km. Mandi 2",
      "type": "basah",
      "x": 6,
      "y": 0,
      "w": 3,
      "d": 1.3,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "dapur",
      "name": "Dapur",
      "type": "dapur",
      "x": 6,
      "y": 1.3,
      "w": 3,
      "d": 2.5,
      "walls": true,
      "label": true,
      "group": "dapur"
    },
    {
      "id": "mushola",
      "name": "Mushola",
      "type": "mushola",
      "x": 7,
      "y": 3.8,
      "w": 2,
      "d": 1.4,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "km1",
      "name": "Km. Mandi 1",
      "type": "basah",
      "x": 7,
      "y": 5.2,
      "w": 2,
      "d": 1.2,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "kt1",
      "name": "Kamar Tidur 1",
      "type": "kamar",
      "x": 6,
      "y": 6.4,
      "w": 3,
      "d": 3.4,
      "walls": true,
      "label": true,
      "group": ""
    },
    {
      "id": "teras",
      "name": "Teras Depan",
      "type": "teras",
      "x": 3,
      "y": 9.8,
      "w": 4,
      "d": 1.5,
      "walls": false,
      "label": true,
      "group": ""
    },
    {
      "id": "taman1",
      "name": "Taman Timur",
      "type": "taman",
      "x": 7,
      "y": 9.8,
      "w": 2,
      "d": 1,
      "walls": false,
      "label": true,
      "group": ""
    },
    {
      "id": "taman2",
      "name": "Taman Depan",
      "type": "taman",
      "x": 3,
      "y": 11.3,
      "w": 2.3,
      "d": 1.7,
      "walls": false,
      "label": true,
      "group": ""
    },
    {
      "id": "tangga",
      "name": "Tangga",
      "type": "teras",
      "x": 5.3,
      "y": 11.3,
      "w": 1,
      "d": 1.7,
      "walls": false,
      "label": true,
      "group": ""
    },
    {
      "id": "parkirmotor",
      "name": "Parkir Motor",
      "type": "carport",
      "x": 7,
      "y": 10.8,
      "w": 2,
      "d": 2.2,
      "walls": false,
      "label": true,
      "group": ""
    }
  ],
  "openings": [
    {
      "id": "d_art",
      "type": "door",
      "o": "v",
      "c": 3,
      "p": 1.7,
      "w": 0.8
    },
    {
      "id": "d_kt4",
      "type": "door",
      "o": "v",
      "c": 3,
      "p": 2.7,
      "w": 0.8
    },
    {
      "id": "d_kt2",
      "type": "door",
      "o": "v",
      "c": 3,
      "p": 5.7,
      "w": 0.8
    },
    {
      "id": "d_foyer",
      "type": "door",
      "o": "h",
      "c": 8.1,
      "p": 2.45,
      "w": 0.8
    },
    {
      "id": "d_gudang",
      "type": "door",
      "o": "v",
      "c": 1.45,
      "p": 6.65,
      "w": 0.7
    },
    {
      "id": "d_sekat",
      "type": "door",
      "o": "h",
      "c": 3.8,
      "p": 3.5,
      "w": 0.8
    },
    {
      "id": "d_servis",
      "type": "door",
      "o": "h",
      "c": 1.3,
      "p": 4.6,
      "w": 0.8
    },
    {
      "id": "d_km2",
      "type": "door",
      "o": "v",
      "c": 6,
      "p": 0.65,
      "w": 0.6
    },
    {
      "id": "d_mushola",
      "type": "door",
      "o": "v",
      "c": 7,
      "p": 4.2,
      "w": 0.7
    },
    {
      "id": "d_km1",
      "type": "door",
      "o": "v",
      "c": 7,
      "p": 5.8,
      "w": 0.6
    },
    {
      "id": "d_kt1",
      "type": "door",
      "o": "h",
      "c": 6.4,
      "p": 6.5,
      "w": 0.8
    },
    {
      "id": "d_utama",
      "type": "door",
      "o": "h",
      "c": 9.8,
      "p": 5.4,
      "w": 1
    },
    {
      "id": "w_art_servis",
      "type": "window",
      "o": "v",
      "c": 3,
      "p": 0.85,
      "w": 0.75
    },
    {
      "id": "w_kt4",
      "type": "window",
      "o": "v",
      "c": 0,
      "p": 3.6,
      "w": 0.8
    },
    {
      "id": "w_kt2",
      "type": "window",
      "o": "v",
      "c": 0,
      "p": 6.6,
      "w": 0.8
    },
    {
      "id": "w_mushola",
      "type": "window",
      "o": "v",
      "c": 9,
      "p": 4.5,
      "w": 0.6
    },
    {
      "id": "w_km1",
      "type": "window",
      "o": "v",
      "c": 9,
      "p": 5.8,
      "w": 0.5
    },
    {
      "id": "w_kt1",
      "type": "window",
      "o": "v",
      "c": 9,
      "p": 8.1,
      "w": 0.8
    },
    {
      "id": "w_tamu",
      "type": "window",
      "o": "h",
      "c": 9.8,
      "p": 4.1,
      "w": 1.4
    },
    {
      "id": "w_kt1b",
      "type": "window",
      "o": "h",
      "c": 9.8,
      "p": 7.8,
      "w": 1.2
    }
  ],
  "items": [
    {
      "id": "i1",
      "cat": "kasur_single",
      "x": 1.075,
      "y": 0.525,
      "rot": 270
    },
    {
      "id": "i2",
      "cat": "lemari_2",
      "x": 0.575,
      "y": 1.725,
      "rot": 180
    },
    {
      "id": "i3",
      "cat": "kasur_queen",
      "x": 1.075,
      "y": 3.7,
      "rot": 270
    },
    {
      "id": "i4",
      "cat": "lemari_3",
      "x": 0.825,
      "y": 2.475,
      "rot": 0
    },
    {
      "id": "i70",
      "cat": "lemari_2",
      "x": 1.725,
      "y": 5.675,
      "rot": 90,
      "w": 1,
      "d": 0.4,
      "name": "Lemari foyer (jaket, helm, payung)"
    },
    {
      "id": "i71",
      "cat": "rak_sepatu",
      "x": 1.725,
      "y": 7.575,
      "rot": 90,
      "w": 0.9,
      "d": 0.4,
      "h": 0.45,
      "name": "Bangku + rak sepatu"
    },
    {
      "id": "i72",
      "cat": "rak_buku",
      "x": 0.3,
      "y": 5.875,
      "rot": 90,
      "w": 1.4,
      "d": 0.45,
      "h": 2,
      "name": "Rak besi gudang (barat-utara)"
    },
    {
      "id": "i73",
      "cat": "rak_buku",
      "x": 0.3,
      "y": 7.325,
      "rot": 90,
      "w": 1.4,
      "d": 0.45,
      "h": 2,
      "name": "Rak besi gudang (barat-selatan)"
    },
    {
      "id": "i74",
      "cat": "rak_buku",
      "x": 0.95,
      "y": 5.4,
      "rot": 0,
      "w": 0.85,
      "d": 0.45,
      "h": 2,
      "name": "Rak besi gudang (utara)"
    },
    {
      "id": "i75",
      "cat": "rak_buku",
      "x": 0.95,
      "y": 7.8,
      "rot": 0,
      "w": 0.85,
      "d": 0.45,
      "h": 2,
      "name": "Rak besi gudang (selatan)"
    },
    {
      "id": "i26",
      "cat": "mobil_mpv",
      "x": 1.35,
      "y": 10.75,
      "rot": 0
    },
    {
      "id": "i27",
      "cat": "motor",
      "x": 8,
      "y": 11.9,
      "rot": 0
    },
    {
      "id": "i40",
      "cat": "setrika_dinding",
      "x": 3.575,
      "y": 0.25,
      "rot": 0
    },
    {
      "id": "i43",
      "cat": "keranjang_baju",
      "x": 4.35,
      "y": 0.25,
      "rot": 0,
      "name": "Keranjang pakaian kering (siap setrika)"
    },
    {
      "id": "i41",
      "cat": "jemuran_dinding",
      "x": 4.7,
      "y": 0.3,
      "rot": 0
    },
    {
      "id": "i29",
      "cat": "mesin_cuci_fl",
      "x": 5.625,
      "y": 0.3,
      "rot": 0,
      "d": 0.45
    },
    {
      "id": "i42",
      "cat": "kabinet_laundry",
      "x": 5.625,
      "y": 0.225,
      "rot": 0
    },
    {
      "id": "i50",
      "cat": "skylight",
      "x": 4.875,
      "y": 0.65,
      "rot": 0,
      "w": 2.1,
      "d": 1.15,
      "name": "Skylight servis (polycarbonate + roster/turbin ventilasi)",
      "elev": 2.2
    },
    {
      "id": "i61",
      "cat": "meja_makan_konter",
      "x": 5,
      "y": 3,
      "rot": 270,
      "w": 1.2,
      "d": 0.8,
      "name": "Meja makan 120×80"
    },
    {
      "id": "i20",
      "cat": "dispenser",
      "x": 6.25,
      "y": 3.55,
      "rot": 0
    },
    {
      "id": "i18",
      "cat": "freezer_box",
      "x": 5.75,
      "y": 1.675,
      "rot": 90,
      "w": 0.6
    },
    {
      "id": "i17",
      "cat": "kulkas_1",
      "x": 6.35,
      "y": 1.675,
      "rot": 0
    },
    {
      "id": "i14",
      "cat": "kitchen_bawah",
      "x": 7.75,
      "y": 1.625,
      "rot": 0,
      "w": 2.2,
      "d": 0.5,
      "h": 0.82,
      "name": "Meja landasan kompor"
    },
    {
      "id": "i16",
      "cat": "kompor",
      "x": 8.45,
      "y": 1.6,
      "rot": 180,
      "w": 0.7,
      "h": 0.2
    },
    {
      "id": "i49",
      "cat": "cooker_hood",
      "x": 8.575,
      "y": 1.6,
      "rot": 0
    },
    {
      "id": "i51",
      "cat": "exhaust_fan",
      "x": 8.85,
      "y": 1.975,
      "rot": 90,
      "name": "Exhaust fan dapur (dinding timur)"
    },
    {
      "id": "i33",
      "cat": "kitchen_sink",
      "x": 8.675,
      "y": 2.825,
      "rot": 90,
      "w": 1.85,
      "d": 0.5,
      "h": 1.15,
      "name": "Bak cuci piring"
    },
    {
      "id": "i15",
      "cat": "kitchen_atas",
      "x": 7.4,
      "y": 1.625,
      "rot": 0,
      "w": 1.55,
      "name": "Kabinet gantung atas bak cuci",
      "d": 0.5
    },
    {
      "id": "i22",
      "cat": "wastafel",
      "x": 6.85,
      "y": 0.3,
      "rot": 0
    },
    {
      "id": "i21",
      "cat": "kloset_duduk",
      "x": 7.6,
      "y": 0.425,
      "rot": 0
    },
    {
      "id": "i34",
      "cat": "shower",
      "x": 8.475,
      "y": 0.525,
      "rot": 0
    },
    {
      "id": "i53",
      "cat": "exhaust_fan",
      "x": 8.85,
      "y": 0.5,
      "rot": 90,
      "name": "Exhaust fan Km. Mandi 2"
    },
    {
      "id": "i24",
      "cat": "sajadah",
      "x": 8.325,
      "y": 4.775,
      "rot": 90
    },
    {
      "id": "i25",
      "cat": "rak_quran",
      "x": 8.775,
      "y": 4.175,
      "rot": 90,
      "elev": 1,
      "h": 0.6
    },
    {
      "id": "i23",
      "cat": "kloset_duduk",
      "x": 8.575,
      "y": 5.6,
      "rot": 90
    },
    {
      "id": "i35",
      "cat": "wastafel",
      "x": 7.6,
      "y": 5.5,
      "rot": 0
    },
    {
      "id": "i10",
      "cat": "sofa_3",
      "x": 3.5,
      "y": 7.2,
      "rot": 270
    },
    {
      "id": "i11",
      "cat": "meja_tamu",
      "x": 4.475,
      "y": 7.2,
      "rot": 90
    },
    {
      "id": "i12",
      "cat": "bufet_tv",
      "x": 5.725,
      "y": 7.2,
      "rot": 90
    },
    {
      "id": "i13",
      "cat": "tv_43",
      "x": 5.895,
      "y": 7.2,
      "rot": 90
    },
    {
      "id": "i7",
      "cat": "kasur_king",
      "x": 7.925,
      "y": 8.1,
      "rot": 90
    },
    {
      "id": "i8",
      "cat": "lemari_3",
      "x": 6.375,
      "y": 8.35,
      "rot": 270
    },
    {
      "id": "i9",
      "cat": "nakas",
      "x": 8.725,
      "y": 6.975,
      "rot": 90
    },
    {
      "id": "i36",
      "cat": "nakas",
      "x": 8.725,
      "y": 9.225,
      "rot": 90
    },
    {
      "id": "i28",
      "cat": "set_teras",
      "x": 4.1,
      "y": 10.35,
      "rot": 0
    }
  ],
  "customCatalog": []
};
})();
