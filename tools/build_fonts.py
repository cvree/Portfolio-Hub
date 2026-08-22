#!/usr/bin/env python3
"""Instance the variable text faces down to what this site actually uses.

Newsreader ships as a two-axis variable font — weight 200-800 and optical size
6-72 — and the delta data for both axes is most of the file. This site sets
Newsreader at 400 for body copy and 600 for <strong>, at one reading size, so
the optical-size axis is pinned at 18 and the weight axis is clipped to
400-700. Nothing the stylesheet asks for is lost, and the largest asset on the
critical path stops being the largest asset on the critical path.

Run manually after replacing a font; it is not part of CI, because the output
of a font compiler is not reproducible byte-for-byte across versions and a
drift check on it would fail for no reason.

    pip install 'fonttools[woff]' brotli
    python3 tools/build_fonts.py            # report what would change
    python3 tools/build_fonts.py --write    # rewrite the files in place

The originals remain in git history at any commit before this one.
"""

from __future__ import annotations

import pathlib
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"

# family file -> axis limits to apply
PLAN = {
    "Newsreader-400.woff2": {"opsz": 18, "wght": (400, 700)},
    # The italic ships with the optical-size axis only.
    "Newsreader-400-italic.woff2": {"opsz": 18},
}


def main(write: bool) -> int:
    total_before = total_after = 0
    for name, limits in PLAN.items():
        path = FONTS / name
        if not path.exists():
            print(f"missing: {name}", file=sys.stderr)
            return 1
        before = path.stat().st_size
        font = TTFont(path)
        if "fvar" not in font:
            print(f"{name}: already static, nothing to do")
            continue
        have = {a.axisTag for a in font["fvar"].axes}
        limits = {k: v for k, v in limits.items() if k in have}
        inst = instancer.instantiateVariableFont(font, limits, inplace=False, updateFontNames=False)
        inst.flavor = "woff2"
        out = path if write else path.with_suffix(".instanced.woff2")
        inst.save(out)
        after = out.stat().st_size
        total_before += before
        total_after += after
        print(
            f"{name}: {before/1024:.1f} KB -> {after/1024:.1f} KB "
            f"({(1 - after/before) * 100:.0f}% smaller)  limits={limits}"
        )
        if not write:
            out.unlink()
    if total_before:
        print(f"\ntotal on the critical path: {total_before/1024:.1f} KB -> {total_after/1024:.1f} KB")
    if not write:
        print("(dry run — pass --write to replace the files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main("--write" in sys.argv))
