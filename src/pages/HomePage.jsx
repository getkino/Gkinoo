import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const HomePage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [now, setNow] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState(null); // Seçili kart için state

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#121212' : '#fff';
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

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

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' ? '#121212' : '#fff',
      color: theme === 'dark' ? '#fff' : '#333',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: 40 }} />
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold',
              margin: 0,
              color: theme === 'dark' ? '#fff' : '#333'
            }}>
              {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </h1>
            <p style={{ 
              fontSize: '14px', 
              opacity: 0.7, 
              margin: '5px 0 0 0' 
            }}>
              {now.toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        {/* Ayarlar butonu */}
        <button
          onClick={() => navigate('/ayarlar')}
          aria-label="Ayarlar"
          style={{
            background: theme === 'dark' ? '#202020' : '#f2f2f2',
            border: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid #e5e7eb',
            borderRadius: '50%',
            width: 72,
            height: 72,
            cursor: 'pointer',
            fontSize: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme === 'dark' ? '#ffffff' : '#111111',
            boxShadow: theme === 'dark' ? '0 2px 12px rgba(0,0,0,0.45)' : '0 2px 12px rgba(0,0,0,0.1)',
            transition: 'all .25s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        gap: '30px',
        flex: 1,
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* Main Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
          gridTemplateRows: 'auto',
          gap: '25px',
          width: '100%',
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
            gap: '15px'
          },
          '@media (min-width: 769px) and (max-width: 1024px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px'
          }
        }}>
          {/* LIVE TV - Sol üst, büyük */}
          <div
            data-path="/live-tv"
            className="card"
            tabIndex={selectedCard === 0 ? 0 : -1}
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(32, 32, 32, 0.8) 100%)' 
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: theme === 'dark' 
                ? '1px solid rgba(99, 102, 241, 0.2)' 
                : '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '32px',
              padding: '40px 32px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(99, 102, 241, 0.05)',
              outline: selectedCard === 0 ? '3px solid #00ff00' : 'none' // Seçili kart vurgusu
            }}
            onClick={() => navigate('/live-tv')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)' 
                : '0 25px 80px rgba(0, 0, 0, 0.15), 0 0 40px rgba(99, 102, 241, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(99, 102, 241, 0.05)';
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '18px' }}>📺</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                background: '#FF4D4D', color: '#fff', padding: '6px 12px', borderRadius: 12,
                fontWeight: 800, letterSpacing: 0.3
              }}>Canlı</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: theme === 'dark' ? '#fff' : '#333' }}>Tv</h2>
            </div>
          </div>

          {/* Movies - Sağ üst */}
          <div
            data-path="/kategoriler"
            className="card"
            tabIndex={selectedCard === 1 ? 0 : -1}
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(245, 87, 108, 0.15) 0%, rgba(32, 32, 32, 0.8) 100%)' 
                : 'linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: theme === 'dark' 
                ? '1px solid rgba(245, 87, 108, 0.2)' 
                : '1px solid rgba(245, 87, 108, 0.15)',
              borderRadius: '32px',
              padding: '40px 32px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(245, 87, 108, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(245, 87, 108, 0.05)',
              outline: selectedCard === 1 ? '3px solid #00ff00' : 'none' // Seçili kart vurgusu
            }}
            onClick={() => navigate('/kategoriler')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 40px rgba(245, 87, 108, 0.2)' 
                : '0 25px 80px rgba(0, 0, 0, 0.15), 0 0 40px rgba(245, 87, 108, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(245, 87, 108, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(245, 87, 108, 0.05)';
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '18px' }}>🍿</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 10px 0', color: theme === 'dark' ? '#fff' : '#333' }}>Filmler</h2>
          </div>

          {/* Series - Sağ alt */}
          <div
            data-path="/platform"
            className="card"
            tabIndex={selectedCard === 2 ? 0 : -1}
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.15) 0%, rgba(32, 32, 32, 0.8) 100%)' 
                : 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: theme === 'dark' 
                ? '1px solid rgba(79, 172, 254, 0.2)' 
                : '1px solid rgba(79, 172, 254, 0.15)',
              borderRadius: '32px',
              padding: '40px 32px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(79, 172, 254, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(79, 172, 254, 0.05)',
              outline: selectedCard === 2 ? '3px solid #00ff00' : 'none' // Seçili kart vurgusu
            }}
            onClick={() => navigate('/platform')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 40px rgba(79, 172, 254, 0.2)' 
                : '0 25px 80px rgba(0, 0, 0, 0.15), 0 0 40px rgba(79, 172, 254, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(79, 172, 254, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(79, 172, 254, 0.05)';
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '18px' }}>🚀</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 10px 0', color: theme === 'dark' ? '#fff' : '#333' }}>Diziler</h2>
          </div>

          {/* Animation - Yeni eklenen kart */}
          <div
            data-path="/animasyon"
            className="card"
            tabIndex={selectedCard === 3 ? 0 : -1}
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(138, 99, 247, 0.15) 0%, rgba(32, 32, 32, 0.8) 100%)' 
                : 'linear-gradient(135deg, rgba(138, 99, 247, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              border: theme === 'dark' 
                ? '1px solid rgba(138, 99, 247, 0.2)' 
                : '1px solid rgba(138, 99, 247, 0.15)',
              borderRadius: '32px',
              padding: '40px 32px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(138, 99, 247, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(138, 99, 247, 0.05)',
              outline: selectedCard === 3 ? '3px solid #00ff00' : 'none' // Seçili kart vurgusu
            }}
            onClick={() => navigate('/animasyon')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 25px 80px rgba(0, 0, 0, 0.4), 0 0 40px rgba(138, 99, 247, 0.2)' 
                : '0 25px 80px rgba(0, 0, 0, 0.15), 0 0 40px rgba(138, 99, 247, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = theme === 'dark' 
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(138, 99, 247, 0.1)' 
                : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px rgba(138, 99, 247, 0.05)';
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '18px' }}>🧸</div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 10px 0', color: theme === 'dark' ? '#fff' : '#333' }}>
              Çizgi Film
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;