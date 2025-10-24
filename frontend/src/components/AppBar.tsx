import { AppBar as MuiAppBar, Toolbar, Typography, IconButton, Box, useTheme } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

export const AppBar = () => {
  const { isDarkMode, toggleTheme } = useAppTheme();
  const theme = useTheme();

  return (
    <MuiAppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          SiteInsight Pro
        </Typography>
        <Box>
          <IconButton onClick={toggleTheme} color="inherit" aria-label="toggle theme">
            {isDarkMode ? (
              <LightModeIcon sx={{ color: theme.palette.primary.contrastText }} />
            ) : (
              <DarkModeIcon />
            )}
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};
