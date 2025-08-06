import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SimpleHlsPlayer from './SimpleHlsPlayer';

// TMDB API anahtarınızı buraya ekleyin
const TMDB_API_KEY = '9fbeefd9c72e02a5779273e36fd769a5';

export default function PlatformSeriesDetail() {
  const { platformName, seriesName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { platform, episodes } = location.state || {};
  const [columns, setColumns] = useState(getColumns());
  const [playerUrl, setPlayerUrl] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [tmdbLoading, setTmdbLoading] = useState(true);

  function getColumns() {
    if (window.innerWidth < 600) return 2;
    if (window.innerWidth < 900) return 3;
    if (window.innerWidth < 1400) return 5;
    if (window.innerWidth < 1800) return 7;
    return 9;
  }

  useEffect(() => {
    function handleResize() {
      setColumns(getColumns());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            `https://api.themoviedb.org/3/tv/${show.id}?api_key=${TMDB_API_KEY}&language=tr&append_to_response=credits`
          );
          const detailJson = await detailRes.json();
          setTmdbData(detailJson);
        } else {
          setTmdbData(null);
        }
      } catch {
        setTmdbData(null);
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
        gap: '18px',
        marginBottom: '32px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            padding: '12px',
            fontSize: '22px',
            cursor: 'pointer',
            zIndex: 1,
            marginRight: '8px',
            alignSelf: 'flex-start'
          }}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        {tmdbLoading ? (
          <div>Bilgiler yükleniyor...</div>
        ) : tmdbData ? (
          <>
            <img
              src={tmdbData.poster_path ? `https://image.tmdb.org/t/p/w185${tmdbData.poster_path}` : ''}
              alt={tmdbData.name}
              style={{
                width: '180px',
                height: '240px',
                objectFit: 'cover',
                borderRadius: '12px',
                background: '#222',
                marginRight: '18px'
              }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div>
              <div style={{fontWeight:'bold', fontSize:'22px', marginBottom:'4px'}}>{tmdbData.name}</div>
              <div style={{color:'#ccc', fontSize:'15px', marginBottom:'2px'}}>
                {tmdbData.genres?.map(g => g.name).join(', ')} • <span style={{color:'#ffd700'}}>★ {tmdbData.vote_average?.toFixed(2)}</span>
              </div>
              <div style={{fontSize:'15px', marginBottom:'8px'}}>
                {tmdbData.overview}
              </div>
              <div style={{fontSize:'15px', marginBottom:'2px'}}>
                <b>Yayın Yılı:</b> {tmdbData.first_air_date?.slice(0,4)}
              </div>
              <div style={{fontSize:'15px', marginBottom:'2px'}}>
                <b>Yayıncı:</b> {
                  tmdbData.networks?.filter(n =>
                    n.origin_country === 'TR'
                  ).map(n => n.name).join(', ') ||
                  tmdbData.networks?.map(n => n.name).join(', ')
                }
              </div>
              <div style={{fontSize:'15px', marginBottom:'2px'}}>
                <b>Oyuncular:</b> {tmdbData.credits?.cast?.slice(0,6).map(a => a.name).join(', ')}
              </div>
              <div style={{fontSize:'15px', marginBottom:'2px'}}>
                <b>TMDB'de Görüntüle:</b>{' '}
                <a href={`https://www.themoviedb.org/tv/${tmdbData.id}`} target="_blank" rel="noopener noreferrer" style={{color:'#3af'}}>
                  TMDB'de Görüntüle
                </a>
              </div>
            </div>
          </>
        ) : (
          <div>Dizi bilgisi bulunamadı.</div>
        )}
      </div>
      <h2 style={{marginBottom:'32px'}}>
        {decodeURIComponent(platformName)} / {decodeURIComponent(seriesName)}
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))`,
        gap: '24px'
      }}>
        {(episodes || []).map((bolum, i) => (
          <div key={i} style={{
            background: '#222',
            borderRadius: '12px',
            boxShadow: '0 2px 12px #0008',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '7px',
            cursor: 'pointer'
          }}
          onClick={() => setPlayerUrl(bolum.url)}
          >
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
            <div style={{fontWeight:'bold', textAlign:'center', fontSize:'15px'}}>
              {bolum.title}
            </div>
            <div style={{color:'#bbb', fontSize:'13px', textAlign:'center', marginTop:'4px'}}>
              {bolum.seasonEpisode}
            </div>
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
            onClick={() => setPlayerUrl(null)}
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
