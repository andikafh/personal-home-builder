/* =====================================================================
   GEOMETRI & ATURAN
   Semua fungsi di sini murni (tidak menyentuh tampilan) sehingga mudah diuji.
   ===================================================================== */
(function () {
  const HB = (window.HB = window.HB || {});

  const u = (HB.u = {
    clone: o => JSON.parse(JSON.stringify(o)),
    r2: v => Math.round(v * 100) / 100,
    r3: v => Math.round(v * 1000) / 1000,
    snap: (v, s = 0.05) => Math.round(Math.round(v / s) * s * 1000) / 1000,
    f2: v => (+v).toFixed(2),
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    uid: p => p + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6)
  });

  const EPS = 1e-3;
  const EDGES = ['top', 'bottom', 'left', 'right'];
  const G = (HB.geo = { EPS, EDGES });

  HB.TYPES = {
    kamar: { n: 'Kamar', c: '#caa47c' }, publik: { n: 'Ruang umum', c: '#ece2cf' }, basah: { n: 'Kamar mandi', c: '#b9d4e4' },
    dapur: { n: 'Dapur', c: '#d6d0c4' }, mushola: { n: 'Mushola', c: '#d4e2bf' }, carport: { n: 'Carport', c: '#a6a7a3' },
    teras: { n: 'Teras / tangga', c: '#c3c1ba' }, taman: { n: 'Taman', c: '#7da35a' }
  };
  HB.OPN = { door: 'Pintu', window: 'Jendela', open: 'Bukaan' };

  /* ---------- dasar ---------- */
  G.subtract = function (segs, a, b) {
    const out = [];
    for (const [p, q] of segs) {
      if (b <= p + 1e-6 || a >= q - 1e-6) { out.push([p, q]); continue; }
      if (a > p) out.push([p, a]);
      if (b < q) out.push([b, q]);
    }
    return out.filter(s => s[1] - s[0] > EPS);
  };
  G.edgeCoord = (r, e) => (e === 'left' ? r.x : e === 'right' ? r.x + r.w : e === 'top' ? r.y : r.y + r.d);
  G.edgeAxis = e => (e === 'left' || e === 'right' ? 'v' : 'h');
  G.span = (r, o) => (o === 'v' ? [r.y, r.y + r.d] : [r.x, r.x + r.w]);

  /* ---------- dinding dari batas ruang ---------- */
  G.wallLines = function (state) {
    const lines = {}, walled = state.rooms.filter(r => r.walls);
    const add = (o, c, a, b) => {
      if (b - a < EPS) return;
      const k = o + ':' + c.toFixed(3);
      (lines[k] || (lines[k] = { o, c, iv: [] })).iv.push([a, b]);
    };
    for (const r of walled) {
      for (const e of EDGES) {
        const o = G.edgeAxis(e), c = G.edgeCoord(r, e);
        let segs = [G.span(r, o)];
        if (r.group) {
          for (const s of walled) {
            if (s === r || s.group !== r.group) continue;
            const es = o === 'v' ? ['left', 'right'] : ['top', 'bottom'];
            if (es.some(x => Math.abs(G.edgeCoord(s, x) - c) < EPS)) {
              const sp = G.span(s, o);
              segs = G.subtract(segs, sp[0], sp[1]);
            }
          }
        }
        segs.forEach(([a, b]) => add(o, c, a, b));
      }
    }
    for (const k in lines) {
      const L = lines[k];
      L.iv.sort((a, b) => a[0] - b[0]);
      const m = [];
      for (const s of L.iv) {
        if (m.length && s[0] <= m[m.length - 1][1] + EPS) m[m.length - 1][1] = Math.max(m[m.length - 1][1], s[1]);
        else m.push([s[0], s[1]]);
      }
      L.iv = m;
    }
    return lines;
  };

  /* ---------- segmen sekat & tingginya ----------
     segmen = bagian garis dinding di antara dua pertemuan dinding tegak lurus;
     inilah satuan yang bisa diatur tingginya (state.wallHeights menimpa state.wallH) */
  G.wallHeight = function (state, s) {
    const m = (s.a + s.b) / 2;
    const w = (state.wallHeights || []).find(x => x.o === s.o && Math.abs(x.c - s.c) < 0.02 && m > x.a - EPS && m < x.b + EPS);
    return w ? w.h : state.wallH;
  };
  G.wallSegments = function (state) {
    const L = Object.values(G.wallLines(state)), out = [];
    for (const A of L) for (const [a, b] of A.iv) {
      const cuts = [a, b];
      for (const B of L) {
        if (B.o === A.o || B.c <= a + EPS || B.c >= b - EPS) continue;
        if (B.iv.some(([p, q]) => A.c >= p - EPS && A.c <= q + EPS)) cuts.push(B.c);
      }
      cuts.sort((x, y) => x - y);
      for (let i = 1; i < cuts.length; i++) {
        if (cuts[i] - cuts[i - 1] <= EPS) continue;
        const s = { o: A.o, c: A.c, a: cuts[i - 1], b: cuts[i] };
        s.key = `${s.o}:${u.r2(s.c)}:${u.r2(s.a)}:${u.r2(s.b)}`;
        s.h = G.wallHeight(state, s);
        out.push(s);
      }
    }
    return out;
  };
  /* h = null → kembali ke tinggi standar */
  G.setWallHeight = function (state, s, h) {
    const m = (s.a + s.b) / 2;
    state.wallHeights = (state.wallHeights || []).flatMap(w =>
      w.o === s.o && Math.abs(w.c - s.c) < 0.02 && m > w.a - EPS && m < w.b + EPS
        ? G.subtract([[w.a, w.b]], s.a, s.b).map(([a, b]) => Object.assign({}, w, { a: u.r2(a), b: u.r2(b) }))
        : [w]);
    if (h != null && Math.abs(h - state.wallH) > EPS) state.wallHeights.push({ o: s.o, c: u.r2(s.c), a: u.r2(s.a), b: u.r2(s.b), h: u.r2(h) });
  };

  /* pieces = potongan dinding penuh (dengan tinggi h), ops = bukaan yang memotong dinding */
  G.computeWalls = function (state) {
    const lines = G.wallLines(state), segs = G.wallSegments(state), T = state.wallT, pieces = [], ops = [], valid = new Set();
    const cut = segs.map(s => ({ s, iv: [[s.a - T / 2, s.b + T / 2]] }));
    for (const k in lines) {
      const L = lines[k];
      for (const op of state.openings) {
        if (op.o !== L.o || Math.abs(op.c - L.c) > 0.02 || valid.has(op.id)) continue;
        if (!L.iv.some(([p, q]) => op.p > p - EPS && op.p < q + EPS)) continue;
        const a = op.p - op.w / 2, b = op.p + op.w / 2;
        let host = null;
        for (const x of cut) {
          if (x.s.o !== L.o || Math.abs(x.s.c - L.c) > EPS) continue;
          x.iv = G.subtract(x.iv, a, b);
          if (!host && op.p >= x.s.a - EPS && op.p <= x.s.b + EPS) host = x.s;
        }
        ops.push({ op, o: L.o, c: L.c, a, b, h: host ? host.h : state.wallH, key: host ? host.key : null });
        valid.add(op.id);
      }
    }
    for (const x of cut) x.iv.forEach(([a, b]) => pieces.push({ o: x.s.o, c: x.s.c, a, b, h: x.s.h, key: x.s.key }));
    return { pieces, ops, valid, segs };
  };

  /* ---------- sekat terhubung ---------- */
  G.linkedSet = function (state, rm, edge, linked) {
    const o = G.edgeAxis(edge), c = G.edgeCoord(rm, edge), set = [{ r: rm, e: edge }];
    if (!linked) return set;
    const es = o === 'v' ? ['left', 'right'] : ['top', 'bottom'];
    let grown = true;
    while (grown) {
      grown = false;
      for (const s of state.rooms) for (const e of es) {
        if (set.some(q => q.r === s && q.e === e)) continue;
        if (Math.abs(G.edgeCoord(s, e) - c) > EPS) continue;
        const sp = G.span(s, o);
        if (set.some(q => { const p = G.span(q.r, o); return Math.min(p[1], sp[1]) - Math.max(p[0], sp[0]) > 0.01; })) {
          set.push({ r: s, e }); grown = true;
        }
      }
    }
    return set;
  };
  G.startEdge = function (state, rm, edge, linked) {
    const set = G.linkedSet(state, rm, edge, linked), o = G.edgeAxis(edge), c = G.edgeCoord(rm, edge);
    const spans = set.map(q => G.span(q.r, o));
    const ops = state.openings.filter(op => op.o === o && Math.abs(op.c - c) < 0.02 && spans.some(([a, b]) => op.p > a - EPS && op.p < b + EPS));
    // tinggi sekat khusus ikut berpindah bersama garis dindingnya
    const walls = (state.wallHeights || []).filter(w => w.o === o && Math.abs(w.c - c) < 0.02 && spans.some(([a, b]) => Math.min(b, w.b) - Math.max(a, w.a) > 0.01));
    return { o, c0: c, orig: set.map(q => ({ q, x: q.r.x, y: q.r.y, w: q.r.w, d: q.r.d })), ops, walls };
  };
  G.applyEdge = function (E, c) {
    c = u.r2(c);
    const nx = E.orig.map(({ q, x, y, w, d }) => {
      const n = { x, y, w, d };
      if (q.e === 'right') n.w = c - x;
      else if (q.e === 'left') { n.w = x + w - c; n.x = c; }
      else if (q.e === 'bottom') n.d = c - y;
      else { n.d = y + d - c; n.y = c; }
      return n;
    });
    if (nx.some(n => n.w < 0.3 || n.d < 0.3)) return false;
    E.orig.forEach((o, i) => Object.assign(o.q.r, { x: u.r2(nx[i].x), y: u.r2(nx[i].y), w: u.r2(nx[i].w), d: u.r2(nx[i].d) }));
    E.ops.forEach(op => (op.c = c));
    (E.walls || []).forEach(w => (w.c = c));
    return true;
  };

  G.snapOpening = function (state, op, pt) {
    let best = null;
    for (const r of state.rooms) {
      if (!r.walls) continue;
      for (const e of EDGES) {
        const o = G.edgeAxis(e), c = G.edgeCoord(r, e), [a, b] = G.span(r, o);
        const along = o === 'h' ? pt.x : pt.y, perp = o === 'h' ? pt.y : pt.x;
        const cl = Math.max(a, Math.min(b, along)), dist = Math.hypot(perp - c, along - cl);
        if (!best || dist < best.dist) best = { dist, o, c, a, b, along };
      }
    }
    if (!best) return;
    const half = op.w / 2;
    op.o = best.o; op.c = u.r2(best.c);
    op.p = u.snap(Math.max(best.a + half, Math.min(best.b - half, best.along)));
  };

  /* ---------- properti ---------- */
  G.catalog = state => (HB.KATALOG || []).concat(state.customCatalog || []);
  G.cat = (state, id) => G.catalog(state).find(c => c.id === id) || null;
  /* ukuran properti: it.w / it.d / it.h menimpa ukuran katalog (lebar, dalam, tinggi sebelum diputar) */
  G.itemSize = (c, it) => ({ w: it.w > 0 ? +it.w : c.w, d: it.d > 0 ? +it.d : c.d, h: it.h > 0 ? +it.h : c.h });
  G.itemBox = function (state, it) {
    const c = G.cat(state, it.cat);
    if (!c) return null;
    const s = G.itemSize(c, it);
    const rot = (((it.rot || 0) % 360) + 360) % 360, sw = rot === 90 || rot === 270;
    const w = sw ? s.d : s.w, d = sw ? s.w : s.d;
    const z1 = it.elev != null && it.elev !== '' ? +it.elev : c.elev || 0;
    return { c, s, rot, w, d, x1: it.x - w / 2, y1: it.y - d / 2, x2: it.x + w / 2, y2: it.y + d / 2, z1, z2: z1 + s.h };
  };
  G.roomAt = function (state, x, y) {
    const inR = r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.d;
    return state.rooms.find(r => r.walls && inR(r)) || state.rooms.find(inR) || null;
  };
  /* tempelkan sisi barang ke muka dinding terdekat (dalam jarak tol) */
  G.snapItemToWalls = function (state, it, pieces, tol = 0.12) {
    const b = G.itemBox(state, it);
    if (!b) return;
    const h = state.wallT / 2;
    let dx = 0, dy = 0, bx = tol, by = tol;
    for (const p of pieces) {
      if (p.o === 'h') {
        if (Math.min(b.x2, p.b) - Math.max(b.x1, p.a) <= 0.05) continue;
        let e = b.y1 - (p.c + h); if (Math.abs(e) < by) { by = Math.abs(e); dy = -e; }
        e = b.y2 - (p.c - h); if (Math.abs(e) < by) { by = Math.abs(e); dy = -e; }
      } else {
        if (Math.min(b.y2, p.b) - Math.max(b.y1, p.a) <= 0.05) continue;
        let e = b.x1 - (p.c + h); if (Math.abs(e) < bx) { bx = Math.abs(e); dx = -e; }
        e = b.x2 - (p.c - h); if (Math.abs(e) < bx) { bx = Math.abs(e); dx = -e; }
      }
    }
    it.x = u.r3(it.x + dx); it.y = u.r3(it.y + dy);
  };

  /* ---------- ukuran ---------- */
  G.dims = (state, r, net) => { const t = net && r.walls ? state.wallT : 0; return { w: u.r2(r.w - t), d: u.r2(r.d - t) }; };
  G.area = (state, r, net) => { const d = G.dims(state, r, net); return d.w * d.d; };
  G.groupArea = (state, r, net) => (!r.group ? G.area(state, r, net)
    : state.rooms.filter(s => s.group === r.group).reduce((s, x) => s + G.area(state, x, net), 0));

  /* ---------- pemeriksaan ---------- */
  G.warnings = function (state) {
    const W = [], R = state.rooms, S = state.site, T = state.wallT;
    const ov = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1);
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const a = R[i], b = R[j];
      const ox = ov(a.x, a.x + a.w, b.x, b.x + b.w), oy = ov(a.y, a.y + a.d, b.y, b.y + b.d);
      if (ox > 0.01 && oy > 0.01) W.push({ k: 'room', id: a.id, t: `${a.name} tumpang tindih dengan ${b.name} (${u.f2(ox * oy)} m²).` });
    }
    for (const r of R) if (r.x < -EPS || r.y < -EPS || r.x + r.w > S.w + EPS || r.y + r.d > S.d + EPS)
      W.push({ k: 'room', id: r.id, t: `${r.name} keluar dari batas lahan ${S.w} × ${S.d} m.` });
    const { pieces, valid } = G.computeWalls(state);
    for (const op of state.openings) if (!valid.has(op.id))
      W.push({ k: 'op', id: op.id, t: `${HB.OPN[op.type]} lebar ${u.f2(op.w)} m tidak menempel di dinding mana pun.` });

    const boxes = (state.items || []).map(it => ({ it, b: G.itemBox(state, it) }));
    for (const { it, b } of boxes) {
      if (!b) { W.push({ k: 'item', id: it.id, t: `Properti "${it.cat}" tidak ada di katalog.` }); continue; }
      const nm = it.name || b.c.n;
      if (b.x1 < -EPS || b.y1 < -EPS || b.x2 > S.w + EPS || b.y2 > S.d + EPS) W.push({ k: 'item', id: it.id, t: `${nm} keluar dari batas lahan.` });
      else if (!G.roomAt(state, it.x, it.y)) W.push({ k: 'item', id: it.id, t: `${nm} tidak berada di ruang mana pun.` });
      for (const p of pieces) {
        const wr = p.o === 'h' ? [p.a, p.c - T / 2, p.b, p.c + T / 2] : [p.c - T / 2, p.a, p.c + T / 2, p.b];
        if (ov(b.x1, b.x2, wr[0], wr[2]) > 0.03 && ov(b.y1, b.y2, wr[1], wr[3]) > 0.03) {
          W.push({ k: 'item', id: it.id, t: `${nm} menembus dinding.` }); break;
        }
      }
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i], B = boxes[j];
      if (!A.b || !B.b || A.b.c.lantai || B.b.c.lantai) continue;
      if (ov(A.b.x1, A.b.x2, B.b.x1, B.b.x2) > 0.02 && ov(A.b.y1, A.b.y2, B.b.y1, B.b.y2) > 0.02 && ov(A.b.z1, A.b.z2, B.b.z1, B.b.z2) > 0.01)
        W.push({ k: 'item', id: A.it.id, t: `${A.it.name || A.b.c.n} bertabrakan dengan ${B.it.name || B.b.c.n}.` });
    }
    return W;
  };

  /* ---------- data ---------- */
  G.normalize = function (s) {
    if (!s || !Array.isArray(s.rooms) || !Array.isArray(s.openings)) return null;
    s.site = s.site || { w: 9, d: 13 };
    s.wallT = s.wallT || 0.15;
    s.wallH = s.wallH > 0 ? s.wallH : 3.0;
    s.wallHeights = Array.isArray(s.wallHeights) ? s.wallHeights : [];
    s.items = Array.isArray(s.items) ? s.items : [];
    s.customCatalog = Array.isArray(s.customCatalog) ? s.customCatalog : [];
    s.rooms.forEach(r => { r.group = r.group || ''; if (r.walls == null) r.walls = true; if (r.label == null) r.label = true; });
    return s;
  };
})();
