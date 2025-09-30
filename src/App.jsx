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
import HomePage from './pages/HomePage';
import 'video.js/dist/video-js.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import CategoryShowcase from "./pages/CategoryShowcase";
import CategoryDetail from "./pages/CategoryDetail";
import SettingsPage from './pages/SettingsPage';
import TmdbMovie from './pages/TmdbMovie';
import Movies from './pages/Movies';
import Belgesel from './pages/Belgesel';
import BelgeselDetail from './pages/BelgeselDetail';
import FilmRobotu from './pages/FilmRobotu';
import { LanguageProvider } from './contexts/LanguageContext';

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
    }
  };

  // Arama kutusu işlevi
  const handleSearchChange = (val) => {
    setSearchTerm(val);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      height: '100%',
      background: theme === 'dark' ? '#121212' : '#fff',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:tmdbId" element={<TmdbMovie />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/belgesel" element={<Belgesel />} />
          <Route path="/belgesel/:title" element={<PlatformSeriesDetail />} />
          <Route path="/belgesel/:program" element={<BelgeselDetail />} />
          <Route path="/live-tv" element={
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
                      onShowPlatforms={() => navigate('/platform')}
                      onShowCategories={() => navigate('/kategoriler')}
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
                  {showPlatforms ? (
                    <PlatformShowcase onBack={() => setShowPlatforms(false)} />
                  ) : (
                    <>
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
                </div>
              </div>
            </>
          } />
          <Route path="/platform" element={<PlatformShowcase onBack={() => navigate('/')} />} />
          <Route path="/platform/:name" element={<PlatformDetail />} />
          <Route path="/platform/:platformName/:seriesName" element={<PlatformSeriesDetail />} />
          <Route path="/kategoriler" element={<CategoryShowcase />} />
          <Route path="/kategoriler/:slug" element={<CategoryDetail />} />
          <Route path="/ayarlar" element={<SettingsPage />} />
          <Route path="/film-robotu" element={<FilmRobotu />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;