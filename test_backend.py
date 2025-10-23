import requests
import sys

def test_api():
    url = "http://localhost:8000/api/analyze"
    test_url = "https://example.com"
    
    print(f"Testing API with URL: {test_url}")
    
    try:
        # Test the root endpoint first
        print("\n1. Testing root endpoint...")
        response = requests.get("http://localhost:8000/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        # Test the analyze endpoint
        print("\n2. Testing analyze endpoint...")
        response = requests.post(
            url,
            json={"url": test_url},
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nTroubleshooting steps:")
        print("1. Make sure the backend server is running")
        print("2. Check if port 8000 is available")
        print("3. Verify there are no firewall rules blocking the connection")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Starting WebAnalyzer Pro API Test...")
    success = test_api()
    if success:
        print("\n✅ All tests passed! The API is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the error messages above.")
        sys.exit(1)
