# Preview site

A standalone, static copy of what the owner reviews. It is made to be published from a **separate public repository** (`njoworkflow-lab/zefir-preview`) with GitHub Pages, so that this private repository and its internal files are never exposed.

- `index.html`: list of previews.
- `scene-1/`: scene 1. `index.html` is option 5 (wordmark opening); `names.html#1` to `#4` are the four name options. (wide film `w/`, tall film `k/`, and the mattes `mw/`, `mk/` that let the nozzle and the zefir pass in front of the name on the wall).
- `scene-1/4k.html`: the 4K master test. The approved scene with a review-only switch (top left, or the F key) between the earlier film (`w/`, 1928 px) and the film cut from the 4K master (`w4/`, 2880 px), which `index.html` uses on laptops since 17 Nov. The owner does not want this page published: leave it out when copying to the preview repository. Built from `index.html` by `prototypes/scene-1/tools/make_4k_test.py`; if the scene page changes, run it again.
- `soglasovanie/`: pages for VanSlad to review (step 3a): the launch promotion proposal, the «Акции» page as a shopper would read it, the six legal drafts and the note to the lawyer. Built by `prototypes/review-pages/build.py` from `control-room/promo/` and `control-room/legal/drafts/`; re-run it after any change there. Marked «Проект · не опубликовано» and `noindex`.
- `fonts/`: Noto Serif Display and Jost, subset `.woff2`, both under the SIL Open Font Licence 1.1. They are also embedded in the page (`prototypes/scene-1/tools/embed_fonts.py` in the private repository), so nothing loads from a font CDN and the type cannot fail to load.
- `robots.txt` and the `noindex` tags keep search engines away; the link is still public to anyone who has it.
- `.nojekyll` makes Pages serve the folders as they are.

To publish: copy the contents of this folder to the root of the preview repository's `main` branch and push. Never turn on Pages for this private repository: Pages would serve every file in the chosen branch.

Test locally: `cd preview && python3 -m http.server 8765`, then open http://127.0.0.1:8765/.
