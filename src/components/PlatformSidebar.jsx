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
  { name: "YEDEK FİLMLER", logo: "/images/cartoon.jpg" }
];

export default function PlatformSidebar({ selected, onSelect, onFileUpload, onUrlSubmit, customSources }) {
  // Mobil algılama
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.m3u')) {
      onFileUpload(file);
    } else {
      alert('Lütfen geçerli bir .m3u dosyası seçin.');
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput && urlInput.endsWith('.m3u')) {
      onUrlSubmit(urlInput);
      setUrlInput('');
      setShowUrlForm(false);
    } else {
      alert('Lütfen geçerli bir .m3u URL’si girin.');
    }
  };

  return (
    <div style={{
      width: isMobile ? '100vw' : '240px',
      background: '#0d0d0d',
      color: 'white',
      padding: isMobile ? '12px 4px' : '20px 10px',
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
      <h2 style={{ marginBottom: isMobile ? '12px' : '20px', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>📺 Kategoriler</h2>
      {platforms.map((platform, index) => (
        <div
          key={index}
          onClick={() => onSelect(platform.platform || platform.name)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: isMobile ? '7px' : '10px',
            marginBottom: isMobile ? '7px' : '10px',
            cursor: 'pointer',
            borderRadius: '8px',
            background: selected === platform.name ? '#febd59' : 'transparent',
            border: selected === platform.name ? '2.5px solid #febd59' : '2px solid #444',
            boxShadow: selected === platform.name ? '0 0 16px #febd59' : 'none',
            color: selected === platform.name ? '#222' : 'white',
            fontWeight: selected === platform.name ? 'bold' : 'normal',
            transition: 'box-shadow 0.2s, border 0.2s, background 0.2s, color 0.2s, font-weight 0.2s'
          }}
        >
          <img
            src={platform.logo}
            alt={platform.name}
            style={{
              width: isMobile ? '38px' : '60px',
              height: 'auto',
              objectFit: 'contain',
              marginRight: isMobile ? '7px' : '10px'
            }}
          />
          <span style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{platform.name}</span>
        </div>
      ))}
      {/* Kullanıcı tarafından yüklenen kaynaklar */}
      {customSources && customSources.map((source, index) => (
        <div
          key={`custom-${index}`}
          onClick={() => onSelect(source.platform || source.name)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: isMobile ? '7px' : '10px',
            marginBottom: isMobile ? '7px' : '10px',
            cursor: 'pointer',
            borderRadius: '8px',
            background: selected === source.name ? '#febd59' : 'transparent',
            border: selected === source.name ? '2.5px solid #febd59' : '2px solid #444',
            boxShadow: selected === source.name ? '0 0 16px #febd59' : 'none',
            color: selected === source.name ? '#222' : 'white',
            fontWeight: selected === source.name ? 'bold' : 'normal',
            transition: 'box-shadow 0.2s, border 0.2s, background 0.2s, color 0.2s, font-weight 0.2s'
          }}
        >
          <img
            src="/images/default.jpg"
            alt={source.name}
            style={{
              width: isMobile ? '38px' : '60px',
              height: 'auto',
              objectFit: 'contain',
              marginRight: isMobile ? '7px' : '10px'
            }}
          />
          <span style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{source.name}</span>
        </div>
      ))}
      {/* Dosya Yükleme */}
      <div style={{ marginTop: isMobile ? '12px' : '20px' }}>
        <button
          onClick={() => document.getElementById('fileInput').click()}
          style={{
            width: '100%',
            padding: isMobile ? '8px' : '10px',
            background: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: isMobile ? '7px' : '10px',
            fontSize: isMobile ? '0.95rem' : '1rem'
          }}
        >
          Dosya Yükle (.m3u)
        </button>
        <input
          id="fileInput"
          type="file"
          accept=".m3u"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {/* URL ile Yükleme */}
      <div>
        <button
          onClick={() => setShowUrlForm(!showUrlForm)}
          style={{
            width: '100%',
            padding: isMobile ? '8px' : '10px',
            background: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: isMobile ? '0.95rem' : '1rem'
          }}
        >
          {showUrlForm ? 'URL Formunu Kapat' : 'URL ile Yükle'}
        </button>
        {showUrlForm && (
          <form onSubmit={handleUrlSubmit} style={{ marginTop: isMobile ? '7px' : '10px' }}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="M3U URL’si girin"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#1e1e1e',
                color: 'white',
                marginBottom: isMobile ? '7px' : '10px',
                fontSize: isMobile ? '0.95rem' : '1rem'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                background: '#FF0000',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? '0.95rem' : '1rem'
              }}
            >
              Yükle
            </button>
          </form>
        )}
      </div>
      <div
        style={{
          marginTop: 'auto',
          color: '#e4a951',
          fontSize: isMobile ? '0.95rem' : '1rem',
          textAlign: 'center',
          letterSpacing: '0.5px',
          opacity: 0.85,
          fontWeight: 500,
          padding: isMobile ? '10px 0 6px 0' : '16px 0 8px 0'
        }}
      >
        🍿 Kinoo Ekibi tarafından tasarlandı.
      </div>
    </div>
  );
}