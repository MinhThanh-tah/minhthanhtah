/* Bộ máy hỏi đáp thủ tục hành chính đất đai – UBND xã Tân An Hội
   Dùng chung cho website (trình duyệt) và máy chủ Zalo OA (Node.js).
   Chỉ trích nguyên văn dữ liệu: Danh mục kèm QĐ 5548/QĐ-UBND và Nghị quyết 02/2023/NQ-HĐND. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TTHCEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
"use strict";

var SECNAME = {"1":"Trình tự thực hiện","2":"Cách thức thực hiện","3":"Thành phần, số lượng hồ sơ","4":"Thời hạn giải quyết","5":"Đối tượng thực hiện thủ tục hành chính","6":"Cơ quan thực hiện thủ tục hành chính","7":"Kết quả thực hiện thủ tục hành chính","8":"Lệ phí, phí","9":"Tên mẫu đơn, mẫu tờ khai","10":"Yêu cầu, điều kiện thực hiện thủ tục hành chính","11":"Căn cứ pháp lý của thủ tục hành chính"};
var SECSHORT = {"1":"trình tự thực hiện","2":"cách thức nộp hồ sơ","3":"thành phần hồ sơ","4":"thời hạn giải quyết","5":"đối tượng thực hiện","6":"cơ quan giải quyết","7":"kết quả giải quyết","8":"lệ phí, phí","9":"mẫu đơn, tờ khai","10":"điều kiện thực hiện","11":"căn cứ pháp lý"};
var NGUON = "Danh mục ban hành kèm theo Quyết định số 5548/QĐ-UBND ngày 26/8/2026 của Chủ tịch Ủy ban nhân dân Thành phố Hồ Chí Minh";

function norm(s){
  return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d")
    .replace(/[^a-z0-9]+/g," ").trim();
}
var SYN = [
  [["so do","so hong","bia do","bia hong","so nha dat","giay do","gcn","gcnqsdd","giay chung nhan quyen su dung dat"],"giay chung nhan"],
  [["mat so","mat giay","danh mat so","that lac so"],"bi mat giay chung nhan"],
  [["doi so","doi bia","so cu","so bi rach","so rach"],"cap doi giay chung nhan"],
  [["lam so","ra so","cap so","xin so","lam giay"],"cap giay chung nhan"],
  [["mua ban","sang ten","mua dat","ban dat","mua nha","ban nha","sang nhuong"],"chuyen nhuong"],
  [["cho con","cho tang","tang cho con","cho dat"],"tang cho"],
  [["qua doi","chet","mat di","di chuc","di san","nhan thua ke"],"thua ke"],
  [["tho cu"],"dat o"],
  [["tach so","chia so"],"tach thua"],
  [["gop so","nhap so"],"hop thua"],
  [["thay doi cccd","doi cccd","doi can cuoc","thay doi can cuoc","doi chung minh"],"thay doi thong tin"],
  [["hien dat"],"hien dat mo rong duong"]
];
function prep(q){
  var n=" "+norm(q)+" ";
  SYN.forEach(function(r){ r[0].forEach(function(a){ n=n.split(" "+a+" ").join(" "+r[1]+" "); }); });
  return n.replace(/\s+/g," ");
}
function has(n,arr){ for (var i=0;i<arr.length;i++){ if (n.indexOf(" "+arr[i]+" ")>=0) return true; } return false; }

var INTENT = [
  ["3",["ho so","giay to","can gi","can nhung gi","chuan bi","thanh phan","mang theo","nop nhung gi","gom nhung gi","gom gi","bao nhieu bo","so luong"]],
  ["4",["bao lau","may ngay","thoi gian","thoi han","bao nhieu ngay","khi nao","bao gio","mat bao lau","lau khong","ngay lam viec"]],
  ["8",["le phi","phi","bao nhieu tien","chi phi","ton bao nhieu","het bao nhieu","mat bao nhieu tien","ton tien","muc thu","tien phi"]],
  ["2",["nop o dau","nop dau","cach nop","truc tuyen","online","buu chinh","qua mang","nop truc tiep","nop the nao","nop ho so o","dich vu cong","zalo"]],
  ["6",["co quan nao","ai giai quyet","tham quyen","ai ky","cap nao giai quyet","noi giai quyet","co quan giai quyet","ai cap","cap nao"]],
  ["9",["mau don","to khai","mau so","bieu mau","don gi","mau nao","viet don"]],
  ["10",["dieu kien","yeu cau"]],
  ["11",["can cu","luat nao","van ban nao","quy dinh nao","co so phap ly","nghi dinh nao"]],
  ["5",["doi tuong","ai duoc","nhung ai","ai co the"]],
  ["7",["ket qua","nhan duoc gi","duoc cap gi"]],
  ["1",["trinh tu","cac buoc","quy trinh","lam the nao","lam sao","the nao","nhu the nao","huong dan","thu tuc ra sao"]]
];
function intents(n){
  var out=[];
  INTENT.forEach(function(it){ if (has(n,it[1])) out.push(it[0]); });
  if (out.indexOf("2")>=0 && out.indexOf("3")>=0 && !has(n,["giay to","can gi","can nhung gi","chuan bi","thanh phan","gom nhung gi","gom gi","mang theo"])) out.splice(out.indexOf("3"),1);
  if (out.indexOf("2")>=0 && out.indexOf("6")<0) out.push("6");
  if (out.length>1 && out.indexOf("1")>=0) out.splice(out.indexOf("1"),1);
  return out.slice(0,3);
}
function subject(n){
  if (has(n,["cong ty","doanh nghiep","to chuc","hop tac xa","co quan","chu dau tu","don vi"])) return "tc";
  if (has(n,["ca nhan","ho gia dinh","toi","nha toi","gia dinh toi","cua toi","bo me","vo chong","ong ba","ba con","nguoi dan"])) return "cn";
  return null;
}
var OUT = [
  {k:["gia dat","bang gia dat"],t:"giá đất"},
  {k:["boi thuong","den bu","tai dinh cu"],t:"bồi thường, hỗ trợ, tái định cư"},
  {k:["khieu nai","to cao"],t:"khiếu nại, tố cáo"},
  {k:["xu phat","phat tien","vi pham hanh chinh"],t:"xử phạt vi phạm hành chính"},
  {k:["giay phep xay dung","xin phep xay dung","phep xay"],t:"cấp phép xây dựng"},
  {k:["quy hoach"],t:"thông tin quy hoạch"},
  {k:["dang ky the chap","the chap","xoa the chap"],t:"đăng ký thế chấp",exc:["xu ly tai san the chap","xu ly no the chap"]},
  {k:["ho so cua toi","tinh trang ho so","den dau roi","tra cuu ho so"],t:"tình trạng giải quyết hồ sơ cụ thể"},
  {k:["tien su dung dat","thue thu nhap","le phi truoc ba","tien thue dat"],t:"tiền sử dụng đất, thuế và lệ phí trước bạ"}
];
var STARTERS = [["tinh-19","3","Hồ sơ tách thửa, hợp thửa"],["tinh-20","3","Cấp lại Giấy chứng nhận bị mất"],["tinh-21","3","Chuyển nhượng, thừa kế, tặng cho"],["xa-12","3","Cấp Giấy chứng nhận lần đầu"],["xa-4","3","Chuyển mục đích sử dụng đất"],["tinh-27","3","Cấp đổi Giấy chứng nhận"]];

function create(KB, PHI, CONFIG){
  var PROCS=KB.procs, BYID={};
  PROCS.forEach(function(p){
    BYID[p.id]=p;
    p._kw=p.kw.map(norm);
    p._t=" "+norm(p.ten)+" ";
    var d=norm((p.muc["5"]||[]).join(" "));
    p._cn=/ca nhan|ho gia dinh|cong dong/.test(d);
    p._tc=/to chuc|doanh nghiep|cong ty|chu dau tu|nguoi duoc giao/.test(d);
  });
  function scoreProc(p,n){
    var s=0;
    p._kw.forEach(function(k){ if (k && n.indexOf(" "+k+" ")>=0) s+=10+2*k.split(" ").length; });
    var w=n.trim().split(" ").filter(function(x){return x.length>1;});
    for (var i=0;i<w.length-1;i++){ if (p._t.indexOf(" "+w[i]+" "+w[i+1]+" ")>=0) s+=1.5; }
    if (p.ma && n.indexOf(" "+norm(p.ma).replace(/ /g," ")+" ")>=0) s+=60;
    return s;
  }
  function rank(n,subj){
    var r=PROCS.map(function(p){
      var s=scoreProc(p,n);
      if (subj==="cn" && !p._cn) s*=0.25;
      if (subj==="tc" && !p._tc) s*=0.25;
      return {p:p,s:s};
    }).filter(function(x){return x.s>0;});
    r.sort(function(a,b){return b.s-a.s;});
    return r;
  }
  function newSession(){ return {cur:null, subj:null, pending:null, greeted:false}; }

  function sectionRes(s,p,ks){ s.cur=p.id; s.pending=null; var g=!s.greeted; s.greeted=true; return {t:"answer",id:p.id,ks:ks,greet:g,subj:s.subj}; }
  function overviewRes(s,p){ s.cur=p.id; s.pending=null; var g=!s.greeted; s.greeted=true; return {t:"overview",id:p.id,greet:g}; }
  function pickRes(s,ids,ks,reason){ s.pending={type:"pick",ids:ids,ks:ks}; var g=!s.greeted; s.greeted=true; return {t:"pick",ids:ids,reason:reason,greet:g}; }

  function choose(s,id){ var p=BYID[id]; if(!p) return {t:"unclear",ids:[]}; var ks=(s.pending&&s.pending.ks)||[]; return ks.length?sectionRes(s,p,ks):overviewRes(s,p); }
  function setSubject(s,v){
    s.subj=v; var pend=s.pending||{}; s.pending=null;
    var cs=(pend.ids||[]).map(function(id){return BYID[id];}).filter(function(p){ return v==="cn"?p._cn:p._tc; });
    if (cs.length===1) return (pend.ks&&pend.ks.length)?sectionRes(s,cs[0],pend.ks):overviewRes(s,cs[0]);
    if (cs.length>1) return pickRes(s,cs.map(function(p){return p.id;}),pend.ks||[],"Đối với trường hợp này, Ông/Bà vui lòng chọn thủ tục phù hợp:");
    return {t:"unclear",ids:[]};
  }
  function section(s,id,k){ return sectionRes(s,BYID[id],[k]); }

  function ask(s,q){
    var raw=String(q||"").trim();
    // trả lời bằng số thứ tự khi đang chờ lựa chọn (dùng cho Zalo)
    var num=/^\s*(\d{1,2})\s*$/.exec(raw);
    if (num && s.pending){
      var i=parseInt(num[1],10)-1;
      if (s.pending.type==="subject"){ if(i===0) return setSubject(s,"cn"); if(i===1) return setSubject(s,"tc"); }
      if (s.pending.type==="pick" && s.pending.ids[i]) return choose(s,s.pending.ids[i]);
    }
    var n=prep(raw), ks=intents(n), subj=subject(n);
    if (subj) s.subj=subj;
    if (/^ ?(xin chao|chao|alo|hello|hi|chao ban|chao anh|chao chi)( .{0,12})?$/.test(n)) { s.greeted=true; return {t:"greet"}; }
    if (has(n,["cam on","thank"]) && n.length<40) return {t:"thanks"};
    var r=rank(n,s.subj), top=r.length?r[0].s:0;
    for (var j=0;j<OUT.length;j++){ var o=OUT[j]; if (has(n,o.k) && !(o.exc&&has(n,o.exc)) && top<14){ var g=!s.greeted; s.greeted=true; return {t:"out",topic:o.t,greet:g}; } }
    if (top<10){
      if (s.cur && ks.length) return sectionRes(s,BYID[s.cur],ks);
      var g2=!s.greeted; s.greeted=true;
      return {t:"unclear",ids:r.slice(0,4).map(function(x){return x.p.id;}),greet:g2};
    }
    var cands=r.filter(function(x){return x.s>=top*0.8;});
    if (cands.length>1 && s.cur){
      var c0=cands.filter(function(c){return c.p.id===s.cur;})[0];
      if (c0 && c0.s>=top*0.95) cands=[c0];
    }
    if (cands.length>1){
      var ids=cands.slice(0,6).map(function(c){return c.p.id;});
      var cnOnly=cands.some(function(c){return c.p._cn&&!c.p._tc;}), tcOnly=cands.some(function(c){return c.p._tc&&!c.p._cn;});
      if (!s.subj && cnOnly && tcOnly){ s.pending={type:"subject",ids:ids,ks:ks}; var g3=!s.greeted; s.greeted=true; return {t:"subject",greet:g3}; }
      return pickRes(s,ids,ks,"Nội dung Ông/Bà hỏi liên quan đến nhiều thủ tục. Ông/Bà vui lòng chọn thủ tục phù hợp với trường hợp của mình:");
    }
    var p=cands[0].p;
    return ks.length?sectionRes(s,p,ks):overviewRes(s,p);
  }

  /* ---- Phí thẩm định theo Nghị quyết 02/2023/NQ-HĐND ---- */
  function feeFor(id,subj){
    var m=PHI.map[id]; if(!m) return null;
    var keys=Object.keys(m), use=[];
    if (subj && m[subj]) use=[subj]; else use=keys;
    return use.map(function(k){ return {doiTuong:k, muc:m[k].map(function(x){ return {sec:PHI.sec[x[0]], key:x[0], items:x[1]}; })}; });
  }

  /* ---- Bộ dựng văn bản thuần (Zalo) ---- */
  function lienHe(){
    var a=CONFIG.noiTiepNhan;
    if (CONFIG.diaChi) a+=", địa chỉ: "+CONFIG.diaChi;
    if (CONFIG.dienThoai) a+=", điện thoại: "+CONFIG.dienThoai;
    return a;
  }
  function viTri(p){ return "thủ tục số "+p.stt+", Mục "+(p.cap==="xa"?"B":"A")+" Phần II"+(p.ma?" (mã TTHC "+p.ma+")":""); }
  function capLabel(p){ return p.cap==="xa"?"cấp xã":"cấp tỉnh"; }
  function tenCap(p){ return /\(cấp (xã|tỉnh)\)$/.test(p.ten)?p.ten:p.ten+" ("+capLabel(p)+")"; }
  function feeText(id,subj){
    var f=feeFor(id,subj), C=PHI.chung, out=[];
    if (!f){ out.push("Nghị quyết số 02/2023/NQ-HĐND không quy định loại hình riêng tương ứng với thủ tục này. Mức phí áp dụng do cơ quan tiếp nhận hồ sơ thông báo."); return out.join("\n"); }
    out.push("Mức thu phí thẩm định hồ sơ theo "+C.nguon+":");
    f.forEach(function(g){
      if (f.length>1) out.push("\n* Đối với "+(g.doiTuong==="cn"?"hộ gia đình, cá nhân":"tổ chức")+":");
      g.muc.forEach(function(m){
        var S=m.sec; out.push("- "+S.ten+" ("+S.muc+")");
        if (m.items.length) out.push("  Áp dụng cho loại hình: "+m.items.map(function(i){return "("+i+") "+S.loai[i-1].replace(/[;.]$/,"");}).join("; "));
        if (S.rows) S.rows.forEach(function(r){ out.push("  + "+r[0]+": "+S.cot.slice(1).map(function(c,ci){return c.replace(/ \(.*\)/,"")+" "+r[ci+1]+" đồng";}).join("; ")); });
        if (S.groups) S.groups.forEach(function(gr){ out.push("  "+gr[0]+":"); gr[1].forEach(function(r){ out.push("  + "+r[0]+": "+r[2]+" đồng/"+r[1].toLowerCase()); }); });
      });
    });
    if (f.some(function(g){return g.muc.length>1;})) out.push("\nViệc áp dụng loại hình có cấp mới hoặc không cấp mới giấy chứng nhận do cơ quan giải quyết xác định theo hồ sơ cụ thể.");
    out.push("\nMức thu cho công việc phục vụ thẩm định (mục XIII), chỉnh lý hồ sơ lưu trữ (mục XIV) và ghi chú của Phụ lục được công bố đầy đủ tại trang web của Ủy ban nhân dân xã.");
    out.push("Thời hạn nộp phí: "+C.hannop);
    out.push("Đối tượng miễn thu phí: "+C.mien);
    out.push("Địa bàn xã Tân An Hội thuộc huyện Củ Chi trước đây; mức thu cụ thể đối với hồ sơ của Ông/Bà do cơ quan tiếp nhận thông báo.");
    return out.join("\n");
  }
  function chunk(text,max){
    var parts=[], cur="";
    text.split("\n").forEach(function(line){
      while (line.length>max){ if(cur){parts.push(cur);cur="";} parts.push(line.slice(0,max)); line=line.slice(max); }
      if ((cur+"\n"+line).length>max){ parts.push(cur); cur=line; } else cur=cur?cur+"\n"+line:line;
    });
    if (cur) parts.push(cur);
    return parts;
  }
  function renderText(res,opts){
    opts=opts||{}; var MAX=opts.max||1900, link=CONFIG.webUrl||"", out=[];
    var hello=res.greet?"Kính gửi Ông/Bà,\n":"";
    if (res.t==="greet") return ["Kính chào Ông/Bà. Đây là kênh hướng dẫn thủ tục hành chính lĩnh vực đất đai của "+CONFIG.donVi+". Ông/Bà vui lòng nêu thủ tục và nội dung cần hướng dẫn, ví dụ: \"Hồ sơ tách thửa gồm những gì?\"."];
    if (res.t==="thanks") return ["Cảm ơn Ông/Bà đã liên hệ. Khi cần hướng dẫn thêm, Ông/Bà vui lòng tiếp tục đặt câu hỏi."];
    if (res.t==="out") return [hello+"Nội dung về "+res.topic+" không thuộc phạm vi 46 thủ tục hành chính lĩnh vực đất đai được công bố tại Quyết định số 5548/QĐ-UBND, nên bộ phận hướng dẫn không có căn cứ để trả lời qua kênh này.\nĐề nghị Ông/Bà liên hệ trực tiếp "+lienHe()+(CONFIG.gioLamViec?" ("+CONFIG.gioLamViec+")":"")+" để được hướng dẫn cụ thể."];
    if (res.t==="unclear"){
      var t=hello+"Nội dung Ông/Bà nêu chưa đủ để xác định thủ tục hành chính cụ thể. Ông/Bà vui lòng cho biết rõ hơn việc cần thực hiện, ví dụ: cấp Giấy chứng nhận lần đầu, chuyển nhượng, thừa kế, tặng cho, tách thửa, cấp lại Giấy chứng nhận bị mất, cấp đổi Giấy chứng nhận, chuyển mục đích sử dụng đất.";
      return [t];
    }
    if (res.t==="subject") return [hello+"Nội dung này được quy định thành các thủ tục khác nhau tùy theo người đề nghị. Ông/Bà vui lòng trả lời bằng số:\n1. Cá nhân, hộ gia đình, cộng đồng dân cư\n2. Tổ chức, doanh nghiệp"];
    if (res.t==="pick"){
      var l=[hello+res.reason+" (trả lời bằng số thứ tự)"];
      res.ids.forEach(function(id,i){ var p=BYID[id]; l.push((i+1)+". ["+capLabel(p)+"] "+p.ten); });
      return chunk(l.join("\n"),MAX);
    }
    var p=BYID[res.id];
    if (res.t==="overview"){
      out.push(hello+"Nội dung Ông/Bà nêu thuộc thủ tục "+tenCap(p)+".");
      ["6","4","2"].forEach(function(k){ out.push("\n("+k+") "+SECNAME[k]+":\n"+(p.muc[k]||[]).join("\n")); });
      out.push("\nNguồn: "+viTri(p)+", "+NGUON+".");
      out.push("Ông/Bà cần hướng dẫn thêm nội dung nào (thành phần hồ sơ, trình tự, lệ phí, mẫu đơn...), vui lòng nêu cụ thể.");
    } else {
      out.push(hello+"Về "+res.ks.map(function(k){return SECSHORT[k];}).join(", ")+" của thủ tục "+tenCap(p)+", "+NGUON+" quy định như sau:");
      res.ks.forEach(function(k){
        out.push("\n("+k+") "+SECNAME[k]+":\n"+((p.muc[k]||[]).join("\n")||"Danh mục không quy định nội dung này."));
        if (k==="8") out.push("\n"+feeText(p.id,res.subj));
      });
      out.push("\nNguồn: Mục "+res.ks.map(function(k){return "("+k+")";}).join(", ")+", "+viTri(p)+", "+NGUON+".");
      out.push("Ông/Bà cần hướng dẫn thêm nội dung nào của thủ tục này, vui lòng nêu cụ thể.");
    }
    var parts=chunk(out.join("\n"),MAX);
    if (parts.length>(opts.maxParts||4)){
      parts=parts.slice(0,(opts.maxParts||4)-1);
      parts.push("Nội dung còn dài, Ông/Bà vui lòng xem toàn văn tại trang web hướng dẫn thủ tục của Ủy ban nhân dân xã"+(link?": "+link:"")+".");
    }
    return parts;
  }

  return {tenCap:tenCap, ask:ask, choose:choose, setSubject:setSubject, section:section, newSession:newSession, feeFor:feeFor, renderText:renderText,
          BYID:BYID, PROCS:PROCS, FORMS:KB.forms, PHI:PHI, SECNAME:SECNAME, SECSHORT:SECSHORT, NGUON:NGUON, STARTERS:STARTERS, norm:norm, lienHe:lienHe, viTri:viTri};
}
return {create:create};
});
