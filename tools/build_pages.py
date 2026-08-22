#!/usr/bin/env python3
"""Assemble the static pages from templates/base.html + pages/*.html.

There is no framework here and no runtime dependency: this script exists only
so that the header, the footer and the <head> of twelve pages cannot drift
apart. It writes plain HTML into the repository root, and that committed HTML
is what GitHub Pages serves — so a visitor never waits on a build, and the
site works when opened straight off a disk.

    python3 tools/build_pages.py          # write the pages
    python3 tools/build_pages.py --check  # fail if the committed pages differ

Each fragment in pages/ starts with a small front-matter block:

    <!--meta
    path: work.html
    title: Selected Work — Connor Eppolito
    nav: work
    surface: ink
    accent: cobalt
    desc: ...
    -->
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://cvree.github.io/Portfolio-Hub/"

# The primary navigation, in the order it is read. This list is the single
# definition of it; both the desktop bar and the mobile panel are drawn from it.
NAV = [
    ("home", "Home", "index.html"),
    ("work", "Selected Work", "work.html"),
    ("experience", "Experience", "experience.html"),
    ("about", "About", "about.html"),
    ("resume", "Résumé", "resume.html"),
    ("contact", "Contact", "contact.html"),
]

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


def build(check: bool = False) -> int:
    template = (ROOT / "templates" / "base.html").read_text(encoding="utf-8")
    stale: list[str] = []

    for frag_path in sorted((ROOT / "pages").glob("*.html")):
        meta, body = parse(frag_path.read_text(encoding="utf-8"))

        path = meta["path"]
        rel = meta.get("rel", "")
        surface_class, theme, scheme = SURFACES[meta.get("surface", "ink")]
        accent = meta.get("accent", "")
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
            "{{NAVDESK}}": desk,
            "{{NAVMOB}}": mob,
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

    if check:
        if stale:
            print("out of date: " + ", ".join(stale), file=sys.stderr)
            print("run: python3 tools/build_pages.py", file=sys.stderr)
            return 1
        print("all pages are up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(build(check="--check" in sys.argv))
