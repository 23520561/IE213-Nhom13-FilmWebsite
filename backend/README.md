# IE213-Nhom13-FilmWebsite

## 🚀 Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication

---

## 📦 Installation

### 1. Clone the repository

```bash id="r2x7r3"
git clone https://github.com/Nguyen-Hieu-uit/IE213-Nhom13-FilmWebsite.git
cd IE213-Nhom13-FilmWebsite
```

### 2. Go to backend folder

```bash id="3u9c8n"
cd backend
```

### 3. Install dependencies

```bash id="d8k2sl"
npm install
```

---

## ⚙️ Environment Setup

Copy the example environment file:

```bash id="u3n2ka"
cp example.env .env
```

Then edit `.env` if needed.

---

## ▶️ Running the Project

```bash id="9q2nsm"
node index.js
```

Server runs at:

```id="m3f8sk"
http://localhost:3000
```

---

## 🧪 Running Tests

```bash id="k2l9sd"
npm test
```

---

## 📡 API Overview

### 🔐 Auth Routes

- `POST /api/auth/register`
- `POST /api/auth/login`

### 👤 User Routes

- `/api/...` → user interactions

### 🛠 Admin Routes

- `/api/admin/...` → manage movies & categories
- Requires JWT authentication

---

## 📁 Project Structure

```id="t8c3nv"
.
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── tests/
│   │   └── helpers/
│   ├── app.js
│   ├── db.js
│   ├── index.js
│   ├── seed.js
│   ├── example.env
│   ├── jest.config.js
│   ├── package.json
```

---

## 🌱 Seeding Data (Optional)

```bash id="p9x1kd"
node seed.js
```

