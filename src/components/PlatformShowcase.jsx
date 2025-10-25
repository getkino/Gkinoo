import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import { buildCategoriesFromM3U } from '../pages/CategoryShowcase'; // <-- M3U'den group-title bazlı kategoriler oluşturur
import getTmdbProviders from '../utils/getTmdbProviders';
import platformLogoFiles from '../constants/platformLogos';
// small normalizer to match platform names to category titles
function normalizeName(s) {
	if (!s) return '';
	return String(s)
		.toLowerCase()
		.trim()
		.replace(/\+/g, 'plus')
		.replace(/['’`".]/g, '')
		.replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ ]/gi, '')
		.replace(/\s+/g, '');
}

function tokenize(s) {
	if (!s) return [];
	return String(s)
		.toLowerCase()
		.replace(/\+/g, 'plus')
		.replace(/['’`".]/g, '')
		.replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ ]/gi, ' ')
		.split(/\s+/)
		.filter(Boolean);
}

function findBestPlatformMatch(catTitle) {
	const catNorm = normalizeName(catTitle);
	const catTokens = tokenize(catTitle);
	// attempt several matching strategies, prefer exact/include then token overlap
	for (const p of initialPlatforms) {
		const pNorm = normalizeName(p.name);
		if (!pNorm || !catNorm) continue;
		if (pNorm === catNorm) return p;
		if (pNorm.includes(catNorm) || catNorm.includes(pNorm)) return p;
	}

	// token-overlap: any shared token
	for (const p of initialPlatforms) {
		const pTokens = tokenize(p.name);
		const common = pTokens.filter(t => catTokens.includes(t));
		if (common.length > 0) return p;
	}

	// fallback: try partial substring match by tokens
	for (const p of initialPlatforms) {
		const pNorm = normalizeName(p.name);
		for (const t of catTokens) {
			if (pNorm.includes(t)) return p;
		}
	}

	return null;
}

function findBestProviderLogo(catTitle, providerMap) {
	if (!providerMap) return null;
	// providerMap keys are normalized (no spaces) to match normalizeName
	const catNorm = normalizeName(catTitle);
	if (providerMap[catNorm]) return providerMap[catNorm];

	// try token overlap by normalizing provider keys to tokens
	const catTokens = tokenize(catTitle);
	for (const k of Object.keys(providerMap)) {
		if (!k) continue;
		// k is already normalized (no spaces) — also check inclusion
		if (k.includes(catNorm) || catNorm.includes(k)) return providerMap[k];
		// token overlap: split k into tokens by camel-case fallback
		const kTokens = k.split(/\s|(?=[A-Z])|\-/).map(t => t.toLowerCase()).filter(Boolean);
		const common = kTokens.filter(t => catTokens.includes(t));
		if (common.length > 0) return providerMap[k];
	}

	return null;
}

