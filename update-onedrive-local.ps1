# Script de PowerShell para actualizar JSON en OneDrive local
# Ejecutar: .\update-onedrive-local.ps1

Write-Host "🔧 Script de Actualización de JSON en OneDrive" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Ruta a tu carpeta de OneDrive
$oneDrivePath = "$env:USERPROFILE\OneDrive - AQUAGOLD S.A\Aquagold_Resistencias"

Write-Host "`n📁 Verificando ruta de OneDrive..." -ForegroundColor Yellow
if (-not (Test-Path $oneDrivePath)) {
    Write-Host "❌ No se encontró la carpeta: $oneDrivePath" -ForegroundColor Red
    Write-Host "📝 Ingresa la ruta correcta a tu carpeta Aquagold_Resistencias en OneDrive:" -ForegroundColor Yellow
    $oneDrivePath = Read-Host "Ruta"
    
    if (-not (Test-Path $oneDrivePath)) {
        Write-Host "❌ Ruta inválida. Abortando." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Carpeta encontrada: $oneDrivePath" -ForegroundColor Green

# URL del servidor local para obtener los datos actualizados
$apiUrl = "http://localhost:8080/api/export-firestore-json"

Write-Host "`n📥 Descargando datos actualizados desde Firestore..." -ForegroundColor Yellow
Write-Host "   (Asegúrate de que el servidor esté corriendo en localhost:8080)" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -ContentType "application/json"
    $tests = $response.tests
    
    Write-Host "✅ $($tests.Count) tests descargados desde Firestore" -ForegroundColor Green
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($test in $tests) {
        try {
            $lotNumber = $test.lotNumber
            $testId = $test.id
            
            # Ruta de la carpeta del lote
            $lotFolder = Join-Path $oneDrivePath $lotNumber
            
            if (-not (Test-Path $lotFolder)) {
                Write-Host "⚠️  Carpeta no existe: $lotNumber (saltando...)" -ForegroundColor Yellow
                continue
            }
            
            # Ruta del archivo JSON
            $jsonFile = Join-Path $lotFolder "$testId.json"
            
            # Convertir a JSON con formato bonito
            $jsonContent = $test | ConvertTo-Json -Depth 10
            
            # Guardar archivo
            Set-Content -Path $jsonFile -Value $jsonContent -Encoding UTF8
            
            Write-Host "✅ $lotNumber actualizado (testType: $($test.testType))" -ForegroundColor Green
            $successCount++
            
        } catch {
            Write-Host "❌ Error en $lotNumber : $_" -ForegroundColor Red
            $errorCount++
        }
    }
    
    Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
    Write-Host "🎉 ACTUALIZACIÓN COMPLETADA" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Gray
    Write-Host "✅ Exitosos: $successCount" -ForegroundColor Green
    Write-Host "❌ Errores: $errorCount" -ForegroundColor Red
    Write-Host ("=" * 60) -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ ERROR: No se pudo conectar al servidor" -ForegroundColor Red
    Write-Host "   Asegúrate de que el servidor esté corriendo: npm run dev" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}
