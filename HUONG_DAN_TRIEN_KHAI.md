# HƯỚNG DẪN TRIỂN KHAI
## Trang hướng dẫn thủ tục hành chính đất đai – Ủy ban nhân dân xã Tân An Hội

Gói gồm 02 phần, dùng chung một bộ dữ liệu và một bộ máy trả lời, bảo đảm nội dung trả lời trên Cổng thông tin điện tử và trên Zalo OA thống nhất:

| Thư mục | Nội dung | Nơi triển khai |
|---|---|---|
| `web/index.html` | Trang web hoàn chỉnh (hỏi đáp, danh mục 46 thủ tục, 34 biểu mẫu, mức thu phí, liên hệ) | Cổng thông tin điện tử của xã |
| `zalo-oa/` | Máy chủ nhận và trả lời tin nhắn tự động trên Zalo OA | Máy chủ có tên miền và HTTPS |

Nguồn dữ liệu: Danh mục ban hành kèm theo Quyết định số 5548/QĐ-UBND ngày 26/8/2026 của Chủ tịch UBND Thành phố; Nghị quyết số 02/2023/NQ-HĐND ngày 18/4/2023 của HĐND Thành phố.

---

## PHẦN 1. ĐƯA TRANG LÊN CỔNG THÔNG TIN ĐIỆN TỬ CỦA XÃ

`web/index.html` là **01 file duy nhất**, chứa sẵn toàn bộ dữ liệu, không cần cơ sở dữ liệu, không cần máy chủ xử lý.

**Cách 1 – Tải lên dưới dạng trang riêng (khuyến nghị)**
1. Gửi file `web/index.html` cho đơn vị quản trị Cổng thông tin điện tử (thường là Trung tâm Chuyển đổi số Thành phố hoặc đơn vị được giao quản trị cổng của xã).
2. Đề nghị đặt tại đường dẫn riêng, ví dụ: `https://<tên-miền-cổng-xã>/tthc-dat-dai/`.
3. Tạo mục "Hướng dẫn thủ tục đất đai" trên menu chính của Cổng, liên kết đến đường dẫn trên.

**Cách 2 – Nhúng vào một bài viết hoặc trang có sẵn của Cổng**
Sau khi file đã được đặt tại đường dẫn ở Cách 1, chèn đoạn mã sau vào nội dung trang (chế độ soạn thảo HTML):
```html
<iframe src="https://<tên-miền-cổng-xã>/tthc-dat-dai/"
        title="Hướng dẫn thủ tục hành chính đất đai"
        style="width:100%;height:85vh;border:0" loading="lazy"></iframe>
```

**Cập nhật thông tin liên hệ:** mở file bằng trình soạn thảo văn bản, tìm `var CONFIG` và sửa các dòng `diaChi`, `dienThoai`, `gioLamViec`, `webUrl`.

**Thêm ảnh thực tế của Trung tâm Phục vụ hành chính công:** tải ảnh lên Cổng thông tin điện tử, sau đó khai báo trong mục `anh` của `var CONFIG`, mỗi ảnh một dòng gồm `src` (đường dẫn ảnh) và `chuThich` (chú thích). Trang tự hiển thị ảnh trình chiếu ở đầu trang và thư viện ảnh tại chuyên mục "Căn cứ và liên hệ". Chỉ sử dụng ảnh do xã chụp, có sự đồng ý của công chức và người dân xuất hiện trong ảnh.

---

## PHẦN 2. KẾT NỐI ZALO OA

### Phương án A – Gắn liên kết vào menu Zalo OA (thực hiện ngay, không cần máy chủ)
1. Đăng nhập trang quản trị Zalo OA (oa.zalo.me) bằng tài khoản quản trị của OA xã.
2. Vào **Quản lý → Menu**, thêm mục "Hướng dẫn thủ tục đất đai", chọn loại **Mở đường dẫn**, nhập địa chỉ trang ở Phần 1.
3. Lưu và kiểm tra trên điện thoại.

