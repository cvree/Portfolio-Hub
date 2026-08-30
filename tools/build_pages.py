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
    label: Projects
    nav: work
    surface: ink
    accent: cobalt
    physics: sort
    keywords: case study, shipped
    desc: ...
    -->

Two things are derived from the pages rather than kept beside them by hand:

  * every <h2> and <h3> in a fragment that does not already carry an id is
    given one, slugified from its own text. That is what makes every section
    of every case study a real URL — and the console's index, the chapter
    rail and the copy-link control all address the same anchor because there
    is only one of them.
  * assets/search.json, the console's index, is written from those headings
    plus each page's own front-matter. It cannot fall behind the pages,
    because it is made out of them.
"""

from __future__ import annotations

import html as htmllib
import json
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
    # The résumé's own surface: the same room as the rest of the site, one stop
    # darker, because a document is read more slowly than a site is looked at.
    "record": ("on-record", "#07080a", "dark"),
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


# ---------------------------------------------------------------------------
# Anchors, and the index made out of them
# ---------------------------------------------------------------------------
#
# A section that cannot be linked to is a section that cannot be found, and
# nine of the eleven pages had exactly one addressable place in them: the top.
# Every <h2> and <h3> that does not already carry an id gets one here, taken
# from its own text, and that single id is what the console's index, the
# chapter rail and the copy-link control all point at. There is one anchor per
# section because there is one place that makes it.

# How much of a section is carried into the index. Long enough that the claim
# a section is actually about is in it, short enough that the whole index is
# one small request made once.
EXCERPT = 420

HEAD_RE = re.compile(r"<h([23])(\s[^>]*)?>(.*?)</h\1>", re.S)
ID_RE = re.compile(r'\bid="([^"]+)"')
CLASS_RE = re.compile(r'\bclass="([^"]*)"')
TAG_RE = re.compile(r"<[^>]+>")


def text_of(markup: str) -> str:
    """The words in a heading, with its markup and its entities resolved.

    A tag becomes a space rather than nothing: several headings on this site
    are broken across two lines with a <br>, and closing the gap instead of
    keeping it would index "Who I am,in one paragraph."
    """
    return re.sub(r"\s+", " ", htmllib.unescape(TAG_RE.sub(" ", markup))).strip()


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:48].rstrip("-") or "section"


def autoid(body: str) -> tuple[str, list[dict[str, str]]]:
    """Give every heading an id, and report what the headings say.

    Ids already in the fragment are left exactly as they are — several are
    referenced by aria-labelledby and moving one would break the label it
    names. Everything generated is prefixed `s-`, which no hand-written id on
    this site uses, so a generated anchor can never collide with a written one.
    """
    taken = set(ID_RE.findall(body))
    found: list[dict[str, str]] = []
    out: list[str] = []
    at = 0
    spans: list[tuple[int, int]] = []

    for m in HEAD_RE.finditer(body):
        level, attrs, inner = m.group(1), m.group(2) or "", m.group(3)
        words = text_of(inner)
        have = ID_RE.search(attrs)

        if have:
            anchor = have.group(1)
        else:
            base = "s-" + slugify(words)
            anchor = base
            n = 2
            while anchor in taken:
                anchor = f"{base}-{n}"
                n += 1
            attrs = f' id="{anchor}"' + attrs
            out.append(body[at:m.start()])
            out.append(f"<h{level}{attrs}>{inner}</h{level}>")
            at = m.end()

        taken.add(anchor)
        classes = (CLASS_RE.search(attrs).group(1).split() if CLASS_RE.search(attrs) else [])
        found.append({"id": anchor, "text": words, "level": level, "vh": "vh" in classes})
        spans.append((m.end(), m.start()))

    out.append(body[at:])

    # What a section says, not only what it is called. A heading alone makes
    # nine of the eleven pages searchable by their table of contents and by
    # nothing else — "the order of draw" is the whole point of a section on
    # this site and appears in no heading on it. The prose between one heading
    # and the next is read here, flattened, and carried into the index as
    # something to match against rather than something to display.
    for i, (start, _) in enumerate(spans):
        stop = spans[i + 1][1] if i + 1 < len(spans) else len(body)
        found[i]["says"] = text_of(body[start:stop])[:EXCERPT]

    return "".join(out), found


# The six projects are the one part of the index that is not a heading: what
# a visitor searches for is the product's own promise, and that sentence lives
# on the card rather than in a title.
WK_RE = re.compile(
    r'<article class="wk" id="(?P<id>[^"]+)"[^>]*>.*?'
    r'<p class="wk__idx"><span>(?P<n>[^<]*)</span>\s*(?P<kind>[^<]*)</p>.*?'
    r'<h3[^>]*><a href="(?P<href>[^"]+)">(?P<title>[^<]+)</a></h3>\s*'
    r'<p class="wk__say">(?P<say>.*?)</p>',
    re.S,
)


def projects_in(body: str) -> list[dict[str, str]]:
    out = []
    for m in WK_RE.finditer(body):
        out.append(
            {
                "k": "project",
                "t": text_of(m.group("title")),
                "u": m.group("href"),
                "c": f"{m.group('n').strip()} · {text_of(m.group('kind'))}",
                "d": text_of(m.group("say")),
            }
        )
    return out


def write_index(entries: list[dict[str, str]], check: bool) -> bool:
    """assets/search.json — the console's whole index, in one request.

    It is fetched on the first press of the console and never before it, so
    nothing on this site waits on it. Written with separators that leave no
    space to save, and sorted the way the console presents it.
    """
    payload = json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + "\n"
    out = ROOT / "assets" / "search.json"
    if check:
        have = out.read_text(encoding="utf-8") if out.exists() else ""
        if have != payload:
            print("out of date: assets/search.json", file=sys.stderr)
            return True
        return False
    out.write_text(payload, encoding="utf-8")
    print(f"wrote assets/search.json  ({len(entries)} entries, {len(payload) // 1024} KB)")
    return False


def build(check: bool = False) -> int:
    template = (ROOT / "templates" / "base.html").read_text(encoding="utf-8")
    fonts = font_face_css()
    stale: list[str] = []
    index: list[dict[str, str]] = []

    for frag_path in sorted((ROOT / "pages").glob("*.html")):
        meta, body = parse(frag_path.read_text(encoding="utf-8"))
        body, headings = autoid(body)

        path = meta["path"]
        rel = meta.get("rel", "")
        surface_class, theme, scheme = SURFACES[meta.get("surface", "ink")]
        accent = meta.get("accent", "")
        # One case study, one motion law. The page declares which product
        # physics it inherits; the stylesheet does the rest.
        physics = meta.get("physics", "")
        og_image = meta.get("image", "")

        desk, mob = nav_html(meta.get("nav", ""), rel)

        # --- the index, made out of the page that was just assembled --------
        label = meta.get("label") or meta["title"].split(" — ")[0]
        index.append(
            {
                "k": "page",
                "t": label,
                "u": path,
                "c": "Case study" if meta.get("ogtype") == "article" else "Page",
                "d": meta["desc"],
                "w": meta.get("keywords", ""),
            }
        )
        cards = projects_in(body)
        index.extend(cards)
        named = {c["t"] for c in cards}
        for h in headings:
            # A visually-hidden heading labels a region for a screen reader.
            # It is not a place, and offering it as one would send somebody to
            # a line they cannot see.
            if h["vh"] or not h["text"] or h["text"] in named:
                continue
            says = h.get("says", "")
            index.append(
                {
                    "k": "section",
                    "t": h["text"],
                    "u": f"{path}#{h['id']}",
                    "c": label,
                    # Shown: the page it is on, then the first thing it says.
                    "d": says[:150].rstrip() + ("…" if len(says) > 150 else ""),
                    # Matched against, and never shown: the rest of it.
                    "w": says,
                }
            )

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

    # A product is one place, not two. The card in Projects and the case study
    # it links to are the same destination, so they are one row: the card's
    # promise is what a person recognises, and the page's own keywords are what
    # they are likely to have typed.
    by_url: dict[str, dict[str, str]] = {}
    for e in index:
        if e["k"] == "project":
            by_url[e["u"]] = e
    merged: list[dict[str, str]] = []
    for e in index:
        twin = by_url.get(e["u"])
        if e["k"] == "page" and twin is not None:
            twin["w"] = (twin.get("w", "") + " " + e.get("w", "") + " " + e["d"]).strip()
            continue
        merged.append(e)
    index = merged

    drifted = write_index(index, check)

    if check:
        if stale or drifted:
            if stale:
                print("out of date: " + ", ".join(stale), file=sys.stderr)
            print("run: python3 tools/build_pages.py", file=sys.stderr)
            return 1
        print("all pages are up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(build(check="--check" in sys.argv))
