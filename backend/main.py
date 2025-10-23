from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import requests
from bs4 import BeautifulSoup
import uvicorn

app = FastAPI(title="WebAnalyzer Pro API")

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

@app.get("/")
async def root():
    return {"message": "Welcome to WebAnalyzer Pro API"}

@app.post("/api/analyze")
async def analyze_url(request: URLRequest):
    print(f"📝 Received request to analyze: {request.url}")
    try:
        # Fetch the webpage
        print(f"🌐 Fetching URL: {request.url}")
        response = requests.get(request.url, timeout=10)
        response.raise_for_status()
        print(f"✅ Successfully fetched URL, status: {response.status_code}")

        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract basic information
        title = soup.title.string if soup.title else "No title found"
        print(f"📄 Page title: {title}")

        # Count links and images
        links = soup.find_all('a')
        images = soup.find_all('img')
        print(f"🔗 Found {len(links)} links and {len(images)} images")

        # Extract text content
        for script in soup(["script", "style"]):
            script.decompose()

        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        content = '\n'.join(chunk for chunk in chunks if chunk)

        result = {
            "url": request.url,
            "title": title,
            "content": content[:5000],  # Return first 5000 chars
            "stats": {
                "link_count": len(links),
                "image_count": len(images),
                "content_length": len(content)
            },
            "sample_links": [{"text": link.get_text(strip=True)[:50], "href": link.get('href', '')}
                           for link in links[:5]]  # First 5 links
        }
        print(f"✅ Analysis complete, returning {len(result['sample_links'])} sample links")
        return result

    except requests.RequestException as e:
        print(f"❌ Request error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
