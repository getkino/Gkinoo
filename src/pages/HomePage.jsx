import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import AppHeader from '../components/AppHeader';
import SimpleHlsPlayer from '../components/SimpleHlsPlayer';
import axios from 'axios';
import { buildCategoriesFromM3U } from './CategoryShowcase';

const HomePage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [now, setNow] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [trailers, setTrailers] = useState({}); // {id: trailerKey}
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

  // Sabit kanal kartları (logolar eklendi)
  const channels = [
    {
      id: 'dmax',
      title: 'DMAX',
      url: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/DMAX/DMAX.m3u',
      subtitle: 'DMAX canlı yayın',
      img: '/images/dmax.jpg'
    },
    {
      id: 'tlc',
      title: 'TLC',
      url: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/TLC/TLC.m3u',
      subtitle: 'TLC canlı yayın',
      img: '/images/tlc.jpg'
    }
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

  // Sabit listeye göre (her kategori için) slider'larda gösterilecek bölümleri oluştur
  const filmSections = useMemo(() => {
    // filmCategories zaten buildCategoriesFromM3U tarafından { title, items } şeklinde geliyor
    // Eğer boşsa categoryList'e göre boş bölümler yerine hiç bölüm dönülmesi daha doğru olabilir
    if (!filmCategories || filmCategories.length === 0) {
      return [];
    }

    // filmCategories sırasını bozmadan her bir grubu bir section olarak kullan
    return filmCategories.map(cat => ({
      title: cat.title,
      items: Array.isArray(cat.items) ? cat.items.slice(0, 12) : []
    }));
  }, [filmCategories]);

  // Trend filmler - her kategoriden ilk film
  const trendMovies = useMemo(() => {
    if (!filmCategories.length) return [];
    
    return filmCategories
      .filter(category => category.items && category.items.length > 0)
      .slice(0, 10) // İlk 10 kategoriden
      .map(category => category.items[0])
      .filter(Boolean);
  }, [filmCategories]);

  // Global indeks ofsetleri: yakında + trendler + kanallar + sabit kategori slider'ları toplamı
  const filmCardCount = filmSections.reduce((acc, s) => acc + s.items.length, 0);

  // filmSections uzunluklarına dayalı stabil imza (klavye deps için)
  const sectionsSignature = useMemo(
    () => filmSections.map(s => s.items?.length || 0).join(','),
    [filmSections]
  );

  // Toplam kart değişince seçili indeksi aralıkta tut (filmCardCount sonrası)
  useEffect(() => {
    const total = upcoming.length + trendMovies.length + channels.length + filmCardCount;
    if (total <= 0) return;
    setSelectedCard(prev => {
      const idx = prev ?? 0;
      return Math.min(Math.max(idx, 0), total - 1);
    });
  }, [upcoming.length, trendMovies.length, channels.length, filmCardCount]);

  // Kumanda desteği için klavye olaylarını dinle
  useEffect(() => {
    const handleKeyDown = (e) => {
      const cards = document.querySelectorAll('.card');
      if (!cards.length) return;

      let currentIndex = selectedCard !== null ? selectedCard : 0;

      // Bölümleri DOM sırasına göre kur: Yakında -> Trend Filmler -> Kanallar -> Kategoriler
      const sections = [];
      let cursor = 0;

      if (upcoming.length > 0) {
        sections.push({ name: 'Yakında', start: cursor, count: upcoming.length });
        cursor += upcoming.length;
      }
      if (trendMovies.length > 0) {
        sections.push({ name: 'Trend Filmler', start: cursor, count: trendMovies.length });
        cursor += trendMovies.length;
      }
      if (channels.length > 0) {
        sections.push({ name: 'Kanallar', start: cursor, count: channels.length });
        cursor += channels.length;
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
            const trailerId = card.getAttribute('data-trailer-id');
            const trailerType = card.getAttribute('data-trailer-type');
            const title = card.getAttribute('aria-label');
            
            // Yakında Gelecek kartı ise fragman aç
            if (trailerId && trailerType) {
              (async () => {
                const trailerKey = await fetchTrailer(trailerId, trailerType);
                if (trailerKey) {
                  window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank', 'noopener');
                } else {
                  window.open(`https://www.themoviedb.org/${trailerType}/${trailerId}`, '_blank', 'noopener');
                }
              })();
            } else if (url && title) {
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
    upcoming.length,
    trendMovies.length,
    channels.length,
    filmCardCount,
    sectionsSignature
  ]);

  // TMDB'den yeni çıkacak film ve dizileri çek
  useEffect(() => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey) return;

    const fetchUpcoming = async () => {
      try {
        // Filmler
        const movieRes = await axios.get(
          `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=tr-TR&page=1&region=TR`
        );
        // Diziler (yeni sezonlar için "air_date" kullanılır)
        const tvRes = await axios.get(
          `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=tr-TR&page=1`
        );
        const today = new Date();
        // Sadece bugünden sonraki filmleri al
        const movies = movieRes.data.results
          .filter(item => item.release_date && new Date(item.release_date) >= today)
          .slice(0, 8)
          .map(item => ({
            id: item.id,
            type: 'movie',
            img: item.poster_path,
            backdrop: item.backdrop_path,
            date: item.release_date,
            title: item.title,
            overview: item.overview
          }));
        // Dizilerde yeni sezonun ilk bölümü için air_date kullan, bugünden sonraki bölümleri al
        const tvs = tvRes.data.results
          .filter(item => {
            const airDate = item.air_date || item.first_air_date;
            return airDate && new Date(airDate) >= today;
          })
          .slice(0, 8)
          .map(item => ({
            id: item.id,
            type: 'tv',
            img: item.poster_path,
            backdrop: item.backdrop_path,
            date: item.air_date || item.first_air_date,
            title: item.name,
            overview: item.overview
          }));
        // Tarihe göre sırala ve ilk 8 tanesini göster
        const combined = [...movies, ...tvs]
          .filter(i => i.img && i.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 8);
        setUpcoming(combined);
      } catch (err) {
        setUpcoming([]);
      }
    };
    fetchUpcoming();
  }, []);

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
  }, [filmSections, upcoming.length, channels.length]);

  // TMDB'den fragman key'i çekme fonksiyonu
  const fetchTrailer = async (itemId, itemType) => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey || trailers[itemId]) return trailers[itemId];
    
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/${itemType}/${itemId}/videos?api_key=${apiKey}&language=tr-TR`
      );
      
      let trailerKey = null;
      
      // Önce Türkçe trailer ara
      const turkishTrailer = response.data.results?.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
      );
      
      if (turkishTrailer) {
        trailerKey = turkishTrailer.key;
      } else {
        // Türkçe bulunamazsa İngilizce dene
        const englishResponse = await axios.get(
          `https://api.themoviedb.org/3/${itemType}/${itemId}/videos?api_key=${apiKey}&language=en-US`
        );
        
        const englishTrailer = englishResponse.data.results?.find(video => 
          video.type === 'Trailer' && video.site === 'YouTube'
        );
        
        if (englishTrailer) {
          trailerKey = englishTrailer.key;
        }
      }
      
      setTrailers(prev => ({ ...prev, [itemId]: trailerKey }));
      return trailerKey;
    } catch (error) {
      console.warn(`Fragman bulunamadı: ${itemId}`);
      setTrailers(prev => ({ ...prev, [itemId]: null }));
      return null;
    }
  };

  // Film kartı render edildiğinde TMDB fragman'ını yükle
  useEffect(() => {
    upcoming.forEach(item => {
      if (!trailers[item.id] && trailers[item.id] !== null) {
        fetchTrailer(item.id, item.type);
      }
    });
  }, [upcoming]);

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
      <AppHeader active="home" />

      {/* Yakında Gelecek Film & Diziler - ÜSTE ALINDI */}
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
          Yakında Gelecek Film & Diziler
        </h2>

        <div
          className="draggable-scroll"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 24,
            overflowX: 'auto',
            paddingBottom: 16,
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab'
          }}
        >
          {upcoming.length === 0 && (
            <div style={{ color: '#888', fontSize: 16 }}>Yükleniyor...</div>
          )}

          {upcoming.map((item, i) => {
            const globalIndex = i;
            const isActive = hovered === globalIndex || selectedCard === globalIndex;
            const dateStr = item.date
              ? new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
              : '';

            return (
              <div
                key={item.id}
                tabIndex={-1}
                className="card"
                data-trailer-id={item.id}
                data-trailer-type={item.type}
                style={{
                  // dikdörtgen kart
                  flex: '0 0 240px',
                  minWidth: 240,
                  maxWidth: 280,
                  position: 'relative',
                  borderRadius: 16,
                  background: 'transparent',
                  border: 'none',
                  outline: isActive ? '2.5px solid #fff' : 'none',
                  cursor: 'pointer',
                  transition: 'outline 0.18s',
                  zIndex: isActive ? 2 : 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => {
                  setHovered(globalIndex);
                  fetchTrailer(item.id, item.type);
                }}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => {}}
                onBlur={() => {}}
                onClick={async (e) => {
                  const scroller = e.currentTarget.closest('.draggable-scroll');
                  if (scroller && scroller.dataset.dragging === 'true') return;
                  
                  const trailerKey = await fetchTrailer(item.id, item.type);
                  if (trailerKey) {
                    window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank', 'noopener');
                  } else {
                    window.open(`https://www.themoviedb.org/${item.type}/${item.id}`, '_blank', 'noopener');
                  }
                }}
              >
                {/* Poster alanı (16:9) */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: theme === 'dark' ? '#23272f' : '#f3f4f6'
                }}>
                  {/* Tarih rozeti */}
                  {dateStr && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: '#9c1717ff',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,.25)',
                      zIndex: 2
                    }}>
                      {dateStr}
                    </div>
                  )}

                  {/* Görsel */}
                  <img
                    src={`https://image.tmdb.org/t/p/w780${item.backdrop || item.poster_path || item.img || ''}`}
                    alt={item.title}
                    loading="lazy"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />

                  {/* Alt gradient (okunabilirlik için) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)',
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Başlık - resmin içinde alt kısımda */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 12,
                      right: 12,
                      bottom: 10,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      lineHeight: 1.25,
                      textAlign: 'left',
                      textShadow: '0 2px 8px rgba(0,0,0,.6)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      zIndex: 2,
                      pointerEvents: 'none'
                    }}
                  >
                    {item.title}
                  </div>

                  {/* Hover/Seçim çerçevesi */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 16,
                      border: '2.5px solid #fff',
                      boxSizing: 'border-box',
                      pointerEvents: 'none',
                      zIndex: 3
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend Filmler - Yakında Gelecek'ten sonra eklendi */}
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
              const globalIndex = upcoming.length + i;
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

      {/* Kanallar (DMAX & TLC) */}
      <div style={{
        width: '100%',
        margin: '0 auto 28px auto',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, paddingLeft: 10 }}>
          <h2 style={{
            color: theme === 'dark' ? '#fff' : '#333',
            fontSize: 22,
            fontWeight: 700,
            margin: 0
          }}>
            Canlı Kanallar
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
          {channels.map((ch, i) => {
            const globalIndex = upcoming.length + trendMovies.length + i; // Upcoming + Trend Filmler sonrası
            return (
              <div
                key={ch.id}
                tabIndex={-1}
                className="card"
                data-url={ch.url}
                style={{
                  flex: '0 0 200px',
                  minWidth: 200,
                  maxWidth: 250,
                  height: 120,
                  position: 'relative',
                  borderRadius: 16,
                  overflow: hovered === globalIndex ? 'visible' : 'hidden',
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
                  window.open(ch.url, '_blank', 'noopener');
                }}
              >
                {/* Arkaplan */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, #0f172a 0%, #111827 50%, #1f2937 100%)'
                      : 'linear-gradient(135deg, #284174 0%, #d1d5db 50%, #cbd5e1 100%)'
                  }}
                />
                {/* Logo */}
                <img
                  src={ch.img}
                  alt={`${ch.title} logo`}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '70%',
                    maxHeight: '70%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: 8,
                    boxShadow: theme === 'dark' ? '0 6px 18px rgba(0, 0, 0, 0)' : 'none',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />
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
                {/* Yazı overlay'i kaldırıldı */}
                {/* <div> ...başlık ve alt başlık alanı... </div> */}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sabit kategori listesine göre ayrı yatay slider'lar */}
      {filmSections.map((cat, cIdx) => {
        // Upcoming + Trend Filmler + Kanallar offset
        const baseOffset = upcoming.length + trendMovies.length + channels.length;
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

export default HomePage;