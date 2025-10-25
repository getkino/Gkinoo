import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { parseM3U, initialPlatforms } from './PlatformShowcase';
// normalize helper: "Disney+" -> "disneyplus", "hbo-max" -> "hbomax", vs.
function normalizeName(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/\+/g, 'plus')
    .replace(/&/g, 'and')
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, ''); // remove non-alphanum
}

function extractSeriesName(title) {
  if (!title) return 'Bilinmeyen';
  // Most entries look like: "Series Name - 1.Sezon 1.Bölüm" — take part before " - "
  const parts = title.split(' - ');
  return (parts[0] || title).trim();
}

function groupByTvgName(groups) {
  // Group parsed items by series name (tvg-name/title prefix), not platform.
  // Input `groups` is an object: { groupTitle: [items...] }
  const allItems = Object.values(groups).flat();
  const map = new Map();
  for (const item of allItems) {
    // prefer explicit tvg-name or name, otherwise extract from title
    const raw = (item['tvg-name'] || item.name || item.tvgn || item.title || '').toString();
    const series = extractSeriesName(raw || item.title);
    const key = series || 'Bilinmeyen';
    if (!map.has(key.toLowerCase())) map.set(key.toLowerCase(), { displayName: key, items: [] });
    map.get(key.toLowerCase()).items.push(item);
  }
  const result = {};
  for (const { displayName, items } of map.values()) {
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
  const params = useParams();
  // param adı route tanımına göre değişebilir; genelde tek parametre olur.
  const rawParam = params && Object.keys(params).length ? params[Object.keys(params)[0]] : undefined;
  // If route has a second param (e.g. /platform/:platform/:series) capture it
  const paramKeys = params ? Object.keys(params) : [];
  const seriesParamRaw = paramKeys.length > 1 ? params[paramKeys[1]] : undefined;
  // decode then normalize
  const paramName = rawParam ? decodeURIComponent(rawParam) : undefined;
  const seriesParam = seriesParamRaw ? decodeURIComponent(seriesParamRaw) : undefined;

  // Eğer location.state.platform yoksa, paramName ile initialPlatforms içinde eşleşen platformu kullan.
  const platform = useMemo(() => {
    if (state?.platform) return state.platform;
    if (paramName) {
      const normParam = normalizeName(paramName);
      const found = initialPlatforms.find(p => normalizeName(p.name) === normParam);
      if (found) return found;
      return { name: paramName, m3u: undefined, logo: undefined, video: undefined };
    }
    return null;
  }, [state, paramName]);

  const navigate = useNavigate();
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
      setLoading(true);
      // Eğer platform nesnesi zaten items içeriyorsa (PlatformShowcase tarafından build edilmiş), doğrudan kullan
      if (platform?.items && Array.isArray(platform.items)) {
        setGroups({ [platform.name]: platform.items });
        // If a series was requested via location.state or URL param, open it
        const requestedSeries = state?.series || seriesParam;
        if (requestedSeries) {
          // group by series and try to find a match
          const seriesMap = groupByTvgName({ [platform.name]: platform.items });
          const matchKey = Object.keys(seriesMap).find(k => normalizeName(k) === normalizeName(requestedSeries) || k.toLowerCase().includes(requestedSeries.toLowerCase()));
          if (matchKey) {
            setSelectedSeries(seriesMap[matchKey]);
          }
        }
        setLoading(false);
        return;
      }
 
      // Eğer m3u yoksa boş bırak
      if (!platform?.m3u) {
        setGroups({});
        setLoading(false);
        return;
      }
 
      try {
        const res = await fetch(platform.m3u);
        const text = await res.text();
        const parsed = parseM3U(text); // tüm gruplar
        // Sadece platform ile eşleşen group-title'leri al.
        const normPlatform = normalizeName(platform.name);
        const filtered = {};
        // 1) Tam normalize eşleşme
        for (const k of Object.keys(parsed)) {
          if (normalizeName(k) === normPlatform) filtered[k] = parsed[k];
        }
        // 2) Eğer yoksa normalize includes
        if (Object.keys(filtered).length === 0) {
          for (const k of Object.keys(parsed)) {
            if (normalizeName(k).includes(normPlatform) || normPlatform.includes(normalizeName(k))) {
              filtered[k] = parsed[k];
            }
          }
        }
        // 3) Hâlâ yoksa: grup içindeki başlık veya tvg-name'lerde eşleşme arayalım (daha esnek fallback)
        if (Object.keys(filtered).length === 0) {
          for (const k of Object.keys(parsed)) {
            const anyMatch = parsed[k].some(it => {
              const t = (it.title || it.name || it['tvg-name'] || '').toString();
              return normalizeName(t).includes(normPlatform);
            });
            if (anyMatch) filtered[k] = parsed[k];
          }
        }
        // Sonuç: sadece ilgili gruplar setlenir
        setGroups(filtered);
        // If the route or navigation requested a specific series, try to open it
        const requestedSeries = state?.series || seriesParam;
        if (requestedSeries) {
          const seriesMap = groupByTvgName(parsed);
          // find case-insensitive normalized match
          const matchKey = Object.keys(seriesMap).find(k => normalizeName(k) === normalizeName(requestedSeries) || k.toLowerCase().includes(requestedSeries.toLowerCase()));
          if (matchKey) {
            setSelectedSeries(seriesMap[matchKey]);
          }
        }
       } catch {
         setGroups({});
       }
       setLoading(false);
     }
     fetchM3U();
  }, [platform?.m3u, platform?.items, platform?.name]);

  // Reset item refs and focused index when groups or selectedSeries change
  useEffect(() => {
    itemRefs.current = [];
    setFocusedIndex(0);
  }, [groups, selectedSeries]);
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
        
        {/* Show series/group title (when a series is open) or platform name instead of poster */}
        <div
          aria-hidden={false}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            color: '#fff',
            textAlign: 'center',
            padding: '8px 16px',
            background: 'rgba(0,0,0,0.18)',
            borderRadius: 8,
            backdropFilter: 'blur(6px)'
          }}
        >
          <div style={{fontSize: 'clamp(18px, 3.5vw, 36px)', fontWeight: 800, letterSpacing: 0.6}}>
            {selectedSeries ? (selectedSeries[0]?.['tvg-name'] || selectedSeries[0]?.name || selectedSeries[0]?.title) : platform?.name}
          </div>
        </div>
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