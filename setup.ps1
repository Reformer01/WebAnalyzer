# Create backend directory
New-Item -ItemType Directory -Force -Path ".\backend\app"
New-Item -ItemType Directory -Force -Path ".\backend\app\routers"
New-Item -ItemType Directory -Force -Path ".\backend\app\models"
New-Item -ItemType Directory -Force -Path ".\backend\app\services"

# Install frontend dependencies
Set-Location .\frontend
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-router-dom axios

# Create requirements.txt for backend
Set-Location ..\backend
"fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
beautifulsoup4==4.12.2
requests==2.31.0" | Out-File -FilePath "requirements.txt" -Encoding utf8

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "To start the frontend: cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host "To start the backend: cd backend && uvicorn main:app --reload" -ForegroundColor Cyan
