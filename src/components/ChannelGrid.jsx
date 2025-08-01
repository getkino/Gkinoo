import { useEffect, useState, useRef, forwardRef } from 'react';
import { getPoster } from '../utils/getPoster';

const ChannelGrid = forwardRef(({ channels, onSelect, focusedIndex, imageMap, setFocusedIndex, isProgramPage, style, setIsGridFocused }, ref) => {
  const [posters, setPosters] = useState({});
  const containerRef = useRef(null);

  // Responsive kolon sayısı
  const getColumns = () => {
    if (window.innerWidth < 600) return 2;    // Telefon: 2 kolon
    if (window.innerWidth < 900) return 3;    // Tablet: 3 kolon
    if (window.innerWidth < 1400) return 5;   // Küçük ekran TV/dar masaüstü: 5 kolon
    return 7;                                // Büyük ekran: 7 kolon
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
    handleResize(); // İlk yüklemede kolon sayısını ayarla
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
    if (item) {
      item.scrollIntoView({ block: 'center', behavior: 'smooth' });
      item.focus();
    }
  }, [focusedIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Input veya textarea odaklanmışsa klavye olaylarını atla
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
      ) return;

      const columns = getColumns();
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
      } else if (e.key === "Enter" || e.key === "OK") {
        if (channels[focusedIndex]) {
          onSelect(channels[focusedIndex]);
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [channels, focusedIndex, setFocusedIndex, onSelect]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setIsGridFocused(true)}
      style={{
        padding: '20px',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
        ...style
      }}
    >
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            10% { transform: translateX(0); }
            90% { transform: translateX(-100%); }
            100% { transform: translateX(-100%); }
          }
          .marquee-container {
            overflow: hidden;
            position: relative;
            width: 100%;
          }
          .marquee-text {
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            padding-right: 10px;
          }
          .marquee-text:hover, .marquee-text.focused {
            animation: marquee 5s linear infinite;
            animation-delay: 0.5s;
            width: auto;
          }
        `}
      </style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
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
            onFocus={() => setFocusedIndex(i)}
            style={{
              background: '#1e1e1e',
              borderRadius: '8px',
              cursor: 'pointer',
              outline: i === focusedIndex ? '2px solid cyan' : 'none',
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
            <div className="marquee-container" style={{
              padding: '6px',
              color: 'white',
              fontSize: '0.92rem',
              flex: '0 0 auto',
              minHeight: '2em',
              textAlign: 'left'
            }}>
              <span className={`marquee-text ${i === focusedIndex ? 'focused' : ''}`}>{ch.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ChannelGrid;