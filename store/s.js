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
    var a=e.target.closest('[data-add]'); if(a){ add(a.dataset.add,1); pulse(); return; }
    var st=e.target.closest('[data-q]'); if(st){ var id=st.closest('[data-id]').dataset.id, d=+st.dataset.q;
      if(id.indexOf('mix')===0){ if(d<0) C.m.splice(+id.slice(3),1); save(); } else set(id,(C.i[id]||0)+d); return; }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
  function pulse(){ $$('.cnt').forEach(function(x){ x.animate&&!RM&&x.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:420}); }); }

  /* ---------- the cart panel ---------- */
  function line(id,img,name,sub,q,sum){
    return '<div class="line" data-id="'+id+'"><img src="'+img+'" alt=""><div><p class="n">'+name+'</p><p class="s">'+sub+'</p>'+
      (q!=null?'<div class="step" style="margin-top:8px"><button type="button" data-q="-1" aria-label="Меньше">−</button><output>'+q+'</output><button type="button" data-q="1" aria-label="Больше">+</button></div>':'')+
      '</div><div class="p">'+sum+'</div></div>'; }
  function cart(){
    var b=$('#cart .body'), f=$('#cart .foot'); if(!b) return; var n=paid(), h='';
    if(!n){ b.innerHTML='<div class="empty"><img src="img/malina-box.webp" alt=""><p class="h3">В корзине пока пусто</p><p class="small">Девять зефиров в коробке, пять вкусов. Начните с&nbsp;малины: её берут чаще всего.</p><a class="btn" href="katalog.html">Выбрать вкус</a></div>'; f.hidden=true; return; }
    f.hidden=false;
    for(var k in C.i) h+=line(k,'img/'+k+'-box.webp',P[k].n,'9 шт · 360 г',C.i[k],rub(C.i[k]*PRICE));
    C.m.forEach(function(m,i){ h+=line('mix'+i,'img/assorti-box.webp','Своя коробка',mixtext(m),null,rub(OWN)+'<button class="rmv" type="button" data-q="-1">Убрать</button>'); });
    if(n>=GIFT_FROM) h+='<div class="line gift"><img src="img/assorti-box.webp" alt=""><div><p class="n">Ассорти, в&nbsp;подарок</p><p class="s">Положили сами: за&nbsp;три коробки</p></div><div class="p">0&nbsp;₽</div></div>';
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
    function go(){ var e=est(inp.value); if(inp.value.trim()) try{ localStorage.setItem('zs-city',inp.value.trim()); }catch(x){}
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
    function doBuy(){ add(id,q); pulse(); open('cart'); }
    $$('[data-buy]').forEach(function(b){ b.addEventListener('click',doBuy); });
    var stick=$('.stick'); if(stick&&'IntersectionObserver' in window) new IntersectionObserver(function(en){ en.forEach(function(x){ var past=!x.isIntersecting&&x.boundingClientRect.top<0; stick.classList.toggle('on',past); stick.toggleAttribute('inert',!past); }); }).observe(buy); }

  /* ---------- the box band on the home: the sleeve slides by scroll, a flavour fills the nine places ---------- */
  var bx=$('#bx');
  if(bx){ var cv=$('canvas',bx), cx=cv.getContext('2d'), wim={}, sel='malina', from=[], to=[], t0=[], busy=true, shut=0, shutTo=0;
    var MIX=['malina','klubnika','malina','smorodina','malina','yabloko','klubnika','yabloko','smorodina'], RIP=[0,1,2,1,2,3,2,3,4], XS=[0,.326,.652,1], YS=[0,.319,.65,1];
    for(var i=0;i<9;i++){ from[i]=to[i]='malina'; t0[i]=0; }
    FL.forEach(function(f){ var im=new Image(); im.onload=function(){ im._ok=1; busy=true; }; im.src='img/win-'+f+'.webp'; wim[f]=im; });
    function paint(now){ var S=Math.max(1,Math.min(720,Math.round(cv.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2)))); if(cv.width!==S){ cv.width=cv.height=S; }
      var any=false; for(var i=0;i<9;i++){ var c=i%3, r=(i-c)/3, x=XS[c], y=YS[r], w=XS[c+1]-x, h=YS[r+1]-y, a=Math.max(0,Math.min(1,(now-t0[i])/520)), A=wim[from[i]], B=wim[to[i]];
        if(a<1) any=true; a=a*a*(3-2*a);
        if(A&&A._ok&&a<1){ cx.globalAlpha=1; cx.drawImage(A,x*720,y*720,w*720,h*720,x*S,y*S,w*S,h*S); }
        if(B&&B._ok&&a>0){ cx.globalAlpha=a; cx.drawImage(B,x*720,y*720,w*720,h*720,x*S,y*S,w*S,h*S); } }
      cx.globalAlpha=1; busy=any; }
    function pick(f){ sel=f; var now=performance.now(); for(var i=0;i<9;i++){ var g=f==='assorti'?MIX[i]:f; if(g!==to[i]){ from[i]=to[i]; to[i]=g; t0[i]=now+RIP[i]*70; } } busy=true; shutTo=0;
      $$('#bxpick .chip').forEach(function(b){ b.setAttribute('aria-pressed',String(b.dataset.f===f)); });
      $('#bxname').textContent=P[f].n; $('#bxnote').textContent=P[f].t; $('#bxlink').href=f+'.html'; $('#bxadd').dataset.f=f; }
    $('#bxpick').addEventListener('click',function(e){ var b=e.target.closest('.chip'); if(b) pick(b.dataset.f); });
    $('#bxadd').addEventListener('click',function(){ add(sel,1); pulse(); shutTo=1; var t=$('#bxadd'); t.textContent='В корзине ✓'; setTimeout(function(){ t.textContent='В корзину — 750 ₽'; },1600); });
    var wrap=bx.parentNode, lastK=-1;
    (function loop(now){ var r=wrap.getBoundingClientRect(), vh=innerHeight, p=Math.max(0,Math.min(1,(vh-r.top)/(vh*.75)));
      if(p<.3) shutTo=0; shut+=(shutTo-shut)*.12; var k=(RM?1:p*p*(3-2*p))*(1-shut);
      if(Math.abs(k-lastK)>.001){ bx.style.setProperty('--k',k.toFixed(4)); lastK=k; }
      if(busy) paint(now); requestAnimationFrame(loop); })(performance.now()); }

  /* ---------- the film band: plays only when asked ---------- */
  $$('[data-film]').forEach(function(b){ b.addEventListener('click',function(){ var m=document.createElement('div'); m.className='modal'; m.setAttribute('role','dialog'); m.setAttribute('aria-label','Как мы готовим зефир');
    var tall=innerWidth<innerHeight; m.innerHTML='<video controls playsinline autoplay src="../home/v/film-'+(tall?'t':'w')+'.mp4" poster="../home/v/poster-'+(tall?'t':'w')+'.jpg"></video><button class="x" type="button" aria-label="Закрыть">×</button>';
    document.body.appendChild(m); var x=$('.x',m); x.focus(); function cl(){ m.remove(); b.focus(); document.removeEventListener('keydown',k); } function k(e){ if(e.key==='Escape') cl(); }
    x.addEventListener('click',cl); document.addEventListener('keydown',k); }); });

  if(innerWidth>=900) $$('.ft details').forEach(function(d){ d.open=true; });
  render();
})();
