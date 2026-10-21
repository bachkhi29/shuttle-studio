# Shuttle Studio 1.7.0 — bàn giao

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

Đọc docs/DEVELOPMENT.md. npm ci, python build.py, npm test. Có 76 test ở thời điểm bàn giao. Không sửa tay bản gộp. Giữ package-lock.json, không commit node_modules, dist QA hoặc trạng thái preview.

## Còn mở

Quỹ đạo minh họa, che khuất xấp xỉ; chưa có game physics, rig/GLB, xuất video hay AI. Cần thử Windows/điện thoại thật thêm. Pull request và kết quả Actions là nơi xem trạng thái GitHub, không suy ra đã merge/deploy chỉ vì đã tạo PR.

## Kiến trúc 1.7

Core: flightDirection/shuttleFrame xác định hướng cầu từ đạo hàm quỹ đạo; chuyển hướng sau cú đánh trong 0.08 giây, xác định theo thời gian. playerMotion tạo tư thế local (+X phải cơ thể, +Z phía trước), jointIK giải khớp hai đoạn với chiều dài cố định. shotTechnique suy từ phía cầu tương đối tay thuận; người dùng có thể chọn thủ công. shotFamily gom các loại đường cầu vào nhóm động tác, không phải 13 clip độc lập.

Renderer: personMesh dùng tư thế động khi preview và animatePlayers bật, idlePersonMesh dùng khi chỉnh. Vợt theo tay thuận cả khi backhand. Đầu vợt trùng điểm xuất phát cho 13 preset mặc định đã kiểm tra bằng geometry thực của renderer. Cấu hình thủ công ngoài tầm với bị giới hạn và cảnh báo.

Schema v2: step.zones (tối đa 6 hình chữ nhật target/space), step.comparison (snapshot đường A: type,height,peak,duration,endHeight,landing,target), step.technique (auto/forehand/backhand), step.jump (boolean). So sánh chỉ đường bay dùng cùng origin, không sao chép đội hình. Phải giữ validate, mirror, swapEnds và undo khi mở rộng.

App: displayFrame dùng contactFrame để giữ t=1 của pha cũ ở điểm nhận; selectForEdit xóa override và dừng. Trình bày khóa chỉnh canvas/undo nhưng cho chọn pha và quay sân. Các lớp minh họa có checkbox riêng; ghi chú dùng textContent. Zone drag chỉ commit một undo khi thả.

Giới hạn animation: không mocap/Blender/GLB, không bám chân vật lý. Cú đầu bắt đầu ở tiếp xúc nên có thể thấy nhân vật đang trên không khi chọn cú đập; chuẩn bị/nhảy lên thấy ở pha trước liên kết. Chưa có lăn ngã, đổi chân tiếp đất chuyên nghiệp hay mô phỏng sinh cơ học. Không tuyên bố kỹ thuật chuẩn huấn luyện.
