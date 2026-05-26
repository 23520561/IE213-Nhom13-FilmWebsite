import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Lightbulb,
  ArrowLeft,
  Server,
  Activity,
  Film,
} from "lucide-react";
import { Movie } from "../types";
import styles from "../styles.module.css";

interface VideoPlayerProps {
  movie: Movie;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
}

export default function VideoPlayer({
  movie,
  onGoBack,
  onShowNotification,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentServer, setCurrentServer] = useState<
    "Server 1" | "Server 2" | "Server 3"
  >("Server 1");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isServerLoading, setIsServerLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play on mount, and handle server changing fake triggers
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentServer]);

  // Handle cinema mode body background lock or custom layer styling
  useEffect(() => {
    if (isCinemaMode && videoRef.current) {
      onShowNotification(
        "Đã bật chế độ xem rạp (Cinema Mode). Làm tối các chi tiết xung quanh!",
      );
    }
  }, [isCinemaMode, onShowNotification]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            onShowNotification(
              "Lỗi phát video. Đang tự động kết nối nguồn mới...",
            );
          });
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (nextMuted) {
        onShowNotification("Đã tắt tiếng âm thanh");
      } else {
        onShowNotification("Đã khôi phục âm thanh");
      }
    }
  };

  const handleServerChange = (server: "Server 1" | "Server 2" | "Server 3") => {
    if (server === currentServer) return;
    setIsServerLoading(true);
    setIsPlaying(false);
    setCurrentServer(server);

    setTimeout(() => {
      setIsServerLoading(false);
      setIsPlaying(true);
      onShowNotification(
        `Đã chuyển sang ${server}. Tốc độ đường truyền ổn định!`,
      );
    }, 1200);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    onShowNotification(`Tăng tốc độ phát phim: ${speed}x`);
  };

  const requestFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true));
      onShowNotification("Phát lại từ đầu phim.");
    }
  };

  // Hàm bổ trợ: Biến đổi link YouTube thường thành link Embed để chạy được trong thẻ iframe
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }
    // Thêm các tham số điều khiển ẩn bớt UI YouTube gốc
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`
      : url;
  };

  const isYouTubeLink =
    movie.videoUrl?.includes("youtube.com") ||
    movie.videoUrl?.includes("youtu.be");

  return (
    <div id="video-player-root" className="relative space-y-6">
      {/* Cinema Mode Background Overlay Layer */}
      <div
        className={`${styles.cinemaDimmer} ${isCinemaMode ? styles.cinemaDimmerActive : ""}`}
        onClick={() => setIsCinemaMode(false)}
      />

      {/* Breadcrumb back control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-0 gap-4 z-10 relative">
        <button
          id="player-back-btn"
          onClick={onGoBack}
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-red-500 transition-colors py-1 cursor-pointer self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại trang chi tiết</span>
        </button>

        {/* Hot badge display */}
        <div className="flex items-center space-x-2.5">
          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">
            Bạn đang xem trên nguồn phát chính thức
          </span>
        </div>
      </div>

      {/* Frame Container */}
      <div
        id="player-card-container"
        className={`w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl transition-all relative ${
          isCinemaMode ? "z-[120] ring-4 ring-slate-850" : "z-10"
        }`}
      >
        {/* Core Media Display Element */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center group/video">
          {isServerLoading ? (
            <div
              id="server-shift-spinner"
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3 z-30"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-red-600" />
              <p className="text-xs text-slate-400 font-mono">
                Đang kết nối tới phân vùng {currentServer}...
              </p>
            </div>
          ) : null}

          {isYouTubeLink ? (
            <iframe
              src={getYoutubeEmbedUrl(movie.videoUrl || "")}
              title={movie.title}
              className="w-full h-full object-contain absolute inset-0 z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              id="html5-video-node"
              src={movie.videoUrl}
              poster={movie.backdrop}
              onClick={togglePlay}
              preload="metadata"
              className="w-full h-full object-contain"
              controls={false}
            />
          )}

          {/* Central Play Trigger Indicator on screen when paused */}
          {!isPlaying && !isServerLoading && !isYouTubeLink && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-colors duration-300 z-20"
            >
              <div className="h-20 w-20 flex items-center justify-center rounded-full bg-red-600 text-white transition-all transform hover:scale-110 active:scale-95 shadow-2 w shadow-red-500/30">
                <Play className="h-10 w-10 fill-current ml-1" />
              </div>
            </div>
          )}

          {/* Elegant Custom Controller bar - Visible on Hover or when paused */}
          {!isYouTubeLink && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col space-y-3 z-20 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
              {/* Horizontal Timeline placeholder */}
              <div className="relative group/timeline cursor-pointer h-1 bg-slate-800 rounded-full w-full overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 bg-red-600 rounded-full w-[35%] group-hover/timeline:bg-red-500 transition-all" />
              </div>

              {/* Controller Buttons flow */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <button
                    id="internal-play-toggle"
                    onClick={togglePlay}
                    className="text-white hover:text-red-500 transition-colors"
                    title={isPlaying ? "Tạm dừng" : "Tiếp tục phát"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 fill-current" />
                    ) : (
                      <Play className="h-5 w-5 fill-current" />
                    )}
                  </button>

                  <button
                    id="internal-replay-btn"
                    onClick={restartVideo}
                    className="text-slate-350 hover:text-white transition-colors"
                    title="Xem lại"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  {/* Volumes slider */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-red-500 transition-colors"
                      title={isMuted ? "Bật tiếng" : "Mute tiếng"}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4 text-red-500" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                  </div>

                  {/* Duration indicator */}
                  <span className="text-[11px] text-zinc-450 font-mono font-medium">
                    05:42 / {movie.duration}:00 (Giả lập)
                  </span>
                </div>

                {/* Controls right side */}
                <div className="flex items-center space-x-3">
                  {/* Speed indicator buttons */}
                  <div className="flex items-center space-x-1 border border-slate-800/80 rounded-lg p-0.5 bg-slate-900/90 text-[10px]">
                    {[0.5, 1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`px-1.5 py-0.5 rounded transition-all ${
                          playbackSpeed === s
                            ? "bg-red-600 text-white font-black"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Fullscreen control */}
                  <button
                    onClick={requestFullscreen}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
                    title="Toàn màn hình"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info panel of the active player */}
        <div className="p-4 sm:p-6 border-t border-slate-900 group bg-slate-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-slate-800 rounded text-red-500 border border-slate-700">
                Đang phát
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Nguồn {currentServer}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-white">
              {movie.title}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {movie.originalTitle} ({movie.year})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Cinema mode control */}
            <button
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              className={`flex items-center space-x-1.5 text-xs rounded-full px-4 py-2 font-medium border transition-all ${
                isCinemaMode
                  ? "bg-amber-600 border-amber-500 text-white"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700 text-amber-500 hover:bg-slate-800"
              }`}
            >
              <Lightbulb
                className={`h-4 w-4 ${isCinemaMode ? "fill-current animate-bounce" : ""}`}
              />
              <span>{isCinemaMode ? "BẬT ĐÈN PHÒNG" : "TẮT ĐÈN XEM PHIM"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Server selector options list */}
      {/* <div
        id="servers-list-panel"
        className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 space-y-3 z-10 relative"
      >
        <h3 className="text-sm font-black text-slate-200 flex items-center space-x-2">
          <Server className="h-4 w-4 text-red-500" />
          <span>Danh Sách Máy Chủ Dự Phòng (Nếu phim bị giật lag)</span>
        </h3>
        <p className="text-xs text-zinc-500 leading-normal">
          Hãy chuyển đổi server phát dự phòng khác dưới đây nếu bạn cảm thấy
          đường truyền không ổn định, phim bị đứng khung hình hoặc lỗi kết nối
          ban đầu.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 [&>*]:cursor-pointer">
          {[
            {
              id: "Server 1",
              label: "Server 1 (Tốc Độ Cao - Mặc Định)",
              note: "Đường truyền Viettel, FPT mượt mà",
            },
            {
              id: "Server 2",
              label: "Server 2 (Sao Lưu - Full HD)",
              note: "Bản nén dung lượng vừa, ít giật lag",
            },
            {
              id: "Server 3",
              label: "Server 3 (Server Dự Phòng - chất lượng gốc)",
              note: "Chất lượng gốc độ phân giải cao",
            },
          ].map((srv) => (
            <div
              key={srv.id}
              onClick={() => handleServerChange(srv.id as any)}
              className={`rounded-xl border p-3 flex flex-col text-left transition-all ${
                currentServer === srv.id
                  ? "border-red-500 bg-red-950/20 shadow-lg shadow-red-500/5"
                  : "border-slate-850 bg-slate-950/40 hover:bg-slate-950/80 hover:border-slate-700"
              }`}
            >
              <span
                className={`text-xs font-bold leading-normal ${currentServer === srv.id ? "text-red-400" : "text-slate-200"}`}
              >
                {srv.label}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1 leading-normal">
                {srv.note}
              </span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
