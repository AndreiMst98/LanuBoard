/* LANU presentation website — language, hero, interactive Operations tour, contact form. No dependencies. */
(function () {
  'use strict';
  var T = window.LANU_I18N;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = pickLang();

  function pickLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (T[q]) return q;
    try { var s = localStorage.getItem('lanu-lang'); if (T[s]) return s; } catch (e) {}
    return (navigator.language || '').slice(0, 2).toLowerCase() === 'de' ? 'de' : 'en';
  }
  function t(key, vars) {
    var s = (T[lang][key] !== undefined ? T[lang][key] : T.en[key]);
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(n) { return n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(min) { return pad(Math.floor(min / 60) % 24) + ':' + pad(min % 60); }

  // ------------------------------------------------------------------ static copy
  function applyCopy() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    var words = t('heroTitle').split(' '), hl = t('heroHl');
    document.getElementById('hero-title').innerHTML = words.map(function (w, i) {
      return '<span class="w' + (i >= words.length - hl ? ' hl' : '') + '" style="--i:' + i + '">' + esc(w) + '</span>';
    }).join(' ');
    document.querySelectorAll('[data-i18n-tpl]').forEach(function (el) { el.textContent = t(el.dataset.i18nTpl, { n: el.dataset.n }); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    document.getElementById('tour-kicker').textContent = 'LANU Board · ' + t(PAGES[page].name);
    document.title = lang === 'de' ? 'LANU Board – Ihr ganzer Liefertag auf einem Bildschirm' : 'LANU Board — your whole delivery day on one screen';
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.dataset.lang;
      try { localStorage.setItem('lanu-lang', lang); } catch (e) {}
      applyCopy(); renderBenefits(); renderTicker(); renderSteps(); renderMock(); focusStep(active, true); moveInd();
    });
  });

  // ------------------------------------------------------------------ fictional data (no real people)
  var NAMES = ['Lukas Weber', 'Mihai Stan', 'Jonas Becker', 'Elena Marin', 'Tobias Klein', 'Radu Ionescu', 'Sven Hoffmann', 'Ioana Dinu', 'Kevin Wagner', 'Marek Nowak',
    'Cristian Lazar', 'Felix Braun', 'Daniel Rusu', 'Paul Schmitt', 'Adrian Barbu', 'Nico Fischer', 'Vlad Tudor', 'Julian Koch', 'Sorin Matei', 'Leon Schulz',
    'Bogdan Neagu', 'Erik Lange', 'Ana Petrescu', 'David Krause', 'Victor Ene', 'Timo Wolf', 'Florin Dumitru', 'Max Richter', 'Dragos Oprea', 'Jan Zimmer',
    'Ionut Pavel', 'Lena Vogel', 'George Toma', 'Moritz Hahn', 'Tomasz Kowal', 'Alina Voicu', 'Robert Engel', 'Petru Gavril'];
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var tmp = a[i]; a[i] = a[j]; a[j] = tmp; } return a; }
  function between(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }

  var dayOffset = 0; // 0 = today, -1 … -59 = saved days
  var data, liveDelivered;

  function makeDay(off) {
    var r = rng(4242 + off * 97), live = off === 0, names = shuffle(NAMES, r);
    var routes = [];
    for (var i = 0; i < 20; i++) {
      var total = between(r, 12, 30), onRoute = live && i < 3, signIn = between(r, 13 * 60 + 50, 14 * 60 + 20);
      if (i < 3) { total = between(r, 70, 88); signIn = between(r, 11 * 60, 11 * 60 + 12); }
      var done = onRoute ? total - between(r, 1, 6) : (r() < .12 ? total - 1 : total);
      routes.push({ name: names[i], route: 'D-' + (100 + between(r, 1, 240)) + (i < 3 && r() < .5 ? ', D-' + (100 + between(r, 1, 240)) : ''), signIn: hm(signIn), done: done, total: total, signOut: onRoute ? '–' : hm(signIn + between(r, 140, 420)), onRoute: onRoute });
    }
    var unknown = names.slice(3, 12).map(function (n) { return { name: n, stops: between(r, 1, 6), min: between(r, 22, 52) }; }).sort(function (a, b) { return b.min - a.min; });
    var breaks = names.slice(6, 15).map(function (n, i) {
      var st = live && i < 2 ? 'on' : (i === 8 ? 'none' : 'done');
      return { name: n, status: st, min: st === 'on' ? between(r, 8, 25) : st === 'none' ? 0 : between(r, 38, 47) };
    });
    var kenjo = names.slice(0, 8).map(function (n, i) {
      var st = i === 0 ? 'closed' : (i === 1 ? 'missing' : 'in');
      var ci = between(r, 9 * 60 + 40, 11 * 60 + 40);
      return { name: n, status: st, checkIn: st === 'missing' ? '–' : hm(ci), tracked: st === 'missing' ? '–' : hm(between(r, 360, 660)) };
    });
    var mentor = names.slice(10, 18).map(function (n, i) {
      var s = between(r, 11 * 60 + 20, 15 * 60 + 40), d = between(r, 70, 300);
      return { name: n, noMentor: i < 2, start: hm(s), end: hm(s + d), dur: pad(Math.floor(d / 60)) + ':' + pad(d % 60), trip: 1, short: i < 2 || i === 7 };
    });
    var problems = names.slice(2, 11).map(function (n, i) {
      var p = { name: n, failed: i > 6 ? 1 : 0, retry: i === 3 ? between(r, 3, 5) : 0, undel: i === 4 || i === 6 ? between(r, 1, 2) : 0, missing: i < 3 ? 1 : 0 };
      p.total = p.failed + p.retry + p.undel + p.missing; return p;
    }).sort(function (a, b) { return b.missing - a.missing || b.total - a.total; });
    var highValue = [{ name: names[18], n: 3 }, { name: names[19], n: 1 }, { name: names[20], n: 1 }];
    var tours = live ? 64 : between(r, 58, 70), totalPk = live ? 8530 : between(r, 7600, 8900);
    var delivered = live ? 8412 : totalPk - between(r, 6, 40);
    var risk = live ? 2 : between(r, 0, 3);
    return { live: live, routes: routes, unknown: unknown, breaks: breaks, kenjo: kenjo, mentor: mentor, problems: problems, highValue: highValue,
      tours: tours, onRoute: live ? 6 : 0, totalPk: totalPk, delivered: delivered, risk: risk, riskName: names[1], riskTime: hm(21 * 60 + between(r, 2, 40)),
      kenjoIn: 9, kenjoOut: 55 };
  }

  // ------------------------------------------------------------------ mock screen
  var mock = document.getElementById('mock');
  var screenEl = document.getElementById('screen');
  function dateFor(off) { var d = new Date(); d.setDate(d.getDate() + off); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function longDate() {
    return new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function nowStr() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function ph(title, count, cls, extra) {
    return '<div class="m-ph"><h4>' + title + '</h4>' + (count !== null ? '<span class="m-cnt ' + (cls || '') + '">' + count + '</span>' : '') + (extra || '') + '<span class="m-ago">' + t('mAgoM', { n: 1 }) + '</span></div>';
  }
  var ICAL = '<svg class="ic" width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>';

  function topBar(title) {
    return '<div class="m-top"><span class="m-ham"></span><div class="m-title"><b>' + title + '</b><span>' + esc(longDate()) + '</span></div>' +
      '<span class="m-livepill"><i></i>' + t('mLive') + ' <span data-clock>' + nowStr() + '</span></span>' +
      '<div class="m-topr"><span class="m-seg"><span>RO</span><span' + (lang === 'de' ? ' class="on"' : '') + '>DE</span><span' + (lang === 'en' ? ' class="on"' : '') + '>EN</span></span><span class="m-ic"><em>4</em></span><span class="m-ic"></span><span class="m-user"><i>D</i>' + t('mDispatcher') + '</span></div></div>';
  }
  function renderMock() { if (page === 'da') renderDa(); else if (page === 'cp') renderCp(); else renderOps(); }
  function renderOps() {
    data = makeDay(dayOffset);
    if (dayOffset !== 0 || liveDelivered === undefined) liveDelivered = data.delivered;
    var d = data, pct = Math.round(d.delivered / d.totalPk * 1000) / 10;
    if (d.live) pct = Math.round(liveDelivered / d.totalPk * 1000) / 10;
    var signedOut = d.tours - d.onRoute;
    var routes = d.routes.map(function (x) {
      var p = Math.round(x.done / x.total * 100);
      return '<tr' + (x.onRoute ? '' : ' class="dim"') + '><td class="nm">' + esc(x.name) + '</td><td>' + x.route + '</td><td>' + x.signIn + '</td><td>' + x.done + '/' + x.total +
        '<span class="m-bar" style="--c:' + (x.onRoute ? '#2F6BFF' : '#1E9E5A') + '"><i style="width:' + p + '%"></i></span></td><td>' + x.signOut + '</td></tr>';
    }).join('');
    var unknown = d.unknown.map(function (x) { return '<tr class="flag"><td class="nm">' + esc(x.name) + '</td><td class="r">' + x.stops + '</td><td class="r"><b>' + t('mMin', { n: x.min }) + '</b></td></tr>'; }).join('');
    var breaks = d.breaks.map(function (x) {
      var pill = x.status === 'on' ? '<span class="m-pill b">' + t('mOnBreak') + '</span>' : x.status === 'none' ? '<span class="m-pill o">' + t('mNoBreak') + '</span>' : '<span class="m-pill">' + t('mFinished') + '</span>';
      return '<tr><td class="nm">' + esc(x.name) + '</td><td>' + pill + '</td><td class="r"' + (x.status === 'on' ? ' data-break' : '') + '>' + x.min + '</td></tr>';
    }).join('');
    var kenjo = d.kenjo.map(function (x) {
      var pill = x.status === 'in' ? '<span class="m-pill g">' + t('mCheckedIn') + '</span>' : x.status === 'missing' ? '<span class="m-pill r">' + t('mNotCheckedIn') + '</span>' : '<span class="m-pill o">' + t('mKenjoClosed') + '</span>';
      return '<tr' + (x.status === 'missing' ? ' class="flag"' : x.status === 'closed' ? ' class="warn"' : '') + '><td class="nm">' + esc(x.name) + '</td><td>' + pill + '</td><td>' + x.checkIn + '</td><td>' + x.tracked + '</td></tr>';
    }).join('');
    var mentor = d.mentor.map(function (x) {
      return '<tr' + (x.noMentor ? ' class="flag"' : '') + '><td class="nm">' + esc(x.name) + '</td><td>' + (x.noMentor ? '<span class="m-pill r">' + t('mNoMentor') + '</span>' : x.start) + '</td><td>' + x.end + '</td><td>' + x.dur + '</td><td class="c">' + x.trip + '</td><td class="c">' +
        (x.short ? '<svg class="m-flag" width="12" height="14" viewBox="0 0 12 14"><path d="M1 13V1h9l-2 3 2 3H1" fill="currentColor"/></svg>' : '–') + '</td></tr>';
    }).join('');
    var problems = d.problems.map(function (x) {
      return '<tr' + (x.missing ? ' class="flag"' : '') + '><td class="nm">' + esc(x.name) + '</td><td class="r">' + x.failed + '</td><td class="r">' + x.retry + '</td><td class="r">' + x.undel + '</td><td class="r">' + (x.missing ? '<span class="m-dot">● ' + x.missing + '</span>' : 0) + '</td><td class="r"><b>' + x.total + '</b></td></tr>';
    }).join('');
    var high = d.highValue.map(function (x) { return '<tr><td class="nm">' + esc(x.name) + '</td><td class="r"><b>' + x.n + '</b></td></tr>'; }).join('');
    var mentorFlags = d.mentor.filter(function (x) { return x.noMentor; }).length;

    mock.innerHTML =
      topBar(t('mOperations')) +
      '<div class="m-body">' +
      '<div class="m-panel m-date" data-p="history"><span class="ci">' + ICAL + '</span><div><b>' + (d.live ? t('mTodayLive') : t('mPastDay')) + '</b><span>' + t('mHistoryNote') + '</span></div>' +
      '<div class="m-dnav"><button type="button" data-day="-1" aria-label="Previous day"' + (dayOffset <= -59 ? ' disabled' : '') + '>‹</button><span class="dv">' + dateFor(dayOffset) + ' <span>▾</span></span><button type="button" data-day="1" aria-label="Next day"' + (dayOffset >= 0 ? ' disabled' : '') + '>›</button></div></div>' +

      '<div class="m-panel m-kpis" data-p="overview">' +
      '<div class="m-kpi"><div class="m-kh">' + t('mDelivered') + '<small>' + t('mAgoS', { n: 50 }) + '</small></div><div class="m-kbig"><b data-delivered>' + fmt(d.live ? liveDelivered : d.delivered) + '</b><span>' + t('mOf', { n: fmt(d.totalPk) }) + '</span></div>' +
      '<div class="m-prog"><span class="tr"><i data-pbar style="width:' + pct + '%"></i></span><b data-pct>' + Math.floor(pct) + '%</b></div><div class="m-note" data-stillout>' + t('mStillOut', { n: fmt(d.totalPk - (d.live ? liveDelivered : d.delivered)) }) + '</div></div>' +
      '<div class="m-kpi"><div class="m-kh"><span class="m-tours">' + t('mToursToday') + ' <b>' + d.tours + '</b></span><small>' + t('mAgoS', { n: 36 }) + '</small></div>' +
      '<div class="m-split"><i style="width:' + (signedOut / d.tours * 100) + '%"></i>' + (d.onRoute ? '<i style="width:' + (d.onRoute / d.tours * 100) + '%"></i>' : '') + '</div>' +
      '<div class="m-leg"><span style="--c:#1E9E5A">' + t('mSignedOut') + '</span><span style="--c:#2F6BFF">' + t('mOnRoute') + '</span><span style="--c:#C3CBDA">' + t('mNotDeparted') + '</span><b>' + signedOut + '</b><b>' + d.onRoute + '</b><b>0</b></div></div>' +
      '<div class="m-kpi m-risk">' + t('mRisk') + '<b>' + d.risk + '</b><p>' + (d.risk ? esc(t('mRiskFirst', { name: d.riskName, time: d.riskTime })) : '–') + '</p><a>' + t('mViewDrivers') + ' ›</a></div></div>' +

      '<div class="m-grid2">' +
      '<div class="m-panel" data-p="routes">' + ph(t('mRouteSummary'), d.tours) + '<table class="m-t"><thead><tr><th>' + t('mDriver') + '</th><th>' + t('mRoute') + '</th><th>' + t('mSignIn') + '</th><th>' + t('mStops') + '</th><th>' + t('mSignOutCol') + '</th></tr></thead><tbody>' + routes + '</tbody></table></div>' +
      '<div class="m-col">' +
      '<div class="m-panel" data-p="unknown">' + ph(t('mUnknown'), d.unknown.length + 24, 'r') + '<table class="m-t"><thead><tr><th>' + t('mDriver') + '</th><th class="r">' + t('mStops') + '</th><th class="r">' + t('mTotal') + '</th></tr></thead><tbody>' + unknown + '</tbody></table></div>' +
      '<div class="m-panel" data-p="breaks">' + ph(t('mBreaks'), null) + '<table class="m-t"><thead><tr><th>' + t('mDriver') + '</th><th>' + t('mStatus') + '</th><th class="r">' + t('mMinToday') + '</th></tr></thead><tbody>' + breaks + '</tbody></table></div>' +
      '</div></div>' +

      '<div class="m-grid2" style="grid-template-columns:1fr 1fr">' +
      '<div class="m-panel" data-p="kenjo">' + ph(t('mKenjo'), t('mIn', { n: d.kenjoIn }), 'g', '<span class="m-cnt">' + t('mOut', { n: d.kenjoOut }) + '</span>') + '<div class="m-search">' + t('mSearch') + '</div><table class="m-t"><thead><tr><th>' + t('mDriver') + '</th><th>' + t('mStatus') + '</th><th>' + t('mCheckIn') + '</th><th>' + t('mTracked') + '</th></tr></thead><tbody>' + kenjo + '</tbody></table></div>' +
      '<div class="m-panel" data-p="mentor">' + ph(t('mMentor'), t('mFlags', { n: mentorFlags }), 'r') + '<div class="m-search">' + t('mSearch') + '</div><table class="m-t"><thead><tr><th>' + t('mDriver') + '</th><th>' + t('mStart') + '</th><th>' + t('mEnd') + '</th><th>' + t('mDuration') + '</th><th class="c">' + t('mTrip') + '</th><th class="c">' + t('mShort') + '</th></tr></thead><tbody>' + mentor + '</tbody></table></div>' +
      '</div>' +

      '<div class="m-grid2">' +
      '<div class="m-panel" data-p="problems">' + ph(t('mProblems'), d.problems.length + 9) + '<table class="m-t"><thead><tr><th>' + t('mDriver') + '</th><th class="r">' + t('mFailed') + '</th><th class="r">' + t('mRetry') + '</th><th class="r">' + t('mUndel') + '</th><th class="r">' + t('mMissing') + '</th><th class="r">' + t('mTotal') + '</th></tr></thead><tbody>' + problems + '</tbody></table></div>' +
      '<div class="m-panel" data-p="problems">' + ph(t('mHighValue'), d.highValue.length + 2) + '<table class="m-t"><thead><tr><th>' + t('mDriver') + '</th><th class="r">' + t('mPackages') + '</th></tr></thead><tbody>' + high + '</tbody></table></div>' +
      '</div></div>';
    layoutMock();
  }

  mock.addEventListener('click', function (e) {
    var b = e.target.closest('[data-day],[data-week],[data-sort],[data-sortdnr],[data-cp-act]');
    if (!b || b.disabled) return;
    stopAuto();
    if (b.dataset.cpAct) { cpAction(b.dataset.cpAct, b.dataset.v, b); return; }
    if (b.dataset.day) {
      dayOffset = Math.max(-59, Math.min(0, dayOffset + Number(b.dataset.day)));
      renderMock(); focusStep('history', true);
    } else if (b.dataset.week) {
      weekOffset = Math.max(-11, Math.min(0, weekOffset + Number(b.dataset.week)));
      renderMock(); focusStep('week', true);
    } else {
      var k = b.dataset.sort || 'dnr';
      daSort = { k: k, d: b.dataset.sortdnr !== undefined ? -1 : (daSort.k === k ? -daSort.d : (k === 'name' ? 1 : -1)) };
      rowAnim = true; renderMock(); focusStep('table', true);
    }
  });


  // ------------------------------------------------------------------ fictional avatars (drawn, not photos of real people)
  function hashStr(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var AV = {
    bg: ['#DCE7FF', '#FDE3D3', '#DDF3E6', '#EDE2FF', '#FFF0C2', '#D8EEF6', '#F6DDE6'],
    skin: [['#F6D3B8', '#E3B795'], ['#EDBF99', '#D6A27A'], ['#DCA57C', '#C38960'], ['#BF825B', '#A46A45'], ['#93603F', '#7A4C30'], ['#F1C9A5', '#DDAE86']],
    hair: ['#2B1E16', '#4A2F1E', '#6B4428', '#A3703F', '#D2AA63', '#161616', '#8C8C8C', '#7A2E1C'],
    shirt: ['#2F6BFF', '#136EB4', '#1E9E5A', '#0C1B35', '#E5484D', '#F5A623', '#5B5FC7', '#3A4459', '#0E9384'],
    top: {
      short: 'M12.3 17.5C11.6 9.5 15.5 7.2 20 7.2s8.4 2.3 7.7 10.3c-.9-4.3-3.5-5.7-7.7-5.7s-6.8 1.4-7.7 5.7Z',
      quiff: 'M12.2 18C11 10 14.5 6 20.5 6s8.7 4 7.3 12c-.8-3.5-2.3-5.4-4.8-5.8-3 1.4-7.5 1-10.8 5.8Z',
      buzz: 'M12.6 16c.2-5.8 3.6-7.4 7.4-7.4s7.2 1.6 7.4 7.4c-2.2-3-12.6-3-14.8 0Z',
      side: 'M12.3 17.5C11.5 9.5 15 7 20 7s8.5 2.5 7.7 10.5c-.5-4-1.7-5.3-3.7-5.9-3 1.2-8 .4-10.5 2.2-.6 1-1 2.2-1.2 3.7Z',
      long: 'M12.4 17c0-7 3.2-9.4 7.6-9.4s7.6 2.4 7.6 9.4c-1.6-4.6-5-5.8-7.6-5.8s-6 1.2-7.6 5.8Z'
    }
  };
  function avatar(name, size) {
    var r = rng(hashStr(name)), pick = function (a) { return a[Math.floor(r() * a.length)]; };
    var bg = pick(AV.bg), sk = pick(AV.skin), hair = pick(AV.hair), shirt = pick(AV.shirt);
    var style = pick(['short', 'short', 'quiff', 'buzz', 'side', 'long', 'bun', 'curly']), beard = r() < .3, glasses = r() < .18;
    var back = style === 'long' || style === 'bun' ? '<path d="M10.5 33C8.5 17 11.5 7 20 7s11.5 10 9.5 26Z" fill="' + hair + '"/>' : '';
    var top = style === 'curly'
      ? '<g fill="' + hair + '"><circle cx="13.2" cy="14.5" r="3"/><circle cx="15.6" cy="10.6" r="3.3"/><circle cx="20" cy="9" r="3.5"/><circle cx="24.4" cy="10.6" r="3.3"/><circle cx="26.8" cy="14.5" r="3"/></g>'
      : '<path d="' + AV.top[style === 'bun' ? 'long' : style] + '" fill="' + hair + '"/>' + (style === 'bun' ? '<circle cx="20" cy="6" r="3.6" fill="' + hair + '"/>' : '');
    return '<svg class="av" width="' + size + '" height="' + size + '" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" fill="' + bg + '"/>' + back +
      '<path d="M6.5 42c0-9 5.8-12.6 13.5-12.6S33.5 33 33.5 42Z" fill="' + shirt + '"/><path d="M17 29.6l3 3.4 3-3.4" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/>' +
      '<path d="M16.8 23.5h6.4v6.2c-1 1.7-5.4 1.7-6.4 0Z" fill="' + sk[1] + '"/>' +
      '<circle cx="12.6" cy="19" r="1.7" fill="' + sk[1] + '"/><circle cx="27.4" cy="19" r="1.7" fill="' + sk[1] + '"/>' +
      '<ellipse cx="20" cy="18" rx="7.6" ry="8.6" fill="' + sk[0] + '"/>' + top +
      (beard ? '<path d="M12.6 19.5c.2 6.7 3.8 8.3 7.4 8.3s7.2-1.6 7.4-8.3c-1 3.9-4 4.4-7.4 4.4s-6.4-.5-7.4-4.4Z" fill="' + hair + '"/>' : '') +
      '<circle cx="17.2" cy="18.6" r=".95" fill="#2A1D17"/><circle cx="22.8" cy="18.6" r=".95" fill="#2A1D17"/>' +
      '<path d="M18 22.4q2 1.5 4 0" stroke="' + (beard ? '#F3E1D5' : '#8A4A36') + '" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
      (glasses ? '<g fill="none" stroke="#24324A" stroke-width=".8"><circle cx="17.2" cy="18.6" r="2.3"/><circle cx="22.8" cy="18.6" r="2.3"/><path d="M19.5 18.6h1"/></g>' : '') +
      '</svg>';
  }

  // ------------------------------------------------------------------ Delivery Associates page (fictional drivers)
  var weekOffset = 0, daSort = { k: 'delivered', d: -1 }, rowAnim = false, daLiveAdd = 0, wk;
  function rosterOf(count) {
    var r = rng(555), F = NAMES.map(function (n) { return n.split(' ')[0]; }), L = NAMES.map(function (n) { return n.split(' ')[1]; });
    var out = [], seen = {}, AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    while (out.length < count) {
      var n = F[Math.floor(r() * F.length)] + ' ' + L[Math.floor(r() * L.length)];
      if (seen[n]) continue; seen[n] = 1;
      var id = 'A'; for (var i = 0; i < 13; i++) id += AL[Math.floor(r() * AL.length)];
      out.push({ name: n, id: id });
    }
    return out;
  }
  var ROSTER = rosterOf(66);
  function pctf(v, d) { return v.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%'; }
  function makeWeek(off, shallow) {
    var r = rng(9100 + off * 131), idx = shuffle(ROSTER.map(function (x, i) { return i; }), r);
    var rows = ROSTER.map(function (d) {
      return { name: d.name, id: d.id, delivered: between(r, 430, 1010), dnr: r() < .5 ? (r() < .6 ? 1 : 2) : 0, rts: r() < .25 ? 0 : between(r, 1, 7) };
    });
    idx.slice(0, 4).forEach(function (i) { rows[i].delivered = between(r, 1060, 1240); });
    var att = off === 0 ? 11 : between(r, 7, 13);
    idx.slice(5, 5 + att).forEach(function (i, k) { rows[i].dnr = k === 0 ? between(r, 11, 15) : between(r, 3, 7); });
    idx.slice(20, 23).forEach(function (i) { rows[i].rts = between(r, 10, 20); });
    var T = { total: 0, disp: 0, rts: 0, dnr: 0 };
    rows.forEach(function (x) {
      x.dispatched = x.delivered + x.rts + (r() < .3 ? between(r, 1, 8) : 0);
      x.dnrDpmo = x.dnr ? Math.round(x.dnr / x.delivered * 1e6) : 0;
      x.rtsPct = x.rts / x.dispatched * 100; x.rtsDpmo = Math.round(x.rts / x.dispatched * 1e6);
      T.total += x.delivered; T.disp += x.dispatched; T.rts += x.rts; T.dnr += x.dnr;
    });
    var w = { rows: rows, total: T.total, rts: T.rts, dnr: T.dnr, rtsAvg: T.rts / T.disp * 100, att: att };
    if (!shallow) { var p = makeWeek(off - 1, true); w.dTotal = (w.total - p.total) / p.total * 100; w.dRts = w.rtsAvg - p.rtsAvg; }
    return w;
  }
  function weekInfo(off) {
    var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - d.getDay() + off * 7); // weeks run Sunday to Saturday
    var end = new Date(d); end.setDate(end.getDate() + 6);
    var j1 = new Date(end.getFullYear(), 0, 1, 12); j1.setDate(j1.getDate() - j1.getDay());
    var o = { day: 'numeric', month: 'short' }, loc = lang === 'de' ? 'de-DE' : 'en-GB';
    return { n: Math.round((d - j1) / 864e5 / 7) + 1, range: d.toLocaleDateString(loc, o) + ' – ' + end.toLocaleDateString(loc, o) };
  }
  function dnrPill(n) { return n >= 3 ? '<span class="dn r">' + n + '</span>' : n ? '<span class="dn a">' + n + '</span>' : '<span class="dn0">0</span>'; }
  function who(x) { return '<span class="da">' + avatar(x.name, 30) + '<span><b>' + esc(x.name) + '</b><small>' + x.id + '</small></span></span>'; }
  function delta(v, unit, goodWhenDown) {
    var down = v < 0, good = goodWhenDown ? down : !down;
    return '<span class="dk-d ' + (good ? 'pos' : 'neg') + '">' + (down ? '↘' : '↗') + ' ' + unit + '</span>';
  }
  function renderDa() {
    var w = wk = makeWeek(weekOffset), wi = weekInfo(weekOffset), live = weekOffset === 0;
    if (!live) daLiveAdd = 0;
    var total = w.total + daLiveAdd;
    var byDel = w.rows.slice().sort(function (a, b) { return b.delivered - a.delivered; }), max = byDel[0].delivered;
    var top = byDel.slice(0, 4).map(function (x, i) {
      return '<div class="tp"><span class="tp-r">0' + (i + 1) + '</span>' + avatar(x.name, 32) + '<span class="tp-n"><b>' + esc(x.name) + '</b><span class="tp-bar"><i style="width:' + (x.delivered / max * 100) + '%"></i></span></span><b class="tp-v">' + fmt(x.delivered) + '</b></div>';
    }).join('');
    var dnrRows = w.rows.filter(function (x) { return x.dnr >= 3; }).sort(function (a, b) { return b.dnr - a.dnr; }).map(function (x) {
      return '<tr class="flag"><td>' + who(x) + '</td><td class="c">' + dnrPill(x.dnr) + '</td><td class="r">' + fmt(x.dnrDpmo) + '</td><td class="r">' + x.rts + '</td><td class="r">' + pctf(x.rtsPct, x.rts ? 2 : 0) + '</td></tr>';
    }).join('');
    var k = daSort.k, dir = daSort.d;
    var sorted = w.rows.slice().sort(function (a, b) { return k === 'name' ? dir * a.name.localeCompare(b.name) : dir * (a[k] - b[k]) || b.delivered - a.delivered; });
    var COLS = [['name', 'daAssoc', ''], ['delivered', 'daDelivered', 'r'], ['dispatched', 'daDispatched', 'r'], ['dnr', 'DNR', 'c'], ['dnrDpmo', 'DNR DPMO', 'r'], ['rts', 'RTS', 'r'], ['rtsPct', 'RTS %', 'r'], ['rtsDpmo', 'RTS DPMO', 'r']];
    var head = COLS.map(function (c) {
      var on = c[0] === k, lbl = c[1].indexOf('da') === 0 ? t(c[1]) : c[1];
      return '<th class="' + c[2] + '"><button type="button" data-sort="' + c[0] + '"' + (on ? ' class="on"' : '') + '>' + (on ? '<span class="ar ' + (dir < 0 ? 'down' : 'up') + '">›</span>' : '') + lbl + '</button></th>';
    }).join('');
    var body = sorted.slice(0, 14).map(function (x, i) {
      return '<tr' + (x.dnr >= 3 ? ' class="flag' : ' class="') + (rowAnim ? ' row-in' : '') + '" style="--i:' + i + '"><td>' + who(x) + '</td><td class="r"><b>' + fmt(x.delivered) + '</b></td><td class="r"><b>' + fmt(x.dispatched) + '</b></td><td class="c">' + dnrPill(x.dnr) + '</td>' +
        '<td class="r">' + fmt(x.dnrDpmo) + '</td><td class="r' + (x.rts ? '' : ' mut') + '">' + x.rts + '</td><td class="r' + (x.rts ? '' : ' mut') + '">' + pctf(x.rtsPct, x.rts ? 2 : 0) + '</td><td class="r' + (x.rts ? '' : ' mut') + '">' + fmt(x.rtsDpmo) + '</td></tr>';
    }).join('');
    rowAnim = false;

    mock.innerHTML = topBar(t('pageDa')) + '<div class="m-body">' +
      '<div class="m-panel m-date m-week" data-p="week"><span class="ci">' + ICAL + '</span><div><b>' + t('daWeek', { n: wi.n }) + '</b><span>' + esc(wi.range) + '</span></div>' +
      (live ? '<span class="m-livepill sm"><i></i>' + t('daLiveNote') + '</span>' : '<span class="m-cnt">' + t('daPastWeek') + '</span>') +
      '<div class="m-dnav"><button type="button" data-week="-1" aria-label="Previous week"' + (weekOffset <= -11 ? ' disabled' : '') + '>‹</button><button type="button" data-week="1" aria-label="Next week"' + (live ? ' disabled' : '') + '>›</button></div></div>' +

      '<div class="m-panel m-dk" data-p="kpis">' +
      '<div class="dk"><span class="dk-h">' + t('daTotal') + '</span><b class="dk-big"' + (live ? ' data-dalive' : '') + ' data-count="' + total + '">' + fmt(total) + '</b>' + delta(w.dTotal, t('daVsLast', { n: pctf(Math.abs(w.dTotal), 1) }), false) + '</div>' +
      '<div class="dk"><span class="dk-h">' + t('daQuality') + '</span><div class="dk-3">' +
      '<div><b class="dk-mid" data-count="' + Math.round(w.rtsAvg * 100) + '" data-f="pct">' + pctf(w.rtsAvg, 2) + '</b><span>' + t('daRtsAvg') + '</span>' + delta(w.dRts, Math.max(.01, Math.abs(w.dRts)).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' pp', true) + '</div>' +
      '<div><b class="dk-mid" data-count="' + w.rts + '">' + fmt(w.rts) + '</b><span>' + t('daRtsParcels') + '</span></div>' +
      '<div><b class="dk-mid amber" data-count="' + w.dnr + '">' + fmt(w.dnr) + '</b><span>' + t('daDnrTotal') + '</span></div></div></div>' +
      '<div class="dk dk-att"><span class="dk-h">' + t('daAttention') + '</span><b class="dk-big red" data-count="' + w.att + '">' + w.att + '</b><span>' + t('daDnrDrivers') + '</span><button type="button" class="dk-link" data-sortdnr>' + t('daSortDnr') + ' ›</button></div></div>' +

      '<div class="m-grid2" style="grid-template-columns:1fr 1.25fr;align-items:stretch">' +
      '<div class="m-panel" data-p="top"><div class="m-ph"><h4>' + t('daTop') + '</h4><span class="m-cnt">' + t('daDeliveries') + '</span></div>' + top + '</div>' +
      '<div class="m-panel" data-p="dnr"><div class="m-ph"><span class="rdot"></span><h4>' + t('daDnrList') + '</h4><span class="m-cnt r">' + w.att + '</span></div><table class="m-t dense"><thead><tr><th>' + t('daAssoc') + '</th><th class="c">DNR</th><th class="r">DNR DPMO</th><th class="r">RTS</th><th class="r">RTS %</th></tr></thead><tbody>' + dnrRows + '</tbody></table></div>' +
      '</div>' +

      '<div class="m-panel" data-p="table"><div class="m-ph"><h4>' + t('pageDa') + '</h4><span class="m-cnt">' + w.rows.length + '</span></div><div class="m-search">' + t('mSearch') + '</div>' +
      '<table class="m-t dense"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table><div class="m-foot">' + esc(t('daHint')) + '</div></div>' +
      '</div>';
    layoutMock();
  }


  // ------------------------------------------------------------------ Company phones page (fictional drivers, masked numbers)
  var CPR = rosterOf(100), cp, cpSec = 3, cpFilter = 'all', cpOpen = null, cpOtherN = 0, cpStaffNext = 0, cpSpare = 0;
  function fakePhone(r) { return '+49 1' + ['51', '57', '60', '76', '79'][Math.floor(r() * 5)] + ' •••• ' + ('000' + between(r, 0, 9999)).slice(-4); }
  function makePhones() {
    var r = rng(31337), idx = shuffle(CPR.slice(0, 78).map(function (x, i) { return i; }), r);
    var kind = {};
    idx.forEach(function (v, k) { kind[v] = k < 4 ? 'missing' : k < 13 ? 'changed' : k < 18 ? 'new' : k < 24 ? 'inactive' : 'stable'; });
    var rows = CPR.slice(0, 78).map(function (d, i) {
      var k = kind[i], x = { name: d.name, id: d.id, dev: 'S-' + between(r, 101, 399), state: k === 'inactive' ? 'stable' : k };
      x.onRoute = k === 'inactive' ? between(r, 15, 30) : k === 'missing' ? between(r, 0, 6) : (r() < .85 ? 0 : between(r, 1, 8));
      x.phone = k === 'missing' ? null : fakePhone(r);
      x.numFor = k === 'missing' ? null : k === 'changed' || k === 'new' ? between(r, 0, 6) : between(r, 8, 26);
      x.first = (x.numFor || 0) + between(r, 0, 30);
      if (k === 'changed') { x.prev = fakePhone(r); x.prevFrom = x.numFor + between(r, 12, 60); }
      if (k === 'missing') x.noPhoneRoutes = between(r, 1, 4);
      return x;
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var reg = [];
    rows.forEach(function (x) {
      if (x.phone) reg.push({ phone: x.phone, holder: x.name, first: x.first, last: x.onRoute });
      if (x.prev) reg.push({ phone: x.prev, holder: '—', first: x.prevFrom, last: x.numFor + 1 });
    });
    reg.sort(function (a, b) { return a.phone.replace(/\D/g, '') < b.phone.replace(/\D/g, '') ? -1 : 1; });
    var staff = CPR.slice(78, 84).map(function (d) { return { name: d.name, phone: fakePhone(r) }; });
    var active = rows.filter(function (x) { return x.onRoute <= 14; });
    return { rows: rows, reg: reg, staff: staff, other: [], active: active.length,
      withNum: active.filter(function (x) { return x.phone; }).length, inactive: rows.length - active.length,
      changes: rows.filter(function (x) { return x.state === 'changed' || x.state === 'new'; }).sort(function (a, b) { return a.numFor - b.numFor; }),
      missing: rows.filter(function (x) { return x.state === 'missing'; }), r: r };
  }
  function dl(n) { return n === 0 ? t('cpToday') : t('cpDays', { n: n }); }
  function cpPill(st) { return st === 'changed' ? '<span class="m-pill o">' + t('cpChanged') + '</span>' : st === 'new' ? '<span class="m-pill g">' + t('cpNew') + '</span>' : st === 'missing' ? '<span class="m-pill r">' + t('cpMissing') + '</span>' : '<span class="m-pill">' + t('cpStable') + '</span>'; }
  function ago() { return '<span class="m-ago" data-ago>' + t('mAgoS', { n: cpSec }) + '</span>'; }
  var IC = {
    plus: '<svg class="ic" width="14" height="14" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg class="ic" width="14" height="14" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    del: '<svg class="ic" width="14" height="14" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    tag: '<svg class="ic" width="15" height="15" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10.5 18.5h3"/></svg>'
  };
  function cpListInner() {
    var rows = cp.rows.filter(function (x) {
      return cpFilter === 'changed' ? x.state === 'changed' || x.state === 'new' : cpFilter === 'none' ? x.state === 'missing' : cpFilter === 'inactive' ? x.onRoute > 14 : true;
    });
    var F = [['all', 'cpAll'], ['changed', 'cpChangedF'], ['none', 'cpNoneF'], ['inactive', 'cpInactF']];
    var seg = F.map(function (f) { return '<button type="button" data-cp-act="filter" data-v="' + f[0] + '"' + (cpFilter === f[0] ? ' class="on"' : '') + '>' + t(f[1]) + (f[0] === 'none' ? ' <em>' + cp.missing.length + '</em>' : '') + '</button>'; }).join('');
    var body = rows.slice(0, 14).map(function (x, i) {
      return '<tr data-cp-act="open" data-v="' + x.id + '" class="' + (x.state === 'missing' ? 'flag' : '') + (cpOpen === x.id ? ' sel' : '') + ' row-in" style="--i:' + i + '"><td>' + who(x) + '</td><td>' + (x.phone || '–') + '</td><td>' + cpPill(x.state) + '</td><td>' + dl(x.onRoute) + '</td><td>' + (x.numFor === null ? '–' : dl(x.numFor)) + '</td></tr>';
    }).join('');
    return '<div class="m-ph"><h4>' + t('cpList') + '</h4><span class="m-cnt">' + rows.length + '</span>' + ago() + '</div>' +
      '<div class="cp-tools"><span class="cp-seg">' + seg + '</span><span class="m-search">' + t('cpSearch') + '</span></div>' +
      '<table class="m-t dense cp-list"><thead><tr><th>' + t('mDriver') + '</th><th>' + t('cpPhone') + '</th><th>' + t('cpState') + '</th><th>' + t('cpOnRoute') + '</th><th>' + t('cpNumberFor') + '</th></tr></thead><tbody>' + body + '</tbody></table>' +
      '<div class="m-foot">' + t('cpListHint') + '</div>' + (cpOpen ? cpDrawer() : '');
  }
  function cpDrawer() {
    var x = cp.rows.filter(function (y) { return y.id === cpOpen; })[0]; if (!x) return '';
    var tl = '';
    if (x.phone) tl += '<li class="cur"><b>' + x.phone + '</b><span>' + (x.numFor ? t('cpCurrentFor', { n: x.numFor }) : t('cpCurrentToday')) + '</span></li>';
    else tl += '<li class="miss"><b>' + t('cpNoNumber') + '</b><span>' + t('cpRoutesNo', { n: x.noPhoneRoutes }) + '</span></li>';
    if (x.prev) tl += '<li><b>' + x.prev + '</b><span>' + t('cpPrevFor', { a: x.prevFrom, b: x.numFor }) + '</span></li>';
    tl += '<li><b>' + t('cpFirstScan') + '</b><span>' + t('cpDaysAgo', { n: (x.prevFrom || x.first) + 3 }) + '</span></li>';
    return '<div class="cp-drawer"><div class="cp-dh">' + avatar(x.name, 44) + '<span><b>' + esc(x.name) + '</b><small>' + x.id + '</small></span><button type="button" class="cp-x" data-cp-act="close" aria-label="' + t('cpClose') + '">×</button></div>' +
      '<div class="cp-facts"><div><span>' + t('cpState') + '</span>' + cpPill(x.state) + '</div><div><span>' + t('cpLastRoute') + '</span><b>' + dl(x.onRoute) + '</b></div><div><span>' + t('cpScanner') + '</span><b>' + x.dev + '</b></div><div><span>' + t('cpPhone') + '</span><b>' + (x.phone || '–') + '</b></div></div>' +
      '<h5 class="cp-h5">' + t('cpHistory') + '</h5><ul class="cp-tl">' + tl + '</ul></div>';
  }
  function cpStaffInner(added) {
    var rows = cp.staff.map(function (x, i) {
      return '<tr' + (added && i === cp.staff.length - 1 ? ' class="add-in"' : '') + '><td><span class="da">' + avatar(x.name, 30) + '<b>' + esc(x.name) + '</b></span></td><td>' + x.phone + '</td><td><span class="cp-acts"><button type="button" class="cp-ib" data-cp-act="edit" data-v="' + i + '" aria-label="' + t('cpEdit') + '">' + IC.edit + '</button><button type="button" class="cp-ib del" data-cp-act="delstaff" data-v="' + i + '" aria-label="' + t('cpDelete') + '">' + IC.del + '</button></span></td></tr>';
    }).join('');
    return '<div class="m-ph"><h4>' + t('cpStaff') + '</h4><span class="m-cnt">' + cp.staff.length + '</span><button type="button" class="cp-btn" data-cp-act="addstaff">' + IC.plus + t('cpAddStaff') + '</button></div>' +
      '<table class="m-t"><thead><tr><th>' + t('cpStaffCol') + '</th><th>' + t('cpPhone') + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table><div class="m-foot">' + t('cpStaffHint') + '</div>';
  }
  function cpOtherInner(added) {
    var rows = cp.other.map(function (x, i) {
      return '<tr' + (added && i === cp.other.length - 1 ? ' class="add-in"' : '') + '><td><span class="da"><span class="cp-oi">' + IC.tag + '</span><b>' + esc(t('cpOtherLabels')[x.l % 4]) + '</b></span></td><td>' + x.phone + '</td><td><span class="cp-acts"><button type="button" class="cp-ib del" data-cp-act="delother" data-v="' + i + '" aria-label="' + t('cpDelete') + '">' + IC.del + '</button></span></td></tr>';
    }).join('');
    return '<div class="m-ph"><h4>' + t('cpOther') + '</h4><span class="m-cnt">' + cp.other.length + '</span><button type="button" class="cp-btn" data-cp-act="addother">' + IC.plus + t('cpAddNum') + '</button></div>' +
      (rows ? '<table class="m-t"><tbody>' + rows + '</tbody></table>' : '<p class="cp-empty">' + t('cpNoOther') + '</p>') + '<div class="m-foot">' + t('cpOtherHint') + '</div>';
  }
  function cpRegRows() {
    return cp.reg.slice(0, 10).map(function (x) {
      return '<tr' + (x.ho ? ' class="ho"' : '') + '><td><b>' + x.phone + '</b></td><td>' + (x.ho ? '<span class="ho-old">' + esc(x.old) + '</span>' : '') + esc(x.holder) + (x.ho ? ' <span class="m-pill b">' + t('cpHandover') + '</span>' : '') + '</td><td>' + dl(x.first) + '</td><td>' + dl(x.last) + '</td></tr>';
    }).join('');
  }
  function cpLastStr() { var d = new Date(Date.now() - cpSec * 1000); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function renderCp() {
    if (!cp) cp = makePhones();
    var cov = cp.withNum / cp.active * 100;
    var miss = cp.missing.map(function (x) { return '<div class="cp-r" data-cp-act="open" data-v="' + x.id + '">' + who(x) + '<span class="m-pill r">' + t('cpMissing') + '</span></div>'; }).join('');
    var ch = cp.changes.slice(0, 6).map(function (x) { return '<div class="cp-r" data-cp-act="open" data-v="' + x.id + '">' + who(x) + '<span class="ph"><b>' + x.phone + '</b>' + cpPill(x.state) + '</span></div>'; }).join('');
    mock.innerHTML = topBar(t('pageCp')) + '<div class="m-body">' +
      '<div class="m-panel m-dk" data-p="kpis">' +
      '<div class="dk"><span class="dk-h">' + t('cpWith') + '</span><span class="cp-big"><b class="dk-big" data-count="' + cp.withNum + '">' + cp.withNum + '</b><span>' + t('cpOfActive', { n: cp.active }) + '</span></span>' +
      '<div class="m-prog"><span class="tr"><i style="width:' + cov + '%"></i></span><b>' + Math.round(cov) + '%</b></div></div>' +
      '<div class="dk"><span class="dk-h">' + t('cpDrivers') + '</span><div class="dk-3">' +
      '<div><b class="dk-mid" data-count="' + cp.active + '">' + cp.active + '</b><span>' + t('cpActive') + '</span></div>' +
      '<div><b class="dk-mid amber" data-count="' + cp.changes.length + '">' + cp.changes.length + '</b><span>' + t('cpNewChanged') + '</span></div>' +
      '<div><b class="dk-mid" data-count="' + cp.inactive + '">' + cp.inactive + '</b><span>' + t('cpInactive') + '</span></div></div></div>' +
      '<div class="dk dk-att"><span class="dk-h">' + t('cpNoPhone') + '</span><b class="dk-big red" data-count="' + cp.missing.length + '">' + cp.missing.length + '</b><span>' + t('cpNoPhoneNote') + '</span><button type="button" class="dk-link" data-cp-act="filter" data-v="none">' + t('cpShow') + ' ›</button></div></div>' +

      '<div class="m-grid2" style="grid-template-columns:1.7fr 1fr">' +
      '<div class="m-panel" data-p="list" data-cp="list">' + cpListInner() + '</div>' +
      '<div class="m-col">' +
      '<div class="m-panel" data-p="alerts"><div class="m-ph"><span class="rdot"></span><h4>' + t('cpNoPhone') + '</h4><span class="m-cnt r">' + cp.missing.length + '</span>' + ago() + '</div>' + miss + '</div>' +
      '<div class="m-panel" data-p="alerts"><div class="m-ph"><h4>' + t('cpChanges') + '</h4><span class="m-cnt">' + cp.changes.length + '</span>' + ago() + '</div>' + ch + '<div class="m-foot">' + t('cpShowing', { a: 6, b: cp.changes.length }) + '</div></div>' +
      '<div class="m-panel" data-p="sync"><div class="m-ph"><h4>' + t('cpSync') + '</h4><span class="m-tag">' + t('cpSyncTag') + '</span></div>' +
      '<div class="sy-row"><span>' + t('cpLast') + '</span><b data-last>' + cpLastStr() + '</b></div>' +
      '<div class="sy-row"><span>' + t('cpCadence') + '</span><b>' + t('cpEvery') + '</b></div>' +
      '<div class="sy-row"><span>' + t('cpCoverage') + '</span><b class="blue">' + pctf(cov, 1) + '</b></div>' +
      '<div class="sy-row"><span>' + t('cpNext') + '</span><b data-next>' + t('cpIn', { n: 60 - cpSec }) + '</b></div>' +
      '<span class="sy-bar"><i data-nextbar style="width:' + (cpSec / 60 * 100) + '%"></i></span></div>' +
      '</div></div>' +

      '<div class="m-grid2" style="grid-template-columns:1fr 1fr;align-items:stretch">' +
      '<div class="m-panel cp-col" data-p="staff" data-cp="staff">' + cpStaffInner() + '</div>' +
      '<div class="m-panel cp-col" data-p="staff" data-cp="other">' + cpOtherInner() + '</div></div>' +

      '<div class="m-panel" data-p="register"><div class="m-ph"><h4>' + t('cpRegister') + '</h4><span class="m-cnt">' + cp.reg.length + '</span>' + ago() + '</div><div class="m-search">' + t('cpRegSearch') + '</div>' +
      '<table class="m-t"><thead><tr><th>' + t('cpPhone') + '</th><th>' + t('cpHolder') + '</th><th>' + t('cpFirst') + '</th><th>' + t('cpLastSeen') + '</th></tr></thead><tbody data-regbody>' + cpRegRows() + '</tbody></table><div class="m-foot">' + t('cpRegHint') + '</div></div>' +
      '</div>';
    layoutMock();
  }
  function cpSet(name, html) { var el = mock.querySelector('[data-cp="' + name + '"]'); if (el) el.innerHTML = html; }
  function cpAction(act, v, el) {
    if (act === 'filter') { var inList = !!el.closest('[data-cp="list"]'); cpFilter = v; cpOpen = null; cpSet('list', cpListInner()); focusStep('list', true, inList); }
    else if (act === 'open') { cpOpen = v; cpSet('list', cpListInner()); focusStep('list', true, active === 'list'); }
    else if (act === 'close') { cpOpen = null; cpSet('list', cpListInner()); }
    else if (act === 'addstaff') { var d = CPR[84 + (cpStaffNext++ % 16)]; cp.staff.push({ name: d.name, phone: fakePhone(cp.r) }); cpSet('staff', cpStaffInner(true)); focusStep('staff', true, true); }
    else if (act === 'delstaff' || act === 'delother') {
      var tr = el.closest('tr'); tr.classList.add('del-out');
      setTimeout(function () {
        if (act === 'delstaff') { cp.staff.splice(Number(v), 1); cpSet('staff', cpStaffInner()); } else { cp.other.splice(Number(v), 1); cpSet('other', cpOtherInner()); }
        focusStep('staff', true, true);
      }, 300);
    }
    else if (act === 'addother') { cp.other.push({ l: cpOtherN++, phone: fakePhone(cp.r) }); cpSet('other', cpOtherInner(true)); focusStep('staff', true, true); }
    else if (act === 'edit') { var row = el.closest('tr'); row.classList.remove('add-in'); void row.offsetWidth; row.classList.add('add-in'); }
  }
  function handover() {
    if (!cp) return;
    var cands = cp.reg.slice(0, 10).filter(function (x) { return !x.ho && x.holder !== '—'; });
    if (!cands.length) return;
    var x = cands[Math.floor(Math.random() * cands.length)], d = CPR[86 + (cpSpare++ % 14)];
    cp.reg.forEach(function (y) { y.ho = false; });
    x.old = x.holder; x.holder = d.name; x.last = 0; x.ho = true;
    var body = mock.querySelector('[data-regbody]'); if (body) body.innerHTML = cpRegRows();
  }
  function cpTick() {
    cpSec = (cpSec + 1) % 60;
    if (page !== 'cp') return;
    mock.querySelectorAll('[data-ago]').forEach(function (el) { el.textContent = t('mAgoS', { n: cpSec }); });
    var n = mock.querySelector('[data-next]'); if (n) n.textContent = t('cpIn', { n: 60 - cpSec });
    var bar = mock.querySelector('[data-nextbar]');
    if (bar) { bar.style.transition = cpSec === 0 ? 'none' : ''; bar.style.width = (cpSec / 60 * 100) + '%'; }
    if (cpSec === 0) {
      var l = mock.querySelector('[data-last]'); if (l) l.textContent = cpLastStr();
      var sp = mock.querySelector('[data-p="sync"]'); if (sp && !reduce) { sp.classList.remove('sweep'); void sp.offsetWidth; sp.classList.add('sweep'); }
      handover();
    }
  }

  // ------------------------------------------------------------------ page menu with a futuristic switch transition
  var tabs = document.querySelectorAll('[data-page]'), ind = document.querySelector('.pages-ind'), switching = false, urlTimer;
  function moveInd() {
    var b = document.querySelector('[data-page][aria-selected="true"]');
    if (b && ind) { ind.style.left = b.offsetLeft + 'px'; ind.style.width = b.offsetWidth + 'px'; }
  }
  function typeUrl(u) {
    var el = document.getElementById('url'), i = 0; clearInterval(urlTimer);
    if (reduce) { el.textContent = u; return; }
    urlTimer = setInterval(function () { el.textContent = u.slice(0, ++i); if (i >= u.length) clearInterval(urlTimer); }, 16);
  }
  function switchPage(p, fromAuto) {
    if (p === page || switching) return;
    if (!fromAuto) stopAuto();
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.page === p)); });
    moveInd();
    document.getElementById('fx-t').textContent = t(PAGES[p].name);
    typeUrl(PAGES[p].url);
    function swap() {
      page = p; active = PAGES[p].first;
      document.getElementById('tour-kicker').textContent = 'LANU Board · ' + t(PAGES[p].name);
      mock.classList.add('nocam');
      renderMock();
      stepsEl.classList.remove('leave'); stepsEl.classList.add('enter');
      focusStep(active, true);
    }
    if (reduce) { swap(); mock.classList.remove('nocam'); return; }
    switching = true;
    screenEl.classList.remove('warp'); void screenEl.offsetWidth; screenEl.classList.add('warp');
    mock.classList.add('leaving'); stepsEl.classList.add('leave');
    setTimeout(function () {
      swap();
      requestAnimationFrame(function () { requestAnimationFrame(function () { mock.classList.remove('leaving'); }); });
    }, 450);
    setTimeout(function () { mock.classList.remove('nocam'); focusStep(active, true); }, 900);
    setTimeout(function () { screenEl.classList.remove('warp'); stepsEl.classList.remove('enter'); switching = false; }, 1400);
  }
  tabs.forEach(function (b) {
    b.addEventListener('click', function () { switchPage(b.dataset.page); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var list = Array.prototype.slice.call(tabs), n = list[(list.indexOf(b) + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
      n.focus(); switchPage(n.dataset.page);
    });
  });
  window.addEventListener('resize', moveInd);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);

  // ------------------------------------------------------------------ guided tour
  var stepsEl = document.getElementById('steps'), nowEl = document.getElementById('step-now');
  var PAGES = {
    ops: { name: 'pageOps', steps: 'steps', first: 'overview', url: 'board.lanu.app/operations' },
    da: { name: 'pageDa', steps: 'stepsDa', first: 'kpis', url: 'board.lanu.app/associates' },
    cp: { name: 'pageCp', steps: 'stepsCp', first: 'kpis', url: 'board.lanu.app/phones' }
  };
  var ORDER = ['ops', 'da', 'cp'];
  var page = 'ops';
  var active = 'overview', auto = !reduce, timer = null, inView = false, DUR = 7000;
  function renderSteps() {
    stepsEl.innerHTML = t(PAGES[page].steps).map(function (s, i) {
      return '<li style="--i:' + i + '" class="step' + (s[0] === active ? ' on' + (auto ? ' auto' : '') : '') + '"><button type="button" data-step="' + s[0] + '" aria-current="' + (s[0] === active) + '">' +
        '<span class="n">' + (i + 1) + '</span><span><span class="t">' + esc(s[1]) + '</span><span class="d">' + esc(s[2]) + '</span></span><span class="prog" style="--dur:' + DUR + 'ms"></span></button></li>';
    }).join('');
    var cur = t(PAGES[page].steps).filter(function (s) { return s[0] === active; })[0];
    nowEl.innerHTML = '<b>' + esc(cur[1]) + '</b><p>' + esc(cur[2]) + '</p>';
  }
  stepsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-step]');
    if (!b) return;
    stopAuto();
    if (page === 'ops' && b.dataset.step !== 'history' && dayOffset !== 0) { dayOffset = 0; renderMock(); }
    focusStep(b.dataset.step);
  });

  // "camera": zooms the 1280px-wide app screen so the active panel fills the visible window
  var cam = { z: 1, x: 0, y: 0 };
  function layoutMock() {
    mock.style.transform = 'translate(' + (-cam.x) + 'px,' + (-cam.y) + 'px) scale(' + cam.z + ')';
  }
  function focusStep(id, keep, quiet) {
    active = id;
    renderSteps();
    var panels = mock.querySelectorAll('[data-p]');
    panels.forEach(function (p) { p.classList.toggle('on', p.dataset.p === id); });
    mock.classList.add('focus');
    var targets = mock.querySelectorAll('[data-p="' + id + '"]');
    var mrect = mock.getBoundingClientRect(), z0 = cam.z;
    var l = Infinity, tp = Infinity, r = -Infinity, b = -Infinity;
    targets.forEach(function (el) {
      var q = el.getBoundingClientRect();
      l = Math.min(l, (q.left - mrect.left) / z0); tp = Math.min(tp, (q.top - mrect.top) / z0);
      r = Math.max(r, (q.right - mrect.left) / z0); b = Math.max(b, (q.bottom - mrect.top) / z0);
    });
    var W = screenEl.clientWidth, H = screenEl.clientHeight, pw = r - l;
    var z = Math.min(1, (W - 32) / pw, Math.max(W / 1280, (H - 32) / (b - tp)));
    z = Math.max(z, W / 1280);
    var x = l * z - (W - pw * z) / 2;
    x = Math.max(0, Math.min(1280 * z - W, x));
    var y = tp * z - 16;
    y = Math.max(0, y);
    cam = { z: z, x: x, y: y };
    layoutMock();
    if (page === 'cp' && id === 'register' && !quiet) setTimeout(function () { if (page === 'cp') handover(); }, 1500);
    if (!reduce && !quiet) {
      targets.forEach(function (el) { el.classList.remove('sweep'); void el.offsetWidth; el.classList.add('sweep'); });
      if (page === 'ops' && id === 'overview') countOverview();
      targets.forEach(function (el) {
        el.querySelectorAll('[data-count]').forEach(function (c) { countUp(c, Number(c.dataset.count), c.dataset.f === 'pct' ? function (v) { return pctf(v / 100, 2); } : fmt, 1100); });
      });
    }
    if (!keep && window.innerWidth <= 980) {
      var btn = stepsEl.querySelector('.on button'); if (btn) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!auto || !inView) return;
    timer = setTimeout(function () {
      var ids = t(PAGES[page].steps).map(function (s) { return s[0]; }), i = ids.indexOf(active);
      if (i === ids.length - 1) switchPage(ORDER[(ORDER.indexOf(page) + 1) % ORDER.length], true);
      else focusStep(ids[i + 1], true);
    }, DUR);
  }
  function stopAuto() { auto = false; clearTimeout(timer); var on = stepsEl.querySelector('.auto'); if (on) on.classList.remove('auto'); }
  new IntersectionObserver(function (en) {
    inView = en[0].isIntersecting;
    if (inView) { renderSteps(); schedule(); } else clearTimeout(timer);
  }, { threshold: .35 }).observe(document.getElementById('board'));
  window.addEventListener('resize', function () { focusStep(active, true); });

  // ------------------------------------------------------------------ live ticking
  setInterval(function () {
    var s = nowStr();
    document.querySelectorAll('[data-clock]').forEach(function (el) { el.textContent = s; });
    var hc = document.getElementById('hv-clock'); if (hc) hc.textContent = s;
    cpTick();
  }, 1000);
  setInterval(function () {
    if (page === 'da' && weekOffset === 0) {
      daLiveAdd += 1 + Math.floor(Math.random() * 3);
      var dl = mock.querySelector('[data-dalive]'); if (dl && wk) dl.textContent = fmt(wk.total + daLiveAdd);
    }
    if (!data || !data.live || liveDelivered >= data.totalPk - 20) return;
    liveDelivered += 1 + Math.floor(Math.random() * 3);
    var pct = liveDelivered / data.totalPk * 100;
    var el = page === 'ops' && mock.querySelector('[data-delivered]'); if (el) el.textContent = fmt(liveDelivered);
    var bar = mock.querySelector('[data-pbar]'); if (bar) bar.style.width = pct + '%';
    var p = mock.querySelector('[data-pct]'); if (p) p.textContent = Math.floor(pct) + '%';
    var so = mock.querySelector('[data-stillout]'); if (so) so.textContent = t('mStillOut', { n: fmt(data.totalPk - liveDelivered) });
    var hv = document.getElementById('hv-count'); if (hv) hv.textContent = fmt(liveDelivered);
    var hb = document.getElementById('hv-bar'); if (hb) hb.style.width = pct + '%';
  }, 4000);
  setInterval(function () {
    mock.querySelectorAll('[data-break]').forEach(function (el) { el.textContent = Number(el.textContent) + 1; });
  }, 60000);

  // ------------------------------------------------------------------ benefits
  var ICONS = {
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    live: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
  };
  function renderBenefits() {
    document.getElementById('benefits').innerHTML = t('benefits').map(function (b, i) {
      return '<div class="ben glow" data-reveal style="--d:' + (i % 3) * .08 + 's"><span class="bi"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[b[0]] + '</svg></span><h3>' + esc(b[1]) + '</h3><p>' + esc(b[2]) + '</p></div>';
    }).join('');
    observeReveal();
  }

  // ------------------------------------------------------------------ contact form (not connected yet: see website/README.md)
  var form = document.getElementById('form');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function check(input) {
    var ok = input.type === 'email' ? EMAIL.test(input.value.trim()) : !!input.value.trim();
    input.closest('.field').classList.toggle('bad', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var req = Array.prototype.slice.call(form.querySelectorAll('[required]'));
    var bad = req.filter(function (i) { return !check(i); });
    if (bad.length) { bad[0].focus(); return; }
    document.getElementById('form-ok').hidden = false;
    form.querySelector('[type=submit]').disabled = true;
  });
  form.addEventListener('input', function (e) { if (e.target.closest('.field.bad')) check(e.target); });


  // ------------------------------------------------------------------ number count-up
  function countUp(el, to, f, ms) {
    if (!el) return;
    var t0 = performance.now(), from = Math.round(to * .82);
    if (to < 100) from = 0;
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = f(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function countOverview() {
    if (!data) return;
    countUp(mock.querySelector('[data-delivered]'), data.live ? liveDelivered : data.delivered, fmt, 1200);
    countUp(mock.querySelector('.m-tours b'), data.tours, String, 900);
    countUp(mock.querySelector('.m-risk b'), data.risk, String, 900);
  }

  // ------------------------------------------------------------------ live ticker (fictional events)
  function renderTicker() {
    var r = rng(77), names = shuffle(NAMES, r), tpl = t('ticker'), now = new Date(), m = now.getHours() * 60 + now.getMinutes();
    var items = [];
    for (var i = 0; i < 16; i++) {
      var k = tpl[i % tpl.length]; m -= between(r, 1, 4); var min = m;
      var txt = esc(k[1]).replace('{name}', '<b>' + esc(names[i]) + '</b>').replace('{route}', 'D-' + between(r, 101, 340)).replace('{n}', between(r, 6, 42));
      items.push('<span class="tk" style="--c:' + k[0] + '"><i></i>' + avatar(names[i], 22) + '<time>' + hm((min + 1440) % 1440) + '</time><span>' + txt + '</span></span>');
    }
    var html = items.join('');
    document.getElementById('ticker').innerHTML = html + html.replace(/<span class="tk"/g, '<span class="tk" aria-hidden="true"');
  }

  // ------------------------------------------------------------------ scroll reveal
  var revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); revealIO.unobserve(x.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeReveal() {
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(function (el) { if (revealIO) revealIO.observe(el); else el.classList.add('in'); });
  }

  // ------------------------------------------------------------------ pointer effects: card glow, 3D browser tilt, hero parallax
  document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glow');
    if (g) { var q = g.getBoundingClientRect(); g.style.setProperty('--mx', (e.clientX - q.left) + 'px'); g.style.setProperty('--my', (e.clientY - q.top) + 'px'); }
  }, { passive: true });
  var screenCol = document.querySelector('.screen-col'), browser = document.querySelector('.browser');
  if (!reduce && screenCol) {
    screenCol.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var q = screenCol.getBoundingClientRect(), px = (e.clientX - q.left) / q.width - .5, py = (e.clientY - q.top) / q.height - .5;
      browser.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
      browser.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
    });
    screenCol.addEventListener('pointerleave', function () { browser.style.setProperty('--rx', '0deg'); browser.style.setProperty('--ry', '0deg'); });
  }

  // ------------------------------------------------------------------ hero: isometric cube city with delivery lights (reacts to the cursor)
  (function city() {
    var cv = document.getElementById('city'), hero = document.querySelector('.hero'), hv = document.getElementById('hero-visual');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, a = 22, w = 0, N = 22, cx = 0, cy = 0;
    var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, last: -1e9 }, running = false, visible = true, raf = 0;
    var lit = new Float32Array(N * N), cubes = [], parts = [];
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) cubes.push([i, j]);
    cubes.sort(function (p, q) { return (p[0] + p[1]) - (q[0] + q[1]); });

    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var small = W < 960;
      a = small ? 15 : 22; w = a * Math.sqrt(3);
      cx = small ? W * .5 : W * .7; cy = small ? H * .74 : H * .56;
      if (reduce) draw(0);
    }
    function pos(i, j) { return [cx + (i - j) * w / 2, cy + (i + j - (N - 1)) * a / 2]; }
    function mix(c1, c2, k) { return 'rgb(' + Math.round(c1[0] + (c2[0] - c1[0]) * k) + ',' + Math.round(c1[1] + (c2[1] - c1[1]) * k) + ',' + Math.round(c1[2] + (c2[2] - c1[2]) * k) + ')'; }
    var TOP0 = [19, 40, 74], TOP1 = [30, 60, 104], LEFT = [14, 31, 58], RIGHT = [10, 24, 46], HOT = [59, 155, 255];
    function height(i, j, tm) {
      var p = pos(i, j), dx = p[0] - mouse.x, dy = p[1] - mouse.y;
      var boost = Math.exp(-(dx * dx + dy * dy) / (2 * 110 * 110));
      return [12 + 9 * Math.sin(i * .45 + tm * .0007) * Math.cos(j * .38 + tm * .0005) + 64 * boost, boost];
    }
    function spawn() {
      var horiz = Math.random() < .5, k = Math.floor(Math.random() * N), dir = Math.random() < .5 ? 1 : -1;
      var s = dir > 0 ? 0 : N - 1, len = 6 + Math.floor(Math.random() * 10), e = Math.max(0, Math.min(N - 1, s + dir * len));
      parts.push({ horiz: horiz, k: k, s: s, e: e, p: 0, sp: .012 + Math.random() * .014 });
    }
    function draw(tm) {
      ctx.clearRect(0, 0, W, H);
      mouse.x += (mouse.tx - mouse.x) * .08; mouse.y += (mouse.ty - mouse.y) * .08;
      if (tm - mouse.last > 3500) { // idle: a slow "virtual cursor" keeps the city alive (also on touch screens)
        mouse.tx = cx + Math.sin(tm * .00035) * w * 5; mouse.ty = cy + Math.cos(tm * .00027) * a * 4 - a * 2;
      }
      var hs = new Float32Array(N * N);
      for (var n = 0; n < cubes.length; n++) {
        var i = cubes[n][0], j = cubes[n][1], idx = i * N + j, hb = height(i, j, tm), h = hb[0], b = hb[1];
        hs[idx] = h;
        var p = pos(i, j), x = p[0], y = p[1] - h, L = lit[idx];
        if (x < -w || x > W + w || y > H + a || p[1] + a < 0) continue;
        var heat = Math.min(1, b * .9 + L);
        ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y + a / 2); ctx.lineTo(x, y + a / 2 + h); ctx.lineTo(x - w / 2, y + h); ctx.closePath();
        ctx.fillStyle = mix(LEFT, [24, 70, 130], heat * .7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x, y + a / 2); ctx.lineTo(x, y + a / 2 + h); ctx.lineTo(x + w / 2, y + h); ctx.closePath();
        ctx.fillStyle = mix(RIGHT, [16, 52, 104], heat * .7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y - a / 2); ctx.lineTo(x + w / 2, y); ctx.lineTo(x, y + a / 2); ctx.lineTo(x - w / 2, y); ctx.closePath();
        ctx.fillStyle = heat > 0 ? mix(mix2(TOP0, TOP1, (h - 3) / 30), HOT, heat * .85) : mix(TOP0, TOP1, Math.max(0, Math.min(1, (h - 3) / 30)));
        ctx.fill();
        ctx.strokeStyle = 'rgba(140,190,255,' + (.1 + heat * .5) + ')'; ctx.lineWidth = 1; ctx.stroke();
        if (L > 0) lit[idx] = Math.max(0, L - .012);
      }
      // delivery lights travelling along the streets
      ctx.globalCompositeOperation = 'lighter';
      for (var q = parts.length - 1; q >= 0; q--) {
        var P = parts[q]; P.p = Math.min(1, P.p + P.sp);
        var f = P.s + (P.e - P.s) * P.p, c0 = Math.floor(f), c1 = Math.min(N - 1, Math.ceil(f)), fr = f - c0;
        var ii = P.horiz ? f : P.k, jj = P.horiz ? P.k : f;
        var i0 = P.horiz ? c0 : P.k, j0 = P.horiz ? P.k : c0, i1 = P.horiz ? c1 : P.k, j1 = P.horiz ? P.k : c1;
        var hh = hs[i0 * N + j0] * (1 - fr) + hs[i1 * N + j1] * fr;
        var pp = pos(ii, jj), gx = pp[0], gy = pp[1] - hh;
        var gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, a * .9);
        gr.addColorStop(0, 'rgba(160,225,255,.95)'); gr.addColorStop(.25, 'rgba(92,200,255,.5)'); gr.addColorStop(1, 'rgba(59,155,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(gx, gy, a * .9, 0, 6.2832); ctx.fill();
        if (P.p >= 1) { var ei = P.horiz ? P.e : P.k, ej = P.horiz ? P.k : P.e; lit[ei * N + ej] = 1; parts.splice(q, 1); }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (parts.length < (W < 960 ? 4 : 7) && Math.random() < .04) spawn();
    }
    function mix2(c1, c2, k) { k = Math.max(0, Math.min(1, k)); return [c1[0] + (c2[0] - c1[0]) * k, c1[1] + (c2[1] - c1[1]) * k, c1[2] + (c2[2] - c1[2]) * k]; }
    function loop(tm) { draw(tm); raf = requestAnimationFrame(loop); }
    function setRun() {
      var go = visible && !document.hidden && !reduce;
      if (go && !running) { running = true; raf = requestAnimationFrame(loop); }
      else if (!go && running) { running = false; cancelAnimationFrame(raf); }
    }
    hero.addEventListener('pointermove', function (e) {
      var q = hero.getBoundingClientRect();
      mouse.tx = e.clientX - q.left; mouse.ty = e.clientY - q.top; mouse.last = performance.now();
      if (hv && !reduce && e.pointerType === 'mouse') {
        var px = (e.clientX - q.left) / q.width - .5, py = (e.clientY - q.top) / q.height - .5;
        hv.style.transform = 'translate3d(' + (-px * 18).toFixed(1) + 'px,' + (-py * 14).toFixed(1) + 'px,0)';
      }
    }, { passive: true });
    hero.addEventListener('pointerdown', function (e) { // a click/tap sends a burst of deliveries
      var q = hero.getBoundingClientRect(); mouse.tx = e.clientX - q.left; mouse.ty = e.clientY - q.top; mouse.last = performance.now();
      for (var k = 0; k < 4; k++) spawn();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.last = -1e9; if (hv) hv.style.transform = ''; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRun(); }).observe(hero);
    document.addEventListener('visibilitychange', setRun);
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(hero); else window.addEventListener('resize', size);
    size();
    for (var s0 = 0; s0 < 4; s0++) spawn();
    if (reduce) { mouse.x = mouse.tx = cx; mouse.y = mouse.ty = cy - a * 2; draw(0); } else setRun();
  })();

  // ------------------------------------------------------------------ boot
  applyCopy();
  renderBenefits();
  renderTicker();
  observeReveal();
  moveInd();
  if (!reduce) {
    countUp(document.getElementById('hv-count'), liveDelivered === undefined ? 8412 : liveDelivered, fmt, 1600);
    countUp(document.querySelector('.hv-num'), 64, String, 1400);
    countUp(document.querySelector('.hv-risknum'), 2, String, 1400);
  }
  renderMock();
  focusStep('overview', true);
})();
