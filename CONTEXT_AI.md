# Shuttle Studio 1.6.0 — bàn giao

Ứng dụng sa bàn cầu lông trên trình duyệt, không phải game thi đấu và không phân tích video tự động. Bản này dựa trên ZIP 1.5.0 do người dùng gửi; các source runtime đã đối chiếu với repo bachkhi29/shuttle-studio.

## Ràng buộc trải nghiệm

- Chuột phải xoay; chuột trái kéo người hoặc đặt cầu. Chọn thẻ pha phải dừng để chỉnh.
- Sân đúng tỉ lệ, người không vượt nửa sân, điểm cuối pha trước nối pha sau.
- Header và thanh phát cố định; bảng chỉnh cuộn cục bộ; ưu tiên giao diện game thể thao gọn, navy–hồng–mint.
- Không tuyên bố không lỗi; chạy kiểm thử và kiểm tra UI trước khi bàn giao.

## Sửa quan trọng

personMesh: local +X là bên phải cơ thể, local +Z là hướng nhìn. Với side = C.side(i), at(x,y,z) = (p.x + x*side, y, p.z - z*side). Tay phải hs=+1, trái hs=-1. Camera không quyết định tay vợt. Không tự đảo appearance.hand khi mở dữ liệu cũ.

Tab nhân vật tách khỏi đội hình ban đầu. repeatPhase giữ chỉ số pha khi phát lặp; selectForEdit luôn xóa chỉ số chạy và dừng playback. Focus mode chỉ đổi bố cục, không đổi project.

## Phát triển

Đọc docs/DEVELOPMENT.md. npm ci, python build.py, npm test. Có 63 test ở thời điểm bàn giao. Không sửa tay bản gộp. Giữ package-lock.json, không commit node_modules, dist QA hoặc trạng thái preview.

## Còn mở

Quỹ đạo minh họa, che khuất xấp xỉ; chưa có game physics, rig/GLB, xuất video hay AI. Cần thử Windows/điện thoại thật thêm. Pull request và kết quả Actions là nơi xem trạng thái GitHub, không suy ra đã merge/deploy chỉ vì đã tạo PR.
