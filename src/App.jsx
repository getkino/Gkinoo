import { useEffect, useState } from 'react';
import { parseM3U } from './utils/parseM3U';
import PlatformSidebar from './components/PlatformSidebar';
import ChannelGrid from './components/ChannelGrid';
import ShakaPlayer from './components/ShakaPlayer'; // Yeni fallback destekli player

const SOURCES = [
  { name: "DMAX", url: "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-dmax-com-tr/all.m3u", platform: "dmax" },
  { name: "TLC", url: "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-tlctv-com-tr/all.m3u", platform: "tlc" },
  { name: "SPOR", url: "https://raw.githubusercontent.com/sarapcanagii/Pitipitii/refs/heads/master/NeonSpor/NeonSpor.m3u8", platform: "spor" },
  { name: "POWER SİNEMA", url: "https://raw.githubusercontent.com/GitLatte/patr0n/site/lists/power-sinema.m3u", platform: "sinema" },
  { name: "POWER DİZİ", url: "https://raw.githubusercontent.com/GitLatte/patr0n/site/lists/power-yabanci-dizi.m3u", platform: "dizi" },
  { name: "CARTOON NETWORK", url: "https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-cartoonnetwork-com-tr/videolar.m3u", platform: "cartoon" } 
];

const imageMap = {
  "DMAX": "/images/dmax.jpg",
  "TLC": "/images/tlc.jpg",
  "SPOR": "/images/spor.jpg",
  "SİNEMA": "/images/sinema.jpg",
  "DİZİ": "/images/dizi.jpg",
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

  const allPrograms = Object.keys(groupedChannels);
  const filteredPrograms = allPrograms.filter(name => {
    const platform = groupedChannels[name]?.[0]?.platform || '';
    const matchesPlatform = selectedPlatform ? platform.toLowerCase() === selectedPlatform.toLowerCase() : true;
    const matchesSearch = searchTerm.trim() === '' || name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const flatEpisodes = selectedGroup ? groupedChannels[selectedGroup] : [];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#121212' }}>
      {!isWatching && (
        <PlatformSidebar
          selected={selectedPlatform}
          onSelect={(platformName) => {
            const source = SOURCES.find(s => s.name === platformName || s.platform === platformName.toLowerCase());
            if (source) {
              setSelectedSource(source);
            }
          }}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
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
          <ShakaPlayer url={selectedChannel.url} onExit={() => setIsWatching(false)} />
        ) : selectedGroup ? (
          <ChannelGrid
            channels={flatEpisodes}
            onSelect={(ch) => {
              setSelectedChannel(ch);
              setIsWatching(true);
            }}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
            imageMap={imageMap}
            isProgramPage={false}
          />
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
  );
}

export default App;
