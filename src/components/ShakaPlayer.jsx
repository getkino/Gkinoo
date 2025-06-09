import { useEffect, useRef } from 'react';
import shaka from 'shaka-player';

export default function ShakaPlayer({ url, onExit }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const player = new shaka.Player(videoRef.current);

    shaka.polyfill.installAll();

    player.addEventListener('error', e => {
      console.error('Shaka Player Error', e.detail);
    });

    player.load(url).catch(err => console.error('Shaka load error', err));

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onExit?.();
        player.pause();
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      player.destroy();
    };
  }, [url, onExit]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        controls
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
