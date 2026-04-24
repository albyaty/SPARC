const header = document.querySelector("[data-header]");
const revealItems = document.querySelectorAll(".reveal");
const metricNumbers = document.querySelectorAll(".metric-number");
const progressTimeline = document.querySelector("[data-timeline-progress]");
const mapLightbox = document.querySelector("[data-map-lightbox]");
const mapOpenButtons = document.querySelectorAll("[data-map-open]");
const mapCloseButtons = document.querySelectorAll("[data-map-close]");
const mapScrollArea = document.querySelector(".map-lightbox-scroll");
const hero = document.querySelector(".hero");
const heroOrbitCanvas = document.querySelector("[data-hero-orbit]");
const abstractTabs = Array.from(document.querySelectorAll("[data-abstract-tab]"));
const abstractPanels = Array.from(document.querySelectorAll("[data-abstract-panel]"));
let activeMapTrigger = null;

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const animateNumber = (element) => {
  const target = Number(element.dataset.target || 0);
  const suffix = element.dataset.suffix || "";
  const duration = Math.min(2600, Math.max(1800, target * 22));
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const metricObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNumber(entry.target);
        metricObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.7 }
);

metricNumbers.forEach((number) => metricObserver.observe(number));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parseTimelineDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const updateTimelineProgress = () => {
  if (!progressTimeline) return;

  const startDate = parseTimelineDate(progressTimeline.dataset.startDate);
  const endDate = parseTimelineDate(progressTimeline.dataset.endDate);
  const firstItem = progressTimeline.querySelector("article:first-of-type");
  const lastItem = progressTimeline.querySelector("article:last-of-type");

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  if (!firstItem || !lastItem || Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) return;

  const eventDotOffset = 10;
  const lineStart = firstItem.offsetTop + eventDotOffset;
  const lineEnd = lastItem.offsetTop + eventDotOffset;
  const ratio = clamp((Date.now() - startTime) / (endTime - startTime), 0, 1);
  const currentTop = lineStart + (lineEnd - lineStart) * ratio;

  progressTimeline.style.setProperty("--timeline-line-start", `${lineStart}px`);
  progressTimeline.style.setProperty("--timeline-line-height", `${lineEnd - lineStart}px`);
  progressTimeline.style.setProperty("--timeline-progress-height", `${currentTop - lineStart}px`);
  progressTimeline.style.setProperty("--timeline-current-top", `${currentTop}px`);
};

updateTimelineProgress();
window.addEventListener("resize", updateTimelineProgress);

const openMapLightbox = (trigger) => {
  if (!mapLightbox) return;

  activeMapTrigger = trigger;
  mapLightbox.hidden = false;
  document.body.classList.add("has-map-lightbox");
  mapScrollArea?.focus({ preventScroll: true });
};

const closeMapLightbox = () => {
  if (!mapLightbox || mapLightbox.hidden) return;

  mapLightbox.hidden = true;
  document.body.classList.remove("has-map-lightbox");
  activeMapTrigger?.focus({ preventScroll: true });
  activeMapTrigger = null;
};

mapOpenButtons.forEach((button) => {
  button.addEventListener("click", () => openMapLightbox(button));
});

mapCloseButtons.forEach((button) => {
  button.addEventListener("click", closeMapLightbox);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMapLightbox();
});

if (abstractTabs.length && abstractPanels.length) {
  const setActiveAbstractDay = (day) => {
    abstractTabs.forEach((tab) => {
      const isActive = tab.dataset.abstractTab === day;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    abstractPanels.forEach((panel) => {
      const isActive = panel.dataset.abstractPanel === day;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  };

  const focusTabByOffset = (currentIndex, offset) => {
    const nextIndex = (currentIndex + offset + abstractTabs.length) % abstractTabs.length;
    abstractTabs[nextIndex].focus();
    setActiveAbstractDay(abstractTabs[nextIndex].dataset.abstractTab);
  };

  abstractTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      setActiveAbstractDay(tab.dataset.abstractTab);
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        focusTabByOffset(index, 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        focusTabByOffset(index, -1);
      }

      if (event.key === "Home") {
        event.preventDefault();
        abstractTabs[0].focus();
        setActiveAbstractDay(abstractTabs[0].dataset.abstractTab);
      }

      if (event.key === "End") {
        event.preventDefault();
        abstractTabs[abstractTabs.length - 1].focus();
        setActiveAbstractDay(abstractTabs[abstractTabs.length - 1].dataset.abstractTab);
      }
    });
  });

  setActiveAbstractDay(
    abstractTabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.abstractTab ||
      abstractTabs[0].dataset.abstractTab
  );
}

