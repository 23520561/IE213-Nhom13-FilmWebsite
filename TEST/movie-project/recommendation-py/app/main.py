from fastapi import FastAPI
from engine import RecommenderEngine

app = FastAPI()
engine = RecommenderEngine() # Khởi tạo 1 lần khi server start

@app.get("/recommend/movie/{movie_id}")
def recommend_by_movie(movie_id: int):
    results = engine.get_similar_movies(movie_id)
    return results[['movieId', 'title']].to_dict(orient='records')

@app.get("/recommend/user/{user_id}")
def recommend_for_user(user_id: int):
    results = engine.get_user_recommendations(user_id)
    return results[['movieId', 'title']].to_dict(orient='records')