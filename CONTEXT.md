# CONTEXT — Supplier Web Commitment (Carlsberg VN)

## Bối cảnh chung
- **Sự kiện:** Carlsberg Vietnam Supplier Day 2026 — chủ đề *Together Brewing Tomorrow*.
- **Sản phẩm:** một trang web hiệu ứng để khách mời trải nghiệm tại sự kiện.
- **Cách phân phối:** chiếu QR code lên màn hình → khách quét → mở web trên điện thoại → trải nghiệm ngay.
- **Lưu ý quan trọng:** brief gọi là "app" nhưng bản chất là **web**, không phải app cài đặt.

## Ràng buộc
- **Thiết bị mục tiêu:** chỉ smartphone (iOS + Android đa dạng), ưu tiên responsive dọc.
- **Không thu thập dữ liệu:** thuần frontend, không backend, không database.
- **Deploy:** đơn giản, static hosting (Vercel/Netlify/GitHub Pages), không cần tên miền công ty.
- **Web tĩnh:** dùng nguyên ảnh thiết kế làm nền, không tự dựng hoa bia/dòng chảy bằng code.

## Luồng hoạt động chính (BẢN MỚI NHẤT — đã đơn giản hóa, thay thế mọi bản trước)

### View 1 — màn đầu
- User quét QR → vào thẳng View 1, không có màn intro.
- Hiển thị: nền `view1.png` (trời xanh + hoa bia + 4 dòng chảy + keyword đã bake sẵn 
  trong ảnh) + overlay `view1text_icon.png` (title "Carlsberg Vietnam Supplier Day 2026" 
  + hàng 5 logo thương hiệu con + chữ "Brewing Tomorrow") đặt phía trên.
- **KHÔNG có nút COMMIT.**
- **KHÔNG cho chọn keyword riêng lẻ** — keyword trong ảnh chỉ là trang trí tĩnh.
- User **chạm vào giữa màn hình (vùng hoa bia)** → chuyển thẳng sang View 2.

### View 2 — màn kết
- Hiển thị: nền `view2.png` (trời xanh + hoa bia vàng đầy + dòng chảy) + overlay 
  `view2text.png` (chữ "Together Brewing Tomorrow") đặt phía trên.
- Kết thúc trải nghiệm tại đây.

### Đã loại bỏ khỏi flow (so với các bản brief trước)
- ~~Chọn 1/4 keyword~~
- ~~Keyword phóng to khi chọn~~
- ~~Nút COMMIT~~
- ~~Badge CONFIRMED~~
- Không rung, không âm thanh.

## Asset thiết kế chính thức (đã nhận, đủ dùng — KHÔNG cần xin thêm)
Nằm trong thư mục `asset/` của repo:
- `view1.png` — nền full màn View 1 (1080×1920), keyword đã bake sẵn vào ảnh.
- `view1text_icon.png` — overlay trong suốt (810×487): title + 5 logo thương hiệu 
  con (1664, Tuborg, Somersby, Huda, Halida) + chữ "Brewing Tomorrow".
- `view2.png` — nền full màn View 2 (1080×1920), không có chữ bake sẵn.
- `view2text.png` — overlay trong suốt (810×352): chữ "Together Brewing Tomorrow".

Lưu ý: chỉ có 5 logo thương hiệu con, không có logo Carlsberg chính riêng; không có 
file font riêng (chữ đã bake sẵn vào ảnh nên không cần font để hiển thị đúng).

## Ngoài phạm vi web
### Flow Commitment — Scene 1→4 (trình chiếu màn hình lớn tại event)
- KHÔNG phải việc trên web của mình, chỉ tham khảo tông màu/thiết kế trước đây.

## Tech Stack
- Vanilla HTML/CSS/JS + Vite (dev server, build static).
- Không cần GSAP/SVG dựng hoa bia nữa (đã chuyển sang dùng ảnh nền tĩnh).
- Repo: `~/Project/supplier-web-commitment` (đã push GitHub `hungIDhouse/supplier-web-commitment`).

## Ghi chú lịch sử (để tránh nhầm lẫn khi đọc lại)
- Các bản CONTEXT trước có mô tả flow "chọn keyword + phóng to + nút COMMIT" và 
  hướng dựng hoa bia/dòng chảy hoàn toàn bằng code (SVG/GSAP) — **đã bị thay thế** 
  bởi bản đơn giản hóa này sau khi nhận brief mới + asset thiết kế chính thức.
- Prompt riêng cho từng bước chỉnh sửa UI/kỹ thuật gửi trực tiếp cho Claude Code, 
  không cần ghi lại toàn bộ vào file này.