/*
 * Board accounts — reference implementation (plain JS, no build step).
 * Markup and inline styles are copied 1:1 from the approved design canvas; behaviour follows README.md.
 * Demo/test URL params are listed in README §12. Data is in-memory demo data (the real list comes from the API).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- data
  var SECTIONS = [
    { id: 'ops', name: 'Operations' },
    { id: 'da', name: 'Delivery Associates' },
    { id: 'phones', name: 'Company phones' },
    { id: 'housing', name: 'Housing' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'weekly', name: 'Weekly Reports', children: [['dsp', 'DSP Scorecard'], ['iadc', 'IADC Report'], ['conc', 'Concessions Report'], ['contact', 'Contact Compliance'], ['pod', 'POD Quality']] },
    { id: 'associates', name: 'Associates' },
    { id: 'recruiting', name: 'Recruiting' },
    { id: 'planning', name: 'Planning', children: [['capacity', 'Capacity Planning'], ['workplan', 'Work plan'], ['atlas', 'Atlas Parcels']] },
    { id: 'timesheets', name: 'Timesheets', children: [['workdays', 'Working Days'], ['rescue', 'Rescue'], ['daily', 'Daily Protocol'], ['wst', 'Work Summary Tool'], ['accom', 'DAs Accommodation & Problems'], ['food', 'Average Food'], ['kenjo', 'Kenjo Sync']] },
    { id: 'fleet', name: 'Fleet', children: [['fleetlist', 'Fleet'], ['history', 'History'], ['photos', 'Vehicle photos'], ['pickups', 'Pickups / returns'], ['accidents', 'Accidents'], ['refuel', 'Refuelling']] },
    { id: 'gps', name: 'GPS' },
    { id: 'appadmin', name: 'App admin' },
    { id: 'mdm', name: 'MDM' },
    { id: 'backoffice', name: 'Back Office', children: [['contracts', 'Contracts'], ['terminations', 'Terminations'], ['drivers', 'Drivers']] }
  ];
  function leaves(sec) { return sec.children ? sec.children.map(function (c) { return c[0]; }) : [sec.id]; }
  var ALL = SECTIONS.reduce(function (acc, sec) { return acc.concat(leaves(sec)); }, []);
  function toSet(keys) { var o = {}; keys.forEach(function (k) { o[k] = true; }); return o; }
  function copySet(s) { return Object.assign({}, s); }
  function sameSet(a, b) { return ALL.every(function (k) { return !!a[k] === !!b[k]; }); }
  function sectionCount(set) { return SECTIONS.filter(function (sec) { return leaves(sec).some(function (k) { return set[k]; }); }).length; }

  var DISPATCHER = ['ops', 'da', 'phones', 'housing', 'equipment', 'recruiting', 'capacity', 'workplan', 'atlas', 'workdays', 'rescue', 'daily', 'wst', 'accom', 'food', 'kenjo', 'fleetlist', 'history', 'photos', 'pickups', 'accidents', 'refuel', 'gps'];
  var MANAGER = ALL.filter(function (k) { return ['contracts', 'terminations', 'drivers'].indexOf(k) < 0; });
  var WEEKLY = ['dsp', 'iadc', 'conc', 'contact', 'pod'];

  var TONES = { teal: ['#DDEDEB', '#11655C'], blue: ['#E2EAFF', '#1F54D6'], peach: ['#F6E4DD', '#A3401C'], lavender: ['#E9E5F9', '#5536C9'] };
  var TONE_CYCLE = ['teal', 'blue', 'peach', 'lavender'];
  var ROLE_STYLE = { Admin: ['#DDF3E6', '#146C3E', '#1E9E5A'], Manager: ['#E2EAFF', '#1F54D6', '#2F6BFF'], Dispatcher: ['#EEF0F5', '#56607A', '#8A93A6'] };

  // perms: null = follows the role defaults; a set = custom ticks
  var accounts = [
    { id: 'ac', initials: 'AC', name: 'Alexandru Cosmin Hoarta', email: 'alexhoarta89@gmail.com', role: 'Dispatcher', perms: toSet(DISPATCHER.filter(function (k) { return k !== 'housing'; }).concat(['associates'])), last: 'Today, 13:58', tone: 'teal' },
    { id: 'am', initials: 'AM', name: 'Andrei Musteret', email: 'musteretandrei@gmail.com', role: 'Admin', perms: null, you: true, last: 'Today, 18:00', tone: 'blue' },
    { id: 'aa', initials: 'AA', name: 'Antonio Alexandru Andrei', email: 'andreiantonio016@gmail.com', role: 'Dispatcher', perms: toSet(DISPATCHER.concat(['associates'])), last: '4 Oct, 22:35', tone: 'peach' },
    { id: 'cc', initials: 'CC', name: 'Catalina Cucos', email: 'catalinacatalina1810@gmail.com', role: 'Admin', perms: null, last: 'Today, 15:43', tone: 'blue' },
    { id: 'md', initials: 'MD', name: 'Maria Denisa Cucos', email: 'maytedeny22@gmail.com', role: 'Admin', perms: null, last: 'Today, 13:42', tone: 'lavender' },
    { id: 'mu', initials: 'MÜ', name: 'Mustafa Ünlü Serhat', email: 'lanulogistics@gmail.com', role: 'Admin', perms: null, last: null, tone: 'teal' },
    { id: 'ss', initials: 'SS', name: 'Silviu Stefan Musteret', email: 'mstsilviu5@gmail.com', role: 'Dispatcher', perms: toSet(DISPATCHER.concat(WEEKLY)), last: null, tone: 'blue' }
  ];

  var S = {
    view: 'accounts', filter: 'All', q: '', menu: null,
    roles: { base: { Dispatcher: toSet(DISPATCHER), Manager: toSet(MANAGER) }, perms: null, open: { weekly: true }, saved: false },
    panel: null,
    opener: null
  };

  function roleDefault(role) { return role === 'Admin' ? toSet(ALL) : S.roles.base[role]; }
  function effective(a) { return a.role === 'Admin' ? toSet(ALL) : (a.perms || roleDefault(a.role)); }
  function isCustom(a) { return a.role !== 'Admin' && !!a.perms && !sameSet(a.perms, roleDefault(a.role)); }
  function accessText(role, set) { return role === 'Admin' ? 'All sections' : sectionCount(set) + ' of 15 sections'; }
  function byId(id) { return accounts.filter(function (a) { return a.id === id; })[0]; }

  // ---------------------------------------------------------------- helpers
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var I = {
    menu: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>',
    moon: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path></svg>',
    out: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"></path><path d="M10 16l-4-4 4-4"></path><path d="M6 12h10"></path></svg>',
    plus: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
    search: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="position: absolute; left: 12px; top: 11px; color: #6B7489"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l4 4"></path></svg>',
    dots: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="18.5" cy="12" r="1"></circle></svg>',
    key: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4"></circle><path d="M10.8 12.2 20 3"></path><path d="M17 6l3 3"></path></svg>',
    pause: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M10 9v6M14 9v6"></path></svg>',
    play: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M10 8.8v6.4l5-3.2z"></path></svg>',
    trash: '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M10 11v6M14 11v6"></path><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"></path><path d="M9 7V4h6v3"></path></svg>',
    lock: '<svg class="ic" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>',
    tick: '<svg width="12" height="12" viewBox="0 0 12 12"><path class="ba-tick" d="M2.5 6.2 5 8.6 9.6 3.6"></path></svg>',
    dash: '<svg width="12" height="12" viewBox="0 0 12 12"><path class="ba-tick" d="M3 6h6"></path></svg>',
    close: '<svg class="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
    eye: '<svg class="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    eyeOff: '<svg class="ic" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"></path><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.4"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path></svg>',
    regen: '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6"></path><path d="M20 4v5h-5"></path></svg>',
    check: '<svg class="ic" width="26" height="26" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>'
  };
  function chevron(rot, down) {
    return '<svg class="ic ba-chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style="transform: rotate(' + rot + 'deg)"><path d="' + (down ? 'M6 9l6 6 6-6' : 'M9 6l6 6-6 6') + '"></path></svg>';
  }
  function roleBadge(role) {
    var c = ROLE_STYLE[role];
    return '<span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: ' + c[0] + '; color: ' + c[1] + '; font-size: 13px; font-weight: 600"><span aria-hidden="true" style="width: 6px; height: 6px; border-radius: 50%; background: ' + c[2] + '"></span>' + role + '</span>';
  }
  function checkbox(state, attrs, label) {
    var on = state !== 'none';
    return '<input type="checkbox"' + (state === 'all' ? ' checked' : '') + attrs + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' +
      '<span aria-hidden="true" style="flex: none; width: 20px; height: 20px; box-sizing: border-box; border-radius: 6px; border: 1.5px solid ' + (on ? '#2F6BFF' : '#8A93A6') + '; background: ' + (on ? '#2F6BFF' : '#FFFFFF') + '; display: flex; align-items: center; justify-content: center; color: #FFFFFF">' + (state === 'all' ? I.tick : state === 'some' ? I.dash : '') + '</span>';
  }
  function triState(set, keys) {
    var n = keys.filter(function (k) { return set[k]; }).length;
    return n === 0 ? 'none' : n === keys.length ? 'all' : 'some';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // ---------------------------------------------------------------- shell + page head
  function shellHtml() {
    var ghost = 'width: 40px; height: 40px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; display: flex; align-items: center; justify-content: center; color: #0B1B34; cursor: pointer';
    var lang = function (code, on) {
      return '<button type="button" aria-pressed="' + on + '" style="height: 30px; min-width: 36px; padding: 0 8px; border: 0; border-radius: 7px; background: ' + (on ? '#FFFFFF' : 'transparent') + '; color: ' + (on ? '#0B1B34' : '#56607A') + '; font-size: 12px; font-weight: 700; cursor: pointer' + (on ? '; box-shadow: 0 1px 2px rgba(11,27,52,0.08)' : '') + '">' + code + '</button>';
    };
    return '<header style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 24px; background: #F4F5F7; border-bottom: 1px solid #E3E6EE">' +
      '<div style="display: flex; align-items: center; gap: 14px">' +
      '<button type="button" class="ba-ghost" aria-label="Open menu" style="' + ghost + '">' + I.menu + '</button>' +
      '<div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 18px; font-weight: 700; line-height: 1.2">Board accounts</span><span style="font-size: 12px; color: #56607A">Wednesday, 7 October 2026</span></div>' +
      '</div>' +
      '<div style="display: flex; align-items: center; gap: 12px">' +
      '<div role="group" aria-label="Language" style="display: inline-flex; gap: 2px; padding: 3px; border-radius: 10px; background: #EEF0F5">' + lang('RO', false) + lang('DE', false) + lang('EN', true) + '</div>' +
      '<button type="button" class="ba-ghost" aria-label="Dark mode" style="' + ghost + '">' + I.moon + '</button>' +
      '<div style="display: flex; align-items: center; gap: 10px"><span aria-hidden="true" style="width: 32px; height: 32px; border-radius: 50%; background: #2F6BFF; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700">A</span><span style="font-size: 14px; font-weight: 600">Andrei Musteret</span></div>' +
      '<button type="button" class="ba-ghost" aria-label="Sign out" style="' + ghost + '">' + I.out + '</button>' +
      '</div></header>';
  }

  function pageHeadHtml() {
    return '<div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px">' +
      '<div style="display: flex; flex-direction: column; gap: 6px">' +
      '<h1 style="margin: 0; font-size: 28px; line-height: 1.15; font-weight: 700; letter-spacing: -0.01em">Board accounts</h1>' +
      '<p style="margin: 0; font-size: 15px; line-height: 1.5; color: #56607A">Create accounts and choose which sections of the Board each person can open.</p>' +
      '</div>' +
      '<button type="button" class="ba-primary" data-action="new" data-fk="new" style="display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 18px; border: 0; border-radius: 10px; background: #2F6BFF; color: #FFFFFF; font-size: 15px; font-weight: 600; cursor: pointer">' + I.plus + 'New account</button>' +
      '</div>';
  }

  function tabsHtml() {
    var acc = S.view === 'accounts';
    var count = '<span style="min-width: 22px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: ' + (acc ? '#E2EAFF' : '#EEF0F5') + '; color: ' + (acc ? '#1F54D6' : '#56607A') + '; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center">' + accounts.length + '</span>';
    var tab = function (view, label, extra) {
      var on = S.view === view;
      return '<a href="?view=' + view + '" data-action="tab" data-view="' + view + '" data-fk="tab-' + view + '"' + (on ? ' aria-current="page"' : ' class="ba-tab"') +
        ' style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 2px; margin-bottom: -1px; border-bottom: 2px solid ' + (on ? '#2F6BFF' : 'transparent') + '; color: ' + (on ? '#0B1B34' : '#56607A') + '; font-size: 15px; font-weight: 600; text-decoration: none">' + label + (extra || '') + '</a>';
    };
    return '<nav aria-label="Board accounts" style="display: flex; gap: 28px; border-bottom: 1px solid #E3E6EE">' + tab('accounts', 'Accounts', count) + tab('roles', 'Role permissions') + '</nav>';
  }

  // ---------------------------------------------------------------- accounts view
  function filtered() {
    var needle = S.q.trim().toLowerCase();
    return accounts.filter(function (a) {
      return (S.filter === 'All' || a.role === S.filter) &&
        (!needle || a.name.toLowerCase().indexOf(needle) >= 0 || a.email.toLowerCase().indexOf(needle) >= 0);
    });
  }

  function chipsHtml() {
    return ['All', 'Admin', 'Manager', 'Dispatcher'].map(function (r) {
      var on = S.filter === r;
      var n = accounts.filter(function (a) { return r === 'All' || a.role === r; }).length;
      return '<button type="button" class="ba-chip" data-action="filter" data-role="' + r + '" data-fk="chip-' + r + '" aria-pressed="' + on + '" style="height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid ' + (on ? '#0B1B34' : '#E3E6EE') + '; background: ' + (on ? '#0B1B34' : '#FFFFFF') + '; color: ' + (on ? '#FFFFFF' : '#0B1B34') + '; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer">' +
        (r === 'All' ? 'All' : r + 's') + '<span style="font-size: 12px; font-weight: 700; color: ' + (on ? '#C7CEDB' : '#6B7489') + '">' + n + '</span></button>';
    }).join('');
  }

  var TD = 'padding: 14px 20px; border-bottom: 1px solid #EDF0F5';
  function rowsHtml() {
    var list = filtered();
    if (!list.length) {
      var needle = S.q.trim();
      return '<tr><td colspan="5" style="padding: 48px 20px; text-align: center"><div style="display: flex; flex-direction: column; align-items: center; gap: 12px">' +
        '<span style="font-size: 15px; font-weight: 600">' + esc(needle ? 'No account matches “' + needle + '”' : 'No ' + S.filter.toLowerCase() + 's yet') + '</span>' +
        '<span style="font-size: 14px; color: #56607A">' + esc(needle ? 'Check the spelling, or search by email instead.' : 'Create one and pick the ' + S.filter + ' role.') + '</span>' +
        '<button type="button" class="ba-primary" data-action="new" data-fk="new-empty" style="display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border: 0; border-radius: 10px; background: #2F6BFF; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer">New account</button>' +
        '</div></td></tr>';
    }
    return list.map(function (a, i) {
      var tone = TONES[a.tone];
      var menuOpen = S.menu === a.id;
      var menuPos = i >= list.length - 2 && list.length > 3 ? 'bottom: 44px' : 'top: 44px';
      var item = 'display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 10px; border: 0; border-radius: 8px; background: transparent; color: #0B1B34; font-size: 14px; font-weight: 500; text-align: left; cursor: pointer';
      var menu = !menuOpen ? '' :
        '<div role="menu" class="ba-menu" aria-label="Actions for ' + esc(a.name) + '" style="position: absolute; right: 0; ' + menuPos + '; z-index: 5; width: 220px; padding: 6px; box-sizing: border-box; border-radius: 12px; border: 1px solid #E3E6EE; background: #FFFFFF; box-shadow: 0 12px 32px rgba(11,27,52,0.14); display: flex; flex-direction: column; gap: 2px">' +
        '<button type="button" role="menuitem" data-action="menu-password" data-id="' + a.id + '" data-fk="mi-pw-' + a.id + '" style="' + item + '">' + I.key + 'Change password</button>' +
        (a.you ? '' :
          '<button type="button" role="menuitem" data-action="menu-toggle-active" data-id="' + a.id + '" data-fk="mi-act-' + a.id + '" style="' + item + '">' + (a.deactivated ? I.play + 'Reactivate' : I.pause + 'Deactivate') + '</button>' +
          '<div style="height: 1px; margin: 4px 6px; background: #EDF0F5"></div>' +
          '<button type="button" role="menuitem" class="ba-danger" data-action="menu-delete" data-id="' + a.id + '" data-fk="mi-del-' + a.id + '" style="' + item.replace('color: #0B1B34', 'color: #A32D2D').replace('font-weight: 500', 'font-weight: 600') + '">' + I.trash + 'Delete account…</button>') +
        '</div>';
      var tag = function (text, bg, fg, border) {
        return '<span style="padding: 1px 8px; border-radius: 999px; ' + (border ? 'border: 1px solid ' + border + '; ' : 'background: ' + bg + '; ') + 'color: ' + fg + '; font-size: 12px; font-weight: 600">' + text + '</span>';
      };
      return '<tr class="ba-row">' +
        '<td style="' + TD + '"><div style="display: flex; align-items: center; gap: 12px">' +
        '<span aria-hidden="true" style="flex: none; width: 36px; height: 36px; border-radius: 50%; background: ' + tone[0] + '; color: ' + tone[1] + '; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700">' + esc(a.initials) + '</span>' +
        '<div style="display: flex; flex-direction: column; gap: 2px; min-width: 0">' +
        '<div style="display: flex; align-items: center; gap: 8px"><span style="font-size: 15px; font-weight: 600">' + esc(a.name) + '</span>' + (a.you ? tag('You', '#EEF0F5', '#56607A') : '') + (a.deactivated ? tag('Deactivated', '#EEF0F5', '#56607A') : '') + '</div>' +
        '<span style="font-size: 13px; color: #56607A">' + esc(a.email) + '</span></div></div></td>' +
        '<td style="' + TD + '">' + roleBadge(a.role) + '</td>' +
        '<td style="' + TD + '"><div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap"><span>' + accessText(a.role, effective(a)) + '</span>' +
        (isCustom(a) ? '<span title="This person has their own ticks instead of the role\'s" style="padding: 1px 8px; border-radius: 999px; border: 1px solid #C9D7FF; color: #1F54D6; font-size: 12px; font-weight: 600">Custom</span>' : '') + '</div></td>' +
        '<td style="' + TD + '; color: ' + (a.last ? '#0B1B34' : '#6B7489') + '">' + esc(a.last || 'Never signed in') + '</td>' +
        '<td style="' + TD + '"><div style="position: relative; display: flex; justify-content: flex-end; align-items: center; gap: 8px">' +
        '<button type="button" class="ba-ghost" data-action="edit" data-id="' + a.id + '" data-fk="edit-' + a.id + '" aria-label="Edit ' + esc(a.name) + '" style="display: inline-flex; align-items: center; height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; color: #0B1B34; font-size: 14px; font-weight: 600; cursor: pointer">Edit</button>' +
        '<button type="button" class="ba-ghost" data-action="menu" data-id="' + a.id + '" data-fk="menu-' + a.id + '" aria-label="More actions for ' + esc(a.name) + '" aria-expanded="' + menuOpen + '" aria-haspopup="menu" style="width: 36px; height: 36px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; display: flex; align-items: center; justify-content: center; color: #0B1B34; cursor: pointer">' + I.dots + '</button>' +
        menu + '</div></td></tr>';
    }).join('');
  }

  function accountsViewHtml() {
    var th = 'text-align: left; padding: 12px 20px; font-size: 13px; font-weight: 600; color: #6B7489; border-bottom: 1px solid #EDF0F5';
    return '<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px">' +
      '<div role="group" aria-label="Filter by role" style="display: flex; flex-wrap: wrap; gap: 8px" id="ba-chips">' + chipsHtml() + '</div>' +
      '<div style="position: relative; width: 320px; max-width: 100%"><label for="ba-search" class="ba-sr">Search accounts</label>' + I.search +
      '<input id="ba-search" data-fk="search" type="search" placeholder="Search name or email" value="' + esc(S.q) + '" style="width: 100%; height: 40px; box-sizing: border-box; padding: 0 12px 0 38px; border-radius: 10px; border: 1px solid #D5DAE3; background: #FFFFFF; font-size: 14px; color: #0B1B34"></div>' +
      '</div>' +
      '<div style="background: #FFFFFF; border: 1px solid #E3E6EE; border-radius: 14px; overflow-x: auto">' +
      '<table style="width: 100%; min-width: 880px; border-collapse: collapse; font-size: 14px"><thead><tr style="background: #FAFBFC">' +
      '<th scope="col" style="' + th + '">Person</th>' +
      '<th scope="col" style="' + th + '; width: 150px">Role</th>' +
      '<th scope="col" style="' + th + '; width: 230px">Access</th>' +
      '<th scope="col" style="' + th + '; width: 170px">Last sign-in</th>' +
      '<th scope="col" style="' + th.replace('text-align: left', 'text-align: right') + '; width: 130px"><span class="ba-sr">Actions</span></th>' +
      '</tr></thead><tbody id="ba-tbody">' + rowsHtml() + '</tbody></table></div>';
  }

  // ---------------------------------------------------------------- roles view
  function rolesPerms() { return S.roles.perms || S.roles.base; }
  function rolesChanges() {
    var p = rolesPerms(), b = S.roles.base;
    return ['Dispatcher', 'Manager'].reduce(function (sum, r) { return sum + ALL.filter(function (k) { return !!p[r][k] !== !!b[r][k]; }).length; }, 0);
  }
  function roleHead(role, sub, lockIcon) {
    return '<th scope="col" style="width: 190px; padding: 12px 8px; border-bottom: 1px solid #EDF0F5"><div style="display: flex; flex-direction: column; align-items: center; gap: 4px">' + roleBadge(role) +
      '<span style="' + (lockIcon ? 'display: inline-flex; align-items: center; gap: 4px; ' : '') + 'font-size: 12px; font-weight: 500; color: #6B7489">' + (lockIcon ? I.lock : '') + sub + '</span></div></th>';
  }
  function matrixCell(role, keys, label, fk) {
    return '<td style="text-align: center; border-bottom: 1px solid #EDF0F5"><label class="ba-cb" style="position: relative; display: inline-flex; width: 44px; height: 40px; align-items: center; justify-content: center; cursor: pointer">' +
      checkbox(triState(rolesPerms()[role], keys), ' data-action="role-tick" data-role="' + role + '" data-keys="' + keys.join(',') + '" data-fk="' + fk + '" style="position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer"', role + ': ' + label) +
      '</label></td>';
  }
  function rolesViewHtml() {
    var p = rolesPerms();
    var changes = rolesChanges();
    var rows = '';
    SECTIONS.forEach(function (sec) {
      var kids = sec.children || [];
      var open = !!S.roles.open[sec.id];
      rows += '<tr class="ba-mrow" style="background: #FFFFFF">' +
        '<th scope="row" style="text-align: left; padding: 0 20px; height: 48px; border-bottom: 1px solid #EDF0F5; font-size: 15px; font-weight: 600; color: #0B1B34"><div style="display: flex; align-items: center; gap: 8px; padding-left: 0px">' +
        (kids.length ? '<button type="button" data-action="role-open" data-id="' + sec.id + '" data-fk="ro-' + sec.id + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Hide pages in ' : 'Show pages in ') + esc(sec.name) + '" class="ba-ghost" style="flex: none; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; display: flex; align-items: center; justify-content: center; color: #56607A; cursor: pointer">' + chevron(open ? 90 : 0) + '</button>' : '<span style="flex: none; width: 32px"></span>') +
        '<span>' + esc(sec.name) + '</span>' + (kids.length ? '<span style="font-size: 12px; font-weight: 500; color: #6B7489">' + kids.length + ' pages</span>' : '') +
        '</div></th>' +
        matrixCell('Dispatcher', leaves(sec), sec.name, 'rd-' + sec.id) + matrixCell('Manager', leaves(sec), sec.name, 'rm-' + sec.id) +
        '<td style="text-align: center; border-bottom: 1px solid #EDF0F5"><span role="img" aria-label="Admin: ' + esc(sec.name) + ', always on" style="display: inline-flex; width: 20px; height: 20px; box-sizing: border-box; border-radius: 6px; background: #C9D7FF; align-items: center; justify-content: center; color: #FFFFFF">' + I.tick.replace('<svg', '<svg aria-hidden="true"') + '</span></td></tr>';
      if (open) {
        kids.forEach(function (c) {
          rows += '<tr class="ba-mrow" style="background: #FAFBFC">' +
            '<th scope="row" style="text-align: left; padding: 0 20px; height: 40px; border-bottom: 1px solid #EDF0F5; font-size: 14px; font-weight: 500; color: #56607A"><div style="display: flex; align-items: center; gap: 8px; padding-left: 40px"><span style="flex: none; width: 32px"></span><span>' + esc(c[1]) + '</span></div></th>' +
            matrixCell('Dispatcher', [c[0]], sec.name + ' / ' + c[1], 'rd-' + c[0]) + matrixCell('Manager', [c[0]], sec.name + ' / ' + c[1], 'rm-' + c[0]) +
            '<td style="text-align: center; border-bottom: 1px solid #EDF0F5"><span role="img" aria-label="Admin: ' + esc(c[1]) + ', always on" style="display: inline-flex; width: 20px; height: 20px; box-sizing: border-box; border-radius: 6px; background: #C9D7FF; align-items: center; justify-content: center; color: #FFFFFF">' + I.tick.replace('<svg', '<svg aria-hidden="true"') + '</span></td></tr>';
        });
      }
    });
    var op = changes ? 1 : 0.45;
    return '<section aria-labelledby="ba-roles-title" style="background: #FFFFFF; border: 1px solid #E3E6EE; border-radius: 14px; overflow: hidden">' +
      '<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; border-bottom: 1px solid #EDF0F5">' +
      '<div style="display: flex; flex-direction: column; gap: 4px; max-width: 640px"><h2 id="ba-roles-title" style="margin: 0; font-size: 17px; font-weight: 700">Default access per role</h2>' +
      '<p style="margin: 0; font-size: 14px; line-height: 1.5; color: #56607A">The ticks a new account starts with. People marked <strong style="font-weight: 600; color: #1F54D6">Custom</strong> keep their own ticks. Admins always have every section.</p></div>' +
      '<div style="display: flex; align-items: center; gap: 12px">' +
      '<span role="status" style="font-size: 14px; color: ' + (changes ? '#1F54D6' : '#6B7489') + '">' + (changes ? plural(changes, 'unsaved change', 'unsaved changes') : (S.roles.saved ? 'Saved' : 'No unsaved changes')) + '</span>' +
      '<button type="button" class="ba-ghost" data-action="role-discard" data-fk="role-discard"' + (changes ? '' : ' disabled') + ' style="height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; color: #0B1B34; font-size: 14px; font-weight: 600; cursor: pointer; opacity: ' + op + '">Discard</button>' +
      '<button type="button" data-action="role-save" data-fk="role-save"' + (changes ? '' : ' disabled') + ' style="height: 40px; padding: 0 16px; border-radius: 10px; border: 0; background: #2F6BFF; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer; opacity: ' + op + '">Save permissions</button>' +
      '</div></div>' +
      '<div style="overflow-x: auto"><table style="width: 100%; min-width: 760px; border-collapse: collapse; font-size: 14px"><thead><tr style="background: #FAFBFC">' +
      '<th scope="col" style="text-align: left; padding: 14px 20px; font-size: 13px; font-weight: 600; color: #6B7489; border-bottom: 1px solid #EDF0F5">Section</th>' +
      roleHead('Dispatcher', sectionCount(p.Dispatcher) + ' of 15 sections') + roleHead('Manager', sectionCount(p.Manager) + ' of 15 sections') + roleHead('Admin', 'All sections, always', true) +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p style="margin: 0; padding: 14px 20px; font-size: 13px; line-height: 1.5; color: #56607A; background: #FAFBFC">A fully ticked section also gets pages that are added to it later. A partly ticked section keeps only the ticked pages.</p>' +
      '</section>';
  }

  // ---------------------------------------------------------------- panels (shared parts)
  var INPUT = 'height: 44px; box-sizing: border-box; padding: 0 12px; border-radius: 10px; border: 1px solid #C3CBDA; font-size: 15px; color: #0B1B34; background: #FFFFFF';
  var GHOST_BTN = 'height: 44px; padding: 0 16px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; color: #0B1B34; font-size: 15px; font-weight: 600; cursor: pointer';
  var PRIMARY_BTN = 'height: 44px; padding: 0 18px; border-radius: 10px; border: 0; background: #2F6BFF; color: #FFFFFF; font-size: 15px; font-weight: 600; cursor: pointer';

  function roleCardsHtml(role, group) {
    return '<div role="radiogroup" aria-labelledby="' + group + '" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">' +
      ['Dispatcher', 'Manager', 'Admin'].map(function (r) {
        var on = r === role;
        return '<label class="ba-radio" style="position: relative; display: flex; flex-direction: column; gap: 6px; padding: 14px; border-radius: 12px; border: 1.5px solid ' + (on ? '#2F6BFF' : '#E3E6EE') + '; background: ' + (on ? '#F5F8FF' : '#FFFFFF') + '; cursor: pointer">' +
          '<input type="radio" name="' + group + '-radio" value="' + r + '"' + (on ? ' checked' : '') + ' data-action="panel-role" data-fk="' + group + '-' + r + '" style="position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer">' +
          '<span style="display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600"><span aria-hidden="true" style="flex: none; width: 16px; height: 16px; box-sizing: border-box; border-radius: 50%; border: ' + (on ? '5px solid #2F6BFF' : '1.5px solid #8A93A6') + '; background: #FFFFFF"></span>' + r + '</span>' +
          '<span style="font-size: 13px; line-height: 1.4; color: #56607A">' + (r === 'Admin' ? 'Every section' : sectionCount(roleDefault(r)) + ' of 15 sections by default') + '</span></label>';
      }).join('') + '</div>';
  }

  function treeHtml(perms, open, def) {
    var out = '';
    SECTIONS.forEach(function (sec) {
      var keys = leaves(sec), kids = sec.children || [], isOpen = !!open[sec.id];
      var n = keys.filter(function (k) { return perms[k]; }).length;
      var diff = def && kids.length === 0 && !!perms[sec.id] !== !!def[sec.id];
      out += '<div class="ba-trow" style="display: flex; align-items: center; gap: 4px; min-height: 46px; padding: 0 8px 0 14px; background: #FFFFFF; border-bottom: 1px solid #EDF0F5">' +
        '<label class="ba-cb" style="position: relative; flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; min-height: 46px; cursor: pointer">' +
        checkbox(triState(perms, keys), ' data-action="panel-tick" data-keys="' + keys.join(',') + '" data-fk="pt-' + sec.id + '" style="position: absolute; left: 0; top: 50%; width: 20px; height: 20px; margin: -10px 0 0; opacity: 0; cursor: pointer"') +
        '<span style="font-size: 15px; font-weight: 600; color: #0B1B34">' + esc(sec.name) + '</span>' +
        (kids.length ? '<span style="font-size: 12px; color: #6B7489">' + n + '/' + keys.length + '</span>' : '') +
        (diff ? '<span style="padding: 1px 7px; border-radius: 999px; background: #EEF3FF; color: #1F54D6; font-size: 11px; font-weight: 700">' + (perms[sec.id] ? 'Added' : 'Removed') + '</span>' : '') +
        '</label>' +
        (kids.length ? '<button type="button" class="ba-ghost" data-action="panel-open" data-id="' + sec.id + '" data-fk="po-' + sec.id + '" aria-expanded="' + isOpen + '" aria-label="' + (isOpen ? 'Hide pages in ' : 'Show pages in ') + esc(sec.name) + '" style="flex: none; width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent; display: flex; align-items: center; justify-content: center; color: #56607A; cursor: pointer">' + chevron(isOpen ? 180 : 0, true) + '</button>' : '') +
        '</div>';
      if (isOpen) {
        kids.forEach(function (c) {
          var on = !!perms[c[0]];
          var cdiff = def && on !== !!def[c[0]];
          out += '<div class="ba-trow" style="display: flex; align-items: center; gap: 4px; min-height: 40px; padding: 0 8px 0 46px; background: #FAFBFC; border-bottom: 1px solid #EDF0F5">' +
            '<label class="ba-cb" style="position: relative; flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; min-height: 40px; cursor: pointer">' +
            checkbox(on ? 'all' : 'none', ' data-action="panel-tick" data-keys="' + c[0] + '" data-fk="pt-' + c[0] + '" style="position: absolute; left: 0; top: 50%; width: 20px; height: 20px; margin: -10px 0 0; opacity: 0; cursor: pointer"') +
            '<span style="font-size: 14px; font-weight: 500; color: #56607A">' + esc(c[1]) + '</span>' +
            (cdiff ? '<span style="padding: 1px 7px; border-radius: 999px; background: #EEF3FF; color: #1F54D6; font-size: 11px; font-weight: 700">' + (on ? 'Added' : 'Removed') + '</span>' : '') +
            '</label></div>';
        });
      }
    });
    return '<div style="border: 1px solid #E3E6EE; border-radius: 12px; overflow: hidden">' + out + '</div>';
  }

  function pwFieldHtml(id, value, show, bad, fk) {
    return '<div style="display: flex; gap: 8px"><div style="position: relative; flex: 1">' +
      '<input id="' + id + '" data-input="pw" data-fk="' + fk + '" type="' + (show ? 'text' : 'password') + '" autocomplete="new-password" value="' + esc(value) + '"' + (bad ? ' aria-invalid="true"' : '') + ' style="width: 100%; ' + INPUT.replace('padding: 0 12px', 'padding: 0 48px 0 12px').replace('#C3CBDA', bad ? '#A32D2D' : '#C3CBDA') + '">' +
      '<button type="button" data-action="pw-show" data-fk="' + fk + '-eye" aria-label="' + (show ? 'Hide password' : 'Show password') + '" style="position: absolute; right: 2px; top: 2px; width: 40px; height: 40px; border: 0; border-radius: 8px; background: transparent; display: flex; align-items: center; justify-content: center; color: #56607A; cursor: pointer">' + (show ? I.eyeOff : I.eye) + '</button>' +
      '</div><button type="button" class="ba-ghost" data-action="pw-generate" data-fk="' + fk + '-gen" style="flex: none; height: 44px; padding: 0 14px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; color: #0B1B34; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer">' + I.regen + 'Generate</button></div>';
  }
  function generatePassword() {
    var abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
    for (var i = 0; i < 12; i++) out += abc[Math.floor(Math.random() * abc.length)];
    return out.slice(0, 4) + '-' + out.slice(4, 8) + '-' + out.slice(8);
  }

  // ---------------------------------------------------------------- edit panel
  function editDirty(P) {
    var a = byId(P.id);
    return P.name !== a.name || P.email !== a.email || P.role !== a.role || (P.role !== 'Admin' && !sameSet(P.perms, effective(a)));
  }
  function editPanelHtml() {
    var P = S.panel, a = byId(P.id), tone = TONES[a.tone];
    var isAdmin = P.role === 'Admin', def = roleDefault(P.role);
    var diffKeys = ALL.filter(function (k) { return !!P.perms[k] !== !!def[k]; });
    var custom = !isAdmin && diffKeys.length > 0;
    var plus = diffKeys.filter(function (k) { return P.perms[k]; }).length, minus = diffKeys.length - plus, parts = [];
    if (plus) parts.push(plural(plus, 'page more', 'pages more'));
    if (minus) parts.push(plural(minus, 'page less', 'pages less'));
    var dirty = editDirty(P);
    var lastText = a.last ? 'Last sign-in ' + (a.last.indexOf('Today') === 0 ? 'today' + a.last.slice(5) : a.last) : 'Hasn’t signed in yet';
    var row = 'display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 16px; border-bottom: 1px solid #EDF0F5';
    var smallGhost = 'flex: none; height: 38px; padding: 0 14px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; color: #0B1B34; font-size: 14px; font-weight: 600; cursor: pointer';

    var access = '';
    if (custom) access += '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 10px; background: #EEF3FF; border: 1px solid #C9D7FF"><span style="font-size: 14px; line-height: 1.45; color: #0B1B34"><strong style="font-weight: 600; color: #1F54D6">Custom.</strong> Differs from the ' + P.role + ' defaults: ' + parts.join(', ') + '.</span>' +
      '<button type="button" data-action="panel-reset" data-fk="panel-reset" style="flex: none; height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid #C9D7FF; background: #FFFFFF; color: #1F54D6; font-size: 13px; font-weight: 600; cursor: pointer">Use ' + P.role + ' defaults</button></div>';
    else if (!isAdmin) access += '<div style="padding: 12px 14px; border-radius: 10px; background: #F3F4F7; font-size: 14px; line-height: 1.45; color: #56607A">Uses the ' + P.role + ' defaults. Change any tick to give this person their own access.</div>';
    else access += '<div style="padding: 12px 14px; border-radius: 10px; background: #DDF3E6; font-size: 14px; line-height: 1.45; color: #146C3E">Admins open every section, including the ones added later.</div>';
    if (!isAdmin) access += treeHtml(P.perms, P.open, def);

    var pwRow = '<div style="' + row + (P.pwOpen ? '; flex-direction: column; align-items: stretch' : '') + '">' +
      '<div style="flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 16px"><div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 14px; font-weight: 600">Password</span><span style="font-size: 13px; color: #56607A">' + (P.pwSaved ? 'Password changed just now.' : 'Set a new password for this person.') + '</span></div>' +
      (P.pwOpen ? '' : '<button type="button" class="ba-ghost" data-action="pw-open" data-fk="pw-open" style="' + smallGhost + '">Change password</button>') + '</div>' +
      (!P.pwOpen ? '' :
        '<div style="display: flex; flex-direction: column; gap: 6px; margin-top: 12px"><label for="ba-e-pw" style="font-size: 13px; font-weight: 600">New password</label>' + pwFieldHtml('ba-e-pw', P.pw, P.showPw, P.pwBad, 'e-pw') +
        (P.pwBad ? '<span style="font-size: 13px; color: #A32D2D">Set a password, or use Generate.</span>' : '') +
        '<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px"><button type="button" class="ba-ghost" data-action="pw-cancel" data-fk="pw-cancel" style="' + smallGhost + '">Cancel</button><button type="button" data-action="pw-save" data-fk="pw-save" style="flex: none; height: 38px; padding: 0 14px; border-radius: 10px; border: 0; background: #2F6BFF; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer">Save password</button></div></div>') +
      '</div>';
    var security = pwRow;
    if (!a.you) {
      security += '<div style="' + row + '"><div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 14px; font-weight: 600">' + (a.deactivated ? 'Deactivated' : 'Deactivate') + '</span><span style="font-size: 13px; color: #56607A">' + (a.deactivated ? 'This person can’t sign in right now.' : 'Blocks sign-in until you turn the account back on.') + '</span></div>' +
        '<button type="button" class="ba-ghost" data-action="toggle-active" data-fk="toggle-active" style="' + smallGhost + '">' + (a.deactivated ? 'Reactivate' : 'Deactivate') + '</button></div>' +
        '<div style="display: flex; flex-direction: column; gap: 12px; padding: 14px 16px" id="ba-danger"><div style="display: flex; align-items: center; justify-content: space-between; gap: 16px"><div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 14px; font-weight: 600; color: #A32D2D">Delete account</span><span style="font-size: 13px; color: #56607A">Removes the account for good.</span></div>' +
        '<button type="button" class="ba-danger-btn" data-action="ask-delete" data-fk="ask-delete" aria-expanded="' + !!P.confirming + '" style="flex: none; height: 38px; padding: 0 14px; border-radius: 10px; border: 1px solid #E8BDBD; background: #FFFFFF; color: #A32D2D; font-size: 14px; font-weight: 600; cursor: pointer">Delete…</button></div>' +
        (!P.confirming ? '' :
          '<div role="alertdialog" aria-labelledby="ba-del-q" style="display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 10px; background: #FDEEEE; border: 1px solid #E8BDBD"><span id="ba-del-q" style="font-size: 14px; line-height: 1.45">Delete <strong style="font-weight: 600">' + esc(a.name) + '</strong>’s account? They lose access to the Board right away. This can’t be undone.</span>' +
          '<div style="display: flex; justify-content: flex-end; gap: 8px"><button type="button" class="ba-ghost" data-action="cancel-delete" data-fk="cancel-delete" style="height: 38px; padding: 0 14px; border-radius: 10px; border: 1px solid #E3E6EE; background: #FFFFFF; color: #0B1B34; font-size: 14px; font-weight: 600; cursor: pointer">Keep account</button>' +
          '<button type="button" data-action="confirm-delete" data-fk="confirm-delete" style="height: 38px; padding: 0 14px; border-radius: 10px; border: 0; background: #A32D2D; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer">Delete account</button></div></div>') +
        '</div>';
    }

    return '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid #EDF0F5">' +
      '<div style="display: flex; align-items: center; gap: 14px; min-width: 0"><span aria-hidden="true" style="flex: none; width: 44px; height: 44px; border-radius: 50%; background: ' + tone[0] + '; color: ' + tone[1] + '; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700">' + esc(a.initials) + '</span>' +
      '<div style="display: flex; flex-direction: column; gap: 2px; min-width: 0"><h2 id="ba-panel-title" style="margin: 0; font-size: 19px; font-weight: 700; line-height: 1.25">' + esc(P.name || a.name) + '</h2><span style="font-size: 13px; color: #56607A">' + lastText + '</span></div></div>' +
      '<button type="button" class="ba-ghost" data-action="close" data-fk="close" aria-label="Close" style="flex: none; width: 40px; height: 40px; border: 0; border-radius: 10px; background: transparent; display: flex; align-items: center; justify-content: center; color: #0B1B34; cursor: pointer">' + I.close + '</button></div>' +

      '<div data-scroll style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px">' +
      '<section aria-labelledby="ba-profile" style="display: flex; flex-direction: column; gap: 14px"><h3 id="ba-profile" style="margin: 0; font-size: 15px; font-weight: 700">Profile</h3>' +
      '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px">' +
      '<div style="display: flex; flex-direction: column; gap: 6px"><label for="ba-name" style="font-size: 13px; font-weight: 600">Full name</label><input id="ba-name" data-input="name" data-fk="e-name" type="text" autocomplete="off" value="' + esc(P.name) + '" style="' + INPUT + '"></div>' +
      '<div style="display: flex; flex-direction: column; gap: 6px"><label for="ba-email" style="font-size: 13px; font-weight: 600">Email</label><input id="ba-email" data-input="email" data-fk="e-email" type="email" autocomplete="off" value="' + esc(P.email) + '" style="' + INPUT + '"></div>' +
      '</div></section>' +
      '<section aria-labelledby="ba-role" style="display: flex; flex-direction: column; gap: 14px"><h3 id="ba-role" style="margin: 0; font-size: 15px; font-weight: 700">Role</h3>' + roleCardsHtml(P.role, 'ba-role') + '</section>' +
      '<section aria-labelledby="ba-access" style="display: flex; flex-direction: column; gap: 14px"><div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px"><h3 id="ba-access" style="margin: 0; font-size: 15px; font-weight: 700">Access</h3><span style="font-size: 14px; color: #56607A">' + accessText(P.role, P.perms) + '</span></div>' + access + '</section>' +
      '<section aria-labelledby="ba-security" style="display: flex; flex-direction: column; gap: 14px"><div style="display: flex; flex-direction: column; gap: 4px"><h3 id="ba-security" style="margin: 0; font-size: 15px; font-weight: 700">Sign-in and account</h3><span style="font-size: 13px; color: #56607A">These take effect right away.</span></div>' +
      '<div style="border: 1px solid #E3E6EE; border-radius: 12px">' + security + '</div></section>' +
      '</div>' +

      '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 24px; border-top: 1px solid #EDF0F5; background: #FFFFFF">' +
      '<span role="status" id="ba-edit-status" style="font-size: 14px; color: ' + (dirty ? '#1F54D6' : '#6B7489') + '">' + (dirty ? 'Unsaved changes' : 'No changes yet') + '</span>' +
      '<div style="display: flex; gap: 10px"><button type="button" class="ba-ghost" data-action="close" data-fk="cancel" style="' + GHOST_BTN + '">Cancel</button>' +
      '<button type="button" id="ba-edit-save" data-action="edit-save" data-fk="edit-save"' + (dirty ? '' : ' disabled') + ' style="' + PRIMARY_BTN + '; opacity: ' + (dirty ? 1 : 0.45) + '">Save changes</button></div></div>';
  }

  // ---------------------------------------------------------------- new-account panel
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function newErrors(P) {
    return { name: !P.name.trim(), email: !EMAIL.test(P.email.trim()), pw: !P.pw };
  }
  function newPanelHtml() {
    var P = S.panel;
    var head = '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid #EDF0F5">' +
      '<div style="display: flex; flex-direction: column; gap: 4px"><h2 id="ba-panel-title" style="margin: 0; font-size: 19px; font-weight: 700; line-height: 1.25">New account</h2><span style="font-size: 13px; color: #56607A">They sign in to the Board with this email and password.</span></div>' +
      '<button type="button" class="ba-ghost" data-action="close" data-fk="close" aria-label="Close" style="flex: none; width: 40px; height: 40px; border: 0; border-radius: 10px; background: transparent; display: flex; align-items: center; justify-content: center; color: #0B1B34; cursor: pointer">' + I.close + '</button></div>';
    if (P.done) {
      return head + '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 32px; text-align: center">' +
        '<span aria-hidden="true" style="width: 56px; height: 56px; border-radius: 50%; background: #DDF3E6; color: #146C3E; display: flex; align-items: center; justify-content: center">' + I.check + '</span>' +
        '<span role="status" style="font-size: 18px; font-weight: 700">Account created for ' + esc(P.name.trim()) + '</span>' +
        '<span style="font-size: 14px; line-height: 1.5; color: #56607A; max-width: 380px">They can sign in now with ' + esc(P.email.trim()) + ' and the password you set. Give them the password yourself.</span>' +
        '<div style="display: flex; gap: 10px; margin-top: 6px"><button type="button" class="ba-ghost" data-action="new-again" data-fk="new-again" style="' + GHOST_BTN + '">Create another</button>' +
        '<button type="button" class="ba-primary" data-action="close" data-fk="back" style="' + PRIMARY_BTN + '">Back to accounts</button></div></div>';
    }
    var err = P.tried ? newErrors(P) : { name: false, email: false, pw: false };
    var isAdmin = P.role === 'Admin', def = roleDefault(P.role);
    var custom = !isAdmin && !sameSet(P.perms, def);
    var customizing = P.customizing && !isAdmin;
    var note = isAdmin ? 'Admins open every section, including the ones added later.' : custom ? 'Custom access, different from the ' + P.role + ' defaults.' : 'Starts with the ' + P.role + ' defaults. You can change them later too.';
    var field = function (id, key, label, type, extra, bad, msg) {
      return '<div style="display: flex; flex-direction: column; gap: 6px"><label for="' + id + '" style="font-size: 13px; font-weight: 600">' + label + '</label>' +
        '<input id="' + id + '" data-input="' + key + '" data-fk="n-' + key + '" type="' + type + '" autocomplete="off"' + extra + ' value="' + esc(P[key]) + '"' + (bad ? ' aria-invalid="true" aria-describedby="' + id + '-err"' : '') + ' style="' + INPUT.replace('#C3CBDA', bad ? '#A32D2D' : '#C3CBDA') + '">' +
        (bad ? '<span id="' + id + '-err" style="font-size: 13px; color: #A32D2D">' + msg + '</span>' : '') + '</div>';
    };
    return head + '<form data-form="new" novalidate style="flex: 1; min-height: 0; display: flex; flex-direction: column">' +
      '<div data-scroll style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px">' +
      '<section aria-labelledby="ba-who" style="display: flex; flex-direction: column; gap: 14px"><h3 id="ba-who" style="margin: 0; font-size: 15px; font-weight: 700">Person</h3>' +
      '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px">' +
      field('ba-n-name', 'name', 'Full name', 'text', '', err.name, 'Enter their full name.') +
      field('ba-n-email', 'email', 'Email', 'email', ' placeholder="name@example.com"', err.email, 'Enter an email address, like name@example.com.') +
      '</div><div style="display: flex; flex-direction: column; gap: 6px"><label for="ba-n-pw" style="font-size: 13px; font-weight: 600">Password</label>' + pwFieldHtml('ba-n-pw', P.pw, P.showPw, err.pw, 'n-pw') +
      (err.pw ? '<span style="font-size: 13px; color: #A32D2D">Set a password, or use Generate.</span>' : '') + '</div></section>' +
      '<section aria-labelledby="ba-n-role" style="display: flex; flex-direction: column; gap: 14px"><h3 id="ba-n-role" style="margin: 0; font-size: 15px; font-weight: 700">Role</h3>' + roleCardsHtml(P.role, 'ba-n-role') + '</section>' +
      '<section aria-labelledby="ba-n-access" style="display: flex; flex-direction: column; gap: 14px"><div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px"><h3 id="ba-n-access" style="margin: 0; font-size: 15px; font-weight: 700">Access</h3><span style="font-size: 14px; color: #56607A">' + accessText(P.role, P.perms) + '</span></div>' +
      '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 10px; background: ' + (isAdmin ? '#DDF3E6' : custom ? '#EEF3FF' : '#F3F4F7') + '"><span style="font-size: 14px; line-height: 1.45; color: ' + (isAdmin ? '#146C3E' : '#0B1B34') + '">' + note + '</span>' +
      (isAdmin ? '' : '<button type="button" data-action="customize" data-fk="customize" aria-expanded="' + customizing + '" style="flex: none; height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid #C9D7FF; background: #FFFFFF; color: #1F54D6; font-size: 13px; font-weight: 600; cursor: pointer">' + (customizing ? 'Hide sections' : 'Customize') + '</button>') + '</div>' +
      (customizing ? treeHtml(P.perms, P.open, null) : '') + '</section>' +
      '</div>' +
      '<div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #EDF0F5; background: #FFFFFF">' +
      '<button type="button" class="ba-ghost" data-action="close" data-fk="cancel" style="' + GHOST_BTN + '">Cancel</button>' +
      '<button type="submit" data-fk="create" style="' + PRIMARY_BTN + '">Create account</button></div></form>';
  }

  // ---------------------------------------------------------------- render
  var root, mainEl, overlay, aside;

  function render() {
    var fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fk : null;
    mainEl.innerHTML = pageHeadHtml() + tabsHtml() + (S.view === 'accounts' ? accountsViewHtml() : rolesViewHtml());
    renderPanel(true);
    if (fk) { var el = document.querySelector('[data-fk="' + fk + '"]'); if (el) el.focus({ preventScroll: true }); }
  }

  function renderPanel(skipFocus) {
    if (!S.panel) { if (overlay) { overlay.remove(); overlay = aside = null; document.body.style.overflow = ''; } return; }
    var fk = !skipFocus && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fk : null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.style.cssText = 'position: fixed; inset: 0; z-index: 50';
      overlay.innerHTML = '<div class="ba-scrim" data-action="close" style="position: absolute; inset: 0; background: rgba(11,27,52,0.38)"></div>' +
        '<aside class="ba-panel" role="dialog" aria-modal="true" aria-labelledby="ba-panel-title" style="position: absolute; top: 0; right: 0; bottom: 0; width: 600px; max-width: 100%; display: flex; flex-direction: column; background: #FFFFFF; box-shadow: -24px 0 48px rgba(11,27,52,0.16)"></aside>';
      root.appendChild(overlay);
      aside = overlay.querySelector('aside');
      document.body.style.overflow = 'hidden';
    }
    var scroller = aside.querySelector('[data-scroll]');
    var top = scroller ? scroller.scrollTop : 0;
    aside.innerHTML = S.panel.type === 'edit' ? editPanelHtml() : newPanelHtml();
    scroller = aside.querySelector('[data-scroll]');
    if (scroller) scroller.scrollTop = top;
    if (fk) { var el = aside.querySelector('[data-fk="' + fk + '"]'); if (el) { el.focus({ preventScroll: true }); caretToEnd(el); } }
  }
  function caretToEnd(el) {
    if (el.tagName !== 'INPUT' || ['text', 'password', 'search'].indexOf(el.type) < 0) return;
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (err) { /* not supported on this input type */ }
  }

  function openPanel(panel, opener) {
    S.menu = null;
    S.panel = panel;
    S.opener = opener || null;
    render();
    var first = aside.querySelector('input, button:not([data-action="close"])');
    if (first) first.focus({ preventScroll: true });
  }
  function closePanel() {
    S.panel = null;
    render();
    var back = S.opener && document.querySelector('[data-fk="' + S.opener + '"]');
    if (back) back.focus({ preventScroll: true });
  }
  function openEdit(id, extra) {
    var a = byId(id);
    openPanel(Object.assign({ type: 'edit', id: id, name: a.name, email: a.email, role: a.role, perms: copySet(effective(a)), open: { weekly: true }, confirming: false, pwOpen: false, pw: '', showPw: false }, extra || {}), 'edit-' + id);
  }
  function openNew() {
    openPanel({ type: 'new', name: '', email: '', pw: '', showPw: false, role: 'Dispatcher', perms: copySet(roleDefault('Dispatcher')), open: {}, customizing: false, tried: false, done: false }, 'new');
  }
  function scrollPanelTo(sel) {
    var el = aside && aside.querySelector(sel), sc = aside && aside.querySelector('[data-scroll]');
    if (el && sc) sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 24;
  }

  // ---------------------------------------------------------------- events
  function onClick(e) {
    var t = e.target.closest('[data-action]');
    if (!t || t.tagName === 'INPUT') { if (S.menu && !e.target.closest('.ba-menu')) { S.menu = null; render(); } return; }
    var act = t.dataset.action, id = t.dataset.id, P = S.panel;
    if (t.tagName === 'A') e.preventDefault();
    switch (act) {
      case 'tab': S.view = t.dataset.view; S.menu = null; history.replaceState(null, '', '?view=' + S.view); render(); break;
      case 'filter': S.filter = t.dataset.role; S.menu = null; render(); break;
      case 'menu': S.menu = S.menu === id ? null : id; render(); break;
      case 'edit': openEdit(id); break;
      case 'new': openNew(); break;
      case 'menu-password': openEdit(id, { pwOpen: true }); scrollPanelTo('#ba-e-pw'); var f = document.getElementById('ba-e-pw'); if (f) f.focus(); break;
      case 'menu-toggle-active': byId(id).deactivated = !byId(id).deactivated; S.menu = null; render(); break;
      case 'menu-delete': openEdit(id, { confirming: true }); scrollPanelTo('#ba-danger'); break;
      case 'close': closePanel(); break;
      case 'role-open': S.roles.open[id] = !S.roles.open[id]; render(); break;
      case 'role-discard': S.roles.perms = null; render(); break;
      case 'role-save': S.roles.base = rolesPerms(); S.roles.perms = null; S.roles.saved = true; render(); break;
      case 'panel-open': P.open[id] = !P.open[id]; renderPanel(); break;
      case 'panel-reset': P.perms = copySet(roleDefault(P.role)); renderPanel(); break;
      case 'customize': P.customizing = !P.customizing; renderPanel(); break;
      case 'pw-open': P.pwOpen = true; P.pw = ''; P.pwBad = false; renderPanel(); var g = document.getElementById('ba-e-pw'); if (g) g.focus(); break;
      case 'pw-cancel': P.pwOpen = false; P.pwBad = false; renderPanel(); break;
      case 'pw-save': if (!P.pw) { P.pwBad = true; renderPanel(); break; } P.pwOpen = false; P.pwSaved = true; P.pw = ''; renderPanel(); break;
      case 'pw-show': P.showPw = !P.showPw; renderPanel(); break;
      case 'pw-generate': P.pw = generatePassword(); P.showPw = true; P.pwBad = false; renderPanel(); break;
      case 'toggle-active': var acc = byId(P.id); acc.deactivated = !acc.deactivated; render(); break;
      case 'ask-delete': P.confirming = !P.confirming; renderPanel(); break;
      case 'cancel-delete': P.confirming = false; renderPanel(); break;
      case 'confirm-delete': accounts = accounts.filter(function (a) { return a.id !== P.id; }); S.opener = 'new'; closePanel(); break;
      case 'edit-save':
        var a = byId(P.id);
        a.name = P.name.trim() || a.name; a.email = P.email.trim() || a.email; a.role = P.role;
        a.perms = P.role === 'Admin' || sameSet(P.perms, roleDefault(P.role)) ? null : copySet(P.perms);
        closePanel(); break;
      case 'new-again': openNew(); break;
    }
  }

  function onChange(e) {
    var t = e.target, act = t.dataset.action, P = S.panel;
    if (act === 'role-tick') {
      var role = t.dataset.role, keys = t.dataset.keys.split(','), cur = rolesPerms(), next = copySet(cur[role]);
      var all = keys.every(function (k) { return cur[role][k]; });
      keys.forEach(function (k) { if (all) delete next[k]; else next[k] = true; });
      var perms = { Dispatcher: cur.Dispatcher, Manager: cur.Manager }; perms[role] = next;
      S.roles.perms = perms; S.roles.saved = false; render();
    } else if (act === 'panel-tick') {
      var ks = t.dataset.keys.split(','), allOn = ks.every(function (k) { return P.perms[k]; });
      ks.forEach(function (k) { if (allOn) delete P.perms[k]; else P.perms[k] = true; });
      renderPanel();
    } else if (act === 'panel-role') {
      P.role = t.value; P.perms = copySet(roleDefault(P.role)); renderPanel();
    }
  }

  function onInput(e) {
    var t = e.target, key = t.dataset.input, P = S.panel;
    if (t.id === 'ba-search') { S.q = t.value; S.menu = null; document.getElementById('ba-tbody').innerHTML = rowsHtml(); return; }
    if (!P || !key) return;
    P[key] = t.value;
    if (P.type === 'edit') {
      if (key === 'pw') { if (P.pwBad && t.value) { P.pwBad = false; renderPanel(); } return; }
      var a = byId(P.id), dirty = editDirty(P);
      document.getElementById('ba-panel-title').textContent = P.name || a.name;
      var st = document.getElementById('ba-edit-status'), sv = document.getElementById('ba-edit-save');
      st.textContent = dirty ? 'Unsaved changes' : 'No changes yet'; st.style.color = dirty ? '#1F54D6' : '#6B7489';
      sv.disabled = !dirty; sv.style.opacity = dirty ? 1 : 0.45;
    } else if (P.tried) {
      // errors clear as soon as the field becomes valid
      var bad = newErrors(P)[key];
      if (bad !== (t.getAttribute('aria-invalid') === 'true')) renderPanel();
    }
  }

  function onSubmit(e) {
    if (!e.target.matches('[data-form="new"]')) return;
    e.preventDefault();
    var P = S.panel, err = newErrors(P);
    if (err.name || err.email || err.pw) {
      P.tried = true; renderPanel();
      var first = aside.querySelector('[aria-invalid="true"]'); if (first) first.focus();
      return;
    }
    var words = P.name.trim().split(/\s+/);
    accounts.push({
      id: 'n' + Date.now(), initials: (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase(), name: P.name.trim(), email: P.email.trim(),
      role: P.role, perms: P.role === 'Admin' || sameSet(P.perms, roleDefault(P.role)) ? null : copySet(P.perms), last: null, tone: TONE_CYCLE[accounts.length % 4]
    });
    P.done = true;
    render();
  }

  function onKey(e) {
    if (!S.panel) { if (e.key === 'Escape' && S.menu) { var m = S.menu; S.menu = null; render(); var b = document.querySelector('[data-fk="menu-' + m + '"]'); if (b) b.focus(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(aside.querySelectorAll('button, input, a[href]'), function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }

  // ---------------------------------------------------------------- boot (+ demo params for screenshots)
  function boot() {
    root = document.getElementById('ba');
    root.innerHTML = shellHtml() + '<main id="ba-main" style="max-width: 1280px; margin: 0 auto; padding: 32px 32px 48px; display: flex; flex-direction: column; gap: 24px"></main>';
    mainEl = document.getElementById('ba-main');
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKey);

    var q = new URLSearchParams(location.search);
    if (q.get('view') === 'roles') S.view = 'roles';
    if (['Admin', 'Manager', 'Dispatcher'].indexOf(q.get('filter')) >= 0) S.filter = q.get('filter');
    if (q.get('q')) S.q = q.get('q');
    if (q.get('menu')) S.menu = q.get('menu');
    if (q.get('expand')) q.get('expand').split(',').forEach(function (id) { S.roles.open[id] = true; });
    if (q.get('dirty')) { // demo: two unsaved ticks
      var p = { Dispatcher: copySet(S.roles.base.Dispatcher), Manager: copySet(S.roles.base.Manager) };
      p.Dispatcher.associates = true; delete p.Manager.mdm; S.roles.perms = p;
    }
    render();
    if (q.get('panel') === 'edit') {
      var id = q.get('id') || 'ac';
      openEdit(id, { confirming: !!q.get('confirm'), pwOpen: !!q.get('password') });
      if (q.get('role')) { S.panel.role = q.get('role'); S.panel.perms = copySet(roleDefault(S.panel.role)); renderPanel(); }
      if (q.get('confirm')) scrollPanelTo('#ba-danger');
      else if (q.get('password')) scrollPanelTo('#ba-e-pw');
    } else if (q.get('panel') === 'new') {
      openNew();
      var P = S.panel;
      if (q.get('name')) P.name = q.get('name');
      if (q.get('email')) P.email = q.get('email');
      if (q.get('role')) { P.role = q.get('role'); P.perms = copySet(roleDefault(P.role)); }
      if (q.get('customize')) P.customizing = true;
      if (q.get('tried')) P.tried = true;
      if (q.get('done')) { P.pw = 'demo'; P.done = true; }
      renderPanel();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
