/* ===========================================================================
   THE CONSOLE — one field, and everything on this site is one keystroke away
   ---------------------------------------------------------------------------
   Eleven pages, six products and ninety-nine sections, and until now the only
   way to reach any of them was to know which page it was on. This is the
   answer to that: a field that opens on ⌘K, / or the control in the masthead,
   searches an index built out of the pages themselves at author time, and
   travels to whatever you pick.

   It is lazily imported the first time it is wanted and never before, so it
   costs the critical path nothing. Everything it navigates to is an ordinary
   URL that works with this file absent, blocked or thrown out by an error —
   the console finds places, it does not create them.

   THE CONTRACT.

     · It answers everything. Every keystroke redraws the count, every move
       redraws the selection, every choice is announced, and an empty result
       says what it looked in and offers somewhere to go anyway.
     · It is a combobox, spelled the way the pattern is spelled: the field owns
       aria-expanded and aria-activedescendant, the list owns role=listbox, and
       the option under the selection is the one the field is pointing at.
     · Focus goes in on open and comes back out to whatever opened it. While it
       is open, Tab cannot walk behind it.
     · Escape clears a query that has one, and closes a field that does not, so
       the key never destroys more than one thing at a time.
     · It never navigates on its own. Enter, a click and a tap are the three
       ways anything happens.

   It writes nothing to the page it is opened over except one class on <html>,
   which is what holds the scroll still behind it.
   =========================================================================== */

const KIND = {
  page: { label: 'Pages', tag: 'PAGE' },
  project: { label: 'Projects', tag: 'WORK' },
  section: { label: 'Sections', tag: 'SECT' },
  action: { label: 'Do', tag: 'RUN' },
  recent: { label: 'Recently opened', tag: 'BACK' },
};

const ORDER = ['action', 'page', 'project', 'section', 'recent'];

/* How many rows may be on screen at once. A list you cannot see the end of is
   a list nobody reads the end of; past this the field is the better tool and
   the count says so. */
const CAP = 24;
const RECENTS = 'ce-console-recent';
const KEEP = 5;

/* Résumé and resume are the same word to anybody typing in a hurry. */
const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

/* --- scoring ---------------------------------------------------------------
   Deterministic and explainable, rather than fuzzy. Every token in the query
   has to appear somewhere in the entry — an AND, because a search that widens
   as you type is a search that punishes you for being specific — and where it
   appears is what decides the order. A hit on the title outranks a hit on the
   page it is on, which outranks a hit in the description, and a hit at the
   start of a word outranks a hit in the middle of one. */

function initials(text) {
  return text
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((w) => w[0])
    .join('');
}

function score(entry, tokens, whole) {
  const t = entry._t;
  const c = entry._c;
  const d = entry._d;
  let total = 0;

  for (const tok of tokens) {
    const at = t.indexOf(tok);
    if (at === 0) total += 420;
    else if (at > 0) total += /[^a-z0-9]/.test(t[at - 1]) ? 300 : 170;
    else if (entry._i.startsWith(tok) && tok.length > 1) total += 260;
    else if (c.includes(tok)) total += 80;
    else if (d.includes(tok)) total += 55;
    else return 0;
  }

  /* The whole query as one run beats the same letters scattered across three
     fields, so typing more of a title keeps walking it up the list. */
  if (tokens.length > 1 && t.includes(whole)) total += 240;
  if (t === whole) total += 900;

  total += entry.k === 'page' ? 46 : entry.k === 'project' ? 34 : 0;
  /* Between two entries that matched the same way, the shorter one is the
     more exact one. */
  total += Math.max(0, 60 - t.length);
  return total;
}

/* --- the marked-up title ---------------------------------------------------
   What matched is shown as what matched. The ranges are computed on the
   normalised string and applied to the original, which is safe because
   normalisation here never changes a string's length. */

