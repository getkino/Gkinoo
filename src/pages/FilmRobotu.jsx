import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

// .env'den anahtarı al
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const PLACEHOLDER = 'https://via.placeholder.com/500x750?text=No+Image';
// Worker proxy base
const WORKER_PROXY = 'https://2.nejyoner19.workers.dev/?url=';

export default function FilmRobotu() {
  const [query, setQuery] = useState('');
  const [dropdown, setDropdown] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  // Başlangıçta toplam 24 öğe gösterilecek
  const [offset, setOffset] = useState(24);
  const [modal, setModal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Poster tıklanınca doğrudan izle hedefini açar
  const handleWatch = async (id, type) => {
    setError('');
    try {
      // Önce en-US isteği yapalım (imdb genelde buradan gelir)
      let res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=external_ids`);
      let data = await res.json();
      let imdbId = data.imdb_id || data.external_ids?.imdb_id;
      // Eğer yoksa tr-TR den deneyelim
      if (!imdbId) {
        res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=tr-TR&append_to_response=external_ids`);
        data = await res.json();
        imdbId = data.imdb_id || data.external_ids?.imdb_id;
      }
      if (imdbId) {
        const targetUrl = `${WORKER_PROXY}${encodeURIComponent(`https://vidmody.com/vs/${imdbId}`)}`;
        try { window.open(targetUrl, '_blank', 'noopener'); } catch (err) { window.location.href = targetUrl; }
        return;
      }
      setError('İzlenecek bağlantı bulunamadı.');
    } catch (err) {
      setError('İzlenirken hata oluştu.');
    }
  };

  // Arama kutusu değişince
  const handleInput = async (e) => {
    const val = e.target.value;
    setQuery(val);
    setError('');
    if (val.trim().length < 3) {
      setDropdown([]);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(val)}&language=tr-TR&include_adult=false`);
      const data = await res.json();
      if (!data.results) throw new Error('API yanıtı alınamadı');
      const items = (data.results || [])
        .filter(x => x.media_type === 'movie' || x.media_type === 'tv')
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 5);
      setDropdown(items);
    } catch (err) {
      setError('Arama sırasında hata oluştu.');
      setDropdown([]);
    }
  };

  // Dropdowndan seçim yapılınca önerileri getir
  const fetchRecommendations = async (id, type) => {
    setDropdown([]);
    setRecommendations([]);
    // Öneriler yüklendiğinde 24 adet göster
    setOffset(24);
    setError('');
    try {
      const collected = [];
      // İlk sayfayı al
      let page = 1;
      let totalPages = 1;
      while (collected.length < 24 && page <= totalPages) {
        const res = await fetch(`${BASE_URL}/${type}/${id}/recommendations?api_key=${API_KEY}&language=tr-TR&page=${page}`);
        const data = await res.json();
        if (!data.results) {
          if (page === 1) throw new Error('Öneriler alınamadı');
          break;
        }
        totalPages = data.total_pages || 1;
        collected.push(...data.results);
        page += 1;
      }
      // Her öğeye media_type ekle ve en fazla 24 öğe al
      const items = (collected || []).slice(0, 24).map(x => ({ ...x, media_type: x.media_type || type }));
      setRecommendations(items);
    } catch (err) {
      setError('Öneriler alınırken hata oluştu.');
      setRecommendations([]);
    }
  };

  // Daha fazla göster
  const loadMore = () => {
    // 24'ü aşmayacak şekilde 6'şar artır
    setOffset(o => Math.min(o + 6, 24));
  };

  // Modal aç
  const openModal = async (id, type) => {
    setError('');
    try {
      // external_ids ekleniyor ki imdb_id alınsın
      const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=tr-TR&append_to_response=videos,external_ids`);
      let data = await res.json();
      if (!data.videos || !data.videos.results || !data.videos.results.length) {
        const resEn = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,external_ids`);
        const dataEn = await resEn.json();
        data.videos = dataEn.videos;
        // fallback'ten imdb bilgisi gelmiş olabilir
        if (!data.imdb_id && dataEn.imdb_id) data.imdb_id = dataEn.imdb_id;
        if (!data.external_ids && dataEn.external_ids) data.external_ids = dataEn.external_ids;
      }
      setModal({ ...data, media_type: type });
      setShowModal(true);
    } catch (err) {
      setError('Detaylar alınırken hata oluştu.');
      setModal(null);
      setShowModal(false);
    }
  };

  // Modal kapat
  const closeModal = () => {
    setShowModal(false);
    setModal(null);
  };

  return (
    <>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <AppHeader />
      </header>
      <main
        id="film-robotu-main"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '18px',
          paddingTop: 'calc(var(--app-header-height, 64px) + 18px)'
        }}
      >
        {/* maxWidth büyütüldü, 6 sütunda posterler daha büyük olacak */}
        <div style={{ maxWidth: 1320, margin: 'auto' }}>
          <h1>Film Robotu</h1>
          <p>Beğendiğin dizi/filmlere benzer yeni öneriler burada listelenecek.</p>
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          <div style={{ margin: '24px 0' }}>
            <input
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="Dizi veya Film Ara"
              style={{
                width: '100%',
                height: 48,
                borderRadius: 10,
                border: '1px solid #dddde7',
                padding: '0 18px',
                fontSize: 16,
                color: '#111'
              }}
            />
            {dropdown.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 10, marginTop: 8, boxShadow: '0 2px 12px #0002', zIndex: 2 }}>
                {dropdown.map(item => {
                  const title = item.title || item.name;
                  const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : PLACEHOLDER;
                  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                  const year = item.release_date ? new Date(item.release_date).getFullYear() : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'Bilinmiyor');
                  return (
                    <div
                      key={item.id}
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 8, borderBottom: '1px solid #eee' }}
                      onClick={() => fetchRecommendations(item.id, item.media_type)}
                    >
                      <img src={poster} alt={title} style={{ width: 60, borderRadius: 8, marginRight: 12 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 17, color: '#222' }}>{title}</div>
                        <div style={{ fontSize: 14, color: '#555' }}>
                          <span style={{ background: '#f39409', color: '#fff', borderRadius: 20, padding: '2px 10px', marginRight: 8 }}>⭐ {rating}</span>
                          <span style={{ background: '#334155', color: '#fff', borderRadius: 20, padding: '2px 10px' }}>{year}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {recommendations.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <h2>Beğenebileceğin İçerikler</h2>
              <div style={{
                display: 'grid',
                /* 6 sütun korunuyor; her sütun en az 200px olacak => posterler daha büyük */
                gridTemplateColumns: 'repeat(6, minmax(200px, 1fr))',
                gap: 16
              }}>
                {recommendations.slice(0, offset).map(item => {
                  const title = item.title || item.name;
                  const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : PLACEHOLDER;
                  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
                  const year = item.release_date ? new Date(item.release_date).getFullYear() : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'Bilinmiyor');
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#181c24',
                        borderRadius: 12,
                        overflow: 'hidden',
                        boxShadow: '0 2px 12px #0001',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => navigate(`/${item.media_type === 'movie' ? 'movie' : 'tv'}/${item.id}`)}
                    >
                      {/* Poster yüksekliği artırıldı — geniş ekranda daha büyük görünecek */}
                      <img
                        src={poster}
                        alt={title}
                        style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleWatch(item.id, item.media_type); }}
                      />
                      <div style={{
                        position: 'absolute',
                        left: 0, right: 0, bottom: 0,
                        padding: 14,
                        background: 'linear-gradient(to top,#120d1e,transparent)'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 17, color: '#fff', marginBottom: 6 }}>{title}</div>
                        <div style={{ fontSize: 14, color: '#fff', marginBottom: 4 }}>
                          <span style={{ background: '#f39409', color: '#fff', borderRadius: 20, padding: '2px 10px', marginRight: 8 }}>⭐ {rating}</span>
                          <span style={{ background: '#334155', color: '#fff', borderRadius: 20, padding: '2px 10px' }}>{year}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {offset < recommendations.length && (
                <button
                  style={{
                    background: '#206fe1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 0',
                    width: '100%',
                    marginTop: 18,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={loadMore}
                >
                  Daha Fazla Göster
                </button>
              )}
            </div>
          )}
          {/* Modal */}
          {showModal && modal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={closeModal}
            >
              <div
                style={{
                  background: '#1f2430',
                  borderRadius: 14,
                  padding: 18,
                  minWidth: 320,
                  maxWidth: 600,
                  position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={closeModal}
                  style={{
                    position: 'absolute',
                    right: 18,
                    top: 14,
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: 9,
                    padding: '8px 12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >×</button>
                {(() => {
                  const trailer = (modal.videos?.results || []).find(v =>
                    (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip') && v.site === 'YouTube'
                  );
                  if (trailer) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${trailer.key}`}
                        style={{ width: '100%', aspectRatio: '19/9', borderRadius: 12, border: 'none', marginBottom: 12 }}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title="Fragman"
                      />
                    );
                  }
                  return null;
                })()}
                <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{modal.title || modal.name || 'Ad Bilinmiyor'}</div>
                    <div style={{ fontSize: 15, color: '#fff', opacity: .7 }}>{modal.original_title || modal.original_name || ''}</div>
                    <div style={{ margin: '8px 0', color: '#fff' }}>{(modal.genres || []).map(g => g.name).join(', ') || 'Tür Bilinmiyor'}</div>
                    <div style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* İzle butonu rozetlerin yanında görünür */}
                      {(() => {
                        const imdbId = modal.imdb_id || modal.external_ids?.imdb_id;
                        if (!imdbId) return null;
                        const targetUrl = `${WORKER_PROXY}${encodeURIComponent(`https://vidmody.com/vs/${imdbId}`)}`;
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              try { window.open(targetUrl, '_blank', 'noopener'); } catch (err) { window.location.href = targetUrl; }
                            }}
                            aria-label={`"${modal.title || modal.name}" dış oynatıcıda izle`}
                            style={{
                              background: '#06b6d4',
                              color: '#021124',
                              padding: '6px 12px',
                              borderRadius: 20,
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(2,6,23,0.2)'
                            }}
                          >
                            İzle
                          </button>
                        );
                      })()}
                      <span style={{ background: '#ff9800', color: '#fff', borderRadius: 30, padding: '6px 16px' }}>
                        IMDB: {modal.vote_average ? modal.vote_average.toFixed(1) : 'Bilinmiyor'}
                      </span>
                      <span style={{ background: '#334155', color: '#fff', borderRadius: 30, padding: '6px 16px' }}>
                        {modal.release_date ? new Date(modal.release_date).getFullYear() : (modal.first_air_date ? new Date(modal.first_air_date).getFullYear() : 'Tarih Bilinmiyor')}
                      </span>
                      <span style={{ background: '#222', color: '#fff', borderRadius: 30, padding: '6px 16px' }}>
                        {modal.media_type === 'movie'
                          ? `${modal.runtime || 'Süre bilinmiyor'} dk`
                          : `${modal.number_of_seasons || 'Bilinmiyor'} sezon`}
                      </span>
                    </div>
                    <div style={{ marginTop: 12, color: '#c4c8d3', fontSize: 16, lineHeight: 1.6 }}>
                      {modal.overview || 'Açıklama bulunamadı.'}
                    </div>
                  </div>
                  <div style={{ minWidth: 120 }}>
                    <img
                      src={modal.poster_path ? `${IMAGE_BASE_URL}${modal.poster_path}` : PLACEHOLDER}
                      alt="Poster"
                      style={{ width: 120, borderRadius: 10 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
