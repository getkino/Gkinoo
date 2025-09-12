import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseM3U } from '../components/PlatformShowcase';
import ChannelGrid from '../components/ChannelGrid';

export default function PlatformSeriesPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const platform = location.state?.platform;
	const [channels, setChannels] = useState([]);
	const [focusedIndex, setFocusedIndex] = useState(0);

	useEffect(() => {
		if (!platform) return;
		fetch(platform.m3u)
			.then(res => res.text())
			.then(text => {
				const groups = parseM3U(text);
				// Sadece dizileri (her dizinin bir posteri olacak şekilde) tekilleştir
				const allSeries = Object.values(groups).flat();
				const uniqueSeries = [];
				const seen = new Set();
				for (const s of allSeries) {
					if (!seen.has(s.name)) {
						uniqueSeries.push(s);
						seen.add(s.name);
					}
				}
				setChannels(uniqueSeries);
			});
	}, [platform]);

	function handleSelect(series) {
		// Aynı diziye ait tüm bölümleri bul ve yeni sayfaya yönlendir
		const episodes = channels.filter(ch => ch.name === series.name);
		navigate(`/platform/${encodeURIComponent(platform.name)}/series/${encodeURIComponent(series.name)}`, {
			state: { platform, series, episodes }
		});
	}

	if (!platform) return <div style={{color:'#fff'}}>Platform seçilmedi.</div>;

	return (
		<div style={{background:'#111', minHeight:'100vh', padding:'32px', fontFamily:'Inter, system-ui, -apple-system, sans-serif'}}>
			<button
				onClick={() => navigate(-1)}
				style={{
					position: 'absolute',
					top: 24,
					left: 24,
					background: 'rgba(0,0,0,0.7)',
					color: '#fff',
					border: 'none',
					borderRadius: '50%',
					padding: '12px',
					fontSize: '22px',
					cursor: 'pointer',
					zIndex: 1001
				}}
			>
				<span className="material-icons">arrow_back</span>
			</button>
			<h2 style={{color:'#fff', marginBottom:'32px', fontFamily:'Inter, system-ui, -apple-system, sans-serif'}}>{platform.name} Dizileri</h2>
			<ChannelGrid
				channels={channels}
				onSelect={handleSelect}
				focusedIndex={focusedIndex}
				setFocusedIndex={setFocusedIndex}
				isProgramPage={true}
			/>
		</div>
	);
}
