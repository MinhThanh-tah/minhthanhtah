/* Trang dựng sẵn phía máy chủ: trang chủ (ứng dụng hỏi đáp), trang riêng từng thủ tục và biểu mẫu.
   Trang riêng đọc được khi không có JavaScript, chia sẻ được qua Zalo/Facebook và để công cụ tìm kiếm lập chỉ mục. */
"use strict";
const fs = require("fs");
const path = require("path");
const { site } = require("./config");
const { engine, kbMin, phiMin, version, sortedProcs, formKeys } = require("./data");

const { BYID, FORMS, PHI, SECNAME, NGUON } = engine;
const SITE_NAME = "tananhoi.vn – Hướng dẫn thủ tục hành chính lĩnh vực đất đai xã Tân An Hội";
const DESC = "Hướng dẫn thành phần hồ sơ, trình tự, thời hạn giải quyết, mức thu phí và biểu mẫu của 46 thủ tục hành chính lĩnh vực đất đai tại xã Tân An Hội, Thành phố Hồ Chí Minh.";
const OG_IMAGE = "/assets/img/2a3659cb36.webp";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/* JSON nhúng trong <script type="application/json">: chặn chuỗi "</script>" */
const jsonInHtml = (s) => s.replace(/</g, "\\u003c");
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const capLabel = (p) => (p.cap === "xa" ? "Cấp xã" : "Cấp tỉnh");
const tag = (p) => `<span class="tag ${p.cap}">${capLabel(p)}</span>`;

function head({ title, desc, urlPath }) {
  const url = site.webUrl + urlPath;
  return [
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta name="theme-color" content="#B3141B">`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta property="og:site_name" content="tananhoi.vn">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(site.webUrl + OG_IMAGE)}">`,
  ].join("\n");
}

/* ---------- Trang chủ: khung ứng dụng một trang, nhúng sẵn dữ liệu ---------- */
const indexTpl = fs.readFileSync(path.join(__dirname, "..", "views", "index.html"), "utf8");
const indexHtml = indexTpl
  .replace("{{HEAD}}", () => head({ title: SITE_NAME, desc: DESC, urlPath: "/" }))
  .replace("{{KB}}", () => jsonInHtml(kbMin))
  .replace("{{PHI}}", () => jsonInHtml(phiMin))
  .replace("{{CFG}}", () => jsonInHtml(JSON.stringify(site)))
  .replace(/\{\{VER\}\}/g, version);

