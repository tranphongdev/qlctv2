# Trợ lý AI — hướng dẫn triển khai

Trang **AI Insights** gọi Gemini qua Edge Function [`ai-insights`](functions/ai-insights/index.ts).
Chưa deploy function thì trang vẫn chạy bình thường, chỉ hiện thông báo "chưa được
cấu hình" thay vì nội dung phân tích.

## 1. Lấy khoá Gemini

Tạo API key tại <https://aistudio.google.com/apikey>. Gói miễn phí đủ dùng cho một
người; `gemini-2.5-flash` là model mặc định vì rẻ và nhanh.

## 2. Cài Supabase CLI

Package `supabase` trên npm **chặn cài global** (`npm i -g supabase` sẽ báo lỗi ngay
ở bước postinstall). Cài vào dự án rồi gọi qua `npx`:

```bash
npm install --save-dev supabase
npx supabase login
npx supabase link --project-ref hvjaxlzkdewqgwkdlxmx
```

Ref `hvjaxlzkdewqgwkdlxmx` lấy từ `VITE_SUPABASE_URL` trong `.env` — nó là phần đầu
của `https://<ref>.supabase.co`.

> Trên Windows còn cách khác nếu bạn có scoop: `scoop install supabase`. Lúc đó bỏ
> tiền tố `npx` ở mọi lệnh bên dưới.

## 3. Nạp khoá và deploy

```bash
npx supabase secrets set GEMINI_API_KEY=dán_khoá_vào_đây
npx supabase functions deploy ai-insights
```

Đừng để dấu `<...>` trong lệnh: bash hiểu `<` là chuyển hướng file và sẽ báo
`syntax error near unexpected token`.

Đổi model không cần sửa code:

```bash
npx supabase secrets set GEMINI_MODEL=gemini-2.5-pro
```

> `gemini-2.5-pro` không tắt được thinking. Function đang đặt `thinkingBudget: 0`,
> nên nếu đổi sang Pro hãy bỏ dòng đó trong `generationConfig`.

## 4. Kiểm tra

Đăng nhập vào app rồi mở tab **AI Insights**. Xem log nếu có lỗi:

```bash
npx supabase functions logs ai-insights
```

## Vì sao phải qua Edge Function

Vite nhúng mọi biến `VITE_*` thẳng vào bundle JavaScript. Một khoá Gemini đặt ở phía
client là khoá công khai: bất kỳ ai mở DevTools đều đọc được và dùng hết hạn mức của
bạn. Ở kiến trúc này khoá chỉ nằm trong secret của Supabase và không bao giờ được gửi
xuống trình duyệt.

## Dữ liệu nào được gửi cho Google

`buildFinancialContext()` trong [src/lib/ai.ts](../src/lib/ai.ts) là nơi duy nhất
quyết định điều này. Nó gửi đi **bản tóm tắt đã tổng hợp**:

- Tổng số dư, tên và loại ví (không gửi số tài khoản)
- Thu/chi tháng này và tháng trước, chia theo danh mục
- Hạn mức ngân sách, mục tiêu, khoản nợ đang hoạt động

**Không** gửi giao dịch thô, tức là ghi chú, người liên quan, địa điểm và ảnh hoá đơn
không rời khỏi máy người dùng. Số tiền đã được quy đổi sẵn sang đơn vị người dùng
đang hiển thị, mô hình không phải tự làm toán tỷ giá.

## Các lớp bảo vệ

| Lớp | Ở đâu | Chặn cái gì |
| --- | --- | --- |
| `verify_jwt = true` | [config.toml](config.toml) | Request không kèm JWT |
| Đối chiếu token với `/auth/v1/user` | `resolveUserId()` | Request chỉ cầm anon key trong bundle |
| 20 request/phút/người | `isRateLimited()` | Một tab bấm liên tục |
| Giới hạn kích thước payload | `MAX_CONTEXT_CHARS`, `MAX_QUESTION_CHARS` | Prompt phình to bất thường |

Bộ đếm rate limit nằm trong RAM của từng instance, nên hạn mức thực tế là bội số của
20 khi Supabase chạy nhiều instance. Đủ để chặn bấm nhầm liên tục, **không** đủ để
chống tấn công có chủ đích — muốn chặt hơn phải đếm trong Postgres.
