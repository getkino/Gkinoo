import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { parseM3U } from './PlatformShowcase';

function groupByTvgName(groups) {
  // group-title bazlı normalize (trim + lowerCase) gruplama
  const allItems = Object.values(groups).flat();
  const normMap = new Map();
  for (const item of allItems) {
    const rawGroup = ((item['group-title'] ?? item.group ?? '') + '').trim();
    if (!rawGroup) continue;
    const normKey = rawGroup.toLowerCase();
    if (!normMap.has(normKey)) {
      normMap.set(normKey, { displayName: rawGroup, items: [] });
    }
    normMap.get(normKey).items.push(item);
  }
  const result = {};
  for (const { displayName, items } of normMap.values()) {
    result[displayName] = items;
  }
  return result;
}

const getColumns = () => {
  if (window.innerWidth < 600) return 2;
  if (window.innerWidth < 900) return 3;
  if (window.innerWidth < 1400) return 5;
  if (window.innerWidth < 1800) return 7;
  return 9;
};

export default function PlatformDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const platform = state?.platform;
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [columns, setColumns] = useState(getColumns);
  const itemRefs = useRef([]);

  // Memoized calculations
  const tvgGroups = useMemo(() => groupByTvgName(groups), [groups]);
  
  const filteredTvgGroups = useMemo(() => 
    Object.fromEntries(
      Object.entries(tvgGroups).filter(([tvgName]) =>
        tvgName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ), [tvgGroups, searchTerm]
  );

  const currentItems = useMemo(() => 
    selectedSeries ? selectedSeries : Object.entries(filteredTvgGroups),
    [selectedSeries, filteredTvgGroups]
  );

  // Callbacks
  const handleBackClick = useCallback(() => navigate('/platform'), [navigate]);
  
  const handleSeriesBackClick = useCallback(() => {
    setSelectedSeries(null);
    setFocusedIndex(0);
  }, []);

  const handleSeriesClick = useCallback((tvgName, episodes) => {
    navigate(`/platform/${encodeURIComponent(platform.name)}/${encodeURIComponent(tvgName)}`, {
      state: { platform, series: tvgName, episodes }
    });
  }, [navigate, platform]);

  const handleEpisodeClick = useCallback((url) => {
    if (url) window.open(url, '_blank');
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setFocusedIndex(0);
  }, []);

  // Fetch M3U data
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
  }, [platform?.m3u]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentItems.length === 0) return;

      // Sadece uzaktan kumanda tuşlarını kabul et
      const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace'];
      if (!allowedKeys.includes(e.key)) return;

      let newIndex = focusedIndex;
      const maxIndex = currentItems.length - 1;

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
          if (selectedSeries) {
            const bolum = selectedSeries[focusedIndex];
            handleEpisodeClick(bolum?.url);
          } else {
            const [tvgName, episodes] = currentItems[focusedIndex];
            handleSeriesClick(tvgName, episodes);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (selectedSeries) {
            handleSeriesBackClick();
          } else {
            handleBackClick();
          }
          break;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        itemRefs.current[newIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, selectedSeries, columns, currentItems, handleBackClick, handleSeriesBackClick, handleSeriesClick, handleEpisodeClick]);

  if (!platform) return <div style={{color:'#fff'}}>Platform bilgisi yok.</div>;

  return (
    <div style={{background:'#111', minHeight:'100vh', color:'#fff', padding:'0px'}}>
      {/* Header section */}
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
        <button
          onClick={handleBackClick}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            padding: '10px',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 10,
            marginLeft: '5px',
          }}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        
        {platform.video && (
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
        )}
        
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
        
        {platform.logo && (
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
        )}
      </div>

      {/* Content section */}
      {loading ? (
        <div>Yükleniyor...</div>
      ) : Object.keys(tvgGroups).length === 0 ? (
        <div>Dizi bulunamadı.</div>
      ) : selectedSeries ? (
        <div>
          <button
            onClick={handleSeriesBackClick}
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
              <div
                key={i}
                ref={(el) => (itemRefs.current[i] = el)}
                tabIndex={0}
                style={{
                  background: focusedIndex === i ? '#444' : '#222',
                  borderRadius: '12px',
                  boxShadow: focusedIndex === i ? '0 0 24px #ff3b3b' : '0 2px 12px #0008',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
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
                      width: '90px',
                      height: '130px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      background: '#333'
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={{fontWeight:'bold', textAlign:'center', fontSize:'15px'}}>
                  {bolum.title}
                </div>
                {bolum.seasonEpisode && (
                  <div style={{color:'#bbb', fontSize:'13px', textAlign:'center', marginTop:'4px'}}>
                    {bolum.seasonEpisode}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{display:'flex', alignItems:'center', marginBottom:'24px'}}>
            <input
              type="text"
              placeholder="Dizi ara..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                width: '320px',
                maxWidth: '90vw',
                background: '#222',
                color: '#fff',
                boxShadow: '0 2px 8px #0004',
                marginLeft: '24px',
              }}
            />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))`,
            gap: '24px'
          }}>
            {Object.entries(filteredTvgGroups).map(([tvgName, episodes], i) => (
              <div
                key={tvgName}
                ref={(el) => (itemRefs.current[i] = el)}
                tabIndex={0}
                style={{
                  background: focusedIndex === i ? '#444' : '#222',
                  borderRadius: '12px',
                  boxShadow: focusedIndex === i ? '0 0 24px #ff3b3b' : '0 2px 12px #0008',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '7px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, background 0.2s',
                  outline: 'none'
                }}
                onClick={() => handleSeriesClick(tvgName, episodes)}
              >
                {episodes[0]?.logo && (
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
                )}
                <div style={{fontWeight:'bold', textAlign:'center', fontSize:'16px'}}>
                  {tvgName}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}