/* Nạp dữ liệu và khởi tạo bộ máy hỏi đáp dùng chung với trình duyệt */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const TTHCEngine = require("./engine");
const { site } = require("./config");

const DATA = path.join(__dirname, "..", "data");
const kbRaw = fs.readFileSync(path.join(DATA, "kb.json"), "utf8");
const phiRaw = fs.readFileSync(path.join(DATA, "phi.json"), "utf8");

/* Bản gọn để nhúng vào trang (giữ nguyên dữ liệu gốc, bỏ khoảng trắng) */
const kbMin = JSON.stringify(JSON.parse(kbRaw));
const phiMin = JSON.stringify(JSON.parse(phiRaw));

/* Bộ máy tự thêm trường phụ (_kw, _t...) vào đối tượng thủ tục nên dùng bản sao riêng */
const engine = TTHCEngine.create(JSON.parse(kbRaw), JSON.parse(phiRaw), site);

/* Mã phiên bản để trình duyệt nạp lại CSS/JS khi dữ liệu hoặc mã thay đổi */
const version = crypto.createHash("sha1").update(kbMin + phiMin).digest("hex").slice(0, 8);

/* Đối tượng thủ tục công khai qua API: bỏ các trường phụ nội bộ */
function publicProc(p, full) {
  const o = { id: p.id, cap: p.cap, stt: p.stt, ma: p.ma, ten: p.ten, tenGon: p.gon, mau: p.mau };
  if (full) o.noiDung = Object.fromEntries(Object.keys(engine.SECNAME).map((k) => [k, { muc: engine.SECNAME[k], doan: p.muc[k] || [] }]));
  return o;
}

function sortedProcs() {
  return engine.PROCS.slice().sort((a, b) => (a.cap === b.cap ? a.stt - b.stt : a.cap === "xa" ? -1 : 1));
}

function formKeys() {
  const key = (n) => { const m = /^(\d+)(.*)$/.exec(n); return [parseInt(m[1], 10), m[2]]; };
  return Object.keys(engine.FORMS).sort((a, b) => {
    const x = key(a), y = key(b);
    return x[0] - y[0] || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0);
  });
}

module.exports = { engine, kbMin, phiMin, version, publicProc, sortedProcs, formKeys };
