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
      // diziyou7.com için özel dönüşüm
      let finalUrl = line.includes('diziyou7.com') ? line.replace('/play.m3u8', '/1080p.m3u8') : line;

      // load.rectv2024live.com için proxy ekle (film ve dizi grupları için)
      if ((current.group && (current.group.toLowerCase().includes('dizi') || current.group.toLowerCase().includes('sinema') || current.group.toLowerCase().includes('film')))
        && finalUrl.startsWith('https://load.rectv2024live.com/')) {
        finalUrl = 'https://1.nejyoner19.workers.dev/url=' + finalUrl;
      }

      current.url = finalUrl;
      if (!groups[current.group]) groups[current.group] = [];
      groups[current.group].push({ ...current });
      current = {};
    }
  }

  return groups;
}


