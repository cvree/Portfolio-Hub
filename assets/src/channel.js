/* ===========================================================================
   The Channel — the home hero as a six-position instrument
   ---------------------------------------------------------------------------
   This module wires a control that is already in the document and already
   works. Before it runs, the strip is six ordinary links to six case studies
   and the hero stands composed on the channel the markup declares. After it
   runs, the strip is a radio group and picking a position retunes the page.

   Nothing here draws a composition. All six exist as real markup and real CSS
   state; the module's whole job is to move one attribute, swap one screenshot
   through the aperture, and interpolate one path. If it never loads, never
   parses, or throws on the first line, what is left is the design — not a
   broken widget.

   No dependency, no framework, no router. The URL does not change and the
   history is not touched: this is a hero, not a route.
   =========================================================================== */

const ORDER = ['spellbomb', 'health-journal', 'phlebotomy', 'manifester', 'owcs', 'paper-animator'];

/* How the light behaves per channel, for the shader plane when there is one.
   interference tightens the fine signal; refraction softens the field. These
   are the room changing, not a filter over it. */
const OPTICS = {
  spellbomb: { interference: 1.22, refraction: 0.86 },
  'health-journal': { interference: 0.74, refraction: 1.14 },
  phlebotomy: { interference: 1.0, refraction: 1.0 },
  manifester: { interference: 0.62, refraction: 1.3 },
  owcs: { interference: 1.5, refraction: 0.72 },
  'paper-animator': { interference: 0.88, refraction: 1.06 },
};

/* The six accents, exactly as assets/site.css declares them. The stylesheet
   is what paints; this copy exists only so the shader can be told where the
   accent is *going* rather than where the interpolation currently is. */
const ACCENT = {
  spellbomb: '#f0a23c',
  'health-journal': '#7fa6f0',
  phlebotomy: '#17a08f',
  manifester: '#c99189',
  owcs: '#b9e24d',
  'paper-animator': '#ded7c6',
};

const RETUNE = 620;

function stillNow() {
  const root = document.documentElement;
  if (root.getAttribute('data-motion') === 'off') return true;
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/* --- path interpolation ---------------------------------------------------
   The six waveforms are authored with the same twenty-five points, so one
   turns into the next by moving each point rather than by dissolving one
   picture through another. That is the whole trick, and it is nine lines. */

function points(d) {
  const nums = d.match(/-?[\d.]+/g);
  if (!nums) return null;
  const out = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([+nums[i], +nums[i + 1]]);
  return out;
}

function toPath(pts) {
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    d += (i ? 'L' : 'M') + Math.round(pts[i][0] * 10) / 10 + ' ' + Math.round(pts[i][1] * 10) / 10 + ' ';
  }
  return d.trim();
}

/* --- the module ----------------------------------------------------------- */

