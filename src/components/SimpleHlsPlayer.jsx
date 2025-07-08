import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const LANG_MAP = {
  tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', fr: 'Fransızca',
  es: 'İspanyolca', it: 'İtalyanca', ar: 'Arapça', ru: 'Rusça',
  ja: 'Japonca', ko: 'Korece', fa: 'Farsça', zh: 'Çince',
};

function formatTime(seconds) {
  if (isNaN(seconds)) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s}`;
}

export default function AdvancedHlsPlayer({ url }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFit, setIsFit] = useState('contain');

  const [selectedAudio, setSelectedAudio] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState(-1);
  const [audioTracks, setAudioTracks] = useState([]);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [qualityLevels, setQualityLevels] = useState([]);

  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [showSubtitleOptions, setShowSubtitleOptions] = useState(false);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [showQualityOptions, setShowQualityOptions] = useState(false);

  const [notification, setNotification] = useState('');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progressBarVisible, setProgressBarVisible] = useState(true);
  const [notificationTimer, setNotificationTimer] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = document.getElementById('player-container');
    if (!video || !container) return;

    video.tabIndex = 0;
    video.focus();
    container.requestFullscreen?.().then(() => setIsFullscreen(true));

    const hls = new Hls();
    hlsRef.current = hls;
    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
      setAudioTracks(data.audioTracks);
      const lang = navigator.language.split('-')[0];
      const idx = data.audioTracks.findIndex(t => t.lang === lang);
      if (idx >= 0) {
        hls.audioTrack = idx;
        setSelectedAudio(idx);
      }
    });

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
      setSubtitleTracks(data.subtitleTracks);
      hls.subtitleTrack = -1;
      setSelectedSubtitle(-1);
      const tracks = video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'disabled';
      }
    });

    hls.on(Hls.Events.LEVELS_UPDATED, (_, data) => {
      setQualityLevels(data.levels);
    });

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setProgress((video.currentTime / video.duration) * 100 || 0);
    };

    video.addEventListener('timeupdate', updateTime);
    return () => video.removeEventListener('timeupdate', updateTime);
  }, [url]);

  useEffect(() => {
    const onKeyDown = (e) => handleKeyPress(e);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleKeyPress = (e) => {
    const video = videoRef.current;
    if (!video) return;

    switch (e.key) {
      case 'ArrowUp':
        video.volume = Math.min(1, video.volume + 0.1);
        setVolume(video.volume);
        showNotification(`Ses %${Math.round(video.volume * 100)}`);
        break;
      case 'ArrowDown':
        video.volume = Math.max(0, video.volume - 0.1);
        setVolume(video.volume);
        showNotification(`Ses %${Math.round(video.volume * 100)}`);
        break;
      case 'ArrowRight':
        video.currentTime += 15;
        showNotification('⏩ 15 saniye ileri');
        break;
      case 'ArrowLeft':
        video.currentTime -= 15;
        showNotification('⏪ 15 saniye geri');
        break;
      case ' ':
      case 'Enter':
        video.paused ? video.play() : video.pause();
        showNotification(video.paused ? '⏸️ Duraklat' : '▶️ Oynat');
        break;
      case 't':
        toggleFit();
        break;
    }
  };

  const toggleFit = () => {
    setIsFit((prev) => {
      const next = prev === 'contain' ? 'cover' : 'contain';
      showNotification(next === 'contain' ? 'Fit: Sığdır' : 'Fit: Doldur');
      return next;
    });
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationVisible(true);
    setTimeout(() => setNotificationVisible(false), 2000);
  };

  const showControls = () => {
    setControlsVisible(true);
    setProgressBarVisible(true);
    clearTimeout(notificationTimer);
    setNotificationTimer(setTimeout(() => {
      setControlsVisible(false);
      setProgressBarVisible(false);
    }, 3000));
  };

  useEffect(() => {
    const onMouseMove = () => showControls();
    const onTouchStart = () => showControls();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchstart', onTouchStart);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, [notificationTimer]);

  useEffect(() => {
    let frame;
    const pollGamepad = () => {
      const gp = navigator.getGamepads?.()[0];
      if (gp) {
        if (gp.buttons[0]?.pressed) {
          const video = videoRef.current;
          video.paused ? video.play() : video.pause();
          showNotification(video.paused ? '⏸️ Duraklat' : '▶️ Oynat');
        }
        if (gp.buttons[1]?.pressed) toggleFit();
        if (gp.buttons[15]?.pressed) {
          videoRef.current.currentTime += 10;
          showNotification('⏩ Gamepad sağ');
        }
        if (gp.buttons[14]?.pressed) {
          videoRef.current.currentTime -= 10;
          showNotification('⏪ Gamepad sol');
        }
      }
      frame = requestAnimationFrame(pollGamepad);
    };
    frame = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(frame);
  }, []);
  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    if (!isNaN(newTime) && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeToggle = () => {
    const newVolume = volume === 0 ? 1 : 0;
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
    showNotification(newVolume === 0 ? '🔇 Ses Kapalı' : `🔊 Ses %${Math.round(newVolume * 100)}`);
  };

  const handleQualityChange = (e) => {
    const level = parseInt(e.target.value, 10);
    if (hlsRef.current) {
      if (level === -1) {
        hlsRef.current.autoLevelEnabled = true;
      } else {
        hlsRef.current.autoLevelEnabled = false;
        hlsRef.current.currentLevel = level;
      }
    }
  };

  const buttonStyle = {
    background: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    borderRadius: '50%',
    padding: '10px',
    cursor: 'pointer',
  };

  const selectStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    padding: '6px 10px',
    cursor: 'pointer',
  };

  return (
    <div
      id="player-container"
      style={{ position: 'relative', background: '#000', width: '100%', height: '100%' }}
    >
      <video
        ref={videoRef}
        tabIndex="0"
        autoPlay
        controls={false}
        style={{ width: '100%', height: '100%', objectFit: isFit }}
      />
      <style>{`
        video::cue {
          background: rgba(0, 0, 0, 0.35);
          color: white;
          font-size: 16px;
          text-shadow: 1px 1px 3px black;
        }
      `}</style>

      {/* Bildirim */}
      {notificationVisible && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '5px',
          zIndex: 200,
        }}>
          {notification}
        </div>
      )}

      {/* Süre & Progress Bar */}
      {progressBarVisible && (
        <>
          <div style={{
            position: 'absolute',
            bottom: '100px',
            left: '12px',
            color: '#fff',
            fontSize: '14px',
            background: 'rgba(0,0,0,0.6)',
            padding: '4px 8px',
            borderRadius: '4px',
            zIndex: 100,
            transition: 'opacity 0.4s ease-in-out',
          }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div
            onClick={seekTo}
            style={{
              position: 'absolute',
              bottom: '90px',
              left: 0,
              width: '100%',
              height: '6px',
              background: '#111',
              cursor: 'pointer',
              zIndex: 99,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(to right, #e50914, #b81d24)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </>
      )}

      {/* Animasyonlu Kontroller */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '12px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        zIndex: 100,
        opacity: controlsVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: controlsVisible ? 'auto' : 'none',
      }}>
        <button onClick={handleVolumeToggle} style={buttonStyle}>
          <span className="material-icons" style={{ color: '#fff' }}>
            {volume === 0 ? 'volume_off' : 'volume_up'}
          </span>
        </button>

        <button onClick={() => setShowSpeedOptions(!showSpeedOptions)} style={buttonStyle}>
          <span className="material-icons" style={{ color: '#fff' }}>speed</span>
        </button>
        {showSpeedOptions && (
          <select value={playbackRate} onChange={(e) => {
            const rate = parseFloat(e.target.value);
            setPlaybackRate(rate);
            if (videoRef.current) videoRef.current.playbackRate = rate;
          }} style={selectStyle}>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        )}

        <button onClick={() => setShowLangOptions(!showLangOptions)} style={buttonStyle}>
          <span className="material-icons" style={{ color: '#fff' }}>language</span>
        </button>
        {showLangOptions && (
          <select value={selectedAudio} onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            setSelectedAudio(idx);
            if (hlsRef.current) hlsRef.current.audioTrack = idx;
          }} style={selectStyle}>
            {audioTracks.map((track, idx) => (
              <option key={idx} value={idx}>
                {LANG_MAP[track.lang] || `Dil ${idx + 1}`}
              </option>
            ))}
          </select>
        )}

        <button onClick={() => setShowSubtitleOptions(!showSubtitleOptions)} style={buttonStyle}>
          <span className="material-icons" style={{ color: '#fff' }}>subtitles</span>
        </button>
        {showSubtitleOptions && (
          <select value={selectedSubtitle} onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            setSelectedSubtitle(idx);
            if (hlsRef.current) hlsRef.current.subtitleTrack = idx;
            const tracks = videoRef.current?.textTracks;
            if (tracks && tracks[idx]) tracks[idx].mode = 'showing';
          }} style={selectStyle}>
            <option value={-1}>Altyazı Yok</option>
            {subtitleTracks.map((track, idx) => (
              <option key={idx} value={idx}>
                {LANG_MAP[track.lang] || `Dil ${idx + 1}`}
              </option>
            ))}
          </select>
        )}

        <button onClick={() => setShowQualityOptions(!showQualityOptions)} style={buttonStyle}>
          <span className="material-icons" style={{ color: '#fff' }}>hd</span>
        </button>
        {showQualityOptions && (
          <select onChange={handleQualityChange} style={selectStyle}>
            <option value={-1}>Otomatik</option>
            {qualityLevels.map((level, idx) => (
              <option key={idx} value={idx}>
                {level.height}p
              </option>
            ))}
          </select>
        )}

        <button onClick={toggleFit} style={buttonStyle}>
          <span className="material-icons" style={{ color: '#fff' }}>fit_screen</span>
        </button>
      </div>
    </div>
  );
}