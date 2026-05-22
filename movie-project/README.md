# Movie Project

Tài liệu tổng quan cho dự án hệ thống quản lý và đề xuất phim.

## Mục lục

- Giới thiệu
- Cấu trúc dự án
- Yêu cầu
- Hướng dẫn cài đặt & chạy
  - Backend (Node.js)
  - Recommendation service (Python)
- Dữ liệu
- Kiểm thử
- Góp phần
- License

## Giới thiệu

Đây là một dự án mẫu gồm hai phần chính:

- `backend-node`: REST/GraphQL API bằng Node.js/Express (kèm Mongoose cho MongoDB).
- `recommendation-py`: dịch vụ Python chịu trách nhiệm xử lý mô hình khuyến nghị (có thể dùng FastAPI/Flask).

Mục tiêu: triển khai backend phục vụ dữ liệu phim, cùng dịch vụ khuyến nghị tách biệt (microservice) xử lý các thuật toán gợi ý.

## Cấu trúc dự án

- `backend-node/` — mã nguồn Node.js cho API, gồm:
  - `app.js` — cấu hình Express (middleware, routes)
  - `index.js` — entrypoint khởi động server
  - `seed.js` — script seed dữ liệu mẫu
  - `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/` — các thành phần tổ chức mã
  - `tests/` — test unit/integration

- `recommendation-py/` — dịch vụ Python cho engine khuyến nghị:
  - `app/` — mã nguồn service (ví dụ `main.py`, `engine.py`, `model_utils.py`, `schema.py`)
  - `models/` — model đã huấn luyện (ví dụ `.npy`, `.pkl`)
  - `data/` — dữ liệu CSV mẫu
  - `requirements.txt` — phụ thuộc Python

- Các file dữ liệu gốc nằm ở thư mục gốc của workspace: `movies_metadata.json`, `movies_checkpoints.jsonl`, v.v.

## Yêu cầu

- Node.js 23.8.0, npm
- Python 3.10.9
- MongoDB (nếu backend dùng MongoDB)

## Hướng dẫn cài đặt & chạy

Lưu ý: các bước dưới đây giả định bạn đang ở thư mục `movie-project`.

### Backend (Node.js)

1. Vào thư mục backend:

```bash
cd backend-node
```

2. Cài dependencies và chạy (development):

```bash
npm install
npm run dev
```

3. Mặc định `start`/`dev` dùng `nodemon index.js`. Kiểm tra file `package.json` để biết script cụ thể.

4. Cấu hình biến môi trường: sao chép `.env.example` thành `.env` và chỉnh thông tin DB, PORT, v.v.

5. (Tùy chọn) Seed dữ liệu mẫu:

```bash
node seed.js
```

### Recommendation service (Python)

1. Vào thư mục dịch vụ Python:

```bash
cd recommendation-py
```

2. Tạo virtual environment và cài phụ thuộc:

```bash
python -m venv .venv
source .venv/Scripts/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

3. Chạy service (ví dụ dùng Uvicorn/Flask):

```bash
python app/main.py
```

4. Endpoint khuyến nghị sẽ trả kết quả dựa trên model trong `models/` hoặc tính toán trực tiếp từ `data/`.

## Dữ liệu

- `movies_metadata.json`, `movies_checkpoints.jsonl` — dữ liệu movie gốc.
- `movie-project/recommendation-py/data/` — CSV mẫu (`movies.csv`, `ratings.csv`, v.v.)

Ghi chú: nếu dữ liệu lớn, cân nhắc seed một tập con để phát triển cục bộ.

## Kiểm thử

- Backend: chạy test trong `backend-node/tests/`. Cấu hình test runner nằm trong `jest.config.js`.

### Chạy toàn bộ test

```bash
cd backend-node
npm test
```

Lệnh này sẽ chạy Jest với các option:

- `--detectOpenHandles`: phát hiện các handle chưa được đóng (DB connection, timer, socket, ...)
- `--forceExit`: tự động thoát process sau khi test hoàn tất

### Chạy test ở chế độ watch

Tự động rerun khi file thay đổi:

```bash
npm run test:watch
```

Script sử dụng:

```json
"test:watch": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --watch"
```

### Chạy test và xuất coverage

```bash
npm run test:coverage
```

Sau khi chạy xong, báo cáo coverage sẽ được tạo trong thư mục:

```bash
coverage/
```

### Scripts cấu hình

```json
{
  "test": "NODE_ENV=test jest --detectOpenHandles --forceExit",
  "test:watch": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js --watch",
  "test:coverage": "NODE_ENV=test jest --coverage"
}
```

- Recommendation: viết các unit test cho các hàm xử lý model trong `recommendation-py` (ví dụ sử dụng `pytest`).

## Góp phần

1. Fork repository
2. Tạo branch: `feature/ten-tinh-nang` hoặc `fix/ghi-chi-tiet`
3. Commit & push
4. Tạo pull request mô tả thay đổi và cách kiểm thử

Vui lòng tuân thủ quy tắc code style và thêm test cho thay đổi quan trọng.

## Liên hệ

Nếu có câu hỏi hoặc cần trợ giúp, mở issue trên repository hoặc liên hệ trực tiếp với tác giả dự án.

## License

Kiểm tra `package.json` hoặc thêm file `LICENSE` theo nhu cầu dự án.
