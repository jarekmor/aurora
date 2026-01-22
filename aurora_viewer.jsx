import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Loader2 } from 'lucide-react';

const BASE_URL = 'https://services.swpc.noaa.gov';
const JSON_URL = 'https://services.swpc.noaa.gov/products/animations/ovation_north_24h.json';

export default function AuroraViewer() {
  const [frames, setFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const intervalRef = useRef(null);

  // Fetch frame data
  useEffect(() => {
    fetch(JSON_URL)
      .then(res => res.json())
      .then(data => {
        setFrames(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load aurora data. Please refresh.');
        setLoading(false);
      });
  }, []);

  // Animation loop
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, fps, frames.length]);

  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);
  
  const prevFrame = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(prev => (prev - 1 + frames.length) % frames.length);
  }, [frames.length]);
  
  const nextFrame = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(prev => (prev + 1) % frames.length);
  }, [frames.length]);

  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setCurrentFrame(Math.floor(percent * frames.length));
  }, [frames.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        prevFrame();
      } else if (e.key === 'ArrowRight') {
        nextFrame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, prevFrame, nextFrame]);

  const currentData = frames[currentFrame];
  const progress = frames.length > 0 ? ((currentFrame + 1) / frames.length) * 100 : 0;

  const formatTime = (timeTag) => {
    if (!timeTag) return '--:-- CET';
    const date = new Date(timeTag);
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Warsaw'
    };
    return date.toLocaleString('en-US', options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-cyan-400 mb-2 text-center drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
        🌌 Northern Lights Aurora Forecast
      </h1>
      <p className="text-slate-400 mb-6 text-sm">NOAA OVATION Model - 24 Hour Animation</p>

      <div className="bg-slate-900/80 rounded-2xl p-4 md:p-6 shadow-2xl shadow-cyan-500/10 max-w-2xl w-full border border-slate-800">
        {/* Image Container */}
        <div className="relative aspect-square bg-black rounded-xl overflow-hidden mb-4">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              <span className="ml-3 text-cyan-400">Loading aurora data...</span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-400">
              {error}
            </div>
          ) : (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              )}
              <img
                src={currentData ? BASE_URL + currentData.url : ''}
                alt="Aurora forecast"
                className={`w-full h-full object-contain transition-opacity duration-150 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </>
          )}
        </div>

        {/* Time Display */}
        <div className="text-center text-cyan-400 font-mono mb-4 text-sm md:text-base">
          {formatTime(currentData?.time_tag)}
        </div>

        {/* Progress Bar */}
        <div 
          className="w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer mb-4 hover:h-3 transition-all"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={prevFrame}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-cyan-500/50"
          >
            <SkipBack className="w-5 h-5 text-slate-300" />
          </button>
          <button
            onClick={togglePlay}
            className={`p-3 px-6 rounded-lg transition-all border ${
              isPlaying 
                ? 'bg-emerald-900/50 border-emerald-500/50 hover:bg-emerald-800/50' 
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-cyan-500/50'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-emerald-400" />
            ) : (
              <Play className="w-5 h-5 text-slate-300" />
            )}
          </button>
          <button
            onClick={nextFrame}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-cyan-500/50"
          >
            <SkipForward className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <label className="text-slate-400 text-sm">Speed:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
            className="w-32 accent-cyan-400"
          />
          <span className="text-cyan-400 text-sm w-16">{fps} fps</span>
        </div>

        {/* Frame Counter */}
        <div className="text-center text-slate-500 text-sm">
          Frame {currentFrame + 1} / {frames.length || '...'}
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400 leading-relaxed">
          <strong className="text-slate-300">About:</strong> This animation shows the OVATION Aurora Forecast 
          model predictions for aurora borealis visibility over the Northern Hemisphere. 
          Brighter colors indicate higher probability of aurora visibility.
          <br /><br />
          <strong className="text-slate-300">Controls:</strong> Space = play/pause, Arrow keys = prev/next frame
          <br /><br />
          <strong className="text-slate-300">Source:</strong>{' '}
          <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            NOAA Space Weather Prediction Center
          </a>
        </div>
      </div>
    </div>
  );
}
