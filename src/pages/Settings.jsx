import { useLanguage } from '../contexts/LanguageContext';
import {
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import AppHeader from '../components/AppHeader';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <>
      <AppHeader active="settings" />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#282828', color: '#fff' }}>
          <Typography variant="h4" gutterBottom>
            {t('settings')}
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: '#a0a0a0' }} shrink>
                {t('language')}
              </InputLabel>
              <Select
                label={t('language')}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: '#a0a0a0',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#fff',
                  },
                  '.MuiSvgIcon-root': {
                    color: '#a0a0a0',
                  }
                }}
              >
                <MenuItem value="tr">{t('turkish')}</MenuItem>
                <MenuItem value="en">{t('english')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
