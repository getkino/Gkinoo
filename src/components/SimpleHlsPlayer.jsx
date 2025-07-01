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

export default function SimpleHlsPlayer({ url }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(0);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(-1);
  const [toastMsg, setToastMsg] = useState('');

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
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        setAudioTracks(data.audioTracks);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
        setSubtitleTracks(data.subtitleTracks);
      });
    } else {
      video.src = url;
    }

    // Tam ekran
    const enterFullscreen = () => {
      if (video.requestFullscreen) video.requestFullscreen();
      else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
      else if (video.mozRequestFullScreen) video.mozRequestFullScreen();
      else if (video.msRequestFullscreen) video.msRequestFullscreen();
    };
    video.addEventListener('loadeddata', enterFullscreen);

    // Kumanda tuşları
    const handleKey = (e) => {
      if (!video) return;
      if (e.key === 'ArrowLeft') {
        video.currentTime = Math.max(video.currentTime - 10, 0);
        showToast('⏪ 10 saniye geri');
      } else if (e.key === 'ArrowRight') {
        video.currentTime = Math.min(video.currentTime + 10, video.duration);
        showToast('⏩ 10 saniye ileri');
      } else if (e.key === 'ArrowUp') {
        video.volume = Math.min(video.volume + 0.1, 1);
        showToast(`🔊 Ses: ${(video.volume * 100).toFixed(0)}%`);
      } else if (e.key === 'ArrowDown') {
        video.volume = Math.max(video.volume - 0.1, 0);
        showToast(`🔉 Ses: ${(video.volume * 100).toFixed(0)}%`);
      }
    };

    const showToast = (text) => {
      setToastMsg(text);
      setTimeout(() => setToastMsg(''), 1500);
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      video.removeEventListener('loadeddata', enterFullscreen);
      if (hls) hls.destroy();
    };
  }, [url]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        video::cue {
          background: rgba(0, 0, 0, 0) !important;
          color: white !important;
          font-size: 1.2em;
          text-shadow: 0 1px 2px black;
        }
      `}</style>

      {toastMsg && (
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '16px',
            zIndex: 2000,
          }}
        >
          {toastMsg}
        </div>
      )}

      {(levels.length > 1 || audioTracks.length > 1 || subtitleTracks.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            display: 'flex',
            gap: 12,
            padding: 8,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 8,
            color: '#fff',
            fontSize: '14px',
          }}
        >
          {levels.length > 1 && (
            <select
              value={selectedLevel}
              onChange={(e) => {
                const level = parseInt(e.target.value, 10);
                setSelectedLevel(level);
                if (hlsRef.current) hlsRef.current.currentLevel = level;
              }}
              style={{ padding: '4px 8px', borderRadius: 4 }}
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
            <select
              value={selectedAudioTrack}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                setSelectedAudioTrack(id);
                if (hlsRef.current) hlsRef.current.audioTrack = id;
              }}
              style={{ padding: '4px 8px', borderRadius: 4 }}
            >
              {audioTracks.map((track, idx) => (
                <option key={track.id ?? idx} value={track.id ?? idx}>
                  {getLangLabel(track, idx, 'Dil ')}
                </option>
              ))}
            </select>
          )}
          {subtitleTracks.length > 0 && (
            <select
              value={selectedSubtitleTrack}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                setSelectedSubtitleTrack(id);
                if (hlsRef.current) hlsRef.current.subtitleTrack = id;
              }}
              style={{ padding: '4px 8px', borderRadius: 4 }}
            >
              <option value={-1}>Altyazı Kapalı</option>
              {subtitleTracks.map((track, idx) => (
                <option key={track.id ?? idx} value={track.id ?? idx}>
                  {getLangLabel(track, idx, 'Altyazı ')}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <video
        ref={videoRef}
        controls
        autoPlay
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
      />
    </div>
  );
}