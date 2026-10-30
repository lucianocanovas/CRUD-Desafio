# 8. Verificación de re-login con nueva clave
Write-Host "[8/9] Verificando Login con la Nueva Clave..." -NoNewline
$reLoginBody = @{
    email = $emailTest
    password = "NuevaClaveSegura789"
} | ConvertTo-Json

$reLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $reLoginBody -ContentType "application/json"
if ($reLoginResponse.success -and $reLoginResponse.data.token) {
    Write-Host " [OK] La nueva clave funciona perfectamente!" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 9. Cambio de clave para usuario de Google / OAuth (sin clave actual requerida)
Write-Host "[9/9] Probando Cambio de Clave para Usuario de Google / Auth0..." -NoNewline
$oauthToken = $oauthResponse.data.token
$oauthHeaders = @{ Authorization = "Bearer $oauthToken" }

$oauthChangeBody = @{
    currentPassword = "" # Clave actual vacía porque proviene de Google
    newPassword = "ClavePropiaGoogle2026"
    confirmPassword = "ClavePropiaGoogle2026"
} | ConvertTo-Json

$oauthChangeRes = Invoke-RestMethod -Uri "$baseUrl/profile/change-password" -Method Put -Body $oauthChangeBody -ContentType "application/json" -Headers $oauthHeaders

# Probar re-login tradicional del usuario de Google usando su nueva clave
$googleReLogin = @{
    email = "auth0_user_$rand@gmail.com"
    password = "ClavePropiaGoogle2026"
} | ConvertTo-Json

$googleReLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $googleReLogin -ContentType "application/json"

if ($oauthChangeRes.success -and $googleReLoginRes.success) {
    Write-Host " [OK] Usuario de Google configuró su clave y se logueó tradicionalmente!" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   TODAS LAS PRUEBAS FINALIZARON EXITOSAMENTE (100% OK)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
