# SPARC Website

Website for the Single-Port Advanced Research Consortium (SPARC).

The repository currently holds two versions side by side so they can be compared:

| Version | Folder | Pages URL (if GitHub Pages serves `/docs`) |
| --- | --- | --- |
| Original single-page site | `docs/` | `/` |
| Redesign (multi-page) | `docs/v2/` | `/v2/` |

To preview locally, serve the `docs` folder (for example `npx http-server docs`) and open
`/index.html` for the original and `/v2/index.html` for the redesign.

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
