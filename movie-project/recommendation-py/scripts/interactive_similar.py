import sys
import os
import traceback

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


try:
    from app.engine import RecommenderEngine
    from app import config
except Exception:
    # Fall back to importing directly from the app folder on sys.path
    try:
        from app.engine import RecommenderEngine
        from app import config
    except Exception:
        RecommenderEngine = None
        config = None
        print("Failed to import RecommenderEngine or config from app package or app folder")
        traceback.print_exc()

# Ensure imports succeeded before proceeding
if RecommenderEngine is None or config is None:
    # Do not proceed when imports failed; helpful message already printed
    pass


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test get_similar_movies from RecommenderEngine")
    parser.add_argument("--movieId", "-m", type=int, help="movieId to find similar movies", required=False)
    parser.add_argument("--k", "-k", type=int, help="number of similar movies to return (overrides config)", required=False)
    args = parser.parse_args()

    # Prompt for movieId if not provided as an argument
    movie_id = args.movieId
    if movie_id is None:
        try:
            movie_id = int(input("Enter movieId: ").strip())
        except Exception as e:
            print("Invalid movieId input:", e)
            raise SystemExit(1)

    # Instantiate engine and get similar movies (with error handling)
    if RecommenderEngine is None:
        print("RecommenderEngine is not available. Exiting.")
        raise SystemExit(1)

    try:
        engine = RecommenderEngine()
    except Exception:
        print("Failed to instantiate RecommenderEngine:")
        traceback.print_exc()
        raise SystemExit(1)

    k_value = args.k if args.k is not None else getattr(config, 'TOP_K', 10)
    df = engine.get_similar_movies(movie_id, k=k_value)

    if df.empty:
        print(f"No similar movies found for movieId={movie_id}")
    else:
        # Print a concise table of results
        print(f"Top {len(df)} similar movies for movieId={movie_id} (showing up to {k_value}):\n")
        try:
            print(df[['movieId', 'title']].to_string(index=False))
        except Exception:
            # Fallback to basic print
            print(df)