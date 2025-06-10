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

    const isM3U = url.includes('.m3u') || url.includes('.m3u8') || url.includes('application/vnd.apple.mpegurl');

    const setupShaka = async () => {
      try {
        shaka.polyfill.installAll();
        const player = new shaka.Player(video);
        playerRef.current = player;

        await player.load(url);
        const tracks = player.getVariantTracks();
        setQualities(tracks);
        player.configure({ abr: { enabled: true } });
      } catch (err) {
        console.warn('Shaka failed, trying HLS.js fallback:', err);
        fallbackToHlsOrNative();
      }
    };

    const fallbackToHlsOrNative = () => {
      if (isM3U && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        video.src = url;
      }
    };

    if (isM3U) {
      setupShaka();
    } else {
      video.src = url; // mp4, webm vs.
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

      {qualities.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          background: '#000000cc',
          padding: '10px',
          borderRadius: '10px',
          boxShadow: '0 0 10px #000'
        }}>
          <button onClick={handleAuto} style={{
            marginBottom: '8px',
            background: selectedQuality === 'auto' ? 'cyan' : '#222',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '5px',
            border: 'none'
          }}>Otomatik</button>

          {qualities.map((track) => (
            <button key={track.id} onClick={() => handleQualitySelect(track)} style={{
              margin: '4px 0',
              background: selectedQuality === track.id ? 'cyan' : '#222',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '5px',
              border: 'none'
            }}>
              {track.height}p
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
