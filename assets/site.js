/* ===========================================================================
   Connor Eppolito — portfolio and online résumé
   ---------------------------------------------------------------------------
   Enhancement only. Everything on every page is complete, readable, navigable
   and linkable with this file absent, blocked, or thrown out by an error.

   Fourteen small jobs:
     1. reveal-on-scroll for anything carrying [data-rise], [data-motion] or
        [data-scene]
     2. a hairline reading-progress bar
     3. closing the mobile menu on Escape, on outside click, and on navigation
     4. the global Motion On/Off control — the one switch in the masthead
     5. the Projects rail: which room you are in, how far through, and
        what colour the room the whole page is read in should be
     6. the glide: an eased, interruptible scroll for same-page links, and the
        composed arrival for a URL that turns up carrying a fragment
     7. the contact card, which turns over
     8. the three lazy layers, and far more often the decision not to load them,
        and telling the atmosphere where on the screen the words currently are
     9. the reply: one call that answers in the rail and to a screen reader at
        the same moment
    10. the receipt: copying, and the proof that it happened — including the
        anchor beside every heading on the site
    11. the return: a dial that reports how far down a document you are, and
        goes back to the top of it
    12. the chapters: a document's own contents, built from the document,
        reporting position and never steering
    13. the magnets: four pixels of travel on the controls that are the point
        of the page they are on
    14. the console: ⌘K, / , or the control in the masthead — one field, and
        every page, product and section on this site is one key away

   Jobs 1-7 and 9-13 are the site, and every one of them is small enough to
   live in the critical file. The hero's whole arrival choreography is CSS —
   this file only ends it when you touch something. Jobs 8 and 14 are
   escalations that happen only after the useful page has painted: the
   cinematic layer when the device, Save-Data and the visitor's own motion
   preference all say yes, and the console the first time somebody reaches for
   it. No lazy module is ever required for a page to be complete, and every
   place the console can travel to is an ordinary URL that is in the navigation
   or the footer as well.

   Nothing here holds the scroll against you, and nothing here plays sound. The
   two things that move the page on their own are jobs 6 and 11; both run only
   because something was pressed, and the first wheel notch, touch or key ends
   them.
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
    /* The bar is continuous movement and answers to the motion preference. The
       dial and the chapters are reports, not motion: they are how far down a
       document somebody is, and withholding that from a visitor who asked for
       stillness would be withholding information rather than movement. */
    if (still()) bar = null;

    var ticking = false;

    function draw() {
      var doc = document.documentElement;
      var span = doc.scrollHeight - window.innerHeight;
      var y = doc.scrollTop || document.body.scrollTop;
      var pct = span > 40 ? y / span : 0;
      pct = Math.max(0, Math.min(1, pct));
      if (bar) bar.style.setProperty("--read", pct * 100 + "%");
      if (dial) {
        dial.style.setProperty("--read-pct", (pct * 100).toFixed(1));
        /* One and a bit screens down is the point at which the top of the
           document has stopped being somewhere you can simply look up at. */
        var up = y > window.innerHeight * 1.4;
        dial.classList.toggle("is-up", up);
        dial.setAttribute("aria-hidden", up ? "false" : "true");
        dial.tabIndex = up ? 0 : -1;
      }
      markChapter();
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

  /* --- 3d. the Projects rail ------------------------------------------------
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

  /* --- 3d2. the glide -------------------------------------------------------
     There is one page on this site now where "Projects" is a place rather than
     a document, and a place has to be arrived at rather than cut to. This is
     the whole of that: an eased scroll that any same-page link hands its
     destination to, and that gives up the instant the visitor does anything
     at all.

     It is not a scroll hijack. It never listens to the wheel to decide where
     the page goes, it never holds a position against you, and it owns the
     scroll for at most a second — the first wheel notch, touch, key or click
     cancels it mid-flight and hands the page straight back. With reduced
     motion asked for, or with this file absent, `scroll-behavior:smooth` and
     `scroll-padding-top` in the stylesheet do the same job in one hop, which
     is why nothing below is required for a fragment link to work. */
  var flight = null;

  /* `window.scrollTo(x, y)` honours the CSS `scroll-behavior` of the scrolling
     element, and this stylesheet sets that to `smooth` — so every frame of the
     eased scroll below would kick off its own second, native, eased scroll
     toward the same place, and the two would compound into something neither
     of them meant. For exactly as long as a flight owns the scroll, the
     document's own behaviour is `auto` and this file is the only thing easing
     anything; the moment the flight ends, the stylesheet has it back. */
  function ownScroll(on) {
    root.style.scrollBehavior = on ? "auto" : "";
  }

  function landing() {
    /* One number, and the stylesheet owns it: --land is what clears the
       sticky masthead, and reading it back means this file never carries a
       second copy of the masthead's height. */
    var pad = parseFloat(getComputedStyle(root).scrollPaddingTop);
    return isFinite(pad) ? pad : 0;
  }

  function restAt(el) {
    var own = parseFloat(getComputedStyle(el).scrollMarginTop);
    var y = el.getBoundingClientRect().top + (window.pageYOffset || root.scrollTop);
    return y - landing() - (isFinite(own) ? own : 0);
  }

  function glideTo(y) {
    var ceiling = Math.max(0, root.scrollHeight - window.innerHeight);
    y = Math.max(0, Math.min(ceiling, y));
    var from = window.pageYOffset || root.scrollTop;
    var span = y - from;

    if (still() || Math.abs(span) < 2 || !window.requestAnimationFrame) {
      flight = null;
      ownScroll(true);
      window.scrollTo(0, y);
      ownScroll(false);
      return;
    }

    /* Long enough to read as travel, short enough never to be a wait. The
       duration follows the distance and is bounded at both ends, so a hop to
       the next section and a jump across the whole document both feel like
       the same page moving at the same speed. */
    var ms = Math.max(420, Math.min(1150, 280 + Math.abs(span) * 0.34));
    var t0 = null;
    var mine = (flight = {});

    function frame(t) {
      if (flight !== mine) return;
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / ms);
      /* Leaves at rest and arrives at rest, symmetrically. Anything that
         starts at speed reads as a jump that was slowed down. */
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, from + span * e);
      if (k < 1) {
        window.requestAnimationFrame(frame);
      } else {
        flight = null;
        ownScroll(false);
      }
    }

    ownScroll(true);
    window.requestAnimationFrame(frame);
  }

  /* The page belongs to whoever is holding it. Any of these and the glide is
     over — not paused, over. */
  function release() {
    if (!flight) return;
    flight = null;
    ownScroll(false);
  }

  function focusLanding(el) {
    if (el.tabIndex < 0 && !el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
      el.addEventListener(
        "blur",
        function () {
          el.removeAttribute("tabindex");
        },
        { once: true }
      );
    }
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      /* a browser without the options bag would scroll; better not to focus */
    }
  }

  function fragment(hash) {
    if (!hash || hash.length < 2) return null;
    var id;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch (e) {
      id = hash.slice(1);
    }
    return document.getElementById(id) || null;
  }

  function anchors() {
    var quit = ["wheel", "touchstart", "pointerdown", "keydown"];
    for (var i = 0; i < quit.length; i++) {
      window.addEventListener(quit[i], release, { capture: true, passive: true });
    }

    document.addEventListener("click", function (ev) {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

      var a = ev.target.closest ? ev.target.closest("a[href]") : null;
      if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      /* The skip link is the one same-page link that must not travel: its
         whole purpose is to be over before you notice it. */
      if (a.classList.contains("skip")) return;
      if (a.protocol !== location.protocol || a.host !== location.host) return;
      if (a.pathname !== location.pathname || a.search !== location.search) return;

      var el = fragment(a.hash);
      if (!el) return;

      ev.preventDefault();
      /* The address bar is right immediately, so a link copied mid-glide is
         the link to where the page is going. */
      if (window.history && history.pushState) history.pushState(null, "", a.hash);
      else location.hash = a.hash;
      focusLanding(el);
      glideTo(restAt(el));
    });
  }

  /* --- 3d3. arriving on a fragment ------------------------------------------
     Projects is a place on the home page, and every route to it — the
     masthead, the footer, a case study's own way back — is a URL carrying
     #work. A browser answers that by cutting straight to it, which tells a
     visitor nothing about what they landed in the middle of.

     So the arrival is composed: the page is put down a screenful above its
     destination and glides the last stretch, which is exactly the amount of
     travel that says "this is further down the same page" and not one pixel
     more. It runs before anything else measures the document, so nothing has
     to be re-measured after it. */
  function arrive() {
    var el = fragment(location.hash);
    if (!el || still()) return;

    if (window.history && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    var target = restAt(el);
    var start = Math.max(0, target - window.innerHeight * 1.15);
    if (target - start < 40) return;

    ownScroll(true);
    window.scrollTo(0, start);
    window.requestAnimationFrame(function () {
      glideTo(restAt(el));
    });
  }

  /* --- 3e. the card, and turning it over -----------------------------------
     Both faces are real content and both are in the document. All this does is
     decide which one you are looking at, and — the part that actually matters —
     take the other one out of the tab order while it is facing away. A link
     that is invisible but still focusable is worse than no link at all: it
     sends a keyboard visitor somewhere they cannot see.

     `inert` does the whole job in one attribute where it exists. Where it does
     not, the fallback is tabindex + aria-hidden, which is the same contract
     spelled out longhand.

     The card itself answers a click, because a card in a hand is turned over by
     touching it and not by finding its label. That is layered on top of the
     button rather than instead of it: the button is what a keyboard, a screen
     reader and a visitor who has never met a flipping card all use, and it is
     the only thing that ever claims to be a control. Clicks that land on a real
     link — the address on the front, the four routes on the back — are the
     link's, never the card's. */
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

    function flip(fromButton) {
      turned = !turned;
      paint();
      /* Focus follows the card: whichever face is now facing you is the one a
         keyboard should be able to walk into next. Only when the turn was asked
         for from the keyboard's own control — a pointer already knows where it
         is, and moving its focus steals the scroll position out from under it. */
      if (fromButton && turned && faces.back) {
        var first = faces.back.querySelector("a[href]");
        if (first && document.activeElement === btn) {
          /* Only once the half-turn has actually shown it — moving focus onto
             something the visitor cannot see yet is the same bug, early. */
          window.setTimeout(function () {
            if (turned) first.focus({ preventScroll: true });
          }, still() ? 0 : 620);
        }
      }
    }

    btn.addEventListener("click", function () {
      flip(true);
    });

    /* A press that travelled is a drag, a text selection or a scroll that
       started on the card, and none of those asked for the card to turn. */
    var from = null;
    stage.addEventListener(
      "pointerdown",
      function (ev) {
        from = { x: ev.clientX, y: ev.clientY };
      },
      { passive: true }
    );

    stage.addEventListener("click", function (ev) {
      var hit = ev.target.closest ? ev.target.closest("a[href], button, [role='button']") : null;
      if (hit) return;
      if (from && Math.abs(ev.clientX - from.x) + Math.abs(ev.clientY - from.y) > 10) return;
      flip(false);
    });

    paint();
  }

  /* =========================================================================
     THE ANSWER — jobs 9 to 14, and the one rule they share
     -------------------------------------------------------------------------
     Every action gets an answer, and the answer is proportional to the action.
     A press is answered where the finger is. Something that changed state
     somewhere the eye is not looking — an address copied, a preference
     stored — is answered in words, once, and then takes itself away.

     Nothing below is in the markup until this file runs, because none of it
     can do anything without this file, and everywhere any of it can reach is
     reachable from the navigation and the footer with all of it absent.
     ========================================================================= */

  var EMAIL = "connor.eppolito803@myci.csuci.edu";

  /* --- 9. the reply -------------------------------------------------------
     Two channels, one call: a line of type in the rail, and the same words in
     a polite live region. The rail is aria-hidden — it is the visible half of
     one reply, not a second one, and a screen reader that was given both would
     hear everything twice.

     A `quiet` reply skips the rail. The console's result count changes on every
     keystroke and belongs in the live region, where it is the only way to know
     the list moved; put through the rail it would be a stack of toasts nobody
     asked for. */

  var TOASTS = 3;
  var saidAt = 0;

  function say(text, tone) {
    var live = document.querySelector("[data-announce]");
    if (live) {
      /* Cleared, then filled a beat later. A live region that is assigned the
         same string it already held has not changed, and two identical replies
         in a row would be announced once — so the region is genuinely emptied
         first, in its own frame, and refilled in the next one. */
      live.textContent = "";
      var mine = ++saidAt;
      window.setTimeout(function () {
        if (mine === saidAt) live.textContent = text;
      }, 40);
    }
    if (tone === "quiet") return;

    var rail = document.querySelector("[data-toasts]");
    if (!rail) return;

    var note = document.createElement("div");
    note.className = "toast";
    var led = document.createElement("span");
    led.className = "toast__led";
    var words = document.createElement("span");
    words.textContent = text;
    note.appendChild(led);
    note.appendChild(words);
    rail.appendChild(note);
    while (rail.children.length > TOASTS) rail.removeChild(rail.firstChild);

    var gone = false;
    function retire() {
      if (gone) return;
      gone = true;
      note.classList.add("is-going");
      window.setTimeout(function () {
        if (note.parentNode) note.parentNode.removeChild(note);
      }, still() ? 0 : 240);
    }
    window.setTimeout(retire, 3400);
  }

  /* --- 10. the receipt ----------------------------------------------------
     Copying is the one interaction on the web with no feedback of its own: the
     clipboard changes somewhere nobody can see. So every copy on this site
     answers in three places — on the control, in the rail, and to a screen
     reader — and a copy that did not happen says so instead of pretending. */

  function fallbackCopy(text) {
    try {
      var pad = document.createElement("textarea");
      pad.value = text;
      pad.setAttribute("readonly", "");
      pad.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(pad);
      pad.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(pad);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function flash(el) {
    if (!el || !el.classList) return;
    el.classList.add("copied");
    window.setTimeout(function () {
      el.classList.remove("copied");
    }, 1600);
  }

  function copy(text, done, el) {
    function win() {
      flash(el);
      say(done);
    }
    function lose() {
      say("The browser would not let this page copy. Select it and copy by hand.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(win, function () {
        if (fallbackCopy(text)) win();
        else lose();
      });
      return;
    }
    if (fallbackCopy(text)) win();
    else lose();
  }

  var LINK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" aria-hidden="true" focusable="false">' +
    '<path d="M10 14a4.4 4.4 0 0 0 6.3 0l2.6-2.6a4.45 4.45 0 0 0-6.3-6.3L11.4 6.3"/>' +
    '<path d="M14 10a4.4 4.4 0 0 0-6.3 0l-2.6 2.6a4.45 4.45 0 0 0 6.3 6.3l1.2-1.2"/></svg>';

  /* Every section of every page on this site is a real URL — build_pages.py
     gives every heading an id, and this is the control that hands one over.
     Pointer only: on a touch screen it would be a 44 px target sitting inside
     a line of type, and the console's "Copy a link to this page" is the same
     job with a thumb. */
  function receipts() {
    document.addEventListener("click", function (ev) {
      var hit = ev.target.closest ? ev.target.closest("[data-copy]") : null;
      if (!hit) return;
      ev.preventDefault();
      copy(hit.getAttribute("data-copy"), hit.getAttribute("data-copy-said") || "Copied", hit);
    });

    var main = document.getElementById("main");
    if (!main || !("closest" in Element.prototype)) return;

    var heads = main.querySelectorAll("h2[id], h3[id]");
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i];
      /* Not every heading is a section. A heading on the face of an object —
         the contact card turns over, and half of it is facing away at any
         moment — is a label on a thing, and a permanent link to a line that is
         sometimes pointing at the wall is a link to nothing. */
      if (h.classList.contains("vh") || h.querySelector("a")) continue;
      if (h.closest("[data-anchors='off']")) continue;
      var name = words(h);
      if (!name) continue;

      var a = document.createElement("a");
      a.className = "anchor";
      a.href = "#" + h.id;
      a.setAttribute("aria-label", "Copy a link to “" + name + "”");
      a.innerHTML = LINK_SVG;
      (function (link, id) {
        link.addEventListener("click", function (ev) {
          /* The document's own anchor handler would travel; this one is the
             copy, and the travel is the part the address bar does anyway. */
          ev.preventDefault();
          ev.stopPropagation();
          var url = location.href.split("#")[0] + "#" + id;
          if (window.history && history.replaceState) history.replaceState(null, "", "#" + id);
          copy(url, "Link to this section copied", link);
        });
      })(a, h.id);
      h.appendChild(a);
    }
  }

  /* --- 11. the return -----------------------------------------------------
     Not on screen until there is something to return from, and the ring around
     it is the same number the trace across the top of the page is drawing. */

  var dial = null;

  function returning() {
    dial = document.querySelector("[data-totop]");
    if (!dial) return;
    dial.hidden = false;
    dial.addEventListener("click", function () {
      var main = document.getElementById("main");
      if (main) focusLanding(main);
      glideTo(0);
      say("Back at the top");
    });
  }

  /* --- 12. the chapters ---------------------------------------------------
     The law the Projects rail is built on, applied to every long document on
     the site: it reports which section you are in, and it never converts the
     page into tabs, never hides an inactive section and never competes with
     the scroll for authority.

     It is built from the document rather than from a list kept beside it, so a
     section added to a page is in its contents the moment it is written. */

  /* A heading broken over two lines with a <br> reads as one word either side
     of the break unless the break is read as a space. `innerText` does that;
     `textContent` does not, and "Five rules I did notset out to have" is what
     the difference looks like. */
  function words(el) {
    return ((el.innerText || el.textContent || "") + "").replace(/\s+/g, " ").trim();
  }

  var chapterLinks = [];
  var chapterHeads = [];
  var chapterAt = -1;

  function chapters() {
    /* The home page already has a rail through the one part of it that is a
       place, and two spines down one screen is one too many. */
    if (document.querySelector("[data-theatre]")) return;
    var main = document.getElementById("main");
    if (!main) return;

    var found = main.querySelectorAll("h2[id]");
    var heads = [];
    for (var i = 0; i < found.length; i++) {
      if (found[i].classList.contains("vh")) continue;
      if (!words(found[i])) continue;
      heads.push(found[i]);
    }
    /* Under four sections the masthead is already the whole map. */
    if (heads.length < 4) return;

    var nav = document.createElement("nav");
    nav.className = "chapters";
    nav.setAttribute("aria-label", "Sections on this page");
    var list = document.createElement("ul");
    list.className = "chapters__list";

    for (var j = 0; j < heads.length; j++) {
      var name = words(heads[j]);
      if (name.length > 38) name = name.slice(0, 37).replace(/[\s,;:.]+$/, "") + "…";

      var li = document.createElement("li");
      li.className = "chapters__i";
      var a = document.createElement("a");
      a.className = "chapters__a";
      a.href = "#" + heads[j].id;
      var label = document.createElement("span");
      label.className = "chapters__label";
      label.textContent = name;
      var tick = document.createElement("span");
      tick.className = "chapters__tick";
      tick.setAttribute("aria-hidden", "true");
      a.appendChild(label);
      a.appendChild(tick);
      li.appendChild(a);
      list.appendChild(li);
      chapterLinks.push(a);
    }

    nav.appendChild(list);
    document.body.appendChild(nav);
    chapterHeads = heads;
    markChapter();
  }

  function markChapter() {
    if (!chapterHeads.length) return;
    var line = landing() + 12;
    var n = 0;
    for (var i = 0; i < chapterHeads.length; i++) {
      if (chapterHeads[i].getBoundingClientRect().top <= line) n = i;
    }
    if (n === chapterAt) return;
    if (chapterAt >= 0 && chapterLinks[chapterAt]) chapterLinks[chapterAt].removeAttribute("aria-current");
    chapterAt = n;
    if (chapterLinks[n]) chapterLinks[n].setAttribute("aria-current", "true");
  }

  /* --- 13. the magnets ----------------------------------------------------
     Four pixels, on the controls that are the point of the page they are on,
     and only while a fine pointer is actually inside one. The attribute is put
     on here rather than in the markup so that a page with this file absent
     carries no state it cannot resolve. */

  function magnets() {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var targets = document.querySelectorAll(".btn--primary, .nav__key, .findbtn");
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      el.setAttribute("data-magnet", "");
      el.addEventListener("pointermove", onMagnet, { passive: true });
      el.addEventListener("pointerleave", offMagnet, { passive: true });
      el.addEventListener("blur", offMagnet);
    }
  }

  function onMagnet(ev) {
    if (still()) return;
    var el = ev.currentTarget;
    var box = el.getBoundingClientRect();
    var mx = (ev.clientX - box.left) / box.width - 0.5;
    var my = (ev.clientY - box.top) / box.height - 0.5;
    el.style.setProperty("--mx", (mx * 2).toFixed(3));
    el.style.setProperty("--my", (my * 2).toFixed(3));
  }

  function offMagnet(ev) {
    var el = ev.currentTarget;
    el.style.setProperty("--mx", "0");
    el.style.setProperty("--my", "0");
  }

  /* --- 14. the console ----------------------------------------------------
     One field, and every page, product and section on this site is one key
     away from every other one. The module is imported the first time somebody
     reaches for it and never before, so it costs the critical path nothing —
     and it is warmed on the first hover of the control, so the first press is
     not the first request. */

  var consoleApi = null;
  var consoleLoading = null;
  var motionSwitch = null;

  /* "/Portfolio-Hub/" and "/Portfolio-Hub/index.html" are the same document,
     and a console that reloaded the page you are already on to reach a place
     further down it would be answering a question nobody asked. */
  function samePath(a, b) {
    return a.replace(/(^|\/)index\.html$/, "$1") === b.replace(/(^|\/)index\.html$/, "$1");
  }

  function travel(url) {
    var probe = document.createElement("a");
    probe.href = url;
    if (samePath(probe.pathname, location.pathname) && probe.search === location.search) {
      var el = fragment(probe.hash);
      if (el) {
        if (window.history && history.pushState) history.pushState(null, "", probe.hash);
        else location.hash = probe.hash;
        focusLanding(el);
        glideTo(restAt(el));
        return;
      }
    }
    /* A different document: the browser's own cross-document transition is the
       arrival, and this file has nothing to add to it. */
    location.href = url;
  }

  function consoleActions() {
    var off = root.getAttribute("data-motion") === "off";
    var list = [
      {
        t: "Copy a link to this page",
        c: "Action",
        d: location.href.replace(/^https?:\/\//, ""),
        w: "url share address bookmark",
        run: function () {
          copy(location.href, "Link to this page copied");
        }
      },
      {
        t: "Copy Connor’s email address",
        c: "Action",
        d: EMAIL,
        w: "contact mail address hire",
        run: function () {
          copy(EMAIL, "Email address copied");
        }
      },
      {
        t: "Email Connor",
        c: "Action",
        d: "Opens a message in your mail client",
        w: "contact write hire message",
        run: function () {
          location.href = "mailto:" + EMAIL;
        }
      },
      {
        t: off ? "Restore motion" : "Reduce motion",
        c: "Action",
        d: off ? "Movement on this site is currently stopped" : "Stops every continuous movement on this site",
        w: "animation still accessibility vestibular",
        run: function () {
          if (motionSwitch) motionSwitch();
        }
      },
      {
        t: "Print this page",
        c: "Action",
        d: "The résumé is composed for two printed pages",
        w: "pdf save paper export",
        run: function () {
          window.print();
        }
      },
      {
        t: "Return to the top",
        c: "Action",
        d: "",
        w: "scroll up start",
        run: function () {
          var main = document.getElementById("main");
          if (main) focusLanding(main);
          glideTo(0);
        }
      }
    ];
    return list;
  }

  function loadConsole() {
    if (consoleApi) return Promise.resolve(consoleApi);
    if (consoleLoading) return consoleLoading;
    consoleLoading = import(HERE + "vendor/console.js")
      .then(function (m) {
        consoleApi = m.mount({
          index: HERE + "search.json",
          go: travel,
          say: say,
          actions: consoleActions
        });
        consoleLoading = null;
        return consoleApi;
      })
      .catch(function (err) {
        consoleLoading = null;
        throw err;
      });
    return consoleLoading;
  }

  function openConsole(prefill) {
    loadConsole().then(
      function (api) {
        api.open(prefill);
      },
      function () {
        say("The search could not be loaded. Every page on this site is listed in the footer.");
      }
    );
  }

  function consoleControl() {
    var opens = document.querySelectorAll("[data-console-open]");
    if (!opens.length || !window.Promise) return;

    /* ⌘K on an Apple keyboard, / everywhere else. Both work everywhere; the
       hint shows whichever one the keyboard in front of you actually has. */
    var apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || "") ||
      /Mac OS X/.test(navigator.userAgent || "");
    var hints = document.querySelectorAll("[data-console-key]");
    for (var h = 0; h < hints.length; h++) hints[h].textContent = apple ? "⌘K" : "/";

    for (var i = 0; i < opens.length; i++) {
      opens[i].addEventListener("click", function () {
        /* One of these controls lives inside the mobile menu, and a menu left
           standing open behind the panel it just opened is a second navigation
           waiting underneath the first. */
        var panel = document.querySelector("[data-menu][open]");
        if (panel) panel.removeAttribute("open");
        openConsole();
      });
      /* Warmed by the hand on its way to the control, so the press itself is
         never the request. */
      opens[i].addEventListener("pointerenter", warmConsole, { passive: true, once: true });
      opens[i].addEventListener("focus", warmConsole, { once: true });
    }

    document.addEventListener("keydown", function (ev) {
      if (ev.defaultPrevented) return;
      var mod = ev.metaKey || ev.ctrlKey;
      if (mod && (ev.key === "k" || ev.key === "K")) {
        ev.preventDefault();
        openConsole();
        return;
      }
      if (mod || ev.altKey) return;
      var t = ev.target;
      var typing =
        t &&
        (t.isContentEditable ||
          /^(input|textarea|select)$/i.test(t.tagName || "") ||
          (consoleApi && consoleApi.isOpen()));
      if (typing) return;
      if (ev.key === "/") {
        ev.preventDefault();
        openConsole();
      }
    });
  }

  function warmConsole() {
    loadConsole().then(
      function (api) {
        if (api.warm) api.warm();
      },
      function () {}
    );
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
    /* The console offers the same switch as a command, and there is one of it:
       both routes run this function, so the two can never disagree. */
    motionSwitch = function () {
      toggle();
      say(root.getAttribute("data-motion") === "off" ? "Motion reduced" : "Motion restored");
    };
    paint();
  }

  function teardown() {
    if (cinema.atmos && cinema.atmos.destroy) cinema.atmos.destroy();
    if (cinema.pulse && cinema.pulse.destroy) cinema.pulse.destroy();
    if (cinema.holo && cinema.holo.destroy) cinema.holo.destroy();
    readingMask(null);
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
            lift: document.querySelector("[data-signal]") ? 2.0 : 1,
            onLost: function () {
              cinema.atmos = null;
              readingMask(null);
              if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
          });
          readingMask(cinema.atmos);
        })
        .catch(function () {});
    }
  }

  /* --- 5b. where the words are --------------------------------------------- */

  /* The plane draws light, the page is read over the top of it, and until now
     neither of those two facts knew about the other. This is the wire between
     them, and it runs in this direction on purpose: the module measures
     nothing and this file names nothing the module has to understand. All that
     crosses is a run of rectangles in the plane's own coordinates.

     They are the LINES, not the elements. A block element is as wide as
     whatever contains it however narrow its ink is, so measuring boxes would
     have reported the tag strip at the top of a case study as full-bleed text
     and dimmed the plane clean across the frame for four short chips. A range
     over the element's contents gives back one rectangle per line actually
     laid out, which is the same thing a reader sees, and it costs a layout
     read the scroll handler was going to force anyway.

     Nothing here is a constant somebody has to keep in step with the
     stylesheet by hand — no shell width, no measure, no breakpoint. That
     matters most on the page it is least obvious on: the home hero puts its
     words down the left, so that is what gets covered, and the projection in
     the empty half keeps the plane at full strength behind it. */
  var READS = "p, li, dd, dt, h1, h2, h3, h4, blockquote, figcaption, td, th";
  var readIO = null;
  var onScreen = [];
  var readPlane = null;
  var queued = false;

  function readingMask(plane) {
    if (readIO) {
      readIO.disconnect();
      readIO = null;
      onScreen = [];
      readPlane = null;
      window.removeEventListener("scroll", queueRead);
      window.removeEventListener("resize", queueRead);
    }
    if (!plane || !plane.read || !("IntersectionObserver" in window)) return;

    var main = document.getElementById("main") || document.body;
    var text = main.querySelectorAll(READS);
    if (!text.length) return;

    readIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var el = entries[i].target;
        var at = onScreen.indexOf(el);
        if (entries[i].isIntersecting) {
          if (at < 0) onScreen.push(el);
        } else if (at >= 0) {
          onScreen.splice(at, 1);
        }
      }
      measureRead(plane);
    });
    for (var i = 0; i < text.length; i++) readIO.observe(text[i]);

    readPlane = plane;
    readAt = -1;
    window.addEventListener("scroll", queueRead, { passive: true });
    window.addEventListener("resize", queueRead, { passive: true });
    measureRead(plane);
  }

  /* One measurement per frame at most, and none at all while nothing moves.
     Measuring is the single most expensive thing this file does during a
     scroll — a range over every line of text on screen, which forces layout —
     so it is also the thing most worth not doing. A frame that arrives at the
     same scroll position and the same viewport as the last one has nothing new
     to say, and inside a smooth scroll's deceleration that is most of them. */
  var readAt = -1;
  var readW = -1;
  var readH = -1;

  function queueRead() {
    if (queued || !readPlane) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      if (!readPlane) return;
      var y = window.pageYOffset || root.scrollTop;
      if (y === readAt && window.innerWidth === readW && window.innerHeight === readH) return;
      readAt = y;
      readW = window.innerWidth;
      readH = window.innerHeight;
      measureRead(readPlane);
    });
  }

  /* One buffer, filled and refilled. Two hundred and fifty-six lines is more
     than fits on any screen this site is read on; past that the mask is
     already covering everything the extra lines would have covered. */
  var LINES = 256;
  var lineBuf = new Float32Array(LINES * 4);
  var range = null;

  function measureRead(plane) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var n = 0;

    if (!range) range = document.createRange();

    for (var i = 0; i < onScreen.length && n < LINES; i++) {
      range.selectNodeContents(onScreen[i]);
      var lines = range.getClientRects();
      for (var j = 0; j < lines.length && n < LINES; j++) {
        var r = lines[j];
        if (r.width < 4 || r.height < 4) continue;
        if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
        var o = n * 4;
        /* Into the plane's uv, whose y runs up from the bottom of the
           viewport, clipped to the frame it is drawn in. */
        lineBuf[o] = Math.max(0, r.left) / vw;
        lineBuf[o + 1] = 1 - Math.min(vh, r.bottom) / vh;
        lineBuf[o + 2] = Math.min(vw, r.right) / vw;
        lineBuf[o + 3] = 1 - Math.max(0, r.top) / vh;
        n++;
      }
    }

    plane.read(lineBuf, n);
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
      anchors();
      /* Before reveals(), so the first thing measured is the page where it is
         actually going to be read rather than where it briefly was. */
      arrive();
      reveals();
      menu();
      motionControls();
      arrival();
      theatre();
      card();
      /* The answer. Built before progress() runs, because progress() is what
         reports into the two of these that report. */
      receipts();
      returning();
      chapters();
      magnets();
      consoleControl();
      progress();
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
