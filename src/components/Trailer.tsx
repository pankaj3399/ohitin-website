import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Maximize, Minimize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';

const FRAMER_CROSSFADE_EASE = [0.42, 0.02, 0.51, 1] as const;
const FRAMER_CROSSFADE_DURATION = 2;

const baseUrl = import.meta.env.BASE_URL || '/';
const getAssetUrl = (path: string) => `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

// Build video URLs from Vite's BASE_URL so production deployments are not tied to root hosting.
const getVideo = (num: number) => getAssetUrl(`/videos/${num}.mp4`);

// Organized scenes
const scene1Videos = [getVideo(1), getVideo(2), getVideo(3)];
const scene2Videos = [getVideo(4), getVideo(5)];
const scene3Videos = [6, 7, 8, 9, 10, 11].map(getVideo);

// Detect mobile once at module level to avoid repeated checks
const isMobile = (() => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
})();

// How many seconds before the end of a video to trigger the transition.
const getTransitionBuffer = (_videoPath: string): number => {
  // Framer VideoSlideshow uses switchBeforeEnd: 1.5s across scenes.
  return 1.5;
};


// ─── Lightweight video player component ───────────────────────────────────────
// Isolates video playback and time-checking from the parent's render cycle.
// On mobile, uses a lower-frequency check via requestAnimationFrame instead of
// the high-frequency onTimeUpdate event, which causes excessive React re-renders.
interface VideoPlayerProps {
  videoPath: string;
  index: number;
  onAdvance: (index: number) => void;
  disableAdvance?: boolean;
  loop?: boolean;
}

const VideoPlayer = React.memo<VideoPlayerProps>(({ videoPath, index, onAdvance, disableAdvance = false, loop = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAdvancedRef = useRef(false);
  const rafIdRef = useRef<number>(0);

  useEffect(() => {
    hasAdvancedRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    video.load();

    // Explicitly play the video to ensure autoplay works reliably across all browsers,
    // especially after a dynamic component mount or when network latency is involved.
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        const mediaError = video.error;
        console.warn('Video play failed or was interrupted:', {
          error,
          src: video.currentSrc || videoPath,
          networkState: video.networkState,
          readyState: video.readyState,
          mediaErrorCode: mediaError?.code,
          mediaErrorMessage: mediaError?.message,
        });
      });
    }

    if (disableAdvance) return;

    // On mobile, use a polling loop via rAF instead of onTimeUpdate.
    // This fires once per frame (~16ms) but we only do a cheap number comparison,
    // which is far cheaper than React's onTimeUpdate synthetic event overhead.
    if (isMobile) {
      const buffer = getTransitionBuffer(videoPath);
      const checkTime = () => {
        if (hasAdvancedRef.current) return;
        if (video.duration && !isNaN(video.duration)) {
          const remaining = video.duration - video.currentTime;
          if (remaining <= buffer) {
            hasAdvancedRef.current = true;
            onAdvance(index);
            return;
          }
        }
        rafIdRef.current = requestAnimationFrame(checkTime);
      };
      rafIdRef.current = requestAnimationFrame(checkTime);

      return () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      };
    }
    // Desktop: no cleanup needed — uses onTimeUpdate JSX handler
  }, [videoPath, index, onAdvance]);

  // onTimeUpdate handler — desktop only (lighter for desktop since it's fast enough)
  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (disableAdvance || isMobile || hasAdvancedRef.current) return;
    const video = e.currentTarget;
    if (!video.duration || isNaN(video.duration)) return;
    const remaining = video.duration - video.currentTime;
    const buffer = getTransitionBuffer(videoPath);
    if (remaining <= buffer) {
      hasAdvancedRef.current = true;
      onAdvance(index);
    }
  }, [disableAdvance, videoPath, index, onAdvance]);

  const handleEnded = useCallback(() => {
    if (disableAdvance) return;
    if (!hasAdvancedRef.current) {
      hasAdvancedRef.current = true;
      onAdvance(index);
    }
  }, [disableAdvance, index, onAdvance]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const mediaError = video.error;
    console.warn('Video source failed to load:', {
      src: video.currentSrc || videoPath,
      networkState: video.networkState,
      readyState: video.readyState,
      mediaErrorCode: mediaError?.code,
      mediaErrorMessage: mediaError?.message,
    });
  }, [videoPath]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      playsInline
      muted
      loop={loop}
      onTimeUpdate={isMobile ? undefined : handleTimeUpdate}
      onEnded={handleEnded}
      onError={handleError}
      preload="auto"
      style={{ willChange: isMobile ? 'opacity' : 'transform, opacity', transformOrigin: 'center' }}
    >
      <source src={videoPath} type="video/mp4" />
    </video>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

// ─── Main component ──────────────────────────────────────────────────────────
interface CinematicTrailerProps {
  scene?: 1 | 2 | 3;
}

const CinematicTrailer: React.FC<CinematicTrailerProps> = ({ scene = 1 }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ref that always reflects the latest currentIndex
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = document.documentElement;

    if (!document.fullscreenElement && !isFullscreen) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        } else if ((el as any).msRequestFullscreen) {
          await (el as any).msRequestFullscreen();
        }

        const screenOrientation = window.screen.orientation as any;
        if (window.screen && screenOrientation && screenOrientation.lock) {
          await screenOrientation.lock('landscape').catch(() => { });
        }
      } catch (err) {
        console.warn("Native fullscreen rejected, falling back to simulated CSS fullscreen mode.");
      }
      setIsFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        const screenOrientation = window.screen.orientation as any;
        if (window.screen && screenOrientation && screenOrientation.unlock) {
          screenOrientation.unlock();
        }
      } catch (e) { }
      setIsFullscreen(false);
    }
  };

  const currentVideos =
    scene === 1 ? scene1Videos : scene === 2 ? scene2Videos : scene3Videos;

  // Advance to the next video — only if the requesting video is still active
  const advanceVideo = useCallback((fromIndex: number) => {
    if (currentIndexRef.current !== fromIndex) return;
    const nextIndex = (fromIndex + 1) % currentVideos.length;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
  }, [currentVideos]);

  // Reset index when scene changes
  useEffect(() => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
  }, [scene]);

  // ── Cinematic variants ──────────────────────────────────────────────────────
  const getVariants = useCallback((_videoPath: string): Variants => {
    return {
      enter: {
        opacity: 0,
      },
      center: {
        zIndex: 1,
        opacity: 1,
        transition: {
          duration: FRAMER_CROSSFADE_DURATION,
          ease: FRAMER_CROSSFADE_EASE,
        },
      },
      exit: {
        zIndex: 0,
        opacity: 0,
        transition: {
          duration: FRAMER_CROSSFADE_DURATION,
          ease: FRAMER_CROSSFADE_EASE,
        },
      },
    };
  }, []);

  // Memoize scene overlay transition duration
  const sceneTransitionDuration = FRAMER_CROSSFADE_DURATION;

  return (
    <div className={`bg-black text-white font-normal select-none transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-[100dvh] portrait:w-[100dvh] portrait:h-[100vw] portrait:origin-top-left portrait:translate-x-[100vw] portrait:rotate-90 overflow-hidden block' : 'relative w-full h-[100dvh] md:h-screen overflow-x-hidden md:overflow-hidden flex flex-col md:block'}`}>
      {/* Background Videos Section */}
      <div className={`relative w-full bg-black shrink-0 z-0 ${isFullscreen ? 'absolute inset-0 w-full h-full' : 'aspect-video md:aspect-auto md:h-full md:absolute md:inset-0'}`}>
        <AnimatePresence initial={false} mode="sync">
          {currentVideos.map((videoPath, index) => {
            if (index !== currentIndex) return null;
            return (
              <motion.div
                key={videoPath}
                variants={getVariants(videoPath)}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full"
              >
                <VideoPlayer
                  videoPath={videoPath}
                  index={index}
                  onAdvance={advanceVideo}
                  disableAdvance={false}
                  loop={true}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Hidden preloader for the next video to avoid black screen delays */}
        <video
          key={`preloader-${currentVideos[(currentIndex + 1) % currentVideos.length]}`}
          preload="auto"
          muted
          playsInline
          className="absolute w-px h-px opacity-0 pointer-events-none"
        >
          <source
            src={currentVideos[(currentIndex + 1) % currentVideos.length]}
            type="video/mp4"
          />
        </video>

        {/* Dark overlays for desktop text readability */}
        {!isFullscreen && (
          <>
            <div className="hidden md:block absolute inset-0 z-10 pointer-events-none bg-black/50 transition-opacity" />
            <div className="hidden md:block absolute inset-x-0 bottom-0 h-1/2 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none transition-opacity" />
          </>
        )}

        {/* Fullscreen / Rotate Toggle Button (Phone Only) */}
        <div className="md:hidden absolute bottom-3 right-3 z-[60]">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/50 hover:bg-black/80 backdrop-blur-sm rounded-full text-white/90 transition-all shadow-md pointer-events-auto cursor-pointer"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* Overlays Scene Manager */}
      {!isFullscreen && (
        <div className="relative w-full flex-1 flex flex-col z-20 overflow-y-auto md:overflow-hidden custom-scrollbar smooth-scroll transition-all duration-300 md:absolute md:inset-0 bg-black md:bg-transparent">
          <AnimatePresence mode="wait">
            {scene === 1 && (
              <motion.div
                key="scene1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: sceneTransitionDuration, ease: FRAMER_CROSSFADE_EASE }}
                className="flex flex-col px-4 py-5 md:p-12 lg:p-16 w-full grow md:absolute md:inset-0 z-20 shrink-0"
              >
                {/* Top Navigation */}
                <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start w-full relative min-h-[60px] md:min-h-[100px] gap-3 md:gap-0">
                  {/* "Join The Journey" top-left */}
                  <motion.button
                    onClick={() => navigate('/about-the-film')}
                    whileHover={{ scale: 1.05 }}
                    className="text-xl md:text-[26px] font-bold cursor-pointer text-center md:text-left hover:text-white/80 transition-colors relative z-10"
                    style={{ pointerEvents: 'auto' }}
                  >
                    Join The Journey
                  </motion.button>

                  {/* "A DREAM" top center */}
                  <div className="w-full flex justify-center pointer-events-none md:absolute mt-6 md:mt-0 z-0">
                    <h1 className="text-[3rem] sm:text-6xl md:text-8xl font-normal luxurious-roman-regular text-center leading-none shadow-black drop-shadow-md">
                      A DREAM
                    </h1>
                  </div>
                </div>

                {/* Bottom Credits Block */}
                <div className="mt-6 md:mt-auto mx-auto w-full max-w-5xl text-center flex flex-col items-center justify-end pb-1 md:pb-2">
                  <div className="flex flex-col items-center space-y-1 mb-6">
                    <h2 className="text-3xl md:text-[40px] font-normal leading-tight">
                      A Film
                    </h2>
                    <p className="text-2xl md:text-[28px] font-normal leading-tight">
                      Inspired by true events
                    </p>
                    <p className="text-2xl md:text-[28px] font-normal leading-tight">
                      Written by Ohitiin
                    </p>
                  </div>
                  <p className="text-[17px] md:text-[20px] max-w-4xl mx-auto text-center leading-snug font-normal text-white">
                    After losing her family during the collapse of communism in
                    Albania in 1991, a teenage girl

                    is bound for a foreign land with nothing left but a
                    dream—leading her toward the last

                    thing she ever dreamed of: love.
                  </p>
                </div>
              </motion.div>
            )}

            {scene === 2 && (
              <motion.div
                key="scene2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: sceneTransitionDuration, ease: FRAMER_CROSSFADE_EASE }}
                className="flex flex-col px-4 py-5 md:p-12 lg:p-16 w-full grow md:absolute md:inset-0 z-20 shrink-0"
              >
                {/* Top Navigation */}
                <div className="flex justify-center md:justify-between items-center md:items-start w-full relative min-h-[100px]">
                  <motion.button
                    onClick={() => navigate('/why-this-film')}
                    whileHover={{ scale: 1.05 }}
                    className="text-xl md:text-[22px] font-bold cursor-pointer text-center md:text-left leading-tight hover:text-white/80 transition-colors relative z-10"
                    style={{ pointerEvents: 'auto' }}
                  >
                    Join The Journey
                    <br />
                    Further
                  </motion.button>
                </div>

                {/* Bottom Story Block */}
                <div className="mt-6 md:mt-auto mx-auto w-full max-w-7xl text-center">
                  <h2 className="text-3xl md:text-[40px] font-normal mb-6">
                    About The film A Dream
                  </h2>
                  <p className="text-[17px] md:text-[20px] mx-auto leading-snug font-normal text-white text-justify md:text-center">
                    A Dream is a story about what remains after everything familiar is taken away. Set in 1991 against the collapse of communism in Albania, it follows Jalin, a teenage girl taken into a foreign country she never chose, with nothing left but a simple dream of one day owning her own coffee shop. As she rebuilds her life through work, human connection, and a profound love that reshapes her understanding of belonging, the film explores how purpose can take root even in the aftermath of loss. It's a story of survival, chance, and the courage to believe in a future shaped by one's own hands—even when time is limited.
                  </p>
                </div>
              </motion.div>
            )}

            {scene === 3 && (
              <motion.div
                key="scene3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: sceneTransitionDuration, ease: FRAMER_CROSSFADE_EASE }}
                className="flex flex-col px-4 py-5 md:p-12 lg:p-16 w-full grow md:absolute md:inset-0 z-20 shrink-0"
              >
                {/* Top Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full relative gap-5 md:gap-0">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xl md:text-[18px] font-bold cursor-pointer text-center md:text-center leading-tight hover:text-white/80 transition-colors"
                    style={{ pointerEvents: 'auto' }}
                  >
                    You Can Also Follow The
                    <br />
                    Journey On Instagram
                  </a>

                  <div className="text-xl md:text-[18px] font-normal text-center leading-tight">
                    If This Story Resonates With YOU,
                    <br />
                    Join Us As A DREAM
                    <br />
                    Moves Toward The Screen.
                  </div>
                </div>

                {/* Bottom Story Block */}
                <div className="mt-6 md:mt-auto mx-auto w-full max-w-7xl text-center">
                  <h2 className="text-3xl md:text-[40px] font-normal mb-6">
                    Why This Film
                  </h2>
                  <p className="text-[17px] md:text-[20px] mx-auto leading-snug font-normal text-white text-justify md:text-center">
                    I decided to write A DREAM after a woman trusted me with a part of her life, in her own words. We met by chance in a coffee shop in Rome, and over time she began to share fragments of a story she wasn't sure she was ready to tell. When she finally asked me to write it, she didn't ask lightly—and I promised I would. This film exists to honor that promise, and to give voice to a life shaped by loss, resilience, love, and an unwavering dream.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Chatbot isFullscreen={isFullscreen} />
    </div>
  );
};

export default CinematicTrailer;
