/* «Зефирная симфония»: several recipients in one order, and «Проверьте заказ» (edit 6, spec-multibox §2.2–2.4).
 *
 * At the top of the checkout's delivery step: «Всё на один адрес» (today's form, unchanged) or «На разные адреса»: up to 10
 * recipient cards, each with its boxes («Переложить» moves a box with its card), name and phone, pickup point or courier,
 * and its own delivery price. Before payment, every order with more than one box or any card shows «Проверьте заказ»: one
 * block per recipient with each box and its card, then the totals.
 *
 * Two ways to keep the order: in the store (window.ZEFIR_SHIP: WooCommerce's session through /?wc-ajax=zefir_ship, prices
 * from CDEK) and in the preview (this browser, prices from the preview's own table). The same cards either way. No libraries.
 */
(function () {
  'use strict';
  var Z = window.ZS, host = document.getElementById('zrcp');
  if (!Z || !host) return;
  var MAX = 10, NB = ' ';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rub(v) { return Z.rub(v); }
  function blank(n) { return { n: n, name: '', phone: '', method: 'pvz', city: '', city_code: '', pvz_code: '', pvz_label: '', address: { street: '', house: '', flat: '', comment: '' }, quote: null }; }
  function mask(p) { var d = String(p || '').replace(/\D/g, ''); return d.length >= 4 ? '+7 9•• •••-••-' + d.slice(-2) : ''; }
  function adr(n) { var m = n % 10, h = n % 100; return n + ' ' + (m === 1 && h !== 11 ? 'адрес' : m >= 2 && m <= 4 && (h < 12 || h > 14) ? 'адреса' : 'адресов'); }

  /* ---------- the store: WooCommerce's session ---------- */
  function store(cfg) {
    var nonce = cfg.nonce;
    function ask(op, data, get) {
      var url = cfg.url + (cfg.url.indexOf('?') < 0 ? '?' : '&') + 'op=' + op + '&nonce=' + encodeURIComponent(nonce);
      var o = { credentials: 'same-origin' };
      if (!get) { var body = new URLSearchParams(); body.set('nonce', nonce); for (var k in data || {}) body.set(k, data[k]); o.method = 'POST'; o.body = body; }
      else for (var q in data || {}) url += '&' + q + '=' + encodeURIComponent(data[q]);
      return fetch(url, o).then(function (r) { return r.json(); }).then(function (a) { if (a && a.nonce) nonce = a.nonce; if (!get && window.jQuery) jQuery(document.body).trigger('update_checkout'); return a; });
    }
    return {
      load: function () { return ask('state', {}, true); },
      mode: function (multi) { return ask('mode', { multi: multi ? 1 : 0 }); },
      save: function (cards, to) { return ask('save', { recipients: JSON.stringify(cards), to: JSON.stringify(to) }); },
      card: function (id, text) { var b = {}; b[id] = { c: text }; return ask('card', { boxes: JSON.stringify(b) }); },
      points: function (city) { return ask('pvz', { city: city }, true).then(function (a) { return a.points || { points: [] }; }); }
    };
  }

  /* ---------- the preview: this browser ---------- */
  function preview() {
    function keep(s) { try { localStorage.setItem('zs-rcp', JSON.stringify({ multi: s.multi, list: s.list })); } catch (e) {} }
    function kept() { try { return JSON.parse(localStorage.getItem('zs-rcp') || 'null') || { multi: false, list: [] }; } catch (e) { return { multi: false, list: [] }; } }
    function state() {
      var k = kept(), list = k.multi ? k.list : k.list.slice(0, 1), n = k.multi && list.length > 1 ? list.length : 1, boxes = (Z.boxList ? Z.boxList() : []).map(function (b) { return { id: b.id, no: b.no, name: b.name, sku: b.sku, card: b.card, to: n > 1 && b.to >= 1 && b.to <= n ? b.to : 1 }; });
      var per = {}; boxes.forEach(function (b) { per[b.to] = (per[b.to] || 0) + 1; });
      var dsum = 0, quoted = true;
      list.forEach(function (r) { var e = Z.est(r.city); r.quote = r.city.trim() ? { ok: true, price: r.method === 'courier' ? e.cur : e.pvz, period: e.when } : { ok: false, wait: true }; if (n > 1 || r.n === 1) dsum += r.quote.ok ? r.quote.price : 0; quoted = quoted && r.quote.ok; });
      if (!list.length) { var e0 = Z.est(Z.ls('zs-city')); dsum = e0.pvz; }
      var pr = Z.promo(dsum), cards = (Z.cardsN ? Z.cardsN() : 0) * 100, gift = Z.paid() >= Z.giftAt();
      return { multi: k.multi, active: n > 1, max: MAX, recipients: list, boxes: boxes, gift: gift ? { name: 'Ассорти', to: 1 } : null, cardOn: true, cardPrice: 100,
        totals: { subtotal: Z.subtotal(), discount: pr.D, fees: cards, delivery: pr.free ? 0 : dsum, total: pr.total + cards, free: pr.free }, review: boxes.length > 1 || boxes.some(function (b) { return String(b.card).trim(); }), quoted: quoted };
    }
    function P(v) { return Promise.resolve(v); }
    return {
      load: function () { return P(state()); },
      mode: function (multi) { var k = kept(); k.multi = multi; if (!k.list.length) k.list = [blank(1)]; if (!multi) { k.list = k.list.slice(0, 1); (Z.boxList ? Z.boxList() : []).forEach(function (b) { if (Z.C.b[b.id]) Z.C.b[b.id].t = 1; }); Z.save(); } keep(k); return P(state()); },
      save: function (cards, to) {
        if (cards.length > MAX) return P(Object.assign(state(), { error: 'Не больше 10 адресов в одном заказе.' }));
        var used = {}; for (var id in to) used[to[id]] = 1;
        var keepIdx = [], ren = {}; cards.forEach(function (c, i) { if (i === 0 || used[i + 1]) { ren[i + 1] = keepIdx.length + 1; keepIdx.push(c); } });
        keepIdx.forEach(function (c, i) { c.n = i + 1; });
        for (id in to) { Z.C.b[id] = Z.C.b[id] || {}; Z.C.b[id].t = ren[to[id]] || 1; }
        Z.save(); keep({ multi: kept().multi, list: keepIdx }); return P(state());
      },
      card: function (id, text) { var b = (Z.boxList ? Z.boxList() : []).filter(function (x) { return x.id === id; })[0]; if (b) { if (b.no === 1) Z.C.card = text; else { Z.C.b[id] = Z.C.b[id] || {}; Z.C.b[id].c = text; } Z.save(); } return P(state()); },
      points: function () { return P({ points: [] }); }   // the preview lists no carrier's points: the point is typed
    };
  }

  var A = window.ZEFIR_SHIP ? store(window.ZEFIR_SHIP) : preview();
  var S = null, extra = [], open = {}, moving = null, confirmOne = false, saveT = 0, PTS = {}, busy = 0;

  /* ---------- drawing ---------- */
  function all() { return (S.recipients || []).concat(extra); }
  function boxesOf(n) { return (S.boxes || []).filter(function (b) { return b.to === n; }); }
  function complete(r) { return r.name.trim() && r.phone.replace(/\D/g, '').length >= 10 && r.city.trim() && (r.method === 'pvz' ? r.pvz_code || r.pvz_label : r.address.street.trim() && r.address.house.trim()); }
  function qline(r) {
    var q = r.quote;
    if (!r.city.trim()) return '<p class="small rq">Доставка: укажите город</p>';
    if (!q || q.wait) return '<p class="small rq">Доставка: считаем…</p>';
    if (!q.ok) return '<p class="small rq">Стоимость доставки уточнит менеджер</p>';
    return '<p class="small rq"><b>Доставка: ' + rub(q.price) + '</b>' + (q.period ? ' · ' + esc(q.period) : '') + '</p>';
  }
  function boxRow(b, n) {
    var who = all().filter(function (r) { return r.n !== n; });
    return '<li><span>' + esc(b.name) + (String(b.card).trim() ? ' · с' + NB + 'открыткой' : '') + '</span>' +
      (who.length ? '<button class="link" type="button" data-rmove="' + esc(b.id) + '" aria-expanded="' + (moving === b.id) + '">Переложить</button>' : '') +
      (moving === b.id ? '<div class="rmenu" role="group" aria-label="Кому переложить">' + who.map(function (r) { return '<button type="button" data-rto="' + r.n + '" data-rbox="' + esc(b.id) + '">Получателю ' + r.n + (r.name ? ' · ' + esc(r.name) : '') + '</button>'; }).join('') + '</div>' : '') + '</li>';
  }
  function card(r) {
    var n = r.n, k = 'rc' + n, mine = boxesOf(n), done = complete(r) && !open[n];
    var h = '<section class="rcp' + (done ? ' done' : '') + '" data-n="' + n + '" aria-labelledby="' + k + 'h"><div class="rcp-top"><p class="h3" id="' + k + 'h">Получатель ' + n + '</p>' +
      (n > 1 ? '<button class="link" type="button" data-rdel="' + n + '">Удалить получателя</button>' : '') + '</div>';
    h += '<ul class="rcp-boxes">' + (mine.length ? mine.map(function (b) { return boxRow(b, n); }).join('') : '<li class="small">Переложите сюда коробку из' + NB + 'другой карточки</li>') +
      (n === 1 && S.gift ? '<li class="small">Подарочная коробка «' + esc(S.gift.name || 'Ассорти') + '» поедет вместе с' + NB + 'этим получателем.</li>' : '') + '</ul>';
    if (done) {
      return h + '<p class="rcp-sum">' + esc(r.name) + ', ' + esc(r.city) + ', ' + (r.method === 'pvz' ? 'пункт выдачи' : 'курьер') + (r.quote && r.quote.ok ? ' · ' + rub(r.quote.price) : '') + ' · <button class="link" type="button" data-redit="' + n + '">Изменить</button></p></section>';
    }
    h += (n === 1 ? '<label class="chk"><input type="checkbox" data-rme><span>Получатель 1' + NB + '— это я</span></label>' : '') +
      '<div class="two"><div class="fld"><label for="' + k + 'a">Имя и фамилия получателя</label><input id="' + k + 'a" data-rf="name" autocomplete="off" value="' + esc(r.name) + '"></div>' +
      '<div class="fld"><label for="' + k + 'b">Телефон получателя</label><input id="' + k + 'b" data-rf="phone" type="tel" placeholder="+7" value="' + esc(r.phone) + '"></div></div>' +
      '<div class="rcp-way" role="radiogroup" aria-label="Способ доставки"><label class="opt"><input type="radio" name="' + k + 'm" value="pvz" data-rf="method"' + (r.method === 'pvz' ? ' checked' : '') + '><div><b>Пункт выдачи СДЭК</b></div></label>' +
      '<label class="opt"><input type="radio" name="' + k + 'm" value="courier" data-rf="method"' + (r.method === 'courier' ? ' checked' : '') + '><div><b>Курьер</b></div></label></div>' +
      '<div class="fld"><label for="' + k + 'c">Город</label><input id="' + k + 'c" data-rf="city" list="cities" value="' + esc(r.city) + '"></div>';
    if (r.method === 'pvz') {
      var p = PTS[r.city.trim().toLowerCase()];
      if (p && p.points && p.points.length) {
        h += '<div class="fld"><label for="' + k + 'p">Пункт выдачи</label><select id="' + k + 'p" data-rf="pvz"><option value="">Выберите пункт</option>' +
          p.points.slice(0, 300).map(function (x) { return '<option value="' + esc(x.code) + '"' + (x.code === r.pvz_code ? ' selected' : '') + '>' + esc(x.address) + '</option>'; }).join('') + '</select></div>';
      } else {
        h += '<div class="fld"><label for="' + k + 'p">Пункт выдачи' + (p === 'wait' ? ' — загружаем список…' : '') + '</label><input id="' + k + 'p" data-rf="pvz_label" placeholder="Адрес или название пункта" value="' + esc(r.pvz_label) + '"></div>';
      }
    } else {
      h += '<div class="two"><div class="fld"><label for="' + k + 'd">Улица</label><input id="' + k + 'd" data-ra="street" value="' + esc(r.address.street) + '"></div><div class="fld"><label for="' + k + 'e">Дом</label><input id="' + k + 'e" data-ra="house" value="' + esc(r.address.house) + '"></div></div>' +
        '<div class="two"><div class="fld"><label for="' + k + 'f">Квартира или офис</label><input id="' + k + 'f" data-ra="flat" value="' + esc(r.address.flat) + '"></div><div class="fld"><label for="' + k + 'g">Для курьера — по' + NB + 'желанию</label><input id="' + k + 'g" data-ra="comment" value="' + esc(r.address.comment) + '"></div></div>';
    }
    return h + qline(r) + (complete(r) ? '<p><button class="link" type="button" data-rok="' + n + '">Готово</button></p>' : '') + '</section>';
  }
  function draw() {
    if (!S) return;
    var focus = document.activeElement && host.contains(document.activeElement) ? { id: document.activeElement.id, pos: document.activeElement.selectionStart } : null;
    var multi = !!S.multi, list = all();
    var h = '<div class="seg" role="radiogroup" aria-label="Куда доставить"><button type="button" role="radio" data-rmode="0" aria-checked="' + !multi + '">Всё на' + NB + 'один адрес</button><button type="button" role="radio" data-rmode="1" aria-checked="' + multi + '">На' + NB + 'разные адреса</button></div>' +
      '<p class="small rhint">Можно отправить коробки разным людям' + NB + '— до' + NB + '10' + NB + 'адресов в' + NB + 'одном заказе. Доставку посчитаем для' + NB + 'каждого.</p>';
    if (confirmOne) {
      h += '<div class="rconfirm" role="alert"><p>Адреса ' + (list.length > 2 ? '2–' + list.length : '2') + ' будут удалены, все коробки поедут на' + NB + 'один адрес.</p><p><button class="btn" type="button" data-rone>Удалить адреса</button> <button class="link" type="button" data-rkeep>Оставить</button></p></div>';
    }
    if (multi) {
      h += '<div class="rcps">' + list.map(card).join('') + '</div>' +
        (list.length < MAX ? '<p><button class="link radd" type="button" data-radd>+ Добавить получателя</button></p>' : '<p class="small">Не больше 10' + NB + 'адресов в' + NB + 'одном заказе.</p>');
      var same = sameAddress(list);
      if (same) h += '<p class="small">У' + NB + 'получателей ' + same[0] + ' и' + NB + same[1] + ' один адрес' + NB + '— можно объединить. <button class="link" type="button" data-rjoin="' + same.join(',') + '">Объединить</button></p>';
    }
    h += '<p class="small rcare">Вопросы по' + NB + 'заказу' + NB + '— служба заботы: <a href="tel:+79085204642">+7' + NB + '908' + NB + '520-46-42</a>, <a href="mailto:zefir@vanslad.ru">zefir@vanslad.ru</a></p>';
    if (S.error) h += '<p class="small rerr" role="alert">' + esc(S.error) + '</p>';
    host.innerHTML = h;
    var one = document.getElementById('zone'); if (one) one.style.display = multi ? 'none' : 'grid';   // today's one-address fields
    // «Это подарок» stays (no receipt with prices); its one recipient and one card step aside: each recipient card and each box
    // carries its own, and the fields go quiet (not sent), so they never overwrite box 1's card
    var gb = document.getElementById('giftbox');
    if (gb) { if (gb.dataset.d == null) gb.dataset.d = gb.style.display; gb.style.display = multi ? 'none' : gb.dataset.d; [].forEach.call(gb.querySelectorAll('input, textarea'), function (e) { e.disabled = multi; });
      var cr = document.querySelector('.cardrev'); if (cr) cr.style.display = multi ? 'none' : ''; }
    syncCity();
    if (focus && focus.id) { var f = document.getElementById(focus.id); if (f) { f.focus(); try { if (focus.pos != null) f.setSelectionRange(focus.pos, focus.pos); } catch (e) {} } }
    document.dispatchEvent(new CustomEvent('zr:state', { detail: S }));
  }
  function sameAddress(list) {
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
      var a = list[i], b = list[j];
      if (a.city.trim() && a.method === b.method && a.city.trim().toLowerCase() === b.city.trim().toLowerCase() &&
        (a.method === 'pvz' ? (a.pvz_code && a.pvz_code === b.pvz_code) : (a.address.street.trim() && a.address.street.trim().toLowerCase() === b.address.street.trim().toLowerCase() && a.address.house.trim() === b.address.house.trim()))) return [a.n, b.n];
    }
    return null;
  }
  /* the store needs the payer's city: in «На разные адреса» it is recipient 1's */
  function syncCity() {
    var c = document.getElementById('billing_city'), r = all()[0];
    if (c && S.multi && r && r.city.trim() && c.value !== r.city) c.value = r.city;
  }

  /* ---------- keeping ---------- */
  /* an answer to an older request keeps what was typed since (ver: edits so far; asked: the edits the request carried) */
  var ver = 0;
  var FIELDS = ['name', 'phone', 'method', 'city', 'city_code', 'pvz_code', 'pvz_label', 'address'];
  function take(s, asked) {
    if (!s) return;
    if (s.error) { S = S || s; S.error = s.error; draw(); return; }
    if (asked !== undefined && asked < ver && S) {
      var mine = all();
      (s.recipients || []).forEach(function (r) { var m = mine.filter(function (x) { return x.n === r.n; })[0]; if (m) FIELDS.forEach(function (f) { r[f] = m[f]; }); });
    }
    var named = (s.recipients || []).length;
    extra = extra.filter(function (e) { return e.n > named; });
    extra.forEach(function (e, i) { e.n = named + i + 1; });
    S = s; S.error = '';
    all().forEach(function (r) { if (r.method === 'pvz' && r.city.trim()) points(r.city); });
    draw();
  }
  function payload(to) {
    var cards = all().map(function (r) { return { name: r.name, phone: r.phone, method: r.method, city: r.city, city_code: r.city_code, pvz_code: r.pvz_code, pvz_label: r.pvz_label, address: r.address }; });
    var map = {}; (S.boxes || []).forEach(function (b) { map[b.id] = b.to; });
    for (var k in to || {}) map[k] = to[k];
    return { cards: cards, to: map };
  }
  var waiting = false;
  function save(to, now) {
    clearTimeout(saveT); waiting = true;
    var go = function () { waiting = false; var p = payload(to), v = ver; busy++; A.save(p.cards, p.to).then(function (s) { busy--; take(s, v); }).catch(function () { busy--; }); };
    if (now) go(); else saveT = setTimeout(go, 700);
  }
  function points(city) {
    var key = city.trim().toLowerCase(); if (!key || PTS[key]) return;
    PTS[key] = 'wait'; busy++;
    A.points(city).then(function (p) { PTS[key] = p && p.points ? p : { points: [] }; all().forEach(function (r) { if (r.city.trim().toLowerCase() === key && p.city_code) r.city_code = p.city_code; }); draw(); })
      .catch(function () { PTS[key] = { points: [] }; draw(); }).then(function () { busy--; });
  }
  function rec(el) { var c = el.closest('[data-n]'); if (!c) return null; var n = +c.dataset.n; return all().filter(function (r) { return r.n === n; })[0] || null; }

  host.addEventListener('input', function (e) {
    var t = e.target, r = rec(t); if (!r) return; ver++;
    if (t.dataset.rf === 'name' || t.dataset.rf === 'phone' || t.dataset.rf === 'pvz_label') { r[t.dataset.rf] = t.value; save(); }
    else if (t.dataset.rf === 'city') { r.city = t.value; r.city_code = ''; r.pvz_code = ''; save(); clearTimeout(t._p); t._p = setTimeout(function () { if (r.method === 'pvz') points(r.city); }, 700); }
    else if (t.dataset.ra) { r.address[t.dataset.ra] = t.value; save(); }
  });
  host.addEventListener('change', function (e) {
    var t = e.target, r = rec(t);
    if (r) ver++;
    if (t.dataset.rf === 'method' && r) { r.method = t.value; r.pvz_code = ''; draw(); save(null, true); if (r.method === 'pvz') points(r.city); return; }
    if (t.dataset.rf === 'pvz' && r) { r.pvz_code = t.value; var o = t.options[t.selectedIndex]; r.pvz_label = t.value ? o.textContent : ''; save(null, true); return; }
    if (t.hasAttribute && t.hasAttribute('data-rme') && r && t.checked) {
      var v = function (ids) { for (var i = 0; i < ids.length; i++) { var x = document.getElementById(ids[i]); if (x && x.value.trim()) return x.value.trim(); } return ''; };
      r.name = (v(['billing_first_name', 'f2']) + ' ' + v(['billing_last_name', 'f2b'])).trim(); r.phone = v(['billing_phone', 'f1']);
      draw(); save(null, true);
    }
  });
  host.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || !host.contains(t)) return;
    if (t.dataset.rmode !== undefined) {
      var multi = t.dataset.rmode === '1';
      if (!multi && S.multi && all().length > 1) { confirmOne = true; draw(); var c = $('[data-rone]', host); if (c) c.focus(); return; }
      confirmOne = false; busy++; A.mode(multi).then(function (s) { busy--; extra = []; take(s); var f = $('.rcp input', host); if (multi && f) f.focus(); }); return;
    }
    if (t.hasAttribute('data-rone')) { confirmOne = false; busy++; A.mode(false).then(function (s) { busy--; extra = []; take(s); }); return; }
    if (t.hasAttribute('data-rkeep')) { confirmOne = false; draw(); return; }
    if (t.hasAttribute('data-radd')) {
      var n = all().length + 1; if (n > MAX) return;
      extra.push(blank(n)); open[n] = true; draw();
      var f2 = $('.rcp[data-n="' + n + '"] input[data-rf="name"]', host); if (f2) f2.focus();
      return;
    }
    if (t.dataset.rdel) {
      var k = +t.dataset.rdel, to = {}, gone = boxesOf(k).length;
      (S.boxes || []).forEach(function (b) { if (b.to === k) to[b.id] = 1; else if (b.to > k) to[b.id] = b.to - 1; });
      extra = extra.filter(function (x) { return x.n !== k; });
      if (S.recipients) S.recipients = S.recipients.filter(function (x) { return x.n !== k; });
      var p = payload(to); busy++;
      A.save(p.cards, p.to).then(function (s) { busy--; take(s); var m = $('.rhint', host); if (m) m.textContent = gone ? 'Коробки получателя ' + k + ' вернулись получателю 1.' : 'Получатель ' + k + ' удалён.'; });
      return;
    }
    if (t.dataset.rmove) { moving = moving === t.dataset.rmove ? null : t.dataset.rmove; draw(); var m1 = $('.rmenu button', host); if (m1) m1.focus(); return; }
    if (t.dataset.rto) { var move = {}; move[t.dataset.rbox] = +t.dataset.rto; moving = null; S.boxes.forEach(function (b) { if (b.id === t.dataset.rbox) b.to = +t.dataset.rto; }); draw(); save(move, true); return; }
    if (t.dataset.rok) { open[+t.dataset.rok] = false; draw(); return; }
    if (t.dataset.redit) { open[+t.dataset.redit] = true; draw(); var f3 = $('.rcp[data-n="' + t.dataset.redit + '"] input', host); if (f3) f3.focus(); return; }
    if (t.dataset.rjoin) { var ab = t.dataset.rjoin.split(',').map(Number), to2 = {}; S.boxes.forEach(function (b) { if (b.to === ab[1]) to2[b.id] = ab[0]; }); save(to2, true); }
  });

  /* ---------- «Проверьте заказ» ---------- */
  var confirmed = false;
  function reviewHtml() {
    var list = S.active ? all() : [single()], t = S.totals || {}, rows = '';
    list.forEach(function (r) {
      var mine = S.active ? boxesOf(r.n) : S.boxes;
      rows += '<div class="zrvb"><p class="zrvh"><b>Получатель ' + r.n + '</b>' + (r.name ? ' · ' + esc(r.name) : '') + (r.phone ? ' · <span class="nw">' + esc(mask(r.phone)) + '</span>' : '') + '</p>' +
        '<p class="small zrvw"><span>' + esc(r.method === 'pvz' ? 'СДЭК, пункт выдачи: ' + (r.city ? r.city + (r.pvz_label ? ', ' + r.pvz_label : '') : '') : 'Курьер: ' + [r.city, r.address.street, r.address.house].filter(Boolean).join(', ')) + '</span>' +
        (S.active ? '<span>доставка ' + (r.quote && r.quote.ok ? rub(r.quote.price) : 'уточнит менеджер') + '</span>' : '') + '</p><ul>' +
        mine.map(function (b) { var c = String(b.card).trim(); return '<li><span>' + esc(b.name) + ' · ' + (c ? 'открытка «' + esc(c.length > 40 ? c.slice(0, 40) + '…' : c) + '»' : 'без' + NB + 'открытки') + '</span>' +
          (S.cardOn ? '<button class="link" type="button" data-rvcard="' + esc(b.id) + '">' + (c ? 'Изменить' : 'Добавить открытку') + '</button>' : '') +
          '<div class="zrvedit" data-rvbox="' + esc(b.id) + '" hidden><textarea maxlength="200" aria-label="Текст открытки">' + esc(c) + '</textarea><p><button class="btn" type="button" data-rvsave="' + esc(b.id) + '">Сохранить</button></p></div></li>'; }).join('') +
        (r.n === 1 && S.gift ? '<li><span>«' + esc(S.gift.name) + '» в' + NB + 'подарок</span></li>' : '') + '</ul></div>';
    });
    var n = S.active ? all().length : 1;
    var sum = '<div class="zrvt"><span>Коробки ' + rub(t.subtotal) + '</span>' + (t.discount ? '<span>Скидка −' + rub(t.discount) + '</span>' : '') + (t.fees ? '<span>Открытки ' + rub(t.fees) + '</span>' : '') +
      '<span>Доставка' + (n > 1 ? ' (' + adr(n) + ')' : '') + ' ' + (t.free ? '0' + NB + '₽ · за' + NB + 'наш счёт' : rub(t.delivery)) + '</span><b>Итого ' + rub(t.total) + '</b></div>';
    return '<section class="zrv" id="zreview" aria-labelledby="zreviewh" tabindex="-1"><p class="h3" id="zreviewh">Проверьте заказ</p>' + rows + sum +
      '<p><button class="btn buy full" type="button" data-rvok>Всё верно' + NB + '— оплатить ' + rub(t.total) + '</button></p><p class="centre"><button class="link" type="button" data-rvback>Вернуться к' + NB + 'оформлению</button></p></section>';
  }
  function single() {
    var v = function (ids) { for (var i = 0; i < ids.length; i++) { var x = document.getElementById(ids[i]); if (x && x.value.trim()) return x.value.trim(); } return ''; };
    var pvz = (document.getElementById('billing_delivery_type') || {}).value === 'pickup' || (document.querySelector('[name=dv]:checked') || {}).value === 'pvz';
    return { n: 1, name: (v(['g1']) || (v(['billing_first_name', 'f2']) + ' ' + v(['billing_last_name', 'f2b'])).trim()), phone: v(['g2', 'billing_phone', 'f1']), method: pvz ? 'pvz' : 'courier',
      city: v(['billing_city', 'd1']), pvz_label: v(['d2']), address: { street: v(['billing_address_1', 'd3']), house: v(['billing_house', 'd3b']) } };
  }
  function showReview(go) {
    // in the store, the form is counted once more first (its chosen delivery), so the review shows exactly what it will charge
    if (window.ZEFIR_SHIP && window.jQuery) { var $b = jQuery(document.body); $b.one('updated_checkout', function () { review(go); }); $b.trigger('update_checkout'); return; }
    review(go);
  }
  function review(go) {
    A.load().then(function (s) {
      take(s);
      // counted again with the form (a card cleared or «Это подарок» unticked just now): one box without a card needs no review
      if (!S.review) { confirmed = true; go(); return; }
      var old = document.getElementById('zreview'); if (old) old.remove();
      var at = document.getElementById('coerr') || host; at.insertAdjacentHTML('beforebegin', reviewHtml());
      var rv = document.getElementById('zreview'); rv.focus(); rv.scrollIntoView({ block: 'start', behavior: 'smooth' });
      rv.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-rvok')) { confirmed = true; rv.remove(); go(); }
        else if (b.hasAttribute('data-rvback')) { rv.remove(); host.scrollIntoView({ block: 'start' }); }
        else if (b.dataset.rvcard) { var ed = $('[data-rvbox="' + b.dataset.rvcard + '"]', rv); ed.hidden = !ed.hidden; if (!ed.hidden) $('textarea', ed).focus(); }
        else if (b.dataset.rvsave) { var t = $('[data-rvbox="' + b.dataset.rvsave + '"] textarea', rv).value; A.card(b.dataset.rvsave, t).then(function () { if (!window.ZEFIR_SHIP) review(go); }); if (window.ZEFIR_SHIP && window.jQuery) jQuery(document.body).one('updated_checkout', function () { review(go); }); }
      });
    });
  }
  /* the pay button: the review first, for more than one box or any card */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#place_order, #pay'); if (!b || confirmed || !S || !S.review) return;
    if (b.disabled) return;
    // the form's own errors first (an unticked consent, an empty required field): the review comes once it can be paid
    if ([].some.call(document.querySelectorAll('#zefir_offer, #zefir_personal_data, #ok1, #ok2'), function (x) { return x.type === 'checkbox' && !x.checked; })) return;
    if ([].some.call(document.querySelectorAll('#billing_phone, #billing_first_name, #billing_email, #f1, #f2, #f3'), function (x) { return x.offsetParent && !x.value.trim(); })) return;
    e.preventDefault(); e.stopImmediatePropagation();
    showReview(function () { b.click(); });
  }, true);
  if (window.jQuery) jQuery(document.body).on('checkout_error', function () { confirmed = false; });
  document.addEventListener('zs:cart', function () { if (!window.ZEFIR_SHIP) A.load().then(take); });

  A.load().then(take);
  window.ZR = { state: function () { return S; }, reload: function () { return A.load().then(take); }, busy: function () { return busy > 0 || waiting || Object.keys(PTS).some(function (k) { return PTS[k] === 'wait'; }); } };
})();
