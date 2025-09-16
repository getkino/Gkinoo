import { useState, useEffect } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

// Basit line icon'lar (düzgün hizalama)
const Icon = ({ name }) => {
  const style = { display:'block', width:'22px', height:'22px' };
  switch(name){
    case 'user': return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z"/><path d="M3.5 20.4a9.5 9.5 0 0 1 17 0"/></svg>;
    case 'info': return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 11h2v5h-2"/></svg>;
    case 'subs': return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 11h8M11 15h2"/></svg>;
    case 'globe': return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 4 9 17 17 0 0 1-4 9 17 17 0 0 1-4-9 17 17 0 0 1 4-9Z"/></svg>;
    case 'search': return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'help': return <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.45 1.3c0 1.3-1.95 2-1.95 2M12 17h.01"/></svg>;
    case 'chevron': return <svg style={{...style, width:'16px', height:'16px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 18 6-6-6-6"/></svg>;
    default: return null;
  }
};

const Row = ({ left, right, danger, onClick }) => (
  <div onClick={onClick} style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'18px 22px', background:'#1c1d1f', borderRadius:10, fontSize:15,
    cursor: onClick? 'pointer':'default', color: danger? '#f87171':'#e5e7eb',
    border:'1px solid #232527', transition:'background .2s'
  }} className="settings-row-item">
    <span style={{ fontWeight:500 }}>{left}</span>
    <span style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, opacity:.85 }}>
      {right}
      {onClick && <Icon name="chevron" />}
    </span>
  </div>
);

