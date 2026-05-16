(function () {
  'use strict';

  /* ── Easing helpers ──────────────────────────────────────*/

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  /* ── Section 2: Stacked cards ────────────────────────────*/

  var cardsSection = document.querySelector('.s-cards');
  var cardEls = [
    document.querySelector('.card-projects'),
    document.querySelector('.card-photo'),
    document.querySelector('.card-graphics'),
  ];

  function updateCards() {
    if (!cardsSection || !cardEls[0]) return;
    if (window.innerWidth <= 700) {
      cardEls.forEach(function (card) { if (card) card.style.transform = ''; });
      return;
    }
    var rect  = cardsSection.getBoundingClientRect();
    var total = cardsSection.offsetHeight - window.innerHeight;
    var raw   = clamp(-rect.top / total, 0, 1);
    var p     = smoothstep(clamp(raw / 0.65, 0, 1));
    var cw    = cardEls[0].offsetWidth;
    var step  = Math.min(cw * 1.18, (window.innerWidth - cw) / 2 - 8);

    var stacked = [[0, 14, -4], [0, 0, 2], [0, -11, -2]];
    var spread  = [[-step, 0, -5], [0, 0, 0], [step, 0, 5]];

    cardEls.forEach(function (card, i) {
      if (!card) return;
      var s = stacked[i], e = spread[i];
      card.style.transform = [
        'translateX(' + lerp(s[0], e[0], p).toFixed(2) + 'px)',
        'translateY(' + lerp(s[1], e[1], p).toFixed(2) + 'px)',
        'rotate('     + lerp(s[2], e[2], p).toFixed(2) + 'deg)',
      ].join(' ');
      card.style.zIndex = p < 0.3 ? String(2 - i) : String(i === 1 ? 3 : 2);
    });
  }

  /* ── Section 5: Graphicfolio poster parallax (5 posters) ─*/

  var graphicSection = document.querySelector('.s-graphic');
  var posterWraps = [
    document.querySelector('.pc-p1'),
    document.querySelector('.pc-p2'),
    document.querySelector('.pc-p3'),
    document.querySelector('.pc-p4'),
    document.querySelector('.pc-p5'),
  ];

  function updatePosters() {
    if (!graphicSection || !posterWraps[0]) return;
    if (window.innerWidth <= 700) {
      posterWraps.forEach(function (wrap) { if (wrap) wrap.style.transform = ''; });
      return;
    }
    var rect = graphicSection.getBoundingClientRect();
    var raw  = clamp(
      (window.innerHeight - rect.top) / (window.innerHeight * 0.85),
      0, 1
    );
    var p    = smoothstep(raw);
    var pw   = posterWraps[0].offsetWidth;

    /* step computed from track container so all 5 posters fit exactly */
    var trackEl = graphicSection.querySelector('.poster-track');
    var trackW  = trackEl ? trackEl.offsetWidth : 900;
    var step    = (trackW - pw) / 4;

    /* stacked: all clustered in center with slight offsets */
    var stacked = [
      [0,  20, -8],
      [0,   8, -3],
      [0,   0,  2],
      [0,  -8,  4],
      [0, -18, -2],
    ];
    /* spread: evenly spaced across track width */
    var spread = [
      [-step * 2,  0, -6],
      [-step,      0, -3],
      [0,          0,  0],
      [ step,      0,  3],
      [ step * 2,  0,  6],
    ];

    posterWraps.forEach(function (wrap, i) {
      if (!wrap) return;
      var s = stacked[i], e = spread[i];
      wrap.style.transform = [
        'translateX(' + lerp(s[0], e[0], p).toFixed(2) + 'px)',
        'translateY(' + lerp(s[1], e[1], p).toFixed(2) + 'px)',
        'rotate('     + lerp(s[2], e[2], p).toFixed(2) + 'deg)',
      ].join(' ');
    });
  }

  /* ── Stack-card click ────────────────────────────────────*/

  document.querySelectorAll('.stack-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var target = document.querySelector(card.getAttribute('data-href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── Section 1: Typewriter effect ───────────────────────*/

  var titleEl = document.getElementById('aboutTitle');

  if (titleEl) {
    var typeText  = titleEl.getAttribute('data-type') || '';
    var typeSpeed = 48;

    titleEl.textContent = '';
    titleEl.classList.add('is-typing');

    var revealEls = document.querySelectorAll('.about-reveal');

    function runTypewriter() {
      var i = 0;
      function tick() {
        if (i < typeText.length) {
          titleEl.textContent += typeText[i];
          i++;
          setTimeout(tick, typeSpeed);
        } else {
          titleEl.classList.remove('is-typing');
          revealEls.forEach(function (el, idx) {
            setTimeout(function () { el.classList.add('revealed'); }, 200 + idx * 140);
          });
        }
      }
      tick();
    }

    /* Start after loader animation so typewriter is visible */
    setTimeout(runTypewriter, 2200);
  }

  /* ── Section 4: JS-driven marquee + dock + prev/next ─────
     Replaces CSS @keyframes. Each .marquee-outer gets:
     • a RAF loop that scrolls the track at a constant px/frame
     • pause-on-hover (for dock interaction)
     • prev / next buttons that skip one image width             */

  var DOCK_MAX   = 1.65;
  var DOCK_SIGMA = 130;

  document.querySelectorAll('.marquee-outer').forEach(function (outer) {
    var track    = outer.querySelector('.marquee-track');
    var firstSet = outer.querySelector('.marquee-set');
    if (!track || !firstSet) return;

    /* Speed: normal vs slow (product row) */
    var isSlow    = track.classList.contains('marquee-track--slow');
    var isReverse = outer.classList.contains('marquee-outer--rtl');
    var speed     = isSlow ? 0.55 : 0.85; /* px per frame at 60 fps */

    /* Dimensions – recalculated once then cached */
    var setWidth  = 0;
    var imgStep   = 0;

    function measureDimensions() {
      /* setWidth = total width of one complete marquee-set */
      setWidth = firstSet.scrollWidth + 12; /* +gap between sets */
      var sampleImg = firstSet.querySelector('.m-img');
      var w = sampleImg ? sampleImg.offsetWidth : 0;
      imgStep = (w > 0 ? w : 220) + 12;
    }

    measureDimensions();
    window.addEventListener('resize', measureDimensions, { passive: true });
    window.addEventListener('load', measureDimensions, { passive: true });

    /* Remeasure as lazy images load and expand the set width */
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(measureDimensions).observe(firstSet);
    }

    /* Scroll state — RTL starts at setWidth and counts down */
    var offset        = isReverse ? 0 : 0;
    var paused        = false;
    var transitioning = false;
    var loopRaf;

    function loop() {
      if (!paused && !transitioning) {
        if (isReverse) {
          offset -= speed;
          if (offset <= 0) offset += setWidth;
          track.style.transform = 'translateX(-' + offset.toFixed(1) + 'px)';
        } else {
          offset += speed;
          if (offset >= setWidth) offset -= setWidth;
          track.style.transform = 'translateX(-' + offset.toFixed(1) + 'px)';
        }
      }
      loopRaf = requestAnimationFrame(loop);
    }
    loopRaf = requestAnimationFrame(loop);

    /* Pause on hover so dock works correctly */
    outer.addEventListener('mouseenter', function () { paused = true; });
    outer.addEventListener('mouseleave', function () { paused = false; });

    /* ── Dock magnification ───────────────────────────── */
    var imgs    = Array.from(outer.querySelectorAll('.m-img'));
    var dockRaf = null;
    var lastX   = 0;

    function applyDock() {
      dockRaf = null;
      imgs.forEach(function (el) {
        var r  = el.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var d  = Math.abs(lastX - cx);
        var s  = 1 + (DOCK_MAX - 1) * Math.exp(-(d * d) / (2 * DOCK_SIGMA * DOCK_SIGMA));
        el.style.transform  = 'scale(' + s.toFixed(3) + ')';
        el.style.zIndex     = s > 1.4 ? '20' : '1';
        el.style.boxShadow  = s > 1.5 ? '0 28px 72px rgba(0,0,0,.75)' : '';
      });
    }

    function resetDock() {
      if (dockRaf) { cancelAnimationFrame(dockRaf); dockRaf = null; }
      imgs.forEach(function (el) {
        el.style.transform = '';
        el.style.zIndex    = '';
        el.style.boxShadow = '';
      });
    }

    outer.addEventListener('mousemove', function (e) {
      lastX = e.clientX;
      if (!dockRaf) dockRaf = requestAnimationFrame(applyDock);
    }, { passive: true });

    outer.addEventListener('mouseleave', resetDock);

    /* ── Prev / Next buttons ──────────────────────────── */
    var rowWrap = outer.closest('.gallery-row-wrap');
    if (!rowWrap) return;

    var prevBtn = rowWrap.querySelector('.marquee-prev');
    var nextBtn = rowWrap.querySelector('.marquee-next');

    function stepBy(dir) {
      if (transitioning) return;
      var target = offset + imgStep * dir;
      /* wrap around seamlessly */
      if (target < 0) target += setWidth;
      if (target >= setWidth) target -= setWidth;

      transitioning = true;
      track.style.transition = 'transform 0.48s cubic-bezier(0.22,1,0.36,1)';
      offset = target;
      track.style.transform = 'translateX(-' + offset.toFixed(1) + 'px)';

      setTimeout(function () {
        track.style.transition = '';
        transitioning = false;
      }, 500);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { stepBy(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stepBy(1); });
  });

  /* ── Section 4: Gallery image overlay ───────────────────*/

  var galleryOverlay    = document.getElementById('galleryOverlay');
  var galleryOlImg      = document.getElementById('galleryOlImg');
  var galleryOlBackdrop = document.getElementById('galleryOlBackdrop');
  var galleryOlClose    = document.getElementById('galleryOlClose');
  var galleryPrevBtn    = document.getElementById('galleryPrev');
  var galleryNextBtn    = document.getElementById('galleryNext');

  var gallerySets      = {};
  var galleryCurrentId = '';
  var galleryIdx       = 0;

  function buildGallerySets() {
    document.querySelectorAll('.marquee-outer').forEach(function (outer) {
      var id = outer.getAttribute('data-gallery-id');
      if (!id || gallerySets[id]) return;
      var firstSet = outer.querySelector('.marquee-set');
      if (!firstSet) return;
      gallerySets[id] = Array.from(firstSet.querySelectorAll('.m-img img')).map(function (img) {
        return img.src;
      });
    });
  }

  function openGalleryAt(id, index) {
    buildGallerySets();
    var srcs = gallerySets[id] || [];
    if (!srcs.length) return;
    galleryCurrentId = id;
    galleryIdx       = ((index % srcs.length) + srcs.length) % srcs.length;
    galleryOlImg.src = srcs[galleryIdx];
    galleryOverlay.classList.add('open');
    galleryOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeGallery() {
    galleryOverlay.classList.remove('open');
    galleryOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function galleryStep(dir) {
    var srcs = gallerySets[galleryCurrentId] || [];
    if (!srcs.length) return;
    galleryIdx = ((galleryIdx + dir) % srcs.length + srcs.length) % srcs.length;
    galleryOlImg.src = srcs[galleryIdx];
  }

  document.querySelectorAll('.m-img').forEach(function (el) {
    el.addEventListener('click', function () {
      buildGallerySets();
      var id  = el.getAttribute('data-gallery') || 'portraits';
      var src = el.querySelector('img') ? el.querySelector('img').src : '';
      var idx = (gallerySets[id] || []).indexOf(src);
      openGalleryAt(id, idx < 0 ? 0 : idx);
    });
  });

  if (galleryOlBackdrop) galleryOlBackdrop.addEventListener('click', closeGallery);
  if (galleryOlClose)    galleryOlClose.addEventListener('click', closeGallery);
  if (galleryPrevBtn)    galleryPrevBtn.addEventListener('click', function () { galleryStep(-1); });
  if (galleryNextBtn)    galleryNextBtn.addEventListener('click', function () { galleryStep(1); });

  document.addEventListener('keydown', function (e) {
    if (!galleryOverlay || !galleryOverlay.classList.contains('open')) return;
    if (e.key === 'Escape')     closeGallery();
    if (e.key === 'ArrowLeft')  galleryStep(-1);
    if (e.key === 'ArrowRight') galleryStep(1);
  });

  /* ── Project overlay ─────────────────────────────────────*/

  var overlay  = document.getElementById('projectOverlay');
  var frame    = document.getElementById('projectFrame');
  var backdrop = document.getElementById('overlayBackdrop');
  var closeBtn = document.getElementById('overlayClose');

  function openOverlay(url) {
    frame.src = url;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add('visible'); });
    });
  }

  function closeOverlay() {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (!overlay.classList.contains('visible')) {
        overlay.classList.remove('open');
        frame.src = '';
      }
    }, 320);
  }

  document.querySelectorAll('.work-card[data-overlay]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      openOverlay(card.getAttribute('href'));
    });
  });

  if (backdrop) backdrop.addEventListener('click', closeOverlay);
  if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closeOverlay();
  });

  /* ── Nav scroll shadow ───────────────────────────────────*/

  var siteNav = document.querySelector('.site-nav');
  function updateNav() {
    if (!siteNav) return;
    if (window.scrollY > 20) siteNav.classList.add('scrolled');
    else siteNav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Poster overlay ──────────────────────────────────────*/

  var posterOverlay    = document.getElementById('posterOverlay');
  var posterOlImg      = document.getElementById('posterOlImg');
  var posterOlClose    = document.getElementById('posterOlClose');
  var posterOlBackdrop = document.getElementById('posterOlBackdrop');

  document.querySelectorAll('.poster-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var img = card.querySelector('img');
      if (!img || !posterOverlay) return;
      posterOlImg.src = img.src;
      posterOverlay.classList.add('open');
      posterOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  function closePosterOverlay() {
    if (!posterOverlay) return;
    posterOverlay.classList.remove('open');
    posterOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (posterOlBackdrop) posterOlBackdrop.addEventListener('click', closePosterOverlay);
  if (posterOlClose)    posterOlClose.addEventListener('click', closePosterOverlay);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && posterOverlay && posterOverlay.classList.contains('open')) {
      closePosterOverlay();
    }
  });

  /* ── Bio overlay ─────────────────────────────────────────*/

  var bioOverlay    = document.getElementById('bioOverlay');
  var bioOlBackdrop = document.getElementById('bioOlBackdrop');
  var bioOlClose    = document.getElementById('bioOlClose');
  var bioReadMoreBtn = document.getElementById('bioReadMoreBtn');

  function openBio() {
    if (!bioOverlay) return;
    bioOverlay.classList.add('open');
    bioOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    /* Two-frame delay so display:flex is painted before opacity transitions */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bioOverlay.classList.add('visible');
      });
    });
  }
  function closeBio() {
    if (!bioOverlay) return;
    bioOverlay.classList.remove('visible');
    bioOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    /* Wait for fade-out transition before hiding */
    setTimeout(function () {
      if (!bioOverlay.classList.contains('visible')) {
        bioOverlay.classList.remove('open');
      }
    }, 320);
  }

  if (bioReadMoreBtn) bioReadMoreBtn.addEventListener('click', openBio);
  if (bioOlBackdrop)  bioOlBackdrop.addEventListener('click', closeBio);
  if (bioOlClose)     bioOlClose.addEventListener('click', closeBio);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bioOverlay && bioOverlay.classList.contains('open')) closeBio();
  });

  /* ── Section entrance animations ─────────────────────────*/

  if ('IntersectionObserver' in window) {
    var animObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          animObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    document.querySelectorAll('[data-anim]').forEach(function (el) {
      animObs.observe(el);
    });
  } else {
    document.querySelectorAll('[data-anim]').forEach(function (el) {
      el.classList.add('in-view');
    });
  }

  /* ── Custom cursor ───────────────────────────────────────*/

  var cursorEl = document.getElementById('custom-cursor');
  if (cursorEl) {
    cursorEl.style.opacity = '0'; /* hidden until first move */
    var cursorVisible = false;

    document.addEventListener('mousemove', function (e) {
      cursorEl.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      if (!cursorVisible) {
        cursorEl.style.opacity = '1';
        cursorVisible = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      cursorEl.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      if (cursorVisible) cursorEl.style.opacity = '1';
    });
  }

  /* ── Chai sticker swap ───────────────────────────────────*/

  var chaiWrap = document.querySelector('.sticker--chai');
  if (chaiWrap) {
    var chaiImg  = chaiWrap.querySelector('.chai-img');
    var FILLED   = 'hero section elements/chai_filled.png';
    var EMPTY    = 'hero section elements/chai empty.png';

    function chaiEmpty()  { chaiImg.src = EMPTY;  chaiWrap.classList.add('chai-active'); }
    function chaiFilled() { if (!chaiWrap.classList.contains('dragging')) { chaiImg.src = FILLED; chaiWrap.classList.remove('chai-active'); } }

    var chaiTip = chaiWrap.querySelector('.chai-tip');

    function fixTipPosition() {
      if (!chaiTip) return;
      chaiTip.style.transform = 'translateX(-50%) translateY(0)';
      var r = chaiTip.getBoundingClientRect();
      var overflow = r.right - window.innerWidth + 8;
      if (overflow > 0) {
        chaiTip.style.transform = 'translateX(calc(-50% - ' + overflow + 'px)) translateY(0)';
      } else if (r.left < 8) {
        chaiTip.style.transform = 'translateX(calc(-50% + ' + (8 - r.left) + 'px)) translateY(0)';
      }
    }

    chaiWrap.addEventListener('mouseenter', function () { chaiEmpty(); requestAnimationFrame(fixTipPosition); });
    chaiWrap.addEventListener('mouseleave', chaiFilled);
    chaiWrap.addEventListener('pointerdown', function () { chaiEmpty(); requestAnimationFrame(fixTipPosition); });
    chaiWrap.addEventListener('pointerup', function () {
      chaiWrap.classList.remove('dragging');
      chaiImg.src = FILLED;
      chaiWrap.classList.remove('chai-active');
    });
  }

  /* ── Sticker drag ────────────────────────────────────────*/

  document.querySelectorAll('.sticker').forEach(function (sticker) {
    var startX, startY, origLeft, origTop;

    sticker.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      sticker.setPointerCapture(e.pointerId);
      sticker.classList.add('dragging');
      var rect = sticker.getBoundingClientRect();
      var section = sticker.closest('.s-about');
      var sr = section.getBoundingClientRect();
      startX   = e.clientX;
      startY   = e.clientY;
      origLeft = rect.left - sr.left;
      origTop  = rect.top  - sr.top;
      sticker.style.left = origLeft + 'px';
      sticker.style.top  = origTop  + 'px';
    });

    sticker.addEventListener('pointermove', function (e) {
      if (!sticker.classList.contains('dragging')) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var section = sticker.closest('.s-about');
      var sr = section ? section.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      var sw = sticker.offsetWidth;
      var sh = sticker.offsetHeight;
      var newLeft = Math.max(0, Math.min(origLeft + dx, sr.width  - sw));
      var newTop  = Math.max(0, Math.min(origTop  + dy, sr.height - sh));
      sticker.style.left = newLeft + 'px';
      sticker.style.top  = newTop  + 'px';
    });

    sticker.addEventListener('pointerup', function () {
      sticker.classList.remove('dragging');
    });
  });

  /* ── Section 3: Selected works stacked cards on scroll ───*/

  var worksSection = document.querySelector('.s-works');

  function updateWorkCards() {
    if (!worksSection) return;
    /* Only animate visible cards (not the hidden extra grid) */
    var workCards = Array.from(document.querySelectorAll('#mainWorksGrid .work-card'));
    if (!workCards.length) return;

    var rect = worksSection.getBoundingClientRect();
    var raw  = clamp(
      (window.innerHeight - rect.top) / (window.innerHeight * 0.8),
      0, 1
    );
    var p = smoothstep(raw);

    workCards.forEach(function (card, i) {
      var n    = workCards.length;
      var mid  = (n - 1) / 2;
      var dist = i - mid;
      var stackedX = dist * 14;
      var stackedY = Math.abs(dist) * 8;
      var stackedR = dist * 1.5;

      var e = [0, 0, 0];
      var s = [stackedX, stackedY, stackedR];

      card.style.transform = [
        'translateX(' + lerp(s[0], e[0], p).toFixed(2) + 'px)',
        'translateY(' + lerp(s[1], e[1], p).toFixed(2) + 'px)',
        'rotate('     + lerp(s[2], e[2], p).toFixed(2) + 'deg)',
      ].join(' ');
    });
  }

  /* ── Works: View more / collapse toggle ──────────────────*/

  var worksExpandBtn   = document.getElementById('worksExpandBtn');
  var worksExtraGrid   = document.getElementById('worksExtraGrid');

  if (worksExpandBtn && worksExtraGrid) {
    /* Wire overlay clicks for the hidden extra cards immediately */
    worksExtraGrid.querySelectorAll('.work-card[data-overlay]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        openOverlay(card.getAttribute('href'));
      });
    });

    worksExpandBtn.addEventListener('click', function () {
      var isExpanded = worksExpandBtn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        worksExtraGrid.classList.remove('expanded');
        worksExtraGrid.setAttribute('aria-hidden', 'true');
        worksExpandBtn.setAttribute('aria-expanded', 'false');
        worksExpandBtn.textContent = 'View more ↓';
      } else {
        worksExtraGrid.classList.add('expanded');
        worksExtraGrid.setAttribute('aria-hidden', 'false');
        worksExpandBtn.setAttribute('aria-expanded', 'true');
        worksExpandBtn.textContent = 'View less ↑';
      }
    });
  }

  /* ── Posterfolio mobile prev/next ───────────────────────*/

  var posterTrackEl  = document.getElementById('posterTrack');
  var posterMobPrev  = document.getElementById('posterMobPrev');
  var posterMobNext  = document.getElementById('posterMobNext');

  function posterMobStep(dir) {
    if (!posterTrackEl) return;
    var card = posterTrackEl.querySelector('.poster-wrap');
    var step = card ? card.offsetWidth + 14 : 164;
    posterTrackEl.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  if (posterMobPrev) posterMobPrev.addEventListener('click', function () { posterMobStep(-1); });
  if (posterMobNext) posterMobNext.addEventListener('click', function () { posterMobStep(1); });

  /* ── Scroll & resize ─────────────────────────────────────*/

  function onScroll() { updateCards(); updatePosters(); updateWorkCards(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

})();
