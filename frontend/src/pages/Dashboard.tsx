import { Box, Typography, Button, Paper, Grid, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { BarChart, Web, Settings } from '@mui/icons-material';

const Dashboard = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Welcome to WebAnalyzer Pro. Get started by analyzing a webpage or check your recent activities.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card 
            component={Link} 
            to="/analyze" 
            sx={{ 
              textDecoration: 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Web color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" component="h2" gutterBottom>
                Webpage Analyzer
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Analyze any webpage to extract content, links, and metadata with our powerful analysis tools.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                sx={{ mt: 2 }}
              >
                Start Analyzing
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <BarChart color="secondary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" component="h2" gutterBottom>
                Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View detailed analytics and statistics about your previous analyses.
              </Typography>
              <Button 
                variant="outlined" 
                color="secondary" 
                fullWidth
                disabled
                sx={{ mt: 2 }}
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            component={Link} 
            to="/settings" 
            sx={{ 
              textDecoration: 'none',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Settings color="action" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" component="h2" gutterBottom>
                Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure your preferences and API settings for a personalized experience.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                fullWidth
                sx={{ mt: 2 }}
              >
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your recent analyses will appear here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;
