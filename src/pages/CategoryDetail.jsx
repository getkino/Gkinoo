import React, { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { CATEGORIES_DATA, slugify } from "./CategoryShowcase";

export default function CategoryDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const fromState = location.state?.category;
  const fallback = CATEGORIES_DATA.find((c) => slugify(c.name) === slug);
  const category = fromState || fallback || { name: slug.replace(/-/g, " ") };

  const handleCopy = async () => {
    if (!category.m3u) return;
    try {
      await navigator.clipboard.writeText(category.m3u);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // kopyalama hatası sessizce geç
    }
  };

  return (
    <main className="category-detail" style={{ padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Geri bağlantısı */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Link
            to="/kategoriler"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "inherit",
            }}
          >
            <span
              className="material-icons"
              style={{ fontSize: 20 }}
            >
              arrow_back
            </span>
            Geri
          </Link>
        </div>

        {/* Başlık ve açıklama kartı */}
        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              letterSpacing: 0.3,
            }}
          >
            {category.name}
          </h1>
          <p
            style={{
              margin: "8px 0 0 0",
              opacity: 0.85,
            }}
          >
            Bu kategorideki içerik listelerine aşağıdan erişebilirsiniz.
          </p>

          {/* Aksiyonlar */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            {category.m3u ? (
              <>
                <a
                  href={category.m3u}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#febd59",
                    color: "#111",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 6px 18px rgba(254,189,89,0.35)",
                  }}
                >
                  M3U'yu Aç
                </a>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#232323",
                    color: "#fff",
                    border: "1px solid #3a3a3a",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {copied ? "Kopyalandı" : "M3U'yu Kopyala"}
                </button>
              </>
            ) : (
              <span style={{ opacity: 0.7 }}>
                Bu kategori için m3u henüz eklenmedi.
              </span>
            )}
          </div>
        </section>

        {/* Video önizleme (varsa) */}
        {!!category.video && (
          <section
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <video
                src={category.video}
                controls
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
