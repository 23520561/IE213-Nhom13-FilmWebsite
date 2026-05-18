import os
import sys
import numpy as np
import pandas as pd

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.engine


class FakeEncoder:
    def __init__(self, ids):
        self.ids = list(ids)

    def inverse_transform(self, indices):
        return np.array([self.ids[int(i)] for i in indices])


class FakeUserEncoder:
    def __init__(self, mapping):
        self.mapping = mapping

    def transform(self, user_list):
        return np.array([self.mapping[u] for u in user_list])


def make_engine():
    e = app.engine.RecommenderEngine.__new__(app.engine.RecommenderEngine)

    # small movie dataframe
    e.movies_df = pd.DataFrame({
        'movieId': [10, 20, 30, 40],
        'title': ['A', 'B', 'C', 'D']
    })

    # embeddings chosen so movie 20 is most similar to 10, then 40, then 30
    e.embeddings = np.array([
        [1.0, 0.0],
        [0.9, 0.1],
        [0.0, 1.0],
        [0.1, 0.9]
    ])

    # movie_factors and user_factors for CF test
    e.movie_factors = np.array([
        [1.0, 0.0],
        [0.8, 0.2],
        [0.0, 1.0],
        [0.2, 0.8]
    ])

    e.user_factors = np.array([
        [1.0, 0.0],  # user index 0 prefers first component
        [0.0, 1.0],  # user index 1 prefers second
    ])

    e.m_enc = FakeEncoder([10, 20, 30, 40])
    e.u_enc = FakeUserEncoder({'u1': 0, 'u2': 1})

    return e


def test_get_similar_movies_top_k():
    eng = make_engine()

    # request top-2 similar movies to movieId 10
    res = eng.get_similar_movies(10, k=2)

    # should contain movieIds 20 and 40 (in any order)
    ids = set(res['movieId'].tolist())
    assert ids == {20, 40}


def test_get_user_recommendations_top_k():
    eng = make_engine()

    # user 'u1' maps to user index 0 and should prefer movies 10 and 20
    res = eng.get_user_recommendations('u1', k=2)

    ids = set(res['movieId'].tolist())
    assert ids == {10, 20}
