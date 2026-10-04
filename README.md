# SPARC Website

Website for the Single-Port Advanced Research Consortium (SPARC).

## Structure

| Folder | What it is |
| --- | --- |
| `docs/` | The live site (served by GitHub Pages from `main` → `/docs`) |
| `archive/original/` | The earlier single-page site, kept for reference (not published) |
| `archive/v2/` | The light multi-page redesign, kept for reference (not published) |

To preview locally, serve the `docs` folder (for example `npx http-server docs`) and open `/index.html`.
Opening `docs/index.html` directly in a browser also works.

## Editing content

Pages: `index.html` (home), `research.html`, `network.html`, `aua-meeting.html`
(SPARC Annual Meeting at the AUA), and `symposium.html` (Single Port Robotic Symposium).

Most lists on the site come from `docs/assets/js/data.js`:

- `events`: drives the countdown on the home page; it moves to the next event once a date passes.
- `institutions`: sites on the network map (name, city, latitude/longitude, region).
- `databases`, `publications`, `projects`: research page content.
- `program`, `tracks`, `faculty`: symposium agenda and faculty (headshots in `docs/assets/people/`).
- `aua2026Abstracts`: AUA abstract list.

`docs/assets/js/map-dots.js` is the generated dot grid for the US map; it only needs regenerating if
the map projection changes.
