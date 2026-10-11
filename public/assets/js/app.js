(function(){
"use strict";
/* ====== THÔNG TIN ĐƠN VỊ ====== */
/* Thông tin đơn vị do máy chủ cung cấp (xem src/config.js) */
var CONFIG = JSON.parse(document.getElementById("cfg").textContent);
var E = TTHCEngine.create(JSON.parse(document.getElementById("kb").textContent), JSON.parse(document.getElementById("phi").textContent), CONFIG);
var BYID=E.BYID, PROCS=E.PROCS, FORMS=E.FORMS, PHI=E.PHI, SECNAME=E.SECNAME, SECSHORT=E.SECSHORT, norm=E.norm;
var S = E.newSession();

function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function cap1(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function capLabel(p){ return p.cap==="xa" ? "Cấp xã" : "Cấp tỉnh"; }
function tag(p){ return '<span class="tag '+p.cap+'">'+capLabel(p)+'</span>'; }

/* ---------- Bảng phí ---------- */
function secTable(S1,items){
  var h='<div class="fee"><h5>'+esc(S1.ten)+' <span style="font-weight:400;color:var(--muted)">('+esc(S1.muc)+')</span></h5>';
  if (S1.loai){
    var list = items && items.length ? items : S1.loai.map(function(_,i){return i+1;});
    h+='<p class="loai">'+(items&&items.length?'Loại hình tương ứng: ':'Các loại hình: ')+list.map(function(i){return "("+i+") "+esc(S1.loai[i-1].replace(/[;.]$/,""));}).join("; ")+'.</p>';
  }
  h+='<div class="tbl"><table>';
  if (S1.rows){
    h+='<tr>'+S1.cot.map(function(c){return '<th>'+esc(c)+'</th>';}).join("")+'</tr>';
    S1.rows.forEach(function(r){ h+='<tr>'+r.map(function(c,i){return '<td'+(i?' class="num"':'')+'>'+esc(c)+'</td>';}).join("")+'</tr>'; });
  } else {
    h+='<tr><th>Nội dung</th><th>Đơn vị tính</th><th>Mức thu (đồng)</th></tr>';
    S1.groups.forEach(function(g){
      h+='<tr class="grp"><td colspan="3">'+esc(g[0])+'</td></tr>';
      g[1].forEach(function(r){ h+='<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td class="num">'+esc(r[2])+'</td></tr>'; });
    });
  }
  return h+'</table></div></div>';
}
function chungHtml(full){
  var C=PHI.chung, h='';
  if (full){
    h+='<h5 style="font-size:14px;margin:12px 0 4px">XIII. Mức thu cho công việc phục vụ thẩm định</h5><div class="tbl"><table><tr><th>Nội dung</th><th>Đơn vị tính</th><th>Mức thu (đồng)</th></tr>'+C.xiii.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td class="num">'+esc(r[2])+'</td></tr>';}).join("")+'</table></div>';
    h+='<h5 style="font-size:14px;margin:12px 0 4px">XIV. Chỉnh lý hồ sơ lưu trữ</h5><div class="tbl"><table><tr><th>Nội dung</th><th>Đơn vị tính</th><th>Mức thu (đồng)</th></tr>'+C.xiv.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td class="num">'+esc(r[2])+'</td></tr>';}).join("")+'</table></div>';
    h+='<p><strong>Ghi chú:</strong></p>'+C.ghichu.map(function(g){return '<p>'+esc(g)+'</p>';}).join("");
  }
  h+='<p><strong>Thời hạn nộp phí:</strong> '+esc(C.hannop)+'</p><p><strong>Đối tượng miễn thu phí:</strong> '+esc(C.mien)+'</p>';
  return h;
}
function feeHtml(p,subj){
  var f=E.feeFor(p.id,subj);
  if (!f) return '<div class="callout">Nghị quyết số 02/2023/NQ-HĐND không quy định loại hình riêng tương ứng với thủ tục này. Mức phí áp dụng do cơ quan tiếp nhận hồ sơ thông báo.</div>';
  var h='<p>Mức thu phí thẩm định hồ sơ theo '+esc(PHI.chung.nguon)+':</p>';
  f.forEach(function(g){
    if (f.length>1) h+='<p style="margin:10px 0 2px"><strong>Đối với '+(g.doiTuong==="cn"?"hộ gia đình, cá nhân":"tổ chức")+'</strong></p>';
    g.muc.forEach(function(m){ h+=secTable(m.sec,m.items); });
  });
  if (f.some(function(g){return g.muc.length>1;})) h+='<div class="callout">Việc áp dụng loại hình có cấp mới hoặc không cấp mới giấy chứng nhận do cơ quan giải quyết xác định theo hồ sơ cụ thể.</div>';
  h+='<div class="callout">Địa bàn xã Tân An Hội thuộc huyện Củ Chi trước đây. Mức thu chưa bao gồm công việc phục vụ thẩm định (mục XIII) và chỉnh lý hồ sơ lưu trữ (mục XIV); mức thu cụ thể đối với hồ sơ của Ông/Bà do cơ quan tiếp nhận thông báo.</div>';
  h+=chungHtml(false);
  h+='<button class="chip" data-act="tab" data-v="phi">Xem toàn bộ biểu mức thu phí</button>';
  return h;
}

/* ---------- Hiển thị câu trả lời ---------- */
var log=document.getElementById("log");
function scrollEnd(){ window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); }
function addUser(t){ var d=document.createElement("div"); d.className="msg-user"; d.textContent=t; log.appendChild(d); }
function addReply(html){
  var d=document.createElement("div"); d.className="reply";
  d.innerHTML='<div class="from"><span class="badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21V10l8-6 8 6v11M9 21v-6h6v6M8 12h.01M16 12h.01"/></svg></span><span>Bộ phận hướng dẫn thủ tục<small>'+esc(CONFIG.donVi)+'</small></span></div>'+html;
  log.appendChild(d); bind(d); scrollEnd();
}
function paras(arr,limit){
  var h="", n=arr.length, show=limit&&n>limit?limit:n;
  for (var i=0;i<n;i++){
    var t=arr[i], li=/^(-|\+|•|[a-zđ]\d?\)|\d+(\.\d+)*\.\s|\(\d+\))/.test(t);
    h+='<p class="'+(li?"li":"")+'"'+(i>=show?' hidden':'')+'>'+esc(t)+'</p>';
  }
  if (show<n) h+='<button class="more" data-more>Xem toàn bộ nội dung ('+n+' đoạn)</button>';
  return h;
}
function excerpt(p,k,limit){
  var arr=p.muc[k]||[];
  return '<div class="excerpt"><h4>('+k+') '+SECNAME[k]+'</h4>'+(arr.length?paras(arr,limit):'<p>Danh mục không quy định nội dung này.</p>')+'</div>';
}
function srcLine(p,ks,fee){
  return '<div class="src">Nguồn: Mục '+ks.map(function(k){return "("+k+")";}).join(", ")+', '+E.viTri(p)+', '+E.NGUON+'.'+(fee?' Mức thu phí: '+esc(PHI.chung.nguon)+'.':'')+'</div>';
}
function chipsFor(p,exclude){
  var h='<div class="chips">';
  ["3","4","1","2","6","8","9","10","11"].forEach(function(k){ if(exclude.indexOf(k)<0) h+='<button class="chip" data-act="sec" data-id="'+p.id+'" data-k="'+k+'">'+cap1(SECSHORT[k])+'</button>'; });
  return h+'</div>';
}
function render(r){
  var g=r.greet?"<p>Kính gửi Ông/Bà,</p>":"";
  if (r.t==="greet") return addReply('<p>Kính chào Ông/Bà. Ông/Bà vui lòng nêu thủ tục hoặc nội dung cần được hướng dẫn.</p>');
  if (r.t==="thanks") return addReply('<p>Cảm ơn Ông/Bà đã liên hệ. Khi cần hướng dẫn thêm, Ông/Bà vui lòng tiếp tục đặt câu hỏi.</p>');
  if (r.t==="out") return addReply(g+'<p>Nội dung về '+esc(r.topic)+' không thuộc phạm vi 46 thủ tục hành chính lĩnh vực đất đai được công bố tại Quyết định số 5548/QĐ-UBND, nên bộ phận hướng dẫn không có căn cứ để trả lời qua kênh này.</p><p>Đề nghị Ông/Bà liên hệ trực tiếp '+esc(E.lienHe())+' ('+esc(CONFIG.gioLamViec)+') để được hướng dẫn cụ thể.</p>');
  if (r.t==="unclear"){
    var h=g+'<p>Nội dung Ông/Bà nêu chưa đủ để xác định thủ tục hành chính cụ thể. Ông/Bà vui lòng cho biết rõ hơn việc cần thực hiện, ví dụ: cấp Giấy chứng nhận lần đầu, chuyển nhượng, thừa kế, tặng cho, tách thửa, cấp lại Giấy chứng nhận bị mất, cấp đổi Giấy chứng nhận, chuyển mục đích sử dụng đất.</p>';
    if (r.ids&&r.ids.length){ h+='<p>Hoặc chọn một trong các thủ tục có nội dung gần với câu hỏi:</p><div class="chips">'; r.ids.forEach(function(id){ h+='<button class="chip" data-act="pick" data-id="'+id+'">'+esc(BYID[id].gon)+'</button>'; }); h+='</div>'; }
    return addReply(h);
  }
  if (r.t==="subject") return addReply(g+'<p>Nội dung này được quy định thành các thủ tục khác nhau tùy theo người đề nghị. Ông/Bà vui lòng cho biết người đề nghị là:</p><div class="chips"><button class="chip" data-act="subj" data-v="cn">Cá nhân, hộ gia đình, cộng đồng dân cư</button><button class="chip" data-act="subj" data-v="tc">Tổ chức, doanh nghiệp</button></div>');
  if (r.t==="pick"){
    var hp=g+'<p>'+esc(r.reason)+'</p><div class="chips">';
    r.ids.forEach(function(id){ var p=BYID[id], dt=(p.muc["5"]||[]).join(" ");
      hp+='<button class="chip pick" data-act="pick" data-id="'+id+'">'+tag(p)+' '+esc(p.ten.length>190?p.ten.slice(0,190)+"…":p.ten)+'<small>Đối tượng: '+esc(dt.length>160?dt.slice(0,160)+"…":dt)+'</small></button>'; });
    return addReply(hp+'</div>');
  }
  var p=BYID[r.id];
  if (r.t==="overview"){
    return addReply(g+'<p>Nội dung Ông/Bà nêu thuộc thủ tục <span class="procname">'+esc(p.ten)+'</span> '+tag(p)+'.</p>'+excerpt(p,"6",6)+excerpt(p,"4",4)+excerpt(p,"2",4)+srcLine(p,["6","4","2"])+'<p style="margin-top:10px">Ông/Bà cần hướng dẫn nội dung nào tiếp theo?</p>'+chipsFor(p,["4","2","6"]));
  }
  var ks=r.ks, ha=g+'<p>Về '+ks.map(function(k){return SECSHORT[k];}).join(", ")+' của thủ tục <span class="procname">'+esc(p.ten)+'</span> '+tag(p)+', Danh mục thủ tục hành chính ban hành kèm theo Quyết định số 5548/QĐ-UBND quy định như sau:</p>';
  ks.forEach(function(k){ ha+=excerpt(p,k,k==="1"||k==="11"?8:14); if(k==="8") ha+=feeHtml(p,r.subj); });
  if (ks.indexOf("9")>=0 && p.mau.length){
    ha+='<p>Ông/Bà có thể xem nội dung biểu mẫu:</p><div class="chips">';
    p.mau.forEach(function(m){ var f=FORMS[m]; ha+='<button class="chip" data-act="form" data-m="'+esc(m)+'">'+(f?esc(f.ten.slice(0,70)):"Mẫu số "+esc(m)+" (không đính kèm trong Danh mục)")+'</button>'; });
    ha+='</div>';
  }
  ha+=srcLine(p,ks,ks.indexOf("8")>=0)+'<p style="margin-top:10px">Ông/Bà cần hướng dẫn thêm nội dung nào của thủ tục này, vui lòng chọn hoặc nêu cụ thể.</p>'+chipsFor(p,ks);
  addReply(ha);
}
function setup(){
  document.getElementById("f-diachi").textContent=CONFIG.diaChi;
  document.getElementById("f-dienthoai").textContent=CONFIG.dienThoai;
  document.getElementById("f-gio").textContent=CONFIG.gioLamViec;
  var A=(CONFIG.anh||[]).filter(function(x){return x&&x.src;});
  if (A.length){
    var fr=document.getElementById("photo-frame"), cap=document.getElementById("photo-cap"), i=0;
    A.forEach(function(a,k){ var im=document.createElement("img"); im.src=a.src; im.alt=a.chuThich||""; if(!k) im.className="on"; fr.appendChild(im); });
    cap.textContent=A[0].chuThich||""; document.getElementById("photo").hidden=false;
    if (A.length>1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      setInterval(function(){ var ims=fr.querySelectorAll("img"); ims[i].className=""; i=(i+1)%ims.length; ims[i].className="on"; cap.textContent=A[i].chuThich||""; },5000);
    }
  }
  document.querySelectorAll("[data-tile]").forEach(function(b){ b.addEventListener("click",function(){
    var p=BYID[b.dataset.tile]; addUser("Hướng dẫn thủ tục: "+p.gon); render(E.section(S,p.id,"3"));
  }); });
  document.querySelectorAll("[data-goto]").forEach(function(b){ b.addEventListener("click",function(){ show(b.dataset.goto); }); });
  document.querySelector("[data-focus]").addEventListener("click",function(){ var q=document.getElementById("q"); q.scrollIntoView({behavior:"smooth",block:"center"}); q.focus({preventScroll:true}); });
  document.querySelectorAll("[data-zoom]").forEach(function(b){ b.addEventListener("click",function(){
    document.body.style.zoom=b.dataset.zoom; setTimeout(fitAgency,0); document.querySelectorAll("[data-zoom]").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});
  }); });
}
/* Căn đều hai dòng tên đơn vị: dòng ngắn được giãn chữ để bằng đúng chiều rộng dòng dài */
function fitAgency(){
  var a=document.querySelector(".agency"); if(!a) return;
  var l=[a.querySelector(".l1"),a.querySelector(".l2")];
  l.forEach(function(x){ x.style.letterSpacing="0px"; x.style.marginRight="0px"; });
  var w=l.map(function(x){ var r=document.createRange(); r.selectNodeContents(x); return r.getBoundingClientRect().width; });
  var i=w[0]<w[1]?0:1, n=l[i].textContent.length-1;
  if (n>0 && Math.abs(w[0]-w[1])>0.5){
    var diff=Math.max(w[0],w[1])-w[i], ls=diff/n;
    l[i].style.letterSpacing=ls+"px";
    var r=document.createRange(); r.selectNodeContents(l[i]);
    var k=(r.getBoundingClientRect().width-w[i])/((n+1)*ls);   /* hệ số khi trang đang phóng to cỡ chữ */
    if (k>0) ls=ls/k;
    l[i].style.letterSpacing=ls+"px"; l[i].style.marginRight=(-ls)+"px";
  }
}
function lightbox(){
  var lb=document.getElementById("lightbox");
  document.querySelectorAll("[data-zoom-img]").forEach(function(el){ el.addEventListener("click",function(){ lb.hidden=false; lb.querySelector("button").focus(); }); });
  lb.addEventListener("click",function(e){ if(e.target===lb||e.target.hasAttribute("data-close")) lb.hidden=true; });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape") lb.hidden=true; });
}
function welcome(){
  var h='<p>Kính chào Ông/Bà.</p><p>Trang này hướng dẫn 46 thủ tục hành chính lĩnh vực đất đai (16 thủ tục cấp xã, 30 thủ tục cấp tỉnh) theo Quyết định số 5548/QĐ-UBND ngày 26/8/2026 của Chủ tịch Ủy ban nhân dân Thành phố. Ông/Bà vui lòng nêu thủ tục và nội dung cần hướng dẫn, ví dụ: “Hồ sơ tách thửa gồm những gì?”, “Cấp đổi Giấy chứng nhận hết bao nhiêu phí?”.</p><div class="chips">';
  E.STARTERS.forEach(function(x){ h+='<button class="chip" data-act="sec" data-id="'+x[0]+'" data-k="'+x[1]+'">'+x[2]+'</button>'; });
  S.greeted=true;
  addReply(h+'</div>');
}
function bind(root){
  root.querySelectorAll("[data-more]").forEach(function(b){ b.addEventListener("click",function(){ b.parentNode.querySelectorAll("p[hidden]").forEach(function(x){x.hidden=false;}); b.remove(); }); });
  root.querySelectorAll("[data-act]").forEach(function(b){
    b.addEventListener("click",function(){
      var a=b.dataset.act;
      if (a==="sec"){ var p=BYID[b.dataset.id]; addUser(cap1(SECSHORT[b.dataset.k])+" – "+p.gon); render(E.section(S,p.id,b.dataset.k)); }
      else if (a==="pick"){ addUser(BYID[b.dataset.id].gon); render(E.choose(S,b.dataset.id)); }
      else if (a==="subj"){ addUser(b.textContent); render(E.setSubject(S,b.dataset.v)); }
      else if (a==="form"){ openForm(b.dataset.m); }
      else if (a==="tab"){ show(b.dataset.v); }
    });
  });
}
document.getElementById("ask").addEventListener("submit",function(e){
  e.preventDefault(); var t=document.getElementById("q"), v=t.value.trim(); if(!v) return;
  addUser(v); t.value=""; t.style.height=""; render(E.ask(S,v));
});
var qa=document.getElementById("q");
qa.addEventListener("keydown",function(e){ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); document.getElementById("ask").requestSubmit(); } });
qa.addEventListener("input",function(){ qa.style.height="auto"; qa.style.height=Math.min(qa.scrollHeight,140)+"px"; });

