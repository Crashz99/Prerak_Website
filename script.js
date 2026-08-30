(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------------------------------------------------------
     1. Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     2. Ambient page-wide starfield (purely decorative)
  --------------------------------------------------------- */
  var ambientContainer = document.getElementById("ambientStars");
  if (ambientContainer) {
    var starCount = window.innerWidth < 640 ? 40 : 80;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < starCount; i++) {
      var s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      var size = Math.random() < 0.15 ? 2 : 1;
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.animationDuration = (2 + Math.random() * 4) + "s";
      s.style.animationDelay = (Math.random() * 4) + "s";
      frag.appendChild(s);
    }
    ambientContainer.appendChild(frag);
  }

  /* ---------------------------------------------------------
     3. Scroll-spy rail — highlights the section you're in,
        fills as you move through the page, jumps on click.
  --------------------------------------------------------- */
  var rail = document.getElementById("scrollRail");
  var railMarker = document.getElementById("railMarker");
  var railVertices = [
    [50, 0], [15, 16.67], [85, 33.33], [15, 50], [85, 66.67], [15, 83.33], [50, 100]
  ]; // [x%, y%] — must match the dot positions and polyline points in the HTML
  if (rail) {
    var railDots = Array.prototype.slice.call(rail.querySelectorAll(".rail-dot"));
    var railSections = railDots
      .map(function (dot) { return document.getElementById(dot.getAttribute("data-target")); })
      .filter(Boolean);

    railDots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var target = document.getElementById(dot.getAttribute("data-target"));
        if (target) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
    });

    if ("IntersectionObserver" in window) {
      var railIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var dot = rail.querySelector('.rail-dot[data-target="' + entry.target.id + '"]');
            if (!dot) return;
            if (entry.isIntersecting) {
              railDots.forEach(function (d) { d.classList.remove("active"); });
              dot.classList.add("active");
            }
          });
        },
        { threshold: 0.5 }
      );
      railSections.forEach(function (sec) { railIO.observe(sec); });
    }

    function updateRailFill() {
      if (!railMarker || railSections.length === 0) return;
      var first = railSections[0].getBoundingClientRect();
      var last = railSections[railSections.length - 1].getBoundingClientRect();
      var totalSpan = (last.top + last.height / 2) - (first.top + first.height / 2);
      var traveled = (window.innerHeight / 2) - (first.top + first.height / 2);
      var progress = totalSpan !== 0 ? Math.max(0, Math.min(1, traveled / totalSpan)) : 0;

      var segCount = railVertices.length - 1;
      var scaled = progress * segCount;
      var idx = Math.min(segCount - 1, Math.floor(scaled));
      var localT = scaled - idx;
      var a = railVertices[idx];
      var b = railVertices[idx + 1];
      var x = a[0] + (b[0] - a[0]) * localT;
      var y = a[1] + (b[1] - a[1]) * localT;
      railMarker.style.left = x + "%";
      railMarker.style.top = y + "%";
    }
    window.addEventListener("scroll", updateRailFill, { passive: true });
    window.addEventListener("resize", updateRailFill);
    updateRailFill();
  }

  /* ---------------------------------------------------------
     3b. Top scroll-progress bar + back-to-top button
  --------------------------------------------------------- */
  var progressFill = document.getElementById("progressFill");
  var toTopBtn = document.getElementById("toTop");
  function updateProgressAndToTop() {
    var doc = document.documentElement;
    var scrolled = doc.scrollTop || document.body.scrollTop;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? Math.min(1, Math.max(0, scrolled / max)) : 0;
    if (progressFill) progressFill.style.width = (pct * 100) + "%";
    if (toTopBtn) toTopBtn.classList.toggle("visible", scrolled > window.innerHeight * 0.6);
  }
  window.addEventListener("scroll", updateProgressAndToTop, { passive: true });
  updateProgressAndToTop();
  if (toTopBtn) {
    toTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------
     4. Name entrance + the second "r" in "Prerak" falling
  --------------------------------------------------------- */
  var letters = document.querySelectorAll(".name .letter");
  letters.forEach(function (el, i) {
    el.style.setProperty("--d", i * 34);
  });

  var r2 = document.getElementById("letter-r2");
  if (r2 && !reduced) {
    var totalLetters = letters.length;
    var entranceMs = totalLetters * 34 + 550;
    setTimeout(function () {
      r2.classList.add("falling");
    }, entranceMs + 250);
  }

  /* ---------------------------------------------------------
     3. Reticle — tracks the cursor, "locks on" over data-track els
  --------------------------------------------------------- */
  var reticle = document.getElementById("reticle");
  if (reticle && !isTouch && !reduced) {
    var rx = 0, ry = 0;
    window.addEventListener("mousemove", function (e) {
      rx = e.clientX - 23;
      ry = e.clientY - 23;
      reticle.style.transform = "translate(" + rx + "px," + ry + "px)";
      reticle.classList.add("active");
    });
    document.addEventListener("mouseleave", function () {
      reticle.classList.remove("active");
    });

    document.querySelectorAll("[data-track]").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        reticle.classList.add("locked");
      });
      el.addEventListener("mouseleave", function () {
        reticle.classList.remove("locked");
      });
    });
  }

  /* ---------------------------------------------------------
     4. Scroll reveals
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------------------------------------------------
     5. Pursuit strip — a self-running pixel chase (canvas).
        Runs continuously from page load (no scroll required).
        Confidence % is still tied to overall scroll progress.
  --------------------------------------------------------- */
  var canvas = document.getElementById("chaseCanvas");
  var confidenceEl = document.getElementById("pursuitConfidence");
  var statusEl = document.getElementById("pursuitStatus");

  if (canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function resizeCanvas() {
      var rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    var runnerColor = "#f5f4f2";
    var dinoColor = "#f5f4f2";
    var accentColor = "#ff2f92";

    function drawLimb(pivotX, pivotY, length, width, angle) {
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angle);
      ctx.fillRect(-width / 2, 0, width, length);
      ctx.restore();
    }

    function drawRunner(x, groundY, t, jumpY) {
      var legLen = 15, torsoLen = 13, headSize = 10, armLen = 12, lw = 4.5;
      var swing = Math.sin(t * 9);
      var legA = swing * 0.55;
      var legB = -swing * 0.55;
      var armA = -swing * 0.45;
      var armB = swing * 0.45;

      ctx.save();
      ctx.translate(x, groundY - jumpY);
      ctx.fillStyle = runnerColor;

      drawLimb(0, -legLen, legLen, lw, legB);
      drawLimb(0, -legLen, legLen, lw, legA);
      ctx.fillRect(-lw, -legLen - torsoLen, lw * 2, torsoLen);
      drawLimb(0, -legLen - torsoLen + 3, armLen, lw * 0.75, armB);
      drawLimb(0, -legLen - torsoLen + 3, armLen, lw * 0.75, armA);
      ctx.fillRect(-headSize / 2, -legLen - torsoLen - headSize, headSize, headSize);
      ctx.restore();
    }

    function drawStars(t) {
      ctx.fillStyle = "#f5f4f2";
      stars.forEach(function (s) {
        var tw = 0.4 + 0.6 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.globalAlpha = tw * 0.8;
        ctx.fillRect(s.x * W, s.y * (H * 0.55), s.size, s.size);
      });
      ctx.globalAlpha = 1;
    }

    function drawDino(x, groundY, t, mouthOpen) {
      var legLen = 24, lw = 9;
      var swing = Math.sin(t * 8 + Math.PI * 0.15);
      var legA = swing * 0.4;
      var legB = -swing * 0.4;
      var bg = "#0d0d10";

      ctx.save();
      ctx.translate(x, groundY);
      ctx.fillStyle = dinoColor;

      // legs
      drawLimb(-3, -legLen, legLen, lw, legB);
      drawLimb(9, -legLen, legLen, lw, legA);

      // thick tapered tail, sweeping back and slightly up
      ctx.save();
      ctx.translate(-7, -legLen - 8);
      ctx.rotate(0.5);
      ctx.fillRect(-38, -7, 34, 13);
      ctx.fillRect(-48, -4, 12, 7);
      ctx.restore();

      // body, upright with a slight forward lean
      ctx.save();
      ctx.translate(3, -legLen);
      ctx.rotate(-0.14);
      ctx.fillRect(-10, -44, 30, 44);
      ctx.restore();

      // head + snout
      var hx = 18, hy = -legLen - 46;
      ctx.fillRect(hx, hy, 26, 22);
      ctx.fillRect(hx + 20, hy + 6, 14, 14);

      // mouth notch (cut into the head/snout so it reads as an open jaw)
      var jawH = mouthOpen ? 9 : 3;
      ctx.save();
      ctx.fillStyle = bg;
      ctx.fillRect(hx + 17, hy + 15, 24, jawH);
      ctx.restore();
      if (mouthOpen) {
        ctx.fillStyle = dinoColor;
        ctx.fillRect(hx + 19, hy + 15, 2, 5);
        ctx.fillRect(hx + 26, hy + 15, 2, 5);
        ctx.fillRect(hx + 33, hy + 15, 2, 5);
      }
      // eye
      ctx.save();
      ctx.fillStyle = bg;
      ctx.fillRect(hx + 6, hy + 5, 4, 4);
      ctx.restore();

      // stubby arm
      ctx.fillStyle = dinoColor;
      drawLimb(15, -legLen - 26, 10, 4.5, 0.9 + swing * 0.15);

      ctx.restore();
    }

    var startTime = performance.now();
    var obstacles = [];
    var lastSpawn = 0;
    var speed = 130; // px/sec, ground + obstacle scroll speed
    var dashOffset = 0;
    var jumpDuration = 0.5;
    var jumping = null; // { start }
    var dinoJumping = null;
    var stars = [];
    for (var si = 0; si < 40; si++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() < 0.2 ? 2 : 1,
        speed: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2
      });
    }

    function loop(now) {
      var t = (now - startTime) / 1000;
      var dt = 1 / 60;

      if (W === 0) resizeCanvas();

      var groundY = H * 0.82;
      var runnerX = W * 0.32;
      var gap = 150 + Math.sin(t * 0.6) * 26; // gap breathes, feels alive
      var dinoX = runnerX - gap;

      ctx.clearRect(0, 0, W, H);
      drawStars(t);

      // ground
      dashOffset = (dashOffset + speed * dt) % 24;
      ctx.strokeStyle = "rgba(245,244,242,0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 14]);
      ctx.lineDashOffset = -dashOffset;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 1);
      ctx.lineTo(W, groundY + 1);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!reduced) {
        // spawn obstacles (cacti) periodically, alternating types
        if (t - lastSpawn > 2.3) {
          lastSpawn = t;
          obstacles.push({ x: W + 20, spawnTime: t, kind: Math.random() < 0.5 ? "single" : "cluster" });
        }

        obstacles.forEach(function (o) { o.x -= speed * dt; });
        obstacles = obstacles.filter(function (o) { return o.x > -40; });

        // trigger the jump so its peak lands exactly when the obstacle
        // reaches the runner: lead distance = speed * half the jump duration
        var leadDistance = speed * (jumpDuration / 2);
        obstacles.forEach(function (o) {
          if (!jumping && !o.jumped && o.x <= runnerX + leadDistance) {
            jumping = { start: t };
            o.jumped = true;
          }
        });

        // draw obstacles (two cactus variants, chrome-dino style)
        ctx.fillStyle = "rgba(245,244,242,0.85)";
        obstacles.forEach(function (o) {
          if (o.kind === "single") {
            ctx.fillRect(o.x, groundY - 30, 7, 30);
            ctx.fillRect(o.x - 6, groundY - 20, 6, 6);
            ctx.fillRect(o.x + 7, groundY - 15, 6, 6);
          } else {
            ctx.fillRect(o.x, groundY - 22, 5, 22);
            ctx.fillRect(o.x + 9, groundY - 28, 5, 28);
            ctx.fillRect(o.x + 18, groundY - 18, 5, 18);
          }
        });
      }

      // jump arcs
      var jumpY = 0;
      if (jumping) {
        var jt = (t - jumping.start) / jumpDuration;
        if (jt >= 1) { jumping = null; }
        else { jumpY = Math.sin(jt * Math.PI) * 34; }
      }
      var dinoJumpY = 0;
      if (jumping && (t - jumping.start) > 0.12 && !dinoJumping) {
        dinoJumping = { start: t + 0.0 };
      }
      if (dinoJumping) {
        var djt = (t - dinoJumping.start) / (jumpDuration * 0.9);
        if (djt >= 1 || djt < 0) { dinoJumping = null; }
        else { dinoJumpY = Math.sin(djt * Math.PI) * 22; }
      }

      var mouthOpen = Math.sin(t * 2.2) > 0.6;

      drawDino(dinoX, groundY - dinoJumpY, t, mouthOpen);
      drawRunner(runnerX, groundY, t, jumpY);

      // faint accent glow beneath the runner to sell speed/flash
      ctx.fillStyle = "rgba(255,47,146,0.12)";
      ctx.beginPath();
      ctx.ellipse(runnerX, groundY + 2, 20, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!reduced) window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
    if (reduced) {
      // draw a single static frame so there's still something to see
      loop(performance.now());
    }
  }

  // confidence readout still reflects how far down the whole page you are
  function updateConfidence() {
    var doc = document.documentElement;
    var scrolled = doc.scrollTop || document.body.scrollTop;
    var max = doc.scrollHeight - doc.clientHeight;
    var progress = max > 0 ? Math.min(1, Math.max(0, scrolled / max)) : 0;
    var pct = Math.round(progress * 100);
    if (confidenceEl) confidenceEl.textContent = String(pct).padStart(2, "0") + "%";
    if (statusEl) {
      statusEl.textContent = progress >= 0.9 ? "MATCH — PRERAK SINGH TANWER" : "TRACKING";
    }
  }
  window.addEventListener("scroll", updateConfidence, { passive: true });
  updateConfidence();

  /* ---------------------------------------------------------
     6. Footer easter egg — a quick "ping" that flashes the
        reticle brackets, referencing the tracking motif once more.
  --------------------------------------------------------- */
  var pingBtn = document.getElementById("footerEaster");
  if (pingBtn) {
    pingBtn.addEventListener("click", function () {
      pingBtn.classList.add("pinged");
      pingBtn.textContent = "[ pong ]";
      setTimeout(function () {
        pingBtn.classList.remove("pinged");
        pingBtn.textContent = "[ ping ]";
      }, 900);
    });
  }
})();