export function mount(section) {
  const strip = section.querySelector('[data-channel-strip]');
  const list = strip && strip.querySelector('.ch__list');
  const live = section.querySelector('.ap__signal[data-sig="live"]');
  const iris = section.querySelector('.ap__iris');
  const shot = section.querySelector('[data-ap="shot"]');
  const hint = section.querySelector('[data-ch-hint]');
  if (!strip || !list || !shot || !iris) return null;

  /* The evidence, the caption and the link for every channel are read out of
     the work index that is already on this page. One set of screenshots, one
     set of names, one source of truth — the hero borrows from the record
     below it rather than keeping a second copy of it. */
  const rows = {};
  for (const slug of ORDER) {
    const row = document.querySelector(`.works--rig .work[data-accent="${slug}"]`);
    const img = row && row.querySelector('.work__shot img');
    if (img) rows[slug] = img;
  }

  const shapes = {};
  for (const slug of ORDER) {
    const path = section.querySelector(`.ap__signal[data-sig="${slug}"]`);
    if (path) shapes[slug] = points(path.getAttribute('d'));
  }

  const caps = section.querySelectorAll('[data-cap]');
  const links = section.querySelectorAll('[data-link]');
  const readouts = section.querySelectorAll('[data-readout]');
  const spots = section.querySelectorAll('.ap__spot');

  let channel = section.dataset.channel || ORDER[0];
  let preview = null;
  let raf = 0;
  let swapTimer = 0;
  let dead = false;

  /* --- the strip becomes a radio group ------------------------------------
     Six links become six buttons, in the same boxes, with the same words. A
     link that does not navigate would be a lie to anyone reading the page
     with a screen reader or a status bar, so it stops being a link. The grid
     row owns the height, so nothing moves by a pixel when they change. */

  const opts = [];
  for (const a of Array.from(list.querySelectorAll('.ch__opt'))) {
    const slug = a.dataset.ch;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = a.className;
    btn.dataset.ch = slug;
    btn.dataset.href = a.getAttribute('href');
    btn.setAttribute('role', 'radio');
    btn.innerHTML = a.innerHTML;
    a.parentNode.setAttribute('role', 'presentation');
    a.replaceWith(btn);
    opts.push(btn);
  }
  list.setAttribute('role', 'radiogroup');
  list.setAttribute('aria-labelledby', 'ch-h');
  const finePointer = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  if (hint) {
    hint.textContent = finePointer
      ? 'Pick a channel and the whole page retunes to it · arrow keys move between positions'
      : 'Tap a channel and the whole page retunes to it';
  }

  /* --- painting ------------------------------------------------------------ */

  function paintStrip() {
    for (const b of opts) {
      const on = b.dataset.ch === channel;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    }
  }

  /* What is showing. A pointer drifting across the strip writes this and
     nothing else: the room retunes, the record does not move. */
  function paintTune() {
    section.dataset.tune = preview || channel;
    morph(preview || channel);
    announce(preview || channel);
  }

  function announce(slug) {
    section.dispatchEvent(
      new CustomEvent('ce:channel', {
        bubbles: true,
        detail: {
          slug,
          committed: channel,
          accent: ACCENT[slug] || ACCENT.phlebotomy,
          optics: OPTICS[slug] || OPTICS.phlebotomy,
        },
      })
    );
  }

  /* --- the signal, morphed ------------------------------------------------- */

  let from = shapes[channel] ? shapes[channel].slice() : null;
  let showing = channel;

  function setPath(pts) {
    if (!live || !pts) return;
    /* The aperture's opening sequence draws this same path with a dash offset.
       Changing the geometry underneath it would change the path's length and
       leave the draw reporting a fraction it is no longer at, so the fraction
       is what is preserved across a morph — not the number. */
    const dash = parseFloat(live.style.strokeDasharray) || 0;
    const drawn = dash ? 1 - (parseFloat(live.style.strokeDashoffset) || 0) / dash : 0;
    live.setAttribute('d', toPath(pts));
    if (dash) {
      const len = live.getTotalLength();
      live.style.strokeDasharray = len + ' ' + len;
      live.style.strokeDashoffset = String(len * (1 - drawn));
    }
  }

  function morph(slug) {
    const target = shapes[slug];
    if (!live || !target) return;
    if (showing === slug && !raf) return;
    showing = slug;
    cancelAnimationFrame(raf);
    raf = 0;

    if (!from || stillNow()) {
      from = target.slice();
      setPath(target);
      return;
    }

    const start = from.slice();
    const t0 = performance.now();
    const step = (now) => {
      if (dead) return;
      const k = Math.min(1, (now - t0) / RETUNE);
      /* The same easing the rest of the site moves on, so the trace and the
         accent arrive together rather than racing each other. */
      const e = 1 - Math.pow(1 - k, 3);
      const out = [];
      for (let i = 0; i < target.length; i++) {
        const a = start[Math.min(i, start.length - 1)];
        const b = target[i];
        out.push([a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]);
      }
      setPath(out);
      from = out;
      raf = k < 1 ? requestAnimationFrame(step) : 0;
      if (!raf) from = target.slice();
    };
    raf = requestAnimationFrame(step);
  }

  /* --- the evidence, moving through the aperture --------------------------- */

  function warm(slug) {
    const src = rows[slug];
    if (!src || src.dataset.warm) return;
    src.dataset.warm = '1';
    const pre = new Image();
    if (src.srcset) pre.srcset = src.srcset;
    if (src.sizes) pre.sizes = src.sizes;
    pre.src = src.currentSrc || src.src;
  }

  function dressEvidence(slug) {
    const src = rows[slug];
    if (!src) return;
    shot.setAttribute('srcset', src.getAttribute('srcset') || '');
    shot.setAttribute('sizes', src.getAttribute('sizes') || '');
    shot.setAttribute('src', src.getAttribute('src'));
    shot.setAttribute('width', src.getAttribute('width'));
    shot.setAttribute('height', src.getAttribute('height'));
    shot.setAttribute('alt', src.getAttribute('alt'));
    /* The transition name belongs to whichever element is genuinely that
       product's capture. Off the default channel the hero is borrowing a
       picture the work index owns, so it gives the name back rather than
       claiming it twice. */
    if (slug === 'phlebotomy') shot.setAttribute('data-vt', 'shot-phlebotomy');
    else shot.removeAttribute('data-vt');
  }

  function swap(slug) {
    dressEvidence(slug);
    for (const el of caps) el.hidden = el.dataset.cap !== slug;
    for (const el of links) el.hidden = el.dataset.link !== slug;
    for (const el of readouts) el.hidden = el.dataset.readout !== slug;
    closeAllNotes();
  }

  /* --- the specimen: hotspots ---------------------------------------------- */

  function closeAllNotes() {
    for (const b of spots) {
      b.setAttribute('aria-expanded', 'false');
      const note = document.getElementById(b.getAttribute('aria-controls'));
      if (note) note.hidden = true;
    }
  }

  for (const b of spots) {
    b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') === 'true';
      closeAllNotes();
      if (open) return;
      b.setAttribute('aria-expanded', 'true');
      const note = document.getElementById(b.getAttribute('aria-controls'));
      if (note) note.hidden = false;
    });
  }

  /* --- commit --------------------------------------------------------------- */

  function commit(slug, moveFocus) {
    if (!ORDER.includes(slug)) return;
    preview = null;
    const changed = slug !== channel;
    channel = slug;
    section.dataset.channel = slug;
    /* One page, one state: the work index reads this and lights the row whose
       product the hero is now tuned to. */
    document.documentElement.dataset.channel = slug;
    paintStrip();

    if (!changed) {
      paintTune();
      return;
    }

    clearTimeout(swapTimer);
    if (stillNow()) {
      swap(slug);
      paintTune();
    } else {
      /* The blades close a little, the new capture arrives behind them, the
         blades open. One product leaves the frame before the next is in it —
         a screenshot is never cross-faded into another screenshot. */
      iris.classList.remove('is-swap');
      void iris.offsetWidth;
      iris.classList.add('is-swap');
      swapTimer = setTimeout(() => swap(slug), RETUNE * 0.42);
      setTimeout(() => iris.classList.remove('is-swap'), RETUNE + 40);
      paintTune();
    }

    if (moveFocus) {
      const b = opts.find((o) => o.dataset.ch === slug);
      if (b) b.focus();
    }
  }

  /* --- input ---------------------------------------------------------------- */

  for (const b of opts) {
    b.addEventListener('click', () => commit(b.dataset.ch, false));

    /* Hover previews and never commits, and only where a pointer can hover
       without a finger having to land on something first. */
    if (finePointer) {
      b.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType && ev.pointerType !== 'mouse') return;
        preview = b.dataset.ch;
        warm(preview);
        paintTune();
      });
      b.addEventListener('pointerleave', () => {
        preview = null;
        paintTune();
      });
    }

    /* Moving focus through the group previews too, so a keyboard reaches the
       same information a pointer does — then Enter or Space commits it. */
    b.addEventListener('focus', () => {
      preview = b.dataset.ch;
      warm(preview);
      paintTune();
    });
    b.addEventListener('blur', () => {
      if (list.contains(document.activeElement)) return;
      preview = null;
      paintTune();
    });
  }

  list.addEventListener('keydown', (ev) => {
    const i = opts.findIndex((o) => o === document.activeElement);
    if (i < 0) return;
    let j = -1;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') j = (i + 1) % opts.length;
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') j = (i - 1 + opts.length) % opts.length;
    else if (ev.key === 'Home') j = 0;
    else if (ev.key === 'End') j = opts.length - 1;
    else return;
    ev.preventDefault();
    commit(opts[j].dataset.ch, true);
  });

  /* --- the rig previews the hero -------------------------------------------
     Hovering or focusing a row in the work index tunes the room to it. It
     never commits and it never delays the link: the row is still one target
     and clicking it still goes straight to the case study. */
  const rigRows = document.querySelectorAll('.works--rig .work[data-accent]');
  for (const row of rigRows) {
    const slug = row.dataset.accent;
    if (!ORDER.includes(slug)) continue;
    if (finePointer) {
      row.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType && ev.pointerType !== 'mouse') return;
        preview = slug;
        paintTune();
      });
      row.addEventListener('pointerleave', () => {
        preview = null;
        paintTune();
      });
    }
    row.addEventListener('focusin', () => {
      preview = slug;
      paintTune();
    });
    row.addEventListener('focusout', () => {
      if (row.contains(document.activeElement)) return;
      preview = null;
      paintTune();
    });
  }

  /* --- start ---------------------------------------------------------------- */

  section.classList.add('is-wired');
  document.documentElement.dataset.channel = channel;
  paintStrip();
  paintTune();

  return {
    destroy() {
      dead = true;
      cancelAnimationFrame(raf);
      clearTimeout(swapTimer);
      iris.classList.remove('is-swap');
      closeAllNotes();
      section.classList.remove('is-wired');
    },
  };
}

export default { mount };