// Sabit platform listesini başlangıç (fallback) olarak tut
export const initialPlatforms = [
	{
		name: 'Disney+',
		logo: '/platformlar/logo/disney.png',
		video: '/platformlar/logo/video/disney.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/kanal%20logo%20ve%20intro/dizi.m3u',
	},
	{
		name: 'Pixar',
		logo: '/platformlar/logo/pixar.png',
		video: '/platformlar/logo/video/pixar.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/PIXAR.m3u',
	},
	{
		name: 'Marvel',
		logo: '/platformlar/logo/marvel.png',
		video: '/platformlar/logo/video/marvel.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Marvel.m3u',
	},
	{
		name: 'Star Wars',
		logo: '/platformlar/logo/starwars.png',
		video: '/platformlar/logo/video/starwars.mp4',
		m3u: '.m3u',
	},
	{
		name: 'National Geographic',
		logo: '/platformlar/logo/national.png',
		video: '/platformlar/logo/video/national.mp4',
		m3u: '.m3u',
	},
	{
		name: 'DC',
		logo: '/platformlar/logo/dc.png',
		video: '/platformlar/logo/video/dc.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/DC.m3u',
	},
	{
		name: 'Amazon Prime',
		logo: '/platformlar/logo/amazon prime.png',
		video: '/platformlar/logo/video/amazon prime.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Amazon%20Prime.m3u',
	},
	{
		name: 'Exxen',
		logo: '/platformlar/logo/exxen.png',
		video: '/platformlar/logo/video/exxen.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Exxen.m3u',
	},
	{
		name: 'Gain',
		logo: '/platformlar/logo/gain.png',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Gain.m3u',
	},
	{
		name: 'HBO Max',
		logo: '/platformlar/logo/hbo max.png',
		video: '/platformlar/logo/video/hbo max.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/HBO%20Max.m3u',
	},
	{
		name: 'Netflix',
		logo: '/platformlar/logo/netflix.png',
		video: '/platformlar/logo/video/netflix.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Netflix.m3u',
	},
	{
		name: 'TOD TV',
		logo: '/platformlar/logo/TOD TV.png',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/TOD%20TV.m3u',
	},
	{
		name: 'Tabii',
		logo: '/platformlar/logo/tabii.png',
		video: '/platformlar/logo/video/tabii.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Tabii.m3u',
	},
	{
		name: 'Hulu',
		logo: '/platformlar/logo/hulu.png',
		video: '/platformlar/logo/video/hulu.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Hulu.m3u',
	},
	{
		name: 'Blutv',
		logo: '/platformlar/logo/blutv.png',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Blutv.m3u',
	},
	{
		name: 'Paramount+',
		logo: '/platformlar/logo/Paramount+.png',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Paramount+.m3u',
	},
	{
		name: 'tv+',
		logo: '/platformlar/logo/tv+.png',
		video: '/platformlar/logo/video/tv+.mp4',
		m3u: '.m3u',
	},
	{
		name: 'Warner Bros',
		logo: '/platformlar/logo/warner bros.png',
		video: '/platformlar/logo/video/warner bros.mp4',
		m3u: '.m3u',
	},
	{
		name: 'Diğer',
		logo: '/platformlar/logo/diğer.png',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Unutulmaz%20Diziler.m3u',
	},
	{
		name: 'Çocuk',
		logo: '/platformlar/logo/cocuk.svg',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/UzunMuhalefet/Legal-IPTV/main/lists/video/sources/www-trtcocuk-net-tr/all.m3u',
	},
	{
		name: 'TLC',
		logo: '/platformlar/logo/tlc.png',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/TLC/TLC.m3u',
	},
	{
		name: 'DMAX',
		logo: '/platformlar/logo/dmax.png',
		video: '/platformlar/logo/video/gain.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/DMAX/DMAX.m3u',
	},
];

// Yardımcı: gradient/videolar (CategoryShowcase ile benzer havuz)
const GRADIENT_VIDEOS = [
  "/platformlar/logo/video/gradyan 1.mp4",
  "/platformlar/logo/video/gradyan 2.mp4",
  "/platformlar/logo/video/gradyan 3.mp4",
  "/platformlar/logo/video/gradyan 4.mp4",
  "/platformlar/logo/video/gradyan 5.mp4",
  "/platformlar/logo/video/gradyan 6.mp4",
];

// Yeni: statik gradyan paleti (CategoryShowcase ile uyumlu)
const GRADIENT_COLOR_SETS = [
  ["#931A1A","#2A0000"],
  ["#3E4254","#181A20"],
  ["#2C2C2C","#101010"],
  ["#5E4F2F","#1C140A"],
  ["#1F3437","#0A1415"],
  ["#16212F","#080C14"],
  ["#311E32","#120812"],
  ["#2E1A12","#0F0705"],
];

const pickRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickRandomGradient = () => pickRandomItem(GRADIENT_COLOR_SETS);

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
			const tvgNameMatch = line.match(/tvg-name="([^"]+)"/);

			const fullName = nameMatch ? nameMatch[1].trim() : 'Bilinmiyor';
			const seasonEpisodeMatch = fullName.match(/(\d+\. Sezon \d+\. Bölüm)/);

			current.title = fullName;
			current.name = tvgNameMatch ? tvgNameMatch[1] : fullName;
			current.group = groupMatch ? groupMatch[1].trim() : 'Diğer';
			current.logo = logoMatch ? logoMatch[1] : null;
			current.seasonEpisode = seasonEpisodeMatch ? seasonEpisodeMatch[1] : '';
		} else if (line.startsWith('http')) {
			current.url = line;
			if (!groups[current.group]) groups[current.group] = [];
			groups[current.group].push({ ...current });
			current = {};
		}
	}
	return groups;
}

