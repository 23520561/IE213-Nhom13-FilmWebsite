import os
import sys

# import threading
from concurrent import futures
from typing import Optional

from app import config
import grpc
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel

# -------------------------
# FastAPI app (Render needs this)
# -------------------------
app = FastAPI()

# Ensure the package root is on sys.path so the `proto` package imports correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from proto import service_pb2, service_pb2_grpc

from app.engine import RecommenderEngine


class RecommendationService(service_pb2_grpc.RecommendationServiceServicer):
    def __init__(self):
        self.engine = RecommenderEngine()

    def Recommend(self, request, context):
        # Parse user_id (may be int-like or string in the proto)
        try:
            user_id = int(request.user_id)
        except Exception:
            user_id = request.user_id

        # Extract optional parameters for hybrid recommendation
        movie_id = None
        # support either `movie_id` (new proto) or `seed_movie_ids` (older proto)
        try:
            if hasattr(request, "movie_id") and request.movie_id:
                try:
                    movie_id = int(request.movie_id)
                except Exception:
                    movie_id = request.movie_id
            elif hasattr(request, "seed_movie_ids") and len(request.seed_movie_ids) > 0:
                # use first seed id as bias
                try:
                    movie_id = int(request.seed_movie_ids[0])
                except Exception:
                    movie_id = request.seed_movie_ids[0]
        except Exception:
            movie_id = None

        k = (
            request.max_results
            if hasattr(request, "max_results") and request.max_results
            else None
        )
        alpha = request.alpha if hasattr(request, "alpha") and request.alpha else 0.6

        # Try to obtain total_watched from the request (if proto includes it)
        total_watched = None
        if hasattr(request, "total_watched"):
            try:
                total_watched = int(request.total_watched)
            except Exception:
                total_watched = None

        # Fallback: check gRPC metadata for a 'total_watched' key (string)
        if total_watched is None:
            try:
                for md in context.invocation_metadata() or []:
                    if md.key == "total_watched":
                        try:
                            total_watched = int(md.value)
                        except Exception:
                            total_watched = None
                        break
            except Exception:
                # context may not support invocation_metadata in some test harnesses
                total_watched = None

        # If total_watched is provided use switching_hybrid_recommend
        if total_watched is not None:
            results = self.engine.switching_hybrid_recommend(
                user_id=user_id,
                total_watched=total_watched,
                recent_movie_id=movie_id,
                k=k or getattr(config, "TOP_K", 10),
                alpha=alpha,
            )
        else:
            if k:
                results = self.engine.hybrid_recommend(
                    user_id=user_id, movie_id=movie_id, k=k, alpha=alpha
                )
            else:
                results = self.engine.hybrid_recommend(
                    user_id=user_id, movie_id=movie_id, alpha=alpha
                )
        if results is None or results.empty:
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                "No recommendations found for user_id: {}".format(request.user_id),
            )
        recommendation_list = []
        for index, row in results.iterrows():
            movie = service_pb2.MovieRecommendation(
                movie_id=str(row["movieId"]),
                title=row.get("title", ""),
                score=float(row.get("score", 0.0)),
            )
            recommendation_list.append(movie)
        return service_pb2.RecommendationResponse(recommendations=recommendation_list)

    def SimilarMovies(self, request, context):
        if hasattr(request, "max_results") and request.max_results:
            results = self.engine.get_similar_movies(
                int(request.movie_id), k=request.max_results
            )
        else:
            results = self.engine.get_similar_movies(int(request.movie_id))
        if results is None or results.empty:
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                f"Movie with ID {request.movie_id} not found.",
            )
        recommendation_list = []
        for index, row in results.iterrows():
            movie = service_pb2.MovieRecommendation(
                movie_id=str(row["movieId"]), title=row["title"]
            )
            recommendation_list.append(movie)
        return service_pb2.SimilarResponse(recommendations=recommendation_list)

    def Health(self, request, context):
        return service_pb2.HealthResponse(status="ok")


@app.post("/similar")
def similar(req: dict):
    movie_id = int(req["movie_id"])
    max_results = req.get("max_results", None)

    if max_results:
        results = RecommendationService().engine.get_similar_movies(
            movie_id, k=max_results
        )
    else:
        results = RecommendationService().engine.get_similar_movies(movie_id)

    if results is None or results.empty:
        return {"recommendations": []}

    return {
        "recommendations": [
            {"movie_id": str(row["movieId"]), "title": row["title"]}
            for _, row in results.iterrows()
        ]
    }


engine = RecommenderEngine()


class RecommendRequest(BaseModel):
    user_id: int
    max_results: Optional[int] = None
    movie_id: Optional[int] = None
    alpha: Optional[float] = 0.6
    total_watched: Optional[int] = None


@app.post("/recommend")
def recommend(req: RecommendRequest):

    user_id = req.user_id
    movie_id = req.movie_id
    k = req.max_results
    alpha = req.alpha
    total_watched = req.total_watched

    # SAME logic as gRPC
    if total_watched is not None:
        results = engine.switching_hybrid_recommend(
            user_id=user_id,
            total_watched=total_watched,
            recent_movie_id=movie_id,
            k=k or 10,
            alpha=alpha,
        )
    else:
        results = engine.hybrid_recommend(
            user_id=user_id,
            movie_id=movie_id,
            k=k,
            alpha=alpha,
        )

    if results is None or results.empty:
        raise HTTPException(status_code=404, detail="No recommendations found")

    return {
        "recommendations": [
            {
                "movie_id": str(row["movieId"]),
                "title": row["title"],
                "score": float(row.get("score", 0)),
            }
            for _, row in results.iterrows()
        ]
    }


# def serve():
#     server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
#     service_pb2_grpc.add_RecommendationServiceServicer_to_server(
#         RecommendationService(), server
#     )
#     port = os.environ.get("PORT", "50051")
#     server.add_insecure_port(f"[::]:{port}")
#     server.start()
#     print("Recommendation service started on [::]:50051")
#     server.wait_for_termination()


# if __name__ == "__main__":
#     serve()
# main entry
# -------------------------
if __name__ == "__main__":
    # start gRPC in background thread
    # threading.Thread(target=serve, daemon=True).start()

    # start FastAPI (THIS is what Render sees)
    HTTP_PORT = int(os.environ.get("PORT", 8000))

    uvicorn.run(app, host="0.0.0.0", port=HTTP_PORT)
