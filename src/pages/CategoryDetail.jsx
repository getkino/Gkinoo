import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { CATEGORIES_DATA, slugify } from "./CategoryShowcase";

function groupByTvgName(groups) {
  const allItems = Object.values(groups).flat();
  return allItems;
}

const parseM3U = (content) => {
  const cleanText = (str) => {
    if (!str) return '';
    return str
      .replace(/[\u0000-\u001F\u007F]/g, '') // kontrol karakterleri
      .replace(/\u00A0/g, ' ') // NBSP
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/＆/g, '&')
      .replace(/–/g, '-')
      .replace(/—/g, '-')
      .replace(/ +/g, ' ') // fazla boşluk
      .trim();
  };
  const lines = content.split(/\r?\n/);
  const groups = {};
  let pending = null;

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Başlık ayırıcı virgülü: tırnak dışındaki SON virgül
      let inQuotes = false;
      let separatorIndex = -1;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === ',' && !inQuotes) separatorIndex = i; // son görülen virgül (çıktıda genelde tek olur)
      }
      const attrPart = separatorIndex !== -1 ? line.slice(0, separatorIndex) : line;
      const rawTitle = separatorIndex !== -1 ? line.slice(separatorIndex + 1).trim() : 'Bilinmeyen Film';
      const titlePart = cleanText(rawTitle) || 'Bilinmeyen Film';

      const attrs = {};
      const attrRegex = /([a-zA-Z0-9\-]+)="([^"]*)"/g;
      let m;
      while ((m = attrRegex.exec(attrPart)) !== null) {
        attrs[m[1]] = cleanText(m[2]);
      }

      pending = {
        title: titlePart,
        name: titlePart,
        logo: attrs['tvg-logo'] || null,
        'group-title': attrs['group-title'] || 'Diğer',
        'tvg-name': attrs['tvg-name'] || titlePart,
        'tvg-id': attrs['tvg-id'] || null,
      };
    } else if (pending && !line.startsWith('#')) {
      // URL satırı
      pending.url = line;
      const groupName = pending['group-title'] || 'Diğer';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(pending);
      pending = null;
    }
  }
  return groups;
};

const getColumns = () => {
  if (window.innerWidth < 600) return 2;
  if (window.innerWidth < 900) return 3;
  if (window.innerWidth < 1400) return 5;
  if (window.innerWidth < 1800) return 7;
  return 9;
};

