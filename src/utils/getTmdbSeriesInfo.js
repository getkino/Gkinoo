const API_KEY = '9fbeefd9c72e02a5779273e36fd769a5';
const BASE_URL = 'https://api.themoviedb.org/3/search/tv';
const DETAILS_URL = 'https://api.themoviedb.org/3/tv/';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const cache = {};

export async function getTmdbSeriesInfo(query) {
  if (cache[query]) return cache[query];

  try {
    const res = await fetch(`${BASE_URL}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    const first = data?.results?.[0];
    if (first) {
      // Detayları çek
      const detailsRes = await fetch(`${DETAILS_URL}${first.id}?api_key=${API_KEY}&language=tr-TR`);
      const details = await detailsRes.json();

      // Oyuncuları çek
      const creditsRes = await fetch(`${DETAILS_URL}${first.id}/credits?api_key=${API_KEY}&language=tr-TR`);
      const credits = await creditsRes.json();
      const actors = credits.cast?.slice(0, 10).map(actor => actor.name) || [];

      // Fragmanı çek
      const videosRes = await fetch(`${DETAILS_URL}${first.id}/videos?api_key=${API_KEY}&language=tr-TR`);
      const videos = await videosRes.json();
      const trailerObj = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      const trailer = trailerObj ? `https://www.youtube.com/watch?v=${trailerObj.key}` : null;

      // Yayında olduğu yerleri çek
      const providersRes = await fetch(`${DETAILS_URL}${first.id}/watch/providers?api_key=${API_KEY}`);
      const providersData = await providersRes.json();
      let providers = [];
      if (providersData?.results?.TR?.flatrate) {
        providers = providersData.results.TR.flatrate.map(p => ({
          name: p.provider_name,
          logo: p.logo_path ? IMAGE_BASE + p.logo_path : null
        }));
      }

      const info = {
        poster: first.poster_path ? IMAGE_BASE + first.poster_path : null,
        arkaplan: first.backdrop_path ? IMAGE_BASE + first.backdrop_path : null,
        name: first.name,
        overview: details.overview || first.overview,
        genres: details.genres?.map(g => g.name) || [],
        first_air_date: first.first_air_date,
        vote_average: first.vote_average,
        tmdb_id: first.id,
        trailer,
        actors,
        providers, // Yayında olduğu yerler
      };
      cache[query] = info;
      return info;
    }
  } catch (err) {
    console.error("TMDB dizi bilgisi alınamadı:", err);
  }
  return null;
}
