# Film Website — Movie Project

Ngôn ngữ: JavaScript (Node.js) + TypeScript (frontend) + Python (recommendation)

## Mô tả

Dự án này là một website phim gồm ba thành phần chính:

- `backend-node`: REST / GraphQL server (Node.js) với các API cho người dùng, phim, bình luận và xếp hạng.
- `frontend-node`: Ứng dụng client bằng Vite + React + TypeScript (giao diện người dùng).
- `recommendation-py`: Microservice Python chịu trách nhiệm hệ gợi ý (sử dụng mô hình và dữ liệu trong `models/`).

## Cấu trúc chính

- [backend-node](backend-node) — mã nguồn server, model, resolver, proto gRPC, seed dữ liệu và test.
- [frontend-node](frontend-node) — client Vite + React (TypeScript).
- [recommendation-py](recommendation-py) — service gợi ý, scripts và tests Python.
- `movies_metadata.json`, `movies_checkpoints.jsonl` — dữ liệu liên quan (ở mức repo gốc).

## Yêu cầu (Prerequisites)

- Node.js >= 16
- npm hoặc yarn
- Python 3.11+ và `pip` cho service gợi ý
- MongoDB (cục bộ hoặc remote) nếu chạy backend với DB

## Chạy từng phần

1. Backend (Node.js)

- Cài đặt và khởi động:

  ```bash
  cd movie-project/backend-node
  npm install
  # tạo file .env với các biến cần thiết như MONGO_URI, PORT, JWT_SECRET, ...
  node seed.js      # (tùy chọn) seed dữ liệu mẫu vào database
  npm start         # hoặc `npm run dev` nếu project có script cho phát triển
  ```

- Tập tin quan trọng:
  - [service.proto](backend-node/proto/service.proto) — định nghĩa gRPC/Proto
  - [seed.js](backend-node/seed.js) — script tạo dữ liệu mẫu
  - `jest.config.js`, `test/` — test đơn vị và tích hợp

2. Frontend (Vite + React + TypeScript)

```bash
cd movie-project/frontend-node
npm install
npm run dev
# Mở http://localhost:5173 (mặc định của Vite)
```

3. Recommendation service (Python)

```bash
cd movie-project/recommendation-py
python -m venv .venv
.\.venv\Scripts\activate    # Windows
pip install -r requirements.txt
# chỉnh config trong app/config.py nếu cần (ví dụ đường dẫn model, cổng grpc)
python -m app.main
```

## Giao tiếp giữa service

- Backend có chứa client gRPC tại `backend-node/proto/grpcClient.js` để gọi service gợi ý.
- Proto file dùng chung nằm ở `movie-project/recommendation-py/proto/service.proto` và `backend-node/proto/service.proto`.

## Test

- Backend: chạy test với Jest từ `backend-node`:

  ```bash
  cd movie-project/backend-node
  npm test
  ```

- Recommendation: test Python nằm trong `recommendation-py/tests` (chạy bằng `pytest`).

## Cài đặt env & biến môi trường

- Tạo file `.env` cho backend chứa ít nhất `MONGO_URI`, `PORT`, `JWT_SECRET`.
- Recommendation service có thể cần cấu hình đường dẫn tới file mô hình trong `recommendation-py/app/config.py`.

## Seed dữ liệu

- Dùng `movie-project/backend-node/seed.js` để chèn dữ liệu mẫu vào MongoDB (chạy sau khi set `MONGO_URI`).

## Tài nguyên hữu ích

- Mã backend chính: [backend-node](backend-node)
- Mã frontend chính: [frontend-node](frontend-node)
- Service gợi ý: [recommendation-py](recommendation-py)
