import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import SimpleHlsPlayer from './SimpleHlsPlayer';

export default function PlatformSeriesDetail() {
  const { platformName, seriesName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { platform, episodes } = location.state || {};
  const [columns, setColumns] = useState(getColumns());
  const [playerUrl, setPlayerUrl] = useState(null);

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

  return (
    <div style={{background:'#111', minHeight:'100vh', color:'#fff', padding:'32px'}}>
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          padding: '12px',
          fontSize: '22px',
          cursor: 'pointer',
          zIndex: 1001
        }}
      >
        <span className="material-icons">arrow_back</span>
      </button>
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
