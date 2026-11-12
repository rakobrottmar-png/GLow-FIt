// Animierte Strichfigur fuer jede Uebung (offline, ohne GIF-Dateien).
const Figure = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const live = new Set();
  let running = false;

  const el = (name, attrs) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const pts = (...p) => p.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');

  function pose(ex, t) {
    const A = ex.a, B = ex.b || A, o = {};
    for (const k in A) {
      const b = B[k] || A[k];
      o[k] = [lerp(A[k][0], b[0], t), lerp(A[k][1], b[1], t)];
    }
    if (!ex.b && ex.hold) { o.s[1] -= t * 1.2; o.h[1] -= t * 1.4; }  // ruhiges Atmen
    return o;
  }

  function draw(f, t) {
    const p = pose(f.ex, t), n = f.nodes;
    if (n.leg2) n.leg2.setAttribute('points', pts(p.hp, p.k2, p.f2));
    if (n.arm2) n.arm2.setAttribute('points', pts(p.s, p.e2, p.ha2));
    if (p.sp) {
      // Kurve durch sp: Kontrollpunkt = 2*sp - (hp+s)/2
      const cx = 2 * p.sp[0] - (p.hp[0] + p.s[0]) / 2, cy = 2 * p.sp[1] - (p.hp[1] + p.s[1]) / 2;
      n.torso.setAttribute('d', `M${pts(p.hp)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${pts(p.s)}`);
    } else {
      n.torso.setAttribute('d', `M${pts(p.hp)} L${pts(p.s)}`);
    }
    n.neck.setAttribute('points', pts(p.s, p.h));
    n.leg.setAttribute('points', pts(p.hp, p.k, p.f));
    n.arm.setAttribute('points', pts(p.s, p.e, p.ha));
    n.head.setAttribute('cx', p.h[0]); n.head.setAttribute('cy', p.h[1]);
    for (const m of n.moving) {
      const j = p[m.prop.at];
      m.node.setAttribute('x', j[0] + (m.prop.dx || 0));
      m.node.setAttribute('y', j[1] + (m.prop.dy || 0));
    }
  }

  function loop(now) {
    for (const f of live) {
      if (!f.svg.isConnected) { live.delete(f); continue; }
      const dur = f.ex.hold ? 3600 : 2400;
      draw(f, 0.5 - 0.5 * Math.cos((now % dur) / dur * Math.PI * 2));
    }
    if (live.size) requestAnimationFrame(loop); else running = false;
  }

  // create('squat_pack', { animate: true }) -> <svg>
  function create(exId, opts = {}) {
    const ex = (typeof Store !== 'undefined' && Store.exercise(exId)) || EXERCISES[exId] || EXERCISES.plank;
    const svg = el('svg', { viewBox: '10 0 180 130', class: 'figure', 'aria-hidden': 'true' });
    const body = { fill: 'none', stroke: 'var(--fig)', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const back = Object.assign({}, body, { stroke: 'var(--fig-back)' });
    const nodes = { moving: [] };

    svg.appendChild(el('line', { x1: 14, y1: 124, x2: 186, y2: 124, stroke: 'var(--fig-ground)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    for (const pr of ex.props || []) {
      if (pr.t === 'rect') svg.appendChild(el('rect', { x: pr.x, y: pr.y, width: pr.w, height: pr.h, rx: 3, fill: 'var(--fig-prop)' }));
      if (pr.t === 'line') svg.appendChild(el('line', { x1: pr.x1, y1: pr.y1, x2: pr.x2, y2: pr.y2, stroke: 'var(--fig-prop)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    }
    if (ex.a.k2) svg.appendChild(nodes.leg2 = el('polyline', back));
    if (ex.a.e2) svg.appendChild(nodes.arm2 = el('polyline', back));
    svg.appendChild(nodes.leg = el('polyline', body));
    svg.appendChild(nodes.torso = el('path', body));
    svg.appendChild(nodes.neck = el('polyline', body));
    svg.appendChild(nodes.head = el('circle', { r: 8.5, fill: 'var(--fig)' }));
    for (const pr of ex.props || []) {
      if (pr.t === 'pack') {
        const node = el('rect', { width: pr.w, height: pr.h, rx: 4, fill: 'var(--accent)' });
        svg.appendChild(node); nodes.moving.push({ node, prop: pr });
      }
    }
    svg.appendChild(nodes.arm = el('polyline', body));

    const f = { svg, ex, nodes };
    draw(f, opts.t != null ? opts.t : opts.animate === false ? 0.35 : 0);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (opts.animate !== false && !reduce) {
      live.add(f);
      if (!running) { running = true; requestAnimationFrame(loop); }
    }
    return svg;
  }

  // Ersetzt alle <i data-fig="id" [data-anim]> Platzhalter innerhalb von root.
  function mount(root) {
    root.querySelectorAll('[data-fig]').forEach(ph => {
      const svg = create(ph.dataset.fig, { animate: ph.hasAttribute('data-anim') });
      if (ph.className) svg.classList.add(...ph.className.split(/\s+/).filter(Boolean));
      ph.replaceWith(svg);
    });
  }

  return { create, mount };
})();
