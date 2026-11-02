# Herboto

Ứng dụng gồm trợ lý AI hỏi đáp theo mô hình RAG tại `/` và thư viện cộng đồng tại `/thuvien`. Trợ lý truy xuất ghi chép thuốc nam từ PocketBase trước khi gửi ngữ cảnh phù hợp đến OpenRouter.

## Chạy ứng dụng

1. Khởi tạo database và schema: `./init-pocketbase.sh`. Lệnh áp dụng các migration trong `pb_migrations/` và an toàn để chạy lại.
2. Khởi động PocketBase từ thư mục gốc: `./pocketbase serve --http=0.0.0.0:8090`.
3. Mở trang quản trị PocketBase tại `http://127.0.0.1:8090/_/`.
4. Các migration tạo ba collection `thuoc_nam`, `thuoc_bac` và `thuoc_tay` với cùng schema:

| Field             | Kiểu | Yêu cầu        |
| ----------------- | ---- | -------------- |
| `name`            | Text | Bắt buộc       |
| `scientific_name` | Text | Không bắt buộc |
| `category`        | Text | Bắt buộc       |
| `parts_used`      | Text | Không bắt buộc |
| `benefits`        | Text | Bắt buộc       |
| `usage`           | Text | Không bắt buộc |
| `precautions`     | Text | Không bắt buộc |
| `author`          | Text | Không bắt buộc |

5. Migration đặt API rules public cho list/view/create/update/delete để người dùng có thể quản lý bản ghi không cần đăng nhập. Điều này cho phép bất kỳ ai truy cập ứng dụng sửa và xóa dữ liệu; hãy thêm xác thực và giới hạn quyền trước khi mở cho người dùng không tin cậy.
6. Chạy `pnpm --dir client dev`. Trong môi trường dev, Vite proxy `/pocketbase` tới `http://127.0.0.1:8090`, nên không cần expose URL localhost của container cho browser.
7. Khi deploy, đặt `VITE_POCKETBASE_URL` thành URL PocketBase mà trình duyệt truy cập được (tham khảo `client/.env.example`), rồi mở ứng dụng tại URL Vite hiển thị.

## Trợ lý AI

1. Sao chép `client/.dev.vars.example` thành `client/.dev.vars`, rồi điền OpenRouter API key. File `.dev.vars` đã được gitignore; không đưa API key vào biến `VITE_*` hoặc mã chạy trên browser.
2. `OPENROUTER_MODEL` có thể đổi theo model đang bật trong tài khoản OpenRouter. `POCKETBASE_URL` mặc định trong ví dụ trỏ tới PocketBase local.
3. Khởi động lại `pnpm --dir client dev` sau khi thêm biến. Với Cloudflare, đặt `OPENROUTER_API_KEY` bằng secret binding (`wrangler secret put OPENROUTER_API_KEY`); đặt `OPENROUTER_MODEL` và `POCKETBASE_URL` dưới dạng Worker variables.

Endpoint `/api/chat` lấy tối đa 200 bản ghi, xếp hạng theo độ khớp từ khóa và gửi tối đa 4 ghi chép liên quan làm context cho OpenRouter. Câu hỏi được giới hạn 1.200 ký tự và câu trả lời tối đa 700 token. Vì endpoint dùng key server-side nhưng có thể được gọi công khai, cần thêm xác thực hoặc rate limit trước khi triển khai rộng để tránh lạm dụng chi phí.

Trang `/thuvien` có thể chuyển giữa ba collection. Nhóm mặc định trong form lần lượt là nhóm cây thuốc nam, `Vị thuốc`/`Bài thuốc`/`Dược liệu` cho thuốc bắc và `Giảm đau`/`Kháng sinh`/`Tim mạch`/`Tiêu hóa`/`Hô hấp` cho thuốc tây; mỗi thư viện còn có nhóm `Khác`. Ứng dụng không lưu dữ liệu vào local storage. Nội dung là thông tin tham khảo, không thay thế tư vấn y tế; liều dùng thuốc tây phải theo chỉ định chuyên môn và nhãn thuốc.

Trợ lý AI tại `/api/chat` hiện chỉ truy xuất collection `thuoc_nam`; hai thư viện mới được quản lý trực tiếp tại trang `/thuvien`.
