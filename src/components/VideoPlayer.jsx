import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ url, fullscreen = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);

      return () => hls.destroy();
    }
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      style={{
        width: '100%',
        height: fullscreen ? '100vh' : '70vh',
        background: 'black',
        objectFit: 'contain'
      }}
    />
  );
}
