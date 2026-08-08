/* ==========================================================================
   cvree — index of works
   Progressive enhancement, in this order:
     1. The page is complete and readable with this file absent.
     2. IntersectionObserver handles every reveal, counter and diagram, so a
        failed CDN costs polish and nothing else.
     3. Lenis and GSAP, when they arrive, add smoothing and scroll-linked
        motion on top.
     4. Vanta loads for exactly one section, on exactly the devices that can
        afford it, and never under reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var conn = navigator.connection || {};
  var saveData = conn.saveData === true;

  var allowMotion = !reduced.matches;
  if (allowMotion) root.classList.add('anim');

  /* --- helpers ------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function observe(nodes, cb, opts) {
    if (!('IntersectionObserver' in window)) { nodes.forEach(function (n) { cb(n); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); }
      });
    }, opts || { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* --- 1. reveals --------------------------------------------------------- */
  // Everything that should fade up. Marked in CSS only while `.anim` is set.
  var revealTargets = $$('.reveal, .proj-head, .sec-head, .atlas__row, .stat-strip, .limits, ' +
    '.mode, .leaves, .pull, .spec, .loop__beat, .card, .node, .principles li, ' +
    '.capabilities > div, .pipeline figcaption, .proj-links, .end__lede, .end__cta, .end__links, .ticker');

  revealTargets.forEach(function (n) { n.setAttribute('data-reveal', ''); });

  function revealAll() { revealTargets.forEach(function (n) { n.classList.add('is-in'); }); }

  if (allowMotion) {
    observe(revealTargets, function (n) {
      // Stagger siblings so a row of cards arrives as a sequence, not a slab.
      var sibs = n.parentNode ? Array.prototype.indexOf.call(n.parentNode.children, n) : 0;
      n.style.transitionDelay = Math.min(sibs, 5) * 55 + 'ms';
      n.classList.add('is-in');
    });
    // Failsafe: whatever happens below this line, nothing stays hidden.
    window.addEventListener('error', revealAll);
    setTimeout(function () {
      revealTargets.forEach(function (n) {
        var r = n.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) n.classList.add('is-in');
      });
    }, 2500);
  } else {
    revealAll();
  }

  /* --- 2. counters -------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    if (!allowMotion || target === 0) { el.textContent = target.toLocaleString('en-US'); return; }
    var dur = 1100, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  observe($$('[data-count]'), animateCount, { threshold: 0.5 });

  /* --- 3. scramble labels ------------------------------------------------- */
  var GLYPHS = '▚▞░▒█/\\<>_-+*#0123456789';
  function scramble(el) {
    var final = el.textContent;
    if (!allowMotion) return;
    var frame = 0, total = 26;
    el.style.minWidth = el.offsetWidth + 'px';
    function tick() {
      var out = '';
      for (var i = 0; i < final.length; i++) {
        var settled = i < (frame / total) * final.length * 1.4;
        out += settled || final[i] === ' ' ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) setTimeout(tick, 26); else el.textContent = final;
    }
    tick();
  }
  observe($$('[data-scramble]'), scramble, { threshold: 0.9 });

  /* --- 4. diagrams -------------------------------------------------------- */
  observe($$('.pipeline'), function (fig) {
    var line = $('[data-draw]', fig);
    if (line && allowMotion) {
      line.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)';
      line.style.strokeDashoffset = '0';
    } else if (line) {
      line.style.strokeDasharray = 'none';
    }
    $$('[data-node]', fig).forEach(function (g, i) {
      if (!allowMotion) { g.style.opacity = 1; return; }
      g.style.transition = 'opacity .5s ease ' + (240 + i * 130) + 'ms';
      g.style.opacity = 1;
    });
  }, { threshold: 0.3 });

  /* --- 5. section marker, accent + progress hairline ---------------------- */
  var sections = $$('.sec');
  var markerNum = $('[data-marker-num]');
  var markerLabel = $('[data-marker-label]');
  var bar = $('[data-progress]');

  if ('IntersectionObserver' in window && sections.length) {
    var current = null;
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (current === e.target) return;
        current = e.target;
        if (markerNum) markerNum.textContent = e.target.getAttribute('data-sec') || '';
        if (markerLabel) markerLabel.textContent = e.target.getAttribute('data-label') || '';
        var accent = e.target.getAttribute('data-accent');
        if (accent) root.style.setProperty('--accent', accent);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (s) { secIO.observe(s); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (bar) {
        var max = document.body.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- 6. cursor + magnetism (desktop, motion-allowed only) --------------- */
  if (finePointer.matches && allowMotion) {
    var cur = $('[data-cursor]');
    var curLabel = $('[data-cursor-label]');
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (cur && !cur.classList.contains('is-on')) cur.classList.add('is-on');
    }, { passive: true });

    (function loop() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      if (cur) cur.style.translate = cx + 'px ' + cy + 'px';
      requestAnimationFrame(loop);
    })();

    $$('a, button, [data-magnetic]').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        if (!cur) return;
        cur.classList.add('is-hot');
        if (curLabel) curLabel.textContent = el.getAttribute('data-cursor-text') || '';
      });
      el.addEventListener('pointerleave', function () {
        if (!cur) return;
        cur.classList.remove('is-hot');
        if (curLabel) curLabel.textContent = '';
      });
    });

    // Magnetism is deliberately tiny (max 7px) and always toward the pointer:
    // a control that runs away from the cursor is a bug wearing a costume.
    $$('[data-magnetic]').forEach(function (el) {
      var strength = 7;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.transform = 'translate(' + clamp(dx, -1, 1) * strength + 'px,' +
          clamp(dy, -1, 1) * strength + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* --- 7. Lenis + GSAP, if they loaded ------------------------------------ */
  function initSmooth() {
    var lenis = null;
    var hasLenis = typeof window.Lenis === 'function';
    var hasGsap = !!window.gsap;
    var hasST = hasGsap && !!window.ScrollTrigger;

    if (!allowMotion) return;

    if (hasLenis) {
      lenis = new window.Lenis({
        duration: 1.05,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        syncTouch: false // touch stays native; mobile scrolling is never hijacked
      });
      // Anchor links go through Lenis so in-page jumps keep the same easing.
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (!id || id === '#') return;
          var t = document.querySelector(id);
          if (!t) return;
          e.preventDefault();
          lenis.scrollTo(t, { offset: -20 });
          if (history.replaceState) history.replaceState(null, '', id);
        });
      });
    }

    if (hasGsap && hasST) {
      window.gsap.registerPlugin(window.ScrollTrigger);

      if (lenis) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        (function raf(time) { requestAnimationFrame(raf); })();
      }

      // Masthead: the wordmark rises letter by letter, once. It is hidden here
      // rather than in the stylesheet, so this only happens if GSAP arrived.
      window.gsap.set('[data-glyph]', { opacity: 0, yPercent: 38 });
      window.gsap.to('[data-glyph]', {
        opacity: 1, yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.055, delay: 0.1
      });

      // Oversized project numerals drift against the scroll.
      $$('.numeral').forEach(function (n) {
        window.gsap.fromTo(n, { yPercent: -8 }, {
          yPercent: 14, ease: 'none',
          scrollTrigger: { trigger: n.parentNode, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
        });
      });

      // The closing statement arrives one line at a time, from behind its own mask.
      $$('.h-end .reveal-line').forEach(function (line, i) {
        var inner = document.createElement('span');
        inner.style.display = 'block';
        while (line.firstChild) inner.appendChild(line.firstChild);
        line.appendChild(inner);
        window.gsap.fromTo(inner, { yPercent: 105 }, {
          yPercent: 0, duration: 1.1, ease: 'expo.out', delay: i * 0.09,
          scrollTrigger: { trigger: '.sec--end', start: 'top 62%' }
        });
      });

      // The marquee reads faster while you scroll it — a physical cue, not a loop change.
      var track = $('.marquee__track');
      if (track) {
        window.gsap.fromTo(track, { xPercent: 0 }, {
          xPercent: -12, ease: 'none',
          scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 1 }
        });
      }
    } else if (lenis) {
      // Lenis without GSAP still needs a frame loop of its own.
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }

  /* --- 8. Vanta, for one section, on machines that can afford it ---------- */
  function initVanta() {
    var mount = $('[data-vanta]');
    if (!mount || !allowMotion || saveData) return;
    if (!finePointer.matches || window.innerWidth < 1000) return;
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) return;
    if (!('IntersectionObserver' in window)) return;

    var started = false;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      io.disconnect();
      load('assets/vendor/three.min.js', function () {
        if (!window.THREE) return;
        load('assets/vendor/vanta.net.min.js', function () {
          if (!window.VANTA || !window.VANTA.NET) return;
          window.VANTA.NET({
            el: mount,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: false,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            scale: 1,
            scaleMobile: 1,
            color: 0xff4d00,
            backgroundColor: 0x0d0d0f,
            points: 8,
            maxDistance: 21,
            spacing: 19,
            showDots: true
          });
        });
      });
    }, { rootMargin: '200px' });
    io.observe(mount);

    function load(src, cb) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = cb;
      s.onerror = function () { /* the section is complete without it */ };
      document.head.appendChild(s);
    }
  }

  /* --- boot --------------------------------------------------------------- */
  function boot() { initSmooth(); initVanta(); }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  // If the visitor turns reduced motion on mid-visit, stop adding to the page.
  if (reduced.addEventListener) {
    reduced.addEventListener('change', function (e) {
      if (e.matches) {
        root.classList.remove('anim');
        revealTargets.forEach(function (n) { n.classList.add('is-in'); });
      }
    });
  }
})();
