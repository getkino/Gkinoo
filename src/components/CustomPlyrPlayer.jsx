// src/components/CustomPlyrPlayer.jsx
import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

export default function CustomPlyrPlayer({ url, onExit }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
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
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      playerRef.current?.destroy();
      window.removeEventListener('keydown', handleKey);
    };
  }, [url, onExit]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'black' }}>
      <video ref={videoRef} className="plyr-react plyr" playsInline controls />
    </div>
  );
}
