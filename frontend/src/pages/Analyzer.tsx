import { useState, type KeyboardEvent, type ChangeEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  type SxProps,
  type Theme,
  type GridProps
} from '@mui/material';
import { Link as LinkIcon, Image, Article } from '@mui/icons-material';
import axios, { AxiosError } from 'axios';

interface AnalysisResult {
  url: string;
  title: string;
  content: string;
  stats: {
    link_count: number;
    image_count: number;
    content_length: number;
  };
  sample_links: Array<{
    text: string;
    href: string;
  }>;
}

const Analyzer = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeUrl = async () => {
    if (!url) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Ensure URL has http:// or https:// prefix
      const apiUrl = 'http://localhost:8000/api/analyze';
      const requestData = { 
        url: url.startsWith('http') ? url : `https://${url}` 
      };
      
      console.log(`🔄 Making request to: ${apiUrl}`, requestData);
      
      const response = await axios({
        method: 'post',
        url: apiUrl,
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('✅ Request successful, status:', response.status);
      setResult(response.data);
    } catch (error) {
      const err = error as AxiosError;
      console.error('❌ Error analyzing URL:', err);
      
      let errorMessage = 'Failed to analyze the URL. ';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('❌ Response data:', err.response.data);
        console.error('❌ Status code:', err.response.status);
        console.error('❌ Headers:', err.response.headers);
        
        if (err.response.status === 400) {
          errorMessage += 'Invalid URL or the server could not process the request.';
        } else if (err.response.status === 404) {
          errorMessage += 'The requested resource was not found on the server.';
        } else if (err.response.status >= 500) {
          errorMessage += 'Server error. Please try again later.';
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('❌ No response received:', err.request);
        errorMessage += 'Could not connect to the server. Please check your internet connection and try again.';
      } else {
        // Something happened in setting up the request
        console.error('❌ Request setup error:', err.message);
        errorMessage += 'An error occurred while setting up the request.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Webpage Analyzer
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Enter a URL to analyze the webpage content, extract links, and gather metadata.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Enter URL"
            placeholder="https://example.com"
            value={url}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            disabled={isLoading}
            onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && analyzeUrl()}
          />
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={analyzeUrl}
            disabled={isLoading || !url}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {result && (
        <Grid container spacing={3} component="div">
          <Grid item xs={12} md={8} component="div">
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Article sx={{ mr: 1 }} /> Page Content
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  {result.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {result.url}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box 
                  sx={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    p: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                  }}
                >
                  {result.content}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4} component="div">
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinkIcon sx={{ mr: 1 }} /> Page Statistics
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
<LinkIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${result.stats.link_count} links`} 
                      secondary="Total links found"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Image color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${result.stats.image_count} images`} 
                      secondary="Total images found"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary={`${result.stats.content_length} characters`} 
                      secondary="Total content length"
                      sx={{ ml: '36px' }}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Sample Links:
                </Typography>
                <List dense>
                  {result.sample_links.map((link, index) => (
                    <ListItem
                      key={index}
                      component="a"
                      href={link.href.startsWith('http') ? link.href : `${result.url}${link.href}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        borderRadius: 1,
                        cursor: 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          textDecoration: 'none',
                        },
                      }}
                    >
                      <ListItemText
                        primary={link.text || '[No text]'}
                        secondary={link.href}
                        primaryTypographyProps={{
                          variant: 'body2',
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          noWrap: true,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
            
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setResult(null);
                setUrl('');
              }}
              sx={{ mt: 2 }}
            >
              Analyze Another Page
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analyzer;
