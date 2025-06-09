// src/utils/getPoster.js

const API_KEY = '9fbeefd9c72e02a5779273e36fd769a5';
const BASE_URL = 'https://api.themoviedb.org/3/search/tv';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const cache = {}; // Basit cache (uygulama yeniden başlatılana kadar)

export async function getPoster(query) {
  if (cache[query]) return cache[query];

  try {
    const res = await fetch(`${BASE_URL}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data?.results?.[0]?.poster_path) {
      const posterUrl = IMAGE_BASE + data.results[0].poster_path;
      cache[query] = posterUrl;
      return posterUrl;
    }
  } catch (err) {
    console.error("Poster çekilemedi:", err);
  }

  return null; // Yoksa boş dön
}
