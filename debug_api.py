import requests
import json

def test_api():
    try:
        print("Testing API endpoint...")
        response = requests.post('http://localhost:8000/api/analyze', json={'url': 'https://example.com'}, timeout=10)
        print(f'Status Code: {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            print('✅ API Working!')
            print(f'Title: {data["title"]}')
            print(f'Links: {data["stats"]["link_count"]}')
            print(f'Images: {data["stats"]["image_count"]}')
        else:
            print(f'❌ API Error: {response.status_code}')
            print(f'Response: {response.text}')
    except Exception as e:
        print(f'❌ Connection Error: {str(e)}')

if __name__ == "__main__":
    test_api()
