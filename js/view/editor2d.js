/* =====================================================================
   EDITOR 2D (tampak atas)
   - Ketuk ruang untuk memilih; ketuk lagi lalu geser untuk memindah
   - Tarik garis biru pada ruang terpilih untuk menggeser sekat
   - Tarik pintu/jendela di sepanjang dinding
   - Tarik properti langsung (menempel ke dinding bila "Tempel ke dinding" aktif)
   - Geser area kosong untuk menggeser pandangan; roda mouse untuk zoom
   ===================================================================== */
(function () {
  const HB = window.HB, G = HB.geo, u = HB.u;
  const E = (HB.editor2d = {});
  let svg, stage, vb = null, drag = null;

  E.init = function () {
    svg = document.getElementById('svg2d');
    stage = document.getElementById('stage');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('wheel', e => { e.preventDefault(); E.zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, toSvg(e)); }, { passive: false });
  };

  E.fit = function () {
    const S = HB.state.site, sw = stage.clientWidth || 1, sh = stage.clientHeight || 1;
    let w = S.w + 2, h = S.d + 2;
    if (w / h < sw / sh) w = (h * sw) / sh; else h = (w * sh) / sw;
    vb = { x: S.w / 2 - w / 2, y: S.d / 2 - h / 2, w, h };
  };
  E.zoom = function (f, c) {
    if (!vb) E.fit();
    c = c || { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
    const nw = Math.max(2, Math.min(40, vb.w * f)), k = nw / vb.w;
    vb = { x: c.x - (c.x - vb.x) * k, y: c.y - (c.y - vb.y) * k, w: nw, h: vb.h * k };
    E.render();
  };
  E.reset = () => { vb = null; };

  function toSvg(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  E.toSvg = toSvg;

  E.render = function () {
    if (!svg) return;
    if (!vb) E.fit();
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    const st = HB.state, ui = HB.ui, sel = HB.sel, S = st.site, T = st.wallT;
    const { pieces, valid, segs } = G.computeWalls(st);
    let s = `<rect class="site" x="0" y="0" width="${S.w}" height="${S.d}"/>`;

    for (const r of st.rooms) {
      const on = sel.kind === 'room' && sel.id === r.id;
      s += `<rect data-room="${r.id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.d}" fill="${(HB.TYPES[r.type] || HB.TYPES.publik).c}" class="room${r.walls ? '' : ' open'}${on ? ' on' : ''}"/>`;
    }
    // properti (bagian-bagian tampak atas, diurutkan dari yang paling rendah)
    const hits = [];
    for (const it of st.items) {
      const b = G.itemBox(st, it);
      if (!b) continue;
      const c = b.c, on = sel.kind === 'item' && sel.id === it.id;
      const parts = (c.parts && c.parts.length ? c.parts : [{ x: 0, y: 0, z: 0, w: c.w, d: c.d, h: c.h, c: c.c || '#9aa0a6' }])
        .map((p, i) => Object.assign({}, p, { c: i === 0 && it.color ? it.color : p.c }))
        .sort((a, bb) => a.z + a.h - (bb.z + bb.h));
      const tf = `translate(${it.x} ${it.y}) rotate(${b.rot}) scale(${b.s.w / c.w} ${b.s.d / c.d}) translate(${-c.w / 2} ${-c.d / 2})`;
      s += `<g class="item${on ? ' on' : ''}${b.z1 > 0.5 ? ' high' : ''}" transform="${tf}">`;
      for (const p of parts) s += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.d}" fill="${p.c}"${p.o ? ` fill-opacity="${p.o}"` : ''}/>`;
      s += `<rect class="ifr" x="0" y="0" width="${c.w}" height="${c.d}"/><path class="ifront" d="M${c.w / 2 - 0.08} ${c.d - 0.02} L${c.w / 2 + 0.08} ${c.d - 0.02} L${c.w / 2} ${c.d + 0.1} Z"/></g>`;
      hits.push(`<rect class="ihit" data-item="${it.id}" transform="${tf}" x="0" y="0" width="${c.w}" height="${c.d}"/>`);
    }
    const selWall = sel.kind === 'wall' ? sel.id : null, wallRect = (o, c, a, b) => o === 'h'
      ? `x="${a}" y="${c - T / 2}" width="${b - a}" height="${T}"`
      : `x="${c - T / 2}" y="${a}" width="${T}" height="${b - a}"`;
    // dinding lebih rendah dari 2 m (sekat rendah) digambar lebih terang
    for (const p of pieces) s += `<rect class="wall${p.h < 2 ? ' low' : ''}${p.key === selWall ? ' on' : ''}" ${wallRect(p.o, p.c, p.a, p.b)}/>`;
    for (const w of segs) hits.unshift(`<rect class="whit" data-wall="${w.key}" ${wallRect(w.o, w.c, w.a, w.b)}/>`);
    const opHits = [];
    for (const op of st.openings) {
      const a = op.p - op.w / 2, b = op.p + op.w / 2, xy = op.o === 'h' ? [a, op.c, b, op.c] : [op.c, a, op.c, b];
      const on = sel.kind === 'op' && sel.id === op.id;
      const at = `x1="${xy[0]}" y1="${xy[1]}" x2="${xy[2]}" y2="${xy[3]}"`;
      s += `<line class="op ${op.type}${valid.has(op.id) ? '' : ' bad'}${on ? ' on' : ''}" ${at}/>`;
      opHits.push(`<line class="ophit" data-op="${op.id}" ${at}/>`);
    }
    for (const r of st.rooms) {
      if (!r.label) continue;
      const d = G.dims(st, r, ui.net), cx = r.x + r.w / 2, cy = r.y + r.d / 2;
      const fs = Math.max(0.12, Math.min(0.26, r.w / (r.name.length * 0.58))), fs2 = Math.max(0.11, Math.min(0.21, r.w / 9.5));
      s += `<text class="t1" x="${cx}" y="${cy - 0.04}" style="font-size:${fs}px">${u.esc(r.name)}</text><text class="t2" x="${cx}" y="${cy + fs2 + 0.04}" style="font-size:${fs2}px">${u.f2(d.w)} × ${u.f2(d.d)} m</text>`;
    }
    // dimensi lahan & arah utara
    s += `<line class="dimln" x1="0" y1="-0.45" x2="${S.w}" y2="-0.45"/><text class="dim" x="${S.w / 2}" y="-0.55">${u.f2(S.w)} m</text>`;
    s += `<line class="dimln" x1="-0.45" y1="0" x2="-0.45" y2="${S.d}"/><text class="dim" transform="translate(-0.55 ${S.d / 2}) rotate(-90)">${u.f2(S.d)} m</text>`;
    s += `<g transform="translate(${S.w + 0.45} ${S.d - 0.4})" class="dim"><path d="M0 -0.45 L0.16 0 L-0.16 0 Z" style="fill:var(--ink)"/><text y="0.32" style="font-size:.26px">U</text></g>`;
    s += hits.join('') + opHits.join('');

    if (sel.kind === 'room') {
      const r = st.rooms.find(x => x.id === sel.id);
      if (r) {
        const hs = [['top', r.x, r.y, r.x + r.w, r.y], ['bottom', r.x, r.y + r.d, r.x + r.w, r.y + r.d], ['left', r.x, r.y, r.x, r.y + r.d], ['right', r.x + r.w, r.y, r.x + r.w, r.y + r.d]];
        for (const [e, x1, y1, x2, y2] of hs) {
          const o = G.edgeAxis(e), mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          s += `<line class="ehit ${o}" data-room="${r.id}" data-edge="${e}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
          s += o === 'h' ? `<rect class="hdl" x="${mx - 0.3}" y="${my - 0.06}" width="0.6" height="0.12" rx="0.05"/>` : `<rect class="hdl" x="${mx - 0.06}" y="${my - 0.3}" width="0.12" height="0.6" rx="0.05"/>`;
        }
        s += `<text class="seld" x="${r.x + r.w / 2}" y="${r.y - 0.18}">${u.f2(r.w)}</text><text class="seld" transform="translate(${r.x - 0.14} ${r.y + r.d / 2}) rotate(-90)">${u.f2(r.d)}</text>`;
      }
    }
    if (sel.kind === 'item') {
      const it = st.items.find(x => x.id === sel.id), b = it && G.itemBox(st, it);
      if (b) s += `<text class="seld" x="${it.x}" y="${b.y1 - 0.12}">${u.f2(b.w)} × ${u.f2(b.d)}</text>`;
    }
    if (sel.kind === 'wall') {
      const w = segs.find(x => x.key === sel.id);
      if (w) {
        const m = (w.a + w.b) / 2;
        s += w.o === 'h'
          ? `<text class="seld" x="${m}" y="${w.c - 0.2}">tinggi ${u.f2(w.h)} m</text>`
          : `<text class="seld" transform="translate(${w.c - 0.2} ${m}) rotate(-90)">tinggi ${u.f2(w.h)} m</text>`;
      }
    }
    svg.innerHTML = s;
  };

  /* ---------- interaksi ---------- */
  function onDown(e) {
    const t = e.target, pt = toSvg(e), st = HB.state, sel = HB.sel;
    if (t.dataset.edge) {
      const rm = st.rooms.find(r => r.id === t.dataset.room);
      HB.pushUndo();
      drag = { k: 'edge', E: G.startEdge(st, rm, t.dataset.edge, HB.ui.linked), moved: false };
    } else if (t.dataset.item) {
      const it = st.items.find(x => x.id === t.dataset.item);
      HB.pushUndo();
      drag = { k: 'item', it, x0: it.x, y0: it.y, sx: pt.x, sy: pt.y, moved: false };
      HB.select('item', it.id, true);
    } else if (t.dataset.wall) {
      HB.select('wall', t.dataset.wall);
    } else if (t.dataset.op) {
      HB.pushUndo();
      drag = { k: 'op', op: st.openings.find(o => o.id === t.dataset.op), moved: false };
      HB.select('op', t.dataset.op, true);
    } else if (t.dataset.room) {
      const rm = st.rooms.find(r => r.id === t.dataset.room);
      const was = sel.kind === 'room' && sel.id === rm.id;
      if (was) {
        HB.pushUndo();
        const ops = st.openings.filter(op => G.EDGES.some(ed => {
          const o = G.edgeAxis(ed), [a, b] = G.span(rm, o);
          return op.o === o && Math.abs(op.c - G.edgeCoord(rm, ed)) < 0.02 && op.p > a - G.EPS && op.p < b + G.EPS;
        })).map(op => ({ op, c: op.c, p: op.p }));
        const items = st.items.filter(it => G.roomAt(st, it.x, it.y) === rm).map(it => ({ it, x: it.x, y: it.y }));
        drag = { k: 'move', rm, x0: rm.x, y0: rm.y, sx: pt.x, sy: pt.y, ops, items, moved: false };
      }
      HB.select('room', rm.id, true);
    } else {
      HB.select(null, null, true);
      drag = { k: 'pan', sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
    }
    try { svg.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
    e.preventDefault();
  }

  function onMove(e) {
    if (!drag) return;
    const pt = toSvg(e), st = HB.state;
    if (drag.k === 'edge') {
      const c = u.snap(drag.E.o === 'v' ? pt.x : pt.y);
      if (G.applyEdge(drag.E, c)) { drag.moved = true; E.render(); }
    } else if (drag.k === 'op') {
      G.snapOpening(st, drag.op, pt); drag.moved = true; E.render();
    } else if (drag.k === 'item') {
      drag.it.x = u.snap(drag.x0 + pt.x - drag.sx);
      drag.it.y = u.snap(drag.y0 + pt.y - drag.sy);
      if (HB.ui.snapWall) G.snapItemToWalls(st, drag.it, G.computeWalls(st).pieces);
      drag.moved = true; E.render();
    } else if (drag.k === 'move') {
      const S = st.site, rm = drag.rm;
      const nx = Math.max(0, Math.min(S.w - rm.w, u.snap(drag.x0 + pt.x - drag.sx)));
      const ny = Math.max(0, Math.min(S.d - rm.d, u.snap(drag.y0 + pt.y - drag.sy)));
      const dx = nx - drag.x0, dy = ny - drag.y0;
      rm.x = u.r2(nx); rm.y = u.r2(ny);
      drag.ops.forEach(q => { if (q.op.o === 'h') { q.op.c = u.r2(q.c + dy); q.op.p = u.r2(q.p + dx); } else { q.op.c = u.r2(q.c + dx); q.op.p = u.r2(q.p + dy); } });
      drag.items.forEach(q => { q.it.x = u.r3(q.x + dx); q.it.y = u.r3(q.y + dy); });
      drag.moved = true; E.render();
    } else if (drag.k === 'pan') {
      const k = vb.w / svg.clientWidth;
      vb.x = drag.vx - (e.clientX - drag.sx) * k;
      vb.y = drag.vy - (e.clientY - drag.sy) * k;
      E.render();
    }
  }

  function onUp() {
    if (!drag) return;
    if (drag.k !== 'pan') { if (!drag.moved) HB.dropUndo(); HB.renderAll(); }
    drag = null;
  }
})();
