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

export const CATEGORIES_DATA = [
  { name: "Aile", m3u: "https://raw.githubusercontent.com/getkino/depo/refs/heads/main/DMAX/DMAX.m3u" },
  { name: "Aksiyon", m3u: "" },
  { name: "Animasyon", m3u: "" },
  { name: "Belgeseller", m3u: "" },
  { name: "Bilim Kurgu", m3u: "" },
  { name: "Blu Ray", m3u: "" },
  { name: "Çizgi", m3u: "" },
  { name: "Dram", m3u: "" },
  { name: "Fantastik", m3u: "" },
  { name: "Gerilim", m3u: "" },
  { name: "Gizem", m3u: "" },
  { name: "Hint", m3u: "" },
  { name: "Komedi", m3u: "" },
  { name: "Korku", m3u: "" },
  { name: "Macera", m3u: "" },
  { name: "Müzikal", m3u: "" },
  { name: "Polisiye", m3u: "" },
  { name: "Psikolojik", m3u: "" },
  { name: "Romantik", m3u: "" },
  { name: "Savaş", m3u: "" },
  { name: "Suç", m3u: "" },
  { name: "Tarih", m3u: "" },
  { name: "Western", m3u: "" },
  { name: "Yerli", m3u: "" },
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

export default function CategoryShowcase() {
  const [hovered, setHovered] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  // Dinamik video kaynakları için state
  const [categoryVideos, setCategoryVideos] = useState([]);
  const navigate = useNavigate();
  const gridRef = useRef(null);

  function handleCategoryClick(name) {
    const category = CATEGORIES_DATA.find((c) => c.name === name);
    navigate(`/kategoriler/${slugify(name)}`, { state: { category } });
  }

  // Videoları periyodik olarak rastgele ata (m3u değerlerine dokunma)
  useEffect(() => {
    const pick = () => GRADIENT_VIDEOS[Math.floor(Math.random() * GRADIENT_VIDEOS.length)];
    // İlk atama
    setCategoryVideos(CATEGORIES_DATA.map(() => pick()));
    // Her 4 saniyede bir güncelle
    const id = setInterval(() => {
      setCategoryVideos(prev => prev.map(() => pick()));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const getColumns = () => {
      if (window.innerWidth < 600) return 2;
      if (window.innerWidth < 900) return 3;
      if (window.innerWidth < 1400) return 4;
      if (window.innerWidth < 1800) return 5;
      return 5;
    };

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
  }, [focusedIdx, navigate]);

  useEffect(() => {
    setHovered(focusedIdx);
    
    // Seçili öğeyi görünür alana kaydır
    if (gridRef.current) {
      const cards = gridRef.current.children;
      const focusedCard = cards[focusedIdx];
      if (focusedCard) {
        focusedCard.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
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
        padding: "80px 20px 20px 20px",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: window.innerWidth < 600 ? "16px" : "24px",
          left: window.innerWidth < 600 ? "16px" : "24px",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          border: "none",
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
          gridTemplateColumns: window.innerWidth < 600 
            ? "repeat(2, 1fr)" 
            : window.innerWidth < 900 
            ? "repeat(3, 1fr)" 
            : window.innerWidth < 1400 
            ? "repeat(4, 1fr)" 
            : window.innerWidth < 1800 
            ? "repeat(5, 1fr)" 
            : "repeat(5, 1fr)",
          gap: "20px",
          width: "90vw",
          maxWidth: "1200px",
          margin: "0 auto",
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        {CATEGORIES_DATA.map((cat, idx) => {
          const videoSrc = categoryVideos[idx];
          return (
            <div
              key={cat.name}
              style={{
                background: hovered === idx || focusedIdx === idx ? "#232323" : "#181818",
                borderRadius: window.innerWidth < 600 ? "12px" : "16px",
                boxShadow:
                  hovered === idx || focusedIdx === idx ? "0 0 24px #febd59" : "0 2px 16px #0005",
                width: "100%",
                height: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                transition: "box-shadow 0.2s, background 0.2s",
                outline: focusedIdx === idx ? "2px solid #febd59" : "none",
              }}
              tabIndex={0}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleCategoryClick(cat.name)}
            >
              {/* Başlık */}
              <div
                style={{
                  width: "80%",
                  textAlign: "center",
                  color: "#fff",
                  fontSize: window.innerWidth < 600 ? "0.9rem" : window.innerWidth < 900 ? "1rem" : "1.1rem",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  zIndex: 2,
                  textShadow: "0 2px 8px #0007",
                }}
              >
                {cat.name}
              </div>

              {/* Hover/Focus video önizleme - dinamik kaynak */}
              {(hovered === idx || focusedIdx === idx) && !!videoSrc && (
                <video
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: window.innerWidth < 600 ? "12px" : "16px",
                    opacity: 0.6,
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
