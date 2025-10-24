from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
import requests
from bs4 import BeautifulSoup
import uvicorn
import re
from datetime import datetime
from urllib.parse import urlparse, urljoin
import json
import os
from contextlib import asynccontextmanager

# Import our new modules
from models import Base, engine, Analysis, User
from cache import CacheManager
from ai_analyzer import AIAnalyzer
from export import ExportManager
from sqlalchemy.orm import Session
import secrets
from passlib.context import CryptContext
import redis

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield

# Settings Model
class AnalysisSettings(BaseModel):
    include_metadata: bool = True
    include_links: bool = True
    include_images: bool = True
    include_content: bool = True
    include_ai_analysis: bool = True
    include_seo_analysis: bool = True
    max_content_length: int = 5000
    max_links: int = 50
    include_headers: bool = True
    include_meta_tags: bool = True
    include_performance: bool = True
    follow_redirects: bool = True
    export_format: Optional[str] = None  # pdf, csv, excel, json

# Authentication models
class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Initialize components
cache_manager = CacheManager()
ai_analyzer = AIAnalyzer()
export_manager = ExportManager()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBasic()

# Database dependency
def get_db():
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

app = FastAPI(
    title="WebAnalyzer Pro 10x",
    description="Advanced web analysis with AI insights, caching, and comprehensive reporting",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: str
    settings: Optional[AnalysisSettings] = Field(default_factory=AnalysisSettings)

class BatchAnalysisRequest(BaseModel):
    urls: List[str]
    settings: Optional[AnalysisSettings] = Field(default_factory=AnalysisSettings)

class ExportRequest(BaseModel):
    analysis_id: int
    format: str  # pdf, csv, excel, json

@app.get("/")
async def root():
    return {
        "message": "Welcome to WebAnalyzer Pro 10x API",
        "version": "2.0.0",
        "features": [
            "AI-powered analysis",
            "Redis caching",
            "Database persistence",
            "Multiple export formats",
            "Batch processing",
            "SEO analysis"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with system status."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "cache": cache_manager.get_stats(),
        "ai_enabled": ai_analyzer.is_enabled()
    }

@app.post("/auth/register")
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user exists
    db_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()

    if db_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"message": "User created successfully", "user_id": db_user.id}

@app.post("/auth/login")
async def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return token."""
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token (in production, use JWT)
    token = secrets.token_urlsafe(32)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}

def extract_metadata(soup, base_url: str) -> Dict[str, Any]:
    """Extract metadata from the page."""
    meta_tags = {}
    for meta in soup.find_all('meta'):
        name = meta.get('name') or meta.get('property') or meta.get('http-equiv')
        if name and meta.get('content'):
            meta_tags[name.lower()] = meta['content']

    # Extract OpenGraph data
    og_data = {}
    for meta in soup.find_all('meta', property=re.compile(r'^og:')):
        og_data[meta['property'][3:]] = meta['content']

    # Extract Twitter card data
    twitter_data = {}
    for meta in soup.find_all('meta', attrs={'name': re.compile(r'^twitter:', re.I)}):
        twitter_data[meta['name'].lower()] = meta.get('content', '')

    # Extract canonical URL
    canonical = soup.find('link', rel='canonical')

    return {
        'meta_tags': meta_tags,
        'opengraph': og_data,
        'twitter': twitter_data,
        'canonical': canonical['href'] if canonical else None,
        'language': soup.get('lang') or soup.html.get('lang', 'en'),
        'charset': soup.meta.get('charset') if soup.meta else None,
        'title': soup.title.string if soup.title else None
    }

def extract_links(soup, base_url: str, max_links: int = 50) -> Dict[str, Any]:
    """Extract and categorize links from the page."""
    all_links = []
    internal_links = []
    external_links = []

    base_domain = urlparse(base_url).netloc

    for link in soup.find_all('a', href=True):
        href = link['href']
        full_url = urljoin(base_url, href)
        is_internal = urlparse(full_url).netloc == base_domain

        link_data = {
            'text': link.get_text(strip=True)[:100],
            'href': href,
            'full_url': full_url,
            'title': link.get('title', ''),
            'rel': link.get('rel', []),
            'target': link.get('target', ''),
            'is_internal': is_internal
        }

        all_links.append(link_data)
        if is_internal:
            internal_links.append(link_data)
        else:
            external_links.append(link_data)

    return {
        'all': all_links[:max_links],
        'internal': internal_links[:max_links//2],
        'external': external_links[:max_links//2],
        'total': len(all_links),
        'total_internal': len(internal_links),
        'total_external': len(external_links)
    }

def extract_images(soup, base_url: str) -> Dict[str, Any]:
    """Extract images from the page."""
    images = []
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if src:
            images.append({
                'src': src,
                'full_url': urljoin(base_url, src),
                'alt': img.get('alt', ''),
                'title': img.get('title', ''),
                'width': img.get('width'),
                'height': img.get('height'),
                'loading': img.get('loading', 'eager')
            })

    return {
        'images': images[:100],  # Limit to first 100 images
        'total': len(images),
        'with_alt': len([img for img in images if img['alt']]),
        'without_alt': len([img for img in images if not img['alt']])
    }

def extract_headings(soup) -> Dict[str, Any]:
    """Extract and count heading levels."""
    headings = {}
    for level in range(1, 7):
        h_tags = soup.find_all(f'h{level}')
        headings[f'h{level}'] = [{
            'text': h.get_text(strip=True),
            'id': h.get('id')
        } for h in h_tags]
    return headings

def extract_performance_metrics(response) -> Dict[str, Any]:
    """Extract performance metrics."""
    return {
        'response_time': response.elapsed.total_seconds(),
        'content_length': len(response.content),
        'content_type': response.headers.get('content-type', ''),
        'server': response.headers.get('server', ''),
        'encoding': response.encoding,
        'redirect_count': len(response.history)
    }

@app.post("/api/analyze")
async def analyze_url(request: URLRequest, db: Session = Depends(get_db)):
    """Enhanced analysis endpoint with caching and AI insights."""
    print(f"📝 Received analysis request for: {request.url}")
    settings = request.settings or AnalysisSettings()

    # Check cache first
    cached_result = cache_manager.get(request.url, settings.dict())
    if cached_result:
        # Save to database if user is authenticated
        try:
            # In a real app, you'd get user from token
            # For now, we'll save as anonymous
            analysis_record = Analysis(
                url=request.url,
                final_url=cached_result.get('final_url', request.url),
                title=cached_result.get('title', ''),
                status_code=cached_result.get('status_code', 200),
                processing_time=cached_result.get('stats', {}).get('processing_time', 0),
                metadata=cached_result.get('metadata'),
                links=cached_result.get('links'),
                images=cached_result.get('images'),
                content=cached_result.get('content'),
                headings=cached_result.get('headings'),
                stats=cached_result.get('stats'),
                analysis_settings=settings.dict()
            )
            db.add(analysis_record)
            db.commit()
        except Exception as e:
            print(f"⚠️ Database save error: {e}")

        return cached_result

    try:
        # Fetch the webpage
        print(f"🌐 Fetching URL: {request.url}")
        response = requests.get(
            request.url,
            timeout=15,
            allow_redirects=settings.follow_redirects,
            headers={
                'User-Agent': 'WebAnalyzerPro/2.0 (Advanced Web Analysis Tool)'
            }
        )
        response.raise_for_status()

        final_url = response.url
        print(f"✅ Successfully fetched URL, status: {response.status_code}, final URL: {final_url}")

        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract basic information
        title = soup.title.string if soup.title else "No title found"
        print(f"📄 Page title: {title}")

        # Initialize result with basic info
        result = {
            'url': request.url,
            'final_url': final_url,
            'status_code': response.status_code,
            'title': title,
            'timestamp': datetime.utcnow().isoformat(),
            'analysis_settings': settings.dict(),
            'performance': extract_performance_metrics(response)
        }

        # Extract metadata if enabled
        if settings.include_metadata:
            result['metadata'] = extract_metadata(soup, final_url)

        # Extract links if enabled
        if settings.include_links:
            result['links'] = extract_links(soup, final_url, settings.max_links)

        # Extract images if enabled
        if settings.include_images:
            result['images'] = extract_images(soup, final_url)

        # Extract content if enabled
        if settings.include_content:
            # Remove scripts and styles
            for element in soup(["script", "style"]):
                element.decompose()

            # Get clean text content
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            content = '\n'.join(chunk for chunk in chunks if chunk)

            result['content'] = {
                'text': content[:settings.max_content_length],
                'length': len(content),
                'truncated': len(content) > settings.max_content_length
            }

        # Extract headers if enabled
        if settings.include_headers:
            result['headings'] = extract_headings(soup)

        # SEO Analysis
        if settings.include_seo_analysis and result.get('metadata') and result.get('content'):
            from ai_analyzer import AIAnalyzer
            ai = AIAnalyzer()
            result['seo_analysis'] = ai.analyze_seo(
                result['metadata'],
                result['content'],
                result['headings']
            )

        # AI Analysis
        if settings.include_ai_analysis and result.get('content') and ai_analyzer.is_enabled():
            try:
                ai_insights = await ai_analyzer.analyze_content(
                    result['content']['text'],
                    result['metadata'],
                    result['links'],
                    result['images']
                )
                result['ai_insights'] = ai_insights
            except Exception as e:
                print(f"⚠️ AI analysis failed: {e}")
                result['ai_insights'] = {"error": "AI analysis temporarily unavailable"}

        # Add stats
        result['stats'] = {
            'processing_time': (datetime.utcnow() - datetime.fromisoformat(result['timestamp'])).total_seconds(),
            'content_length': len(response.text),
            'link_count': len(result.get('links', {}).get('all', [])) if 'links' in result else 0,
            'image_count': len(result.get('images', {}).get('images', [])) if 'images' in result else 0,
            'cache_used': False
        }

        # Cache the result
        cache_manager.set(request.url, settings.dict(), result, ttl=3600)  # 1 hour cache

        # Save to database
        try:
            analysis_record = Analysis(
                url=request.url,
                final_url=final_url,
                title=title,
                status_code=response.status_code,
                processing_time=result['stats']['processing_time'],
                metadata=result.get('metadata'),
                links=result.get('links'),
                images=result.get('images'),
                content=result.get('content'),
                headings=result.get('headings'),
                stats=result.get('stats'),
                ai_insights=result.get('ai_insights'),
                analysis_settings=settings.dict()
            )
            db.add(analysis_record)
            db.commit()
            result['analysis_id'] = analysis_record.id
        except Exception as e:
            print(f"⚠️ Database save error: {e}")

        print(f"✅ Enhanced analysis complete for {request.url}")
        return result

    except requests.RequestException as e:
        print(f"❌ Request error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/analyze/batch")
async def analyze_batch(request: BatchAnalysisRequest, db: Session = Depends(get_db)):
    """Batch analysis for multiple URLs."""
    results = []
    settings = request.settings or AnalysisSettings()

    for url in request.urls:
        try:
            # Reuse the single analysis logic
            single_request = URLRequest(url=url, settings=settings)
            result = await analyze_url(single_request, db)
            results.append({"url": url, "success": True, "result": result})
        except Exception as e:
            results.append({"url": url, "success": False, "error": str(e)})

    return {
        "total": len(request.urls),
        "successful": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]]),
        "results": results
    }

@app.get("/api/analyses")
async def get_analyses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get analysis history from database."""
    analyses = db.query(Analysis).offset(skip).limit(limit).all()
    return [{
        "id": a.id,
        "url": a.url,
        "title": a.title,
        "status_code": a.status_code,
        "processing_time": a.processing_time,
        "created_at": a.created_at.isoformat(),
        "stats": a.stats
    } for a in analyses]

@app.get("/api/analysis/{analysis_id}")
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get specific analysis by ID."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "id": analysis.id,
        "url": analysis.url,
        "final_url": analysis.final_url,
        "title": analysis.title,
        "status_code": analysis.status_code,
        "processing_time": analysis.processing_time,
        "created_at": analysis.created_at.isoformat(),
        "metadata": analysis.metadata,
        "links": analysis.links,
        "images": analysis.images,
        "content": analysis.content,
        "headings": analysis.headings,
        "stats": analysis.stats,
        "ai_insights": analysis.ai_insights,
        "analysis_settings": analysis.analysis_settings
    }

