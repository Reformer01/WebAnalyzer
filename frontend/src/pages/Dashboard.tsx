import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  LinearProgress,
  Badge,
  Avatar,
  Link,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics,
  Link as LinkIcon,
  Image as ImageIcon,
  Speed,
  TrendingUp,
  Refresh,
  Download,
  Share,
  Delete,
  Edit,
  Visibility,
  Timeline,
  BarChart,
  PieChart,
  ShowChart,
  Assessment,
  Web,
  AccessTime,
  CloudUpload,
  History,
  Settings,
  FilterList,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

interface AnalysisStats {
  totalAnalyses: number;
  avgProcessingTime: number;
  totalLinks: number;
  totalImages: number;
  successRate: number;
  recentActivity: Array<{
    id: number;
    url: string;
    title: string;
    status: 'success' | 'error';
    timestamp: string;
    processingTime: number;
  }>;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const [stats, setStats] = useState<AnalysisStats>({
    totalAnalyses: 0,
    avgProcessingTime: 0,
    totalLinks: 0,
    totalImages: 0,
    successRate: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analysesResponse, healthResponse] = await Promise.all([
        axios.get('/api/analyses?limit=50'),
        axios.get('/health')
      ]);

      const analyses = analysesResponse.data;
      const health = healthResponse.data;

      // Calculate statistics
      const totalAnalyses = analyses.length;
      const avgProcessingTime = analyses.reduce((acc: number, a: any) => acc + (a.processing_time || 0), 0) / totalAnalyses || 0;
      const totalLinks = analyses.reduce((acc: number, a: any) => acc + (a.stats?.link_count || 0), 0);
      const totalImages = analyses.reduce((acc: number, a: any) => acc + (a.stats?.image_count || 0), 0);
      const successCount = analyses.filter((a: any) => a.status_code === 200).length;
      const successRate = totalAnalyses > 0 ? (successCount / totalAnalyses) * 100 : 0;

      // Recent activity (last 10)
      const recentActivity = analyses.slice(0, 10).map((a: any) => ({
        id: a.id,
        url: a.url,
        title: a.title,
        status: a.status_code === 200 ? 'success' as const : 'error' as const,
        timestamp: a.created_at,
        processingTime: a.processing_time
      }));

      setStats({
        totalAnalyses,
        avgProcessingTime,
        totalLinks,
        totalImages,
        successRate,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData: ChartData[] = [
    { name: 'Total Analyses', value: stats.totalAnalyses, color: '#0088FE' },
    { name: 'Total Links', value: stats.totalLinks, color: '#00C49F' },
    { name: 'Total Images', value: stats.totalImages, color: '#FFBB28' },
    { name: 'Success Rate', value: stats.successRate, color: '#FF8042' },
  ];

  const performanceData = stats.recentActivity.slice(0, 7).map((activity, index) => ({
    name: `Analysis ${index + 1}`,
    processingTime: activity.processingTime,
    status: activity.status
  }));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive overview of your web analysis activities
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Analyses
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalAnalyses.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Assessment />
                </Avatar>
              </Box>
              <Box mt={2}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(stats.totalAnalyses / 100 * 100, 100)}
                  color="primary"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Processing Time
                  </Typography>
                  <Typography variant="h4">
                    {stats.avgProcessingTime.toFixed(2)}s
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Speed />
                </Avatar>
              </Box>
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  {stats.avgProcessingTime < 2 ? 'Excellent' :
                   stats.avgProcessingTime < 5 ? 'Good' : 'Needs improvement'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Links Found
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalLinks.toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <LinkIcon />
                </Avatar>
              </Box>
              <Box mt={2}>
                <Chip
                  label={`${(stats.totalLinks / Math.max(stats.totalAnalyses, 1)).toFixed(1)} per analysis`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4">
                    {stats.successRate.toFixed(1)}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: stats.successRate > 80 ? 'success.main' : 'warning.main' }}>
                  <TrendingUp />
                </Avatar>
              </Box>
              <Box mt={2}>
                <LinearProgress
                  variant="determinate"
                  value={stats.successRate}
                  color={stats.successRate > 80 ? 'success' : 'warning'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                Analysis Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Performance Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="processingTime"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Card component={RouterLink} to="/analyze" sx={{ textDecoration: 'none' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Web color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">Quick Analysis</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analyze a single webpage instantly
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CloudUpload color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6">Batch Analysis</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analyze multiple URLs at once
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              <History sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Activity
            </Typography>
            <Button size="small" startIcon={<FilterList />}>
              Filter
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>URL</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Processing Time</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentActivity.map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {activity.url}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {activity.title || 'No title'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.status}
                        size="small"
                        color={activity.status === 'success' ? 'success' : 'error'}
                        variant="outlined"
                        icon={activity.status === 'success' ? <CheckCircle /> : <Error />}
                      />
                    </TableCell>
                    <TableCell>{activity.processingTime.toFixed(2)}s</TableCell>
                    <TableCell>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" component={RouterLink} to={`/analysis/${activity.id}`}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export">
                        <IconButton size="small">
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* System Status */}
      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Backend API</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Database</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Cache (Redis)</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">AI Analysis</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
