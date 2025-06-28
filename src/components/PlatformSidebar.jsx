// src/components/PlatformSidebar.jsx

const platforms = [
  { name: "DMAX", logo: "/images/dmax.jpg" },
  { name: "TLC", logo: "/images/tlc.jpg" },
  { name: "SPOR", logo: "/images/spor.jpg" },
  { name: "BEİN ÖZET", logo: "/images/spor.jpg" },
  { name: "POWER SİNEMA", logo: "/images/sinema.jpg" },
  { name: "POWER DİZİ", logo: "/images/dizi.jpg" },
  { name: "CARTOON NETWORK", logo: "/images/cartoon.jpg" }
];

export default function PlatformSidebar({ selected, onSelect }) {
  return (
    <div style={{
      width: '240px',
      background: '#0d0d0d',
      color: 'white',
      padding: '20px 10px',
      borderRight: '1px solid #222',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <h2 style={{ marginBottom: '20px' }}>📺 Kategoriler</h2>
      {platforms.map((platform, index) => (
        <div
          key={index}
          onClick={() => onSelect(platform.platform || platform.name)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            marginBottom: '10px',
            cursor: 'pointer',
            borderRadius: '8px',
            background: selected === platform.name ? '#fff' : 'transparent', // Seçili olana beyaz
            border: selected === platform.name ? '2.5px solid #4fc3f7' : '2px solid #444',
            boxShadow: selected === platform.name ? '0 0 16px #4fc3f7' : 'none',
            color: selected === platform.name ? '#222' : 'white', // Seçili olunca koyu yazı
            fontWeight: selected === platform.name ? 'bold' : 'normal',
            transition: 'box-shadow 0.2s, border 0.2s, background 0.2s, color 0.2s, font-weight 0.2s'
          }}
        >
          <img
            src={platform.logo}
            alt={platform.name}
            style={{
              width: '60px',
              height: 'auto',
              objectFit: 'contain',
              marginRight: '10px'
            }}
          />
          <span>{platform.name}</span>
        </div>
      ))}
    </div>
  );
}
