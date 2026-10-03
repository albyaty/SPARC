(() => {
  const S = window.SPARC || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.remove("no-js");

  const esc = (v = "") =>
    String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const ICON = {
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    ext: '<path d="M7 17 17 7M8 7h9v9"/>',
    left: '<path d="M19 12H5M11 5l-7 7 7 7"/>',
  };
  const svgIcon = (name, cls = "") =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

  const AREA_COLOR = { prostate: "var(--c1)", bph: "var(--c2)", kidney: "var(--c3)", multi: "var(--c4)", survey: "var(--c5)" };
  const TRACK_COLOR = { kidney: "var(--c1)", recon: "var(--c2)", prostate: "var(--c3)", bph: "var(--c4)", bladder: "var(--c5)", lab: "var(--c6)" };
  const STAGE_RAMP = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"];

  /* ---------- Dates ---------- */

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parseDay = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmtRange = (ev) => {
    if (ev.dateLabel) return ev.dateLabel;
    const a = parseDay(ev.start);
    const b = parseDay(ev.end || ev.start);
    if (a.getTime() === b.getTime()) return `${MONTHS[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()}`;
    if (a.getMonth() === b.getMonth()) return `${MONTHS[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
    return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
  };
  const nextEvent = (S.events || []).find((ev) => parseDay(ev.end || ev.start) >= today);

  /* ---------- Header ---------- */

  const hdr = $(".hdr");
  const onScroll = () => hdr && hdr.classList.toggle("scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = $(".menu-btn");
  const nav = $("#nav");
  if (menuBtn && nav) {
    const close = () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    };
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        close();
        menuBtn.focus();
      }
    });
  }

  /* ---------- Visibility helper ---------- */

  const onVisible = (el, fn, opts = { threshold: 0.2 }) => {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          fn();
          io.disconnect();
        }
      });
    }, opts);
    io.observe(el);
  };

  /* ---------- Count-up ---------- */

  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const fmt = (n) => n.toLocaleString("en-US") + suffix;
    if (reduce) {
      el.textContent = fmt(target);
      return;
    }
    el.textContent = fmt(0);
    onVisible(el, () => {
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });

  /* ---------- Countdown band ---------- */

  $$("[data-countdown]").forEach((el) => {
    if (!nextEvent) {
      el.hidden = true;
      return;
    }
    const ev = nextEvent;
    const at = ev.startsAt ? new Date(ev.startsAt) : parseDay(ev.start);
    const end = parseDay(ev.end || ev.start);
    end.setHours(23, 59, 59);
    const cta = ev.cta
      ? `<a class="btn btn-cyan btn-sm" href="${esc(ev.cta.href)}" target="_blank" rel="noopener">${esc(ev.cta.label)} ${svgIcon("ext")}</a>`
      : "";
    el.innerHTML = `<div class="wrap">
      <div>
        <span class="label">Next meeting</span>
        <h3>${esc(ev.title)}</h3>
        <p>${esc(fmtRange(ev))} · ${esc(ev.place)}</p>
      </div>
      <div class="clock" role="timer" aria-label="Time until ${esc(ev.title)}">
        <div><b data-u="d">00</b><span>Days</span></div>
        <div><b data-u="h">00</b><span>Hours</span></div>
        <div><b data-u="m">00</b><span>Min</span></div>
        <div><b data-u="s">00</b><span>Sec</span></div>
      </div>
      <div class="acts">${cta}<a class="btn btn-line btn-sm" href="${esc(ev.href)}">Details ${svgIcon("arrow", "arr")}</a></div>
    </div>`;
    const clock = $(".clock", el);
    const set = (u, v) => ($(`[data-u="${u}"]`, clock).textContent = String(v).padStart(2, "0"));
    const tick = () => {
      const now = new Date();
      let ms = at - now;
      if (ms <= 0) {
        clock.innerHTML = now <= end ? `<div style="padding:16px 22px"><b style="font-size:1.2rem">Happening now</b></div>` : "";
        return false;
      }
      const d = Math.floor(ms / 864e5);
      ms -= d * 864e5;
      const h = Math.floor(ms / 36e5);
      ms -= h * 36e5;
      const m = Math.floor(ms / 6e4);
      ms -= m * 6e4;
      set("d", d);
      set("h", h);
      set("m", m);
      set("s", Math.floor(ms / 1000));
      return true;
    };
    if (tick()) setInterval(tick, 1000);
  });

  $$("[data-days-to]").forEach((el) => {
    const ev = (S.events || []).find((e) => e.id === el.dataset.daysTo);
    if (!ev) return;
    const days = Math.round((parseDay(ev.start) - today) / 864e5);
    if (days > 1) el.textContent = `${days} days to go`;
    else if (days >= -1) el.textContent = "Happening now";
    else el.closest("li") ? (el.closest("li").hidden = true) : (el.hidden = true);
  });

  /* ---------- Dot map ---------- */

  class DotMap {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({ align: "center", list: null, ripple: true, labels: true }, opts);
      this.M = window.SPARC_MAP;
      this.sites = S.institutions || [];
      this.active = -1;
      this.region = null;
      this.canvas = document.createElement("canvas");
      this.canvas.setAttribute("role", "img");
      this.canvas.setAttribute("aria-label", `Map of ${this.sites.length} SPARC participating institutions across the United States, with data flowing to the coordinating center at Cleveland Clinic`);
      this.ctx = this.canvas.getContext("2d");
      el.appendChild(this.canvas);
      this.tip = document.createElement("div");
      this.tip.className = "map-tip";
      this.tip.hidden = true;
      el.appendChild(this.tip);
      this.geometry();
      this.resize();
      this.bind();
      new ResizeObserver(() => this.resize()).observe(el);
      this.visible = false;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((en) => {
          this.visible = en[0].isIntersecting;
          if (this.visible) this.start();
        }).observe(el);
      } else {
        this.visible = true;
        this.start();
      }
    }

    project(lon, lat) {
      const p = this.M.projection;
      const rad = Math.PI / 180;
      const p0 = p.parallels[0] * rad;
      const p1 = p.parallels[1] * rad;
      const n = (Math.sin(p0) + Math.sin(p1)) / 2;
      const c = 1 + Math.sin(p0) * (2 * n - Math.sin(p0));
      const r0 = Math.sqrt(c) / n;
      const raw = (l, f) => {
        const r = Math.sqrt(c - 2 * n * Math.sin(f)) / n;
        return [r * Math.sin(l * n), r0 - r * Math.cos(l * n)];
      };
      const [cx, cy] = raw(p.center[0] * rad, p.center[1] * rad);
      const [x, y] = raw((lon + p.rotate) * rad, lat * rad);
      return [p.tx + (x - cx) * p.k, p.ty - (y - cy) * p.k];
    }

    geometry() {
      const M = this.M;
      const rowH = (M.spacing * Math.sqrt(3)) / 2;
      const dots = [];
      M.rows.forEach((runs, r) => {
        const y = M.pad + r * rowH;
        const off = (r % 2) * (M.spacing / 2);
        for (let i = 0; i < runs.length; i += 2) {
          for (let c = runs[i]; c <= runs[i + 1]; c++) dots.push([M.pad + off + c * M.spacing, y]);
        }
      });
      // site positions, with metro clusters fanned out so each stays reachable
      const pts = this.sites.map((s) => this.project(s.lon, s.lat));
      const groups = [];
      pts.forEach((p, i) => {
        const g = groups.find((grp) => grp.some((j) => Math.hypot(pts[j][0] - p[0], pts[j][1] - p[1]) < 15));
        g ? g.push(i) : groups.push([i]);
      });
      groups
        .filter((g) => g.length > 1)
        .forEach((g) => {
          const cx = g.reduce((a, j) => a + pts[j][0], 0) / g.length;
          const cy = g.reduce((a, j) => a + pts[j][1], 0) / g.length;
          const rr = 9 + g.length * 2.5;
          g.forEach((j, k) => {
            const t = -Math.PI / 2 + (2 * Math.PI * k) / g.length;
            pts[j] = [cx + rr * Math.cos(t), cy + rr * Math.sin(t)];
          });
        });
      this.pts = pts;
      this.host = Math.max(0, this.sites.findIndex((s) => s.host));
      const [hx, hy] = pts[this.host];
      // per-dot heat (proximity to a site) and distance to the host, for the ripple
      this.dots = dots.map(([x, y]) => {
        let heat = 0;
        pts.forEach(([sx, sy], i) => {
          const R = i === this.host ? 95 : 48;
          const d = Math.hypot(x - sx, y - sy);
          if (d < R) heat = Math.max(heat, Math.pow(1 - d / R, 2) * (i === this.host ? 1 : 0.8));
        });
        return { x, y, heat, dh: Math.hypot(x - hx, y - hy) };
      });
      this.byDist = this.dots.slice().sort((a, b) => a.dh - b.dh);
      this.maxDist = this.byDist[this.byDist.length - 1].dh;
      // arcs from every site into the host
      this.arcs = pts.map(([x, y], i) => {
        if (i === this.host) return null;
        const dx = hx - x;
        const dy = hy - y;
        const len = Math.hypot(dx, dy);
        let nx = -dy / len;
        let ny = dx / len;
        if (ny > 0) {
          nx = -nx;
          ny = -ny;
        }
        const bend = Math.min(140, len * 0.28);
        return { x0: x, y0: y, cx: x + dx / 2 + nx * bend, cy: y + dy / 2 + ny * bend, x1: hx, y1: hy, len, phase: (i * 0.137) % 1 };
      });
    }

    resize() {
      const w = this.el.clientWidth;
      const h = this.el.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.w = w;
      this.h = h;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      const s = Math.min(w / this.M.width, h / this.M.height);
      this.s = s;
      this.ox = this.o.align === "right" ? w - this.M.width * s : (w - this.M.width * s) / 2;
      this.oy = (h - this.M.height * s) / 2;
      this.renderStatic();
      this.draw(performance.now());
    }

    X(x) {
      return this.ox + x * this.s;
    }

    Y(y) {
      return this.oy + y * this.s;
    }

    renderStatic() {
      const c = document.createElement("canvas");
      c.width = this.canvas.width;
      c.height = this.canvas.height;
      const g = c.getContext("2d");
      g.scale(this.dpr, this.dpr);
      const r = Math.max(0.8, this.M.spacing * 0.15 * this.s);
      this.dots.forEach((d) => {
        const a = 0.2 + d.heat * 0.55;
        const mix = d.heat;
        const R = Math.round(200 + (87 - 200) * mix);
        const G = Math.round(214 + (214 - 214) * mix);
        const B = Math.round(228 + (247 - 228) * mix);
        g.fillStyle = `rgba(${R},${G},${B},${a})`;
        g.beginPath();
        g.arc(this.X(d.x), this.Y(d.y), r * (1 + d.heat * 0.35), 0, Math.PI * 2);
        g.fill();
      });
      this.static = c;
      this.dotR = r;
    }

    bezier(a, t) {
      const u = 1 - t;
      return [u * u * a.x0 + 2 * u * t * a.cx + t * t * a.x1, u * u * a.y0 + 2 * u * t * a.cy + t * t * a.y1];
    }

    inRegion(i) {
      return !this.region || this.sites[i].region === this.region || this.sites[i].host;
    }

    draw(t) {
      const g = this.ctx;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (!this.static) return;
      g.drawImage(this.static, 0, 0);
      g.scale(this.dpr, this.dpr);
      const sec = t / 1000;

      // inward ripple: a wave of light converging on the coordinating center
      if (this.o.ripple && !reduce) {
        const P = 6.5;
        const p = (sec % P) / P;
        const rad = this.maxDist * (1 - p);
        const band = 16;
        const lo = this.lower(rad - band);
        const fade = Math.sin(p * Math.PI);
        for (let i = lo; i < this.byDist.length; i++) {
          const d = this.byDist[i];
          if (d.dh > rad + band) break;
          const k = 1 - Math.abs(d.dh - rad) / band;
          g.fillStyle = `rgba(87,214,247,${0.55 * k * fade})`;
          g.beginPath();
          g.arc(this.X(d.x), this.Y(d.y), this.dotR * 1.25, 0, Math.PI * 2);
          g.fill();
        }
      }

      // arcs
      this.arcs.forEach((a, i) => {
        if (!a || !this.inRegion(i)) return;
        const on = i === this.active;
        g.strokeStyle = on ? "rgba(87,214,247,0.85)" : "rgba(87,214,247,0.13)";
        g.lineWidth = on ? 1.6 : 1;
        g.beginPath();
        g.moveTo(this.X(a.x0), this.Y(a.y0));
        g.quadraticCurveTo(this.X(a.cx), this.Y(a.cy), this.X(a.x1), this.Y(a.y1));
        g.stroke();
      });

      // particles travelling to the host
      if (!reduce) {
        this.arcs.forEach((a, i) => {
          if (!a || !this.inRegion(i)) return;
          const speed = 70 / a.len;
          const head = (sec * speed * 0.55 + a.phase) % 1;
          const on = i === this.active;
          for (let k = 0; k < 10; k++) {
            const tt = head - k * 0.012;
            if (tt < 0) break;
            const [x, y] = this.bezier(a, tt);
            g.fillStyle = `rgba(${on ? "255,255,255" : "150,232,252"},${(1 - k / 10) * (on ? 1 : 0.8)})`;
            g.beginPath();
            g.arc(this.X(x), this.Y(y), (k === 0 ? 1.9 : 1.3) * Math.max(0.8, this.s), 0, Math.PI * 2);
            g.fill();
          }
        });
      }

      // nodes
      this.pts.forEach(([x, y], i) => {
        const X = this.X(x);
        const Y = this.Y(y);
        const host = i === this.host;
        const on = i === this.active;
        const dim = !this.inRegion(i);
        const base = host ? "255,95,82" : "87,214,247";
        const glowR = (host ? 22 : on ? 16 : 11) * Math.max(0.75, this.s);
        const grad = g.createRadialGradient(X, Y, 0, X, Y, glowR);
        grad.addColorStop(0, `rgba(${base},${dim ? 0.08 : 0.45})`);
        grad.addColorStop(1, `rgba(${base},0)`);
        g.fillStyle = grad;
        g.beginPath();
        g.arc(X, Y, glowR, 0, Math.PI * 2);
        g.fill();
        const core = (host ? 5 : on ? 4.6 : 3.4) * Math.max(0.8, this.s);
        g.fillStyle = dim ? `rgba(${base},0.3)` : host ? "#ff5f52" : on ? "#ffffff" : "#57d6f7";
        g.beginPath();
        g.arc(X, Y, core, 0, Math.PI * 2);
        g.fill();
        if (host && !reduce) {
          for (let k = 0; k < 2; k++) {
            const p = ((sec / 2.4 + k / 2) % 1);
            g.strokeStyle = `rgba(255,95,82,${0.6 * (1 - p)})`;
            g.lineWidth = 1.2;
            g.beginPath();
            g.arc(X, Y, core + p * 26 * Math.max(0.8, this.s), 0, Math.PI * 2);
            g.stroke();
          }
        }
        if (on && !host) {
          g.strokeStyle = "rgba(255,255,255,0.7)";
          g.lineWidth = 1;
          g.beginPath();
          g.arc(X, Y, core + 5, 0, Math.PI * 2);
          g.stroke();
        }
      });

      // host label
      if (this.o.labels && this.w > 520) {
        const [hx, hy] = this.pts[this.host];
        const fs = Math.max(9.5, 10.5 * Math.min(1.1, this.s));
        g.font = `500 ${fs}px "JetBrains Mono", monospace`;
        const l1 = "CLEVELAND CLINIC";
        const l2 = "COORDINATING CENTER";
        const tw = Math.max(g.measureText(l1).width, g.measureText(l2).width);
        const X = this.X(hx);
        const Y = this.Y(hy);
        const bx = X + 14;
        const by = Y - 30 - fs * 2.6;
        g.strokeStyle = "rgba(255,95,82,0.5)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(X + 4, Y - 4);
        g.lineTo(bx, by + fs * 2.6);
        g.stroke();
        g.fillStyle = "rgba(7,11,17,0.82)";
        g.fillRect(bx, by, tw + 16, fs * 2.6 + 6);
        g.textBaseline = "top";
        g.fillStyle = "rgba(255,255,255,0.85)";
        g.fillText(l1, bx + 8, by + 5);
        g.fillStyle = "rgba(255,95,82,0.95)";
        g.fillText(l2, bx + 8, by + 5 + fs * 1.3);
      }
    }

    lower(v) {
      let lo = 0;
      let hi = this.byDist.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this.byDist[mid].dh < v) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    }

    start() {
      if (reduce) return this.draw(0);
      if (this.raf) return;
      const loop = (t) => {
        if (!this.visible || document.hidden) {
          this.raf = null;
          return;
        }
        this.draw(t);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    hit(px, py) {
      let best = -1;
      let bd = 18;
      this.pts.forEach(([x, y], i) => {
        if (!this.inRegion(i)) return;
        const d = Math.hypot(this.X(x) - px, this.Y(y) - py);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    }

    setActive(i) {
      this.active = i;
      if (i < 0) {
        this.tip.hidden = true;
      } else {
        const s = this.sites[i];
        const [x, y] = this.pts[i];
        this.tip.innerHTML = `<b>${esc(s.name)}</b><small>${esc(s.city)}${s.host ? " · <em>Coordinating center</em>" : ` · ${esc(s.region)}`}</small>`;
        this.tip.style.left = `${Math.min(Math.max(this.X(x), 100), this.w - 100)}px`;
        this.tip.style.top = `${this.Y(y)}px`;
        this.tip.hidden = false;
      }
      if (this.o.list) $$("[data-i]", this.o.list).forEach((li) => li.classList.toggle("active", Number(li.dataset.i) === i));
      if (reduce) this.draw(0);
    }

    setRegion(r) {
      this.region = r;
      if (this.active >= 0 && !this.inRegion(this.active)) this.setActive(-1);
      if (this.o.list) $$("[data-i]", this.o.list).forEach((li) => li.classList.toggle("dim", !this.inRegion(Number(li.dataset.i))));
      if (reduce) this.draw(0);
    }

    bind() {
      const pos = (e) => {
        const r = this.canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
      };
      this.canvas.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const i = this.hit(...pos(e));
        this.canvas.style.cursor = i >= 0 ? "pointer" : "default";
        if (i !== this.active) this.setActive(i);
      });
      this.canvas.addEventListener("pointerleave", () => this.setActive(-1));
      this.canvas.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        const i = this.hit(...pos(e));
        this.setActive(i === this.active ? -1 : i);
      });
      if (this.o.list) {
        $$("[data-i]", this.o.list).forEach((li) => {
          const i = Number(li.dataset.i);
          li.addEventListener("mouseenter", () => this.setActive(i));
          li.addEventListener("mouseleave", () => this.setActive(-1));
          li.addEventListener("focus", () => this.setActive(i));
          li.addEventListener("blur", () => this.setActive(-1));
          li.addEventListener("click", () => this.setActive(i));
        });
      }
    }
  }

  // Site list (network page) must exist before the map binds to it.
  $$("[data-sites]").forEach((ul) => {
    const order = ["Midwest", "Northeast & Mid-Atlantic", "Southeast", "South & Central", "West"];
    const rows = (S.institutions || []).map((s, i) => [s, i]);
    rows.sort((a, b) => (b[0].host ? 1 : 0) - (a[0].host ? 1 : 0) || order.indexOf(a[0].region) - order.indexOf(b[0].region) || a[0].name.localeCompare(b[0].name));
    ul.innerHTML = rows
      .map(([s, i]) => `<li data-i="${i}" tabindex="0" class="${s.host ? "host" : ""}"><i></i><div><b>${esc(s.name)}</b><small>${esc(s.city)}${s.host ? " · Coordinating center" : ""}</small></div></li>`)
      .join("");
  });

  const maps = [];
  $$("[data-dotmap]").forEach((el) => {
    if (!window.SPARC_MAP) return;
    const list = el.dataset.list ? $(el.dataset.list) : null;
    maps.push(new DotMap(el, { align: el.dataset.align || "center", list, labels: el.dataset.labels !== "false" }));
  });

  $$("[data-regions]").forEach((bar) => {
    const regions = ["All", "Midwest", "Northeast & Mid-Atlantic", "Southeast", "South & Central", "West"];
    bar.innerHTML = regions
      .map((r, i) => `<button class="rbtn" type="button" data-r="${i ? esc(r) : ""}" aria-pressed="${i === 0}">${esc(r)}</button>`)
      .join("");
    bar.addEventListener("click", (e) => {
      const b = e.target.closest(".rbtn");
      if (!b) return;
      $$(".rbtn", bar).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      maps.forEach((m) => m.setRegion(b.dataset.r || null));
    });
  });

  /* ---------- Convergence diagram ---------- */

  $$("[data-converge]").forEach((host) => {
    const inputs = ["NYU Langone Health", "Mount Sinai Health System", "Mayo Clinic Florida", "Keck Medicine of USC", "Northwestern Medicine", "Baylor College of Medicine", "Henry Ford Health", "Emory Healthcare"];
    const outputs = [
      [String(S.publications.length), "peer-reviewed publications"],
      ["17", "abstracts at AUA 2026"],
      [String(S.projects.length), "projects in the pipeline"],
    ];
    let mode = "";
    const defs = `<defs><radialGradient id="ringGlow"><stop offset="0" stop-color="rgba(87,214,247,0.22)"/><stop offset="1" stop-color="rgba(87,214,247,0)"/></radialGradient></defs>`;
    const ring = (cx, cy) => `
      <circle class="ring-glow" cx="${cx}" cy="${cy}" r="170"/>
      <circle class="ring-outer" cx="${cx}" cy="${cy}" r="112"/>
      <circle class="ring-ticks" cx="${cx}" cy="${cy}" r="96"/>
      <circle class="ring-core" cx="${cx}" cy="${cy}" r="76"/>
      <text class="core-k" x="${cx}" y="${cy - 26}" text-anchor="middle">SPARC REGISTRY</text>
      <text class="core-n" x="${cx}" y="${cy + 16}" text-anchor="middle">4,500+</text>
      <text class="core-s" x="${cx}" y="${cy + 40}" text-anchor="middle">patients · REDCap</text>`;
    const build = () => {
      const wide = host.clientWidth >= 760;
      const next = wide ? "h" : "v";
      if (next === mode) return;
      mode = next;
      let out = "";
      if (wide) {
        const W = 1200;
        const H = 560;
        const cx = 600;
        const cy = 280;
        inputs.concat(["+ more centers across the U.S."]).forEach((name, i) => {
          const y = 48 + i * 58;
          const more = i === inputs.length;
          const d = `M318 ${y} C 430 ${y}, 440 ${cy}, ${cx - 112} ${cy}`;
          out += `<text class="${more ? "in-more" : "in-label"}" x="300" y="${y + 5}" text-anchor="end">${esc(more ? name.toUpperCase() : name)}</text>`;
          out += `<path class="wire" d="${d}"/><path class="flow" d="${d}" style="animation-delay:${-i * 0.37}s"/>`;
          out += `<circle class="node" cx="318" cy="${y}" r="3"/>`;
        });
        outputs.forEach(([n, l], i) => {
          const y = 140 + i * 140;
          const d = `M${cx + 112} ${cy} C 770 ${cy}, 770 ${y}, 838 ${y}`;
          out += `<path class="wire" d="${d}"/><path class="flow" d="${d}" style="animation-delay:${-i * 0.5}s"/>`;
          out += `<circle class="node" cx="842" cy="${y}" r="4"/>`;
          out += `<text class="out-n" x="864" y="${y + 6}">${esc(n)}</text><text class="out-l" x="866" y="${y + 32}">${esc(l)}</text>`;
        });
        host.innerHTML = `<svg class="converge" viewBox="0 0 ${W} ${H}" role="img" aria-label="Participating centers feed one SPARC registry of more than 4,500 patients, which produces publications, AUA abstracts, and active projects">${defs}${out}${ring(cx, cy)}</svg>`;
      } else {
        const W = 400;
        const cx = 200;
        const cy = 420;
        inputs.forEach((name, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col ? 300 : 100;
          const y = 26 + row * 46;
          const short = name.replace(" Health System", "").replace(" Medicine of USC", " USC").replace("Baylor College of Medicine", "Baylor Medicine");
          const d = `M${x} ${y + 12} C ${x} ${y + 150}, ${cx} ${cy - 220}, ${cx} ${cy - 112}`;
          out += `<text class="in-label" x="${x}" y="${y}" text-anchor="middle" style="font-size:14px">${esc(short)}</text>`;
          out += `<path class="wire" d="${d}"/><path class="flow" d="${d}" style="animation-delay:${-i * 0.37}s"/>`;
        });
        out += `<text class="in-more" x="${cx}" y="222" text-anchor="middle">+ MORE CENTERS</text>`;
        const d2 = `M${cx} ${cy + 112} L ${cx} 860`;
        out += `<path class="wire" d="${d2}"/><path class="flow" d="${d2}"/>`;
        outputs.forEach(([n, l], i) => {
          const y = 620 + i * 120;
          out += `<circle class="node" cx="${cx}" cy="${y}" r="4"/>`;
          out += `<text class="out-n" x="${cx + 22}" y="${y + 6}" style="font-size:40px">${esc(n)}</text><text class="out-l" x="${cx + 24}" y="${y + 30}" style="font-size:14px">${esc(l)}</text>`;
        });
        host.innerHTML = `<svg class="converge" viewBox="0 0 ${W} 900" role="img" aria-label="Participating centers feed one SPARC registry of more than 4,500 patients, which produces publications, AUA abstracts, and active projects">${defs}${out}${ring(cx, cy)}</svg>`;
      }
      if (host.dataset.on) $("svg", host).classList.add("on");
    };
    build();
    new ResizeObserver(build).observe(host);
    onVisible(host, () => {
      host.dataset.on = "1";
      $("svg", host).classList.add("on");
    });
  });

  /* ---------- Databases index ---------- */

  $$("[data-index]").forEach((ul) => {
    ul.innerHTML = (S.databases || [])
      .map((db, i) => {
        const papers = S.publications.filter((p) => db.areas.includes(p.area)).length;
        const projects = S.projects.filter((p) => p.db === db.id).length;
        const area = db.areas[0];
        const href = area ? `research.html?area=${area}#publications` : "research.html#projects";
        const chips = [];
        if (papers) chips.push(`<span class="chip" style="--dot:${AREA_COLOR[area]}"><i></i>${papers} paper${papers > 1 ? "s" : ""}</span>`);
        if (projects) chips.push(`<span class="chip">${projects} active project${projects > 1 ? "s" : ""}</span>`);
        if (!papers && !projects) chips.push(`<span class="chip">Accruing cases</span>`);
        return `<li><a href="${href}">
          <span class="n">${String(i + 1).padStart(2, "0")}</span>
          <div><h3>${esc(db.title)}</h3><div class="desc"><p>${esc(db.desc)}</p></div></div>
          <div class="meta">${chips.join("")}</div>
          <span class="go">${svgIcon("arrow")}</span>
        </a></li>`;
      })
      .join("");
  });

  /* ---------- Publication rail ---------- */

  const pubLink = (p) => (p.doi ? `https://doi.org/${p.doi}` : null);
  const firstAuthor = (p) => p.authors.split(",")[0].replace(/ ·.*/, "") + ", et al.";

  $$("[data-rail]").forEach((rail) => {
    const pubs = S.publications.filter((p) => p.year >= 2025);
    rail.innerHTML =
      pubs
        .map((p) => {
          const link = pubLink(p);
          const tag = link ? "a" : "div";
          const attrs = link ? `href="${link}" target="_blank" rel="noopener"` : "";
          return `<${tag} class="pcard" ${attrs}>
            <div class="top"><span class="mono">${esc(p.journal)}</span><span class="chip" style="--dot:${AREA_COLOR[p.area]}"><i></i>${esc(S.areas[p.area])}</span></div>
            <span class="yr">${p.year}</span>
            <h4>${esc(p.title)}</h4>
            <div class="pfoot"><span>${esc(firstAuthor(p))}</span><span class="mono">${link ? "Read ↗" : esc(p.status || "")}</span></div>
          </${tag}>`;
        })
        .join("") +
      `<a class="pcard all" href="research.html#publications"><span class="mono" style="color:var(--fg-3)">Archive</span><h4>All ${S.publications.length} publications</h4><span class="circle">${svgIcon("arrow")}</span></a>`;
    const wrap = rail.closest("section");
    $$("[data-rail-dir]", wrap).forEach((b) =>
      b.addEventListener("click", () => {
        const card = $(".pcard", rail);
        const step = card ? card.getBoundingClientRect().width + 16 : 380;
        rail.scrollBy({ left: Number(b.dataset.railDir) * step, behavior: reduce ? "auto" : "smooth" });
      })
    );
  });

  /* ---------- Faces ---------- */

  const leaders = [
    ["Jihad Kaouk", "MD", "Cleveland Clinic", "Cleveland, OH", "jihad-kaouk"],
    ["Riccardo Autorino", "MD, PhD", "Cleveland Clinic", "Cleveland, OH", "riccardo-autorino"],
    ["Carvell Nguyen", "MD, PhD", "Cleveland Clinic", "Cleveland, OH", "carvell-nguyen"],
    ["Zeyad R. Schwen", "MD", "Cleveland Clinic", "Cleveland, OH", "zeyad-r-schwen"],
    ["Mani Menon", "MD", "Mount Sinai Health", "New York, NY", "mani-menon"],
  ];

  $$("[data-faces]").forEach((ul) => {
    const base = ul.dataset.faces;
    const people = leaders.concat(S.faculty || []);
    ul.innerHTML = people
      .map(([n, , , , ph]) => `<li><img src="${esc(base)}${esc(ph)}.jpg" alt="" loading="lazy" width="200" height="200"><span>${esc(n)}</span></li>`)
      .join("");
  });

  /* ---------- Faculty wall + search ---------- */

  $$("[data-faculty]").forEach((ul) => {
    const base = ul.dataset.faculty;
    const input = $("#fac-search");
    const count = $("#fac-count");
    const people = S.faculty || [];
    const render = (q = "") => {
      const n = q.trim().toLowerCase();
      const rows = people.filter((p) => !n || p.join(" ").toLowerCase().includes(n));
      ul.innerHTML = rows.length
        ? rows
            .map(
              ([name, cred, org, loc, ph]) => `<li><div class="ph"><img src="${esc(base)}${esc(ph)}.jpg" alt="${esc(name)}" loading="lazy" width="200" height="200"></div>
              <b>${esc(name)}, ${esc(cred)}</b><span>${esc(org)}</span><em>${esc(loc)}</em></li>`
            )
            .join("")
        : `<li class="empty">No faculty match “${esc(q)}”.</li>`;
      if (count) count.textContent = `${rows.length} of ${people.length} faculty`;
    };
    if (input) input.addEventListener("input", () => render(input.value));
    render();
  });

  /* ---------- Symposium: glance chart + program ---------- */

  const toMin = (s, mer) => {
    const m = s.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    let h = Number(m[1]) % 12;
    const ap = (m[3] || mer || "AM").toUpperCase();
    if (ap === "PM") h += 12;
    return h * 60 + Number(m[2]);
  };
  const span = (str) => {
    const parts = str.split(/–|-/);
    const endMer = (parts[parts.length - 1].match(/AM|PM/i) || [])[0];
    const a = toMin(parts[0], endMer);
    const b = parts[1] ? toMin(parts[1]) : a + 10;
    return [a, b];
  };

  const tip = document.createElement("div");
  tip.className = "viz-tip";
  tip.hidden = true;
  document.body.appendChild(tip);
  const showTip = (html, x, y) => {
    tip.innerHTML = html;
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = `${Math.min(window.innerWidth - w - 12, Math.max(12, x - w / 2))}px`;
    tip.style.top = `${y - tip.offsetHeight - 12}px`;
  };
  const hideTip = () => (tip.hidden = true);

  $$("[data-glance]").forEach((el) => {
    const days = S.program || [];
    el.innerHTML = days
      .map((d, di) => {
        const items = d.items.map((it, ii) => ({ it, ii, r: span(it.time) })).filter(({ r }) => r[0] < 18 * 60);
        const t0 = Math.floor(Math.min(...items.map((x) => x.r[0])) / 60) * 60;
        const t1 = Math.ceil(Math.max(...items.map((x) => x.r[1])) / 60) * 60;
        const pct = (m) => ((m - t0) / (t1 - t0)) * 100;
        const segs = items
          .map(({ it, ii, r }) => {
            const kind = it.track ? "track" : it.kind === "break" ? "brk" : /Novick/.test(it.title) ? "key" : "plen";
            const label = it.track ? S.tracks[it.track] : it.title;
            const style = `left:${pct(r[0])}%;width:calc(${pct(r[1]) - pct(r[0])}% - 2px);${it.track ? `--seg:${TRACK_COLOR[it.track]}` : ""}`;
            return `<a class="gseg ${kind}" href="#slot-${di}-${ii}" style="${style}" data-tip="${esc(it.title)}" data-time="${esc(it.time)}"><span class="t">${esc(label)}</span></a>`;
          })
          .join("");
        const ticks = [];
        for (let m = t0; m <= t1; m += 60) {
          const h = Math.floor(m / 60);
          ticks.push(`<span style="left:${pct(m)}%">${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}</span>`);
        }
        return `<div class="glance-row"><h4>${esc(d.day)}<span>${esc(d.theme)}</span></h4><div class="gbar">${segs}</div><div class="gaxis">${ticks.join("")}</div></div>`;
      })
      .join("");
    const fitLabels = () => $$(".gseg", el).forEach((s) => s.classList.toggle("tight", s.offsetWidth < 64));
    fitLabels();
    new ResizeObserver(fitLabels).observe(el);
    $$(".gseg", el).forEach((s) => {
      s.addEventListener("mouseenter", () => {
        const r = s.getBoundingClientRect();
        showTip(`${esc(s.dataset.tip)}<small>${esc(s.dataset.time)}</small>`, r.left + r.width / 2, r.top);
      });
      s.addEventListener("mouseleave", hideTip);
      s.addEventListener("click", (e) => {
        const di = s.getAttribute("href").split("-")[1];
        const tab = $(`#tab-${di}`);
        if (tab) tab.click();
        hideTip();
        e.preventDefault();
        const target = $(s.getAttribute("href"));
        if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    });
    const legend = $("[data-track-legend]");
    if (legend)
      legend.innerHTML = Object.entries(S.tracks)
        .map(([k, v]) => `<span class="chip" style="--dot:${TRACK_COLOR[k]}"><i></i>${esc(v)}</span>`)
        .join("");
  });

  const talks = (list) =>
    `<ul class="talks">${list
      .map(([t, title, who]) => {
        const qa = !who && /^(Q&A|Crossfire debate)$/i.test(title);
        return `<li class="${qa ? "qa" : ""}"><time>${esc(t)}</time><span>${esc(title)}</span>${who ? `<span class="sp">${esc(who)}</span>` : ""}</li>`;
      })
      .join("")}</ul>`;

  const slot = (it, di, ii) => {
    const cls = it.track ? (it.kind === "lab" ? "lab" : "session") : it.kind === "break" ? "brk" : "plen";
    let body = "";
    if (it.track) body += `<span class="chip" style="--dot:${TRACK_COLOR[it.track]}"><i></i>${esc(S.tracks[it.track])}</span>`;
    body += `<div class="title">${esc(it.title)}</div>`;
    if (it.speaker) body += `<div class="who">${esc(it.speaker)}</div>`;
    if (it.note) body += `<div class="who">${esc(it.note)}</div>`;
    if (it.chairs || it.moderators || it.faculty)
      body += `<div class="roles">${it.chairs ? `<div><b>Co-chairs</b> · ${esc(it.chairs)}</div>` : ""}${it.moderators ? `<div><b>Moderators</b> · ${esc(it.moderators)}</div>` : ""}${it.faculty ? `<div><b>Lab faculty</b> · ${esc(it.faculty)}</div>` : ""}</div>`;
    if (it.procedures) body += `<ul class="procs">${it.procedures.map((p) => `<li class="chip">${esc(p)}</li>`).join("")}</ul>`;
    if (it.blocks) body += it.blocks.map((b) => `<div class="blk">${b.title ? `<h5>${esc(b.title)}</h5>` : ""}${talks(b.talks)}</div>`).join("");
    return `<li id="slot-${di}-${ii}" class="${cls}" style="${it.track ? `--seg:${TRACK_COLOR[it.track]}` : ""}"><time>${esc(it.time)}</time><div class="body">${body}</div></li>`;
  };

  $$("[data-program]").forEach((el) => {
    const days = S.program || [];
    el.innerHTML = `<div class="tabs" role="tablist" aria-label="Symposium days">${days
      .map((d, i) => `<button class="tab" role="tab" id="tab-${i}" aria-controls="day-${i}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}" type="button">${esc(d.short)}<small>${esc(d.theme)}</small></button>`)
      .join("")}</div>${days
      .map(
        (d, i) => `<div role="tabpanel" id="day-${i}" aria-labelledby="tab-${i}" ${i ? "hidden" : ""}>
          <div class="day-meta"><span><b>${esc(d.day)}</b></span><span>${esc(d.venue)}</span></div>
          <ol class="tl">${d.items.map((it, ii) => slot(it, i, ii)).join("")}</ol>
        </div>`
      )
      .join("")}`;
    const tabs = $$('[role="tab"]', el);
    const select = (k) =>
      tabs.forEach((t, i) => {
        t.setAttribute("aria-selected", String(i === k));
        t.tabIndex = i === k ? 0 : -1;
        $(`#day-${i}`, el).hidden = i !== k;
      });
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        select(n);
        tabs[n].focus();
      });
    });
  });

  /* ---------- AUA tickets ---------- */

  $$("[data-tickets]").forEach((ul) => {
    ul.innerHTML = (S.aua2026Abstracts || [])
      .flatMap((d) => d.items.map(([code, title]) => `<li class="ticket"><span class="code">${esc(code)}</span><p>${esc(title)}</p><span class="day mono">${esc(d.day)}</span></li>`))
      .join("");
  });

  /* ---------- Research: tracker ---------- */

  $$("[data-tracker]").forEach((ul) => {
    const stages = S.projectStages;
    const rows = S.projects.slice().sort((a, b) => stages.indexOf(b.stage) - stages.indexOf(a.stage));
    ul.innerHTML = rows
      .map((p) => {
        const k = stages.indexOf(p.stage);
        const cells = stages
          .map((st, i) => `<span class="cell ${i <= k ? "on" : ""} ${i === k ? "now" : ""}" style="--fill:${STAGE_RAMP[i]}" title="${esc(st)}"></span>`)
          .join("");
        return `<li><div>
          <h4>${esc(p.title)}</h4>
          <div class="by">${esc(p.type)} · Lead <i>${esc(p.lead)}</i> · PI <i>${esc(p.pi)}</i>${p.target ? ` · <i>${esc(p.target)}</i>` : ""}</div>
          <span class="chip stage-pill" style="--dot:${STAGE_RAMP[k]}"><i></i>${esc(p.stage)}</span>
        </div>${cells}</li>`;
      })
      .join("");
    const head = $("[data-tracker-head]");
    if (head) head.innerHTML = `<span>Project</span>${stages.map((s) => `<span>${esc(s)}</span>`).join("")}`;
  });

  /* ---------- Research: publications ---------- */

  $$("[data-pubs]").forEach((ul) => {
    const filters = $("#pub-filters");
    const bars = $("#pub-years");
    const params = new URLSearchParams(location.search);
    let area = S.areas[params.get("area")] ? params.get("area") : "all";
    let year = null;

    const render = () => {
      const rows = S.publications.filter((p) => (area === "all" || p.area === area) && (!year || p.year === year));
      ul.innerHTML = rows.length
        ? rows
            .map((p) => {
              const link = pubLink(p);
              const t = link ? `<a class="t" href="${link}" target="_blank" rel="noopener">${esc(p.title)}</a>` : `<span class="t">${esc(p.title)}</span>`;
              return `<li><span class="yr">${p.year}</span><div>${t}<div class="m">${esc(p.authors)} · <em>${esc(p.journal)}</em>${p.cite ? `, ${esc(p.cite)}` : ""}</div></div>
                <div class="side">${p.status ? `<span class="chip" style="--dot:var(--c1)"><i></i>${esc(p.status)}</span>` : ""}<span class="chip" style="--dot:${AREA_COLOR[p.area]}"><i></i>${esc(S.areas[p.area])}</span></div></li>`;
            })
            .join("")
        : `<li><span></span><span class="muted">No publications match these filters.</span></li>`;
    };

    if (filters) {
      const counts = S.publications.reduce((a, p) => ((a[p.area] = (a[p.area] || 0) + 1), a), {});
      filters.innerHTML = [["all", "All areas", S.publications.length]]
        .concat(Object.entries(S.areas).map(([k, v]) => [k, v, counts[k] || 0]))
        .map(([k, v, n]) => `<button class="fbtn" type="button" data-a="${k}" aria-pressed="${k === area}" style="${k !== "all" ? `--dot:${AREA_COLOR[k]}` : ""}">${k !== "all" ? "<i></i>" : ""}${esc(v)}<span class="c">${n}</span></button>`)
        .join("");
      filters.addEventListener("click", (e) => {
        const b = e.target.closest("[data-a]");
        if (!b) return;
        area = b.dataset.a;
        $$("[data-a]", filters).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        render();
      });
    }

    if (bars) {
      const years = [...new Set(S.publications.map((p) => p.year))].sort();
      const counts = years.map((y) => S.publications.filter((p) => p.year === y).length);
      const max = Math.max(...counts);
      bars.innerHTML = years
        .map(
          (y, i) => `<button class="ybar" type="button" data-y="${y}" aria-pressed="false" aria-label="${y}: ${counts[i]} publications">
            <span class="v">${counts[i]}</span><span class="fill" style="height:${(counts[i] / max) * 100 - 18}%"></span><span class="y">${y}</span></button>`
        )
        .join("");
      bars.addEventListener("click", (e) => {
        const b = e.target.closest("[data-y]");
        if (!b) return;
        const y = Number(b.dataset.y);
        year = year === y ? null : y;
        bars.classList.toggle("filtered", !!year);
        $$("[data-y]", bars).forEach((x) => {
          const on = Number(x.dataset.y) === year;
          x.classList.toggle("sel", on);
          x.setAttribute("aria-pressed", String(on));
        });
        render();
      });
      $$("[data-y]", bars).forEach((b) => {
        b.addEventListener("mouseenter", () => {
          const r = $(".fill", b).getBoundingClientRect();
          const y = Number(b.dataset.y);
          const n = S.publications.filter((p) => p.year === y).length;
          showTip(`${y}<small>${n} publication${n > 1 ? "s" : ""} · click to filter</small>`, r.left + r.width / 2, r.top);
        });
        b.addEventListener("mouseleave", hideTip);
      });
    }
    render();
    if (params.get("area") && location.hash === "#publications") {
      setTimeout(() => $("#publications")?.scrollIntoView(), 50);
    }
  });

  /* ---------- Reveal ---------- */

  const rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (en) =>
        en.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
    );
    rv.forEach((el) => io.observe(el));
  } else rv.forEach((el) => el.classList.add("in"));

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
