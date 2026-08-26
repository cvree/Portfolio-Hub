/* ===========================================================================
   THE PULSE LAYER — one signal, on every page, answering the visitor
   ---------------------------------------------------------------------------
   Everything the site *says* is CSS and markup that has painted before this
   file is even requested. What is left for a script is the handful of things
   CSS cannot know: where the pointer is, how hard somebody is scrolling, and
   when they have taken hold of something.

   It writes four custom properties onto <html> and then gets out of the way.
   Nothing here reads the DOM in a loop, nothing here changes layout, and every
   value below is clamped at the source rather than trusted downstream.

     --px, --py    -1..1, the pointer, eased. Fine pointers only.
     --pulse        0..1, exertion. Scroll velocity, decaying to rest.
     --grab-x/y    -1..1, a deliberate hold on the sculpture, spring-returned.

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

/* Ambient plane separation, in pixels, at full pointer deflection. The
   stylesheet multiplies this by each plane's own factor; the largest is 1.7,
   so the real ceiling is a shade under fourteen pixels. */
const REACH = 8;

/* A deliberate hold is allowed to pull much further than the pointer drifts —
   it is an explicit act, not an ambient one — but it still has an end. */
const GRAB_REACH = 1;

/* Below this the eased value has arrived and the loop has nothing to do. */
const REST = 0.0009;

/* Scroll pixels per frame that count as "flat out". Chosen from a fast but
   ordinary flick rather than from a scrollbar drag, so the ceiling is reached
   by effort and not only by abuse. */
const EXERTION = 62;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export function mount(root, opts = {}) {
  const doc = document.documentElement;
  const stage = document.querySelector('[data-ce]');
  const fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);

  /* pointer, eased */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  /* exertion */
  let pulse = 0, lastY = window.scrollY, lastT = 0;
  /* the hold: position, velocity, and where it is being pulled to */
  let gx = 0, gy = 0, gvx = 0, gvy = 0, hx = 0, hy = 0;
  let held = false;
  let frame = 0, dead = false;

  function busy() {
    return (
      Math.abs(tx - cx) > REST || Math.abs(ty - cy) > REST ||
      pulse > 0.002 ||
      held || Math.abs(gx) > REST || Math.abs(gy) > REST ||
      Math.abs(gvx) > REST || Math.abs(gvy) > REST
    );
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

    /* --- the hold: a real spring, so the release overshoots and settles ---
       Stiffness and damping are tuned to land just past the mark once and
       then stop. A hold that oozes back is a hold that felt like syrup. */
    const k = held ? 0.24 : 0.13;
    const damp = held ? 0.62 : 0.80;
    gvx = (gvx + (hx - gx) * k * dt) * Math.pow(damp, dt);
    gvy = (gvy + (hy - gy) * k * dt) * Math.pow(damp, dt);
    gx += gvx * dt;
    gy += gvy * dt;

    doc.style.setProperty('--px', cx.toFixed(4));
    doc.style.setProperty('--py', cy.toFixed(4));
    doc.style.setProperty('--pulse', pulse.toFixed(4));
    doc.style.setProperty('--grab-x', gx.toFixed(4));
    doc.style.setProperty('--grab-y', gy.toFixed(4));
    /* How far it has been pulled, regardless of direction — the object gains
       a couple of per cent of scale as it comes toward the hand. */
    doc.style.setProperty('--grab-mag', Math.min(1, Math.hypot(gx, gy)).toFixed(4));

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
    if (held) {
      const dx = ev.clientX - grabFrom.x;
      const dy = ev.clientY - grabFrom.y;
      moved = Math.max(moved, Math.hypot(dx, dy));
      hx = clamp(dx / 180, -GRAB_REACH, GRAB_REACH);
      hy = clamp(dy / 180, -GRAB_REACH, GRAB_REACH);
    }
    wake();
  }

  function onLeave() {
    tx = 0;
    ty = 0;
    wake();
  }

  /* --- the hold ------------------------------------------------------------
     Taking the sculpture in hand pulls its three planes apart along the drag,
     and letting go springs them back into alignment. It is fine-pointer only
     on purpose: on a touch screen a draggable object sitting in the first
     viewport is an object that eats the page's scroll. */

  const grabFrom = { x: 0, y: 0 };
  let moved = 0;

  function onDown(ev) {
    if (!stage || ev.button !== 0) return;
    held = true;
    moved = 0;
    grabFrom.x = ev.clientX;
    grabFrom.y = ev.clientY;
    hx = 0;
    hy = 0;
    stage.classList.add('is-held');
    if (stage.setPointerCapture) {
      try { stage.setPointerCapture(ev.pointerId); } catch (e) {}
    }
    wake();
  }

  function onUp() {
    if (!held) return;
    held = false;
    hx = 0;
    hy = 0;
    if (stage) stage.classList.remove('is-held');

    /* A press that never travelled is a press, not a drag: the visitor tapped
       the object rather than pulling it. Answer with the thing the object is
       for — one more QRS through it, and the planes snapping back together on
       the strike. Whoever is listening decides what that means; this module
       only reports that it happened. */
    if (moved < 6) document.dispatchEvent(new CustomEvent('ce:strike'));
    moved = 0;
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
    if (t.closest('a[href], button, summary, label.dom__opt, input[type="radio"]')) beat();
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
    if (stage) {
      stage.addEventListener('pointerdown', onDown);
      window.addEventListener('pointerup', onUp, { passive: true });
      window.addEventListener('pointercancel', onUp, { passive: true });
      stage.classList.add('is-holdable');
    }
  }

  void root;
  void opts;

  return {
    /* Re-centring on a domain change stops the newly-forward plane from
       arriving already pushed to one side. */
    tune() {
      onLeave();
      onUp();
    },
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
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (stage) {
        stage.removeEventListener('pointerdown', onDown);
        stage.classList.remove('is-held', 'is-holdable');
      }
      doc.classList.remove('is-beat');
      for (const p of ['--px', '--py', '--pulse', '--grab-x', '--grab-y', '--grab-mag', '--reach']) {
        doc.style.removeProperty(p);
      }
    }
  };
}
