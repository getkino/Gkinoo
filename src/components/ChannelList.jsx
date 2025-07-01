import { useEffect, useState, useRef } from 'react';
import { parseM3U } from '../utils/parseM3U';

export default function ChannelList({ onSelect }) {
  const [channels, setChannels] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const urls = [
      "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-dmax-com-tr/all.m3u",
      "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-tlctv-com-tr/all.m3u",
      "https://m3u.ch/YNZ63gqZ.m3u ",
      "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/beinozet.m3u",
      "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/rectv_movies.m3u",
      "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/rectv_series.m3u",
      "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denen/kablo.m3u",
      "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-cartoonnetwork-com-tr/videolar.m3u"
    ];

    const fetchAll = async () => {
      const results = await Promise.all(urls.map(url =>
        fetch(url)
          .then(r => r.text())
          .then(text => {
            try {
              return parseM3U(text);
            } catch {
              return [];
            }
          })
          .catch(() => [])
      ));
      setChannels(results.flat());
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Sadece grid aktifken yön tuşları çalışsın, input odakta ise engelle
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
      ) return;

      // Satır/sütun mantığı ile yön tuşları
      const columns = 4; // Kaç sütun olmasını istiyorsanız buradan ayarlayın (5'li)
      if (e.key === "ArrowDown") {
        setFocusedIndex(prev => {
          const next = prev + columns;
          return next < channels.length ? next : prev;
        });
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setFocusedIndex(prev => {
          const next = prev - columns;
          return next >= 0 ? next : prev;
        });
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setFocusedIndex(prev => {
          const next = prev + 1;
          // Aynı satırda kalmasını sağla
          if (Math.floor(next / columns) === Math.floor(prev / columns) && next < channels.length) return next;
          return prev;
        });
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setFocusedIndex(prev => {
          const next = prev - 1;
          if (next >= 0 && Math.floor(next / columns) === Math.floor(prev / columns)) return next;
          return prev;
        });
        e.preventDefault();
      } else if (e.key === "Enter") {
        if (channels[focusedIndex]) {
          onSelect(channels[focusedIndex]);
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [channels, focusedIndex, onSelect]);

  useEffect(() => {
    const item = containerRef.current?.querySelector(`[data-index="${focusedIndex}"]`);
    if (item) item.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIndex]);

  // Hatalı veya eksik veri için kontrol ekle
  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: '100vh',
        overflowY: 'auto',
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)', // 5'li grid
        gap: '12px'
      }}
    >
      {channels.length === 0 && (
        <div style={{ color: '#888', textAlign: 'center', marginTop: '40px', gridColumn: '1 / -1' }}>
          Kanal bulunamadı veya yüklenemedi.
        </div>
      )}
      {channels.map((channel, index) => (
        <div
          key={channel.name ? channel.name + index : index}
          data-index={index}
          tabIndex={0}
          onClick={() => onSelect(channel)}
          style={{
            padding: '12px 16px',
            marginBottom: '0px',
            background: focusedIndex === index ? '#555' : '#1a1a1a',
            color: focusedIndex === index ? '#00ffff' : '#ffffff',
            borderRadius: '12px',
            fontSize: '1.1rem',
            transition: 'background 0.2s',
            boxShadow: focusedIndex === index ? '0 0 10px #00ffff' : 'none',
            cursor: 'pointer',
            outline: 'none',
            overflow: 'hidden'
          }}
        >
          <div
            className="marquee-title"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              display: 'block',
              width: '100%',
              // Animasyon sadece odak veya hover olduğunda aktif
              animation: focusedIndex === index ? 'marquee 6s linear infinite' : 'none'
            }}
          >
            {channel.name || "Bilinmeyen Kanal"}
          </div>
        </div>
      ))}
    </div>
  );
}
