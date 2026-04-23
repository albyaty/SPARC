const header = document.querySelector("[data-header]");
const revealItems = document.querySelectorAll(".reveal");
const metricNumbers = document.querySelectorAll(".metric-number");
const progressTimeline = document.querySelector("[data-timeline-progress]");

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
  const duration = 900;
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
