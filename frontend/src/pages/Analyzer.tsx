import { useState, type KeyboardEvent, type ChangeEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
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
  Grid,
  Collapse,
  IconButton,
  Switch,
  FormGroup,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Autocomplete,
  Stack,
  LinearProgress,
  Pagination,
  InputAdornment,
  DialogContentText,
} from '@mui/material';
import {
  Link as LinkIcon,
  Image as ImageIcon,
  Article,
  ExpandMore,
  Settings as SettingsIcon,
  Code,
  Language,
  PhotoLibrary,
  Description,
  Title,
  SettingsInputComponent,
  OpenInNew,
  ExpandLess,
  ExpandMore as ExpandMoreIcon,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  CloudUpload,
  Add,
  Delete,
  PlayArrow,
  Stop,
  Timeline,
  Assessment,
  BatchPrediction,
  Web,
  Analytics,
  Speed,
  Memory,
  Storage,
  Psychology,
  Search,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  GridView,
  Close,
  Cloud,
  Check,
  ErrorOutline,
  AccessTime,
  TrendingUp,
  TrendingDown,
  HorizontalRule,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios, { AxiosError } from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

interface AnalysisSettings {
  include_metadata: boolean;
  include_links: boolean;
  include_images: boolean;
  include_content: boolean;
  include_ai_analysis: boolean;
  include_seo_analysis: boolean;
  max_content_length: number;
  max_links: number;
  include_headers: boolean;
  include_meta_tags: boolean;
  include_performance: boolean;
  follow_redirects: boolean;
  export_format?: string;
}

interface AnalysisResult {
  id?: number;
  url: string;
  final_url: string;
  status_code: number;
  title: string;
  timestamp: string;
  analysis_settings: AnalysisSettings;
  metadata?: {
    meta_tags: Record<string, string>;
    opengraph: Record<string, string>;
    twitter: Record<string, string>;
    canonical: string | null;
    language: string;
    charset: string | null;
  };
  links?: {
    all: Array<{
      text: string;
      href: string;
      full_url: string;
      title: string;
      rel: string[];
      target: string;
      is_internal: boolean;
    }>;
    internal: any[];
    external: any[];
    total: number;
    total_internal: number;
    total_external: number;
  };
  images?: {
    images: Array<{
      src: string;
      full_url: string;
      alt: string;
      title: string;
      width: string | null;
      height: string | null;
      loading: string;
    }>;
    total: number;
    with_alt: number;
    without_alt: number;
  };
  content?: {
    text: string;
    length: number;
    truncated: boolean;
  };
  headings?: Record<string, Array<{
    text: string;
    id: string | null;
  }>>;
  stats: {
    processing_time: number;
    content_length: number;
    link_count: number;
    image_count: number;
  };
  ai_insights?: {
    summary: string;
    topics: string[];
    sentiment: string;
    readability_score: number;
    key_insights: string[];
    seo_suggestions: string[];
    content_quality: string;
    target_audience: string;
  };
  seo_analysis?: {
    score: number;
    grade: string;
    issues: string[];
    recommendations: string[];
  };
  performance?: {
    response_time: number;
    content_length: number;
    content_type: string;
    server: string;
    encoding: string;
    redirect_count: number;
  };
}

interface BatchResult {
  url: string;
  success: boolean;
  result?: AnalysisResult;
  error?: string;
  processing_time?: number;
}

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:before': {
    display: 'none',
  },
}));

const StatChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const Analyzer = () => {
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'batch'>('single');
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10);

  // Settings state
  const [settings, setSettings] = useState<AnalysisSettings>({
    include_metadata: true,
    include_links: true,
    include_images: true,
    include_content: true,
    include_ai_analysis: true,
    include_seo_analysis: true,
    max_content_length: 5000,
    max_links: 50,
    include_headers: true,
    include_meta_tags: true,
    include_performance: true,
    follow_redirects: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addUrlField = () => {
    setUrls(prev => [...prev, '']);
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      setUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    setUrls(prev => prev.map((url, i) => i === index ? value : url));
  };

  const analyzeUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = '/api/analyze';
      const processedUrl = url.startsWith('http') ? url : `https://${url}`;

      console.log(`🔄 Making request to: ${apiUrl}`, { url: processedUrl, settings });

      // Check backend connectivity first
      try {
        await axios.get('/health', { timeout: 5000 });
        console.log('✅ Backend is reachable');
      } catch (connectError) {
        console.error('❌ Backend connection error:', connectError);
        throw new Error('Could not connect to the backend server. Please make sure the backend is running on http://localhost:8000');
      }

      const response = await axios.post(apiUrl, {
        url: processedUrl,
        settings: settings
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout for enhanced analysis
      });

      console.log('✅ Request successful, status:', response.status);
      setResult(response.data);
      setActiveTab(0);
    } catch (error) {
      const err = error as AxiosError;
      console.error('❌ Error analyzing URL:', err);

      let errorMessage = 'Failed to analyze the URL. ';

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage += 'Invalid URL or the server could not process the request.';
        } else if (err.response.status === 404) {
          errorMessage += 'The requested resource was not found on the server.';
        } else if (err.response.status >= 500) {
          errorMessage += 'Server error. Please try again later.';
        }
      } else if (err.request) {
        errorMessage += 'Could not connect to the server. Please check your internet connection and try again.';
      } else {
        errorMessage += 'An error occurred while setting up the request.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeBatch = async () => {
    const validUrls = urls.filter(url => url.trim()).map(url =>
      url.startsWith('http') ? url : `https://${url}`
    );

    if (validUrls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }

    setBatchLoading(true);
    setError('');
    setBatchResults([]);

    try {
      const response = await axios.post('/api/analyze/batch', {
        urls: validUrls,
        settings: settings
      }, {
        timeout: 300000 // 5 minutes timeout for batch processing
      });

      setBatchResults(response.data.results);
      setBatchDialogOpen(true);
    } catch (error) {
      const err = error as AxiosError;
      console.error('❌ Error in batch analysis:', err);
      setError('Batch analysis failed. Please try again.');
    } finally {
      setBatchLoading(false);
    }
  };

  const exportResults = async (format: string) => {
    if (!result || !result.analysis_id) return;

    try {
      const response = await axios.post(`/api/export/${result.analysis_id}`, format, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      saveAs(blob, `analysis_${result.analysis_id}.${format}`);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Export failed. Please try again.');
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return <TrendingUp color="success" />;
      case 'negative': return <TrendingDown color="error" />;
      default: return <HorizontalRule color="action" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'default';
    }
  };

  const renderSettingsPanel = () => (
    <Collapse in={showSettings} timeout="auto" unmountOnExit>
      <Paper sx={{ p: 3, mt: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Analysis Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Content Analysis</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_metadata}
                    onChange={(e) => setSettings({...settings, include_metadata: e.target.checked})}
                  />
                }
                label="Include Metadata"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_links}
                    onChange={(e) => setSettings({...settings, include_links: e.target.checked})}
                  />
                }
                label="Include Links"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_images}
                    onChange={(e) => setSettings({...settings, include_images: e.target.checked})}
                  />
                }
                label="Include Images"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_content}
                    onChange={(e) => setSettings({...settings, include_content: e.target.checked})}
                  />
                }
                label="Include Content"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_headers}
                    onChange={(e) => setSettings({...settings, include_headers: e.target.checked})}
                  />
                }
                label="Include Headers"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Advanced Analysis</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_ai_analysis}
                    onChange={(e) => setSettings({...settings, include_ai_analysis: e.target.checked})}
                  />
                }
                label={
                  <Box>
                    <Typography>AI-Powered Analysis</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get intelligent insights about content
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_seo_analysis}
                    onChange={(e) => setSettings({...settings, include_seo_analysis: e.target.checked})}
                  />
                }
                label={
                  <Box>
                    <Typography>SEO Analysis</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Comprehensive SEO recommendations
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.include_performance}
                    onChange={(e) => setSettings({...settings, include_performance: e.target.checked})}
                  />
                }
                label="Performance Metrics"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.follow_redirects}
                    onChange={(e) => setSettings({...settings, follow_redirects: e.target.checked})}
                  />
                }
                label="Follow Redirects"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>Max Content Length: {settings.max_content_length.toLocaleString()} characters</Typography>
            <Slider
              value={settings.max_content_length}
              onChange={(_, value) => setSettings({...settings, max_content_length: value as number})}
              min={1000}
              max={20000}
              step={1000}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value.toLocaleString()} chars`}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>Max Links to Analyze: {settings.max_links}</Typography>
            <Slider
              value={settings.max_links}
              onChange={(_, value) => setSettings({...settings, max_links: value as number})}
              min={10}
              max={200}
              step={10}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Paper>
    </Collapse>
  );

  const renderOverview = () => (
    <Box>
      {/* Basic Information */}
      <StyledAccordion expanded={expandedSections.basic} onChange={() => toggleSection('basic')} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography><Language sx={{ verticalAlign: 'middle', mr: 1 }} /> Basic Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Original URL</Typography>
              <Typography paragraph sx={{ wordBreak: 'break-all' }}>{result?.url}</Typography>

              {result?.final_url !== result?.url && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Final URL (after redirects)</Typography>
                  <Typography paragraph sx={{ wordBreak: 'break-all' }}>{result?.final_url}</Typography>
                </>
              )}

              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip
                label={`${result?.status_code} ${result?.status_code === 200 ? 'OK' : result?.status_code === 404 ? 'Not Found' : 'Error'}`}
                color={result?.status_code === 200 ? 'success' : result?.status_code === 404 ? 'warning' : 'error'}
                size="small"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Page Title</Typography>
              <Typography paragraph>{result?.title}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Analysis Timestamp</Typography>
              <Typography paragraph>{new Date(result?.timestamp || '').toLocaleString()}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Processing Time</Typography>
              <Typography paragraph>{result?.stats.processing_time.toFixed(2)} seconds</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </StyledAccordion>

      {/* Performance Metrics */}
      {result?.performance && (
        <StyledAccordion expanded={expandedSections.performance} onChange={() => toggleSection('performance')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography><Speed sx={{ verticalAlign: 'middle', mr: 1 }} /> Performance Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Response Time</Typography>
                <Typography paragraph>{result.performance.response_time.toFixed(3)}s</Typography>

                <Typography variant="subtitle2" color="text.secondary">Content Length</Typography>
                <Typography paragraph>{result.performance.content_length.toLocaleString()} bytes</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Content Type</Typography>
                <Typography paragraph>{result.performance.content_type}</Typography>

                <Typography variant="subtitle2" color="text.secondary">Server</Typography>
                <Typography paragraph>{result.performance.server || 'Unknown'}</Typography>

                <Typography variant="subtitle2" color="text.secondary">Redirects</Typography>
                <Typography paragraph>{result.performance.redirect_count} redirects</Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </StyledAccordion>
      )}

      {/* SEO Analysis */}
      {result?.seo_analysis && (
        <StyledAccordion expanded={expandedSections.seo} onChange={() => toggleSection('seo')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography><Assessment sx={{ verticalAlign: 'middle', mr: 1 }} /> SEO Analysis</Typography>
            <Chip
              label={`Grade: ${result.seo_analysis.grade} (${result.seo_analysis.score}/100)`}
              color={result.seo_analysis.score >= 80 ? 'success' : result.seo_analysis.score >= 60 ? 'warning' : 'error'}
              size="small"
              sx={{ ml: 2 }}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Issues Found</Typography>
                {result.seo_analysis.issues.length > 0 ? (
                  <List dense>
                    {result.seo_analysis.issues.map((issue, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={issue} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="success.main">No issues found! 🎉</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Recommendations</Typography>
                {result.seo_analysis.recommendations.length > 0 ? (
                  <List dense>
                    {result.seo_analysis.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="success.main">No recommendations needed!</Typography>
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </StyledAccordion>
      )}

      {/* AI Insights */}
      {result?.ai_insights && (
        <StyledAccordion expanded={expandedSections.ai} onChange={() => toggleSection('ai')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography><Psychology sx={{ verticalAlign: 'middle', mr: 1 }} /> AI Insights</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Summary</Typography>
                <Typography paragraph>{result.ai_insights.summary}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Topics</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {result.ai_insights.topics.map((topic, index) => (
                    <Chip key={index} label={topic} variant="outlined" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Content Analysis</Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Sentiment:</Typography>
                    <Chip
                      icon={getSentimentIcon(result.ai_insights.sentiment)}
                      label={result.ai_insights.sentiment}
                      color={getSentimentColor(result.ai_insights.sentiment) as any}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Readability:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={result.ai_insights.readability_score * 10}
                        sx={{ width: 100 }}
                      />
                      <Typography>{result.ai_insights.readability_score}/10</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Quality:</Typography>
                    <Chip
                      label={result.ai_insights.content_quality}
                      color={result.ai_insights.content_quality === 'high' ? 'success' : 'warning'}
                    />
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Key Insights</Typography>
                <List dense>
                  {result.ai_insights.key_insights.map((insight, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary={insight} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>SEO Suggestions</Typography>
                <List dense>
                  {result.ai_insights.seo_suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </AccordionDetails>
        </StyledAccordion>
      )}

      {/* Metadata */}
      {result?.metadata && (
        <StyledAccordion expanded={expandedSections.metadata} onChange={() => toggleSection('metadata')}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography><Title sx={{ verticalAlign: 'middle', mr: 1 }} /> Metadata</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" color="text.secondary">Title</Typography>
            <Typography paragraph>{result.title}</Typography>

            <Typography variant="subtitle2" color="text.secondary">Language</Typography>
            <Typography paragraph>{result.metadata?.language || 'Not specified'}</Typography>

            <Typography variant="subtitle2" color="text.secondary">Character Set</Typography>
            <Typography paragraph>{result.metadata?.charset || 'Not specified'}</Typography>

            {result.metadata?.canonical && (
              <>
                <Typography variant="subtitle2" color="text.secondary">Canonical URL</Typography>
                <Typography paragraph>{result.metadata.canonical}</Typography>
              </>
            )}

            {result.metadata?.opengraph && Object.keys(result.metadata.opengraph).length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>OpenGraph Tags</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Property</TableCell>
                        <TableCell>Content</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(result.metadata.opengraph).map(([key, value]) => (
                        <TableRow key={`og-${key}`}>
                          <TableCell><code>og:{key}</code></TableCell>
                          <TableCell>{String(value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </AccordionDetails>
        </StyledAccordion>
      )}
    </Box>
  );

  const renderContent = () => (
    <Box>
      {result?.content && (
        <StyledAccordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography><Description sx={{ verticalAlign: 'middle', mr: 1 }} /> Page Content</Typography>
            <Chip
              label={`${result.content.length.toLocaleString()} characters`}
              size="small"
              sx={{ ml: 2 }}
            />
            {result.content.truncated && (
              <Chip
                label="Truncated"
                color="warning"
                size="small"
                sx={{ ml: 1 }}
                icon={<Warning fontSize="small" />}
              />
            )}
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                maxHeight: '500px',
                overflow: 'auto',
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1
              }}
            >
              {result.content.text}
            </Box>
          </AccordionDetails>
        </StyledAccordion>
      )}

      {result?.headings && (
        <StyledAccordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography><Title sx={{ verticalAlign: 'middle', mr: 1 }} /> Headings Structure</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {Object.entries(result.headings).map(([level, headings]) => (
              <Box key={level} sx={{ ml: (parseInt(level[1]) - 1) * 2 }}>
                <Typography variant="subtitle1" sx={{ mt: 1, mb: 0.5 }}>
                  {level.toUpperCase()} ({headings.length})
                </Typography>
                <List dense>
                  {headings.map((h: any, i: number) => (
                    <ListItem key={`${level}-${i}`} disableGutters>
                      <ListItemText
                        primary={h.text}
                        secondary={h.id ? `#${h.id}` : ''}
                        primaryTypographyProps={{
                          variant: level as any,
                          component: 'div',
                          sx: {
                            fontSize: `${Math.max(1, 1.5 - (parseInt(level[1]) * 0.15))}rem`,
                            lineHeight: 1.2,
                            my: 0.5
                          }
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary',
                          sx: { ml: 1 }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </AccordionDetails>
        </StyledAccordion>
      )}
    </Box>
  );

  const renderLinks = () => (
    <Box>
      {result?.links && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Links Analysis</Typography>
            <Box>
              <StatChip
                label={`${result.links.total.toLocaleString()} total`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <StatChip
                label={`${result.links.total_internal} internal`}
                color="success"
                variant="outlined"
                size="small"
              />
              <StatChip
                label={`${result.links.total_external} external`}
                color="info"
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${result.links.all.length})`} />
            <Tab label={`Internal (${result.links.internal.length})`} />
            <Tab label={`External (${result.links.external.length})`} />
          </Tabs>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Text</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Target</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeTab === 0 ? result.links.all :
                  activeTab === 1 ? result.links.internal : result.links.external).map((link, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{link.text || <em>No text</em>}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <a
                          href={link.full_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          {link.href}
                        </a>
                        <IconButton size="small" href={link.full_url} target="_blank" rel="noopener">
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={link.is_internal ? 'Internal' : 'External'}
                        size="small"
                        color={link.is_internal ? 'success' : 'info'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{link.title || '-'}</TableCell>
                    <TableCell>{link.target || '_self'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );

  const renderImages = () => (
    <Box>
      {result?.images && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Images Analysis</Typography>
            <Box>
              <StatChip
                label={`${result.images.total} total`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <StatChip
                label={`${result.images.with_alt} with alt text`}
                color="success"
                variant="outlined"
                size="small"
                icon={result.images.with_alt === result.images.total ? <CheckCircle /> : <Warning />}
              />
              {result.images.without_alt > 0 && (
                <StatChip
                  label={`${result.images.without_alt} missing alt text`}
                  color="warning"
                  variant="outlined"
                  size="small"
                  icon={<Warning />}
                />
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            {result.images.images.map((img, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 150,
                      maxHeight: 200,
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={img.full_url}
                      alt={img.alt || 'No alt text'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {img.src.split('/').pop()}
                    </Typography>
                    {img.alt ? (
                      <Tooltip title={img.alt}>
                        <Typography variant="caption" noWrap display="block">
                          {img.alt}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="error">
                        No alt text
                      </Typography>
                    )}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {img.width && img.height ? `${img.width}×${img.height}px` : 'Size unknown'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );

  const renderSEOAnalysis = () => (
    <Box>
      {result?.seo_analysis && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">SEO Analysis Results</Typography>
              <Chip
                label={`Grade: ${result.seo_analysis.grade}`}
                color={result.seo_analysis.score >= 80 ? 'success' : result.seo_analysis.score >= 60 ? 'warning' : 'error'}
                size="large"
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Issues Found</Typography>
                {result.seo_analysis.issues.length > 0 ? (
                  <List dense>
                    {result.seo_analysis.issues.map((issue, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorOutline color="error" />
                        </ListItemIcon>
                        <ListItemText primary={issue} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="success.main">No issues found! 🎉</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Recommendations</Typography>
                {result.seo_analysis.recommendations.length > 0 ? (
                  <List dense>
                    {result.seo_analysis.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="success.main">No recommendations needed!</Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderAIInsights = () => (
    <Box>
      {result?.ai_insights && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
              AI-Powered Content Analysis
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Summary</Typography>
                <Typography paragraph>{result.ai_insights.summary}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Main Topics</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {result.ai_insights.topics.map((topic, index) => (
                    <Chip key={index} label={topic} variant="outlined" />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Analysis Metrics</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Sentiment:</Typography>
                    <Chip
                      icon={getSentimentIcon(result.ai_insights.sentiment)}
                      label={result.ai_insights.sentiment}
                      color={getSentimentColor(result.ai_insights.sentiment) as any}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Readability Score:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={result.ai_insights.readability_score * 10}
                        sx={{ width: 100 }}
                      />
                      <Typography>{result.ai_insights.readability_score}/10</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Content Quality:</Typography>
                    <Chip
                      label={result.ai_insights.content_quality}
                      color={result.ai_insights.content_quality === 'high' ? 'success' : 'warning'}
                    />
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Key Insights</Typography>
                <List dense>
                  {result.ai_insights.key_insights.map((insight, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary={insight} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>SEO Suggestions</Typography>
                <List dense>
                  {result.ai_insights.seo_suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderPerformance = () => (
    <Box>
      {result?.performance && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
              Performance Metrics
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Response Metrics</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Response Time:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {result.performance.response_time.toFixed(3)}s
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Content Length:</Typography>
                    <Typography variant="body2">
                      {result.performance.content_length.toLocaleString()} bytes
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Content Type:</Typography>
                    <Typography variant="body2">{result.performance.content_type}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Server Information</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Server:</Typography>
                    <Typography variant="body2">{result.performance.server || 'Unknown'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Encoding:</Typography>
                    <Typography variant="body2">{result.performance.encoding}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Redirects:</Typography>
                    <Typography variant="body2">{result.performance.redirect_count} redirects</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderRawData = () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Raw Analysis Data</Typography>
      <Box
        component="pre"
        sx={{
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 1,
          maxHeight: '500px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '0.8rem'
        }}
      >
        {JSON.stringify(result, null, 2)}
      </Box>
    </Paper>
  );

  const renderBatchDialog = () => (
    <Dialog open={batchDialogOpen} onClose={() => setBatchDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Batch Analysis Results</Typography>
          <Chip
            label={`${batchResults.filter(r => r.success).length}/${batchResults.length} successful`}
            color={batchResults.filter(r => r.success).length === batchResults.length ? 'success' : 'warning'}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {batchResults.map((batchResult, index) => (
            <ListItem key={index} divider>
              <ListItemIcon>
                {batchResult.success ? (
                  <CheckCircle color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" noWrap sx={{ maxWidth: 300 }}>
                      {batchResult.url}
                    </Typography>
                    {batchResult.processing_time && (
                      <Chip size="small" label={`${batchResult.processing_time.toFixed(2)}s`} />
                    )}
                  </Box>
                }
                secondary={batchResult.error || `${batchResult.result?.title || 'No title'}`}
              />
              {batchResult.success && (
                <Box>
                  <IconButton size="small" component="a" href={batchResult.result?.url} target="_blank">
                    <OpenInNew />
                  </IconButton>
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setBatchDialogOpen(false)}>Close</Button>
        <Button variant="contained" onClick={() => {
          // Export batch results
          const csvContent = batchResults.map(r =>
            `${r.url},${r.success},${r.error || ''},${r.processing_time || ''}`
          ).join('\n');
          const blob = new Blob([`URL,Success,Error,Processing Time\n${csvContent}`], { type: 'text/csv' });
          saveAs(blob, `batch_analysis_${Date.now()}.csv`);
        }}>
          Export CSV
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" component="h1">
            <Web sx={{ mr: 1, verticalAlign: 'middle' }} />
            WebAnalyzer Pro 10x
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setShowSettings(!showSettings)}
              size="small"
              sx={{ mr: 1 }}
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<BatchPrediction />}
              onClick={() => setViewMode(viewMode === 'single' ? 'batch' : 'single')}
              size="small"
            >
              {viewMode === 'single' ? 'Batch Mode' : 'Single Mode'}
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          Advanced web analysis with AI insights, batch processing, and comprehensive reporting.
        </Typography>

        {/* Feature Chips */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip icon={<Psychology />} label="AI-Powered Analysis" color="primary" variant="outlined" />
          <Chip icon={<Storage />} label="Redis Caching" color="success" variant="outlined" />
          <Chip icon={<Assessment />} label="SEO Analysis" color="info" variant="outlined" />
          <Chip icon={<Memory />} label="Database Storage" color="warning" variant="outlined" />
          <Chip icon={<Cloud />} label="Multiple Export Formats" color="secondary" variant="outlined" />
        </Box>
      </Box>

      {/* Mode Selection */}
      <Tabs value={viewMode === 'single' ? 0 : 1} onChange={(_, newValue) => setViewMode(newValue === 0 ? 'single' : 'batch')} sx={{ mb: 3 }}>
        <Tab icon={<Web />} label="Single Analysis" />
        <Tab icon={<BatchPrediction />} label="Batch Analysis" />
      </Tabs>

      {/* Single Analysis Mode */}
      {viewMode === 'single' && (
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Web color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={analyzeUrl}
              disabled={isLoading || !url.trim()}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {renderSettingsPanel()}
        </Paper>
      )}

      {/* Batch Analysis Mode */}
      {viewMode === 'batch' && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              <BatchPrediction sx={{ mr: 1, verticalAlign: 'middle' }} />
              Batch URL Analysis
            </Typography>
            <Button startIcon={<Add />} onClick={addUrlField} variant="outlined" size="small">
              Add URL
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Enter multiple URLs to analyze them all at once. Each URL will be processed independently.
          </Typography>

          <Grid container spacing={2}>
            {urls.map((url, index) => (
              <Grid item xs={12} md={6} key={index}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={`URL ${index + 1}`}
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  disabled={batchLoading}
                  InputProps={{
                    endAdornment: urls.length > 1 ? (
                      <IconButton size="small" onClick={() => removeUrlField(index)}>
                        <Delete />
                      </IconButton>
                    ) : null,
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={analyzeBatch}
              disabled={batchLoading || urls.filter(u => u.trim()).length === 0}
              startIcon={batchLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
            >
              {batchLoading ? 'Processing Batch...' : `Analyze ${urls.filter(u => u.trim()).length} URLs`}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      )}

      {/* Results Display */}
      {result && (
        <Box>
          {/* Results Header */}
          <Paper sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">Analysis Results</Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.url} • {result.stats.processing_time.toFixed(2)}s processing time
                </Typography>
              </Box>
              <Box>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportResults('pdf')}
                  sx={{ mr: 1 }}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportResults('excel')}
                  sx={{ mr: 1 }}
                >
                  Excel
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportResults('csv')}
                >
                  CSV
                </Button>
              </Box>
            </Box>

            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
              <Tab label="Content" icon={<Description />} iconPosition="start" disabled={!result.content} />
              <Tab label="Links" icon={<LinkIcon />} iconPosition="start" disabled={!result.links} />
              <Tab label="Images" icon={<ImageIcon />} iconPosition="start" disabled={!result.images} />
              <Tab label="SEO" icon={<Assessment />} iconPosition="start" disabled={!result.seo_analysis} />
              <Tab label="AI Insights" icon={<Psychology />} iconPosition="start" disabled={!result.ai_insights} />
              <Tab label="Performance" icon={<Speed />} iconPosition="start" disabled={!result.performance} />
              <Tab label="Raw Data" icon={<Code />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && renderOverview()}
            {activeTab === 1 && renderContent()}
            {activeTab === 2 && renderLinks()}
            {activeTab === 3 && renderImages()}
            {activeTab === 4 && renderSEOAnalysis()}
            {activeTab === 5 && renderAIInsights()}
            {activeTab === 6 && renderPerformance()}
            {activeTab === 7 && renderRawData()}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setResult(null);
                setUrl('');
                setActiveTab(0);
              }}
              startIcon={<RefreshIcon />}
            >
              Analyze Another Page
            </Button>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                Analysis completed in {result.stats.processing_time.toFixed(2)}s
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                  saveAs(blob, `analysis_${Date.now()}.json`);
                }}
                startIcon={<DownloadIcon />}
              >
                Export JSON
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {renderBatchDialog()}
    </Box>
  );
};

export default Analyzer;
