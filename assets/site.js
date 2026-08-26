/* ===========================================================================
   Connor Eppolito — portfolio and online résumé
   ---------------------------------------------------------------------------
   Enhancement only. Everything on every page is complete, readable, navigable
   and linkable with this file absent, blocked, or thrown out by an error.

   Seven small jobs:
     1. reveal-on-scroll for anything carrying [data-rise], [data-motion] or
        [data-scene]
     2. a hairline reading-progress bar
     3. closing the mobile menu on Escape, on outside click, and on navigation
     4. the global Motion On/Off control — the one switch in the masthead
     5. the Selected Work rail: which room you are in, how far through, and
        what colour the room the whole page is read in should be
     6. the contact card, which turns over
     7. the three lazy layers, and far more often the decision not to load them

   Jobs 1-6 are the site, and every one of them is small enough to live in the
   critical file. The hero's whole arrival choreography is CSS — this file only
   ends it when you touch something. Job 7 is an escalation that happens only
   after the useful page has painted, and only when the device, Save-Data and
   the visitor's own motion preference all say yes. No lazy module is ever
   required for a page to be complete.

   Nothing here hijacks scrolling, and nothing here plays sound.
   =========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  /* Where this file lives, so a dynamic import resolves against the script
     rather than against the document that happens to have loaded it. */
  var HERE = (function () {
    var self = document.currentScript;
    var src = self && self.src ? self.src : "";
    return src ? src.replace(/[^/]*$/, "") : "assets/";
  })();

  /* --- the reduced-motion contract ---------------------------------------- */

  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function still() {
    return !!(mq && mq.matches) || root.getAttribute("data-motion") === "off";
  }

  /* The stored preference may only ever make the site stiller than the system
     asked for. If the OS says reduce, nothing stored here can turn motion on. */
  var STORE = "ce-motion";
  try {
    if (window.localStorage && localStorage.getItem(STORE) === "off") {
      root.setAttribute("data-motion", "off");
    }
  } catch (e) {
    /* storage denied — the default, which is "follow the system", stands */
  }

  /* If the preference is turned on mid-visit, reveal everything immediately
     rather than leaving whatever had not scrolled into view hidden forever. */
  function revealAll() {
    var all = document.querySelectorAll("body [data-rise], body [data-motion], body [data-scene]");
    for (var i = 0; i < all.length; i++) all[i].classList.add("is-in");
  }

  if (mq && typeof mq.addEventListener === "function") {
    mq.addEventListener("change", function () {
      if (mq.matches) revealAll();
    });
  }

  /* --- 1. reveal on scroll ------------------------------------------------- */

  function reveals() {
    var targets = document.querySelectorAll("body [data-rise], body [data-motion], body [data-scene]");
    if (!targets.length) return;

    if (still() || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    for (var i = 0; i < targets.length; i++) {
      /* Anything already on screen at load reveals without waiting, so the
         first viewport is never a page of blank space. */
      var box = targets[i].getBoundingClientRect();
      if (box.top < window.innerHeight * 0.92) targets[i].classList.add("is-in");
      else io.observe(targets[i]);
    }
  }

  /* --- 2. reading progress ------------------------------------------------- */

  /* The reading-progress bar is the site's own signal, drawn as you read it:
     one continuous ECG across the top of the document, complete exactly when
     the document is. It only ever reports — it never steers. */
  function progress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar || still()) return;

    var ticking = false;

    function draw() {
      var doc = document.documentElement;
      var span = doc.scrollHeight - window.innerHeight;
      var pct = span > 40 ? (doc.scrollTop || document.body.scrollTop) / span : 0;
      pct = Math.max(0, Math.min(1, pct));
      bar.style.setProperty("--read", pct * 100 + "%");
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(draw);
      },
      { passive: true }
    );
    window.addEventListener("resize", draw, { passive: true });
    draw();
  }

  /* --- 3. the mobile menu -------------------------------------------------- */

  /* The menu is a <details> element, so it already opens and closes with this
     script absent. All that is added here is the three courtesies a native
     <details> does not do on its own. */
  function menu() {
    var d = document.querySelector("[data-menu]");
    if (!d) return;

    function close() {
      if (d.open) d.removeAttribute("open");
    }

    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape" || !d.open) return;
      close();
      var s = d.querySelector("summary");
      if (s) s.focus();
    });

    document.addEventListener("click", function (ev) {
      if (!d.open) return;
      if (d.contains(ev.target)) return;
      close();
    });

    /* A link to an anchor on this same page does not reload anything, so the
       panel would otherwise stay open over the thing it just scrolled to. */
    d.addEventListener("click", function (ev) {
      var a = ev.target.closest ? ev.target.closest("a") : null;
      if (a) close();
    });
  }

  /* --- 3b. arrival, and the right to interrupt it ------------------------- */

  /* The hero's whole entrance is CSS keyframes: it starts at first paint, it
     costs the main thread nothing, and it is finished inside about a second
     and a half. This function does exactly one thing — it ends the sequence
     the moment the visitor does anything at all, because nobody should have to
     wait out a piece of choreography to read a name. Adding .is-settled drops
     every animation and leaves the composed final frame, which is the frame
     the page was designed around anyway. */
  function arrival() {
    var scene = document.querySelector("[data-signal]");
    if (!scene) return;

    var done = false;
    function settle() {
      if (done) return;
      done = true;
      scene.classList.add("is-settled");
      window.removeEventListener("pointerdown", settle, true);
      window.removeEventListener("keydown", settle, true);
      window.removeEventListener("wheel", settle, true);
      window.removeEventListener("touchstart", settle, true);
      window.removeEventListener("scroll", settle, true);
    }

    if (still()) {
      settle();
      return;
    }

    window.setTimeout(settle, 2400);
    window.addEventListener("pointerdown", settle, true);
    window.addEventListener("keydown", settle, true);
    window.addEventListener("wheel", settle, { capture: true, passive: true });
    window.addEventListener("touchstart", settle, { capture: true, passive: true });
    window.addEventListener("scroll", settle, { capture: true, passive: true });
  }

  /* --- 3d. the Selected Work rail ------------------------------------------
     Six rooms, one spine. The rail's links are ordinary same-page anchors and
     stay that way: all this does is report which room you are in — aria-current
     on the matching link, the room's accent on the rail, and how far through
     the six you have read, as a stroke length on the spine.

     It never converts the articles into tabs, never hides an inactive one and
     never competes with the scroll position for authority. */
  function theatre() {
    var host = document.querySelector("[data-theatre]");
    if (!host || !("IntersectionObserver" in window)) return;

    var rooms = [].slice.call(host.querySelectorAll("[data-wk]"));
    var links = [].slice.call(host.querySelectorAll("[data-rail]"));
    var spine = host.querySelector("[data-spine]");
    var counter = host.querySelector("[data-rail-n]");
    if (!rooms.length) return;

    var active = "";
    function mark(name) {
      if (name === active) return;
      active = name;
      var n = 0;
      for (var i = 0; i < links.length; i++) {
        var on = links[i].getAttribute("data-rail") === name;
        if (on) {
          links[i].setAttribute("aria-current", "true");
          n = i + 1;
        } else {
          links[i].removeAttribute("aria-current");
        }
      }
      var room = host.querySelector('[data-wk="' + name + '"]');
      if (room) {
        host.setAttribute("data-accent", room.getAttribute("data-accent") || "");
        /* And the room the whole page is read in follows what you are reading.
           The colour is taken from the room's own computed accent rather than
           from a second list of hex values kept in step by hand, and it goes
           out through the document so the shader can answer without either
           side knowing the other is there. */
        var hue = getComputedStyle(room).getPropertyValue("--accent");
        if (hue) {
          document.dispatchEvent(new CustomEvent("ce:room", {
            detail: {
              accent: hue.trim(),
              optics: { interference: 0.8 + (n % 3) * 0.35, refraction: 0.78 + (n % 4) * 0.2 }
            }
          }));
        }
      }
      if (counter) counter.textContent = n < 10 ? "0" + n : String(n);
      if (spine) spine.style.setProperty("--spine", rooms.length ? n / rooms.length : 0);
    }

    var io = new IntersectionObserver(
      function (entries) {
        /* The room whose middle is nearest the middle of the viewport wins.
           Reading the DOM order rather than the entry order keeps the answer
           stable when two rooms are on screen at once. */
        var best = null;
        var mid = window.innerHeight / 2;
        for (var i = 0; i < rooms.length; i++) {
          var b = rooms[i].getBoundingClientRect();
          if (b.bottom < 0 || b.top > window.innerHeight) continue;
          var d = Math.abs(b.top + b.height / 2 - mid);
          if (!best || d < best.d) best = { d: d, el: rooms[i] };
        }
        if (best) mark(best.el.getAttribute("data-wk"));
        void entries;
      },
      { rootMargin: "-20% 0px -20% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    for (var i = 0; i < rooms.length; i++) io.observe(rooms[i]);
  }

  /* --- 3e. the card, and turning it over -----------------------------------
     Both faces are real content and both are in the document. All this does is
     decide which one you are looking at, and — the part that actually matters —
     take the other one out of the tab order while it is facing away. A link
     that is invisible but still focusable is worse than no link at all: it
     sends a keyboard visitor somewhere they cannot see.

     `inert` does the whole job in one attribute where it exists. Where it does
     not, the fallback is tabindex + aria-hidden, which is the same contract
     spelled out longhand. */
  function card() {
    var stage = document.querySelector("[data-vcard]");
    if (!stage) return;
    var body = stage.querySelector("[data-vcard-body]");
    var btn = document.querySelector("[data-vcard-flip]");
    if (!body || !btn) return;

    var faces = {
      front: stage.querySelector('[data-vc-face="front"]'),
      back: stage.querySelector('[data-vc-face="back"]')
    };
    var label = btn.querySelector("[data-vc-label]");
    var supportsInert = "inert" in HTMLElement.prototype;
    var turned = false;

    function away(face, off) {
      if (!face) return;
      if (supportsInert) {
        face.inert = off;
      } else {
        var links = face.querySelectorAll("a[href], button");
        for (var i = 0; i < links.length; i++) {
          if (off) links[i].setAttribute("tabindex", "-1");
          else links[i].removeAttribute("tabindex");
        }
      }
      face.setAttribute("aria-hidden", off ? "true" : "false");
    }

    function paint() {
      body.style.setProperty("--turn", turned ? "1" : "0");
      btn.setAttribute("aria-pressed", turned ? "true" : "false");
      if (label) label.textContent = turned ? "Turn the card back" : "Turn the card over";
      away(faces.front, turned);
      away(faces.back, !turned);
    }

    btn.addEventListener("click", function () {
      turned = !turned;
      paint();
      /* Focus follows the card: whichever face is now facing you is the one a
         keyboard should be able to walk into next. */
      if (turned && faces.back) {
        var first = faces.back.querySelector("a[href]");
        if (first && document.activeElement === btn) {
          /* Only once the half-turn has actually shown it — moving focus onto
             something the visitor cannot see yet is the same bug, early. */
          window.setTimeout(function () {
            if (turned) first.focus({ preventScroll: true });
          }, still() ? 0 : 620);
        }
      }
    });

    paint();
  }

  /* --- 4. the motion control ----------------------------------------------- */

  /* Two things on this site move for longer than five seconds — the atmosphere
     plane and the projection in the hero — and this is the switch that stops
     both. It is a real button with a real pressed state, it is reachable from
     the keyboard, it is the same control on every page, and since the sound
     control was removed it is the only one in the masthead. */
  var cinema = { atmos: null, pulse: null, holo: null };

  function motionControls() {
    var btns = document.querySelectorAll("[data-motion-toggle]");
    if (!btns.length) return;

    function paint() {
      var off = root.getAttribute("data-motion") === "off";
      for (var i = 0; i < btns.length; i++) btns[i].setAttribute("aria-pressed", off ? "true" : "false");
    }

    function toggle() {
      var off = root.getAttribute("data-motion") !== "off";
      root.setAttribute("data-motion", off ? "off" : "auto");
      try {
        if (window.localStorage) localStorage.setItem(STORE, off ? "off" : "auto");
      } catch (e) {}
      paint();
      if (off) {
        teardown();
        revealAll();
      } else {
        cinematics();
      }
    }

    for (var i = 0; i < btns.length; i++) btns[i].addEventListener("click", toggle);
    paint();
  }

  function teardown() {
    if (cinema.atmos && cinema.atmos.destroy) cinema.atmos.destroy();
    if (cinema.pulse && cinema.pulse.destroy) cinema.pulse.destroy();
    if (cinema.holo && cinema.holo.destroy) cinema.holo.destroy();
    cinema.atmos = null;
    cinema.pulse = null;
    cinema.holo = null;
    var c = document.querySelector("[data-atmos-slot] canvas");
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  /* --- 5. the cinematic layer ---------------------------------------------- */

  function saveData() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !!(c && c.saveData);
  }

  function webglOK() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  /* Every gate, in one place, so what does and does not get a shader is a
     matter of record rather than of guesswork.

     These are deliberately looser than they were. The plane used to require a
     fine pointer, a viewport of at least 1000 px, and a browser that reports
     `deviceMemory` at 4 GB or more — which withheld it from every phone, every
     tablet, and from Safari on any machine at all, because Safari does not
     implement `deviceMemory`. That is most of the visitors to this site, and
     what they were being protected from was two radial gradients' worth of GPU
     work: the module renders at device pixel ratio 1 below 900 px, stops when
     the tab is behind something, and is one triangle either way.

     So the gates that remain are the ones that mean something. Reduced motion
     and Save-Data are somebody telling you not to. No WebGL is the browser
     telling you it cannot. A browser that *does* report its memory and reports
     less than 4 GB is a device telling you it is small, and that answer is
     still honoured — what is no longer honoured is silence, because silence
     from Safari is not a small device. */
  function mayRenderShader() {
    var mem = navigator.deviceMemory;
    return (
      !still() &&
      window.innerWidth >= 360 &&
      (typeof mem !== "number" || mem >= 4) &&
      !saveData() &&
      webglOK()
    );
  }

  /* The pulse layer is an effect, not a control, so it answers to the effect
     gates — but only to the two that apply to every device. It runs on a
     phone, because the part of it that matters most there is the part that
     needs no pointer at all: the trace across the top of the page answering
     how hard you are scrolling. The pointer-only features gate themselves
     inside the module. */
  function mayPulse() {
    return !still() && !saveData();
  }

  /* Same two gates for the hologram driver. It is two kilobytes with no
     dependency, and the object it drives is already standing, orbiting and
     scanning before it is asked for — so the only thing this decides is
     whether the projection answers a hand. */
  function mayHolo() {
    return !still() && !saveData();
  }

  function cinematics() {
    /* THE PULSE. Every page, not just the home page — that is the whole point
       of it. Roughly two kilobytes, no dependency, and it writes three custom
       properties onto <html> and then gets out of the way. */
    if (mayPulse() && !cinema.pulse) {
      import(HERE + "vendor/pulse.js")
        .then(function (m) {
          if (still() || !mayPulse()) return;
          cinema.pulse = m.mount(document.documentElement);
        })
        .catch(function () {
          /* Every page is already the composition it was designed to be. */
        });
    }

    /* THE HOLOGRAM. Only where there is one to drive, which is the home page. */
    var holoHost = document.querySelector("[data-holo]");
    if (holoHost && mayHolo() && !cinema.holo) {
      import(HERE + "vendor/holo.js")
        .then(function (m) {
          if (still() || !mayHolo()) return;
          cinema.holo = m.mount(holoHost);
        })
        .catch(function () {
          /* The projection stands, orbits and scans on keyframes alone. */
        });
    }

    /* THE ATMOSPHERE. The fixed plane every page already carries, for the
       whole scroll rather than for one screenful behind one hero. */
    if (mayRenderShader() && !cinema.atmos) {
      var slot = document.querySelector("[data-atmos-slot]");
      if (!slot) return;
      import(HERE + "vendor/atmosphere.js")
        .then(function (m) {
          if (still() || !mayRenderShader()) return;
          var canvas = document.createElement("canvas");
          canvas.className = "atmos__canvas";
          canvas.setAttribute("aria-hidden", "true");
          /* Decorative, never focusable, never above the content it sits behind. */
          slot.appendChild(canvas);
          cinema.atmos = m.mount(canvas, {
            /* The plane is the same on every page. What is not the same is how
               loud it may be over the top of one: a page built around a hero
               can carry the loud version for a screenful, and a page that opens
               on a paragraph cannot. */
            lift: document.querySelector("[data-signal]") ? 2.7 : 1,
            onLost: function () {
              cinema.atmos = null;
              if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
          });
        })
        .catch(function () {});
    }
  }

  /* One wire between what is being read and the room it is read in, and it
     runs through the document rather than through an import: the rail
     announces which project you are in and whoever is listening answers.
     Neither side knows the other is there, so either can be absent without the
     other noticing. */
  document.addEventListener("ce:room", function (ev) {
    if (cinema.atmos && cinema.atmos.tune) cinema.atmos.tune(ev.detail);
  });

  /* After the useful site. Never before it, and never during it. */
  function scheduleCinematics() {
    var go = function () {
      try {
        cinematics();
      } catch (e) {}
    };
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 2400 });
    else setTimeout(go, 900);
  }

  /* --- start --------------------------------------------------------------- */

  function start() {
    try {
      reveals();
      progress();
      menu();
      motionControls();
      arrival();
      theatre();
      card();
    } catch (err) {
      /* A failure in any of the above must never leave content hidden. */
      revealAll();
      if (window.console && console.warn) console.warn("site.js:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  /* Last-ditch failsafe: if something above threw before the observer was
     wired, nothing stays invisible past first paint. */
  window.addEventListener("load", function () {
    var hidden = document.querySelectorAll("[data-rise]:not(.is-in)");
    if (hidden.length && !("IntersectionObserver" in window)) revealAll();
    scheduleCinematics();
  });

  /* Turning the system preference on mid-visit stops the renderer outright,
     rather than leaving a shader running behind somebody who asked for still. */
  if (mq && typeof mq.addEventListener === "function") {
    mq.addEventListener("change", function () {
      if (mq.matches) teardown();
      else scheduleCinematics();
    });
  }

  window.addEventListener("pagehide", teardown);
})();
