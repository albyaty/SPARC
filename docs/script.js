const header = document.querySelector("[data-header]");
const revealItems = document.querySelectorAll(".reveal");
const metricNumbers = document.querySelectorAll(".metric-number");
const progressTimeline = document.querySelector("[data-timeline-progress]");
const mapLightbox = document.querySelector("[data-map-lightbox]");
const mapOpenButtons = document.querySelectorAll("[data-map-open]");
const mapCloseButtons = document.querySelectorAll("[data-map-close]");
const mapScrollArea = document.querySelector(".map-lightbox-scroll");
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
