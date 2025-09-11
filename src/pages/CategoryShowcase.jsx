import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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

export const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const calcColumns = (w) => {
  if (w < 600) return 2;
  if (w < 900) return 3;
  if (w < 1400) return 4;
  return 5;
};

export default function CategoryShowcase() {
  const [hovered, setHovered] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  // Dinamik video kaynakları için state
  const [categoryVideos, setCategoryVideos] = useState([]);
  // Yeni: her kategori için sabit bir gradyan (yenilenmez)
  const [categoryGradients, setCategoryGradients] = useState([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const navigate = useNavigate();
  const gridRef = useRef(null);

  function handleCategoryClick(name) {
    const category = CATEGORIES_DATA.find((c) => c.name === name);
    navigate(`/kategoriler/${slugify(name)}`, { state: { category } });
  }

  // Videolar ve gradyanlar: sadece ilk yüklemede atanır (flicker olmaması için interval kaldırıldı)
  useEffect(() => {
    const pickVideo = () => GRADIENT_VIDEOS[Math.floor(Math.random() * GRADIENT_VIDEOS.length)];
    const pickGradient = () => GRADIENT_COLOR_SETS[Math.floor(Math.random() * GRADIENT_COLOR_SETS.length)];
    setCategoryVideos(CATEGORIES_DATA.map(() => pickVideo()));
    setCategoryGradients(CATEGORIES_DATA.map(() => pickGradient()));
  }, []);

  // Resize dinleme
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
        if (idx < CATEGORIES_DATA.length) setFocusedIdx(idx);
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
        setFocusedIdx((i) => {
          const next = i + 1;
          return next < CATEGORIES_DATA.length ? next : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
        setFocusedIdx((i) => {
          const prev = i - 1;
          return prev >= 0 ? prev : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        setFocusedIdx((i) => {
          const next = i + columns;
          return next < CATEGORIES_DATA.length ? next : i;
        });
        e.preventDefault();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        setFocusedIdx((i) => {
          const prev = i - columns;
          return prev >= 0 ? prev : i;
        });
        e.preventDefault();
      } else if (e.key === "Home") {
        setFocusedIdx(0);
        e.preventDefault();
      } else if (e.key === "End") {
        setFocusedIdx(CATEGORIES_DATA.length - 1);
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === "OK") {
        const item = CATEGORIES_DATA[focusedIdx];
        if (item) handleCategoryClick(item.name);
        e.preventDefault();
      } else if (e.key === "Escape") {
        navigate("/");
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIdx, navigate, windowWidth]);

  useEffect(() => {
    setHovered(focusedIdx);
    if (gridRef.current) {
      const cards = gridRef.current.children;
      const focusedCard = cards[focusedIdx];
      if (focusedCard) {
        focusedCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [focusedIdx]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#111",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "auto",
        padding: "80px 20px 32px",
      }}
    >
      {/* Geri butonu */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: window.innerWidth < 600 ? "16px" : "24px",
          left: window.innerWidth < 600 ? "16px" : "24px",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)",
          color: "#fff",
          border: "1px solid #fff3",
          borderRadius: "50%",
          padding: window.innerWidth < 600 ? "8px" : "12px",
          fontSize: window.innerWidth < 600 ? "18px" : "22px",
          cursor: "pointer",
          zIndex: 1001,
        }}
      >
        <span className="material-icons">arrow_back</span>
      </button>

      <div
        ref={gridRef}
        style={{
            display: "grid",
            gridTemplateColumns: `repeat(${calcColumns(windowWidth)}, 1fr)`,
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
          const isActive = hovered === idx || focusedIdx === idx;
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
              role="button"
            >
              {/* Arka plan video (sadece aktifken) */}
              {isActive && !!videoSrc && (
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
                />
              )}
              {/* Koyu blur overlay (video / gradient üstüne) */}
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
              {/* Başlık */}
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
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
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
  );
}
