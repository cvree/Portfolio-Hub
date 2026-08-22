/* ===========================================================================
   The Evidence Aperture — desktop timeline
   ---------------------------------------------------------------------------
   This module animates INTO the composition the CSS already draws. The static
   frame is the finished frame; everything here sets a *starting* state and
   then removes it across one short pinned sequence. So if this file never
   loads, never parses, or is refused by matchMedia, the hero is exactly what
   it was designed to be — which is the only reason it is allowed to exist.

   It uses the browser's own scroll position. Nothing here listens to wheel or
   touch, changes scroll velocity, or holds the page hostage: ScrollTrigger's
   pin is a spacer and a transform, and the scrollbar keeps meaning what it
   meant. There is no ScrollSmoother anywhere in this repository.
   =========================================================================== */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* One restrained per-character reveal, on one line of one title. The spans are
   decorative: the element keeps its complete accessible name, and assistive
   technology never sees the pieces. */
function splitChars(el) {
  if (!el || el.dataset.split === 'done') return [];
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const lines = el.querySelectorAll('[data-ap-line]');
  const chars = [];
  (lines.length ? lines : [el]).forEach((line) => {
    const text = line.textContent;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'ap__ch';
      s.textContent = ch === ' ' ? ' ' : ch;
      frag.appendChild(s);
      chars.push(s);
    }
    line.textContent = '';
    line.appendChild(frag);
    line.setAttribute('aria-hidden', 'true');
  });
  el.setAttribute('aria-label', label);
  el.dataset.split = 'done';
  return chars;
}

function unsplit(el) {
  if (!el || el.dataset.split !== 'done') return;
  el.querySelectorAll('[data-ap-line]').forEach((line) => {
    line.textContent = line.textContent;
    line.removeAttribute('aria-hidden');
  });
  el.removeAttribute('aria-label');
  delete el.dataset.split;
}

export function mount(section) {
  const q = (sel) => section.querySelector(sel);
  const title = q('[data-ap="title"]');
  const signal = q('[data-ap="signal"]');
  const grid = q('[data-ap="grid"]');
  const current = q('[data-ap="current"]');
  const bladeA = q('[data-ap="blade-a"]');
  const bladeB = q('[data-ap="blade-b"]');
  const shot = q('[data-ap="shot"]');
  const meta = section.querySelectorAll('[data-ap="lift"]');
  const stage = q('[data-ap="stage"]');

  const mm = gsap.matchMedia();

  mm.add(
    {
      cinematic: '(min-width: 1000px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    },
    (ctx) => {
      if (!ctx.conditions.cinematic) return;

      const chars = splitChars(title);
      section.classList.add('is-cinematic');

      /* The one per-character reveal on this site, and it is not scroll-linked.
         A scrubbed title would be unreadable at scroll position zero, which is
         the one position every visitor starts at — so this plays once, briefly,
         on arrival, and clears itself off the element afterwards. */
      const intro = gsap.fromTo(
        chars,
        { yPercent: 22, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.62, ease: 'power3.out', stagger: 0.011, clearProps: 'all' }
      );

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          // One screen and a half of scroll, once. Short enough that a reader
          // who simply wants the résumé is never held up by it.
          end: '+=78%',
          pin: stage,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      /* 1 — the biological signal and the competitive grid converge. The line
             is drawn with its own dash offset rather than a paid plugin: one
             tweened number, one setter, nothing else to ship. */
      const len = signal && signal.getTotalLength ? signal.getTotalLength() : 0;
      if (len) {
        signal.style.strokeDasharray = len + ' ' + len;
        /* Already running before you touch the scrollbar: the trace exists in
           the first frame and the sequence extends it, rather than conjuring a
           line out of an empty rectangle. */
        const draw = { v: 0.22 };
        signal.style.strokeDashoffset = String(len * (1 - draw.v));
        tl.to(
          draw,
          {
            v: 1,
            duration: 1.1,
            onUpdate() {
              signal.style.strokeDashoffset = String(len * (1 - draw.v));
            },
          },
          0
        );
      }
      tl.fromTo(grid, { opacity: 0.34, scaleX: 1.1, transformOrigin: '50% 50%' }, { opacity: 1, scaleX: 1, duration: 1.2 }, 0.05)
        .fromTo(current, { scaleX: 0.12, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.9 }, 0.3);

      /* 2 — the aperture opens. The blades start parked at the edges of a slit,
             not shut: the first frame is a composed image with the product
             already legible through it, never a shutter over a loading screen. */
      tl.fromTo(bladeA, { yPercent: 45 }, { yPercent: 0, duration: 1.0, ease: 'power2.inOut' }, 0.35)
        .fromTo(bladeB, { yPercent: -45 }, { yPercent: 0, duration: 1.0, ease: 'power2.inOut' }, 0.35)
        .fromTo(shot, { scale: 1.06, opacity: 0.82 }, { scale: 1, opacity: 1, duration: 1.2 }, 0.35);

      /* 3 — it settles into the selected-work system, and the sequence ends on
             something you can click: the caption naming the product, and the
             link into its case study. */
      /* Position only. The caption names the product and the link goes to its
         case study — neither may be dimmed for effect at any scroll position. */
      tl.fromTo(meta, { y: 14 }, { y: 0, duration: 0.6, stagger: 0.08 }, 1.05);

      return () => {
        intro.kill();
        tl.scrollTrigger && tl.scrollTrigger.kill(true);
        tl.kill();
        gsap.set([grid, current, bladeA, bladeB, shot, meta, chars], { clearProps: 'all' });
        if (signal) {
          signal.style.strokeDasharray = '';
          signal.style.strokeDashoffset = '';
        }
        unsplit(title);
        section.classList.remove('is-cinematic');
        ScrollTrigger.refresh();
      };
    }
  );


  return {
    destroy() {
      mm.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill(true));
    },
  };
}


export default { mount };
