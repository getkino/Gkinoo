// src/components/Sidebar.jsx
export default function Sidebar({ sources, selectedSource, onSelect }) {
  return (
    <div style={{
      width: '220px',
      background: '#111',
      color: 'white',
      padding: '20px 10px',
      borderRight: '1px solid #333',
      height: '100vh',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginBottom: '18px', fontSize: '1.15rem', textAlign: 'center' }}>📡 Kanallar</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {sources.map((src, i) => (
          <div
            key={src.name}
            onClick={() => onSelect(src)}
            style={{
              padding: '10px',
              cursor: 'pointer',
              borderRadius: '6px',
              background: selectedSource?.name === src.name ? '#333' : 'transparent',
              fontWeight: selectedSource?.name === src.name ? 'bold' : 'normal',
              color: selectedSource?.name === src.name ? '#4fc3f7' : 'white',
              border: selectedSource?.name === src.name ? '2px solid #4fc3f7' : '1px solid #222',
              transition: 'background 0.18s, color 0.18s, border 0.18s'
            }}
          >
            {src.name}
          </div>
        ))}
      </div>
    </div>
  );
}
