const API_KEY = '9fbeefd9c72e02a5779273e36fd769a5';
const BASE_URL = 'https://api.themoviedb.org/3/search/movie';
const DETAILS_URL = 'https://api.themoviedb.org/3/movie/';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const cache = {};

export async function getTmdbMovieInfo(query) {
  if (cache[query]) return cache[query];

  try {
    const res = await fetch(`${BASE_URL}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    const first = data?.results?.[0];
    if (first) {
      // Detayları çek
      const detailsRes = await fetch(`${DETAILS_URL}${first.id}?api_key=${API_KEY}&language=tr-TR&append_to_response=watch/providers`);
      const details = await detailsRes.json();

      // Yayında olduğu yerleri çek
      let providers = [];
      if (details['watch/providers']?.results?.TR?.flatrate) {
        providers = details['watch/providers'].results.TR.flatrate.map(p => ({
          name: p.provider_name,
          logo: p.logo_path ? IMAGE_BASE + p.logo_path : null
        }));
      }

      const info = {
        poster: first.poster_path ? IMAGE_BASE + first.poster_path : null,
        name: first.title,
        overview: details.overview || first.overview,
        genres: details.genres?.map(g => g.name) || [],
        release_date: first.release_date,
        vote_average: first.vote_average,
        tmdb_id: first.id,
        providers, // Yayında olduğu yerler
      };
      cache[query] = info;
      return info;
    }
  } catch (err) {
    console.error("TMDB film bilgisi alınamadı:", err);
  }
  return null;
}
