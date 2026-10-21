# Kiểm tra 1.7.0

## Đã thực hiện

- 76/76 kiểm thử Node + jsdom đạt trên source 1.7.0.
- Kiểm tra chính hình học được personMesh truyền cho bộ vẽ: vợt đúng trái/phải cho 4 slot, trước và sau đổi đầu sân.
- Kiểm tra giữ pha khi đổi ngoại hình, undo, chế độ tập trung, lặp pha, chuyển pha dừng đúng mốc và hủy kéo đồ thị.
- 58 bài kiểm thử cũ vẫn đạt: dữ liệu, liên kết đường cầu, nửa sân, kéo điểm cầu/người, undo, nhập file và CSS.
- Đã kiểm tra trực tiếp bằng Chromium: chọn pha, tab nhân vật, chọn tay trái, lặp pha, chọn pha khác để dừng.
- Kiểm tra bố cục trong viewport 1366 × 768 và 390 × 844 bằng iframe trình duyệt; bản 390 px không tràn ngang, thanh phát kết thúc đúng đáy viewport. Đây không phải kiểm thử trên điện thoại thật.
- Bản HTML độc lập được tạo lại bằng build.py từ source cùng phiên bản.

## Kiểm tra mới 1.7

- Đạo hàm quỹ đạo và hệ trục cầu cho toàn bộ preset; chuyển hướng liên tục, tua xác định.
- Vùng sân, so sánh A/B, dữ liệu không hợp lệ, đổi đầu sân/lật ngang, ghi chú an toàn, undo và trình bày.
- Khớp tay/chân giữ chiều dài ở hai tay thuận, ba chế độ kỹ thuật và nhiều mốc thời gian.
- Tâm mặt vợt do renderer vẽ khớp origin ở 13 preset mặc định; tư thế cuối pha trước nối đầu pha sau.
- Bật nhảy đập, hạ trọng tâm phòng thủ, động tác phông/bỏ nhỏ khác nhau; điều khiển animation lưu và undo.
- Kiểm tra Chromium thực tế: điểm đánh pha đập, chọn cú đập đầu chuỗi, bật nhảy và tư thế phòng thủ, quay/thu phóng sân. Ảnh docs/screenshot-v170.jpg lấy từ bản chạy thật.

## Phạm vi chưa xác minh

- Chưa thử trực tiếp trên máy Windows của chủ dự án, Safari iPhone hoặc mọi mức zoom hệ điều hành.
- Chưa đo FPS trên mọi thiết bị; dữ liệu kiểm thử không phải chứng nhận không còn lỗi.
- Ảnh README chụp từ ứng dụng thật; không dùng ảnh AI thay cho UI.

## Thử nhanh khi nhận bản

Mở MO_UNG_DUNG.html → Nhân vật → chọn Trái/Phải → đổi đầu sân trong Menu. Chọn một pha → bật Lặp pha → Phát → chọn pha khác và xác nhận dừng. Lưu JSON rồi mở lại để kiểm tra dữ liệu chiến thuật của bạn.