/* ---------- Chuyên mục ---------- */
function setHash(h){ var n=h?"#"+h:location.pathname+location.search; if(("#"+h)!==location.hash && history.replaceState) history.replaceState(null,"",n); }
/* Mở đúng chuyên mục theo địa chỉ: #danhmuc, #bieumau, #phi, #gioithieu, #thu-tuc/<mã>, #mau/<số> */
function route(){
  var h=decodeURIComponent(location.hash.slice(1)), m;
  if ((m=/^thu-tuc\/(.+)$/.exec(h)) && BYID[m[1]]){ show("danhmuc",h); selId=m[1]; renderList(); renderDetail(BYID[selId]); }
  else if ((m=/^mau\/(.+)$/.exec(h)) && FORMS[m[1]]) openForm(m[1]);
  else if (/^(danhmuc|bieumau|phi|gioithieu)$/.test(h)) show(h);
}
window.addEventListener("hashchange",route);
var tabs=document.querySelectorAll("nav.tabs button");
function show(v,hash){
  setHash(hash||(v==="hoidap"?"":v));
  tabs.forEach(function(t){ t.setAttribute("aria-selected", t.dataset.view===v?"true":"false"); });
  document.querySelectorAll(".view").forEach(function(s){ s.hidden = s.id!=="v-"+v; });
  window.scrollTo(0,0);
}
tabs.forEach(function(t){ t.addEventListener("click",function(){ show(t.dataset.view); }); });

