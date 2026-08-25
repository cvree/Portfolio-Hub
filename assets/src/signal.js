/* ===========================================================================
   ONE SIGNAL — the pointer layer
   ---------------------------------------------------------------------------
   The smallest module on this site, and deliberately so. Everything the hero
   actually does — the arrival, the domain states, the trace, the assembly of
   the CE — is CSS and markup that has already painted by the time this file is
   even requested. What is left for a script is the one thing CSS cannot do:
   read where the pointer is.

   Two effects, both clamped hard:

     1. The three planes separate by at most fourteen pixels and the whole
        object tilts by at most three degrees. That is enough to show that the
        monogram is constructed out of CARE, BUILD and COMPETE, and far too
        little to turn it into something to play with.
     2. The trace bends locally, by a few pixels, near the pointer. It does not
        follow the cursor, it does not chase it, and it never leaves its line.

   It never replaces the native cursor. It runs no loop while nothing is
   moving, it stops entirely when the document is hidden, and it removes every
   listener it added on teardown. If it never loads, the hero is exactly the
   composition it was designed to be — which is the only reason it is allowed
   to exist at all.
   =========================================================================== */

/* How far a plane may travel, in pixels, at full pointer deflection. The CSS
   multiplies this by each plane's own separation factor; the largest factor is
   1.7, so the real ceiling is a shade under fourteen pixels. */
const REACH = 8;

/* Below this, the eased value has arrived and the loop has nothing to do. */
const REST = 0.0008;

export function mount(section) {
  const stage = section.querySelector('[data-ce]');
  const trace = section.querySelector('[data-trace]');
  if (!stage && !trace) return { destroy() {}, tune() {} };

  let tx = 0, ty = 0;   /* where the pointer says the object should be */
  let cx = 0, cy = 0;   /* where it actually is */
  let frame = 0;
  let dead = false;

  function step() {
    frame = 0;
    if (dead) return;

    /* A critically damped approach: fast enough to feel attached to the hand,
       slow enough that a flicked cursor does not snap the object. */
    cx += (tx - cx) * 0.11;
    cy += (ty - cy) * 0.11;

    section.style.setProperty('--px', cx.toFixed(4));
    section.style.setProperty('--py', cy.toFixed(4));

    if (Math.abs(tx - cx) > REST || Math.abs(ty - cy) > REST) {
      frame = requestAnimationFrame(step);
    }
  }

  function wake() {
    if (!frame && !dead && !document.hidden) frame = requestAnimationFrame(step);
  }

  function onMove(ev) {
    const box = section.getBoundingClientRect();
    if (!box.width || !box.height) return;
    /* -1 .. 1 from the centre of the hero, clamped, so a pointer that leaves
       the section never pushes the object past its limit. */
    tx = Math.max(-1, Math.min(1, ((ev.clientX - box.left) / box.width - 0.5) * 2));
    ty = Math.max(-1, Math.min(1, ((ev.clientY - box.top) / box.height - 0.5) * 2));
    wake();
  }

  function onLeave() {
    tx = 0;
    ty = 0;
    wake();
  }

  function onHidden() {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else {
      wake();
    }
  }

  section.style.setProperty('--reach', REACH + 'px');
  section.addEventListener('pointermove', onMove, { passive: true });
  section.addEventListener('pointerleave', onLeave, { passive: true });
  document.addEventListener('visibilitychange', onHidden);

  return {
    /* The domain state is CSS's job; this only exists so the caller can wire
       every listener to one place. Re-centring on a domain change stops the
       newly-forward plane from arriving already pushed to one side. */
    tune() {
      onLeave();
    },
    destroy() {
      dead = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onHidden);
      section.style.removeProperty('--px');
      section.style.removeProperty('--py');
      section.style.removeProperty('--reach');
    }
  };
}
