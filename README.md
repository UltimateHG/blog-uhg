# blog-uhg — uhg's corner

Source for [blog.uhg.sg](https://blog.uhg.sg), built with [VitePress](https://vitepress.dev) and a custom minimal dark theme.

## Structure

```
.vitepress/
  config.mts        # site config, rewrites (strip NNNN_ prefix), sitemap, redirect stubs
  theme/            # custom theme (Layout + components + custom.css)
  data/             # createContentLoader lists per category
blog/    NNNN_<slug>.md   # "My Thoughts"  -> /blog/<slug>
cve/     NNNN_<slug>.md   # "My CVEs"      -> /cve/<slug>
writeup/ NNNN_<slug>.md   # "Writeups"     -> /writeup/<slug>
project/ NNNN_<slug>.md   # "Projects"     -> /project/<slug>
public/                   # CNAME, robots.txt, favicon, images/
```

Filenames keep a numeric prefix for local sorting; it is stripped from the public URL
via `rewrites` and is not part of the frontmatter. Set `draft: true` to keep a post
unpublished (excluded from the build, listings, and sitemap).

## Develop

```bash
npm install
npm run docs:dev       # local dev server
npm run docs:build     # production build -> .vitepress/dist
npm run docs:preview   # serve the built site
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys to
GitHub Pages. The custom domain (`blog.uhg.sg`) is carried by `public/CNAME`.
