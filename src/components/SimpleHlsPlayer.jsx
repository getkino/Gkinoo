import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const LANG_MAP = {
  tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', fr: 'Fransızca', ar: 'Arapça',
  ru: 'Rusça', es: 'İspanyolca', it: 'İtalyanca', fa: 'Farsça', zh: 'Çince',
  ja: 'Japonca', ko: 'Korece', ku: 'Kürtçe', az: 'Azerice', sq: 'Arnavutça',
  bg: 'Bulgarca', el: 'Yunanca', nl: 'Flemenkçe', pl: 'Lehçe', pt: 'Portekizce',
  ro: 'Romence', sv: 'İsveççe', uk: 'Ukraynaca',
};

function getLangLabel(track, idx, prefix = '') {
  if (track.lang && LANG_MAP[track.lang]) return LANG_MAP[track.lang];
  if (track.name && track.name.length < 20 && !/\d/.test(track.name)) return track.name;
  if (track.lang && track.lang.length <= 3) return track.lang.toUpperCase();
  return `${prefix}${track.id ?? idx + 1}`;
}

export default function SimpleHlsPlayer({ url, videoTitle }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(-1);
  const [toastMsg, setToastMsg] = useState('');
  const [volume, setVolume] = useState(1); // Ses seviyesi durumu
  const [objectFit, setObjectFit] = useState('contain'); // Görüntü fit seçeneği
  const [playbackRate, setPlaybackRate] = useState(1); // Hız ayarı

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        hls.currentLevel = -1;
        hls.subtitleTrack = -1;
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        setAudioTracks(data.audioTracks);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
        setSubtitleTracks(data.subtitleTracks);
        setSelectedSubtitleTrack(-1);
        hls.subtitleTrack = -1;
      });
    } else {
      video.src = url;
    }

    const handleKey = (e) => {
      if (!video) return;
      if (e.key === 'ArrowLeft') {
        video.currentTime = Math.max(video.currentTime - 10, 0);
        showToast('Replay 10');
      } else if (e.key === 'ArrowRight') {
        video.currentTime = Math.min(video.currentTime + 10, video.duration);
        showToast('Forward 10');
      } else if (e.key === 'ArrowUp') {
        handleVolumeChange('up');
        showToast('volume_up');
      } else if (e.key === 'ArrowDown') {
        handleVolumeChange('down');
        showToast('volume_down');
      }
    };

    const showToast = (icon) => {
      setToastMsg(icon);
      setTimeout(() => setToastMsg(''), 1500); // Mesajı 1.5 saniye sonra kaybolmasını sağla
    };

    const enterFullscreen = () => {
      const container = containerRef.current;
      if (!container) return;

      if (container.requestFullscreen) container.requestFullscreen();
      else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
      else if (container.mozRequestFullScreen) container.mozRequestFullScreen();
      else if (container.msRequestFullscreen) container.msRequestFullscreen();
    };

    video.addEventListener('loadeddata', enterFullscreen);
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      video.removeEventListener('loadeddata', enterFullscreen);
      if (hls) hls.destroy();
    };
  }, [url]);

  // Ses seviyesi değişimini kontrol et
  const handleVolumeChange = (action) => {
    const video = videoRef.current;
    if (!video) return;
    if (action === 'up') {
      const newVolume = Math.min(video.volume + 0.1, 1);
      setVolume(newVolume);
      video.volume = newVolume;
    } else if (action === 'down') {
      const newVolume = Math.max(video.volume - 0.1, 0);
      setVolume(newVolume);
      video.volume = newVolume;
    }
  };

  // Görüntü fit seçeneklerini değiştir
  const handleObjectFitChange = () => {
    const fitOptions = ['contain', 'cover', 'fill', 'none'];
    const currentIndex = fitOptions.indexOf(objectFit);
    const nextIndex = (currentIndex + 1) % fitOptions.length;
    const newFit = fitOptions[nextIndex];
    setObjectFit(newFit);
    showToast(newFit); // Toast mesajını güncelle
  };

  // Hız ayarı
  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    const video = videoRef.current;
    if (video) {
      video.playbackRate = newRate;
    }
  };

  return (
    <div ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
        backgroundColor: '#121212', // Dark mode için uygun arka plan
      }}
    >
      <style>{`
        video::cue {
          background: rgba(0, 0, 0, 0.14) !important;
          color: white !important;
          font-size: 1.2em;
          text-shadow: 0 1px 2px black;
        }
        :fullscreen {
          width: 100vw;
          height: 100vh;
        }
        video {
          object-fit: ${objectFit};
        }
        .material-icons {
          font-size: 36px;
          color: #fff;
        }
        .player-controls {
          position: absolute;
          top: 20px; /* Üst kısma taşıdım */
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          z-index: 10;
        }
        .player-controls select,
        .player-controls button {
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 16px;
        }
        .player-controls button:hover,
        .player-controls select:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }
        .toast-message {
          position: absolute;
          top: 50%; /* Ortada */
          left: 50%;
          transform: translate(-50%, -50%); /* Tam ortalama */
          background: rgba(0,0,0,0.8);
          color: #fff;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 24px; /* İkon boyutu */
          z-index: 2000;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Geliştirilmiş açılır menü tasarımı */
        select {
          padding: 10px 18px;
          border-radius: 25px;
          background-color: rgba(30, 30, 30, 0.8);
          color: #ffffff;
          border: 1px solid #888;
          font-size: 14px;
          font-family: 'Segoe UI', sans-serif;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          min-width: 130px;
          text-align-last: center;
          transition: all 0.3s ease;
        }

        /* Hover ve focus için renk geçişleri */
        select:hover {
          background-color: rgba(50, 50, 50, 0.9);
          border-color: #ff9800;
        }

        select:focus {
          outline: none;
          border-color: #ff5722;
          box-shadow: 0 0 0 2px rgba(255, 87, 34, 0.4);
        }

        select::-ms-expand {
          display: none;
        }

        select::-webkit-appearance: none;

        /* Açılır menüde simge yerleştirme (arrow) */
        select {
          background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15"%3E%3Cpath fill="none" stroke="%23ffffff" stroke-width="2" d="M4 5l3 3 3-3"%3E%3C/path%3E%3C/svg%3E');
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 15px;
        }

        /* Dropdown içeriği (open state) */
        select:focus {
          background-color: rgba(50, 50, 50, 0.9);
          color: #ffffff;
        }

        /* Video başlık stili */
        .video-title {
          color: #fff;
          font-size: 24px;
          text-align: center;
          margin-bottom: 10px;
        }
      `}</style>

      {toastMsg && (
        <div className="toast-message">
          <i className="material-icons">{toastMsg === 'Replay 10' ? 'rewind' : toastMsg === 'Forward 10' ? 'fast_forward' : toastMsg}</i> {/* Sadece simge gösterilecek */}
        </div>
      )}

      {/* Video başlığı */}
      {videoTitle && (
        <div className="video-title">
          {videoTitle}
        </div>
      )}

      <div className="player-controls">
        <button onClick={() => window.history.back()}>
          <i className="material-icons">arrow_back</i> {/* Geri git butonu */}
        </button>

        {levels.length > 1 && (
          <select value={selectedLevel}
            onChange={(e) => {
              const level = parseInt(e.target.value, 10);
              setSelectedLevel(level);
              if (hlsRef.current) hlsRef.current.currentLevel = level;
            }}
          >
            <option value={-1}>Otomatik</option>
            {levels.map((level, idx) => (
              <option key={idx} value={idx}>
                {level.height ? `${level.height}p` : `Seviye ${idx + 1}`}
              </option>
            ))}
          </select>
        )}

        {audioTracks.length > 1 && (
          <select value={selectedAudioTrack}
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              setSelectedAudioTrack(id);
              if (hlsRef.current) hlsRef.current.audioTrack = id;
            }}
          >
            {audioTracks.map((track, idx) => (
              <option key={track.id ?? idx} value={track.id ?? idx}>
                {getLangLabel(track, idx, 'Dil ')}
              </option>
            ))}
          </select>
        )}

        {subtitleTracks.length > 0 && (
          <select value={selectedSubtitleTrack}
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              setSelectedSubtitleTrack(id);
              if (hlsRef.current) hlsRef.current.subtitleTrack = id;
            }}
          >
            <option value={-1}>Altyazı Kapalı</option>
            {subtitleTracks.map((track, idx) => (
              <option key={track.id ?? idx} value={track.id ?? idx}>
                {getLangLabel(track, idx, 'Altyazı ')}
              </option>
            ))}
          </select>
        )}

        {/* Görüntü seçenekleri */}
        <button onClick={handleObjectFitChange}>
          <i className="material-icons">aspect_ratio</i> {/* Aspect Ratio Ikonu */}
        </button>

        {/* Hız ayarı */}
        <select value={playbackRate} onChange={handlePlaybackRateChange}>
          <option value={1}>Normal</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>

      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: 0, // Video en altta
      }}>
        <video
          ref={videoRef}
          controls
          autoPlay
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
