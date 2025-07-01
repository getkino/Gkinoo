// src/components/VideoPlayer.jsx
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ url, fullscreen, onExit }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [qualityList, setQualityList] = useState([]);
  const [subtitleList, setSubtitleList] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusedBtn, setFocusedBtn] = useState(0);
  const btnRefs = useRef([]);

  useEffect(() => {
    const video = videoRef.current;
    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({ enableLowInitialPlaylist: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualityList(hls.levels);
        setSubtitleList(hls.subtitleTracks || []);
        setHlsInstance(hls);
      });
    } else {
      video.src = url;
    }

    video.volume = volume;
    video.muted = true;
    video.play()
      .then(() => {
        video.muted = false;
        setIsPlaying(true);
      })
      .catch(err => console.error('Play error', err));

    const update = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener('timeupdate', update);
    video.addEventListener('loadedmetadata', () => setDuration(video.duration));

    const hide = () => {
      setShowControls(true);
      clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', hide);
    hide();

    const esc = e => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'ArrowRight') focusNext();
      if (e.key === 'ArrowLeft') focusPrev();
      if (e.key === 'Enter' && btnRefs.current[focusedBtn]) btnRefs.current[focusedBtn].click();
    };
    window.addEventListener('keydown', esc);

    if (fullscreen) setTimeout(() => video.requestFullscreen?.(), 300);

    return () => {
      video.removeEventListener('timeupdate', update);
      window.removeEventListener('mousemove', hide);
      window.removeEventListener('keydown', esc);
      hls?.destroy();
    };
  }, [url, fullscreen, volume, onExit]);

  const hideTimeout = useRef(null);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (vid.paused) {
      vid.play(); setIsPlaying(true);
    } else {
      vid.pause(); setIsPlaying(false);
    }
  };

  const skip = s => {
    const vid = videoRef.current;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + s));
  };

  const changeQuality = index => {
    hlsInstance.currentLevel = index;
  };
  const changeSubtitle = track => {
    hlsInstance.subtitleTrack = track;
  };

  const focusNext = () => {
    setFocusedBtn(i => (i + 1) % btnRefs.current.length);
    btnRefs.current[(focusedBtn + 1) % btnRefs.current.length]?.focus();
  };
  const focusPrev = () => {
    setFocusedBtn(i => (i - 1 + btnRefs.current.length) % btnRefs.current.length);
    btnRefs.current[(focusedBtn - 1 + btnRefs.current.length) % btnRefs.current.length]?.focus();
  };

  return (
    <div className="exo-player-container" style={{ position:'relative',width:'100%',height:'100%',background:'black' }}>
      <video ref={videoRef} style={{width:'100%',height:'100%',objectFit:'contain'}} onClick={togglePlay} />
      {showControls && (
        <>
          <div className="exo-player-center-controls" style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',display:'flex',gap:'40px'}}>
            <button ref={el => btnRefs.current[0]=el} onClick={() => skip(-10)} className={focusedBtn===0?'focused':''}>⏪</button>
            <button ref={el => btnRefs.current[1]=el} onClick={togglePlay} className={focusedBtn===1?'focused':''}>{isPlaying?'⏸':'▶️'}</button>
            <button ref={el => btnRefs.current[2]=el} onClick={() => skip(10)} className={focusedBtn===2?'focused':''}>⏩</button>
          </div>
          <div className="exo-player-bottom-controls" style={{position:'absolute',bottom:0,width:'100%',padding:'15px',background:'linear-gradient(to top, rgba(0,0,0,0.7),transparent)'}}>
            <input type="range" min="0" max="100" value={progress} onChange={e => videoRef.current.currentTime = (e.target.value/100)*videoRef.current.duration} />
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'10px'}}>
              <span>{`${format(currentTime)} / ${format(duration)}`}</span>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <input type="range" min="0" max="1" step="0.01" value={volume} ref={el => btnRefs.current[3]=el} onFocus={() => setFocusedBtn(3)} onChange={e=>setVolume(parseFloat(e.target.value))} />
                <button ref={el => btnRefs.current[4]=el} onFocus={() => setFocusedBtn(4)} onClick={() => setSettingsOpen(!settingsOpen)} className={focusedBtn===4?'focused':''}>⚙️</button>
              </div>
            </div>
          </div>
          {settingsOpen && (
            <div className="exo-player-settings" style={{position:'absolute',top:'20%',right:'10%',background:'#222',color:'white',padding:'15px',borderRadius:'8px'}}>
              <div style={{marginBottom:'10px'}}>🏞 Kalite</div>
              {qualityList.map((q,i) => (
                <div key={i} onClick={()=>changeQuality(i)} style={{padding:'5px',background:hlsInstance.currentLevel===i?'#444':'transparent'}}>
                  {q.height}p
                  {hlsInstance.currentLevel === i && (
                    <span style={{marginLeft:8, color:'#4fc3f7', fontWeight:'bold'}}>&nbsp;●</span>
                  )}
                </div>
              ))}
              {subtitleList.length > 0 && (
                <>
                  <div style={{marginTop:'10px'}}>✏️ Altyazı</div>
                  <div onClick={()=>changeSubtitle(-1)} style={{padding:'5px',background:hlsInstance.subtitleTrack=== -1?'#444':'transparent'}}>Kapalı</div>
                  {subtitleList.map((st,i) => (
                    <div key={i} onClick={()=>changeSubtitle(i)} style={{padding:'5px',background:hlsInstance.subtitleTrack===i?'#444':'transparent'}}>{st.lang}</div>
                  ))}
                </>
              )}
            </div>
          )}
          {/* Seçili kaliteyi gösteren badge */}
          {qualityList.length > 0 && hlsInstance && hlsInstance.currentLevel >= 0 && (
            <div style={{
              position: 'absolute',
              bottom: 60,
              right: 30,
              background: '#222',
              color: '#4fc3f7',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '1rem',
              fontWeight: 600,
              opacity: 0.92,
              zIndex: 10
            }}>
              {qualityList[hlsInstance.currentLevel]?.height
                ? `${qualityList[hlsInstance.currentLevel].height}p`
                : 'Otomatik'}
            </div>
          )}
        </>
      )}
    </div>
  );

  function format(t) {
    const m = Math.floor(t/60).toString().padStart(2,'0');
    const s = Math.floor(t%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }
}
