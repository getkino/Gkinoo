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
      "https://raw.githubusercontent.com/sarapcanagii/Pitipitii/refs/heads/master/NeonSpor/NeonSpor.m3u8",
      "https://raw.githubusercontent.com/GitLatte/patr0n/site/lists/power-sinema.m3u",
      "https://raw.githubusercontent.com/GitLatte/patr0n/site/lists/power-yabanci-dizi.m3u",
      "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-cartoonnetwork-com-tr/videolar.m3u"
    ];

    const fetchAll = async () => {
      const results = await Promise.all(urls.map(url =>
        fetch(url).then(r => r.text()).then(parseM3U)
      ));
      setChannels(results.flat());
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        setFocusedIndex((prev) => Math.min(prev + 1, channels.length - 1));
      } else if (e.key === "ArrowUp") {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        if (channels[focusedIndex]) {
          onSelect(channels[focusedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [channels, focusedIndex, onSelect]);

  useEffect(() => {
    const item = containerRef.current?.querySelector(`[data-index="${focusedIndex}"]`);
    if (item) item.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIndex]);

  return (
    <div
      ref={containerRef}
      style={{ maxHeight: '100vh', overflowY: 'auto', padding: '10px' }}
    >
      {channels.map((channel, index) => (
        <div
          key={index}
          data-index={index}
          style={{
            padding: '12px 16px',
            marginBottom: '10px',
            background: focusedIndex === index ? '#555' : '#1a1a1a',
            color: focusedIndex === index ? '#00ffff' : '#ffffff',
            borderRadius: '12px',
            fontSize: '1.1rem',
            transition: 'background 0.2s',
            boxShadow: focusedIndex === index ? '0 0 10px #00ffff' : 'none'
          }}
        >
          {channel.name}
        </div>
      ))}
    </div>
  );
}
