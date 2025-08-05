import { useLocation, useNavigate } from 'react-router-dom';
import ChannelGrid from '../components/ChannelGrid';

export default function PlatformEpisodesPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const { platform, series, episodes } = location.state || {};

	if (!platform || !series || !episodes) return <div style={{color:'#fff'}}>Veri eksik.</div>;

	return (
		<div style={{background:'#111', minHeight:'100vh', padding:'32px'}}>
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
			<h2 style={{color:'#fff', marginBottom:'32px'}}>
				{platform.name} / {series['tvg-name'] || series.name} Bölümleri
			</h2>
			<ChannelGrid
				channels={episodes}
				onSelect={ch => {/* oynatıcıya yönlendirme veya başka işlem */}}
				focusedIndex={0}
				setFocusedIndex={() => {}}
				isProgramPage={true}
			/>
		</div>
	);
}
