// src/components/Sidebar.jsx
export default function Sidebar({ sources, selectedSource, onSelect }) {
  return (
    <div style={{
      width: '220px',
      background: '#111',
      color: 'white',
      padding: '20px 10px',
      borderRight: '1px solid #333'
    }}>
      <h3>📡 Kanallar</h3>
      {sources.map((src, i) => (
        <div
          key={i}
          onClick={() => onSelect(src)}
          style={{
            padding: '10px',
            marginBottom: '8px',
            cursor: 'pointer',
            borderRadius: '6px',
            background: selectedSource.name === src.name ? '#333' : 'transparent',
            fontWeight: selectedSource.name === src.name ? 'bold' : 'normal'
          }}
        >
          {src.name}
        </div>
      ))}
    </div>
  );
}
