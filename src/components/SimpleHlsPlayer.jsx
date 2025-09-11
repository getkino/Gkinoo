import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const LANG_MAP = {
  tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', fr: 'Fransızca',
  es: 'İspanyolca', it: 'İtalyanca', ar: 'Arapça', ru: 'Rusça',
  ja: 'Japonca', ko: 'Korece', fa: 'Farsça', zh: 'Çince',
};

// EKLENDİ: Tema rengi sabitleri (takım rengi)
const TEAM = '#febd59';
const TEAM_DARK = '#e89d3a';
const TEAM_GRAD = `linear-gradient(to right, ${TEAM}, ${TEAM_DARK})`;
const TEAM_GRAD_RGBA = `linear-gradient(to right, rgba(254,189,89,0.8), rgba(232,157,58,0.8))`;

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

  // EKLENDİ: Android TV tespiti için ref
  const isAndroidTv = useRef(false);

  // EKLENDİ: Android TV tespiti
  useEffect(() => {
    const ua = navigator.userAgent || '';
    isAndroidTv.current = /Android\s?TV|SMART-TV|Tizen|Web0S|WebOS|BRAVIA|AFT(M|T|S)/i.test(ua);
  }, []);

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
    notify('audio', { label: audioName });
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
    notify('subtitle', { label: subtitleName });
    setShowSubtitleOptions(false);
  };

  const handleQualityChange = (level) => {
    const hls = hlsRef.current;
    if (!hls) return;

    const levelIndex = parseInt(level);
    hls.currentLevel = levelIndex;
    setSelectedQuality(levelIndex);
    const qualityName = levelIndex === -1 ? 'Otomatik' : `${qualityLevels[levelIndex]?.height || 'Bilinmeyen'}p`;
    notify('quality', { label: qualityName });
    setShowQualityOptions(false);
  };

  // Hız değiştir (popover item tıklaması için)
  const handleSpeedSelect = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSpeedOptions(false);
    setShowAudioOptions(false);
    setShowSubtitleOptions(false);
    setShowQualityOptions(false);
    showNotification(`Hız: ${rate}x`);
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationVisible(true);
    setTimeout(() => setNotificationVisible(false), 2000);
  };

  // EKLENDİ: Bildirimleri tek noktadan şık biçimlendirme
  const fmt = {
    seconds: (s) => `${Math.round(s)} sn`,
    volume: (v) => `%${Math.round((v ?? 0) * 100)}`
  };
  const notify = (type, data = {}) => {
    let msg = '';
    switch (type) {
      case 'play': msg = 'Oynatılıyor'; break;
      case 'pause': msg = 'Duraklatıldı'; break;
      case 'seek-forward': msg = `${fmt.seconds(data.seconds ?? 30)} ileri sarıldı`; break;
      case 'seek-backward': msg = `${fmt.seconds(data.seconds ?? 30)} geri sarıldı`; break;
      case 'volume': msg = `Ses: ${fmt.volume(data.volume)}`; break;
      case 'mute': msg = data.muted ? 'Sessiz açık' : `Sessiz kapalı • Ses ${fmt.volume(data.volume)}`; break;
      case 'fs-exit': msg = 'Tam ekrandan çıkıldı'; break;
      case 'live-seek-block': msg = 'Canlı yayında sarma desteklenmiyor'; break;
      case 'fit': msg = `Ekran: ${data.mode === 'contain' ? 'Sığdır' : 'Doldur'}`; break;
      case 'quality': msg = `Kalite: ${data.label}`; break;
      case 'audio': msg = `Ses: ${data.label}`; break;
      case 'subtitle': msg = `Altyazı: ${data.label}`; break;
      case 'back': msg = 'Geri dönüldü'; break;
      default: msg = data.message || ''; break;
    }
    if (msg) showNotification(msg);
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
      notify('play');
    } else {
      video.pause();
      notify('pause');
    }
  };

  const seekForward = () => {
    if (isLive) {
      notify('live-seek-block');
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.min(video.currentTime + 30, video.duration || Infinity);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / video.duration) * 100 || 0);
    notify('seek-forward', { seconds: 30 });
  };

  const seekBackward = () => {
    if (isLive) {
      notify('live-seek-block');
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(video.currentTime - 30, 0);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / video.duration) * 100 || 0);
    notify('seek-backward', { seconds: 30 });
  };

  const seekTo = (e) => {
    if (isLive) {
      notify('live-seek-block');
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
    // TV'de kontroller daha uzun açık kalsın
    setNotificationTimer(setTimeout(() => {
      setControlsVisible(false);
      setProgressBarVisible(false);
    }, isAndroidTv.current ? 6000 : 3000));
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
      const k = (e.key || '').toLowerCase();
      switch (k) {
        case 'mediaplaypause':
          e.preventDefault();
          return togglePlayPause();
        case 'mediaplay':
          e.preventDefault();
          try { video.play(); } catch {}
          return notify('play');
        case 'mediapause':
          e.preventDefault();
          try { video.pause(); } catch {}
          return notify('pause');
        case 'mediafastforward':
          e.preventDefault();
          return seekForward();
        case 'mediarewind':
          e.preventDefault();
          return seekBackward();
        case 'volumeup':
          e.preventDefault();
          video.volume = Math.min(video.volume + 0.1, 1);
          return notify('volume', { volume: video.volume });
        case 'volumedown':
          e.preventDefault();
          video.volume = Math.max(video.volume - 0.1, 0);
          return notify('volume', { volume: video.volume });
        case 'volumemute':
          e.preventDefault();
          video.muted = !video.muted;
          return notify('mute', { muted: video.muted, volume: video.volume });
        case 'backspace':
        case 'browserback':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
            return notify('fs-exit');
          }
          if (typeof onBack === 'function') {
            onBack();
            return notify('back');
          }
          return;
        case 'channelup':
          e.preventDefault();
          setShowChannelList(true);
          setFocusedChannelIndex((prev) => Math.max(prev - 1, 0));
          return;
        case 'channeldown':
          e.preventDefault();
          setShowChannelList(true);
          setFocusedChannelIndex((prev) => Math.min(prev + 1, Math.max(groupChannels.length - 1, 0)));
          return;
        default:
          break;
      }

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
        switch (k) {
          case ' ':
          case 'enter':
          case 'select':
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
            notify('volume', { volume: video.volume });
            break;
          case 'arrowdown':
            e.preventDefault();
            video.volume = Math.max(video.volume - 0.1, 0);
            notify('volume', { volume: video.volume });
            break;
          case 'm':
            e.preventDefault();
            video.muted = !video.muted;
            notify('mute', { muted: video.muted, volume: video.volume });
            break;
          case 'escape':
            if (document.fullscreenElement) {
              document.exitFullscreen();
              notify('fs-exit');
            } else if (typeof onBack === 'function') {
              onBack();
              notify('back');
            }
            break;
          // ...existing code...
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

  // EKLENDİ: İlk açılışta otomatik gizleme zamanlayıcısını başlat
  useEffect(() => {
    showControls();
    return () => {
      if (notificationTimer) clearTimeout(notificationTimer);
    };
  }, []); // sadece mount/unmount

  const hasTurkishSubtitles = subtitleTracks.some(track => track.lang === 'tr');
  const hasMultipleAudioTracks = audioTracks.length > 1;

  // Hız seçenekleri
  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  // Stil sabitleri (dock, buton, menü)
  const ui = {
    dock: {
      position: 'absolute',
      bottom: 20,
      right: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(20,20,20,0.6)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 999,
      padding: '8px 10px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
      zIndex: 100,
      opacity: controlsVisible ? 1 : 0,
      transition: 'opacity 0.5s ease',
      pointerEvents: controlsVisible ? 'auto' : 'none',
    },
    iconBtn: (active) => ({
      width: 44,
      height: 44,
      borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.12)',
      background: active ? TEAM_GRAD : 'rgba(0,0,0,0.5)',
      // DEĞİŞTİ: grid yerine inline-flex ile tam ortalama
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      color: '#fff',
      cursor: 'pointer',
      outline: 'none',
      transition: 'transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
    }),
    menu: {
      position: 'absolute',
      right: 12,
      bottom: 72,
      minWidth: 220,
      background: 'rgba(20,20,20,0.9)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12,
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      zIndex: 1000,
    },
    menuItem: (selected) => ({
      padding: '10px 12px',
      color: '#fff',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      cursor: 'pointer',
      background: selected ? TEAM_GRAD_RGBA : 'transparent',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }),
    menuItemIcon: {
      fontSize: 18,
      opacity: 0.9,
    },
    // EKLENDİ: İkonları dikeyde dengelemek için ortak stil
    iconGlyph: {
      fontSize: 22,
      lineHeight: 1,
      display: 'inline-block',
      verticalAlign: 'middle',
      transform: 'translateY(1px)', // küçük ofset, yamuk görünümü düzeltir
      pointerEvents: 'none',
    }
  };

  return (
    <div id="player-container" style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      zIndex: 999
    }}>
      <video
        ref={videoRef}
        tabIndex="0"
        autoPlay
        playsInline
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
                background: selectedButton === 'turkishDubbed' ? TEAM_GRAD : 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                padding: '10px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishDubbed' ? TEAM_GRAD : 'rgba(50, 50, 50, 0.7)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishDubbed' ? TEAM_GRAD : 'rgba(0, 0, 0, 0.5)';
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
                background: selectedButton === 'turkishSubtitles' ? TEAM_GRAD : 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                padding: '10px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishSubtitles' ? TEAM_GRAD : 'rgba(50, 50, 50, 0.7)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selectedButton === 'turkishSubtitles' ? TEAM_GRAD : 'rgba(0, 0, 0, 0.5)';
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
              background: selectedButton === 'original' ? TEAM_GRAD : 'rgba(0, 0, 0, 0.5)',
              color: '#fff',
              padding: '10px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = selectedButton === 'original' ? TEAM_GRAD : 'rgba(50, 50, 50, 0.7)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = selectedButton === 'original' ? TEAM_GRAD : 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          >
            Orijinal
          </button>
        </div>
      )}

      {/* Oynatma Kontrol Butonları (geri eklendi) */}
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
      </div>

      {/* Kontrol Paneli - GÜNCELLENDİ: Dock + popover menüler */}
      <div style={ui.dock}>
        <button
          onClick={() => {
            setShowAudioOptions(v => !v);
            setShowSubtitleOptions(false);
            setShowSpeedOptions(false);
            setShowQualityOptions(false);
          }}
          tabIndex={0}
          style={ui.iconBtn(selectedAudio >= 0)}
          title="Ses Parçası"
        >
          <span className="material-icons" style={ui.iconGlyph}>audiotrack</span>
        </button>

        <button
          onClick={() => {
            setShowSubtitleOptions(v => !v);
            setShowAudioOptions(false);
            setShowSpeedOptions(false);
            setShowQualityOptions(false);
          }}
          tabIndex={0}
          style={ui.iconBtn(selectedSubtitle >= 0)}
          title="Altyazı"
        >
          <span className="material-icons" style={ui.iconGlyph}>subtitles</span>
        </button>

        <button
          onClick={() => {
            setShowSpeedOptions(v => !v);
            setShowAudioOptions(false);
            setShowSubtitleOptions(false);
            setShowQualityOptions(false);
          }}
          tabIndex={0}
          style={ui.iconBtn(false)}
          title="Oynatma Hızı"
        >
          <span className="material-icons" style={ui.iconGlyph}>speed</span>
        </button>

        <button
          onClick={() => {
            setShowQualityOptions(v => !v);
            setShowAudioOptions(false);
            setShowSubtitleOptions(false);
            setShowSpeedOptions(false);
          }}
          tabIndex={0}
          style={ui.iconBtn(selectedQuality !== -1)}
          title="Kalite"
        >
          <span className="material-icons" style={ui.iconGlyph}>high_quality</span>
        </button>
      </div>

      {/* Popover Menüler */}
      {showAudioOptions && (
        <div style={ui.menu}>
          {audioTracks.map((track, index) => (
            <div
              key={index}
              onClick={() => handleAudioChange(index)}
              style={ui.menuItem(index === selectedAudio)}
            >
              <span>{track.lang ? (LANG_MAP[track.lang] || track.lang) : `Ses ${index + 1}`}</span>
              {index === selectedAudio && <span className="material-icons" style={ui.menuItemIcon}>check</span>}
            </div>
          ))}
        </div>
      )}

      {showSubtitleOptions && (
        <div style={ui.menu}>
          <div
            onClick={() => handleSubtitleChange(-1)}
            style={ui.menuItem(selectedSubtitle === -1)}
          >
            <span>Kapalı</span>
            {selectedSubtitle === -1 && <span className="material-icons" style={ui.menuItemIcon}>check</span>}
          </div>
          {subtitleTracks.map((track, index) => (
            <div
              key={index}
              onClick={() => handleSubtitleChange(index)}
              style={ui.menuItem(index === selectedSubtitle)}
            >
              <span>{track.lang ? (LANG_MAP[track.lang] || track.lang) : `Altyazı ${index + 1}`}</span>
              {index === selectedSubtitle && <span className="material-icons" style={ui.menuItemIcon}>check</span>}
            </div>
          ))}
        </div>
      )}

      {showSpeedOptions && (
        <div style={ui.menu}>
          {SPEEDS.map(rate => (
            <div
              key={rate}
              onClick={() => handleSpeedSelect(rate)}
              style={ui.menuItem(playbackRate === rate)}
            >
              <span>{rate}x</span>
              {playbackRate === rate && <span className="material-icons" style={ui.menuItemIcon}>check</span>}
            </div>
          ))}
        </div>
      )}

      {showQualityOptions && (
        <div style={ui.menu}>
          <div
            onClick={() => handleQualityChange(-1)}
            style={ui.menuItem(selectedQuality === -1)}
          >
            <span>Otomatik</span>
            {selectedQuality === -1 && <span className="material-icons" style={ui.menuItemIcon}>check</span>}
          </div>
          {qualityLevels.map((level, index) => (
            <div
              key={index}
              onClick={() => handleQualityChange(index)}
              style={ui.menuItem(selectedQuality === index)}
            >
              <span>{level.height ? `${level.height}p` : `Seviye ${index + 1}`}</span>
              {selectedQuality === index && <span className="material-icons" style={ui.menuItemIcon}>check</span>}
            </div>
          ))}
        </div>
      )}

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
              background: TEAM_GRAD, // DEĞİŞTİ: İlerleme çubuğu rengi
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
                background: focusedChannelIndex === index ? TEAM_GRAD : 'rgba(50, 50, 50, 0.5)',
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
    </div>
  );
}