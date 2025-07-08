import { useEffect, useRef, useState } from 'react';
import { parseM3U } from './utils/parseM3U';
import PlatformSidebar from './components/PlatformSidebar';
import ChannelGrid from './components/ChannelGrid';
import SimpleHlsPlayer from './components/SimpleHlsPlayer'; // ShakaPlayer or RedirectHlsPlayer based on your preference
import 'video.js/dist/video-js.css';


const SOURCES = [
  { name: "DMAX", url: "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-dmax-com-tr/all.m3u", platform: "dmax" },
  { name: "TLC", url: "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-tlctv-com-tr/all.m3u", platform: "tlc" },
  { name: "SPOR", url: "https://m3u.ch/YNZ63gqZ.m3u ", platform: "spor" },
  { name: "BEİN ÖZET", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/beinozet.m3u", platform: "beinozet" },
  { name: "POWER SİNEMA", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/rectv_movies.m3u", platform: "sinema" },
  { name: "POWER DİZİ", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/rectv_series.m3u", platform: "dizi" },
  { name: "KABLO TV", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denen/kablo.m3u", platform: "kablotv" },
  { name: "CARTOON NETWORK", url: "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-cartoonnetwork-com-tr/videolar.m3u", platform: "cartoon" } 
];

const imageMap = {
  "DMAX": "/images/dmax.jpg",
  "TLC": "/images/tlc.jpg",
  "SPOR": "/images/spor.jpg",
  "BEİN ÖZET": "/images/spor.jpg",
  "SİNEMA": "/images/sinema.jpg",
  "DİZİ": "/images/dizi.jpg",
  "KABLO TV": "/images/kablotv.jpg",
  "CARTOON": "/images/cartoon.jpg",
};

function App() {
  const [selectedSource, setSelectedSource] = useState(SOURCES[0]);
  const [groupedChannels, setGroupedChannels] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
  const sidebarRef = useRef(null);

  useEffect(() => {
    fetch(selectedSource.url)
      .then(res => res.text())
      .then(parseM3U)
      .then((data) => {
        const platform = selectedSource.platform;
        for (const key in data) {
          data[key] = data[key].map(ch => ({ ...ch, platform }));
        }
        setGroupedChannels(data);
        setSelectedGroup(null);
        setSelectedChannel(null);
        setFocusedIndex(0);
        setIsWatching(false);
        setSelectedPlatform(platform);
      });
  }, [selectedSource]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isWatching) {
          setIsWatching(false);
        } else if (selectedGroup) {
          setSelectedGroup(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWatching, selectedGroup]);

  useEffect(() => {
    if (!isWatching && sidebarRef.current) {
      sidebarRef.current.focus();
    }
  }, [isWatching, selectedPlatform]);

  const platformList = SOURCES.map(s => s.platform);

  const allPrograms = Object.keys(groupedChannels);
  const filteredPrograms = allPrograms.filter(name => {
    const platform = groupedChannels[name]?.[0]?.platform || '';
    const matchesPlatform = selectedPlatform ? platform.toLowerCase() === selectedPlatform.toLowerCase() : true;
    const matchesSearch = searchTerm.trim() === '' || name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const flatEpisodes = selectedGroup ? groupedChannels[selectedGroup] : [];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      height: '100%',
      background: '#121212'
    }}>
      {!isWatching && (
        <div
          ref={sidebarRef}
          tabIndex={0}
          onKeyDown={e => {
            // Sadece input odakta değilken çalışsın
            if (
              document.activeElement &&
              (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
            ) return;

            // Satır/sütun mantığı ile yön tuşları
            const columns = 1; // Sidebar tek sütun
            if (e.key === 'ArrowDown') {
              setSidebarFocusIndex(i => Math.min(i + columns, SOURCES.length - 1));
              e.preventDefault();
            }
            if (e.key === 'ArrowUp') {
              setSidebarFocusIndex(i => Math.max(i - columns, 0));
              e.preventDefault();
            }
            if (e.key === 'ArrowRight') {
              // Sağ tuş ile ana grid'e geçiş yapılabilir, burada eklenebilir
              e.preventDefault();
            }
            if (e.key === 'ArrowLeft') {
              // Sol tuş ile başka bir aksiyon yapılabilir, burada eklenebilir
              e.preventDefault();
            }
            if (e.key === 'Enter') {
              const source = SOURCES[sidebarFocusIndex];
              if (source) {
                setSelectedSource(source);
              }
              e.preventDefault();
            }
          }}
          style={{
            outline: 'none',
            height: window.innerWidth < 900 ? 'auto' : '100vh',
            minHeight: window.innerWidth < 900 ? 'unset' : '100vh',
            maxHeight: window.innerWidth < 900 ? 'unset' : '100vh',
            width: window.innerWidth < 900 ? '100%' : undefined,
            background: window.innerWidth < 900 ? 'rgba(13,13,13,0.5)' : 'rgba(13,13,13,0.5)', // transparan arkaplan
            paddingBottom: window.innerWidth < 900 ? 0 : undefined,
            minWidth: window.innerWidth < 900 ? 'unset' : 220,
            backdropFilter: 'blur(6px)'
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              display: 'block',
              margin: '24px auto auto', // üstten ve alttan boşluk azaltıldı
              width: '180px',
              height: 'auto',
              background: 'none',
              backgroundColor: 'transparent'
            }}
          />
          {/* Mobilde açılır menü */}
          {typeof window !== "undefined" && window.innerWidth < 900 ? (
            <select
              value={selectedPlatform || SOURCES[sidebarFocusIndex]?.platform}
              onChange={e => {
                const source = SOURCES.find(s => s.platform === e.target.value);
                if (source) {
                  setSelectedSource(source);
                  setSidebarFocusIndex(SOURCES.findIndex(s => s.platform === source.platform));
                }
              }}
              style={{
                width: '90%',
                margin: '0 auto 16px auto',
                display: 'block',
                padding: '12px',
                fontSize: '1.1rem',
                borderRadius: '8px',
                background: '#23272f',
                color: '#fff',
                border: '1px solid #444'
              }}
            >
              {SOURCES.map((s, idx) => (
                <option key={s.platform} value={s.platform}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <PlatformSidebar
              selected={selectedPlatform}
              onSelect={(platformName) => {
                const source = SOURCES.find(s => s.name === platformName || s.platform === platformName.toLowerCase());
                if (source) {
                  setSelectedSource(source);
                }
              }}
              focusIndex={sidebarFocusIndex}
              platforms={SOURCES.map(s => s.name)}
            />
          )}
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {!isWatching && !selectedGroup && (
            <div style={{ padding: '20px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Program ara..."
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#1e1e1e',
                  color: 'white',
                  marginBottom: '20px'
                }}
              />
            </div>
          )}

          {isWatching && selectedChannel ? (
            <SimpleHlsPlayer url={selectedChannel.url} />
          ) : selectedGroup ? (
            <>
              <div style={{ padding: '20px' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Bölüm ara..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    background: '#1e1e1e',
                    color: 'white',
                    marginBottom: '20px'
                  }}
                />
              </div>
              <ChannelGrid
                channels={flatEpisodes.filter(ch =>
                  searchTerm.trim() === '' ||
                  ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  ch.title?.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                onSelect={(ch) => {
                  setSelectedChannel(ch);
                  setIsWatching(true);
                }}
                focusedIndex={focusedIndex}
                setFocusedIndex={setFocusedIndex}
                imageMap={imageMap}
                isProgramPage={false}
              />
            </>
          ) : (
            <ChannelGrid
              channels={filteredPrograms.map(name => ({
                name,
                logo: imageMap[name] || groupedChannels[name]?.[0]?.logo || null,
                group: name
              }))}
              onSelect={(prog) => {
                setSelectedGroup(prog.name);
                setFocusedIndex(0);
              }}
              focusedIndex={focusedIndex}
              setFocusedIndex={setFocusedIndex}
              imageMap={imageMap}
              isProgramPage={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
