# Start h2e website
Write-Host "Starting h2e website..." -ForegroundColor Green

# Navigate to project folder
Set-Location "C:\Users\usr\h2e"

# Start dev server and open browser
Start-Process "http://localhost:5173"
npm run dev