### Phương án B – Trả lời tự động ngay trong khung chat Zalo
Người dân nhắn tin cho OA, hệ thống trả lời trực tiếp bằng nội dung trích từ Danh mục. Khi có nhiều thủ tục phù hợp, hệ thống đề nghị trả lời bằng số thứ tự.

**Bước 1. Chuẩn bị máy chủ**
- Máy chủ cài Node.js phiên bản 18 trở lên; có tên miền và chứng chỉ HTTPS (ví dụ `zalo-tthc.<tên-miền-xã>`).
- Đề nghị bố trí trên hạ tầng của Thành phố hoặc đơn vị được giao quản lý hạ tầng công nghệ thông tin, bảo đảm an toàn thông tin theo quy định.

**Bước 2. Tạo ứng dụng trên Zalo for Developers**
1. Truy cập developers.zalo.me, đăng nhập bằng tài khoản quản trị OA, tạo ứng dụng mới.
2. Liên kết ứng dụng với Zalo OA của xã; cấp quyền gửi tin nhắn tư vấn.
3. Ghi lại: **App ID, Secret Key của ứng dụng, OA Secret Key**.
4. Lấy **Access Token** và **Refresh Token** cho OA theo hướng dẫn của Zalo.

**Bước 3. Cài đặt**
```bash
cd zalo-oa
cp .env.example .env      # điền App ID, các khóa, token, WEB_URL
npm test                  # chạy thử: in câu trả lời mẫu ra màn hình
npm start                 # khởi động máy chủ (cổng mặc định 8080)
```
Cấu hình máy chủ web (Nginx hoặc tương đương) chuyển tiếp `https://zalo-tthc.<tên-miền-xã>/webhook` về cổng 8080. Nên chạy bằng PM2 hoặc dịch vụ hệ thống để tự khởi động lại.

**Bước 4. Khai báo Webhook**
1. Trong ứng dụng trên developers.zalo.me: xác thực tên miền (đặt file xác thực do Zalo cấp vào thư mục `zalo-oa/public/`).
2. Mục **Webhook**: nhập `https://zalo-tthc.<tên-miền-xã>/webhook`.
3. Bật các sự kiện: **Người dùng gửi tin nhắn văn bản** (`user_send_text`) và **Người dùng quan tâm OA** (`follow`).
4. Sau khi chạy thử thành công, sửa `VERIFY_SIGNATURE=1` trong `.env` và khởi động lại để bật kiểm tra chữ ký sự kiện.

**Bước 5. Kiểm thử trước khi công bố**
Dùng tài khoản Zalo cá nhân nhắn thử tối thiểu các câu: "hồ sơ tách thửa gồm những gì", "cấp đổi sổ hết bao nhiêu phí", "đính chính sổ" (rồi trả lời "2"), "giá đất bao nhiêu".

> Lưu ý: Thông số kỹ thuật của Zalo (địa chỉ API, cách tính chữ ký, thời hạn token, quy định về tin nhắn tư vấn) có thể được Zalo điều chỉnh. Cán bộ kỹ thuật cần đối chiếu với tài liệu hiện hành tại developers.zalo.me khi cài đặt.

---

## PHẦN 3. CẬP NHẬT KHI CÓ VĂN BẢN MỚI

Khi Thành phố ban hành quyết định công bố thủ tục mới hoặc thay đổi mức thu phí, dữ liệu cần được tách và cập nhật lại vào `web/index.html` và `zalo-oa/data/`. Hai phần phải được cập nhật **cùng lúc** để bảo đảm thống nhất. Cán bộ địa chính có trách nhiệm đối chiếu nội dung trước khi đưa vào vận hành.

## PHẦN 4. BẢO VỆ DỮ LIỆU CÁ NHÂN

- Máy chủ Zalo chỉ lưu tạm phiên trao đổi trong bộ nhớ 30 phút để hiểu câu hỏi tiếp nối; không ghi nội dung tin nhắn vào ổ đĩa.
- Trang web không thu thập thông tin người dùng.
- Không hướng dẫn người dân gửi số định danh cá nhân, số Giấy chứng nhận hay thông tin thửa đất qua kênh hỏi đáp tự động.
