import { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function VideoJSPlayer({ url }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const player = videojs(videoElement, {
      controls: true,
      autoplay: true,
      preload: 'auto',
      fluid: true,
      responsive: true,
      sources: [
        {
          src: url,
          type: 'application/x-mpegURL',
        },
      ],
    });

    playerRef.current = player;

    const handleKey = (e) => {
      const delta = 10;
      const v = playerRef.current;

      if (!v || v.paused) return;

      if (e.key === 'ArrowLeft') {
        v.currentTime(Math.max(v.currentTime() - delta, 0));
      } else if (e.key === 'ArrowRight') {
        v.currentTime(Math.min(v.currentTime() + delta, v.duration()));
      } else if (e.key === 'ArrowUp') {
        v.volume(Math.min(v.volume() + 0.1, 1));
      } else if (e.key === 'ArrowDown') {
        v.volume(Math.max(v.volume() - 0.1, 0));
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [url]);

  return (
    <div data-vjs-player style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        playsInline
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}