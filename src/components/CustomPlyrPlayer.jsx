// src/components/CustomPlyrPlayer.jsx
import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

export default function CustomPlyrPlayer({ url, onExit }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    // Destroy previous Plyr and Hls instances if any
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }

    playerRef.current = new Plyr(video, {
      controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
      keyboard: { focused: true, global: true },
    });

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onExit?.();
        playerRef.current?.pause();
        e.preventDefault();
      } else if (e.key === ' ') {
        playerRef.current?.togglePlay();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        playerRef.current?.forward?.(10);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        playerRef.current?.rewind?.(10);
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        playerRef.current?.volume = Math.min(1, playerRef.current?.volume + 0.1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        playerRef.current?.volume = Math.max(0, playerRef.current?.volume - 0.1);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      playerRef.current?.destroy();
      hlsRef.current?.destroy();
      window.removeEventListener('keydown', handleKey);
    };
  }, [url, onExit]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'black' }}>
      <video
        ref={videoRef}
        className="plyr-react plyr"
        playsInline
        controls
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
