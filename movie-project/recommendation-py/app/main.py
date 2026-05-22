import os
import sys
import grpc
from concurrent import futures

# Ensure the package root is on sys.path so the `proto` package imports correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from proto import service_pb2, service_pb2_grpc
from app.engine import RecommenderEngine

class RecommendationService(service_pb2_grpc.RecommendationServiceServicer):
    def __init__(self):
        self.engine = RecommenderEngine()

    def Recommend(self, request, context):
        if hasattr(request, 'max_results') and request.max_results:
            results = self.engine.get_user_recommendations(int(request.user_id), k=request.max_results)
        else:
            results = self.engine.get_user_recommendations(int(request.user_id))
        if results is None or results.empty:
            context.abort(grpc.StatusCode.NOT_FOUND, "No recommendations found for user_id: {}".format(request.user_id))
        recommendation_list = []
        for index, row in results.iterrows():
            movie = service_pb2.MovieRecommendation(movie_id=str(row['movieId']), title=row['title'], score=float(row.get('score', 0.0)))
            recommendation_list.append(movie)
        return service_pb2.RecommendationResponse(recommendations=recommendation_list)

    def SimilarMovies(self, request, context):
        if hasattr(request, 'max_results') and request.max_results:
            results = self.engine.get_similar_movies(int(request.movie_id), k=request.max_results)
        else:
            results = self.engine.get_similar_movies(int(request.movie_id))
        if results is None or results.empty:
            context.abort(grpc.StatusCode.NOT_FOUND, f"Movie with ID {request.movie_id} not found.")
        recommendation_list = []
        for index, row in results.iterrows():
            movie = service_pb2.MovieRecommendation(movie_id=str(row['movieId']), title=row['title'])
            recommendation_list.append(movie)
        return service_pb2.SimilarResponse(recommendations=recommendation_list)

    def Health(self, request, context):
        return service_pb2.HealthResponse(status='ok')

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    service_pb2_grpc.add_RecommendationServiceServicer_to_server(RecommendationService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Recommendation service started on [::]:50051")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()