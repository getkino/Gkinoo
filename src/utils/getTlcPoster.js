
import tlcPosters from '../assets/tlcPosters.json';

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getTlcPoster(title) {
  const cleaned = normalizeTitle(title);
  return (
    tlcPosters.find(p => {
      const norm = normalizeTitle(p["Program Adı"]);
      return cleaned === norm || cleaned.includes(norm) || norm.includes(cleaned);
    })?.["Poster URL"] || null
  );
}
