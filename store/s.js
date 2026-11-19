/* «Зефирная симфония» store preview: cart, panels, cards, product page, box, checkout. No libraries. */
(function(){
  'use strict';
  var $=function(s,r){ return (r||document).querySelector(s); }, $$=function(s,r){ return [].slice.call((r||document).querySelectorAll(s)); };
  var P={ malina:{n:'Малина',t:'Яркая ягодная кислинка',c:'#E7A6B2'}, smorodina:{n:'Чёрная смородина',t:'Нежная, из спелых ягод',c:'#BBA6D6'},
          klubnika:{n:'Клубника',t:'Мягкая ягодная сладость',c:'#F0B9BE'}, yabloko:{n:'Яблоко с корицей',t:'Тепло и пряность',c:'#EADCC4'},
          assorti:{n:'Ассорти',t:'Четыре вкуса в одной коробке',c:'#E9C3C8'} };
  var FL=['malina','smorodina','klubnika','yabloko'], PRICE=750, OWN=750, GIFT_FROM=3, RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rub(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₽'; }
  function plural(n,a,b,c){ var m=n%10, h=n%100; return (m===1&&h!==11)?a:(m>=2&&m<=4&&(h<12||h>14))?b:c; }
  function boxes(n){ return n+' '+plural(n,'коробка','коробки','коробок'); }

  /* ---------- the cart (kept in this browser only) ---------- */
  var C={i:{},m:[],card:''};
  try{ var s=JSON.parse(localStorage.getItem('zs-cart')||'null'); if(s&&s.i) C=s; if(!C.m) C.m=[]; }catch(e){}
  function save(){ try{ localStorage.setItem('zs-cart',JSON.stringify(C)); }catch(e){} render(); }
  function paid(){ var n=0; for(var k in C.i) n+=C.i[k]; return n+C.m.length; }
  function subtotal(){ var s=0; for(var k in C.i) s+=C.i[k]*PRICE; return s+C.m.length*OWN; }
  function set(id,q){ if(q<=0) delete C.i[id]; else C.i[id]=Math.min(q,99); save(); }
  function add(id,q){ set(id,(C.i[id]||0)+(q||1)); }
  window.ZS={C:C,P:P,FL:FL,add:add,set:set,save:save,paid:paid,subtotal:subtotal,rub:rub,boxes:boxes,openCart:function(){ open('cart'); },
    addMix:function(mix){ C.m.push(mix); save(); }, clear:function(){ C.i={}; C.m=[]; C.card=''; save(); }, est:est, plural:plural};

  function render(){
    var n=paid();
    $$('.cnt').forEach(function(x){ x.textContent=n; x.dataset.n=n; });
    $$('[data-add]').forEach(function(b){ var id=b.dataset.add, q=C.i[id]||0, wrap=b.closest('.add'); if(!wrap) return;
      var st=$('.step',wrap); b.hidden=q>0; st.hidden=q===0; if(q) $('output',st).textContent=q; });
    $$('[data-prog]').forEach(prog);
    cart();
    document.dispatchEvent(new CustomEvent('zs:cart'));
  }
  function prog(el){ var n=paid(), left=Math.max(0,GIFT_FROM-n), bar=$('.bar i',el), t=$('.pt',el);
    if(t) t.innerHTML = left ? (n===0 ? 'Три коробки — и «Ассорти» положим в&nbsp;подарок' : 'Ещё '+boxes(left)+' — и «Ассорти» в&nbsp;подарок') : '«Ассорти» в&nbsp;подарок — уже в&nbsp;корзине';
    if(bar) bar.style.width=Math.min(100,n/GIFT_FROM*100)+'%'; }

  /* ---------- side panels ---------- */
  var shade=$('.shade'), last=null, openId=null;
  function open(id){ var p=document.getElementById(id); if(!p) return; last=document.activeElement; openId=id;
    p.hidden=false; p.removeAttribute('inert'); requestAnimationFrame(function(){ p.classList.add('on'); shade.classList.add('on'); });
    document.body.style.overflow='hidden'; setTimeout(function(){ var f=$('.x',p); if(f) f.focus(); },60);
    $$('[aria-controls="'+id+'"]').forEach(function(b){ b.setAttribute('aria-expanded','true'); }); }
  function close(){ if(!openId) return; var p=document.getElementById(openId); p.classList.remove('on'); shade.classList.remove('on'); p.setAttribute('inert','');
    $$('[aria-controls="'+openId+'"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
    document.body.style.overflow=''; openId=null; if(last&&last.focus) last.focus(); }
  $$('.panel').forEach(function(p){ p.setAttribute('inert',''); });
  document.addEventListener('click',function(e){
    var o=e.target.closest('[data-open]'); if(o){ e.preventDefault(); open(o.dataset.open); return; }
    if(e.target.closest('.x[data-close]')||e.target===shade){ close(); return; }
    var a=e.target.closest('[data-add]'); if(a){ fly(a,a.dataset.add); add(a.dataset.add,1); pulse(); return; }
    var st=e.target.closest('[data-q]'); if(st){ var id=st.closest('[data-id]').dataset.id, d=+st.dataset.q;
      if(id.indexOf('mix')===0){ if(d<0) C.m.splice(+id.slice(3),1); save(); } else set(id,(C.i[id]||0)+d); return; }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
  function pulse(){ setTimeout(function(){ $$('.cnt').forEach(function(x){ x.classList.add('bump'); setTimeout(function(){ x.classList.remove('bump'); },420); }); }, RM?0:620); }
  /* a small round picture of the flavour travels from the button to the cart, on a soft curve */
  function fly(from,id){ if(RM) return; var to=$$('.hd .cnt').filter(function(x){ return x.offsetParent; })[0]; if(!to||!from) return;
    var a=from.getBoundingClientRect(), b=to.getBoundingClientRect(), d=document.createElement('i'); d.className='fly'; d.style.backgroundImage='url(img/'+(id&&id.indexOf('mix')<0?id:'assorti')+'-sq.webp?v=e8fb21ad)';
    d.style.left=(a.left+a.width/2-23)+'px'; d.style.top=(a.top+a.height/2-23)+'px'; document.body.appendChild(d);
    var dx=b.left+b.width/2-(a.left+a.width/2), dy=b.top+b.height/2-(a.top+a.height/2);
    if(!d.animate){ d.remove(); return; }
    d.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+dx*.45+'px,'+(dy*.45-90)+'px) scale(.9)',opacity:1,offset:.5},{transform:'translate('+dx+'px,'+dy+'px) scale(.25)',opacity:.2}],{duration:700,easing:'cubic-bezier(.45,0,.2,1)'}).onfinish=function(){ d.remove(); }; }
  ZS.fly=fly;

  /* ---------- the cart panel ---------- */
  function line(id,img,name,sub,q,sum){
    return '<div class="line" data-id="'+id+'"><img src="'+img+'" alt=""><div><p class="n">'+name+'</p><p class="s">'+sub+'</p>'+
      (q!=null?'<div class="step" style="margin-top:8px"><button type="button" data-q="-1" aria-label="Меньше">−</button><output>'+q+'</output><button type="button" data-q="1" aria-label="Больше">+</button></div>':'')+
      '</div><div class="p">'+sum+'</div></div>'; }
  function cart(){
    var b=$('#cart .body'), f=$('#cart .foot'); if(!b) return; var n=paid(), h='';
    if(!n){ b.innerHTML='<div class="empty"><img src="img/own-box.webp?v=e8fb21ad" alt=""><p class="h3">В корзине пока пусто</p><p class="small">Коробка ждёт: девять мест, пять вкусов на&nbsp;выбор.</p><a class="btn" href="katalog.html">Выбрать вкус</a></div>'; f.hidden=true; return; }
    f.hidden=false;
    var ims=[]; for(var k0 in C.i) for(var j0=0;j0<C.i[k0]&&ims.length<3;j0++) ims.push(k0); C.m.forEach(function(){ if(ims.length<3) ims.push('assorti'); });
    h+='<div class="head2"><span class="cstack" aria-hidden="true">'+ims.reverse().map(function(k){ return '<img src="img/'+k+'-box.webp?v=e8fb21ad" alt="">'; }).join('')+'</span><div><p class="h3">'+boxes(n)+(n>=GIFT_FROM?' и «Ассорти» на бис':'')+'</p><p class="small">'+(n>=GIFT_FROM?'Четвёртая коробка — подарок, она уже в заказе':'Каждая коробка — девять зефиров, симфония')+'</p></div></div>';
    for(var k in C.i) h+=line(k,'img/'+k+'-box.webp?v=e8fb21ad',P[k].n,'9 шт · 360 г',C.i[k],rub(C.i[k]*PRICE));
    C.m.forEach(function(m,i){ h+=line('mix'+i,'img/assorti-box.webp?v=e8fb21ad','Своя коробка',mixtext(m),null,rub(OWN)+'<button class="rmv" type="button" data-q="-1">Убрать</button>'); });
    if(n>=GIFT_FROM) h+='<div class="line gift"><img src="img/assorti-box.webp?v=e8fb21ad" alt=""><div><p class="n">Ассорти, в&nbsp;подарок</p><p class="s">Положили сами: за&nbsp;три коробки</p></div><div class="p">0&nbsp;₽</div></div>';
    h+='<div class="prog" data-prog><p class="pt"></p><div class="bar"><i></i></div></div>';
    h+='<details class="note-box"'+(C.card?' open':'')+'><summary class="link" style="list-style:none">Добавить открытку с&nbsp;вашими словами</summary><textarea id="cardtext" maxlength="200" placeholder="Например: «С&nbsp;Новым годом, мама!»">'+(C.card||'')+'</textarea><p class="small">Напишем от&nbsp;руки и&nbsp;вложим в&nbsp;коробку. Бесплатно.</p></details>';
    var e=est(localStorage.getItem('zs-city')||'');
    h+='<p class="small" style="margin-top:16px">Доставка '+(e.known?'в&nbsp;'+e.city+': ':'по&nbsp;России: ')+'от&nbsp;'+rub(e.pvz)+', '+e.when+'. Точная цена — при&nbsp;оформлении.</p>';
    b.innerHTML=h; $$('[data-prog]',b).forEach(prog);
    var ta=$('#cardtext'); if(ta) ta.addEventListener('input',function(){ C.card=ta.value; try{ localStorage.setItem('zs-cart',JSON.stringify(C)); }catch(e){} });
    $('.sum b',f).textContent=rub(subtotal());
  }
  function mixtext(m){ var o=[]; FL.forEach(function(k,i){ if(m[i]) o.push(P[k].n.toLowerCase().replace('чёрная ','')+' '+m[i]); }); return o.join(', '); }
  ZS.mixtext=mixtext;

  /* ---------- delivery estimate (example numbers until CDEK is connected) ---------- */
  var CITY={ 'москва':[290,490,2,3], 'санкт-петербург':[320,520,2,4], 'пенза':[190,350,1,2], 'казань':[290,490,2,3], 'нижний новгород':[290,490,2,3],
    'самара':[260,450,1,3], 'саратов':[250,430,1,2], 'екатеринбург':[350,590,3,5], 'новосибирск':[420,690,4,6], 'краснодар':[340,560,3,5],
    'ростов-на-дону':[320,540,3,4], 'воронеж':[280,470,2,3], 'уфа':[320,530,2,4], 'пермь':[340,560,3,4], 'красноярск':[460,740,5,7], 'владивосток':[590,890,7,10] };
  var MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  function dt(d){ return d.getDate()+' '+MON[d.getMonth()]; }
  function est(city){ var k=(city||'').trim().toLowerCase().replace('спб','санкт-петербург').replace('питер','санкт-петербург'), v=CITY[k], known=!!v; v=v||[290,490,3,7];
    var now=new Date(), a=new Date(now), b=new Date(now); a.setDate(a.getDate()+2+v[2]); b.setDate(b.getDate()+5+v[3]);
    return {known:known, city:known?city.trim().replace(/^./,function(c){return c.toUpperCase();}):'', pvz:v[0], cur:v[1], days:v[2]+'–'+v[3], when:'к '+dt(a)+'–'+dt(b), a:a, b:b}; }
  $$('[data-est]').forEach(function(box){ var inp=$('input',box), res=$('.res',box);
    function go(){ var e=est(inp.value); if(inp.value.trim()) try{ localStorage.setItem('zs-city',inp.value.trim()); }catch(x){} document.dispatchEvent(new CustomEvent('zs:city'));
      res.innerHTML='<div><span>Пункт выдачи СДЭК</span><b>от '+rub(e.pvz)+'</b></div><div><span>Курьер до двери</span><b>от '+rub(e.cur)+'</b></div><div><span>Получите</span><b>'+e.when+'</b></div>'+
        (inp.value.trim()&&!e.known?'<p class="small">Для этого города посчитаем точно при&nbsp;оформлении.</p>':''); cart(); }
    inp.value=localStorage.getItem('zs-city')||''; inp.addEventListener('input',go); go(); });
  $$('[data-est-line]').forEach(function(el){ function go(){ var e=est(localStorage.getItem('zs-city')||'');
    el.innerHTML='Доставка '+(e.known?'в\u00a0'+e.city:'по\u00a0России')+': от\u00a0'+rub(e.pvz)+', '+e.when+' · <button class="link" type="button" data-city style="font-size:inherit;font-weight:400">'+(e.known?'другой город':'ваш город')+'</button>'; }
    go(); el.addEventListener('click',function(e){ if(!e.target.closest('[data-city]')) return;
      el.innerHTML='<span style="display:flex;gap:8px"><input aria-label="Ваш город" list="cities1" style="flex:1;height:42px;padding:0 12px;border:1px solid var(--ink);font-size:16px" placeholder="Ваш город"><button class="btn" type="button" style="min-height:42px;padding:0 16px">Готово</button></span><datalist id="cities1"><option>Москва</option><option>Санкт-Петербург</option><option>Пенза</option><option>Казань</option><option>Екатеринбург</option><option>Новосибирск</option></datalist>';
      var inp=$('input',el); inp.focus(); function ok(){ try{ localStorage.setItem('zs-city',inp.value.trim()); }catch(x){} go(); cart(); }
      $('.btn',el).addEventListener('click',ok); inp.addEventListener('keydown',function(k){ if(k.key==='Enter') ok(); }); }); });
  /* ---------- cards: dots follow the swipe ---------- */
  $$('.card .sl').forEach(function(sl){ var d=$$('i',sl.parentNode.querySelector('.dots')||document.createElement('b')); if(!d.length) return;
    sl.addEventListener('scroll',function(){ var k=Math.round(sl.scrollLeft/sl.clientWidth); d.forEach(function(x,i){ x.classList.toggle('on',i===k); }); },{passive:true}); });

  /* ---------- product page: gallery, sticky bar, quantity ---------- */
  var gal=$('.gal');
  if(gal){ var main=$('.main',gal), th=$$('.th button',gal);
    th.forEach(function(b,i){ b.addEventListener('click',function(){ main.scrollTo({left:i*main.clientWidth,behavior:RM?'auto':'smooth'}); }); });
    main.addEventListener('scroll',function(){ var k=Math.round(main.scrollLeft/main.clientWidth); th.forEach(function(b,i){ b.setAttribute('aria-current',String(i===k)); }); },{passive:true}); }
  var buy=$('[data-buy]');
  if(buy){ var id=buy.dataset.buy, qo=$('#qty output'), q=1;
    $('#qty').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b) return; q=Math.max(1,Math.min(20,q+(+b.dataset.d))); qo.textContent=q; });
    function doBuy(e){ var b=e&&e.currentTarget; fly(b,id); add(id,q); pulse(); if(b){ var t=b.textContent; b.classList.add('done'); b.textContent='Добавлено ✓'; setTimeout(function(){ b.classList.remove('done'); b.textContent=t; },1500); } setTimeout(function(){ open('cart'); }, RM?0:650); }
    $$('[data-buy]').forEach(function(b){ b.addEventListener('click',doBuy); });
    var stick=$('.stick'); if(stick&&'IntersectionObserver' in window) new IntersectionObserver(function(en){ en.forEach(function(x){ var past=!x.isIntersecting&&x.boundingClientRect.top<0; stick.classList.toggle('on',past); stick.toggleAttribute('inert',!past); }); }).observe(buy); }

  /* ---------- the box scene on the home: pinned for one screen, the scroll slides the sleeve off ---------- */
  /* the box take: swap the tray's filling (a cross-fade between two photographs of the same box) */
  function zsTake(el,f,now){ if(!el) return; var box=$('.ttr',el), cur=box.lastElementChild; if(cur&&cur.dataset.f===f) return;
    var im=new Image(); im.alt=''; im.draggable=false; im.dataset.f=f; im.className='tt'+(now?'':' in');
    im.onload=function(){ box.appendChild(im); if(now){ while(box.children.length>1) box.removeChild(box.firstChild); return; }
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ im.classList.remove('in'); }); });
      setTimeout(function(){ while(box.children.length>1) box.removeChild(box.firstChild); },560); };
    im.src='img/take-'+f+'.webp?v=e8fb21ad'; }
  window.zsTake=zsTake;
  var tk=$('#tk');
  if(tk){ var sel='malina', shut=0, shutTo=0, scene=tk.closest('.boxscene'), wrapb=tk.parentNode;
    function pick(f){ sel=f; shutTo=0; zsTake(tk,f);
      $$('#bxpick .chip').forEach(function(b){ b.setAttribute('aria-pressed',String(b.dataset.f===f)); });
      $('#bxname').textContent=P[f].n; $('#bxnote').textContent=P[f].t; $('#bxlink').href=f+'.html'; }
    $('#bxpick').addEventListener('click',function(e){ var b=e.target.closest('.chip'); if(b) pick(b.dataset.f); });
    $('#bxadd').addEventListener('click',function(){ var t=this; fly(tk,sel); add(sel,1); pulse(); shutTo=1; t.classList.add('done'); t.textContent='В корзине ✓';
      setTimeout(function(){ t.classList.remove('done'); t.textContent='В корзину — 750 ₽'; },1700); });
    var warm=function(){ ['smorodina','klubnika','yabloko','assorti'].forEach(function(f){ (new Image()).src='img/take-'+f+'.webp?v=e8fb21ad'; }); };
    if('requestIdleCallback' in window) requestIdleCallback(warm,{timeout:4000}); else setTimeout(warm,2500);
    var lastK=-1, sm=0;
    (function loop(){ var r=scene.getBoundingClientRect(), vh=innerHeight, span=Math.max(1,r.height-vh), p=Math.max(0,Math.min(1,-r.top/span));
      if(r.height<vh*1.2){ var r2=wrapb.getBoundingClientRect(); p=Math.max(0,Math.min(1,(vh-r2.top)/(vh*.8))); }
      sm+=(p-sm)*.14; if(sm<.08) shutTo=0;
      shut+=(shutTo-shut)*.1; var o=Math.max(0,Math.min(1,(sm-.06)/.56)); o=o*o*(3-2*o); var k=o*(1-shut);
      if(Math.abs(k-lastK)>.0008){ tk.style.setProperty('--k',k.toFixed(4)); lastK=k; }
      requestAnimationFrame(loop); })(); }

  /* ---------- the film band: plays only when asked ---------- */
  $$('[data-film]').forEach(function(b){ b.addEventListener('click',function(){ var m=document.createElement('div'); m.className='modal'; m.setAttribute('role','dialog'); m.setAttribute('aria-label','Как мы готовим зефир');
    var tall=innerWidth<innerHeight; m.innerHTML='<video controls playsinline autoplay src="../home/v/film-'+(tall?'t':'w')+'.mp4?v=e8fb21ad" poster="../home/v/poster-'+(tall?'t':'w')+'.jpg?v=e8fb21ad"></video><button class="x" type="button" aria-label="Закрыть">×</button>';
    document.body.appendChild(m); var x=$('.x',m); x.focus(); function cl(){ m.remove(); b.focus(); document.removeEventListener('keydown',k); } function k(e){ if(e.key==='Escape') cl(); }
    x.addEventListener('click',cl); document.addEventListener('keydown',k); }); });

  if(innerWidth>=900) $$('.ft details').forEach(function(d){ d.open=true; });

  /* ---------- reveals: things rise softly once as they come into view ---------- */
  if(!('IntersectionObserver' in window)) document.documentElement.classList.add('no-motion'); if(RM) document.documentElement.classList.add('calm');
  $$('.split').forEach(function(el){ var k=0; (function walk(n){ [].slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3){ var f=document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(function(w){ if(!w) return; if(/^\s+$/.test(w)){ f.appendChild(document.createTextNode(w)); return; } var sp=document.createElement('span'); sp.className='w'; sp.style.setProperty('--i',k++); sp.textContent=w; f.appendChild(sp); }); n.replaceChild(f,c); }
      else if(c.nodeType===1&&c.tagName!=='BR'){ if(c.tagName==='I'){ c.classList.add('w'); c.style.setProperty('--i',k++); } else walk(c); } }); })(el); });
  $$('.stagger').forEach(function(g){ [].slice.call(g.children).forEach(function(c,i){ c.classList.add('rv'); c.style.setProperty('--i',i%6); }); });
  if('IntersectionObserver' in window){ var io=new IntersectionObserver(function(en){ en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add('on'); io.unobserve(x.target); } }); },{rootMargin:'0px 0px -8% 0px',threshold:.08});
    $$('.rv,.split,.tile').forEach(function(el){ io.observe(el); }); }
  else $$('.rv,.split,.tile').forEach(function(el){ el.classList.add('on'); });

  /* ---------- the header gains a soft shadow once the page moves ---------- */
  var hd=$('.hd'); if(hd){ var up=function(){ hd.classList.toggle('up', hd.getBoundingClientRect().top<=0 && scrollY>40); }; addEventListener('scroll',up,{passive:true}); up(); }

  /* ---------- the gift meter: three boxes fill as you add, the fourth ties itself ---------- */
  function meters(){ var n=paid(); var order=[]; for(var q in C.i) for(var j=0;j<C.i[q];j++) order.push(q); C.m.forEach(function(){ order.push('assorti'); });
    $$('[data-meter]').forEach(function(m){ var is=$$('i',m); is.forEach(function(x,i){ x.classList.toggle('f', i<3 ? n>i : n>=GIFT_FROM); if(i<3) x.style.backgroundImage=order[i]?'url(img/'+order[i]+'-box.webp?v=e8fb21ad)':''; });
    var t=$('.mt',m.parentNode); if(t) t.innerHTML = n>=GIFT_FROM ? '«Ассорти» уже ждёт вас в&nbsp;корзине' : (n ? 'Ещё '+boxes(GIFT_FROM-n)+' — и четвёртая ваша' : 'Добавьте три любые коробки'); }); }
  document.addEventListener('zs:cart',meters);

  /* ---------- the taste picker: two taps, one flavour ---------- */
  var tp=$('[data-taste]');
  if(tp){ var ans={};
    tp.addEventListener('click',function(e){ var b=e.target.closest('[data-a]'); if(!b) return; var q=b.closest('[data-qn]'); ans[q.dataset.qn]=b.dataset.a;
      $$('[data-a]',q).forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)); });
      var nx=q.nextElementSibling; if(nx&&nx.hidden&&nx.dataset.qn){ nx.hidden=false; nx.classList.add('rv'); requestAnimationFrame(function(){ nx.classList.add('on'); }); }
      if(ans.t&&ans.w) show(); });
    function show(){ var f=ans.t, why={malina:'Вы любите, когда сладкое немного кислит: малина тает, а потом даёт яркую ягодную ноту.', smorodina:'Глубокий ягодный вкус и сиреневый цвет: смородина для тех, кто ценит оттенки.', klubnika:'Мягкая, бархатная сладость без резких нот: клубника нравится всем.', yabloko:'Тёплый, пряный и домашний: яблоко с корицей — вкус к чаю в холодный вечер.'}[f], gift=ans.w==='gift'||ans.w==='team';
      if(ans.w==='team'){ f='assorti'; why='Для компании лучше всего «Ассорти»: четыре вкуса, каждому найдётся свой.'; }
      var r=$('.res',tp); r.hidden=false; r.innerHTML='<img src="img/'+f+'-1.webp?v=e8fb21ad" alt=""><div style="display:grid;gap:8px"><p class="small">Ваш вкус</p><p class="h3">'+P[f].n+'</p><p class="small">'+why+(gift&&ans.w!=='team'?' В подарок положим открытку с вашими словами.':'')+'</p><div class="buyrow" style="margin-top:4px"><button class="btn buy" type="button" data-add="'+f+'">В корзину</button><a class="link" href="'+f+'.html">Подробнее</a></div></div>'; }
    tp.addEventListener('click',function(e){ var b=e.target.closest('.res [data-add]'); if(b){ setTimeout(function(){ b.textContent='В корзине ✓'; b.classList.add('done'); },10); } }); }

  /* ---------- the route: from Penza to your city, the line draws itself as you scroll ---------- */
  $$('[data-route]').forEach(function(rt){ var path=$('.done',rt), len=path.getTotalLength(), dot=$('.mv',rt), base=$('.path',rt);
    path.style.strokeDasharray=len; path.style.strokeDashoffset=len;
    function lab(){ var e=est(localStorage.getItem('zs-city')||''), now=new Date(), d5=new Date(now); d5.setDate(d5.getDate()+5);
      $('[data-c]',rt).textContent=e.known?e.city:'Ваш город'; $('[data-w]',rt).textContent=e.when.replace('к ',''); $('[data-s]',rt).textContent='до '+d5.getDate()+' '+['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][d5.getMonth()]; }
    lab(); document.addEventListener('zs:city',lab);
    (function loop(){ var r=rt.getBoundingClientRect(), vh=innerHeight, p=Math.max(0,Math.min(1,(vh*.92-r.top)/(vh*.6)));
      path.style.strokeDashoffset=(len*(1-p)).toFixed(1); var pt=base.getPointAtLength(len*p); dot.setAttribute('cx',pt.x.toFixed(1)); dot.setAttribute('cy',pt.y.toFixed(1));
      requestAnimationFrame(loop); })(); });


  /* ---------- the piping thread: one line through the home, drawn by the scroll, a rosette at every section ---------- */
  var hs=$('#hs'), th=$('#thread');
  if(hs&&th){ var base=$('path.base',th), draw=$('path.draw',th), kg=$('.knots',th), L=1, knots=[], NS='http://www.w3.org/2000/svg';
    function lay(){ var r=hs.getBoundingClientRect(), W=r.width, H=hs.scrollHeight, wide=innerWidth>=900, gx=wide?Math.max(30,(W-1240)/2+14):9, sw=wide?16:4;
      th.setAttribute('width',W); th.setAttribute('height',H); th.setAttribute('viewBox','0 0 '+W+' '+H);
      var pts=[[gx,0]]; $$('[data-knot]',hs).forEach(function(el,i){ var b=el.getBoundingClientRect(), y=b.top-r.top+(el.classList.contains('boxscene')||el.id==='dostavka'?40:24); pts.push([gx+(i%2?sw:-sw), y]); });
      var d='M'+pts[0][0]+' '+pts[0][1];
      for(var i=1;i<pts.length;i++){ var a=pts[i-1], b=pts[i], my=(a[1]+b[1])/2; d+=' C'+a[0]+' '+my+' '+b[0]+' '+my+' '+b[0]+' '+b[1]; }
      base.setAttribute('d',d); draw.setAttribute('d',d); L=draw.getTotalLength(); draw.style.strokeDasharray=L; kg.innerHTML=''; knots=[];
      pts.slice(1).forEach(function(q){ var u=document.createElementNS(NS,'use'); u.setAttribute('href','#ros'); u.setAttribute('x',q[0]-13); u.setAttribute('y',q[1]-13); u.setAttribute('width',26); u.setAttribute('height',26); u.setAttribute('class','knot'); u.style.color='#B97C85'; kg.appendChild(u); knots.push({el:u,y:q[1]}); }); }
    lay(); addEventListener('resize',lay); setTimeout(lay,1500); addEventListener('load',lay);
    (function loop(){ var r=hs.getBoundingClientRect(), y=innerHeight*.62-r.top, H=hs.scrollHeight;
      var f=RM?1:Math.max(0,Math.min(1,y/H)); draw.style.strokeDashoffset=(L*(1-f)).toFixed(1);
      knots.forEach(function(k){ k.el.classList.toggle('on', RM||k.y<y); }); requestAnimationFrame(loop); })(); }

  /* ---------- the five notes: tap a note, its flavour steps forward ---------- */
  $$('[data-note]').forEach(function(n){ n.addEventListener('click',function(){ var c=$('.card[data-card="'+n.dataset.note+'"]'); if(!c) return;
    $$('.card.hl').forEach(function(x){ x.classList.remove('hl'); }); c.classList.add('hl'); c.scrollIntoView({behavior:RM?'auto':'smooth',block:'center'}); setTimeout(function(){ c.classList.remove('hl'); },2600); }); });

  /* ---------- the walk from the berry to the box: the scroll moves it sideways ---------- */
  var wk=$('#put'), wt=$('#wtrack'), wp=$('#wprog');
  if(wk&&wt&&!RM){ (function loop(){ var r=wk.getBoundingClientRect(), span=Math.max(1,r.height-innerHeight), p=Math.max(0,Math.min(1,-r.top/span)), max=Math.max(0,wt.scrollWidth-innerWidth+40);
      wt.style.transform='translate3d('+(-p*max).toFixed(1)+'px,0,0)'; wp.style.width=(p*100).toFixed(1)+'%'; requestAnimationFrame(loop); })(); }

  /* ---------- the card writer: your words appear on the card in the box ---------- */
  var wr=$('[data-writer]');
  if(wr){ var ta=$('#wta'), tx=$('#wtext'), nt=$('#wnote'), dflt=tx.textContent, tm;
    if(C.card){ ta.value=C.card; tx.textContent=C.card; }
    /* lay the note on the card in the photograph: a homography from the note's rectangle to the card's four corners */
    var sc=nt.closest('[data-card]');
    if(sc){ var q=sc.dataset.card.split(',').map(function(p){ return p.trim().split(/\s+/).map(Number); });
      var fit=function(){ var W=sc.clientWidth, H=sc.clientHeight, w=nt.offsetWidth, h=nt.offsetHeight; if(!W||!w) return;
        var s=[[0,0],[w,0],[w,h],[0,h]], M=[], i, k, r, c;
        for(i=0;i<4;i++){ var x=s[i][0], y=s[i][1], X=q[i][0]/100*W, Y=q[i][1]/100*H; M.push([x,y,1,0,0,0,-x*X,-y*X,X]); M.push([0,0,0,x,y,1,-x*Y,-y*Y,Y]); }
        for(c=0;c<8;c++){ var pv=c; for(r=c+1;r<8;r++) if(Math.abs(M[r][c])>Math.abs(M[pv][c])) pv=r; var tmp=M[c]; M[c]=M[pv]; M[pv]=tmp;
          for(r=0;r<8;r++) if(r!==c){ var f=M[r][c]/M[c][c]; for(k=c;k<9;k++) M[r][k]-=f*M[c][k]; } }
        var g=M.map(function(row,n){ return row[8]/row[n]; });
        nt.style.transform='matrix3d('+[g[0],g[3],0,g[6], g[1],g[4],0,g[7], 0,0,1,0, g[2],g[5],0,1].join(',')+')'; nt.classList.add('fit'); };
      fit(); addEventListener('resize',fit); if('ResizeObserver' in window) new ResizeObserver(fit).observe(sc); }
    var size=function(){ var n=tx.textContent.length; tx.style.fontSize=(n<=44?31:n<=80?26:n<=120?22:19)+'px'; }; size();
    ta.addEventListener('input',function(){ tx.textContent=ta.value.trim()||dflt; size(); nt.classList.add('lift'); clearTimeout(tm); tm=setTimeout(function(){ nt.classList.remove('lift'); },500); });
    $('#wsave').addEventListener('click',function(){ if(!ta.value.trim()){ ta.focus(); $('#wok').textContent='Напишите пару слов'; return; } C.card=ta.value.trim(); save(); $('#wok').textContent='Открытка будет в заказе ✓'; }); }

  /* ---------- laptop: a box card leans toward the pointer, as if picked up ---------- */
  if(matchMedia('(hover:hover)').matches&&!RM){ $$('.card .ph').forEach(function(ph){
    ph.addEventListener('pointermove',function(e){ var r=ph.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; ph.style.setProperty('--ry',(x*7).toFixed(2)+'deg'); ph.style.setProperty('--rx',(4-y*6).toFixed(2)+'deg'); });
    ph.addEventListener('pointerleave',function(){ ph.style.removeProperty('--ry'); ph.style.removeProperty('--rx'); }); }); }


  ZS.render=render;
  var MON2=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  function dmy(d){ return d.getDate()+' '+MON2[d.getMonth()]; }

  /* ---------- the quartet: tap a voice, it comes into focus and the page takes its colour ---------- */
  var qs=$('.quartet');
  if(qs){ var POS={klubnika:18,yabloko:40,malina:72,smorodina:92}, CX={klubnika:18.9,yabloko:39.6,malina:61.8,smorodina:82.5}, ORD=['klubnika','yabloko','malina','smorodina'], LINES={yabloko:'Тёплый, пряный, домашний: на яблочном пюре с молотой корицей.',klubnika:'Бархатный и по-настоящему ягодный, с мягкой сладостью.',malina:'Тает, а потом приходит яркая ягодная нота, как от малины прямо с куста.',smorodina:'Глубокий ягодный вкус и сиреневый цвет, который дают сами ягоды.'};
    function voice(f,fromScale){ qs.dataset.voice=f; qs.style.setProperty('--qg','var(--g-'+f+')'); qs.style.setProperty('--qd','var(--d-'+f+')');
      if(!fromScale) qs.style.setProperty('--cx',CX[f]); $$('.qt',qs).forEach(function(t){ t.setAttribute('aria-selected',String(t.dataset.f===f)); });
      $('#qname').textContent=P[f].n; $('#qtaste').textContent=P[f].t; $('#qline').textContent=LINES[f]; $('#qlink').href=f+'.html';
      var ad=$('#qadd'); ad.dataset.id=f; $('[data-add]',ad).dataset.add=f; if(!fromScale) $('#qscale').value=POS[f]; render(); }
    $('.qtabs',qs).addEventListener('click',function(e){ var t=e.target.closest('.qt'); if(t) voice(t.dataset.f); });
    /* dragging the taste scale pans along the row; letting go settles on the nearest voice */
    function pan(v){ var i, a, b, c=CX[ORD[0]]; if(v>=POS[ORD[3]]) c=CX[ORD[3]]; else for(i=0;i<3;i++){ a=ORD[i]; b=ORD[i+1]; if(v>=POS[a]&&v<=POS[b]){ c=CX[a]+(CX[b]-CX[a])*(v-POS[a])/(POS[b]-POS[a]); break; } } qs.style.setProperty('--cx',c.toFixed(2)); }
    $('#qscale').addEventListener('input',function(){ var v=+this.value, best='malina', d=999; for(var k in POS){ if(Math.abs(POS[k]-v)<d){ d=Math.abs(POS[k]-v); best=k; } } qs.classList.add('pan'); pan(v); if(best!==qs.dataset.voice) voice(best,true); });
    $('#qscale').addEventListener('change',function(){ qs.classList.remove('pan'); var f=qs.dataset.voice; this.value=POS[f]; qs.style.setProperty('--cx',CX[f]); });
    var qw=$('.qwin',qs);
    if(qw){ var qd=false, qx=0, qc=0, qmoved=false;
      var nearest=function(c){ var best=ORD[0], d=999; ORD.forEach(function(k){ if(Math.abs(CX[k]-c)<d){ d=Math.abs(CX[k]-c); best=k; } }); return best; };
      qw.addEventListener('pointerdown',function(e){ qd=true; qmoved=false; qx=e.clientX; qc=parseFloat(getComputedStyle(qs).getPropertyValue('--cx'))||CX[qs.dataset.voice]; qs.classList.add('pan'); qw.setPointerCapture(e.pointerId); });
      qw.addEventListener('pointermove',function(e){ if(!qd) return; var dx=e.clientX-qx; if(Math.abs(dx)>6) qmoved=true; var row=$('.qrow',qw), c=Math.max(CX[ORD[0]],Math.min(CX[ORD[3]],qc-dx/row.offsetWidth*100)); qs.style.setProperty('--cx',c.toFixed(2)); var f=nearest(c); if(f!==qs.dataset.voice) voice(f,true); });
      var qup=function(){ if(!qd) return; qd=false; qs.classList.remove('pan'); var f=qs.dataset.voice; $('#qscale').value=POS[f]; qs.style.setProperty('--cx',CX[f]); };
      qw.addEventListener('pointerup',qup); qw.addEventListener('pointercancel',qup); }
    voice('malina'); }

  /* ---------- «когда вручить»: the day and the city decide the order-by date; it follows the visitor ---------- */
  function whenGet(){ try{ return JSON.parse(localStorage.getItem('zs-when')||'null'); }catch(e){ return null; } }
  function verdictOf(w){ if(!w||!w.date) return null; var t=new Date(w.date+'T12:00:00'), e=est(w.city||''), now=new Date(), span=Math.ceil((e.b-now)/864e5), by=new Date(t); by.setDate(by.getDate()-span);
    return {t:t,by:by,late:by<new Date(now.toDateString()),e:e}; }
  function whenText(w,v){ var where=v.e.known?' в '+v.e.city:''; return v.late ? 'К '+dmy(v.t)+where+' можем не успеть — выберите дату позже' : 'Подарок к '+dmy(v.t)+where+': закажите до '+dmy(v.by); }
  function annWhen(){ var w=whenGet(), v=verdictOf(w); if(!v){ var e0=est(localStorage.getItem('zs-city')||''); $$('[data-when-line]').forEach(function(el){ el.innerHTML='Доставка '+(e0.known?'в\u00a0'+e0.city:'по\u00a0России')+': от\u00a0'+rub(e0.pvz)+', '+e0.when+' · <a class="link" style="font-size:inherit;font-weight:400" href="index.html#podarok">нужно к\u00a0дате?</a>'; }); return; } $$('.ann').forEach(function(a){ a.innerHTML='<b>'+whenText(w,v)+'</b> · <a href="index.html#podarok">изменить</a>'; });
    $$('[data-when-line]').forEach(function(el){ el.innerHTML=whenText(w,v)+' · пункт выдачи от '+rub(v.e.pvz)+' · <a class="link" style="font-size:inherit;font-weight:400" href="index.html#podarok">изменить</a>'; }); }
  var pl=$('[data-when]');
  if(pl){ var wd=$('#wdate'), wc=$('#wcity'), vr=$('#verdict'), w0=whenGet()||{};
    function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    var today=new Date(); wd.min=iso(today); if(w0.date) wd.value=w0.date; wc.value=w0.city||localStorage.getItem('zs-city')||'';
    function go(){ var w={date:wd.value,city:wc.value.trim()}; if(w.city) try{ localStorage.setItem('zs-city',w.city); }catch(x){}
      var v=verdictOf(w); if(!v){ vr.innerHTML='<span class="small">Выберите день — и мы скажем, до какого числа заказать.</span>'; return; }
      try{ localStorage.setItem('zs-when',JSON.stringify(w)); }catch(x){}
      vr.innerHTML = v.late ? '<b class="no">Можем не успеть</b><span class="small">К '+dmy(v.t)+' посылка'+(v.e.known?' в '+v.e.city:'')+' может не доехать: мы передаём заказ в СДЭК в течение пяти дней. Выберите дату позже.</span>'
        : '<b>Закажите до '+dmy(v.by)+'</b><span class="small">Привезём к '+dmy(v.t)+(v.e.known?' в '+v.e.city:'')+' · пункт выдачи СДЭК от '+rub(v.e.pvz)+', курьер от '+rub(v.e.cur)+'</span>';
      annWhen(); document.dispatchEvent(new CustomEvent('zs:city')); }
    $('#occ').addEventListener('click',function(e){ var b=e.target.closest('[data-occ]'); if(!b) return; $$('#occ .chip').forEach(function(c){ c.setAttribute('aria-pressed',String(c===b)); });
      var y=today.getFullYear(), d; if(b.dataset.occ==='ny') d=new Date(y,11,31); else if(b.dataset.occ==='m8'){ d=new Date(y,2,8); if(d<today) d=new Date(y+1,2,8); } else if(b.dataset.occ==='any'){ d=new Date(today); d.setDate(d.getDate()+14); } else { wd.focus(); if(wd.showPicker) try{ wd.showPicker(); }catch(x){} return; }
      wd.value=iso(d); go(); });
    wd.addEventListener('change',go); wc.addEventListener('input',go); go(); }
  annWhen();

  /* ---------- the encore stack: three boxes from your cart, then «Ассорти» lands on top ---------- */
  function stacks(){ var n=paid(), order=[]; for(var k in C.i) for(var j=0;j<C.i[k];j++) order.push(k); C.m.forEach(function(){ order.push('assorti'); });
    $$('[data-stack]').forEach(function(st){ var sb=$$('.sb',st); for(var i=0;i<3;i++){ sb[i].classList.toggle('f',n>i); if(order[i]) sb[i].src='img/'+order[i]+'-box.webp?v=e8fb21ad'; } sb[3].classList.toggle('f',n>=GIFT_FROM);
      var t=$('[data-mt]',st.parentNode); if(t) t.textContent = n>=GIFT_FROM ? '«Ассорти» уже лежит в вашей корзине' : 'У вас '+n+' из 3'; }); }
  document.addEventListener('zs:cart',stacks);

  /* ---------- unwrap by hand: drag the sleeve (or use the arrow keys) ---------- */
  $$('[data-unwrap]').forEach(function(u){ var uw=$('.take',u), rg=$('input[type=range]',u), closing=u.hasAttribute('data-close'), k=closing?1:0, x0=0, k0=0, down=false, done=false;
    function setK(v){ k=Math.max(0,Math.min(1,v)); uw.style.setProperty('--k',k.toFixed(3)); rg.value=Math.round((closing?1-k:k)*100); rg.style.setProperty('--p',rg.value+'%'); if(closing&&k<.04&&!done){ done=true; document.dispatchEvent(new CustomEvent('zs:closed')); if(navigator.vibrate&&!RM) try{ navigator.vibrate(12); }catch(e){} } }
    setK(k);
    if(!closing&&!RM&&'IntersectionObserver' in window){ var hio=new IntersectionObserver(function(es){ if(!es[0].isIntersecting) return; hio.disconnect();
      setTimeout(function(){ if(u.classList.contains('used')) return; setK(.22); setTimeout(function(){ if(!u.classList.contains('used')) setK(0); },900); },500); },{threshold:.6}); hio.observe(u); }
    var moved=false;
    u.addEventListener('pointerdown',function(e){ if(e.target.closest('.uwbar')) return; down=true; moved=false; x0=e.clientX; k0=k; u.classList.add('used'); u.setPointerCapture(e.pointerId); });
    u.addEventListener('pointermove',function(e){ if(!down) return; if(!moved&&Math.abs(e.clientX-x0)<6) return; if(!moved){ moved=true; u.classList.add('drag'); } setK(k0+(e.clientX-x0)/(uw.offsetWidth*.45)); });
    /* a plain tap opens or closes the box: nobody has to find out that it can be pulled (owner, 19 Nov evening) */
    function up(){ if(!down) return; down=false; u.classList.remove('drag'); if(moved) setK(k>.5?1:0); else setK(k0>.5?0:1); }
    u.addEventListener('pointerup',up); u.addEventListener('pointercancel',up);
    rg.addEventListener('input',function(){ u.classList.add('used','drag'); setK(closing?1-this.value/100:this.value/100); });
    rg.addEventListener('change',function(){ u.classList.remove('drag'); setK(k>.5?1:0); }); });

  /* ---------- catalogue: the inside of each voice, and compare two ---------- */
  $$('.voice .inside').forEach(function(b){ b.addEventListener('click',function(){ var v=b.closest('.voice'), on=!v.classList.contains('inside'); v.classList.toggle('inside',on); b.setAttribute('aria-pressed',String(on)); }); });
  var cb=$('#cmpbar');
  if(cb&&window.CMP){ var sel=[];
    document.addEventListener('change',function(e){ var c=e.target.closest('[data-cmp]'); if(!c) return; var f=c.dataset.cmp;
      if(c.checked){ sel.push(f); if(sel.length>2){ var old=sel.shift(); var oc=$('[data-cmp="'+old+'"]'); if(oc) oc.checked=false; } } else sel=sel.filter(function(x){ return x!==f; });
      cb.hidden=!sel.length; $('#cmpn').textContent = sel.length<2 ? 'Выберите ещё один вкус' : CMP[sel[0]].n+' и '+CMP[sel[1]].n; $('#cmpgo').disabled=sel.length<2; });
    $('#cmpgo').addEventListener('click',function(){ var v=$('#cmpview'); v.hidden=false; v.innerHTML=sel.map(function(f){ var c=CMP[f]; return '<div class="c v-'+f+'"><img src="'+c.img+'" alt="'+c.n+' внутри"><b>'+c.n+'</b><p>'+c.line+'</p><p><b style="font:500 13px/1.3 var(--sans);color:var(--ink)">Состав:</b> '+c.ing+'</p><button class="btn buy" type="button" data-add="'+f+'">В корзину — 750 ₽</button></div>'; }).join(''); v.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'}); }); }

  /* ---------- corporate: slide the number of people ---------- */
  var ppl=$('#ppl');
  if(ppl){ function crowd(){ var n=+ppl.value; $('#pplv').textContent=n; $('#ppls').textContent=rub(n*750)+' без доставки'; var b=$('#pplb'); b.innerHTML=new Array(Math.min(n,200)).fill('<i></i>').join('');
      $('#pplp').textContent = n<=30 ? 'Можно оплатить на сайте: «Ассорти» в подарок к заказу от трёх коробок.' : 'От 30 коробок — по счёту, с менеджером. Скидки для компаний — по договорённости.'; }
    ppl.addEventListener('input',crowd); crowd(); }


  /* ---------- loops: always playing, muted; only on screen; a still for data-saver; a pause mark for everyone ---------- */
  var saver=!!(navigator.connection&&navigator.connection.saveData);
  $$('.loopv').forEach(function(v){ var b=v.parentNode.querySelector('.lpause'), user=false;
    if(saver){ v.removeAttribute('autoplay'); if(b) b.hidden=true; return; }
    v.src=(innerWidth<innerHeight&&v.dataset.t)?v.dataset.t:v.dataset.w; v.muted=true;
    function play(){ var pr=v.play(); if(pr&&pr.catch) pr.catch(function(){}); }
    if('IntersectionObserver' in window) new IntersectionObserver(function(en){ en.forEach(function(x){ if(user) return; if(x.isIntersecting) play(); else v.pause(); }); },{rootMargin:'200px'}).observe(v); else play();
    if(b) b.addEventListener('click',function(){ if(v.paused){ user=false; play(); } else { user=true; v.pause(); } b.setAttribute('aria-pressed',String(user)); b.setAttribute('aria-label',user?'Продолжить':'Пауза'); }); });

  render(); meters(); stacks();
})();
