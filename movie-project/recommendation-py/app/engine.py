import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from app import config
from app import model_utils
from sklearn.preprocessing import MinMaxScaler
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
        
        indices = scores.argsort()[-k:][::-1]
        real_ids = self.m_enc.inverse_transform(indices)
        return self.movies_df[self.movies_df['movieId'].isin(real_ids)]
    def hybrid_recommend(self, user_id, movie_id=None, k=config.TOP_K, alpha=0.6):
        """Kết hợp cả hai phương pháp"""
        collab_scores = self._get_collab_scores(user_id)
        content_scores = self._get_content_scores(movie_id) if movie_id else {mid: 0 for mid in collab_scores.keys()}

        # Combine scores with blending factor alpha
        combined_scores = {mid: alpha * collab_scores.get(mid, 0) + (1 - alpha) * content_scores.get(mid, 0)
                           for mid in collab_scores.keys()}

        # Get top-k movie ids ordered by combined score
        sorted_movies = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:k]
        recommended_ids = [mid for mid, score in sorted_movies]

        # Build a DataFrame of the recommended movies preserving order and including score
        df = self.movies_df[self.movies_df['movieId'].isin(recommended_ids)].copy()
        score_map = {mid: score for mid, score in sorted_movies}
        df['score'] = df['movieId'].map(score_map).fillna(0.0)
        # Preserve the ranking order
        df['__rank'] = df['movieId'].apply(lambda x: recommended_ids.index(x) if x in recommended_ids else 9999)
        df = df.sort_values('__rank').drop(columns='__rank')
        return df

    def _get_collab_scores(self, user_id):
        u_idx = self.u_enc.transform([user_id])[0]
        u_vec = self.user_factors[u_idx].reshape(1, -1)
        scores = cosine_similarity(u_vec, self.movie_factors).flatten()

        scaler = MinMaxScaler()
        scores = scaler.fit_transform(scores.reshape(-1, 1)).flatten()
        real_ids = self.m_enc.inverse_transform(np.arange(len(scores)))
        return dict(zip(real_ids, scores))
    def _get_content_scores(self, movie_id):
        idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
        target_vec = self.embeddings[idx].reshape(1, -1)
        sim = cosine_similarity(target_vec, self.embeddings).flatten()

        scaler = MinMaxScaler()
        sim = scaler.fit_transform(sim.reshape(-1, 1)).flatten()
        # The embeddings and movies_df align by index, so map similarity scores
        # directly to the `movieId` values from `movies_df` instead of using
        # the movie encoder. This avoids issues when the encoder only covers
        # a subset of movies used by the collaborative model.
        real_ids = self.movies_df['movieId'].values
        return dict(zip(real_ids, sim))
    def switching_hybrid_recommend(self, user_id, total_watched, recent_movie_id=None, k=config.TOP_K, alpha=0.6):
        """Switching hybrid: nếu user mới hoặc ít lịch sử thì ưu tiên content-based"""
        is_user_in_model = user_id in self.u_enc.classes_
        if not is_user_in_model or total_watched < 5:
            if recent_movie_id:
                return self.get_similar_movies(recent_movie_id, k=k)
            else:
                return self.movies_df.sample(n=k)  
        else:
            return self.hybrid_recommend(user_id, movie_id=recent_movie_id, k=k, alpha=alpha)