# Preview site

A standalone, static copy of what the owner reviews. It is made to be published from a **separate public repository** (`njoworkflow-lab/zefir-preview`) with GitHub Pages, so that this private repository and its internal files are never exposed.

- `index.html`: list of previews.
- `scene-1/`: scene 1 (wide film `w/`, tall film `k/`, and the mattes `mw/`, `mk/` that let the nozzle and the zefir pass in front of the name on the wall).
- `fonts/`: Noto Serif Display and Onest, subset `.woff2`, both under the SIL Open Font Licence 1.1. Served from the site itself; nothing loads from a font CDN.
- `robots.txt` and the `noindex` tags keep search engines away; the link is still public to anyone who has it.
- `.nojekyll` makes Pages serve the folders as they are.

To publish: copy the contents of this folder to the root of the preview repository's `main` branch and push. Never turn on Pages for this private repository: Pages would serve every file in the chosen branch.

Test locally: `cd preview && python3 -m http.server 8765`, then open http://127.0.0.1:8765/.
