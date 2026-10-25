/* GearUp — site behaviour
   Preserved: mobile menu, saved gear (localStorage), catalogue search/filter, demo newsletter.
   Added: scroll reveal, header state, product-stage tilt, key tester, switch-feel tabs,
          layout explorer, filter chips, back to top, "/" search shortcut. All motion respects reduced-motion. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- mobile navigation ---------- */
  const menuBtn = $('.menu-toggle'), nav = $('.main-nav');
  if (menuBtn && nav) {
    nav.id = nav.id || 'main-nav';
    menuBtn.setAttribute('aria-controls', nav.id);
    const setMenu = (open) => {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? '×' : '☰';
    };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* ---------- header state ---------- */
  const header = $('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- saved gear (local wishlist) ---------- */
  const KEY = 'gearup-saved';
  function getSaved() {
    try {
      const cur = localStorage.getItem(KEY);
      if (cur) return JSON.parse(cur);
      const old = localStorage.getItem('gearforge-saved');
      if (old) {
        localStorage.setItem(KEY, old);
        return JSON.parse(old);
      }
      return [];
    } catch (e) { return []; }
  }
  function setSaved(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  function updateSaved() {
    const list = getSaved();
    $$('#saved-count, .saved-count, #saved-count-mobile').forEach((el) => {
      el.textContent = list.length;
    });
    $$('[data-save]').forEach((b) => {
      const yes = list.includes(b.dataset.save);
      b.setAttribute('aria-pressed', String(yes));
      b.textContent = yes ? '♥ Saved' : '♡ Save';
    });
  }
  $$('[data-save]').forEach((b) => b.addEventListener('click', () => {
    let v = getSaved();
    v = v.includes(b.dataset.save) ? v.filter((x) => x !== b.dataset.save) : [...v, b.dataset.save];
    setSaved(v);
    updateSaved();
  }));
  updateSaved();

  /* ---------- catalogue search + filter ---------- */
  const search = $('#catalog-search'), filter = $('#catalog-filter'), clear = $('#clear-search');
  const cards = $$('#catalog-grid .catalog-card');
  let chipButtons = [];

  function runFilter() {
    const q = (search?.value || '').toLowerCase().trim(), f = filter?.value || 'all';
    let n = 0;
    cards.forEach((c) => {
      const ok = (c.dataset.title.includes(q) || c.textContent.toLowerCase().includes(q)) && (f === 'all' || c.dataset.category === f);
      const wasHidden = c.hidden;
      c.hidden = !ok;
      if (ok) {
        n++;
        if (wasHidden && !reduce) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
      }
    });
    const count = $('#catalog-count');
    if (count) count.textContent = `Showing ${n} ${n === 1 ? 'item' : 'items'} · Demo catalogue`;
    const empty = $('#empty-state');
    if (empty) empty.hidden = n > 0;
    chipButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === f)));
  }
  if (search) search.addEventListener('input', runFilter);
  if (filter) filter.addEventListener('change', runFilter);
  if (clear) clear.addEventListener('click', () => { search.value = ''; filter.value = 'all'; runFilter(); });

  // category chips (enhance the select; select stays as fallback without JS)
  const chipHost = $('#filter-chips');
  if (chipHost && filter) {
    chipButtons = Array.from(filter.options).map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.value = o.value;
      b.textContent = o.value === 'all' ? 'All' : o.textContent;
      b.setAttribute('aria-pressed', String(o.value === filter.value));
      b.addEventListener('click', () => { filter.value = o.value; runFilter(); });
      chipHost.appendChild(b);
      return b;
    });
    document.body.classList.add('has-chips');
  }

  // "/" focuses search
  if (search) {
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.matches('input, textarea, select') || t.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); search.focus(); }
    });
  }

  /* ---------- newsletter (demo) ---------- */
  const newsletter = $('#newsletter-form');
  if (newsletter) newsletter.addEventListener('submit', (e) => {
    e.preventDefault();
    $('#newsletter-note').textContent = 'Thanks! This demo sign-up is not connected to an email service.';
    newsletter.reset();
  });

  /* ---------- footer newsletter (demo) ---------- */
  const footerNews = $('#footer-newsletter-form');
  if (footerNews) {
    footerNews.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = $('#footer-news-note');
      if (note) note.textContent = 'Thanks for joining the GearUp drop list!';
      footerNews.reset();
      setTimeout(() => { if (note) note.textContent = ''; }, 4500);
    });
  }

  /* ---------- back to top functionality ---------- */
  const btt = $('#back-to-top');
  if (btt) {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const checkBtt = () => btt.classList.toggle('visible', window.scrollY > 280);
    checkBtt();
    window.addEventListener('scroll', checkBtt, { passive: true });
    btt.addEventListener('click', scrollToTop);
  }

  /* ---------- scroll reveal ---------- */
  const reveals = $$('.reveal');
  if (reveals.length) {
    // stagger siblings
    const groups = new Map();
    reveals.forEach((el) => { const p = el.parentElement; groups.set(p, (groups.get(p) || []).concat(el)); });
    groups.forEach((els) => els.forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`)));
    const done = (el) => setTimeout(() => el.classList.remove('reveal', 'in'), 1500);
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); done(en.target); io.unobserve(en.target); } });
      }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach((el) => io.observe(el));
    }
  }

  /* ---------- product stage tilt + light ---------- */
  $$('[data-tilt]').forEach((stage) => {
    const frame = $('.stage-frame', stage);
    if (!frame || reduce || !finePointer) return;
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      frame.style.setProperty('--ry', `${((x - .5) * 7).toFixed(2)}deg`);
      frame.style.setProperty('--rx', `${((.5 - y) * 6).toFixed(2)}deg`);
      frame.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      frame.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    stage.addEventListener('pointerleave', () => {
      ['--rx', '--ry', '--mx', '--my'].forEach((p) => frame.style.removeProperty(p));
    });
  });

  /* ---------- key tester (signature interaction) ---------- */
  const rig = $('#keytest');
  if (rig) {
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const stops = [[82, 229, 255], [148, 113, 255], [255, 79, 163]];
    const colorAt = (t) => {
      const seg = t < .5 ? 0 : 1, lt = t < .5 ? t * 2 : (t - .5) * 2;
      const a = stops[seg], b = stops[seg + 1];
      return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * lt)).join(',')})`;
    };
    const keys = [];
    const add = (label, cls, cx, cy, t) => {
      const k = document.createElement('div');
      k.className = 'kc' + (cls ? ' ' + cls : '');
      k.textContent = label;
      k.dataset.k = label;
      k.style.setProperty('--c', colorAt(t));
      k._pos = { x: cx, y: cy };
      rig.appendChild(k);
      keys.push(k);
      return k;
    };
    const offsets = [0, .5, 1.5];
    rows.forEach((row, ri) => {
      [...row].forEach((ch, ci) => add(ch, ci === 0 ? ['', 'r2', 'r3'][ri] : '', offsets[ri] + ci, ri, (offsets[ri] + ci) / 10));
    });
    add('', 'space', 5.5, 3, .5).dataset.k = ' ';
    const map = new Map(keys.map((k) => [k.dataset.k, k]));
    const readout = $('#key-readout');
    let presses = 0;

    const ripple = (src, strong = 1) => {
      keys.forEach((k) => {
        const d = Math.hypot(k._pos.x - src._pos.x, (k._pos.y - src._pos.y) * 1.2);
        const v = k === src ? 1 : Math.max(0, 1 - d / 3.4) * .65 * strong;
        k.style.setProperty('--i', v.toFixed(2));
      });
      clearTimeout(ripple.t);
      ripple.t = setTimeout(() => keys.forEach((k) => k.style.setProperty('--i', 0)), 420);
    };
    const press = (k, silent) => {
      k.classList.add('on');
      ripple(k);
      if (!silent) {
        presses++;
        if (readout) readout.textContent = `Last key: ${k.dataset.k === ' ' ? 'Space' : k.dataset.k} · ${presses} ${presses === 1 ? 'press' : 'presses'}`;
      }
    };
    const release = (k) => k.classList.remove('on');

    document.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.matches('input, textarea, select')) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const k = map.get(e.key.length === 1 ? e.key.toUpperCase() : '');
      if (k) press(k);
    });
    document.addEventListener('keyup', (e) => { const k = map.get(e.key.length === 1 ? e.key.toUpperCase() : ''); if (k) release(k); });
    rig.addEventListener('pointerdown', (e) => { const k = e.target.closest('.kc'); if (k) press(k); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => rig.addEventListener(ev, () => keys.forEach(release)));

    // one-time welcome wave when the rig first scrolls into view
    if (!reduce && 'IntersectionObserver' in window) {
      const wave = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return;
        wave.disconnect();
        keys.filter((k) => k.dataset.k !== ' ').sort((a, b) => a._pos.x - b._pos.x).forEach((k, i) => {
          setTimeout(() => { k.classList.add('on'); ripple(k, .6); setTimeout(() => release(k), 140); }, i * 55);
        });
      }, { threshold: .5 });
      wave.observe(rig);
    }
  }

  /* ---------- tabs helper (arrow-key support) ---------- */
  function wireTabs(list, onSelect) {
    const tabs = $$('[role=tab]', list);
    const select = (tab, focus) => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      onSelect(tab);
    };
    tabs.forEach((t, i) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
  }

  /* ---------- switch feel tabs ---------- */
  const feelTabs = $('#feel-tabs'), feelPanel = $('#feel-panel');
  if (feelTabs && feelPanel) {
    const desc = $('#feel-desc'), fills = $$('.bar i', feelPanel);
    wireTabs(feelTabs, (tab) => {
      feelPanel.dataset.feel = tab.dataset.key;
      feelPanel.setAttribute('aria-labelledby', tab.id);
      desc.textContent = tab.dataset.desc;
      tab.dataset.m.split(',').forEach((v, i) => fills[i] && fills[i].style.setProperty('--v', `${v}%`));
      // restart the draw animation
      const p = $(`.c-${tab.dataset.key}`, feelPanel);
      if (p) { p.style.animation = 'none'; void p.getBoundingClientRect(); p.style.animation = ''; }
    });
    const first = $('[aria-selected=true]', feelTabs);
    if (first) requestAnimationFrame(() => first.dataset.m.split(',').forEach((v, i) => fills[i] && fills[i].style.setProperty('--v', `${v}%`)));
  }

  /* ---------- keyboard layout explorer ---------- */
  const kd = $('#kbd-diagram');
  if (kd) {
    const parts = {
      full: ['fn', 'main', 'nav', 'arrows', 'num'],
      tkl: ['fn', 'main', 'nav', 'arrows'],
      '75': ['fn', 'main', 'arrows'],
      '65': ['main', 'arrows'],
      '60': ['main']
    };
    const copy = {
      full: 'Everything on one board: function row, navigation keys, arrow keys and a dedicated number pad.',
      tkl: 'Tenkeyless: the number pad is gone, which leaves more room for mouse movement.',
      '75': 'Compact but complete: keeps the function row and arrow keys in a tight block.',
      '65': 'Drops the function row and keeps the arrow keys.',
      '60': 'Just the main block. The smallest footprint, with other keys reached through layers.'
    };
    let n = 0;
    const mk = (part, u = 1) => { const k = document.createElement('i'); k.className = 'k'; k.dataset.part = part; k.style.setProperty('--u', u); k.style.setProperty('--n', n++); return k; };
    const row = (cells, sp) => { const r = document.createElement('div'); r.className = 'kr' + (sp ? ' sp' : ''); cells.forEach((c) => r.appendChild(c)); return r; };
    const col = (rowsArr) => { const c = document.createElement('div'); c.className = 'kd-col'; rowsArr.forEach((r) => c.appendChild(r)); return c; };
    const rep = (part, count, u = 1) => Array.from({ length: count }, () => mk(part, u));

    const mainRows = [
      [...rep('main', 13), mk('main', 2)],
      [mk('main', 1.5), ...rep('main', 12), mk('main', 1.5)],
      [mk('main', 1.75), ...rep('main', 11), mk('main', 2.25)],
      [mk('main', 2.25), ...rep('main', 10), mk('main', 2.75)],
      [...rep('main', 3, 1.25), mk('main', 6.25), ...rep('main', 4, 1.25)]
    ];
    kd.appendChild(col([row(rep('fn', 15)), ...mainRows.map((r) => row(r))]));
    kd.appendChild(col([
      row([], true), row(rep('nav', 3)), row(rep('nav', 3)), row([], true),
      row([mk('spacer'), mk('arrows'), mk('spacer')]),
      row(rep('arrows', 3))
    ]));
    kd.appendChild(col([row([], true), ...Array.from({ length: 5 }, () => row(rep('num', 4)))]));
    $$('.k[data-part=spacer]', kd).forEach((s) => { s.style.visibility = 'hidden'; });

    const desc = $('#layout-desc');
    const apply = (key) => {
      kd.dataset.layout = key;
      const view = $('#layout-view');
      if (view) view.setAttribute('aria-labelledby', `lt-${key}`);
      $$('.k', kd).forEach((k) => k.classList.toggle('off', k.dataset.part !== 'spacer' && !parts[key].includes(k.dataset.part)));
      desc.textContent = copy[key];
    };
    wireTabs($('#layout-tabs'), (tab) => apply(tab.dataset.layout));
    apply('full');
  }

  /* ---------- 1. Web-HID Control Engine (index.html) ---------- */
  const engineBtns = $$('.engine-btn');
  if (engineBtns.length) {
    const profiles = {
      fps: {
        name: 'FPS Rapid-Trigger Calibration',
        desc: 'Dynamic reset disengages the key the microsecond your finger begins upward travel. Zero physical reset delay for unmatched counter-strafing.',
        actuation: '0.4 mm',
        width: '28%',
        sens: '0.15 mm Ultra',
        deadzone: '0.05 mm Precision',
        polling: '8,000 Hz'
      },
      typing: {
        name: 'Acoustic Typing Calibration',
        desc: 'Smooth progressive 1.8mm actuation depth with cushioned bottom-out hysteresis for maximum typing comfort and zero accidental keystrokes.',
        actuation: '1.8 mm',
        width: '55%',
        sens: '1.8 mm Deep',
        deadzone: '0.4 mm Cushion',
        polling: '1,000 Hz'
      },
      stealth: {
        name: 'Night Studio Stealth Calibration',
        desc: 'Silent low-force trigger with optimized soft-return sensing, reducing key impact shockwaves during late night streaming or audio recording.',
        actuation: '1.2 mm',
        width: '40%',
        sens: '1.2 mm Soft',
        deadzone: '0.2 mm Dampened',
        polling: '4,000 Hz'
      }
    };

    engineBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        engineBtns.forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        const p = profiles[btn.dataset.profile];
        if (!p) return;
        const nameEl = $('#engine-mode-name');
        const descEl = $('#engine-mode-desc');
        const actValEl = $('#actuation-val');
        const actBarEl = $('#actuation-bar');
        const sensEl = $('#engine-sens');
        const deadEl = $('#engine-deadzone');
        const pollEl = $('#engine-polling');

        if (nameEl) nameEl.textContent = p.name;
        if (descEl) descEl.textContent = p.desc;
        if (actValEl) actValEl.textContent = p.actuation;
        if (actBarEl) actBarEl.style.width = p.width;
        if (sensEl) sensEl.textContent = p.sens;
        if (deadEl) deadEl.textContent = p.deadzone;
        if (pollEl) pollEl.textContent = p.polling;
      });
    });
  }

  /* ---------- 2. Acoustic Gasket Anatomy (keyboards.html) ---------- */
  const anatomyLayers = $$('.anatomy-layer');
  if (anatomyLayers.length) {
    const layers = {
      pbt: {
        title: 'Acoustic Tone: 180 Hz Deep Resonance ("Thock")',
        sub: 'Full 5-layer acoustic dampening engaged. 0% metallic ping detected.',
        bars: [28, 36, 30, 22, 16, 10, 8, 6]
      },
      fr4: {
        title: 'Acoustic Tone: 210 Hz Mellow Pop',
        sub: 'Per-switch laser relief cuts soften bottom-out impact across all rows.',
        bars: [20, 32, 38, 26, 14, 8, 6, 6]
      },
      ixpe: {
        title: 'Acoustic Tone: 195 Hz Clean Marbly Sound',
        sub: 'Micro-cellular pad removes metallic leaf ping directly at the solder pad.',
        bars: [24, 30, 36, 30, 18, 12, 8, 6]
      },
      poron: {
        title: 'Acoustic Tone: 175 Hz Isolated Bass Strike',
        sub: 'Viscoelastic tabs isolate vibration from the outer aluminum chassis.',
        bars: [32, 38, 28, 20, 14, 8, 6, 6]
      },
      silicone: {
        title: 'Acoustic Tone: 160 Hz Solid Acoustic Density',
        sub: 'Custom molded silicone base absorbs all hollow case reverb and cavity echo.',
        bars: [36, 40, 32, 18, 12, 6, 6, 6]
      }
    };

    const readoutTitle = $('#anatomy-readout-title');
    const readoutSub = $('#anatomy-readout-sub');
    const bars = $$('.console-spectrum .spectrum-bar');

    anatomyLayers.forEach((layer) => {
      const activate = () => {
        anatomyLayers.forEach((l) => {
          l.classList.remove('is-active');
          l.setAttribute('aria-pressed', 'false');
        });
        layer.classList.add('is-active');
        layer.setAttribute('aria-pressed', 'true');

        const key = layer.dataset.layer;
        const d = layers[key];
        if (!d) return;
        if (readoutTitle) readoutTitle.textContent = d.title;
        if (readoutSub) readoutSub.textContent = d.sub;
        if (bars.length && d.bars) {
          bars.forEach((b, i) => {
            b.style.height = `${d.bars[i] || 10}px`;
            b.classList.toggle('active', (d.bars[i] || 0) > 12);
          });
        }
      };

      layer.addEventListener('click', activate);
      layer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  /* ---------- 3. Esports Grip & Kinematics Lab (peripherals.html) ---------- */
  const gripCards = $$('.grip-card');
  if (gripCards.length) {
    const gripData = {
      claw: { glide: '0.04 μ Virgin-Grade', lod: '0.7 mm Optical Calibrated', ips: '750 IPS / 70G Accel' },
      palm: { glide: '0.06 μ Controlled PTFE', lod: '1.0 mm Stable Lift', ips: '650 IPS / 50G Accel' },
      fingertip: { glide: '0.03 μ Ultra-Speed Ceramic', lod: '0.6 mm Ultra-Low', ips: '800 IPS / 75G Accel' }
    };

    const stripGlide = $('#strip-glide');
    const stripLod = $('#strip-lod');
    const stripIps = $('#strip-ips');

    gripCards.forEach((card) => {
      card.addEventListener('click', () => {
        gripCards.forEach((c) => c.classList.remove('is-active'));
        card.classList.add('is-active');

        const d = gripData[card.dataset.grip];
        if (!d) return;
        if (stripGlide) stripGlide.textContent = d.glide;
        if (stripLod) stripLod.textContent = d.lod;
        if (stripIps) stripIps.textContent = d.ips;
      });
    });
  }

  /* ---------- 4. Switch Lubricant Longevity Calculator (guides.html) ---------- */
  const calcBtns = $$('.calc-btn');
  if (calcBtns.length) {
    const calcData = {
      '2': { interval: '18 – 24 Months', strokes: 'Estimated 35M Keystrokes Before Relube' },
      '6': { interval: '9 – 12 Months', strokes: 'Estimated 25M Keystrokes Before Relube' },
      '12': { interval: '4 – 6 Months', strokes: 'Estimated 18M Keystrokes Before Relube' }
    };

    const calcInterval = $('#calc-interval');
    const calcKeystrokes = $('#calc-keystrokes');

    calcBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        calcBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        const d = calcData[btn.dataset.hours];
        if (!d) return;
        if (calcInterval) calcInterval.textContent = d.interval;
        if (calcKeystrokes) calcKeystrokes.textContent = d.strokes;
      });
    });
  }
})();

