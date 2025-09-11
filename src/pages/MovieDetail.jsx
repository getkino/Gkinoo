import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// TMDB taban URL'leri
const TMDB_API = 'https://api.themoviedb.org/3';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

export default function MovieDetail() {
  const dbg = (...a) => console.log('[MovieDetail][DBG]', ...a);
  const params = useParams();
  const slugRaw = params.slug || params.imdbIdOrSlug || params.id || params.movieId || Object.values(params)[0] || '';
  const { state } = useLocation();
  const navigate = useNavigate();

  // State: TMDB verileri
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movie, setMovie] = useState(null);
  const [mediaType, setMediaType] = useState('movie');
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tmdbNotFound, setTmdbNotFound] = useState(false);
  // Yeni eklenenler (PlatformSeriesDetail fikirleri)
  const [watchProviders, setWatchProviders] = useState(null);
  const [certification, setCertification] = useState(null);

  // IMDb ID normalize: slug içinden çek
  const rawSlugImdb = useMemo(() => {
    if (!slugRaw) return null;
    const m = slugRaw.match(/^(tt\d{7,})$/i);
    if (m) return m[1].toLowerCase();
    const m2 = slugRaw.match(/(?:-|)(tt\d{7,})$/i);
    return m2 ? m2[1].toLowerCase() : null;
  }, [slugRaw]);

  // Yeni: slug numerik ID (başta) + opsiyonel tireli açıklama destekle
  const directTmdbId = useMemo(() => {
    if (!slugRaw) return null;
    const m = slugRaw.match(/^(\d{2,})/); // en az 2 haneli id
    return m ? m[1] : null;
  }, [slugRaw]);

  const movieData = state?.movie || null;
  const streamUrl = state?.streamUrl || movieData?.url || null;
  const rawImdbId = movieData?.['tvg-id'] || movieData?.imdb || movieData?.imdb_id || movieData?.imdbId || rawSlugImdb;
  // stream url'den imdb id fallback
  const imdbFromStream = useMemo(() => {
    if (!rawImdbId && streamUrl) {
      const m = streamUrl.match(/(tt\d{7,})/i);
      return m ? m[1].toLowerCase() : null;
    }
    return null;
  }, [rawImdbId, streamUrl]);

  const fallbackTitle = useMemo(() => {
    if (movieData?.['tvg-name']) return movieData['tvg-name'];
    if (movieData?.title) return movieData.title;
    if (slugRaw) {
      // Eğer slug sadece imdb id ise, başlık için kullanma
      if (/^tt\d{7,}$/i.test(slugRaw)) return 'Bilinmeyen Film';
      return decodeURIComponent(slugRaw.replace(/-/g, ' '))
        .replace(/tt\d{7,}/i, '')
        .replace(/\s+/g, ' ')
        .trim() || 'Bilinmeyen Film';
    }
    return 'Bilinmeyen Film';
  }, [movieData, slugRaw]);
  const fallbackYear = movieData?.year || movieData?.releaseYear || null;

  // TMDb API key
  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY || '9fbeefd9c72e02a5779273e36fd769a5';

  const imdbId = useMemo(() => {
    let candidate = rawImdbId || imdbFromStream;
    if (!candidate) return null;
    let s = String(candidate).trim();
    const m = s.match(/tt\d{7,}/i);
    if (m) return m[0].toLowerCase();
    if (/^\d{7,}$/.test(s)) return `tt${s}`.toLowerCase();
    if (/^tt\d{7,}$/i.test(s)) return s.toLowerCase();
    return null;
  }, [rawImdbId, imdbFromStream]);

  const cacheKey = directTmdbId
    ? `movie_cache_tmdb_${directTmdbId}`
    : imdbId
      ? `movie_cache_${imdbId}`
      : null;
  const abortRef = useRef();
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    let isMounted = true;

    async function fetchMovieData() {
      // 1) DOĞRUDAN TMDB ID (numerik slug)
      if (directTmdbId) {
        dbg('Direct TMDB fetch start', { directTmdbId, cacheKey });
        if (!isMounted) return;
        setLoading(true); setError(null); setTmdbNotFound(false);

        if (cacheKey) {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.movie && parsed.mediaType) {
                dbg('Direct TMDB cache hit');
                setMovie(parsed.movie);
                setMediaType(parsed.mediaType);
                setCast(parsed.cast || []);
                setCrew(parsed.crew || []);
                setVideos(parsed.videos || []);
                setWatchProviders(parsed.watchProviders || null);
                setCertification(parsed.certification || null);
                setLoading(false);
                return;
              }
            }
          } catch { /* ignore */ }
        }

        try {
          const appendMovie = 'credits,videos,external_ids,release_dates';
          const appendTv = 'credits,videos,external_ids,content_ratings';
          const movieUrl = `${TMDB_API}/movie/${directTmdbId}?api_key=${tmdbKey}&language=tr-TR&append_to_response=${appendMovie}`;
          const tvUrl = `${TMDB_API}/tv/${directTmdbId}?api_key=${tmdbKey}&language=tr-TR&append_to_response=${appendTv}`;
          
          const [movieRes, tvRes] = await Promise.allSettled([
            fetch(movieUrl, { signal: controller.signal }),
            fetch(tvUrl, { signal: controller.signal })
          ]);

          const movieOk = movieRes.status === 'fulfilled' && movieRes.value.ok;
          const tvOk = tvRes.status === 'fulfilled' && tvRes.value.ok;
          const movieStatus = movieRes.status === 'fulfilled' ? movieRes.value.status : movieRes.reason?.message || 'fetch-error';
          const tvStatus = tvRes.status === 'fulfilled' ? tvRes.value.status : tvRes.reason?.message || 'fetch-error';

          let type = null; let detailRes = null; let appendUsed = null;
          if (movieOk) { type = 'movie'; detailRes = movieRes.value; appendUsed = appendMovie; }
          else if (tvOk) { type = 'tv'; detailRes = tvRes.value; appendUsed = appendTv; }

          if (!detailRes) {
            if (movieStatus === 404 && tvStatus === 404) {
              throw new Error(`TMDb'de içerik bulunamadı (id: ${directTmdbId})`);
            }
            throw new Error(`TMDb erişim hatası (movie:${movieStatus} tv:${tvStatus})`);
          }

          let detailData = await detailRes.json();
          dbg('Direct primary fetch ok', { type, id: directTmdbId });

          // EN fallback (primary alanlar zayıfsa)
          if (!detailData?.overview || detailData.overview.length < 8) {
            try {
              const enRes = await fetch(`${TMDB_API}/${type}/${directTmdbId}?api_key=${tmdbKey}&language=en-US&append_to_response=${appendUsed}`, { signal: controller.signal });
              if (enRes.ok) {
                const enData = await enRes.json();
                detailData = {
                  ...enData,
                  ...detailData,
                  overview: detailData.overview || enData.overview || 'Açıklama bulunamadı.',
                  genres: detailData.genres?.length ? detailData.genres : enData.genres || [],
                  videos: detailData.videos?.results?.length ? detailData.videos : enData.videos || { results: [] },
                  credits: (detailData.credits?.cast?.length || detailData.credits?.crew?.length) ? detailData.credits : enData.credits || { cast: [], crew: [] },
                  release_dates: detailData.release_dates || enData.release_dates,
                  content_ratings: detailData.content_ratings || enData.content_ratings,
                };
              }
            } catch (e) { dbg('EN fallback hata', e); }
          }

          const castArr = detailData.credits?.cast?.slice(0, 12) || [];
          const crewArr = detailData.credits?.crew || [];
          const videoArr = detailData.videos?.results || [];

          let cert = null;
          if (type === 'movie') {
            const releaseBlocks = detailData.release_dates?.results || [];
            const tr = releaseBlocks.find(r => r.iso_3166_1 === 'TR');
            const us = releaseBlocks.find(r => r.iso_3166_1 === 'US');
            const pick = tr || us;
            if (pick) { const rd = pick.release_dates?.find(r => r.certification); cert = rd?.certification || null; }
          } else {
            const tr = detailData.content_ratings?.results?.find(r => r.iso_3166_1 === 'TR');
            const us = detailData.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
            cert = tr?.rating || us?.rating || null;
          }

          let providers = null;
          try {
            const provRes = await fetch(`${TMDB_API}/${type}/${directTmdbId}/watch/providers?api_key=${tmdbKey}`, { signal: controller.signal });
            if (provRes.ok) {
              const provJson = await provRes.json();
              providers = provJson.results || null;
            }
          } catch (e) { dbg('Providers fetch hata', e); }

          setMovie(detailData);
          setMediaType(type);
          setCast(castArr);
          setCrew(crewArr);
          setVideos(videoArr);
          setWatchProviders(providers);
          setCertification(cert);

          if (cacheKey) {
            try { localStorage.setItem(cacheKey, JSON.stringify({ movie: detailData, mediaType: type, cast: castArr, crew: crewArr, videos: videoArr, watchProviders: providers, certification: cert, ts: Date.now() })); } catch {}
          }
        } catch (err) {
          if (err.name === 'AbortError' || !isMounted) return;
          dbg('Direct TMDB fetch hata', err);
          setError(err.message);
          setTmdbNotFound(true);
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // 2) IMDb veya Başlık arama yolu
      dbg('Fallback fetch start', { imdbId, fallbackTitle, fallbackYear, cacheKey, slugRaw });
      if (!imdbId && !fallbackTitle) {
        setTmdbNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setTmdbNotFound(false);

      // Cache kontrol
      if (cacheKey) {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.movie && parsed.mediaType) {
              dbg('Fallback cache hit');
              setMovie(parsed.movie);
              setMediaType(parsed.mediaType);
              setCast(parsed.cast || []);
              setCrew(parsed.crew || []);
              setVideos(parsed.videos || []);
              setWatchProviders(parsed.watchProviders || null);
              setCertification(parsed.certification || null);
              setLoading(false);
              return;
            }
          }
        } catch { /* ignore */ }
      }

      let tmdbId = null; let type = 'movie';
      try {
        // IMDb find
        if (imdbId) {
          const findUrl = `${TMDB_API}/find/${imdbId}?api_key=${tmdbKey}&external_source=imdb_id`;
          const findRes = await fetch(findUrl, { signal: controller.signal });
          if (findRes.ok) {
            const findData = await findRes.json();
            if (findData.movie_results?.length) { tmdbId = findData.movie_results[0].id; type = 'movie'; }
            else if (findData.tv_results?.length) { tmdbId = findData.tv_results[0].id; type = 'tv'; }
          }
        }
        // Başlık arama
        if (!tmdbId && fallbackTitle) {
          const q = encodeURIComponent(fallbackTitle);
          const yearParam = fallbackYear ? `&year=${encodeURIComponent(fallbackYear)}` : '';
          for (const searchType of ['movie', 'tv']) {
            const searchUrl = `${TMDB_API}/search/${searchType}?api_key=${tmdbKey}&language=tr-TR&query=${q}${yearParam}`;
            const sRes = await fetch(searchUrl, { signal: controller.signal });
            if (sRes.ok) {
              const sData = await sRes.json();
              if (sData.results?.length) {
                const bestMatch = sData.results.reduce((best, item) => {
                  const titleMatch = item.title?.toLowerCase().includes(fallbackTitle.toLowerCase()) || item.name?.toLowerCase().includes(fallbackTitle.toLowerCase());
                  const yearMatch = !fallbackYear || (item.release_date || item.first_air_date)?.startsWith(fallbackYear);
                  const score = (titleMatch ? 10 : 0) + (yearMatch ? 5 : 0);
                  return score > (best.score || 0) ? { item, score } : best;
                }, { item: null, score: 0 });
                if (bestMatch.item) { tmdbId = bestMatch.item.id; type = searchType; break; }
              }
            }
          }
        }
        if (!tmdbId) { setTmdbNotFound(true); setLoading(false); return; }

        const endpoint = type === 'tv' ? 'tv' : 'movie';
        const append = endpoint === 'tv' ? 'credits,videos,external_ids,content_ratings' : 'credits,videos,external_ids,release_dates';
        const detailUrlTR = `${TMDB_API}/${endpoint}/${tmdbId}?api_key=${tmdbKey}&language=tr-TR&append_to_response=${append}`;
        let detailData = null;
        const detailResTR = await fetch(detailUrlTR, { signal: controller.signal });
        if (detailResTR.ok) detailData = await detailResTR.json(); else throw new Error(`TMDb detail (TR) hatası: ${detailResTR.status}`);

        if (!detailData?.overview || detailData.overview.length < 8) {
          try {
            const detailUrlEN = `${TMDB_API}/${endpoint}/${tmdbId}?api_key=${tmdbKey}&language=en-US&append_to_response=${append}`;
            const detailResEN = await fetch(detailUrlEN, { signal: controller.signal });
            if (detailResEN.ok) {
              const enData = await detailResEN.json();
              detailData = {
                ...enData,
                ...detailData,
                overview: detailData.overview || enData.overview || 'Açıklama bulunamadı.',
                genres: detailData.genres?.length ? detailData.genres : enData.genres || [],
                videos: detailData.videos?.results?.length ? detailData.videos : enData.videos || { results: [] },
                credits: (detailData.credits?.cast?.length || detailData.credits?.crew?.length) ? detailData.credits : enData.credits || { cast: [], crew: [] },
                release_dates: detailData.release_dates || enData.release_dates,
                content_ratings: detailData.content_ratings || enData.content_ratings,
              };
            }
          } catch { /* ignore */ }
        }

        // Watch Providers
        let providers = null;
        try {
          const provRes = await fetch(`${TMDB_API}/${endpoint}/${tmdbId}/watch/providers?api_key=${tmdbKey}`, { signal: controller.signal });
          if (provRes.ok) { const provJson = await provRes.json(); providers = provJson.results || null; }
        } catch { /* ignore */ }

        // Certification
        let cert = null;
        if (endpoint === 'movie') {
          const releaseBlocks = detailData.release_dates?.results || [];
          const tr = releaseBlocks.find(r => r.iso_3166_1 === 'TR');
          const us = releaseBlocks.find(r => r.iso_3166_1 === 'US');
          const pick = tr || us;
          if (pick) { const rd = pick.release_dates?.find(r => r.certification); cert = rd?.certification || null; }
        } else {
          const tr = detailData.content_ratings?.results?.find(r => r.iso_3166_1 === 'TR');
          const us = detailData.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
          cert = tr?.rating || us?.rating || null;
        }

        const castArr = detailData.credits?.cast?.slice(0, 12) || [];
        const crewArr = detailData.credits?.crew || [];
        const videoArr = detailData.videos?.results || [];

        setMovie(detailData);
        setMediaType(type);
        setCast(castArr);
        setCrew(crewArr);
        setVideos(videoArr);
        setWatchProviders(providers);
        setCertification(cert);

        if (cacheKey) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ movie: detailData, mediaType: type, cast: castArr, crew: crewArr, videos: videoArr, watchProviders: providers, certification: cert, ts: Date.now() }));
          } catch { /* ignore */ }
        }
      } catch (err) {
        if (err.name === 'AbortError' || !isMounted) return;
        setError(err.message);
        setTmdbNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMovieData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [directTmdbId, imdbId, fallbackTitle, fallbackYear, tmdbKey, cacheKey, slugRaw]);

  const director = crew.find(c => c.job === 'Director');
  const writers = crew.filter(c => ['Writer', 'Screenplay', 'Author', 'Story', 'Teleplay'].includes(c.job)).slice(0, 3);

  const year = movie?.release_date ? new Date(movie.release_date).getFullYear() : movie?.first_air_date ? new Date(movie.first_air_date).getFullYear() : undefined;
  const runtime = movie?.runtime || movie?.episode_run_time?.[0];
  const displayTitle = movie?.title || movie?.name || fallbackTitle;

  const backdropUrl = movie?.backdrop_path ? IMG_ORIGINAL + movie.backdrop_path : null;
  const posterUrl = movie?.poster_path ? IMG_W500 + movie.poster_path : movieData?.logo || null;

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#0f0f10', color: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>;
  }

  const FallbackLocal = () => (
    <div style={{ padding: '80px 5%' }}>
      <h1 style={{ margin: '0 0 16px' }}>{displayTitle}</h1>
      {movieData?.logo && (
        <img
          src={movieData.logo}
          alt={displayTitle}
          style={{ width: '240px', height: '360px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }}
        />
      )}
      <p style={{ color: '#bbb' }}>
        TMDb'de film bulunamadı veya veri alınamadı.
        {year && <span> Yıl: {year}</span>}
      </p>
      {streamUrl && (
        <a
          href={streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 24,
            background: '#fff',
            color: '#000',
            padding: '14px 28px',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          ▶ İzle
        </a>
      )}
    </div>
  );

  const providerList = watchProviders?.TR?.flatrate || watchProviders?.US?.flatrate || [];
  const statusMap = {
    'Returning Series': 'Devam Ediyor',
    'Ended': 'Sona Erdi',
    'Canceled': 'İptal Edildi',
    'In Production': 'Yapım Aşamasında'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', color: '#eee', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif" }}>
      {!tmdbNotFound && movie ? (
        <>
          <div style={{ position: 'relative', width: '100%', minHeight: '70vh', display: 'flex', alignItems: 'flex-end', padding: '80px 5% 60px' }}>
            {backdropUrl && <img src={backdropUrl} alt={displayTitle} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.4)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,15,16,0.95) 0%, rgba(15,15,16,0.3) 50%, rgba(15,15,16,0.95) 100%)' }} />
            <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', fontSize: 20 }}>←</button>
            <div style={{ display: 'flex', gap: '48px', position: 'relative', zIndex: 2, width: '100%', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {posterUrl && (
                <div style={{ flex: '0 0 240px' }}>
                  <img src={posterUrl} alt={displayTitle} style={{ width: '240px', height: '360px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} />
                </div>
              )}
              <div style={{ flex: '1 1 400px' }}>
                <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 700 }}>{displayTitle}</h1>
                <p style={{ margin: '0 0 20px', fontSize: '1.1rem', lineHeight: 1.6, color: '#ddd', maxWidth: 600 }}>{movie.overview || 'Açıklama bulunamadı.'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.9rem', marginBottom: 24 }}>
                  {movie.vote_average && <span style={{ background: 'rgba(255,215,0,0.2)', color: '#ffd700', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>⭐ {Number(movie.vote_average).toFixed(1)}</span>}
                  {certification && <span style={{ background: 'rgba(255,107,107,0.18)', color: '#ff6b6b', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>{certification}</span>}
                  {year && <span style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 8 }}>{year}</span>}
                  {runtime && <span style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 8 }}>{runtime} dk</span>}
                  {movie.genres?.slice(0, 3).map(g => <span key={g.id} style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 8 }}>{g.name}</span>)}
                  <span style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 8, textTransform: 'uppercase', fontSize: '0.75rem' }}>{mediaType === 'tv' ? 'Dizi' : 'Film'}</span>
                  {mediaType === 'tv' && movie.status && (
                    <span style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: 8 }}>{statusMap[movie.status] || movie.status}</span>
                  )}
                  {providerList.length > 0 && (
                    <span style={{ background: 'rgba(58,160,255,0.18)', color: '#3af', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>Akış: {providerList.map(p => p.provider_name).join(', ')}</span>
                  )}
                </div>
                {(director || writers.length > 0) && (
                  <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap', marginBottom: 32 }}>
                    {director && (
                      <div>
                        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Yönetmen</div>
                        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>{director.name}</div>
                      </div>
                    )}
                    {writers.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Senaryo</div>
                        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>{writers.map(w => w.name).join(', ')}</div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {streamUrl && <a href={streamUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#000', padding: '16px 32px', borderRadius: 8, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>▶ İzle</a>}
                  {videos.length > 0 && <a href={`https://www.youtube.com/watch?v=${videos.find(v => v.type === 'Trailer')?.key || videos[0]?.key}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 24px', borderRadius: 8, fontSize: 16, fontWeight: 500, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>🎬 Fragman</a>}
                  {movie.id && <a href={`https://www.themoviedb.org/${mediaType}/${movie.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(58,160,255,0.15)', color: '#3af', padding: '16px 24px', borderRadius: 8, fontSize: 16, fontWeight: 500, textDecoration: 'none', border: '1px solid rgba(58,160,255,0.35)' }}>TMDb</a>}
                </div>
              </div>
            </div>
          </div>
          {cast.length > 0 && (
            <div style={{ padding: '60px 5% 0' }}>
              <h2 style={{ margin: '0 0 32px', fontSize: '1.8rem', fontWeight: 600 }}>Oyuncular</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 24 }}>
                {cast.map(p => (
                  <div key={p.cast_id || p.credit_id || p.id} style={{ textAlign: 'center' }}>
                    {p.profile_path ? <img src={IMG_W500 + p.profile_path} alt={p.name} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} /> : <div style={{ width: '100%', aspectRatio: '2/3', background: '#333', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#666' }}>Fotoğraf Yok</div>}
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{p.character}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : <FallbackLocal />}
      {error && (
        <div style={{ padding: '40px 5%', color: '#f66', fontSize: '1rem' }}>
          <strong>Hata:</strong> Film verileri alınamadı. ({error})
        </div>
      )}
    </div>
  );
}