// proxy-m3u-cleaner-puppeteer.mjs
import fs from 'fs';
import axios from 'axios';
import puppeteer from 'puppeteer';

const SOURCE_M3U_URL = 'https://raw.githubusercontent.com/GitLatte/patr0n/site/lists/power-sinema.m3u';
const OUTPUT_FILE = 'cleaned-sinema.m3u';

async function resolveVidmodyWithBrowser(link) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  try {
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 0 });
    const m3u8Link = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      for (const script of scripts) {
        if (script.innerText.includes('.m3u8')) {
          const match = script.innerText.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
          if (match) return match[0];
        }
      }
      return null;
    });
    return m3u8Link;
  } catch (err) {
    console.error(`❌ Puppeteer hata: ${err.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

async function processM3U() {
  const { data: rawM3U } = await axios.get(SOURCE_M3U_URL);
  const lines = rawM3U.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF')) {
      result.push(line);
    } else if (line.includes('vidmody.com/vs/')) {
      console.log(`🎯 İşleniyor: ${line}`);
      const resolved = await resolveVidmodyWithBrowser(line);
      if (resolved) {
        result.push(resolved);
      } else {
        console.warn('⚠️ Atlandı:', line);
      }
    } else {
      result.push(line);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, result.join('\n'), 'utf-8');
  console.log(`✅ Yazıldı: ${OUTPUT_FILE}`);
}

processM3U();
