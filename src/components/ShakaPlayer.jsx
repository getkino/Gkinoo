// src/components/ShakaPlayer.jsx
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

    const setupShaka = () => {
      const player = new shaka.Player(video);
      playerRef.current = player;

      shaka.polyfill.installAll();

      player.addEventListener('error', e => console.error('Shaka error', e.detail));

      player.load(url).then(() => {
        const tracks = player.getVariantTracks();
        setQualities(tracks);
        player.configure({ abr: { enabled: true } });
      });
    };

    const fallbackToHls = () => {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      }
    };

    try {
      setupShaka();
    } catch (err) {
      console.warn('Shaka failed, trying HLS.js fallback:', err);
      fallbackToHls();
    }

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        video.pause();
        onExit?.();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      playerRef.current?.destroy();
    };
  }, [url, onExit]);

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

      {/* Kalite Seçim Paneli */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          background: '#000000cc',
          padding: '10px',
          borderRadius: '10px',
          boxShadow: '0 0 10px #000'
        }}
      >
        <button
          onClick={handleAuto}
          style={{
            marginBottom: '8px',
            background: selectedQuality === 'auto' ? 'cyan' : '#222',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '5px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Otomatik
        </button>

        {qualities.map((track) => (
          <button
            key={track.id}
            onClick={() => handleQualitySelect(track)}
            style={{
              margin: '4px 0',
              background: selectedQuality === track.id ? 'cyan' : '#222',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {track.height}p
          </button>
        ))}
      </div>
    </div>
  );
} 
