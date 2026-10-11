/* Thông tin đơn vị và cấu hình máy chủ.
   Có thể ghi đè bằng biến môi trường (file .env hoặc mục Environment variables trên Hostinger). */
"use strict";
const fs = require("fs");
const path = require("path");

/* Nạp file .env đơn giản (không cần thư viện ngoài) */
const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const env = process.env;

/* Ảnh thực tế của Trung tâm Phục vụ hành chính công: SITE_PHOTOS là JSON
   dạng [{"src":"/assets/img/anh.webp","chuThich":"..."}]. Để trống thì không hiển thị khung ảnh. */
function photos() {
  if (!env.SITE_PHOTOS) return [];
  try { return JSON.parse(env.SITE_PHOTOS).filter((x) => x && x.src); }
  catch { console.warn("SITE_PHOTOS không đúng định dạng JSON, bỏ qua."); return []; }
}

const site = {
  donVi: env.SITE_DON_VI || "Ủy ban nhân dân xã Tân An Hội",
  noiTiepNhan: env.SITE_NOI_TIEP_NHAN || "Trung tâm Phục vụ hành chính công xã Tân An Hội",
  diaChi: env.SITE_DIA_CHI || "Số 77 đường Tỉnh lộ 8, ấp 9, xã Tân An Hội, Thành phố Hồ Chí Minh",
  dienThoai: env.SITE_DIEN_THOAI || "028.38920318; đường dây nóng: 0901.404.999, 0932.686.666",
  gioLamViec: env.SITE_GIO_LAM_VIEC ||
    "Thứ Hai đến Thứ Sáu: sáng từ 07 giờ 30 đến 11 giờ 30, chiều từ 13 giờ 00 đến 17 giờ 00; nghỉ Thứ Bảy, Chủ nhật",
  webUrl: (env.SITE_URL || "https://tananhoi.vn").replace(/\/+$/, ""),
  anh: photos(),
};

module.exports = {
  site,
  port: Number(env.PORT) || 3000,
  isProd: env.NODE_ENV === "production",
};
