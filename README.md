# SPARC Website

Website for the Single-Port Advanced Research Consortium (SPARC).

The repository currently holds three versions side by side so they can be compared:

| Version | Folder | Pages URL (if GitHub Pages serves `/docs`) |
| --- | --- | --- |
| Original single-page site | `docs/` | `/` |
| Redesign, light (multi-page) | `docs/v2/` | `/v2/` |
| Redesign, dark with live network map | `docs/v3/` | `/v3/` |

To preview locally, serve the `docs` folder (for example `npx http-server docs`) and open
`/index.html`, `/v2/index.html`, or `/v3/index.html`.

## Redesign v3 (`docs/v3`)

Same five pages and content as v2, with a different concept: a dark, editorial look built
around an animated dot-matrix map of the network, where data streams flow from every
participating center into Cleveland Clinic. Content comes from `docs/v3/assets/js/data.js`
(same structure as v2, plus `databases`, `tracks`, and `startsAt` times for the countdown).
`docs/v3/assets/js/map-dots.js` is the generated map grid; it only needs regenerating if the
map projection changes.

## Redesign (`docs/v2`)

Pages: `index.html` (home), `research.html`, `network.html`, `aua-meeting.html`
(SPARC Annual Meeting at the AUA), and `symposium.html` (Single Port Robotic Symposium).

Most content lives in one file, `docs/v2/assets/js/data.js`:

- `events`: drives the "next event" banner on the home page; it switches to the next
  upcoming event automatically once a date passes.
- `institutions`: sites on the network map (name, city, latitude/longitude, region).
- `publications`, `projects`: research page lists and pipeline.
- `program`, `faculty`: symposium agenda and faculty grid (headshots in `assets/people/`).
- `aua2026Abstracts`: AUA abstract list.

The redesign pages carry `<meta name="robots" content="noindex">` while they are a preview;
remove it if `v2` becomes the live site.