// Arka plan için optimize edilmiş CSS (değişkenler eklendi)
const backgroundCss = `
:root {
  --acc-1: #64748b;
  --acc-2: #334155;
  --acc-3: #475569;
  --acc-4: #94a3b8;
}
body, html { height: 100%; }
.backwrap {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}
.back-shapes { position: absolute; inset: 0; }
.floating {
  position: absolute;
  display: inline-block;
  opacity: .7;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,.22));
  animation: float-bounce 96s cubic-bezier(.4,.8,.6,1) infinite;
  will-change: transform;
  background: var(--clr, var(--acc-1));
}
.circle { border-radius: 999px; }
.square { border-radius: .35rem; }
.triangle {
  width: 0; height: 0; background: none; filter: none;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 44px solid var(--acc-2);
}
.cross {
  width: 44px; height: 44px;
  background: transparent; filter: none;
  position: relative;
}
.cross::before, .cross::after {
  content: "";
  position: absolute; inset: 0; margin: auto;
  width: 8px; height: 100%;
  background: var(--acc-3); border-radius: 2px;
}
.cross::after { transform: rotate(90deg); }
/* Kenarlara çarpma ve rastgele hareket için animasyon */
@keyframes float-bounce {
  0%   { transform: translate3d(0,0,0) rotate(0deg);}
  10%  { transform: translate3d(0, -40px, 0) rotate(-8deg);}
  20%  { transform: translate3d(60vw, 0, 0) rotate(12deg);}
  30%  { transform: translate3d(0, 40px, 0) rotate(8deg);}
  40%  { transform: translate3d(-60vw, 0, 0) rotate(-12deg);}
  50%  { transform: translate3d(0, 60px, 0) rotate(0deg);}
  60%  { transform: translate3d(60vw, 0, 0) rotate(12deg);}
  70%  { transform: translate3d(0, -40px, 0) rotate(-8deg);}
  80%  { transform: translate3d(-60vw, 0, 0) rotate(-12deg);}
  90%  { transform: translate3d(0, 0, 0) rotate(0deg);}
  100% { transform: translate3d(0,0,0) rotate(0deg);}
}
@media (prefers-reduced-motion: reduce) {
  .floating { animation: none; }
}
`;

