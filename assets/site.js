/* ===========================================================================
   Connor Eppolito — portfolio and online résumé
   ---------------------------------------------------------------------------
   Enhancement only. Everything on every page is complete, readable, navigable
   and linkable with this file absent, blocked, or thrown out by an error.

   Five small jobs:
     1. reveal-on-scroll for anything carrying [data-rise] or [data-motion]
     2. a hairline reading-progress bar
     3. closing the mobile menu on Escape, on outside click, and on navigation
     4. the global Motion On/Off control
     5. the cinematic layer — and, far more often, the decision not to load it
     6. the home page's channel selector, which is a control rather than a
        decoration and therefore has a much looser gate than the shader does

   Jobs 1-3 are the site. Job 5 is an escalation that is allowed to happen only
   after the useful page has painted, and only when the device, the pointer,
   the viewport, the reported memory, Save-Data and the visitor's own motion
   preference all say yes. Neither cinematic bundle is in the critical path and
   neither is ever required for the page to be complete.

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
    var all = document.querySelectorAll("[data-rise], [data-motion]");
    for (var i = 0; i < all.length; i++) all[i].classList.add("is-in");
  }

  if (mq && typeof mq.addEventListener === "function") {
    mq.addEventListener("change", function () {
      if (mq.matches) revealAll();
    });
  }

  /* --- 1. reveal on scroll ------------------------------------------------- */

  function reveals() {
    var targets = document.querySelectorAll("[data-rise], [data-motion]");
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

  function progress() {
    var bar = document.querySelector("[data-progress]");
    if (!bar || still()) return;

    var ticking = false;

    function draw() {
      var doc = document.documentElement;
      var span = doc.scrollHeight - window.innerHeight;
      var pct = span > 40 ? (doc.scrollTop || document.body.scrollTop) / span : 0;
      bar.style.width = Math.max(0, Math.min(1, pct)) * 100 + "%";
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

  /* --- 4. the motion control ----------------------------------------------- */

  /* Any atmospheric movement on this site that runs longer than five seconds
     is the shader plane, and this is the switch that stops it. It is a real
     button with a real pressed state, it is reachable from the keyboard, and
     it is the same control on every page. */
  var cinema = { atmos: null, aperture: null, channel: null };

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
    if (cinema.aperture && cinema.aperture.destroy) cinema.aperture.destroy();
    cinema.atmos = null;
    cinema.aperture = null;
    /* The channel is a control, not a movement. Turning motion off makes the
       retune instant; it does not take the instrument away. */
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

  function fine() {
    return !!(window.matchMedia && window.matchMedia("(pointer: fine)").matches);
  }

  /* Every gate, in one place, so what does and does not get a shader is a
     matter of record rather than of guesswork. An unavailable capability is
     read as a no: deviceMemory that a browser declines to report means the
     static composition, not a gamble on the hardware. */
  function mayRenderShader() {
    return (
      !still() &&
      fine() &&
      window.innerWidth >= 1000 &&
      typeof navigator.deviceMemory === "number" &&
      navigator.deviceMemory >= 4 &&
      !saveData() &&
      webglOK()
    );
  }

  function mayRunTimeline() {
    return !still() && fine() && window.innerWidth >= 1000 && !saveData();
  }

  /* The channel selector answers to one gate and one only: did the visitor
     ask for less data? It runs on a phone, on a keyboard, on a slow machine
     and under reduced motion, because it is the page's one real control and
     withholding a control is not the same as withholding an effect. Somebody
     who asked for Save-Data keeps the six links, which navigate to the same
     six case studies and cost nothing extra at all. */
  function mayWireChannel() {
    return !saveData();
  }

  function channels() {
    var section = document.querySelector("[data-aperture] [data-channel-strip]");
    if (!section || cinema.channel || !mayWireChannel()) return;
    var host = document.querySelector("[data-aperture]");
    import(HERE + "vendor/channel.js")
      .then(function (m) {
        cinema.channel = m.mount(host);
      })
      .catch(function () {
        /* Six links to six case studies, which is what the document already
           holds. Nothing to undo and nothing to apologise for. */
      });
  }

  function cinematics() {
    var section = document.querySelector("[data-aperture]");
    if (!section || still()) return;

    if (mayRunTimeline() && !cinema.aperture) {
      import(HERE + "vendor/aperture.js")
        .then(function (m) {
          if (still()) return;
          cinema.aperture = m.mount(section);
        })
        .catch(function () {
          /* The static composition is the fallback, and it is already on screen. */
        });
    }

    if (mayRenderShader() && !cinema.atmos) {
      var slot = section.querySelector("[data-atmos-slot]");
      if (!slot) return;
      import(HERE + "vendor/atmosphere.js")
        .then(function (m) {
          if (still() || !mayRenderShader()) return;
          var canvas = document.createElement("canvas");
          canvas.className = "ap__canvas";
          canvas.setAttribute("aria-hidden", "true");
          /* Decorative, never focusable, never above the content it sits behind. */
          slot.appendChild(canvas);
          cinema.atmos = m.mount(canvas, {
            onLost: function () {
              cinema.atmos = null;
              if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
          });
        })
        .catch(function () {});
    }
  }

  /* One wire between the two, and it runs through the document rather than
     through an import: the channel announces itself, and whoever is listening
     — today, the shader plane — answers. Neither module knows the other is
     there, so either can be absent without the other noticing. */
  document.addEventListener("ce:channel", function (ev) {
    if (cinema.atmos && cinema.atmos.tune) cinema.atmos.tune(ev.detail);
  });

  /* After the useful site. Never before it, and never during it. */
  function scheduleCinematics() {
    var go = function () {
      try {
        channels();
      } catch (e) {}
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
