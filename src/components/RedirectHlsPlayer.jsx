import React, { useEffect, useRef, useState } from 'react';

// Yardımcı: URL'i query string'den alma
function getSrcFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('url') || params.get('src') || null;
  } catch {
    return null;
  }
}

// Yardımcı: HTTP yönlendirmesini (varsa) çözmeye çalış
async function resolveRedirect(inputUrl, timeoutMs = 8000) {
  const tryWith = async (method) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(inputUrl, {
        method,
        redirect: 'follow',
        // CORS engellenirse hata alırız, bu durumda orijinal URL ile devam edeceğiz
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.url || inputUrl;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  try {
    return await tryWith('HEAD');
  } catch {
    try {
      return await tryWith('GET');
    } catch {
      return inputUrl;
    }
  }
}

export default function RedirectHlsPlayer({ src }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [finalUrl, setFinalUrl] = useState(null);
  const [status, setStatus] = useState('init'); // init | resolving | ready
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const input = src || getSrcFromQuery();

    if (!input) {
      setError('Oynatılacak adres bulunamadı. URL için ?url= parametresini kullanın veya src prop verin.');
      return;
    }

    setStatus('resolving');
    setError(null);

    resolveRedirect(input)
      .then((u) => {
        if (!mounted) return;
        setFinalUrl(u || input);
        setStatus('ready');
      })
      .catch(() => {
        if (!mounted) return;
        // Yönlendirme çözülemediyse orijinal URL ile devam
        setFinalUrl(input);
        setStatus('ready');
      });

    return () => {
      mounted = false;
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, [src]);

  useEffect(() => {
    if (status !== 'ready' || !finalUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Native HLS desteği (Safari vb.)
    const canNative = video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl');
    if (canNative === 'probably' || canNative === 'maybe') {
      video.src = finalUrl;
      video.play?.().catch(() => {});
      return;
    }

    // hls.js ile oynatmayı deneyelim (paket projede kurulu olmalı)
    (async () => {
      try {
        const mod = await import('hls.js');
        const Hls = mod?.default || mod;
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 120 });
          hlsRef.current = hls;

          hls.attachMedia(video);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(finalUrl);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data?.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  try { hls.destroy(); } catch {}
                  setError('HLS oynatımında kritik bir hata oluştu.');
              }
            }
          });
        } else {
          setError('Bu tarayıcı HLS oynatmayı desteklemiyor.');
        }
      } catch (e) {
        // hls.js projeye ekli değilse buraya düşer
        setError('hls.js bulunamadı. Projeye hls.js ekleyin veya native HLS destekleyen bir tarayıcı kullanın.');
      }
    })();
  }, [status, finalUrl]);

  const openExternally = () => {
    if (finalUrl) window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {status !== 'ready' && (
        <div style={{ padding: 12, fontSize: 14 }}>Yükleniyor / yönlendirme çözülüyor...</div>
      )}

      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        muted
        style={{ width: '100%', height: '100%', background: '#000' }}
      />

      {(error || finalUrl) && (
        <div style={{ padding: 8, fontSize: 12, color: '#444' }}>
          {finalUrl && (
            <span style={{ marginRight: 8 }}>Kaynak: {finalUrl}</span>
          )}
          <button onClick={openExternally} style={{ padding: '4px 8px', cursor: 'pointer' }}>Yeni sekmede aç</button>
          {error && (
            <div style={{ marginTop: 6, color: '#c00' }}>{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