export default function PlatformShowcase({ onBack }) {
	const [hovered, setHovered] = useState(null);
	const [focusedIdx, setFocusedIdx] = useState(0);
	// fallback'i gradyan + video ile genişlet
	const [platforms, setPlatforms] = useState(
		initialPlatforms.map(p => ({ 
			...p, 
			video: p.video || pickRandomItem(GRADIENT_VIDEOS),
			gradient: pickRandomGradient()
		}))
	);
	const navigate = useNavigate();
	const gridRef = useRef(null);

	// Build a runtime map of normalizedName -> logoPath using the files exported
	// from src/constants/platformLogos.js. This uses the same normalizeName
	// function (defined above) so matching is consistent with category titles.
	const buildLogoMap = () => {
		const map = {};
		for (const p of platformLogoFiles) {
			try {
				const parts = p.split('/');
				const filename = parts[parts.length - 1];
				const name = filename.replace(/\.[^/.]+$/, '');
				const key = normalizeName(name);
				if (key) {
					map[key] = p;
					// Also create ASCII-fallback key (replace common Turkish letters) so
					// filenames that use ascii-only chars still match category titles with diacritics.
					const ascii = key
						.replace(/[çÇ]/g, 'c')
						.replace(/[ğĞ]/g, 'g')
						.replace(/[üÜ]/g, 'u')
						.replace(/[şŞ]/g, 's')
						.replace(/[öÖ]/g, 'o')
						.replace(/[ıİ]/g, 'i');
					if (ascii && !map[ascii]) map[ascii] = p;
				}
			} catch (e) {
				// ignore
			}
		}
		return map;
	};

	const staticLogoMap = buildLogoMap();

	function handlePlatformClick(platform) {
		navigate(`/platform/${encodeURIComponent(platform.name)}`, {
			state: { platform }
		});
	}

	// Tek M3U'den kategori/grup çekme (fallback: initialPlatforms)
	useEffect(() => {
		const M3U_URL = 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/kanal%20logo%20ve%20intro/dizi.m3u';
		let cancelled = false;

		(async () => {
			try {
				const r = await fetch(M3U_URL);
				if (!r.ok) throw new Error('Fetch failed');
				const text = await r.text();
				if (cancelled) return;
				const categories = buildCategoriesFromM3U(text); // [{ title, items: [...] }, ...]

				// try fetching TMDB providers (graceful)
				let providerMap = null;
				try {
					providerMap = await getTmdbProviders();
				} catch (e) {
					providerMap = null;
				}

				const built = categories.map((cat) => {
					const first = (cat.items && cat.items[0]) || {};
					const matched = findBestPlatformMatch(cat.title);
					// provider logo fallback if no matched initial platform
					let providerLogo = null;
					if (!matched && providerMap) providerLogo = findBestProviderLogo(cat.title, providerMap);
					// Prefer: 1) static local logo (public/platformlar/logo),
					// 2) matched initial platform logo (initialPlatforms),
					// 3) TMDB provider logo, 4) M3U item's tvg-logo (may be a poster),
					// 5) fallback generated path
					let logo = null;
					const catKey = normalizeName(cat.title);
					if (catKey && staticLogoMap[catKey]) {
						logo = staticLogoMap[catKey];
					} else if (matched && matched.logo) {
						logo = matched.logo;
					} else if (providerLogo) {
						logo = providerLogo;
					}
					// NOTE: do NOT use `first.logo` (M3U poster) or a guessed fallback image here.
					// If no real platform logo is found, leave `logo` null so the UI renders
					// the textual platform/category name instead of showing a poster image.
					const video = matched?.video || pickRandomItem(GRADIENT_VIDEOS);
					return {
						name: cat.title,
						logo,
						video,
						gradient: pickRandomGradient(),
						m3u: M3U_URL,
						items: cat.items
					};
				});
				if (built.length > 0) {
					// Debug: show which logo was chosen for each category (helps verify local logos are used)
					try { console.debug('PlatformShowcase logos:', built.map(b=>({ name: b.name, logo: b.logo }))); } catch (e) {}
					setPlatforms(built);
				}
			} catch (err) {
				// fallback: leave initialPlatforms
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// Uzaktan kumanda desteği (ok tuşları ve enter)
	useEffect(() => {
		const getColumns = () => {
			if (window.innerWidth < 600) return 2;
			if (window.innerWidth < 900) return 3;
			if (window.innerWidth < 1400) return 4;
			return 4;
		};

		function handleKeyDown(e) {
			// Input veya textarea odaklanmışsa klavye olaylarını atla
			if (
				document.activeElement &&
				(document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")
			) return;

			const columns = getColumns();

			// Rakam tuşları ile hızlı geçiş (1-9)
			if (/^[1-9]$/.test(e.key)) {
				const idx = parseInt(e.key, 10) - 1;
				if (idx < platforms.length) setFocusedIdx(idx);
				e.preventDefault();
				return;
			}

			if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
				setFocusedIdx(i => {
					const next = i + 1;
					return next < platforms.length ? next : i;
				});
				e.preventDefault();
			} else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
				setFocusedIdx(i => {
					const prev = i - 1;
					return prev >= 0 ? prev : i;
				});
				e.preventDefault();
			} else if (e.key === "ArrowDown" || e.key === "PageDown") {
				setFocusedIdx(i => {
					const next = i + columns;
					return next < platforms.length ? next : i;
				});
				e.preventDefault();
			} else if (e.key === "ArrowUp" || e.key === "PageUp") {
				setFocusedIdx(i => {
					const prev = i - columns;
					return prev >= 0 ? prev : i;
				});
				e.preventDefault();
			} else if (e.key === "Home") {
				setFocusedIdx(0);
				e.preventDefault();
			} else if (e.key === "End") {
				setFocusedIdx(platforms.length - 1);
				e.preventDefault();
			} else if (e.key === "Enter" || e.key === "OK") {
				handlePlatformClick(platforms[focusedIdx]);
				e.preventDefault();
			} else if (e.key === "Escape") {
				onBack && onBack();
				e.preventDefault();
			}
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [focusedIdx, platforms, onBack]);

	// Otomatik focus ve scroll için
	useEffect(() => {
		setHovered(focusedIdx);
		
		// Odaklanan öğeyi görünür alana kaydır
		if (gridRef.current) {
			const focusedElement = gridRef.current.children[focusedIdx];
			if (focusedElement) {
				focusedElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'center'
				});
			}
		}
	}, [focusedIdx]);

	// CSS'i ekle (yalnızca bir kez)
	useEffect(() => {
		if (!document.getElementById('platform-bg-css')) {
			const style = document.createElement('style');
			style.id = 'platform-bg-css';
			style.innerHTML = backgroundCss;
			document.head.appendChild(style);
		}
	}, []);

	return (
		<div style={{
			position: 'fixed',
			inset: 0,
			background: 'linear-gradient(180deg, var(--bg-1), var(--bg-2))',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'auto',
			padding: 0,
			zIndex: 9999
		}}>
			{/* Dağınık ve kenarlara çarpan şekillerle arka plan */}
			<div className="backwrap gradient">
				<div className="back-shapes" aria-hidden="true">
					<span className="floating circle" style={{top:"7%",left:"7%",animationDelay:"-0.9s"}}></span>
					<span className="floating triangle" style={{top:"12%",left:"85%",animationDelay:"-4.8s"}}></span>
					<span className="floating cross" style={{top:"22%",left:"50%",animationDelay:"-4s"}}></span>
					<span className="floating square" style={{top:"30%",left:"20%",animationDelay:"-2.8s"}}></span>
					<span className="floating square" style={{top:"45%",left:"75%",animationDelay:"-2.15s"}}></span>
					<span className="floating square" style={{top:"60%",left:"5%",animationDelay:"-1.9s"}}></span>
					<span className="floating cross" style={{top:"65%",left:"60%",animationDelay:"-0.65s"}}></span>
					<span className="floating cross" style={{top:"75%",left:"95%",animationDelay:"-0.4s"}}></span>
					<span className="floating circle" style={{top:"85%",left:"15%",animationDelay:"-4.1s"}}></span>
					<span className="floating circle" style={{top:"90%",left:"70%",animationDelay:"-3.65s"}}></span>
					<span className="floating cross" style={{top:"15%",left:"40%",animationDelay:"-2.25s"}}></span>
					<span className="floating cross" style={{top:"25%",left:"80%",animationDelay:"-2s"}}></span>
					<span className="floating cross" style={{top:"35%",left:"55%",animationDelay:"-1.55s"}}></span>
					<span className="floating cross" style={{top:"55%",left:"35%",animationDelay:"-0.95s"}}></span>
					<span className="floating square" style={{top:"70%",left:"30%",animationDelay:"-4.45s"}}></span>
					<span className="floating circle" style={{top:"80%",left:"90%",animationDelay:"-3.35s"}}></span>
					<span className="floating triangle" style={{top:"10%",left:"60%",animationDelay:"-2.3s"}}></span>
					<span className="floating triangle" style={{top:"20%",left:"95%",animationDelay:"-1.75s"}}></span>
					<span className="floating triangle" style={{top:"40%",left:"65%",animationDelay:"-1.25s"}}></span>
					<span className="floating triangle" style={{top:"50%",left:"25%",animationDelay:"-0.65s"}}></span>
					<span className="floating triangle" style={{top:"60%",left:"80%",animationDelay:"-0.35s"}}></span>
					<span className="floating cross" style={{top:"72%",left:"17%",animationDelay:"-4.3s"}}></span>
					<span className="floating cross" style={{top:"78%",left:"50%",animationDelay:"-4.05s"}}></span>
					<span className="floating cross" style={{top:"88%",left:"75%",animationDelay:"-3.75s"}}></span>
					<span className="floating cross" style={{top:"95%",left:"85%",animationDelay:"-3.3s"}}></span>
					<span className="floating square" style={{top:"5%",left:"60%",animationDelay:"-2.1s"}}></span>
					<span className="floating square" style={{top:"18%",left:"90%",animationDelay:"-1.75s"}}></span>
					<span className="floating square" style={{top:"28%",left:"65%",animationDelay:"-1.45s"}}></span>
					<span className="floating square" style={{top:"38%",left:"45%",animationDelay:"-1.05s"}}></span>
					<span className="floating square" style={{top:"48%",left:"25%",animationDelay:"-0.7s"}}></span>
					<span className="floating square" style={{top:"58%",left:"80%",animationDelay:"-0.35s"}}></span>
					<span className="floating square" style={{top:"68%",left:"97%",animationDelay:"-0.1s"}}></span>
					<span className="floating triangle" style={{top:"55%",left:"10%",animationDelay:"-2.2s"}}></span>
					<span className="floating cross" style={{top:"35%",left:"10%",animationDelay:"-3.7s"}}></span>
					<span className="floating square" style={{top:"80%",left:"50%",animationDelay:"-1.2s"}}></span>
					<span className="floating circle" style={{top:"60%",left:"40%",animationDelay:"-2.7s"}}></span>
				</div>
			</div>
			<AppHeader active="shows" />
			<div style={{flex:1,width:'100%',padding:'40px 20px 20px'}}>
				<div
					ref={gridRef}
					style={{
						display:'grid',
						gridTemplateColumns:
							window.innerWidth < 600 ? 'repeat(2,1fr)' :
							window.innerWidth < 900 ? 'repeat(3,1fr)' :
							window.innerWidth < 1400 ? 'repeat(4,1fr)' : 'repeat(4,1fr)',
						gap:'20px',
						width:'90vw',
						maxWidth:'1200px',
						margin:'0 auto',
						alignItems:'center',
						justifyItems:'center'
					}}
				>
{platforms.map((p, idx)=>(
	<div
		key={p.name}
		style={{
			position:'relative',
			width:'100%',
			height: window.innerWidth < 600 ? 100 : 140,
			maxWidth: 260,
			borderRadius: 16,
			overflow: 'hidden',
			cursor:'pointer',
			outline: (hovered === idx || focusedIdx === idx) ? '3px solid #fff' : '1px solid rgba(0,0,0,0.25)',
			boxShadow: (hovered === idx || focusedIdx === idx) ? '0 0 0 3px #fff, 0 10px 30px -6px rgba(0,0,0,0.7)' : '0 6px 22px -8px rgba(0,0,0,0.65)',
			transform: (hovered === idx || focusedIdx === idx) ? 'translateY(-4px) scale(1.03)' : 'translateY(0) scale(1)',
			transition: 'transform .35s cubic-bezier(.22,.9,.34,1), box-shadow .3s, outline-color .2s',
			display:'flex',
			alignItems:'center',
			justifyContent:'center',
				// If a real logo is present, prefer a neutral/dark background so the
				// logo stands out and doesn't clash with the random gradient colors.
				background: p.logo
					? 'linear-gradient(135deg, rgba(10,10,10,0.92), rgba(0,0,0,0.98))'
					: `linear-gradient(135deg, ${p.gradient?.[0] || '#222'}, ${p.gradient?.[1] || '#000'})`
		}}
		tabIndex={0}
		onMouseEnter={()=>setHovered(idx)}
		onMouseLeave={()=>setHovered(null)}
		onClick={()=>handlePlatformClick(p)}
	>
		{(hovered === idx || focusedIdx === idx) && p.video && (
			<video
				src={p.video}
				autoPlay
				loop
				muted
				style={{
					position:'absolute',
					inset:0,
					width:'100%',
					height:'100%',
					objectFit:'cover',
					filter:'brightness(.9) saturate(1.1)',
					zIndex:1,
					pointerEvents:'none'
				}}
			/>
		)}

		{/* koyu/yarı saydam overlay */}
		<div style={{ position:'absolute', inset:0, background:(hovered===idx||focusedIdx===idx) ? 'linear-gradient(160deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55))' : 'linear-gradient(160deg, rgba(0,0,0,0.5), rgba(0,0,0,0.78))', zIndex:2 }} />

			{/* Logo varsa göster, yoksa başlığı göster */}
			<div style={{position:'relative',zIndex:3,display:'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',padding:'6px 10px'}}>
				{p.logo ? (
					<img
						src={p.logo}
						alt={p.name}
						style={{
							maxWidth: '70%',
							maxHeight: '70%',
							objectFit: 'contain',
							filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))',
							pointerEvents: 'none'
						}}
						onError={(e)=>{ e.currentTarget.style.display = 'none'; }}
					/>
				) : (
					<div
						style={{
							color:'#fff',
							fontWeight:700,
							fontSize: window.innerWidth < 600 ? '0.9rem' : '1rem',
							letterSpacing:0.4,
							textAlign:'center',
							textShadow:'0 3px 10px rgba(0,0,0,0.6)',
							whiteSpace:'nowrap',
							overflow:'hidden',
							textOverflow:'ellipsis'
						}}
						title={p.name}
					>
						{p.name}
					</div>
				)}
			</div>
	</div>
))}
				</div>
			</div>
		</div>
	);
}
