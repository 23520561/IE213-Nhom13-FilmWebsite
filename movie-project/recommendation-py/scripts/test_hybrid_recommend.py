import sys
import pathlib
import os
import traceback

# Ensure project and app are importable
base = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(base / "app"))
sys.path.insert(0, str(base))
os.chdir(str(base))

try:
    from app.engine import RecommenderEngine
    from app import config
except Exception:
    try:
        from app.engine import RecommenderEngine
        from app import config
    except Exception:
        RecommenderEngine = None
        config = None
        print("Failed to import RecommenderEngine or config from app package or app folder")
        traceback.print_exc()


def parse_user_input(raw: str):
    raw = raw.strip()
    try:
        return int(raw)
    except ValueError:
        return raw


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Test hybrid_recommend from RecommenderEngine")
    parser.add_argument("--userId", "-u", type=str, help="user id (int or str)")
    parser.add_argument("--movieId", "-m", type=int, help="optional movieId to bias recommendations", required=False)
    parser.add_argument("--k", "-k", type=int, help="number of results", required=False)
    parser.add_argument("--alpha", "-a", type=float, help="blend factor alpha (0-1)", required=False)
    args = parser.parse_args()

    user_id = args.userId
    if user_id is None:
        raw = input("Nhập user_id (ví dụ 1): ").strip()
        user_id = parse_user_input(raw)
    else:
        user_id = parse_user_input(args.userId)

    movie_id = args.movieId
    if movie_id is None:
        prompt = input("Nhập movie_id để làm bias (Enter để bỏ qua): ").strip()
        movie_id = int(prompt) if prompt else None

    k = args.k if args.k is not None else getattr(config, 'TOP_K', 10)
    alpha = args.alpha if args.alpha is not None else 0.6

    if RecommenderEngine is None:
        print("RecommenderEngine not available. Exiting.")
        return

    try:
        engine = RecommenderEngine()
    except Exception:
        print("Failed to instantiate RecommenderEngine:")
        traceback.print_exc()
        return

    try:
        df = engine.hybrid_recommend(user_id=user_id, movie_id=movie_id, k=k, alpha=alpha)
    except Exception:
        print("Error while calling hybrid_recommend:")
        traceback.print_exc()
        return

    if df is None or df.empty:
        print(f"No recommendations for user={user_id} movie={movie_id}")
    else:
        print(f"Top {len(df)} hybrid recommendations for user={user_id} movie={movie_id} (k={k}, alpha={alpha}):\n")
        try:
            print(df[['movieId', 'title']].to_string(index=False))
        except Exception:
            print(df)


if __name__ == '__main__':
    main()
