import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
// Material UI importları
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
// React Icons importları
import { IoHomeOutline } from 'react-icons/io5';
import { BiCategory } from 'react-icons/bi';
import { HiOutlineDesktopComputer } from 'react-icons/hi';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { BiMovie } from 'react-icons/bi';
import { PiTelevisionSimple } from 'react-icons/pi';
import { IoSettingsOutline } from 'react-icons/io5';
// Material UI ek: useMediaQuery
import useMediaQuery from '@mui/material/useMediaQuery';

export default function AppHeader({ active }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // Mobil kontrolü
  const isMobile = useMediaQuery('(max-width:600px)');

  const isActive = (key) => active === key;

  return (
    <AppBar
      position={isMobile ? "fixed" : "static"}
      elevation={0}
      sx={{
        bgcolor: '#181818',
        borderBottom: 'none',
        ...(isMobile && { top: 'auto', bottom: 0, zIndex: 1300 }),
      }}
    >
      <Toolbar sx={{ minHeight: 50, px: 3, display: 'flex', justifyContent: 'center' }}>
        {/* Sol Logo sadece mobilde gizli */}
        {!isMobile && (
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
        )}
        <Box
          component="nav"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 2 : 0,
            justifyContent: isMobile ? 'center' : 'flex-start',
            width: '100%',
          }}
        >
          {/* Mobilde sadece ikonlar ve IconButton ile */}
          {isMobile ? (
            <>
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: isActive('home') ? '#fff' : 'transparent',
                  color: isActive('home') ? '#222' : '#a0a0a0',
                  borderRadius: 2,
                  p: 1.2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive('home') ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: isActive('home') ? '#222' : '#fff'
                  }
                }}
              >
                <IoHomeOutline size={28} />
              </IconButton>
              <IconButton
                onClick={() => navigate('/kategoriler')}
                sx={{
                  bgcolor: isActive('categories') ? '#fff' : 'transparent',
                  color: isActive('categories') ? '#222' : '#a0a0a0',
                  borderRadius: 2,
                  p: 1.2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive('categories') ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: isActive('categories') ? '#222' : '#fff'
                  }
                }}
              >
                <BiCategory size={28} />
              </IconButton>
              <IconButton
                onClick={() => navigate('/platform')}
                sx={{
                  bgcolor: isActive('shows') ? '#fff' : 'transparent',
                  color: isActive('shows') ? '#222' : '#a0a0a0',
                  borderRadius: 2,
                  p: 1.2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive('shows') ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: isActive('shows') ? '#222' : '#fff'
                  }
                }}
              >
                <HiOutlineDesktopComputer size={28} />
              </IconButton>
              <IconButton
                onClick={() => navigate('/belgesel')}
                sx={{
                  bgcolor: isActive('documentaries') ? '#fff' : 'transparent',
                  color: isActive('documentaries') ? '#222' : '#a0a0a0',
                  borderRadius: 2,
                  p: 1.2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive('documentaries') ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: isActive('documentaries') ? '#222' : '#fff'
                  }
                }}
              >
                <IoDocumentTextOutline size={28} />
              </IconButton>
              <IconButton
                onClick={() => navigate('/movies')}
                sx={{
                  bgcolor: isActive('movies') ? '#fff' : 'transparent',
                  color: isActive('movies') ? '#222' : '#a0a0a0',
                  borderRadius: 2,
                  p: 1.2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive('movies') ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: isActive('movies') ? '#222' : '#fff'
                  }
                }}
              >
                <BiMovie size={28} />
              </IconButton>
              <IconButton
                onClick={() => navigate('/series')}
                sx={{
                  bgcolor: isActive('series') ? '#fff' : 'transparent',
                  color: isActive('series') ? '#222' : '#a0a0a0',
                  borderRadius: 2,
                  p: 1.2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive('series') ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: isActive('series') ? '#222' : '#fff'
                  }
                }}
              >
                <PiTelevisionSimple size={28} />
              </IconButton>
              <IconButton
                onClick={() => navigate('/ayarlar')}
                sx={{
                  bgcolor: isActive('settings') ? '#fff' : 'transparent',
                  color: isActive('settings') ? '#222' : '#a0a0a0',
                  borderRadius: 2,
                  p: 1.2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isActive('settings') ? '#fff' : 'rgba(255,255,255,0.08)',
                    color: isActive('settings') ? '#222' : '#fff'
                  }
                }}
              >
                <IoSettingsOutline size={28} />
              </IconButton>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/')}
                startIcon={<IoHomeOutline />}
                sx={{
                  bgcolor: isActive('home') ? '#fff' : 'transparent',
                  color: isActive('home') ? '#222' : '#a0a0a0',
                  fontWeight: isActive('home') ? 600 : 400,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: 18,
                  minWidth: 60,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: isActive('home') ? '#fff' : 'rgba(255,255,255,0.06)',
                    color: isActive('home') ? '#222' : '#fff'
                  }
                }}
              >
                {!isMobile && t('home')}
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/kategoriler')}
                startIcon={<BiCategory />}
                sx={{
                  bgcolor: isActive('categories') ? '#fff' : 'transparent',
                  color: isActive('categories') ? '#222' : '#a0a0a0',
                  fontWeight: isActive('categories') ? 600 : 400,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: 18,
                  minWidth: 60,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: isActive('categories') ? '#fff' : 'rgba(255,255,255,0.06)',
                    color: isActive('categories') ? '#222' : '#fff'
                  }
                }}
              >
                {!isMobile && t('categories')}
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/platform')}
                startIcon={<HiOutlineDesktopComputer />}
                sx={{
                  bgcolor: isActive('shows') ? '#fff' : 'transparent',
                  color: isActive('shows') ? '#222' : '#a0a0a0',
                  fontWeight: isActive('shows') ? 600 : 400,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: 18,
                  minWidth: 60,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: isActive('shows') ? '#fff' : 'rgba(255,255,255,0.06)',
                    color: isActive('shows') ? '#222' : '#fff'
                  }
                }}
              >
                {!isMobile && t('platforms')}
              </Button>
              {/* Mobilde diğer butonlar gizli */}
              {!isMobile && (
                <>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/belgesel')}
                    startIcon={<IoDocumentTextOutline />}
                    sx={{
                      bgcolor: isActive('documentaries') ? '#fff' : 'transparent',
                      color: isActive('documentaries') ? '#222' : '#a0a0a0',
                      fontWeight: isActive('documentaries') ? 600 : 400,
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: 18,
                      minWidth: 120,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: isActive('documentaries') ? '#fff' : 'rgba(255,255,255,0.06)',
                        color: isActive('documentaries') ? '#222' : '#fff'
                      }
                    }}
                  >Belgesel</Button>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/movies')}
                    startIcon={<BiMovie />}
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
                  <Button
                    color="inherit"
                    startIcon={<PiTelevisionSimple />}
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
                    startIcon={<IoSettingsOutline />}
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
                </>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
