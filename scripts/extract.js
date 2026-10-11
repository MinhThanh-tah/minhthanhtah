/* Công cụ chuyển đổi một lần: tách file nguồn web/index.html (bản một file) thành dự án Node.js:
   data/kb.json, data/phi.json, src/engine.js, public/assets/{css,js,img}, views/index.html.

   LƯU Ý: views/index.html, public/assets/js/app.js và public/assets/css/site.css đã được chỉnh sửa
   sau khi tách (thẻ SEO, liên kết sâu, trang riêng). Khi có văn bản mới, thông thường chỉ cần
   cập nhật dữ liệu:  npm run extract -- --data-only
   Chạy đầy đủ (ghi đè cả giao diện):  npm run extract -- --force */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "web", "index.html");
const out = (p) => path.join(ROOT, p);
const write = (p, s) => { fs.mkdirSync(path.dirname(out(p)), { recursive: true }); fs.writeFileSync(out(p), s); };

let html = fs.readFileSync(SRC, "utf8");

/* 1. Dữ liệu JSON */
function takeJson(id) {
  const open = `<script id="${id}" type="application/json">`;
  const a = html.indexOf(open);
  if (a < 0) throw new Error("Không tìm thấy khối dữ liệu " + id);
  const b = html.indexOf("</script>", a);
  const json = html.slice(a + open.length, b);
  write(`data/${id}.json`, JSON.stringify(JSON.parse(json), null, 1) + "\n");
  html = html.slice(0, a) + open + `{{${id.toUpperCase()}}}` + html.slice(b);
}
takeJson("kb");
takeJson("phi");
if (process.argv.includes("--data-only")) { console.log("Đã cập nhật data/kb.json và data/phi.json"); process.exit(0); }
if (!process.argv.includes("--force") && fs.existsSync(out("views/index.html"))) {
  console.error("Giao diện đã tồn tại. Dùng --data-only để chỉ cập nhật dữ liệu, hoặc --force để ghi đè giao diện.");
  process.exit(1);
}

/* 2. Ảnh nhúng base64 -> file .webp (gộp ảnh trùng) */
const seen = new Map();
html = html.replace(/data:image\/([a-z+]+);base64,([A-Za-z0-9+/=]+)/g, (_, type, b64) => {
  const buf = Buffer.from(b64, "base64");
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 10);
  const ext = type === "svg+xml" ? "svg" : type;
  const name = `/assets/img/${hash}.${ext}`;
  if (!seen.has(hash)) { seen.set(hash, name); write("public" + name, buf); }
  return name;
});

/* 3. CSS */
html = html.replace(/<style>([\s\S]*?)<\/style>/, (_, css) => {
  write("public/assets/css/site.css", css.trim() + "\n");
  return '<link rel="stylesheet" href="/assets/css/site.css?v={{VER}}">';
});

/* 4. Bộ máy hỏi đáp (UMD) và mã trang */
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length !== 2) throw new Error("Cấu trúc script không như dự kiến: " + scripts.length);
const [engine, app] = scripts;
write("src/engine.js", engine[1].trim() + "\n");

let appJs = app[1];
const cfgStart = appJs.indexOf("var CONFIG = {");
const cfgEnd = appJs.indexOf("\n};", cfgStart);
if (cfgStart < 0 || cfgEnd < 0) throw new Error("Không tìm thấy var CONFIG");
appJs = appJs.slice(0, cfgStart) +
  "/* Thông tin đơn vị do máy chủ cung cấp (xem src/config.js) */\nvar CONFIG = JSON.parse(document.getElementById(\"cfg\").textContent);" +
  appJs.slice(cfgEnd + 3);
write("public/assets/js/app.js", appJs.trim() + "\n");

html = html.replace(engine[0], '<script src="/assets/js/engine.js?v={{VER}}"></script>');
html = html.replace(app[0],
  '<script id="cfg" type="application/json">{{CFG}}</script>\n<script src="/assets/js/app.js?v={{VER}}"></script>');

write("views/index.html", html);
console.log(`Đã tách: ${seen.size} ảnh, views/index.html ${(html.length / 1024).toFixed(0)} KB`);
