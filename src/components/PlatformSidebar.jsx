import { useState, useEffect } from 'react';

const platforms = [
  { name: "DMAX", logo: "/images/dmax.jpg" },
  { name: "TLC", logo: "/images/tlc.jpg" },
  { name: "SPOR", logo: "/images/spor.jpg" },
  { name: "BEİN ÖZET", logo: "/images/spor.jpg" },
  { name: "POWER SİNEMA", logo: "/images/sinema.jpg" },
  { name: "POWER DİZİ", logo: "/images/dizi.jpg" },
  { name: "KABLO TV", logo: "/images/kablotv.jpg" },
  { name: "YEDEK", logo: "/images/kablotv.jpg" },
  { name: "CARTOON NETWORK", logo: "/images/cartoon.jpg" }
];

export default function PlatformSidebar({ selected, onSelect, onFileUpload, onUrlSubmit, customSources, onShowPlatforms, onShowCategories }) {
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Arama ile filtrelenmiş platformlar
  const filteredPlatforms = platforms
    .concat(customSources?.map(src => ({
      name: src.name,
      logo: "/images/default.jpg",
      platform: src.platform
    })) || [])
    .filter(p =>
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.trim().toLowerCase())
    );

  return (
    <div style={{
      width: isMobile ? '100vw' : '260px',
      background: '#181818',
      color: 'white',
      padding: isMobile ? '12px 4px' : '24px 16px',
      borderRight: isMobile ? 'none' : '1px solid #222',
      height: isMobile ? 'auto' : '100vh',
      minHeight: isMobile ? '100px' : '100vh',
      overflowY: 'auto',
      position: isMobile ? 'fixed' : 'static',
      top: isMobile ? 0 : undefined,
      left: isMobile ? 0 : undefined,
      zIndex: isMobile ? 999 : undefined,
      boxShadow: isMobile ? '0 2px 16px #222' : undefined
    }}>
      {/* Yeni Platformlar Butonu */}
      <button
        onClick={onShowPlatforms}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '16px',
          background: 'linear-gradient(to right, #222, #444)',
          color: '#febd59',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px #0005',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(to right, #febd59, #e50914)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(to right, #222, #444)'}
      >
        Platformlar
      </button>
      {/* Kategoriler Butonu */}
      <button
        onClick={onShowCategories}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '16px',
          background: 'linear-gradient(to right, #222, #444)',
          color: '#febd59',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px #0005',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(to right, #febd59, #e50914)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(to right, #222, #444)'}
      >
        Kategoriler
      </button>
      {/* Arama kutusu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#232323',
        borderRadius: '8px',
        padding: '8px 12px',
        marginBottom: '16px'
      }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Arama yapın..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '1.05rem'
          }}
        />
        <span className="material-icons" style={{ color: '#aaa', fontSize: 22, marginLeft: 4 }}>search</span>
      </div>
      {/* Platform listesi */}
      <div>
        {filteredPlatforms.map((platform, index) => (
          <div
            key={platform.platform || platform.name}
            onClick={() => onSelect(platform.platform || platform.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              marginBottom: '8px',
              cursor: 'pointer',
              borderRadius: '8px',
              background: selected === (platform.platform || platform.name) ? '#2c2c2c' : '#232323',
              border: selected === (platform.platform || platform.name) ? '2px solid #febd59' : '2px solid #232323',
              boxShadow: selected === (platform.platform || platform.name) ? '0 0 8px #febd59' : 'none',
              color: selected === (platform.platform || platform.name) ? '#febd59' : 'white',
              fontWeight: selected === (platform.platform || platform.name) ? 'bold' : 'normal',
              transition: 'box-shadow 0.2s, border 0.2s, background 0.2s, color 0.2s, font-weight 0.2s'
            }}
          >
            <img
              src={platform.logo}
              alt={platform.name}
              style={{
                width: '38px',
                height: '38px',
                objectFit: 'contain',
                marginRight: '12px',
                borderRadius: '6px',
                background: '#222'
              }}
            />
            <span style={{ fontSize: '1.05rem' }}>{platform.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}