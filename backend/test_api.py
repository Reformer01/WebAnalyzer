import pytest
import requests
from fastapi.testclient import TestClient
from main import app

# Create a test client
client = TestClient(app)

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to WebAnalyzer Pro API"}

def test_analyze_valid_url():
    """Test analyzing a valid URL"""
    test_url = "https://example.com"
    response = client.post(
        "/api/analyze",
        json={"url": test_url},
        headers={"Content-Type": "application/json"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"] == test_url
    assert "title" in data
    assert "content" in data
    assert "stats" in data
    assert "sample_links" in data

def test_analyze_invalid_url():
    """Test analyzing an invalid URL"""
    response = client.post(
        "/api/analyze",
        json={"url": "not-a-valid-url"},
        headers={"Content-Type": "application/json"}
    )
    
    assert response.status_code == 400
    assert "detail" in response.json()

def test_analyze_missing_url():
    """Test analyzing with missing URL"""
    response = client.post(
        "/api/analyze",
        json={},
        headers={"Content-Type": "application/json"}
    )
    
    assert response.status_code == 422  # Validation error

if __name__ == "__main__":
    # This allows running the tests with: python test_api.py
    pytest.main(["-v", "test_api.py"])
