import { useEffect, useRef, useState } from 'react';
import { parseM3U } from './utils/parseM3U';
import { getTmdbSeriesInfo } from './utils/getTmdbSeriesInfo';
import { getTmdbMovieInfo } from './utils/getTmdbMovieInfo';
import PlatformSidebar from './components/PlatformSidebar';
import ChannelGrid from './components/ChannelGrid';
import SimpleHlsPlayer from './components/SimpleHlsPlayer';
import PlatformShowcase from './components/PlatformShowcase';
import PlatformDetail from './components/PlatformDetail';
import PlatformSeriesDetail from './components/PlatformSeriesDetail';
import 'video.js/dist/video-js.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import CategoryShowcase from "./pages/CategoryShowcase";
import CategoryDetail from "./pages/CategoryDetail";

const SOURCES = [
  { name: "DMAX", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/DMAX/DMAX.m3u", platform: "DMAX" },
  { name: "TLC", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/TLC/TLC.m3u", platform: "TLC" },
  { name: "SPOR", url: "https://m3u.ch/YNZ63gqZ.m3u", platform: "SPOR" },
  { name: "BEİN ÖZET", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/beinozet.m3u", platform: "BEİN ÖZET" },
  { name: "POWER SİNEMA", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/rectv_movies.m3u", platform: "POWER SİNEMA" },
  { name: "POWER DİZİ", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/rectv_series.m3u", platform: "POWER DİZİ" },
  { name: "KABLO TV", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Amazon%20Prime.m3u", platform: "KABLO TV" },
  { name: "YEDEK", url: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/serifilm.m3u", platform: "YEDEK" },
  { name: "CARTOON NETWORK", url: "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-cartoonnetwork-com-tr/videolar.m3u", platform: "CARTOON NETWORK" }
];

const imageMap = {
  "DMAX": "/images/dmax.jpg",
  "TLC": "/images/tlc.jpg",
  "SPOR": "/images/spor.jpg",
  "BEİN ÖZET": "/images/spor.jpg",
  "SİNEMA": "/images/sinema.jpg",
  "DİZİ": "/images/dizi.jpg",
  "KABLO TV": "/images/kablotv.jpg",
  "YEDEK": "/images/kablotv.jpg",
  "CARTOON": "/images/cartoon.jpg",
};

function MobileHeader({ onMenuClick, theme, onThemeToggle }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 900;
  if (!isMobile) return null;
  return (
    <header className="mobile-header" style={{ background: theme === 'dark' ? '#121212' : '#fff', color: theme === 'dark' ? '#fff' : '#222' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <button className="header-btn" onClick={onMenuClick}>
          <span className="material-icons">menu</span>
        </button>
        <div className="header-logo" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ height: 32, margin: '0 auto' }} />
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="header-btn" onClick={onThemeToggle}>
            <span className="material-icons">{theme === 'dark' ? 'wb_sunny' : 'dark_mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const navigate = useNavigate(); // Hook'u BrowserRouter içine taşı
  const [selectedSource, setSelectedSource] = useState(SOURCES[0]);
  const [groupedChannels, setGroupedChannels] = useState({});
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarFocusIndex, setSidebarFocusIndex] = useState(0);
  const [customSources, setCustomSources] = useState([]);
  const [isGridFocused, setIsGridFocused] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tmdbInfo, setTmdbInfo] = useState(null);
  const [showPlatforms, setShowPlatforms] = useState(false);
  const sidebarRef = useRef(null);
  const gridRef = useRef(null);

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const platform = `custom-${Date.now()}`;
      const newSource = {
        name: file.name.replace('.m3u', ''),
        url: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
        platform
      };
      setCustomSources([newSource]);
      setSelectedSource(newSource);
      setSidebarFocusIndex(SOURCES.length);
    };
    reader.readAsText(file);
  };

  const handleUrlSubmit = (url) => {
    const platform = `custom-${Date.now()}`;
    const newSource = {
      name: `Özel Liste`,
      url,
      platform
    };
    setCustomSources([newSource]);
    setSelectedSource(newSource);
    setSidebarFocusIndex(SOURCES.length);
  };

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
        setSelectedPlatform(selectedSource.platform); // Burada platform adını doğrudan ata
      })
      .catch(err => {
        console.error('M3U yükleme hatası:', err);
        alert('M3U dosyası yüklenemedi. Lütfen geçerli bir dosya veya URL seçin.');
      });
  }, [selectedSource]);

  useEffect(() => {
    // Seçili grup veya kanal değişince TMDB'den veri çek
    if (selectedGroup) {
      getTmdbSeriesInfo(selectedGroup).then(setTmdbInfo);
    } else if (selectedChannel) {
      // Kanal varsa, tvg-name veya name ile TMDB'den info çek
      const channelName = selectedChannel['tvg-name'] || selectedChannel.name;
      // Film mi dizi mi ayırt et (örnek: tvg-name ve name aynıysa ve name sonunda yıl varsa film)
      const isMovie = !!(channelName && channelName.match(/\(\d{4}\)$/));
      if (channelName) {
        if (isMovie) {
          // Film ise film detaylarını çek
          getTmdbMovieInfo(channelName.replace(/\s*\(\d{4}\)$/, '')).then(setTmdbInfo);
        } else {
          // Dizi ise dizi detaylarını çek
          getTmdbSeriesInfo(channelName).then(setTmdbInfo);
        }
      } else {
        setTmdbInfo(null);
      }
    } else {
      setTmdbInfo(null);
    }
  }, [selectedGroup, selectedChannel]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Input veya textarea odaklanmışsa klavye olaylarını atla
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
      ) return;

      // Oynatma ekranındaysa veya grid odaklanmışsa sidebar olaylarını atla
      if (isWatching || isGridFocused) {
        if (e.key === 'Escape') {
          if (isWatching) {
            setIsWatching(false);
            setIsGridFocused(true);
            if (gridRef.current) gridRef.current.focus();
          } else if (selectedGroup) {
            setSelectedGroup(null);
            setIsGridFocused(true);
            if (gridRef.current) gridRef.current.focus();
          }
        }
        return;
      }

      // Sidebar navigasyonu
      const columns = 1;
      const totalSources = SOURCES.length + customSources.length;
      if (e.key === 'ArrowDown') {
        setSidebarFocusIndex(i => Math.min(i + columns, totalSources - 1));
        e.preventDefault();
      }
      if (e.key === 'ArrowUp') {
        setSidebarFocusIndex(i => Math.max(i - columns, 0));
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        // Grid'e odaklan
        setIsGridFocused(true);
        if (gridRef.current) {
          gridRef.current.focus();
        }
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') {
        // Sidebar'a odaklan
        setIsGridFocused(false);
        if (sidebarRef.current) {
          sidebarRef.current.focus();
        }
        e.preventDefault();
      }
      if (e.key === 'Enter' || e.key === 'OK') {
        const source = [...SOURCES, ...customSources][sidebarFocusIndex];
        if (source) {
          setSelectedSource(source);
          setSelectedPlatform(source.platform);
          setIsGridFocused(true);
          if (gridRef.current) gridRef.current.focus();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWatching, isGridFocused, selectedGroup, sidebarFocusIndex, customSources]);

  useEffect(() => {
    if (!isWatching && !isGridFocused && sidebarRef.current) {
      sidebarRef.current.focus();
    }
  }, [isWatching, selectedPlatform, isGridFocused]);

  const platformList = [...SOURCES, ...customSources].map(s => s.platform);

  const allPrograms = Object.keys(groupedChannels);

  // Arama varsa platformdan bağımsız, yoksa platforma göre filtrele
  const filteredPrograms = searchTerm.trim() === ''
    ? allPrograms.filter(name => {
        const platform = groupedChannels[name]?.[0]?.platform || '';
        const matchesPlatform = selectedPlatform ? platform === selectedPlatform : true;
        return matchesPlatform;
      })
    : allPrograms.filter(name => {
        // Arama: program adı veya programdaki herhangi bir kanalın adı/title eşleşirse göster
        const lowerSearch = searchTerm.toLowerCase();
        const channels = groupedChannels[name] || [];
        const nameMatch = name.toLowerCase().includes(lowerSearch);
        const channelMatch = channels.some(ch =>
          ch.name?.toLowerCase().includes(lowerSearch) ||
          ch.title?.toLowerCase().includes(lowerSearch)
        );
        return nameMatch || channelMatch;
      });

  const flatEpisodes = selectedGroup ? groupedChannels[selectedGroup] : [];

  const getGroupChannels = () => {
    if (selectedChannel && selectedGroup) {
      return groupedChannels[selectedGroup] || [];
    }
    return [];
  };

  // Tema değiştirici
  const handleThemeToggle = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
    document.body.style.background = theme === 'dark' ? '#fff' : '#121212';
  };

  // Platform değişimi
  const handlePlatformChange = (platform) => {
    const source = [...SOURCES, ...customSources].find(s => s.platform === platform);
    if (source) {
      setSelectedSource(source);
      setSelectedPlatform(source.platform);
      setSidebarFocusIndex([...SOURCES, ...customSources].findIndex(s => s.platform === source.platform));
      setSelectedGroup(null);
      setMobileMenuOpen(false);
    }
  };

  // Arama kutusu işlevi
  const handleSearchChange = (val) => {
    setSearchTerm(val);
  };

  // Menü aç/kapat
  const handleMenuClick = () => {
    setMobileMenuOpen(o => !o);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      height: '100%',
      background: theme === 'dark' ? '#121212' : '#fff',
      flexDirection: 'column'
    }}>
      <MobileHeader
        onMenuClick={handleMenuClick}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
      {/* Mobilde açılır menü/modal */}
      {typeof window !== "undefined" && window.innerWidth < 900 && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: theme === 'dark' ? 'rgba(20,20,20,0.98)' : 'rgba(255,255,255,0.98)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 16px 16px 16px'
          }}
        >
          <button
            style={{
              alignSelf: 'flex-end',
              background: 'none',
              border: 'none',
              fontSize: 28,
              color: theme === 'dark' ? '#fff' : '#222',
              marginBottom: 12
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="material-icons">close</span>
          </button>
          <img src="/logo.png" alt="Logo" style={{ height: 48, margin: '0 auto 24px auto', display: 'block' }} />
          <select
            value={selectedPlatform || SOURCES[0].platform}
            onChange={e => handlePlatformChange(e.target.value)}
            style={{
              width: '100%',
              marginBottom: '16px',
              padding: '12px',
              fontSize: '1.1rem',
              borderRadius: '8px',
              background: theme === 'dark' ? '#23272f' : '#eee',
              color: theme === 'dark' ? '#fff' : '#222',
              border: '1px solid #444'
            }}
          >
            {[...SOURCES, ...customSources].map((s, idx) => (
              <option key={s.platform} value={s.platform}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Ara..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '1px solid #444',
              background: theme === 'dark' ? '#1e1e1e' : '#fff',
              color: theme === 'dark' ? 'white' : '#222',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/platform'); }}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #444',
                background: theme === 'dark' ? '#23272f' : '#eee',
                color: theme === 'dark' ? '#fff' : '#222',
                flex: 1
              }}
            >
              Platformlar
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/kategoriler'); }}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #444',
                background: theme === 'dark' ? '#23272f' : '#eee',
                color: theme === 'dark' ? '#fff' : '#222',
                flex: 1
              }}
            >
              Kategoriler
            </button>
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Routes>
          <Route path="/" element={
            <>
              {!isWatching && (
                <div
                  ref={sidebarRef}
                  tabIndex={0}
                  onFocus={() => setIsGridFocused(false)}
                  style={{
                    outline: 'none',
                    height: window.innerWidth < 900 ? 'auto' : '100vh',
                    minHeight: window.innerWidth < 900 ? 'unset' : '100vh',
                    maxHeight: window.innerWidth < 900 ? 'unset' : '100vh',
                    width: window.innerWidth < 900 ? '100%' : undefined,
                    background: window.innerWidth < 900 ? (theme === 'dark' ? 'rgba(13,13,13,0.5)' : '#fff') : (theme === 'dark' ? 'rgba(13,13,13,0.5)' : '#fff'),
                    paddingBottom: window.innerWidth < 900 ? 0 : undefined,
                    minWidth: window.innerWidth < 900 ? 'unset' : 220,
                    backdropFilter: 'blur(6px)'
                  }}
                >
                  {/* Mobilde sidebar gizli, masaüstünde göster */}
                  {typeof window !== "undefined" && window.innerWidth < 900 ? (
                    <></>
                  ) : (
                    <PlatformSidebar
                      selected={selectedPlatform}
                      onSelect={(platformName) => {
                        const source = [...SOURCES, ...customSources].find(s => s.name === platformName || s.platform === platformName);
                        if (source) {
                          setSelectedSource(source);
                          setSelectedPlatform(source.platform);
                          setIsGridFocused(true);
                          if (gridRef.current) gridRef.current.focus();
                        }
                      }}
                      focusIndex={sidebarFocusIndex}
                      platforms={[...SOURCES, ...customSources].map(s => s.name)}
                      onFileUpload={handleFileUpload}
                      onUrlSubmit={handleUrlSubmit}
                      customSources={customSources}
                      onShowPlatforms={() => navigate('/platform')} // Navigate to /platform
                      onShowCategories={() => navigate('/kategoriler')} // Navigate to /kategoriler
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
                  {/* Platformlar sayfası */}
                  {showPlatforms ? (
                    <PlatformShowcase onBack={() => setShowPlatforms(false)} />
                  ) : (
                    <>
                      {/* Arama kutusu MobileHeader ve mobil menüye taşındı, burada kaldırıldı */}
                      {isWatching && selectedChannel ? (
                        <SimpleHlsPlayer
                          url={selectedChannel.url}
                          title={selectedChannel.name}
                          groupTitle={selectedGroup}
                          groupChannels={getGroupChannels()}
                          onSelectChannel={(channel) => {
                            setSelectedChannel(channel);
                          }}
                          onBack={() => setIsWatching(false)}
                          tmdbInfo={tmdbInfo}
                        />
                      ) : selectedGroup ? (
                        <>
                          {/* TMDB Dizi Bilgisi kaldırıldı, player içine taşındı */}
                          <ChannelGrid
                            ref={gridRef}
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
                            setIsGridFocused={setIsGridFocused}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '20px',
                              padding: '20px',
                              justifyItems: 'center',
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <ChannelGrid
                            ref={gridRef}
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
                            setIsGridFocused={setIsGridFocused}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '20px',
                              padding: '20px',
                              justifyItems: 'center',
                            }}
                          />
                        </>
                      )}
                    </>
                  )}
                  {/* ...existing code... */}
                </div>
              </div>
            </>
          } />
          <Route path="/platform" element={<PlatformShowcase onBack={() => navigate('/')} />} />
          <Route path="/platform/:name" element={<PlatformDetail />} />
          <Route path="/platform/:platformName/:seriesName" element={<PlatformSeriesDetail />} />
          <Route path="/kategoriler" element={<CategoryShowcase />} />
          <Route path="/kategoriler/:slug" element={<CategoryDetail />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;