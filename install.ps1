# TwinMaker Configurator Installation Script for Windows
Write-Host "Installing TwinMaker Configurator dependencies..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python 3.8 or higher from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if .env file has valid Gemini API key
$envContent = Get-Content .\.env -ErrorAction SilentlyContinue
$hasApiKey = $envContent -match "GEMINI_API_KEY=.+" -and $envContent -notmatch "GEMINI_API_KEY=your_api_key_here"

if (-not $hasApiKey) {
    Write-Host "`n⚠️ WARNING: Gemini API key not found in .env file" -ForegroundColor Yellow
    Write-Host "To use actual Gemini API calls:" -ForegroundColor Yellow
    Write-Host "1. Get your API key from https://makersuite.google.com/app/apikey" -ForegroundColor Yellow
    Write-Host "2. Edit the .env file and update GEMINI_API_KEY=your_api_key_here" -ForegroundColor Yellow
    Write-Host "3. Set USE_MOCK_DATA=False in .env file to use real API calls" -ForegroundColor Yellow
    Write-Host "`nCurrently running in mock mode (USE_MOCK_DATA=True)" -ForegroundColor Yellow
}

Write-Host "`n✅ Installation complete!" -ForegroundColor Green
Write-Host "To run the application:" -ForegroundColor Cyan
Write-Host "1. Activate the virtual environment: .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "2. Start the server: python app.py" -ForegroundColor Cyan
Write-Host "3. Open your browser to http://localhost:5000" -ForegroundColor Cyan 