/* ---------- Danh mục ---------- */
var capF="all", selId=null;
function renderList(){
  var qn=norm(document.getElementById("search").value), h="";
  PROCS.filter(function(p){ return (capF==="all"||p.cap===capF) && (!qn || norm(p.ten+" "+p.ma+" "+p.kw.join(" ")).indexOf(qn)>=0); })
   .sort(function(a,b){ return a.cap===b.cap ? a.stt-b.stt : (a.cap==="xa"?-1:1); })
   .forEach(function(p){ h+='<button class="item" data-id="'+p.id+'"'+(p.id===selId?' aria-current="true"':'')+'><div class="meta">'+tag(p)+' Số '+p.stt+(p.ma?' – Mã '+p.ma:'')+'</div><div class="nm">'+esc(p.ten)+'</div></button>'; });
  var L=document.getElementById("list"); L.innerHTML=h||'<div class="empty">Không tìm thấy thủ tục phù hợp.</div>';
  L.querySelectorAll(".item").forEach(function(b){ b.addEventListener("click",function(){ selId=b.dataset.id; setHash("thu-tuc/"+selId); renderList(); renderDetail(BYID[selId]); if (window.innerWidth<860) document.getElementById("detail").scrollIntoView({behavior:"smooth"}); }); });
}
function renderDetail(p){
  var h='<div>'+tag(p)+' <span class="sub">Thủ tục số '+p.stt+(p.ma?' – Mã TTHC '+p.ma:' – Danh mục chưa ghi mã TTHC')+'</span></div><h2>'+esc(p.ten)+'</h2>';
  h+='<div class="actions"><button class="btn" data-ask="1">Hỏi về thủ tục này</button><button class="btn ghost" data-print>In nội dung</button><a class="btn ghost" href="/thu-tuc/'+p.id+'">Trang riêng của thủ tục</a></div>';
  for (var k=1;k<=11;k++){
    var sk=String(k);
    h+='<details class="sec"'+(k===3?' open':'')+'><summary>('+k+') '+SECNAME[sk]+'</summary><div class="body">'+paras(p.muc[sk]||["Danh mục không quy định nội dung này."])+(k===8?'<div style="font-family:var(--sans)">'+feeHtml(p,null)+'</div>':'')+'</div></details>';
  }
  if (p.mau.length){
    h+='<details class="sec"><summary>Biểu mẫu kèm theo ('+p.mau.length+')</summary><div class="body"><div class="chips">';
    p.mau.forEach(function(m){ var f=FORMS[m]; h+='<button class="chip" data-form="'+esc(m)+'">'+(f?esc(f.ten.slice(0,80)):"Mẫu số "+esc(m)+" (không đính kèm trong Danh mục)")+'</button>'; });
    h+='</div></div></details>';
  }
  var d=document.getElementById("detail"); d.innerHTML=h;
  d.querySelector("[data-print]").addEventListener("click",function(){ window.print(); });
  d.querySelector("[data-ask]").addEventListener("click",function(){ show("hoidap"); addUser(p.gon); render(E.choose(S,p.id)); });
  d.querySelectorAll("[data-form]").forEach(function(b){ b.addEventListener("click",function(){ openForm(b.dataset.form); }); });
  bind(d);
}
document.querySelectorAll(".seg button").forEach(function(b){
  b.addEventListener("click",function(){ capF=b.dataset.cap; document.querySelectorAll(".seg button").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");}); renderList(); });
});
document.getElementById("search").addEventListener("input",renderList);

/* ---------- Biểu mẫu ---------- */
function fkey(n){ var m=/^(\d+)(.*)$/.exec(n); return [parseInt(m[1],10),m[2]]; }
var FORMKEYS=Object.keys(FORMS).sort(function(a,b){ var x=fkey(a),y=fkey(b); return x[0]-y[0]||(x[1]<y[1]?-1:x[1]>y[1]?1:0); });
function renderForms(){
  var qn=norm(document.getElementById("fsearch").value), h="";
  FORMKEYS.forEach(function(m){
    var f=FORMS[m]; if (qn && norm(f.ten).indexOf(qn)<0) return;
    var used=PROCS.filter(function(p){return p.mau.indexOf(m)>=0;}).map(function(p){return capLabel(p)+" số "+p.stt;});
    h+='<details class="form-row" id="form-'+esc(m)+'"><summary><strong>'+esc(f.ten)+'</strong><div class="used">Sử dụng tại: '+esc(used.join("; "))+'</div></summary><div class="fbody"><pre>'+esc(f.noidung)+'</pre><button class="btn ghost" data-copy="'+esc(m)+'">Sao chép nội dung mẫu</button></div></details>';
  });
  var F=document.getElementById("flist"); F.innerHTML=h||'<div class="empty">Không tìm thấy biểu mẫu phù hợp.</div>';
  F.querySelectorAll("[data-copy]").forEach(function(b){ b.addEventListener("click",function(){
    var t=FORMS[b.dataset.copy].noidung;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){ b.textContent="Đã sao chép"; },function(){ b.textContent="Không sao chép được, vui lòng bôi đen để sao chép"; });
  }); });
}
function openForm(m){
  show("bieumau","mau/"+m); document.getElementById("fsearch").value=""; renderForms();
  var el=document.getElementById("form-"+m); if (el){ el.open=true; el.scrollIntoView({behavior:"smooth",block:"start"}); }
}
document.getElementById("fsearch").addEventListener("input",renderForms);

