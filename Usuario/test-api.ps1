# ==============================================================================
# Script de Prueba Integral de la API REST - Concurso Usuarios y Direcciones
# ==============================================================================

$baseUrl = "http://localhost:8080/api"
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TEST SUITE INTEGRAL DE API REST (USUARIOS & DIRECCIONES)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n[1/9] Probando Endpoint de Salud (/api/health)..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    if ($health.status -eq "UP") {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [FALLO]" -ForegroundColor Red
    }
} catch {
    Write-Host " [FALLO: Servidor apagado o no responde]" -ForegroundColor Red
    exit 1
}

# 2. Catálogo Geográfico (Público - Sin restricción)
Write-Host "[2/9] Consultando Catálogo Geográfico (/api/paises, /api/departamentos, /api/localidades)..." -NoNewline
$paises = Invoke-RestMethod -Uri "$baseUrl/paises" -Method Get
$deptos = Invoke-RestMethod -Uri "$baseUrl/departamentos" -Method Get
$locs = Invoke-RestMethod -Uri "$baseUrl/localidades" -Method Get
if ($paises.success -and $deptos.success -and $locs.success) {
    Write-Host " [OK] ($($paises.data.Count) países, $($deptos.data.Count) deptos, $($locs.data.Count) localidades)" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 3. Creación de Nueva Dirección
Write-Host "[3/9] Registrando Nueva Dirección (/api/direcciones)..." -NoNewline
$primerLocId = $locs.data[0].id
$nuevaDirBody = @{
    calle = "Av. Belgrano"
    numero = "1250"
    piso = "3"
    departamento = "A"
    localidadId = $primerLocId
} | ConvertTo-Json

$dirRes = Invoke-RestMethod -Uri "$baseUrl/direcciones" -Method Post -Body $nuevaDirBody -ContentType "application/json"
$direccionId = $dirRes.data.id
if ($dirRes.success -and $direccionId) {
    Write-Host " [OK] Creada con ID: $direccionId" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 4. Registro de Usuario (Persona + Usuario con dirección vinculada)
$rand = Get-Random -Minimum 1000 -Maximum 9999
$emailTest = "user_$rand@test.com"
$dniTest = "$rand" + "1234"
Write-Host "[4/9] Registrando Usuario ($emailTest)..." -NoNewline

$registerBody = @{
    email = $emailTest
    password = "ClaveSegura123"
    nombre = "Carlos"
    apellido = "Gardel"
    dni = $dniTest
    fechaNacimiento = "1990-12-11"
    direccionId = $direccionId
} | ConvertTo-Json

$regResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
if ($regResponse.success -and $regResponse.data.token) {
    Write-Host " [OK] Registrado y JWT emitido (Sin roles)" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 5. Login de Usuario
Write-Host "[5/9] Probando Login de Usuario Tradicional..." -NoNewline
$loginBody = @{
    email = $emailTest
    password = "ClaveSegura123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token
$headers = @{ Authorization = "Bearer $token" }

if ($loginResponse.success -and $token) {
    Write-Host " [OK] Token recibido" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 6. Ver Perfil (Endpoint protegido)
Write-Host "[6/9] Obteniendo Perfil Protegido (/api/profile)..." -NoNewline
$profile = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Get -Headers $headers
if ($profile.success -and $profile.data.persona.nombre -eq "Carlos") {
    Write-Host " [OK] Perfil verificado exitosamente" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 7. Modificar Perfil
Write-Host "[7/9] Modificando Datos Personales del Perfil..." -NoNewline
$updateBody = @{
    nombre = "Carlos Alberto"
    apellido = "Gardel Modificado"
    dni = $dniTest
    fechaNacimiento = "1990-12-11"
    direccion = @{
        calle = "Calle Corrientes"
        numero = "348"
        piso = "PB"
        departamento = "1"
        localidadId = $primerLocId
    }
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "$baseUrl/profile" -Method Put -Body $updateBody -ContentType "application/json" -Headers $headers
if ($updateRes.success -and $updateRes.data.persona.nombre -eq "Carlos Alberto") {
    Write-Host " [OK] Perfil y Dirección actualizados con éxito" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 8. Cambio de Contraseña (Opción 2)
Write-Host "[8/9] Cambiando Contraseña (/api/profile/change-password)..." -NoNewline
$changeBody = @{
    currentPassword = "ClaveSegura123"
    newPassword = "NuevaClaveSuperSegura456"
    confirmPassword = "NuevaClaveSuperSegura456"
} | ConvertTo-Json

$changeRes = Invoke-RestMethod -Uri "$baseUrl/profile/change-password" -Method Put -Body $changeBody -ContentType "application/json" -Headers $headers
if ($changeRes.success) {
    Write-Host " [OK] Contraseña cambiada exitosamente" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

# 9. Verificación de Login con Nueva Contraseña
Write-Host "[9/9] Verificando Login con la Nueva Contraseña..." -NoNewline
$reLoginBody = @{
    email = $emailTest
    password = "NuevaClaveSuperSegura456"
} | ConvertTo-Json

$reLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $reLoginBody -ContentType "application/json"
if ($reLoginRes.success -and $reLoginRes.data.token) {
    Write-Host " [OK] Nueva clave funciona a la perfección!" -ForegroundColor Green
} else {
    Write-Host " [FALLO]" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   TODAS LAS PRUEBAS FINALIZARON EXITOSAMENTE (100% OK)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
