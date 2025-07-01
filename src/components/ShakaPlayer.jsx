import { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';

export default function ShakaPlayer({ url, onExit }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [qualities, setQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [audioLanguages, setAudioLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState('off');

  useEffect(() => {
    const video = videoRef.current;

    const setupShaka = async () => {
      try {
        const player = new shaka.Player(video);
        playerRef.current = player;
        shaka.polyfill.installAll();

        await player.load(url);
        // Kalite seçeneklerinde tekrarları kaldır
        const tracks = player.getVariantTracks();
        const uniqueTracks = [];
        const seen = new Set();
        for (const t of tracks) {
          const key = `${t.height}-${t.bandwidth}`;
          if (!seen.has(key)) {
            uniqueTracks.push(t);
            seen.add(key);
          }
        }
        setQualities(uniqueTracks);
        player.configure({ abr: { enabled: true } });

        // Ses dilleri
        const langs = player.getAudioLanguages();
        setAudioLanguages(langs);
        setSelectedLanguage(langs[0] || '');

        // Altyazı dilleri
        const textTracks = player.getTextTracks();
        setSubtitleTracks(textTracks);
        setSelectedSubtitle('off');

        requestFullscreen(video);
      } catch (err) {
        console.warn('Shaka failed, trying HLS.js fallback:', err);
        fallbackToHls();
      }
    };

    const fallbackToHls = () => {
      const video = videoRef.current;
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls();
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

  // Dil değiştir
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    playerRef.current?.selectAudioLanguage(lang);
  };

  // Altyazı değiştir
  const handleSubtitleChange = (id) => {
    setSelectedSubtitle(id);
    if (id === 'off') {
      playerRef.current?.setTextTrackVisibility(false);
    } else {
      playerRef.current?.selectTextTrack(subtitleTracks.find(t => t.id === id));
      playerRef.current?.setTextTrackVisibility(true);
    }
  };

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
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'black',
        position: 'relative'
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        controls
        style={{ width: '100%', height: '100%' }}
        crossOrigin="anonymous"
      >
        {/* Altyazıların video elementinde görünmesi için text track ekle */}
        {subtitleTracks.length > 0 && subtitleTracks.map(track => (
          <track
            key={track.id}
            kind="subtitles"
            srcLang={track.language}
            label={
              track.language.toLowerCase().startsWith('tr') ? 'Türkçe'
              : track.language.toLowerCase().startsWith('en') ? 'İngilizce'
              : track.language.toLowerCase().startsWith('de') ? 'Almanca'
              : track.language.toLowerCase().startsWith('fr') ? 'Fransızca'
              : track.language.toLowerCase().startsWith('ar') ? 'Arapça'
              : track.language.toUpperCase()
            }
            // src yok, shaka kendi ekliyor, sadece görünürlük için
            default={selectedSubtitle === track.id}
          />
        ))}
      </video>
      {/* Kalite, Dil ve Altyazı Seçimi */}
      <div
        style={{
          position: 'fixed', // Tam ekran modunda da görünür
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          background: '#000000cc',
          padding: '10px',
          borderRadius: '10px',
          minWidth: '120px',
          zIndex: 10000 // Tam ekran üstünde kalır
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
        {/* Dil seçimi */}
        {audioLanguages.length > 1 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#fff', fontSize: '0.95em', marginBottom: 4 }}>Dil:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {audioLanguages.map(lang => {
                // Kısa kodları daha açıklayıcı göster
                let label = lang;
                if (lang.toLowerCase().startsWith('tr')) label = 'Türkçe';
                else if (lang.toLowerCase().startsWith('en')) label = 'İngilizce';
                else if (lang.toLowerCase().startsWith('de')) label = 'Almanca';
                else if (lang.toLowerCase().startsWith('fr')) label = 'Fransızca';
                else if (lang.toLowerCase().startsWith('ar')) label = 'Arapça';
                // Diğer diller için kodu büyük harfli göster
                else label = lang.toUpperCase();

                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    style={{
                      ...buttonStyle(selectedLanguage === lang),
                      padding: '4px 10px',
                      fontSize: '0.98em',
                      background: selectedLanguage === lang ? '#4fc3f7' : '#222',
                      color: selectedLanguage === lang ? '#222' : '#fff',
                      border: selectedLanguage === lang ? '2px solid #4fc3f7' : '1px solid #444',
                      fontWeight: selectedLanguage === lang ? 700 : 400,
                      margin: 0,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Altyazı seçimi */}
        {subtitleTracks.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#fff', fontSize: '0.95em', marginBottom: 4 }}>Altyazı:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleSubtitleChange('off')}
                style={{
                  ...buttonStyle(selectedSubtitle === 'off'),
                  padding: '4px 10px',
                  fontSize: '0.98em',
                  background: selectedSubtitle === 'off' ? '#4fc3f7' : '#222',
                  color: selectedSubtitle === 'off' ? '#222' : '#fff',
                  border: selectedSubtitle === 'off' ? '2px solid #4fc3f7' : '1px solid #444',
                  fontWeight: selectedSubtitle === 'off' ? 700 : 400,
                  margin: 0,
                }}
              >
                Kapalı
              </button>
              {subtitleTracks.map(track => {
                let label = track.language;
                if (label.toLowerCase().startsWith('tr')) label = 'Türkçe';
                else if (label.toLowerCase().startsWith('en')) label = 'İngilizce';
                else if (label.toLowerCase().startsWith('de')) label = 'Almanca';
                else if (label.toLowerCase().startsWith('fr')) label = 'Fransızca';
                else if (label.toLowerCase().startsWith('ar')) label = 'Arapça';
                else label = label.toUpperCase();
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSubtitleChange(track.id)}
                    style={{
                      ...buttonStyle(selectedSubtitle === track.id),
                      padding: '4px 10px',
                      fontSize: '0.98em',
                      background: selectedSubtitle === track.id ? '#4fc3f7' : '#222',
                      color: selectedSubtitle === track.id ? '#222' : '#fff',
                      border: selectedSubtitle === track.id ? '2px solid #4fc3f7' : '1px solid #444',
                      fontWeight: selectedSubtitle === track.id ? 700 : 400,
                      margin: 0,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* Altyazı arkaplanı için stil ekle */}
      <style>
        {`
          video::cue {
            background: rgba(0, 0, 0, 0.06) !important;
            color: #fff !important;
            font-size: 1.15em;
            text-shadow: 1px 1px 2px #222;
            border-radius: 6px;
          }
        `}
      </style>
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
