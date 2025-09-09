import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SimpleHlsPlayer from './SimpleHlsPlayer';

// TMDB API anahtarınızı buraya ekleyin
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const getColumns = () => {
  if (window.innerWidth < 600) return 2;
  if (window.innerWidth < 900) return 3;
  if (window.innerWidth < 1400) return 5;
  if (window.innerWidth < 1800) return 7;
  return 9;
};

export default function PlatformSeriesDetail() {
  const { platformName, seriesName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { platform, episodes } = location.state || {};
  const [columns, setColumns] = useState(getColumns);
  const [playerUrl, setPlayerUrl] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [tmdbLoading, setTmdbLoading] = useState(true);
  const [watchProviders, setWatchProviders] = useState(null);
  const [certification, setCertification] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef([]);

  // Memoized episodes
  const episodesList = useMemo(() => episodes || [], [episodes]);

  // Tekrarlı başlığı temizlemek için yardımcılar (geliştirilmiş)
  const decodedSeries = useMemo(() => decodeURIComponent(seriesName || ''), [seriesName]);

  const normalizeText = useCallback((s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim(), []);
  const escapeRegExp = useCallback((s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), []);

  const canonicalizeSeasonEp = useCallback((s) => {
    if (!s) return '';
    // 9. Sezon 3. Bölüm
    let m = s.match(/(\d+)\s*\.?\s*sezon\s*(\d+)\s*\.?\s*bölüm/i);
    if (m) return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
    // Sezon 9 Bölüm 3
    m = s.match(/sezon\s*(\d+)\s*bölüm\s*(\d+)/i);
    if (m) return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
    // S09E03, S9E3, S 9 E 3
    m = s.match(/s\s*(\d{1,2})\s*e\s*(\d{1,3})/i) || s.match(/s(\d{1,2})e(\d{1,3})/i);
    if (m) return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
    return '';
  }, []);

  const extractSeasonEp = useCallback((title) => {
    if (!title) return '';
    // Başlıktan TR tarzı veya SxxEyy desenini ayıkla
    const patterns = [
      /(\d+)\s*\.?\s*sezon\s*(\d+)\s*\.?\s*bölüm/i,
      /sezon\s*(\d+)\s*bölüm\s*(\d+)/i,
      /s\s*(\d{1,2})\s*e\s*(\d{1,3})/i,
      /s(\d{1,2})e(\d{1,3})/i,
    ];
    for (const p of patterns) {
      const m = title.match(p);
      if (m) {
        if (m.length === 3) {
          return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
        }
      }
    }
    return '';
  }, []);

  const removeSeriesPrefix = useCallback((t) => {
    const sep = '[-–—:|]';
    const re = new RegExp(`^\\s*${escapeRegExp(decodedSeries)}\\s*${sep}\\s*`, 'i');
    return (t || '').replace(re, '').trim();
  }, [decodedSeries, escapeRegExp]);

  const getEpisodeTitle = useCallback((bolum) => {
    const title = (bolum?.title || '').trim();
    const seasonEpRaw = (bolum?.seasonEpisode || '').trim();
    const seasonEp = canonicalizeSeasonEp(seasonEpRaw) || extractSeasonEp(title);

    let cleaned = removeSeriesPrefix(title);

    // Başlık Sezon/Bölüm ifadesini içeriyorsa sadece onu göster
    if (seasonEp && normalizeText(cleaned).includes(normalizeText(seasonEp))) {
      return seasonEp;
    }

    // Sezon/Bölüm çıkarılamadıysa veya başlıkta yoksa, temizlenmiş başlığı kullan
    return cleaned || seasonEp || title;
  }, [canonicalizeSeasonEp, extractSeasonEp, removeSeriesPrefix, normalizeText]);

  const shouldShowSeasonLine = useCallback((bolum) => {
    const titleText = getEpisodeTitle(bolum);
    const seasonEpRaw = (bolum?.seasonEpisode || '').trim();
    const seasonEp = canonicalizeSeasonEp(seasonEpRaw) || extractSeasonEp(bolum?.title || '');
    if (!seasonEp) return false;
    return normalizeText(titleText) !== normalizeText(seasonEp) && !normalizeText(titleText).includes(normalizeText(seasonEp));
  }, [getEpisodeTitle, canonicalizeSeasonEp, extractSeasonEp, normalizeText]);

  // Callbacks
  const handleBackClick = useCallback(() => navigate(-1), [navigate]);
  
  const handleEpisodeClick = useCallback((url) => {
    setPlayerUrl(url);
  }, []);

  const handlePlayerClose = useCallback(() => {
    setPlayerUrl(null);
  }, []);

  // Responsive columns
  useEffect(() => {
    const handleResize = () => {
      setColumns(getColumns());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (playerUrl) {
        // Player açıkken sadece ESC tuşunu dinle
        if (e.key === 'Escape') {
          e.preventDefault();
          handlePlayerClose();
        }
        return;
      }

      if (episodesList.length === 0) return;

      // Sadece uzaktan kumanda tuşlarını kabul et
      const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace'];
      if (!allowedKeys.includes(e.key)) return;

      let newIndex = focusedIndex;
      const maxIndex = episodesList.length - 1;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(0, focusedIndex - columns);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(maxIndex, focusedIndex + columns);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(0, focusedIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(maxIndex, focusedIndex + 1);
          break;
        case 'Enter':
          e.preventDefault();
          const selectedEpisode = episodesList[focusedIndex];
          if (selectedEpisode?.url) {
            handleEpisodeClick(selectedEpisode.url);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleBackClick();
          break;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        itemRefs.current[newIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, columns, episodesList, playerUrl, handleBackClick, handleEpisodeClick, handlePlayerClose]);

  // TMDB'den dizi verisi çek
  useEffect(() => {
    async function fetchTmdb() {
      setTmdbLoading(true);
      try {
        const decodedName = decodeURIComponent(seriesName);
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(decodedName)}&language=tr`
        );
        const searchJson = await searchRes.json();
        let show = null;
        if (searchJson.results && searchJson.results.length > 0) {
          show = searchJson.results.find(
            r =>
              r.name?.toLowerCase() === decodedName.toLowerCase() ||
              r.original_name?.toLowerCase() === decodedName.toLowerCase()
          ) || searchJson.results[0];
        }
        if (show) {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/tv/${show.id}?api_key=${TMDB_API_KEY}&language=tr&append_to_response=credits,content_ratings`
          );
          const detailJson = await detailRes.json();
          setTmdbData(detailJson);

          // Sertifikasyon bilgisini ayarla
          const trCertification = detailJson.content_ratings?.results?.find(r => r.iso_3166_1 === 'TR');
          const usCertification = detailJson.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
          setCertification(trCertification?.rating || usCertification?.rating || null);

          // Akış servislerini çek
          const watchRes = await fetch(
            `https://api.themoviedb.org/3/tv/${show.id}/watch/providers?api_key=${TMDB_API_KEY}`
          );
          const watchJson = await watchRes.json();
          setWatchProviders(watchJson.results);
        } else {
          setTmdbData(null);
          setWatchProviders(null);
          setCertification(null);
        }
      } catch {
        setTmdbData(null);
        setWatchProviders(null);
        setCertification(null);
      }
      setTmdbLoading(false);
    }
    fetchTmdb();
  }, [seriesName]);

  return (
    <div style={{background:'#111', minHeight:'100vh', color:'#fff', padding:'32px', position:'relative'}}>
      {/* TMDB Dizi Detayı ve back butonu yan yana */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '32px',
        marginBottom: '40px',
        background: tmdbData?.backdrop_path 
          ? `url(https://image.tmdb.org/t/p/original${tmdbData.backdrop_path})`
          : 'linear-gradient(90deg, #181818 60%, #232323 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'local',
        borderRadius: '18px',
        boxShadow: '0 4px 32px #0007',
        padding: '28px 36px 28px 24px',
        position: 'relative',
        minHeight: '260px',
        overflow: 'hidden'
      }}>
        {/* Gradient overlay for text readability */}
        {tmdbData?.backdrop_path && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.2) 100%)',
            borderRadius: '18px',
            zIndex: 0
          }} />
        )}
        
        <button
          onClick={handleBackClick}
          style={{
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            padding: '12px',
            fontSize: '22px',
            cursor: 'pointer',
            zIndex: 2,
            marginRight: '8px',
            alignSelf: 'flex-start',
            position: 'relative'
          }}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        {tmdbLoading ? (
          <div style={{color:'#febd59', fontWeight:'bold', fontSize:'18px', zIndex: 1, position: 'relative'}}>Bilgiler yükleniyor...</div>
        ) : tmdbData ? (
          <>
            {tmdbData.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w300${tmdbData.poster_path}`}
                alt={tmdbData.name}
                style={{
                  width: '200px',
                  height: '270px',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  background: '#222',
                  marginRight: '28px',
                  boxShadow: '0 4px 24px #000a',
                  zIndex: 1,
                  position: 'relative'
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{flex: 1, minWidth: 0, zIndex: 1, position: 'relative'}}>
              <div style={{fontWeight:'bold', fontSize:'2rem', marginBottom:'8px', color:'#febd59', letterSpacing: '0.5px', textShadow:'0 2px 12px #000'}}>
                {tmdbData.name}
              </div>
              <div style={{color:'#fff', fontSize:'1.1rem', marginBottom:'10px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}> 
                <span style={{color:'#ffd700', background:'rgba(255,215,0,0.25)', padding:'4px 10px', borderRadius:'8px', fontWeight:'600', fontSize:'1rem', display:'flex', alignItems:'center', gap:'4px', backdropFilter:'blur(6px)', border:'1px solid rgba(255,215,0,0.3)'}}>
                  <span className="material-icons" style={{fontSize:'18px', verticalAlign:'middle'}}>star</span>
                  {tmdbData.vote_average?.toFixed(1)}
                </span>
                {certification && (
                  <span style={{color:'#ff6b6b', background:'rgba(255,107,107,0.25)', padding:'4px 10px', borderRadius:'8px', fontSize:'1rem', fontWeight:'600', backdropFilter:'blur(6px)', border:'1px solid rgba(255,107,107,0.3)'}}>
                    {certification}
                  </span>
                )}
                <span style={{textShadow:'0 2px 8px #000'}}>{tmdbData.genres?.map(g => g.name).join(', ')}</span>
              </div>
              {tmdbData.overview && (
                <div style={{
                  fontSize:'1.08rem',
                  marginBottom:'14px',
                  color:'#fff',
                  lineHeight: 1.6,
                  maxHeight: '90px',
                  overflow: 'auto',
                  textShadow:'0 2px 8px #000'
                }}>
                  {tmdbData.overview}
                </div>
              )}
              <div style={{display:'flex', gap:'18px', flexWrap:'wrap', marginBottom:'10px'}}>
                {tmdbData.first_air_date && (
                  <div style={{fontSize:'1rem', textShadow:'0 2px 8px #000', color:'#fff'}}>
                    <b style={{color:'#febd59'}}>Yayın Yılı:</b> {tmdbData.first_air_date.slice(0,4)}
                  </div>
                )}
                {tmdbData.status && (
                  <div style={{fontSize:'1rem', textShadow:'0 2px 8px #000', color:'#fff'}}>
                    <b style={{color:'#febd59'}}>Durum:</b> {
                      tmdbData.status === 'Returning Series' ? 'Devam Ediyor' :
                      tmdbData.status === 'Ended' ? 'Sona Erdi' :
                      tmdbData.status === 'Canceled' ? 'İptal Edildi' :
                      tmdbData.status === 'In Production' ? 'Yapım Aşamasında' :
                      tmdbData.status
                    }
                  </div>
                )}
                {watchProviders && (watchProviders.TR?.flatrate?.length > 0 || watchProviders.US?.flatrate?.length > 0) && (
                  <div style={{fontSize:'1rem', textShadow:'0 2px 8px #000', color:'#fff'}}>
                    <b style={{color:'#febd59'}}>Akış:</b> {
                      watchProviders.TR?.flatrate?.map(p => p.provider_name).join(', ') ||
                      watchProviders.US?.flatrate?.map(p => p.provider_name).join(', ')
                    }
                  </div>
                )}
              </div>
              {tmdbData.credits?.cast?.length > 0 && (
                <div style={{fontSize:'1rem', marginBottom:'8px', display:'flex', flexDirection:'column', gap:'6px'}}>
                  <b style={{color:'#febd59', textShadow:'0 2px 8px #000'}}>Oyuncular:</b>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'18px', marginTop:'8px'}}>
                    {tmdbData.credits.cast.slice(0,6).map((actor, index) => (
                      <div key={actor.id} style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'8px',
                        background:'rgba(0,0,0,0.7)',
                        borderRadius:'8px',
                        padding:'4px 10px 4px 4px',
                        boxShadow:'0 2px 12px #000',
                        backdropFilter:'blur(8px)',
                        border:'1px solid rgba(255,255,255,0.1)'
                      }}>
                        {actor.profile_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                            alt={actor.name}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              background: '#222',
                              border: '1.5px solid #febd59'
                            }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <a 
                          href={`https://www.themoviedb.org/person/${actor.id}-${actor.name.toLowerCase().replace(/\s+/g, '-')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{color:'#febd59', textDecoration:'none', fontWeight:'500', fontSize:'1rem', textShadow:'0 1px 4px #000'}}
                          onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.target.style.textDecoration = 'none'}
                        >
                          {actor.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{fontSize:'1rem', marginTop:'10px', textShadow:'0 2px 8px #000', color:'#fff'}}>
                <b style={{color:'#febd59'}}>TMDB'de Görüntüle:</b>{' '}
                <a href={`https://www.themoviedb.org/tv/${tmdbData.id}`} target="_blank" rel="noopener noreferrer" style={{color:'#3af', fontWeight:'bold'}}>
                  TMDB'de Görüntüle
                </a>
              </div>
            </div>
          </>
        ) : (
          <div style={{color:'#febd59', fontWeight:'bold', fontSize:'18px', zIndex: 1, position: 'relative'}}>Dizi bilgisi bulunamadı.</div>
        )}
      </div>
      <h2 style={{marginBottom:'32px', color:'#febd59', fontWeight:'bold'}}>
        {decodeURIComponent(platformName)} / {decodeURIComponent(seriesName)}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))`,
        gap: '24px'
      }}>
        {episodesList.map((bolum, i) => (
          <div 
            key={i} 
            ref={(el) => (itemRefs.current[i] = el)}
            tabIndex={0}
            style={{
              background: focusedIndex === i ? '#444' : '#222',
              borderRadius: '12px',
              boxShadow: focusedIndex === i ? '0 0 24px #febd59' : '0 2px 12px #0008',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '7px',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, background 0.2s',
              outline: 'none'
            }}
            onClick={() => handleEpisodeClick(bolum.url)}
          >
            {bolum.logo && (
              <img
                src={bolum.logo}
                alt={bolum['tvg-name'] || bolum.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: '#333'
                }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{fontWeight:'bold', textAlign:'center', fontSize:'15px'}}>
              {getEpisodeTitle(bolum)}
            </div>
            {shouldShowSeasonLine(bolum) && (
              <div style={{color:'#bbb', fontSize:'13px', textAlign:'center', marginTop:'4px'}}>
                {bolum.seasonEpisode}
              </div>
            )}
          </div>
        ))}
      </div>
      {playerUrl && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={handlePlayerClose}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              padding: '12px',
              cursor: 'pointer',
              zIndex: 1003,
            }}
          >
            <span className="material-icons">close</span>
          </button>
          <SimpleHlsPlayer url={playerUrl} />
        </div>
      )}
    </div>
  );
}
