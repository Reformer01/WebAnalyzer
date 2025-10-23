# WebAnalyzer Pro - Run Script
Write-Host "🚀 Starting WebAnalyzer Pro..." -ForegroundColor Green

# Start Frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
Set-Location "frontend"
Start-Process powershell -ArgumentList "npm run dev" -NoNewWindow

# Start Backend
Write-Host "⚙️ Starting Backend..." -ForegroundColor Cyan
Set-Location "../backend"

# Try to activate virtual environment and start server
try {
    & .\venv\Scripts\activate
    Start-Process powershell -ArgumentList "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -NoNewWindow
} catch {
    # If virtual environment doesn't exist, try to run directly
    Write-Host "🐍 Virtual environment not found, trying direct Python execution..." -ForegroundColor Yellow
    try {
        Start-Process powershell -ArgumentList "python -c 'import uvicorn; uvicorn.run(\"main:app\", host=\"0.0.0.0\", port=8000, reload=True)'" -NoNewWindow
    } catch {
        Write-Host "❌ Could not start backend. Please run setup.ps1 first." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Servers starting..." -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173 (or 5174)" -ForegroundColor White
Write-Host "🔗 Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
