import os

# Đường dẫn tệp
DATA_PATH = "data"
MODEL_PATH = "models"

# Tham số lọc dữ liệu
USER_MIN_RATINGS = 20
MOVIE_MIN_RATINGS = 50

# Tham số mô hình
SVD_COMPONENTS = 75
DECAY_ALPHA = 0.00693  # Chu kỳ bán rã 100 ngày
TOP_K = 10

# Tên các file artifact
MOVIES_CLEANED = os.path.join(MODEL_PATH, "movies_cleaned.csv")
SVD_MODEL = os.path.join(MODEL_PATH, "svd_model.pkl")
USER_ENCODER = os.path.join(MODEL_PATH, "user_encoder.pkl")
MOVIE_ENCODER = os.path.join(MODEL_PATH, "movie_encoder.pkl")
SENTENCE_EMBEDDINGS = os.path.join(MODEL_PATH, "embeddings.npy")