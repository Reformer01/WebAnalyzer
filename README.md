# WebAnalyzer Pro

A modern web analysis tool for extracting and analyzing web content with a beautiful UI.

## 🚀 Current Status

✅ **Frontend**: React + TypeScript + Material-UI (Running on port 5174)
✅ **Backend**: FastAPI + BeautifulSoup4 (Running on port 8000)
✅ **API**: RESTful endpoints with CORS enabled
✅ **Features**: URL analysis, content extraction, link counting

## ✨ Features

- 🚀 Modern, responsive dashboard
- 🌐 Webpage content extraction and analysis
- 📊 Real-time statistics (links, images, content length)
- ⚡ Fast and efficient processing using BeautifulSoup4
- 🔒 Secure API with CORS protection
- 📱 Mobile-friendly responsive design

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Material-UI, Vite
- **Backend**: FastAPI, BeautifulSoup4, Requests, Uvicorn
- **Styling**: Material-UI, Emotion, CSS Modules

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ ✅
- Python 3.8+ ✅

### 1. Clone & Setup
```bash
# The project is already set up in your current directory
cd WebAnalyzerPro
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
# Opens: http://localhost:5174
```

### 3. Start Backend
```bash
cd backend
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Opens: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 4. Test the API
```bash
py test_api.py
```

## 🌐 Access Points

- **Frontend App**: http://localhost:5174
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## 📋 API Endpoints

### GET /
Returns API information
```json
{"message": "Welcome to WebAnalyzer Pro API"}
```

### POST /api/analyze
Analyzes a webpage and returns structured data
**Request:**
```json
{"url": "https://example.com"}
```

**Response:**
```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "Extracted webpage content...",
  "stats": {
    "link_count": 1,
    "image_count": 0,
    "content_length": 125
  },
  "sample_links": [...]
}
```

## 🎨 UI Components

- **Dashboard**: Overview and quick access
- **Analyzer**: URL input and analysis results
- **Settings**: Configuration and preferences
- **Navigation**: Responsive navbar with theme toggle

## 🔧 Development

### Project Structure
```
WebAnalyzerPro/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application pages
│   │   └── App.tsx     # Main application
│   └── package.json
├── backend/            # FastAPI backend
│   ├── main.py         # API endpoints
│   └── requirements.txt
└── README.md
```

### Available Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

**Backend:**
```bash
py -m uvicorn main:app --reload  # Start with auto-reload
py test_api.py                   # Test API endpoints
```

## 🔮 Next Steps

- [ ] Add user authentication
- [ ] Implement data export (PDF, JSON, CSV)
- [ ] Add analysis history and caching
- [ ] Enhance content analysis with AI
- [ ] Add batch URL processing
- [ ] Implement dark/light theme persistence

## 🐛 Troubleshooting

**Frontend Issues:**
- Clear `node_modules` and run `npm install`
- Check if port 5173/5174 is available
- Verify TypeScript configuration

**Backend Issues:**
- Ensure virtual environment is activated
- Check if port 8000 is available
- Verify Python dependencies: `pip install -r requirements.txt`

## 📄 License

MIT

---

**Status**: ✅ Both frontend and backend are running successfully!
