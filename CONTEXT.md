# CONTEXT — Supplier Web Commitment (Carlsberg VN)

## Bối cảnh chung
- **Sự kiện:** Carlsberg Vietnam Supplier Day — chủ đề *Together Brewing Tomorrow*.
- **Sản phẩm:** một trang web hiệu ứng để khách mời trải nghiệm tại sự kiện.
- **Cách phân phối:** chiếu QR code lên màn hình → khách quét → mở web trên điện thoại → trải nghiệm ngay.
- **Lưu ý quan trọng:** brief gọi là "app" nhưng bản chất là **web**, không phải app cài đặt. Người brief không chuyên công nghệ nên dùng nhầm từ.

## Ràng buộc
- **Thiết bị mục tiêu:** chỉ smartphone (iOS + Android đa dạng) → ưu tiên responsive dọc + hiệu năng animation trên mobile.
- **Không thu thập dữ liệu:** thuần frontend, không backend, không database, không lưu lựa chọn của user.
- **Deploy:** đơn giản, static hosting (Vercel/Netlify/GitHub Pages). Không cần tên miền công ty vì user chỉ vào qua QR.

## Luồng hoạt động chính (CHI TIẾT — quan trọng nhất)

### Khởi đầu
- User quét QR → **vào thẳng màn Recognition Moment**, không có màn intro/welcome.

### Màn 1 — Recognition Moment
- Hiển thị hoa bia + **4 line dòng chảy**, mỗi line gắn 1 keyword:
  - Partnership
  - Innovation Co-Creation
  - Sustainable Growth
  - Value Creation
- 4 line + keyword **xuất hiện dần** (animation vào), không hiện hết cùng lúc.
- User **chạm chọn 1 keyword** trên dòng chảy:
  - **Chỉ chọn được 1** tại một thời điểm.
  - **Cho đổi thoải mái:** chọn A rồi đổi sang B đều được; lựa chọn cuối cùng là cái sẽ được COMMIT.
  - Line/keyword được chọn sáng đậm, các line khác mờ đi.
- Keyword được chọn **phóng to khổng lồ** lên trên hoa bia.
- Nút **COMMIT** ở dưới: mờ/khóa khi chưa chọn → sáng lên sau khi chọn.
- Bấm COMMIT → chuyển sang màn kết.
- **Không rung, không âm thanh.**

### Màn 2 — Together Brewing Tomorrow (màn kết)
- Hiển thị thông điệp "Together Brewing Tomorrow" + keyword đã chọn.
- Có badge "CONFIRMED".

## Ngoài phạm vi web

### Flow Commitment — Scene 1→4
- **KHÔNG phải việc trên web của mình.** Đây là phần **trình chiếu** trên màn hình lớn tại sự kiện.
- Chỉ **xem qua để tham khảo** tông màu / hướng thiết kế cho web. Không code.

## Tech Stack
- **Vanilla HTML/CSS/JS** (không framework — web 1 màn, ít state).
- **Vite** — dev server hot-reload, build static tối ưu.
- **GSAP** — animation dòng chảy + transition mượt.
- **SVG** — hoa bia + 4 line dòng chảy (vector, sắc nét mọi màn hình).

## Trạng thái asset
- `CBVN - App Brief1.pptx` — file brief gốc.
- `TEMP-CARL-B.CO.svg` — asset tạm (logo/hoa bia?).
- **Đang chờ:** file thiết kế giao diện chính thức từ bên design (asset hoa bia thật, màu brand chuẩn, typography, layout).

## Thiết kế thị giác — Hoa bia & Dòng chảy (từ ảnh Flow Commitment scene 1/2/4)

### Hình dạng hoa bia
- Blob hữu cơ nhiều múi lồi lõm không đều (không phải hoa 4 cánh đối xứng hình học).
- Khe lõm sâu ở đỉnh, chia đôi 2 thùy trên — điểm nhận diện chính của shape.
- Bbox tổng thể gần vuông/tròn (~1:1).

### Texture
- Bề mặt có bọt khí lấm tấm (giống bia thật).
- Highlight sáng vùng giữa-trên tạo khối 3D.
- Viền ngoài có glow trắng phát sáng bao quanh, độ dày đều.

### 4 dòng chảy
- Dạng particle/light streak (nhiều sợi mảnh song song, độ dài khác nhau, motion blur) — KHÔNG phải path solid liền nét.
- Tỏa từ 4 góc màn hình, hội tụ vào tâm hoa bia, sáng dần khi gần tâm.
- Mỗi dòng 1 màu riêng, gắn với 1 keyword:
  - Xanh lá (trên-trái)
  - Xanh dương (dưới-trái)
  - Vàng hổ phách (trên-phải)
  - Cam đỏ (dưới-phải)

### Cơ chế động khi chọn/commit (quan trọng)
- Hoa bia được "đổ đầy" như chất lỏng từ dưới lên (vd 79% → 100%).
- Phần chưa đầy: giữ màu dòng chảy loang trên bề mặt.
- Phần đã đầy: chuyển hẳn sang màu vàng bia đục.
- Tương tự cơ chế liquid-fill đã làm ở nút hold-to-confirm trước đây.

### Nền
- Trời xanh gradient + mây mờ, có chiều sâu (KHÔNG phải xanh rêu đậm như slide template).

### Bảng màu tham khảo
| Vai trò | Mã màu |
|---|---|
| Nền trời xanh | `#0040a0` → `#5090f0` (gradient) |
| Dòng xanh lá | tông green tươi |
| Dòng xanh dương | `#0040a0`–`#2050e0` |
| Dòng vàng hổ phách | `#e0a030` |
| Dòng cam đỏ | cam đậm |
| Hoa bia (fill đầy) | vàng bia đục |
| Badge CONFIRMED | nền trắng, ruy băng đỏ `#e01020`, chữ trắng nghiêng |

*(Lưu ý: bảng màu xanh rêu `#10301c` ở CONTEXT bản trước là màu nền slide/template, KHÔNG phải màu nền web thật.)*

- Giữ hoa bia + màu ở dạng **placeholder** cho tới khi có design thật.
- Ưu tiên hoàn thiện **khung + luồng + animation** trước.
- Không tự chốt Scene 1–4 khi chưa có design.
