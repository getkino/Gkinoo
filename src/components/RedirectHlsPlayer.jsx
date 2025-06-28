import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function RedirectHlsPlayer({ url }) {
  const videoRef = useRef(null);
  const [realUrl, setRealUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: 'GET', redirect: 'follow' })
      .then(res => {
        if (!cancelled) setRealUrl(res.url);
      });
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (!realUrl) return;
    const video = videoRef.current;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(realUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = realUrl;
    }
    return () => { if (hls) hls.destroy(); };
  }, [realUrl]);

  return <video ref={videoRef} controls autoPlay style={{ width: '100%', height: '100%' }} />;
}
