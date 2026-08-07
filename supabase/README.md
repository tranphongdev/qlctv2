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

## Khi Google khai tử model

Đây là việc **sẽ** xảy ra lại, nên biết trước cho đỡ mất thời gian. Triệu chứng: giao
diện hiện `This model models/... is no longer available to new users`.

Google khoá model với project mới sớm hơn ngày shutdown họ công bố — bản `2.5-flash`
đã chết với project mới từ 09/07/2026 trong khi lịch chính thức ghi 16/10/2026. Sửa
bằng một lệnh, không cần deploy lại:

```bash
npx supabase secrets set GEMINI_MODEL=tên_model_mới
```

Danh sách model hiện hành: <https://ai.google.dev/gemini-api/docs/models>

Mặc định đang là `gemini-3.6-flash`.

> **Đổi sang đời model khác thì để ý `thinkingConfig`.** Bản 2.5 dùng
> `thinkingBudget` (đặt 0 là tắt hẳn), Gemini 3 dùng `thinking_level`. Function cố
> tình không khai báo field nào cả để chạy được trên mọi đời — đổi lại là chấp nhận
> mức thinking mặc định. Muốn tối ưu chi phí thì thêm đúng field của đời model đang
> dùng; sai tên là ăn 400 `Unknown name`.

## 4. Kiểm tra

Đăng nhập vào app rồi mở tab **AI Insights**.

Khi lỗi, giao diện hiện thẳng thông điệp gốc của Gemini ngay dưới câu thông báo —
đó là chỗ tra cứu đầu tiên. Cần xem sâu hơn (mã HTTP, thời gian, số lần gọi) thì
vào Dashboard; CLI **không** có lệnh `functions logs`:

<https://supabase.com/dashboard/project/hvjaxlzkdewqgwkdlxmx/functions/ai-insights/logs>

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
