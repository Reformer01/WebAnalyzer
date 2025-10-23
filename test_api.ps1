try {
    $body = '{"url": "https://example.com"}'
    Write-Host "Testing API with URL: https://example.com"
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/analyze' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
    Write-Host "Status Code:" $response.StatusCode
    Write-Host "Response:" $response.Content
} catch {
    Write-Host "Error:" $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
        Write-Host "Status Description:" $_.Exception.Response.StatusDescription
    }
}
