import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix
from sentence_transformers import SentenceTransformer
import config
import os
import model_utils

def run_preprocessing():
    # 1. Load data
    ratings = pd.read_csv(f"{config.DATA_PATH}/ratings.csv")
    movies = pd.read_csv(f"{config.DATA_PATH}/movies.csv")
    tags = pd.read_csv(f"{config.DATA_PATH}/tags.csv")

    # 2. Lọc dữ liệu (Giảm độ thưa)
    user_counts = ratings.groupby('userId').size()
    active_users = user_counts[user_counts > config.USER_MIN_RATINGS].index
    ratings_filtered = ratings[ratings['userId'].isin(active_users)]

    movie_counts = ratings_filtered.groupby('movieId').size()
    popular_movies = movie_counts[movie_counts >= config.MOVIE_MIN_RATINGS].index
    ratings_final = ratings_filtered[ratings_filtered['movieId'].isin(popular_movies)]

    # 3. Xử lý Metadata & Sentence Embeddings
    tags['tag'] = tags['tag'].fillna('')
    tags_grouped = tags.groupby('movieId')['tag'].apply(lambda x: ' '.join(x.astype(str))).reset_index()
    
    movies['genres'] = movies['genres'].str.replace('|', ' ').str.replace('-', ' ')
    movies = movies.merge(tags_grouped, on='movieId', how='left')
    movies['metadata'] = (movies['genres'] + ' ' + movies['tag'].fillna('')).fillna('')
    
    # Huấn luyện Sentence Embedding (Lưu offline)
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(movies['metadata'].tolist(), show_progress_bar=True)
    model_utils.save_numpy(embeddings, config.SENTENCE_EMBEDDINGS)
    movies.to_csv(config.MOVIES_CLEANED, index=False)

    # 4. Collaborative Filtering với Time Decay
    max_ts = ratings_final['timestamp'].max()
    ratings_final['age_days'] = (max_ts - ratings_final['timestamp']) / (60*60*24)
    ratings_final['weight'] = np.exp(-config.DECAY_ALPHA * ratings_final['age_days'])
    ratings_final['decayed_rating'] = ratings_final['rating'] * ratings_final['weight']

    u_enc, m_enc = LabelEncoder(), LabelEncoder()
    ratings_final['u_idx'] = u_enc.fit_transform(ratings_final['userId'])
    ratings_final['m_idx'] = m_enc.fit_transform(ratings_final['movieId'])

    # Train SVD
    mat = csr_matrix((ratings_final['decayed_rating'], (ratings_final['u_idx'], ratings_final['m_idx'])))
    svd = TruncatedSVD(n_components=config.SVD_COMPONENTS, random_state=42)
    user_factors = svd.fit_transform(mat)
    movie_factors = svd.components_.T

    # Lưu artifacts
    model_utils.save_artifact(svd, config.SVD_MODEL)
    model_utils.save_artifact(u_enc, config.USER_ENCODER)
    model_utils.save_artifact(m_enc, config.MOVIE_ENCODER)
    model_utils.save_numpy(movie_factors, os.path.join(config.MODEL_PATH, "movie_factors.npy"))
    model_utils.save_numpy(user_factors, os.path.join(config.MODEL_PATH, "user_factors.npy"))

if __name__ == "__main__":
    run_preprocessing()