@app.post("/api/export/{analysis_id}")
async def export_analysis(analysis_id: int, format: str, db: Session = Depends(get_db)):
    """Export analysis in various formats."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Convert analysis record to result format
    result = {
        "url": analysis.url,
        "final_url": analysis.final_url,
        "title": analysis.title,
        "status_code": analysis.status_code,
        "timestamp": analysis.created_at.isoformat(),
        "metadata": analysis.metadata,
        "links": analysis.links,
        "images": analysis.images,
        "content": analysis.content,
        "headings": analysis.headings,
        "stats": analysis.stats,
        "ai_insights": analysis.ai_insights,
        "analysis_settings": analysis.analysis_settings
    }

    # Generate filename
    timestamp = analysis.created_at.strftime("%Y%m%d_%H%M%S")
    filename = f"analysis_{analysis_id}_{timestamp}.{format}"

    try:
        if format.lower() == 'pdf':
            filepath = export_manager.export_to_pdf(result, filename)
        elif format.lower() == 'csv':
            filepath = export_manager.export_to_csv(result, filename)
        elif format.lower() == 'excel' or format.lower() == 'xlsx':
            filepath = export_manager.export_to_excel(result, filename)
        elif format.lower() == 'json':
            filepath = export_manager.export_to_json(result, filename)
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")

        return {"filename": filename, "path": filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.delete("/api/cache/clear")
async def clear_cache():
    """Clear all cached analysis results."""
    success = cache_manager.clear_all()
    return {"success": success, "message": "Cache cleared"}

@app.get("/api/cache/stats")
async def get_cache_stats():
    """Get cache statistics."""
    return cache_manager.get_stats()

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
