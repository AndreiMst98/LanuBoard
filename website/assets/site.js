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
  function heroWords(id, text, hl) {
    var el = document.getElementById(id), words = text.split(' ');
    if (el) el.innerHTML = words.map(function (w, i) { return '<span class="w' + (i >= words.length - hl ? ' hl' : '') + '" style="--i:' + i + '">' + esc(w) + '</span>'; }).join(' ');
  }
  function applyCopy() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    heroWords('hero-title', t('heroTitle'), t('heroHl'));
    heroWords('hero-title2', t('hs2Title'), t('hs2Hl'));
    heroWords('hero-title3', t('hs3Title'), t('hs3Hl'));
    document.querySelectorAll('[data-i18n-idx]').forEach(function (el) { el.textContent = t(el.dataset.i18nIdx)[Number(el.dataset.k)]; });
    document.querySelectorAll('[data-i18n-tpl]').forEach(function (el) { el.textContent = t(el.dataset.i18nTpl, { n: el.dataset.n }); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    document.getElementById('tour-kicker').textContent = 'LANU Board · ' + t(PAGES[page].name);
    document.title = lang === 'de' ? 'LANU Board – Ihr ganzer Liefertag auf einem Bildschirm' : 'LANU Board — your whole delivery day on one screen';
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.dataset.lang;
      try { localStorage.setItem('lanu-lang', lang); } catch (e) {}
      applyCopy(); haBuild(); renderBenefits(); renderTicker(); renderSteps(); renderMock(); focusStep(active, true); moveInd(); eqBuild(); eqGo(eq.s, true); if (owZ) { owRender(); owSteps(); } p2Render(); p2Focus(p2.active, true, true);
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
  function renderMock() { if (page === 'da') renderDa(); else if (page === 'cp') renderCp(); else if (page === 'hs') renderHs(); else if (page === 'wr') renderWr(); else if (page === 'rc') renderRc(); else renderOps(); }
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
    var b = e.target.closest('[data-day],[data-week],[data-sort],[data-sortdnr],[data-cp-act],[data-hs-act],[data-wr-act],[data-rc-act]');
    if (!b || b.disabled) return;
    stopAuto();
    if (b.dataset.cpAct) { cpAction(b.dataset.cpAct, b.dataset.v, b); return; }
    if (b.dataset.hsAct) { hsAction(b.dataset.hsAct, b.dataset.v); return; }
    if (b.dataset.wrAct) { wrAction(b.dataset.wrAct, b.dataset.v); return; }
    if (b.dataset.rcAct) { rcAction(b.dataset.rcAct, b.dataset.v); return; }
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
  var WR_TAB = { upload: 'sc', results: 'sc', send: 'sc', kpis: 'iadc', trend: 'iadc', insights: 'iadc', heat: 'iadc', drivers: 'iadc', cnkpis: 'cn', cntrend: 'cn', cnins: 'cn', cncat: 'cn', cndrivers: 'cn', cndnr: 'cn', cckpis: 'ccp', cctrend: 'ccp', cccat: 'ccp', ccdrivers: 'ccp', podkpis: 'pod', podtrend: 'pod', podcat: 'pod', poddrivers: 'pod' };
  var WR_ORDER = ['sc', 'iadc', 'cn', 'ccp', 'pod'], WR_FIRST = { sc: 'upload', iadc: 'kpis', cn: 'cnkpis', ccp: 'cckpis', pod: 'podkpis' };
  var ccTier = 'all', ccCat = -1, podTier = 'all', podCat = -1;
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
    return '<div class="hs-nav"><span class="dim">' + t('wrTitle') + '</span>' + [['sc', 'wrSc'], ['iadc', 'wrIadc'], ['cn', 'cnTab'], ['ccp', 'ccTab'], ['pod', 'podTab']].map(function (x) {
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

  // ---------- Contact Compliance + POD Quality (fictional)
  var CC_C = ['#2F6BFF', '#F5A623', '#7C3AED', '#06AED4', '#12B76A'], POD_C = ['#2F6BFF', '#7C3AED', '#E5484D', '#F5A623', '#06AED4', '#98A2B3'];
  function pctAxis(v) { return nf(v, 1) + '%'; }
  function comboPct(w, h, labels, bars, line, yMin, yMax, targets) {
    var L = 58, R = 14, T = 14, B = 26, iw = w - L - R, ih = h - T - B, n = labels.length, bmax = Math.max.apply(null, bars) * 1.04;
    function X(i) { return L + (i + .5) * iw / n; } function Y(v) { return T + ih - (v - yMin) / (yMax - yMin) * ih; } function YB(v) { return T + ih - v / bmax * ih; }
    var g = '';
    for (var k = 0; k <= 4; k++) { var v = yMin + (yMax - yMin) * k / 4; g += '<path d="M' + L + ' ' + Y(v) + 'H' + (w - R) + '" stroke="#EDF0F5"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + pctAxis(v) + '</text>'; }
    bars.forEach(function (v, i) { g += '<rect class="bar" style="--i:' + i + '" x="' + (X(i) - 18) + '" y="' + YB(v) + '" width="36" height="' + (YB(0) - YB(v)) + '" rx="3" fill="#B794F4"/>'; });
    (targets || []).forEach(function (tg) { g += '<path d="M' + L + ' ' + Y(tg[0]) + 'H' + (w - R) + '" stroke="' + tg[1] + '" stroke-dasharray="4 4" opacity=".7"/><text class="tg" x="' + (w - R - 4) + '" y="' + (Y(tg[0]) - 6) + '" text-anchor="end" fill="' + tg[1] + '">' + tg[2] + '</text>'; });
    g += '<path class="ln" d="' + line.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(Math.max(yMin, v)).toFixed(1); }).join('') + '" stroke="#2F6BFF"/>';
    line.forEach(function (v, i) { g += '<circle class="pt" style="--i:' + i + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(Math.max(yMin, v)).toFixed(1) + '" r="4.5" fill="#2F6BFF"/>'; });
    labels.forEach(function (lb, i) { g += '<text x="' + X(i) + '" y="' + (h - 6) + '" text-anchor="middle">' + lb + '</text>'; });
    return '<svg class="wr-ch" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + g + '</svg>';
  }
  function stackBars(w, h, groups, vals, colors) {
    var L = 40, R = 10, T = 12, B = 26, iw = w - L - R, ih = h - T - B, n = groups.length, tots = vals.map(function (a) { return a.reduce(function (x, y) { return x + y; }, 0); }), mx = Math.max.apply(null, tots) * 1.06;
    function Y(v) { return T + ih - v / mx * ih; }
    var g = '', gw = iw / n, bw = Math.min(70, gw * .5);
    for (var q = 0; q <= 4; q++) { var v = mx * q / 4; g += '<path d="M' + L + ' ' + Y(v) + 'H' + (w - R) + '" stroke="#EDF0F5"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + Math.round(v) + '</text>'; }
    groups.forEach(function (gr, i) {
      var x = L + i * gw + (gw - bw) / 2, acc = 0;
      g += '<g class="stk" style="--i:' + i + '">' + vals[i].map(function (v, j) { var y1 = Y(acc + v), y0 = Y(acc); acc += v; return v ? '<rect x="' + x.toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y0 - y1).toFixed(1) + '" fill="' + colors[j] + '"/>' : ''; }).join('') + '</g>';
      g += '<text x="' + (x + bw / 2) + '" y="' + (h - 6) + '" text-anchor="middle">' + gr + ' · ' + tots[i] + '</text>';
    });
    return '<svg class="wr-ch" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + g + '</svg>';
  }
  function topList(rows) {
    var mx = Math.max.apply(null, rows.map(function (r0) { return r0.v; })) || 1;
    return rows.map(function (r0, i) {
      return '<div class="tl-r" style="--i:' + i + '"><span class="tl-n"><b>' + esc(r0.name) + '</b><small>' + r0.sub + '</small></span><span class="wr-bt tl-b"><span class="tl-s" style="width:' + (r0.v / mx * 100) + '%">' +
        r0.segs.map(function (sg) { return '<i style="flex:' + sg[0] + ';background:' + sg[1] + '"></i>'; }).join('') + '</span></span><span class="wr-bv">' + r0.v + ' <small>/ ' + r0.tot + '</small></span></div>';
    }).join('');
  }
  function reasonList(names, counts, colors, prefix, act, sel) {
    var tot = counts.reduce(function (a, b) { return a + b; }, 0) || 1, mx = Math.max.apply(null, counts) || 1;
    return names.map(function (nm, i) {
      return '<button type="button" class="cc-r' + (sel === i ? ' on' : '') + '" data-wr-act="' + act + '" data-v="' + i + '"><span class="cc-code" style="background:' + colors[i] + '">' + prefix + (i + 1) + '</span><span class="cc-nm">' + nm + '</span><span class="wr-bt"><i style="width:' + Math.max(2, counts[i] / mx * 100) + '%;background:' + colors[i] + '"></i></span><span class="wr-bv">' + counts[i] + ' <small>' + nf(counts[i] / tot * 100) + '%</small></span></button>';
    }).join('');
  }
  function qHeader(sub, upHead, upTag, upNote) {
    var wi = weekInfo(wrWeek - 1);
    return '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + t('wrRepWeek', { y: new Date().getFullYear(), n: wi.n }) + ' <span class="wr-st">· ST01</span></b><span>' + sub + '</span></div><span class="wr-imp">' + t('wrLastImport', { d: ddmm(addD(TODAY, -1)) }) + '</span>' +
      '<div class="m-dnav"><button type="button" data-wr-act="week" data-v="-1" aria-label="Previous week"' + (wrWeek <= -8 ? ' disabled' : '') + '>‹</button><button type="button" data-wr-act="week" data-v="1" aria-label="Next week"' + (wrWeek >= 0 ? ' disabled' : '') + '>›</button></div></div>' +
      '<div class="m-panel wr-up2"><div class="wr-drop"><span class="wr-di">' + WR_DOC + '</span><div><b>' + upHead + ' <span class="m-cnt">' + upTag + '</span></b><small>' + upNote + '</small></div><button type="button" class="wr-upbtn" data-wr-act="noop">' + WR_UPI + t('wrUpload') + '</button></div></div>';
  }
  function kpi3(items) { return items.map(function (k) { return '<div><span>' + k[0] + '</span><b class="' + (k[3] || '') + '"' + (k[4] !== undefined ? ' data-count="' + k[4] + '"' + (k[5] ? ' data-f="pct"' : '') : '') + '>' + k[1] + '</b>' + (k[2] || '') + '<small>' + k[6] + '</small></div>'; }).join(''); }
  function sgn(v, f) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + f(Math.abs(v)); }
  function ccData(off, shallow) {
    var key = 'cc' + off + (shallow ? 's' : ''); if (cnCache[key]) return cnCache[key];
    var r = rng(6060 + off * 19), w = {};
    if (shallow) { w.comp = 98.6 + r() * 1.1; w.addr = 15800 + Math.floor(r() * 2400); w.missed = Math.round((100 - w.comp) / 100 * w.addr); w.ncp = w.missed + 6 + Math.floor(r() * 8); w.crit = 3 + Math.floor(r() * 5); w.under = 22 + Math.floor(r() * 10); w.rep = 7 + Math.floor(r() * 6); return (cnCache[key] = w); }
    w.drivers = ROSTER.map(function (d) {
      var x = { name: d.name, id: d.id, addr: r() < .12 ? between(r, 2, 30) : between(r, 60, 480) };
      x.missed = r() < .55 ? 0 : Math.min(x.addr - 1, 1 + Math.floor(Math.pow(r(), 2.2) * 15)); x.contacts = x.addr - x.missed; x.comp = x.contacts / x.addr * 100;
      x.tier = x.comp >= 98 ? 'OK' : x.comp >= 95 ? 'WATCH' : 'CRITICAL'; x.ncp = x.missed ? x.missed + Math.floor(r() * 3) : 0;
      x.cats = [0, 0, 0, 0, 0]; for (var k = 0; k < x.missed; k++) { var c = r() < .86 ? 0 : between(r, 1, 4); x.cats[c]++; }
      x.flags = []; if (x.missed && x.tier !== 'OK' && r() < .75) x.flags.push(0); if (x.missed && r() < .2) x.flags.push(1); if (x.missed && r() < .2) x.flags.push(2); if (x.missed && r() < .25) x.flags.push(3); if (x.addr < 30) x.flags.push(4);
      x.score = Math.min(100, Math.round(Math.max(0, 100 - x.comp) * 2.6 + x.missed * 2.4 + x.flags.length * 5));
      return x;
    }).sort(function (a, b) { return b.score - a.score; });
    var D = w.drivers; w.addr = D.reduce(function (a, x) { return a + x.addr; }, 0); w.contacts = D.reduce(function (a, x) { return a + x.contacts; }, 0); w.missed = w.addr - w.contacts; w.comp = w.contacts / w.addr * 100;
    w.ncp = D.reduce(function (a, x) { return a + x.ncp; }, 0); w.under = D.filter(function (x) { return x.missed; }).length; w.crit = D.filter(function (x) { return x.tier === 'CRITICAL'; }).length;
    w.watch = D.filter(function (x) { return x.tier === 'WATCH'; }).length; w.ok = D.length - w.crit - w.watch; w.rep = D.filter(function (x) { return x.flags.indexOf(0) >= 0; }).length;
    w.cats = [0, 1, 2, 3, 4].map(function (k) { return D.reduce(function (a, x) { return a + x.cats[k]; }, 0); });
    w.prev = ccData(off - 1, true);
    w.weeks = []; for (var k = -4; k <= 0; k++) { var q = k === 0 ? w : ccData(off + k, true); w.weeks.push({ n: weekInfo(off + k - 1).n, comp: q.comp, missed: q.missed, cats: k === 0 ? w.cats.concat([Math.floor(r() * 2)]).slice(0, 5) : [Math.round(q.missed * .86), between(r, 2, 12), between(r, 0, 9), between(r, 0, 3), between(r, 0, 2)] }); }
    return (cnCache[key] = w);
  }
  function ccDrvInner(w) {
    var C = t('ccCols'), F = t('ccFlags'), list = w.drivers.filter(function (x) { return (ccTier === 'all' || x.tier === ccTier) && (ccCat < 0 || x.cats[ccCat]); });
    var tiers = ['all', 'OK', 'WATCH', 'CRITICAL'].map(function (tr) { return '<button type="button" class="hs-f' + (ccTier === tr ? ' on' : '') + '" data-wr-act="cctier" data-v="' + tr + '">' + (tr === 'all' ? t('wrAll') : tr) + '</button>'; }).join('');
    return '<div class="m-ph"><h4>' + t('wrDrivers') + '</h4><span class="m-cnt">' + t('wrDrvCount', { n: w.drivers.length }) + '</span><span class="cp-btn">' + t('wrExport') + '</span></div>' +
      '<div class="wr-fil"><span class="m-search">' + t('wrSearchDrv') + '</span>' + tiers + (ccCat >= 0 ? '<button type="button" class="cn-chip" data-wr-act="ccr" data-v="' + ccCat + '">C' + (ccCat + 1) + ' ×</button>' : '') + '</div>' +
      '<table class="m-t dense wr-dt"><thead><tr><th>' + C[0] + '</th><th>' + C[1] + '</th><th class="r">' + C[2] + '</th><th class="r">' + C[3] + '</th><th class="r">' + C[4] + '</th><th class="r">' + C[5] + '</th><th>' + C[6] + '</th><th class="r">' + C[7] + '</th><th>' + C[8] + '</th><th>' + C[9] + '</th><th class="r">' + C[10] + ' ↓</th></tr></thead><tbody>' +
      list.slice(0, 10).map(function (x, i) {
        return '<tr class="row-in" style="--i:' + i + '"><td><span class="da">' + avatar(x.name, 26) + '<b>' + esc(x.name) + '</b></span></td><td class="mono">' + x.id + '</td><td class="r">' + x.addr + '</td><td class="r">' + x.contacts + '</td><td class="r' + (x.missed ? ' red' : '') + '">' + x.missed + '</td><td class="r">' + nf(x.comp, 2) + '%</td>' +
          '<td><span class="wr-t ' + x.tier.toLowerCase() + '">' + x.tier + '</span></td><td class="r">' + x.ncp + '</td><td>' + x.cats.map(function (c, k) { return c ? '<span class="wr-f" style="background:' + CC_C[k] + '">C' + (k + 1) + ' ' + c + '</span>' : ''; }).join('') + '</td>' +
          '<td class="wrp fl">' + x.flags.map(function (f) { return '<span class="cn-fl' + (f === 0 || f === 3 ? ' red' : '') + '">' + F[f] + '</span>'; }).join('') + '</td><td class="r"><span class="wr-sc' + (x.score < 50 ? ' amb' : '') + '">' + x.score + '</span></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function renderCc() {
    var w = ccData(wrWeek), p = w.prev, K = t('ccK'), KS = t('ccKs');
    var h = qHeader(t('ccSub', { d: w.drivers.length, a: nf(w.addr), c: nf(w.contacts) }), t('ccUpHead'), t('ccUpTag'), t('ccUpNote'));
    h += '<div class="m-panel wr-k wr-k3" data-p="cckpis">' + kpi3([
      [K[0], pctf(w.comp, 2), wrDelta(w.comp - p.comp, pp(w.comp - p.comp), true), w.comp >= 98 ? 'pos' : 'neg', Math.round(w.comp * 100), 1, KS[0].replace('{c}', nf(w.contacts)).replace('{a}', nf(w.addr))],
      [K[1], w.missed, wrDelta(w.missed - p.missed, sgn(w.missed - p.missed, nf), false), '', w.missed, 0, KS[1]],
      [K[2], w.ncp, wrDelta(w.ncp - p.ncp, sgn(w.ncp - p.ncp, nf), false), '', w.ncp, 0, KS[2]],
      [K[3], w.under + ' <em>/ ' + w.drivers.length + '</em>', wrDelta(w.under - p.under, sgn(w.under - p.under, nf), false), '', undefined, 0, KS[3].replace('{n}', w.drivers.length)],
      [K[4], w.crit, wrDelta(w.crit - p.crit, sgn(w.crit - p.crit, nf), false), 'neg', w.crit, 0, KS[4].replace('{w}', w.watch).replace('{o}', w.ok)],
      [K[5], w.rep, wrDelta(w.rep - p.rep, sgn(w.rep - p.rep, nf), false), 'amb', w.rep, 0, KS[5]]]) + '</div>';
    var top = w.drivers.slice().sort(function (a, b) { return b.missed - a.missed; }).slice(0, 10).map(function (x) { return { name: x.name, sub: nf(x.comp, 2) + '%', v: x.missed, tot: x.addr, segs: [[1, '#2F6BFF']] }; });
    var lo = Math.floor(Math.min.apply(null, w.weeks.map(function (q) { return q.comp; }).concat([94.5])) * 2) / 2;
    h += '<div class="m-grid2" style="grid-template-columns:1.35fr 1fr;align-items:stretch">' +
      '<div class="m-panel wr-chp" data-p="cctrend"><div class="m-ph"><h4>' + t('cnTrend') + '</h4><span class="m-cnt">' + t('ccTrendTag') + '</span></div>' +
      comboPct(680, 270, w.weeks.map(function (q) { return q.n; }), w.weeks.map(function (q) { return q.missed; }), w.weeks.map(function (q) { return q.comp; }), lo, 100, [[98, '#2F6BFF', 'OK 98%'], [95, '#7C3AED', 'CRITICAL 95%']]) +
      '<div class="wr-leg"><span style="--c:#2F6BFF">' + t('ccLeg')[0] + '</span><span class="sq" style="--c:#B794F4">' + t('ccLeg')[1] + '</span></div></div>' +
      '<div class="m-panel" data-p="cctrend"><div class="m-ph"><h4>' + t('ccTop') + '</h4><span class="m-cnt">' + new Date().getFullYear() + '-' + weekInfo(wrWeek - 1).n + '</span></div>' + topList(top) + '</div></div>';
    h += '<div class="m-grid2" style="grid-template-columns:1.35fr 1fr;align-items:stretch">' +
      '<div class="m-panel wr-chp" data-p="cccat"><div class="m-ph"><h4>' + t('ccCatT') + '</h4><span class="m-cnt">' + t('wrLast5') + '</span></div>' +
      groupBars(680, 250, w.weeks.map(function (q) { return 'W' + q.n; }), w.weeks.map(function (q) { return q.cats; }), CC_C, function (v) { return nf(v); }) +
      '<div class="wr-leg wrap">' + t('ccCats').map(function (c, i) { return '<span style="--c:' + CC_C[i] + '"><b>C' + (i + 1) + '</b> ' + c + '</span>'; }).join('') + '</div></div>' +
      '<div class="m-panel" data-p="cccat"><div class="m-ph"><h4>' + t('ccReasons') + '</h4><span class="m-cnt">' + t('wrClickFilter') + '</span></div>' + reasonList(t('ccReasonNames').slice(0, 4), w.cats.slice(0, 4), CC_C, 'C', 'ccr', ccCat) + '</div></div>';
    h += '<div class="m-panel" data-p="ccdrivers" data-wr="ccdrv">' + ccDrvInner(w) + '</div>';
    return h;
  }
  function podData(off, shallow) {
    var key = 'pod' + off + (shallow ? 's' : ''); if (cnCache[key]) return cnCache[key];
    var r = rng(7070 + off * 23), w = {};
    if (shallow) { w.req = 16400 + Math.floor(r() * 1600); w.rej = 34 + Math.floor(r() * 28); w.rate = 100 - w.rej / w.req * 100; w.byp = 4 + Math.floor(r() * 8); w.dr = 14 + Math.floor(r() * 7); w.crit = 2 + Math.floor(r() * 3);
      w.cats = [Math.round(w.rej * .3), Math.round(w.rej * .38), between(r, 1, 6), between(r, 0, 3), between(r, 1, 6), r() < .4 ? between(r, 8, 28) : 0]; return (cnCache[key] = w); }
    w.drivers = ROSTER.map(function (d) {
      var x = { name: d.name, id: d.id, opp: between(r, 30, 500) };
      x.rej = r() < .68 ? 0 : 1 + Math.floor(Math.pow(r(), 2) * 6); x.byp = r() < .93 ? 0 : between(r, 1, 3); x.succ = x.opp - x.rej; x.rr = x.rej / x.opp * 100;
      x.cats = [0, 0, 0, 0, 0, 0]; for (var k = 0; k < x.rej; k++) { var u = r(); x.cats[u < .4 ? 0 : u < .8 ? 1 : u < .87 ? 2 : u < .9 ? 3 : 4]++; }
      x.tier = x.rr > 1 || x.rej >= 4 ? 'CRITICAL' : x.rej >= 2 || x.byp ? 'WATCH' : 'OK';
      x.flags = []; if (x.rej >= 2 || x.byp) x.flags.push(0); if (x.cats[2]) x.flags.push(1); if (Math.max.apply(null, x.cats) >= 2) x.flags.push(2); if (x.rej >= 3 && r() < .4) x.flags.push(3); if (x.byp) x.flags.push(4);
      x.score = Math.min(100, Math.round(x.rr * 30 + x.rej * 6 + x.byp * 12 + x.flags.length * 4));
      return x;
    }).sort(function (a, b) { return b.score - a.score; });
    var D = w.drivers; w.req = D.reduce(function (a, x) { return a + x.opp; }, 0); w.rej = D.reduce(function (a, x) { return a + x.rej; }, 0); w.rate = 100 - w.rej / w.req * 100;
    w.byp = D.reduce(function (a, x) { return a + x.byp; }, 0); w.dr = D.filter(function (x) { return x.rej; }).length; w.crit = D.filter(function (x) { return x.tier === 'CRITICAL'; }).length;
    w.watch = D.filter(function (x) { return x.tier === 'WATCH'; }).length; w.ok = D.length - w.crit - w.watch; w.car = D.filter(function (x) { return x.cats[2]; }).length;
    w.cats = [0, 1, 2, 3, 4, 5].map(function (k) { return D.reduce(function (a, x) { return a + x.cats[k]; }, 0); });
    w.prev = podData(off - 1, true);
    w.weeks = []; for (var k = -4; k <= 0; k++) { var q = k === 0 ? w : podData(off + k, true); w.weeks.push({ n: weekInfo(off + k - 1).n, rate: q.rate, rej: q.rej, cats: q.cats }); }
    return (cnCache[key] = w);
  }
  function podDrvInner(w) {
    var C = t('podCols'), F = t('podFlags'), list = w.drivers.filter(function (x) { return (podTier === 'all' || x.tier === podTier) && (podCat < 0 || x.cats[podCat]); });
    var tiers = ['all', 'OK', 'WATCH', 'CRITICAL'].map(function (tr) { return '<button type="button" class="hs-f' + (podTier === tr ? ' on' : '') + '" data-wr-act="podtier" data-v="' + tr + '">' + (tr === 'all' ? t('wrAll') : tr) + '</button>'; }).join('');
    return '<div class="m-ph"><h4>' + t('wrDrivers') + '</h4><span class="m-cnt">' + t('wrDrvCount', { n: w.drivers.length }) + '</span><span class="cp-btn">' + t('wrExport') + '</span></div>' +
      '<div class="wr-fil"><span class="m-search">' + t('wrSearchDrv') + '</span>' + tiers + (podCat >= 0 ? '<button type="button" class="cn-chip" data-wr-act="podr" data-v="' + podCat + '">P' + (podCat + 1) + ' ×</button>' : '') + '</div>' +
      '<table class="m-t dense wr-dt"><thead><tr><th>' + C[0] + '</th><th>' + C[1] + '</th><th class="r">' + C[2] + '</th><th class="r">' + C[3] + '</th><th class="r">' + C[4] + '</th><th class="r">' + C[5] + '</th><th class="r">' + C[6] + '</th><th>' + C[7] + '</th><th>' + C[8] + '</th><th>' + C[9] + '</th><th class="r">' + C[10] + ' ↓</th></tr></thead><tbody>' +
      list.slice(0, 10).map(function (x, i) {
        return '<tr class="row-in" style="--i:' + i + '"><td><span class="da">' + avatar(x.name, 26) + '<b>' + esc(x.name) + '</b></span></td><td class="mono">' + x.id + '</td><td class="r">' + x.opp + '</td><td class="r">' + x.succ + '</td><td class="r' + (x.byp ? ' red' : '') + '">' + x.byp + '</td><td class="r' + (x.rej ? ' red' : '') + '">' + x.rej + '</td><td class="r">' + nf(x.rr, 2) + '%</td>' +
          '<td>' + x.cats.map(function (c, k) { return c ? '<span class="wr-f" style="background:' + POD_C[k] + '">P' + (k + 1) + ' ' + c + '</span>' : ''; }).join('') + '</td><td><span class="wr-t ' + x.tier.toLowerCase() + '">' + x.tier + '</span></td>' +
          '<td class="wrp fl">' + x.flags.map(function (f) { return '<span class="cn-fl' + (f === 0 || f === 3 ? ' red' : ' amb') + '">' + F[f] + '</span>'; }).join('') + '</td><td class="r"><span class="wr-sc' + (x.score < 50 ? ' amb' : '') + '">' + x.score + '</span></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function renderPod() {
    var w = podData(wrWeek), p = w.prev, K = t('podK'), KS = t('podKs'), rr = w.rej / w.req * 100, prr = p.rej / p.req * 100;
    var h = qHeader(t('podSub', { d: w.drivers.length, p: nf(w.req) }), t('podUpHead'), t('podUpTag'), t('podUpNote'));
    h += '<div class="m-panel wr-k wr-k3" data-p="podkpis">' + kpi3([
      [K[0], pctf(w.rate, 2), wrDelta(w.rate - p.rate, pp(w.rate - p.rate), true), 'pos', Math.round(w.rate * 100), 1, KS[0].replace('{a}', nf(w.req - w.rej)).replace('{b}', nf(w.req))],
      [K[1], w.rej + ' <em>' + pctf(rr, 2) + '</em>', wrDelta(w.rej - p.rej, sgn(w.rej - p.rej, nf), false), 'amb', undefined, 0, KS[1].replace('{d}', pp(rr - prr))],
      [K[2], w.byp, wrDelta(w.byp - p.byp, sgn(w.byp - p.byp, nf), false), 'neg', w.byp, 0, KS[2]],
      [K[3], 0, '', '', undefined, 0, KS[3].replace('{p}', pctf(0, 0))],
      [K[4], w.dr + ' <em>/ ' + w.drivers.length + '</em>', wrDelta(w.dr - p.dr, sgn(w.dr - p.dr, nf), false), '', undefined, 0, KS[4].replace('{n}', w.drivers.length)],
      [K[5], w.crit, wrDelta(w.crit - p.crit, sgn(w.crit - p.crit, nf), false), 'neg', w.crit, 0, KS[5].replace('{w}', w.watch).replace('{o}', w.ok).replace('{c}', w.car)]]) + '</div>';
    var top = w.drivers.slice().sort(function (a, b) { return b.rej - a.rej || b.rr - a.rr; }).slice(0, 10).map(function (x) {
      return { name: x.name, sub: nf(x.rr, 2) + '% · ' + x.cats.map(function (c, k) { return c ? 'P' + (k + 1) + ' ' + c : ''; }).filter(Boolean).join(' '), v: x.rej, tot: x.opp, segs: x.cats.map(function (c, k) { return [c, POD_C[k]]; }).filter(function (sg) { return sg[0]; }) };
    });
    var lo = Math.floor(Math.min.apply(null, w.weeks.map(function (q) { return q.rate; })) * 4 - 1) / 4;
    h += '<div class="m-grid2" style="grid-template-columns:1.35fr 1fr;align-items:stretch">' +
      '<div class="m-panel wr-chp" data-p="podtrend"><div class="m-ph"><h4>' + t('cnTrend') + '</h4><span class="m-cnt">' + t('podTrendTag') + '</span></div>' +
      comboPct(680, 270, w.weeks.map(function (q) { return q.n; }), w.weeks.map(function (q) { return q.rej; }), w.weeks.map(function (q) { return q.rate; }), Math.min(99, lo), 100) +
      '<div class="wr-leg"><span style="--c:#2F6BFF">' + t('podLeg')[0] + '</span><span class="sq" style="--c:#B794F4">' + t('podLeg')[1] + '</span></div></div>' +
      '<div class="m-panel" data-p="podtrend"><div class="m-ph"><h4>' + t('podTop') + '</h4><span class="m-cnt">' + new Date().getFullYear() + '-' + weekInfo(wrWeek - 1).n + '</span></div>' + topList(top) + '</div></div>';
    h += '<div class="m-grid2" style="grid-template-columns:1.35fr 1fr;align-items:stretch">' +
      '<div class="m-panel wr-chp" data-p="podcat"><div class="m-ph"><h4>' + t('podCatT') + '</h4><span class="m-cnt">' + t('wrLast5') + '</span></div>' +
      stackBars(680, 250, w.weeks.map(function (q) { return 'W' + q.n; }), w.weeks.map(function (q) { return q.cats; }), POD_C) +
      '<div class="wr-leg wrap">' + t('podCats').map(function (c, i) { return '<span style="--c:' + POD_C[i] + '"><b>P' + (i + 1) + '</b> ' + c + '</span>'; }).join('') + '</div></div>' +
      '<div class="m-panel" data-p="podcat"><div class="m-ph"><h4>' + t('podReasons') + '</h4><span class="m-cnt">' + t('wrClickFilter') + '</span></div>' + reasonList(t('podCats').slice(0, 5), w.cats.slice(0, 5), POD_C, 'P', 'podr', podCat) + '</div></div>';
    h += '<div class="m-panel" data-p="poddrivers" data-wr="poddrv">' + podDrvInner(w) + '</div>';
    return h;
  }
  function renderWr() {
    var html = topBar(t('pageWr')) + wrSubnav() + '<div class="m-body">', wi = weekInfo(wrWeek - 1);
    if (wrTab === 'ccp') {
      html += renderCc();
    } else if (wrTab === 'pod') {
      html += renderPod();
    } else if (wrTab === 'cn') {
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
    if (act === 'cctier') { ccTier = v; wrSet('ccdrv', ccDrvInner(ccData(wrWeek))); focusStep('ccdrivers', true, true); return; }
    if (act === 'podtier') { podTier = v; wrSet('poddrv', podDrvInner(podData(wrWeek))); focusStep('poddrivers', true, true); return; }
    if (act === 'ccr') { ccCat = ccCat === Number(v) ? -1 : Number(v); renderMock(); focusStep(ccCat < 0 ? 'cccat' : 'ccdrivers', true); return; }
    if (act === 'podr') { podCat = podCat === Number(v) ? -1 : Number(v); renderMock(); focusStep(podCat < 0 ? 'podcat' : 'poddrivers', true); return; }
    if (act === 'tier' || act === 'letter') { if (act === 'tier') wrTier = v; else wrLetter = v; wrSet('drivers', wrDriversInner(wrIadcData(wrWeek))); focusStep('drivers', true, true); }
  }


  // ------------------------------------------------------------------ Recruiting page (fictional recruits)
  var RCN = rosterOf(200), RC_ST = ['contacted', 'progress', 'training', 'employee', 'rejected', 'withdrew'], RC_SC = ['#56607A', '#2F6BFF', '#7C3AED', '#1E9E5A', '#B42318', '#93370D'];
  var rc, rcDrawer = null, rcFileId = null, rcFilter = 'all', rcTok = 0, rcNewName = null, rcHi = null;
  function makeRecruits() {
    var r = rng(8080), recs = CPR.slice(78, 82).map(function (d) { return d.name; });
    var DEF = [['training', 6, 1, 120, 0], ['progress', 4, 0, 95, 0], ['progress', 2, 0, 0, 0], ['employee', 6, 0, 140, 1], ['contacted', 1, 0, 0, 0], ['training', 5, 0, 110, 0], ['employee', 6, 1, 0, 0], ['rejected', 2, 0, 0, 0], ['withdrew', 3, 0, 85, 1]];
    return DEF.map(function (q, i) {
      var papers = [0, 1, 2, 3, 4, 5].map(function (k) { return k < q[1]; });
      return { id: 'r' + i, name: RCN[160 + i].name, st: q[0], papers: papers, by: recs[i % 4], start: addD(TODAY, between(r, -20, 24)),
        phone: (r() < .6 ? '+40 7' + between(r, 10, 79) : '+49 1' + between(r, 51, 79)) + ' ••• ' + between(r, 100, 999),
        iban: papers[1] ? (r() < .5 ? 'DE' : 'RO') + between(r, 10, 99) + ' •••• •••• ' + between(r, 1000, 9999) : null, tr: q[3], trRec: !!q[4], month: i < 5 ? 0 : -1 };
    });
  }
  function rcCount(st) { return rc.filter(function (x) { return x.st === st; }).length; }
  function rcStPill(x) { var i = RC_ST.indexOf(x.st); return '<button type="button" class="rc-st" style="--c:' + RC_SC[i] + '" data-rc-act="status" data-v="' + x.id + '">' + t('rcStN')[i] + '</button>'; }
  function rcPapersDots(x) { var n = x.papers.filter(Boolean).length; return '<span class="rc-pp">' + x.papers.map(function (p) { return '<i' + (p ? ' class="on"' : '') + '></i>'; }).join('') + '<b>' + n + '/6</b></span>'; }
  function rcListInner() {
    var F = ['progress', 'contacted', 'training', 'employee', 'rejected', 'withdrew', 'all', 'transport'], N = t('rcStN');
    var chips = F.map(function (f) {
      var n = f === 'all' ? rc.length : f === 'transport' ? rc.filter(function (x) { return x.tr && !x.trRec; }).length : rcCount(f);
      var lb = f === 'all' ? t('rcAll') : f === 'transport' ? t('rcTransportF') : N[RC_ST.indexOf(f)];
      return '<button type="button" class="hs-f' + (rcFilter === f ? ' on' : '') + '" data-rc-act="filter" data-v="' + f + '">' + lb + ' <b>' + n + '</b></button>';
    }).join('');
    var list = rc.filter(function (x) { return rcFilter === 'all' || (rcFilter === 'transport' ? x.tr && !x.trRec : x.st === rcFilter); }), C = t('rcCols');
    return '<div class="m-ph"><h4>' + t('rcRecruits') + '</h4><span class="m-cnt">' + rc.length + '</span></div>' +
      '<div class="rc-tools"><label><small>&nbsp;</small><span class="m-search">' + t('rcSearch') + '</span></label><label><small>' + t('rcMonth') + '</small><span class="rc-sel">' + t('rcAllM') + ' <i>▾</i></span></label><label class="rc-chips"><small>' + t('rcStatusL') + '</small><span>' + chips + '</span></label></div>' +
      '<table class="m-t rc-t"><thead><tr>' + C.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      list.map(function (x, i) {
        return '<tr class="row-in' + (rcHi === x.id ? ' add-in' : '') + '" style="--i:' + i + '"><td><button type="button" class="rc-nm" data-rc-act="open" data-v="' + x.id + '">' + avatar(x.name, 30) + '<span><b>' + esc(x.name) + '</b><small>' + x.phone + '</small></span></button></td><td>' + rcStPill(x) + '</td>' +
          '<td>' + ddmm(x.start) + '</td><td>' + rcPapersDots(x) + '</td><td class="mono">' + (x.iban || '–') + '</td><td>' + (x.tr ? eur0(x.tr) + ' <span class="rc-tr' + (x.trRec ? ' ok' : '') + '">' + t(x.trRec ? 'rcRecovered' : 'rcOpen') + '</span>' : '–') + '</td>' +
          '<td><span class="da">' + avatar(x.by, 22) + '<span>' + esc(x.by.split(' ')[0]) + '</span></span></td></tr>';
      }).join('') + '</tbody></table><div class="m-foot">' + t('rcFoot') + '</div>';
  }
  function rcField(label, val, typed, cls) {
    return '<div class="rc-fl' + (cls ? ' ' + cls : '') + '"><small>' + label + '</small><span class="rc-in"' + (typed ? ' data-type="' + esc(typed) + '"' : '') + '>' + (typed ? '' : val || '') + '</span></div>';
  }
  function rcYN(label, yes) { return '<div class="rc-fl"><small>' + label + '</small><span class="rc-yn"><i' + (yes === true ? ' class="on"' : '') + '>' + t('rcYes') + '</i><i' + (yes === false ? ' class="on"' : '') + '>' + t('rcNo') + '</i></span></div>'; }
  function rcNewDrawer() {
    var F = t('rcF'), S = t('rcSec'), H = t('rcHints'), nm = RCN[170 + (rcTok % 20)].name;
    function sec(i, body) { return '<div class="rc-sec"><h5>' + S[i] + '</h5><span class="rc-how">' + (i < 2 ? '− ' : '+ ') + t('rcHow') + '</span>' + (i < 2 ? '<p class="rc-hint">' + H[i] + '</p>' : '') + body + '</div>'; }
    return '<div class="m-panel rc-dr" data-p="rcnew"><div class="rc-dh"><div><b>' + t('rcNew') + '</b><small>' + t('rcNewSub') + '</small></div><button type="button" class="cp-x" data-rc-act="close">×</button></div>' +
      sec(0, '<div class="rc-g2">' + rcField(F[0], '', nm, 'focus') + rcField(F[1], '', '+4917612345678') + rcField(F[2], '', nm.toLowerCase().replace(' ', '.') + '@mail.example') + rcField(F[3], ddmm(addD(TODAY, 14))) + '</div>') +
      sec(1, rcField(F[4], '', 'DE89 3704 0044 0532 0130 00', 'iban') + '<span class="rc-ok">' + t('rcIbanOk') + '</span><div class="rc-g2">' + rcField(F[5], '') + rcField(F[6], '') + '</div>' + rcField(F[7], 'TK')) +
      sec(2, '<div class="rc-g2">' + rcYN(F[8], false) + rcYN(F[9], null) + '</div>') +
      sec(3, '<div class="rc-g2">' + rcField(F[10], '120') + rcField(F[11], ddmm(addD(TODAY, -2))) + '</div>' + rcField(F[12], 'BlueRoad Bus') + rcYN(F[13], false)) +
      sec(4, rcField('', t('rcNoteDemo'), null, 'area')) +
      '<div class="rc-act"><button type="button" class="hs-f" data-rc-act="close">' + t('rcCancel') + '</button><button type="button" class="wr-upbtn" data-rc-act="add" data-v="' + esc(nm) + '">+ ' + t('rcAdd') + '</button></div></div>';
  }
  function rcFileDrawer() {
    var x = rc.filter(function (y) { return y.id === rcFileId; })[0] || rc[0], P = t('rcPaperN'), miss = x.papers.filter(function (p) { return !p; }).length, i = RC_ST.indexOf(x.st), Hh = t('rcHist');
    var docs = [['Ausweis.pdf', 0], ['IBAN.jpg', 1], ['Steuer-ID.pdf', 2], ['SV-Ausweis.jpg', 3], ['Versicherung.pdf', 4], ['Fuehrerschein.jpg', 5]].filter(function (d) { return x.papers[d[1]]; });
    var hist = [[Hh[0], -9, x.by], [Hh[1], -6, x.by]];
    if (i >= 2) hist.push([Hh[2].replace('{d}', ddmm(x.start)), -3, CPR[80].name]);
    hist.push([Hh[3].replace('{s}', t('rcStN')[i]), -1, CPR[81].name]);
    return '<div class="m-panel rc-dr rc-file" data-p="rcfile"><div class="rc-dh"><div class="rc-fh">' + avatar(x.name, 46) + '<div><small>' + t('rcFileT') + '</small><b>' + esc(x.name) + '</b><span>' + x.phone + '</span></div></div>' + rcStPill(x) + '<button type="button" class="cp-x" data-rc-act="close">×</button></div>' +
      '<div class="rc-facts"><div><small>' + t('rcPlanned') + '</small><b>' + ddmm(x.start) + '</b></div><div><small>' + t('rcBy') + '</small><b>' + esc(x.by) + '</b></div><div><small>' + t('rcBank') + '</small><b class="mono">' + (x.iban ? x.iban.replace(/ •••• •••• /, ' 3704 0044 0532 ') : '–') + '</b></div></div>' +
      '<div class="rc-sec"><h5>' + t('rcPapers') + ' <span class="rc-cnt' + (miss ? '' : ' ok') + '">' + (miss ? t('rcMissing', { n: miss }) : t('rcComplete')) + '</span></h5><div class="rc-chk">' + P.map(function (p, k) { return '<span class="' + (x.papers[k] ? 'ok' : '') + '">' + (x.papers[k] ? '✓' : '○') + ' ' + p + '</span>'; }).join('') + '</div></div>' +
      '<div class="rc-sec"><h5>' + t('rcDocs') + '</h5><div class="rc-docs">' + docs.map(function (d, k) { return '<span class="rc-doc" style="--i:' + k + '"><i>' + (/pdf$/.test(d[0]) ? 'PDF' : 'JPG') + '</i>' + d[0] + '</span>'; }).join('') + '<span class="rc-doc add">+ ' + t('rcUpload') + '</span></div></div>' +
      (x.tr ? '<div class="rc-sec"><h5>' + t('rcSec')[3] + '</h5><p class="rc-trl">' + eur0(x.tr) + ' · BlueRoad Bus · ' + (x.trRec ? '<span class="rc-tr ok">' + t('rcRecovered') + '</span>' : '<span class="rc-tr">' + t('rcToRecover', { n: eur0(x.tr) }) + '</span>') + '</p></div>' : '') +
      '<div class="rc-sec"><h5>' + t('rcHistory') + '</h5><ul class="cp-tl rc-tl">' + hist.reverse().map(function (h, k) { return '<li class="' + (k === 0 ? 'cur' : '') + '"><b>' + esc(h[0]) + '</b><span>' + ddmm(addD(TODAY, h[1])) + ' · ' + esc(h[2]) + '</span></li>'; }).join('') + '</ul><span class="rc-note">' + t('rcAddNote') + '…</span></div></div>';
  }
  function renderRc() {
    if (!rc) rc = makeRecruits();
    var K = t('rcK'), miss = rc.filter(function (x) { return x.papers.some(function (p) { return !p; }) && x.st !== 'rejected' && x.st !== 'withdrew'; }).length;
    var hired = rc.filter(function (x) { return x.st === 'employee' && x.month === 0; }).length, trOpen = rc.reduce(function (a, x) { return a + (x.tr && !x.trRec ? x.tr : 0); }, 0);
    var recs = CPR.slice(78, 82).map(function (d) { return d.name; }), mine = recs.map(function (nm) { return rc.filter(function (x) { return x.by === nm; }); });
    var mx = Math.max.apply(null, mine.map(function (l) { return l.length; }));
    var html = topBar(t('pageRc')) + '<div class="m-body">' +
      '<div class="rc-head"><div><b>' + t('pageRc') + '</b><span>' + t('rcSub') + '</span></div><button type="button" class="wr-upbtn rc-newb" data-rc-act="new">+ ' + t('rcNew') + '</button></div>' +
      '<div class="rc-k" data-p="rckpis">' + [[K[0], rcCount('training'), ''], [K[1], rcCount('progress') + rcCount('contacted'), ''], [K[2], miss, 'amb'], [K[3], hired, 'pos'], [K[4], eurc(trOpen), '']].map(function (k) {
        return '<div class="m-panel" data-p="rckpis"><small>' + k[0] + '</small><b class="' + k[2] + '">' + k[1] + '</b></div>';
      }).join('') + '</div>' +
      '<div class="m-panel" data-p="rcwho"><div class="m-ph"><h4>' + t('rcWho') + '</h4><span class="m-ago">' + t('rcAllMonths') + '</span></div>' +
      recs.map(function (nm, i) {
        var l = mine[i];
        return '<div class="tl-r rc-who" style="--i:' + i + '"><span class="da">' + avatar(nm, 28) + '<b>' + esc(nm) + '</b></span><span class="wr-bt tl-b"><span class="tl-s" style="width:' + (l.length / mx * 100) + '%">' +
          RC_ST.map(function (st, k) { var c = l.filter(function (x) { return x.st === st; }).length; return c ? '<i style="flex:' + c + ';background:' + RC_SC[k] + '"></i>' : ''; }).join('') + '</span></span><span class="wr-bv">' + l.length + '</span></div>';
      }).join('') + '<div class="wr-leg wrap">' + t('rcStN').map(function (n, k) { return '<span style="--c:' + RC_SC[k] + '">' + n + '</span>'; }).join('') + '</div></div>' +
      '<div class="m-panel" data-p="rclist" data-rc="list">' + rcListInner() + '</div></div>';
    if (rcDrawer) html += '<div class="rc-back"></div>' + (rcDrawer === 'new' ? rcNewDrawer() : rcFileDrawer());
    mock.innerHTML = html;
    rcHi = null;
    layoutMock();
    if (rcDrawer === 'new') rcType(++rcTok);
  }
  function rcType(tok) {
    var els = Array.prototype.slice.call(mock.querySelectorAll('[data-type]')), ok = mock.querySelector('.rc-ok');
    if (reduce) { els.forEach(function (el) { el.textContent = el.dataset.type; }); if (ok) ok.classList.add('on'); return; }
    var k = 0;
    (function next() {
      if (tok !== rcTok || k >= els.length) {
        if (tok !== rcTok) return;
        if (ok) ok.classList.add('on');
        setTimeout(function () { // pan down to the end of the form, like scrolling the drawer
          var dr = mock.querySelector('.rc-dr'); if (tok !== rcTok || !dr || active !== 'rcnew') return;
          var H = screenEl.clientHeight, bottom = (dr.offsetTop + dr.offsetHeight) * cam.z;
          if (bottom > cam.y + H) { cam.y = Math.max(0, bottom - H + 16); layoutMock(); }
        }, 700);
        return;
      }
      var el = els[k], txt = el.dataset.type, j = 0;
      el.classList.add('typing');
      var iv = setInterval(function () {
        if (tok !== rcTok) { clearInterval(iv); return; }
        el.textContent = txt.slice(0, ++j);
        if (j >= txt.length) { clearInterval(iv); el.classList.remove('typing'); k++; setTimeout(next, 260); }
      }, 45);
    })();
  }
  function rcAction(act, v) {
    if (act === 'new') { focusStep('rcnew', true); return; }
    if (act === 'close') { rcTok++; focusStep('rclist', true); return; }
    if (act === 'open') { rcFileId = v; rcDrawer = null; focusStep('rcfile', true); return; }
    if (act === 'filter') { rcFilter = v; mock.querySelector('[data-rc="list"]').innerHTML = rcListInner(); focusStep('rclist', true, true); return; }
    if (act === 'status') {
      var x = rc.filter(function (y) { return y.id === v; })[0], i = RC_ST.indexOf(x.st);
      x.st = i < 3 ? RC_ST[i + 1] : i === 3 ? 'contacted' : 'progress';
      if (x.st === 'employee') x.month = 0;
      rcHi = x.id; renderMock(); focusStep(active, true, true);
      return;
    }
    if (act === 'add') {
      rcTok++;
      rc.unshift({ id: 'n' + rcTok, name: v, st: 'contacted', papers: [false, true, false, false, true, false], by: CPR[78].name, start: addD(TODAY, 14), phone: '+49 176 ••• 678', iban: 'DE89 •••• •••• 3000', tr: 120, trRec: false, month: 0 });
      rcHi = 'n' + rcTok; rcFilter = 'all'; rcDrawer = null; renderMock(); focusStep('rclist', true);
    }
  }


  // ------------------------------------------------------------------ Planning: second, mirrored tour (screen left, steps right)
  var P2P = {
    pl: { name: 'pageP', steps: 'plSteps', tabNames: 'plTabs', base: 'planning', tabs: ['cap', 'wp', 'at'], first: { cap: 'capweeks', wp: 'wpauto', at: 'atpaste' }, url: { cap: 'capacity', wp: 'work-plan', at: 'atlas-parcels' },
      of: { capweeks: 'cap', capkpis: 'cap', capdays: 'cap', wpauto: 'wp', wpplan: 'wp', wpsd: 'wp', atpaste: 'at', atlist: 'at' } },
    ts: { name: 'pageTs', steps: 'tsSteps', tabNames: 'tsTabs', base: 'timesheets', tabs: ['wd', 'rs', 'dp', 'ws', 'ap', 'af', 'ks'],
      first: { wd: 'tswd', rs: 'tsrs', dp: 'tsdp', ws: 'tsws', ap: 'tsap', af: 'tsaf', ks: 'tsks' },
      url: { wd: 'working-days', rs: 'rescue', dp: 'daily-protocol', ws: 'work-summary', ap: 'accommodation-problems', af: 'average-food', ks: 'kenjo-sync' },
      of: { tswd: 'wd', tsrs: 'rs', tsdp: 'dp', tsdpd: 'dp', tsws: 'ws', tswsd: 'ws', tsap: 'ap', tsaf: 'af', tsks: 'ks', tsksx: 'ks' } },
    fl: { name: 'pageFl', steps: 'flSteps', tabNames: 'flTabs', base: 'fleet', tabs: ['fv', 'fh', 'fp'], first: { fv: 'flsync', fh: 'flhist', fp: 'flph' },
      url: { fv: 'vehicles', fh: 'history', fp: 'vehicle-photos' }, of: { flsync: 'fv', fldet: 'fv', flhist: 'fh', flph: 'fp', flapp: 'fp', flphv: 'fp' } },
    gp: { name: 'pageGp', steps: 'gpSteps', tabNames: 'gpTabs', base: 'gps', tabs: ['gp'], first: { gp: 'gpmap' }, url: { gp: 'tracker' }, of: { gpmap: 'gp', gplive: 'gp', gptrace: 'gp', gpmulti: 'gp' } }
  };
  var P2ORDER = ['pl', 'ts', 'fl', 'gp'], P2ALIAS = { tsdpd: 'tsdp', tsksx: 'tsks', gptrace: 'gpmap', gpmulti: 'gpmap' };
  function P2() { return P2P[p2.page]; }
  var p2 = { page: 'pl', gps: { sel: [], f: 'all', anim: false }, fl: { f: 'all', keys: {}, add: {}, extra: {}, open: null, back: {}, leaving: null, toast: null, sent: {}, ph: null, appOn: false, appRow: 1, typing: null, hi: null, hiP: null, noted: false }, ts: { rsSort: false, dpOpen: null, wsTab: 0, wsTopic: -1, ap: {}, apHi: null, ksF: 'all', ks: 'done', ksN: 0 }, tab: 'cap', active: 'capweeks', auto: !reduce, inView: false, timer: null, cam: { z: 1, x: 0, y: 0 }, colors: [0, 1, 2], sb: [], at: 'empty', copied: false, saved: null, edits: {}, hi: null, tok: 0 };
  var mock2 = document.getElementById('mock2'), screen2 = document.getElementById('screen2'), steps2 = document.getElementById('steps2'), now2 = document.getElementById('step-now2');
  var WP_PAL = ['#FFF56B', '#64B5F6', '#FFB74D', '#81C784', '#F48FB1', '#B39DDB', '#4DD0E1'], WP_T = ['10:00', '10:50', '11:15'], SD_T = ['06:55', '14:15', '17:55'];
  function lday(d, o) { return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', o || { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }); }
  function wkStart(k) { return addD(TODAY, -TODAY.getDay() + k * 7); }
  var capC;
  function capData() {
    if (capC) return capC;
    var r = rng(1212), NEED = [67, 66, 69, 77, 79], c = { drv: 67, veh: 82, fleet: 86, un: 4 };
    c.weeks = NEED.map(function (need, k) {
      var st = wkStart(k), peak = addD(st, k === 0 ? Math.max(1, Math.min(6, TODAY.getDay())) : 1 + (k * 3) % 4), avail = k === 2 ? 66 : 67;
      var a = between(r, 6, 11), b = between(r, 7, 10), cc = between(r, 5, 9);
      return { n: weekInfo(k).n, range: ddmm(st) + ' – ' + ddmm(addD(st, 6)), need: need, avail: avail, peak: peak,
        rows: [[need - a - cc, (need - a - cc) * 5 + between(r, -8, 8)], [a, a * 5 + between(r, 0, 4)], [b, b * 5 + between(r, 0, 6)], [cc, cc * 5 + between(r, 0, 4)]] };
    });
    c.short = Math.max.apply(null, c.weeks.map(function (w) { return w.need - w.avail; }));
    c.peakW = c.weeks.filter(function (w) { return w.need - w.avail === c.short; })[0];
    c.days = [];
    for (var i = 0; i < 14; i++) {
      var d = addD(TODAY, i), sun = d.getDay() === 0, wk = Math.floor((i + TODAY.getDay()) / 7), base = 66 + wk * 6;
      var tgt = sun ? 0 : base + between(r, 2, 12), need = sun ? 0 : tgt - between(r, 7, 11), leave = sun ? 0 : (r() < .25 ? between(r, 1, 2) : 0), av = 67 - leave;
      c.days.push({ d: d, tgt: tgt, need: need, sch: sun ? 0 : need + between(r, 2, 9), av: av, leave: leave, vn: need, sun: sun });
    }
    return (capC = c);
  }
  var wpC;
  function wpData() {
    if (wpC) return wpC;
    var r = rng(3434), names = shuffle(CPR.map(function (d) { return d.name; }), r), main = [];
    var counts = [3, 27, 20], k = 0;
    counts.forEach(function (n, ti) { names.slice(k, k + n).sort().forEach(function (nm) { main.push({ name: nm, ti: ti }); }); k += n; });
    var sdA = names.slice(50, 61).sort(), sdB = sdA.slice(0, 5).concat(names.slice(61, 65)).sort(), sdC = sdA.slice(0, 3).concat(names.slice(65, 68)).sort();
    return (wpC = { main: main, sd: [sdA, sdB, sdC], spare: names.slice(70, 90) });
  }
  var atC;
  function atData() {
    if (atC) return atC;
    var r = rng(5656), w = wpData(), pick = shuffle(w.main, r).slice(0, 22), rows = [];
    pick.forEach(function (x, i) {
      var route = 'RT_A' + (200 + between(r, 0, 45)), n = i % 4 === 0 ? 2 : 1;
      for (var j = 0; j < n; j++) rows.push({ t: WP_T[x.ti], name: x.name, route: route, tr: 'DE59' + between(r, 10000000, 99999999) });
    });
    rows.sort(function (a, b) { return a.t < b.t ? -1 : a.t > b.t ? 1 : a.name.localeCompare(b.name); });
    rows.unshift({ t: '06:55 / 14:15', name: w.sd[0][2], route: 'RT_A207', tr: 'DE59' + between(r, 10000000, 99999999), changed: true });
    rows.splice(5, 0, { t: '—', name: null, route: 'RT_A246', tr: 'DE59' + between(r, 10000000, 99999999) });
    var lines = rows.map(function (x) { return x.tr + ' - ' + x.route + ' - A' + Math.floor(r() * 1e12).toString(36).toUpperCase().slice(0, 12); });
    return (atC = { rows: rows, lines: lines, drivers: pick.length });
  }
  // ---------- Timesheets (fictional drivers and hours)
  function hmin(m) { return Math.floor(m / 60) + 'h' + pad(m % 60) + 'm'; }
  function hh(v) { return nf(v, 1) + ' h'; }
  var tsC;
  function tsData() {
    if (tsC) return tsC;
    var r = rng(2626), dim = mEnd(0).getDate(), td = TODAY.getDate(), y = TODAY.getFullYear(), mo = TODAY.getMonth(), c = { dim: dim, td: td };
    var names = shuffle(CPR.map(function (d) { return d.name; }), r).slice(0, 68).sort();
    c.days = []; for (var d = 1; d <= dim; d++) { var dt = dAt(y, mo, d); c.days.push({ d: d, dt: dt, sun: dt.getDay() === 0, dow: dt.getDay() }); }
    c.wd = names.map(function (nm) {
      var start = r() < .15 ? between(r, 1, 6) : 1;
      var cells = c.days.map(function (x) { return x.d >= start && x.d <= td && !x.sun && r() < (x.d === td ? .7 : .86); });
      return { name: nm, cells: cells };
    });
    c.rs = names.filter(function () { return r() < .5; }).slice(0, 34).map(function (nm) {
      var cells = c.days.map(function (x) { return x.d < td && !x.sun && r() < .07 ? between(r, 5, 28) : 0; });
      return { name: nm, cells: cells, days: cells.filter(Boolean).length, stops: cells.reduce(function (a, b) { return a + b; }, 0) };
    });
    c.dp = []; c.ws = [];
    for (var k = td; k >= 1; k--) {
      var x = c.days[k - 1], today = k === td, sat = x.dow === 6, off = x.sun || (sat && r() < .5);
      var std = off ? 0 : between(r, 43, 50), h = off ? 0 : 8 + between(r, 0, 12) / 10, a = off || r() < .3 ? 0 : between(r, 5, 7), b = off || r() < .2 ? 0 : between(r, 7, 14), cc = off || r() < .3 ? 0 : between(r, 3, 8);
      var paid = std * h + a * 6 + b * 3.2 + cc * 4, diff = off ? 0 : (between(r, -45, 70) / 10), flag = !off && !today && r() < .45;
      var row = { x: x, today: today, off: off, std: std, h: h, a: a, b: b, c: cc, routes: std + a + b + cc, paid: paid, worked: today ? 40.6 : paid + diff, diff: diff, rec: today ? 7 : std + a + b + cc - between(r, 0, 4), flag: flag,
        who: names[between(r, 0, names.length - 1)], why: between(r, 0, 2), dh: between(r, 3, 9) / 10 * (r() < .3 ? -1 : 1) };
      c.dp.push(row);
      c.ws.push({ x: x, today: today, off: off, fin: !today && !off, blocks: off || today ? 0 : row.routes, row: row, cx: off || today ? 0 : between(r, 0, 11), chk: paid + between(r, 2, 14), drv: row.routes + between(r, -2, 2),
        km: off || today ? 0 : between(r, 9800, 12700), pk: off || today ? 0 : between(r, 7600, 10300), iss: off || today ? 0 : (r() < .4 ? 1 : 0) });
    }
    var fin = c.ws.filter(function (w) { return w.fin; });
    c.wsK = { paid: fin.reduce(function (a, w) { return a + w.row.paid; }, 0), worked: fin.reduce(function (a, w) { return a + w.row.worked; }, 0), km: fin.reduce(function (a, w) { return a + w.km; }, 0), pk: fin.reduce(function (a, w) { return a + w.pk; }, 0), cx: fin.reduce(function (a, w) { return a + w.cx; }, 0), blocks: fin.reduce(function (a, w) { return a + w.blocks; }, 0), n: fin.length };
    c.ra = [0, 1, 2, 3].map(function (i) { return { d: addD(TODAY, -between(r, 1, Math.max(1, td - 1))), n: names[60 + i], m: names[i * 5], h: hh(9) }; });
    c.cx = fin.slice(0, 6).map(function (w) { return { d: w.x.dt, route: 'RT_A' + between(r, 200, 260), type: r() < .7 ? 'Standard' : 'Sameday B', at: hm(between(r, 360, 540)), pay: hh(w.row.h) }; });
    c.ap = names.slice(0, 13).map(function (nm, i) {
      var acc = i % 3 === 0 ? 'own' : (i % 3 === 1 ? 400 : 200);
      return { name: nm, days: between(r, 2, 25), acc: acc, adv: i % 4 === 1 ? '200' : '', tr: i === 5 || i === 10 ? [ddmm(addD(mStart(-1), 14)).slice(0, 5), ddmm(addD(mStart(-1), 15)).slice(0, 5) + ', ' + ddmm(addD(mStart(-1), 17)).slice(0, 5)] : null,
        vac: i === 0 ? [ddmm(addD(mStart(-1), -1)), ddmm(addD(mStart(-1), 4)), 5] : null, by: CPR[78 + (i % 3)].name, on: ddmm(addD(TODAY, -between(r, 1, 7))) };
    });
    c.afW = [-3, -2, -1, 0].map(function (o) { var st = wkStart(o - 1); return { n: weekInfo(o - 1).n, range: ddmm(st).slice(0, 5) + ' – ' + ddmm(addD(st, 6)).slice(0, 5) }; });
    c.af = names.slice(0, 14).map(function (nm) {
      var wk = c.afW.map(function () { var u = r(); return u < .07 ? null : u < .8 ? 'Fantastic Plus' : u < .9 ? 'Fantastic' : u < .97 ? 'Great' : 'Fair'; });
      if (wk.every(function (q) { return q === null; })) wk[3] = 'Fantastic Plus';
      var b = wk.map(function (s0) { return s0 === null ? null : { 'Fantastic Plus': 14, Fantastic: 10, Great: 5, Fair: 0 }[s0]; }), got = b.filter(function (v) { return v !== null; });
      return { name: nm, wk: wk, b: b, n: got.length, tot: got.reduce(function (a, v) { return a + v; }, 0) };
    }).sort(function (a, b) { return b.tot / b.n - a.tot / a.n || b.n - a.n; });
    c.ksDay = addD(TODAY, -1);
    c.ks = names.slice(0, 18).map(function (nm, i) {
      var s0 = between(r, 380, 860), span = between(r, 160, 640), br = span > 570 ? 45 : span > 360 ? 30 : 0, why = br === 45 ? 3 : br === 30 ? (r() < .5 ? 0 : 1) : 2;
      var x = { name: nm, st: 0, before: hm(s0 + between(r, -20, 20)) + ' – ' + hm(s0 + span + between(r, -15, 15)), after: hm(s0) + ' – ' + hm(s0 + span), span: hmin(span), worked: hmin(span - br), br: br + ' min', month: hmin(between(r, 1500, 2700)), why: why };
      if (i === 3) { x.st = 1; x.after = x.span = x.worked = x.br = '—'; x.why = 4; }
      if (i === 8 || i === 14) { x.st = 2; x.after = '—'; x.why = i === 8 ? 5 : 6; }
      return x;
    });
    return (tsC = c);
  }
  function tsHead(title, sub, extra, btn) {
    return '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + title + '</b><span>' + sub + '</span></div>' + (extra || '') +
      '<span class="ts-mon"><button type="button" disabled>‹</button><span class="dv">' + monthName(0) + ' <span>▾</span></span><button type="button" disabled>›</button></span>' +
      '<span class="cp-btn' + (btn ? ' ts-blue' : '') + '">' + (btn || t('tsXls')) + '</span></div>';
  }
  function tsGridHead(extra) {
    var c = tsData(), D = t('tsDow');
    return '<thead><tr><th class="nm">' + t('tsName') + '</th>' + c.days.map(function (x) { return '<th class="' + (x.sun ? 'sun' : '') + (x.d === c.td ? ' td' : '') + '">' + x.d + '<small>' + D[x.dow] + '</small></th>'; }).join('') + extra + '</tr></thead>';
  }
  function tsCellCls(x, c) { return (x.sun ? 'sun' : '') + (x.d === c.td ? ' td' : ''); }
  function renderWd() {
    var c = tsData();
    return tsHead(t('tsTabs')[0], t('tsWdSub') + ' — ' + monthName(0)) +
      '<div class="m-panel" data-p="tswd"><div class="m-ph"><h4>' + t('tsDrivers', { n: c.wd.length }) + '</h4><span class="ts-sm">' + t('tsDaysIn', { n: c.dim }) + '</span><span class="m-livepill sm"><i></i>' + t('tsLive') + '</span></div><div class="m-search">' + t('tsSearch') + '</div>' +
      '<table class="ts-g">' + tsGridHead('<th class="tot">' + t('tsTotal') + '</th>') + '<tbody>' + c.wd.slice(0, 16).map(function (w, i) {
        return '<tr><td class="nm">' + esc(w.name) + '</td>' + c.days.map(function (x, k) { return '<td class="' + tsCellCls(x, c) + '">' + (w.cells[k] ? '<i class="ts-dot' + (x.d === c.td ? ' live' : '') + '" style="--i:' + (k + i) + '"></i>' : '') + '</td>'; }).join('') +
          '<td class="tot">' + w.cells.filter(Boolean).length + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function renderRs() {
    var c = tsData(), rows = c.rs.slice();
    if (p2.ts.rsSort) rows.sort(function (a, b) { return b.stops - a.stops; });
    return tsHead(t('tsTabs')[1], t('tsRsSub') + ' — ' + monthName(0), '', '↓ ' + t('tsExport')) +
      '<div class="m-panel" data-p="tsrs"><div class="m-ph"><h4>' + t('tsRsN', { n: c.rs.length }) + '</h4><span class="ts-sm">' + t('tsRsNote') + '</span></div><div class="m-search">' + t('tsSearch') + '</div>' +
      '<table class="ts-g rs">' + tsGridHead('<th class="tot">' + t('tsDaysCol') + '</th><th class="tot"><button type="button" class="ts-sort' + (p2.ts.rsSort ? ' on' : '') + '" data-p2-act="rssort">' + t('tsStops') + (p2.ts.rsSort ? ' ↓' : '') + '</button></th>') + '<tbody>' +
      rows.slice(0, 16).map(function (w, i) {
        return '<tr class="row-in" style="--i:' + i + '"><td class="nm">' + esc(w.name) + '</td>' + c.days.map(function (x, k) { return '<td class="' + tsCellCls(x, c) + '">' + (w.cells[k] ? '<span class="ts-n">' + w.cells[k] + '</span>' : '') + '</td>'; }).join('') +
          '<td class="tot">' + w.days + '</td><td class="tot">' + w.stops + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function renderDp() {
    var c = tsData(), C = t('tsDpCols'), W = t('tsDetailWhy');
    var cell = function (n, h) { return n ? '<td class="r"><b>' + n + '</b> <small>× ' + nf(h, 1) + ' h</small><small class="blk">' + nf(n * h, 1) + ' h</small></td>' : '<td class="r mut">0</td>'; };
    var tot = c.dp.reduce(function (a, d) { return { std: a.std + d.std, a: a.a + d.a, b: a.b + d.b, c: a.c + d.c, paid: a.paid + d.paid }; }, { std: 0, a: 0, b: 0, c: 0, paid: 0 });
    return tsHead(t('tsTabs')[2], t('tsDpSub'), '', '↓ ' + t('tsExport')) +
      '<div class="m-panel" data-p="tsdp"><p class="wr-note ts-rule">' + t('tsDpRule') + '</p><table class="m-t ts-dp"><thead><tr>' + C.map(function (x, i) { return '<th' + (i && i < 9 ? ' class="r"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      c.dp.map(function (d, i) {
        var chk = d.off ? '<span class="m-pill">' + t('tsNoCap') + '</span>' : d.flag ? '<button type="button" class="ts-flag" data-p2-act="dpopen" data-v="' + i + '">' + t('tsOther', { n: 1 }) + ' ›</button>' : '<span class="m-pill g">' + t('tsAllOk', { n: d.std }) + '</span>';
        var row = '<tr class="' + (d.x.sun ? 'sunr' : '') + (p2.ts.dpOpen === i ? ' sel' : '') + '"><td><b>' + lday(d.x.dt, { weekday: 'long' }) + '</b><small class="blk">' + ddmm(d.x.dt) + '</small></td>' + cell(d.std, d.h) + cell(d.a, 6) + cell(d.b, 3.2) + cell(d.c, 4) +
          '<td class="r">' + d.routes + '</td><td class="r"><b>' + hh(d.paid) + '</b></td><td class="r">' + (d.off ? '—' : '<b>' + hh(d.worked) + '</b><small class="blk">' + t('tsRecords', { n: d.rec }) + (d.today ? ' · ' + t('tsOngoing') : '') + '</small>') + '</td>' +
          '<td class="r ' + (d.off || d.today ? 'mut' : d.diff >= 0 ? 'neg' : 'pos') + '">' + (d.off || d.today ? '—' : (d.diff >= 0 ? '+' : '−') + hh(Math.abs(d.diff))) + '</td><td>' + chk + '</td></tr>';
        if (p2.ts.dpOpen === i) row += '<tr class="ts-det"><td colspan="10"><span class="da">' + avatar(d.who, 28) + '<b>' + esc(d.who) + '</b></span><span>' + t('tsDetail', { a: hh(d.h), b: hh(d.h + d.dh) }) + '</span><span class="cn-fl amb">' + (d.dh >= 0 ? '+' : '−') + hh(Math.abs(d.dh)) + '</span><span class="ts-why">' + W[d.why] + '</span></td></tr>';
        return row;
      }).join('') + '</tbody></table><div class="m-foot"><b>' + t('tsDpFoot', { n: c.dp.length }) + '</b> · ' + monthName(0) + ' · Standard ' + tot.std + ' · SD A ' + tot.a + ' · SD B ' + tot.b + ' · SD C ' + tot.c + ' · ' + hh(tot.paid) + '</div></div>';
  }
  function wsTabInner() {
    var c = tsData(), tab = p2.ts.wsTab;
    if (tab === 0) {
      var C = t('tsWsCols');
      return '<table class="m-t ts-ws"><thead><tr>' + C.map(function (x, i) { return '<th' + (i > 1 ? ' class="r"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + c.ws.map(function (w, i) {
        var d = w.row;
        return '<tr class="row-in' + (w.x.sun ? ' sunr' : '') + '" style="--i:' + i + '"><td><b>' + lday(w.x.dt, { weekday: 'long' }) + '</b><small class="blk">' + ddmm(w.x.dt) + '</small></td><td><span class="m-pill ' + (w.fin ? 'g' : 'o') + '">' + t(w.fin ? 'tsFinal' : 'tsProv') + '</span></td>' +
          '<td class="r">' + w.blocks + '</td><td class="r">' + w.blocks + '<small class="blk">STD ' + d.std + ' · A ' + d.a + ' · B ' + d.b + ' · C ' + d.c + '</small></td><td class="r">' + (w.cx ? '<span class="ts-cx">' + w.cx + '</span>' : '0') + '</td>' +
          '<td class="r"><b>' + (w.fin ? hh(d.paid) : '0 h') + '</b></td><td class="r">' + (d.off ? '—' : '<b>' + hh(d.worked) + '</b>') + '</td><td class="r ' + (w.fin ? (d.diff >= 0 ? 'neg' : 'pos') : 'mut') + '">' + (w.fin ? (d.diff >= 0 ? '+' : '−') + hh(Math.abs(d.diff)) : '—') + '</td>' +
          '<td class="r">' + (w.fin ? hh(w.chk) + '<small class="blk">' + t('tsDrvN', { n: w.drv }) + '</small>' : '0 h') + '</td><td class="r">' + nf(w.km) + '</td><td class="r">' + (w.pk ? nf(w.pk) : '—') + '</td><td class="r">' + (w.iss ? '<span class="ts-cx">1</span>' : '0') + '</td></tr>';
      }).join('') + '</tbody></table>';
    }
    if (tab === 1) return '<table class="m-t"><thead><tr>' + t('tsRaCols').map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + c.ra.map(function (x, i) { return '<tr class="row-in" style="--i:' + i + '"><td>' + ddmm(x.d) + '</td><td><span class="da">' + avatar(x.n, 24) + '<b>' + esc(x.n) + '</b></span></td><td><span class="da">' + avatar(x.m, 24) + esc(x.m) + '</span></td><td>' + x.h + '</td></tr>'; }).join('') + '</tbody></table>';
    if (tab === 2) return '<table class="m-t"><thead><tr>' + t('tsCxCols').map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + c.cx.map(function (x, i) { return '<tr class="row-in" style="--i:' + i + '"><td>' + ddmm(x.d) + '</td><td class="mono">' + x.route + '</td><td>' + x.type + '</td><td>' + x.at + '</td><td><span class="m-pill g">' + x.pay + '</span></td></tr>'; }).join('') + '</tbody></table>';
    if (tab === 3) return '<p class="cp-empty at-wait">' + t('tsTrEmpty') + '</p>';
    return '<table class="m-t"><thead><tr>' + t('tsKmCols').map(function (x, i) { return '<th' + (i ? ' class="r"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + c.ws.filter(function (w) { return w.fin; }).map(function (w, i) { var pl = w.km - 1100 - i * 37; return '<tr class="row-in" style="--i:' + i + '"><td><b>' + ddmm(w.x.dt) + '</b></td><td class="r">' + nf(pl) + '</td><td class="r">' + nf(w.km) + '</td><td class="r pos">+' + nf(w.km - pl) + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  function renderWs() {
    var c = tsData(), K = t('tsWsK'), KS = t('tsWsKs'), T = t('tsTopics'), k = c.wsK, d = k.worked - k.paid;
    var counts = [null, c.ra.length, c.wsK.cx, 0, '+' + nf(Math.round(k.km * .08))];
    return tsHead(t('tsTabs')[3], t('tsWsSub'), '', '↓ ' + t('tsExport')) +
      '<div class="m-panel" data-p="tsws"><div class="m-ph"><h4>' + t('tsHow') + '</h4><span class="m-cnt">' + t('tsClickTopic') + '</span></div><div class="ts-topics">' +
      T.map(function (x, i) { return '<button type="button" class="hs-f' + (p2.ts.wsTopic === i ? ' on' : '') + '" data-p2-act="topic" data-v="' + i + '">› ' + x[0] + '</button>'; }).join('') + '</div>' +
      (p2.ts.wsTopic >= 0 ? '<p class="rc-hint ts-topic">' + T[p2.ts.wsTopic][1] + '</p>' : '') + '</div>' +
      '<div class="m-panel wr-k wr-k3" data-p="tsws">' + kpi3([[K[0], hh(k.paid), '', '', undefined, 0, KS[0].replace('{n}', k.n).replace('{b}', k.blocks)], [K[1], hh(k.worked), '', '', undefined, 0, KS[1].replace('{n}', k.n)],
        [K[2], (d >= 0 ? '+' : '−') + hh(Math.abs(d)), '', d >= 0 ? 'neg' : 'pos', undefined, 0, KS[2]], [K[3], nf(k.km), '', '', k.km, 0, KS[3]], [K[4], nf(k.pk), '', '', k.pk, 0, KS[4]], [K[5], k.cx, '', 'amb', k.cx, 0, KS[5]]]) + '</div>' +
      '<div class="ts-wtabs" data-p="tswsd">' + t('tsWsTabs').map(function (x, i) { return '<button type="button" class="ts-wt' + (p2.ts.wsTab === i ? ' on' : '') + '" data-p2-act="wstab" data-v="' + i + '">' + x + (counts[i] !== null ? ' <em>' + counts[i] + '</em>' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="m-panel" data-p="tswsd" data-ts="ws">' + wsTabInner() + '</div>';
  }
  function renderAp() {
    var c = tsData(), C = t('tsApCols');
    return tsHead(t('tsTabs')[4], t('tsApSub'), '', '↓ ' + t('tsExport')) +
      '<div class="m-panel" data-p="tsap"><div class="m-ph"><span class="m-search ts-s0">' + t('tsSearch') + '</span><span class="ts-sm">' + t('tsDrivers', { n: c.ap.length * 6 + 4 }) + '</span></div><p class="wr-note">' + t('tsApNote') + '</p>' +
      '<table class="m-t ts-ap"><thead><tr>' + C.map(function (x, i) { return '<th' + (i === 1 ? ' class="r"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + c.ap.map(function (x, i) {
        function ed(col, val, auto) {
          var key = i + ',' + col, v = p2.ts.ap[key] !== undefined ? p2.ts.ap[key] : val, hi = p2.ts.apHi === key;
          if (!v && !auto && !hi) return '<td><button type="button" class="ts-cell" data-p2-act="apedit" data-v="' + key + '" aria-label="Edit"></button></td>';
          return '<td><span class="ts-fill' + (hi ? ' typing-cell' : '') + '" data-ap="' + key + '">' + esc(v) + '</span>' + (auto ? '<small class="blk">' + auto + '</small>' : '') + (hi ? '<small class="ts-saved">' + t('tsSaved') + '</small>' : '') + '</td>';
        }
        var acc = x.acc === 'own' ? t('tsOwn') : String(x.acc);
        return '<tr><td><b>' + esc(x.name) + '</b><small class="blk">' + esc(x.by) + ' · ' + x.on + '</small></td><td class="r">' + x.days + '</td>' + ed(2, acc, x.acc === 'own' ? '' : t('tsAuto', { n: eurc(x.acc) })) + ed(3, x.adv) + ed(4, '') + ed(5, '') + ed(6, '') +
          (x.vac ? '<td><span class="ts-fill">' + t('tsVac', { a: x.vac[0], b: x.vac[1], n: x.vac[2] }) + '</span></td>' : ed(7, '')) + ed(8, '') +
          (x.tr ? '<td class="ts-tr">' + t('tsTrRa', { a: x.tr[0], b: x.tr[1] }) + '<small class="blk">' + t('tsWrite') + '</small></td>' : ed(9, '')) + ed(10, '') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function renderAf() {
    var c = tsData(), W = c.afW, cls = { 'Fantastic Plus': 'fp', Fantastic: 'fa', Great: 'gr', Fair: 'fr' };
    return tsHead(t('tsTabs')[5], t('tsAfSub', { a: W[0].n, b: W[3].n }), '', '↓ ' + t('tsExport')) +
      '<div class="m-panel" data-p="tsaf"><div class="m-ph"><span class="m-search ts-s0">' + t('tsSearch') + '</span><span class="ts-sm">' + t('tsDrivers', { n: 76 }) + '</span></div><p class="wr-note">' + t('tsAfNote') + '</p>' +
      '<table class="m-t ts-af"><thead><tr><th>' + t('tsApCols')[0] + '</th>' + W.map(function (w) { return '<th class="r">' + t('tsWkL', { n: w.n }) + '<small class="blk">' + w.range + '</small></th>'; }).join('') + '<th class="r">' + t('tsAvg') + '</th></tr></thead><tbody>' +
      c.af.map(function (x, i) {
        return '<tr class="row-in" style="--i:' + i + '"><td><b>' + esc(x.name) + '</b></td>' + x.wk.map(function (st, k) { return '<td class="r">' + (st ? '<b>' + x.b[k] + ' €</b><span class="wr-s ' + cls[st] + ' blk">' + st + '</span>' : '') + '</td>'; }).join('') +
          '<td class="r ts-avg"><b>' + nf(x.tot / x.n, x.tot % x.n ? 2 : 0) + ' €</b><small class="blk">' + (x.n === 4 ? t('tsAfTot', { n: x.tot + ' €' }) : t('tsAfOver', { n: x.n, t: x.tot + ' €' })) + '</small></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function ksRows() {
    var c = tsData(), C = t('tsKsCols'), S = t('tsKsSt'), Y = t('tsKsWhy'), syncing = p2.ts.ks === 'run';
    var rows = c.ks.filter(function (x) { return p2.ts.ksF === 'all' || (p2.ts.ksF === 'skipped' ? x.st === 2 : x.st === 0); });
    return '<table class="m-t ts-ks"><thead><tr>' + C.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (x) {
      var done = !syncing || c.ks.indexOf(x) < p2.ts.ksN, cl = ['g', 'b', 'o'][x.st];
      return '<tr class="' + (x.st === 2 ? 'skp' : '') + (done ? '' : ' pend') + '"><td><b>' + esc(x.name) + '</b></td><td>' + (done ? '<span class="m-pill ' + cl + '">' + S[x.st] + '</span>' : '<span class="wr-spin sm"></span>') + '</td><td>' + x.before + '</td><td>' + (done ? x.after : '…') + '</td>' +
        '<td>' + (done ? x.span : '') + '</td><td>' + (done ? x.worked : '') + '</td><td>' + (done ? x.br : '') + '</td><td>' + x.month + '</td><td class="ts-why">' + (done ? Y[x.why].replace('{s}', x.span.replace(/m$/, '')) + ' <i class="ts-i">i</i>' : '') + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function ksKpis() {
    var c = tsData(), K = t('tsKsK'), run = p2.ts.ks === 'run', n = run ? p2.ts.ksN : c.ks.length, done = c.ks.slice(0, n);
    var up = done.filter(function (x) { return x.st === 0; }).length, sk = done.filter(function (x) { return x.st === 2; }).length, extra = Math.round(55 * n / c.ks.length);
    var v = [74, up + extra, sk, 0], f = ['all', 'updated', 'skipped', 'all'];
    return K.map(function (k, i) { return '<button type="button" class="ts-kk' + (i < 3 && p2.ts.ksF === f[i] ? ' on' : '') + '" data-p2-act="ksf" data-v="' + f[i] + '"><small>' + k + '</small><b class="' + ['', 'pos', 'amb', 'neg'][i] + '">' + v[i] + '</b></button>'; }).join('');
  }
  function renderKs() {
    var c = tsData(), run = p2.ts.ks === 'run', day = lday(c.ksDay, { day: 'numeric', month: 'long', year: 'numeric' });
    return '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + t('tsKsT') + '</b><span>' + t('tsKsSub', { d: day }) + '</span></div>' +
      '<span class="ts-mon"><button type="button" disabled>‹</button><span class="dv">' + day + ' <span>▾</span></span><button type="button" disabled>›</button></span>' +
      '<button type="button" class="wr-upbtn ts-sync" data-p2-act="sync"' + (run ? ' disabled' : '') + '>' + (run ? '<span class="wr-spin sm w"></span>' + t('tsSyncing', { a: p2.ts.ksN, b: c.ks.length }) : t('tsSyncNow')) + '</button></div>' +
      '<div class="ts-kks" data-p="tsks" data-ts="kk">' + ksKpis() + '</div>' +
      '<div class="m-panel" data-p="tsks"><div class="m-ph"><h4>' + t('tsKsRes', { d: day }) + '</h4><span class="ts-sm">' + t('tsKsUpd', { d: ddmm(TODAY).slice(0, 5) }) + '</span></div><div class="m-search">' + t('tsSearch') + '</div><div data-ts="ks">' + ksRows() + '</div></div>';
  }
  function p2Prep(id) { // state a step needs before the camera moves; true when the screen must be redrawn
    if (gpPrep(id)) return true;
    if (flPrep(id)) return true;
    var T = p2.ts;
    if (id === 'tsdpd' && T.dpOpen === null) { T.dpOpen = tsData().dp.map(function (d) { return d.flag; }).indexOf(true); return true; }
    if (id === 'tsdp' && T.dpOpen !== null && p2.active !== 'tsdpd') { T.dpOpen = null; return true; }
    if (id === 'tsksx' && T.ksF !== 'skipped') { T.ksF = 'skipped'; return true; }
    if (id === 'tsks' && T.ksF === 'skipped' && p2.active === 'tsksx') { T.ksF = 'all'; return true; }
    return false;
  }
  function tsSet(name, html) { var el = mock2.querySelector('[data-ts="' + name + '"]'); if (el) el.innerHTML = html; }
  // ---------- Fleet (fictional plates, sources and drivers; drawn vans, no real photos)
  var FL_ST = ['use', 'need', 'svc', 'def', 'ret'], FL_C = ['#1E9E5A', '#F5A623', '#2F6BFF', '#E5484D', '#98A2B3'];
  function vanSvg(view, col) {
    col = col || '#EEF1F5';
    if (view === 'front') return '<svg viewBox="0 0 200 120" class="vsv"><rect x="52" y="22" width="96" height="78" rx="14" fill="' + col + '" stroke="#9AA3B1" stroke-width="2"/><path d="M60 32h80l6 30H54z" fill="#3B4A61"/><rect x="74" y="72" width="52" height="14" rx="4" fill="#2B3038"/><rect x="58" y="70" width="14" height="8" rx="3" fill="#FFF3C4"/><rect x="128" y="70" width="14" height="8" rx="3" fill="#FFF3C4"/><rect x="50" y="92" width="100" height="10" rx="4" fill="#2B3038"/><rect x="56" y="100" width="18" height="12" rx="3" fill="#16181C"/><rect x="126" y="100" width="18" height="12" rx="3" fill="#16181C"/><rect x="42" y="44" width="10" height="8" rx="2" fill="#2B3038"/><rect x="148" y="44" width="10" height="8" rx="2" fill="#2B3038"/></svg>';
    if (view === 'back') return '<svg viewBox="0 0 200 120" class="vsv"><rect x="54" y="18" width="92" height="84" rx="10" fill="' + col + '" stroke="#9AA3B1" stroke-width="2"/><path d="M100 20v80" stroke="#9AA3B1" stroke-width="2"/><rect x="62" y="28" width="32" height="20" rx="3" fill="#3B4A61"/><rect x="106" y="28" width="32" height="20" rx="3" fill="#3B4A61"/><rect x="56" y="70" width="8" height="18" rx="2" fill="#E5484D"/><rect x="136" y="70" width="8" height="18" rx="2" fill="#E5484D"/><rect x="52" y="96" width="96" height="8" rx="3" fill="#2B3038"/><rect x="58" y="102" width="18" height="12" rx="3" fill="#16181C"/><rect x="124" y="102" width="18" height="12" rx="3" fill="#16181C"/></svg>';
    return '<svg viewBox="0 0 200 120" class="vsv"><path d="M12 92V44q2-14 16-16h104q12 0 22 10l26 24q8 6 8 16v14q0 4-4 4H16q-4 0-4-4z" fill="' + col + '" stroke="#9AA3B1" stroke-width="2"/><path d="M148 38l26 24h-26z" fill="#3B4A61"/><path d="M104 32v62M146 32v62" stroke="#B9C1CC" stroke-width="1.5"/><rect x="12" y="84" width="176" height="10" rx="3" fill="#2B3038"/><rect x="180" y="70" width="8" height="6" rx="2" fill="#FFF3C4"/><circle cx="46" cy="96" r="13" fill="#16181C"/><circle cx="46" cy="96" r="5" fill="#9AA3B1"/><circle cx="160" cy="96" r="13" fill="#16181C"/><circle cx="160" cy="96" r="5" fill="#9AA3B1"/></svg>';
  }
  var FL_VIEW = [['side', 'flip ang-l'], ['front', ''], ['side', 'ang-r'], ['side', 'flip'], ['side', ''], ['side', 'ang-r2'], ['back', ''], ['side', 'flip ang-l2']];
  var FL_IMG = ['assets/img/fleet/fl.jpg', 'assets/img/fleet/f.jpg', 'assets/img/fleet/fr.jpg', 'assets/img/fleet/l.jpg', 'assets/img/fleet/r.jpg', 'assets/img/fleet/rl.jpg', 'assets/img/fleet/b.jpg', 'assets/img/fleet/rr.jpg'];
  function flPhoto(k) { return FL_IMG[k]; }
  var FL_APPVAN = '<img class="fl-appvan" src="assets/img/fleet/app-van.png" alt="">';
  function vanShot(k) { return '<div class="fl-shot"><img src="' + flPhoto(k) + '" alt=""></div>'; }
  var flC;
  function flData() {
    if (flC) return flC;
    var r = rng(7777), MK = [['Mercedes', 'Sprinter'], ['VW', 'Transporter'], ['MAN', 'TGE'], ['Fiat', 'Ducato'], ['Renault', 'Trafic'], ['Citroën', 'Jumpy']], SRC = ['FleetLease', 'VanRent', 'CityRent'], LOC = ['North depot', 'South depot', 'East depot'];
    function plate() { return 'LN-' + 'ABCDEFGHKLMNPRSTVWXZ'[between(r, 0, 19)] + 'ABCDEFGHKLMNPRSTVWXZ'[between(r, 0, 19)] + ' ' + between(r, 1000, 9899); }
    var issues = ['', 'sliding door problems', 'brake noise — check at service', 'reverse camera not working', 'front right door sticks', '', 'brakes at service / side door', '', '', '', '', '', '', ''];
    var drv = shuffle(CPR.map(function (d) { return d.name; }), r);
    var c = { v: [] };
    for (var i = 0; i < 86; i++) {
      var mk = i < 60 ? MK[0] : MK[between(r, 0, 5)], st = i === 2 || i === 9 ? 'need' : i === 5 || i === 12 ? 'svc' : i === 11 || i === 30 ? 'def' : 'use';
      c.v.push({ plate: plate(), mk: mk, st: st, vin: '…' + between(r, 700000, 739999), iss: issues[i] || '', tuv: i === 4 ? 22 : null, src: SRC[i % 3], loc: LOC[i % 2], joined: addD(TODAY, -between(r, 300, 760)), km: between(r, 360, 540), com: between(r, 40, 112), fill: i % 3 === 0 && i > 14 });
    }
    c.v.sort(function (a, b) { return a.plate < b.plate ? -1 : 1; });
    c.drove = c.v.slice(0, 14).map(function (x, i) { return [0, 1, 2, 3, 4, 5].map(function (k) { return { d: addD(TODAY, -k), n: drv[(i * 3 + k * 7) % drv.length] }; }); });
    c.h = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) {
      var mk = MK[between(r, 0, 5)];
      return { plate: plate(), mk: mk, vin: '…0' + between(r, 10000, 99999), iss: i < 6 ? t('flHIssues')[i % 4] : '', src: SRC[(i + 1) % 3], loc: LOC[i % 3], joined: addD(TODAY, -between(r, 60, 420)), km: i % 3 ? between(r, 900, 82000) : null, ret: addD(TODAY, -Math.floor(i * 1.8) - 1), com: between(r, 1, 18), earlier: i === 7 };
    });
    c.ph = c.v.filter(function (x) { return x.mk[0] === 'Mercedes'; }).slice(0, 16).map(function (x, i) {
      var n = i === 2 || i === 9 ? between(r, 3, 6) : i % 4 === 1 || i === 6 ? 0 : 8;
      return { v: x, drv: drv[40 + i], n: n, dmg: i === 3 ? 0 : i === 11 ? 1 : -1, t0: between(r, 380, 640) };
    });
    return (flC = c);
  }
  function flPill(st) { var i = FL_ST.indexOf(st); return '<span class="fl-st" style="--c:' + FL_C[i] + '"><i></i>' + t('flSt')[i] + ' <small>▾</small></span>'; }
  function flRowsHtml() {
    var c = flData(), F = p2.fl, list = c.v.filter(function (x) { return F.f === 'all' || (F.f === 'fill' ? x.fill : x.st === F.f); });
    var QR = '<span class="fl-qr"><svg viewBox="0 0 12 12" width="11" height="11"><path d="M1 1h4v4H1zM7 1h4v4H7zM1 7h4v4H1zM7 7h2v2H7zM9 9h2v2H9z" fill="currentColor"/></svg></span>';
    return list.slice(0, 13).map(function (x, i) {
      var idx = c.v.indexOf(x), iss = F.add[idx] !== undefined ? F.add[idx] : x.iss;
      return '<tr class="row-in' + (F.hi === idx ? ' add-in' : '') + '" style="--i:' + i + '"><td><b class="fl-pl">' + x.plate + '</b></td><td><b>' + x.mk[0] + '</b><small class="blk">' + x.mk[1] + '</small></td><td>' + flPill(x.st) + '</td><td class="mono">' + x.vin + ' ' + QR + '</td>' +
        '<td>' + (iss ? '<span class="fl-iss' + (F.typing === idx ? ' typing-cell' : '') + '" data-fliss="' + idx + '">⚠ ' + esc(iss) + '</span>' : '<button type="button" class="fl-add" data-p2-act="fladd" data-v="' + idx + '">' + t('flAdd') + '</button>') + '</td>' +
        '<td>' + (x.tuv ? '<b>' + ddmm(addD(TODAY, x.tuv)) + '</b><small class="blk">' + t('flInDays', { n: x.tuv }) + '</small>' : '<span class="fl-add">' + t('flAdd') + '</span>') + '</td><td><span class="fl-add">' + t('flAdd') + '</span></td>' +
        '<td>' + x.src + '<small class="blk">' + x.loc + '</small></td><td><b>' + ddmm(x.joined) + '</b><small class="blk">' + x.km + ' km</small></td>' +
        '<td><button type="button" class="fl-key' + (F.keys[idx] ? ' on' : '') + '" data-p2-act="flkey" data-v="' + idx + '" aria-label="Key">' + (F.keys[idx] ? '✓' : '') + '</button></td>' +
        '<td><button type="button" class="fl-com" data-p2-act="flcom" data-v="' + idx + '">💬 ' + (x.com + (F.extra[idx] || 0)) + '</button></td></tr>';
    }).join('');
  }
  function flDrawer() {
    var c = flData(), idx = p2.fl.open, x = c.v[idx], D = c.drove[Math.min(idx, 13)] || c.drove[0], CM = t('flComDemo');
    return '<div class="rc-back"></div><div class="m-panel rc-dr fl-dr" data-p="fldet"><div class="rc-dh"><div class="rc-fh"><span class="fl-mini">' + FL_APPVAN + '</span><div><small>' + t('flDrawer') + '</small><b>' + x.plate + '</b><span>' + x.mk.join(' ') + ' · ' + x.src + '</span></div></div>' + flPill(x.st) + '<button type="button" class="cp-x" data-p2-act="flclose">×</button></div>' +
      '<div class="rc-sec"><h5>' + t('flDrove') + '</h5><div class="fl-drove">' + D.map(function (q, k) { return '<span style="--i:' + k + '"><small>' + lday(q.d, { weekday: 'short', day: '2-digit', month: '2-digit' }) + '</small>' + avatar(q.n, 24) + '<b>' + esc(q.n) + '</b></span>'; }).join('') + '</div></div>' +
      '<div class="rc-sec"><h5>' + t('flComments') + ' <span class="rc-cnt ok">' + (x.com + (p2.fl.extra[idx] || 0)) + '</span></h5><ul class="cp-tl rc-tl">' + CM.map(function (m, k) { var who = CPR[78 + k].name; return '<li class="' + (k === 2 ? 'cur' : '') + '"><b>' + esc(m) + '</b><span>' + ddmm(addD(TODAY, -6 + k * 2)) + ' · ' + esc(who) + '</span></li>'; }).reverse().join('') + '</ul>' +
      '<button type="button" class="rc-note fl-wr" data-p2-act="flnote" data-v="' + idx + '">' + (p2.fl.noted ? '✓ ' + esc(t('flComDemo')[2]) : t('flWrite')) + '</button></div></div>';
  }
  function renderFl() {
    var c = flData(), K = t('flK'), cnt = { all: c.v.length, fill: c.v.filter(function (x) { return x.fill; }).length };
    FL_ST.forEach(function (s0) { cnt[s0] = c.v.filter(function (x) { return x.st === s0; }).length; });
    var keys = Object.keys(p2.fl.keys).filter(function (k) { return p2.fl.keys[k]; }).length, F = ['all', 'use', 'need', 'svc', 'def', 'ret', 'fill'];
    var h = '<div class="fl-kk" data-p="flsync">' + F.map(function (f, i) { return '<button type="button" class="ts-kk' + (p2.fl.f === f ? ' on' : '') + (f === 'fill' ? ' dash' : '') + '" data-p2-act="flf" data-v="' + f + '"><small>' + (i && i < 6 ? '<i style="background:' + FL_C[i - 1] + '"></i>' : '') + K[i] + '</small><b class="' + (f === 'def' ? 'neg' : f === 'fill' ? 'amb' : '') + '">' + cnt[f] + '</b></button>'; }).join('') + '</div>' +
      '<div class="m-panel" data-p="flsync"><div class="m-ph"><h4>' + t('flVeh', { n: c.v.length }) + '</h4><span class="m-cnt g">' + t('flKeys', { a: keys, b: c.v.length }) + '</span><span class="m-ago">' + t('flAgo', { n: 5 }) + '</span></div><p class="wr-note">' + t('flSynced') + '</p><div class="m-search">' + t('flSearch') + '</div>' +
      '<table class="m-t fl-t" data-p="fldet"><thead><tr><th colspan="2">' + t('flCols')[0] + '</th>' + t('flCols').slice(1).map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody data-fl="rows">' + flRowsHtml() + '</tbody></table></div>';
    if (p2.fl.open !== null) h += flDrawer();
    p2.fl.hi = null;
    return h;
  }
  function renderFh() {
    var c = flData(), K = t('flHK'), list = c.h.filter(function (x, i) { return !p2.fl.back[i]; }), open = list.filter(function (x) { return x.iss; }).length;
    return '<div class="ts-kks">' + [[K[0], list.length], [K[1], list.length], [K[2], ddmm(c.h[0].ret)], [K[3], open]].map(function (k) { return '<div class="ts-kk"><small>' + k[0] + '</small><b>' + k[1] + '</b></div>'; }).join('') + '</div>' +
      (p2.fl.toast ? '<div class="fl-toast">✓ ' + esc(p2.fl.toast) + '</div>' : '') +
      '<div class="m-panel" data-p="flhist"><div class="m-ph"><h4>' + t('flVeh', { n: list.length }) + '</h4><span class="m-ago">' + t('flAgo', { n: 1 }) + '</span></div><div class="m-search">' + t('flSearch') + '</div>' +
      '<table class="m-t fl-t"><thead><tr><th colspan="2">' + t('flHCols')[0] + '</th>' + t('flHCols').slice(1).map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      c.h.map(function (x, i) {
        if (p2.fl.back[i] && p2.fl.leaving !== i) return '';
        return '<tr class="' + (p2.fl.leaving === i ? 'del-out' : '') + '"><td><b class="fl-pl">' + x.plate + '</b></td><td><b>' + x.mk[0] + '</b><small class="blk">' + x.mk[1] + '</small></td><td><span class="fl-st" style="--c:#98A2B3"><i></i>' + t('flSt')[5] + '</span></td><td class="mono">' + x.vin + '</td>' +
          '<td>' + (x.iss ? '<span class="fl-iss">⚠ ' + esc(x.iss) + '</span>' : '<span class="fl-add">' + t('flAdd') + '</span>') + '</td><td>' + x.src + '<small class="blk">' + x.loc + '</small></td>' +
          '<td><b>' + ddmm(x.joined) + '</b>' + (x.km ? '<small class="blk">' + nf(x.km) + ' km</small>' : '<span class="fl-fill">' + t('flToFill') + '</span>') + '</td>' +
          '<td><b>' + ddmm(x.ret) + '</b>' + (x.earlier ? '<span class="m-pill blk2">' + t('flEarlier') + '</span>' : '<button type="button" class="fl-back" data-p2-act="flback" data-v="' + i + '">✓ ' + t('flPutBack') + '</button>') + '</td><td>💬 ' + x.com + '</td></tr>';
      }).join('') + '</tbody></table><div class="m-foot">' + t('flHNote') + '</div></div>';
  }
  function flPhRows() {
    var c = flData();
    return c.ph.map(function (x, i) {
      var n = p2.fl.sent[i] ? 8 : x.n, pill = n === 8 ? '<span class="m-pill g">✓ ' + t('flSentAll', { n: 8 }) + '</span>' : n ? '<span class="m-pill o">' + t('flPart', { n: n }) + '</span>' : '<span class="m-pill r">✕ ' + t('flNone') + '</span>';
      return '<tr class="' + (p2.fl.sent[i] && p2.fl.hiP === i ? 'add-in' : '') + '"><td><b class="fl-pl">' + x.v.plate + '</b></td><td><b>' + x.v.mk.join(' ') + '</b><small class="blk">' + x.v.src + ', ' + x.v.loc + '</small></td><td><span class="fl-st" style="--c:#1E9E5A"><i></i>' + t('flSt')[0] + '</span></td>' +
        '<td><b>' + esc(x.drv) + '</b> <span class="fl-pre">' + t('flPre') + '</span></td><td>' + pill + '</td><td>' + (x.dmg >= 0 && n ? '<span class="cn-fl amb">' + t('flDamage')[x.dmg] + '</span>' : '—') + '</td>' +
        '<td class="r"><button type="button" class="cp-btn fl-vw" data-p2-act="flview" data-v="' + i + '">📷 ' + t('flView') + '</button></td></tr>';
    }).join('');
  }
  function flModal() {
    var c = flData(), x = c.ph[p2.fl.ph], A = t('flAngles'), n = p2.fl.sent[p2.fl.ph] ? 8 : x.n, order = [0, 1, 2, 3, -1, 4, 5, 6, 7];
    return '<div class="rc-back"></div><div class="m-panel fl-modal" data-p="flphv"><div class="rc-dh"><div><b>' + t('flModal', { p: x.v.plate }) + '</b><small>' + x.v.mk.join(' ') + '</small></div><span class="cp-btn">🗑 ' + t('flDelAll') + '</span><button type="button" class="cp-x" data-p2-act="flvclose">×</button></div>' +
      '<div class="fl-mf"><span><small>' + t('flFrom') + '</small><i class="rc-in">dd/mm/yyyy</i></span><span><small>' + t('flTo') + '</small><i class="rc-in">dd/mm/yyyy</i></span><span><small>' + t('mDriver') + '</small><i class="rc-in">' + t('flAllDrv') + ' ▾</i></span><b>' + t('flDays', { n: 3 }) + '</b></div>' +
      '<div class="fl-mb"><div class="fl-grid">' + order.map(function (k, j) {
        if (k < 0) return '<div class="fl-top"><svg viewBox="0 0 60 110" width="54"><rect x="10" y="4" width="40" height="102" rx="12" fill="none" stroke="#9AA3B1" stroke-width="3"/><path d="M15 24q15-8 30 0l-3 12H18z" fill="none" stroke="#9AA3B1" stroke-width="3"/><path d="M18 92h24" stroke="#9AA3B1" stroke-width="3"/></svg></div>';
        var has = k < n || n === 8;
        return '<div class="fl-tile' + (has ? '' : ' miss') + '" style="--i:' + j + '">' + (has ? vanShot(k) + '<span class="tm">' + hm(x.t0 + Math.floor(k / 3)) + '</span>' : '') + '<span class="lb">' + A[k] + '</span></div>';
      }).join('') + '</div><div class="fl-day"><b>' + lday(TODAY, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</b><span class="m-pill ' + (n === 8 ? 'g' : 'o') + '">' + t('flOf8', { n: n }) + '</span><span>' + esc(x.drv) + '</span><span class="cp-btn">🗑 ' + t('flDelDay') + '</span></div></div></div>';
  }
  function flApp() {
    var c = flData(), x = c.ph[p2.fl.appRow], A = t('flFromA'), S = t('flAppSteps'), first = x.drv.split(' ')[0];
    return '<div class="rc-back"></div><div class="fa-wrap" data-p="flapp"><div class="fa-ph"><div class="fa-scr st-home" data-fa>' +
      '<div class="fa-home"><div class="fa-top"><b>LANU</b><i></i></div><div class="fa-req">↗ <span><b>' + t('flAppT') + '</b><small>LANU App</small></span></div><div class="fa-hi">' + avatar(x.drv, 40) + '<span><small>' + lday(TODAY, { weekday: 'long', day: 'numeric', month: 'long' }) + '</small><b>' + t('flHi', { n: esc(first) }) + '</b></span></div>' +
      '<div class="fa-score"><small>' + t('flScore', { n: weekInfo(-1).n }) + '</small><b>91.4</b><span>' + t('flRank') + ' #8</span></div><div class="fa-two"><span><small>' + t('flDaysW') + '</small><b>6</b></span><span><small>' + t('flRescue') + '</small><b>12</b></span></div>' +
      '<div class="fa-veh">' + FL_APPVAN + '<span><small>' + t('flYourVeh') + '</small><b>' + x.v.plate + '</b></span>›<i class="tap"></i></div></div>' +
      '<div class="fa-my"><div class="fa-top"><b>LANU</b><small>' + t('flMyVeh') + '</small></div><h4>' + t('flMyVeh') + '</h4><small class="fa-as">' + t('flAssigned', { p: x.v.plate }) + '</small>' +
      '<div class="fa-card">' + FL_APPVAN + '<b>' + x.v.mk.join(' ') + '</b><span class="m-pill g">' + t('flGood') + '</span><small>' + t('flPicked', { t: hm(x.t0 - 20) }) + '</small><u>' + t('flNotYours') + '</u></div>' +
      '<div class="fa-btn">📷 ' + t('flPhotoBtn') + '<i class="tap"></i></div>' +
      '<div class="fa-stepc"><div class="fa-view" data-fa-view><img src="' + flPhoto(1) + '" alt=""></div><p data-fa-txt>' + t('flStepN', { n: 1, a: A[1] }) + '</p><div class="fa-sb"><span>' + t('flCancel') + '</span><b>' + t('flTakeBtn') + '<i class="tap"></i></b></div><span class="fa-flash"></span></div></div>' +
      '<div class="fa-done"><span>✓</span><b>' + t('flSentOk') + '</b><small>' + t('flSentSub') + '</small><div class="fa-th">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<i style="--i:' + k + '"><img src="' + flPhoto(k) + '" alt=""></i>'; }).join('') + '</div></div>' +
      '</div></div><div class="fa-cap"><small>' + t('flApp') + '</small><b>' + t('flAppT') + '</b><ol>' + S.map(function (q, k) { return '<li data-fa-li="' + k + '">' + q + '</li>'; }).join('') + '</ol></div></div>';
  }
  function renderFp() {
    var c = flData(), K = t('flPK'), sent = c.ph.filter(function (x, i) { return x.n === 8 || p2.fl.sent[i]; }).length * 4 + 1, part = c.ph.filter(function (x, i) { return x.n > 0 && x.n < 8 && !p2.fl.sent[i]; }).length * 3, none = 58 - sent - part;
    var h = '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + t('flPhT') + '</b><span>' + t('flPhSub') + '</span></div><span class="ts-mon"><button type="button" disabled>‹</button><span class="dv">' + t('flToday', { d: lday(TODAY, { day: 'numeric', month: 'long', year: 'numeric' }) }) + ' <span>▾</span></span><button type="button" disabled>›</button></span></div>' +
      '<div class="ts-kks" data-p="flph">' + [[K[0], 58, ''], [K[1], sent, 'pos'], [K[2], part, 'amb'], [K[3], none, 'neg']].map(function (k, i) { return '<div class="ts-kk' + (i === 0 ? ' on' : '') + '"><small>' + k[0] + '</small><b class="' + k[2] + '" data-count="' + k[1] + '">' + k[1] + '</b></div>'; }).join('') + '</div>' +
      '<div class="m-panel" data-p="flph"><div class="m-ph"><h4>' + t('flVeh', { n: 86 }) + '</h4><span class="m-ago">' + t('flAgo', { n: 2 }) + '</span></div><div class="m-search">' + t('flSearchP') + '</div><table class="m-t fl-t"><thead><tr>' + t('flPCols').map(function (x, i) { return '<th' + (i === 0 ? ' colspan="2"' : '') + '>' + x + '</th>'; }).join('').replace('<th>' + t('flPCols')[1] + '</th>', '<th>' + t('flPCols')[1] + '</th>') + '</tr></thead><tbody>' + flPhRows() + '</tbody></table></div>';
    if (p2.fl.ph !== null) h += flModal();
    if (p2.fl.appOn) h += flApp();
    p2.fl.hiP = null;
    return h;
  }
  function flRunApp() {
    var tok = ++p2.tok, scr = mock2.querySelector('[data-fa]'), A = t('flFromA'), ORD = [1, 2, 4, 7, 6, 5, 3, 0], k = 0;
    if (!scr) return;
    function li(n) { mock2.querySelectorAll('[data-fa-li]').forEach(function (el) { el.classList.toggle('on', Number(el.dataset.faLi) <= n); }); }
    function at(ms, fn) { setTimeout(function () { if (tok === p2.tok && p2.fl.appOn) fn(); }, reduce ? 0 : ms); }
    li(0);
    at(700, function () { scr.classList.add('tap1'); li(1); });
    at(1300, function () { scr.className = 'fa-scr st-my'; });
    at(1900, function () { scr.classList.add('tap2'); li(2); });
    at(2300, function () { scr.classList.add('steps'); });
    function shot() {
      if (tok !== p2.tok || !p2.fl.appOn) return;
      if (k >= 8) { scr.className = 'fa-scr st-done'; li(3); p2.fl.sent[p2.fl.appRow] = true; p2.fl.hiP = p2.fl.appRow; return; }
      var v = mock2.querySelector('[data-fa-view]'), tx = mock2.querySelector('[data-fa-txt]'), a = ORD[k];
      if (v) v.innerHTML = '<img src="' + flPhoto(a) + '" alt="">';
      if (tx) tx.textContent = t('flStepN', { n: k + 1, a: A[a] });
      scr.classList.remove('snap'); void scr.offsetWidth; scr.classList.add('snap');
      k++; setTimeout(shot, reduce ? 0 : 480);
    }
    at(2700, shot);
  }
  function flPrep(id) {
    var F = p2.fl, ch = false;
    if (id !== 'fldet' && F.open !== null) { F.open = null; ch = true; }
    if (id === 'fldet' && F.open === null) { F.open = 0; ch = true; }
    if (id !== 'flphv' && F.ph !== null) { F.ph = null; ch = true; }
    if (id === 'flphv' && F.ph === null) { F.ph = 0; ch = true; }
    if (id !== 'flapp' && F.appOn) { F.appOn = false; p2.tok++; ch = true; }
    if (id === 'flapp' && !F.appOn) { F.appOn = true; F.appRow = flData().ph.map(function (x, i) { return x.n === 0 && !F.sent[i]; }).indexOf(true); if (F.appRow < 0) F.appRow = 1; ch = true; }
    return ch;
  }
  // ---------- GPS tracker (fictional town, fictional drivers; positions simulated)
  var GP_W = 880, GP_H = 600, GP_COLS = 14, GP_ROWS = 10, GP_C = ['#1E9E5A', '#F5A623', '#E5484D'], GP_TR = ['#2F6BFF', '#E5484D', '#7C3AED', '#0E9384', '#F5A623', '#DB2777'];
  function gpNode(c, r) { return [40 + c * 61, 34 + r * 59]; }
  var gpC;
  function gpData() {
    if (gpC) return gpC;
    var r = rng(9393), g = { r: r, phones: [] }, names = shuffle(CPR.map(function (d) { return d.name; }), r);
    function walk(c, rr, n) {
      var path = [[c, rr]], pd = null;
      for (var k = 0; k < n; k++) {
        var opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(function (d) { var nc = c + d[0], nr = rr + d[1]; return nc >= 0 && nc < GP_COLS && nr >= 0 && nr < GP_ROWS && !(pd && d[0] === -pd[0] && d[1] === -pd[1]); });
        var d = opts[Math.floor(r() * opts.length)]; if (pd && r() < .55 && opts.some(function (o) { return o[0] === pd[0] && o[1] === pd[1]; })) d = pd;
        c += d[0]; rr += d[1]; pd = d; path.push([c, rr]);
      }
      return path;
    }
    var ST = [0, 0, 0, 0, 0, 0, 0, 1, 1, 2];
    ST.forEach(function (st, i) {
      var start = [between(r, 2, 11), between(r, 2, 7)], route = walk(start[0], start[1], st ? between(r, 14, 22) : between(r, 22, 34));
      g.phones.push({ name: names[i], st: st, route: route, pos: st ? route.length - 1 : route.length - 1 - between(r, 3, 6), moving: !st && i % 3 !== 2, ago: st === 0 ? between(r, 0, 4) : st === 1 ? between(r, 70, 200) : between(r, 300, 1500), t0: hm(between(r, 410, 480)), sim: '+49 1' + between(r, 51, 79) + ' •••• ' + ('000' + between(r, 0, 9999)).slice(-4) });
    });
    return (gpC = g);
  }
  function gpPos(ph) { var a = Math.floor(ph.pos), f = ph.pos - a, n0 = gpNode(ph.route[a][0], ph.route[a][1]), b = ph.route[Math.min(a + 1, ph.route.length - 1)], n1 = gpNode(b[0], b[1]); return [n0[0] + (n1[0] - n0[0]) * f, n0[1] + (n1[1] - n0[1]) * f]; }
  function gpTracePts(ph) { var pts = []; for (var k = 0; k <= Math.floor(ph.pos); k++) pts.push(gpNode(ph.route[k][0], ph.route[k][1])); pts.push(gpPos(ph)); return pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }
  function gpAgo(m) { return m < 1 ? t('gpNow') : t('gpAgo', { t: m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm' }); }
  function gpMapSvg() {
    var g = gpData(), r = rng(4141), P = t('gpPlaces'), h = '<svg class="gp-map" viewBox="0 0 ' + GP_W + ' ' + GP_H + '" width="' + GP_W + '" height="' + GP_H + '"><rect width="' + GP_W + '" height="' + GP_H + '" fill="#EEF0E6"/>';
    for (var c = 0; c < GP_COLS - 1; c++) for (var rr = 0; rr < GP_ROWS - 1; rr++) {
      var a = gpNode(c, rr), u = r(), fill = u < .1 ? '#CFE6C3' : u < .16 ? '#F1DCDC' : u < .22 ? '#E4E0F0' : '#E8E1D6';
      h += '<rect x="' + (a[0] + 7) + '" y="' + (a[1] + 7) + '" width="47" height="45" rx="3" fill="' + fill + '"/>';
      if (fill === '#E8E1D6' && u > .5) h += '<rect x="' + (a[0] + 13) + '" y="' + (a[1] + 13) + '" width="' + between(r, 12, 20) + '" height="' + between(r, 12, 18) + '" fill="#D8CFC2"/><rect x="' + (a[0] + 32) + '" y="' + (a[1] + 26) + '" width="' + between(r, 10, 16) + '" height="' + between(r, 10, 18) + '" fill="#D8CFC2"/>';
    }
    h += '<path d="M-10 470 C120 430 200 520 330 480 S560 380 640 430 S800 520 900 470" fill="none" stroke="#A9D3F0" stroke-width="22"/>';
    for (var k = 0; k < GP_COLS; k++) { var x = gpNode(k, 0)[0], main = k % 5 === 2; h += '<path d="M' + x + ' 0V' + GP_H + '" stroke="' + (main ? '#F6CBA0' : '#fff') + '" stroke-width="' + (main ? 7 : 5) + '"/>'; }
    for (var q = 0; q < GP_ROWS; q++) { var y = gpNode(0, q)[1], mainr = q % 4 === 1; h += '<path d="M0 ' + y + 'H' + GP_W + '" stroke="' + (mainr ? '#F6CBA0' : '#fff') + '" stroke-width="' + (mainr ? 7 : 5) + '"/>'; }
    h += '<path d="M0 90 L' + GP_W + ' 560" stroke="#F2A8B4" stroke-width="8" opacity=".85"/><path d="M0 590 L380 0" stroke="#9AA3B1" stroke-width="3" stroke-dasharray="10 6"/>';
    [[1, 1], [6, 3], [9, 1], [3, 7], [11, 6], [7, 8], [12, 2]].forEach(function (pp, i) { var n = gpNode(pp[0], pp[1]); h += '<text x="' + (n[0] + 30) + '" y="' + (n[1] + 33) + '" text-anchor="middle" class="gp-pl">' + P[i] + '</text>'; });
    h += '<g data-gp-tr></g><g data-gp-mk></g></svg>';
    return h;
  }
  function gpVisible(ph) { var f = p2.gps.f; return f === 'all' || GP_C[ph.st] === GP_C[{ ok: 0, att: 1, old: 2 }[f]]; }
  function gpDraw(anim) {
    var g = gpData(), tr = mock2.querySelector('[data-gp-tr]'), mk = mock2.querySelector('[data-gp-mk]');
    if (!tr || !mk) return;
    tr.innerHTML = p2.gps.sel.map(function (i, k) {
      var ph = g.phones[i], col = GP_TR[k % GP_TR.length], f = gpNode(ph.route[0][0], ph.route[0][1]);
      return '<polyline class="gp-line' + (anim ? ' draw' : '') + '" points="' + gpTracePts(ph) + '" stroke="' + col + '"/><circle cx="' + f[0] + '" cy="' + f[1] + '" r="6" fill="#fff" stroke="#1E9E5A" stroke-width="3"/>';
    }).join('');
    mk.innerHTML = g.phones.map(function (ph, i) {
      if (!gpVisible(ph)) return '';
      var q = gpPos(ph), on = p2.gps.sel.indexOf(i), col = GP_C[ph.st];
      return '<g class="gp-m' + (on >= 0 ? ' on' : '') + '" data-p2-act="gpsel" data-v="' + i + '" transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')">' + (ph.moving && !ph.st ? '<circle r="9" class="gp-pulse" fill="' + col + '"/>' : '') +
        (on >= 0 ? '<circle r="13" fill="none" stroke="' + GP_TR[on % GP_TR.length] + '" stroke-width="4"/>' : '') + '<circle r="8" fill="' + col + '" stroke="#fff" stroke-width="3"/>' +
        (on >= 0 || (p2.active === 'gpmap' && i === 7) ? '<g class="gp-tag"><rect x="-58" y="-40" width="116" height="24" rx="6" fill="#fff"/><text y="-24" text-anchor="middle">' + esc(ph.name) + '</text></g>' : '') + '</g>';
    }).join('');
  }
  function gpListHtml() {
    var g = gpData();
    return g.phones.map(function (ph, i) {
      if (!gpVisible(ph)) return '';
      var on = p2.gps.sel.indexOf(i), st = ['g', 'o', 'r'][ph.st];
      return '<button type="button" class="gp-row' + (on >= 0 ? ' on' : '') + '" data-p2-act="gpsel" data-v="' + i + '" style="' + (on >= 0 ? '--tc:' + GP_TR[on % GP_TR.length] : '') + '"><span class="gp-av">' + avatar(ph.name, 32) + '<i style="background:' + GP_C[ph.st] + '"></i></span>' +
        '<span class="gp-nm"><b>' + esc(ph.name) + '</b><small class="' + st + '" data-gp-ago="' + i + '">' + gpAgo(ph.ago) + '</small><small class="gp-mv">' + (ph.st ? ph.sim : t(ph.moving ? 'gpMoving' : 'gpStanding')) + '</small></span>' +
        '<span class="m-pill ' + st + '">' + t('gpSt')[ph.st] + '</span></button>';
    }).join('');
  }
  function gpCard() {
    var g = gpData(), sel = p2.gps.sel;
    if (!sel.length) return '';
    if (sel.length > 1) return '<div class="gp-card"><b>' + t('gpTraces', { n: sel.length }) + '</b><div class="gp-chips">' + sel.map(function (i, k) { return '<span style="--tc:' + GP_TR[k % GP_TR.length] + '"><i></i>' + esc(g.phones[i].name) + '</span>'; }).join('') + '</div><button type="button" class="hs-f" data-p2-act="gpclear">' + t('gpClear') + '</button></div>';
    var ph = g.phones[sel[0]], n = Math.floor(ph.pos) + 1, pts = n * 4 + 2;
    return '<div class="gp-card"><div class="rc-dh">' + avatar(ph.name, 34) + '<div><b>' + esc(ph.name) + '</b><small>' + t('gpRouteSub') + '</small></div><button type="button" class="cp-x" data-p2-act="gpclear">×</button></div>' +
      '<div class="gp-date"><span>‹</span><b>' + ddmm(TODAY) + '</b><span>›</span></div><button type="button" class="wr-upbtn gp-hide" data-p2-act="gpclear">' + t('gpHide') + '</button>' +
      '<div class="gp-st"><span><small>' + t('gpPts') + '</small><b data-gp-pts>' + pts + '</b></span><span><small>' + t('gpRange') + '</small><b>' + ph.t0 + ' – ' + nowStr().slice(0, 5) + '</b></span><span><small>' + t('gpDist') + '</small><b data-gp-km>≈ ' + nf(n * .9, 1) + ' km</b></span></div>' +
      '<div class="gp-lg"><span><i class="f"></i>' + t('gpFirst') + '</span><span><i class="l"></i>' + t('gpLast') + '</span></div></div>';
  }
  function renderGp() {
    var g = gpData(), K = t('gpK'), KS = t('gpKs'), cnt = [g.phones.length, 0, 0, 0], F = ['all', 'ok', 'att', 'old'];
    g.phones.forEach(function (ph) { cnt[ph.st + 1]++; });
    return '<div class="gp-k" data-p="gpmap">' + K.map(function (k, i) { return '<button type="button" class="ts-kk' + (p2.gps.f === F[i] ? ' on' : '') + '" data-p2-act="gpf" data-v="' + F[i] + '"><small><i style="background:' + (i ? GP_C[i - 1] : '#98A2B3') + '"></i>' + k + '<em>' + KS[i] + '</em></small><b class="' + ['', 'pos', 'amb', 'neg'][i] + '">' + cnt[i] + '</b></button>'; }).join('') + '</div>' +
      '<div class="gp-grid"><div class="m-panel gp-mapw" data-p="gpmap" data-p2b="gptrace">' + gpMapSvg() + '<span class="gp-refit">⤢ ' + t('gpRefit') + '</span><span class="gp-zoom"><i>+</i><i>−</i></span>' +
      '<div class="gp-leg">' + t('gpLegend').map(function (l, i) { return '<span><i style="background:' + GP_C[i] + '"></i>' + l + '</span>'; }).join('') + '</div><div data-gp-card>' + gpCard() + '</div></div>' +
      '<div class="m-panel gp-list" data-p="gplive"><div class="m-ph"><h4>' + t('gpPhones') + '</h4><span class="ts-sm">' + t('gpDev', { n: g.phones.length }) + '</span><span class="m-livepill sm"><i></i>' + t('mLive') + '</span></div><div class="m-search">' + t('gpSearch') + '</div><div data-gp-list>' + gpListHtml() + '</div></div></div>';
  }
  function gpRefresh(anim) { gpDraw(anim); var l = mock2.querySelector('[data-gp-list]'); if (l) l.innerHTML = gpListHtml(); var c = mock2.querySelector('[data-gp-card]'); if (c) c.innerHTML = gpCard(); }
  function gpPrep(id) {
    var want = id === 'gptrace' ? [2] : id === 'gpmulti' ? [0, 3, 5] : id === 'gpmap' || id === 'gplive' ? [] : null;
    if (!want || p2.page !== 'gp' && !P2P.gp.of[id]) return false;
    if (want.join() === p2.gps.sel.join()) return false;
    p2.gps.sel = want; p2.gps.anim = true; return true;
  }
  setInterval(function () { // simulated live positions: moving scanners advance along the streets
    if (!gpC || p2.page !== 'gp' || !mock2 || !mock2.querySelector('[data-gp-mk]')) return;
    var g = gpC, km = 0;
    g.phones.forEach(function (ph) {
      if (!ph.moving || ph.st) return;
      ph.pos += reduce ? 0 : .06;
      if (ph.pos >= ph.route.length - 1) { var last = ph.route[ph.route.length - 1], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(g.r() * 4)]; ph.route.push([Math.max(0, Math.min(GP_COLS - 1, last[0] + d[0])), Math.max(0, Math.min(GP_ROWS - 1, last[1] + d[1]))]); ph.ago = 0; }
    });
    gpDraw(false);
    if (p2.gps.sel.length === 1) { var ph = g.phones[p2.gps.sel[0]], n = Math.floor(ph.pos) + 1, a = mock2.querySelector('[data-gp-pts]'), b = mock2.querySelector('[data-gp-km]'); if (a) a.textContent = n * 4 + 2; if (b) b.textContent = '≈ ' + nf(n * .9, 1) + ' km'; }
  }, 250);
  function p2Nav() {
    return '<div class="hs-nav"><span class="dim">' + t(P2().name) + '</span>' + P2().tabs.map(function (tb, i) {
      return '<button type="button" data-p2-act="tab" data-v="' + tb + '"' + (p2.tab === tb ? ' class="on"' : '') + '>' + t(P2().tabNames)[i] + '</button>';
    }).join('') + '</div>';
  }
  function renderCap() {
    var c = capData(), w0 = c.weeks[0], T = t('plTypes'), K = t('plK'), KS = t('plKs'), TT = t('plT'), TS = t('plTs');
    var h = '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + t('plWeek', { n: w0.n }) + ' <span class="wr-st">· ' + w0.range + '</span></b><span>' + t('plCaptured', { d: ddmm(TODAY), c: '' }) + '</span></div><span class="pl-note">' + t('plExtNote') + '</span></div>';
    h += '<div class="m-panel" data-p="capweeks"><div class="m-ph"><h4>' + t('pl5') + '</h4><span class="m-cnt">' + t('pl5Tag') + '</span></div>' +
      '<p class="pl-have">' + t('plHave', { d: c.drv, v: c.veh, f: c.fleet, u: c.un }) + '</p>' +
      (c.short > 0 ? '<div class="pl-ban">' + t('plNeed', { n: c.short, w: c.peakW.n, day: lday(c.peakW.peak) }) + '</div>' : '') +
      '<div class="pl-wks">' + c.weeks.map(function (w, i) {
        var sd = w.need - w.avail, sv = c.veh - w.need;
        var pill = function (v) { return v > 0 ? '<span class="pl-p r">' + t('plShort', { n: v }) + '</span>' : '<span class="pl-p g">' + t('plOk') + ' +' + (-v) + '</span>'; };
        return '<div class="pl-wk' + (sd > 0 ? ' bad' : '') + '" style="--i:' + i + '"><div class="pl-wh"><b>W' + w.n + '</b><small>' + w.range + '</small></div>' +
          '<div class="pl-l"><span>' + t('plDrivers') + '</span>' + pill(sd) + '</div><div class="pl-v"><b class="' + (sd > 0 ? 'neg' : '') + '" data-count="' + w.need + '">' + w.need + '</b><small>' + t('plYouHave', { n: w.avail }) + '</small></div>' +
          '<div class="pl-l"><span>' + t('plVehicles') + '</span>' + pill(-sv) + '</div><div class="pl-v"><b data-count="' + w.need + '">' + w.need + '</b><small>' + t('plYouHave', { n: c.veh }) + '</small></div>' +
          '<small class="pl-pk">' + t('plPeak', { d: lday(w.peak) }) + '</small><table class="pl-tt"><thead><tr><th></th><th>' + t('plPeakCol') + '</th><th>' + t('plWk') + '</th></tr></thead><tbody>' +
          w.rows.map(function (rw, k) { return '<tr><td>' + T[k] + '</td><td>' + rw[0] + '</td><td>' + rw[1] + '</td></tr>'; }).join('') + '</tbody></table><small class="pl-rule">' + t('plSdRule') + '</small></div>';
      }).join('') + '</div></div>';
    h += '<div class="m-panel wr-k wr-k3" data-p="capkpis">' + kpi3([
      [K[0], pctf(99.62, 2), wrDelta(-0.41, pp(-0.41), true), 'pos', 9962, 1, KS[0].replace('{n}', w0.n - 2)],
      [K[1], 458, '', '', 458, 0, KS[1]], [K[2], 445, '', 'amb', 445, 0, KS[2].replace('{p}', pctf(97.2, 1))],
      [K[3], 500, '', 'pos', 500, 0, KS[3].replace('{n}', '+42')], [K[4], 0, '', '', undefined, 0, KS[4].replace('{a}', 4).replace('{b}', 7)], [K[5], 203, '', '', 203, 0, KS[5]]]) + '</div>' +
      '<div class="m-panel wr-k wr-k3" data-p="capkpis">' + kpi3([
      [TT[0], c.veh + ' <em>/ ' + c.fleet + '</em>', '', 'pos', undefined, 0, TS[0].replace('{a}', 79).replace('{b}', 2).replace('{c}', 2)],
      [TT[1], c.drv, '', '', c.drv, 0, TS[1]], [TT[2], 1, '', '', undefined, 0, TS[2]],
      [TT[3], 66, '', 'pos', 66, 0, TS[3].replace('{n}', 64)], [TT[4], 0, '', 'pos', undefined, 0, TS[4]], [TT[5], 0, '', 'pos', undefined, 0, TS[5]]]) + '</div>';
    var DC = t('plDayCols'), sg = function (v, sun) { return sun ? '<td class="r mut">—</td>' : '<td class="r ' + (v < 0 ? 'neg' : 'pos') + '"><b>' + (v > 0 ? '+' : v < 0 ? '−' : '+') + Math.abs(v) + '</b></td>'; };
    h += '<div class="m-panel" data-p="capdays"><div class="m-ph"><h4>' + t('plNeedRes') + '</h4><span class="m-cnt">' + t('plNeedTag') + '</span></div><p class="wr-note">' + t('plRule') + '</p><p class="pl-sub">' + t('plByDay') + '</p>' +
      '<table class="m-t dense pl-days"><thead><tr>' + DC.map(function (x, i) { return '<th' + (i ? ' class="r"' : '') + '>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      c.days.map(function (d, i) {
        return '<tr class="' + (i === 0 ? 'today' : '') + (d.sun ? ' dim' : '') + '"><td><b>' + lday(d.d, { weekday: 'long' }) + '</b><small>' + ddmm(d.d) + '</small></td><td class="r">' + d.tgt + '</td><td class="r"><b>' + d.need + '</b>' + (d.sun ? '' : ' <small>SD</small>') + '</td><td class="r">' + d.sch + '</td><td class="r">' + d.av + '</td><td class="r">' + (d.leave || '—') + '</td>' +
          sg(d.av - d.need, d.sun) + '<td class="r">' + d.vn + '</td>' + sg(c.veh - d.vn, d.sun) + '</tr>';
      }).join('') + '</tbody></table></div>';
    return h;
  }
  function wpTable(rows) {
    return '<table class="wp-t"><thead><tr><th>' + t('plName') + '</th><th>' + t('plTimeInfo') + '</th></tr></thead><tbody>' + rows.map(function (x) {
      var bg = x.sb ? '#E3E7EE' : WP_PAL[p2.colors[x.ti]];
      return '<tr class="' + (x.sb && p2.hi === x.name ? 'add-in' : '') + '" style="background:' + bg + '"><td>' + esc(x.name) + '</td><td>' + (x.sb ? x.time + ' · ' + t('plSbInfo') : WP_T[x.ti] + ':00') + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function renderWp() {
    var w = wpData(), main = w.main, half = Math.ceil(main.length / 2), counts = [0, 1, 2].map(function (k) { return main.filter(function (x) { return x.ti === k; }).length; });
    var shifts = w.sd[0].length + w.sd[1].length + w.sd[2].length, sdDrv = {};
    w.sd.forEach(function (l) { l.forEach(function (n) { sdDrv[n] = 1; }); });
    var h = '<div class="m-panel m-date m-week"><span class="ci">' + ICAL + '</span><div><b>' + lday(TODAY, { weekday: 'long', day: '2-digit', month: 'short' }) + ' <span class="m-pill b">' + t('plToday') + '</span></b><span>' + t('plWpSub', { a: main.length, b: shifts, d: ddmm(addD(TODAY, -1)) }) + '</span></div>' +
      '<div class="m-dnav"><button type="button" disabled>‹</button><button type="button" disabled>›</button></div></div>';
    h += '<div class="m-panel wp-sum" data-p="wpauto"><div class="wp-tot"><small>' + t('plTotal') + '</small><b data-count="' + (main.length + 26) + '">' + (main.length + 26) + '</b></div>' +
      '<div class="wp-load"><small>' + t('plByLoad') + '</small><div class="wp-chips">' + WP_T.map(function (tm, k) {
        return '<button type="button" class="wp-chip" data-p2-act="color" data-v="' + k + '"><i style="background:' + WP_PAL[p2.colors[k]] + '"></i><span><b>' + counts[k] + '</b>' + tm + '</span></button>';
      }).join('') + '</div><span class="wp-hint">' + t('plColorHint') + '</span></div>' +
      '<div class="wp-sd"><small>' + t('plSameday') + '</small><div>' + w.sd.map(function (l, k) { return '<span><b>' + l.length + '</b>' + t('plTypes')[k + 1] + ' · ' + SD_T[k] + '</span>'; }).join('') + '</div></div></div>';
    var right = main.slice(half).concat(p2.sb.map(function (x) { return { name: x.name, time: x.time, sb: true }; }));
    h += '<div class="m-panel" data-p="wpplan"><div class="m-ph"><h4>' + t('plMain') + '</h4><span class="m-cnt">' + t('plDrvN', { n: main.length + p2.sb.length }) + '</span>' +
      '<span class="wp-btns">' + (p2.saved ? '<span class="wr-saved">✓ ' + t('plSaved', { f: p2.saved }) + '</span>' : '') + '<button type="button" class="cp-btn" data-p2-act="save" data-v="png">' + t('plImg') + '</button><button type="button" class="cp-btn" data-p2-act="save" data-v="xlsx">' + t('plXls') + '</button></span></div>' +
      '<div class="wp-plan">' + wpTable(main.slice(0, half)) + wpTable(right) + '</div></div>';
    h += '<div class="m-panel" data-p="wpsd"><div class="m-ph"><h4>' + t('plStandby') + '</h4><span class="m-cnt">' + p2.sb.length + '</span><span class="m-ago">' + t('plSbNote') + '</span></div>' +
      '<div class="wp-sbf"><span class="rc-in">' + esc(w.spare[p2.sb.length % w.spare.length]) + '</span><span class="rc-in sm">10:30</span><button type="button" class="wr-upbtn" data-p2-act="sb">+ ' + t('plAdd') + '</button></div>' +
      (p2.sb.length ? '<div class="wp-sbl">' + p2.sb.map(function (x, i) { return '<span class="hs-p' + (p2.hi === x.name ? ' add-in' : '') + '">' + avatar(x.name, 24) + esc(x.name) + ' · ' + x.time + ' <button type="button" class="wp-x" data-p2-act="sbdel" data-v="' + i + '">×</button></span>'; }).join('') + '</div>' : '<p class="cp-empty">' + t('plSbEmpty') + '</p>') + '</div>';
    var mx = Math.max.apply(null, w.sd.map(function (l) { return l.length; }));
    h += '<div class="m-panel" data-p="wpsd"><div class="m-ph"><h4>' + t('plSameday') + '</h4><span class="m-cnt">' + t('plSdTag', { a: Object.keys(sdDrv).length, b: shifts }) + '</span><span class="wp-btns"><span class="cp-btn">' + t('plImg') + '</span><span class="cp-btn">' + t('plXls') + '</span></span></div>' +
      '<div class="wp-sdg">' + w.sd.map(function (l, k) {
        var rows = ''; for (var i = 0; i < mx; i++) rows += '<tr><td>' + (l[i] ? esc(l[i]) : '') + '</td><td>' + (l[i] ? SD_T[k] : '') + '</td></tr>';
        return '<table class="wp-sdt"><thead><tr><th colspan="2">' + t('plTypes')[k + 1].toUpperCase() + '</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }).join('') + '</div></div>';
    return h;
  }
  function renderAt() {
    var a = atData(), C = t('plCols'), done = p2.at === 'done', busy = p2.at === 'busy';
    var h = '<div class="m-panel m-date m-week"><div><b>' + lday(TODAY, { weekday: 'long', day: '2-digit', month: 'short' }) + '</b><span>' + t('plAtDay', { d: ddmm(addD(TODAY, -1)).slice(0, 5) }) + '</span></div></div>';
    h += '<div class="m-panel" data-p="atpaste"><div class="m-ph"><h4>' + t('plPaste') + '</h4><span class="m-ago">' + t('plPasteNote') + '</span></div>' +
      '<div class="at-ta' + (p2.at === 'empty' ? ' ph' : '') + '" data-at-ta>' + (p2.at === 'empty' ? t('plPh') + '<br>' + a.lines[1] : a.lines.slice(0, 9).join('<br>') + '<br>…') + '</div>' +
      '<div class="wr-up-row"><button type="button" class="wr-upbtn" data-p2-act="process">' + t('plProcess') + '</button><button type="button" class="at-clr" data-p2-act="clear">' + t('plClear') + '</button>' +
      (busy ? '<div class="wr-prog"><span class="wr-spin"></span><b>' + t('plProcessing') + '</b><span class="tr"><i class="at-bar"></i></span></div>' : '') + '</div></div>';
    var unknown = a.rows.filter(function (x) { return !x.name; }).length;
    h += '<div class="m-panel" data-p="atlist"><div class="m-ph"><h4>' + t('plPk') + '</h4><span class="m-cnt">' + (done ? a.rows.length : 0) + '</span>' + (done ? '<span class="at-sub">' + t('plPkSub', { n: a.drivers }) + ' · <b>' + t('plNoPlan', { n: unknown }) + '</b></span>' : '') +
      '<button type="button" class="wr-upbtn at-copy" data-p2-act="copy"' + (done ? '' : ' disabled') + '>' + (p2.copied ? t('plCopied') : t('plCopy')) + '</button></div>' +
      (done ? '<table class="m-t at-t"><thead><tr>' + C.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + a.rows.slice(0, 16).map(function (x, i) {
        var ch = x.changed || p2.edits[i];
        return '<tr class="row-in' + (!x.name ? ' warn' : '') + (p2.hi === i ? ' add-in' : '') + '" style="--i:' + i + '"><td><b>' + x.t + '</b></td><td>' + (x.name ? '<button type="button" class="at-drv" data-p2-act="edit" data-v="' + i + '">' + esc(x.name) + '</button>' + (ch ? ' <span class="at-ch">' + t('plChanged') + '</span>' : '') : '<span class="at-unk">' + t('plUnknown') + '</span>') + '</td><td>' + x.route + '</td><td class="mono">' + x.tr + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="cp-empty at-wait">' + t('plWaiting') + '</p>') + '</div>';
    return h;
  }
  function p2Render() {
    if (!mock2) return;
    var R = { cap: renderCap, wp: renderWp, at: renderAt, wd: renderWd, rs: renderRs, dp: renderDp, ws: renderWs, ap: renderAp, af: renderAf, ks: renderKs, fv: renderFl, fh: renderFh, fp: renderFp, gp: renderGp };
    mock2.innerHTML = topBar(t(P2().name)) + p2Nav() + '<div class="m-body">' + R[p2.tab]() + '</div>';
    p2.hi = null;
    if (p2.tab === 'gp') { gpDraw(p2.gps.anim); p2.gps.anim = false; }
    document.getElementById('url2').textContent = 'board.lanu.app/' + P2().base + '/' + P2().url[p2.tab];
    p2Layout();
  }
  function p2Layout() { mock2.style.transform = 'translate(' + (-p2.cam.x) + 'px,' + (-p2.cam.y) + 'px) scale(' + p2.cam.z + ')'; }
  function p2RenderSteps() {
    var all = t(P2().steps), html = '', n = 0, li = 0;
    P2().tabs.forEach(function (tb, gi) {
      var grp = all.filter(function (x) { return P2().of[x[0]] === tb; }), from = n + 1, open = tb === p2.tab;
      n += grp.length;
      html += '<li class="step-grp' + (open ? ' on' : '') + '" style="--i:' + (li++) + '"><button type="button" data-p2grp="' + tb + '" aria-expanded="' + open + '"><span class="g-t">' + t(P2().tabNames)[gi] + '</span><em>' + from + '–' + n + '</em><span class="g-c">' + (open ? '−' : '+') + '</span></button></li>';
      if (open) grp.forEach(function (x, k) {
        html += '<li style="--i:' + (li++) + '" class="step' + (x[0] === p2.active ? ' on' + (p2.auto ? ' auto' : '') : '') + '"><button type="button" data-p2step="' + x[0] + '" aria-current="' + (x[0] === p2.active) + '">' +
          '<span class="n">' + (from + k) + '</span><span><span class="t">' + esc(x[1]) + '</span><span class="d">' + esc(x[2]) + '</span></span><span class="prog" style="--dur:' + DUR + 'ms"></span></button></li>';
      });
    });
    steps2.innerHTML = html;
    var cur = all.filter(function (x) { return x[0] === p2.active; })[0];
    now2.innerHTML = '<b>' + esc(cur[1]) + '</b><p>' + esc(cur[2]) + '</p>';
  }
  function p2Focus(id, keep, quiet) {
    if (!mock2) return;
    var pg = P2P[p2.page].of[id] ? p2.page : P2ORDER.filter(function (k) { return P2P[k].of[id]; })[0], pageCh = pg !== p2.page;
    if (pageCh) {
      p2.page = pg; p2.tab = null;
      document.querySelectorAll('[data-page2]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.page2 === pg)); });
      p2Ind();
    }
    var tab = P2().of[id];
    if (p2Prep(id) && tab === p2.tab) p2Render();
    if (tab !== p2.tab) {
      p2.tab = tab;
      if (!reduce) { document.getElementById('fx2-t').textContent = pageCh ? t(P2().name) : t(P2().tabNames)[P2().tabs.indexOf(tab)]; screen2.classList.remove('warp'); void screen2.offsetWidth; screen2.classList.add('warp'); setTimeout(function () { screen2.classList.remove('warp'); }, 1400); }
      p2Render();
    }
    if (id === 'atlist' && p2.at !== 'done') { p2.at = 'done'; p2Render(); }
    p2.active = id;
    p2RenderSteps();
    var tid = P2ALIAS[id] || id;
    mock2.querySelectorAll('[data-p]').forEach(function (el) { el.classList.toggle('on', el.dataset.p === tid); });
    mock2.classList.add('focus');
    var targets = mock2.querySelectorAll('[data-p="' + tid + '"]'), bx = boxIn(targets, mock2), l = bx.l, tp = bx.t, r = bx.r, b = bx.b;
    var W = screen2.clientWidth, H = screen2.clientHeight, pw = r - l;
    var z = Math.max(W / 1280, Math.min(1, (W - 32) / pw, Math.max(W / 1280, (H - 32) / (b - tp))));
    var x = Math.max(0, Math.min(1280 * z - W, l * z - (W - pw * z) / 2));
    p2.cam = { z: z, x: x, y: Math.max(0, tp * z - 16) };
    p2Layout();
    if (!reduce && !quiet) {
      targets.forEach(function (el) {
        el.classList.remove('sweep'); void el.offsetWidth; el.classList.add('sweep');
        el.querySelectorAll('[data-count]').forEach(function (c) { countUp(c, Number(c.dataset.count), c.dataset.f === 'pct' ? function (v) { return pctf(v / 100, 2); } : fmt, 1100); });
      });
    }
    if (id === 'tsap' && p2.auto && !quiet) setTimeout(function () { if (p2.active === 'tsap' && p2.auto) p2Action('apedit', '3,4'); }, 1800);
    if (id === 'flapp' && !quiet) setTimeout(function () { if (p2.active === 'flapp') flRunApp(); }, 200);
    if (id === 'tsks' && p2.auto && !quiet) setTimeout(function () { if (p2.active === 'tsks' && p2.auto) p2Action('sync'); }, 1500);
    if (id === 'atpaste' && p2.auto && p2.at === 'empty' && !quiet) setTimeout(function () { if (p2.active === 'atpaste' && p2.at === 'empty' && p2.auto) p2Process(); }, 1600);
    if (!keep && window.innerWidth <= 980) { var bt = steps2.querySelector('.step.on button'); if (bt) bt.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
    p2Schedule();
  }
  function p2Schedule() {
    clearTimeout(p2.timer);
    if (!p2.auto || !p2.inView) return;
    p2.timer = setTimeout(function () {
      var ids = []; P2ORDER.forEach(function (k) { t(P2P[k].steps).forEach(function (x) { ids.push(x[0]); }); });
      p2Focus(ids[(ids.indexOf(p2.active) + 1) % ids.length], true);
    }, DUR);
  }
  function p2Stop() { p2.auto = false; clearTimeout(p2.timer); var on = steps2.querySelector('.auto'); if (on) on.classList.remove('auto'); }
  function p2Process() {
    var tok = ++p2.tok, a = atData(), ta = mock2.querySelector('[data-at-ta]');
    if (!ta) return;
    p2.at = 'typing'; ta.classList.remove('ph'); ta.innerHTML = '';
    var i = 0, iv = setInterval(function () {
      if (tok !== p2.tok) { clearInterval(iv); return; }
      ta.innerHTML += (i ? '<br>' : '') + a.lines[i]; i++;
      if (i >= 9 || reduce) {
        clearInterval(iv); p2.at = 'busy'; p2Render(); p2Focus('atpaste', true, true);
        var bar = mock2.querySelector('.at-bar'); if (bar) setTimeout(function () { bar.style.width = '100%'; }, 30);
        setTimeout(function () { if (tok !== p2.tok) return; p2.at = 'done'; p2Render(); p2Focus('atlist', true); }, reduce ? 0 : 1100);
      }
    }, 110);
  }
  function p2Action(act, v) {
    if (act === 'tab') { p2Focus(P2().first[v], true); return; }
    if (act === 'gpsel') { var gi = Number(v), at = p2.gps.sel.indexOf(gi); if (at >= 0) p2.gps.sel.splice(at, 1); else p2.gps.sel.push(gi); gpRefresh(true); p2.active = p2.gps.sel.length > 1 ? 'gpmulti' : p2.gps.sel.length ? 'gptrace' : 'gplive'; p2RenderSteps(); p2Schedule(); return; }
    if (act === 'gpclear') { p2.gps.sel = []; gpRefresh(false); return; }
    if (act === 'gpf') { p2.gps.f = v; p2.gps.sel = p2.gps.sel.filter(function (i) { return gpVisible(gpData().phones[i]); }); p2Render(); p2Focus('gpmap', true, true); return; }
    if (act === 'flf') { p2.fl.f = v; p2Render(); p2Focus('flsync', true, true); return; }
    if (act === 'flkey') { p2.fl.keys[v] = !p2.fl.keys[v]; p2Render(); p2Focus(p2.active, true, true); return; }
    if (act === 'fladd') {
      var tk = ++p2.tok, txt = t('flDemoIssue'), j = 0, ix = Number(v);
      p2.fl.add[ix] = ''; p2.fl.typing = ix; p2.fl.add[ix] = ' '; p2Render(); p2Focus(p2.active === 'fldet' ? 'fldet' : 'flsync', true, true);
      var el = mock2.querySelector('[data-fliss="' + ix + '"]');
      var iv = setInterval(function () { if (tk !== p2.tok || !el) { clearInterval(iv); return; } p2.fl.add[ix] = txt.slice(0, ++j); el.textContent = '⚠ ' + p2.fl.add[ix]; if (j >= txt.length) { clearInterval(iv); p2.fl.typing = null; el.classList.remove('typing-cell'); } }, reduce ? 1 : 40);
      return;
    }
    if (act === 'flcom') { p2.fl.open = Number(v); p2.fl.noted = false; p2Render(); p2.active = 'fldet'; p2Focus('fldet', true, true); return; }
    if (act === 'flclose') { p2.fl.open = null; p2Render(); p2.active = 'flsync'; p2Focus('flsync', true, true); return; }
    if (act === 'flnote') { p2.fl.noted = true; p2.fl.extra[v] = (p2.fl.extra[v] || 0) + 1; p2Render(); p2Focus('fldet', true, true); return; }
    if (act === 'flback') {
      var i2 = Number(v), plate = flData().h[i2].plate; p2.fl.leaving = i2; p2.fl.back[i2] = true; p2Render(); p2Focus('flhist', true, true);
      setTimeout(function () { p2.fl.leaving = null; p2.fl.toast = t('flBack', { p: plate }); if (p2.tab === 'fh') { p2Render(); p2Focus('flhist', true, true); } }, 350);
      return;
    }
    if (act === 'flview') { p2.fl.ph = Number(v); p2Render(); p2.active = 'flphv'; p2Focus('flphv', true, true); return; }
    if (act === 'flvclose') { p2.fl.ph = null; p2Render(); p2.active = 'flph'; p2Focus('flph', true, true); return; }
    if (act === 'rssort') { p2.ts.rsSort = !p2.ts.rsSort; p2Render(); p2Focus('tsrs', true, true); return; }
    if (act === 'dpopen') { p2.ts.dpOpen = p2.ts.dpOpen === Number(v) ? null : Number(v); p2Render(); p2.active = 'tsdpd'; p2Focus(p2.ts.dpOpen === null ? 'tsdp' : 'tsdpd', true, true); return; }
    if (act === 'topic') { p2.ts.wsTopic = p2.ts.wsTopic === Number(v) ? -1 : Number(v); p2Render(); p2Focus('tsws', true, true); return; }
    if (act === 'wstab') { p2.ts.wsTab = Number(v); tsSet('ws', wsTabInner()); mock2.querySelectorAll('.ts-wt').forEach(function (b, i) { b.classList.toggle('on', i === p2.ts.wsTab); }); p2Focus('tswsd', true, true); return; }
    if (act === 'apedit') {
      var col = Number(v.split(',')[1]), demo = t('tsDemo')[col] || '200', tok = ++p2.tok;
      p2.ts.ap[v] = ''; p2.ts.apHi = v; p2Render(); p2Focus('tsap', true, true);
      var el = mock2.querySelector('[data-ap="' + v + '"]'), j = 0;
      if (!el) return;
      var sv0 = el.parentNode.querySelector('.ts-saved'); if (sv0) sv0.style.opacity = 0;
      var iv = setInterval(function () {
        if (tok !== p2.tok) { clearInterval(iv); return; }
        el.textContent = demo.slice(0, ++j); p2.ts.ap[v] = el.textContent;
        if (j >= demo.length) { clearInterval(iv); var sv = el.parentNode.querySelector('.ts-saved'); if (sv) sv.style.opacity = 1; el.classList.remove('typing-cell'); }
      }, reduce ? 1 : 70);
      return;
    }
    if (act === 'ksf') { p2.ts.ksF = v === 'skipped' ? 'skipped' : v === 'updated' ? 'updated' : 'all'; tsSet('kk', ksKpis()); tsSet('ks', ksRows()); p2.active = p2.ts.ksF === 'skipped' ? 'tsksx' : 'tsks'; p2Focus(p2.active, true, true); return; }
    if (act === 'sync') {
      if (p2.ts.ks === 'run') return;
      var n = tsData().ks.length, tk = ++p2.tok; p2.ts.ks = 'run'; p2.ts.ksN = 0; p2.ts.ksF = 'all'; p2Render(); p2Focus('tsks', true, true);
      var iv2 = setInterval(function () {
        if (tk !== p2.tok) { clearInterval(iv2); p2.ts.ks = 'done'; return; }
        p2.ts.ksN++;
        if (p2.ts.ksN >= n) { clearInterval(iv2); p2.ts.ks = 'done'; if (p2.tab === 'ks') { p2Render(); p2Focus(p2.active, true, true); } return; }
        if (p2.tab !== 'ks') return;
        tsSet('kk', ksKpis()); tsSet('ks', ksRows()); var sb = mock2.querySelector('.ts-sync'); if (sb) sb.innerHTML = '<span class="wr-spin sm w"></span>' + t('tsSyncing', { a: p2.ts.ksN, b: n });
      }, reduce ? 1 : 180);
      return;
    }

    if (act === 'color') { var k = Number(v), used = p2.colors, nx = (used[k] + 1) % WP_PAL.length; while (used.indexOf(nx) >= 0) nx = (nx + 1) % WP_PAL.length; used[k] = nx; p2Render(); p2Focus('wpauto', true, true); return; }
    if (act === 'save') { p2.saved = 'plan-' + ddmm(TODAY).slice(0, 5).replace('.', '-') + '.' + v; p2Render(); p2Focus('wpplan', true, true); return; }
    if (act === 'sb') { var w = wpData(), nm = w.spare[p2.sb.length % w.spare.length]; p2.sb.push({ name: nm, time: '10:30' }); p2.hi = nm; p2Render(); p2.hi = null; p2Focus('wpsd', true, true); return; }
    if (act === 'sbdel') { p2.sb.splice(Number(v), 1); p2Render(); p2Focus('wpsd', true, true); return; }
    if (act === 'process') { if (p2.at === 'empty') p2Process(); else { p2.at = 'done'; p2Focus('atlist', true); } return; }
    if (act === 'clear') { p2.tok++; p2.at = 'empty'; p2.copied = false; p2.edits = {}; p2Render(); p2Focus('atpaste', true, true); return; }
    if (act === 'copy') { p2.copied = true; p2Render(); p2Focus('atlist', true, true); setTimeout(function () { p2.copied = false; var b = mock2.querySelector('.at-copy'); if (b) b.textContent = t('plCopy'); }, 2200); return; }
    if (act === 'edit') {
      var rows = atData().rows, i = Number(v), main = wpData().main, cur = main.map(function (x) { return x.name; }).indexOf(rows[i].name);
      rows[i].name = main[(cur + 7) % main.length].name; p2.edits[i] = true; p2.hi = i; p2Render(); p2Focus('atlist', true, true);
    }
  }
  function p2Ind() { var b = document.querySelector('[data-page2][aria-selected="true"]'), ind = document.getElementById('pages2-ind'); if (b && ind) { ind.style.left = b.offsetLeft + 'px'; ind.style.width = b.offsetWidth + 'px'; ind.style.top = b.offsetTop + 'px'; ind.style.height = b.offsetHeight + 'px'; } }
  if (mock2) {
    mock2.addEventListener('click', function (e) { var b = e.target.closest('[data-p2-act]'); if (!b || b.disabled) return; p2Stop(); p2Action(b.dataset.p2Act, b.dataset.v); });
    steps2.addEventListener('click', function (e) {
      var g = e.target.closest('[data-p2grp]'), b = e.target.closest('[data-p2step]');
      if (!g && !b) return;
      p2Stop();
      if (g) { if (g.dataset.p2grp !== p2.tab) p2Focus(P2().first[g.dataset.p2grp]); return; }
      p2Focus(b.dataset.p2step);
    });
    document.querySelectorAll('[data-page2]').forEach(function (b) { b.addEventListener('click', function () { var pg = P2P[b.dataset.page2]; p2Stop(); p2Focus(pg.first[pg.tabs[0]], true); }); });
    new IntersectionObserver(function (en) { p2.inView = en[0].isIntersecting; if (p2.inView) { p2RenderSteps(); p2Schedule(); } else clearTimeout(p2.timer); }, { threshold: .35 }).observe(document.getElementById('planning'));
    window.addEventListener('resize', function () { p2Ind(); p2Focus(p2.active, true, true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { p2Ind(); p2Focus(p2.active, true, true); });
    if ('ResizeObserver' in window) { var scr2Sz = ''; new ResizeObserver(function () { var k = screen2.clientWidth + 'x' + screen2.clientHeight; if (k !== scr2Sz) { var first = !scr2Sz; scr2Sz = k; if (!first) p2Focus(p2.active, true, true); } }).observe(screen2); }
  }

  // ------------------------------------------------------------------ Income Overview: owner dashboard that recalculates live (fictional figures)
  var OW = { per: 1, mode: 'money', contr: true, vat: false, rates: [28, 32, 28, 28, 75, 15.7, 30, 19], veh: [], exp: [], topic: -1, step: 0, auto: !reduce, inView: false, timer: null, prev: {}, hover: -1, tok: 0 };
  var OW_STEP = [1, 1, 1, 0.5, 5, 0.1, 1, 1], OW_FLEET = 50;
  var OW_VEH = [[0, 26, 520], [1, 14, 790], [2, 50, 80], [3, 0, 1450], [4, 0, 1800], [5, 0, 620]], OW_EXP = [1800, 450, 900, 640, 380];
  var owDaysC;
  function owDays() {
    if (owDaysC) return owDaysC;
    var r = rng(5151), y = TODAY.getFullYear(), m = TODAY.getMonth() - 1, n = dAt(y, m + 1, 0).getDate(), out = [];
    for (var d = 1; d <= n; d++) {
      var dt = dAt(y, m, d), sun = dt.getDay() === 0, sat = dt.getDay() === 6;
      out.push({ dt: dt, sun: sun, N: sun ? 0 : between(r, sat ? 220 : 268, sat ? 250 : 300), S: sun ? 0 : between(r, 46, 62), RA: sun ? 0 : between(r, 0, 9), T: sun ? 0 : between(r, 0, 8), cN: sun ? 0 : between(r, 0, 12), cS: sun ? 0 : between(r, 0, 20), resc: sun ? 0 : between(r, 5, 12), nd: sun ? 0 : between(r, 4, 10) });
    }
    return (owDaysC = out);
  }
  function owCalc(days, months) {
    var R = OW.rates, cf = OW.contr ? 1 + R[6] / 100 : 1, vf = OW.vat ? 1 + R[7] / 100 : 1, nAll = owDays().length;
    var vehMonth = OW.veh.reduce(function (a, v) { return a + v.amount; }, 0), expMonth = OW.exp.reduce(function (a, v) { return a + v.amount; }, 0), dispMonth = 6 * 3120;
    var per = function (x) { return x / nAll * (months ? nAll : 1); };
    var rows = days.map(function (d) {
      var rev = (d.N * R[0] + d.S * R[1] + d.RA * R[2] + d.T * R[3] + (d.cN * R[0] + d.cS * R[1]) * R[4] / 100) * vf;
      var hw = (d.N + d.S + d.RA + d.T) * 1.02, drv = (hw + d.resc + d.nd) * R[5], fixed = per(dispMonth) * cf + per(vehMonth) * vf + per(expMonth) * vf;
      var cost = drv * cf + fixed;
      return { d: d, rev: rev, cost: cost, left: rev - cost, hp: d.N + d.S + d.RA + d.T, hw: hw };
    });
    var M = months || 1, S = function (k) { return rows.reduce(function (a, x) { return a + x[k]; }, 0) * M; }, sumD = function (k) { return days.reduce(function (a, x) { return a + x[k]; }, 0) * M; };
    var f = days.length / nAll * (months || 1);
    var t = { rows: rows, rev: S('rev'), hp: S('hp'), hw: S('hw'), N: sumD('N'), Sd: sumD('S'), RA: sumD('RA'), T: sumD('T'), cN: sumD('cN'), cS: sumD('cS'), resc: sumD('resc'), nd: sumD('nd') };
    t.drvRoute = t.hw * R[5]; t.drvResc = t.resc * R[5]; t.drvNew = t.nd * R[5]; t.drvEst = 0; t.drv = t.drvRoute + t.drvResc + t.drvNew;
    t.disp = dispMonth * f; t.contr = OW.contr ? (t.drv + t.disp) * R[6] / 100 : 0; t.pay = t.drv + t.disp + t.contr;
    t.veh = vehMonth * f * vf; t.exp = expMonth * f * vf; t.left1 = t.rev - t.pay; t.left2 = t.left1 - t.veh - t.exp;
    return t;
  }
  function owPeriod() {
    var all = owDays();
    if (OW.per === 0) { var i = all.length - 1; while (all[i].dt.getDay() !== 6) i--; return { days: all.slice(i - 6, i + 1), label: ddmm(all[i - 6].dt).slice(0, 5) + ' – ' + ddmm(all[i].dt).slice(0, 5), title: t('plWeek', { n: weekInfo(-1).n - 1 }) }; }
    if (OW.per === 1) return { days: all, label: ddmm(all[0].dt).slice(0, 5) + ' – ' + ddmm(all[all.length - 1].dt).slice(0, 5), title: monthName(-1) };
    return { days: all, months: TODAY.getMonth(), label: '01.01 – ' + ddmm(all[all.length - 1].dt).slice(0, 5), title: String(TODAY.getFullYear()) };
  }
  function owNum(key, v, f) { var p = OW.prev[key]; OW.prev[key] = v; return '<b data-ow="' + key + '" data-from="' + (p === undefined ? v : p) + '" data-to="' + v + '" data-fmt="' + f + '">' + (f === 'h' ? nf(v, 1) + ' h' : eurc(v)) + '</b>'; }
  function owChart(T, per) {
    var W = 1100, H = 300, L = 54, top = 130, bot = 96, mid = 20 + top, rows = T.rows, n = rows.length;
    if (per.months) { var fac = [0.88, 0.9, 0.97, 0.95, 1.02, 0.99, 1.04, 0.96, 1.0, 1.03, 1, 1].slice(0, per.months); rows = fac.map(function (q, i) { return { m: i, rev: T.rev / per.months * q, cost: (T.rev - T.left2) / per.months * (0.97 + (i % 3) * .015) }; }); rows.forEach(function (x) { x.left = x.rev - x.cost; }); n = rows.length; }
    var mx = Math.max.apply(null, rows.map(function (x) { return Math.max(x.rev, x.cost); })), ml = Math.max.apply(null, rows.map(function (x) { return Math.abs(x.left); })) || 1, bw = (W - L - 10) / n;
    var g = '<line x1="' + L + '" x2="' + W + '" y1="' + mid + '" y2="' + mid + '" stroke="#C3CBDA"/><line x1="' + L + '" x2="' + W + '" y1="' + (mid + 6 + bot / 2) + '" y2="' + (mid + 6 + bot / 2) + '" stroke="#C3CBDA"/>' +
      '<text x="' + (L - 6) + '" y="24" text-anchor="end">' + nf(mx / 1000, 1) + 'k</text><text x="' + (L - 6) + '" y="' + (mid + 14) + '" text-anchor="end">' + nf(ml / 1000, 1) + 'k</text>';
    rows.forEach(function (x, i) {
      var x0 = L + i * bw, w = Math.max(3, bw * .34), hr = x.rev / mx * top, hc = x.cost / mx * top, hl = Math.abs(x.left) / ml * (bot / 2 - 4), base = mid + 6 + bot / 2;
      g += '<g class="ow-bar" data-i="' + i + '" style="--i:' + i + '"><rect class="hit" x="' + x0 + '" y="0" width="' + bw + '" height="' + (H - 20) + '" fill="transparent"/><rect x="' + (x0 + bw * .1) + '" y="' + (mid - hr) + '" width="' + w + '" height="' + hr + '" fill="#2F6BFF" rx="2"/><rect x="' + (x0 + bw * .1 + w + 2) + '" y="' + (mid - hc) + '" width="' + w + '" height="' + hc + '" fill="#EEF0F5" stroke="#8A93A6" rx="2"/>' +
        '<rect x="' + (x0 + bw * .14) + '" y="' + (x.left >= 0 ? base - hl : base) + '" width="' + (bw * .72) + '" height="' + hl + '" fill="' + (x.left >= 0 ? '#1E9E5A' : '#E5484D') + '" rx="2"/>' +
        '<text x="' + (x0 + bw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + (per.months ? monthName(x.m - TODAY.getMonth()).slice(0, 3) : pad(x.d.dt.getDate())) + '</text></g>';
    });
    return '<svg class="ow-ch" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + g + '</svg>';
  }
  function owHtml() {
    var per = owPeriod(), T = owCalc(per.days, per.months), R = OW.rates, K = t('owK'), RT = t('owRates'), money = OW.mode === 'money';
    var vehAll = OW.veh.length, missing = vehAll ? 0 : OW_FLEET;
    var h = topBar(t('owT')) + '<div class="m-body">';
    h += '<div class="m-panel ow-hd"><div class="ow-hd1"><span class="ci">€</span><div><b>' + t('owT') + '</b><span>' + t('owTSub') + '</span></div>' +
      '<span class="ow-seg"><button type="button" data-ow-act="mode" data-v="hours"' + (money ? '' : ' class="on"') + '>' + t('owHours') + '</button><button type="button" data-ow-act="mode" data-v="money"' + (money ? ' class="on"' : '') + '>' + t('owMoney') + '</button></span>' +
      '<span class="ow-seg">' + t('owPer').map(function (p, i) { return '<button type="button" data-ow-act="per" data-v="' + i + '"' + (OW.per === i ? ' class="on"' : '') + '>' + p + '</button>'; }).join('') + '</span>' +
      '<span class="ow-pd"><b>' + per.title + '</b> ' + per.label + '</span></div>' +
      '<div class="ow-hd2">' + t('owClosed', { a: '<b>' + per.days.length + '</b>', b: per.days.length }) + '<span>' + t('owProv', { n: 0 }) + '</span><span>' + t('owNoData') + '</span><span>' + t('owFrom', { d: '<b>' + ddmm(TODAY) + '</b>' }) + '</span></div></div>';
    h += '<div class="m-panel ow-how"><h4>' + t('owHow') + '</h4><div class="ts-topics">' + t('owTopics').map(function (x, i) { return '<button type="button" class="hs-f' + (OW.topic === i ? ' on' : '') + '" data-ow-act="topic" data-v="' + i + '">› ' + x[0] + '</button>'; }).join('') + '</div>' + (OW.topic >= 0 ? '<p class="rc-hint ts-topic">' + t('owTopics')[OW.topic][1] + '</p>' : '') + '</div>';
    h += '<div class="ow-chk"><button type="button" data-ow-act="contr" class="' + (OW.contr ? 'on' : '') + '"><i></i>' + t('owWithC') + '</button><button type="button" data-ow-act="vat" class="' + (OW.vat ? 'on' : '') + '"><i></i>' + t('owWithV') + '</button><span>' + t('owVatNote') + '</span></div>';
    h += missing ? '<div class="ow-ban" data-ows="costs"><b>' + t('owBanner', { n: missing }) + '</b><button type="button" class="wr-upbtn" data-ow-act="addcosts">+ ' + t('owAddCosts') + '</button></div>' : '<div class="ow-ban ok" data-ows="costs"><b>✓ ' + t('owCostsOk', { n: OW_FLEET }) + '</b></div>';
    var pct = T.rev ? T.left1 / T.rev * 100 : 0;
    h += '<div class="m-panel ow-k" data-ows="kpi">' + (money ? [
      '<div><small>' + K[0] + '</small>' + owNum('rev', T.rev, 'e') + (OW.vat ? '<span class="ow-vat">' + t('owInclVat') + '</span>' : '') + '</div>',
      '<div><small>' + K[1] + '</small>' + owNum('pay', T.pay, 'e') + '<span>' + t('owDrv') + ': <b>' + eurc(T.drv) + '</b></span><span>' + t('owDisp') + ': <b>' + eurc(T.disp) + '</b></span><span>' + t('owContr') + ': <b>' + eurc(T.contr) + '</b></span></div>',
      '<div class="g"><small>' + K[2] + '</small>' + owNum('l1', T.left1, 'e') + '<span>' + t('owOfRev', { p: '<b>' + pctf(pct, 1) + '</b>' }) + '</span>' + (OW.vat ? '<span class="ow-vat">' + t('owInclVat') + '</span>' : '') + '</div>'
    ] : [
      '<div><small>' + t('owKh')[0] + '</small>' + owNum('hp', T.hp, 'h') + '</div>', '<div><small>' + t('owKh')[1] + '</small>' + owNum('hw', T.hw, 'h') + '</div>', '<div><small>' + t('owKh')[2] + '</small>' + owNum('hd', T.hw - T.hp, 'h') + '</div>'
    ]).join('') + '</div>';
    h += '<div class="m-panel ow-k" data-ows="kpi">' +
      '<div><small>' + K[3] + '</small>' + owNum('veh', T.veh, 'e') + '<span>' + t('owMonthly') + ': <b>' + eurc(T.veh * .9) + '</b></span><span>' + t('owRepairs') + ': <b>' + eurc(T.veh * .1) + '</b></span></div>' +
      '<div><small>' + K[4] + '</small>' + owNum('exp', T.exp, 'e') + '</div>' +
      '<div class="' + (T.left2 >= 0 ? 'g' : 'r') + '"><small>' + K[5] + '</small>' + owNum('l2', T.left2, 'e') + '<span>' + (T.veh + T.exp ? t('owAfterAll') : t('owNoCost')) + '</span>' + (OW.vat ? '<span class="ow-vat">' + t('owInclVat') + '</span>' : '') + '</div></div>' +
      '<p class="ow-note">' + t('owLeftNote') + '</p>';
    var C = t('owCats'), cv = [[T.N, R[0]], [T.Sd, R[1]], [T.RA, R[2]], [T.T, R[3]]], vf = OW.vat ? 1 + R[7] / 100 : 1, canc = (T.cN * R[0] + T.cS * R[1]) * R[4] / 100 * vf, mul = 1;
    h += '<div class="m-panel ow-tb" data-ows="rev"><h4>' + t('owRevT') + '</h4><table><thead><tr><th></th>' + t('owCols').map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      cv.map(function (x, i) { return '<tr><td>' + C[i] + '</td><td>' + nf(x[0] * mul, 1) + ' h</td><td>' + eurc(x[1]) + '</td><td><b>' + eurc(x[0] * x[1] * vf * mul) + '</b></td></tr>'; }).join('') +
      '<tr><td>' + C[4] + '</td><td>' + nf((T.cN + T.cS) * mul, 1) + ' h</td><td>× ' + nf(R[4], 2) + ' %</td><td><b>' + eurc(canc * mul) + '</b></td></tr><tr class="tot"><td>' + t('owTotRev') + '</td><td></td><td></td><td>' + eurc(T.rev) + '</td></tr></tbody></table></div>';
    var P = t('owPays');
    h += '<div class="ow-two" data-ows="pay"><div class="m-panel ow-tb"><h4>' + t('owPayT') + '</h4><table><thead><tr><th></th>' + t('owCols').map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      [[P[0], T.hw, T.drvRoute], [P[1], T.resc, T.drvResc], [P[2], T.nd, T.drvNew]].map(function (x) { return '<tr><td>' + x[0] + '</td><td>' + nf(x[1] * mul, 1) + ' h</td><td>' + eurc(R[5]) + '</td><td><b>' + eurc(x[2] * mul) + '</b></td></tr>'; }).join('') +
      '<tr class="tot"><td>' + t('owTotDrv') + '</td><td></td><td></td><td>' + eurc(T.drv) + '</td></tr><tr><td>' + t('owContr') + '</td><td></td><td></td><td><b>' + eurc(OW.contr ? T.drv * R[6] / 100 : 0) + '</b></td></tr></tbody></table></div>' +
      '<div class="m-panel ow-tb"><h4>' + t('owDispT') + '</h4><table><tbody><tr><td>' + t('owDispN') + '</td><td><b>6</b></td></tr><tr><td>' + t('owSal') + '</td><td><b>' + eurc(T.disp) + '</b></td></tr><tr><td>' + t('owContr') + '</td><td><b>' + eurc(OW.contr ? T.disp * R[6] / 100 : 0) + '</b></td></tr></tbody></table></div></div>';
    h += '<div class="m-panel ow-rates" data-ows="rates"><h4>' + t('owRatesT') + '</h4><div class="ow-rg">' + RT.map(function (n, i) {
      var pc = i === 4 || i === 6 || i === 7, v = pc ? nf(R[i], 0) + ' %' : eurc(R[i]);
      return '<div class="ow-r' + (i === 7 && !OW.vat ? ' off' : '') + '"><small>' + n + '</small><span><button type="button" data-ow-act="rate" data-v="' + i + ',-1" aria-label="−">−</button><b data-ow-rate="' + i + '">' + v + '</b><button type="button" data-ow-act="rate" data-v="' + i + ',1" aria-label="+">+</button></span></div>';
    }).join('') + '</div></div>';
    var V = t('owVeh'), EX = t('owExp');
    h += '<div class="ow-two" data-ows="costs"><div class="m-panel ow-tb"><h4>' + t('owVehT') + '<span class="ow-btns"><button type="button" class="wr-upbtn" data-ow-act="addcosts">' + t('owMonthly') + '</button></span></h4>' +
      (OW.veh.length ? '<table><tbody>' + OW.veh.map(function (v, i) { return '<tr class="' + (v.isNew ? 'add-in' : '') + '"><td>' + V[v.k] + '<small class="blk">' + (v.n ? t('owVehN', { n: v.n }) : t('owRows', { n: v.rows })) + '</small></td><td><b>' + eurc(v.amount * (per.months || (per.days.length / owDays().length))) + '</b></td></tr>'; }).join('') + '<tr class="tot"><td>' + t('owTotVeh') + '<small class="blk">' + t('owNoFuel') + '</small></td><td>' + eurc(T.veh) + '</td></tr></tbody></table>' : '<p class="cp-empty at-wait">' + t('owNoVeh') + '</p>') + '</div>' +
      '<div class="m-panel ow-tb"><h4>' + t('owExpT') + '<span class="ow-btns"><button type="button" class="wr-upbtn" data-ow-act="addexp">+ ' + t('owAddExp') + '</button></span></h4>' +
      (OW.exp.length ? '<table><tbody>' + OW.exp.map(function (v) { return '<tr class="' + (v.isNew ? 'add-in' : '') + '"><td>' + EX[v.k] + '</td><td><b>' + eurc(v.amount * (per.months || (per.days.length / owDays().length))) + '</b></td></tr>'; }).join('') + '</tbody></table>' : '<p class="cp-empty at-wait">' + t('owNoExp') + '</p>') + '</div></div>';
    h += '<div class="m-panel ow-chp" data-ows="days"><h4>' + t('owChartT') + '</h4>' + owChart(T, per) + '<p class="ow-tip" data-ow-tip>' + t('owHoverHint') + '</p><div class="wr-leg"><span style="--c:#2F6BFF">' + t('owLeg')[0] + '</span><span class="sq" style="--c:#C3CBDA">' + t('owLeg')[1] + '</span><span class="sq" style="--c:#1E9E5A">' + t('owLeg')[2] + '</span></div></div>';
    if (!per.months) h += '<div class="m-panel ow-tb ow-days" data-ows="days"><h4>' + t('owDaysT') + ' <span class="m-cnt">' + per.days.length + '</span></h4><table><thead><tr>' + t('owDayCols').map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      T.rows.slice().reverse().slice(0, 10).map(function (x) { return '<tr class="' + (x.d.sun ? 'sunr' : '') + '"><td><b>' + lday(x.d.dt, { weekday: 'long' }) + '</b><small class="blk">' + ddmm(x.d.dt) + '</small></td><td>' + eurc(x.rev) + '</td><td>' + eurc(x.cost) + '</td><td class="' + (x.left >= 0 ? 'pos' : 'neg') + '">' + (x.left < 0 ? '−' : '') + eurc(Math.abs(x.left)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    OW.rowsCache = per.months ? null : T.rows; OW.monthsCache = per.months ? true : null;
    return h + '</div>';
  }
  var owZ = document.getElementById('ow-z'), owScroll = document.getElementById('ow-scroll'), owStepsEl = document.getElementById('ow-steps');
  function owTween(el) {
    var a = Number(el.dataset.from), b = Number(el.dataset.to), f = el.dataset.fmt;
    if (a === b || reduce) return;
    var t0 = performance.now();
    el.classList.add('chg');
    (function st(now) { var k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3), v = a + (b - a) * e; el.textContent = f === 'h' ? nf(v, 1) + ' h' : eurc(v); if (k < 1) requestAnimationFrame(st); else setTimeout(function () { el.classList.remove('chg'); }, 400); })(t0);
  }
  function owRender() {
    if (!owZ) return;
    var keep = owScroll.scrollTop;
    owZ.innerHTML = '<div class="m ow-m">' + owHtml() + '</div>';
    owScroll.scrollTop = keep;
    owZ.querySelectorAll('[data-ow]').forEach(owTween);
    owMark();
    OW.veh.forEach(function (v) { v.isNew = false; }); OW.exp.forEach(function (v) { v.isNew = false; });
  }
  function owMark() { var id = t('owSteps')[OW.step][0]; owZ.querySelectorAll('[data-ows]').forEach(function (el) { el.classList.toggle('ow-on', el.dataset.ows === id); }); }
  function owFit() { if (owZ) owZ.style.zoom = Math.max(.56, Math.min(1, owScroll.clientWidth / 1180)); } // phones keep a readable size and scroll sideways
  function owSteps() {
    var S = t('owSteps');
    owStepsEl.innerHTML = S.map(function (x, i) { return '<li class="' + (i === OW.step ? 'on' + (OW.auto ? ' auto' : '') : '') + '"><button type="button" data-ows-i="' + i + '"><span class="n">' + (i + 1) + '</span><span class="t">' + esc(x[1]) + '</span><span class="prog" style="--dur:' + DUR + 'ms"></span></button></li>'; }).join('') +
      '<li class="ow-desc">' + esc(S[OW.step][2]) + '</li>';
  }
  function owGo(i, user) {
    OW.step = i; owSteps(); owMark();
    var el = owZ.querySelector('[data-ows="' + t('owSteps')[i][0] + '"]');
    if (el) { var top = el.getBoundingClientRect().top - owScroll.getBoundingClientRect().top + owScroll.scrollTop - 14; owScroll.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' }); }
    if (!user && OW.auto) {
      var id = t('owSteps')[i][0], tok = ++OW.tok;
      if (id === 'rates') setTimeout(function () { if (tok === OW.tok && OW.auto) owAct('rate', '0,1'); }, 2200);
      if (id === 'costs' && !OW.veh.length) setTimeout(function () { if (tok === OW.tok && OW.auto) owAct('addcosts'); }, 1800);
    }
    if (user && window.innerWidth <= 980) { var b = owStepsEl.querySelector('.on button'); if (b) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
    owSched();
  }
  function owSched() { clearTimeout(OW.timer); if (!OW.auto || !OW.inView) return; OW.timer = setTimeout(function () { owGo((OW.step + 1) % t('owSteps').length); }, DUR); }
  function owStop() { OW.auto = false; clearTimeout(OW.timer); OW.tok++; var a = owStepsEl.querySelector('.auto'); if (a) a.classList.remove('auto'); }
  function owAct(act, v) {
    if (act === 'mode') OW.mode = v;
    else if (act === 'per') OW.per = Number(v);
    else if (act === 'contr') OW.contr = !OW.contr;
    else if (act === 'vat') OW.vat = !OW.vat;
    else if (act === 'topic') OW.topic = OW.topic === Number(v) ? -1 : Number(v);
    else if (act === 'rate') { var q = v.split(','), i = Number(q[0]); OW.rates[i] = Math.max(0, Math.round((OW.rates[i] + OW_STEP[i] * Number(q[1])) * 100) / 100); if (i === 7 && !OW.vat) OW.vat = true; }
    else if (act === 'addcosts') {
      if (OW.veh.length) return;
      var k = 0, tok = ++OW.tok;
      (function next() { if (tok !== OW.tok && OW.auto === false && k === 0) return; if (k >= OW_VEH.length) return; var c = OW_VEH[k++]; OW.veh.push({ k: c[0], n: c[1], rows: c[1] ? 0 : 2 + k, amount: c[1] ? c[1] * c[2] : c[2], isNew: true }); owRender(); setTimeout(next, reduce ? 0 : 420); })();
      setTimeout(function () { if (!OW.exp.length) owAct('addexp'); }, reduce ? 0 : 2800);
      return;
    }
    else if (act === 'addexp') { if (OW.exp.length >= OW_EXP.length) return; var j = OW.exp.length; OW.exp.push({ k: j, amount: OW_EXP[j], isNew: true }); if (j === 0) { owRender(); setTimeout(function () { owAct('addexp'); }, reduce ? 0 : 380); return; } if (j < 3) setTimeout(function () { owAct('addexp'); }, reduce ? 0 : 380); }
    owRender();
  }
  if (owZ) {
    owZ.addEventListener('click', function (e) { var b = e.target.closest('[data-ow-act]'); if (!b) return; owStop(); owAct(b.dataset.owAct, b.dataset.v); });
    owZ.addEventListener('mouseover', function (e) {
      var g = e.target.closest('.ow-bar'), tip = owZ.querySelector('[data-ow-tip]'); if (!g || !tip) return;
      owZ.querySelectorAll('.ow-bar.hv').forEach(function (x) { x.classList.remove('hv'); }); g.classList.add('hv');
      var x = OW.rowsCache && OW.rowsCache[Number(g.dataset.i)], L = t('owLeg');
      if (x) tip.innerHTML = '<b>' + ddmm(x.d.dt) + '</b> · ' + L[0] + ': <b>' + eurc(x.rev) + '</b> · ' + L[1] + ': <b>' + eurc(x.cost) + '</b> · ' + L[2] + ': <b class="' + (x.left >= 0 ? 'pos' : 'neg') + '">' + (x.left < 0 ? '−' : '') + eurc(Math.abs(x.left)) + '</b>';
    });
    owStepsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-ows-i]'); if (!b) return; owStop(); owGo(Number(b.dataset.owsI), true); });
    new IntersectionObserver(function (en) { OW.inView = en[0].isIntersecting; if (OW.inView) { owSteps(); owSched(); } else clearTimeout(OW.timer); }, { threshold: .3 }).observe(document.getElementById('owners'));
    if ('ResizeObserver' in window) new ResizeObserver(owFit).observe(owScroll); else window.addEventListener('resize', owFit);
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
    wr: { name: 'pageWr', steps: 'stepsWr', first: 'upload', url: 'board.lanu.app/reports' },
    rc: { name: 'pageRc', steps: 'stepsRc', first: 'rckpis', url: 'board.lanu.app/recruiting' }
  };
  var ORDER = ['ops', 'da', 'cp', 'hs', 'wr', 'rc'];
  var page = 'ops';
  var active = 'overview', auto = !reduce, timer = null, inView = false, DUR = 7000;
  function renderSteps() {
    function stepLi(s, i, n) {
      return '<li style="--i:' + i + '" class="step' + (s[0] === active ? ' on' + (auto ? ' auto' : '') : '') + '"><button type="button" data-step="' + s[0] + '" aria-current="' + (s[0] === active) + '">' +
        '<span class="n">' + n + '</span><span><span class="t">' + esc(s[1]) + '</span><span class="d">' + esc(s[2]) + '</span></span><span class="prog" style="--dur:' + DUR + 'ms"></span></button></li>';
    }
    if (page === 'wr') { // Weekly Reports: one group per sub-page, numbered across all of them
      var all = t(PAGES.wr.steps), html = '', n = 0, li = 0, names = { sc: 'wrSc', iadc: 'wrIadc', cn: 'cnTab', ccp: 'ccTab', pod: 'podTab' };
      WR_ORDER.forEach(function (tab) {
        var grp = all.filter(function (x) { return WR_TAB[x[0]] === tab; }), from = n + 1, open = tab === wrTab;
        n += grp.length;
        html += '<li class="step-grp' + (open ? ' on' : '') + '" style="--i:' + (li++) + '"><button type="button" data-wrgrp="' + tab + '" aria-expanded="' + open + '"><span class="g-t">' + t(names[tab]) + '</span><em>' + from + '–' + n + '</em><span class="g-c">' + (open ? '−' : '+') + '</span></button></li>';
        if (open) grp.forEach(function (x, k) { html += stepLi(x, li++, from + k); });
      });
      stepsEl.innerHTML = html;
    } else stepsEl.innerHTML = pageSteps().map(function (s, i) { return stepLi(s, i, i + 1); }).join('');
    var cur = pageSteps().filter(function (s) { return s[0] === active; })[0];
    nowEl.innerHTML = '<b>' + esc(cur[1]) + '</b><p>' + esc(cur[2]) + '</p>';
  }
  stepsEl.addEventListener('click', function (e) {
    var g = e.target.closest('[data-wrgrp]');
    if (g) { stopAuto(); if (g.dataset.wrgrp !== wrTab) focusStep(WR_FIRST[g.dataset.wrgrp]); return; }
    var b = e.target.closest('[data-step]');
    if (!b) return;
    stopAuto();
    if (page === 'ops' && b.dataset.step !== 'history' && dayOffset !== 0) { dayOffset = 0; renderMock(); }
    focusStep(b.dataset.step);
  });

  // panel box in unscaled mock pixels, from layout offsets: unaffected by the camera transition,
  // the reveal animation or the 3D tilt that make on-screen rects unreliable mid-move
  function offs(el) { var x = 0, y = 0; while (el) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x: x, y: y }; }
  function boxIn(list, root) {
    var o = offs(root), l = Infinity, tp = Infinity, r = -Infinity, b = -Infinity;
    list.forEach(function (el) {
      if (!el.offsetWidth && !el.offsetHeight) return;
      var q = offs(el), x = q.x - o.x, y = q.y - o.y;
      l = Math.min(l, x); tp = Math.min(tp, y); r = Math.max(r, x + el.offsetWidth); b = Math.max(b, y + el.offsetHeight);
    });
    return l === Infinity ? { l: 0, t: 0, r: 1280, b: 400 } : { l: l, t: tp, r: r, b: b };
  }
  // "camera": zooms the 1280px-wide app screen so the active panel fills the visible window
  var cam = { z: 1, x: 0, y: 0 };
  function layoutMock() {
    mock.style.transform = 'translate(' + (-cam.x) + 'px,' + (-cam.y) + 'px) scale(' + cam.z + ')';
  }
  function focusStep(id, keep, quiet) {
    if (page === 'hs' && HS_TAB[id] && hsTab !== HS_TAB[id]) { hsTab = HS_TAB[id]; renderMock(); }
    if (page === 'wr' && WR_TAB[id] && wrTab !== WR_TAB[id]) { wrTab = WR_TAB[id]; renderMock(); }
    if (page === 'rc') { var want = id === 'rcnew' ? 'new' : id === 'rcfile' ? 'file' : null; if (rcDrawer !== want) { rcDrawer = want; renderMock(); } }
    active = id;
    renderSteps();
    var panels = mock.querySelectorAll('[data-p]');
    panels.forEach(function (p) { p.classList.toggle('on', p.dataset.p === id); });
    mock.classList.add('focus');
    var targets = mock.querySelectorAll('[data-p="' + id + '"]');
    var bx = boxIn(targets, mock), l = bx.l, tp = bx.t, r = bx.r, b = bx.b;
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
  window.addEventListener('resize', function () { focusStep(active, true, true); });
  // re-frame once web fonts settle the panel sizes, and whenever the screen itself changes size
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { focusStep(active, true, true); });
  if ('ResizeObserver' in window) { var scrSz = ''; new ResizeObserver(function () { var k = screenEl.clientWidth + 'x' + screenEl.clientHeight; if (k !== scrSz) { var first = !scrSz; scrSz = k; if (!first) focusStep(active, true, true); } }).observe(screenEl); }

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
    heroSpark(liveDelivered);
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
  if (!reduce) document.querySelectorAll('.screen-col').forEach(function (screenCol) {
    var browser = screenCol.querySelector('.browser');
    screenCol.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var q = screenCol.getBoundingClientRect(), px = (e.clientX - q.left) / q.width - .5, py = (e.clientY - q.top) / q.height - .5;
      browser.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
      browser.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
    });
    screenCol.addEventListener('pointerleave', function () { browser.style.setProperty('--rx', '0deg'); browser.style.setProperty('--ry', '0deg'); });
  });


  // ------------------------------------------------------------------ hero slider: delivery day / every euro counted
  var SPK = [];
  function heroSpark(v) {
    var pl = document.getElementById('hv-spark'), ar = document.getElementById('hv-spark-a'); if (!pl) return;
    if (!SPK.length) { var r = rng(31); for (var k = 0; k < 18; k++) SPK.push(8300 + k * 6 + Math.floor(r() * 18)); }
    if (v) SPK.push(v); if (SPK.length > 18) SPK.shift();
    var mn = Math.min.apply(null, SPK), mx = Math.max.apply(null, SPK) || 1, pts = SPK.map(function (q, i) { return (i / (SPK.length - 1) * 200).toFixed(1) + ',' + (36 - (q - mn) / Math.max(1, mx - mn) * 30).toFixed(1); });
    pl.setAttribute('points', pts.join(' ')); ar.setAttribute('d', 'M0,40 L' + pts.join(' L') + ' L200,40 Z');
  }
  var HS = { i: 0, timer: null, dur: 9000, durs: [9000, 9000, 21500], inView: true, busy: false }, hsEl = document.querySelectorAll('.hero-slide'), hsNav = document.getElementById('hs-nav');
  function hsMoney() {
    var arc = document.getElementById('hv2-arc'), left = document.getElementById('hv2-left'), pct = document.getElementById('hv2-pct'), bars = document.getElementById('hv2-bars'), eurEl = document.getElementById('hv2-eur');
    if (!arc) return;
    var L = 2 * Math.PI * 84, target = 10708, m = 4.04;
    arc.style.strokeDasharray = L; arc.style.transition = 'none'; arc.style.strokeDashoffset = L; void arc.getBoundingClientRect();
    arc.style.transition = reduce ? 'none' : 'stroke-dashoffset 1.8s cubic-bezier(.2,.8,.2,1) .4s'; arc.style.strokeDashoffset = L * (1 - .72);
    var t0 = performance.now(), d = reduce ? 1 : 1900;
    (function st(now) { var k = Math.min(1, (now - t0 - (reduce ? 0 : 400)) / d); k = Math.max(0, k); var e = 1 - Math.pow(1 - k, 3);
      left.textContent = '+' + eurc(target * e).replace(/,\d\d /, ' '); pct.textContent = nf(m * e, 1); if (k < 1) requestAnimationFrame(st); })(t0);
    document.querySelectorAll('[data-hv2]').forEach(function (b, i) { var v = Number(b.dataset.hv2), sg = b.dataset.sg, t1 = performance.now();
      (function st(now) { var k = Math.min(1, (now - t1 - i * 160) / 1200); k = Math.max(0, k); var e = 1 - Math.pow(1 - k, 3); b.textContent = sg + ' ' + eurc(v * e).replace(/,\d\d /, ' '); if (k < 1) requestAnimationFrame(st); })(t1); });
    var r = rng(Math.floor(Math.random() * 999)), html = '';
    for (var k = 0; k < 14; k++) { var neg = k % 7 === 6, hgt = neg ? 18 + r() * 10 : 30 + r() * 60; html += '<i class="' + (neg ? 'n' : 'p') + '" style="--h:' + hgt.toFixed(0) + '%;--i:' + k + '"></i>'; }
    bars.innerHTML = html;
    if (eurEl && !reduce) { var e2 = ''; for (var q = 0; q < 12; q++) e2 += '<i style="--x:' + Math.floor(Math.random() * 100) + '%;--d:' + (Math.random() * 6).toFixed(2) + 's;--s:' + (0.7 + Math.random() * .8).toFixed(2) + '">€</i>'; eurEl.innerHTML = e2; }
  }

  // ---------- hero slide 3: LANU App, driver phone and office phone (fictional people, drawn avatars, real van photos)
  var HA = { tm: [], drv: 'Mihai Stan', off: 'Laura Kern', top: ['Elena Marin', 'Lukas Weber', 'Radu Ionescu', 'Jonas Becker', 'Ioana Dinu'] };
  function ha(k, v) { var s = t('ha')[k]; if (v) Object.keys(v).forEach(function (q) { s = s.replace('{' + q + '}', v[q]); }); return s; }
  var HA_IC = {
    cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/>',
    coin: '<ellipse cx="10" cy="7" rx="6" ry="2.6"/><path d="M4 7v4.5c0 1.4 2.7 2.6 6 2.6M4 11.5V16c0 1.4 2.7 2.6 6 2.6"/><circle cx="16.5" cy="15.5" r="4"/><path d="M16.5 13.8v3.4"/>',
    slip: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21z"/><path d="M9.5 8h5M9.5 11.5h5M9.5 15h3"/>',
    chat: '<path d="M4.5 5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17H4.5A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 15.5h5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    home: '<path d="M4 11 12 4l8 7v9h-5.5v-5.5h-5V20H4z"/>', task: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4.5h6M9 12l2 2 4-4"/>', user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.2-4 4-5.6 7.5-5.6s6.3 1.6 7.5 5.6"/>',
    shield: '<path d="M12 3l7 3v5.5c0 4.3-3 7.8-7 9-4-1.2-7-4.7-7-9V6z"/><path d="M12 9v5M9.5 11.5h5"/>', warn: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.2M12 17h.01"/>',
    shirt: '<path d="M8.5 4 4 6.5l1.8 4L8 9.6V20h8V9.6l2.2.9L20 6.5 15.5 4c-.6 1.4-1.9 2.2-3.5 2.2S9.1 5.4 8.5 4z"/>', van: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    mega: '<path d="M4 10v4h3l7 4V6L7 10zM17.5 9.5a3.5 3.5 0 0 1 0 5"/>', info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>', plus: '<path d="M12 6v12M6 12h12"/>', perf: '<path d="M4.5 16a7.5 7.5 0 1 1 15 0"/><path d="M12 16l3.5-4.5"/>',
    chev: '<path d="M10 7l5 5-5 5"/>', up: '<path d="M5 16l5-5 3 3 6-6M14 8h5v5"/>', ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
  };
  function haRows(rows, ics, cls, extra) {
    return '<div class="ha-c ha-rows">' + rows.map(function (r, k) { var x = extra && extra[k] || {};
      return '<div class="ha-row' + (x.c ? ' ' + x.c : '') + '"' + (x.id ? ' id="' + x.id + '"' : '') + '><span class="ha-ri ' + (Array.isArray(cls) ? cls[k] : cls) + '">' + haIc(ics[k]) + '</span><div><b>' + esc(r[0]) + (x.tag || '') + '</b><small>' + esc(r[1]) + '</small></div>' + (x.bd ? '<em' + (x.bid ? ' id="' + x.bid + '"' : '') + '>' + x.bd + '</em>' : '') + haIc('chev', 'ha-chv') + '</div>'; }).join('') + '</div>';
  }
  function haIc(k, c) { return '<svg viewBox="0 0 24 24" class="ha-ic' + (c ? ' ' + c : '') + '" aria-hidden="true">' + HA_IC[k] + '</svg>'; }
  function haTop(name, admin) {
    var d = new Date(), loc = lang === 'de' ? 'de-DE' : 'en-GB';
    return '<div class="ha-top"><span class="ha-logo"><svg viewBox="0 0 24 24"><path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="M12 2.5V12l8.5-5M12 12 3.5 7M12 12v9.5"/></svg>LANU</span>' + haIc('bell', 'ha-bell') + '<b class="ha-bdg"></b></div>' +
      '<div class="ha-hi">' + avatar(name, 40) + '<div><small>' + esc(d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' })) + '</small><b>' + esc(ha('hi', { n: name.split(' ')[0] })) + '</b>' + (admin ? '<em>' + ha('admin') + '</em>' : '') + '</div></div>';
  }
  function haBuild() {
    var el = document.getElementById('hv3'); if (!el) return;
    var wk = weekInfo(-1), acts = ha('acts'), IC4 = ['cal', 'coin', 'slip', 'chat'], i;
    var d = '<div class="ha-feed">' + haTop(HA.drv) +
      '<div class="ha-sc"><div class="ha-sc-h"><span>' + esc(ha('score', { w: wk.n, r: wk.range })) + '</span><i>' + haIc('chev') + '</i></div>' +
        '<div class="ha-sc-m"><div><b class="ha-scn" id="ha-score">84.6</b><span class="ha-of">/100</span><em class="ha-great">' + ha('great') + '</em></div>' +
        '<div class="ha-rank"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="33" class="tr"/><circle cx="40" cy="40" r="33" class="val" id="ha-ring"/></svg><span><small>' + ha('rank') + '</small><b>#12</b></span></div></div>' +
        '<div class="ha-sc-f"><i>' + haIc('up') + '</i><span>' + esc(ha('up', { n: 9 })) + '</span><b>+9</b></div></div>' +
      '<div class="ha-g2"><div class="ha-c"><small>' + ha('days') + '</small><b>4</b><span class="ha-dots"><i></i><i></i><i></i><i></i></span><small>' + ha('month') + '</small></div>' +
        '<div class="ha-c"><small>' + ha('rescue') + '</small><b>2</b><img src="assets/img/app/rescue.png" alt="" class="ha-resc"><small>' + ha('month') + '</small></div></div>' +
      '<div class="ha-c ha-veh"><img src="assets/img/app/veh.png" alt=""><div><small>' + ha('vehicle') + '</small><b>LNU 4821</b></div>' + haIc('chev') + '</div>' +
      '<h5>' + ha('quick') + '</h5><div class="ha-acts">';
    for (i = 0; i < 4; i++) d += '<div class="ha-act' + (i === 0 ? ' ha-to' : '') + '"><span class="k' + i + '">' + haIc(IC4[i]) + (i === 2 ? '<b></b>' : '') + '</span>' + esc(acts[i]) + '</div>';
    d += '</div><h5>' + esc(ha('top', { w: wk.n })) + '</h5><div class="ha-c ha-list">';
    HA.top.forEach(function (n, k) { d += '<div><i class="m' + k + '">' + (k + 1) + '</i><span>' + esc(n) + '</span><b>100</b></div>'; });
    var pm = new Date(); pm.setDate(1); pm.setMonth(pm.getMonth() - 1);
    var dr = ha('dReq');
    d += '</div><h5 id="ha-dreq">' + ha('reqH') + '</h5>' + haRows([[dr[0][0], ha('dVacSent')], dr[1], dr[2]], ['cal', 'chat', 'coin'], 'b',
        [{ id: 'ha-dvac', tag: '<i class="ha-tag s" id="ha-dvtag">' + ha('sentTag') + '</i>' }, { tag: '<i class="ha-tag ok">' + ha('okTag') + '</i>' }, { tag: '<i class="ha-tag s">' + ha('sentTag') + '</i>' }]) +
      '<h5 id="ha-ddoc">' + ha('docs') + '</h5>' + haRows(ha('dDocs'), ['slip', 'doc', 'shirt', 'shield', 'warn'], ['v', 'v', 'g', 'v', 'v'], [null, { bd: '1', c: 'nwb' }]) +
      '<h5>' + ha('upd') + '</h5><div class="ha-c ha-upd" id="ha-upd"><span>' + haIc('info') + '</span><div><b>' + esc(ha('updT', { m: pm.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long' }) })) + '</b><small>' + ha('updS') + '</small></div><button type="button" tabindex="-1">' + ha('read') + '</button></div>';
    var dnav = ha('dnav'), DNI = ['home', 'perf', 'bell', 'user'];
    d += '</div><nav class="ha-nav">';
    for (i = 0; i < 4; i++) d += '<span' + (i === 0 ? ' class="on"' : '') + '>' + haIc(DNI[i]) + esc(dnav[i]) + '</span>';
    d += '</nav><div class="ha-toast g" id="ha-dt"><i>' + haIc('ok') + '</i><div><b>' + ha('okTitle') + '</b><small>' + esc(ha('okTxt', { n: HA.off.split(' ')[0] })) + '</small></div></div>';
    var tiles = ha('tiles'), TI = ['chat', 'coin', 'slip'], res = ha('res'), RI = ['chat', 'coin', 'doc', 'cal'], RV = [4, 1, 2, 1], pend = ha('pend'), nav = ha('nav'), NI = ['home', 'task', 'bell', 'user'];
    var o = '<div class="ha-feed">' + haTop(HA.off, true) +
      '<div class="ha-sc ha-ops"><div class="ha-sc-h"><span>' + ha('ops') + '</span><em class="ha-live"><i></i>' + ha('live') + '</em></div>' +
        '<div class="ha-need"><b id="ha-need">2</b><span>' + ha('need') + '</span></div><div class="ha-bar"><i></i></div><div class="ha-g3">';
    for (i = 0; i < 3; i++) o += '<div class="k' + i + '"><span>' + haIc(TI[i]) + '</span><b' + (i === 0 ? ' id="ha-req"' : '') + '>' + (i === 0 ? 2 : 0) + '</b><small>' + esc(tiles[i]) + '</small></div>';
    o += '</div></div><h5>' + ha('resolved') + '<small>' + esc(new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long' })) + '</small></h5><div class="ha-c ha-res">';
    for (i = 0; i < 4; i++) o += '<div><span class="r' + i + '">' + haIc(RI[i]) + '</span><b' + (i === 3 ? ' id="ha-vapp"' : '') + '>' + RV[i] + '</b><small>' + esc(res[i]) + '</small></div>';
    o += '</div><h5>' + ha('pending') + '</h5><div class="ha-pend">';
    for (i = 0; i < 6; i++) o += '<div' + (i === 0 ? ' id="ha-vac"' : '') + '><b' + (i === 0 ? ' id="ha-vacn"' : '') + '>' + (i === 1 ? 2 : 0) + '</b><small>' + esc(pend[i]) + '</small>' + (i === 1 ? '<em>2</em>' : i === 0 ? '<em class="nw">1</em>' : '') + '</div>';
    o += '</div><h5>' + ha('fleet') + '</h5><div class="ha-fl"><div class="dk"><img src="assets/img/app/pickup.png" alt=""><b>' + ha('pickup') + '</b><i>→</i></div><div><img src="assets/img/app/return.png" alt=""><b>' + ha('ret') + '</b><i>←</i></div></div>' +
      '<h5 id="ha-otask">' + ha('tasks') + '<small id="ha-open">' + esc(ha('open', { n: 1 })) + '</small></h5><div class="ha-c ha-tasks"><div class="ha-task"><i></i><span>' + esc(ha('task')) + '</span>' + avatar('Radu Ionescu', 24) + '</div>' +
        '<div class="ha-task ha-t2"><i></i><span>' + esc(ha('task2')) + '</span>' + avatar('Elena Marin', 24) + '</div><div class="ha-new" id="ha-newt"><span>' + haIc('plus') + '</span>' + ha('newTask') + '</div></div>' +
      '<h5 id="ha-oreq">' + ha('reqH') + '</h5>' + haRows(ha('oReq'), ['cal', 'chat', 'coin'], 'b', [null, { bd: '2' }]) +
      '<h5>' + ha('docs') + '</h5>' + haRows(ha('oDocs'), ['doc', 'shield', 'slip', 'warn'], 'v') +
      '<h5 id="ha-oteam">' + ha('team') + '</h5>' + haRows(ha('oTeam'), ['shirt', 'van', 'warn', 'mega'], ['g', 'g', 'g', 'o'], [null, null, { id: 'ha-dmg', bd: '1', c: 'nwb' }, { id: 'ha-ann' }]) + '</div>' +
      '<div class="ha-toast" id="ha-ot"><i>' + haIc('cal') + '</i><div><b>' + ha('newReq') + '</b><small>' + esc(ha('newTxt', { n: HA.drv })) + '</small></div><button type="button" tabindex="-1">' + ha('approve') + '</button></div>' +
      '<nav class="ha-nav">';
    for (i = 0; i < 4; i++) o += '<span' + (i === 0 ? ' class="on"' : '') + '>' + haIc(NI[i]) + (i === 1 ? '<b id="ha-tb">1</b>' : '') + esc(nav[i]) + '</span>';
    o += '</nav>';
    var bt = ha('bTabs'), pmn = new Date(); pmn.setDate(1); pmn.setMonth(pmn.getMonth() - 1); pmn = pmn.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long' });
    var bd = '<div class="hb-bar"><i></i><i></i><i></i><span>board.lanu.app/app-admin</span></div><div class="hb-in">' +
      '<div class="hb-h"><div><b>' + ha('bTitle') + '</b><small>' + esc(new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</small></div><span class="hb-sync"><i></i>' + ha('bSync') + '</span></div>' +
      '<div class="hb-tabs">' + bt.map(function (x, k) { return '<span' + (k === 0 ? ' class="on"' : '') + '>' + esc(x) + (k === 4 ? '<em id="hb-tbd">2</em>' : '') + '</span>'; }).join('') + '</div>' +
      '<div class="hb-warn">' + haIc('warn') + '<b id="hb-need">' + esc(ha('bNeed', { n: 2 })) + '</b><span>' + ha('bOld') + '</span></div>' +
      '<div class="hb-g"><div class="hb-card"><h6>' + ha('bHandle') + '<em id="hb-cnt">2</em></h6><div class="hb-list">' +
        '<div class="hb-row hb-nw" id="hb-vac"><span>' + haIc('cal') + '</span><div><b>' + ha('bVac') + '<i class="ha-tag s" id="hb-vtag">' + ha('bNew') + '</i></b><small>' + esc(HA.drv) + ' · 14–15 Oct</small></div><em>' + ha('bNow') + '</em></div>' +
        '<div class="hb-row"><span>' + haIc('chat') + '</span><div><b>' + ha('bGen') + '</b><small>Sorin Matei</small></div><em>20.09</em></div>' +
        '<div class="hb-row"><span>' + haIc('chat') + '</span><div><b>' + ha('bGen') + '</b><small>Daniel Rusu</small></div><em>22.09</em></div></div></div>' +
      '<div class="hb-card"><h6>' + esc(ha('bPay', { m: pmn })) + '</h6><div class="hb-pay"><b id="hb-pn">61</b><span>' + esc(ha('bOf', { n: 75 })) + '</span><i id="hb-pp">81%</i></div><div class="hb-pbar"><i id="hb-pbar" style="width:81%"></i></div>' +
        '<small class="hb-miss">' + ha('bMiss') + '</small><div class="hb-chips"><span id="hb-chip">' + avatar(HA.drv, 14) + esc(HA.drv) + '</span><span>' + avatar('Victor Ene', 14) + 'Victor Ene</span><span>+13</span></div>' +
        '<span class="hb-up" id="hb-up">' + haIc('up') + ha('bUpload') + '</span></div></div></div>';
    el.innerHTML = '<div class="hb"><span class="ha-lbl"><i></i>LANU Board · ' + ha('bTitle') + '</span><div class="hb-scr">' + bd + '</div></div>' +
      '<div class="ha-ph ha-d"><span class="ha-lbl"><i></i>' + ha('drv') + '</span><div class="ha-fr"><i class="ha-notch"></i><div class="ha-scr">' + d + '</div></div></div>' +
      '<div class="ha-ph ha-o"><span class="ha-lbl"><i></i>' + esc(ha('off')) + '</span><div class="ha-fr"><i class="ha-notch"></i><div class="ha-scr">' + o + '</div></div></div>' +
      '<div class="ha-fly" id="ha-fly">' + haIc('cal') + '<span>' + esc(ha('sent')) + '</span></div>';
    if (HS.i === 2) haPlay();
  }
  function pmn() { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long' }); }
  function haStop() { HA.tm.forEach(clearTimeout); HA.tm = []; }
  function haPlay() {
    haStop();
    var el = document.getElementById('hv3'); if (!el) return;
    var $ = function (id) { return document.getElementById(id); }, at = function (ms, f) { HA.tm.push(setTimeout(f, reduce ? 0 : ms)); };
    var set = function (id, v) { var e = $(id); if (e && e.textContent !== String(v)) { e.textContent = v; e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } };
    el.className = 'hero-visual hv3'; el.querySelectorAll('.ha-feed').forEach(function (f) { f.style.transform = ''; });
    var f0 = $('ha-fly'); f0.querySelector('span').textContent = ha('sent'); f0.querySelector('svg').innerHTML = HA_IC.cal;
    $('hb-vtag').textContent = ha('bNew'); $('hb-cnt').textContent = 2; $('hb-tbd').textContent = 2; $('hb-need').textContent = ha('bNeed', { n: 2 }); $('hb-pn').textContent = 61; $('hb-pp').textContent = '81%'; $('hb-pbar').style.width = '81%';
    $('ha-dvac').querySelector('small').textContent = ha('dVacSent'); $('ha-dvtag').textContent = ha('sentTag'); $('ha-open').textContent = ha('open', { n: 1 }); $('ha-tb').textContent = 1;
    $('ha-ot').querySelector('button').textContent = ha('approve'); $('ha-need').textContent = 2; $('ha-req').textContent = 2; $('ha-vacn').textContent = 0; $('ha-vapp').textContent = 1;
    var ring = $('ha-ring'), L = 2 * Math.PI * 33;
    ring.style.strokeDasharray = L; ring.style.transition = 'none'; ring.style.strokeDashoffset = L; void ring.getBoundingClientRect();
    ring.style.transition = reduce ? 'none' : 'stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1) .3s'; ring.style.strokeDashoffset = L * (1 - .82);
    var sc = $('ha-score'), t0 = performance.now();
    if (reduce) sc.textContent = nf(84.6, 1);
    else (function st(now) { var k = Math.max(0, Math.min(1, (now - t0 - 300) / 1500)), e = 1 - Math.pow(1 - k, 3); sc.textContent = nf(84.6 * e, 1); if (k < 1 && HS.i === 2) requestAnimationFrame(st); })(t0);
    if (reduce) return;
    at(1700, function () { el.classList.add('s-tap'); });
    var fly = $('ha-fly'), pt = function (q, fx, fy) { var r = el.getBoundingClientRect(), b = q.getBoundingClientRect(); return [b.left - r.left + b.width * fx, b.top - r.top + b.height * fy]; };
    var go = function (a, b) { fly.style.setProperty('--x0', a[0] + 'px'); fly.style.setProperty('--y0', a[1] + 'px'); fly.style.setProperty('--x1', b[0] + 'px'); fly.style.setProperty('--y1', b[1] + 'px'); };
    at(2200, function () { go(pt(el.querySelector('.ha-to span'), .5, .5), pt($('hb-vac'), .35, .5)); el.classList.add('s-fly'); });
    at(3000, function () { el.classList.add('s-bin'); set('hb-cnt', 3); set('hb-tbd', 3); $('hb-need').textContent = ha('bNeed', { n: 3 }); });
    at(3500, function () { el.classList.add('s-p1'); });
    at(3900, function () { el.classList.add('s-new'); set('ha-need', 3); set('ha-req', 3); set('ha-vacn', 1); });
    at(5000, function () { el.classList.add('s-ok'); });
    at(5500, function () { el.classList.add('s-done'); el.classList.add('s-p2'); $('hb-vtag').textContent = ha('okTag'); set('hb-cnt', 2); set('hb-tbd', 2); $('hb-need').textContent = ha('bNeed', { n: 2 }); set('ha-need', 2); set('ha-req', 2); set('ha-vacn', 0); set('ha-vapp', 2); $('ha-ot').querySelector('button').textContent = ha('approved'); });
    at(6100, function () { go(pt($('hb-vac'), .35, .5), pt(el.querySelector('.ha-d .ha-scr'), .5, .04)); el.classList.add('s-back'); });
    at(6600, function () { el.classList.add('s-ohide'); });
    at(7000, function () { el.classList.add('s-recv'); });
    at(8300, function () { el.classList.add('s-dhide'); });
    // scroll both phones down in two stops, with something happening at each stop
    var scr = function (ph, id, dy) { var s = el.querySelector(ph + ' .ha-scr'), f = s.querySelector('.ha-feed'), tg = id ? $(id) : null, max = f.offsetHeight - s.clientHeight;
      f.style.transform = 'translateY(' + (-Math.max(0, Math.min(max, tg ? tg.offsetTop - dy : max))) + 'px)'; };
    at(8500, function () { scr('.ha-d', 'ha-dreq', 150); scr('.ha-o', 'ha-otask', 60); });
    at(10200, function () { el.classList.add('s-dok'); $('ha-dvac').querySelector('small').textContent = ha('dVacOk'); $('ha-dvtag').textContent = ha('okTag'); });
    at(10500, function () { el.classList.add('s-tnew'); });
    at(11200, function () { el.classList.add('s-t2'); set('ha-open', ha('open', { n: 2 })); set('ha-tb', 2); });
    at(13300, function () { scr('.ha-d', null); scr('.ha-o', 'ha-oteam', 40); });
    at(14000, function () { el.classList.add('s-upl'); });
    at(14500, function () { var f2 = $('ha-fly'); f2.querySelector('span').textContent = ha('bSlip', { m: pmn() }); f2.querySelector('svg').innerHTML = HA_IC.slip;
      go(pt($('hb-up'), .5, .5), pt($('ha-upd'), .5, .5)); el.classList.remove('s-fly', 's-back'); void f2.offsetWidth; el.classList.add('s-send'); set('hb-pn', 62); $('hb-pp').textContent = '83%'; $('hb-pbar').style.width = '83%'; });
    at(15400, function () { el.classList.add('s-doc'); el.classList.add('s-slip'); });
    at(15200, function () { el.classList.add('s-dmg'); });
    at(17600, function () { el.classList.add('s-read'); el.classList.add('s-ann'); });
    at(19300, function () { el.querySelectorAll('.ha-feed').forEach(function (f) { f.style.transform = ''; }); });
  }
  haBuild();
  function hsGo(i, user) {
    i = (i + hsEl.length) % hsEl.length;
    if (i === HS.i && !user) return;
    var prev = hsEl[HS.i], next = hsEl[i];
    HS.i = i;
    window.LANU_CITY_THEME = i;
    document.querySelector('.hero').classList.toggle('money', i === 1);
    document.querySelector('.hero').classList.toggle('app', i === 2);
    if (prev !== next) { prev.classList.remove('on'); prev.classList.add('leave'); prev.setAttribute('aria-hidden', 'true'); setTimeout(function () { prev.classList.remove('leave'); }, 700); }
    next.classList.add('on'); next.removeAttribute('aria-hidden');
    var h = next.querySelector('h1,h2'); if (h) { var html = h.innerHTML; h.innerHTML = ''; void h.offsetWidth; h.innerHTML = html; }
    var sc = document.getElementById('hero-scan'); if (sc && !reduce) { sc.classList.remove('run'); void sc.offsetWidth; sc.classList.add('run'); }
    if (i === 1) hsMoney();
    if (i === 2) haPlay(); else haStop();
    hsNav.querySelectorAll('.hs-tab').forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.remove('run'); });
    hsNav.style.setProperty('--hs-dur', HS.durs[i] + 'ms'); void hsNav.offsetWidth; var on = hsNav.querySelector('.hs-tab.on'); if (on && !reduce) on.classList.add('run');
    hsSched();
  }
  function hsSched() { clearTimeout(HS.timer); if (reduce || !HS.inView) return; HS.timer = setTimeout(function () { hsGo(HS.i + 1); }, HS.durs[HS.i] || HS.dur); }
  if (hsNav) {
    hsNav.style.setProperty('--hs-dur', HS.dur + 'ms');
    hsNav.addEventListener('click', function (e) { var b = e.target.closest('[data-hs-to],[data-hs-go]'); if (!b) return; hsGo(b.dataset.hsTo !== undefined ? Number(b.dataset.hsTo) : HS.i + Number(b.dataset.hsGo), true); });
    var tx = null;
    document.querySelector('.hero-slides').addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    document.querySelector('.hero-slides').addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) hsGo(HS.i + (dx < 0 ? 1 : -1), true); tx = null; }, { passive: true });
    new IntersectionObserver(function (en) { HS.inView = en[0].isIntersecting; if (HS.inView) hsSched(); else clearTimeout(HS.timer); }).observe(document.querySelector('.hero'));
    heroSpark(); var on0 = hsNav.querySelector('.hs-tab.on'); if (on0 && !reduce) on0.classList.add('run'); hsSched();
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
    var TOP0 = [19, 40, 74], TOP1 = [30, 60, 104], LEFT = [14, 31, 58], RIGHT = [10, 24, 46], HOT = [59, 155, 255], HOT_B = [59, 155, 255], HOT_E = [16, 205, 140], HOT_V = [150, 110, 255], themeK = 0, themeV = 0;
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
      var th = window.LANU_CITY_THEME || 0; themeK += ((th === 1 ? 1 : 0) - themeK) * .05; themeV += ((th === 2 ? 1 : 0) - themeV) * .05; HOT = mix2(mix2(HOT_B, HOT_E, themeK), HOT_V, themeV);
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
        ctx.strokeStyle = themeK > .5 ? 'rgba(120,230,190,' + (.1 + heat * .5) + ')' : themeV > .5 ? 'rgba(180,160,255,' + (.1 + heat * .5) + ')' : 'rgba(140,190,255,' + (.1 + heat * .5) + ')'; ctx.lineWidth = 1; ctx.stroke();
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
        var c1 = mix2(mix2([160, 225, 255], [170, 255, 215], themeK), [205, 190, 255], themeV), c2 = mix2(mix2([92, 200, 255], [52, 225, 160], themeK), [150, 110, 255], themeV);
        gr.addColorStop(0, 'rgba(' + c1.map(Math.round) + ',.95)'); gr.addColorStop(.25, 'rgba(' + c2.map(Math.round) + ',.5)'); gr.addColorStop(1, 'rgba(' + c2.map(Math.round) + ',0)');
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
  if (mock2) { p2Render(); p2Focus('capweeks', true, true); p2Ind(); }
  if (owZ) { owRender(); owFit(); owSteps(); }
  if (!reduce) {
    countUp(document.getElementById('hv-count'), liveDelivered === undefined ? 8412 : liveDelivered, fmt, 1600);
    countUp(document.querySelector('.hv-num'), 64, String, 1400);
    countUp(document.querySelector('.hv-risknum'), 2, String, 1400);
  }
  renderMock();
  focusStep('overview', true);
})();
