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
      let finalUrl = line;



      current.url = finalUrl;
      if (!groups[current.group]) groups[current.group] = [];
      groups[current.group].push({ ...current });
      current = {};
    }
  }

  return groups;
}


