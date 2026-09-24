(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Native horizontal browsing works with touch, trackpad, buttons and keyboard. */
  document.querySelectorAll('.marquee-outer').forEach(function (outer) {
    outer.tabIndex = 0;
    outer.setAttribute('role', 'region');
    outer.setAttribute('aria-label', outer.dataset.galleryId === 'portraits' ? 'Portrait and editorial photography' : 'Product and still-life photography');
    var row = outer.closest('.gallery-row-wrap');
    function step(dir) {
      outer.scrollBy({ left: dir * outer.clientWidth * 0.8, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    row.querySelector('.marquee-prev').addEventListener('click', function () { step(-1); });
    row.querySelector('.marquee-next').addEventListener('click', function () { step(1); });
    outer.addEventListener('keydown', function (e) {
      if (e.target !== outer) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
    });
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
    galleryOlImg.alt = (galleryCurrentId === 'portraits' ? 'Portrait and editorial photograph ' : 'Product and still-life photograph ') + (galleryIdx + 1);
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
    galleryOlImg.alt = (galleryCurrentId === 'portraits' ? 'Portrait and editorial photograph ' : 'Product and still-life photograph ') + (galleryIdx + 1);
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
      posterOlImg.alt = img.alt;
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
  var bioReadMoreBtns = document.querySelectorAll('[data-open-bio]');

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

  bioReadMoreBtns.forEach(function (button) { button.addEventListener('click', openBio); });
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

  document.querySelectorAll('.sticker:not(.sticker--social)').forEach(function (sticker) {
    var startX, startY, origLeft, origTop;
    var isLink = sticker.matches('a[href]');
    var hasDragged = false;

    sticker.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      hasDragged = false;
      e.preventDefault();
      if (isLink) sticker.focus({ preventScroll: true });
      sticker.setPointerCapture(e.pointerId);
      sticker.classList.add('dragging');
      var rect = sticker.getBoundingClientRect();
      var section = sticker.closest('.s-about');
      var sr = section.getBoundingClientRect();
      startX   = e.clientX;
      startY   = e.clientY;
      origLeft = rect.left - sr.left;
      origTop  = rect.top  - sr.top;
      if (!isLink) {
        sticker.style.left = origLeft + 'px';
        sticker.style.top  = origTop  + 'px';
      }
    });

    sticker.addEventListener('pointermove', function (e) {
      if (!sticker.classList.contains('dragging')) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 6) hasDragged = true;
      if (isLink && !hasDragged) return;
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
    sticker.addEventListener('pointercancel', function () {
      hasDragged = true;
      sticker.classList.remove('dragging');
    });
    sticker.addEventListener('lostpointercapture', function () {
      sticker.classList.remove('dragging');
    });
    if (isLink) sticker.addEventListener('click', function (e) {
      // Keyboard clicks have detail 0 and must remain usable after a drag.
      if (hasDragged && e.detail !== 0) e.preventDefault();
    });
  });

  /* ── Posterfolio mobile prev/next ───────────────────────*/

  var posterTrackEl  = document.getElementById('posterTrack');
  var posterMobPrev  = document.getElementById('posterMobPrev');
  var posterMobNext  = document.getElementById('posterMobNext');

  function posterMobStep(dir) {
    if (!posterTrackEl) return;
    var card = posterTrackEl.querySelector('.poster-wrap');
    var gap = parseFloat(getComputedStyle(posterTrackEl).gap) || 0;
    var step = card ? card.offsetWidth + gap : 240;
    posterTrackEl.scrollBy({ left: dir * step, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  if (posterMobPrev) posterMobPrev.addEventListener('click', function () { posterMobStep(-1); });
  if (posterMobNext) posterMobNext.addEventListener('click', function () { posterMobStep(1); });

  /* Keyboard access and focus management for existing image/story viewers. */
  document.querySelectorAll('.m-img, .poster-card').forEach(function (el) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Enlarge ' + el.querySelector('img').alt);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });
  [galleryOverlay, posterOverlay, bioOverlay].forEach(function (dialog) {
    if (!dialog) return;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', dialog === bioOverlay ? 'About Harshita' : 'Image viewer');
    dialog.inert = true;
    var returnFocus;
    new MutationObserver(function () {
      var open = dialog.getAttribute('aria-hidden') === 'false';
      dialog.inert = !open;
      document.querySelector('main').inert = open;
      document.querySelector('.site-nav').inert = open;
      if (open) {
        returnFocus = document.activeElement;
        dialog.querySelector('button').focus();
      } else if (returnFocus) { returnFocus.focus(); }
    }).observe(dialog, { attributes: true, attributeFilter: ['aria-hidden'] });
    dialog.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = Array.from(dialog.querySelectorAll('button, a[href]'));
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  });

})();
