import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SimpleHlsPlayer from '../components/SimpleHlsPlayer.jsx';

// TMDB sabitleri
const TMDB_API = 'https://api.themoviedb.org/3';
const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

// /movie/:tmdbId sadece sayısal TMDB id için hafifletilmiş yeni sayfa
export default function TmdbMovie() {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [data, setData] = useState(null);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mediaType, setMediaType] = useState('movie');
  const [certification, setCertification] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const abortRef = useRef();

  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY || '9fbeefd9c72e02a5779273e36fd769a5';

  const isValidNumeric = useMemo(() => /^(\d{2,})$/.test(tmdbId || ''), [tmdbId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!isValidNumeric) { setError('Geçersiz TMDB ID'); setLoading(false); return; }
    if (!tmdbKey || tmdbKey === 'REPLACE_ME') { setError('TMDB API anahtarı yok'); setLoading(false); return; }
    const controller = new AbortController();
    abortRef.current = controller;
    let isMounted = true;
    async function run() {
      if (!isMounted) return;
      setLoading(true); setError(null);
      try {
        const appendMovie = 'credits,videos,external_ids,release_dates';
        const appendTv = 'credits,videos,external_ids,content_ratings';
        const movieUrl = `${TMDB_API}/movie/${tmdbId}?api_key=${tmdbKey}&language=tr-TR&append_to_response=${appendMovie}`;
        const tvUrl = `${TMDB_API}/tv/${tmdbId}?api_key=${tmdbKey}&language=tr-TR&append_to_response=${appendTv}`;
        console.log('[TmdbMovie][FETCH]', { movieUrl, tvUrl, tmdbKey: tmdbKey?.substring(0,8)+'...' });
        const [movieRes, tvRes] = await Promise.allSettled([
          fetch(movieUrl, { signal: controller.signal }),
          fetch(tvUrl, { signal: controller.signal })
        ]);

        const movieOk = movieRes.status === 'fulfilled' && movieRes.value.ok;
        const tvOk = tvRes.status === 'fulfilled' && tvRes.value.ok;
        const movieStatus = movieRes.status === 'fulfilled' ? movieRes.value.status : movieRes.reason?.message || 'fetch-error';
        const tvStatus = tvRes.status === 'fulfilled' ? tvRes.value.status : tvRes.reason?.message || 'fetch-error';
        console.log('[TmdbMovie][RAW_STATUS]', { movieOk, tvOk, movieStatus, tvStatus });
        
        // Test basit fetch
        if (!movieOk && !tvOk) {
          console.log('[TmdbMovie][TEST_SIMPLE]', 'Trying simple fetch...');
          try {
            const testRes = await fetch(`${TMDB_API}/movie/550?api_key=${tmdbKey}`, { signal: controller.signal });
            console.log('[TmdbMovie][TEST_RESULT]', { status: testRes.status, ok: testRes.ok });
            if (!testRes.ok) {
              const testText = await testRes.text();
              console.log('[TmdbMovie][TEST_ERROR]', testText);
            }
          } catch (testErr) {
            console.log('[TmdbMovie][TEST_NETWORK]', testErr.message);
          }
        }

        let type = null; let detailRes = null; let appendUsed = null;
        if (movieOk) { type = 'movie'; detailRes = movieRes.value; appendUsed = appendMovie; }
        else if (tvOk) { type = 'tv'; detailRes = tvRes.value; appendUsed = appendTv; }

        if (!detailRes) {
          if (movieStatus === 404 && tvStatus === 404) {
            throw new Error(`TMDb'de içerik bulunamadı (id: ${tmdbId})`);
          }
          throw new Error(`TMDb erişim hatası (movie:${movieStatus} tv:${tvStatus})`);
        }

        let detailData = await detailRes.json();

        if (!detailData.overview || detailData.overview.length < 8) {
          try {
            const enRes = await fetch(`${TMDB_API}/${type}/${tmdbId}?api_key=${tmdbKey}&language=en-US&append_to_response=${appendUsed}`, { signal: controller.signal });
            if (enRes.ok) {
              const enData = await enRes.json();
              detailData = {
                ...enData,
                ...detailData,
                overview: detailData.overview || enData.overview || 'Açıklama bulunamadı.',
                genres: detailData.genres?.length ? detailData.genres : enData.genres || [],
                credits: (detailData.credits?.cast?.length || detailData.credits?.crew?.length) ? detailData.credits : enData.credits || { cast: [], crew: [] },
                videos: detailData.videos?.results?.length ? detailData.videos : enData.videos || { results: [] },
                release_dates: detailData.release_dates || enData.release_dates,
                content_ratings: detailData.content_ratings || enData.content_ratings
              };
            }
          } catch (err) { console.warn('[TmdbMovie][EN Fallback Hata]', err); }
        }

        const c = detailData.credits?.cast?.slice(0, 12) || [];
        const cr = detailData.credits?.crew || [];
        const v = detailData.videos?.results || [];

        // Sertifika
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

        // Provider
        let providers = null;
        try {
          const pRes = await fetch(`${TMDB_API}/${type}/${tmdbId}/watch/providers?api_key=${tmdbKey}`, { signal: controller.signal });
          if (pRes.ok) { const pj = await pRes.json(); providers = pj.results || null; }
        } catch (e) { console.warn('[TmdbMovie][Providers Hata]', e); }

        setData(detailData);
        setCast(c); setCrew(cr); setVideos(v); setMediaType(type); setCertification(cert); setWatchProviders(providers);
      } catch (e) {
        if (e.name !== 'AbortError' && isMounted) {
          console.error('[TmdbMovie][HATA]', e);
          setError(e.message || 'Hata');
        }
      } finally { 
        if (isMounted) setLoading(false); 
      }
    }
    run();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [tmdbId, tmdbKey, isValidNumeric]);

  const director = crew.find(c => c.job === 'Director');
  const writers = crew.filter(c => ['Writer','Screenplay','Author','Story','Teleplay'].includes(c.job)).slice(0,3);
  const year = data?.release_date ? new Date(data.release_date).getFullYear() : data?.first_air_date ? new Date(data.first_air_date).getFullYear() : undefined;
  const runtime = data?.runtime || data?.episode_run_time?.[0];
  const title = data?.title || data?.name || `TMDb #${tmdbId}`;
  const backdropUrl = data?.backdrop_path ? IMG_ORIGINAL + data.backdrop_path : null;
  const posterUrl = data?.poster_path ? IMG_W500 + data.poster_path : null;
  const providerList = watchProviders?.TR?.flatrate || watchProviders?.US?.flatrate || [];
  const statusMap = { 'Returning Series':'Devam Ediyor','Ended':'Sona Erdi','Canceled':'İptal Edildi','In Production':'Yapım Aşamasında' };
  
  // CategoryDetail'den gelen stream URL'i al
  const streamUrl = state?.streamUrl || state?.movie?.url || null;

  const handleWatch = () => {
    if (streamUrl) {
      setIsWatching(true);
    } else {
      console.warn('Stream URL bulunamadı');
    }
  };

  const handleBackFromPlayer = () => {
    setIsWatching(false);
  };

  if (isWatching && streamUrl) {
    // TMDB bilgilerini player'a geç
    const tmdbInfo = {
      tmdb_id: tmdbId,
      name: title,
      overview: data.overview,
      poster: posterUrl,
      genres: data.genres?.map(g => g.name),
      release_date: data.release_date || data.first_air_date,
      vote_average: data.vote_average,
      providers: providerList,
      actors: cast.slice(0, 4).map(p => p.name),
    };

    return (
      <SimpleHlsPlayer
        url={streamUrl}
        title={title}
        onBack={handleBackFromPlayer}
        tmdbInfo={tmdbInfo}
        groupChannels={[]}
        groupTitle=""
        onSelectChannel={() => {}}
      />
    );
  }

  if (loading) return <div style={{minHeight:'100vh',background:'#0f0f10',display:'flex',alignItems:'center',justifyContent:'center',color:'#eee'}}>Yükleniyor...</div>;
  if (error) return <div style={{minHeight:'100vh',background:'#0f0f10',color:'#f55',padding:'80px 5%'}}><button onClick={()=>navigate(-1)} style={{background:'none',border:'1px solid #444',color:'#fff',padding:'8px 16px',borderRadius:6,marginBottom:32,cursor:'pointer'}}>← Geri</button><h1 style={{margin:0,fontSize:'2rem'}}>Hata</h1><p style={{color:'#bbb',whiteSpace:'pre-line'}}>{error}\nLütfen ID ve API anahtarını kontrol edin.</p></div>;
  if (!data) return null;

  return (
    <div style={{minHeight:'100vh',background:'#0f0f10',color:'#eee',fontFamily:"Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",position:'fixed',top:0,left:0,width:'100vw',height:'100vh',overflowY:'auto',zIndex:9999}}>
      {backdropUrl && <img src={backdropUrl} alt={title} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',objectFit:'cover',filter:'brightness(0.3)',zIndex:-2}}/>}
      <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)',zIndex:-1}}/>
      
      <button onClick={()=>navigate(-1)} style={{position:'fixed',top:24,left:24,background:'rgba(255,255,255,0.9)',border:'none',color:'#000',borderRadius:8,padding:'12px 20px',cursor:'pointer',fontSize:14,zIndex:10,fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
        <span style={{fontSize:16}}>←</span>
        Geri
      </button>
      
      <div style={{display:'flex',flexDirection:window.innerWidth < 768 ? 'column' : 'row',alignItems:'flex-start',gap:window.innerWidth < 768 ? 24 : 48,padding:'100px 5% 40px',minHeight:'100vh',position:'relative',zIndex:2}}>
        {posterUrl && (
          <div style={{flex:window.innerWidth < 768 ? '1 1 auto' : '0 0 300px',position:window.innerWidth < 768 ? 'relative' : 'sticky',top:window.innerWidth < 768 ? 'auto' : '100px',display:'flex',flexDirection:window.innerWidth < 768 ? 'row' : 'column',gap:window.innerWidth < 768 ? 20 : 0,alignItems:window.innerWidth < 768 ? 'flex-start' : 'stretch'}}>
            <img src={posterUrl} alt={title} style={{width:window.innerWidth < 768 ? '120px' : '100%',height:window.innerWidth < 768 ? '180px' : 'auto',borderRadius:16,boxShadow:'0 20px 60px rgba(0,0,0,0.5)',marginBottom:window.innerWidth < 768 ? 0 : 20,objectFit:'cover',flexShrink:0}}/>
            <div style={{display:'flex',flexDirection:'column',gap:12,flex:window.innerWidth < 768 ? 1 : 'none'}}>
              {streamUrl && (
                <button onClick={handleWatch} style={{
                  display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,background:'#fff',color:'#000',
                  padding:'14px 24px',borderRadius:10,fontSize:15,fontWeight:700,border:'none',cursor:'pointer',
                  boxShadow:'0 6px 20px rgba(0,0,0,0.3)',transition:'all 0.3s ease'
                }}>
                  ▶ Hemen İzle
                </button>
              )}
              {videos.length>0 && (
                <a href={`https://www.youtube.com/watch?v=${videos.find(v=>v.type==='Trailer')?.key || videos[0]?.key}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,background:'rgba(255,255,255,0.1)',color:'#fff',
                  padding:'14px 24px',borderRadius:10,fontSize:15,fontWeight:600,textDecoration:'none',
                  border:'2px solid rgba(255,255,255,0.2)',backdropFilter:'blur(10px)',transition:'all 0.3s ease'
                }}>
                  🎬 Fragman
                </a>
              )}
            </div>
          </div>
        )}
        
        <div style={{flex:1,paddingTop:posterUrl ? 0 : 50}}>
          <h1 style={{margin:'0 0 20px',fontSize:'clamp(2.5rem,6vw,4rem)',fontWeight:700,lineHeight:1.1}}>{title}</h1>
          
          <div style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:24}}>
            {data.vote_average && <span style={{background:'rgba(255,215,0,0.15)',color:'#ffd700',padding:'8px 16px',borderRadius:20,fontWeight:600,fontSize:14}}>⭐ {Number(data.vote_average).toFixed(1)}</span>}
            {certification && <span style={{background:'rgba(255,107,107,0.15)',color:'#ff6b6b',padding:'8px 16px',borderRadius:20,fontWeight:600,fontSize:14}}>{certification}</span>}
            {year && <span style={{background:'rgba(255,255,255,0.1)',color:'#fff',padding:'8px 16px',borderRadius:20,fontSize:14}}>{year}</span>}
            {runtime && <span style={{background:'rgba(255,255,255,0.1)',color:'#fff',padding:'8px 16px',borderRadius:20,fontSize:14}}>{runtime} dk</span>}
            <span style={{background:'rgba(255,255,255,0.1)',color:'#fff',padding:'8px 16px',borderRadius:20,fontSize:14,textTransform:'uppercase'}}>{mediaType==='tv'?'Dizi':'Film'}</span>
          </div>

          <p style={{margin:'0 0 24px',fontSize:'1.2rem',lineHeight:1.7,color:'#ddd',maxWidth:700}}>{data.overview || 'Açıklama bulunamadı.'}</p>
          
          {cast.length>0 && (
            <div style={{marginBottom:32}}>
              <h2 style={{margin:'0 0 20px',fontSize:'1.3rem',fontWeight:700,color:'#fff'}}>Cast & Crew</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(120px,1fr))',gap:12}}>
                {cast.slice(0,6).map(p=> (
                  <div key={p.cast_id||p.credit_id||p.id} style={{background:'rgba(255,255,255,0.05)',borderRadius:10,padding:10,backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.1)'}}>
                    {p.profile_path ? (
                      <img src={IMG_W500 + p.profile_path} alt={p.name} style={{width:'100%',aspectRatio:'2/3',objectFit:'cover',borderRadius:6,marginBottom:6}}/>
                    ) : (
                      <div style={{width:'100%',aspectRatio:'2/3',background:'rgba(255,255,255,0.1)',borderRadius:6,marginBottom:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#666'}}>No Photo</div>
                    )}
                    <div style={{fontSize:11,fontWeight:600,marginBottom:2,color:'#fff'}}>{p.name}</div>
                    <div style={{fontSize:9,color:'#aaa'}}>{p.character}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {cast.length>0 && (
        <div style={{padding:'60px 5% 80px',position:'relative',zIndex:2,display:'none'}}>
          <h2 style={{margin:'0 0 40px',fontSize:'2rem',fontWeight:700,color:'#fff'}}>Oyuncular</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))',gap:24}}>
            {cast.map(p=> (
              <div key={p.cast_id||p.credit_id||p.id} style={{background:'rgba(255,255,255,0.05)',borderRadius:16,padding:16,backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.1)'}}>
                {p.profile_path ? (
                  <img src={IMG_W500 + p.profile_path} alt={p.name} style={{width:'100%',aspectRatio:'2/3',objectFit:'cover',borderRadius:12,marginBottom:12}}/>
                ) : (
                  <div style={{width:'100%',aspectRatio:'2/3',background:'rgba(255,255,255,0.1)',borderRadius:12,marginBottom:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#666'}}>No Photo</div>
                )}
                <div style={{fontSize:14,fontWeight:700,marginBottom:4,color:'#fff'}}>{p.name}</div>
                <div style={{fontSize:12,color:'#aaa'}}>{p.character}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
