(() => {
  const S = window.SPARC || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  document.documentElement.classList.remove("no-js");

  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const icon = (name) => {
    const paths = {
      arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
      calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
      pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
      external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  };

  /* ---------- Dates ---------- */

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parseDate = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatRange = (ev) => {
    if (ev.dateLabel) return ev.dateLabel;
    const a = parseDate(ev.start);
    const b = parseDate(ev.end || ev.start);
    const sameDay = a.getTime() === b.getTime();
    const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (sameDay) return `${MONTHS[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()}`;
    if (sameMonth) return `${MONTHS[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
    return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
  };

  const daysUntil = (s) => Math.round((parseDate(s) - today) / 86400000);

  const upcoming = (S.events || []).filter((ev) => parseDate(ev.end || ev.start) >= today);
  const nextEvent = upcoming[0];

  /* ---------- Header ---------- */

  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Next event banner ---------- */

  $$("[data-next-event]").forEach((el) => {
    if (!nextEvent) {
      el.hidden = true;
      return;
    }
    const start = parseDate(nextEvent.start);
    const days = daysUntil(nextEvent.start);
    const live = days <= 0;
    const label = live ? "Happening now" : days <= 60 ? `In ${days} day${days === 1 ? "" : "s"}` : "Next meeting";
    const cta = nextEvent.cta
      ? `<a class="btn btn-accent btn-sm" href="${esc(nextEvent.cta.href)}" target="_blank" rel="noopener">${esc(nextEvent.cta.label)} ${icon("external")}</a>`
      : "";
    el.innerHTML = `
      <div class="next-event-card">
        <div class="date-chip" aria-hidden="true"><span>${MONTHS[start.getMonth()]}</span><strong>${start.getDate()}</strong></div>
        <div class="next-event-body">
          <div class="next-event-label"><i class="pulse"></i>${esc(label)}</div>
          <h3>${esc(nextEvent.title)}</h3>
          <div class="next-event-meta">
            <span>${esc(formatRange(nextEvent))}</span>
            <span>${esc(nextEvent.place)}</span>
          </div>
        </div>
        <div class="next-event-actions">
          ${cta}
          <a class="btn btn-ghost btn-sm" href="${esc(nextEvent.href)}">Details ${icon("arrow")}</a>
        </div>
      </div>`;
  });

  $$("[data-countdown]").forEach((el) => {
    const days = daysUntil(el.dataset.countdown);
    if (days > 0) el.textContent = `${days} day${days === 1 ? "" : "s"} to go`;
    else if (days > -2) el.textContent = "Happening now";
    else el.hidden = true;
  });

  $$("[data-event-date]").forEach((el) => {
    const ev = (S.events || []).find((e) => e.id === el.dataset.eventDate);
    if (ev) el.textContent = formatRange(ev);
  });

  /* ---------- Stats ---------- */

  $$("[data-stat]").forEach((el) => {
    const key = el.dataset.stat;
    if (key === "publications") el.textContent = S.publications.length;
    if (key === "projects") el.textContent = S.projects.length;
    if (key === "faculty") el.textContent = `${S.faculty.length}+`;
  });

  /* ---------- Marquee ---------- */

  $$("[data-marquee]").forEach((el) => {
    const names = (S.institutions || []).map((i) => `<span>${esc(i.name)}</span>`).join("");
    el.innerHTML = names + names.replace(/<span>/g, '<span aria-hidden="true">');
  });

  /* ---------- Publications ---------- */

  const pubItem = (p) => {
    const link = p.doi ? `https://doi.org/${p.doi}` : null;
    const title = link
      ? `<a class="pub-title" href="${link}" target="_blank" rel="noopener">${esc(p.title)}</a>`
      : `<span class="pub-title">${esc(p.title)}</span>`;
    const cite = p.cite ? `, ${esc(p.cite)}` : "";
    const tag = p.status ? `<span class="pub-tag press">${esc(p.status)}</span>` : `<span class="pub-tag">${esc(S.areas[p.area])}</span>`;
    return `<li class="pub">
      <span class="pub-year">${p.year}</span>
      <div>${title}<div class="pub-meta">${esc(p.authors)} · <em>${esc(p.journal)}</em>${cite}</div></div>
      <div class="pub-side">${tag}</div>
    </li>`;
  };

  $$("[data-publications]").forEach((list) => {
    const limit = Number(list.dataset.limit || 0);
    const filterBar = list.dataset.filters ? $(list.dataset.filters) : null;
    let active = "all";

    const render = () => {
      let pubs = S.publications.filter((p) => active === "all" || p.area === active);
      if (limit) pubs = pubs.filter((p) => p.doi).slice(0, limit);
      list.innerHTML = pubs.map(pubItem).join("");
    };

    if (filterBar) {
      const counts = S.publications.reduce((acc, p) => ((acc[p.area] = (acc[p.area] || 0) + 1), acc), {});
      const chips = [["all", "All", S.publications.length], ...Object.entries(S.areas).map(([k, v]) => [k, v, counts[k] || 0])];
      filterBar.innerHTML = chips
        .map(([k, v, n]) => `<button class="chip" type="button" data-area="${k}" aria-pressed="${k === "all"}">${esc(v)}<span class="count">${n}</span></button>`)
        .join("");
      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-area]");
        if (!btn) return;
        active = btn.dataset.area;
        $$("[data-area]", filterBar).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        render();
      });
    }
    render();
  });

  /* ---------- Project pipeline ---------- */

  $$("[data-pipeline]").forEach((el) => {
    el.innerHTML = S.projectStages
      .map((stage, i) => {
        const items = S.projects.filter((p) => p.stage === stage);
        const cards = items
          .map(
            (p) => `<article class="project">
              <span class="project-type">${esc(p.type)}</span>
              <h4>${esc(p.title)}</h4>
              <dl>
                <div><dt>Lead</dt><dd>${esc(p.lead)}</dd></div>
                <div><dt>PI</dt><dd>${esc(p.pi)}</dd></div>
                ${p.target ? `<div><dt>${stage === "Accepted" || stage === "Under review" ? "Journal" : "Target"}</dt><dd><em>${esc(p.target)}</em></dd></div>` : ""}
              </dl>
            </article>`
          )
          .join("");
        return `<section class="stage" style="--stage-color: var(--stage-${i + 1})" aria-label="${esc(stage)}">
          <div class="stage-head">${esc(stage)}<span>${items.length}</span></div>
          ${cards}
        </section>`;
      })
      .join("");
  });

  /* ---------- Map ---------- */

  // Albers equal-area conic matching assets/img/us-lower48.svg (960 × 600).
  const project = (() => {
    const rad = Math.PI / 180;
    const k = 1262.2774141217544;
    const tx = 479.73793520449624;
    const ty = 295.5555539489978;
    const p0 = 29.5 * rad;
    const p1 = 45.5 * rad;
    const n = (Math.sin(p0) + Math.sin(p1)) / 2;
    const c = 1 + Math.sin(p0) * (2 * n - Math.sin(p0));
    const r0 = Math.sqrt(c) / n;
    const raw = (l, f) => {
      const r = Math.sqrt(c - 2 * n * Math.sin(f)) / n;
      return [r * Math.sin(l * n), r0 - r * Math.cos(l * n)];
    };
    const [cx, cy] = raw(-0.6 * rad, 38.7 * rad);
    return (lon, lat) => {
      const [x, y] = raw((lon + 96) * rad, lat * rad);
      return [tx + (x - cx) * k, ty - (y - cy) * k];
    };
  })();

  $$("[data-map]").forEach((wrap) => {
    const base = wrap.dataset.map;
    const sites = S.institutions || [];
    // Fan out sites in the same metro area so every dot stays hoverable.
    const pts = sites.map((s) => project(s.lon, s.lat));
    const groups = [];
    pts.forEach((p, i) => {
      const g = groups.find((grp) => grp.some((j) => Math.hypot(pts[j][0] - p[0], pts[j][1] - p[1]) < 14));
      g ? g.push(i) : groups.push([i]);
    });
    groups
      .filter((g) => g.length > 1)
      .forEach((g) => {
        const cx = g.reduce((a, j) => a + pts[j][0], 0) / g.length;
        const cy = g.reduce((a, j) => a + pts[j][1], 0) / g.length;
        const r = 8 + g.length * 2;
        g.forEach((j, k) => {
          const t = -Math.PI / 2 + (2 * Math.PI * k) / g.length;
          pts[j] = [cx + r * Math.cos(t), cy + r * Math.sin(t)];
        });
      });
    const dots = sites
      .map((s, i) => {
        const [x, y] = pts[i];
        const halo = s.host ? `<circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16"/>` : "";
        return `${halo}<circle class="dot${s.host ? " host" : ""}" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.host ? 9 : 6.5}" tabindex="0" role="img" aria-label="${esc(s.name)}, ${esc(s.city)}"/>`;
      })
      .join("");
    wrap.insertAdjacentHTML(
      "afterbegin",
      `<svg class="us-map" viewBox="0 0 960 600" role="group" aria-label="Map of SPARC participating institutions"><image href="${esc(base)}" width="960" height="600"/>${dots}</svg>`
    );
    const tip = document.createElement("div");
    tip.className = "map-tip";
    tip.hidden = true;
    wrap.appendChild(tip);
    const svg = $("svg", wrap);

    const show = (dot) => {
      const s = sites[Number(dot.dataset.i)];
      const box = svg.getBoundingClientRect();
      const host = wrap.getBoundingClientRect();
      const scale = box.width / 960;
      tip.innerHTML = `${esc(s.name)}<small>${esc(s.city)}${s.host ? " · Coordinating center" : ""}</small>`;
      tip.style.left = `${box.left - host.left + Number(dot.getAttribute("cx")) * scale}px`;
      tip.style.top = `${box.top - host.top + Number(dot.getAttribute("cy")) * scale}px`;
      tip.hidden = false;
      $$(".dot.is-active", svg).forEach((d) => d.classList.remove("is-active"));
      dot.classList.add("is-active");
      $$("[data-site]").forEach((li) => li.classList.toggle("is-active", li.dataset.site === dot.dataset.i));
    };
    const hide = () => {
      tip.hidden = true;
      $$(".dot.is-active", svg).forEach((d) => d.classList.remove("is-active"));
      $$("[data-site].is-active").forEach((li) => li.classList.remove("is-active"));
    };
    $$(".dot", svg).forEach((dot) => {
      dot.addEventListener("mouseenter", () => show(dot));
      dot.addEventListener("focus", () => show(dot));
      dot.addEventListener("mouseleave", hide);
      dot.addEventListener("blur", hide);
    });
    wrap._show = (i) => show($(`.dot[data-i="${i}"]`, svg));
    wrap._hide = hide;
  });

  $$("[data-regions]").forEach((el) => {
    const sites = S.institutions || [];
    const order = ["Midwest", "Northeast & Mid-Atlantic", "Southeast", "South & Central", "West"];
    const map = $("[data-map]");
    el.innerHTML = order
      .map((region) => {
        const rows = sites
          .map((s, i) => [s, i])
          .filter(([s]) => s.region === region)
          .map(([s, i]) => `<li data-site="${i}">${esc(s.name)}<small>${esc(s.city)}</small></li>`)
          .join("");
        return rows ? `<div><h3>${esc(region)}</h3><ul>${rows}</ul></div>` : "";
      })
      .join("");
    if (map && map._show) {
      $$("[data-site]", el).forEach((li) => {
        li.addEventListener("mouseenter", () => map._show(li.dataset.site));
        li.addEventListener("mouseleave", () => map._hide());
      });
    }
  });

  /* ---------- Symposium program ---------- */

  const talkRows = (talks) =>
    `<ul class="talks">${talks
      .map(([t, title, who]) => {
        const qa = /^(Q&A|Crossfire debate)$/i.test(title) && !who;
        return `<li class="${qa ? "qa" : ""}"><time>${esc(t)}</time><span>${esc(title)}</span>${who ? `<span class="who">${esc(who)}</span>` : ""}</li>`;
      })
      .join("")}</ul>`;

  const slot = (it) => {
    const kind = it.kind || "talk";
    let body = `<div class="slot-title">${esc(it.title)}</div>`;
    if (it.speaker) body += `<div class="slot-speaker">${esc(it.speaker)}</div>`;
    if (it.note) body += `<div class="slot-speaker">${esc(it.note)}</div>`;
    if (it.chairs || it.moderators || it.faculty) {
      body += `<div class="session-roles">
        ${it.chairs ? `<div><b>Co-chairs:</b> ${esc(it.chairs)}</div>` : ""}
        ${it.moderators ? `<div><b>Moderators:</b> ${esc(it.moderators)}</div>` : ""}
        ${it.faculty ? `<div><b>Lab faculty:</b> ${esc(it.faculty)}</div>` : ""}
      </div>`;
    }
    if (it.procedures) body += `<ul class="procedures">${it.procedures.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`;
    if (it.blocks) {
      body += it.blocks
        .map((b) => `<div class="block">${b.title ? `<h4>${esc(b.title)}</h4>` : ""}${talkRows(b.talks)}</div>`)
        .join("");
    }
    return `<li class="slot ${kind}"><div class="slot-time">${esc(it.time)}</div><div class="slot-body">${body}</div></li>`;
  };

  $$("[data-program]").forEach((el) => {
    const days = S.program || [];
    const tabs = days
      .map(
        (d, i) =>
          `<button class="tab" role="tab" type="button" id="tab-${i}" aria-controls="day-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(d.short)}<small>${esc(d.theme)}</small></button>`
      )
      .join("");
    const panels = days
      .map(
        (d, i) => `<div class="day" role="tabpanel" id="day-${i}" aria-labelledby="tab-${i}" ${i === 0 ? "" : "hidden"}>
          <div class="day-head">
            <span>${icon("calendar")}<strong>${esc(d.day)}</strong></span>
            <span>${icon("pin")}${esc(d.venue)}</span>
          </div>
          <ol class="agenda">${d.items.map(slot).join("")}</ol>
        </div>`
      )
      .join("");
    el.innerHTML = `<div class="tabs" role="tablist" aria-label="Symposium days">${tabs}</div>${panels}`;

    const tabEls = $$('[role="tab"]', el);
    const select = (idx) => {
      tabEls.forEach((t, i) => {
        t.setAttribute("aria-selected", String(i === idx));
        t.tabIndex = i === idx ? 0 : -1;
        $(`#day-${i}`, el).hidden = i !== idx;
      });
    };
    tabEls.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const next = (i + (e.key === "ArrowRight" ? 1 : -1) + tabEls.length) % tabEls.length;
        select(next);
        tabEls[next].focus();
      });
    });
  });

  /* ---------- Faculty ---------- */

  $$("[data-faculty]").forEach((list) => {
    const base = list.dataset.faculty;
    const input = $("#faculty-search");
    const count = $("#faculty-count");
    const people = S.faculty || [];
    const render = (q = "") => {
      const needle = q.trim().toLowerCase();
      const rows = people.filter((p) => !needle || p.join(" ").toLowerCase().includes(needle));
      list.innerHTML = rows.length
        ? rows
            .map(
              ([name, cred, org, loc, photo]) => `<li class="faculty">
                <img src="${esc(base)}${esc(photo)}.jpg" alt="" loading="lazy" width="56" height="56">
                <div><b>${esc(name)}<small>, ${esc(cred)}</small></b><span>${esc(org)}</span><em>${esc(loc)}</em></div>
              </li>`
            )
            .join("")
        : `<li class="empty-note">No faculty match “${esc(q)}”.</li>`;
      if (count) count.textContent = `${rows.length} of ${people.length} faculty`;
    };
    if (input) input.addEventListener("input", () => render(input.value));
    render();
  });

  /* ---------- AUA abstracts ---------- */

  $$("[data-abstracts]").forEach((el) => {
    el.innerHTML = (S.aua2026Abstracts || [])
      .map(
        (d) => `<div class="abstract-day"><h3>${esc(d.day)}</h3><ul>${d.items
          .map(([code, title]) => `<li><code>${esc(code)}</code>${esc(title)}</li>`)
          .join("")}</ul></div>`
      )
      .join("");
  });

  /* ---------- Footer year & reveal ---------- */

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }
})();
