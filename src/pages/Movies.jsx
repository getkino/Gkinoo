import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import AppHeader from '../components/AppHeader';
import SimpleHlsPlayer from '../components/SimpleHlsPlayer';
import axios from 'axios';

const Movies = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [now, setNow] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState(null);
  const [hovered, setHovered] = useState(null);
  // M3U'dan gelen kategoriler
  const [filmCategories, setFilmCategories] = useState([]);
  // TMDB posterler için cache
  const [tmdbPosters, setTmdbPosters] = useState({});
  // Player state
  const [currentVideo, setCurrentVideo] = useState(null);

  // İstenen sabit kategori listesi (sıra ve başlıklar bu listeye göre)
  const categoryList = [
    { name: "Aile", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Aksiyon", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Animasyon", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Belgeseller", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Bilim Kurgu", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Blu Ray", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Çizgi", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Dram", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Fantastik", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Gerilim", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Gizem", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Hint", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Komedi", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Korku", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Macera", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Müzikal", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Polisiye", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Psikolojik", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Romantik", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Savaş", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Suç", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Tarih", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Western", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
    { name: "Yerli", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" }
  ];

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#121212' : '#fff';
  }, [theme]);

  function handleThemeToggle() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  // İlk yüklemede ilk kartı seç
  useEffect(() => {
    if (selectedCard === null) {
      setSelectedCard(0);
    }
  }, [selectedCard]);

  // Türkçe uyumlu normalize (filmSections'tan ÖNCE)
  const normalize = (s) =>
    (s || '')
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/\s+filmleri?/g, '') // "filmleri" veya "filmler" kaldır
      .replace(/\s+/g, ' ')
      .trim();

  // Sabit listeye göre (her kategori için) slider'larda gösterilecek bölümleri oluştur
  const filmSections = useMemo(() => {
    console.log('filmCategories:', filmCategories); // Debug
    
    if (!filmCategories.length) {
      return categoryList.map(cat => ({ title: `${cat.name} filmleri`, items: [] }));
    }
    
    return categoryList.map(cat => {
      const key = normalize(cat.name);
      console.log(`Aranan: "${cat.name}" -> "${key}"`); // Debug
      
      // Direkt eşleşme ara
      let found = filmCategories.find(g => normalize(g.title) === key);
      
      // Bulunamazsa kısmi eşleşme ara
      if (!found) {
        found = filmCategories.find(g => {
          const gt = normalize(g.title);
          return gt.includes(key) || key.includes(gt);
        });
      }
      
      console.log(`"${cat.name}" için bulunan:`, found ? `${found.title} (${found.items.length} item)` : 'bulunamadı'); // Debug
      
      return { 
        title: `${cat.name} filmleri`, 
        items: found ? found.items.slice(0, 12) : [] 
      };
    });
  }, [filmCategories, categoryList]);

  // Trend filmler - her kategoriden ilk film
  const trendMovies = useMemo(() => {
    if (!filmCategories.length) return [];
    
    return filmCategories
      .filter(category => category.items && category.items.length > 0)
      .slice(0, 10) // İlk 10 kategoriden
      .map(category => category.items[0])
      .filter(Boolean);
  }, [filmCategories]);

  // Global indeks ofsetleri: sadece trendler + sabit kategori slider'ları toplamı
  const filmCardCount = filmSections.reduce((acc, s) => acc + s.items.length, 0);

  // filmSections uzunluklarına dayalı stabil imza (klavye deps için)
  const sectionsSignature = useMemo(
    () => filmSections.map(s => s.items?.length || 0).join(','),
    [filmSections]
  );

  // Toplam kart değişince seçili indeksi aralıkta tut
  useEffect(() => {
    const total = trendMovies.length + filmCardCount;
    if (total <= 0) return;
    setSelectedCard(prev => {
      const idx = prev ?? 0;
      return Math.min(Math.max(idx, 0), total - 1);
    });
  }, [trendMovies.length, filmCardCount]);

  // Kumanda desteği için klavye olaylarını dinle
  useEffect(() => {
    const handleKeyDown = (e) => {
      const cards = document.querySelectorAll('.card');
      if (!cards.length) return;

      let currentIndex = selectedCard !== null ? selectedCard : 0;

      // Bölümleri DOM sırasına göre kur: Trend Filmler -> Kategoriler
      const sections = [];
      let cursor = 0;

      if (trendMovies.length > 0) {
        sections.push({ name: 'Trend Filmler', start: cursor, count: trendMovies.length });
        cursor += trendMovies.length;
      }
      filmSections.forEach(sec => {
        const len = sec.items?.length || 0;
        if (len > 0) {
          sections.push({ name: sec.title, start: cursor, count: len });
          cursor += len;
        }
      });

      if (!sections.length) return;

      let secIdx = sections.findIndex(s => currentIndex >= s.start && currentIndex < s.start + s.count);
      if (secIdx === -1) {
        secIdx = 0;
        currentIndex = sections[0].start;
      }
      const posInSection = currentIndex - sections[secIdx].start;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, cards.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown': {
          e.preventDefault();
          if (secIdx < sections.length - 1) {
            const next = sections[secIdx + 1];
            const targetOffset = Math.min(posInSection, next.count - 1);
            currentIndex = next.start + targetOffset;
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (secIdx > 0) {
            const prev = sections[secIdx - 1];
            const targetOffset = Math.min(posInSection, prev.count - 1);
            currentIndex = prev.start + targetOffset;
          }
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (cards[currentIndex]) {
            const card = cards[currentIndex];
            const url = card.getAttribute('data-url');
            const path = card.getAttribute('data-path');
            const title = card.getAttribute('aria-label');
            
            if (url && title) {
              // Film kartı ise direkt oynat
              setCurrentVideo({
                url: url,
                title: title,
                poster: null
              });
            } else if (url && /^https?:\/\//i.test(url)) {
              window.open(url, '_blank', 'noopener');
            } else if (path) {
              navigate(path);
            }
          }
          return;
        default:
          return;
      }

      currentIndex = Math.min(Math.max(currentIndex, 0), cards.length - 1);
      setSelectedCard(currentIndex);

      const el = cards[currentIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        if (typeof el.focus === 'function') el.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    navigate,
    selectedCard,
    trendMovies.length,
    filmCardCount,
    sectionsSignature
  ]);

  // M3U parse helper (CategoryDetail.jsx'ten alınan çalışan versiyon)
  const buildCategoriesFromM3U = (text) => {
    const lines = text.split('\n');
    const groupMap = {};
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF')) {
        // Parse EXTINF line
        const match = line.match(/group-title="([^"]*)".*?,(.*)$/);
        if (match) {
          const groupTitle = match[1];
          const title = match[2];
          
          // Logo URL'sini bul
          const logoMatch = line.match(/tvg-logo="([^"]*)"/);
          const logo = logoMatch ? logoMatch[1] : '';
          
          currentItem = {
            title: title.trim(),
            logo: logo,
            group: groupTitle.trim()
          };
        }
      } else if (line && !line.startsWith('#') && currentItem) {
        // URL line
        const url = line.trim();
        const group = currentItem.group || 'Diğer';
        
        if (!groupMap[group]) {
          groupMap[group] = [];
        }
        
        groupMap[group].push({
          title: currentItem.title,
          logo: currentItem.logo,
          url: url
        });
        
        currentItem = null;
      }
    }

    return Object.entries(groupMap).map(([title, items]) => ({
      title,
      items: items.slice(0, 12)
    }));
  };

  // M3U'dan filmleri çek
  useEffect(() => {
    const m3uUrl = 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u';
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(m3uUrl, { responseType: 'text' });
        if (!cancelled) {
          const parsed = buildCategoriesFromM3U(res.data);
          console.log('Parse edilen kategoriler:', parsed); // Debug
          setFilmCategories(parsed);
        }
      } catch {
        if (!cancelled) setFilmCategories([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // TMDB'den poster çekme fonksiyonu
  const fetchTMDBPoster = async (title) => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey || tmdbPosters[title]) return tmdbPosters[title];
    
    try {
      // Film adını temizle
      const cleanTitle = title
        .replace(/\s+\(.*?\)/g, '') // (2023) gibi yıl bilgilerini kaldır
        .replace(/\s+\d{4}$/g, '') // Son yıl bilgisini kaldır
        .trim();
      
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(cleanTitle)}`
      );
      
      if (response.data.results && response.data.results.length > 0) {
        const posterPath = response.data.results[0].poster_path;
        if (posterPath) {
          const posterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
          setTmdbPosters(prev => ({ ...prev, [title]: posterUrl }));
          return posterUrl;
        }
      }
    } catch (error) {
      console.warn(`TMDB poster bulunamadı: ${title}`);
    }
    
    setTmdbPosters(prev => ({ ...prev, [title]: null }));
    return null;
  };

  // Film kartı render edildiğinde TMDB poster'ını yükle
  useEffect(() => {
    filmCategories.forEach(category => {
      category.items.forEach(item => {
        if (!tmdbPosters[item.title] && tmdbPosters[item.title] !== null) {
          fetchTMDBPoster(item.title);
        }
      });
    });
  }, [filmCategories]);

  // Fare ile sürükleyerek yatay kaydırma (draggable scroll)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.draggable-scroll'));
    const cleanups = els.map(el => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let moved = false;

      const onMouseDown = (e) => {
        isDown = true;
        moved = false;
        el.dataset.dragging = 'false';
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
        el.style.cursor = 'grabbing';
      };
      const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = x - startX;
        if (Math.abs(walk) > 5 && !moved) {
          moved = true;
          el.dataset.dragging = 'true';
        }
        el.scrollLeft = scrollLeft - walk;
      };
      const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        // click hemen sonra geldiğinde dragging=true kalsın, kısa süre sonra sıfırla
        setTimeout(() => { el.dataset.dragging = 'false'; }, 50);
        el.style.cursor = 'grab';
      };

      el.style.cursor = 'grab';
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mousemove', onMouseMove);
      el.addEventListener('mouseup', endDrag);
      el.addEventListener('mouseleave', endDrag);

      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mousemove', onMouseMove);
        el.removeEventListener('mouseup', endDrag);
        el.removeEventListener('mouseleave', endDrag);
      };
    });

    return () => cleanups.forEach(fn => fn && fn());
  }, [filmSections]);

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' ? '#121212' : '#fff',
      color: theme === 'dark' ? '#fff' : '#333',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowX: 'hidden'
    }}>
      <AppHeader active="movies" />

      {/* Trend Filmler */}
      {trendMovies.length > 0 && (
        <div style={{
          width: '100%',
          margin: '0 auto 24px auto',
          padding: '0 20px'
        }}>
          <h2 style={{
            color: theme === 'dark' ? '#fff' : '#333',
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 16,
            marginLeft: 10
          }}>
            Trend Filmler
          </h2>

          <div
            className="draggable-scroll"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 16,
              WebkitOverflowScrolling: 'touch',
              cursor: 'grab'
            }}
          >
            {trendMovies.map((item, i) => {
              const globalIndex = i;
              const isActive = hovered === globalIndex || selectedCard === globalIndex;
              const tmdbPoster = tmdbPosters[item.title];
              const posterToUse = tmdbPoster || item.logo;
              const rankNumber = i + 1;
              const isDoubleDigit = rankNumber >= 10;

              return (
                <div
                  key={`trend-${item.url}-${i}`}
                  tabIndex={-1}
                  className="card"
                  data-url={item.url}
                  style={{
                    flex: isDoubleDigit ? '0 0 280px' : '0 0 220px',
                    minWidth: isDoubleDigit ? 280 : 220,
                    maxWidth: isDoubleDigit ? 320 : 250,
                    position: 'relative',
                    borderRadius: 16,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    zIndex: isActive ? 2 : 1,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 'auto'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHovered(globalIndex)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => {}}
                  onBlur={() => {}}
                  onClick={(e) => {
                    const scroller = e.currentTarget.closest('.draggable-scroll');
                    if (scroller && scroller.dataset.dragging === 'true') return;
                    // Trend filmlerini direkt oynat
                    setCurrentVideo({
                      url: item.url,
                      title: item.title,
                      poster: posterToUse
                    });
                  }}
                >
                  {/* Büyük numara - sol tarafta, posterin arkasında kalacak */}
                  <div style={{
                    fontSize: isDoubleDigit ? 120 : 160,
                    fontWeight: 900,
                    color: isActive ? '#dc2626' : (theme === 'dark' ? '#374151' : '#9ca3af'),
                    lineHeight: isDoubleDigit ? 0.9 : 0.8, // 10 için daha geniş satır aralığı
                    textShadow: isActive ? '0 4px 8px rgba(220, 38, 38, 0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
                    userSelect: 'none',
                    width: isDoubleDigit ? 140 : 100,
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    WebkitTextStroke: isActive ? '2px #dc2626' : (theme === 'dark' ? '1px #374151' : '1px #9ca3af'),
                    WebkitTextFillColor: 'transparent',
                    zIndex: 1,
                    marginRight: isDoubleDigit ? -60 : -50,
                    display: 'flex',
                    flexDirection: isDoubleDigit ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isDoubleDigit ? '1px' : '0' // 10 için rakamlar arasında boşluk
                  }}>
                    {isDoubleDigit ? (
                      <>
                        <span style={{ display: 'block', margin: 0 }}>1</span>
                        <span style={{ display: 'block', margin: 0 }}>0</span>
                      </>
                    ) : (
                      rankNumber
                    )}
                  </div>

                  {/* Poster alanı - sağ tarafta, rakamın üstünde */}
                  <div style={{
                    position: 'relative',
                    width: 160,
                    aspectRatio: '2/3',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: theme === 'dark' ? '#23272f' : '#f3f4f6',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 8px 25px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    zIndex: 2, // Rakamın üstünde
                    border: isActive ? '2px solid #dc2626' : '2px solid transparent' // Sadece aktif durumda kırmızı
                  }}>
                    {/* Görsel */}
                    {posterToUse ? (
                      <img
                        src={posterToUse}
                        alt={item.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 10, // Border kalınlığı kadar azalt
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #0f172a 0%, #111827 50%, #1f2937 100%)'
                            : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #cbd5e1 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10 // Border kalınlığı kadar azalt
                        }}
                      >
                        <div style={{
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: 'center',
                          padding: '8px',
                          lineHeight: 1.2
                        }}>
                          {item.title}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sabit kategori listesine göre ayrı yatay slider'lar */}
      {filmSections.map((cat, cIdx) => {
        // Sadece Trend Filmler offset
        const baseOffset = trendMovies.length;
        const itemsBefore = filmSections.slice(0, cIdx).reduce((a, c) => a + c.items.length, 0);
        return (
          <div key={cat.title} style={{ width: '100%', margin: '0 auto 28px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, paddingLeft: 10 }}>
              <h2 style={{
                color: theme === 'dark' ? '#fff' : '#333',
                fontSize: 22,
                fontWeight: 700,
                margin: 0
              }}>
                {cat.title}
              </h2>
              <span style={{
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                Daha fazlasını görüntüle ›
              </span>
            </div>

            <div
              className="draggable-scroll"
              style={{
                display: 'flex',
                gap: 20,
                overflowX: 'auto',
                paddingBottom: 16,
                WebkitOverflowScrolling: 'touch',
                cursor: 'grab'
              }}
            >
              {cat.items.map((item, i) => {
                const globalIndex = baseOffset + itemsBefore + i; // Yeni offset
                const tmdbPoster = tmdbPosters[item.title];
                const posterToUse = tmdbPoster || item.logo;
                
                return (
                  <div
                    key={`${item.url}-${i}`}
                    tabIndex={-1}
                    className="card"
                    aria-label={item.title}
                    data-url={item.url}
                    style={{
                      flex: '0 0 200px',
                      minWidth: 200,
                      maxWidth: 220,
                      aspectRatio: '2/3',
                      position: 'relative',
                      borderRadius: 16,
                      overflow: 'hidden', // hover overflow kaldırıldı
                      background: theme === 'dark' ? '#23272f' : '#f3f4f6',
                      border: 'none',
                      outline: selectedCard === globalIndex ? '2.5px solid #ffffffff' : 'none',
                      cursor: 'pointer',
                      transition: 'outline 0.18s',
                      zIndex: hovered === globalIndex || selectedCard === globalIndex ? 2 : 1,
                      backgroundClip: 'padding-box'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHovered(globalIndex)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      const scroller = e.currentTarget.closest('.draggable-scroll');
                      if (scroller && scroller.dataset.dragging === 'true') return;
                      // Film kartını direkt oynat
                      setCurrentVideo({
                        url: item.url,
                        title: item.title,
                        poster: posterToUse
                      });
                    }}
                  >
                    {posterToUse ? (
                      <img
                        src={posterToUse}
                        alt={item.title}
                        loading="lazy"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: 16 
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 16,
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #0f172a 0%, #111827 50%, #1f2937 100%)'
                            : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #cbd5e1 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div style={{
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: 'center',
                          padding: '16px',
                          lineHeight: 1.3
                        }}>
                          {item.title}
                        </div>
                      </div>
                    )}
                    {(hovered === globalIndex || selectedCard === globalIndex) && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: 16,
                        border: '2.5px solid #fff',
                        boxSizing: 'border-box',
                        pointerEvents: 'none'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Player Modal */}
      {currentVideo && (
        <SimpleHlsPlayer
          url={currentVideo.url}
          title={currentVideo.title}
          poster={currentVideo.poster}
          onClose={() => setCurrentVideo(null)}
        />
      )}

      {/* ...existing code... footer vb. */}
    </div>
  );
};

export default Movies;