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

export default function SimpleHlsPlayer({ url, title, groupTitle, groupChannels, onSelectChannel, onBack, tmdbInfo }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const buttonStates = useRef({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFit, setIsFit] = useState('contain');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState(-1);
  const [selectedButton, setSelectedButton] = useState('turkishDubbed');
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [audioTracks, setAudioTracks] = useState([]);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [showSubtitleOptions, setShowSubtitleOptions] = useState(false);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [showChannelList, setShowChannelList] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progressBarVisible, setProgressBarVisible] = useState(true);
  const [notificationTimer, setNotificationTimer] = useState(null);
  const [focusedChannelIndex, setFocusedChannelIndex] = useState(0);

  const enterFullscreen = () => {
    const container = document.getElementById('player-container');
    if (container?.requestFullscreen) {
      container.requestFullscreen().catch(err => {
        console.warn('Tam ekran başarısız:', err);
      });
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    enterFullscreen();
    video.tabIndex = 0;
    video.focus();

    const hls = new Hls();
    hlsRef.current = hls;
    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setIsLive(hls.levels[0]?.details?.live || isNaN(video.duration) || video.duration === Infinity);
    });

    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
      console.log('Ses parçaları:', data.audioTracks);
      setAudioTracks(data.audioTracks);
      const idx = data.audioTracks.findIndex(t => t.lang === 'tr');
      if (idx >= 0) {
        hls.audioTrack = idx;
        setSelectedAudio(idx);
        setSelectedButton('turkishDubbed');
      } else {
        console.warn('Türkçe ses parçası bulunamadı, varsayılan dil kullanılıyor');
        showNotification('Türkçe ses parçası mevcut değil');
        const lang = navigator.language.split('-')[0];
        const fallbackIdx = data.audioTracks.findIndex(t => t.lang === lang);
        if (fallbackIdx >= 0) {
          hls.audioTrack = fallbackIdx;
          setSelectedAudio(fallbackIdx);
          setSelectedButton('original');
        } else if (data.audioTracks.length > 0) {
          hls.audioTrack = 0;
          setSelectedAudio(0);
          setSelectedButton('original');
        }
      }
    });

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
      console.log('Altyazı parçaları:', data.subtitleTracks);
      setSubtitleTracks(data.subtitleTracks);
      hls.subtitleTrack = -1;
      setSelectedSubtitle(-1);
      const tracks = video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'disabled';
      }
    });

    hls.on(Hls.Events.LEVELS_UPDATED, (_, data) => {
      console.log('Kalite seviyeleri:', data.levels);
      setQualityLevels(data.levels);
      setSelectedQuality(-1);
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        console.error('HLS fatal hata:', data);
        showNotification('Hata: Video yüklenemedi');
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        console.warn('HLS medya hatası:', data);
        showNotification('Medya hatası, lütfen tekrar deneyin');
      }
    });

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setProgress((video.currentTime / video.duration) * 100 || 0);
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedProgress((bufferedEnd / video.duration) * 100 || 0);
      }
      setIsPlaying(!video.paused);
      setIsLive(isNaN(video.duration) || video.duration === Infinity);
    };

    const handleEnded = () => {
      setShowChannelList(true);
      showNotification('Video bitti, bir sonraki bölümü seçin');
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
      video.removeEventListener('ended', handleEnded);
      hls.destroy();
    };
  }, [url]);

  const handleLanguageChange = (type) => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!hls || !video) return;

    let newAudioIndex = selectedAudio;
    let newSubtitleIndex = -1;

    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'disabled';
    }

    switch (type) {
      case 'turkishDubbed':
        newAudioIndex = audioTracks.findIndex(track => track.lang === 'tr');
        if (newAudioIndex >= 0) {
          hls.audioTrack = newAudioIndex;
          setSelectedAudio(newAudioIndex);
        } else {
          console.warn('Türkçe ses parçası bulunamadı');
          showNotification('Türkçe ses parçası mevcut değil');
        }
        hls.subtitleTrack = -1;
        setSelectedSubtitle(-1);
        setSelectedButton('turkishDubbed');
        showNotification('Türkçe Dublaj');
        break;
      case 'turkishSubtitles':
        newAudioIndex = audioTracks.findIndex(track => track.lang === 'en');
        newSubtitleIndex = subtitleTracks.findIndex(track => track.lang === 'tr');
        if (newAudioIndex >= 0) {
          hls.audioTrack = newAudioIndex;
          setSelectedAudio(newAudioIndex);
        } else {
          console.warn('İngilizce ses parçası bulunamadı');
          showNotification('İngilizce ses parçası mevcut değil');
        }
        if (newSubtitleIndex >= 0) {
          hls.subtitleTrack = newSubtitleIndex;
          setSelectedSubtitle(newSubtitleIndex);
          if (video.textTracks[newSubtitleIndex]) {
            video.textTracks[newSubtitleIndex].mode = 'showing';
          }
        } else {
          console.warn('Türkçe altyazı bulunamadı');
          showNotification('Türkçe altyazı mevcut değil');
        }
        setSelectedButton('turkishSubtitles');
        showNotification('Türkçe Altyazı');
        break;
      case 'original':
        newAudioIndex = audioTracks.findIndex(track => track.lang === 'en');
        if (newAudioIndex >= 0) {
          hls.audioTrack = newAudioIndex;
          setSelectedAudio(newAudioIndex);
        } else if (audioTracks.length > 0) {
          hls.audioTrack = 0;
          setSelectedAudio(0);
        } else {
          console.warn('İngilizce ses parçası bulunamadı');
          showNotification('İngilizce ses parçası mevcut değil');
        }
        hls.subtitleTrack = -1;
        setSelectedSubtitle(-1);
        setSelectedButton('original');
        showNotification('Orijinal');
        break;
      default:
        break;
    }
  };

  const handleAudioChange = (index) => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!hls || !video) return;

    const newAudioIndex = parseInt(index);
    hls.audioTrack = newAudioIndex;
    setSelectedAudio(newAudioIndex);
    const audioName = audioTracks[newAudioIndex]?.lang ? LANG_MAP[audioTracks[newAudioIndex].lang] || audioTracks[newAudioIndex].lang : 'Bilinmeyen';
    setSelectedButton(null);
    showNotification(`Ses: ${audioName}`);
    setShowAudioOptions(false);
  };

  const handleSubtitleChange = (index) => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!hls || !video) return;

    const newSubtitleIndex = parseInt(index);
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'disabled';
    }

    hls.subtitleTrack = newSubtitleIndex;
    setSelectedSubtitle(newSubtitleIndex);
    if (newSubtitleIndex >= 0 && video.textTracks[newSubtitleIndex]) {
      video.textTracks[newSubtitleIndex].mode = 'showing';
    }
    const subtitleName = newSubtitleIndex === -1 ? 'Kapalı' : (subtitleTracks[newSubtitleIndex]?.lang ? LANG_MAP[subtitleTracks[newSubtitleIndex].lang] || subtitleTracks[newSubtitleIndex].lang : 'Bilinmeyen');
    setSelectedButton(null);
    showNotification(`Altyazı: ${subtitleName}`);
    setShowSubtitleOptions(false);
  };

  const handleQualityChange = (level) => {
    const hls = hlsRef.current;
    if (!hls) return;

    const levelIndex = parseInt(level);
    hls.currentLevel = levelIndex;
    setSelectedQuality(levelIndex);
    const qualityName = levelIndex === -1 ? 'Otomatik' : `${qualityLevels[levelIndex]?.height || 'Bilinmeyen'}p`;
    showNotification(`Kalite: ${qualityName}`);
    setShowQualityOptions(false);
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationVisible(true);
    setTimeout(() => setNotificationVisible(false), 2000);
  };

  const toggleFit = () => {
    setIsFit(prev => {
      const next = prev === 'contain' ? 'cover' : 'contain';
      showNotification(next === 'contain' ? 'Fit: Sığdır' : 'Fit: Doldur');
      return next;
    });
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      showNotification('▶ Oynat');
    } else {
      video.pause();
      showNotification('⏸ Duraklat');
    }
  };

  const seekForward = () => {
    if (isLive) {
      showNotification('Canlı yayında ileri sarma yapılamaz');
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.min(video.currentTime + 30, video.duration || Infinity);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / video.duration) * 100 || 0);
    showNotification('⏩ 30s ileri');
  };

  const seekBackward = () => {
    if (isLive) {
      showNotification('Canlı yayında geri sarma yapılamaz');
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(video.currentTime - 30, 0);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / video.duration) * 100 || 0);
    showNotification('⏪ 30s geri');
  };

  const seekTo = (e) => {
    if (isLive) {
      showNotification('Canlı yayında zaman çubuğu kullanılamaz');
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    if (!isNaN(newTime) && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
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

  const handleChannelSelect = (channel, index) => {
    onSelectChannel(channel);
    setFocusedChannelIndex(index);
    setShowChannelList(false);
    showNotification(`Oynatılıyor: ${channel.name}`);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const video = videoRef.current;
      if (!video) return;

      if (showChannelList) {
        if (e.key === 'ArrowDown') {
          setFocusedChannelIndex(prev => Math.min(prev + 1, groupChannels.length - 1));
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          setFocusedChannelIndex(prev => Math.max(prev - 1, 0));
          e.preventDefault();
        } else if (e.key === 'Enter') {
          if (groupChannels[focusedChannelIndex]) {
            handleChannelSelect(groupChannels[focusedChannelIndex], focusedChannelIndex);
          }
          e.preventDefault();
        } else if (e.key === 'Escape') {
          setShowChannelList(false);
          e.preventDefault();
        }
      } else {
        switch (e.key.toLowerCase()) {
          case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
          case 'arrowright':
            seekForward();
            break;
          case 'arrowleft':
            seekBackward();
            break;
          case 'arrowup':
            e.preventDefault();
            video.volume = Math.min(video.volume + 0.1, 1);
            showNotification(`🔊 Ses: %${Math.round(video.volume * 100)}`);
            break;
          case 'arrowdown':
            e.preventDefault();
            video.volume = Math.max(video.volume - 0.1, 0);
            showNotification(`🔉 Ses: %${Math.round(video.volume * 100)}`);
            break;
          case 'm':
            e.preventDefault();
            video.muted = !video.muted;
            showNotification(video.muted ? '🔇 Sessiz' : `🔊 Ses: %${Math.round(video.volume * 100)}`);
            break;
          case 'l':
            e.preventDefault();
            setShowChannelList(true);
            showNotification('Bölüm listesi açıldı');
            break;
          case 'escape':
            if (document.fullscreenElement) {
              document.exitFullscreen();
              showNotification('⛔ Tam ekrandan çıkıldı');
            } else {
              if (typeof onBack === 'function') {
                onBack(); // Escape tuşuna basıldığında geri dön
                showNotification('Geri dönüldü');
              }
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showChannelList, groupChannels, focusedChannelIndex, onBack]);

  useEffect(() => {
    const onMouseMove = () => showControls();
    const onTouchStart = () => showControls();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('keydown', showControls);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('keydown', showControls);
    };
  }, [notificationTimer]);

  // Türkçe altyazı var mı kontrolü
  const hasTurkishSubtitles = subtitleTracks.some(track => track.lang === 'tr');
  // Ses parçası sayısı kontrolü
  const hasMultipleAudioTracks = audioTracks.length > 1;

  return (
    <div id="player-container" style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      zIndex: 999
    }}>
      {/* Dizi/Film Detayları Sağ Üstte */}
      {tmdbInfo && (
        <div style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 480,
          maxWidth: '90vw',
          zIndex: 1200,
          transition: 'opacity 0.5s',
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '24px',
            padding: '24px 32px 0 32px',
            background: 'rgba(20,20,20,0.7)',
            borderRadius: '16px',
            margin: 0,
            boxShadow: '0 2px 16px #0005'
          }}>
            {tmdbInfo.poster && (
              <div style={{
                width: 160,
                aspectRatio: '2/3',
                background: '#222',
                borderRadius: '12px',
                boxShadow: '0 2px 12px #0005',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={tmdbInfo.poster}
                  alt={tmdbInfo.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                />
              </div>
            )}
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: '#fff' }}>
                {tmdbInfo.name}
              </h2>
              <div style={{ marginBottom: 8, color: '#ccc', fontSize: 15 }}>
                {tmdbInfo.genres?.join(', ')} {tmdbInfo.release_date ? ` • ${tmdbInfo.release_date.slice(0,4)}` : ''}
                {tmdbInfo.vote_average ? ` • ⭐ ${tmdbInfo.vote_average}` : ''}
              </div>
              <div style={{ color: '#eee', fontSize: 16 }}>
                {tmdbInfo.overview || 'Açıklama bulunamadı.'}
              </div>
              {/* Yayında olduğu yerler */}
              {tmdbInfo.providers && tmdbInfo.providers.length > 0 && (
                <div style={{ marginTop: 10, color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <b>Yayında:</b>
                  {tmdbInfo.providers.map((p, idx) => (
                    <span key={p.name + idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              )}
              {/* Oyuncular */}
              {tmdbInfo.actors && tmdbInfo.actors.length > 0 && (
                <div style={{ marginTop: 10, color: '#febd59', fontSize: 15 }}>
                  <b>Oyuncular:</b> {tmdbInfo.actors.join(', ')}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <a
                  href={
                    tmdbInfo.release_date
                      ? `https://www.themoviedb.org/movie/${tmdbInfo.tmdb_id}`
                      : `https://www.themoviedb.org/tv/${tmdbInfo.tmdb_id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    color: '#2299ff',
                    textDecoration: 'underline',
                    fontSize: 14
                  }}
                >
                  TMDB'de Görüntüle
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        tabIndex="0"
        autoPlay
        controls={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: isFit,
          backgroundColor: 'transparent',
          outline: 'none',
          willChange: 'transform'
        }}
      />
      {/* Video İsmi ve Geri Butonu */}
      {title && controlsVisible && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000,
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          <button
            onClick={() => {
              if (typeof onBack === 'function') {
                onBack();
                showNotification('Geri dönüldü');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && typeof onBack === 'function') {
                onBack();
                showNotification('Geri dönüldü');
              }
            }}
            tabIndex={0}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              padding: '10px',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(50, 50, 50, 0.7)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          >
            <span className="material-icons" style={{ color: '#fff', fontSize: '24px' }}>arrow_back</span>
          </button>
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
          }}>
            {title}
          </div>
        </div>
      )}
      {/* Dil Seçim Butonları */}
      {(hasMultipleAudioTracks || hasTurkishSubtitles) && (
        <div style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          zIndex: 1000,
          opacity: controlsVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
          pointerEvents: controlsVisible ? 'auto' : 'none',
        }}>
          {hasMultipleAudioTracks && (
            <button
              onClick={() => handleLanguageChange('turkishDubbed')}
              onKeyDown={(e) => e.key === 'Enter' && handleLanguageChange('turkishDubbed')}
              tabIndex={0}
              style={{
background: selectedButton === 'turkishDubbed' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                padding: '10px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishDubbed' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(50, 50, 50, 0.7)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishDubbed' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            >
              Türkçe Dublaj
            </button>
          )}
          {hasTurkishSubtitles && (
            <button
              onClick={() => handleLanguageChange('turkishSubtitles')}
              onKeyDown={(e) => e.key === 'Enter' && handleLanguageChange('turkishSubtitles')}
              tabIndex={0}
              style={{
                background: selectedButton === 'turkishSubtitles' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                padding: '10px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishSubtitles' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(50, 50, 50, 0.7)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishSubtitles' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            >
              Türkçe Altyazı
            </button>
          )}
          <button
            onClick={() => handleLanguageChange('original')}
            onKeyDown={(e) => e.key === 'Enter' && handleLanguageChange('original')}
            tabIndex={0}
            style={{
              background: selectedButton === 'original' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              padding: '10px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = selectedButton === 'original' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(50, 50, 50, 0.7)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = selectedButton === 'original' ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          >
            Orijinal
          </button>
        </div>
      )}

      {/* Oynatma Kontrol Butonları */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        gap: '10px',
        zIndex: 1000,
        opacity: controlsVisible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: controlsVisible ? 'auto' : 'none',
      }}>
        <button
          onClick={seekBackward}
          onKeyDown={(e) => e.key === 'Enter' && seekBackward()}
          tabIndex={0}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '20px',
            cursor: isLive ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
            opacity: isLive ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLive) {
              e.currentTarget.style.background = 'rgba(50, 50, 50, 0.7)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLive) {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          onMouseDown={(e) => !isLive && (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={(e) => !isLive && (e.currentTarget.style.transform = 'scale(1.1)')}
          disabled={isLive}
        >
          <span className="material-icons" style={{ color: '#fff', fontSize: '48px' }}>replay_30</span>
        </button>
        <button
          onClick={togglePlayPause}
          onKeyDown={(e) => e.key === 'Enter' && togglePlayPause()}
          tabIndex={0}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '20px',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(50, 50, 50, 0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          <span className="material-icons" style={{ color: '#fff', fontSize: '48px' }}>
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button
          onClick={seekForward}
          onKeyDown={(e) => e.key === 'Enter' && seekForward()}
          tabIndex={0}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '20px',
            cursor: isLive ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
            opacity: isLive ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLive) {
              e.currentTarget.style.background = 'rgba(50, 50, 50, 0.7)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLive) {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          onMouseDown={(e) => !isLive && (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={(e) => !isLive && (e.currentTarget.style.transform = 'scale(1.1)')}
          disabled={isLive}
        >
          <span className="material-icons" style={{ color: '#fff', fontSize: '48px' }}>forward_30</span>
        </button>
        <button
          onClick={() => {
            setShowChannelList(!showChannelList);
            showNotification(showChannelList ? 'Bölüm listesi kapatıldı' : 'Bölüm listesi açıldı');
          }}
          onKeyDown={(e) => e.key === 'Enter' && setShowChannelList(!showChannelList)}
          tabIndex={0}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '20px',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(50, 50, 50, 0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          <span className="material-icons" style={{ color: '#fff', fontSize: '48px' }}>list</span>
        </button>
      </div>

      {/* Bildirim */}
      {notificationVisible && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '6px',
          zIndex: 1000,
        }}>
          {notification}
        </div>
      )}

      {/* Süre ve progress bar */}
      {progressBarVisible && !isLive && (
        <>
          <div style={{
            position: 'absolute',
            bottom: '100px',
            left: 12,
            color: 'rgb(255, 255, 255)',
            fontSize: '14px',
            background: 'rgba(0,0,0,0.6)',
            padding: '4px 8px',
            borderRadius: '4px',
            zIndex: 100,
          }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div onClick={seekTo} style={{
            position: 'absolute',
            bottom: '90px',
            left: 0,
            width: '100%',
            height: '6px',
            background: 'rgb(17, 17, 17)',
            cursor: 'pointer',
            zIndex: 99,
          }}>
            <div style={{
              width: `${bufferedProgress}%`,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.3)',
              position: 'absolute',
              zIndex: 1,
              transition: 'width 0.2s ease',
            }} />
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))',
              position: 'absolute',
              zIndex: 2,
              transition: 'width 0.2s ease',
            }} />
          </div>
        </>
      )}

      {/* Kanal Listesi */}
      {showChannelList && groupChannels.length > 0 && (
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '20px',
          width: '300px',
          maxHeight: '80vh',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '8px',
          padding: '10px',
          zIndex: 1000,
          color: '#fff',
        }}>
          <h3 style={{ margin: '10px 0', textAlign: 'center' }}>
            {groupTitle || 'Bölümler'}
          </h3>
          {groupChannels.map((channel, index) => (
            <div
              key={channel.name + index}
              tabIndex={0}
              onClick={() => handleChannelSelect(channel, index)}
              onKeyDown={(e) => e.key === 'Enter' && handleChannelSelect(channel, index)}
              style={{
                padding: '10px',
                background: focusedChannelIndex === index ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(50, 50, 50, 0.5)',
                borderRadius: '5px',
                marginBottom: '5px',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                outline: focusedChannelIndex === index ? '2px solid cyan' : 'none',
              }}
            >
              {channel.name}
            </div>
          ))}
        </div>
      )}

      {/* Kontrol Paneli */}
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
        <button
          onClick={() => setShowAudioOptions(!showAudioOptions)}
          onKeyDown={(e) => e.key === 'Enter' && setShowAudioOptions(!showAudioOptions)}
          tabIndex={0}
          style={{
            background: selectedAudio >= 0 ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = selectedAudio >= 0 ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(50, 50, 50, 0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = selectedAudio >= 0 ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          <span className="material-icons" style={{ color: '#fff' }}>audiotrack</span>
        </button>
        {showAudioOptions && (
          <select
            value={selectedAudio}
            onChange={(e) => handleAudioChange(e.target.value)}
            tabIndex={0}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            {audioTracks.map((track, index) => (
              <option key={index} value={index}>
                {track.lang ? LANG_MAP[track.lang] || track.lang : `Ses ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => setShowSubtitleOptions(!showSubtitleOptions)}
          onKeyDown={(e) => e.key === 'Enter' && setShowSubtitleOptions(!showSubtitleOptions)}
          tabIndex={0}
          style={{
            background: selectedSubtitle >= 0 ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = selectedSubtitle >= 0 ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(50, 50, 50,0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = selectedSubtitle >= 0 ? 'linear-gradient(to right, rgb(229, 9, 20), rgb(184, 29, 36))' : 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          <span className="material-icons" style={{ color: '#fff' }}>subtitles</span>
        </button>
        {showSubtitleOptions && (
          <select
            value={selectedSubtitle}
            onChange={(e) => handleSubtitleChange(e.target.value)}
            tabIndex={0}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            <option value={-1}>Kapalı</option>
            {subtitleTracks.map((track, index) => (
              <option key={index} value={index}>
                {track.lang ? LANG_MAP[track.lang] || track.lang : `Altyazı ${index + 1}`}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => setShowSpeedOptions(!showSpeedOptions)}
          onKeyDown={(e) => e.key === 'Enter' && setShowSpeedOptions(!showSpeedOptions)}
          tabIndex={0}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(50, 50, 50, 0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          <span className="material-icons" style={{ color: '#fff' }}>speed</span>
        </button>
        {showSpeedOptions && (
          <select
            value={playbackRate}
            onChange={(e) => {
              const rate = parseFloat(e.target.value);
              setPlaybackRate(rate);
              if (videoRef.current) videoRef.current.playbackRate = rate;
            }}
            tabIndex={0}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            <option value={0.25}>0.25x</option>
            <option value={0.50}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        )}

        <button
          onClick={() => setShowQualityOptions(!showQualityOptions)}
          onKeyDown={(e) => e.key === 'Enter' && setShowQualityOptions(!showQualityOptions)}
          tabIndex={0}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: '50%',
            padding: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(50, 50, 50, 0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          <span className="material-icons" style={{ color: '#fff' }}>high_quality</span>
        </button>
        {showQualityOptions && (
          <select
            value={selectedQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
            tabIndex={0}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            <option value={-1}>Otomatik</option>
            {qualityLevels.map((level, index) => (
              <option key={index} value={index}>{level.height ? `${level.height}p` : `Seviye ${index + 1}`}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}