# PLAN — Supplier Web Commitment

> Nguyên tắc: làm từng bước, báo cáo, dừng chờ xác nhận trước khi qua bước tiếp theo.

## Giai đoạn 0 — Khởi tạo project
- [ ] Khởi tạo Vite (vanilla) trong repo hiện có.
- [ ] Cài GSAP.
- [ ] Cấu trúc thư mục: `src/` (js, css), `public/` (asset), `index.html`.
- [ ] Chạy thử dev server, commit mốc "setup".

## Giai đoạn 1 — Khung + luồng (KHÔNG cần design thật)
- [ ] Dựng layout màn Recognition Moment (header, stage, footer).
- [ ] Vẽ hoa bia placeholder + 4 line dòng chảy (SVG).
- [ ] Gắn 4 keyword lên đúng vị trí 4 line.
- [ ] Logic chạm chọn 1/4 keyword: line sáng đậm, các line khác mờ.
- [ ] Keyword phóng to lên hoa bia khi chọn.
- [ ] Nút COMMIT: disabled → enabled sau khi chọn.
- [ ] Màn kết "Together Brewing Tomorrow" + keyword đã chọn.
- [ ] Chuyển màn Recognition → kết.

## Giai đoạn 2 — Animation (GSAP)
- [ ] Dòng chảy "chảy" liên tục (hạt sáng chạy dọc line).
- [ ] Hiệu ứng keyword phóng to có chiều sâu.
- [ ] Transition Recognition → màn kết mượt.
- [ ] Feedback chạm trên nút + keyword.
- [ ] Tối ưu hiệu năng animation cho mobile.

## Giai đoạn 3 — Ráp design thật (CHỜ FILE DESIGN)
- [ ] Tham khảo tông màu/hướng thiết kế từ phần trình chiếu Scene 1–4.
- [ ] Thay hoa bia placeholder bằng asset thật.
- [ ] Áp màu brand + typography chuẩn.
- [ ] Căn chỉnh vị trí/độ cong 4 line theo design.
- [ ] Rà soát lại toàn bộ màn theo bản thiết kế.

## Giai đoạn 4 — Hoàn thiện & deploy
- [ ] Test đa thiết bị (iOS/Android, nhiều kích thước màn).
- [ ] Tối ưu tốc độ load (quan trọng vì user quét QR).
- [ ] Build production.
- [ ] Deploy static hosting.
- [ ] Tạo QR trỏ về link → bàn giao.

## Trạng thái hiện tại
- Đang ở: **Giai đoạn 0**.
- Có prototype single-file tham khảo (dựng trước đó) — dùng làm gốc logic.
- Đang chờ: file thiết kế giao diện để vào Giai đoạn 3.
