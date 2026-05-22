import sys
import pathlib

# Đảm bảo thư mục gốc của project trong sys.path để import module `app`
base = pathlib.Path(__file__).resolve().parents[1]
# Thêm cả thư mục gốc `recommendation-py` và `recommendation-py/app` vào sys.path
sys.path.insert(0, str(base / "app"))
sys.path.insert(0, str(base))

# Set working directory to project base so relative paths in config.py resolve
import os
os.chdir(str(base))

from app.engine import RecommenderEngine


def main():
    user_input = input("Nhập user_id (ví dụ 1): ").strip()
    try:
        user_id = int(user_input)
    except ValueError:
        user_id = user_input

    engine = RecommenderEngine()
    try:
        recs = engine.get_user_recommendations(user_id, k=10)
    except Exception as e:
        print("Lỗi khi lấy đề xuất:", e)
        return

    if recs is None or recs.empty:
        print(f"Không có đề xuất cho user {user_id}")
    else:
        print(f"Đề xuất phim cho user {user_id}:")
        # Hiển thị movieId và title
        if 'title' in recs.columns:
            print(recs[['movieId', 'title']].to_string(index=False))
        else:
            print(recs.head(10).to_string(index=False))


if __name__ == '__main__':
    main()
