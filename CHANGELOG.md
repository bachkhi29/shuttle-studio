# 1.6.0 — Giao diện game & sửa tay vợt

- Sửa hệ trục ngang của nhân vật: tay phải/trái đúng theo cơ thể ở cả hai đầu sân; không đảo dữ liệu appearance đã lưu.
- Thêm chi tiết mặt và cổ áo để thấy rõ hướng nhìn của nhân vật.
- Giao diện navy–hồng–mint, tiêu đề in hoa có chọn lọc, thanh phát và timeline cố định.
- Tab CHIẾN THUẬT / NHÂN VẬT: chỉnh ngoại hình ngay khi đang xem một pha.
- Chế độ Tập trung ẩn bảng chỉnh, nút pha trước/tiếp, đếm số pha, tốc độ 0.25× và lặp riêng pha.
- Sửa kết thúc thao tác kéo đồ thị khi pointer bị hủy; cập nhật designer trực tiếp, bỏ MutationObserver dư thừa.
- README, hướng dẫn, lockfile, mẫu báo lỗi và GitHub Actions cho test/build.
- Không đổi schema JSON v2; vẫn hỗ trợ file cũ.

# 1.5.0

- Tay cầm vợt Trái/Phải cho từng người chơi (mục Tùy chỉnh nhân vật): cánh tay và vợt vẽ đúng phía tay thuận, lưu trong appearance.hand.
- Gom toàn bộ điều chỉnh ngoại hình vào một mục “🧰 Tùy chỉnh nhân vật”: tay vợt, kiểu tóc, màu áo/quần/giày/da/tóc; thêm nút “Chép thiết kế này cho đồng đội” ở chế độ đôi.
- Thêm “Đổi đầu sân” trong hộp Dự án: hai đội hoán đổi hai đầu sân (tên, thiết kế và vai người đánh đi theo người), khác với Lật ngang; hoàn tác được như thường.
- Thêm phím ←/→ để chuyển pha trước/sau (bổ sung cho Space phát/dừng, Esc và Ctrl+Z đã có); dòng gợi ý dưới sân đã ghi rõ cả kéo đường vàng và phím tắt.
- Thêm tests/v15.test.cjs.

# 1.4.0

- Kéo trực tiếp đường cầu: nắm đường vàng trên sân 3D hoặc trong biểu đồ mặt cắt mà kéo — lên/xuống đổi độ vồng, kéo ngang đổi vị trí đỉnh; có thêm slider “Vị trí đỉnh cầu” và dấu chấm đỉnh trên biểu đồ. Quỹ đạo dùng bump hai nửa parabol nối tại đỉnh chọn (10–90%); ở 50% trùng khít công thức cũ nên file cũ mở lên không đổi hình. Đỉnh lệch sớm cho đường cầu lài/rơi nhanh (chặt, drives), lệch muộn cho phông treo cao rồi rơi thẳng.
- Thiết kế nhân vật trong màn hình đội hình: đổi màu áo, quần, giày, da, tóc bằng bảng màu có sẵn + ô màu tự chọn, và 4 kiểu tóc (Ngắn, Dựng, Dài, Búi). Tóc vẽ phủ kín đỉnh đầu — hết cảnh đầu hói như trước. Thiết kế lưu trong file dự án (trường appearance, kiểm tra hợp lệ khi mở file).
- Thêm tests/v14.test.cjs cho quỹ đạo lệch đỉnh, appearance và các thao tác kéo.

# 1.3.0

- Nhãn người chơi gọn theo yêu cầu chủ dự án: đã đặt tên thì chỉ hiện tên (trên sân, ô chọn người đánh/người nhận, thẻ pha); để trống tên thì hiện mã A1/B1/A2/B2. Ô nhập tên được phép để trống và hiện mã mờ làm gợi ý.
- Dòng chữ dưới logo đổi thành “MÔ PHỎNG CHIẾN THUẬT CẦU LÔNG” (cả header và màn hình chào).
- Thêm thống kê chiến thuật trong hộp Dự án: tổng số pha, tổng thời gian, số lần cầu chạm sân, đếm theo loại cầu và theo người đánh.
- Thêm nút Lật ngang chiến thuật (trái ↔ phải) trong hộp Dự án — lật vị trí đầu, mọi vị trí cuối pha và điểm cầu; đi qua cơ chế Hoàn tác như thao tác thường.
- Thêm nút Toàn màn hình ở thanh góc nhìn để trình chiếu.
- Thêm tests/v13.test.cjs cho các hành vi trên.

# 1.2.0

- Thêm logo chính thức (biểu tượng rally hồng–mint do chủ dự án chọn): favicon trên tab trình duyệt, logo cạnh tên app ở header, màn hình chào (splash) khi mở app.
- Thêm animation nhẹ: logo header nhấp nhô/nghiêng khi rê chuột, splash phóng vào rồi mờ dần, khung làm việc hiện dần, thẻ pha nhấc lên khi rê chuột, nút Phát phát sáng khi rê chuột. Tôn trọng chế độ giảm chuyển động (prefers-reduced-motion).
- Logo nhúng dạng data URI nên file MO_UNG_DUNG.html vẫn là 1 file offline độc lập; bộ file logo gốc nằm trong thư mục logo/.
- Không thay đổi logic core.js/app.js của 1.1.2.

# 1.1.2

- Sửa hồi quy CSS ở bản 1.1.1: chiều rộng bảng chỉnh bị thay nhầm 296px thành 2104px, ép sân về 0px. Khôi phục đúng 296px.
- Thêm kiểm tra các track của grid qua nhiều kích thước cửa sổ, chỗ cho thanh cuộn và CSS của HTML gộp.
- Giữ chọn pha để dừng/chỉnh và footer đủ chiều cao.

# 1.1.1

- Bấm pha dừng ngay, chọn pha ở chế độ chỉnh. Chỉ bấm Phát mới chạy.
- Nút về đầu dừng tại pha 1.
- Footer lấy chiều cao theo nội dung; dành đủ chỗ cho thẻ và thanh cuộn ngang Windows, tránh cắt tên người chơi.
- 35 tests pass; chưa có browser QA Windows.

# 1.1

- Bỏ các chế độ chuột phải chọn qua lại. Right drag orbit; left drag player; click receiving court target.
- Bố cục cố định khung cửa sổ, timeline luôn hiện, bảng chỉnh gọn, tùy chọn nâng cao thu gọn.
- Chọn thẻ pha tự phát từ mốc đó, bảng chỉnh theo pha đang phát; thao tác chỉnh tự dừng.
- Dữ liệu schema 2: endHeight và breakBefore. Liên tục XYZ giữa hai pha cùng tình huống.
- Tự chọn người nhận gần nhất khi thêm; giữ người đúng nửa sân; nối vị trí người chuẩn bị đánh với target trước đó.
- 13 preset, nhóm thường dùng và biến thể; live slider và đồ thị mặt cắt đường cầu.
- Đường vạch sân sinh đối xứng, không kéo giãn canvas; thêm đường giữa chân lưới và dấu đo hai nửa.
- Đọc file schema1; chuẩn hóa sai nửa sân và liên kết. Bản xuất mới không tương thích ngược app1.0.
- 33 tests; Windows browser QA vẫn chưa thực hiện.
