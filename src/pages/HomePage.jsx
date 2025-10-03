import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, useRef, useReducer } from 'react';
import AppHeader from '../components/AppHeader';
import SimpleHlsPlayer from '../components/SimpleHlsPlayer';
import axios from 'axios';
import { buildCategoriesFromM3U } from './CategoryShowcase';

// Sabitler
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const M3U_URL = 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u';

const CHANNELS = [
  { id: 'dmax', title: 'DMAX', url: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/DMAX/DMAX.m3u', img: '/images/dmax.jpg' },
  { id: 'tlc', title: 'TLC', url: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/TLC/TLC.m3u', img: '/images/tlc.jpg' }
];

// Utility fonksiyonları
const cleanTitle = (title) => title.replace(/\s+\(.*?\)/g, '').replace(/\s+\d{4}$/g, '').trim();
const formatRuntime = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

// Cache reducer'ı
const cacheReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_POSTERS':
    case 'UPDATE_LOGOS':
    case 'UPDATE_META':
    case 'UPDATE_TRAILERS':
      return { ...state, [action.key]: { ...state[action.key], ...action.payload } };
    default:
      return state;
  }
};

// Custom hook'lar
const useApi = () => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const cacheRef = useRef(new Map());

  const makeRequest = useCallback(async (url, cacheKey) => {
    if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey);

    try {
      const response = await axios.get(url, { timeout: 5000 });
      cacheRef.current.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.warn(`API isteği başarısız: ${url}`, error);
      return null;
    }
  }, []);

  return { apiKey, makeRequest };
};

const useGlobalIndex = (sections) => {
  return useMemo(() => {
    let offset = 0;
    return sections.map(sec => ({ ...sec, start: offset, end: offset + sec.count - 1 }));
  }, [sections]);
};

const useKeyboardNavigation = (selectedCard, setSelectedCard, sections, navigate, setCurrentVideo, fetchTrailer) => {
  const cardsRef = useRef([]);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      const cards = document.querySelectorAll('.card');
      cardsRef.current = Array.from(cards);
      if (!cardsRef.current.length || !sections.length) return;

      let currentIndex = selectedCard ?? 0;
      if (currentIndex >= cardsRef.current.length) {
        currentIndex = 0;
      }

      const secIdx = sections.findIndex(s => currentIndex >= s.start && currentIndex < s.start + s.count);
      if (secIdx === -1) {
        currentIndex = 0;
        setSelectedCard(0);
        return;
      }

      const posInSection = currentIndex - sections[secIdx].start;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, cardsRef.current.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (secIdx < sections.length - 1) {
            const next = sections[secIdx + 1];
            currentIndex = next.start + Math.min(posInSection, next.count - 1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (secIdx > 0) {
            const prev = sections[secIdx - 1];
            currentIndex = prev.start + Math.min(posInSection, prev.count - 1);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const card = cardsRef.current[currentIndex];
          if (!card) return;

          const url = card.getAttribute('data-url');
          const title = card.getAttribute('aria-label');
          const trailerId = card.getAttribute('data-trailer-id');
          const trailerType = card.getAttribute('data-trailer-type');

          if (trailerId && trailerType) {
            const trailerKey = await fetchTrailer(trailerId, trailerType);
            const trailerUrl = trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : `https://www.themoviedb.org/${trailerType}/${trailerId}`;
            window.open(trailerUrl, '_blank', 'noopener');
          } else if (url && title) {
            setCurrentVideo({ url, title, poster: null });
          } else if (url?.startsWith('http')) {
            window.open(url, '_blank', 'noopener');
          }
          return;
        default:
          return;
      }

      setSelectedCard(Math.max(0, Math.min(currentIndex, cardsRef.current.length - 1)));
      const el = cardsRef.current[currentIndex];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, sections, navigate, setCurrentVideo, fetchTrailer, setSelectedCard]);
};

