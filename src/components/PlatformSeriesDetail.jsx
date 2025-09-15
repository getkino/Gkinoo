import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SimpleHlsPlayer from './SimpleHlsPlayer';

// TMDB API anahtarınızı buraya ekleyin
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function PlatformSeriesDetail() {
  const { platformName, seriesName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { platform, episodes } = location.state || {};
  const [playerUrl, setPlayerUrl] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [tmdbLoading, setTmdbLoading] = useState(true);
  const [watchProviders, setWatchProviders] = useState(null);
  const [certification, setCertification] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef([]);
  const [tmdbSeason, setTmdbSeason] = useState(null);
  const [tmdbSeasonLoading, setTmdbSeasonLoading] = useState(false);
  const [episodeStills, setEpisodeStills] = useState({});
  const [episodeNames, setEpisodeNames] = useState({});
  const [seriesLogo, setSeriesLogo] = useState(null);

  const episodesList = useMemo(() => episodes || [], [episodes]);
  const decodedSeries = useMemo(() => decodeURIComponent(seriesName || ''), [seriesName]);

  const normalizeText = useCallback((s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim(), []);
  const escapeRegExp = useCallback((s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), []);

  const canonicalizeSeasonEp = useCallback((s) => {
    if (!s) return '';
    let m = s.match(/(\d+)\s*\.?\s*sezon\s*(\d+)\s*\.?\s*bölüm/i);
    if (m) return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
    m = s.match(/sezon\s*(\d+)\s*bölüm\s*(\d+)/i);
    if (m) return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
    m = s.match(/s\s*(\d{1,2})\s*e\s*(\d{1,3})/i) || s.match(/s(\d{1,2})e(\d{1,3})/i);
    if (m) return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
    return '';
  }, []);

  const extractSeasonEp = useCallback((title) => {
    if (!title) return '';
    const patterns = [
      /(\d+)\s*\.?\s*sezon\s*(\d+)\s*\.?\s*bölüm/i,
      /sezon\s*(\d+)\s*bölüm\s*(\d+)/i,
      /s\s*(\d{1,2})\s*e\s*(\d{1,3})/i,
      /s(\d{1,2})e(\d{1,3})/i,
    ];
    for (const p of patterns) {
      const m = title.match(p);
      if (m && m.length === 3) {
        return `${parseInt(m[1], 10)}. Sezon ${parseInt(m[2], 10)}. Bölüm`;
      }
    }
    return '';
  }, []);

  const removeSeriesPrefix = useCallback((t) => {
    const sep = '[-–—:|]';
    const re = new RegExp(`^\\s*${escapeRegExp(decodedSeries)}\\s*${sep}\\s*`, 'i');
    return (t || '').replace(re, '').trim();
  }, [decodedSeries, escapeRegExp]);

  const getEpisodeTitle = useCallback((bolum) => {
    const title = (bolum?.title || '').trim();
    const seasonEpRaw = (bolum?.seasonEpisode || '').trim();
    const seasonEp = canonicalizeSeasonEp(seasonEpRaw) || extractSeasonEp(title);
    let cleaned = removeSeriesPrefix(title);
    if (seasonEp && normalizeText(cleaned).includes(normalizeText(seasonEp))) {
      return seasonEp;
    }
    return cleaned || seasonEp || title;
  }, [canonicalizeSeasonEp, extractSeasonEp, removeSeriesPrefix, normalizeText]);

  const shouldShowSeasonLine = useCallback((bolum) => {
    const titleText = getEpisodeTitle(bolum);
    const seasonEpRaw = (bolum?.seasonEpisode || '').trim();
    const seasonEp = canonicalizeSeasonEp(seasonEpRaw) || extractSeasonEp(bolum?.title || '');
    if (!seasonEp) return false;
    return normalizeText(titleText) !== normalizeText(seasonEp) && !normalizeText(titleText).includes(normalizeText(seasonEp));
  }, [getEpisodeTitle, canonicalizeSeasonEp, extractSeasonEp, normalizeText]);

  const normalizeDiacritics = useCallback(
    (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    []
  );

  const isGenericEpName = useCallback((name) => {
    const n = normalizeDiacritics(name || '').toLowerCase().trim();
    if (!n) return true;
    return /\b(bolum|bölüm|episode|ep)\s*\d+\b/.test(n) || /^bölüm$/.test(n);
  }, [normalizeDiacritics]);

  const parseSeasonEpisode = useCallback((seasonEpisode, title) => {
    const src = `${seasonEpisode || ''} ${title || ''}`;
    const s = normalizeDiacritics(src).toLowerCase().replace(/\s+/g, ' ').trim();
    let m =
      s.match(/(\d+)\s*\.?\s*sezon\s*(\d+)\s*\.?\s*bo?lu?m\b/) ||
      s.match(/sezon\s*(\d+)\s*bo?lu?m\s*(\d+)\b/);
    if (m) return { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) };
    m = s.match(/\bs\s*(\d{1,2})\s*e\s*(\d{1,3})\b/) || s.match(/\bs(\d{1,2})e(\d{1,3})\b/);
    if (m) return { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) };
    m = s.match(/(?:^|\s)sezon\s*(\d+)\b/);
    const seasonOnly = m ? parseInt(m[1], 10) : null;
    m = s.match(/(?:^|\s)bo?lu?m\s*(\d+)\b/) || s.match(/\bep(?:isode)?\s*(\d+)\b/);
    const episodeOnly = m ? parseInt(m[1], 10) : null;
    return { season: seasonOnly || null, episode: episodeOnly || null };
  }, [normalizeDiacritics]);

  const formatSeasonEpTr = useCallback((s, e) => {
    if (s && e) return `${s}. Sezon ${e}. Bölüm`;
    if (s) return `${s}. Sezon`;
    if (e) return `Bölüm ${e}`;
    return '';
  }, []);

  const stripSeasonEpTokens = useCallback((t) => {
    let x = removeSeriesPrefix(t || '');
    const n = normalizeDiacritics(x).toLowerCase();
    if (/\d+\s*\.?\s*sezon\s*\d+\s*\.?\s*bo?lu?m/.test(n)) {
      x = x.replace(/(\d+)\s*\.?\s*Sezon\s*(\d+)\s*\.?\s*Bölüm/gi, '')
           .replace(/Sezon\s*(\d+)\s*Bölüm\s*(\d+)/gi, '');
    }
    x = x
      .replace(/\bS\s*\d{1,2}\s*E\s*\d{1,3}\b/gi, '')
      .replace(/\bS\d{1,2}E\d{1,3}\b/gi, '')
      .replace(/Sezon\s*\d+/gi, '')
      .replace(/Bölüm\s*\d+/gi, '')
      .replace(/Bolum\s*\d+/gi, '')
      .replace(/Episode\s*\d+/gi, '')
      .replace(/Ep\s*\d+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return x;
  }, [removeSeriesPrefix, normalizeDiacritics]);

  const handleBackClick = useCallback(() => navigate(-1), [navigate]);
  const handleEpisodeClick = useCallback((url) => { setPlayerUrl(url); }, []);
  const handlePlayerClose = useCallback(() => { setPlayerUrl(null); }, []);

  useEffect(() => {
    async function fetchTmdb() {
      setTmdbLoading(true);
      try {
        const decodedName = decodeURIComponent(seriesName);
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(decodedName)}&language=tr-TR`
        );
        if (!searchRes.ok) throw new Error(`HTTP error! status: ${searchRes.status}`);
        const searchJson = await searchRes.json();
        let show = null;
        if (searchJson.results && searchJson.results.length > 0) {
          show = searchJson.results.find(
            r =>
              r.name?.toLowerCase() === decodedName.toLowerCase() ||
              r.original_name?.toLowerCase() === decodedName.toLowerCase()
          ) || searchJson.results[0];
        }
        if (show) {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/tv/${show.id}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=credits,content_ratings,translations`
          );
          if (!detailRes.ok) throw new Error(`HTTP error! status: ${detailRes.status}`);
          const detailJson = await detailRes.json();
          setTmdbData(detailJson);
          
          // Logo için ayrı API çağrısı
          try {
            const imagesRes = await fetch(
              `https://api.themoviedb.org/3/tv/${show.id}/images?api_key=${TMDB_API_KEY}`
            );
            if (imagesRes.ok) {
              const imagesJson = await imagesRes.json();
              const logos = imagesJson.logos || [];
              
              // Öncelik sırası: tr > en > null (dil yok) > herhangi biri
              const turkishLogo = logos.find(logo => logo.iso_639_1 === 'tr');
              const englishLogo = logos.find(logo => logo.iso_639_1 === 'en');
              const nullLogo = logos.find(logo => logo.iso_639_1 === null);
              const anyLogo = logos[0];
              
              const selectedLogo = turkishLogo || englishLogo || nullLogo || anyLogo;
              if (selectedLogo) {
                setSeriesLogo(`https://image.tmdb.org/t/p/w500${selectedLogo.file_path}`);
              }
            }
          } catch (logoError) {
            console.error('Logo fetch error:', logoError);
            setSeriesLogo(null);
          }
          
          const trCertification = detailJson.content_ratings?.results?.find(r => r.iso_3166_1 === 'TR');
          const usCertification = detailJson.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
          setCertification(trCertification?.rating || usCertification?.rating || null);
          const watchRes = await fetch(
            `https://api.themoviedb.org/3/tv/${show.id}/watch/providers?api_key=${TMDB_API_KEY}`
          );
          if (!watchRes.ok) throw new Error(`HTTP error! status: ${watchRes.status}`);
          const watchJson = await watchRes.json();
          setWatchProviders(watchJson.results);
        } else {
          setTmdbData(null);
          setWatchProviders(null);
          setCertification(null);
          setSeriesLogo(null);
        }
      } catch (error) {
        console.error('TMDB fetch error:', error);
        setTmdbData(null);
        setWatchProviders(null);
        setCertification(null);
        setSeriesLogo(null);
      }
      setTmdbLoading(false);
    }
    fetchTmdb();
  }, [seriesName]);

  const getSeasonNumber = useCallback((bolum) => {
    const raw = (bolum?.seasonEpisode || '').toString();
    let m =
      raw.match(/(\d+)\s*\.?\s*sezon/i) ||
      raw.match(/s\s*(\d{1,2})/i) ||
      (bolum?.title || '').toString().match(/(\d+)\s*\.?\s*sezon/i) ||
      (bolum?.title || '').toString().match(/s\s*(\d{1,2})/i);
    return m ? parseInt(m[1], 10) : null;
  }, []);

  const seasons = useMemo(() => {
    const set = new Set();
    episodesList.forEach(b => {
      const sn = getSeasonNumber(b);
      if (sn) set.add(sn);
    });
    const arr = [...set].sort((a, b) => a - b);
    if (arr.length === 0 && (tmdbData?.number_of_seasons ?? 0) > 0) {
      for (let i = 1; i <= tmdbData.number_of_seasons; i++) arr.push(i);
    }
    return arr.length ? arr : [1];
  }, [episodesList, tmdbData?.number_of_seasons, getSeasonNumber]);

  const [selectedSeason, setSelectedSeason] = useState(1);

  useEffect(() => {
    setSelectedSeason(seasons[0] || 1);
  }, [seasons]);

  useEffect(() => {
    if (!tmdbData?.id || !selectedSeason) return;
    let aborted = false;
    async function fetchSeason() {
      try {
        setTmdbSeasonLoading(true);
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${tmdbData.id}/season/${selectedSeason}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=images`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        if (!aborted) setTmdbSeason(json);
      } catch (error) {
        console.error('Season fetch error:', error);
        if (!aborted) setTmdbSeason(null);
      } finally {
        if (!aborted) setTmdbSeasonLoading(false);
      }
    }
    fetchSeason();
    return () => { aborted = true; };
  }, [tmdbData?.id, selectedSeason]);

  const getEpisodeNumber = useCallback((bolum) => {
    const s = ((bolum?.seasonEpisode || '') + ' ' + (bolum?.title || '')).toString();
    let m =
      s.match(/sezon\s*\d+\s*bölüm\s*(\d+)/i) ||
      s.match(/(\d+)\s*\.?\s*sezon\s*(\d+)\s*\.?\s*bölüm/i) ||
      s.match(/s\d+\s*e\s*(\d+)/i) ||
      s.match(/s(\d{1,2})e(\d{1,3})/i) ||
      s.match(/bölüm\s*(\d+)/i) ||
      s.match(/\bep(?:isode)?\s*(\d+)\b/i);
    if (!m) return null;
    const last = m[m.length - 1];
    const n = parseInt(last, 10);
    return Number.isFinite(n) ? n : null;
  }, []);

  const tmdbEpByNumber = useMemo(() => {
    const map = new Map();
    tmdbSeason?.episodes?.forEach(ep => map.set(ep.episode_number, ep));
    return map;
  }, [tmdbSeason]);

  const filteredEpisodes = useMemo(() => {
    if (episodesList.length > 0) {
      const firstSeason = seasons[0] || 1;
      return episodesList.filter(b => {
        const { season } = parseSeasonEpisode(b?.seasonEpisode, b?.title);
        return season ? season === selectedSeason : selectedSeason === firstSeason;
      });
    }
    if (tmdbSeason?.episodes?.length > 0) {
      return tmdbSeason.episodes.map(ep => ({
        title: ep.name || `Bölüm ${ep.episode_number}`,
        seasonEpisode: `${selectedSeason}. Sezon ${ep.episode_number}. Bölüm`,
        logo: ep.still_path ? `https://image.tmdb.org/t/p/w780${ep.still_path}` : null,
        description: ep.overview || '',
        duration: ep.runtime,
        url: null,
        __fromTmdb: true,
        __episodeNumber: ep.episode_number
      }));
    }
    return [];
  }, [episodesList, seasons, selectedSeason, tmdbSeason, parseSeasonEpisode]);

  // Bölüm isimleri ve resimleri TMDB'den çek
  useEffect(() => {
    if (!tmdbData?.id || filteredEpisodes.length === 0) return;
    let aborted = false;

    const fetchEpisodeMeta = async (seasonNum, epNum, retries = 2) => {
      try {
        const url = `https://api.themoviedb.org/3/tv/${tmdbData.id}/season/${seasonNum}/episode/${epNum}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=translations,images`;
        const res = await fetch(url);
        if (!res.ok && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchEpisodeMeta(seasonNum, epNum, retries - 1);
        }
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();

        // İsim: translations önceliği: tr-TR > tr > en-US > en > json.name
        const translations = json?.translations?.translations || [];
        const pickExact = (lang, region) => {
          const t = translations.find(x => x.iso_639_1 === lang && x.iso_3166_1 === region && x?.data?.name);
          return t?.data?.name || null;
        };
        const pickLang = (lang) => {
          const t = translations.find(x => x.iso_639_1 === lang && x?.data?.name);
          return t?.data?.name || null;
        };
        const tName =
          pickExact('tr', 'TR') ||
          pickLang('tr') ||
          pickExact('en', 'US') ||
          pickLang('en') ||
          json?.name ||
          null;

        const name = tName ? stripSeasonEpTokens(tName) : null;

        // Resim: images/stills içinden ilk still veya still_path
        const stillPath = json?.images?.stills?.[0]?.file_path || json?.still_path || null;
        const stillUrl = stillPath ? `https://image.tmdb.org/t/p/w780${stillPath}` : null;

        return { name, stillUrl };
      } catch (error) {
        console.error(`Error fetching meta for S${seasonNum}E${epNum}:`, error);
        return { name: null, stillUrl: null };
      }
    };

    (async () => {
      const nameUpdates = {};
      const stillUpdates = {};

      // Paralel API çağrıları için Promise dizisi
      const promises = filteredEpisodes.map(async (b) => {
        if (aborted) return null;

        const { season: snParsed, episode: epParsed } = parseSeasonEpisode(b?.seasonEpisode, b?.title);
        const seasonKey = snParsed || selectedSeason;
        const epNum = epParsed ?? b?.__episodeNumber ?? null;
        if (!seasonKey || !epNum) return null;

        const key = `${seasonKey}-${epNum}`;
        const tmdbMatch = epNum ? (tmdbSeason?.episodes || []).find(e => e.episode_number === epNum) : null;

        // İsim ve resim cache kontrolü
        const needsFetch = episodeNames[key] === undefined || episodeStills[key] === undefined;

        if (!needsFetch && (b?.logo || tmdbMatch?.still_path)) return null;

        const { name, stillUrl } = await fetchEpisodeMeta(seasonKey, epNum);
        if (aborted) return null;

        // İsim
        const fromPlatform = stripSeasonEpTokens(b?.title || '');
        const fromSeason = stripSeasonEpTokens(tmdbMatch?.name || '');
        const finalName =
          (name && !isGenericEpName(name) && name) ||
          (fromSeason && !isGenericEpName(fromSeason) && fromSeason) ||
          (fromPlatform && !isGenericEpName(fromPlatform) && fromPlatform) ||
          '';

        nameUpdates[key] = finalName;

        // Resim
        if (episodeStills[key] === undefined && !b?.logo) {
          stillUpdates[key] = stillUrl || (tmdbMatch?.still_path ? `https://image.tmdb.org/t/p/w780${tmdbMatch.still_path}` : null);
        }

        return null;
      });

      await Promise.all(promises);

      if (!aborted && Object.keys(nameUpdates).length) {
        setEpisodeNames(prev => ({ ...prev, ...nameUpdates }));
      }
      if (!aborted && Object.keys(stillUpdates).length) {
        setEpisodeStills(prev => ({ ...prev, ...stillUpdates }));
      }
    })();

    return () => { aborted = true; };
  }, [tmdbData?.id, filteredEpisodes, tmdbSeason?.episodes, selectedSeason, episodeNames, episodeStills, parseSeasonEpisode, stripSeasonEpTokens, isGenericEpName]);

  useEffect(() => {
    setFocusedIndex(0);
    setTimeout(() => itemRefs.current[0]?.focus(), 0);
  }, [selectedSeason, filteredEpisodes.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (playerUrl) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handlePlayerClose();
        }
        return;
      }

      // Form alanlarında (select/input/textarea/contenteditable) iken global kısayollar devre dışı
      const ae = document.activeElement;
      const tag = (ae?.tagName || '').toLowerCase();
      const isFormField = tag === 'select' || tag === 'input' || tag === 'textarea' || (ae && ae.isContentEditable);
      if (isFormField) return;

      const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Enter', 'Escape', 'Backspace'];
      if (!allowedKeys.includes(e.key)) return;

      // Sezon değiştirme: Sol/Sağ ve PageUp/PageDown
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        const idx = seasons.findIndex(s => s === selectedSeason);
        if (idx > 0) setSelectedSeason(seasons[idx - 1]);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        const idx = seasons.findIndex(s => s === selectedSeason);
        if (idx >= 0 && idx < seasons.length - 1) setSelectedSeason(seasons[idx + 1]);
        return;
      }

      // Bölüm listesi boşsa sadece geri kısayollarını işle
      const hasEpisodes = filteredEpisodes.length > 0;

      let newIndex = focusedIndex;
      const maxIndex = hasEpisodes ? filteredEpisodes.length - 1 : -1;

      switch (e.key) {
        case 'ArrowUp':
          if (!hasEpisodes) return;
          e.preventDefault();
          newIndex = Math.max(0, focusedIndex - 1);
          break;
        case 'ArrowDown':
          if (!hasEpisodes) return;
          e.preventDefault();
          newIndex = Math.min(maxIndex, focusedIndex + 1);
          break;
        case 'Enter':
          if (!hasEpisodes) return;
          e.preventDefault();
          const selectedEpisode = filteredEpisodes[focusedIndex];
          if (selectedEpisode?.url) handleEpisodeClick(selectedEpisode.url);
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          handleBackClick();
          break;
      }

      if (hasEpisodes && newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        itemRefs.current[newIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, filteredEpisodes, playerUrl, handleBackClick, handleEpisodeClick, handlePlayerClose, seasons, selectedSeason]);

  const runtimeMin = tmdbData?.episode_run_time?.[0];

  // En iyi overview'ü seç
  const seriesOverview = useMemo(() => {
    const direct = tmdbData?.overview?.trim?.();
    if (direct) return direct;
    const translations = tmdbData?.translations?.translations || [];
    const pickExact = (lang, region) => {
      const t = translations.find(x => x.iso_639_1 === lang && x.iso_3166_1 === region && x?.data?.overview);
      return t?.data?.overview?.trim?.();
    };
    const pickLang = (lang) => {
      const t = translations.find(x => x.iso_639_1 === lang && x?.data?.overview);
      return t?.data?.overview?.trim?.();
    };
    return (
      pickExact('tr','TR') ||
      pickLang('tr') ||
      pickExact('en','US') ||
      pickLang('en') ||
      ''
    );
  }, [tmdbData]);

  // US ve TR sertifikalarını yaşa çevir
  const mapCertToAge = useCallback((raw) => {
    const r = (raw || '').toUpperCase().trim();
    // Sayısal (TR formatları: 7+, 13+, 18+ vb.)
    const m = r.match(/(\d{1,2})\s*\+?/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) return n;
    }
    // US TV
    if (r.startsWith('TV-MA')) return 17;
    if (r.startsWith('TV-14')) return 14;
    if (r.startsWith('TV-PG')) return 10;
    if (r.startsWith('TV-Y7')) return 7;
    if (r.startsWith('TV-Y')) return 0;
    // US film
    if (r === 'NC-17') return 18;
    if (r === 'R') return 17;
    if (r === 'PG-13') return 13;
    if (r === 'PG') return 10;
    if (r === 'G') return 0;
    return null;
  }, []);

  // Yaş ve şiddet bayraklarını hesapla
  const ageViolence = useMemo(() => {
    const ratings = tmdbData?.content_ratings?.results || [];
    const tr = ratings.find(x => x.iso_3166_1 === 'TR')?.rating || '';
    const us = ratings.find(x => x.iso_3166_1 === 'US')?.rating || '';
    const raw = tr || us || '';
    let age = mapCertToAge(raw);
    if (age == null && tmdbData?.adult) age = 18;
    const label = (age != null) ? `${age}+` : (raw || '');

    // US TV alt tanımları (D L S V FV) çoğu zaman TMDB'de yer almaz.
    // V/FV içeren bir değer yakalanırsa şiddet işaretle, aksi halde yaş >= 16 ise şiddet rozetini göster.
    const hasViolenceFlag = /\bV\b|\bFV\b/i.test(raw);
    const violent = hasViolenceFlag || (age != null && age >= 16);

    return { age, label, violent };
  }, [tmdbData, mapCertToAge]);

  return (
    <div style={{ 
      background: '#0e0e0e', 
      minHeight: '100vh', 
      color: '#fff', 
      padding: window.innerWidth <= 768 ? '16px' : '32px' 
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'minmax(360px, 520px) 1fr', 
        gap: window.innerWidth <= 768 ? '32px' : '56px' 
      }}>
        <div>
          <button
            onClick={handleBackClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#d8d8d8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: 0,
              marginBottom: window.innerWidth <= 768 ? '20px' : '28px',
              opacity: 0.9,
              fontSize: window.innerWidth <= 768 ? '14px' : '16px'
            }}
          >
            <span>geri için</span>
            <span className="material-icons" style={{ fontSize: window.innerWidth <= 768 ? 16 : 18 }}>arrow_back</span>
            <span>basın</span>
          </button>
          <div
            style={{
              marginBottom: window.innerWidth <= 768 ? '12px' : '18px',
              display: 'flex',
              alignItems: 'center',
              minHeight: window.innerWidth <= 768 ? '60px' : '80px'
            }}
          >
            {seriesLogo ? (
              <img
                src={seriesLogo}
                alt={tmdbData?.name || decodeURIComponent(seriesName || '')}
                style={{
                  height: window.innerWidth <= 768 ? '50px' : '70px',
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.8))'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <div
              style={{
                fontWeight: 900,
                fontSize: window.innerWidth <= 768 ? '36px' : window.innerWidth <= 1024 ? '48px' : '72px',
                letterSpacing: window.innerWidth <= 768 ? '4px' : window.innerWidth <= 1024 ? '8px' : '12px',
                lineHeight: 1,
                textTransform: 'uppercase',
                textShadow: '0 4px 18px #000',
                display: seriesLogo ? 'none' : 'block'
              }}
            >
              {tmdbData?.name || decodeURIComponent(seriesName || '')}
            </div>
          </div>

          {/* Dizi konusu (overview) */}
          {seriesOverview ? (
            <div
              style={{
                opacity: 0.9,
                lineHeight: 1.7,
                marginBottom: window.innerWidth <= 768 ? '16px' : '20px',
                display: '-webkit-box',
                WebkitLineClamp: window.innerWidth <= 768 ? 4 : 6,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: window.innerWidth <= 768 ? '14px' : '16px'
              }}
            >
              {seriesOverview}
            </div>
          ) : null}

          {/* Meta satırı + YAŞ/ŞİDDET rozetleri */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: window.innerWidth <= 768 ? '8px' : '12px', 
            color: '#d0d0d0', 
            marginBottom: window.innerWidth <= 768 ? '24px' : '36px',
            fontSize: window.innerWidth <= 768 ? '13px' : '16px',
            flexWrap: 'wrap'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: '#ff5252', borderRadius: '50%' }} />
              Dizi
            </span>
            <span>• {Math.max(1, (tmdbData?.number_of_seasons || 0) || (seasons?.length || 1))} Sezon</span>

            {/* Yaş rozeti */}
            {ageViolence.label ? (
              <>
                <span>•</span>
                <span
                  title={`Yaş Sınırı: ${ageViolence.label}`}
                  style={{
                    width: window.innerWidth <= 768 ? 24 : 28, 
                    height: window.innerWidth <= 768 ? 24 : 28, 
                    borderRadius: '50%',
                    background: '#efefef', color: '#111',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, 
                    fontSize: window.innerWidth <= 768 ? 10 : 12, 
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)'
                  }}
                >
                  {ageViolence.label}
                </span>
              </>
            ) : null}

            {/* Şiddet rozeti */}
            {ageViolence.violent ? (
              <>
                <span>•</span>
                <span
                  className="material-icons"
                  title="Şiddet Unsurları İçerebilir"
                  style={{
                    width: window.innerWidth <= 768 ? 24 : 28, 
                    height: window.innerWidth <= 768 ? 24 : 28, 
                    borderRadius: '50%',
                    background: '#ff3b3b', color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: window.innerWidth <= 768 ? 16 : 18, 
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                  }}
                >
                  sports_mma
                </span>
              </>
            ) : null}

            {/* IMDb yerine mevcut puan (TMDB) gösteriliyordu, korunuyor */}
            {tmdbData?.vote_average ? (
              <>
                <span>•</span>
                <span
                  style={{
                    background: '#ffd54f',
                    color: '#111',
                    borderRadius: 6,
                    padding: window.innerWidth <= 768 ? '2px 4px' : '2px 6px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: window.innerWidth <= 768 ? '12px' : '14px'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: window.innerWidth <= 768 ? 14 : 16, color: '#111' }}>local_movies</span>
                  {tmdbData.vote_average.toFixed(1)}
                </span>
              </>
            ) : null}
          </div>

          <div style={{ 
            fontWeight: 700, 
            fontSize: window.innerWidth <= 768 ? '16px' : '18px', 
            marginBottom: window.innerWidth <= 768 ? '8px' : '12px' 
          }}>Sezonlar ve Bölümler</div>
          <div style={{ position: 'relative', width: 'fit-content' }}>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: '#3b3b3b',
                color: '#f0f0f0',
                border: 'none',
                borderRadius: '24px',
                padding: window.innerWidth <= 768 ? '10px 40px 10px 16px' : '12px 48px 12px 18px',
                minWidth: window.innerWidth <= 768 ? '140px' : '160px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                fontSize: window.innerWidth <= 768 ? '14px' : '16px'
              }}
            >
              {seasons.map((s) => (
                <option key={s} value={s}>{`Sezon ${s}`}</option>
              ))}
            </select>
            <span
              className="material-icons"
              style={{ 
                position: 'absolute', 
                right: window.innerWidth <= 768 ? 10 : 12, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none', 
                color: '#cfcfcf',
                fontSize: window.innerWidth <= 768 ? 18 : 20
              }}
            >
              expand_more
            </span>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: window.innerWidth <= 768 ? '16px' : '20px', 
          maxHeight: window.innerWidth <= 768 ? 'none' : 'calc(100vh - 120px)', 
          overflowY: window.innerWidth <= 768 ? 'visible' : 'auto', 
          paddingRight: window.innerWidth <= 768 ? '0' : '8px' 
        }}>
          {tmdbSeasonLoading && filteredEpisodes.length === 0 ? (
            <div style={{ opacity: 0.8, fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}>Bölümler yükleniyor…</div>
          ) : null}
          {filteredEpisodes.map((bolum, i) => {
            const { season: snParsed, episode: epParsed } = parseSeasonEpisode(bolum?.seasonEpisode, bolum?.title);
            const seasonForTitle = snParsed || selectedSeason;
            const epNumber = epParsed ?? bolum?.__episodeNumber ?? null;
            const tmdbMatch = epNumber ? tmdbEpByNumber.get(epNumber) : null;

            const cleanedFromBolum = stripSeasonEpTokens(bolum?.title || '');
            const cleanedFromTmdb = stripSeasonEpTokens(tmdbMatch?.name || '');
            const nameFromCache = epNumber ? episodeNames[`${seasonForTitle}-${epNumber}`] : '';
            const epName =
              (nameFromCache && !isGenericEpName(nameFromCache) && nameFromCache) ||
              (cleanedFromTmdb && !isGenericEpName(cleanedFromTmdb) && cleanedFromTmdb) ||
              (cleanedFromBolum && !isGenericEpName(cleanedFromBolum) && cleanedFromBolum) ||
              '';
            const displayTitle = `${formatSeasonEpTr(seasonForTitle, epNumber)}${epName ? ' - ' + epName : ''}`;

            const desc =
              bolum?.description ||
              bolum?.desc ||
              tmdbMatch?.overview ||
              (tmdbData?.overview ? `${tmdbData.overview.slice(0, 200)}${tmdbData.overview.length > 200 ? '…' : ''}` : '');
            const duration =
              bolum?.duration ||
              bolum?.length ||
              tmdbMatch?.runtime ||
              (tmdbData?.episode_run_time?.[0]);
            const progress = Math.max(0, Math.min(100, Number(bolum?.progress ?? bolum?.percent ?? bolum?.resume ?? 0)));
            const focused = focusedIndex === i;
            const clickable = Boolean(bolum?.url);

            return (
              <div
                key={`${selectedSeason}-${i}`}
                ref={(el) => (itemRefs.current[i] = el)}
                tabIndex={0}
                onClick={() => clickable && handleEpisodeClick(bolum.url)}
                style={{
                  background: focused ? 'rgba(255, 59, 59, 0.1)' : '#1a1a1a',
                  border: focused ? '2px solid #ff3b3b' : '2px solid transparent',
                  borderRadius: '12px',
                  padding: window.innerWidth <= 768 ? '16px' : '20px',
                  cursor: clickable ? 'pointer' : 'default',
                  outline: 'none',
                  opacity: clickable ? 1 : 0.8,
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: window.innerWidth <= 768 ? '8px' : '10px' }}>
                  <div style={{ 
                    fontWeight: 800, 
                    fontSize: window.innerWidth <= 768 ? '18px' : '22px',
                    lineHeight: 1.3,
                    color: '#fff'
                  }}>{displayTitle}</div>
                  
                  {desc ? (
                    <div
                      style={{
                        opacity: 0.85,
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: window.innerWidth <= 768 ? 3 : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                        color: '#d0d0d0'
                      }}
                    >
                      {desc}
                    </div>
                  ) : null}
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: window.innerWidth <= 768 ? 12 : 16, 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    fontSize: window.innerWidth <= 768 ? '13px' : '14px',
                    color: '#a0a0a0'
                  }}>
                    {duration ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-icons" style={{ fontSize: 16 }}>schedule</span>
                        {duration} dakika
                      </span>
                    ) : null}
                    
                    {!clickable && (
                      <span style={{ 
                        background: '#333', 
                        color: '#999',
                        padding: '4px 10px', 
                        borderRadius: '16px',
                        fontSize: window.innerWidth <= 768 ? 11 : 12,
                        fontWeight: 600
                      }}>
                        Kaynak yok
                      </span>
                    )}
                    
                    {clickable && (
                      <span style={{ 
                        background: 'rgba(255, 59, 59, 0.15)', 
                        color: '#ff3b3b',
                        padding: '4px 10px', 
                        borderRadius: '16px',
                        fontSize: window.innerWidth <= 768 ? 11 : 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span className="material-icons" style={{ fontSize: 14 }}>play_circle</span>
                        İzle
                      </span>
                    )}
                  </div>
                  
                  {progress > 0 && (
                    <div style={{ 
                      marginTop: '8px',
                      height: '4px', 
                      background: '#333', 
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${progress}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #ff3b3b, #ff6b6b)', 
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {!tmdbSeasonLoading && filteredEpisodes.length === 0 && (
            <div style={{ opacity: 0.8, fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}>Bu sezon için bölüm bulunamadı.</div>
          )}
        </div>
      </div>
      {playerUrl && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button
            onClick={handlePlayerClose}
            style={{
              position: 'absolute',
              top: window.innerWidth <= 768 ? 16 : 24,
              right: window.innerWidth <= 768 ? 16 : 24,
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              padding: window.innerWidth <= 768 ? '10px' : '12px',
              cursor: 'pointer',
              zIndex: 1003,
              minHeight: window.innerWidth <= 768 ? '44px' : 'auto',
              minWidth: window.innerWidth <= 768 ? '44px' : 'auto'
            }}
          >
            <span className="material-icons" style={{ fontSize: window.innerWidth <= 768 ? 20 : 24 }}>close</span>
          </button>
          <SimpleHlsPlayer url={playerUrl} />
        </div>
      )}
    </div>
  );
}