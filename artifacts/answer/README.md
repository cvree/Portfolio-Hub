# The answer — evidence

Section 10 of [`DESIGN.md`](../../DESIGN.md): **every action gets an answer, and
the answer is proportional to the action.**

The other sets in `artifacts/` are matched before/after pairs, because they
changed how a page already looked. This one cannot be a pair: none of what it
shows existed before it. So what is here is one capture of each state the
section promises — including the two that are about what is deliberately *not*
there.

```
node tools/shots_answer.mjs artifacts/answer     # capture
node tools/pack_evidence.mjs artifacts/answer    # 2× PNG -> WebP
```

| Frame | What it shows |
| --- | --- |
| `console-rest` | An empty field is a menu, not a blank panel: the six products, then the pages, then what you opened last. |
| `console-query` | *order of draw* — three words that appear in no heading on this site, answered from the prose the index carries. The count sits beside the caret; the matched run is marked; the selection is drawn in the page's accent with the return key on it. |
| `console-nothing` | Nothing matching says what it looked in and what to try, rather than showing an empty box. |
| `console-reduced` | The same panel under `prefers-reduced-motion: reduce`. Identical composition; it appears rather than arrives. |
| `console-mobile` | 390 px: a full-height sheet with 60 px rows, not a floating panel with a keyboard underneath it. |
| `receipt` | The anchor beside a heading, the reply in the rail, and the address bar already carrying the link that was copied. |
| `return` | The dial, past one and a bit screens, reporting the same number the trace across the top of the page is drawing. |
| `chapters` | A case study's own contents down the right-hand side: five hairlines, the one you are in extended and in the page's accent, its label asked for rather than permanent. |
| `no-js` | The point of the whole section. With no script there is no field, no anchor, no dial and no contents — and the page is complete, and everywhere any of them reached is in the navigation and the footer. |