// Drag hook'u slider için
const useDragScroll = (ref) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      element.dataset.dragging = 'true';
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
      element.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX) * 2;
      element.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isDragging = false;
      element.dataset.dragging = 'false';
      element.style.cursor = 'grab';
    };

    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [ref]);
};

// Alt bileşenler
const HeroSection = ({ featuredMovie, topTenMovies, hovered, selectedCard, cache, theme, setCurrentVideo, fetchTMDBMeta, fetchTMDBLogo, setHovered }) => {
  const top10Ref = useRef(null);
  useDragScroll(top10Ref);

  const globalOffset = featuredMovie ? 1 : 0;
  const activeIndex = (hovered !== null && hovered > 0 && hovered <= topTenMovies.length ? hovered - 1 : null) || (selectedCard !== null && selectedCard > 0 && selectedCard <= topTenMovies.length ? selectedCard - 1 : null);
  const activeMovie = activeIndex !== null ? topTenMovies[activeIndex] : featuredMovie;
  const currentMeta = activeIndex !== null ? cache.meta[activeMovie.title] || null : (cache.meta[featuredMovie.title] || null);
  const currentLogo = activeIndex !== null ? cache.logos[activeMovie.title] || null : (cache.logos[featuredMovie.title] || null);
  const currentBackdrop = (activeMovie ? (cache.meta[activeMovie.title]?.backdropUrl || cache.posters[activeMovie.title]) : (currentMeta?.backdropUrl || cache.posters[featuredMovie.title])) || null;

  useEffect(() => {
    if (activeMovie && cache.meta[activeMovie.title] === undefined) fetchTMDBMeta(activeMovie.title);
    if (activeMovie && cache.logos[activeMovie.title] === undefined) fetchTMDBLogo(activeMovie.title);
  }, [activeMovie, cache.meta, cache.logos, fetchTMDBMeta, fetchTMDBLogo]);

  return (
    <div 
      className="card" 
      aria-label={featuredMovie.title} 
      data-url={featuredMovie.url} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '100vw', 
        height: '75vh', 
        minHeight: 500, 
        marginBottom: 0, 
        cursor: 'pointer', 
        overflow: 'hidden', 
        background: '#000' 
      }} 
      onClick={() => {
        const posterToUse = cache.posters[featuredMovie.title] || featuredMovie.logo || null;
        setCurrentVideo({ url: featuredMovie.url, title: featuredMovie.title, poster: posterToUse });
      }}
      onMouseEnter={() => setHovered(0)}
      onMouseLeave={() => setHovered(null)}
    >
      {/* Backdrop görsel */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {currentBackdrop && (
          <img
            src={currentBackdrop}
            alt={activeMovie?.title || featuredMovie.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.5s ease'
            }}
          />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,.7) 0%, transparent 50%), linear-gradient(0deg, rgba(0,0,0,.8) 0%, transparent 70%)'
        }} />
      </div>

      {/* İçerik */}
      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '4%',
        zIndex: 2,
        color: '#fff',
        maxWidth: '36%'
      }}>
        {currentLogo ? (
          <img
            src={currentLogo}
            alt={activeMovie.title}
            style={{
              maxWidth: '400px',
              maxHeight: '120px',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              marginBottom: '0.5rem',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,.6))',
              transition: 'all 0.5s ease'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <h1 style={{
            fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
            fontWeight: 700,
            margin: 0,
            marginBottom: '0.5rem',
            textShadow: '2px 2px 4px rgba(0,0,0,.45)',
            lineHeight: 1.1,
            transition: 'all 0.5s ease',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}>
            {activeMovie.title}
          </h1>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem',
          fontSize: '14px',
          fontWeight: 400,
          transition: 'all 0.3s ease',
          flexWrap: 'wrap'
        }}>
          <span style={{
            background: '#46d369',
            color: '#000',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            {currentMeta?.cert || '16+'} 
          </span>
          {currentMeta?.year && (
            <span style={{ whiteSpace: 'nowrap' }}>{currentMeta.year}</span>
          )}
          {formatRuntime(currentMeta?.runtime) && (
            <span style={{ whiteSpace: 'nowrap' }}>{formatRuntime(currentMeta.runtime)}</span>
          )}
          <span style={{
            border: '1px solid #fff',
            padding: '1px 4px',
            fontSize: '10px',
            whiteSpace: 'nowrap'
          }}>
            HD
          </span>
        </div>

        <p style={{
          fontSize: '16px',
          lineHeight: 1.4,
          margin: '0 0 1.5rem 0',
          textShadow: '2px 2px 4px rgba(0,0,0,.45)',
          transition: 'all 0.5s ease',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical'
        }}>
          {currentMeta?.overview || 'Popülerler listesindeki en iyi içerik. İzlemeye başlamak için Oynat\'a tıklayın.'}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              const posterToUse = cache.posters[activeMovie.title] || activeMovie.logo || null;
              setCurrentVideo({ url: activeMovie.url, title: activeMovie.title, poster: posterToUse });
            }}
          >
            ▶ Oynat
          </button>
        </div>
      </div>

      {/* Top 10 şeridi */}
      {topTenMovies.length > 0 && (
        <div
          style={{
            position: 'absolute',
            right: '2%',
            bottom: '6%',
            width: '580px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 2
          }}
        >
          <div style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '15px',
            textShadow: '2px 2px 4px rgba(0,0,0,.8)'
          }}>
            Top 10 Filmler
          </div>
          <div 
            ref={top10Ref}
            className="draggable-scroll"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '12px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              cursor: 'grab'
            }}
          >
            <style>{`.draggable-scroll::-webkit-scrollbar{display:none}`}</style>
            {topTenMovies.map((m, i) => {
              const globalIndex = globalOffset + i;
              const isActive = hovered === globalIndex || selectedCard === globalIndex;
              const posterToUse = cache.posters[m.title] || m.logo || null;
              
              return (
                <div
                  key={`top10-${m.url}-${i}`}
                  className="card"
                  aria-label={m.title}
                  data-url={m.url}
                  style={{
                    flex: '0 0 100px',
                    height: '150px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#333',
                    border: isActive
                      ? '3px solid #fff'
                      : '2px solid rgba(255,255,255,.3)',
                    cursor: 'pointer',
                    position: 'relative',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive 
                      ? '0 10px 20px rgba(0,0,0,.8)' 
                      : '0 6px 12px rgba(0,0,0,.6)'
                  }}
                  onMouseEnter={() => setHovered(globalIndex)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    const scroller = e.currentTarget.closest('.draggable-scroll');
                    if (scroller && scroller.dataset.dragging === 'true') return;
                    setCurrentVideo({ url: m.url, title: m.title, poster: posterToUse });
                  }}
                >
                  {posterToUse ? (
                    <img src={posterToUse} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '10px', padding: 4, textAlign: 'center', lineHeight: 1.2,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word'
                    }}>
                      {m.title}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    background: isActive ? 'rgba(220,38,38,.95)' : 'rgba(0,0,0,.9)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 6px',
                    borderRadius: '3px',
                    minWidth: '18px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,.5)'
                  }}>
                    {i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TrendRow = ({ trendMovies, globalOffset, hovered, selectedCard, cache, theme, setCurrentVideo, setHovered }) => {
  const trendRef = useRef(null);
  useDragScroll(trendRef);

  return (
    <>
      {trendMovies.length > 0 && (
        <div style={{ width: '100%', margin: '0 auto 40px auto', padding: '0 20px' }}>
          <h2 style={{ color: theme === 'dark' ? '#fff' : '#333', fontSize: 22, fontWeight: 700, marginBottom: 16, marginLeft: 10 }}>
            Trend Filmler
          </h2>
          <div ref={trendRef} className="draggable-scroll" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, overflowX: 'auto', paddingBottom: 16, WebkitOverflowScrolling: 'touch', cursor: 'grab' }}>
            <style>{`.draggable-scroll::-webkit-scrollbar{display:none}`}</style>
            {trendMovies.map((item, i) => {
              const globalIndex = globalOffset + i;
              const isActive = hovered === globalIndex || selectedCard === globalIndex;
              const tmdbPoster = cache.posters[item.title];
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
                    setCurrentVideo({
                      url: item.url,
                      title: item.title,
                      poster: posterToUse
                    });
                  }}
                >
                  <div style={{
                    fontSize: isDoubleDigit ? 120 : 160,
                    fontWeight: 900,
                    color: isActive ? '#dc2626' : (theme === 'dark' ? '#374151' : '#9ca3af'),
                    lineHeight: isDoubleDigit ? 0.9 : 0.8,
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
                    gap: isDoubleDigit ? '1px' : '0'
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
                    zIndex: 2,
                    border: isActive ? '2px solid #dc2626' : '2px solid transparent'
                  }}>
                    {posterToUse ? (
                      <img
                        src={posterToUse}
                        alt={item.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 10,
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
                          borderRadius: 10
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
    </>
  );
};

const UpcomingRow = ({ upcoming, globalOffset, hovered, selectedCard, theme, fetchTrailer, setHovered }) => {
  const upcomingRef = useRef(null);
  useDragScroll(upcomingRef);

  return (
    <>
      <div style={{ width: '100%', margin: '0 auto 40px auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, overflow: 'hidden' }}>
          <div style={{ flex: '0 0 320px', maxWidth: 360 }}>
            <div style={{
              width: 60,
              height: 4,
              background: '#803228ff',
              borderRadius: 2,
              marginBottom: 14
            }} />
            <h2 style={{
              color: theme === 'dark' ? '#fff' : '#111827',
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 0.2,
              margin: 0,
              lineHeight: 1.15
            }}>
              Yakında Vizyona<br />Girecek İçerikler
            </h2>
            <p style={{
              color: theme === 'dark' ? '#9aa4b2' : '#4b5563',
              fontSize: 14,
              fontWeight: 500,
              marginTop: 12
            }}>
              Vizyona Girecek Yeni İçerikleri İnceleyin
            </p>
          </div>

          <div
            ref={upcomingRef}
            className="draggable-scroll"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 28,
              overflowX: 'auto',
              paddingBottom: 18,
              WebkitOverflowScrolling: 'touch',
              cursor: 'grab',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              flex: 1
            }}
          >
            <style>{`.draggable-scroll::-webkit-scrollbar{display:none}`}</style>

            {upcoming.length === 0 && (
              <div style={{ color: '#888', fontSize: 16 }}>Yükleniyor...</div>
            )}

            {upcoming.map((item, i) => {
              const globalIndex = globalOffset + i;
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
                    flex: '0 0 150px',
                    minWidth: 150,
                    maxWidth: 150,
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    zIndex: isActive ? 2 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHovered(globalIndex)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={async (e) => {
                    const scroller = e.currentTarget.closest('.draggable-scroll');
                    if (scroller && scroller.dataset.dragging === 'true') return;
                    const trailerKey = await fetchTrailer(item.id, item.type);
                    if (trailerKey) window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank', 'noopener');
                    else window.open(`https://www.themoviedb.org/${item.type}/${item.id}`, '_blank', 'noopener');
                  }}
                >
                  <div style={{ position: 'relative', width: 110, height: 110, marginBottom: 22 }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      padding: 3,
                      background: 'conic-gradient(from 180deg, #803228ff, #803228ff 35%, #803228ff 70%, #803228ff 100%)',
                      boxShadow: isActive
                        ? '0 0 0 4px rgba(217, 61, 40, 0.35), 0 10px 24px rgba(0,0,0,0.35)'
                        : '0 8px 18px rgba(0,0,0,0.25)'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: theme === 'dark' ? '#0f172a' : '#e5e7eb'
                      }}>
                        <img
                          src={`https://image.tmdb.org/t/p/w300${item.img || item.poster_path || ''}`}
                          alt={item.title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    </div>

                    {dateStr && (
                      <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: -12,
                        background: '#803228ff',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 6px 18px rgba(255, 255, 255, 0)'
                      }}>
                        {dateStr}
                      </div>
                    )}
                  </div>

                  <h3 style={{
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    margin: '6px 0 0 0',
                    minHeight: 36,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {item.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

const ChannelRow = ({ channels, globalOffset, hovered, selectedCard, theme, setHovered }) => {
  const channelRef = useRef(null);
  useDragScroll(channelRef);

  return (
    <>
      <div style={{ width: '100%', margin: '0 auto 28px auto', padding: '0 20px' }}>
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

        <div ref={channelRef} className="draggable-scroll" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 16, WebkitOverflowScrolling: 'touch', cursor: 'grab' }}>
          {channels.map((ch, i) => {
            const globalIndex = globalOffset + i;
            const isActive = hovered === globalIndex || selectedCard === globalIndex;
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
                  overflow: isActive ? 'visible' : 'hidden',
                  background: theme === 'dark' ? '#23272f' : '#f3f4f6',
                  border: 'none',
                  outline: isActive ? '2.5px solid #ffffffff' : 'none',
                  cursor: 'pointer',
                  transition: 'outline 0.18s',
                  zIndex: isActive ? 2 : 1,
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
                {isActive && (
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
    </>
  );
};

const CategoryRow = ({ cat, globalOffset, itemsBefore, hovered, selectedCard, cache, theme, setCurrentVideo, setHovered }) => {
  const categoryRef = useRef(null);
  useDragScroll(categoryRef);

  return (
    <>
      <div style={{ width: '100%', margin: '0 auto 28px auto', padding: '0 20px' }}>
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

        <div ref={categoryRef} className="draggable-scroll" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 16, WebkitOverflowScrolling: 'touch', cursor: 'grab' }}>
          {cat.items.map((item, i) => {
            const globalIndex = globalOffset + itemsBefore + i;
            const tmdbPoster = cache.posters[item.title];
            const posterToUse = tmdbPoster || item.logo;
            const isActive = hovered === globalIndex || selectedCard === globalIndex;
            
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
                  overflow: 'hidden',
                  background: theme === 'dark' ? '#23272f' : '#f3f4f6',
                  border: 'none',
                  outline: isActive ? '2.5px solid #ffffffff' : 'none',
                  cursor: 'pointer',
                  transition: 'outline 0.18s',
                  zIndex: isActive ? 2 : 1,
                  backgroundClip: 'padding-box'
                }}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHovered(globalIndex)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  const scroller = e.currentTarget.closest('.draggable-scroll');
                  if (scroller && scroller.dataset.dragging === 'true') return;
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
                {isActive && (
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
    </>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [selectedCard, setSelectedCard] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  // Data states
  const [filmCategories, setFilmCategories] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  
  // Cache state
  const [cache, dispatchCache] = useReducer(cacheReducer, {
    posters: {},
    logos: {},
    meta: {},
    trailers: {}
  });

  const { apiKey, makeRequest } = useApi();

  // Memoized computed values
  const filmSections = useMemo(() => {
    if (!filmCategories?.length) return [];
    return filmCategories.map(cat => ({
      title: cat.title,
      items: Array.isArray(cat.items) ? cat.items.slice(0, 12) : []
    }));
  }, [filmCategories]);

  const [trendMovies, topTenMovies] = useMemo(() => {
    if (!filmCategories.length) return [[], []];
    
    const allMovies = filmCategories
      .filter(cat => cat.items?.length > 0)
      .flatMap(cat => cat.items);
    
    if (!allMovies.length) return [[], []];

    const shuffled = [...allMovies].sort(() => Math.random() - 0.5);
    return [shuffled.slice(0, 10), shuffled.slice(10, 20)];
  }, [filmCategories]);

  const featuredMovie = useMemo(() => topTenMovies[0] || null, [topTenMovies]);

  // Navigation sections
  const sections = useMemo(() => {
    const result = [];
    let cursor = 0;

    if (featuredMovie) {
      result.push({ name: 'Hero', start: cursor, count: 1 });
      cursor += 1;
    }
    if (topTenMovies.length) {
      result.push({ name: 'Top 10', start: cursor, count: topTenMovies.length });
      cursor += topTenMovies.length;
    }
    if (trendMovies.length) {
      result.push({ name: 'Trend', start: cursor, count: trendMovies.length });
      cursor += trendMovies.length;
    }
    if (upcoming.length) {
      result.push({ name: 'Upcoming', start: cursor, count: upcoming.length });
      cursor += upcoming.length;
    }
    if (CHANNELS.length) {
      result.push({ name: 'Channels', start: cursor, count: CHANNELS.length });
      cursor += CHANNELS.length;
    }
    
    filmSections.forEach(sec => {
      if (sec.items?.length) {
        result.push({ name: sec.title, start: cursor, count: sec.items.length });
        cursor += sec.items.length;
      }
    });

    return result;
  }, [featuredMovie, topTenMovies.length, trendMovies.length, upcoming.length, filmSections]);

  // API functions - optimized
  const fetchTMDBPoster = useCallback(async (title) => {
    if (!apiKey || cache.posters[title] !== undefined) return cache.posters[title];
    
    const cleanedTitle = cleanTitle(title);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(cleanedTitle)}`;
    const data = await makeRequest(url, `poster_${cleanedTitle}`);
    
    const posterUrl = data?.results?.[0]?.poster_path 
      ? `${TMDB_IMAGE_BASE}/w500${data.results[0].poster_path}`
      : null;
    
    dispatchCache({
      type: 'UPDATE_POSTERS',
      key: 'posters',
      payload: { [title]: posterUrl }
    });
    
    return posterUrl;
  }, [apiKey, makeRequest, cache.posters]);

  const fetchTMDBLogo = useCallback(async (title) => {
    if (!apiKey || cache.logos[title] !== undefined) return cache.logos[title];
    
    const cleanedTitle = cleanTitle(title);
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(cleanedTitle)}`;
    const searchData = await makeRequest(searchUrl, `search_${cleanedTitle}`);
    
    const movieId = searchData?.results?.[0]?.id;
    if (!movieId) {
      dispatchCache({
        type: 'UPDATE_LOGOS',
        key: 'logos',
        payload: { [title]: null }
      });
      return null;
    }

    const imagesUrl = `https://api.themoviedb.org/3/movie/${movieId}/images?api_key=${apiKey}`;
    const imagesData = await makeRequest(imagesUrl, `images_${movieId}`);
    
    const logos = imagesData?.logos || [];
    const logo = logos.find(l => l.iso_639_1 === 'tr') || 
                 logos.find(l => l.iso_639_1 === 'en') || 
                 logos.find(l => !l.iso_639_1) || 
                 null;
    
    const logoUrl = logo ? `${TMDB_IMAGE_BASE}/w500${logo.file_path}` : null;
    
    dispatchCache({
      type: 'UPDATE_LOGOS',
      key: 'logos',
      payload: { [title]: logoUrl }
    });
    
    return logoUrl;
  }, [apiKey, makeRequest, cache.logos]);

  const fetchTMDBMeta = useCallback(async (title) => {
    if (!apiKey || cache.meta[title] !== undefined) return cache.meta[title];
    
    const cleanedTitle = cleanTitle(title);
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(cleanedTitle)}`;
    const searchData = await makeRequest(searchUrl, `search_${cleanedTitle}`);
    
    const movie = searchData?.results?.[0];
    if (!movie) {
      dispatchCache({
        type: 'UPDATE_META',
        key: 'meta',
        payload: { [title]: null }
      });
      return null;
    }

    const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=tr-TR&append_to_response=credits,release_dates`;
    const details = await makeRequest(detailsUrl, `details_${movie.id}`);
    
    if (!details) return null;

    const meta = {
      year: details.release_date ? new Date(details.release_date).getFullYear() : null,
      runtime: details.runtime || null,
      backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${details.backdrop_path}` : null,
      cast: (details.credits?.cast || []).slice(0, 6).map(c => c.name).filter(Boolean),
      cert: details.release_dates?.results
        ?.find(r => ['TR', 'US', 'GB'].includes(r.iso_3166_1))
        ?.release_dates?.find(x => x.certification)?.certification || '16+',
      overview: details.overview || movie.overview || ''
    };
    
    dispatchCache({
      type: 'UPDATE_META',
      key: 'meta',
      payload: { [title]: meta }
    });
    
    return meta;
  }, [apiKey, makeRequest, cache.meta]);

  const fetchTrailer = useCallback(async (itemId, itemType) => {
    if (!apiKey || cache.trailers[itemId] !== undefined) return cache.trailers[itemId];
    
    const urls = [
      `https://api.themoviedb.org/3/${itemType}/${itemId}/videos?api_key=${apiKey}&language=tr-TR`,
      `https://api.themoviedb.org/3/${itemType}/${itemId}/videos?api_key=${apiKey}&language=en-US`
    ];
    
    for (const url of urls) {
      const data = await makeRequest(url, `trailer_${itemId}_${url.includes('tr-TR') ? 'tr' : 'en'}`);
      const trailer = data?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      
      if (trailer) {
        dispatchCache({
          type: 'UPDATE_TRAILERS',
          key: 'trailers',
          payload: { [itemId]: trailer.key }
        });
        return trailer.key;
      }
    }
    
    dispatchCache({
      type: 'UPDATE_TRAILERS',
      key: 'trailers',
      payload: { [itemId]: null }
    });
    return null;
  }, [apiKey, makeRequest, cache.trailers]);

  // Effects
  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#121212' : '#fff';
  }, [theme]);

  // Data fetching
  useEffect(() => {
    let cancelled = false;
    
    const fetchM3U = async () => {
      try {
        const response = await axios.get(M3U_URL, { responseType: 'text', timeout: 10000 });
        if (!cancelled) {
          setFilmCategories(buildCategoriesFromM3U(response.data));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('M3U fetch failed:', error);
          setFilmCategories([]);
        }
      }
    };

    fetchM3U();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    
    let cancelled = false;
    
    const fetchUpcoming = async () => {
      try {
        const [movieRes, tvRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=tr-TR&page=1&region=TR`),
          axios.get(`https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=tr-TR&page=1`)
        ]);
        
        if (cancelled) return;

        const today = new Date();
        const movies = movieRes.data.results
          ?.filter(item => item.release_date && new Date(item.release_date) >= today)
          .slice(0, 8)
          .map(item => ({
            id: item.id,
            type: 'movie',
            img: item.poster_path,
            date: item.release_date,
            title: item.title,
            overview: item.overview
          })) || [];

        const tvs = tvRes.data.results
          ?.filter(item => {
            const airDate = item.air_date || item.first_air_date;
            return airDate && new Date(airDate) >= today;
          })
          .slice(0, 8)
          .map(item => ({
            id: item.id,
            type: 'tv',
            img: item.poster_path,
            date: item.air_date || item.first_air_date,
            title: item.name,
            overview: item.overview
          })) || [];

        const combined = [...movies, ...tvs]
          .filter(i => i.img && i.date)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 8);
          
        setUpcoming(combined);
      } catch (error) {
        if (!cancelled) {
          console.error('Upcoming fetch failed:', error);
          setUpcoming([]);
        }
      }
    };

    fetchUpcoming();
    return () => { cancelled = true; };
  }, [apiKey]);

  // Keyboard navigation
  useKeyboardNavigation(selectedCard, setSelectedCard, sections, navigate, setCurrentVideo, fetchTrailer);

  // Auto-fetch posters for visible movies
  useEffect(() => {
    const visibleMovies = [
      ...topTenMovies.slice(0, 5),
      ...trendMovies.slice(0, 5),
      ...filmSections.slice(0, 2).flatMap(s => s.items.slice(0, 3))
    ];

    visibleMovies.forEach(movie => {
      if (movie && cache.posters[movie.title] === undefined) {
        fetchTMDBPoster(movie.title);
      }
    });
  }, [topTenMovies, trendMovies, filmSections, fetchTMDBPoster, cache.posters]);

  // Selected card bounds
  useEffect(() => {
    const totalCards = sections.reduce((sum, s) => sum + s.count, 0);
    if (totalCards > 0) {
      setSelectedCard(0);
    }
  }, [sections]);

  const featuredMeta = useMemo(() => {
    return featuredMovie ? cache.meta[featuredMovie.title] || null : null;
  }, [featuredMovie, cache.meta]);

  // Global offsets hesapla
  const heroOffset = featuredMovie ? 1 : 0;
  const top10Offset = heroOffset + (topTenMovies.length || 0);
  const trendOffset = top10Offset + (trendMovies.length || 0);
  const upcomingOffset = trendOffset + (upcoming.length || 0);
  const channelOffset = upcomingOffset + (CHANNELS.length || 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' ? '#121212' : '#fff',
      color: theme === 'dark' ? '#fff' : '#333',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowX: 'hidden',
      width: '100%',
      maxWidth: '100vw',
      position: 'relative'
    }}>
      <AppHeader active="home" />

      {/* HERO + TOP 10 */}
      {featuredMovie && (
        <HeroSection
          featuredMovie={featuredMovie}
          topTenMovies={topTenMovies}
          hovered={hovered}
          selectedCard={selectedCard}
          cache={cache}
          theme={theme}
          setCurrentVideo={setCurrentVideo}
          fetchTMDBMeta={fetchTMDBMeta}
          fetchTMDBLogo={fetchTMDBLogo}
          setHovered={setHovered}
        />
      )}

      {/* Trend Filmler */}
      <TrendRow
        trendMovies={trendMovies}
        globalOffset={top10Offset}
        hovered={hovered}
        selectedCard={selectedCard}
        cache={cache}
        theme={theme}
        setCurrentVideo={setCurrentVideo}
        setHovered={setHovered}
      />

      {/* Yakında Gelecek */}
      <UpcomingRow
        upcoming={upcoming}
        globalOffset={trendOffset}
        hovered={hovered}
        selectedCard={selectedCard}
        theme={theme}
        fetchTrailer={fetchTrailer}
        setHovered={setHovered}
      />

      {/* Kanallar */}
      <ChannelRow
        channels={CHANNELS}
        globalOffset={upcomingOffset}
        hovered={hovered}
        selectedCard={selectedCard}
        theme={theme}
        setHovered={setHovered}
      />

      {/* Kategoriler */}
      {filmSections.map((cat, cIdx) => {
        const itemsBefore = filmSections.slice(0, cIdx).reduce((a, c) => a + c.items.length, 0);
        return (
          <CategoryRow
            key={cat.title}
            cat={cat}
            globalOffset={channelOffset}
            itemsBefore={itemsBefore}
            hovered={hovered}
            selectedCard={selectedCard}
            cache={cache}
            theme={theme}
            setCurrentVideo={setCurrentVideo}
            setHovered={setHovered}
          />
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
    </div>
  );
};

export default HomePage;