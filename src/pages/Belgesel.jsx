import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import AppHeader from '../components/AppHeader';
import SimpleHlsPlayer from '../components/SimpleHlsPlayer';
import axios from 'axios';
import PlatformSeriesDetail from '../components/PlatformSeriesDetail';

const Belgesel = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');
  const [now, setNow] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState(null);
  const [hovered, setHovered] = useState(null);
  // M3U'dan gelen kategoriler
  const [documentaryCategories, setDocumentaryCategories] = useState([]);
  // TMDB posterler için cache
  const [tmdbPosters, setTmdbPosters] = useState({});
  // Player state
  const [currentVideo, setCurrentVideo] = useState(null);

  // TLC ve DMAX M3U dosyaları
  const m3uUrls = [
    'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/TLC/TLC.m3u',
    'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/DMAX/DMAX.m3u'
  ];

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#121212' : '#fff';
  }, [theme]);

  function handleThemeToggle() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  // İlk yüklemede ilk kartı seç
  useEffect(() => {
    if (selectedCard === null) {
      setSelectedCard(0);
    }
  }, [selectedCard]);

  // Türkçe uyumlu normalize (filmSections'tan ÖNCE)
  const normalize = (s) =>
    (s || '')
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/\s+filmleri?/g, '') // "filmleri" veya "filmler" kaldır
      .replace(/\s+/g, ' ')
      .trim();

  // Program kategorileri mapping - her programın hangi kategoride gösterileceğini tanımlar
  const programCategoryMapping = {
    "ADAM SAVAGE İLE ÇILGIN TASARIMLAR": "Bilim & Teknoloji",
    "AĞAÇ EV EKİBİ": "Yaşam & Tasarım",
    "51. BÖLGEYE AKIN": "Gizem & Uzay",
    "100 GÜNDE RÜYA EV": "Yaşam & Tasarım",
    "100 GÜNDE YENİ OTEL": "Yaşam & Tasarım",
    "1980'LER: EN ÖLÜMCÜL ON YIL": "Tarih & Belgesel",
    "90 GÜN ÖNCESİ": "Yaşam & İlişkiler",
    "90 DAY FIANCÉ": "Yaşam & İlişkiler",
    "1 TONLUK AİLE": "Yaşam & Sağlık",
    "ALASKA'NIN EN İYİ ODUNCU": "Doğa & Survival",
    "AMERİKA'NIN EN İYİ ODUNCU": "Doğa & Survival",
    "ARABALARI KARLA KURTARMA": "Aksiyon & Macera",
    "ARABALARI KURTARMA": "Teknik & Tamir",
    "BALİK AVCISI JACK": "Doğa & Balıkçılık",
    "BENIM GARIP BAĞIMLILIĞIM": "Yaşam & Psikoloji",
    "BİR ZAMANLAR KURTARMA": "Teknik & Tamir",
    "DAĞIN KRALINDA BİR GÜN": "Doğa & Yaşam",
    "DİYET DOKTORU": "Yaşam & Sağlık",
    "EFSANE MOTORLAR": "Teknik & Araçlar",
    "EXTREM MAKİNELER": "Teknik & Mühendislik",
    "GOLD RUSH": "Macera & Kazı",
    "ICE ROAD TRUCKERS": "Aksiyon & Taşımacılık",
    "IMPOSSIBLE ENGINEERING": "Bilim & Teknoloji",
    "MY 600-LB LIFE": "Yaşam & Sağlık",
    "NAKED AND AFRAID": "Doğa & Survival",
    "SAY YES TO THE DRESS": "Moda & Yaşam",
    "TREEHOUSE MASTERS": "Yaşam & Tasarım",
    "UÇAK KAZALARI": "Tarih & Araştırma"
  };

  // Otomatik genre parsing sözlüğü
  const GENRES = {
    "Aile & İlişkiler": [
      "ask", "iliski", "aile", "gelin", "damat", "evlilik", "dugun", "nisanli", "gelinlik",
      "cocuk", "bebek", "hamile", "dogum", "es", "sevgili", "kayinvalid", "90 gun", "90 day",
      "fiancé", "single life", "family", "love", "relationship"
    ],
    "Sağlık & Medikal": [
      "doktor", "ameliyat", "klinik", "hastane", "hasta", "kilo", "obez", "dermatoloji",
      "dis", "disci", "estetik", "cilt", "psikoloji", "terapi", "600", "lb", "diyet",
      "tonluk", "600-lb", "my 600", "health", "medical", "doctor"
    ],
    "Yemek & Mutfak": [
      "yemek", "mutfak", "tarif", "sef", "tatli", "pastaci", "barbeku", "burger", "izgara", 
      "firin", "chef", "cooking", "kitchen", "food", "restaurant"
    ],
    "Emlak & Ev Yenileme": [
      "ev", "yenileme", "tadilat", "tasarim", "dekor", "emlak", "ev av", "buyuk tadilat", 
      "restorasyon", "marangoz", "atolye", "usta", "donusum", "ahsap", "ic mimari", 
      "ruya ev", "otel", "home", "house", "renovation", "design", "makeover"
    ],
    "Otomotiv": [
      "araba", "automobil", "otomobil", "modifiye", "tamir", "garaj", "motor", "kamyon", 
      "cekici", "kurtarma", "yaris", "drift", "traktor", "offroad", "karavan", 
      "efsane motorlar", "car", "auto", "vehicle", "garage", "racing"
    ],
    "Yapı & Zanaat": [
      "agac ev", "ağaç ev", "yapi", "insaat", "usta", "atolye", "ustalar", "ahsap", "el isi",
      "tree house", "treehouse", "marangoz", "cilgin tasarimlar", "savage", "building",
      "construction", "craft", "workshop"
    ],
    "Doğa & Hayatta Kalma": [
      "hayatta kal", "survival", "vahsi", "orman", "yaban", "kamp", "av", "olta", "balik", 
      "balikcilik", "nehir", "deniz", "okyanus", "naked", "afraid", "alaska", "oduncu", 
      "dagın kral", "wild", "wilderness", "fishing", "hunting", "nature"
    ],
    "Gizem & Uzay": [
      "51. bolge", "51. bölge", "uzayli", "ufo", "gizem", "esrarengiz", "paranormal", 
      "dosya", "akin", "area 51", "alien", "mystery", "x-files", "supernatural"
    ],
    "Tarih & Koleksiyon": [
      "antika", "koleksiyon", "muzayede", "hurda", "hazine", "define", "eski", "kulustur", 
      "1980", "tarih", "history", "vintage", "antique", "collection", "historical"
    ],
    "Suç & Adli": [
      "suc", "cinayet", "adli", "sorusturma", "dedektif", "kacak", "iz surme", "delil", 
      "olumcul", "crime", "murder", "investigation", "detective", "forensic", "deadly"
    ],
    "Yarışma & Reality": [
      "yarisma", "challenge", "rekabet", "takim", "ekip", "eleme", "buyuk yaris", "reality",
      "competition", "contest", "game", "show", "challenge"
    ],
    "Mühendislik & Teknoloji": [
      "muhendislik", "teknoloji", "makine", "extrem", "impossible", "engineering", "savage",
      "technology", "tech", "science", "innovation", "mechanical"
    ],
    "Moda & Yaşam": [
      "moda", "elbise", "dress", "gelinlik", "stil", "yasam", "garip", "bagimlili",
      "fashion", "style", "lifestyle", "clothing", "wedding dress", "addiction"
    ],
    "Ulaşım & Lojistik": [
      "ice road", "truckers", "tasimacilık", "yol", "karla", "transport", "logistics",
      "shipping", "delivery", "highway", "road"
    ],
    "Madencilik & Kazı": [
      "gold", "rush", "altin", "maden", "kazi", "mining", "digging", "treasure", "gold rush"
    ]
  };

  // Program adından kategori bulan fonksiyon (otomatik parsing ile)
  const getProgramCategory = (title) => {
    // Önce manuel mapping'e bak
    const exactMatch = programCategoryMapping[title.toUpperCase()];
    if (exactMatch) return exactMatch;

    const mainProgram = title.split(' - ')[0].trim().toUpperCase();
    const programMatch = programCategoryMapping[mainProgram];
    if (programMatch) return programMatch;

    // Manuel mapping'de bulunamazsa otomatik genre parsing yap
    const normalizedTitle = normalize(title.toLowerCase());
    
    // Her genre için kontrol et
    for (const [genreName, keywords] of Object.entries(GENRES)) {
      for (const keyword of keywords) {
        const normalizedKeyword = normalize(keyword.toLowerCase());
        
        // Tam kelime eşleşmesi veya program adının içinde geçmesi
        if (normalizedTitle.includes(normalizedKeyword) || 
            normalizedKeyword.split(' ').every(word => normalizedTitle.includes(word))) {
          console.log(`"${title}" -> "${genreName}" (anahtar: "${keyword}")`); // Debug
          return genreName;
        }
      }
    }

    // Hiçbir kategoriye uymuyorsa "Diğer" döndür
    console.log(`"${title}" -> "Diğer" (kategori bulunamadı)`); // Debug
    return "Diğer";
  };

  // Hedef kategoriler - otomatik genre parsing ile genişletilmiş
  const targetCategories = [
    "Aile & İlişkiler",
    "Sağlık & Medikal", 
    "Yemek & Mutfak",
    "Emlak & Ev Yenileme",
    "Otomotiv",
    "Yapı & Zanaat",
    "Doğa & Hayatta Kalma",
    "Gizem & Uzay",
    "Tarih & Koleksiyon",
    "Suç & Adli",
    "Yarışma & Reality",
    "Mühendislik & Teknoloji",
    "Moda & Yaşam",
    "Ulaşım & Lojistik",
    "Madencilik & Kazı",
    "Diğer"
  ];

  // documentarySections'ı kategori eşlemelerine göre oluştur
  const documentarySections = useMemo(() => {
    console.log('documentaryCategories:', documentaryCategories); // Debug
    
    if (!documentaryCategories.length) {
      return [];
    }
    
    // Tüm içerikleri kategorilere göre grupla
    const categoryGroups = {};
    
    // Her kategoriye boş array ata
    targetCategories.forEach(cat => {
      categoryGroups[cat] = [];
    });
    
    // Programları grupla (bölüm bazında değil program bazında)
    const programMap = {};
    
    // M3U'dan gelen tüm içerikleri önce programa göre grupla
    documentaryCategories.forEach(category => {
      category.items.forEach(item => {
        const mainProgram = item.title.split(' - ')[0].trim();
        const targetCategory = getProgramCategory(item.title);
        
        if (!programMap[mainProgram]) {
          programMap[mainProgram] = {
            title: mainProgram,
            logo: item.logo,
            url: item.url, // İlk bölümün URL'i
            category: targetCategory,
            episodes: []
          };
        }
        
        // Bu programa ait bölümleri ekle
        programMap[mainProgram].episodes.push(item);
      });
    });
    
    // Her programdan sadece bir tane al ve kategorilere dağıt
    Object.values(programMap).forEach(program => {
      const targetCategory = program.category;
      if (categoryGroups[targetCategory]) {
        categoryGroups[targetCategory].push({
          title: program.title,
          logo: program.logo,
          url: program.url,
          episodeCount: program.episodes.length,
          isProgram: true // Program olduğunu belirtmek için flag
        });
      }
    });
    
    // Boş olmayan kategorileri döndür, her kategoriden maksimum 12 program
    return targetCategories
      .filter(cat => categoryGroups[cat].length > 0)
      .map(cat => ({
        title: cat,
        items: categoryGroups[cat].slice(0, 20) // Her kategoriden maksimum 20 program
      }));
  }, [documentaryCategories]);

  // Trend belgeseller - her kategoriden ilk belgesel (yeni kategorilere göre)
  const trendDocumentaries = useMemo(() => {
    if (!documentarySections.length) return [];
    
    return documentarySections
      .filter(category => category.items && category.items.length > 0)
      .slice(0, 12) // İlk 12 kategoriden
      .map(category => category.items[0])
      .filter(Boolean);
  }, [documentarySections]);

  // Global indeks ofsetleri: sadece trendler + sabit kategori slider'ları toplamı
  const documentaryCardCount = documentarySections.reduce((acc, s) => acc + s.items.length, 0);

  // documentarySections uzunluklarına dayalı stabil imza (klavye deps için)
  const sectionsSignature = useMemo(
    () => documentarySections.map(s => s.items?.length || 0).join(','),
    [documentarySections]
  );

  // Toplam kart değişince seçili indeksi aralıkta tut
  useEffect(() => {
    const total = trendDocumentaries.length + documentaryCardCount;
    if (total <= 0) return;
    setSelectedCard(prev => {
      const idx = prev ?? 0;
      return Math.min(Math.max(idx, 0), total - 1);
    });
  }, [trendDocumentaries.length, documentaryCardCount]);

  // Kumanda desteği için klavye olaylarını dinle
  useEffect(() => {
    const handleKeyDown = (e) => {
      const cards = document.querySelectorAll('.card');
      if (!cards.length) return;

      let currentIndex = selectedCard !== null ? selectedCard : 0;

      // Bölümleri DOM sırasına göre kur: Trend Belgeseller -> Kategoriler
      const sections = [];
      let cursor = 0;

      if (trendDocumentaries.length > 0) {
        sections.push({ name: 'Trend Belgeseller', start: cursor, count: trendDocumentaries.length });
        cursor += trendDocumentaries.length;
      }
      documentarySections.forEach(sec => {
        const len = sec.items?.length || 0;
        if (len > 0) {
          sections.push({ name: sec.title, start: cursor, count: len });
          cursor += len;
        }
      });

      if (!sections.length) return;

      let secIdx = sections.findIndex(s => currentIndex >= s.start && currentIndex < s.start + s.count);
      if (secIdx === -1) {
        secIdx = 0;
        currentIndex = sections[0].start;
      }
      const posInSection = currentIndex - sections[secIdx].start;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, cards.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown': {
          e.preventDefault();
          if (secIdx < sections.length - 1) {
            const next = sections[secIdx + 1];
            const targetOffset = Math.min(posInSection, next.count - 1);
            currentIndex = next.start + targetOffset;
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (secIdx > 0) {
            const prev = sections[secIdx - 1];
            const targetOffset = Math.min(posInSection, prev.count - 1);
            currentIndex = prev.start + targetOffset;
          }
          break;
        }
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (cards[currentIndex]) {
            const card = cards[currentIndex];
            const url = card.getAttribute('data-url');
            const path = card.getAttribute('data-path');
            const title = card.getAttribute('aria-label');
            
            if (url && title) {
              // Film kartı ise direkt oynat
              setCurrentVideo({
                url: url,
                title: title,
                poster: null
              });
            } else if (url && /^https?:\/\//i.test(url)) {
              window.open(url, '_blank', 'noopener');
            } else if (path) {
              navigate(path);
            }
          }
          return;
        default:
          return;
      }

      currentIndex = Math.min(Math.max(currentIndex, 0), cards.length - 1);
      setSelectedCard(currentIndex);

      const el = cards[currentIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        if (typeof el.focus === 'function') el.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    navigate,
    selectedCard,
    trendDocumentaries.length,
    documentaryCardCount,
    sectionsSignature
  ]);

  // M3U parse helper (CategoryDetail.jsx'ten alınan çalışan versiyon)
  const buildCategoriesFromM3U = (text) => {
    const lines = text.split('\n');
    const groupMap = {};
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF')) {
        // Parse EXTINF line
        const match = line.match(/group-title="([^"]*)".*?,(.*)$/);
        if (match) {
          const groupTitle = match[1];
          const title = match[2];
          
          // Logo URL'sini bul
          const logoMatch = line.match(/tvg-logo="([^"]*)"/);
          const logo = logoMatch ? logoMatch[1] : '';
          
          currentItem = {
            title: title.trim(),
            logo: logo,
            group: groupTitle.trim()
          };
        }
      } else if (line && !line.startsWith('#') && currentItem) {
        // URL line
        const url = line.trim();
        const group = currentItem.group || 'Diğer';
        
        if (!groupMap[group]) {
          groupMap[group] = [];
        }
        
        groupMap[group].push({
          title: currentItem.title,
          logo: currentItem.logo,
          url: url
        });
        
        currentItem = null;
      }
    }

    return Object.entries(groupMap).map(([title, items]) => ({
      title,
      items // .slice(0, 12) kaldırıldı
    }));
  };

  // M3U'dan belgeselleri çek (birden fazla M3U dosyasını birleştir)
  useEffect(() => {
    let cancelled = false;
    
    const fetchAllM3Us = async () => {
      try {
        const allCategories = [];
        
        // Her M3U dosyasını sırayla çek
        for (const m3uUrl of m3uUrls) {
          try {
            const res = await axios.get(m3uUrl, { responseType: 'text' });
            const parsed = buildCategoriesFromM3U(res.data);
            allCategories.push(...parsed);
          } catch (error) {
            console.warn(`M3U dosyası yüklenemedi: ${m3uUrl}`, error);
          }
        }
        
        if (!cancelled) {
          console.log('Parse edilen tüm kategoriler:', allCategories); // Debug
          setDocumentaryCategories(allCategories);
        }
      } catch (error) {
        console.error('M3U dosyaları yüklenirken hata:', error);
        if (!cancelled) setDocumentaryCategories([]);
      }
    };
    
    fetchAllM3Us();
    return () => { cancelled = true; };
  }, []);

  // TMDB'den poster çekme fonksiyonu
  const fetchTMDBPoster = async (title) => {
    const apiKey = import.meta.env.VITE_TMDB_API_KEY;
    if (!apiKey || tmdbPosters[title]) return tmdbPosters[title];
    
    try {
      // Film adını temizle
      const cleanTitle = title
        .replace(/\s+\(.*?\)/g, '') // (2023) gibi yıl bilgilerini kaldır
        .replace(/\s+\d{4}$/g, '') // Son yıl bilgisini kaldır
        .trim();
      
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(cleanTitle)}`
      );
      
      if (response.data.results && response.data.results.length > 0) {
        const posterPath = response.data.results[0].poster_path;
        if (posterPath) {
          const posterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
          setTmdbPosters(prev => ({ ...prev, [title]: posterUrl }));
          return posterUrl;
        }
      }
    } catch (error) {
      console.warn(`TMDB poster bulunamadı: ${title}`);
    }
    
    setTmdbPosters(prev => ({ ...prev, [title]: null }));
    return null;
  };

  // Film kartı render edildiğinde TMDB poster'ını yükle
  useEffect(() => {
    documentarySections.forEach(category => {
      category.items.forEach(item => {
        if (!tmdbPosters[item.title] && tmdbPosters[item.title] !== null) {
          // Dizi bölümlerinden ana program adını çıkar
          const mainTitle = item.title.split(' - ')[0].trim();
          fetchTMDBPoster(mainTitle);
        }
      });
    });
  }, [documentarySections]);

  // Fare ile sürükleyerek yatay kaydırma (draggable scroll)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.draggable-scroll'));
    const cleanups = els.map(el => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let moved = false;

      const onMouseDown = (e) => {
        isDown = true;
        moved = false;
        el.dataset.dragging = 'false';
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
        el.style.cursor = 'grabbing';
      };
      const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = x - startX;
        if (Math.abs(walk) > 5 && !moved) {
          moved = true;
          el.dataset.dragging = 'true';
        }
        el.scrollLeft = scrollLeft - walk;
      };
      const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        // click hemen sonra geldiğinde dragging=true kalsın, kısa süre sonra sıfırla
        setTimeout(() => { el.dataset.dragging = 'false'; }, 50);
        el.style.cursor = 'grab';
      };

      el.style.cursor = 'grab';
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mousemove', onMouseMove);
      el.addEventListener('mouseup', endDrag);
      el.addEventListener('mouseleave', endDrag);

      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mousemove', onMouseMove);
        el.removeEventListener('mouseup', endDrag);
        el.removeEventListener('mouseleave', endDrag);
      };
    });

    return () => cleanups.forEach(fn => fn && fn());
  }, [documentarySections]);

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'dark' ? '#121212' : '#fff',
      color: theme === 'dark' ? '#fff' : '#333',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflowX: 'hidden'
    }}>
      <AppHeader active="documentaries" />

      {/* Trend Belgeseller */}
      {trendDocumentaries.length > 0 && (
        <div style={{
          width: '100%',
          margin: '0 auto 24px auto',
          padding: '0 20px'
        }}>
          <h2 style={{
            color: theme === 'dark' ? '#fff' : '#333',
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 16,
            marginLeft: 10
          }}>
            Trend Belgeseller
          </h2>

          <div
            className="draggable-scroll"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 16,
              WebkitOverflowScrolling: 'touch',
              cursor: 'grab'
            }}
          >
            {trendDocumentaries.map((item, i) => {
              const globalIndex = i;
              const isActive = hovered === globalIndex || selectedCard === globalIndex;
              const tmdbPoster = tmdbPosters[item.title];
              const posterToUse = tmdbPoster || item.logo;
              const rankNumber = i + 1;
              const isDoubleDigit = rankNumber >= 10;

              return (
                <div
                  key={`trend-${item.url}-${i}`}
                  tabIndex={-1}
                  className="card"
                  data-url={item.url}
                  style={{
                    flex: isDoubleDigit ? '0 0 280px' : '0 0 220px',
                    minWidth: isDoubleDigit ? 280 : 220,
                    maxWidth: isDoubleDigit ? 320 : 250,
                    position: 'relative',
                    borderRadius: 16,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    zIndex: isActive ? 2 : 1,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 'auto'
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHovered(globalIndex)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => {}}
                  onBlur={() => {}}
                  onClick={(e) => {
                    const scroller = e.currentTarget.closest('.draggable-scroll');
                    if (scroller && scroller.dataset.dragging === 'true') return;
                    // Trend belgesellerini direkt oynat
                    setCurrentVideo({
                      url: item.url,
                      title: item.title,
                      poster: posterToUse
                    });
                  }}
                >
                  {/* Büyük numara - sol tarafta, posterin arkasında kalacak */}
                  <div style={{
                    fontSize: isDoubleDigit ? 120 : 160,
                    fontWeight: 900,
                    color: isActive ? '#dc2626' : (theme === 'dark' ? '#374151' : '#9ca3af'),
                    lineHeight: isDoubleDigit ? 0.9 : 0.8, // 10 için daha geniş satır aralığı
                    textShadow: isActive ? '0 4px 8px rgba(220, 38, 38, 0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
                    userSelect: 'none',
                    width: isDoubleDigit ? 140 : 100,
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    WebkitTextStroke: isActive ? '2px #dc2626' : (theme === 'dark' ? '1px #374151' : '1px #9ca3af'),
                    WebkitTextFillColor: 'transparent',
                    zIndex: 1,
                    marginRight: isDoubleDigit ? -60 : -50,
                    display: 'flex',
                    flexDirection: isDoubleDigit ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isDoubleDigit ? '1px' : '0' // 10 için rakamlar arasında boşluk
                  }}>
                    {isDoubleDigit ? (
                      <>
                        <span style={{ display: 'block', margin: 0 }}>1</span>
                        <span style={{ display: 'block', margin: 0 }}>0</span>
                      </>
                    ) : (
                      rankNumber
                    )}
                  </div>

                  {/* Poster alanı - sağ tarafta, rakamın üstünde */}
                  <div style={{
                    position: 'relative',
                    width: 160,
                    aspectRatio: '2/3',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: theme === 'dark' ? '#23272f' : '#f3f4f6',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 8px 25px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    zIndex: 2, // Rakamın üstünde
                    border: isActive ? '2px solid #dc2626' : '2px solid transparent' // Sadece aktif durumda kırmızı
                  }}>
                    {/* Görsel */}
                    {posterToUse ? (
                      <img
                        src={posterToUse}
                        alt={item.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 10, // Border kalınlığı kadar azalt
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #0f172a 0%, #111827 50%, #1f2937 100%)'
                            : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #cbd5e1 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10 // Border kalınlığı kadar azalt
                        }}
                      >
                        <div style={{
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: 'center',
                          padding: '8px',
                          lineHeight: 1.2
                        }}>
                          {item.title}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kategorize edilmiş belgesel programları */}
      {documentarySections.map((cat, cIdx) => {
        // Sadece Trend Belgeseller offset
        const baseOffset = trendDocumentaries.length;
        const itemsBefore = documentarySections.slice(0, cIdx).reduce((a, c) => a + c.items.length, 0);
        return (
          <div key={cat.title} style={{ width: '100%', margin: '0 auto 28px auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, paddingLeft: 10 }}>
              <h2 style={{
                color: theme === 'dark' ? '#fff' : '#333',
                fontSize: 22,
                fontWeight: 700,
                margin: 0
              }}>
                {cat.title}
              </h2>
              <span style={{
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                {cat.items.length} program
              </span>
            </div>

            <div
              className="draggable-scroll"
              style={{
                display: 'flex',
                gap: 20,
                overflowX: 'auto',
                paddingBottom: 16,
                WebkitOverflowScrolling: 'touch',
                cursor: 'grab'
              }}
            >
              {cat.items.map((item, i) => {
                const globalIndex = baseOffset + itemsBefore + i;
                // Dizi bölümlerinden ana program adını çıkar TMDB için
                const mainTitle = item.title.split(' - ')[0].trim();
                const tmdbPoster = tmdbPosters[mainTitle];
                const posterToUse = tmdbPoster || item.logo;
                
                return (
                  <div
                    key={`${item.title}-${i}`}
                    tabIndex={-1}
                    className="card"
                    aria-label={item.title}
                    data-path="/belgesel"
                    style={{
                      flex: '0 0 200px',
                      minWidth: 200,
                      maxWidth: 220,
                      aspectRatio: '2/3',
                      position: 'relative',
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: theme === 'dark' ? '#23272f' : '#f3f4f6',
                      border: 'none',
                      outline: selectedCard === globalIndex ? '2.5px solid #ffffffff' : 'none',
                      cursor: 'pointer',
                      transition: 'outline 0.18s',
                      zIndex: hovered === globalIndex || selectedCard === globalIndex ? 2 : 1,
                      backgroundClip: 'padding-box'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHovered(globalIndex)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      const scroller = e.currentTarget.closest('.draggable-scroll');
                      if (scroller && scroller.dataset.dragging === 'true') return;
                      // Tüm bölümleri bul
                      const mainTitle = item.title.split(' - ')[0].trim();
                      // documentaryCategories içinden ilgili programın tüm bölümlerini bul
                      let allEpisodes = [];
                      documentaryCategories.forEach(category => {
                        category.items.forEach(it => {
                          if (it.title.split(' - ')[0].trim() === mainTitle) {
                            allEpisodes.push({
                              title: it.title,
                              logo: it.logo,
                              url: it.url
                            });
                          }
                        });
                      });
                      // Belgesel detay sayfasına git
                      navigate('/belgesel/' + encodeURIComponent(mainTitle), {
                        state: {
                          platform: cat.title,
                          episodes: allEpisodes,
                          title: mainTitle
                        }
                      });
                    }}
                  >
                    {posterToUse ? (
                      <img
                        src={posterToUse}
                        alt={item.title}
                        loading="lazy"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: 16 
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 16,
                          background: theme === 'dark'
                            ? 'linear-gradient(135deg, #0f172a 0%, #111827 50%, #1f2937 100%)'
                            : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #cbd5e1 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <div style={{
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: 'center',
                          padding: '16px',
                          lineHeight: 1.3
                        }}>
                          {item.title}
                        </div>
                      </div>
                    )}
                    
                    {/* Bölüm sayısı badge'i */}
                    {item.episodeCount && (
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: 12,
                        backdropFilter: 'blur(4px)'
                      }}>
                        {item.episodeCount} bölüm
                      </div>
                    )}
                    
                    {(hovered === globalIndex || selectedCard === globalIndex) && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: 16,
                        border: '2.5px solid #fff',
                        boxSizing: 'border-box',
                        pointerEvents: 'none'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Player Modal */}
      {currentVideo && (
        <SimpleHlsPlayer
          url={currentVideo.url}
          title={currentVideo.title}
          poster={currentVideo.poster}
          onClose={() => setCurrentVideo(null)}
        />
      )}

      {/* ...existing code... footer vb. */}
    </div>
  );
};

export default Belgesel;