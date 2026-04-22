# SPARC Website

Static website for the Single-Port Advanced Research Consortium (SPARC).

The public site lives in `docs/`. That folder is intentional: GitHub Pages can publish only
`docs/`, while the rest of the private repository can stay hidden.

## Local Preview

Open `docs/index.html` in a browser, or run a simple local server:

```powershell
python -m http.server 8080 -d docs
```

Then visit `http://localhost:8080`.

## GitHub Setup Notes

This is a good use case for GitHub because the site is static, collaborative, and likely to
need frequent content updates before meetings. Git gives you version history, GitHub gives
you a private backup plus collaboration, and GitHub Pages can host the finished site.

Important privacy detail: a private repository does not make the published website private.
Anything inside the published `docs/` folder becomes public once GitHub Pages is enabled.
Do not place patient data, internal REDCap exports, unpublished manuscripts, or DUA material
inside `docs/`.

GitHub Pages from a private repository requires GitHub Pro, Team, or Enterprise. If the
account is on GitHub Free, the usual options are either:

1. Make the repository public.
2. Keep this repository private and deploy the `docs/` folder to another host.
3. Use a separate public repository that contains only the finished static site.

## Publishing From GitHub

After pushing this repository to GitHub:

1. Open the repository on GitHub.
2. Go to Settings.
3. Open Pages.
4. Choose "Deploy from a branch".
5. Select `main` and `/docs`.
6. Save.

The site usually publishes within a few minutes.

## When To Push Updates

Push after each meaningful, working change:

- New event details are confirmed.
- An abstract schedule changes.
- A publication is added.
- A visual or copy revision is ready to share.

Use small commit messages such as `Add AUA abstract schedule` or `Update symposium date`.
This makes it easy to see what changed and roll back if needed.
