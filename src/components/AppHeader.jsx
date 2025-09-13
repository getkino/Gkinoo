import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
// Material UI importları
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function AppHeader({ active }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isActive = (key) => active === key;

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#181818', borderBottom: 'none' }}>
      <Toolbar sx={{ minHeight: 50, px: 3, display: 'flex', justifyContent: 'center' }}>
        {/* Sol Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 3
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '100%',
              height: 32,
              objectFit: 'contain',
              borderRadius: 6,
            }}
          />
        </Box>
        <Box component="nav" sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: isActive('home') ? '#fff' : 'transparent',
              color: isActive('home') ? '#222' : '#a0a0a0',
              fontWeight: isActive('home') ? 600 : 400,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: 18,
              minWidth: 120,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isActive('home') ? '#fff' : 'rgba(255,255,255,0.06)',
                color: isActive('home') ? '#222' : '#fff'
              }
            }}
          >{t('home')}</Button>
          <Button
            color="inherit"
            onClick={() => navigate('/kategoriler')}
            sx={{
              bgcolor: isActive('categories') ? '#fff' : 'transparent',
              color: isActive('categories') ? '#222' : '#a0a0a0',
              fontWeight: isActive('categories') ? 600 : 400,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: 18,
              minWidth: 120,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isActive('categories') ? '#fff' : 'rgba(255,255,255,0.06)',
                color: isActive('categories') ? '#222' : '#fff'
              }
            }}
          >{t('categories')}</Button>
          <Button
            color="inherit"
            onClick={() => navigate('/platform')}
            sx={{
              bgcolor: isActive('shows') ? '#fff' : 'transparent',
              color: isActive('shows') ? '#222' : '#a0a0a0',
              fontWeight: isActive('shows') ? 600 : 400,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: 18,
              minWidth: 120,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isActive('shows') ? '#fff' : 'rgba(255,255,255,0.06)',
                color: isActive('shows') ? '#222' : '#fff'
              }
            }}
          >{t('platforms')}</Button>
          <Button
            color="inherit"
            sx={{
              bgcolor: isActive('favorites') ? '#fff' : 'transparent',
              color: isActive('favorites') ? '#222' : '#a0a0a0',
              fontWeight: isActive('favorites') ? 600 : 400,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: 18,
              minWidth: 120,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isActive('favorites') ? '#fff' : 'rgba(255,255,255,0.06)',
                color: isActive('favorites') ? '#222' : '#fff'
              }
            }}
          >{t('favorites')}</Button>
          <Button
            color="inherit"
            sx={{
              bgcolor: isActive('movies') ? '#fff' : 'transparent',
              color: isActive('movies') ? '#222' : '#a0a0a0',
              fontWeight: isActive('movies') ? 600 : 400,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: 18,
              minWidth: 120,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isActive('movies') ? '#fff' : 'rgba(255,255,255,0.06)',
                color: isActive('movies') ? '#222' : '#fff'
              }
            }}
          >{t('movies')}</Button>
          {/* Diziler butonu eklendi */}
          <Button
            color="inherit"
            sx={{
              bgcolor: isActive('series') ? '#fff' : 'transparent',
              color: isActive('series') ? '#222' : '#a0a0a0',
              fontWeight: isActive('series') ? 600 : 400,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: 18,
              minWidth: 120,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isActive('series') ? '#fff' : 'rgba(255,255,255,0.06)',
                color: isActive('series') ? '#222' : '#fff'
              }
            }}
          >Diziler</Button>
          <Button
            color="inherit"
            onClick={() => navigate('/ayarlar')}
            sx={{
              bgcolor: isActive('settings') ? '#fff' : 'transparent',
              color: isActive('settings') ? '#222' : '#a0a0a0',
              fontWeight: isActive('settings') ? 600 : 400,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: 18,
              minWidth: 120,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isActive('settings') ? '#fff' : 'rgba(255,255,255,0.06)',
                color: isActive('settings') ? '#222' : '#fff'
              }
            }}
          >
            {t('settings')}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
