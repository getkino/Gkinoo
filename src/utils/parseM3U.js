export function parseM3U(m3uContent) {
  const lines = m3uContent.split('\n');
  const groups = {};

  let current = {};

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      const nameMatch = line.match(/,(.*)$/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);

      const fullName = nameMatch ? nameMatch[1].trim() : 'Bilinmeyen';
      const seasonEpisodeMatch = fullName.match(/(\d+\. Sezon \d+\. Bölüm)/);

      current.title = fullName; // Tam başlık
      current.name = seasonEpisodeMatch ? seasonEpisodeMatch[1] : fullName; // Kısa isim
      current.group = groupMatch ? groupMatch[1].trim() : 'Diğer';
      current.logo = logoMatch ? logoMatch[1] : null;

    } else if (line.startsWith('http')) {
      // 👇 Buraya sadece bu satırı ekliyoruz
      const finalUrl = line.includes('diziyou7.com') ? line.replace('/play.m3u8', '/1080p.m3u8') : line;

      current.url = convertVidmodyLink(finalUrl); // mevcut dönüşüm fonksiyonu zaten burada
      if (!groups[current.group]) groups[current.group] = [];
      groups[current.group].push({ ...current });
      current = {};
    }
  }

  return groups;
}

// Eğer vidmody.com/vs/... yapısındaysa, .m3u8'e çevir
function convertVidmodyLink(url) {
  const match = url.match(/vidmody\.com\/vs\/(tt\d+)/);
  if (match) {
    const imdbId = match[1];
    return `https://vidmody.com/mm/${imdbId}/main/index.m3u8`;
  }
  return url;
}
