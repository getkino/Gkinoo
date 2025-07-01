// src/components/ChannelGrid.jsx
import { useEffect, useState, useRef } from 'react';
import { getPoster } from '../utils/getPoster';

export default function ChannelGrid({ channels, onSelect, focusedIndex, imageMap, setFocusedIndex, isProgramPage }) {
  const [posters, setPosters] = useState({});
  const containerRef = useRef(null);

  // Responsive kolon ve afiş yüksekliği ayarı
  const getColumns = () => {
    if (window.innerWidth < 600) return 2;      // Telefon
    if (window.innerWidth < 900) return 3;      // Tablet
    if (window.innerWidth < 1400) return isProgramPage ? 4 : 3; // Küçük ekran TV/dar masaüstü
    return isProgramPage ? 5 : 4;               // Büyük ekran
  };

  const getPosterHeight = () => {
    if (!isProgramPage) return window.innerWidth < 600 ? 100 : 180;
    if (window.innerWidth < 600) return 160;    // Telefon
    if (window.innerWidth < 900) return 210;    // Tablet
    if (window.innerWidth < 1400) return 260;   // Küçük ekran TV/dar masaüstü
    return 320;                                 // Büyük ekran
  };

  const [columns, setColumns] = useState(getColumns());
  const [posterHeight, setPosterHeight] = useState(getPosterHeight());

  useEffect(() => {
    const handleResize = () => {
      setColumns(getColumns());
      setPosterHeight(getPosterHeight());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isProgramPage]);

  useEffect(() => {
    if (!isProgramPage) return;
    const fetchPosters = async () => {
      const newPosters = {};
      for (const ch of channels) {
        const poster = await getPoster(ch.name);
        newPosters[ch.name] = poster;
      }
      setPosters(newPosters);
    };
    fetchPosters();
  }, [channels, isProgramPage]);

  useEffect(() => {
    const item = containerRef.current?.querySelector(`[data-index="${focusedIndex}"]`);
    if (item) item.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusedIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Sadece grid aktifken yön tuşları çalışsın, input odakta ise engelle
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
      ) return;

      // Yön tuşları için satır/sütun mantığı
      if (e.key === "ArrowRight") {
        setFocusedIndex(i => {
          const next = i + 1;
          return next < channels.length ? next : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setFocusedIndex(i => {
          const prev = i - 1;
          return prev >= 0 ? prev : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        setFocusedIndex(i => {
          const next = i + columns;
          return next < channels.length ? next : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setFocusedIndex(i => {
          const prev = i - columns;
          return prev >= 0 ? prev : i;
        });
        e.preventDefault();
      } else if (e.key === "Enter") {
        onSelect(channels[focusedIndex]);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [channels, focusedIndex, setFocusedIndex, onSelect, columns]);

  return (
    <div
      ref={containerRef}
      style={{
        padding: '20px',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(7, 1fr)`,
          gap: '12px',
          marginBottom: '24px',
          flex: 1,
          minHeight: 0
        }}
      >
        {channels.map((ch, i) => (
          <div
            key={ch.name + i}
            data-index={i}
            tabIndex={0}
            onClick={() => onSelect(ch)}
            style={{
              background: '#1e1e1e',
              borderRadius: '8px',
              cursor: 'pointer',
              outline: 'none',
              border: i === focusedIndex ? '2px solid cyan' : 'none',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <div style={{
              width: '100%',
              aspectRatio: isProgramPage ? '2/3' : '16/9',
              background: '#222'
            }}>
              <img
                src={
                  isProgramPage
                    ? (posters?.[ch.name] || imageMap?.[ch.name] || ch.logo || '/images/default.jpg')
                    : (ch.logo || imageMap?.[ch.group] || '/images/default.jpg')
                }
                alt={ch.name}
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
            <div style={{
              padding: '6px',
              color: 'white',
              fontSize: '0.92rem',
              flex: '0 0 auto',
              minHeight: '2em',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {ch.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
