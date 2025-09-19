import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";

// Sürekli değişecek gradyan video havuzu
const GRADIENT_VIDEOS = [
  "/platformlar/logo/video/gradyan 1.mp4",
  "/platformlar/logo/video/gradyan 2.mp4",
  "/platformlar/logo/video/gradyan 3.mp4",
  "/platformlar/logo/video/gradyan 4.mp4",
  "/platformlar/logo/video/gradyan 5.mp4",
  "/platformlar/logo/video/gradyan 6.mp4",
];

// Ek: statik gradyan paleti (video yüklenene kadar / fallback)
const GRADIENT_COLOR_SETS = [
  ["#931A1A", "#2A0000"],
  ["#3E4254", "#181A20"],
  ["#2C2C2C", "#101010"],
  ["#5E4F2F", "#1C140A"],
  ["#1F3437", "#0A1415"],
  ["#16212F", "#080C14"],
  ["#311E32", "#120812"],
  ["#2E1A12", "#0F0705"],
];

export const CATEGORIES_DATA = [
  { name: "Aile", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Aksiyon", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Animasyon", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Belgeseller", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Bilim Kurgu", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Blu Ray", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Çizgi", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Dram", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Fantastik", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Gerilim", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Gizem", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Hint", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Komedi", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Korku", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Macera", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Müzikal", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Polisiye", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Psikolojik", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Romantik", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Savaş", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Suç", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Tarih", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Western", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
  { name: "Yerli", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/denemefilm.m3u" },
];

export const slugify = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const calcColumns = (width) => {
  if (width < 600) return 2;
  if (width < 900) return 3;
  if (width < 1400) return 4;
  return 5;
};

const pickRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

export default function CategoryShowcase() {
  const [hovered, setHovered] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [categoryVideos, setCategoryVideos] = useState([]);
  const [categoryGradients, setCategoryGradients] = useState([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const columns = useMemo(() => calcColumns(windowWidth), [windowWidth]);

  const handleCategoryClick = useCallback((name) => {
    const category = CATEGORIES_DATA.find((c) => c.name === name);
    navigate(`/kategoriler/${slugify(name)}`, { state: { category } });
  }, [navigate]);

  useEffect(() => {
    setCategoryVideos(CATEGORIES_DATA.map(() => pickRandomItem(GRADIENT_VIDEOS)));
    setCategoryGradients(CATEGORIES_DATA.map(() => pickRandomItem(GRADIENT_COLOR_SETS)));
  }, []);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target.querySelector("video");
          if (video) {
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const cards = gridRef.current?.children;
    if (cards) {
      Array.from(cards).forEach((card) => observer.observe(card));
    }

    return () => {
      if (cards) {
        Array.from(cards).forEach((card) => observer.unobserve(card));
      }
    };
  }, [categoryVideos]);

  useEffect(() => {
    const getColumns = () => calcColumns(windowWidth);

    function handleKeyDown(e) {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
      )
        return;

      const columns = getColumns();

      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < CATEGORIES_DATA.length) setFocusedIndex(idx);
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
        setFocusedIndex((i) => {
          const next = i + 1;
          return next < CATEGORIES_DATA.length ? next : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
        setFocusedIndex((i) => {
          const prev = i - 1;
          return prev >= 0 ? prev : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        setFocusedIndex((i) => {
          const next = i + columns;
          return next < CATEGORIES_DATA.length ? next : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        setFocusedIndex((i) => {
          const prev = i - columns;
          return prev >= 0 ? prev : i;
        });
        e.preventDefault();
      } else if (e.key === "Home") {
        setFocusedIndex(0);
        e.preventDefault();
      } else if (e.key === "End") {
        setFocusedIndex(CATEGORIES_DATA.length - 1);
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === "OK") {
        const item = CATEGORIES_DATA[focusedIndex];
        if (item) handleCategoryClick(item.name);
        e.preventDefault();
      } else if (e.key === "Escape") {
        navigate("/");
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, navigate, windowWidth]);

  useEffect(() => {
    setHovered(focusedIndex);
    if (gridRef.current) {
      const cards = gridRef.current.children;
      const focusedCard = cards[focusedIndex];
      if (focusedCard) {
        focusedCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [focusedIndex]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#111", display: "flex", flexDirection: "column", overflow: "auto", padding: 0, zIndex: 9999 }}>
      <AppHeader active="categories" />
      <div style={{ flex: 1, width: '100%', padding: '40px 20px 32px' }}>
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "28px 24px",
            width: "88vw",
            maxWidth: "1500px",
            margin: "0 auto",
            alignItems: "center",
            justifyItems: "center",
          }}
        >
          {CATEGORIES_DATA.map((cat, idx) => {
            const videoSrc = categoryVideos[idx];
            const gradient = categoryGradients[idx] || ["#222", "#101010"];
            const isActive = hovered === idx || focusedIndex === idx;
            return (
              <div
                key={cat.name}
                style={{
                  position: "relative",
                  width: "100%",
                  height: window.innerWidth < 600 ? 100 : 140,
                  maxWidth: 260,
                  borderRadius: 18,
                  overflow: "hidden",
                  cursor: "pointer",
                  outline: isActive ? "3px solid #fff" : "1px solid #222",
                  boxShadow: isActive
                    ? "0 0 0 3px #fff, 0 10px 30px -6px rgba(0,0,0,0.7)"
                    : "0 6px 22px -8px rgba(0,0,0,0.65)",
                  transform: isActive ? "translateY(-4px) scale(1.05)" : "translateY(0) scale(1)",
                  transition: "transform .35s cubic-bezier(.22,.9,.34,1), box-shadow .3s, outline-color .3s",
                  background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                tabIndex={0}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleCategoryClick(cat.name)}
                aria-label={cat.name}
                aria-selected={isActive}
                role="button"
              >
                {isActive && !!videoSrc ? (
                  <video
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "brightness(.9) saturate(1.15)",
                    }}
                    onError={() => console.warn(`Video yüklenemedi: ${videoSrc}`)}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isActive
                      ? "linear-gradient(160deg, rgba(0,0,0,.15), rgba(0,0,0,.55))"
                      : "linear-gradient(160deg, rgba(0,0,0,.5), rgba(0,0,0,.78))",
                    backdropFilter: isActive ? "blur(6px)" : "blur(2px)",
                    transition: "background .35s, backdrop-filter .35s",
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: "82%",
                    textAlign: "center",
                    color: "#fff",
                    fontSize: window.innerWidth < 600 ? "0.85rem" : window.innerWidth < 900 ? "0.95rem" : "1.05rem",
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    zIndex: 2,
                    textShadow: "0 3px 10px rgba(0,0,0,0.85)",
                    lineHeight: 1.25,
                    userSelect: "none",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    padding: "4px 8px",
                  }}
                  title={cat.name}
                >
                  {cat.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// M3U parse fonksiyonunu dışa aktar
export function buildCategoriesFromM3U(text) {
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
    items: items.slice(0, 12)
  }));
}