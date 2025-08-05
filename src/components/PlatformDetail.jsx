import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { parseM3U } from './PlatformShowcase';

function groupByTvgName(groups) {
  // Tüm gruplardaki dizileri tek bir diziye topla
  const allSeries = Object.values(groups).flat();
  const tvgMap = {};
  for (const item of allSeries) {
    const key = item['tvg-name'] || item.name;
    if (!tvgMap[key]) tvgMap[key] = [];
    tvgMap[key].push(item);
  }
  return tvgMap;
}

export default function PlatformDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const platform = state?.platform;
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState(null);

  useEffect(() => {
    async function fetchM3U() {
      if (!platform?.m3u) return;
      setLoading(true);
      try {
        const res = await fetch(platform.m3u);
        const text = await res.text();
        setGroups(parseM3U(text));
      } catch {
        setGroups({});
      }
      setLoading(false);
    }
    fetchM3U();
  }, [platform]);

  const tvgGroups = groupByTvgName(groups);

  const getColumns = () => {
    if (window.innerWidth < 600) return 2;
    if (window.innerWidth < 900) return 3;
    if (window.innerWidth < 1400) return 5;
    if (window.innerWidth < 1800) return 7;
    return 9;
  };

  const [columns, setColumns] = useState(getColumns());

  useEffect(() => {
    function handleResize() {
      setColumns(getColumns());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!platform) return <div style={{color:'#fff'}}>Platform bilgisi yok.</div>;

  return (
    <div style={{background:'#111', minHeight:'100vh', color:'#fff', padding:'0px'}}>
      {/* Üstte logo ve video iç içe, kararartma efekti ile */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px',
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        height: '30vh'
      }}>
        <video
          src={platform.video}
          autoPlay
          loop
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '30vh',
            objectFit: 'cover',
            borderRadius: 0,
            background: '#222',
            boxShadow: 'none',
            zIndex: 1
          }}
        />
        {/* Karartma overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '30vh',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
        <img
          src={platform.logo}
          alt={platform.name}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '15%',
            maxWidth: '90vw',
            objectFit: 'contain',
            background: 'transparent',
            boxShadow: 'none',
            pointerEvents: 'none',
            zIndex: 3
          }}
        />
      </div>
      {loading ? (
        <div>Yükleniyor...</div>
      ) : Object.keys(tvgGroups).length === 0 ? (
        <div>Dizi bulunamadı.</div>
      ) : selectedSeries ? (
        <div>
          <button
            onClick={() => setSelectedSeries(null)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            Geri
          </button>
          <h2 style={{marginBottom:'24px'}}>{selectedSeries[0]['tvg-name'] || selectedSeries[0].name} Bölümleri</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(220px, 1fr))`,
            gap: '24px'
          }}>
            {selectedSeries.map((bolum, i) => (
              <div key={i} style={{
                background: '#222',
                borderRadius: '12px',
                boxShadow: '0 2px 12px #0008',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px',
                cursor: 'pointer'
              }}
              onClick={() => window.open(bolum.url, '_blank')}
              >
                <img
                  src={bolum.logo}
                  alt={bolum['tvg-name'] || bolum.name}
                  style={{
                    width: '90px',
                    height: '130px',
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
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))`,
          gap: '24px'
        }}>
          {Object.entries(tvgGroups).map(([tvgName, episodes], i) => (
            <div
              key={i}
              style={{
                background: '#222',
                borderRadius: '12px',
                boxShadow: '0 2px 12px #0008',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '7px',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/platform/${encodeURIComponent(platform.name)}/${encodeURIComponent(tvgName)}`, {
                state: { platform, series: tvgName, episodes }
              })}
            >
              <img
                src={episodes[0].logo}
                alt={tvgName}
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
              <div style={{fontWeight:'bold', textAlign:'center', fontSize:'16px'}}>
                {tvgName}
              </div>
              {/* Alt başlık kaldırıldı */}
              {/* <div style={{color:'#bbb', fontSize:'13px', textAlign:'center', marginTop:'4px'}}>
                {episodes[0].title}
              </div> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
