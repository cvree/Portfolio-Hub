#!/usr/bin/env python3
"""Assemble the static pages from templates/base.html + pages/*.html.

There is no framework here and no runtime dependency: this script exists only
so that the header, the footer and the <head> of eleven pages cannot drift
apart. It writes plain HTML into the repository root, and that committed HTML
is what GitHub Pages serves — so a visitor never waits on a build, and the
site works when opened straight off a disk.

    python3 tools/build_pages.py          # write the pages
    python3 tools/build_pages.py --check  # fail if the committed pages differ

Each fragment in pages/ starts with a small front-matter block:

    <!--meta
    path: work.html
    title: Projects — Connor Eppolito
    nav: work
    surface: ink
    accent: cobalt
    physics: sort
    desc: ...
    -->
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://cvree.github.io/Portfolio-Hub/"

# The primary navigation, in the order it is read. Three items, and the reason
# there are three is that a masthead is a place to go, not an index: Home is the
# wordmark to the left of it, Experience is a chapter of the résumé it sits
# beside, About is a page about the site's own taste rather than a destination
# anybody arrives looking for, and the complete map of the site — About and
# Experience included — is at the foot of every page.
NAV = [
    ("work", "Projects", "index.html#work"),
    ("resume", "Résumé", "resume.html"),
    ("contact", "Contact", "contact.html"),
]

# Pages that used to exist and are now a place on another page. They are still
# written out, because a URL somebody bookmarked or linked to is a promise, and
# a 404 is a worse answer than a one-hop redirect. Each one is three lines of
# HTML: the canonical, the refresh, and a link for the browser that honours
# neither.
REDIRECTS = {
    "work.html": (
        "index.html#work",
        "Projects — Connor Eppolito",
        "The projects have moved to the home page. This page forwards to index.html#work.",
    ),
}

REDIRECT = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content="{desc}" />
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="{canonical}" />
<meta http-equiv="refresh" content="0; url={to}" />
</head>
<body>
<h1>{title}</h1>
<p>The projects live on the home page now. <a href="{to}">Continue to the projects</a>.</p>
<script>location.replace("{to}");</script>
</body>
</html>
"""

SURFACES = {
    "ink": ("on-ink", "#0b0c0e", "dark"),
    "paper": ("on-paper", "#f4f0e8", "light"),
}

META_RE = re.compile(r"^<!--meta\s*(.*?)-->\s*", re.S)


def parse(fragment: str) -> tuple[dict[str, str], str]:
    m = META_RE.match(fragment)
    if not m:
        raise SystemExit("fragment is missing its <!--meta ... --> block")
    meta: dict[str, str] = {}
    for line in m.group(1).strip().splitlines():
        line = line.strip()
        if not line:
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    return meta, fragment[m.end():]


def nav_html(active: str, rel: str) -> tuple[str, str]:
    desk, mob = [], []
    for key, label, href in NAV:
        current = ' aria-current="page"' if key == active else ""
        # Résumé is the one action the whole site is pointed at, so it is the
        # navigation item that looks like a button rather than a second copy
        # of itself sitting beside the list.
        cls = ' class="nav__key"' if key == "resume" else ""
        desk.append(f'<a{cls} href="{rel}{href}"{current}>{label}</a>')
        mob.append(
            f'<a href="{rel}{href}"{current}>{label}'
            f'<span class="chev" aria-hidden="true">&rarr;</span></a>'
        )
    return "\n      ".join(desk), "\n          ".join(mob)


def font_face_css() -> str:
    """assets/fonts.css, inlined.

    The @font-face block is small, it is needed before the first paint, and
    fetching it costs a whole round trip on a slow connection. Inlining it here
    keeps assets/fonts.css as the one place the faces are defined — the drift
    check makes sure the copy in the pages cannot fall behind it — while the
    browser gets the rules in the first response.
    """
    css = (ROOT / "assets" / "fonts.css").read_text(encoding="utf-8")
    # The file lives in assets/, the pages live at the root: re-root the URLs.
    css = css.replace("url('fonts/", "url('assets/fonts/")
    # Comments are for whoever opens the file, not for the wire.
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\n\s*\n+", "\n", css).strip()
    return css


def build(check: bool = False) -> int:
    template = (ROOT / "templates" / "base.html").read_text(encoding="utf-8")
    fonts = font_face_css()
    stale: list[str] = []

    for frag_path in sorted((ROOT / "pages").glob("*.html")):
        meta, body = parse(frag_path.read_text(encoding="utf-8"))

        path = meta["path"]
        rel = meta.get("rel", "")
        surface_class, theme, scheme = SURFACES[meta.get("surface", "ink")]
        accent = meta.get("accent", "")
        # One case study, one motion law. The page declares which product
        # physics it inherits; the stylesheet does the rest.
        physics = meta.get("physics", "")
        og_image = meta.get("image", "")

        desk, mob = nav_html(meta.get("nav", ""), rel)

        page = template
        replacements = {
            "{{TITLE}}": meta["title"],
            "{{OGTITLE}}": meta.get("ogtitle", meta["title"]),
            "{{DESC}}": meta["desc"],
            "{{PATH}}": "" if path == "index.html" else path,
            "{{SITE}}": SITE,
            "{{REL}}": rel,
            "{{SURFACE}}": surface_class,
            "{{THEME}}": theme,
            "{{SCHEME}}": scheme,
            "{{OGTYPE}}": meta.get("ogtype", "website"),
            "{{ACCENTATTR}}": f' data-accent="{accent}"' if accent else "",
            "{{PHYSICSATTR}}": f' data-physics="{physics}"' if physics else "",
            "{{NAVDESK}}": desk,
            "{{NAVMOB}}": mob,
            "{{FONTFACE}}": fonts,
            "{{HEADEXTRA}}": meta.get("headextra", ""),
            "{{OGIMAGE}}": (
                f'<meta property="og:image" content="{SITE}{og_image}" />'
                if og_image
                else ""
            ),
            "{{BODY}}": body.rstrip() + "\n",
        }
        for token, value in replacements.items():
            page = page.replace(token, value)

        left = re.findall(r"\{\{[A-Z]+\}\}", page)
        if left:
            raise SystemExit(f"{path}: unresolved placeholder(s) {sorted(set(left))}")

        out = ROOT / path
        if check:
            if not out.exists() or out.read_text(encoding="utf-8") != page:
                stale.append(path)
        else:
            out.write_text(page, encoding="utf-8")
            print(f"wrote {path}  ({len(page) // 1024} KB)")

    for path, (to, title, desc) in sorted(REDIRECTS.items()):
        # A fragment is not part of a canonical URL — the page a search engine
        # should hold is the document, and the document is the home page.
        doc = to.split("#", 1)[0]
        canonical = SITE + ("" if doc == "index.html" else doc)
        page = REDIRECT.format(title=title, desc=desc, to=to, canonical=canonical)
        out = ROOT / path
        if check:
            if not out.exists() or out.read_text(encoding="utf-8") != page:
                stale.append(path)
        else:
            out.write_text(page, encoding="utf-8")
            print(f"wrote {path}  (redirect to {to})")

    if check:
        if stale:
            print("out of date: " + ", ".join(stale), file=sys.stderr)
            print("run: python3 tools/build_pages.py", file=sys.stderr)
            return 1
        print("all pages are up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(build(check="--check" in sys.argv))
