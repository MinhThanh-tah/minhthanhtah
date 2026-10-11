/* Máy chủ web tananhoi.vn – Hướng dẫn thủ tục hành chính lĩnh vực đất đai xã Tân An Hội
   Khởi động: npm start  (cổng lấy từ biến PORT, mặc định 3000) */
"use strict";
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const { port, isProd } = require("./src/config");
const { engine, version, publicProc, sortedProcs, formKeys } = require("./src/data");
const pages = require("./src/pages");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // Hostinger chạy ứng dụng sau proxy

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // trang dùng thuộc tính style nội dòng
      imgSrc: ["'self'", "data:", "https:"],   // ảnh thực tế có thể đặt trên máy chủ khác (SITE_PHOTOS)
      connectSrc: ["'self'"],
      frameAncestors: ["'self'", "https:"],    // cho phép nhúng iframe vào Cổng thông tin điện tử của xã
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  frameguard: false, // dùng frame-ancestors ở trên thay cho X-Frame-Options
}));
app.use(compression());

const html = (res, body, status = 200) => res.status(status).type("html").set("Cache-Control", "public, max-age=300").send(body);

/* ---------- Tệp tĩnh: CSS, JS, ảnh ---------- */
app.get("/assets/js/engine.js", (req, res) => {
  res.set("Cache-Control", req.query.v ? "public, max-age=31536000, immutable" : "public, max-age=3600");
  res.sendFile(path.join(__dirname, "src", "engine.js"));
});
app.use(express.static(path.join(__dirname, "public"), {
  index: false,
  setHeaders(res, file) {
    // Ảnh đặt tên theo mã băm nội dung nên lưu đệm lâu dài; CSS/JS có ?v= theo phiên bản
    res.set("Cache-Control", /\.(webp|png|jpe?g|svg|ico)$/.test(file) ? "public, max-age=31536000, immutable" : "public, max-age=3600");
  },
}));

/* ---------- Trang ---------- */
app.get("/", (req, res) => html(res, pages.indexHtml));
app.get("/thu-tuc", (req, res) => html(res, pages.procList()));
app.get("/thu-tuc/:id", (req, res) => {
  const h = pages.procPage(req.params.id);
  h ? html(res, h) : html(res, pages.notFound(), 404);
});
app.get("/bieu-mau", (req, res) => html(res, pages.formList()));
app.get("/bieu-mau/:so", (req, res) => {
  const h = pages.formPage(req.params.so);
  h ? html(res, h) : html(res, pages.notFound(), 404);
});
app.get("/sitemap.xml", (req, res) => res.type("application/xml").send(pages.sitemap()));
app.get("/robots.txt", (req, res) => res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${require("./src/config").site.webUrl}/sitemap.xml\n`));
app.get("/healthz", (req, res) => res.json({ ok: true, version }));

/* ---------- API tra cứu (dùng cho Zalo OA hoặc ứng dụng khác) ---------- */
const api = express.Router();
api.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

api.get("/thu-tuc", (req, res) => {
  const cap = req.query.cap;
  res.json(sortedProcs().filter((p) => !cap || p.cap === cap).map((p) => publicProc(p, false)));
});
api.get("/thu-tuc/:id", (req, res) => {
  const p = engine.BYID[req.params.id];
  if (!p) return res.status(404).json({ loi: "Không tìm thấy thủ tục" });
  res.json({ ...publicProc(p, true), phi: engine.feeFor(p.id, null), nguon: engine.viTri(p) + ", " + engine.NGUON });
});
api.get("/bieu-mau", (req, res) => res.json(formKeys().map((m) => ({ so: m, ten: engine.FORMS[m].ten }))));
api.get("/bieu-mau/:so", (req, res) => {
  const f = engine.FORMS[req.params.so];
  f ? res.json(f) : res.status(404).json({ loi: "Không tìm thấy biểu mẫu" });
});
api.get("/phi", (req, res) => res.json(engine.PHI));

/* Hỏi đáp: giữ phiên trong bộ nhớ 30 phút để hiểu câu hỏi tiếp nối; không ghi nội dung ra ổ đĩa */
const SESSION_TTL = 30 * 60 * 1000;
const MAX_SESSIONS = 5000;
const sessions = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.at > SESSION_TTL) sessions.delete(k);
}, 60 * 1000).unref();

/* Giới hạn số lần hỏi theo địa chỉ IP: 30 câu/phút */
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now(), key = req.ip;
  const h = hits.get(key);
  if (!h || now - h.start > 60000) hits.set(key, { start: now, n: 1 });
  else if (++h.n > 30) return res.status(429).json({ loi: "Ông/Bà gửi quá nhiều câu hỏi, vui lòng thử lại sau ít phút." });
  if (hits.size > 10000) hits.clear();
  next();
}

api.post("/hoi-dap", rateLimit, express.json({ limit: "4kb" }), (req, res) => {
  const body = req.body || {};
  const q = typeof body.q === "string" ? body.q.trim().slice(0, 500) : "";
  if (!q) return res.status(400).json({ loi: "Vui lòng nhập câu hỏi (trường q)." });
  let id = typeof body.phien === "string" && sessions.has(body.phien) ? body.phien : null;
  if (!id) {
    if (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
    id = crypto.randomUUID();
    sessions.set(id, { s: engine.newSession(), at: 0 });
  }
  const entry = sessions.get(id);
  entry.at = Date.now();
  const ketQua = engine.ask(entry.s, q);
  res.json({ phien: id, ketQua, traLoi: engine.renderText(ketQua, {}) });
});

api.use((req, res) => res.status(404).json({ loi: "Không có API này" }));
app.use("/api", api);

/* ---------- Lỗi ---------- */
app.use((req, res) => html(res, pages.notFound(), 404));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") return res.status(400).json({ loi: "Dữ liệu gửi lên không hợp lệ." });
  console.error(err);
  res.status(500).type("text").send("Lỗi máy chủ");
});

if (require.main === module) {
  app.listen(port, () => console.log(`tananhoi.vn đang chạy tại http://localhost:${port} (phiên bản dữ liệu ${version})`));
}
module.exports = app;
