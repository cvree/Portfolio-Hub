/* ===========================================================================
   THE PULSE LAYER — one signal, on every page, answering the visitor
   ---------------------------------------------------------------------------
   Everything the site *says* is CSS and markup that has painted before this
   file is even requested. What is left for a script is the handful of things
   CSS cannot know: where the pointer is, how hard somebody is scrolling, and
   when they have taken hold of something.

   It writes three custom properties onto <html> and then gets out of the way.
   Nothing here reads the DOM in a loop, nothing here changes layout, and every
   value below is clamped at the source rather than trusted downstream.

     --px, --py    -1..1, the pointer, eased. Fine pointers only.
     --pulse        0..1, exertion. Scroll velocity, decaying to rest.

   THE IDEA. A heart rate answers effort and then settles. So does this one:
   scroll hard and the trace across the top of every page gains amplitude and
   light; stop, and it comes back down to a resting rhythm within about a
   second. It is not decoration with a heartbeat painted on it — it is the one
   piece of state every visitor already knows how to read, reporting the one
   thing they are actually doing.

   None of it is load-bearing. With this file absent, blocked, refused by a
   gate or thrown out by an error, every page is exactly the composition it was
   designed to be.
   =========================================================================== */

/* Ambient parallax, in pixels, at full pointer deflection. The stylesheet
   multiplies this by each layer's own factor. */
const REACH = 8;

/* Below this the eased value has arrived and the loop has nothing to do. */
const REST = 0.0009;

/* Scroll pixels per frame that count as "flat out". Chosen from a fast but
   ordinary flick rather than from a scrollbar drag, so the ceiling is reached
   by effort and not only by abuse. */
const EXERTION = 62;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export function mount(root, opts = {}) {
  const doc = document.documentElement;
  const fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);

  /* pointer, eased */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  /* exertion */
  let pulse = 0, lastY = window.scrollY, lastT = 0;
  let frame = 0, dead = false;

  function busy() {
    return Math.abs(tx - cx) > REST || Math.abs(ty - cy) > REST || pulse > 0.002;
  }

  function step(now) {
    frame = 0;
    if (dead) return;
    const dt = lastT ? clamp((now - lastT) / 16.667, 0.25, 3) : 1;
    lastT = now;

    /* --- the pointer: critically damped, fast enough to feel attached ----- */
    cx += (tx - cx) * 0.11 * dt;
    cy += (ty - cy) * 0.11 * dt;

    /* --- exertion: it only ever falls here; scrolling is what raises it --- */
    pulse -= pulse * 0.055 * dt;
    if (pulse < 0.002) pulse = 0;

    doc.style.setProperty('--px', cx.toFixed(4));
    doc.style.setProperty('--py', cy.toFixed(4));
    doc.style.setProperty('--pulse', pulse.toFixed(4));

    if (busy()) frame = requestAnimationFrame(step);
    else lastT = 0;
  }

  function wake() {
    if (!frame && !dead && !document.hidden) frame = requestAnimationFrame(step);
  }

  /* --- scroll: velocity in, exertion out ---------------------------------- */

  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const y = window.scrollY;
      const moved = Math.abs(y - lastY);
      lastY = y;
      /* Rises quickly, but never past 1, and never in one jump: a page that
         spikes to full on the first wheel notch has no headroom left to
         answer anything harder. */
      pulse = clamp(pulse + (moved / EXERTION) * 0.5, 0, 1);
      wake();
    });
  }

  /* --- the pointer --------------------------------------------------------- */

  function onMove(ev) {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    tx = clamp((ev.clientX / w - 0.5) * 2, -1, 1);
    ty = clamp((ev.clientY / h - 0.5) * 2, -1, 1);
    wake();
  }

  function onLeave() {
    tx = 0;
    ty = 0;
    wake();
  }

  /* --- one beat, on a real activation ---------------------------------------
     Pressing something that does something sends a single QRS down the trace
     at the top of the page. Cause, action, settle — and never on a scroll, a
     hover or a load. */

  let beatTimer = 0;
  function beat() {
    if (dead) return;
    doc.classList.remove('is-beat');
    void doc.offsetWidth;
    doc.classList.add('is-beat');
    if (beatTimer) clearTimeout(beatTimer);
    beatTimer = setTimeout(() => doc.classList.remove('is-beat'), 760);
  }

  function onActivate(ev) {
    const t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest('a[href], button, summary')) beat();
  }

  function onKey(ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    onActivate(ev);
  }

  function onHidden() {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastT = 0;
    } else {
      lastY = window.scrollY;
      wake();
    }
  }

  doc.style.setProperty('--reach', REACH + 'px');
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onHidden);
  document.addEventListener('click', onActivate, true);
  document.addEventListener('keydown', onKey, true);

  if (fine) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave, { passive: true });
  }

  void root;
  void opts;

  return {
    destroy() {
      dead = true;
      if (frame) cancelAnimationFrame(frame);
      if (beatTimer) clearTimeout(beatTimer);
      frame = 0;
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHidden);
      document.removeEventListener('click', onActivate, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      doc.classList.remove('is-beat');
      for (const p of ['--px', '--py', '--pulse', '--reach']) {
        doc.style.removeProperty(p);
      }
    }
  };
}