export default function CategoryDetail() {
  const { slug } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const fromState = state?.category;
  const fallback = CATEGORIES_DATA.find((c) => slugify(c.name) === slug);
  const category = fromState || fallback || { name: slug?.replace(/-/g, " ") || "Kategori" };
  
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [columns, setColumns] = useState(getColumns);
  const itemRefs = useRef([]);

  const tvgGroups = useMemo(() => {
    const allGroups = groupByTvgName(groups);
    const categoryNameLower = category.name.toLowerCase();
    
    // Kategori adına göre filtrele - daha geniş eşleştirme
    const filtered = allGroups.filter(item => {
      const groupTitle = (item['group-title'] || '').toLowerCase();
      
      // Direkt eşleştirmeler
      if (categoryNameLower === 'aile' && groupTitle.includes('aile')) return true;
      if (categoryNameLower === 'aksiyon' && groupTitle.includes('aksiyon')) return true;
      if (categoryNameLower === 'dram' && groupTitle.includes('dram')) return true;
      if (categoryNameLower === 'gerilim' && groupTitle.includes('gerilim')) return true;
      if (categoryNameLower === 'macera' && groupTitle.includes('macera')) return true;
      if (categoryNameLower === 'animasyon' && (groupTitle.includes('animasyon') || groupTitle.includes('çizgi'))) return true;
      if (categoryNameLower === 'çizgi' && (groupTitle.includes('çizgi') || groupTitle.includes('animasyon'))) return true;
      if (categoryNameLower === 'komedi' && groupTitle.includes('komedi')) return true;
      if (categoryNameLower === 'korku' && groupTitle.includes('korku')) return true;
      if (categoryNameLower === 'romantik' && groupTitle.includes('romantik')) return true;
      if (categoryNameLower === 'fantastik' && groupTitle.includes('fantastik')) return true;
      if (categoryNameLower === 'bilim kurgu' && (groupTitle.includes('bilim') || groupTitle.includes('kurgu'))) return true;
      if (categoryNameLower === 'savaş' && groupTitle.includes('savaş')) return true;
      if (categoryNameLower === 'suç' && groupTitle.includes('suç')) return true;
      if (categoryNameLower === 'polisiye' && groupTitle.includes('polisiye')) return true;
      if (categoryNameLower === 'western' && groupTitle.includes('western')) return true;
      if (categoryNameLower === 'yerli' && groupTitle.includes('yerli')) return true;
      if (categoryNameLower === 'tarih' && (groupTitle.includes('tarih') || groupTitle.includes('tarihi'))) return true;
      
      // Genel kategori eşleştirmesi
      return groupTitle.includes(categoryNameLower) || 
             groupTitle.includes(categoryNameLower.replace(' ', ''));
    });
    
    return filtered;
  }, [groups, category.name]);
  
  const filteredTvgGroups = useMemo(() => 
    tvgGroups.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [tvgGroups, searchTerm]
  );

  const currentItems = useMemo(() => 
    selectedSeries ? selectedSeries : filteredTvgGroups,
    [selectedSeries, filteredTvgGroups]
  );

  const handleBackClick = useCallback(() => navigate('/kategoriler'), [navigate]);
  
  const handleSeriesBackClick = useCallback(() => {
    setSelectedSeries(null);
    setFocusedIndex(0);
  }, []);

  const handleSeriesClick = useCallback((movie) => {
    setSelectedSeries([movie]);
    setFocusedIndex(0);
  }, []);

  const handleEpisodeClick = useCallback(async (movie) => {
    if (!movie) { console.warn('[CategoryDetail] handleEpisodeClick: movie yok'); return; }
    const tvgName = movie['tvg-name'] || movie.title || movie.name || 'film';
    const slugifiedName = slugify(tvgName);
    const imdbFromAttr = (movie['tvg-id'] || '').toLowerCase();
    const hasImdbAttr = /^tt\d{7,}$/.test(imdbFromAttr);
    let imdbFromUrl = null;
    if (!hasImdbAttr && movie.url) {
      const m = movie.url.match(/(tt\d{7,})/i);
      if (m) imdbFromUrl = m[1].toLowerCase();
    }
    const finalImdb = hasImdbAttr ? imdbFromAttr : imdbFromUrl;

    const tmdbKey = import.meta.env.VITE_TMDB_API_KEY || '9fbeefd9c72e02a5779273e36fd769a5';
    let tmdbId = null;

    if (finalImdb) {
      try {
        const findUrl = `https://api.themoviedb.org/3/find/${finalImdb}?api_key=${tmdbKey}&external_source=imdb_id`;
        const res = await fetch(findUrl);
        if (res.ok) {
          const json = await res.json();
          if (json.movie_results?.length) tmdbId = json.movie_results[0].id;
          else if (json.tv_results?.length) tmdbId = json.tv_results[0].id;
        }
      } catch (e) {
        console.warn('[CategoryDetail] tmdb find hata', e);
      }
    }

    let path;
    if (tmdbId) path = `/movie/${tmdbId}`; // yeni format
    else if (finalImdb) path = `/movie/${finalImdb}`; // fallback imdb
    else path = `/movie/${slugifiedName}`; // son çare slug

    console.log('[CategoryDetail] Navigate select', { tvgName, finalImdb, tmdbId, path });
    try {
      navigate(path, { state: { movie, streamUrl: movie.url } });
    } catch (e) {
      console.error('[CategoryDetail] navigate hata', e);
    }
  }, [navigate]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setFocusedIndex(0);
  }, []);

  useEffect(() => {
    async function fetchM3U() {
      if (!category?.m3u) return;
      setLoading(true);
      try {
        const res = await fetch(category.m3u);
        const text = await res.text();
        setGroups(parseM3U(text));
      } catch {
        setGroups({});
      }
      setLoading(false);
    }
    fetchM3U();
  }, [category?.m3u]);

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentItems.length === 0) return;

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
            const film = selectedSeries[focusedIndex];
            handleEpisodeClick(film);
          } else {
            const movie = currentItems[focusedIndex];
            handleEpisodeClick(movie);
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

  if (!category) return <div style={{color:'#fff'}}>Kategori bilgisi yok.</div>;

  return (
    <div style={{
      background: `#1a1a1a`, 
      minHeight:'100vh', 
      color:'#fff', 
      padding:'0px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '0px',
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
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0,0,0,0.9)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(0,0,0,0.7)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: `linear-gradient(180deg, 
              rgba(26, 26, 26, 0.95) 0%, 
              rgba(26, 26, 26, 0.8) 15%, 
              rgba(26, 26, 26, 0.6) 35%, 
              rgba(26, 26, 26, 0.4) 55%,
              rgba(26, 26, 26, 0.2) 75%,
              rgba(26, 26, 26, 0.1) 85%,
              transparent 100%
            )`,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        
        {category.logo ? (
          <img
            src={category.logo}
            alt={category.name}
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
        ) : (
          <h1 style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '4rem',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            zIndex: 3,
            color: '#fff'
          }}>
            {category.name}
          </h1>
        )}
      </div>

      {loading ? (
        <div style={{position: 'relative', zIndex: 2, paddingTop: '40px', paddingLeft: '24px'}}>Yükleniyor...</div>
      ) : tvgGroups.length === 0 ? (
        <div style={{position: 'relative', zIndex: 2, paddingTop: '40px', paddingLeft: '24px'}}>
          Bu kategoride henüz film bulunmuyor.
          <br />
          <small style={{color: '#888', marginTop: '8px', display: 'block'}}>
            Kategori: {category.name}
          </small>
        </div>
      ) : selectedSeries ? (
        <div style={{position: 'relative', zIndex: 2, paddingTop: '40px'}}>
          <button
            onClick={handleSeriesBackClick}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '24px',
              marginLeft: '24px',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.15)';
              e.target.style.border = '2px solid rgba(254, 189, 89, 0.5)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.border = '2px solid rgba(255,255,255,0.1)';
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Geri
          </button>
          <h2 style={{marginBottom:'24px', marginLeft: '24px'}}>{selectedSeries[0]['tvg-name'] || selectedSeries[0].name}</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(220px, 1fr))`,
            gap: '24px',
            padding: '0 24px',
            position: 'relative',
            zIndex: 2
          }}>
            {selectedSeries.map((film, i) => (
              <div
                key={i}
                ref={(el) => (itemRefs.current[i] = el)}
                tabIndex={0}
                style={{
                  background: focusedIndex === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  boxShadow: focusedIndex === i ? '0 0 30px rgba(254, 189, 89, 0.6)' : '0 4px 20px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  border: focusedIndex === i ? '2px solid rgba(254, 189, 89, 0.5)' : '2px solid transparent'
                }}
                onClick={() => handleEpisodeClick(film)}
                onMouseEnter={(e) => {
                  if (focusedIndex !== i) {
                    e.target.style.background = 'rgba(255,255,255,0.12)';
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (focusedIndex !== i) {
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                  }
                }}
              >
                {film.logo && (
                  <img
                    src={film.logo}
                    alt={film['tvg-name'] || film.name}
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
                <div style={{fontWeight:'bold', textAlign:'center', fontSize:'15px', fontFamily:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', Arial, sans-serif", lineHeight:1.25, wordBreak:'break-word'}}>
                  {film.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{display:'flex', alignItems:'center', marginBottom:'24px', padding: '0 24px', position: 'relative', zIndex: 2, paddingTop: '40px'}}>
            <input
              type="text"
              placeholder="Film ara..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.1)',
                fontSize: '16px',
                width: '320px',
                maxWidth: '90vw',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid rgba(254, 189, 89, 0.5)';
                e.target.style.background = 'rgba(255,255,255,0.15)';
                e.target.style.boxShadow = '0 0 20px rgba(254, 189, 89, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid rgba(255,255,255,0.1)';
                e.target.style.background = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
              }}
            />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(180px, 1fr))`,
            gap: '24px',
            padding: '0 24px',
            position: 'relative',
            zIndex: 2
          }}>
            {filteredTvgGroups.map((movie, i) => (
              <div
                key={movie['tvg-id'] || i}
                ref={(el) => (itemRefs.current[i] = el)}
                tabIndex={0}
                style={{
                  background: focusedIndex === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  boxShadow: focusedIndex === i ? '0 0 30px rgba(254, 189, 89, 0.6)' : '0 4px 20px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  border: focusedIndex === i ? '2px solid rgba(254, 189, 89, 0.5)' : '2px solid transparent'
                }}
                onClick={() => handleEpisodeClick(movie)}
                onMouseEnter={(e) => {
                  if (focusedIndex !== i) {
                    e.target.style.background = 'rgba(255,255,255,0.12)';
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (focusedIndex !== i) {
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                  }
                }}
              >
                {movie.logo && (
                  <img
                    src={movie.logo}
                    alt={movie.title}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      background: '#333'
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={{fontWeight:'bold', textAlign:'center', fontSize:'16px', fontFamily:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', Arial, sans-serif", lineHeight:1.25, wordBreak:'break-word'}}>
                  {movie.title}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}