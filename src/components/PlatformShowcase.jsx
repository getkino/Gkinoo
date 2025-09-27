import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';

const platforms = [
	{
		name: 'Disney+',
		logo: '/platformlar/logo/disney.png',
		video: '/platformlar/logo/video/disney.mp4',
		m3u: 'https://raw.githubusercontent.com/getkino/depo/refs/heads/main/m3u/Disney%2B.m3u',
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

export default function PlatformShowcase({ onBack }) {
	const [hovered, setHovered] = useState(null);
	const [focusedIdx, setFocusedIdx] = useState(0);
	const navigate = useNavigate();
	const gridRef = useRef(null);

	function handlePlatformClick(platform) {
		navigate(`/platform/${encodeURIComponent(platform.name)}`, {
			state: { platform }
		});
	}

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

	return (
		<div style={{position:'fixed',inset:0,background:'#111',display:'flex',flexDirection:'column',overflow:'auto',padding:0,zIndex:9999}}>
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
								background: (hovered === idx || focusedIdx === idx) ? '#232323' : '#181818',
								borderRadius: window.innerWidth < 600 ? '12px':'16px',
								width:'100%',
								height: window.innerWidth < 600 ? '120px':'160px',
								display:'flex',
								alignItems:'center',
								justifyContent:'center',
								position:'relative',
								cursor:'pointer',
								transition:'box-shadow .2s,background .2s',
								outline: (hovered === idx || focusedIdx === idx) ? '3px solid #ffffffff' : 'none'
							}}
							tabIndex={0}
							onMouseEnter={()=>setHovered(idx)}
							onMouseLeave={()=>setHovered(null)}
							onClick={()=>handlePlatformClick(p)}
						>
							<img
								src={p.logo}
								alt={p.name}
								style={{
									width: window.innerWidth < 600 ? '60%':'65%',
									height: window.innerWidth < 600 ? '60%':'65%',
									objectFit:'contain',
									filter:'drop-shadow(0 2px 8px #0007)',
									zIndex:2,
									position:'relative'
								}}
							/>
							{(hovered === idx || focusedIdx === idx) && (
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
										borderRadius: window.innerWidth < 600 ? '12px':'16px',
										opacity:.6,
										zIndex:1,
										pointerEvents:'none'
									}}
								/>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
