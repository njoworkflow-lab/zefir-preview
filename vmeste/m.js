/* «Время вместе» and the card-words helper: behaviour for the review copy of the store (owner, 22 Nov).
   This copy runs without a server: the helper shows real versions made earlier by the pilot's services for the site's
   sample sentences, and the photo page shows a picture from the test rounds. Nothing the visitor adds leaves the phone. */
(function () {
  var D = window.MV || { bank: {}, scenes: [] };
  var MOODS = [['warm', 'Теплее'], ['funny', 'С улыбкой'], ['romantic', 'Романтичнее'], ['formal', 'Официально'], ['short', 'Короче']];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function norm(t) { return String(t || '').toLowerCase().replace(/[^а-яёa-z0-9]+/g, ''); }

  /* ---------- the card-words helper: one per textarea marked data-helper ---------- */
  document.querySelectorAll('textarea[data-helper]').forEach(function (ta) {
    var box = el('div', 'mv-hlp');
    var open = el('button', 'link mv-open', 'Подобрать слова');
    open.type = 'button';
    var hint = el('p', 'small mv-note', 'Ваш текст останется вашим — помощник только предложит три варианта.');
    var chips = el('div', 'chips'); chips.hidden = true;
    var vars = el('div', 'mv-vars'); vars.setAttribute('aria-live', 'polite');
    var row = el('div', 'mv-row');
    var back = el('button', 'link', 'Вернуть мой текст'); back.type = 'button'; back.hidden = true;
    var demo = el('p', 'small mv-note mv-demo'); demo.hidden = true;
    row.appendChild(back);
    box.appendChild(open); box.appendChild(hint); box.appendChild(chips); box.appendChild(vars); box.appendChild(demo); box.appendChild(row);
    ta.insertAdjacentElement('afterend', box);
    var mine = '';
    MOODS.forEach(function (m) {
      var c = el('button', 'chip', m[1]); c.type = 'button'; c.setAttribute('aria-pressed', 'false'); c.dataset.m = m[0];
      c.addEventListener('click', function () { chips.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); }); show(m[0]); });
      chips.appendChild(c);
    });
    open.addEventListener('click', function () {
      chips.hidden = !chips.hidden; open.textContent = chips.hidden ? 'Подобрать слова' : 'Скрыть помощника';
      if (!chips.hidden && !chips.querySelector('[aria-pressed="true"]')) chips.querySelector('.chip').click();
    });
    function pick() {
      var keys = Object.keys(D.bank), cur = norm(ta.value || ta.placeholder);
      for (var i = 0; i < keys.length; i++) if (norm(keys[i]) === cur) return { key: keys[i], same: true };
      return { key: keys[0], same: false };
    }
    function show(mood) {
      var p = pick(), set = (D.bank[p.key] || {})[mood] || { variants: [] };
      vars.innerHTML = '';
      if (!set.variants.length) { vars.appendChild(el('p', 'small', 'Сейчас помощник занят — попробуйте другое настроение или напишите своими словами.')); }
      set.variants.forEach(function (v) {
        var b = el('button', 'mv-var', v); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          if (back.hidden) mine = ta.value;          // keep the visitor's own words the first time only
          vars.querySelectorAll('.mv-var').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          ta.value = v; ta.dispatchEvent(new Event('input', { bubbles: true })); back.hidden = false;
        });
        vars.appendChild(b);
      });
      demo.hidden = p.same;
      demo.textContent = 'Пробная версия: варианты показаны для примера «' + p.key + '». В рабочей версии — для ваших слов.';
    }
    back.addEventListener('click', function () { ta.value = mine; ta.dispatchEvent(new Event('input', { bubbles: true })); back.hidden = true; vars.querySelectorAll('.mv-var').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); });
  });

  /* ---------- the «Время вместе» page ---------- */
  var page = $('#vv');
  if (!page) return;
  var MAX = 8, photos = [], scene = null, mood = null;
  var input = $('#vvfiles'), drop = $('#vvdrop'), list = $('#vvphotos'), count = $('#vvcount');
  function total() { return photos.reduce(function (n, p) { return n + p.people; }, 0); }
  function drawPhotos() {
    list.innerHTML = '';
    photos.forEach(function (p, i) {
      var c = el('div', 'mv-ph'); var im = el('img'); im.src = p.url; im.alt = 'Ваше фото ' + (i + 1); c.appendChild(im);
      var rm = el('button', 'mv-rm', '×'); rm.type = 'button'; rm.setAttribute('aria-label', 'Убрать фото ' + (i + 1));
      rm.addEventListener('click', function () { photos.splice(i, 1); drawPhotos(); });
      var who = el('div', 'mv-who');
      var minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Меньше людей на фото ' + (i + 1));
      var lab = el('span', null, p.people === 1 ? '1 человек' : p.people + ' чел. на фото');
      var plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Больше людей на фото ' + (i + 1));
      minus.addEventListener('click', function () { if (p.people > 1) { p.people--; drawPhotos(); } });
      plus.addEventListener('click', function () { if (p.people < 12) { p.people++; drawPhotos(); } });
      who.appendChild(minus); who.appendChild(lab); who.appendChild(plus);
      c.appendChild(rm); c.appendChild(who); list.appendChild(c);
    });
    var n = total();
    count.textContent = photos.length ? (photos.length + ' фото · всего ' + n + ' ' + (n === 1 ? 'человек' : (n < 5 ? 'человека' : 'человек')) + ' в кадре') : 'Можно одно общее фото или отдельное фото каждого — до 8.';
    drop.hidden = photos.length >= MAX;
    ready();
  }
  function add(files) {
    Array.prototype.slice.call(files || []).filter(function (f) { return /^image\//.test(f.type); }).slice(0, MAX - photos.length).forEach(function (f) {
      var r = new FileReader();
      r.onload = function () { photos.push({ url: r.result, people: 1 }); drawPhotos(); };
      r.readAsDataURL(f);
    });
  }
  input.addEventListener('change', function () { add(input.files); input.value = ''; });
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); add(e.dataTransfer.files); });

  var grid = $('#vvscenes'), moodsBox = $('#vvmoods');
  D.scenes.forEach(function (s) {
    var b = el('button', 'mv-sc'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
    var im = el('img'); im.src = s.img; im.alt = ''; im.loading = 'lazy'; b.appendChild(im); b.appendChild(el('span', null, s.name));
    b.addEventListener('click', function () {
      grid.querySelectorAll('.mv-sc').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      scene = s; mood = null; drawMoods(); ready();
    });
    grid.appendChild(b);
  });
  function drawMoods() {
    moodsBox.innerHTML = '';
    if (!scene) { moodsBox.appendChild(el('p', 'small', 'Сначала выберите место.')); return; }
    scene.moods.forEach(function (m, k) {
      var c = el('button', 'chip', m[1]); c.type = 'button'; c.setAttribute('aria-pressed', String(k === 0));
      c.addEventListener('click', function () { moodsBox.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); }); mood = m[0]; });
      moodsBox.appendChild(c);
    });
    mood = scene.moods[0] && scene.moods[0][0];
  }
  drawMoods();
  var ok = $('#vvok'), ok2 = $('#vvok2'), go = $('#vvgo'), why = $('#vvwhy'), res = $('#vvres');
  function ready() {
    var miss = [];
    if (!photos.length) miss.push('фото');
    if (!scene) miss.push('место');
    if (!ok.checked || !ok2.checked) miss.push('два согласия');
    go.disabled = miss.length > 0;
    why.textContent = miss.length ? 'Осталось: ' + miss.join(', ') + '.' : 'Готово: соберём кадр примерно за 20 секунд.';
  }
  ok.addEventListener('change', ready); ok2.addEventListener('change', ready);
  go.addEventListener('click', function () {
    if (go.disabled) return;
    res.hidden = false; res.innerHTML = '';
    var w = el('p', 'mv-wait'); w.appendChild(el('i')); w.appendChild(el('i')); w.appendChild(el('i')); w.appendChild(document.createTextNode(' Собираем всех за одним столом…'));
    res.appendChild(w); res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () {
      res.innerHTML = '';
      var f = el('figure'); var im = el('img'); im.src = scene.res; im.alt = scene.name + ' — пример кадра'; f.appendChild(im); f.appendChild(el('span', 'mv-ai', 'Создано ИИ'));
      res.appendChild(f);
      res.appendChild(el('p', 'small mv-demo', 'Пробная версия: показан пример из наших проб с придуманными людьми. В рабочей версии здесь будет ваш кадр — с вашими людьми из ' + photos.length + ' фото.'));
      res.appendChild(el('p', 'small', 'Ваши фото не сохраняются: они нужны только чтобы собрать кадр и сразу удаляются.'));
      var again = el('button', 'btn', 'Другое место'); again.type = 'button';
      again.addEventListener('click', function () { grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      var row = el('div', 'mv-go'); row.appendChild(again);
      var shop = el('a', 'btn buy', 'Выбрать зефир к встрече'); shop.href = 'katalog.html'; row.appendChild(shop);
      res.appendChild(row);
    }, 2400);
  });
  drawPhotos();
})();
