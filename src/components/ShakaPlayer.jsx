import { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';
import Hls from 'hls.js';

export default function ShakaPlayer({ url, onExit }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [qualities, setQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');

  useEffect(() => {
    const video = videoRef.current;

    const setupShaka = async () => {
      try {
        const player = new shaka.Player(video);
        playerRef.current = player;
        shaka.polyfill.installAll();

        await player.load(url);
        const tracks = player.getVariantTracks();
        setQualities(tracks);
        player.configure({ abr: { enabled: true } });
        requestFullscreen(video);
      } catch (err) {
        console.warn('Shaka failed, trying HLS.js fallback:', err);
        fallbackToHls();
      }
    };

    const fallbackToHls = () => {
      const video = videoRef.current;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        requestFullscreen(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        requestFullscreen(video);
      }
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        document.exitFullscreen?.();
        video.pause();
        onExit?.();
      }
    };

    window.addEventListener('keydown', handleKey);
    setupShaka();

    return () => {
      window.removeEventListener('keydown', handleKey);
      playerRef.current?.destroy();
    };
  }, [url, onExit]);

  const requestFullscreen = (element) => {
    const request = element.requestFullscreen ||
                    element.webkitRequestFullscreen ||
                    element.mozRequestFullScreen ||
                    element.msRequestFullscreen;
    if (request) request.call(element);
  };

  const handleQualitySelect = (track) => {
    playerRef.current?.configure({ abr: { enabled: false } });
    playerRef.current?.selectVariantTrack(track, true);
    setSelectedQuality(track.id);
  };

  const handleAuto = () => {
    playerRef.current?.configure({ abr: { enabled: true } });
    setSelectedQuality('auto');
  };

  return (
    <div style={{ width: '100%', height: '100%', background: 'black', position: 'relative' }}>
      <video
        ref={videoRef}
        autoPlay
        controls
        style={{ width: '100%', height: '100%' }}
      />
      {/* Kalite Seçimi */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          background: '#000000cc',
          padding: '10px',
          borderRadius: '10px'
        }}
      >
        <button onClick={handleAuto} style={buttonStyle(selectedQuality === 'auto')}>Otomatik</button>
        {qualities.map(track => (
          <button
            key={track.id}
            onClick={() => handleQualitySelect(track)}
            style={buttonStyle(selectedQuality === track.id)}
          >
            {track.height}p
          </button>
        ))}
      </div>
    </div>
  );
}

const buttonStyle = (active) => ({
  margin: '4px 0',
  background: active ? 'cyan' : '#222',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '5px',
  cursor: 'pointer'
});
