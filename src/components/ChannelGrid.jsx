// src/components/ChannelGrid.jsx
import { useEffect, useState, useRef } from 'react';
import { getPoster } from '../utils/getPoster';

export default function ChannelGrid({ channels, onSelect, focusedIndex, imageMap, setFocusedIndex, isProgramPage }) {
  const [posters, setPosters] = useState({});
  const containerRef = useRef(null);
  const columns = isProgramPage ? 5 : 4;

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
      if (e.key === "ArrowRight") {
        setFocusedIndex(i => Math.min(i + 1, channels.length - 1));
      } else if (e.key === "ArrowLeft") {
        setFocusedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "ArrowDown") {
        setFocusedIndex(i => Math.min(i + columns, channels.length - 1));
      } else if (e.key === "ArrowUp") {
        setFocusedIndex(i => Math.max(i - columns, 0));
      } else if (e.key === "Enter") {
        onSelect(channels[focusedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [channels, focusedIndex, setFocusedIndex, onSelect]);

  return (
    <div style={{ padding: '20px' }} ref={containerRef}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '20px',
          marginBottom: '40px'
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
              borderRadius: '10px',
              cursor: 'pointer',
              outline: 'none',
              border: i === focusedIndex ? '2px solid cyan' : 'none',
              overflow: 'hidden'
            }}
          >
            <img
              src={
                isProgramPage
                  ? (posters?.[ch.name] || imageMap?.[ch.name] || ch.logo || '/images/default.jpg')
                  : (ch.logo || imageMap?.[ch.group] || '/images/default.jpg')
              }
              alt={ch.name}
              loading="lazy"
              style={{ width: '100%', height: isProgramPage ? '300px' : '180px', objectFit: 'cover' }}
            />
            <div style={{ padding: '10px', color: 'white', fontSize: '1rem' }}>
              {ch.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
