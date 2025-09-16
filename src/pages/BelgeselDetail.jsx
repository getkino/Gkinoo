import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AppHeader from '../components/AppHeader';
import SimpleHlsPlayer from '../components/SimpleHlsPlayer';

const BelgeselDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, episodes = [], platform } = location.state || {};
  const [currentVideo, setCurrentVideo] = useState(null);

  if (!title || !episodes.length) {
    return (
      <div style={{ padding: 40 }}>
        <AppHeader active="documentaries" />
        <h2>Belgesel bulunamadı</h2>
        <button onClick={() => navigate(-1)}>Geri dön</button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#121212',
        color: '#fff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        paddingBottom: 40,
      }}
    >
      <AppHeader active="documentaries" />
      <div
        className="detail-container"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '32px 16px',
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          {title}
        </h1>
        {platform && (
          <div
            style={{
              color: '#9ca3af',
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            Kategori: {platform}
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Bölümler ({episodes.length})
          </span>
        </div>
        <div
          className="episode-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {episodes.map((ep, i) => (
            <div
              key={ep.url + i}
              className="episode-item"
              style={{
                background: '#23272f',
                borderRadius: 10,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onClick={() =>
                setCurrentVideo({
                  url: ep.url,
                  title: ep.title,
                  poster: ep.logo,
                })
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {ep.logo && (
                  <img
                    src={ep.logo}
                    alt="logo"
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: 'contain',
                      borderRadius: 8,
                      background: '#fff',
                    }}
                  />
                )}
                <span style={{ fontSize: 17, fontWeight: 600 }}>
                  {ep.title}
                </span>
              </div>
              <button
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                İzle
              </button>
            </div>
          ))}
        </div>
      </div>
      {currentVideo && (
        <SimpleHlsPlayer
          url={currentVideo.url}
          title={currentVideo.title}
          poster={currentVideo.poster}
          onClose={() => setCurrentVideo(null)}
        />
      )}
      <style>
        {`
          @media (max-width: 600px) {
            .detail-container {
              padding: 16px 4px !important;
              max-width: 100vw !important;
            }
            .episode-item {
              flex-direction: column !important;
              align-items: flex-start !important;
              padding: 10px 8px !important;
              gap: 8px !important;
            }
            .episode-item img {
              width: 36px !important;
              height: 36px !important;
            }
            h1 {
              font-size: 22px !important;
            }
            .episode-list {
              gap: 8px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default BelgeselDetail;
