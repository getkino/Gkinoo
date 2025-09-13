import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [now, setNow] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [trailers, setTrailers] = useState({}); // {id: trailerKey}

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

  // Kumanda desteği için klavye olaylarını dinle
  useEffect(() => {
    const handleKeyDown = (e) => {
      const cards = document.querySelectorAll('.card');
      if (!cards.length) return;

      let currentIndex = selectedCard !== null ? selectedCard : 0;
      switch (e.key) {
        case 'ArrowRight':
          currentIndex = Math.min(currentIndex + 1, cards.length - 1);
          break;
        case 'ArrowLeft':
          currentIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          currentIndex = Math.min(currentIndex + 4, cards.length - 1);
          break;
        case 'ArrowUp':
          currentIndex = Math.max(currentIndex - 4, 0);
          break;
        case 'Enter':
          if (selectedCard !== null) {
            const card = cards[selectedCard];
            const path = card.getAttribute('data-path');
            if (path) navigate(path);
          }
          break;
        default:
          return;
      }
      setSelectedCard(currentIndex);
      cards[currentIndex].focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, selectedCard]);

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

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' ? '#121212' : '#fff',
      color: theme === 'dark' ? '#fff' : '#333',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      <AppHeader active="home" />

      {/* Yeni Çıkacaklar Bölümü */}
      <div style={{
        width: '100%',
        margin: '0 auto 40px auto',
        padding: '0 20px'
      }}>
        <h2 style={{
          color: theme === 'dark' ? '#fff' : '#333',
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 18,
          marginLeft: 10
        }}>
          Yakında Gelecek Film & Diziler
        </h2>
        <div
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'auto',
            paddingBottom: 16,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {upcoming.length === 0 && (
            <div style={{ color: '#888', fontSize: 16 }}>Yükleniyor...</div>
          )}
          {upcoming.map((item, i) => (
            <div
              key={item.id}
              tabIndex={0}
              className="card"
              style={{
                flex: '0 0 320px',
                minWidth: 320,
                maxWidth: 400,
                top: 8,
                left: 8,
                aspectRatio: '16/9',
                position: 'relative',
                borderRadius: 16,
                overflow: hovered === i ? 'visible' : 'hidden',
                background: theme === 'dark' ? '#23272f' : '#f3f4f6',
                border: 'none',
                outline: selectedCard === i ? '2.5px solid #ffffffff' : 'none',
                cursor: 'pointer',
                transition: 'outline 0.18s',
                zIndex: hovered === i || selectedCard === i ? 2 : 1,
                backgroundClip: 'padding-box',
                willChange: undefined,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setSelectedCard(i)}
              onBlur={() => setSelectedCard(null)}
              onClick={() => {
                // örnek: detay sayfasına yönlendirme yapılabilir
                // navigate(`/detay/${item.id}`);
              }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w780${item.backdrop || item.img}`}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 16,
                  transition: 'filter 0.18s'
                }}
                loading="lazy"
              />
              {(hovered === i || selectedCard === i) && (
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
              <div style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                padding: '18px 20px 14px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                pointerEvents: 'none'
              }}>
                <div style={{
                  color: theme === 'dark' ? '#fff' : '#23272f',
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 2.2vw, 22px)',
                  marginBottom: 2,
                  letterSpacing: 0.1,
                  textShadow: theme === 'dark' ? '0 2px 8px #0007' : 'none',
                  lineHeight: 1.18,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  whiteSpace: 'normal',
                  minHeight: '2.6em',
                  maxHeight: '2.6em',
                  textAlign: 'left',
                  alignSelf: 'flex-start'
                }}>
                  {item.title}
                </div>
                <div style={{
                  width: 32,
                  height: 3,
                  background: (hovered === i || selectedCard === i) ? '#fff' : 'transparent',
                  borderRadius: 2,
                  margin: '6px 0 8px 0',
                  transition: 'background 0.18s'
                }} />
                <div style={{
                  color: theme === 'dark' ? '#ffffffff' : '#374151',
                  fontWeight: 400,
                  fontSize: 14,
                  letterSpacing: 0.1,
                  marginBottom: 0,
                  lineHeight: 1.2
                }}>
                  {item.date
                    ? `${new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}`
                    : ''}
                </div>
                {/* You can add more info here, e.g. overview or date */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;