if (hero && heroOrbitCanvas) {
  const orbitContext = heroOrbitCanvas.getContext("2d");

  if (orbitContext) {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerTarget = { x: 0.78, y: 0.46, active: false };
    const pointerCurrent = { x: 0.78, y: 0.46, strength: 0 };
    let orbitParticles = [];
    let orbitPalette = {};
    let orbitWidth = 0;
    let orbitHeight = 0;
    let orbitDpr = 1;

    const parseColorValue = (value, fallback) => {
      const trimmed = value.trim();

      if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
        const hex = trimmed.slice(1);
        return [
          Number.parseInt(hex.slice(0, 2), 16),
          Number.parseInt(hex.slice(2, 4), 16),
          Number.parseInt(hex.slice(4, 6), 16),
        ];
      }

      const rgbMatch = trimmed.match(/\d+/g);
      if (rgbMatch?.length >= 3) {
        return rgbMatch.slice(0, 3).map(Number);
      }

      return fallback;
    };

    const colorWithAlpha = (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

    const refreshOrbitPalette = () => {
      const styles = getComputedStyle(document.documentElement);

      orbitPalette = {
        bright: parseColorValue(styles.getPropertyValue("--accent-bright"), [160, 204, 216]),
        teal: parseColorValue(styles.getPropertyValue("--teal"), [125, 184, 200]),
        blue: parseColorValue(styles.getPropertyValue("--blue"), [0, 95, 134]),
        white: [255, 255, 255],
      };
    };

    const buildOrbitParticles = () => {
      const compact = window.innerWidth <= 700;
      const count = compact ? 68 : 126;

      orbitParticles = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const ringParticle = Math.random() < 0.34;
        const radial = ringParticle
          ? 0.66 + Math.random() * 0.28
          : Math.pow(Math.random(), 0.68);
        const nx = Math.cos(angle) * radial;
        const ny = Math.sin(angle) * radial;
        const highlightBias = Math.max(0, nx);
        const colorSeed = Math.random();

        return {
          nx,
          ny,
          depth: 0.4 + Math.random() * 0.9,
          size: 1.45 + highlightBias * 2.15 + Math.random() * 1.45,
          alpha: 0.18 + highlightBias * 0.22 + Math.random() * 0.18,
          phase: Math.random() * Math.PI * 2,
          colorSet: colorSeed < 0.18 ? "white" : colorSeed < 0.72 ? "bright" : "blue",
        };
      });
    };

    const resizeHeroOrbit = () => {
      const rect = hero.getBoundingClientRect();
      orbitWidth = Math.max(1, Math.round(rect.width));
      orbitHeight = Math.max(1, Math.round(rect.height));
      orbitDpr = Math.min(window.devicePixelRatio || 1, 2);

      heroOrbitCanvas.width = orbitWidth * orbitDpr;
      heroOrbitCanvas.height = orbitHeight * orbitDpr;
      heroOrbitCanvas.style.width = `${orbitWidth}px`;
      heroOrbitCanvas.style.height = `${orbitHeight}px`;

      orbitContext.setTransform(orbitDpr, 0, 0, orbitDpr, 0, 0);
      refreshOrbitPalette();
      buildOrbitParticles();
    };

    const renderHeroOrbit = (time = 0) => {
      if (!orbitWidth || !orbitHeight) {
        window.requestAnimationFrame(renderHeroOrbit);
        return;
      }

      orbitContext.setTransform(orbitDpr, 0, 0, orbitDpr, 0, 0);
      orbitContext.clearRect(0, 0, orbitWidth, orbitHeight);

      const compact = window.innerWidth <= 700;
      const centerX = orbitWidth * (compact ? 0.71 : 0.7);
      const centerY = orbitHeight * (compact ? 0.35 : 0.45);
      const radiusX = orbitWidth * (compact ? 0.27 : 0.25);
      const radiusY = orbitHeight * (compact ? 0.18 : 0.29);
      const defaultPointerX = centerX - radiusX * 0.08;
      const defaultPointerY = centerY + radiusY * 0.08;
      const targetPointerX = pointerTarget.active ? pointerTarget.x * orbitWidth : defaultPointerX;
      const targetPointerY = pointerTarget.active ? pointerTarget.y * orbitHeight : defaultPointerY;

      pointerCurrent.x += (targetPointerX - pointerCurrent.x) * 0.09;
      pointerCurrent.y += (targetPointerY - pointerCurrent.y) * 0.09;
      pointerCurrent.strength += ((pointerTarget.active ? 1 : 0) - pointerCurrent.strength) * 0.065;

      const halo = orbitContext.createRadialGradient(
        centerX,
        centerY,
        radiusX * 0.08,
        centerX,
        centerY,
        Math.max(radiusX, radiusY) * 1.42
      );
      halo.addColorStop(0, colorWithAlpha(orbitPalette.bright, compact ? 0.24 : 0.3));
      halo.addColorStop(0.46, colorWithAlpha(orbitPalette.teal, 0.14));
      halo.addColorStop(1, colorWithAlpha(orbitPalette.teal, 0));
      orbitContext.fillStyle = halo;
      orbitContext.fillRect(0, 0, orbitWidth, orbitHeight);

      const secondaryHalo = orbitContext.createRadialGradient(
        centerX - radiusX * 0.5,
        centerY + radiusY * 0.04,
        radiusX * 0.04,
        centerX - radiusX * 0.5,
        centerY + radiusY * 0.04,
        Math.max(radiusX, radiusY) * 0.9
      );
      secondaryHalo.addColorStop(0, colorWithAlpha(orbitPalette.blue, 0.12));
      secondaryHalo.addColorStop(0.55, colorWithAlpha(orbitPalette.bright, 0.06));
      secondaryHalo.addColorStop(1, colorWithAlpha(orbitPalette.blue, 0));
      orbitContext.fillStyle = secondaryHalo;
      orbitContext.fillRect(0, 0, orbitWidth, orbitHeight);

      orbitParticles.forEach((particle) => {
        const driftStrength = reduceMotionQuery.matches ? 0.2 : 1.38;
        const baseX = centerX + particle.nx * radiusX;
        const baseY = centerY + particle.ny * radiusY;
        const driftX =
          driftStrength *
          Math.cos(time * 0.00062 + particle.phase) *
          (1.6 + particle.depth * 3.8);
        const driftY =
          driftStrength *
          Math.sin(time * 0.00095 + particle.phase * 1.6) *
          (1.2 + particle.depth * 3.2);
        const deltaX = baseX - pointerCurrent.x;
        const deltaY = baseY - pointerCurrent.y;
        const distance = Math.hypot(deltaX, deltaY);
        const influenceRadius = compact ? 180 : 230;
        const influence =
          pointerCurrent.strength * Math.max(0, 1 - distance / influenceRadius);
        const pushDistance = influence * (18 + particle.depth * 22);
        const pushX = distance ? (deltaX / distance) * pushDistance : 0;
        const pushY = distance ? (deltaY / distance) * pushDistance : 0;
        const pulse = reduceMotionQuery.matches
          ? 0.2
          : (Math.sin(time * 0.00145 + particle.phase) + 1) * 0.38;
        const x = baseX + driftX + pushX;
        const y = baseY + driftY + pushY;
        const dotSize = particle.size + pulse + influence * 1.9;
        const dotAlpha = Math.min(0.94, particle.alpha + pulse * 0.22 + influence * 0.42);
        const fillColor =
          particle.colorSet === "white"
            ? orbitPalette.white
            : particle.colorSet === "bright"
              ? orbitPalette.bright
              : orbitPalette.blue;

        orbitContext.beginPath();
        orbitContext.fillStyle = colorWithAlpha(fillColor, dotAlpha);
        orbitContext.arc(x, y, dotSize, 0, Math.PI * 2);
        orbitContext.fill();

        if (particle.colorSet !== "blue" && dotSize > 2.4) {
          orbitContext.beginPath();
          orbitContext.fillStyle = colorWithAlpha(fillColor, dotAlpha * 0.22);
          orbitContext.arc(x, y, dotSize * 2.9, 0, Math.PI * 2);
          orbitContext.fill();
        }
      });

      window.requestAnimationFrame(renderHeroOrbit);
    };

    hero.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;

      const rect = hero.getBoundingClientRect();
      pointerTarget.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointerTarget.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      pointerTarget.active = true;
    });

    hero.addEventListener("pointerleave", () => {
      pointerTarget.active = false;
    });

    window.addEventListener("resize", resizeHeroOrbit);
    reduceMotionQuery.addEventListener?.("change", resizeHeroOrbit);

    resizeHeroOrbit();
    window.requestAnimationFrame(renderHeroOrbit);
  }
}