const SettingsPage = () => {
  const [theme] = useState('dark'); // Yalın: sadece koyu tema ekran görüntüsü ile uyumlu
  useEffect(() => { 
    document.body.style.background = '#111315';
    document.documentElement.style.background = '#111315';
  }, []);

  const menu = [
    { key:'account', label:'Hesaplar', icon:'user' },
    { key:'about', label:'Hakkında', icon:'info' },
    { key:'subtitles', label:'Altyazılar', icon:'subs' },
    { key:'language', label:'Tercih Edilen Dil', icon:'globe' },
    { key:'history', label:'Arama Geçmişi', icon:'search' },
    { key:'support', label:'Yardım ve Destek', icon:'help' }
  ];
  const [active, setActive] = useState('account');
  const isMobile = useMediaQuery('(max-width:600px)');

  // Basit state'ler
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);
  const [subtitleLang, setSubtitleLang] = useState('English');
  const [appLang, setAppLang] = useState('English');
  const [history, setHistory] = useState(['Matrix', 'Interstellar', 'Dune']);

  // maxWidth kaldırıldı -> tam genişlik
  const panelBase = { width:'100%', display:'flex', flexDirection:'column', gap:18 };

  const SectionTitle = ({ children }) => <h2 style={{ margin:'0 0 28px', fontSize:36, fontWeight:500, letterSpacing:.5 }}>{children}</h2>;

  const renderAccount = () => (
    <div style={panelBase}>
      <SectionTitle>Hesap</SectionTitle>
      <Row left="Hesap Değiştir" right="222larabrown@gmail.com" />
      <Row left="Abonelikleri Görüntüle" right="" onClick={()=>{}} />
      <Row left="Şifreyi Değiştir" right="" onClick={()=>{}} />
      <Row left="Çıkış Yap" right="" danger onClick={()=>{}} />
    </div>
  );

  const renderAbout = () => (
    <div style={panelBase}>
      <SectionTitle>Gkinoo Hakkında</SectionTitle>
      <div style={{ lineHeight:1.55, fontSize:15, color:'#b1b5bb', maxWidth:740, marginBottom:12 }}>
        Gkinoo'ya hoş geldiniz! Modern ve kullanıcı dostu arayüzü ile film ve dizi izleme deneyiminizi yeniden tanımlayan yeni nesil medya oynatıcısıyız. 
        Gelişmiş video oynatma teknolojileri, çoklu format desteği ve sezgisel kontroller ile en sevdiğiniz içerikleri maksimum kalitede izleyebilirsiniz. 
        Sürekli geliştirdiğimiz özellikler ve kullanıcı geri bildirimleri doğrultusunda şekillenen platformumuz, her geçen gün daha da iyileşiyor.
      </div>
      <div style={{ height:1, background:'#232527', margin:'8px 0 4px' }} />
      <div style={{ fontSize:12, textTransform:'uppercase', letterSpacing:1, color:'#8c9299' }}>Uygulama Sürümü</div>
      <div style={{ fontSize:15, fontWeight:600 }}>Gkinoo 1.0.1</div>
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button onClick={()=>onChange(!value)} style={{
      width:46, height:26, borderRadius:30, border:'1px solid #2a2d30', background:value? '#2563eb':'#303337', position:'relative', cursor:'pointer'
    }}>
      <span style={{ position:'absolute', top:3, left: value? 24:3, width:20, height:20, background:'#fff', borderRadius:'50%', transition:'left .25s' }} />
    </button>
  );

  const renderSubtitles = () => (
    <div style={panelBase}>
      <SectionTitle>Altyazılar</SectionTitle>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Row left={<span style={{ display:'flex', alignItems:'center', gap:12 }}><span>Altyazılar</span><Toggle value={subtitleEnabled} onChange={setSubtitleEnabled} /></span>} right={subtitleEnabled? 'Açık':'Kapalı'} />
        <Row left="Altyazı Dili" right={subtitleLang} onClick={()=> setSubtitleLang(subtitleLang==='English'? 'Türkçe':'English')} />
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div style={panelBase}>
      <SectionTitle>Tercih Edilen Dil</SectionTitle>
      <Row left="Arayüz Dili" right={appLang} onClick={()=> setAppLang(appLang==='English'? 'Türkçe':'English')} />
    </div>
  );

  const renderHistory = () => (
    <div style={panelBase}>
      <SectionTitle>Arama Geçmişi</SectionTitle>
      {history.map((h,i)=> <Row key={i} left={h} right={new Date().toLocaleDateString()} />)}
      {!history.length && <div style={{ color:'#8c9299', fontSize:14 }}>Son aramalar yok.</div>}
      <div style={{ display:'flex', gap:10, marginTop:8 }}>
        <button onClick={()=> setHistory([])} disabled={!history.length} style={{
          background:'#1c1d1f', color:'#e5e7eb', border:'1px solid #2a2d30', padding:'10px 18px', borderRadius:10, cursor: history.length? 'pointer':'not-allowed', opacity: history.length?1:.4, fontSize:14, fontWeight:500
        }}>Temizle</button>
        <button onClick={()=> setHistory(p=>[...p,'Örnek '+(p.length+1)])} style={{ background:'#2563eb', color:'#fff', border:'none', padding:'10px 18px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:500 }}>Örnek Ekle</button>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div style={panelBase}>
      <SectionTitle>Yardım ve Destek</SectionTitle>
      <Row left="Sık Sorulan Sorular" onClick={()=>{}} />
      <Row left="Gizlilik Politikası" onClick={()=>{}} />
      <Row left="Bize Ulaşın" right="support@jetstream.com" />
    </div>
  );

  const panels = { account: renderAccount(), about: renderAbout(), subtitles: renderSubtitles(), language: renderLanguage(), history: renderHistory(), support: renderSupport() };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: '100vh',
        padding: 0,
        margin: 0,
        gap: isMobile ? 0 : 78,
        color: '#e5e7eb',
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        background: '#111315',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'auto'
      }}
    >
      {/* Menü ve geri butonu masaüstünde solda */}
      {!isMobile && (
        <nav
          style={{
            width: 380,
            display: 'flex',
            flexDirection: 'column',
            gap: 34,
            padding: '54px 40px 80px',
            borderBottom: 'none',
            background: 'transparent',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            minHeight: 'auto',
          }}
        >
          <div style={{ marginBottom: 20, width: 'auto', display: 'block' }}>
            <button
              onClick={() => window.history.back()}
              style={{
                background: '#1c1d1f',
                color: '#e5e7eb',
                border: '1px solid #2a2d30',
                padding: '12px 24px',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
              }}
            >
              ← Geri
            </button>
          </div>
          {menu.map(m => {
            const activeState = active === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setActive(m.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '20px 34px',
                  height: 'auto',
                  border: 'none',
                  textAlign: 'left',
                  borderRadius: 4,
                  fontSize: 20,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: activeState ? '#d2d1d3' : 'transparent',
                  color: activeState ? '#111315' : '#c3c7cc',
                  transition: 'background .2s, color .2s',
                  justifyContent: 'flex-start',
                  borderBottom: 'none',
                  flex: 'none'
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeState ? '#111315' : '#90959b'
                }}>
                  <Icon name={m.icon} />
                </div>
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>
      )}
      {/* Mobilde geri butonu üstte sabit */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            background: '#111315',
            zIndex: 1001,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            padding: '10px 0 0 0'
          }}
        >
          <button
            onClick={() => window.history.back()}
            style={{
              background: '#1c1d1f',
              color: '#e5e7eb',
              border: '1px solid #2a2d30',
              padding: '10px 0',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 500,
              width: '96%',
              margin: '0 auto 10px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            ← Geri
          </button>
        </div>
      )}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          padding: isMobile ? '66px 16px 76px 16px' : '54px 40px 80px 0', // üstte geri, altta menü için boşluk
          width: '100%',
          overflowY: 'auto'
        }}
      >
        {panels[active]}
      </main>
      {/* Mobilde menü altta sabit */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100vw',
            background: '#181818',
            borderTop: '1px solid #232527',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.12)'
          }}
        >
          <nav
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              gap: 0,
              padding: '0',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 60,
            }}
          >
            {menu.map(m => {
              const activeState = active === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setActive(m.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: 56,
                    border: 'none',
                    borderRadius: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: activeState ? '#d2d1d3' : 'transparent',
                    color: activeState ? '#111315' : '#c3c7cc',
                    transition: 'background .2s, color .2s',
                    borderBottom: 'none',
                    flex: 1
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeState ? '#111315' : '#90959b'
                  }}>
                    <Icon name={m.icon} />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;