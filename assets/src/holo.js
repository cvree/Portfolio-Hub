/* ===========================================================================
   THE HOLOGRAM — the driver behind the projected mark
   ---------------------------------------------------------------------------
   The hologram in the hero is CSS: eighteen depth slices of one path stacked
   in real 3D space, a spectral film clipped to the silhouette, two chromatic
   ghosts, a scan bar and three orbital rings. All of it stands, drifts and
   reads with this file absent — the resting angle and the slow orbit are
   keyframes, not script.

   What this adds is the part CSS cannot know: where the pointer is, and
   whether somebody has taken hold of the object. It writes five custom
   properties onto the host and gets out of the way.

     --rx  --ry   the tilt the pointer leads, in degrees
     --spin       the angle a drag has thrown, in degrees, with inertia
     --tilt       the same horizontal tilt as a plain -1..1 ratio, which is
                  what the chromatic split needs and degrees cannot give it
     --px  --py   where the light lands on the film, 0..1
     --grab       1 while the object is held, 0 otherwise

   Nothing here listens on the page it does not own, nothing here reads layout
   inside the frame loop, and the loop stops the moment the object leaves the
   screen or the tab goes behind something else.
   =========================================================================== */

const RANGE_X = 16; // degrees of tilt available to the pointer, vertically
const RANGE_Y = 26; // and horizontally

/* The resting pose, which is also what the stylesheet declares. They have to
   agree: this module writes the properties the moment it mounts, and a module
   that mounts by snapping a three-quarter view flat to the front has made the
   object worse for the eighth of a second before the first pointer event. */
const REST = { rx: -4, ry: -16, px: 0.34, py: 0.3 };

export function mount(host, opts) {
  if (!host) return null;
  const options = opts || {};
  const fine = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);

  let raf = 0;
  let running = false;
  let visible = true;
  let dead = false;

  /* Where the object is, and where it is going. Every one of these is a plain
     number; the only thing that ever touches the DOM is the write at the end
     of a frame, and only when something actually moved. */
  const now = { rx: REST.rx, ry: REST.ry, px: REST.px, py: REST.py };
  const to = { rx: REST.rx, ry: REST.ry, px: REST.px, py: REST.py };
  let spin = 0;
  let vel = 0;
  let held = false;
  let lastX = 0;
  let moved = 0;
  let dirty = true;

  function write() {
    host.style.setProperty('--rx', now.rx.toFixed(2) + 'deg');
    host.style.setProperty('--ry', now.ry.toFixed(2) + 'deg');
    host.style.setProperty('--tilt', (now.ry / RANGE_Y).toFixed(3));
    host.style.setProperty('--spin', spin.toFixed(2) + 'deg');
    host.style.setProperty('--px', now.px.toFixed(3));
    host.style.setProperty('--py', now.py.toFixed(3));
  }

  function frame() {
    if (dead) return;
    raf = requestAnimationFrame(frame);

    if (!held) {
      /* Inertia, and then rest. A thrown object keeps going for about a second
         and stops — it does not spin forever, because a hero that never
         settles is a hero nobody can look away from. */
      spin += vel;
      vel *= 0.9;
      if (Math.abs(vel) < 0.02) vel = 0;
    }

    const k = held ? 0.28 : 0.075;
    now.rx += (to.rx - now.rx) * k;
    now.ry += (to.ry - now.ry) * k;
    now.px += (to.px - now.px) * 0.09;
    now.py += (to.py - now.py) * 0.09;

    const settled =
      Math.abs(to.rx - now.rx) < 0.02 &&
      Math.abs(to.ry - now.ry) < 0.02 &&
      Math.abs(to.px - now.px) < 0.002 &&
      Math.abs(to.py - now.py) < 0.002 &&
      vel === 0;

    if (!settled || dirty) {
      write();
      dirty = false;
    } else {
      /* Nothing is moving and nothing is about to: stop burning frames. The
         next input starts the loop again. */
      pause();
    }
  }

  function play() {
    if (running || dead || !visible) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function wake() {
    dirty = true;
    play();
  }

  /* --- the pointer, leading the light ------------------------------------ */

  function onMove(ev) {
    if (held) {
      const dx = ev.clientX - lastX;
      lastX = ev.clientX;
      moved += Math.abs(dx);
      vel = Math.max(-9, Math.min(9, dx * 0.42));
      spin += dx * 0.42;
      wake();
      return;
    }
    if (!fine) return;
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    const nx = (ev.clientX / w) * 2 - 1;
    const ny = (ev.clientY / h) * 2 - 1;
    to.ry = nx * RANGE_Y;
    to.rx = -ny * RANGE_X;
    /* The specular highlight on the film sits where the pointer is, softened
       toward the middle so it never leaves the silhouette entirely. */
    to.px = 0.5 + nx * 0.34;
    to.py = 0.36 + ny * 0.3;
    wake();
  }

  /* --- the grab ------------------------------------------------------------
     A drag throws the object. It is claimed on the host only, it is released
     on the window so a pointer that leaves the element still lets go, and it
     never touches the vertical axis — so a drag that turns out to be a scroll
     is a scroll. */

  function onDown(ev) {
    if (!fine || ev.button !== 0) return;
    held = true;
    moved = 0;
    lastX = ev.clientX;
    vel = 0;
    host.classList.add('is-held');
    host.style.setProperty('--grab', '1');
    if (host.setPointerCapture) {
      try { host.setPointerCapture(ev.pointerId); } catch (e) {}
    }
    wake();
  }

  function onUp() {
    if (!held) return;
    held = false;
    host.classList.remove('is-held');
    host.style.setProperty('--grab', '0');
    /* A press that never travelled is not a throw. Give it one deliberate
       half-turn instead, so a click on the object does something. */
    if (moved < 4) vel = 7;
    wake();
  }

  /* --- the document, for everybody without a pointer ---------------------- */

  function onScroll() {
    if (fine) return;
    const doc = document.documentElement;
    const span = doc.scrollHeight - window.innerHeight;
    const read = span > 40 ? Math.min(1, Math.max(0, doc.scrollTop / span)) : 0;
    to.ry = (read - 0.5) * 2 * RANGE_Y;
    to.rx = -(read - 0.5) * RANGE_X;
    wake();
  }

  function onVisibility() {
    if (document.hidden) pause();
    else wake();
  }

  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries[0].isIntersecting;
            if (visible) wake();
            else pause();
          },
          { threshold: 0 }
        )
      : null;

  host.style.setProperty('--grab', '0');
  write();
  host.classList.add('is-live');

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  host.addEventListener('pointerdown', onDown);
  document.addEventListener('visibilitychange', onVisibility);
  if (io) io.observe(host);
  if (!fine) onScroll();
  wake();

  function destroy() {
    if (dead) return;
    dead = true;
    pause();
    if (io) io.disconnect();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    window.removeEventListener('scroll', onScroll);
    host.removeEventListener('pointerdown', onDown);
    document.removeEventListener('visibilitychange', onVisibility);
    host.classList.remove('is-live', 'is-held');
    for (const prop of ['--rx', '--ry', '--spin', '--tilt', '--px', '--py', '--grab']) {
      host.style.removeProperty(prop);
    }
    void options;
  }

  return { destroy };
}

export default { mount };
