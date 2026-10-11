# tananhoi.vn – Hướng dẫn thủ tục hành chính lĩnh vực đất đai xã Tân An Hội

Website Node.js (Express) hướng dẫn **46 thủ tục** (16 cấp xã, 30 cấp tỉnh), **34 biểu mẫu** và **mức thu phí thẩm định**, có hỏi đáp tự động.

Nguồn dữ liệu: Danh mục kèm theo Quyết định số 5548/QĐ-UBND ngày 26/8/2026 của Chủ tịch UBND Thành phố; Nghị quyết số 02/2023/NQ-HĐND ngày 18/4/2023 của HĐND Thành phố.

## Chức năng

| Địa chỉ | Nội dung |
|---|---|
| `/` | Trang chủ: hỏi đáp, danh mục thủ tục, biểu mẫu, mức thu phí, căn cứ và liên hệ (giao diện và hình ảnh giữ nguyên bản gốc) |
| `/#thu-tuc/xa-12`, `/#mau/21`, `/#phi` | Liên kết thẳng tới một thủ tục, biểu mẫu hoặc chuyên mục (chia sẻ qua Zalo được) |
| `/thu-tuc`, `/thu-tuc/<mã>` | Trang riêng từng thủ tục, dựng sẵn phía máy chủ, để công cụ tìm kiếm lập chỉ mục và in |
| `/bieu-mau`, `/bieu-mau/<số>` | Trang riêng từng biểu mẫu |
| `/sitemap.xml`, `/robots.txt` | Khai báo cho Google |
| `/healthz` | Kiểm tra máy chủ đang chạy |
| `GET /api/thu-tuc[?cap=xa\|tinh]`, `GET /api/thu-tuc/<mã>` | Dữ liệu thủ tục dạng JSON |
| `GET /api/bieu-mau`, `GET /api/bieu-mau/<số>`, `GET /api/phi` | Biểu mẫu, mức thu phí |
| `POST /api/hoi-dap` `{"q":"...","phien":"..."}` | Hỏi đáp dạng văn bản (dùng cho Zalo OA); giữ phiên trong bộ nhớ 30 phút, giới hạn 30 câu/phút/IP |

## Cấu trúc

```
server.js            Máy chủ Express (bảo mật CSP/Helmet, nén gzip, lưu đệm tệp tĩnh)
src/config.js        Thông tin đơn vị (địa chỉ, điện thoại, giờ làm việc...) – ghi đè bằng biến môi trường
src/data.js          Nạp dữ liệu, khởi tạo bộ máy hỏi đáp
src/engine.js        Bộ máy hỏi đáp (dùng chung trình duyệt và máy chủ)
src/pages.js         Trang dựng sẵn: thủ tục, biểu mẫu, sitemap
data/kb.json         46 thủ tục + 34 biểu mẫu
data/phi.json        Mức thu phí theo Nghị quyết 02/2023/NQ-HĐND
views/index.html     Khung trang chủ
public/              CSS, JS giao diện, 17 ảnh .webp, favicon
web/index.html       Bản gốc một file (nguồn để tách dữ liệu)
scripts/extract.js   Công cụ tách dữ liệu từ bản gốc
test/                Kiểm thử tự động
```

## Chạy trên máy

Cần Node.js 20 trở lên.

```bash
npm install
npm start
```

Mở http://localhost:3000. Chạy kiểm thử: `npm test`.

## Sửa thông tin liên hệ

Không cần sửa mã. Khai báo biến môi trường (trên Hostinger: mục **Environment variables**; trên máy: sao chép `.env.example` thành `.env`):

`SITE_URL`, `SITE_DIA_CHI`, `SITE_DIEN_THOAI`, `SITE_GIO_LAM_VIEC`, `SITE_NOI_TIEP_NHAN`, `SITE_DON_VI`, `SITE_PHOTOS` (ảnh thực tế của Trung tâm, xem ví dụ trong `.env.example`).

## Cập nhật khi có văn bản mới

1. Thay `web/index.html` bằng bản mới có dữ liệu đã cập nhật.
2. Chạy `npm run extract -- --data-only` để cập nhật `data/kb.json`, `data/phi.json`.
3. Chạy `npm test`, cán bộ địa chính đối chiếu nội dung, rồi commit và push. Hostinger tự triển khai lại.

Cũng có thể sửa trực tiếp `data/kb.json`, `data/phi.json`.

## Đưa lên GitHub

Tạo repository trống trên github.com (không chọn thêm README), sau đó:

```bash
git remote add origin https://github.com/<tai-khoan>/<ten-repo>.git
git push -u origin main
```

GitHub Actions tự chạy kiểm thử mỗi lần push (`.github/workflows/ci.yml`).

## Triển khai lên Hostinger

### Cách 1 – Gói Business / Cloud (hPanel có mục Node.js) – khuyến nghị

1. hPanel → **Websites** → **Add website** → chọn **Node.js Apps** (hoặc **Websites → Node.js**).
2. Chọn **Import Git Repository**, kết nối tài khoản GitHub và chọn repo trên, nhánh `main`.
3. Thiết lập build:
   - Framework: **Express** (hoặc Other)
   - Node version: **20.x** hoặc **22.x**
   - Root directory: `./`
   - Install/Build command: `npm install`
   - Start command / Entry file: `npm start` / `server.js`
4. Mục **Environment variables**: thêm `NODE_ENV=production` và `SITE_URL=https://<tên-miền>`. Không đặt `PORT`, Hostinger tự cấp.
5. **Deploy**. Sau khi chạy, gắn tên miền và bật SSL trong hPanel.
6. Mỗi lần push lên `main`, Hostinger tự triển khai lại (có thể bấm **Redeploy** thủ công).

> Gói Premium/Single chỉ chạy PHP và trang tĩnh, không chạy được ứng dụng Node.js. Khi đó cần nâng gói hoặc dùng VPS.

### Cách 2 – VPS Hostinger

```bash
# trên VPS (Ubuntu), đã cài Node.js 20+ và Nginx
git clone https://github.com/<tai-khoan>/<ten-repo>.git tananhoi && cd tananhoi
npm ci --omit=dev
cp .env.example .env    # sửa SITE_URL, đặt PORT=3000
npm install -g pm2 && pm2 start server.js --name tananhoi && pm2 save && pm2 startup
```

Cấu hình Nginx chuyển tiếp tên miền về `http://127.0.0.1:3000`, cài SSL bằng `certbot --nginx`. Cập nhật: `git pull && npm ci --omit=dev && pm2 restart tananhoi`.

### Nhúng vào Cổng thông tin điện tử của xã

```html
<iframe src="https://<tên-miền>/" title="Hướng dẫn thủ tục hành chính đất đai"
        style="width:100%;height:85vh;border:0" loading="lazy"></iframe>
```

## Bảo vệ dữ liệu cá nhân

- Trang web không thu thập thông tin người dùng, không dùng cookie.
- API hỏi đáp chỉ giữ phiên trong bộ nhớ 30 phút, không ghi nội dung câu hỏi ra ổ đĩa.
- Không hướng dẫn người dân gửi số định danh cá nhân, số Giấy chứng nhận hay thông tin thửa đất qua kênh hỏi đáp tự động.