/* ---------- Khung chung của trang riêng ---------- */
function layout({ title, desc, urlPath, crumbs, body }) {
  const nav = crumbs.map(([href, label]) => (href ? `<a href="${href}">${esc(label)}</a>` : esc(label))).join(" › ");
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
${head({ title, desc, urlPath })}
<link rel="stylesheet" href="/assets/css/site.css?v=${version}">
</head>
<body>
<div class="ssr-top"><div class="wrap"><a href="/">tananhoi.vn – Hướng dẫn thủ tục hành chính đất đai</a></div></div>
<main class="wrap">
<p class="crumbs">${nav}</p>
${body}
</main>
<footer><div class="wrap"><strong>tananhoi.vn</strong> – Trang thông tin hỗ trợ hướng dẫn thủ tục hành chính lĩnh vực đất đai xã Tân An Hội, không phải Cổng thông tin điện tử chính thức của ${esc(site.donVi)}.<br>Nơi tiếp nhận hồ sơ: ${esc(site.noiTiepNhan)}, ${esc(site.diaChi)}. Điện thoại: ${esc(site.dienThoai)}.</div>
<nav class="wrap sitelinks" aria-label="Liên kết trang"><a href="/">Trang chủ</a> · <a href="/thu-tuc">Danh sách 46 thủ tục</a> · <a href="/bieu-mau">Danh sách biểu mẫu</a> · <a href="/#phi">Mức thu phí</a></nav></footer>
</body>
</html>`;
}

/* Đoạn văn: dòng bắt đầu bằng gạch đầu dòng, a), 1. ... được thụt lề như ở trang chủ */
const paras = (arr) => arr.map((t) => `<p${/^(-|\+|•|[a-zđ]\d?\)|\d+(\.\d+)*\.\s|\(\d+\))/.test(t) ? ' class="li"' : ""}>${esc(t)}</p>`).join("\n");

function secTable(S1, items) {
  let h = `<div class="fee"><h5>${esc(S1.ten)} <span style="font-weight:400;color:var(--muted)">(${esc(S1.muc)})</span></h5>`;
  if (S1.loai) {
    const list = items && items.length ? items : S1.loai.map((_, i) => i + 1);
    h += `<p class="loai">${items && items.length ? "Loại hình tương ứng: " : "Các loại hình: "}${list.map((i) => `(${i}) ${esc(S1.loai[i - 1].replace(/[;.]$/, ""))}`).join("; ")}.</p>`;
  }
  h += '<div class="tbl"><table>';
  if (S1.rows) {
    h += `<tr>${S1.cot.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
    S1.rows.forEach((r) => { h += `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ""}>${esc(c)}</td>`).join("")}</tr>`; });
  } else {
    h += "<tr><th>Nội dung</th><th>Đơn vị tính</th><th>Mức thu (đồng)</th></tr>";
    S1.groups.forEach((g) => {
      h += `<tr class="grp"><td colspan="3">${esc(g[0])}</td></tr>`;
      g[1].forEach((r) => { h += `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="num">${esc(r[2])}</td></tr>`; });
    });
  }
  return h + "</table></div></div>";
}

function feeHtml(p) {
  const f = engine.feeFor(p.id, null);
  if (!f) return '<div class="callout">Nghị quyết số 02/2023/NQ-HĐND không quy định loại hình riêng tương ứng với thủ tục này. Mức phí áp dụng do cơ quan tiếp nhận hồ sơ thông báo.</div>';
  let h = `<p>Mức thu phí thẩm định hồ sơ theo ${esc(PHI.chung.nguon)}:</p>`;
  f.forEach((g) => {
    if (f.length > 1) h += `<p><strong>Đối với ${g.doiTuong === "cn" ? "hộ gia đình, cá nhân" : "tổ chức"}</strong></p>`;
    g.muc.forEach((m) => { h += secTable(m.sec, m.items); });
  });
  return h + `<p><strong>Đối tượng miễn thu phí:</strong> ${esc(PHI.chung.mien)}</p><p><a href="/#phi">Xem toàn bộ biểu mức thu phí</a></p>`;
}

/* ---------- Danh sách thủ tục ---------- */
function procList() {
  const group = (cap, label) => {
    const items = sortedProcs().filter((p) => p.cap === cap)
      .map((p) => `<li><a href="/thu-tuc/${p.id}">${esc(p.ten)}<small>${capLabel(p)} – Số ${p.stt}${p.ma ? " – Mã " + esc(p.ma) : ""}</small></a></li>`).join("\n");
    return `<h2>${label}</h2><ul class="linklist">${items}</ul>`;
  };
  return layout({
    title: "Danh sách 46 thủ tục hành chính lĩnh vực đất đai – tananhoi.vn",
    desc: "Danh sách 16 thủ tục cấp xã và 30 thủ tục cấp tỉnh lĩnh vực đất đai theo Quyết định số 5548/QĐ-UBND, áp dụng tại xã Tân An Hội.",
    urlPath: "/thu-tuc",
    crumbs: [["/", "Trang chủ"], [null, "Danh sách thủ tục"]],
    body: `<article class="page"><h1>Danh sách 46 thủ tục hành chính lĩnh vực đất đai</h1><p>Nguồn: ${esc(NGUON)}.</p>${group("xa", "Thủ tục cấp xã (16)")}${group("tinh", "Thủ tục cấp tỉnh (30)")}</article>`,
  });
}

/* ---------- Trang riêng một thủ tục ---------- */
function procPage(id) {
  const p = BYID[id];
  if (!p) return null;
  const first = (p.muc["3"] || p.muc["1"] || []).slice(0, 3).join(" ");
  let body = `<article class="page"><div>${tag(p)} <span class="sub">Thủ tục số ${p.stt}${p.ma ? " – Mã TTHC " + esc(p.ma) : ""}</span></div><h1>${esc(p.ten)}</h1>`;
  body += `<div class="actions"><a class="btn" href="/#thu-tuc/${p.id}">Hỏi đáp về thủ tục này</a></div>`;
  for (let k = 1; k <= 11; k++) {
    const sk = String(k);
    body += `<section><h2>(${k}) ${esc(SECNAME[sk])}</h2>${paras(p.muc[sk] || ["Danh mục không quy định nội dung này."])}${k === 8 ? feeHtml(p) : ""}</section>`;
  }
  if (p.mau.length) {
    body += `<section><h2>Biểu mẫu kèm theo (${p.mau.length})</h2><ul class="linklist">${p.mau.map((m) => FORMS[m]
      ? `<li><a href="/bieu-mau/${encodeURIComponent(m)}">${esc(FORMS[m].ten)}</a></li>`
      : `<li><span style="display:block;padding:12px 4px">Mẫu số ${esc(m)} (không đính kèm trong Danh mục)</span></li>`).join("")}</ul></section>`;
  }
  body += `<p class="src">Nguồn: ${esc(engine.viTri(p))}, ${esc(NGUON)}.</p></article>`;
  return layout({
    title: `${clip(p.gon || p.ten, 80)} – Hướng dẫn thủ tục đất đai`,
    desc: clip(`${p.ten}. ${first}`, 160),
    urlPath: `/thu-tuc/${p.id}`,
    crumbs: [["/", "Trang chủ"], ["/thu-tuc", "Danh sách thủ tục"], [null, p.gon || clip(p.ten, 60)]],
    body,
  });
}

/* ---------- Biểu mẫu ---------- */
const usedBy = (m) => sortedProcs().filter((p) => p.mau.indexOf(m) >= 0);

function formList() {
  const items = formKeys().map((m) => `<li><a href="/bieu-mau/${encodeURIComponent(m)}">${esc(FORMS[m].ten)}</a></li>`).join("\n");
  return layout({
    title: "Danh sách biểu mẫu thủ tục đất đai – tananhoi.vn",
    desc: "Toàn văn các biểu mẫu đơn, tờ khai dùng trong thủ tục hành chính lĩnh vực đất đai tại xã Tân An Hội.",
    urlPath: "/bieu-mau",
    crumbs: [["/", "Trang chủ"], [null, "Biểu mẫu"]],
    body: `<article class="page"><h1>Danh sách biểu mẫu</h1><ul class="linklist">${items}</ul></article>`,
  });
}

function formPage(m) {
  const f = FORMS[m];
  if (!f) return null;
  const used = usedBy(m).map((p) => `<li><a href="/thu-tuc/${p.id}">${esc(p.ten)}<small>${capLabel(p)} – Số ${p.stt}</small></a></li>`).join("");
  return layout({
    title: `${clip(f.ten, 90)} – tananhoi.vn`,
    desc: clip(`${f.ten}. Toàn văn biểu mẫu dùng trong thủ tục hành chính lĩnh vực đất đai.`, 160),
    urlPath: `/bieu-mau/${encodeURIComponent(m)}`,
    crumbs: [["/", "Trang chủ"], ["/bieu-mau", "Biểu mẫu"], [null, `Mẫu số ${m}`]],
    body: `<article class="page"><h1>${esc(f.ten)}</h1><div class="actions"><a class="btn ghost" href="/#mau/${encodeURIComponent(m)}">Mở tại trang chủ để sao chép</a></div><pre>${esc(f.noidung.trim())}</pre>${used ? `<h2>Sử dụng tại thủ tục</h2><ul class="linklist">${used}</ul>` : ""}</article>`,
  });
}

function notFound() {
  return layout({
    title: "Không tìm thấy trang – tananhoi.vn",
    desc: DESC,
    urlPath: "/",
    crumbs: [["/", "Trang chủ"], [null, "Không tìm thấy"]],
    body: '<article class="page"><h1>Không tìm thấy trang</h1><p>Đường dẫn không tồn tại hoặc đã thay đổi.</p><p><a class="btn" href="/">Về trang chủ</a> <a class="btn ghost" href="/thu-tuc">Xem danh sách thủ tục</a></p></article>',
  });
}

function sitemap() {
  const u = (p) => `<url><loc>${esc(site.webUrl + p)}</loc></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    "/", "/thu-tuc", "/bieu-mau",
    ...sortedProcs().map((p) => `/thu-tuc/${p.id}`),
    ...formKeys().map((m) => `/bieu-mau/${encodeURIComponent(m)}`),
  ].map(u).join("\n")}\n</urlset>\n`;
}

module.exports = { indexHtml, procList, procPage, formList, formPage, notFound, sitemap };