function ranges(text, tokens) {
  const hay = norm(text);
  const out = [];
  for (const tok of tokens) {
    let from = 0;
    for (;;) {
      const at = hay.indexOf(tok, from);
      if (at < 0) break;
      out.push([at, at + tok.length]);
      from = at + tok.length;
    }
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of out) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

function marked(text, tokens) {
  const frag = document.createDocumentFragment();
  if (!tokens.length) {
    frag.appendChild(document.createTextNode(text));
    return frag;
  }
  let at = 0;
  for (const [from, to] of ranges(text, tokens)) {
    if (from > at) frag.appendChild(document.createTextNode(text.slice(at, from)));
    const hit = document.createElement('mark');
    hit.className = 'cons__hit';
    hit.textContent = text.slice(from, to);
    frag.appendChild(hit);
    at = to;
  }
  if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
  return frag;
}

/* --- the module ----------------------------------------------------------- */

export function mount(opts = {}) {
  const doc = document.documentElement;
  const go = opts.go || ((url) => { location.href = url; });
  const say = opts.say || (() => {});
  /* Where the index is. Every page on this site is at the root, so an entry's
     own url is already relative to whichever document is open. */
  const index = opts.index || 'assets/search.json';
  const here = location.pathname.split('/').pop() || 'index.html';

  let entries = null;
  let loading = null;
  let open = false;
  let rows = [];
  let at = -1;
  let opener = null;
  let dead = false;

  /* --- the furniture ------------------------------------------------------ */

  const stage = document.createElement('div');
  stage.className = 'cons';
  stage.hidden = true;
  stage.innerHTML = [
    '<div class="cons__scrim" data-close></div>',
    '<div class="cons__box" role="dialog" aria-modal="true" aria-label="Find anything on this site">',
    '  <div class="cons__field">',
    '    <svg class="cons__glass" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">',
    '      <circle cx="10.5" cy="10.5" r="6.6" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    '      <path d="M15.4 15.4 L20.5 20.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    '    </svg>',
    '    <input class="cons__input" type="text" role="combobox" autocomplete="off" autocorrect="off"',
    '           autocapitalize="off" spellcheck="false" aria-expanded="true" aria-controls="cons-list"',
    '           aria-autocomplete="list" aria-label="Search this site"',
    '           placeholder="Search projects, sections and pages" />',
    '    <span class="cons__count" data-count aria-hidden="true"></span>',
    '    <button class="cons__x" type="button" data-close aria-label="Close">Esc</button>',
    '  </div>',
    '  <div class="cons__results" id="cons-list" role="listbox" aria-label="Results" tabindex="-1"></div>',
    '  <p class="cons__legend" aria-hidden="true">',
    '    <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> move</span>',
    '    <span><kbd>&crarr;</kbd> open</span>',
    '    <span><kbd>esc</kbd> close</span>',
    '    <span class="cons__legend-end" data-total></span>',
    '  </p>',
    '</div>',
  ].join('');

  const box = stage.querySelector('.cons__box');
  const input = stage.querySelector('.cons__input');
  const list = stage.querySelector('.cons__results');
  const count = stage.querySelector('[data-count]');
  const total = stage.querySelector('[data-total]');
  document.body.appendChild(stage);

  /* --- the index ----------------------------------------------------------
     One request, on the first open, and never again for the life of the
     document. If it cannot be had — offline, a file:// origin, a 404 — the
     console still opens and still works: the actions handed in by the site are
     always there, and the message says plainly what is missing rather than
     showing an empty list and letting somebody think there is nothing here. */

  function load() {
    if (entries || loading) return loading || Promise.resolve();
    loading = fetch(index, { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        entries = data.map((e) => ({
          ...e,
          _t: norm(e.t),
          _c: norm(e.c),
          _d: norm((e.d || '') + ' ' + (e.w || '')),
          _i: norm(initials(e.t)),
        }));
      })
      .catch(() => {
        entries = [];
      })
      .then(() => {
        loading = null;
        if (open) draw();
      });
    return loading;
  }

  /* --- what is on screen with an empty field -------------------------------
     Never a blank panel. An empty field is a menu: what you opened last, then
     the six products, then the pages. */

  function recents() {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(RECENTS) || '[]');
    } catch (e) {
      saved = [];
    }
    if (!Array.isArray(saved) || !entries) return [];
    const byUrl = new Map(entries.map((e) => [e.u, e]));
    return saved
      .map((u) => byUrl.get(u))
      .filter(Boolean)
      .slice(0, KEEP)
      .map((e) => ({ ...e, k: 'recent' }));
  }

  function remember(url) {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENTS) || '[]');
      const next = [url].concat((Array.isArray(saved) ? saved : []).filter((u) => u !== url)).slice(0, KEEP);
      localStorage.setItem(RECENTS, JSON.stringify(next));
    } catch (e) {
      /* storage denied. The console is the same console without a memory. */
    }
  }

  /* The site hands these in, and hands them in fresh on every draw: one of
     them is the motion switch, and its label is the state it is in. */
  function actions() {
    const given = typeof opts.actions === 'function' ? opts.actions() : opts.actions;
    return (given || []).map((a) => ({
      k: 'action',
      t: a.t,
      c: a.c || 'Action',
      d: a.d || '',
      u: '',
      run: a.run,
      _t: norm(a.t),
      _c: norm(a.c || ''),
      _d: norm((a.d || '') + ' ' + (a.w || '')),
      _i: norm(initials(a.t)),
    }));
  }

  function resting() {
    const out = recents();
    /* One row per destination here too: something you opened last is not
       offered a second time three rows further down. */
    const already = new Set(out.map((e) => e.u));
    if (entries) {
      for (const e of entries) if (e.k === 'project' && !already.has(e.u)) out.push(e);
      for (const e of entries) if (e.k === 'page' && e.u !== here && !already.has(e.u)) out.push(e);
    }
    return out.concat(actions()).slice(0, CAP);
  }

  function matching(q) {
    const whole = norm(q);
    const tokens = whole.split(/\s+/).filter(Boolean);
    const pool = (entries || []).concat(actions());
    const hits = [];
    for (const e of pool) {
      const s = score(e, tokens, whole);
      if (s > 0) hits.push({ e: e, s: s });
    }
    hits.sort((a, b) => b.s - a.s || a.e.t.length - b.e.t.length);

    /* Grouped, and the groups ordered by the best thing in them.
       The list is drawn under one heading per kind, so the kinds have to be
       contiguous — otherwise "Sections" appears twice in one result and means
       something different each time. Ranking the groups by their own best
       member keeps the single best match at the top of the list where it
       belongs, and keeps every heading honest. */
    const byKind = new Map();
    for (const hit of hits) {
      if (!byKind.has(hit.e.k)) byKind.set(hit.e.k, []);
      byKind.get(hit.e.k).push(hit);
    }
    const groups = [...byKind.entries()].sort(
      (a, b) => b[1][0].s - a[1][0].s || ORDER.indexOf(a[0]) - ORDER.indexOf(b[0])
    );

    const rows = [];
    for (const [, members] of groups) for (const hit of members) rows.push(hit.e);
    return { rows: rows, tokens: tokens, found: hits.length };
  }

  /* --- drawing ------------------------------------------------------------- */

  function row(entry, tokens, i) {
    const el = document.createElement(entry.run ? 'button' : 'a');
    el.className = 'cons__row';
    el.id = 'cons-r' + i;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', 'false');
    /* The attribute rather than the property: the trap below reads the DOM to
       decide what Tab may reach, and a property nothing can select on would
       have let Tab walk out through a hundred rows nothing can focus. */
    el.setAttribute('tabindex', '-1');
    if (entry.run) el.type = 'button';
    else el.href = entry.u;

    const tag = document.createElement('span');
    tag.className = 'cons__tag';
    tag.textContent = (KIND[entry.k] || KIND.section).tag;

    const main = document.createElement('span');
    main.className = 'cons__main';

    const title = document.createElement('span');
    title.className = 'cons__t';
    title.appendChild(marked(entry.t, tokens));
    main.appendChild(title);

    /* The second line is where it is, and then what it says. A section's page
       is the part that orients you; the sentence after it is the part that
       tells you whether this is the one. */
    const where = entry.k === 'action' ? '' : entry.c;
    const what = entry.k === 'recent' ? '' : entry.d;
    const sub = [where, what].filter(Boolean).join(' · ');
    if (sub) {
      const meta = document.createElement('span');
      meta.className = 'cons__c';
      meta.appendChild(marked(sub, tokens));
      main.appendChild(meta);
    }

    /* Where you already are. Without this the console is happy to send you to
       the page you are reading and say nothing about it. */
    if (entry.u && entry.u.split('#')[0] === here) {
      const mine = document.createElement('span');
      mine.className = 'cons__here';
      mine.textContent = entry.u.indexOf('#') > 0 ? 'on this page' : 'you are here';
      main.appendChild(mine);
      el.classList.add('is-here');
    }

    const key = document.createElement('span');
    key.className = 'cons__go';
    key.setAttribute('aria-hidden', 'true');
    key.textContent = '↵';

    el.append(tag, main, key);
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      choose(entry);
    });
    el.addEventListener('pointermove', () => {
      const n = rows.indexOf(entry);
      if (n >= 0 && n !== at) select(n, false);
    });
    return el;
  }

  function draw() {
    const q = input.value.trim();
    const result = q ? matching(q) : { rows: resting(), tokens: [], found: -1 };
    rows = result.rows.slice(0, CAP);

    list.textContent = '';
    let group = null;
    rows.forEach((entry, i) => {
      if (entry.k !== group) {
        group = entry.k;
        const head = document.createElement('p');
        head.className = 'cons__group';
        /* Presentational on purpose: the only meaningful children of a listbox
           are its options, and each option already carries its own kind as the
           first thing in its accessible name. The heading is for the eye. */
        head.setAttribute('role', 'presentation');
        head.textContent = (KIND[group] || KIND.section).label;
        list.appendChild(head);
      }
      list.appendChild(row(entry, result.tokens, i));
    });

    if (!rows.length) {
      const none = document.createElement('p');
      none.className = 'cons__none';
      none.textContent = entries && entries.length
        ? 'Nothing here matches that.'
        : 'The index could not be loaded, so only the actions are searchable.';
      const hint = document.createElement('p');
      hint.className = 'cons__none cons__none--hint';
      hint.textContent = entries && entries.length
        ? 'Try a product name, a page, or a word from a section heading.'
        : 'Every page is still reachable from the navigation and the footer.';
      list.append(none, hint);
    }

    const n = rows.length;
    count.textContent = q ? (result.found > CAP ? CAP + ' of ' + result.found : String(result.found)) : '';
    if (total) {
      total.textContent = entries ? entries.length + ' indexed' : '';
    }
    select(rows.length ? 0 : -1, false);

    /* One announcement, and it is the number — which is the thing a person who
       cannot see the list needs after every keystroke. */
    if (q) say(n === 0 ? 'No results' : result.found + (result.found === 1 ? ' result' : ' results'), 'quiet');
  }

  function select(n, scroll) {
    const all = list.querySelectorAll('.cons__row');
    if (at >= 0 && all[at]) {
      all[at].setAttribute('aria-selected', 'false');
      all[at].classList.remove('is-on');
    }
    at = n;
    if (n < 0 || !all[n]) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    all[n].setAttribute('aria-selected', 'true');
    all[n].classList.add('is-on');
    input.setAttribute('aria-activedescendant', all[n].id);
    if (scroll !== false) all[n].scrollIntoView({ block: 'nearest' });
  }

  function move(step) {
    if (!rows.length) return;
    select((at + step + rows.length) % rows.length, true);
  }

  function choose(entry) {
    if (!entry) return;
    if (entry.run) {
      close();
      entry.run();
      return;
    }
    remember(entry.u);
    close();
    go(entry.u);
  }

  /* --- opening and closing -------------------------------------------------- */

  function trap(ev) {
    if (ev.key !== 'Tab') return;
    const focusable = box.querySelectorAll(
      'input:not([tabindex="-1"]), button:not([tabindex="-1"]), [href]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  function onKey(ev) {
    if (!open) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      /* One key, one thing. A query is undone before the panel is. */
      if (input.value) {
        input.value = '';
        draw();
      } else {
        close();
      }
      return;
    }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); move(1); return; }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); move(-1); return; }
    if (ev.key === 'Home' && rows.length) { ev.preventDefault(); select(0, true); return; }
    if (ev.key === 'End' && rows.length) { ev.preventDefault(); select(rows.length - 1, true); return; }
    if (ev.key === 'Enter') {
      ev.preventDefault();
      choose(rows[at]);
      return;
    }
    trap(ev);
  }

  function show(prefill) {
    if (open || dead) return;
    opener = document.activeElement;
    open = true;
    stage.hidden = false;
    doc.classList.add('is-consoled');
    input.value = prefill || '';
    load();
    draw();
    /* Synchronously, in the same task that unhid the panel: a focus deferred to
       the next frame is a frame in which the first thing typed goes into the
       document instead of into the field. The selection is only made when there
       is something to select — selecting an empty field does nothing, and
       selecting a field somebody is already typing into eats what they typed. */
    input.focus();
    if (prefill) input.select();
  }

  function close() {
    if (!open) return;
    open = false;
    /* The field is blurred before the panel is hidden, and unconditionally.
       Focus left inside a hidden container is not a cosmetic problem: the
       document still believes something is being typed into, so the next / is
       read as a slash rather than as a request to open this. */
    input.blur();
    stage.hidden = true;
    doc.classList.remove('is-consoled');
    at = -1;
    rows = [];

    const back = opener;
    opener = null;
    /* Back to whatever opened it — unless that was the document itself, in
       which case there is nothing to go back to and the blur above is the
       whole answer. */
    if (back && back.focus && back !== document.body && back.isConnected) {
      try {
        back.focus({ preventScroll: true });
      } catch (e) {
        back.focus();
      }
    }
  }

  input.addEventListener('input', draw);
  stage.addEventListener('keydown', onKey);
  stage.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-close]')) close();
  });

  return {
    open: show,
    close: close,
    isOpen: () => open,
    warm: load,
    destroy() {
      dead = true;
      close();
      if (stage.parentNode) stage.parentNode.removeChild(stage);
    },
  };
}
