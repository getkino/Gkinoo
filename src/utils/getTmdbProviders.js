// Lightweight TMDB provider logo fetcher + local caching
// Returns a map: normalizedProviderName -> fullLogoUrl
export async function getTmdbProviders(options = { force: false }) {
  try {
    const key = import.meta.env.VITE_TMDB_API_KEY;
    if (!key) return null;

    const CACHE_KEY = 'tmdb_providers_v1';
    const TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

    if (!options.force && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.ts && Date.now() - parsed.ts < TTL && parsed.map) {
            return parsed.map;
          }
        } catch (e) {
          // ignore and re-fetch
        }
      }
    }

    // Try both TV and Movie provider lists and merge
    const endpoints = [
      `https://api.themoviedb.org/3/watch/providers/tv?api_key=${key}&language=en-US`,
      `https://api.themoviedb.org/3/watch/providers/movie?api_key=${key}&language=en-US`
    ];

    let combined = [];
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        const list = Array.isArray(json.results) ? json.results : (json.results ? Object.values(json.results).flat() : []);
        if (Array.isArray(list)) combined = combined.concat(list);
      } catch (e) {
        // continue
      }
    }

    // Normalization similar to PlatformShowcase.normalizeName (remove spaces)
    const norm = (s) => String(s || '')
      .toLowerCase()
      .trim()
      .replace(/\+/g, 'plus')
      .replace(/['’`".]/g, '')
      .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ ]/gi, '')
      .replace(/\s+/g, '');

    const map = {};
    for (const p of combined) {
      if (!p) continue;
      const name = p.provider_name || p.provider || p.name || '';
      const logo = p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null;
      const keyName = norm(name);
      if (!keyName) continue;
      if (!map[keyName] && logo) map[keyName] = logo;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), map }));
      } catch (e) {
        // ignore
      }
    }

    return map;
  } catch (err) {
    return null;
  }
}

export default getTmdbProviders;