/* ---------- Mức thu phí ---------- */
function renderPhi(){
  var h='<h2>Mức thu phí thẩm định hồ sơ cấp giấy chứng nhận quyền sử dụng đất</h2><p>Theo '+esc(PHI.chung.nguon)+'.</p>';
  h+='<h3>I. Trường hợp giao đất, cho thuê đất</h3>'+secTable(PHI.sec["GD-CN"])+secTable(PHI.sec["GD-TC"]);
  h+='<h3>II. Trường hợp đăng ký cấp giấy chứng nhận quyền sử dụng đất và tài sản trên đất</h3>';
  ["III","IV","VII","VIII","IX","X1","X2","X3","XI","XII1","XII2"].forEach(function(k){ h+=secTable(PHI.sec[k]); });
  h+='<div class="callout">Trang này trích các loại hình áp dụng cho hồ sơ đơn lẻ. Các loại hình đăng ký, cấp giấy chứng nhận lần đầu đồng loạt và cấp đổi đồng loạt (mục I, II, V, VI của Phụ lục) áp dụng theo dự án do cơ quan nhà nước tổ chức thực hiện.</div>';
  h+=chungHtml(true);
  document.getElementById("phiview").innerHTML=h;
}

/* ---------- Căn cứ, liên hệ ---------- */
function renderAbout(){
  document.getElementById("about").innerHTML=
   '<div class="callout">tananhoi.vn là trang thông tin hỗ trợ, không phải Cổng thông tin điện tử chính thức của Ủy ban nhân dân xã Tân An Hội.</div><h2>Căn cứ dữ liệu</h2>'+
   '<p>Nội dung hướng dẫn thủ tục được trích từ Danh mục thủ tục hành chính lĩnh vực đất đai thuộc phạm vi chức năng quản lý của Sở Nông nghiệp và Môi trường, ban hành kèm theo Quyết định số 5548/QĐ-UBND ngày 26/8/2026 của Chủ tịch Ủy ban nhân dân Thành phố Hồ Chí Minh, gồm 30 thủ tục thuộc thẩm quyền giải quyết của cấp tỉnh và 16 thủ tục thuộc thẩm quyền giải quyết của cấp xã. Quyết định có hiệu lực thi hành kể từ ngày 01/7/2026 và thay thế Quyết định số 3826/QĐ-UBND ngày 30/6/2026 của Chủ tịch Ủy ban nhân dân Thành phố.</p>'+
   '<p>Mức thu phí thẩm định hồ sơ được trích từ '+esc(PHI.chung.nguon)+'.</p>'+
   '<h3>Phạm vi hướng dẫn</h3><p>Trang chỉ hướng dẫn trình tự, hồ sơ, thời hạn, cơ quan giải quyết, phí, biểu mẫu và căn cứ pháp lý của từng thủ tục. Nội dung hướng dẫn không thay thế văn bản trả lời của cơ quan nhà nước có thẩm quyền; kết quả giải quyết căn cứ vào hồ sơ cụ thể.</p>'+
   '<h3>Nơi tiếp nhận hồ sơ</h3><div class="contact"><div><p><strong>'+esc(CONFIG.noiTiepNhan)+'</strong></p><p>Địa chỉ: '+esc(CONFIG.diaChi)+'</p><p>Điện thoại: '+esc(CONFIG.dienThoai)+'</p><p>Thời gian làm việc: '+esc(CONFIG.gioLamViec)+'</p></div></div>'+((CONFIG.anh||[]).length?'<div class="gallery">'+CONFIG.anh.map(function(a){return '<figure><img src="'+esc(a.src)+'" alt="'+esc(a.chuThich||"")+'"><figcaption>'+esc(a.chuThich||"")+'</figcaption></figure>';}).join("")+'</div>':'')+
   '<p>Nộp hồ sơ trực tuyến: Cổng Dịch vụ công quốc gia (dichvucong.gov.vn).</p>';
  document.getElementById("foot").innerHTML="<strong>tananhoi.vn</strong> – Trang thông tin hỗ trợ hướng dẫn thủ tục hành chính lĩnh vực đất đai xã Tân An Hội<br>Nơi tiếp nhận hồ sơ: "+esc(CONFIG.noiTiepNhan)+", "+esc(CONFIG.diaChi)+" – Điện thoại: "+esc(CONFIG.dienThoai)+"<br><em>Không phải Cổng thông tin điện tử chính thức của Ủy ban nhân dân xã Tân An Hội.</em>";
}

renderList(); renderForms(); renderPhi(); renderAbout(); setup(); lightbox(); fitAgency(); window.addEventListener("resize",fitAgency); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fitAgency); S.greeted=false; route();
})();
