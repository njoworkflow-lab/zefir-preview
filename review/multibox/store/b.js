/* «Зефирная симфония»: «Открытка и получатель» (edit 6, spec-multibox §2.1). Each box in the cart can carry its own card and
 * go to its own person. Under every line of the cart panel a quiet link opens that line's small sheet: one tab per box
 * («Коробка 1 / 2 / 3»), the card toggle and text with a counter, and «Кому» (the recipients already named at checkout, or
 * «Решу при оформлении»). Box 1's card is the cart's card (ZS.C.card); the other boxes keep theirs in ZS.C.b[id] = {c, t}.
 * In the store, every change goes to WooCommerce with the cart (js/cart.js), which answers with the boxes as it keeps them.
 * Loaded after s.js on every page. No libraries. */
(function () {
  'use strict';
  var Z = window.ZS; if (!Z) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MAX = 200, OPEN = null, TAB = 0, wait, typing = false, LASTF = '';
  if (!Z.C.b) Z.C.b = {};

  function srv() { return window.ZSH && ZSH.ready && ZSH.ready(); }
  /* the boxes in order: [{id, no, sku, name, card, to, line}] (line: the panel's line id: the SKU, or mix0, mix1…) */
  function boxes() {
    var C = Z.C, out = [], no = 0, k, n;
    if (srv() && ZSH.boxes) {
      var mixN = {}, mi = 0;
      ZSH.boxes().forEach(function (b) {
        var line = b.sku;
        if (b.id.indexOf(':', b.sku.length + 1) > -1 && b.sku === 'own') { line = 'mix' + (mi++); }
        out.push({ id: b.id, no: b.no, sku: b.sku, name: b.name, card: b.no === 1 ? (C.card || '') : ((C.b[b.id] || {}).c || ''), to: (C.b[b.id] || {}).t || 0, line: line });
      });
      if (out.length) return out;
    }
    for (k in C.i) for (n = 1; n <= C.i[k]; n++) { no++; var id = k + ':' + n; out.push({ id: id, no: no, sku: k, name: (Z.P[k] || {}).n || k, card: no === 1 ? (C.card || '') : ((C.b[id] || {}).c || ''), to: (C.b[id] || {}).t || 0, line: k }); }
    var seen = {};
    C.m.forEach(function (m, i) { var sig = [].concat(m).join('-'); seen[sig] = (seen[sig] || 0) + 1; no++; var id = 'own:' + sig + ':' + seen[sig];
      out.push({ id: id, no: no, sku: 'own', name: 'Своя коробка', card: no === 1 ? (C.card || '') : ((C.b[id] || {}).c || ''), to: (C.b[id] || {}).t || 0, line: 'mix' + i }); });
    return out;
  }
  Z.boxList = boxes;
  /* how many boxes carry a card (the card fee is per box: edit 6) */
  Z.cardsN = function () { return boxes().filter(function (b) { return String(b.card).trim(); }).length; };
  /* the recipients named at checkout: [{n, name}] (the store's answer; the preview keeps them in this browser) */
  function people() {
    if (srv() && ZSH.recipients) return ZSH.recipients() || [];
    try { var r = JSON.parse(localStorage.getItem('zs-rcp') || 'null'); return r && r.multi ? r.list.map(function (x, i) { return { n: i + 1, name: x.name || '' }; }) : []; } catch (e) { return []; }
  }
  function cardOn() { return !window.ZSH || !ZSH.feeOn || ZSH.feeOn('card'); }
  function price() { return window.ZSH && ZSH.feeText ? ZSH.feeText('card', '+', '') : '+100 ₽'; }

  function setCard(b, text) {
    text = String(text || '').slice(0, MAX);
    if (b.no === 1) Z.C.card = text; else { Z.C.b[b.id] = Z.C.b[b.id] || {}; Z.C.b[b.id].c = text; if (!text && !Z.C.b[b.id].t) delete Z.C.b[b.id]; }
  }
  function setTo(b, to) { Z.C.b[b.id] = Z.C.b[b.id] || {}; Z.C.b[b.id].t = +to || 0; if (!Z.C.b[b.id].t && !Z.C.b[b.id].c) delete Z.C.b[b.id]; }
  function store(later) { clearTimeout(wait); if (later) { wait = setTimeout(function () { Z.save(); }, 600); try { localStorage.setItem('zs-cart', JSON.stringify(Z.C)); } catch (e) {} } else Z.save(); }

  /* the quiet link under each line, and the sheet of the open line */
  function links() {
    var cart = $('#cart .body'); if (!cart) return;
    var all = boxes(), by = {};
    all.forEach(function (b) { (by[b.line] = by[b.line] || []).push(b); });
    [].forEach.call(cart.querySelectorAll('.line[data-id]'), function (l) {
      var list = by[l.dataset.id]; if (!list || l.querySelector('.boxlink')) return;
      var cards = list.filter(function (b) { return String(b.card).trim(); }).length, s = l.querySelector('.s');
      var who = list.filter(function (b) { return b.to; }).length;
      var note = cards ? (list.length > 1 ? 'открыток: ' + cards : 'с открыткой') : '';
      if (who) note += (note ? ' · ' : '') + (list.length > 1 ? 'получатели выбраны' : 'получатель ' + list[0].to);
      var a = document.createElement('p'); a.className = 'boxlink';
      a.innerHTML = '<button class="link" type="button" data-boxsheet="' + esc(l.dataset.id) + '">Открытка и получатель</button>' + (note ? ' <span class="small">' + esc(note) + '</span>' : '');
      if (s) s.insertAdjacentElement('afterend', a); else l.children[1].appendChild(a);
    });
    if (OPEN && by[OPEN]) sheet(by[OPEN]); else OPEN = null;
  }
  function sheet(list) {
    var cart = $('#cart .body'), old = $('#boxsheet'); if (!cart) return;
    if (TAB >= list.length) TAB = 0;
    var b = list[TAB], ppl = people(), on = cardOn(), has = !!String(b.card).trim();
    var h = '<section class="boxsheet" id="boxsheet" role="dialog" aria-modal="false" aria-labelledby="bsh"><div class="bsh-top"><p class="h3" id="bsh">' + esc(b.name) + '</p><button class="link" type="button" data-boxdone>Готово</button></div>' +
      (list.length > 1 ? '<div class="bsh-tabs" role="tablist" aria-label="Коробки">' + list.map(function (x, i) { return '<button type="button" role="tab" aria-selected="' + (i === TAB) + '" data-boxtab="' + i + '">Коробка ' + (i + 1) + (String(x.card).trim() ? ' · ✉' : '') + '</button>'; }).join('') + '</div>' : '') +
      (on ? '<label class="chk"><input type="checkbox" data-boxcardon' + (has ? ' checked' : '') + '><span><b style="font-weight:500">Открытка к этой коробке</b> · ' + esc(price()) + '</span></label>' +
        '<div class="fld" data-boxcardbox' + (has ? '' : ' hidden') + '><label for="bsh-t">Текст открытки</label><textarea id="bsh-t" data-helper maxlength="' + MAX + '" placeholder="Например: «С днём рождения, мама!»">' + esc(b.card) + '</textarea><p class="small" data-boxleft>осталось ' + (MAX - String(b.card).length) + ' знаков</p></div>' : '') +
      '<div class="fld"><label for="bsh-to">Кому</label><select id="bsh-to" data-boxto><option value="0">Решу при оформлении</option>' +
      ppl.map(function (p) { return '<option value="' + p.n + '"' + (+b.to === +p.n ? ' selected' : '') + '>Получатель ' + p.n + (p.name ? ' · ' + esc(p.name) : '') + '</option>'; }).join('') + '</select></div>' +
      '<p class="small bsh-hint">Каждую коробку можно отправить своему человеку. Адреса — на следующем шаге.</p></section>';
    if (old) old.outerHTML = h; else cart.insertAdjacentHTML('afterbegin', h);
    // the panel can be drawn again while the sheet is in use (the store's answer): the keyboard stays where it was
    var a = document.activeElement;
    if (LASTF && LASTF !== '#bsh-t' && (!a || a === document.body || !a.isConnected)) { var k = $('#boxsheet ' + LASTF); if (k) k.focus(); }
    var sh = $('#boxsheet'), t = $('#bsh-t', sh), on1 = $('[data-boxcardon]', sh), box = $('[data-boxcardbox]', sh);
    if (on1) on1.addEventListener('change', function () { box.hidden = !on1.checked; if (!on1.checked) { setCard(b, ''); store(); } else t.focus(); });
    if (t) {
      t.addEventListener('input', function () { typing = true; setCard(b, t.value); $('[data-boxleft]', sh).textContent = 'осталось ' + (MAX - t.value.length) + ' знаков'; store(true); });
      t.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== $('#bsh-t')) typing = false; }, 0); });
      if (typing) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }   // the panel was drawn again while typing
    }
    $('[data-boxto]', sh).addEventListener('change', function () { setTo(b, this.value); store(); });
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest && e.target.closest('[data-boxsheet]');
    if (o) { OPEN = o.dataset.boxsheet; TAB = 0; var all = boxes().filter(function (b) { return b.line === OPEN; }); sheet(all); var f = $('#boxsheet [data-boxtab],#boxsheet [data-boxcardon]'); if (f) f.focus(); return; }
    var tb = e.target.closest && e.target.closest('[data-boxtab]');
    if (tb) { TAB = +tb.dataset.boxtab; sheet(boxes().filter(function (b) { return b.line === OPEN; })); var a = $('#boxsheet [aria-selected="true"]'); if (a) a.focus(); return; }
    if (e.target.closest && e.target.closest('[data-boxdone]')) { var line = OPEN; OPEN = null; clearTimeout(wait); Z.save(); var l = $('#cart .line[data-id="' + line + '"] [data-boxsheet]'); if (l) l.focus(); }
  });
  function desc(e) { return e.dataset.boxtab != null ? '[data-boxtab="' + e.dataset.boxtab + '"]' : e.id ? '#' + e.id : e.hasAttribute('data-boxcardon') ? '[data-boxcardon]' : e.hasAttribute('data-boxdone') ? '[data-boxdone]' : ''; }
  document.addEventListener('focusin', function (e) { var sh = $('#boxsheet'); if (sh && sh.contains(e.target)) LASTF = desc(e.target); else if (e.target !== document.body) LASTF = ''; });
  document.addEventListener('zs:cart', links);
  links();
})();
