import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import config
import model_utils
import os

class RecommenderEngine:
    def __init__(self):
        self.movies_df = pd.read_csv(config.MOVIES_CLEANED)
        self.movie_factors = model_utils.load_numpy(os.path.join(config.MODEL_PATH, "movie_factors.npy"))
        self.user_factors = model_utils.load_numpy(os.path.join(config.MODEL_PATH, "user_factors.npy"))
        self.embeddings = model_utils.load_numpy(config.SENTENCE_EMBEDDINGS)
        self.m_enc = model_utils.load_artifact(config.MOVIE_ENCODER)
        self.u_enc = model_utils.load_artifact(config.USER_ENCODER)

    def get_similar_movies(self, movie_id, k=config.TOP_K):
        """Content-based sử dụng Sentence Embeddings"""
        try:
            idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
            target_vec = self.embeddings[idx].reshape(1, -1)
            sim = cosine_similarity(target_vec, self.embeddings).flatten()
            indices = sim.argsort()[-k-1:-1][::-1]
            return self.movies_df.iloc[indices]

        except Exception as e:
            print(f"Error in get_similar_movies for movie_id {movie_id}:", e)

    def get_user_recommendations(self, user_id, k=config.TOP_K):
        """Collaborative Filtering với SVD"""
        u_idx = self.u_enc.transform([user_id])[0]
        u_vec = self.user_factors[u_idx].reshape(1, -1)
        scores = cosine_similarity(u_vec, self.movie_factors).flatten()
        
        # Logic loại bỏ phim đã xem có thể thêm vào đây bằng cách load ratings_final
        indices = scores.argsort()[-k:][::-1]
        real_ids = self.m_enc.inverse_transform(indices)
        return self.movies_df[self.movies_df['movieId'].isin(real_ids)]