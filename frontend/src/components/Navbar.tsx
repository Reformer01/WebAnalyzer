import { AppBar, Toolbar, Typography, Button, IconButton, Box, useTheme } from '@mui/material';
import { Brightness4 as DarkIcon, Brightness7 as LightIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface NavbarProps {
  darkMode: boolean;
  onThemeChange: () => void;
}

const Navbar = ({ darkMode, onThemeChange }: NavbarProps) => {
  const theme = useTheme();
  
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 600,
            '&:hover': {
              opacity: 0.9,
            },
          }}
        >
          WebAnalyzer Pro
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/analyze"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Analyze
          </Button>
          
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/settings"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Settings
          </Button>
          
          <IconButton 
            onClick={onThemeChange} 
            color="inherit"
            aria-label="toggle theme"
            sx={{
              marginLeft: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {darkMode ? <LightIcon /> : <DarkIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
