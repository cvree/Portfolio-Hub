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
     4. the global Motion On/Off control
     5. the hero's three domain controls — CARE, BUILD, COMPETE
     6. the Selected Work rail: which room you are in, and how far through
     7. the two lazy layers, and far more often the decision not to load them

   Jobs 1-6 are the site, and every one of them is small enough to live in the
   critical file. The hero's whole arrival choreography is CSS — this file only
   ends it when you touch something. Job 7 is an escalation that happens only
   after the useful page has painted, and only when the device, the pointer,
   the viewport, the reported memory, Save-Data and the visitor's own motion
   preference all say yes. Neither lazy module is ever required for the page to
   be complete.

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
    var all = document.querySelectorAll("[data-rise], [data-motion], [data-scene]");
    for (var i = 0; i < all.length; i++) all[i].classList.add("is-in");
  }

  if (mq && typeof mq.addEventListener === "function") {
    mq.addEventListener("change", function () {
      if (mq.matches) revealAll();
    });
  }

  /* --- 1. reveal on scroll ------------------------------------------------- */

  function reveals() {
    var targets = document.querySelectorAll("[data-rise], [data-motion], [data-scene]");
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

  /* --- 3c. the three domains ------------------------------------------------
     CARE, BUILD, COMPETE. A radio group with a roving tabindex, arrow keys
     that move and commit as they go, and a persistent, unambiguous selection.

     This lives in the critical file rather than in a lazy bundle on purpose:
     it is a control, not an effect. A control that only works once a second
     request has landed is a control that does not work. It has no dependency,
     it is a few hundred bytes, and it answers to pointer, touch and keyboard
     identically. Turning motion off does not take it away — it only makes the
     change instant, which is what stillness means here. */
  function domains() {
    var host = document.querySelector("[data-signal]");
    if (!host) return;
    var group = host.querySelector("[data-domains]");
    if (!group) return;

    var opts = [].slice.call(group.querySelectorAll("[data-dom]"));
    if (!opts.length) return;
    var proofs = [].slice.call(host.querySelectorAll("[data-proof]"));

    /* What each domain does to the field behind the sculpture. The colours are
       the same three the stylesheet holds; they are repeated here because the
       shader is given a value, not a selector. */
    var FIELD = {
      care:    { accent: "#17a08f", optics: { interference: 1.0, refraction: 1.0 } },
      build:   { accent: "#4c6fe8", optics: { interference: 1.5, refraction: 0.78 } },
      compete: { accent: "#d9a94a", optics: { interference: 0.72, refraction: 1.34 } }
    };
    var requick = 0;

    function commit(name) {
      if (!name || host.getAttribute("data-domain") === name) return;
      host.setAttribute("data-domain", name);

      for (var j = 0; j < proofs.length; j++) {
        if (proofs[j].getAttribute("data-proof") === name) proofs[j].setAttribute("data-active", "");
        else proofs[j].removeAttribute("data-active");
      }

      /* The trace is redrawn rather than dissolved: the new signature is
         written across the viewport the way a monitor would write it. Removing
         the class and forcing a reflow is what restarts the animation. */
      if (!still()) {
        host.classList.remove("is-tuning");
        void host.offsetWidth;
        host.classList.add("is-tuning");
        if (requick) window.clearTimeout(requick);
        requick = window.setTimeout(function () {
          host.classList.remove("is-tuning");
        }, 760);
      }

      /* One wire out, through the document rather than through an import, so
         the shader can answer without either module knowing the other is
         there. */
      var detail = FIELD[name] || {};
      document.dispatchEvent(new CustomEvent("ce:domain", {
        detail: { domain: name, accent: detail.accent, optics: detail.optics }
      }));

      /* The detent lands on the press; the QRS answers it a beat later. Both
         are silent unless somebody has turned sound on. */
      play("detent");
      window.setTimeout(function () {
        document.dispatchEvent(new CustomEvent("ce:qrs"));
      }, 180);
    }

    /* The controls are real radio inputs in a real fieldset, so the arrow
       keys, the roving focus, the group semantics and the announced state all
       come from the browser rather than from a re-implementation of them here.
       This listener is the whole of the wiring. */
    group.addEventListener("change", function (ev) {
      var el = ev.target;
      if (el && el.getAttribute && el.getAttribute("data-dom")) commit(el.value);
    });
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
      if (room) host.setAttribute("data-accent", room.getAttribute("data-accent") || "");
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

  /* --- 4. the motion control ----------------------------------------------- */

  /* Any atmospheric movement on this site that runs longer than five seconds
     is the shader plane, and this is the switch that stops it. It is a real
     button with a real pressed state, it is reachable from the keyboard, and
     it is the same control on every page. */
  var cinema = { atmos: null, parallax: null };

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
        stopBeat();
      } else {
        cinematics();
      }
    }

    for (var i = 0; i < btns.length; i++) btns[i].addEventListener("click", toggle);
    paint();
  }

  function teardown() {
    if (cinema.atmos && cinema.atmos.destroy) cinema.atmos.destroy();
    if (cinema.parallax && cinema.parallax.destroy) cinema.parallax.destroy();
    cinema.atmos = null;
    cinema.parallax = null;
    var c = document.querySelector("[data-atmos-slot] canvas");
    if (c && c.parentNode) c.parentNode.removeChild(c);
  }

  /* --- 4b. sound ------------------------------------------------------------
     Every tone on this site is an oscillator and an envelope, built in the
     browser when it is needed. Nothing is downloaded, nothing is a file, and
     nothing makes a sound until somebody presses the control that says it
     will — so the promise on the Manifester page, that nothing here autoplays
     sound, stays literally true.

     The context is not even constructed until the first press, because an
     AudioContext created without a gesture is a context the browser is going
     to suspend anyway. */

  var SOUND_STORE = "ce-sound";
  var audio = { ctx: null, on: false, bus: null };

  function tone(freq, dur, type, peak, at) {
    if (!audio.ctx || !audio.on) return;
    var t = at || audio.ctx.currentTime;
    var osc = audio.ctx.createOscillator();
    var env = audio.ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak || 0.06, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env);
    env.connect(audio.bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /* Three sounds, and only three. The monitor's blip, the detent of a channel
     committing, and the trace flattening on a navigation. Anything else would
     be decoration with a volume control. */
  var SFX = {
    beat: function () { tone(1180, 0.09, "sine", 0.05); tone(590, 0.06, "sine", 0.025); },
    detent: function () { tone(320, 0.05, "triangle", 0.05); tone(1600, 0.03, "sine", 0.018); },
    iris: function () { tone(190, 0.24, "sine", 0.05); tone(95, 0.3, "sine", 0.035); }
  };

  function play(name) {
    if (!audio.on || still()) return;
    try {
      if (SFX[name]) SFX[name]();
    } catch (e) {}
  }

  /* The blip lands when the sweep reaches the QRS — one beat per sweep, when
     the trace is actually drawing. A metronome running under a portfolio is
     not sound design, it is a smoke alarm. */
  var beatTimer = 0;
  function beatOnce(rate) {
    if (!audio.on || still()) return;
    if (beatTimer) window.clearTimeout(beatTimer);
    beatTimer = window.setTimeout(function () {
      play("beat");
    }, (rate || 2.6) * 260);
  }
  function stopBeat() {
    if (beatTimer) window.clearTimeout(beatTimer);
    beatTimer = 0;
  }

  function sound() {
    var btns = document.querySelectorAll("[data-sound-toggle]");
    if (!btns.length) return;

    /* The control only appears once a script is running, because with no
       script there is nothing for it to switch on. */
    for (var i = 0; i < btns.length; i++) btns[i].removeAttribute("hidden");

    function paint() {
      for (var j = 0; j < btns.length; j++) {
        btns[j].setAttribute("aria-pressed", audio.on ? "true" : "false");
      }
    }

    function toggle() {
      audio.on = !audio.on;
      try {
        if (window.localStorage) localStorage.setItem(SOUND_STORE, audio.on ? "on" : "off");
      } catch (e) {}

      if (audio.on) {
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!audio.ctx && AC) {
            audio.ctx = new AC();
            audio.bus = audio.ctx.createGain();
            audio.bus.gain.value = 0.5;
            audio.bus.connect(audio.ctx.destination);
          }
          if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
        } catch (e) {
          audio.on = false;
        }
        play("detent");
      } else {
        stopBeat();
      }
      paint();
    }

    for (var k = 0; k < btns.length; k++) btns[k].addEventListener("click", toggle);
    paint();

    /* A stored "on" is deliberately not honoured on load: a page that starts
       making noise because of something you did on a previous visit is a page
       that autoplays sound, whatever the reason. The stored value only decides
       what the control looks like the moment you reach for it. */

    /* One quiet two-note response to the QRS, and only if sound is on and the
       arrival is actually playing. Scrolling past a project boundary makes no
       sound at all: a noise per section is a smoke alarm, not sound design. */
    document.addEventListener("ce:qrs", function (ev) {
      play("beat");
      void ev;
    });

    /* Stop the moment the tab is not in front of somebody. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopBeat();
    });
    window.addEventListener("pagehide", stopBeat);
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

  /* The pointer parallax is an effect, not a control, so it answers to the
     effect gates: a fine pointer to move it with, a viewport wide enough for
     the separation to read, and a visitor who has not asked for less data or
     less movement. */
  function mayMoveParallax() {
    return !still() && fine() && window.innerWidth >= 1000 && !saveData();
  }

  function cinematics() {
    var section = document.querySelector("[data-signal]");
    if (!section || still()) return;

    /* The sculpture separates under the pointer by a few pixels and the trace
       bends locally by a few more. That is the whole module: no timeline, no
       dependency, and nothing it does is load-bearing. */
    if (mayMoveParallax() && !cinema.parallax) {
      import(HERE + "vendor/signal.js")
        .then(function (m) {
          if (still() || !mayMoveParallax()) return;
          cinema.parallax = m.mount(section);
        })
        .catch(function () {
          /* The assembled sculpture is already on screen, exactly as composed. */
        });
    }

    if (mayRenderShader() && !cinema.atmos) {
      var slot = section.querySelector("[data-atmos-slot]");
      if (!slot) return;
      import(HERE + "vendor/atmosphere.js")
        .then(function (m) {
          if (still() || !mayRenderShader()) return;
          var canvas = document.createElement("canvas");
          canvas.className = "sig__canvas";
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

  /* One wire between the domain control and the shader, and it runs through
     the document rather than through an import: the control announces itself
     and whoever is listening answers. Neither module knows the other is there,
     so either can be absent without the other noticing. */
  document.addEventListener("ce:domain", function (ev) {
    if (cinema.atmos && cinema.atmos.tune) cinema.atmos.tune(ev.detail);
    if (cinema.parallax && cinema.parallax.tune) cinema.parallax.tune(ev.detail);
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
      sound();
      arrival();
      domains();
      theatre();
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

  /* The trace flattens between documents, so a navigation gets that tone. */
  document.addEventListener("click", function (ev) {
    if (!audio.on) return;
    var a = ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/^(https?:|mailto:|#)/.test(href)) return;
    play("iris");
  });

  window.addEventListener("pagehide", teardown);
})();
