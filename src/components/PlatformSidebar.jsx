// src/components/PlatformSidebar.jsx

const platforms = [
  { name: "DMAX", logo: "/images/dmax.jpg" },
  { name: "TLC", logo: "/images/tlc.jpg" },
  { name: "TRT", logo: "/images/trt.jpg" },
  { name: "BBC", logo: "/images/bbc.jpg" },
  { name: "EXXEN", logo: "/images/exxen.jpg" }
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
      <h2 style={{ marginBottom: '20px' }}>📺 Platformlar</h2>
      {platforms.map((platform, index) => (
        <div
          key={index}
          onClick={() => onSelect(platform.name)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            marginBottom: '10px',
            cursor: 'pointer',
            borderRadius: '8px',
            background: selected === platform.name ? '#1a1a1a' : 'transparent',
            border: selected === platform.name ? '1px solid #444' : 'none'
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

      <div
        onClick={() => onSelect(null)}
        style={{
          marginTop: '20px',
          padding: '10px',
          background: selected === null ? '#1a1a1a' : 'transparent',
          borderRadius: '6px',
          cursor: 'pointer',
          textAlign: 'center',
          border: selected === null ? '1px solid #444' : 'none'
        }}
      >
        🔍 Tüm Kanalları Keşfet
      </div>
    </div>
  );
}
