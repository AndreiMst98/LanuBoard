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
      applyCopy(); renderBenefits(); renderTicker(); renderSteps(); renderMock(); focusStep(active, true); moveInd(); eqBuild(); eqGo(eq.s, true);
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
  function renderMock() { if (page === 'da') renderDa(); else if (page === 'cp') renderCp(); else if (page === 'hs') renderHs(); else if (page === 'wr') renderWr(); else renderOps(); }
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
    var b = e.target.closest('[data-day],[data-week],[data-sort],[data-sortdnr],[data-cp-act],[data-hs-act],[data-wr-act]');
    if (!b || b.disabled) return;
    stopAuto();
    if (b.dataset.cpAct) { cpAction(b.dataset.cpAct, b.dataset.v, b); return; }
    if (b.dataset.hsAct) { hsAction(b.dataset.hsAct, b.dataset.v); return; }
    if (b.dataset.wrAct) { wrAction(b.dataset.wrAct, b.dataset.v); return; }
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


  // ------------------------------------------------------------------ Housing page (fictional accommodations and people)
  var RATE = 400, HS_TAB = { kpis: 'housing', alert: 'housing', cards: 'housing', rent: 'rent', history: 'history' };
  var hs, hsTab = 'housing', hsFilter = 'all', hsRentM = 0, hsNext = 0, HSN = rosterOf(160);
  function dAt(y, m, d) { return new Date(y, m, d, 12); }
  var TODAY = (function () { var d = new Date(); return dAt(d.getFullYear(), d.getMonth(), d.getDate()); })();
  function mStart(off) { return dAt(TODAY.getFullYear(), TODAY.getMonth() + off, 1); }
  function mEnd(off) { return dAt(TODAY.getFullYear(), TODAY.getMonth() + off + 1, 0); }
  function addD(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function ddmm(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function dif(a, b) { return Math.round((b - a) / 864e5); }
  function eur(v) { return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function eur0(v) { return Math.round(v).toLocaleString('de-DE') + ' €'; }
  function monthName(off) { var n = mStart(off).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long', year: 'numeric' }); return n.charAt(0).toUpperCase() + n.slice(1); }
  function stay(p, off) { // rent of one stay inside one month: days are counted per night, the arrival day included
    var s = mStart(off), e = off === 0 ? TODAY : mEnd(off), from = p.in > s ? p.in : s, to = e;
    if (p.out) { var last = addD(p.out, -1); if (last < to) to = last; }
    if (to < from) return null;
    var days = dif(from, to) + 1;
    return { from: from, to: to, days: days, rent: days * RATE / mEnd(off).getDate() };
  }
  function makeHousing() {
    var ACC = [
      ['Lindenhof Ap. 2', 'Lindenweg 12', [2], 650], ['Parkblick Ap. 5', 'Am Stadtpark 4', [2, 1], 900],
      ['Mühlenhof Double', 'Mühlenstraße 18', [2, 2], 1150], ['Gartenhaus', 'Rosengasse 7', [2, 2], 1100],
      ['Nordring Ap. 3', 'Nordring 31', [2, 2], 1050], ['Mühlenhof Ap. 11', 'Mühlenstraße 18', [2, 2, 2], 1500],
      ['Mühlenhof Ap. 4', 'Mühlenstraße 18', [2, 2, 2], 1650], ['Station House', 'Bahnhofsweg 4', [2, 2, 4], 2150]
    ];
    var OCC = [[2], [2, 1], [2, 2], [2, 2], [2, 0], [1, 1, 0], [2, 2, 2], [2, 2, 4]], n = 100, r = rng(4711);
    var acc = ACC.map(function (a, i) {
      return { name: a[0], addr: a[1], landlord: a[3], taken: i === 7 ? addD(mStart(-24), 15) : mStart(-2), rooms: a[2].map(function (beds, k) {
        var people = [];
        for (var j = 0; j < OCC[i][k]; j++) people.push({ name: HSN[n++].name, in: r() < .8 ? mStart(-2) : addD(mStart(-1), between(r, 2, 20)) });
        return { beds: beds, people: people };
      }) };
    });
    acc[2].rooms[1].people[0].flag = true;
    var H = [[7, 3, 0, 0, Math.max(1, TODAY.getDate() - 2)], [3, 2, 22, -1, 0], [1, 2, 0, -1, 0], [0, 2, 0, -1, 0], [3, 1, 0, -1, 0], [7, 1, 0, -1, 0], [6, 3, 32, -1, -1], [5, 1, 0, -1, 23], [2, 2, 0, -1, 23]];
    var hist = H.map(function (h) {
      var out = h[4] > 0 ? dAt(TODAY.getFullYear(), TODAY.getMonth() + h[3], h[4]) : addD(mEnd(h[3]), h[4]);
      return { name: HSN[n++].name, acc: acc[h[0]].name, room: h[1], in: addD(mStart(-2), h[2]), out: out };
    });
    return { acc: acc, hist: hist, flag: 'open' };
  }
  function hsResidents() {
    var list = [];
    hs.acc.forEach(function (a) { a.rooms.forEach(function (rm, k) { rm.people.forEach(function (p) { list.push({ p: p, acc: a.name, room: k + 1 }); }); }); });
    return list;
  }
  function hsMonthRows(off) {
    var rows = [];
    hsResidents().forEach(function (x) { var st = stay(x.p, off); if (st) rows.push({ name: x.p.name, acc: x.acc, room: x.room, st: st }); });
    hs.hist.forEach(function (x) { var st = stay(x, off); if (st) rows.push({ name: x.name, acc: x.acc, room: x.room, st: st }); });
    return rows.sort(function (a, b) { return a.acc.localeCompare(b.acc) || a.room - b.room || a.name.localeCompare(b.name); });
  }
  function sum(rows) { return rows.reduce(function (t, x) { return { days: t.days + x.st.days, rent: t.rent + x.st.rent }; }, { days: 0, rent: 0 }); }
  var HI = {
    house: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
    pin: '<svg class="ic" width="12" height="12" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    cal: '<svg class="ic" width="12" height="12" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    ppl: '<svg class="ic" width="12" height="12" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>',
    warn: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
    check: '<svg class="ic" width="14" height="14" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    out: '<svg class="ic" width="14" height="14" viewBox="0 0 24 24"><path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/></svg>'
  };
  function hsCard(a, ai, cur) {
    var occ = 0, beds = 0;
    a.rooms.forEach(function (rm) { occ += rm.people.length; beds += rm.beds; });
    var full = occ === beds, drv = cur.filter(function (x) { return x.acc === a.name; }), dr = sum(drv).rent;
    var rooms = a.rooms.map(function (rm, k) {
      var ppl = rm.people.map(function (p) {
        return '<span class="hs-p' + (p.flag ? ' warn' : '') + (p.isNew ? ' add-in' : '') + '">' + avatar(p.name, 24) + esc(p.name) + (p.flag ? ' <i class="hs-w">' + HI.warn + '</i>' : '') + '</span>';
      }).join('');
      for (var f = rm.people.length; f < rm.beds; f++) ppl += '<button type="button" class="hs-slot" data-hs-act="checkin" data-v="' + ai + ',' + k + '">+ ' + t('hsCheckIn') + '</button>';
      return '<div class="hs-room' + (rm.isNew ? ' add-in' : '') + '"><div class="hs-rh"><b>' + t('hsRoom', { n: k + 1 }) + '</b><span class="hs-cnt' + (rm.people.length === rm.beds ? ' o' : '') + '">' + rm.people.length + '/' + rm.beds + '</span><span class="cp-ib sm">' + IC.edit + '</span></div><div class="hs-ppl">' + ppl + '</div></div>';
    }).join('');
    return '<div class="m-panel hs-card" data-p="cards"><div class="hs-ch"><span class="hs-ico">' + HI.house + '</span><div><b>' + esc(a.name) + '</b><span class="hs-addr">' + HI.pin + esc(a.addr) + '</span></div><span class="cp-ib">' + IC.edit + '</span></div>' +
      '<div class="hs-chips"><span class="hs-chip">' + HI.cal + t('hsTaken', { d: ddmm(a.taken) }) + '</span><span class="hs-chip">€ ' + t('hsLandlordChip', { n: eur0(a.landlord) }) + '</span><span class="hs-chip g">' + HI.ppl + t('hsDriversChip', { n: eur(dr) }) + '</span></div>' +
      '<div class="hs-occ"><span class="hs-bar' + (full ? ' full' : '') + '"><i style="width:' + (occ / beds * 100) + '%"></i></span><b>' + occ + '/' + beds + '</b><span>' + t('hsFree', { n: beds - occ }) + '</span></div>' +
      rooms + '<button type="button" class="cp-btn hs-addroom" data-hs-act="addroom" data-v="' + ai + '">' + IC.plus + t('hsAddRoom') + '</button></div>';
  }
  function hsSubnav() {
    return '<div class="hs-nav"><span class="dim">' + t('hsHousing') + '</span>' + [['housing', 'hsHousing'], ['rent', 'hsRent'], ['history', 'hsHistory']].map(function (x) {
      return '<button type="button" data-hs-act="tab" data-v="' + x[0] + '"' + (hsTab === x[0] ? ' class="on"' : '') + '>' + t(x[1]) + '</button>';
    }).join('') + '</div>';
  }
  function renderHs() {
    if (!hs) hs = makeHousing();
    var html = topBar(t('pageHs')) + hsSubnav() + '<div class="m-body">';
    if (hsTab === 'housing') {
      var cur = hsMonthRows(0), tot = sum(cur), res = hsResidents(), beds = 0, rooms = 0, land = 0;
      hs.acc.forEach(function (a) { land += a.landlord; a.rooms.forEach(function (rm) { beds += rm.beds; rooms++; }); });
      var bal = res.length * RATE - land, pctB = res.length / beds * 100;
      html += '<div class="m-panel m-dk hs-k" data-p="kpis">' +
        '<div class="dk"><span class="dk-h">' + t('hsActive') + '</span><b class="dk-big" data-count="' + hs.acc.length + '">' + hs.acc.length + '</b><span>' + t('hsRooms', { n: rooms }) + '</span></div>' +
        '<div class="dk"><span class="dk-h">' + t('hsBeds') + '</span><span class="cp-big"><b class="dk-big" data-count="' + res.length + '">' + res.length + '</b><span>' + t('mOf', { n: beds }) + '</span></span>' +
        '<div class="m-prog"><span class="tr"><i style="width:' + pctB + '%"></i></span><b>' + Math.round(pctB) + '%</b></div><span>' + t('hsFree', { n: beds - res.length }) + '</span></div>' +
        '<div class="dk hs-money"><span class="dk-h">' + t('hsRentKpi') + '</span><b class="dk-big">' + eur(tot.rent) + '</b><span>' + t('hsRentNote', { n: cur.length, m: eur0(RATE), d: eur(RATE / mEnd(0).getDate()).replace(/0 €$/, ' €') }) + '</span><span>' + t('hsLandlords', { n: eur0(land) }) + '</span>' +
        '<span class="hs-bal ' + (bal >= 0 ? 'pos' : 'neg') + '">' + t('hsBalance', { n: (bal >= 0 ? '+' : '−') + eur0(Math.abs(bal)) }) + '</span></div></div>';
      var F = [['all', 'hsAll'], ['free', 'hsFreeF'], ['full', 'hsFullF'], ['archived', 'hsArchived']];
      html += '<div class="hs-tools" data-p="cards"><span class="m-search">' + t('hsSearch') + '</span>' + F.map(function (f) { return '<button type="button" class="hs-f' + (hsFilter === f[0] ? ' on' : '') + '" data-hs-act="filter" data-v="' + f[0] + '">' + t(f[1]) + '</button>'; }).join('') +
        '<span class="hs-new">' + IC.plus + t('hsNew') + '</span></div>';
      var fp, fa, fr;
      hs.acc.forEach(function (a) { a.rooms.forEach(function (rm, k) { rm.people.forEach(function (p) { if (p.flag) { fp = p; fa = a; fr = k + 1; } }); }); });
      html += '<div class="m-panel hs-alert' + (hs.flag !== 'open' ? ' ok' : '') + '" data-p="alert">' + (hs.flag === 'open' && fp
        ? '<div class="hs-at"><span class="hs-ai">' + HI.warn + '</span><div><b>' + t('hsCheckTitle') + '</b><span>' + t('hsCheckNote') + '</span></div></div>' +
          '<div class="hs-arow">' + avatar(fp.name, 34) + '<div class="hs-an"><b>' + esc(fp.name) + '</b><span><em>' + t('hsInactive') + '</em>' + esc(fa.name) + ' · ' + t('hsRoom', { n: fr }) + ' · ' + t('hsSince', { d: ddmm(fp.in) }) + '</span></div>' +
          '<button type="button" class="hs-yes" data-hs-act="keep">' + HI.check + t('hsYes') + '</button><button type="button" class="hs-no" data-hs-act="checkout">' + HI.out + t('hsNo') + '</button></div>'
        : '<div class="hs-at"><span class="hs-ai ok">' + HI.check + '</span><div><b>' + t('hsOkTitle') + '</b><span>' + t('hsOkNote') + '</span></div></div>') + '</div>';
      var list = hs.acc.map(function (a, i) { return [a, i]; }).filter(function (x) {
        var occ = 0, b = 0; x[0].rooms.forEach(function (rm) { occ += rm.people.length; b += rm.beds; });
        return hsFilter === 'free' ? occ < b : hsFilter === 'full' ? occ === b : hsFilter !== 'archived';
      });
      var cols = [[], [], [], []];
      list.forEach(function (x, i) { cols[i % 4].push(hsCard(x[0], x[1], cur)); });
      html += list.length ? '<div class="hs-grid">' + cols.map(function (c) { return '<div class="hs-colm">' + c.join('') + '</div>'; }).join('') + '</div>'
        : '<div class="m-panel hs-empty" data-p="cards">' + t('hsNoArchived') + '</div>';
    } else if (hsTab === 'rent') {
      var months = [0, -1].map(function (o) { var rows = hsMonthRows(o); return { o: o, rows: rows, s: sum(rows) }; });
      var all = { days: months[0].s.days + months[1].s.days, rent: months[0].s.rent + months[1].s.rent };
      var sel = months[hsRentM === 0 ? 0 : 1];
      html += '<div class="m-panel" data-p="rent"><div class="m-ph"><h4>' + t('hsByMonth') + '</h4><span class="hs-note">' + t('hsClickMonth') + '</span></div><table class="m-t"><thead><tr><th>' + t('hsMonth') + '</th><th class="r">' + t('hsPeople') + '</th><th class="r">' + t('hsDays') + '</th><th class="r">' + t('hsTotalRent') + '</th></tr></thead><tbody>' +
        months.map(function (m) { return '<tr class="hs-mrow' + (m.o === hsRentM ? ' sel' : '') + '" data-hs-act="month" data-v="' + m.o + '"><td><b>' + monthName(m.o) + '</b>' + (m.o === 0 ? ' <small>' + t('hsOngoing') + '</small>' : '') + '</td><td class="r">' + m.rows.length + '</td><td class="r">' + m.s.days + '</td><td class="r"><b>' + eur(m.s.rent) + '</b></td></tr>'; }).join('') +
        '<tr class="hs-tot"><td><b>' + t('hsTotal') + '</b></td><td></td><td class="r"><b>' + all.days + '</b></td><td class="r"><b>' + eur(all.rent) + '</b></td></tr></tbody></table></div>' +
        '<div class="hs-mnav" data-p="rent"><span class="m-dnav"><button type="button" data-hs-act="month" data-v="-1"' + (hsRentM === -1 ? ' disabled' : '') + '>‹</button><span class="dv">' + monthName(hsRentM) + ' <span>▾</span></span><button type="button" data-hs-act="month" data-v="0"' + (hsRentM === 0 ? ' disabled' : '') + '>›</button></span>' +
        '<span class="hs-sumtxt">' + t('hsPeopleTotal', { n: sel.rows.length, t: '<b>' + eur(sel.s.rent) + '</b>' }) + '</span><span class="hs-rate">' + eur0(RATE) + '/' + (lang === 'de' ? 'Monat' : 'month') + ' · ' + eur(RATE / mEnd(hsRentM).getDate()).replace(/0 €$/, ' €') + '/' + (lang === 'de' ? 'Tag' : 'day') + '</span></div>' +
        '<div class="m-panel" data-p="rent"><table class="m-t dense"><thead><tr><th>' + t('hsPerson') + '</th><th>' + t('hsAcc') + '</th><th>' + t('hsRoomCol') + '</th><th>' + t('hsPeriod') + '</th><th class="r">' + t('hsDays') + '</th><th class="r">' + t('hsRentCol') + '</th></tr></thead><tbody>' +
        sel.rows.slice(0, 14).map(function (x, i) { return '<tr class="row-in" style="--i:' + i + '"><td><span class="da">' + avatar(x.name, 26) + '<b>' + esc(x.name) + '</b></span></td><td>' + esc(x.acc) + '</td><td>' + t('hsRoom', { n: x.room }) + '</td><td>' + ddmm(x.st.from) + ' – ' + ddmm(x.st.to) + '</td><td class="r">' + x.st.days + '</td><td class="r"><b>' + eur(x.st.rent) + '</b></td></tr>'; }).join('') +
        '</tbody></table></div>';
    } else {
      var rows = hs.hist.slice().sort(function (a, b) { return b.out - a.out; });
      html += '<div class="hs-mnav" data-p="history"><span class="m-search">' + t('hsSearchHist') + '</span><span class="m-dnav"><button type="button" disabled>‹</button><span class="dv">' + t('hsAllMonths') + ' <span>▾</span></span><button type="button" disabled>›</button></span><span class="hs-sumtxt"><b>' + t('hsEnded', { n: rows.length }) + '</b></span></div>' +
        '<div class="m-panel" data-p="history"><table class="m-t hs-hist"><thead><tr><th>' + t('hsPerson') + '</th><th>' + t('hsAcc') + '</th><th>' + t('hsRoomCol') + '</th><th>' + t('hsIn') + '</th><th>' + t('hsOut') + '</th><th class="r">' + t('hsNights') + '</th><th class="r">' + t('hsRentPerMonth') + '</th></tr></thead><tbody>' +
        rows.map(function (x, i) {
          var parts = [-1, 0].map(function (o) { var st = stay(x, o); return st ? { o: o, st: st } : null; }).filter(Boolean), total = parts.reduce(function (s0, q) { return s0 + q.st.rent; }, 0);
          var rent = parts.map(function (q) { return '<span class="hs-pm">' + monthName(q.o) + ' <small>' + t('hsDaysSmall', { n: q.st.days }) + '</small> <b>' + eur(q.st.rent) + '</b></span>'; }).join('') + (parts.length > 1 ? '<span class="hs-pm tot">' + t('hsTotalSmall') + ' <b>' + eur(total) + '</b></span>' : '');
          return '<tr class="' + (x.isNew ? 'add-in' : '') + '"><td><span class="da">' + avatar(x.name, 26) + '<b>' + esc(x.name) + '</b></span></td><td>' + esc(x.acc) + '</td><td>' + t('hsRoom', { n: x.room }) + '</td><td>' + ddmm(x.in) + '</td><td>' + ddmm(x.out) + '</td><td class="r">' + dif(x.in, x.out) + '</td><td class="r">' + rent + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    mock.innerHTML = html + '</div>';
    layoutMock();
  }
  function hsAction(act, v) {
    if (act === 'tab') { hsTab = v; renderMock(); focusStep(v === 'housing' ? 'kpis' : v, true); return; }
    if (act === 'month') { hsRentM = Number(v); renderMock(); focusStep('rent', true, true); return; }
    if (act === 'filter') { hsFilter = v; renderMock(); focusStep('cards', true, true); return; }
    if (act === 'checkin') {
      var ix = v.split(','), rm = hs.acc[ix[0]].rooms[ix[1]];
      hs.acc.forEach(function (a) { a.rooms.forEach(function (r0) { r0.isNew = false; r0.people.forEach(function (p) { p.isNew = false; }); }); });
      rm.people.push({ name: HSN[140 + (hsNext++ % 20)].name, in: TODAY, isNew: true });
      renderMock(); focusStep('cards', true, true); return;
    }
    if (act === 'addroom') {
      hs.acc.forEach(function (a) { a.rooms.forEach(function (r0) { r0.isNew = false; }); });
      hs.acc[v].rooms.push({ beds: 2, people: [], isNew: true }); renderMock(); focusStep('cards', true, true); return;
    }
    if (act === 'keep' || act === 'checkout') {
      hs.acc.forEach(function (a) { a.rooms.forEach(function (r0, k) {
        r0.people = r0.people.filter(function (p) {
          if (!p.flag) return true;
          p.flag = false;
          if (act === 'keep') return true;
          hs.hist.push({ name: p.name, acc: a.name, room: k + 1, in: p.in, out: TODAY, isNew: true });
          return false;
        });
      }); });
      hs.flag = act; renderMock(); focusStep('alert', true, true);
    }
  }



  // ------------------------------------------------------------------ Weekly Reports page (fictional figures)
  var WR_TAB = { upload: 'sc', results: 'sc', send: 'sc', kpis: 'iadc', trend: 'iadc', insights: 'iadc', heat: 'iadc', drivers: 'iadc', cnkpis: 'cn', cntrend: 'cn', cnins: 'cn', cncat: 'cn', cndrivers: 'cn', cndnr: 'cn' };
  var WR_ORDER = ['sc', 'iadc', 'cn'], WR_FIRST = { sc: 'upload', iadc: 'kpis', cn: 'cnkpis' };
  var cnZip = null, cnMode = 'active', cnUnit = 'count', cnTier = 'all';
  var wrTab = 'sc', wrWeek = 0, wrUp = 'done', wrPrev = null, wrCat = -1, wrTier = 'all', wrLetter = 'all';
  function nf(v, d) { return v.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pp(v) { return (v >= 0 ? '+' : '−') + nf(Math.abs(v), 2) + ' pp'; }
  function wrScore(off) {
    var r = rng(5150 + off * 71);
    return ROSTER.map(function (d) {
      var x = { name: d.name, id: d.id, del: between(r, 40, 860) };
      x.dcr = r() < .6 ? 100 : 99.4 + r() * .6; x.dsc = r() < .85 ? 0 : between(r, 900, 3200); x.lor = r() < .93 ? 0 : between(r, 1100, 2400);
      x.pod = r() < .8 ? 100 : 97 + r() * 3; x.cc = r() < .75 ? 100 : 92 + r() * 8; x.ce = r() < .94 ? 0 : 1; x.cdf = r() < .55 ? 100 : (r() < .97 ? 92 + r() * 8 : 20 + r() * 20);
      x.total = Math.max(60, 100 - (100 - x.dcr) * 1.4 - x.dsc / 900 - x.lor / 1100 - (100 - x.pod) * .5 - (100 - x.cc) * .3 - x.ce * 3 - (100 - x.cdf) * .06);
      x.status = x.total >= 99 ? 'Fantastic Plus' : x.total >= 95 ? 'Fantastic' : x.total >= 88 ? 'Great' : x.total >= 80 ? 'Fair' : 'Poor';
      return x;
    }).sort(function (a, b) { return b.total - a.total || b.del - a.del; });
  }
  function wrIadcData(off, shallow) {
    var r = rng(777 + off * 31), w = {};
    w.est = 38800 + Math.floor(r() * 4200); w.dwc = 89.2 + r() * 5.6; w.iadc = 56.5 + r() * 7.5;
    w.miss = Math.round((100 - w.dwc) / 100 * w.est); w.nc = Math.round((100 - w.iadc) / 100 * w.est * .45);
    w.fs = 14 + Math.floor(r() * 20); w.hh = 21 + Math.floor(r() * 18);
    if (shallow) return w;
    w.prev = wrIadcData(off - 1, true);
    w.weeks = []; for (var k = -10; k <= 0; k++) { var q = k === 0 ? w : wrIadcData(off + k, true); w.weeks.push({ n: weekInfo(off + k - 1).n, dwc: q.dwc, iadc: q.iadc }); }
    w.sys = [1 + Math.floor(r() * 2), 3 + Math.floor(r() * 2)];
    w.days = [0, 1, 2, 3, 4].map(function (d) { var sy = w.sys.indexOf(d) >= 0; return { dwc: w.dwc + (sy ? -2.6 : 1.6) + (r() - .5), iadc: w.iadc + (r() - .5) * 3 }; });
    w.A = Math.round(w.miss * (.56 + r() * .06)); w.C = Math.round(w.miss * .36); w.D = Math.round(w.miss * .017); w.E = Math.max(0, w.miss - w.A - w.C - w.D);
    w.F = w.hh * 2 + 3;
    var drv = ROSTER.map(function (d) {
      var x = { name: d.name, id: d.id, days: r() < .8 ? 5 : between(r, 3, 4), est: between(r, 110, 820) };
      x.dwc = Math.min(99.8, 86.5 + Math.pow(r(), .55) * 13); x.adj = Math.min(99.9, x.dwc + .8 + r() * 1.4); x.iadc = Math.max(28, Math.min(88, w.iadc + (r() - .5) * 34));
      x.dt = x.adj >= 95 ? 'OK' : x.adj >= 90 ? 'WATCH' : 'CRITICAL'; x.it = x.iadc >= 65 ? 'OK' : x.iadc >= 50 ? 'WATCH' : 'CRITICAL';
      x.miss = Math.round(x.est * (100 - x.dwc) / 100);
      var a = Math.round(x.miss * (.5 + r() * .3)), c = Math.round((x.miss - a) * .8), dd2 = r() < .2 ? 1 + Math.floor(r() * 4) : 0, e = Math.max(0, x.miss - a - c - dd2);
      x.flags = [['A', a], ['C', c], ['D', dd2], ['E', e]].filter(function (f) { return f[1] > 0; });
      x.nc = Math.round(x.est * (100 - x.iadc) / 100 * .4); x.hhp = 68 + Math.floor(r() * 30); x.fs = r() < .55 ? 0 : between(r, 1, 4); x.hd = r() < .5 ? 0 : between(r, 1, 5);
      x.score = Math.max(4, Math.min(99, Math.round((100 - x.adj) * 5 + Math.max(0, 65 - x.iadc) * .9 + x.fs * 7 + x.hd * 4)));
      return x;
    }).sort(function (a, b) { return b.score - a.score; });
    w.drivers = drv;
    w.critD = drv.filter(function (x) { return x.dt === 'CRITICAL'; }).length; w.critI = drv.filter(function (x) { return x.it === 'CRITICAL'; }).length;
    w.fsDrv = drv.filter(function (x) { return x.fs; }).length; w.hhDrv = drv.filter(function (x) { return x.hd; }).length;
    var top = drv.slice().sort(function (a, b) { return b.miss - a.miss; }).slice(0, 10).reduce(function (t0, x) { return t0 + x.miss; }, 0);
    w.top10 = top / Math.max(1, drv.reduce(function (t0, x) { return t0 + x.miss; }, 0)) * 100;
    w.below = 4 + Math.floor(r() * 9);
    return w;
  }
  function wrDelta(v, unit, goodWhenUp) {
    var up = v >= 0, good = goodWhenUp ? up : !up;
    return '<span class="wr-d ' + (good ? 'pos' : 'neg') + '">' + (up ? '↑' : '↓') + ' ' + unit + '</span>';
  }
  function chart(w, h, labels, series, yMin, yMax, targets, bands) {
    var L = 46, R = 16, T = 14, B = 26, iw = w - L - R, ih = h - T - B, n = labels.length;
    function X(i) { return L + (n === 1 ? iw / 2 : i * iw / (n - 1)); }
    function Y(v) { return T + ih - (v - yMin) / (yMax - yMin) * ih; }
    var g = '';
    (bands || []).forEach(function (i) { g += '<rect x="' + (X(i) - 12) + '" y="' + T + '" width="24" height="' + ih + '" fill="#FDEFD5"/>'; });
    for (var k = 0; k <= 4; k++) { var v = yMin + (yMax - yMin) * k / 4; g += '<path d="M' + L + ' ' + Y(v) + 'H' + (w - R) + '" stroke="#EDF0F5"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + Math.round(v) + '%</text>'; }
    targets.forEach(function (tg) { g += '<path d="M' + L + ' ' + Y(tg[0]) + 'H' + (w - R) + '" stroke="' + tg[1] + '" stroke-dasharray="4 4" opacity=".6"/><text class="tg" x="' + (w - R) + '" y="' + (Y(tg[0]) - 6) + '" text-anchor="end" fill="' + tg[1] + '">' + tg[2] + '</text>'; });
    labels.forEach(function (lb, i) { g += '<text x="' + X(i) + '" y="' + (h - 6) + '" text-anchor="middle">' + lb + '</text>'; });
    series.forEach(function (sr) {
      var d = sr.vals.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
      g += '<path class="ln" d="' + d + '" stroke="' + sr.c + '"/>' + sr.vals.map(function (v, i) { return '<circle class="pt" style="--i:' + i + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="4" fill="' + sr.c + '"/>'; }).join('');
    });
    return '<svg class="wr-ch" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + g + '</svg>';
  }
  var WR_REASONS = [['Geo >25 m', .62], ['Geo >50 m', .27], ['GPS off', .11]], WR_ROWS = [
    ['DWC', 'Geo >25 m', 'A', 1], ['DWC', 'Contact Miss', 'C', 1], ['DWC', 'Photo Defect', 'D', .8], ['DWC', 'OTP Miss', 'E', 1], ['DWC', 'Photo Manual Bypass', 'D', .2],
    ['IADC', 'Unattended (Customer Safe Place)', 'B', .77], ['IADC', 'Mailbox Recommended', 'B', .19], ['IADC', 'Unattended (Recommended)', 'B', .035], ['IADC', 'Attended (Customer Safe Place)', 'B', .005]];
  var WR_PLACES = ['Household Member', 'Doorstep', 'Safe Location', 'Neighbor', 'Mail Slot', 'Garage', 'Garden', 'Shed', 'Rear Door'];
  function wrSubnav() {
    return '<div class="hs-nav"><span class="dim">' + t('wrTitle') + '</span>' + [['sc', 'wrSc'], ['iadc', 'wrIadc'], ['cn', 'cnTab']].map(function (x) {
      return '<button type="button" data-wr-act="tab" data-v="' + x[0] + '"' + (wrTab === x[0] ? ' class="on"' : '') + '>' + t(x[1]) + '</button>';
    }).join('') + '</div>';
  }
  function wrWeekPanel(extra) {
    var wi = weekInfo(wrWeek - 1);
    return '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + t('daWeek', { n: wi.n }) + (wrTab === 'iadc' ? ' <span class="wr-st">· ST01</span>' : '') + '</b><span>' + esc(wi.range) + '</span></div>' + (extra || '') +
      '<div class="m-dnav"><button type="button" data-wr-act="week" data-v="-1" aria-label="Previous week"' + (wrWeek <= -8 ? ' disabled' : '') + '>‹</button><button type="button" data-wr-act="week" data-v="1" aria-label="Next week"' + (wrWeek >= 0 ? ' disabled' : '') + '>›</button></div></div>';
  }
  var WR_DOC = '<svg class="ic" width="20" height="20" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>';
  var WR_IMG = '<svg class="ic" width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>';
  var WR_UPI = '<svg class="ic" width="16" height="16" viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>';
  function statusPill(st) { var c = { 'Fantastic Plus': 'fp', Fantastic: 'fa', Great: 'gr', Fair: 'fr', Poor: 'po' }[st]; return '<span class="wr-s ' + c + '">' + st + '</span>'; }
  function wrUploadInner(n) {
    var wi = weekInfo(wrWeek - 1);
    var state = wrUp === 'done' ? '' : '<div class="wr-prog"><span class="wr-spin"></span><b>' + (wrUp === 'reading' ? t('wrReading') : wrUp === 'matching' ? t('wrMatching', { n: n }) : t('wrDoneUp', { n: n })) + '</b><span class="tr"><i style="width:' + (wrUp === 'reading' ? 35 : wrUp === 'matching' ? 75 : 100) + '%"></i></span></div>';
    return '<div class="m-ph"><h4>' + t('wrUploadTitle') + '</h4></div><div class="wr-drop"><span class="wr-di">' + WR_DOC + '</span><div><b>' + t('wrUploadHead') + '</b><small>' + t('wrUploadNote') + '</small>' +
      '<span class="wr-file"><span class="wr-ch-btn">' + t('wrChoose') + '</span>scorecard-' + new Date().getFullYear() + '-' + wi.n + '.pdf</span></div></div>' +
      '<div class="wr-up-row"><button type="button" class="wr-upbtn" data-wr-act="upload">' + WR_UPI + t('wrUpload') + '</button>' + state + '</div><div class="m-foot">' + t('wrUploadFoot') + '</div>';
  }
  function wrSendInner(rows) {
    var wi = weekInfo(wrWeek - 1), f = wrPrev === 'img' ? 'scorecard-' + wi.n + '.png' : 'scorecard-' + wi.n + '.pdf';
    var prev = '';
    if (wrPrev === 'img') prev = '<div class="wr-prev img"><div class="wr-pi"><b>LANU · ' + t('daWeek', { n: wi.n }) + '</b>' + rows.slice(0, 5).map(function (x, i) { return '<span><i>' + (i + 1) + '</i>' + esc(x.name) + '<em>' + nf(x.total, 2) + '%</em></span>'; }).join('') + '<small>Fantastic Plus · Fantastic · Great · Fair</small></div><span class="wr-saved">✓ ' + t('wrSaved', { f: f }) + '</span></div>';
    if (wrPrev === 'pdf') prev = '<div class="wr-prev pdf"><div class="wr-pages"><span></span><span></span><span></span></div><span class="wr-saved">✓ ' + t('wrSaved', { f: f }) + ' · ' + t('wrPages', { n: rows.length + 1 }) + '</span></div>';
    return '<div class="m-ph"><h4>' + t('wrSend') + '</h4></div>' +
      '<button type="button" class="wr-dl' + (wrPrev === 'img' ? ' on' : '') + '" data-wr-act="img"><span class="wr-di">' + WR_IMG + '</span><span><b>' + t('wrImg') + '</b><small>' + t('wrImgNote') + '</small></span></button>' +
      '<button type="button" class="wr-dl' + (wrPrev === 'pdf' ? ' on' : '') + '" data-wr-act="pdf"><span class="wr-di">' + WR_DOC + '</span><span><b>' + t('wrPdf') + '</b><small>' + t('wrPdfNote') + '</small></span></button>' + prev;
  }
  function wrDriversInner(w) {
    var list = w.drivers.filter(function (x) { return (wrTier === 'all' || x.dt === wrTier || x.it === wrTier) && (wrLetter === 'all' || x.flags.some(function (f) { return f[0] === wrLetter; })); });
    var tiers = ['all', 'OK', 'WATCH', 'CRITICAL'].map(function (tr) { return '<button type="button" class="hs-f' + (wrTier === tr ? ' on' : '') + '" data-wr-act="tier" data-v="' + tr + '">' + (tr === 'all' ? t('wrAll') : tr) + '</button>'; }).join('');
    var lets = ['all', 'A', 'C', 'D', 'E'].map(function (l) { return '<button type="button" class="hs-f sq' + (wrLetter === l ? ' on' : '') + '" data-wr-act="letter" data-v="' + l + '">' + (l === 'all' ? t('wrAll') : l) + '</button>'; }).join('');
    var C = t('wrCols'), tierP = function (tr) { return '<span class="wr-t ' + tr.toLowerCase() + '">' + tr + '</span>'; };
    var FC = { A: 'a', C: 'c', D: 'd', E: 'e' };
    return '<div class="m-ph"><h4>' + t('wrDrivers') + '</h4><span class="m-cnt">' + t('wrDrvCount', { n: w.drivers.length }) + '</span><span class="cp-btn">' + t('wrExport') + '</span></div><p class="wr-note">' + t('wrDrvNote') + '</p>' +
      '<div class="wr-fil"><span class="m-search">' + t('wrSearchDrv') + '</span>' + tiers + '<span class="wr-sep"></span>' + lets + '</div>' +
      '<table class="m-t dense wr-dt"><thead><tr><th>' + C[0] + '</th><th>' + C[1] + '</th><th class="r">' + C[2] + '</th><th class="r">' + C[3] + '</th><th class="r">' + C[4] + '</th><th class="r">' + C[5] + '</th><th>' + C[6] + '</th><th class="r">' + C[7] + '</th><th>' + C[8] + '</th><th class="r">' + C[9] + '</th><th class="r">' + C[10] + '</th><th class="r">' + C[11] + '</th><th class="r">' + C[12] + '</th><th class="r">' + C[13] + '</th><th class="r">' + C[14] + ' ↓</th></tr></thead><tbody>' +
      list.slice(0, 9).map(function (x, i) {
        return '<tr class="row-in" style="--i:' + i + '"><td><span class="da">' + avatar(x.name, 26) + '<b>' + esc(x.name) + '</b></span></td><td class="mono">' + x.id + '</td><td class="r">' + x.days + '</td><td class="r">' + x.est + '</td><td class="r">' + nf(x.dwc, 2) + '%</td><td class="r"><b>' + nf(x.adj, 2) + '%</b></td><td>' + tierP(x.dt) + '</td><td class="r">' + nf(x.iadc, 2) + '%</td><td>' + tierP(x.it) + '</td>' +
          '<td class="r">' + x.miss + ' ' + x.flags.map(function (f) { return '<span class="wr-f ' + FC[f[0]] + '">' + f[0] + f[1] + '</span>'; }).join('') + '</td><td class="r">' + x.nc + '</td><td class="r">' + x.hhp + '%</td><td class="r' + (x.fs ? ' red' : '') + '">' + x.fs + '</td><td class="r' + (x.hd ? ' red' : '') + '">' + x.hd + '</td><td class="r"><span class="wr-sc">' + x.score + '</span></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function wrBreakInner(w) {
    var cats = t('wrCats'), vals = [w.A, w.nc, w.C, w.D, w.E, w.F], cols = ['#2F6BFF', '#7C3AED', '#F5A623', '#12B76A', '#06AED4', '#E5484D'], tags = ['DWC', 'IADC', 'DWC', 'DWC', 'DWC', 'D-2'];
    var REAS = [WR_REASONS, [['Unattended (Customer Safe Place)', .77], ['Mailbox Recommended', .19], ['Unattended (Recommended)', .04]], [['Contact Miss', .82], ['No call before', .18]], [['Photo Defect', .8], ['Photo Manual Bypass', .2]], [['OTP Miss', 1]], [['Household DNR', .55], ['Confirmed false scan', .45]]];
    return '<div class="m-ph"><h4>' + t('wrBreak') + '</h4><span class="m-cnt">' + t('wrBreakTag') + '</span></div><p class="wr-note">' + t('wrBreakNote') + '</p>' +
      cats.map(function (c, i) {
        var base = i === 1 || i === 5 ? vals[i] : w.miss, pc = vals[i] / base * 100;
        var open = wrCat === i ? '<div class="wr-reas">' + REAS[i].map(function (q) { return '<span><i style="background:' + cols[i] + '"></i>' + q[0] + '<b>' + nf(Math.round(vals[i] * q[1])) + '</b></span>'; }).join('') + '</div>' : '';
        return '<button type="button" class="wr-bar' + (wrCat === i ? ' on' : '') + '" data-wr-act="cat" data-v="' + i + '"><b>' + 'ABCDEF'[i] + '</b><span class="wr-bl">' + c + ' <small>' + tags[i] + '</small></span><span class="wr-bt"><i style="width:' + Math.max(1.5, pc) + '%;background:' + cols[i] + '"></i></span><span class="wr-bv">' + nf(vals[i]) + ' <small>' + nf(pc, 1) + '%</small></span></button>' + open;
      }).join('');
  }

  // ---------- Concessions report (fictional)
  var CN_ZIPS = ['50667', '50668', '50670', '50672', '50674', '50676', '50677', '50678', '50733', '50735', '50737', '50739'];
  var CN_KC = ['#E5484D', '#2F6BFF', '#7C3AED', '#F5A623', '#06AED4', '#98A2B3'], CN_PC = ['#2F6BFF', '#7C3AED', '#F5A623', '#12B76A', '#06AED4', '#E5484D', '#98A2B3'];
  var cnCache = {};
  function cnData(off, shallow) {
    var key = off + (shallow ? 's' : '') + lang;
    if (cnCache[key]) return cnCache[key];
    var r = rng(4040 + off * 17), w = {};
    w.del = 41000 + Math.floor(r() * 5000); w.dnr = 92 + Math.floor(r() * 32); w.dpmo = Math.round(w.dnr / w.del * 1e6); w.cost = w.dnr * (28 + r() * 5);
    if (shallow) return (cnCache[key] = w);
    w.prev = cnData(off - 1, true);
    var wn = weekInfo(off - 1).n; w.wn = wn; w.win = [wn - 3, wn - 2, wn - 1, wn];
    w.trend = []; for (var k = -6; k <= 0; k++) { var q = k === 0 ? w : cnData(off + k, true); w.trend.push({ n: wn + k, dpmo: q.dpmo, cost: q.cost }); }
    w.revA = w.dnr + 10 + Math.floor(r() * 12); w.revB = w.revA - 8 - Math.floor(r() * 8); w.revDa = 41000 + Math.floor(r() * 2000); w.revDb = w.revDa - 13;
    w.zips = CN_ZIPS.map(function (z, i) { return { z: z, n: Math.max(4, Math.round(100 * Math.pow(.74, i) * (.85 + r() * .3))) }; }).sort(function (a, b) { return b.n - a.n; });
    w.zipTot = w.zips.reduce(function (a, z) { return a + z.n; }, 0);
    w.kw = w.win.map(function () { return [0, 1, 2, 3, 4, 5].map(function (k) { return 6 + Math.floor(r() * (k > 3 ? 26 : 18)); }); });
    w.kcost = [0, 1, 2, 3, 4, 5].map(function (k) { return 25 + k * 3 + r() * 9; });
    w.pw = w.win.map(function () { return [0, 1, 2, 3, 4, 5, 6].map(function (k) { return k < 5 ? 8 + Math.floor(r() * (k < 2 ? 30 : 18)) : Math.floor(r() * 5); }); });
    w.winTot = w.kw.reduce(function (a, ks) { return a + ks.reduce(function (b, c) { return b + c; }, 0); }, 0);
    w.k1 = w.kw[3][0]; w.k1win = w.kw.reduce(function (a, ks) { return a + ks[0]; }, 0);
    w.ret = 9 + Math.floor(r() * 8); w.lost = Math.floor(r() * 3);
    var stationDpmo = w.dpmo;
    w.drivers = ROSTER.slice(0, 60).map(function (d) {
      var x = { name: d.name, id: d.id, del4: between(r, 1400, 3900) };
      x.dnr4 = r() < .2 ? 0 : 1 + Math.floor(Math.pow(r(), 1.7) * 16); x.dpmo4 = Math.round(x.dnr4 / x.del4 * 1e6); x.vs = x.dpmo4 / stationDpmo;
      x.tier = x.dnr4 === 0 ? 'OK' : x.vs <= 1 ? 'OK' : x.vs <= 2 ? 'WATCH' : 'CRITICAL';
      x.wk = w.win.map(function () { return r() < .15 ? null : Math.floor(r() * Math.max(1, x.dnr4 / 2)); });
      x.cost = x.dnr4 * (26 + r() * 10); x.ks = [0, 1, 2, 3, 4, 5].map(function () { return Math.floor(r() * 6); }); x.dom = x.ks.indexOf(Math.max.apply(null, x.ks));
      x.flags = [0, 1, 2, 3, 4, 5, 6].filter(function (f) { return r() < [.4, .2, .18, .14, .04, .16, .06][f]; }).slice(0, 2);
      x.score = Math.min(99, Math.round(x.vs * 22 + x.dnr4 * 2 + x.flags.length * 6));
      return x;
    }).filter(function (x) { return x.dnr4 > 0; }).sort(function (a, b) { return b.score - a.score; });
    w.drvDnr = w.drivers.length;
    var top10 = w.drivers.slice().sort(function (a, b) { return b.dnr4 - a.dnr4; }).slice(0, 10).reduce(function (a, x) { return a + x.dnr4; }, 0);
    w.top10 = top10 / w.drivers.reduce(function (a, x) { return a + x.dnr4; }, 0) * 100;
    var places = t('cnPlaces'), PL = [0, 1, 2, 3, 4, 2, 5], SUG = [[3, 0, 1, 4], [3, 1, 4], [1, 4], [4, 1], [3], [0, 1, 4]];
    w.list = [];
    for (var i = 0; i < 46; i++) {
      var wk = i < 30 ? 3 : 3 - Math.floor(r() * 3), dEnd = addD(TODAY, (off - 1) * 7 - (3 - wk) * 7 - TODAY.getDay() + 6);
      var del = addD(dEnd, -between(r, 2, 15)), pl = between(r, 0, 6), sg = SUG[between(r, 0, 5)], gps = r() < .7 ? between(r, 5, 24) : r() < .9 ? between(r, 26, 90) : between(r, 900, 6000);
      var z = w.zips[Math.min(11, Math.floor(Math.pow(r(), 1.6) * 12))].z, dv = w.drivers[Math.floor(Math.pow(r(), 1.3) * Math.min(25, w.drivers.length))];
      var fl = []; if (sg.indexOf(3) >= 0 && pl !== 3) fl.push(0); if (gps > 25) fl.push(1); if (pl === 1) fl.push(2); if (r() < .1) fl.push(3);
      w.list.push({ wk: w.win[wk], date: dEnd, del: del, time: pad(between(r, 9, 20)) + ':' + pad(between(r, 0, 59)), drv: dv.name, tr: 'DE58' + between(r, 10000000, 99999999), zip: z, pl: pl,
        sug: sg, app: sg.indexOf(pl) < 0, gps: gps, ct: between(r, 0, 2), ph: between(r, 0, 2), fl: fl, ret: i % 4 === 1 ? (function (d) { var lim = addD(TODAY, -1); return d > lim ? lim : d; })(addD(dEnd, between(r, 3, 9))) : null });
    }
    w.list.sort(function (a, b) { return b.date - a.date || b.del - a.del; });
    w.noContact = w.list.filter(function (x) { return x.ct === 1; }).length / w.list.length * 100;
    w.elsewhere = w.list.filter(function (x) { return x.app; }).length / w.list.length * 100;
    return (cnCache[key] = w);
  }
  function eurc(v) { return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function comboChart(w, h, labels, bars, line, rev, legend) {
    var L = 56, R = 14, T = 14, B = 26, iw = w - L - R, ih = h - T - B, n = labels.length, mx = Math.ceil(Math.max.apply(null, bars.concat(line)) * 1.1 / 750) * 750;
    function X(i) { return L + (i + .5) * iw / n; } function Y(v) { return T + ih - v / mx * ih; }
    var g = '';
    for (var k = 0; k <= 4; k++) { var v = mx * k / 4; g += '<path d="M' + L + ' ' + Y(v) + 'H' + (w - R) + '" stroke="#EDF0F5"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + nf(v) + '</text>'; }
    bars.forEach(function (v, i) { g += '<rect class="bar" style="--i:' + i + '" x="' + (X(i) - 16) + '" y="' + Y(v) + '" width="32" height="' + (Y(0) - Y(v)) + '" rx="3" fill="#B794F4"/>'; });
    g += '<path class="ln" d="' + line.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('') + '" stroke="#2F6BFF"/>';
    line.forEach(function (v, i) { var rv = rev.indexOf(i) >= 0; g += '<circle class="pt" style="--i:' + i + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (rv ? 7 : 4) + '" fill="' + (rv ? '#F5A623' : '#2F6BFF') + '"' + (rv ? ' stroke="#93570D" stroke-width="1.5"' : '') + '/>'; });
    labels.forEach(function (lb, i) { g += '<text x="' + X(i) + '" y="' + (h - 6) + '" text-anchor="middle">' + lb + '</text>'; });
    return '<svg class="wr-ch" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + g + '</svg>';
  }
  function groupBars(w, h, groups, vals, colors, fmtV) {
    var L = 44, R = 10, T = 12, B = 26, iw = w - L - R, ih = h - T - B, n = groups.length, k = vals[0].length, mx = Math.max.apply(null, vals.map(function (a) { return Math.max.apply(null, a); })) * 1.08;
    function Y(v) { return T + ih - v / mx * ih; }
    var gw = iw / n, bw = Math.min(18, (gw - 24) / k), g = '';
    for (var q = 0; q <= 4; q++) { var v = mx * q / 4; g += '<path d="M' + L + ' ' + Y(v) + 'H' + (w - R) + '" stroke="#EDF0F5"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + fmtV(v) + '</text>'; }
    groups.forEach(function (gr, i) {
      var x0 = L + i * gw + (gw - bw * k) / 2;
      vals[i].forEach(function (v, j) { g += '<rect class="bar" style="--i:' + (i * k + j) + '" x="' + (x0 + j * bw).toFixed(1) + '" y="' + Y(v).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + (Y(0) - Y(v)).toFixed(1) + '" fill="' + colors[j] + '"/>'; });
      g += '<text x="' + (L + i * gw + gw / 2) + '" y="' + (h - 6) + '" text-anchor="middle">' + gr + '</text>';
    });
    return '<svg class="wr-ch" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + g + '</svg>';
  }
  function cnCatsInner(w) {
    var eu = cnUnit === 'euro', vals = w.kw.map(function (ks) { return ks.map(function (c, k) { return eu ? c * w.kcost[k] : c; }); });
    return '<div class="m-ph"><h4>' + t('cnCatsT') + '</h4><span class="cn-tg"><button type="button" class="hs-f on">' + t('cnWindowB') + '</button><span class="wr-sep"></span>' +
      '<button type="button" class="hs-f' + (!eu ? ' on' : '') + '" data-wr-act="cnunit" data-v="count">' + t('cnCount') + '</button><button type="button" class="hs-f' + (eu ? ' on' : '') + '" data-wr-act="cnunit" data-v="euro">' + t('cnEuro') + '</button></span></div>' +
      groupBars(600, 240, w.win.map(function (n) { return 'W' + n; }), vals, CN_KC, function (v) { return eu ? nf(v) + ' €' : nf(v); }) +
      '<div class="wr-leg wrap">' + t('cnKs').map(function (k, i) { return '<span style="--c:' + CN_KC[i] + '"><b>K' + (i + 1) + '</b> ' + k + '</span>'; }).join('') + '</div>';
  }
  function cnDrvInner(w) {
    var C = t('cnDrvCols'), list = w.drivers.filter(function (x) { return cnTier === 'all' || x.tier === cnTier; }), F = t('cnFlags');
    var tiers = ['all', 'OK', 'WATCH', 'CRITICAL'].map(function (tr) { return '<button type="button" class="hs-f' + (cnTier === tr ? ' on' : '') + '" data-wr-act="cntier" data-v="' + tr + '">' + (tr === 'all' ? t('wrAll') : tr) + '</button>'; }).join('');
    return '<div class="m-ph"><h4>' + t('wrDrivers') + '</h4><span class="m-cnt">' + t('wrDrvCount', { n: w.drivers.length }) + '</span><span class="cp-btn">' + t('wrExport') + '</span></div>' +
      '<div class="wr-fil"><span class="m-search">' + t('wrSearchDrv') + '</span>' + tiers + '</div>' +
      '<table class="m-t dense wr-dt"><thead><tr><th>' + C[0] + '</th><th>' + C[1] + '</th><th class="r">' + C[2] + '</th><th class="r">' + C[3] + '</th><th class="r">' + C[4] + '</th><th class="r">' + C[5] + '</th><th>' + C[6] + '</th>' +
      w.win.map(function (n) { return '<th class="r">W' + n + '</th>'; }).join('') + '<th class="r">' + C[7] + '</th><th>' + C[8] + '</th><th>' + C[9] + '</th><th>' + C[10] + '</th><th class="r">' + C[11] + ' ↓</th></tr></thead><tbody>' +
      list.slice(0, 9).map(function (x, i) {
        var mxk = Math.max.apply(null, x.ks) || 1;
        return '<tr class="row-in" style="--i:' + i + '"><td><span class="da">' + avatar(x.name, 26) + '<b>' + esc(x.name) + '</b></span></td><td class="mono">' + x.id + '</td><td class="r">' + nf(x.del4) + '</td><td class="r">' + x.dnr4 + '</td><td class="r">' + nf(x.dpmo4) + '</td><td class="r">' + nf(x.vs, 2) + '×</td>' +
          '<td><span class="wr-t ' + x.tier.toLowerCase() + '">' + x.tier + '</span></td>' + x.wk.map(function (v) { return '<td class="r">' + (v === null ? '—' : v) + '</td>'; }).join('') + '<td class="r">' + eurc(x.cost) + '</td>' +
          '<td><span class="cn-spark">' + x.ks.map(function (v, k) { return '<i style="height:' + (3 + v / mxk * 15) + 'px;background:' + CN_KC[k] + '"></i>'; }).join('') + '</span></td><td><span class="cn-dom" style="background:' + CN_KC[x.dom] + '">K' + (x.dom + 1) + '</span></td>' +
          '<td class="wrp fl">' + x.flags.map(function (f) { return '<span class="cn-fl' + (f === 3 || f === 4 ? ' red' : '') + '">' + F[f] + '</span>'; }).join('') + '</td><td class="r"><span class="wr-sc">' + x.score + '</span></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function cnDnrInner(w) {
    var C = t('cnDnrCols'), P = t('cnPlaces'), CT = t('cnContacts'), PH = t('cnPhoto'), FL = t('cnDnrFlags');
    var all = w.list.filter(function (x) { return !cnZip || x.zip === cnZip; });
    var list = all.filter(function (x) { return cnMode === 'ret' ? x.ret : cnMode === 'active' ? !x.ret : true; });
    var act = w.list.filter(function (x) { return !x.ret; }).length;
    var modes = [['active', 'cnActive'], ['with', 'cnWithRet'], ['ret', 'cnRetOnly']].map(function (m) { return '<button type="button" class="hs-f' + (cnMode === m[0] ? ' on' : '') + '" data-wr-act="cnmode" data-v="' + m[0] + '">' + t(m[1]) + '</button>'; }).join('');
    return '<div class="m-ph"><h4>' + t('cnDnr') + '</h4><span class="m-cnt">' + t('cnDnrCount', { a: act * 9 + 6, b: w.list.length * 9 + 4 }) + '</span><span class="cp-btn">' + t('wrExport') + '</span></div>' +
      '<div class="wr-fil"><span class="m-search">' + t('cnSearchDnr') + '</span>' + modes + (cnZip ? '<button type="button" class="cn-chip" data-wr-act="cnzipx">' + t('cnZipF', { z: cnZip }) + ' ×</button>' : '') + '</div>' +
      '<table class="m-t dense wr-dt cn-dnr"><thead><tr>' + C.map(function (c, i) { return '<th' + (i === 8 ? ' class="r"' : '') + '>' + c + (i === 1 ? ' ↓' : '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
      list.slice(0, 11).map(function (x, i) {
        return '<tr class="row-in' + (x.ret ? ' ret' : '') + '" style="--i:' + i + '"><td><b>W' + x.wk + '</b></td><td>' + ddmm(x.date) + '</td><td class="wrp">' + ddmm(x.del) + ' ' + x.time + '</td><td class="lnk wrp">' + esc(x.drv) + '</td><td class="mono">' + x.tr + '</td><td>' + x.zip + '</td><td>' + P[x.pl] + '</td>' +
          '<td class="wrp sg">' + x.sug.slice(0, 2).map(function (k) { return P[k]; }).join(', ') + (x.sug.length > 2 ? ' +' + (x.sug.length - 2) : '') + (x.app ? ' <span class="cn-app">' + t('cnApp') + '</span>' : '') + '</td><td class="r">' + nf(x.gps) + ' m</td><td>' + CT[x.ct] + '</td><td>' + PH[x.ph] + '</td>' +
          '<td class="wrp fl">' + (x.ret ? '<span class="cn-fl ret">' + t('cnRetracted', { d: ddmm(x.ret) }) + '</span>' : '') + x.fl.slice(0, x.ret ? 1 : 2).map(function (f) { return '<span class="cn-fl' + (f === 3 ? ' red' : '') + '">' + FL[f] + '</span>'; }).join('') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  function renderCn() {
    var w = cnData(wrWeek), p = w.prev, K = t('cnK'), y = new Date().getFullYear(), I = t('cnIns');
    var h = '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + t('cnReport', { y: y, n: w.wn }) + ' <span class="wr-st">· ST01</span></b><span>' + t('cnWindow', { w: w.win.map(function (n) { return 'W' + n; }).join(' · '), n: w.list.filter(function (x) { return !x.ret; }).length * 9 + 6 }) + '</span></div>' +
      '<span class="cn-rev">' + t('cnRevised', { w: w.win[0], a: w.revA, b: w.revB }) + '</span><span class="cn-rev">' + t('cnRevDel', { w: w.win[1], a: nf(w.revDa), b: nf(w.revDb) }) + '</span>' +
      '<div class="m-dnav"><button type="button" data-wr-act="week" data-v="-1" aria-label="Previous week"' + (wrWeek <= -8 ? ' disabled' : '') + '>‹</button><button type="button" data-wr-act="week" data-v="1" aria-label="Next week"' + (wrWeek >= 0 ? ' disabled' : '') + '>›</button></div></div>' +
      '<div class="m-panel wr-up2"><div class="wr-drop"><span class="wr-di">' + WR_DOC + '</span><div><b>' + t('cnUploadHead') + ' <span class="m-cnt">' + t('cnUploadTag') + '</span></b><small>' + t('cnUploadNote') + '</small></div><button type="button" class="wr-upbtn" data-wr-act="noop">' + WR_UPI + t('wrUpload') + '</button></div></div>';
    var dd3 = function (a, b, f, upGood) { return wrDelta(a - b, (a >= b ? '+' : '−') + f(Math.abs(a - b)), upGood); };
    var dpmo4 = Math.round(w.trend.slice(-4).reduce(function (a, q) { return a + q.dpmo; }, 0) / 4);
    h += '<div class="m-panel wr-k" data-p="cnkpis">' +
      '<div><span>' + K[0] + '</span><b data-count="' + w.dnr + '">' + w.dnr + '</b>' + dd3(w.dnr, p.dnr, nf, false) + '<small>' + t('cnReportWeek') + '</small></div>' +
      '<div><span>' + K[1] + '</span><b data-count="' + w.dpmo + '">' + nf(w.dpmo) + '</b>' + dd3(w.dpmo, p.dpmo, nf, false) + '<small>' + t('cnOver4', { n: nf(dpmo4) }) + '</small></div>' +
      '<div><span>' + K[2] + '</span><b>' + eurc(w.cost) + '</b>' + dd3(w.cost, p.cost, eurc, false) + '<small>' + t('cnAvgCost', { n: eurc(w.cost / w.dnr) }) + '</small></div>' +
      '<div><span>' + K[3] + '</span><b data-count="' + w.del + '">' + nf(w.del) + '</b>' + dd3(w.del, p.del, nf, true) + '<small>' + t('cnReportWeek') + '</small></div>' +
      '<div><span>' + K[4] + '</span><b class="neg" data-count="' + w.k1 + '">' + w.k1 + '</b><small>' + t('cnK1Note', { p: pctf(100, 0), n: w.k1win }) + '</small></div>' +
      '<div><span>' + K[5] + '</span><b data-count="' + w.drvDnr + '">' + w.drvDnr + '</b><small>' + t('cnDrvNote', { a: w.drvDnr, b: 60 }) + '</small></div>' +
      '<div><span>' + K[6] + '</span><b data-count="' + w.ret + '">' + w.ret + '</b><button type="button" class="cn-link" data-wr-act="cnret">↗ ' + t('cnSeeList') + '</button></div>' +
      '<div><span>' + K[7] + '</span><b class="neg">' + w.lost + '</b><small>' + t('cnInWindow') + '</small></div></div>';
    var mz = w.zips[0].n;
    h += '<div class="m-grid2" style="grid-template-columns:1.35fr 1fr;align-items:stretch">' +
      '<div class="m-panel wr-chp" data-p="cntrend"><div class="m-ph"><h4>' + t('cnTrend') + '</h4><span class="m-cnt">' + t('cnTrendTag') + '</span></div>' +
      comboChart(680, 260, w.trend.map(function (q) { return q.n; }), w.trend.map(function (q) { return q.cost; }), w.trend.map(function (q) { return q.dpmo; }), [2, 3, 4]) +
      '<div class="wr-leg"><span style="--c:#2F6BFF">DPMO</span><span class="sq" style="--c:#B794F4">' + t('cnCost') + '</span><span class="dot" style="--c:#F5A623">' + t('cnRevisedL') + '</span></div></div>' +
      '<div class="m-panel" data-p="cntrend"><div class="m-ph"><h4>' + t('cnZip') + '</h4><span class="m-cnt">' + t('cnZipTag') + '</span></div>' +
      w.zips.map(function (z) { return '<button type="button" class="cn-zip' + (cnZip === z.z ? ' on' : '') + '" data-wr-act="zip" data-v="' + z.z + '"><b>' + z.z + '</b><span class="wr-bt"><i style="width:' + (z.n / mz * 100) + '%;background:#2F6BFF"></i></span><span class="wr-bv">' + z.n + ' <small>' + pctf(z.n / w.zipTot * 100, 0) + '</small></span></button>'; }).join('') + '</div></div>';
    var cats = w.kw.reduce(function (acc, ks) { return acc.map(function (a, k) { return a + ks[k]; }); }, [0, 0, 0, 0, 0, 0]);
    var ins = [
      I[0].replace('{dir}', t(w.dpmo < p.dpmo ? 'wrDown' : 'wrUp')).replace('{pw}', w.wn - 1).replace('{a}', nf(p.dpmo)).replace('{b}', nf(w.dpmo)).replace('{c}', eurc(p.cost)).replace('{d}', eurc(w.cost)).replace('{e}', p.dnr).replace('{f}', w.dnr),
      I[1].replace('{w}', w.win[0]).replace('{a}', w.revA).replace('{b}', w.revB).replace('{r}', w.revA - w.revB),
      I[2].replace('{w}', w.win[0] + '–' + w.wn).replace('{cats}', cats.map(function (c, k) { return 'K' + (k + 1) + ' ' + c + ' (' + eurc(c * w.kcost[k]) + ')'; }).join(', ')).replace('{n}', w.winTot).replace('{c}', eurc(cats.reduce(function (a, c, k) { return a + c * w.kcost[k]; }, 0))),
      I[3].replace('{p}', pctf(100, 0)),
      I[4].replace('{p}', pctf(w.noContact, 0)).replace('{q}', pctf(w.elsewhere, 0)),
      I[5].replace('{z}', w.zips.slice(0, 3).map(function (z) { return z.z + ' (' + z.n + ')'; }).join(', ')).replace('{p}', pctf((w.zips[0].n + w.zips[1].n + w.zips[2].n) / w.zipTot * 100, 0)),
      I[6].replace('{p}', pctf(w.top10, 0))
    ];
    h += '<div class="m-panel" data-p="cnins"><div class="m-ph"><h4>' + t('wrInsights') + '</h4><span class="m-cnt">' + t('wrGenerated') + '</span></div><ul class="wr-ins">' + ins.map(function (x, i) { return '<li style="--i:' + i + '">' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    h += '<div class="m-grid2" style="grid-template-columns:1fr 1fr;align-items:stretch"><div class="m-panel wr-chp" data-p="cncat" data-wr="cncats">' + cnCatsInner(w) + '</div>' +
      '<div class="m-panel wr-chp" data-p="cncat"><div class="m-ph"><h4>' + t('cnPlaceT') + '</h4><span class="m-cnt">' + t('cnWindowB') + '</span></div>' + groupBars(600, 240, w.win.map(function (n) { return 'W' + n; }), w.pw, CN_PC, function (v) { return nf(v); }) +
      '<div class="wr-leg wrap">' + t('cnPlaces').map(function (pl, i) { return '<span style="--c:' + CN_PC[i] + '">' + pl + '</span>'; }).join('') + '</div></div></div>';
    h += '<div class="m-panel" data-p="cndrivers" data-wr="cndrv">' + cnDrvInner(w) + '</div><div class="m-panel" data-p="cndnr" data-wr="cndnr">' + cnDnrInner(w) + '</div>';
    return h;
  }
  function renderWr() {
    var html = topBar(t('pageWr')) + wrSubnav() + '<div class="m-body">', wi = weekInfo(wrWeek - 1);
    if (wrTab === 'cn') {
      html += renderCn();
    } else if (wrTab === 'sc') {
      var rows = wrScore(wrWeek);
      html += wrWeekPanel() + '<div class="m-grid2" style="grid-template-columns:1.6fr 1fr;align-items:stretch">' +
        '<div class="m-panel cp-col" data-p="upload" data-wr="upload">' + wrUploadInner(rows.length) + '</div>' +
        '<div class="m-panel" data-p="send" data-wr="send">' + wrSendInner(rows) + '</div></div>' +
        '<div class="m-panel" data-p="results"><div class="m-ph"><h4>' + t('wrResults') + '</h4><span class="m-cnt">' + t('wrSorted') + '</span></div><p class="wr-note">' + t('wrUploadedBy') + '</p>' +
        '<table class="m-t dense"><thead><tr><th>' + t('daAssoc') + '</th><th>' + t('wrStatus') + '</th><th class="r">' + t('wrTotal') + '</th><th class="r">' + t('wrDelivered') + '</th><th class="r">DCR</th><th class="r">DSC DPMO</th><th class="r">LoR DPMO</th><th class="r">POD</th><th class="r">CC</th><th class="r">CE</th><th class="r">CDF DPMO %</th></tr></thead><tbody>' +
        (wrUp === 'done' ? rows.slice(0, 12).map(function (x, i) {
          var g = function (v, ok) { return '<td class="r ' + (ok ? 'gr' : 'bad') + '">' + v + '</td>'; };
          return '<tr class="row-in" style="--i:' + i + '"><td>' + who(x) + '</td><td>' + statusPill(x.status) + '</td><td class="r"><b class="wr-tot">' + nf(x.total, 2) + '%</b></td><td class="r"><b>' + x.del + '</b></td>' +
            g(nf(x.dcr, x.dcr === 100 ? 0 : 2) + '%', x.dcr >= 99.5) + g(nf(x.dsc), !x.dsc) + g(nf(x.lor), !x.lor) + g(nf(x.pod, 0) + '%', x.pod >= 98) + g(nf(x.cc, 0) + '%', x.cc >= 95) + g(x.ce, !x.ce) +
            '<td class="r">' + (x.cdf < 80 ? '<span class="dn r">' + nf(x.cdf, 0) + '%</span>' : '<span class="gr">' + nf(x.cdf, 0) + '%</span>') + '</td></tr>';
        }).join('') : '<tr><td colspan="11" class="wr-wait">' + (wrUp === 'reading' ? t('wrReading') : t('wrMatching', { n: rows.length })) + '</td></tr>') + '</tbody></table></div>';
    } else {
      var w = wrIadcData(wrWeek), p = w.prev, K = t('wrK'), days = [0, 1, 2, 3, 4].map(function (d) { var x = new Date(); x.setDate(x.getDate() - x.getDay() + (wrWeek - 1) * 7 + d + 1); return pad(x.getDate()) + '.' + pad(x.getMonth() + 1); });
      html += wrWeekPanel('<span class="m-pill g wr-cpl">' + t('wrComplete') + '</span><span class="wr-imp">' + t('wrLastImport', { d: ddmm(addD(TODAY, -1)) }) + '</span>') +
        '<div class="m-panel wr-up2"><div class="wr-drop"><span class="wr-di">' + WR_DOC + '</span><div><b>' + t('wrUploadTitle') + ' <span class="m-cnt">' + t('wrIadcTag') + '</span></b><small>' + t('wrIadcNote') + '</small></div><button type="button" class="wr-upbtn" data-wr-act="noop">' + WR_UPI + t('wrUpload') + '</button></div></div>' +
        '<div class="m-panel wr-k" data-p="kpis">' +
        '<div><span>' + K[0] + '</span><b class="neg" data-count="' + Math.round(w.dwc * 100) + '" data-f="pct">' + pctf(w.dwc, 2) + '</b>' + wrDelta(w.dwc - p.dwc, pp(w.dwc - p.dwc), true) + '<small>' + t('wrFinal') + '</small></div>' +
        '<div><span>' + K[1] + '</span><b class="amb" data-count="' + Math.round(w.iadc * 100) + '" data-f="pct">' + pctf(w.iadc, 2) + '</b>' + wrDelta(w.iadc - p.iadc, pp(w.iadc - p.iadc), true) + '<small>' + t('wrFinal') + '</small></div>' +
        '<div><span>' + K[2] + '</span><b data-count="' + w.miss + '">' + nf(w.miss) + '</b>' + wrDelta(w.miss - p.miss, (w.miss >= p.miss ? '+' : '−') + nf(Math.abs(w.miss - p.miss)), false) + '<small>' + t('wrLocShare', { p: pctf(w.A / w.miss * 100, 1) }) + '</small></div>' +
        '<div><span>' + K[3] + '</span><b data-count="' + w.nc + '">' + nf(w.nc) + '</b>' + wrDelta(w.nc - p.nc, (w.nc >= p.nc ? '+' : '−') + nf(Math.abs(w.nc - p.nc)), false) + '<small>' + t('wrHhShare', { p: pctf(77, 1) }) + '</small></div>' +
        '<div><span>' + K[4] + '</span><b class="neg" data-count="' + w.fs + '">' + w.fs + '</b>' + wrDelta(w.fs - p.fs, (w.fs >= p.fs ? '+' : '−') + Math.abs(w.fs - p.fs), false) + '<small>' + t('wrDrvInv', { n: w.fsDrv }) + '</small></div>' +
        '<div><span>' + K[5] + '</span><b class="neg" data-count="' + w.hh + '">' + w.hh + '</b>' + wrDelta(w.hh - p.hh, (w.hh >= p.hh ? '+' : '−') + Math.abs(w.hh - p.hh), false) + '<small>' + t('wrDrvInv', { n: w.hhDrv }) + '</small></div>' +
        '<div><span>' + K[6] + '</span><b class="neg" data-count="' + (w.critD + w.critI) + '">' + (w.critD + w.critI) + '</b><small>' + t('wrCritSplit', { a: w.critD, b: w.critI }) + '</small></div>' +
        '<div><span>' + K[7] + '</span><b data-count="' + w.est + '">' + nf(w.est) + '</b><small>' + t('wrDwcDays', { n: 5 }) + '</small></div></div>' +
        '<div class="m-grid2" style="grid-template-columns:1fr 1fr">' +
        '<div class="m-panel wr-chp" data-p="trend"><div class="m-ph"><h4>' + t('wrWeekly') + '</h4><span class="m-cnt">DWC · IADC</span></div><p class="wr-note">' + t('wrWeeklyNote') + '</p>' +
        chart(590, 250, w.weeks.map(function (q) { return q.n; }), [{ vals: w.weeks.map(function (q) { return q.dwc; }), c: '#2F6BFF' }, { vals: w.weeks.map(function (q) { return q.iadc; }), c: '#7C3AED' }], 50, 100, [[95, '#2F6BFF', 'DWC 95%'], [65, '#7C3AED', 'IADC 65%']]) +
        '<div class="wr-leg"><span style="--c:#2F6BFF">DWC</span><span style="--c:#7C3AED">IADC</span></div></div>' +
        '<div class="m-panel wr-chp" data-p="trend"><div class="m-ph"><h4>' + t('wrDaily') + '</h4><span class="m-cnt">' + new Date().getFullYear() + '-' + wi.n + '</span></div><p class="wr-note">' + t('wrDailyNote') + '</p>' +
        chart(590, 250, days, [{ vals: w.days.map(function (q) { return q.dwc; }), c: '#2F6BFF' }, { vals: w.days.map(function (q) { return q.iadc; }), c: '#7C3AED' }], 45, 100, [[95, '#2F6BFF', 'DWC 95%'], [65, '#7C3AED', 'IADC 65%']], w.sys) +
        '<div class="wr-leg"><span style="--c:#2F6BFF">DWC</span><span style="--c:#7C3AED">IADC</span><span class="sys">' + t('wrSystemic') + '</span></div></div></div>';
      var I = t('wrIns'), pw = weekInfo(wrWeek - 2).n;
      var ins = [
        I[0].replace('{dir}', t(w.dwc < p.dwc ? 'wrDown' : 'wrUp')).replace('{pw}', pw).replace('{a}', pctf(p.dwc, 2)).replace('{b}', pctf(w.dwc, 2)).replace('{d}', pp(w.dwc - p.dwc)),
        I[1].replace('{dir}', t(w.iadc < p.iadc ? 'wrDown' : 'wrUp')).replace('{pw}', pw).replace('{a}', pctf(p.iadc, 2)).replace('{b}', pctf(w.iadc, 2)).replace('{d}', pp(w.iadc - p.iadc)).replace('{t}', pctf(65, 2)).replace('{k}', w.below),
        I[2].replace('{a}', nf(p.miss)).replace('{b}', nf(w.miss)).replace('{c}', p.fs).replace('{e}', w.fs).replace('{f}', p.hh).replace('{g}', w.hh),
        I[3].replace('{p}', pctf(w.A / w.miss * 100, 0)),
        I[4].replace('{p}', pctf(77, 0)),
        I[5].replace('{day}', days[w.sys[0]]).replace('{n}', 420 + w.sys[0] * 37).replace('{k}', 12 + w.sys[0] * 3),
        I[6].replace('{p}', pctf(w.top10, 0))
      ];
      html += '<div class="m-panel" data-p="insights"><div class="m-ph"><h4>' + t('wrInsights') + '</h4><span class="m-cnt">' + t('wrGenerated') + '</span></div><p class="wr-note">' + t('wrInsNote') + '</p><ul class="wr-ins">' +
        ins.map(function (x, i) { return '<li style="--i:' + i + '">' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      var heat = WR_ROWS.map(function (row, ri) {
        var tot = Math.round((row[2] === 'A' ? w.A : row[2] === 'C' ? w.C : row[2] === 'D' ? w.D : row[2] === 'E' ? w.E : w.nc) * row[3]), rr = rng(900 + ri * 13 + wrWeek), wts = WR_PLACES.map(function (pl, ci) { return ci === 0 && ri !== 1 ? 3 + rr() * 4 : rr() < .3 ? 0 : rr() * (ci < 4 ? 1.6 : .5); });
        if (ri === 1) wts[0] = 0;
        var sw = wts.reduce(function (a, b) { return a + b; }, 0) || 1;
        return { b: row[0], n: row[1], tot: tot, cells: wts.map(function (x) { return Math.round(tot * x / sw); }) };
      });
      var mx = Math.max.apply(null, heat.map(function (h) { return Math.max.apply(null, h.cells); }));
      html += '<div class="m-grid2" style="grid-template-columns:.8fr 1.2fr;align-items:stretch"><div class="m-panel" data-p="heat" data-wr="cats">' + wrBreakInner(w) + '</div>' +
        '<div class="m-panel" data-p="heat"><div class="m-ph"><h4>' + t('wrHeat') + '</h4><span class="m-cnt">' + t('wrHeatTag') + '</span></div><p class="wr-note">' + t('wrHeatNote') + '</p><table class="wr-hm"><thead><tr><th></th>' +
        WR_PLACES.map(function (pl) { return '<th>' + pl.replace(' ', '<br>') + '</th>'; }).join('') + '<th>' + t('wrTotalCol') + '</th></tr></thead><tbody>' +
        heat.map(function (h, ri) { return '<tr><th><small>' + h.b + '</small>' + h.n + '</th>' + h.cells.map(function (v, ci) { var a = v ? .12 + .8 * Math.sqrt(v / mx) : 0; return '<td style="--a:' + a.toFixed(2) + ';--i:' + (ri + ci) + '"' + (a > .55 ? ' class="dk2"' : '') + '>' + (v ? nf(v) : '') + '</td>'; }).join('') + '<td class="tot">' + nf(h.tot) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>' +
        '<div class="m-panel" data-p="drivers" data-wr="drivers">' + wrDriversInner(w) + '</div>';
    }
    mock.innerHTML = html + '</div>';
    layoutMock();
  }
  function wrSet(name, html) { var el = mock.querySelector('[data-wr="' + name + '"]'); if (el) el.innerHTML = html; }
  function wrAction(act, v) {
    if (act === 'tab') { wrTab = v; renderMock(); focusStep(WR_FIRST[v], true); return; }
    if (act === 'week') { wrWeek = Math.max(-8, Math.min(0, wrWeek + Number(v))); wrPrev = null; renderMock(); focusStep(active, true, true); return; }
    if (act === 'upload') {
      var n = ROSTER.length; wrUp = 'reading'; wrPrev = null; renderMock(); focusStep('upload', true, true);
      setTimeout(function () { if (page !== 'wr' || wrTab !== 'sc') { wrUp = 'done'; return; } wrUp = 'matching'; wrSet('upload', wrUploadInner(n)); }, 900);
      setTimeout(function () { if (page !== 'wr' || wrTab !== 'sc') { wrUp = 'done'; return; } wrUp = 'ok'; wrSet('upload', wrUploadInner(n)); }, 1800);
      setTimeout(function () { wrUp = 'done'; if (page === 'wr' && wrTab === 'sc') { renderMock(); focusStep('results', true); } }, 2500);
      return;
    }
    if (act === 'img' || act === 'pdf') { wrPrev = act; wrSet('send', wrSendInner(wrScore(wrWeek))); focusStep('send', true, true); return; }
    if (act === 'cat') { wrCat = wrCat === Number(v) ? -1 : Number(v); wrSet('cats', wrBreakInner(wrIadcData(wrWeek))); focusStep('heat', true, true); return; }
    if (act === 'zip') { cnZip = cnZip === v ? null : v; renderMock(); focusStep('cndnr', true); return; }
    if (act === 'cnret') { cnMode = 'ret'; renderMock(); focusStep('cndnr', true); return; }
    if (act === 'cnmode') { cnMode = v; wrSet('cndnr', cnDnrInner(cnData(wrWeek))); focusStep('cndnr', true, true); return; }
    if (act === 'cnzipx') { cnZip = null; wrSet('cndnr', cnDnrInner(cnData(wrWeek))); focusStep('cndnr', true, true); return; }
    if (act === 'cnunit') { cnUnit = v; wrSet('cncats', cnCatsInner(cnData(wrWeek))); focusStep('cncat', true, true); return; }
    if (act === 'cntier') { cnTier = v; wrSet('cndrv', cnDrvInner(cnData(wrWeek))); focusStep('cndrivers', true, true); return; }
    if (act === 'tier' || act === 'letter') { if (act === 'tier') wrTier = v; else wrLetter = v; wrSet('drivers', wrDriversInner(wrIadcData(wrWeek))); focusStep('drivers', true, true); }
  }

  // ------------------------------------------------------------------ Equipment: animated story (print → stick → scan → driver → sign → Board → found)
  var eq = { s: 0, item: 0, loop: 0, auto: !reduce, inView: false, timer: null, DUR: [4200, 3800, 4800, 4000, 5400, 5800, 6200] };
  var EQ_ITEMS = [
    { key: 'jacket', code: 'LANU-U-000012', tx: 104, ty: 92 },
    { key: 'shoes', code: 'LANU-I-000009', tx: 46, ty: 180 },
    { key: 'phone', code: 'LANU-T-000001', tx: 76, ty: 150 }
  ];
  var eqStage = document.getElementById('eq-stage'), eqWrap = document.getElementById('eq-wrap'), eqSteps = document.getElementById('eq-steps');
  function qrSvg(seed) {
    var r = rng(seed), cells = '';
    function finder(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < 21; y++) for (var x = 0; x < 21; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      if (r() < .48) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg class="qr" viewBox="-1 -1 23 23" shape-rendering="crispEdges"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><g fill="#0B1B34">' + finder(0, 0) + finder(14, 0) + finder(0, 14) + cells + '</g></svg>';
  }
  var EQ_ART = {
    jacket: '<svg viewBox="0 0 280 340"><path d="M92 40l28-12q20 16 40 0l28 12 62 40 12 120-34 6-6-86v200H58V120l-6 86-34-6 12-120z" fill="#163057"/><path d="M58 120h164v8H58z" fill="#0F2443"/>' +
      '<path d="M120 28q20 34 40 0l-8-4q-12 14-24 0z" fill="#0C1B35"/><path d="M140 46v274" stroke="#0C1B35" stroke-width="3"/><path d="M58 236h164v12H58zM58 262h164v12H58z" fill="#D7E1F0" opacity=".85"/>' +
      '<path d="M24 170l32 4-2 12-32-4zM256 170l-32 4 2 12 32-4z" fill="#D7E1F0" opacity=".85"/><rect x="70" y="76" width="44" height="12" rx="3" fill="#2F6BFF"/><text x="92" y="86" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="sans-serif">LANU</text></svg>',
    shoes: '<svg viewBox="0 0 280 340"><defs><linearGradient id="shU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A515C"/><stop offset="1" stop-color="#262A31"/></linearGradient><linearGradient id="shT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#444B56"/><stop offset="1" stop-color="#1C1F25"/></linearGradient><linearGradient id="shM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9EDF2"/><stop offset="1" stop-color="#B9C1CC"/></linearGradient></defs><ellipse cx="142" cy="286" rx="130" ry="9" fill="#000" opacity=".4"/><path d="M24 246C16 222 18 190 30 162c3-4 5-6 8-6 18-8 36-6 52 6l8 2c4-14 10-26 20-34 8-8 22-8 26 2l48 52c22 8 48 16 64 30 10 10 10 24 6 32z" fill="url(#shU)"/><path d="M24 246C16 222 18 196 26 176c14 4 28 20 34 44l2 26z" fill="#2B3038"/><path d="M38 156c18-8 36-6 52 6l8 2-2 10c-10-2-22-10-38-12-10 0-18 4-26 10l-2-10c3-4 5-6 8-6z" fill="#626A76"/><path d="M36 166c8-5 15-7 22-7 15 1 26 8 38 11" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.3" stroke-dasharray="3 3"/><path d="M98 164c4-14 10-26 20-34 8-8 22-8 26 2l-8 10-32 26z" fill="#555D69"/><path d="M118 146l18-14 62 48-10 12z" fill="#1E2228"/><g stroke="#D3D9E2" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M134.1 135.4L125.9 146.6M149.1 146.4L140.9 157.6M164.1 157.4L155.9 168.6M179.1 168.4L170.9 179.6M194.1 179.4L185.9 190.6"/></g><g fill="#8D96A4"><circle cx="134.1" cy="135.4" r="1.8"/><circle cx="125.9" cy="146.6" r="1.8"/><circle cx="149.1" cy="146.4" r="1.8"/><circle cx="140.9" cy="157.6" r="1.8"/><circle cx="164.1" cy="157.4" r="1.8"/><circle cx="155.9" cy="168.6" r="1.8"/><circle cx="179.1" cy="168.4" r="1.8"/><circle cx="170.9" cy="179.6" r="1.8"/><circle cx="194.1" cy="179.4" r="1.8"/><circle cx="185.9" cy="190.6" r="1.8"/></g><path d="M262 246c4-8 4-22-6-32-12-12-30-18-44-22-8 14-12 34-8 54z" fill="url(#shT)"/><path d="M216 200c16 4 30 12 38 24" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/><path d="M204 246c-4-20 0-40 8-54" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.3" stroke-dasharray="3 3"/><path d="M21 234h243v12H23z" fill="#1A1D22"/><path d="M21 233h242" stroke="#F5A623" stroke-width="2.5"/><rect x="29" y="146" width="9" height="20" rx="3" fill="#F5A623" transform="rotate(-12 33 156)"/><path d="M18 246h244c6-1 8 2 7 6-1 4-3 6-5 6H18c-4-3-4-9 0-12z" fill="url(#shM)"/><path d="M18 258h248c3 5 0 12-8 13H28c-10-1-13-8-10-13z" fill="#15171B"/><path d="M34 262v8M46 262v8M58 262v8M70 262v8M82 262v8M94 262v8M106 262v8M118 262v8M130 262v8M142 262v8M154 262v8M166 262v8M178 262v8M190 262v8M202 262v8M214 262v8M226 262v8M238 262v8M250 262v8" stroke="#2E3239" stroke-width="4" stroke-linecap="round"/><path d="M22 271h236" stroke="#0B0C0E" stroke-width="2"/></svg>',
    phone: '<svg viewBox="0 0 280 340"><rect x="70" y="20" width="140" height="290" rx="22" fill="#1B2029"/><rect x="78" y="28" width="124" height="274" rx="16" fill="#252B35"/>' +
      '<rect x="92" y="44" width="40" height="40" rx="12" fill="#14181F"/><circle cx="104" cy="56" r="7" fill="#0B0D11" stroke="#3A4250" stroke-width="2"/><circle cx="120" cy="72" r="5" fill="#0B0D11" stroke="#3A4250" stroke-width="2"/>' +
      '<rect x="62" y="96" width="8" height="40" rx="3" fill="#F5A623"/><text x="140" y="280" text-anchor="middle" font-size="11" font-weight="800" fill="#4B5565" font-family="sans-serif">LANU</text></svg>'
  };
  var EQ_ICO = {
    jacket: '<svg class="ic" width="20" height="20" viewBox="0 0 24 24"><path d="M8 3l4 3 4-3 5 3-2 6-2-1v10H7V11l-2 1-2-6z"/></svg>',
    shoes: '<svg class="ic" width="20" height="20" viewBox="0 0 24 24"><path d="M3 17v-6l5-1 3-4h4l1 5 5 2v4z"/><path d="M3 17h18"/></svg>',
    phone: '<svg class="ic" width="20" height="20" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>'
  };
  var SIG = 'M14 64c14-34 30 22 44-6s22-36 30-10 8 40 26 8 30-34 40-6 12 22 30 4 22-14 34-4';
  function eqLabel(it, name) {
    return '<div class="lbl"><span class="lbl-qr">' + qrSvg(hashStr(it.code)) + '</span><span class="lbl-t"><b>LANU</b><code>' + it.code + '</code><small>' + esc(name) + '</small></span></div>';
  }
  function eqBuild() {
    if (!eqStage) return;
    var it = EQ_ITEMS[eq.item], name = t('eqNames')[eq.item], drv = CPR[40 + (eq.loop % 20)].name, other = CPR[61].name;
    var drivers = [CPR[63 + (eq.loop % 5)].name, drv, CPR[70].name, CPR[71].name];
    var doc = 'EQ-' + ('00000' + (41 + eq.loop)).slice(-6), today = ddmm(TODAY), tabs = t('eqTabs');
    var lbl = eqLabel(it, name), ico = '<span class="ap-ico">' + EQ_ICO[it.key] + '</span>';
    eqStage.style.setProperty('--tx', it.tx + 'px'); eqStage.style.setProperty('--ty', it.ty + 'px');
    function head(title, ti) {
      return '<div class="ap-h"><span>‹</span><div><small>LANU</small><b>' + title + '</b></div><i></i></div>' + (ti === undefined ? '' :
        '<div class="ap-tabs">' + tabs.map(function (x, k) { return '<span' + (k === ti ? ' class="on"' : '') + '>' + x + (k === 0 ? ' <em>1</em>' : '') + '</span>'; }).join('') + '</div>');
    }
    var itemCard = '<div class="ap-card">' + ico + '<div><b>' + esc(name) + '</b><small>' + it.code + '</small></div></div>';
    var rows = [0, 1, 2].map(function (k) {
      var x = EQ_ITEMS[k], cur = k === eq.item, mine = cur ? drv : (k === (eq.item + 1) % 3 ? other : '');
      return '<div class="bd-row' + (cur ? ' cur' : '') + '"><span class="ap-ico sm">' + EQ_ICO[x.key] + '</span><span class="bd-n"><b>' + esc(t('eqNames')[k]) + '</b><small>' + x.code + '</small></span>' +
        (cur ? '<span class="bd-h"><span class="old"><span class="m-pill g">' + t('eqInStock') + '</span></span><span class="new">' + avatar(drv, 20) + '<b>' + esc(drv) + '</b><span class="m-pill b">' + t('eqIssued') + '</span></span></span>'
          : '<span class="bd-h">' + (mine ? avatar(mine, 20) + '<b>' + esc(mine) + '</b><span class="m-pill b">' + t('eqIssued') + '</span>' : '<span class="m-pill g">' + t('eqInStock') + '</span>') + '</span>') + '</div>';
    }).join('');
    eqStage.innerHTML =
      '<div class="van"><span class="van-chip">' + t('eqFoundVan') + '</span></div>' +
      '<div class="pr"><svg class="pr-back" viewBox="0 0 230 230"><rect x="10" y="0" width="206" height="226" rx="30" fill="#1C2027"/><rect x="24" y="8" width="178" height="40" rx="18" fill="#272C35"/><rect x="208" y="96" width="20" height="44" rx="7" fill="#F5A623" transform="rotate(-8 218 118)"/></svg>' +
      '<div class="lb-fly">' + lbl + '</div>' +
      '<svg class="pr-front" viewBox="0 0 230 230"><path d="M10 58h206v138a30 30 0 0 1-30 30H40a30 30 0 0 1-30-30z" fill="#262B34"/><rect x="34" y="52" width="158" height="9" rx="4.5" fill="#0B0D11"/>' +
      '<rect x="44" y="128" width="138" height="66" rx="10" fill="#14171C"/><text x="113" y="148" text-anchor="middle" font-size="12" font-weight="800" letter-spacing="2" fill="#E9EFF9" font-family="sans-serif">LANU</text>' +
      '<circle cx="72" cy="172" r="8" fill="none" stroke="#C8D0DC" stroke-width="2"/><rect class="pr-led" x="100" y="169" width="26" height="6" rx="3"/><rect x="146" y="164" width="16" height="16" rx="3" fill="none" stroke="#C8D0DC" stroke-width="2"/></svg></div>' +
      '<div class="it" style="--tx:' + it.tx + 'px;--ty:' + it.ty + 'px">' + EQ_ART[it.key] + '<div class="lb-on">' + lbl + '</div><span class="pop"></span></div>' +
      '<div class="ow">' + avatar(drv, 30) + '<span><small>' + t('eqOwner') + '</small><b>' + esc(drv) + '</b></span></div>' +
      '<div class="bd"><div class="bd-bar"><i></i><i></i><i></i><span>board.lanu.app/equipment</span></div><div class="bd-in">' +
      '<div class="bd-t"><b>' + t('eqEquipment') + '</b><span class="m-livepill"><i></i>' + t('mLive') + '</span></div>' +
      '<div class="bd-k"><div><small>' + t('eqInStock') + '</small><b><s>12</s><span>11</span></b></div><div><small>' + t('eqWith') + '</small><b><s>4</s><span>5</span></b></div><div><small>' + t('eqToCheck') + '</small><b>0</b></div></div>' +
      '<div class="bd-doc"><span class="bd-di"><svg class="ic" width="18" height="18" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg></span><div><b>' + doc + ' · ' + t('eqHandover') + '</b><small>' + t('eqSigned', { name: esc(drv) }) + ' · ' + t('eqJustNow') + '</small></div>' +
      '<svg class="bd-sig" viewBox="0 0 240 90"><path d="' + SIG + '"/></svg></div>' +
      '<div class="bd-h4">' + t('eqInventory') + '</div>' + rows + '</div></div>' +
      '<div class="ph"><div class="ph-scr">' +
      '<div class="ps ps-scan">' + head(t('eqHandover'), 0) + '<div class="vf"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><span class="vf-qr">' + qrSvg(hashStr(it.code)) + '</span><span class="vf-line"></span><small>' + t('eqScanHint') + '</small></div>' +
      '<div class="ap-found"><span class="ap-ok">✓ ' + t('eqDetected') + '</span>' + itemCard + '<span class="m-pill g">' + t('eqInStock') + '</span></div><div class="ap-btn">' + t('eqContinue') + ' ›</div></div>' +
      '<div class="ps ps-driver">' + head(t('eqHandover'), 1) + '<div class="ap-search">' + t('eqSearchDriver') + '</div>' +
      drivers.map(function (n, k) { return '<div class="ap-drv' + (k === 1 ? ' pick' : '') + '">' + avatar(n, 30) + '<b>' + esc(n) + '</b><span class="ap-chk">✓</span>' + (k === 1 ? '<span class="tap"></span>' : '') + '</div>'; }).join('') +
      '<div class="ap-btn">' + t('eqContinue') + ' ›</div></div>' +
      '<div class="ps ps-sign">' + head(t('eqHandover'), 2) + '<div class="ap-card">' + avatar(drv, 30) + '<div><small>' + t('eqDriver') + '</small><b>' + esc(drv) + '</b></div></div>' + itemCard +
      '<p class="ap-txt">' + t('eqConfirm') + '</p><small class="ap-lb">' + t('eqSignature') + '</small><div class="ap-sig"><svg viewBox="0 0 240 90"><path d="' + SIG + '"/></svg></div>' +
      '<div class="ap-btn press">✓ ' + t('eqComplete') + '</div><div class="ap-done"><span>✓</span><b>' + t('eqDone') + '</b><small>' + doc + '</small></div></div>' +
      '<div class="ps ps-found">' + head(t('eqItemTitle')) + '<div class="vf mini"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><span class="vf-qr">' + qrSvg(hashStr(it.code)) + '</span><span class="vf-line"></span></div>' +
      '<div class="ap-res"><div class="ap-big">' + ico + '<b>' + it.code + '</b><small>' + esc(name) + '</small><span class="m-pill b">' + t('eqIssued') + '</span></div>' +
      '<div class="ap-card"><small class="ap-bl">' + t('eqBelongs') + '</small>' + avatar(drv, 34) + '<div><b>' + esc(drv) + '</b><small>' + t('eqIssuedOn', { d: today, doc: doc }) + '</small></div></div>' +
      '<div class="ap-acts"><span class="ap-btn sm">' + t('eqReturn') + '</span><span class="ap-btn sm red">' + t('eqLost') + '</span></div></div></div>' +
      '</div></div>';
    document.getElementById('eq-picks').innerHTML = t('eqPicks').map(function (p, k) {
      return '<button type="button" data-eq-item="' + k + '" aria-pressed="' + (k === eq.item) + '">' + EQ_ICO[EQ_ITEMS[k].key] + p + '</button>';
    }).join('');
  }
  function eqRenderSteps() {
    var st = t('eqSteps');
    eqSteps.innerHTML = st.map(function (x, i) {
      return '<li class="step' + (i === eq.s ? ' on' + (eq.auto ? ' auto' : '') : '') + '"><button type="button" data-eq-step="' + i + '" aria-current="' + (i === eq.s) + '">' +
        '<span class="n">' + (i + 1) + '</span><span><span class="t">' + esc(x[1]) + '</span><span class="d">' + esc(x[2]) + '</span></span><span class="prog" style="--dur:' + eq.DUR[i] + 'ms"></span></button></li>';
    }).join('');
    document.getElementById('eq-now').innerHTML = '<b>' + esc(st[eq.s][1]) + '</b><p>' + esc(st[eq.s][2]) + '</p>';
  }
  function eqGo(i, keep) {
    if (!eqStage) return;
    eq.s = i;
    eqStage.className = 'eq-stage';
    void eqStage.offsetWidth;
    eqStage.className = 'eq-stage s' + (i + 1) + ' it-' + EQ_ITEMS[eq.item].key;
    eqRenderSteps();
    if (!keep && window.innerWidth <= 980) { var b = eqSteps.querySelector('.on button'); if (b) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
    eqSchedule();
  }
  function eqSchedule() {
    clearTimeout(eq.timer);
    if (!eq.auto || !eq.inView) return;
    eq.timer = setTimeout(function () {
      if (eq.s === 6) { eq.loop++; eq.item = (eq.item + 1) % 3; eqBuild(); eqGo(0, true); }
      else eqGo(eq.s + 1, true);
    }, eq.DUR[eq.s]);
  }
  if (eqStage) {
    eqSteps.addEventListener('click', function (e) {
      var b = e.target.closest('[data-eq-step]'); if (!b) return;
      eq.auto = false; clearTimeout(eq.timer); eqGo(Number(b.dataset.eqStep));
    });
    document.getElementById('eq-picks').addEventListener('click', function (e) {
      var b = e.target.closest('[data-eq-item]'); if (!b) return;
      eq.item = Number(b.dataset.eqItem); eqBuild(); eqGo(0, true);
    });
    var eqScale = function () { eqStage.style.transform = 'scale(' + (eqWrap.clientWidth / 760) + ')'; };
    if ('ResizeObserver' in window) new ResizeObserver(eqScale).observe(eqWrap); else window.addEventListener('resize', eqScale);
    eqScale();
    new IntersectionObserver(function (en) {
      var was = eq.inView; eq.inView = en[0].isIntersecting;
      if (eq.inView && !was) eqGo(eq.s, true); else if (!eq.inView) clearTimeout(eq.timer);
    }, { threshold: .3 }).observe(document.getElementById('equipment'));
  }

  // ------------------------------------------------------------------ page menu with a futuristic switch transition
  var tabs = document.querySelectorAll('[data-page]'), ind = document.querySelector('.pages-ind'), switching = false, urlTimer;
  function moveInd() {
    var b = document.querySelector('[data-page][aria-selected="true"]');
    if (b && ind) { ind.style.left = b.offsetLeft + 'px'; ind.style.width = b.offsetWidth + 'px'; ind.style.top = b.offsetTop + 'px'; ind.style.height = b.offsetHeight + 'px'; }
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
  function pageSteps() {
    var all = t(PAGES[page].steps);
    return page === 'wr' ? all.filter(function (x) { return WR_TAB[x[0]] === wrTab; }) : all;
  }
  var stepsEl = document.getElementById('steps'), nowEl = document.getElementById('step-now');
  var PAGES = {
    ops: { name: 'pageOps', steps: 'steps', first: 'overview', url: 'board.lanu.app/operations' },
    da: { name: 'pageDa', steps: 'stepsDa', first: 'kpis', url: 'board.lanu.app/associates' },
    cp: { name: 'pageCp', steps: 'stepsCp', first: 'kpis', url: 'board.lanu.app/phones' },
    hs: { name: 'pageHs', steps: 'stepsHs', first: 'kpis', url: 'board.lanu.app/housing' },
    wr: { name: 'pageWr', steps: 'stepsWr', first: 'upload', url: 'board.lanu.app/reports' }
  };
  var ORDER = ['ops', 'da', 'cp', 'hs', 'wr'];
  var page = 'ops';
  var active = 'overview', auto = !reduce, timer = null, inView = false, DUR = 7000;
  function renderSteps() {
    stepsEl.innerHTML = pageSteps().map(function (s, i) {
      return '<li style="--i:' + i + '" class="step' + (s[0] === active ? ' on' + (auto ? ' auto' : '') : '') + '"><button type="button" data-step="' + s[0] + '" aria-current="' + (s[0] === active) + '">' +
        '<span class="n">' + (i + 1) + '</span><span><span class="t">' + esc(s[1]) + '</span><span class="d">' + esc(s[2]) + '</span></span><span class="prog" style="--dur:' + DUR + 'ms"></span></button></li>';
    }).join('');
    var cur = pageSteps().filter(function (s) { return s[0] === active; })[0];
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
    if (page === 'hs' && HS_TAB[id] && hsTab !== HS_TAB[id]) { hsTab = HS_TAB[id]; renderMock(); }
    if (page === 'wr' && WR_TAB[id] && wrTab !== WR_TAB[id]) { wrTab = WR_TAB[id]; renderMock(); }
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
      var ids = pageSteps().map(function (s) { return s[0]; }), i = ids.indexOf(active), wt = WR_ORDER.indexOf(wrTab);
      if (i === ids.length - 1 && page === 'wr' && wt < WR_ORDER.length - 1) focusStep(WR_FIRST[WR_ORDER[wt + 1]], true);
      else if (i === ids.length - 1) switchPage(ORDER[(ORDER.indexOf(page) + 1) % ORDER.length], true);
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
  eqBuild();
  eqGo(0, true);
  if (!reduce) {
    countUp(document.getElementById('hv-count'), liveDelivered === undefined ? 8412 : liveDelivered, fmt, 1600);
    countUp(document.querySelector('.hv-num'), 64, String, 1400);
    countUp(document.querySelector('.hv-risknum'), 2, String, 1400);
  }
  renderMock();
  focusStep('overview', true);
})();
