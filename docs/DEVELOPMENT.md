# Phát triển và kiểm thử

Ứng dụng dùng HTML, CSS, JavaScript thuần và Canvas 2D với phép chiếu 3D. Không cần server, CDN hoặc thư viện để chạy. Node.js chỉ phục vụ kiểm thử; Python chỉ đóng gói bản HTML độc lập.

## Chạy từ source

Mở `index.html` cùng thư mục với `core.js`, `app.js` và `style.css`.

## Sau khi chỉnh code

Với Node.js 22 và Python 3.12:

```sh
npm ci
python build.py
npm test
```

Trên Windows có thể dùng `npm.cmd` nếu PowerShell chặn `npm.ps1`.

- Chỉnh source, không sửa tay `MO_UNG_DUNG.html`.
- Commit cả `package-lock.json` khi thay dependency.
- Bộ test kiểm tra dữ liệu, liên kết đường cầu, tương tác DOM, hướng tay vợt và kích thước CSS. Test DOM không thay thế thử bằng trình duyệt thật.
- GitHub Actions chạy test rồi kiểm tra bản gộp có trùng source không. Workflow không tự phát hành hay thay đổi cài đặt hosting.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html`, `style.css` | Khung và bố cục giao diện |
| `core.js` | Dữ liệu, sân, quỹ đạo và kiểm tra file nhập |
| `app.js` | Vẽ nhân vật, camera, tương tác và phát lại |
| `build.py` | Gộp source thành một file HTML |
| `tests/` | Các kiểm thử hồi quy |
| `examples/` | Chiến thuật đơn/đôi mẫu |
| `logo/`, `docs/` | Bộ nhận diện và tài liệu |

Định dạng JSON vẫn là `shuttle-tactics`, version 2. Phiên bản ứng dụng 1.6.0 không đổi schema. Tay vợt được lưu là `left`/`right`; bản sửa chỉ thay cách vẽ, không tự đảo dữ liệu người dùng.

## GitHub Pages và bản tải về

Repo hiện có URL: https://bachkhi29.github.io/shuttle-studio/

Sau khi kiểm tra pull request, merge vào `main` theo quy trình của chủ repo. Nếu Pages đang dùng `main` và thư mục gốc, GitHub sẽ cập nhật trang từ source mới. Xem kết quả tại tab Actions.

Khi tạo Release mới, gắn tag cùng phiên bản trong `package.json`, đính kèm `MO_UNG_DUNG.html` và ZIP chứa source; dùng nội dung trong `CHANGELOG.md`. Chỉ quảng bá link Release sau khi file tải đã được đính kèm.
