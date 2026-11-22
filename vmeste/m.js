/* «Время вместе» and the card-words helper, v2 (owner, 22 Nov; design study: one small labelled control on the
   visitor's own field, one suggestion at a time with a way back; a slim home entry; a four-step pop-up).
   With MV.api set, both call the pilot server (team code asked once); without it, real examples made earlier are shown
   and the page says so. Nothing the visitor adds is stored by the page. */
(function () {
  var D = window.MV || { bank: {}, scenes: [], fav: [] };
  var phone = function () { return window.matchMedia('(max-width:820px)').matches; };
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function btn(cls, txt) { var b = el('button', cls, txt); b.type = 'button'; return b; }
  function norm(t) { return String(t || '').toLowerCase().replace(/[^а-яёa-z0-9]+/g, ''); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  // open pilot (owner, 22 Nov): no code header, which also keeps the browser's permission check simple
  function api(path, body, signal) {
    return fetch(D.api + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: signal })
      .then(function (r) { return r.json().then(function (j) { if (r.status === 401) j.reason = 'code'; return j; }); });
  }

  /* ---------- the card stack on the home entry: the top card slips to the back every few seconds ---------- */
  var deck = document.querySelector('.mv-deck');
  if (deck && !calm) setInterval(function () { if (!document.hidden) deck.appendChild(deck.firstElementChild); }, 3600);

  /* ---------- card-words helper ---------- */
  var TONES = [['warm', 'Теплее'], ['funny', 'Игривее'], ['romantic', 'Романтичнее'], ['formal', 'Строже'], ['short', 'Короче']];
  var PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4.5-1.2L19 8.3a2.1 2.1 0 0 0-3-3L5.5 15.8z"/><path d="M14.5 6.8l3 3"/></svg>';
  document.querySelectorAll('textarea[data-helper]').forEach(function (ta) {
    var wrap = el('div', 'mv-field'); ta.parentNode.insertBefore(wrap, ta); wrap.appendChild(ta);
    var pen = btn('mv-pen'); pen.innerHTML = PEN + '<span>Помочь с текстом</span>';
    pen.setAttribute('aria-expanded', 'false'); wrap.appendChild(pen);
    var pop = el('div', 'mv-pop'); pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Помощь с текстом открытки');
    var head = el('div', 'mv-shead'); head.appendChild(el('b', null, 'Помочь с текстом')); var x = btn('mv-x', '×'); x.setAttribute('aria-label', 'Закрыть'); head.appendChild(x);
    var tones = el('div', 'mv-tones');
    var sug = el('div', 'mv-sug'); sug.setAttribute('aria-live', 'polite');
    var acts = el('div', 'mv-acts');
    var put = btn('btn buy', 'Вставить'), more = btn('link', 'Ещё вариант'), keep = btn('link', 'Оставить мой');
    acts.appendChild(put); acts.appendChild(more); acts.appendChild(keep);
    var fine = el('p', 'mv-fine', 'Варианты предлагает нейросеть. Проверьте текст перед отправкой.');
    pop.appendChild(head); pop.appendChild(tones); pop.appendChild(sug); pop.appendChild(acts); pop.appendChild(fine);
    var back = btn('link mv-back', 'Вернуть мой текст'); back.hidden = true; wrap.parentNode.insertBefore(back, wrap.nextSibling);
    back.parentNode.insertBefore(pop, back.nextSibling);
    var mine = null, list = [], at = 0, tone = 'warm', ctl = null;

    TONES.forEach(function (t, k) {
      var c = btn('chip', t[1]); c.setAttribute('aria-pressed', String(k === 0));
      c.addEventListener('click', function () { tones.querySelectorAll('.chip').forEach(function (z) { z.setAttribute('aria-pressed', String(z === c)); }); tone = t[0]; fetchList(); });
      tones.appendChild(c);
    });
    function show() {
      sug.classList.remove('mv-wait');
      if (!list.length) { sug.textContent = 'Не получилось — попробуйте ещё раз или напишите по-своему.'; put.disabled = true; return; }
      sug.textContent = list[at % list.length]; put.disabled = false;
    }
    function fromBank(base) {
      var keys = Object.keys(D.bank), hit = keys.filter(function (k) { return norm(k) === norm(base); })[0];
      var key = hit || keys[0], v = ((D.bank[key] || {})[tone] || {}).variants || [];
      fine.textContent = hit || !keys.length ? 'Варианты предлагает нейросеть. Проверьте текст перед отправкой.' : 'Пробная версия без сервера: показаны варианты для примера «' + key + '».';
      return v;
    }
    function fetchList() {
      var base = (mine != null ? mine : ta.value).trim() || ta.placeholder || '';
      list = []; at = 0; put.disabled = true;
      if (base.split(/\s+/).filter(Boolean).length < 2) { sug.classList.remove('mv-wait'); sug.textContent = 'Напишите пару слов — кому и по какому поводу.'; return; }
      sug.textContent = 'Подбираем слова…'; sug.classList.add('mv-wait');
      if (!D.api) { setTimeout(function () { list = fromBank(base); show(); }, calm ? 0 : 500); return; }
      if (ctl) ctl.abort(); ctl = new AbortController();
      api('/greet', { text: base, mood: tone }, ctl.signal).then(function (j) {
        if (j.reason === 'code') { store('mvcode', ''); askCode(fetchList); return; }
        list = j.ok ? j.variants : []; fine.textContent = 'Варианты предлагает нейросеть. Проверьте текст перед отправкой.'; show();
        if (j.reason === 'refused') sug.textContent = 'С такими словами помочь не можем. Напишите поздравление — и попробуем ещё раз.';
      }).catch(function (e) { if (e.name !== 'AbortError') { list = []; show(); } });
    }
    function open() {
      var sheet = phone(); pop.classList.toggle('mv-sheet', sheet);
      if (sheet) document.body.appendChild(pop); else back.parentNode.insertBefore(pop, back.nextSibling);
      pop.hidden = false; pen.setAttribute('aria-expanded', 'true');
      if (mine == null) mine = ta.value;
      fetchList(); tones.querySelector('.chip').focus();
    }
    function close() { pop.hidden = true; pen.setAttribute('aria-expanded', 'false'); if (ctl) ctl.abort(); pen.focus(); }
    pen.addEventListener('click', function () { pop.hidden ? open() : close(); });
    x.addEventListener('click', close);
    pop.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    more.addEventListener('click', function () { if (list.length > 1 && at < list.length - 1) { at++; show(); } else fetchList(); });
    put.addEventListener('click', function () { ta.value = list[at % list.length]; ta.dispatchEvent(new Event('input', { bubbles: true })); back.hidden = false; close(); });
    keep.addEventListener('click', close);
    back.addEventListener('click', function () { ta.value = mine || ''; ta.dispatchEvent(new Event('input', { bubbles: true })); back.hidden = true; mine = null; });
    ta.addEventListener('input', function (e) { if (e.isTrusted) { mine = null; back.hidden = true; } });
  });

  /* ---------- the team code (pilot only), asked once ---------- */
  function askCode(then) {
    var d = el('dialog', 'mv-dlg'); var box = el('div', 'mv-box'); d.appendChild(box);
    var body = el('div', 'mv-body'); body.appendChild(el('h2', null, 'Код команды'));
    body.appendChild(el('p', 'mv-note', 'Пока это проба только для команды. Введите код, который вам прислали.'));
    var inp = el('input', 'mv-search'); inp.type = 'text'; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Код команды'); body.appendChild(inp);
    var bot = el('div', 'mv-bot'); var no = btn('link', 'Отмена'), ok = btn('btn buy', 'Продолжить'); bot.appendChild(no); bot.appendChild(ok);
    box.appendChild(body); box.appendChild(bot); document.body.appendChild(d); d.showModal(); inp.focus();
    no.addEventListener('click', function () { d.close(); d.remove(); });
    ok.addEventListener('click', function () { if (!inp.value.trim()) return; store('mvcode', inp.value.trim()); d.close(); d.remove(); then(); });
  }

  /* ---------- «Время вместе» pop-up: photos, place, mood, done ---------- */
  var openers = document.querySelectorAll('[data-mv-open]');
  if (!openers.length) return;
  var dlg = el('dialog', 'mv-dlg'); dlg.setAttribute('aria-label', 'Время вместе');
  var box = el('div', 'mv-box'); dlg.appendChild(box);
  var top = el('div', 'mv-top'); var stepN = el('span', 'mv-n'); var close = btn('mv-x', '×'); close.setAttribute('aria-label', 'Закрыть');
  top.appendChild(stepN); top.appendChild(close);
  var bar = el('div', 'mv-bar'); var barI = el('i'); bar.appendChild(barI);
  var body = el('div', 'mv-body'); var bot = el('div', 'mv-bot');
  var prev = btn('link', 'Назад'), next = btn('btn buy', 'Далее');
  bot.appendChild(prev); bot.appendChild(next);
  box.appendChild(top); box.appendChild(bar); box.appendChild(body); box.appendChild(bot);
  document.body.appendChild(dlg);

  var S = { step: 1, photos: [], scene: null, mood: null, ok1: false, ok2: false, ctl: null, image: null };
  var MAX = 8;
  function sceneById(id) { return D.scenes.filter(function (s) { return s.id === id; })[0]; }
  function shrink(file) {                       // the phone sends a photo no bigger than 1280 px (faster, smaller)
    return new Promise(function (res) {
      var r = new FileReader(); r.onload = function () {
        var im = new Image(); im.onload = function () {
          var k = Math.min(1, 1280 / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.86));
        }; im.src = r.result;
      }; r.readAsDataURL(file);
    });
  }
  function render() {
    body.innerHTML = ''; stepN.textContent = S.step <= 4 ? S.step + ' из 4' : '';
    barI.style.width = (S.step <= 4 ? S.step * 25 : 100) + '%';
    prev.hidden = S.step === 1 || S.step > 4; next.hidden = S.step > 4;
    if (S.step === 1) stepPhotos(); else if (S.step === 2) stepPlace(); else if (S.step === 3) stepMood(); else if (S.step === 4) stepDone();
    next.textContent = S.step === 4 ? 'Собрать кадр' : 'Далее';
    check();
  }
  function check() {
    next.disabled = (S.step === 1 && !S.photos.length) || (S.step === 2 && !S.scene) || (S.step === 4 && !(S.ok1 && S.ok2));
  }
  function stepPhotos() {
    body.appendChild(el('h2', null, 'Кто будет в кадре'));
    var strip = el('div', 'mv-strip');
    S.photos.forEach(function (p, i) {
      var t = el('div', 'mv-th'); var im = el('img'); im.src = p.src; im.alt = 'Фото ' + (i + 1); t.appendChild(im);
      var rm = btn('mv-rm', '×'); rm.setAttribute('aria-label', 'Убрать фото ' + (i + 1)); rm.addEventListener('click', function () { S.photos.splice(i, 1); render(); }); t.appendChild(rm);
      var c = el('div', 'mv-cnt'); var m = btn(null, '−'), pl = btn(null, '+'); m.setAttribute('aria-label', 'Меньше людей'); pl.setAttribute('aria-label', 'Больше людей');
      var lab = el('span', null, p.people + ' чел.');
      m.addEventListener('click', function () { if (p.people > 1) { p.people--; render(); } }); pl.addEventListener('click', function () { if (p.people < 12) { p.people++; render(); } });
      c.appendChild(m); c.appendChild(lab); c.appendChild(pl); t.appendChild(c); strip.appendChild(t);
    });
    if (S.photos.length < MAX) {
      var add = el('label', 'mv-add'); add.innerHTML = '<span><b>+</b>Фото</span>';
      var inp = el('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; add.appendChild(inp);
      inp.addEventListener('change', function () {
        var fs = Array.prototype.slice.call(inp.files).slice(0, MAX - S.photos.length);
        Promise.all(fs.map(shrink)).then(function (srcs) { srcs.forEach(function (s) { S.photos.push({ src: s, people: 1 }); }); render(); });
      });
      strip.appendChild(add);
    }
    body.appendChild(strip);
    var total = S.photos.reduce(function (n, p) { return n + p.people; }, 0);
    body.appendChild(el('p', 'mv-fine', S.photos.length ? (S.photos.length + ' из 8 фото · ' + total + ' чел. в кадре. Сколько людей на каждом фото — поправьте под ним.') : 'Одно общее фото или по одному на каждого — до 8. Лучше, когда лица хорошо видны.'));
  }
  function stepPlace() {
    body.appendChild(el('h2', null, 'Где встретимся'));
    var chips = el('div', 'mv-chips');
    D.fav.map(sceneById).filter(Boolean).forEach(function (s) {
      var c = btn('chip', s.name); c.setAttribute('aria-pressed', String(S.scene === s.id));
      c.addEventListener('click', function () { S.scene = s.id; S.mood = null; render(); }); chips.appendChild(c);
    });
    body.appendChild(chips);
    var all = btn('link', 'Все места (' + D.scenes.length + ')'); body.appendChild(all);
    var cur = sceneById(S.scene);
    if (cur && D.fav.indexOf(cur.id) < 0) body.insertBefore(el('p', 'mv-fine', 'Выбрано: ' + cur.name), all);
    all.addEventListener('click', function () {
      all.remove();
      var q = el('input', 'mv-search'); q.type = 'search'; q.placeholder = 'Найти место'; q.setAttribute('aria-label', 'Найти место');
      var list = el('div', 'mv-list');
      function draw() {
        list.innerHTML = '';
        D.scenes.filter(function (s) { return norm(s.name).indexOf(norm(q.value)) >= 0; }).forEach(function (s) {
          var b = btn(null, s.name); b.setAttribute('aria-pressed', String(S.scene === s.id));
          b.addEventListener('click', function () { S.scene = s.id; S.mood = null; render(); }); list.appendChild(b);
        });
      }
      q.addEventListener('input', draw); draw(); body.appendChild(q); body.appendChild(list); q.focus();
    });
  }
  function stepMood() {
    var s = sceneById(S.scene); body.appendChild(el('h2', null, 'Какое настроение'));
    if (!S.mood) S.mood = s.moods[0][0];
    var chips = el('div', 'mv-chips');
    s.moods.forEach(function (m) {
      var c = btn('chip', m[1]); c.setAttribute('aria-pressed', String(S.mood === m[0]));
      c.addEventListener('click', function () { S.mood = m[0]; render(); }); chips.appendChild(c);
    });
    body.appendChild(chips);
    body.appendChild(el('p', 'mv-fine', s.name + ' · ' + S.photos.length + ' фото'));
  }
  function stepDone() {
    body.appendChild(el('h2', null, 'Почти готово'));
    [['ok1', 'Согласен(на) на обработку этих фото, чтобы собрать картинку.'], ['ok2', 'Люди на фото знают об этом и не против.']].forEach(function (c) {
      var l = el('label', 'mv-ok'); var i = el('input'); i.type = 'checkbox'; i.checked = S[c[0]];
      i.addEventListener('change', function () { S[c[0]] = i.checked; check(); });
      l.appendChild(i); l.appendChild(el('span', null, c[1])); body.appendChild(l);
    });
    body.appendChild(el('p', 'mv-fine', 'Фото нужны только для этой картинки и не сохраняются. Картинку создаёт нейросеть. Черновик: тексты согласий утвердит юрист.'));
  }
  function generate() {
    S.step = 5; body.innerHTML = ''; stepN.textContent = ''; prev.hidden = true; next.hidden = true;
    var h = el('h2', null, 'Накрываем на стол…'); var p = el('p', 'mv-fine', 'Обычно около 20 секунд.');
    var cancel = btn('link', 'Отменить'); body.appendChild(h); body.appendChild(p); body.appendChild(cancel);
    var pct = 10; barI.style.width = '10%';
    var tick = setInterval(function () { pct = Math.min(92, pct + (92 - pct) * 0.12); barI.style.width = pct + '%'; p.textContent = Math.round(pct) + '% · обычно около 20 секунд.'; }, 700);
    S.ctl = new AbortController();
    cancel.addEventListener('click', function () { S.ctl.abort(); clearInterval(tick); S.step = 4; render(); });
    var done = function (image, note) { clearInterval(tick); barI.style.width = '100%'; result(image, note); };
    if (!D.api) {
      var s = sceneById(S.scene); setTimeout(function () { done(s.sample, 'Пробная версия без сервера: показан пример из наших проб с придуманными людьми.'); }, calm ? 300 : 2600); return;
    }
    api('/picture', { photos: S.photos, scene: S.scene, mood: S.mood }, S.ctl.signal).then(function (j) {
      if (j.reason === 'code') { store('mvcode', ''); clearInterval(tick); askCode(generate); return; }
      if (!j.ok) { clearInterval(tick); failed(j.reason); return; }
      done(j.image);
    }).catch(function (e) { if (e.name !== 'AbortError') { clearInterval(tick); failed('error'); } });
  }
  function failed(reason) {
    body.innerHTML = '';
    body.appendChild(el('h2', null, 'Не получилось'));
    var why = { 'visitor-limit': 'На сегодня ваши кадры закончились — приходите завтра.', 'pilot-limit': 'На сегодня проба закончилась — приходите завтра.', 'none-available': 'Сейчас все художники заняты. Попробуйте через минуту.', 'too-large': 'Фото слишком большие. Попробуйте меньше фото.', 'refused': 'Эти фото мы не можем использовать. Попробуйте другие — обычные семейные фото.', 'check-unavailable': 'Проверка фото сейчас недоступна. Попробуйте через минуту.' }[reason] || 'Что-то пошло не так. Попробуйте ещё раз.';
    body.appendChild(el('p', 'mv-note', why));
    var again = btn('btn', 'Ещё раз'); again.addEventListener('click', generate); body.appendChild(again);
  }
  function result(image, note) {
    S.image = image; body.innerHTML = '';
    var f = el('figure', 'mv-res'); var im = el('img'); im.src = image; im.alt = 'Ваш кадр «Время вместе»'; f.appendChild(im); f.appendChild(el('figcaption', null, 'Создано нейросетью'));
    body.appendChild(f);
    if (note) body.appendChild(el('p', 'mv-note', note));
    var row = el('div', 'mv-acts');
    var save = el('a', 'btn buy', 'Сохранить'); save.href = image; save.download = 'vremya-vmeste.jpg';
    var share = btn('btn', 'Поделиться'); share.hidden = !navigator.share;
    share.addEventListener('click', function () {
      fetch(image).then(function (r) { return r.blob(); }).then(function (b) {
        var file = new File([b], 'vremya-vmeste.jpg', { type: b.type || 'image/jpeg' });
        var d = navigator.canShare && navigator.canShare({ files: [file] }) ? { files: [file], title: 'Время вместе' } : { title: 'Время вместе', url: location.href };
        return navigator.share(d);
      }).catch(function () {});
    });
    var mood = btn('link', 'Другое настроение'); mood.addEventListener('click', function () { S.step = 3; render(); });
    var again = btn('link', 'Начать заново'); again.addEventListener('click', function () { S.photos = []; S.scene = null; S.mood = null; S.ok1 = S.ok2 = false; S.step = 1; render(); });
    row.appendChild(save); row.appendChild(share); row.appendChild(mood); row.appendChild(again); body.appendChild(row);
  }
  next.addEventListener('click', function () { if (next.disabled) return; if (S.step === 4) generate(); else { S.step++; render(); } });
  prev.addEventListener('click', function () { if (S.step > 1) { S.step--; render(); } });
  close.addEventListener('click', function () { if (S.ctl) S.ctl.abort(); dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) { if (S.ctl) S.ctl.abort(); dlg.close(); } });
  function openDlg(e) { if (e) e.preventDefault(); if (S.step > 4 && !S.image) S.step = 1; render(); dlg.showModal(); }
  openers.forEach(function (o) {
    o.addEventListener('click', function (e) {
      if (o.tagName === 'A' && !/index\.html/.test(location.pathname) && !/\/$/.test(location.pathname)) return;   // other pages: go home first
      openDlg(e);
    });
  });
  if (location.hash === '#vremya') setTimeout(openDlg, 300);     // arrived from the menu on another page: the visitor asked for it
})();
