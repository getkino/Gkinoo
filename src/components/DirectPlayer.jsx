import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

export default function DirectPlayer({ url }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video && video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }
    return () => { if (hls) hls.destroy(); };
  }, [url]);

  return <video ref={videoRef} controls autoPlay style={{ width: '100%', height: '100%' }} />;
}
