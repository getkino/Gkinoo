
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function SimpleHlsPlayer({ url }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }
    // Otomatik tam ekran fonksiyonu
    function requestFullscreen() {
      if (!video) return;
      if (video.requestFullscreen) return video.requestFullscreen();
      if (video.webkitRequestFullscreen) return video.webkitRequestFullscreen();
      if (video.mozRequestFullScreen) return video.mozRequestFullScreen();
      if (video.msRequestFullscreen) return video.msRequestFullscreen();
    }
    video.addEventListener('loadeddata', requestFullscreen);
    return () => {
      if (hls) hls.destroy();
      video.removeEventListener('loadeddata', requestFullscreen);
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      style={{ width: '100%', height: '100%' }}
    />
  );
}
