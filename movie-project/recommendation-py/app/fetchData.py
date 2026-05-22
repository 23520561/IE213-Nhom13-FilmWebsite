import pandas as pd
import numpy as np
import requests
import time
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'
# File lưu tạm để nếu crash vẫn còn dữ liệu
CHECKPOINT_FILE = 'movies_checkpoints.jsonl' 

# --- PHẦN XỬ LÝ DỮ LIỆU CŨ ---
ratings = pd.read_csv(DATA_DIR / 'ratings.csv')
movies = pd.read_csv(DATA_DIR / 'movies.csv')
links = pd.read_csv(DATA_DIR / 'links.csv')

movie_counts = ratings.groupby('movieId').size().reset_index(name='count')
top_5000_ids = movie_counts.sort_values(by='count', ascending=False).head(5000)
top_5000_movies = pd.merge(top_5000_ids, links, on='movieId')
top_5000_movies = top_5000_movies.dropna(subset=['tmdbId'])
top_5000_movies['tmdbId'] = top_5000_movies['tmdbId'].astype(int)

# --- CẤU HÌNH API ---
API_KEY = "db5a65314881708a5c72d2d83776d89a" # Nhớ điền Key của bạn vào đây

def get_trailer_link(video_data):
    if not video_data:
        return None
    videos = video_data.get('results', [])
    for video in videos:
        # Ưu tiên lấy Trailer từ YouTube
        if video.get('site') == 'YouTube' and video.get('type') == 'Trailer':
            return f"https://www.youtube.com/watch?v={video.get('key')}"
    
    # Nếu không có Trailer, lấy video đầu tiên bất kỳ
    if videos:
        return f"https://www.youtube.com/watch?v={videos[0].get('key')}"
    return None

# Kiểm tra xem đã có phim nào được lấy trước đó chưa (để chạy tiếp)
fetched_ids = set()
if os.path.exists(CHECKPOINT_FILE):
    with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                fetched_ids.add(json.loads(line)['movieId'])
            except: continue

print(f"Bắt đầu lấy dữ liệu. Đã có {len(fetched_ids)} phim trong file tạm.")

# --- VÒNG LẶP CHÍNH ---
# Mở file mode 'a' để ghi nối tiếp (append)
with open(CHECKPOINT_FILE, 'a', encoding='utf-8') as f:
    for index, row in top_5000_movies.iterrows():
        movie_id = int(row['movieId'])
        
        # Nếu phim đã lấy rồi thì bỏ qua
        if movie_id in fetched_ids:
            continue
            
        tmdb_id = int(row['tmdbId'])
        
        # QUAN TRỌNG: Thêm append_to_response=videos vào URL
        url = f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={API_KEY}&append_to_response=videos"
        
        try:
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                
                movie_info = {
                    "movieId": movie_id,
                    "title": data.get("title"),
                    # Lấy video từ data['videos'] mà append_to_response vừa trả về
                    "trailer_link": get_trailer_link(data.get("videos", {})),
                    "overview": data.get("overview"),
                    "poster_path": f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get('poster_path') else None,
                    "genres": [g['name'] for g in data.get("genres", [])],
                    "release_date": data.get("release_date"),
                    "vote_average": data.get("vote_average")
                }
                
                # Ghi ngay một dòng vào file tạm
                f.write(json.dumps(movie_info, ensure_ascii=False) + "\n")
                f.flush() # Đảm bảo dữ liệu được ghi xuống đĩa ngay
                
                if index % 100 == 0:
                    print(f"Đã xử lý đến phim thứ {index}...")
            
            # Tôn trọng giới hạn của TMDb (khoảng 40 requests mỗi 10 giây)
            time.sleep(0.2) 
            
        except Exception as e:
            print(f"Lỗi ở phim ID {tmdb_id}: {e}")

print("Hoàn thành lấy dữ liệu!")

# Sau khi xong, bạn có thể chuyển file .jsonl sang .json để nạp vào MongoDB
final_movies = []
with open(CHECKPOINT_FILE, 'r', encoding='utf-8') as f:
    for line in f:
        final_movies.append(json.loads(line))

pd.DataFrame(final_movies).to_json('movies_metadata.json', orient='records', force_ascii=False)
