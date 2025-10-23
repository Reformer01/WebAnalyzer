import { useState, useEffect, type ChangeEvent } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface SettingsData {
  apiKey: string;
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  recentSearches: string[];
  maxHistoryItems: number;
}

const Settings = () => {
  const [settings, setSettings] = useState<SettingsData>({
    apiKey: '',
    theme: 'system',
    autoSave: true,
    recentSearches: [],
    maxHistoryItems: 10,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState('');

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // In a real app, you would load these from an API or localStorage
        const savedSettings = localStorage.getItem('webAnalyzerSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setShowError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (field: keyof SettingsData, value: string | boolean | string[]) => {
    setSettings((prev: SettingsData) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // In a real app, you would save these to an API
      localStorage.setItem('webAnalyzerSettings', JSON.stringify(settings));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setShowError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your search history? This cannot be undone.')) {
      handleChange('recentSearches', []);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customize your WebAnalyzer Pro experience
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          API Configuration
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <TextField
          fullWidth
          label="API Key"
          variant="outlined"
          value={settings.apiKey}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('apiKey', e.target.value)}
          placeholder="Enter your API key"
          type="password"
          margin="normal"
          helperText="Your API key is stored locally in your browser"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Display Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.theme === 'dark'}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('theme', e.target.checked ? 'dark' : 'light')}
              color="primary"
            />
          }
          label="Dark Mode"
        />
        
        <Box mt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoSave}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('autoSave', e.target.checked)}
                color="primary"
              />
            }
            label="Auto-save analysis results"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Search History</Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={clearHistory}
            disabled={settings.recentSearches.length === 0}
          >
            Clear All
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {settings.recentSearches.length > 0 ? (
          <List dense>
            {settings.recentSearches.map((search: string, index: number) => (
              <ListItem key={index} divider={index < settings.recentSearches.length - 1}>
                <ListItemText 
                  primary={search}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                  }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Remove">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => {
                        const updatedSearches = [...settings.recentSearches];
                        updatedSearches.splice(index, 1);
                        handleChange('recentSearches', updatedSearches);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Your search history is empty
          </Typography>
        )}
      </Paper>

      <Box display="flex" justifyContent="flex-end" mt={4}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      {showError && (
        <Snackbar
          open={!!showError}
          autoHideDuration={6000}
          onClose={() => setShowError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setShowError('')}>
            {showError}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default Settings;
