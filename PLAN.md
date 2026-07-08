# PLAN — Supplier Web Commitment

> Nguyên tắc: làm từng bước, báo cáo, dừng chờ xác nhận trước khi qua bước tiếp theo.

## Giai đoạn 0 — Khởi tạo project ✅ (đã xong)
- [x] Khởi tạo Vite trong repo.
- [x] Repo push GitHub.

## Giai đoạn 1 — Ráp asset thật ✅ (đã xong)
- [x] Copy 4 file asset vào `public/asset/` (Vite chỉ serve static file từ `public/`).
- [x] View 1: đặt `view1.png` làm nền full màn, `view1text_icon.png` overlay phía trên.
- [x] View 2: đặt `view2.png` làm nền full màn, `view2text.png` overlay phía trên.
- [x] Responsive: test nền + overlay ở phone, tablet, fold, desktop — không méo/lệch.

### Quyết định letterbox (chốt, không cần làm lại)
- Cơ chế: CONTAIN có giới hạn crop an toàn (`computeImageTransform` trong `src/main.js`).
  - Màn **rộng hơn** ảnh gốc (tỉ lệ 0.5625–0.703, vd. điện thoại có thanh trình duyệt)
    → phóng lấp đầy chiều ngang, crop tối đa 20% chiều cao ảnh từ **đáy** (chỉ chạm
    vệt sáng mờ dần ở góc dưới, đã đo pixel xác nhận không chạm chữ/hoa bia) → hết sọc.
  - Màn **quá rộng** (> 0.703: tablet ngang, fold mở, desktop) → fallback CONTAIN,
    letterbox trái/phải (chấp nhận được).
  - Màn **cao/hẹp hơn** ảnh gốc (tỉ lệ < 0.5625, vd. OnePlus 13 412×905, nhiều máy
    Android đời mới) → **luôn còn letterbox trên/dưới**, không crop được. Đã thử crop
    2 bên nhưng đo pixel xác nhận chữ dòng chảy ("PARTNERSHIP" v.v.) chạy gần sát mép
    ngang (0.4%–99.7% chiều rộng) — không có lề an toàn để crop.
  - **Quyết định (chốt):** chấp nhận vẫn còn khoảng dư trên/dưới ở nhóm máy tỉ lệ < 0.5625.
    Ưu tiên tuyệt đối "không bao giờ cắt chữ/logo/hoa bia" cao hơn thẩm mỹ. Không xin lại
    file design để chừa lề. Không cần revisit trừ khi có asset mới.
  - **Lấp khoảng dư (không dùng màu phẳng):** thay vì tô màu trắng, phần dư được lấp bằng
    1 lớp `.view-bg-fill` (trong `index.html` + `src/style.css`): chính ảnh nền đó,
    `background-size: cover` + `filter: blur(48px)` + `transform: scale(1.4)`, đặt phía sau
    ảnh chính (z-index 0). Khoảng dư nhìn thấy trời xanh mờ liền mạch (màn hẹp: dải trên/dưới;
    màn ngang: dải trái/phải mang tông màu dòng chảy). Dùng lại WebP từ cache `<picture>`
    (image-set + fallback JPG) nên không tải thêm byte. `--letterbox-bg` trắng chỉ còn là
    fallback đáy cho trình duyệt quá cũ không hỗ trợ blur/image-set.

## Giai đoạn 2 — Logic chuyển màn (đơn giản hóa) ✅ (đã xong)
- [x] Vào thẳng View 1, không intro.
- [x] Chạm vào giữa màn hình (vùng hoa bia) → chuyển sang View 2. Verify lại riêng
      (tap test) ở phone dọc 390x844, phone dọc 412x905 (OnePlus, có sọc trên/dưới),
      tablet ngang 1024x768 (có sọc trái/phải) — cả 3 chuyển đúng sang View 2.
- [x] KHÔNG có nút COMMIT, KHÔNG có logic chọn keyword.
- [x] Transition chuyển màn mượt (fade/cross-fade, 0.6s).

## Giai đoạn 3 — Hoàn thiện & deploy
- [ ] Test đa thiết bị (iOS/Android, nhiều kích thước màn).
- [ ] Tối ưu tốc độ load ảnh (nén, lazy/preload hợp lý — quan trọng vì quét QR).
- [ ] Build production.
- [ ] Deploy static hosting.
- [ ] Tạo QR trỏ về link → bàn giao.

## Đã loại bỏ khỏi kế hoạch (so với bản trước)
- ~~Dựng hoa bia + dòng chảy bằng SVG/GSAP~~ (giờ dùng ảnh nền tĩnh có sẵn).
- ~~Logic chọn 1/4 keyword, phóng to, nút COMMIT~~ (brief mới đã bỏ).
- ~~Giai đoạn ráp design "sau này"~~ (asset đã có đủ ngay bây giờ).

## Trạng thái hiện tại
- Giai đoạn 1 và Giai đoạn 2 đã xong (xem quyết định letterbox ở trên).
- Tiếp theo: Giai đoạn 3 — test đa thiết bị thật, tối ưu ảnh, build, deploy, QR.
- Asset: đã nhận đủ 4 file, nằm trong `public/asset/` của repo.
- Việc code cụ thể (chia path, animation, fix bug...) làm trực tiếp qua prompt gửi 
  Claude Code, không cần lặp lại chi tiết từng bước vào file này.