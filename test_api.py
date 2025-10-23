import requests
import json

def test_api():
    """Test the WebAnalyzer Pro API"""
    base_url = "http://localhost:8000"

    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print("✅ Root endpoint:", response.json())
    except Exception as e:
        print("❌ Root endpoint failed:", e)

    # Test analyze endpoint
    try:
        test_url = "https://example.com"
        response = requests.post(f"{base_url}/api/analyze",
                               json={"url": test_url})
        if response.status_code == 200:
            data = response.json()
            print("✅ Analyze endpoint working!")
            print(f"   Title: {data['title']}")
            print(f"   Links: {data['stats']['link_count']}")
            print(f"   Images: {data['stats']['image_count']}")
        else:
            print(f"❌ Analyze endpoint failed: {response.status_code}")
    except Exception as e:
        print("❌ Analyze endpoint failed:", e)

if __name__ == "__main__":
    print("🧪 Testing WebAnalyzer Pro API...")
    test_api()
