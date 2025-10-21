# Script para reorganizar el header

$file = "c:\Users\Jaqueline Holguin\OneDrive - AQUAGOLD S.A\ARCHIVOS PROGRAMAS-nuevo\resistencias-app\app\page.tsx"

# Leer contenido
$content = Get-Content $file -Raw -Encoding UTF8

# Reemplazo 1: Eliminar el bloque del WorkModeSwitch antes del header
$content = $content -replace '(?s){/\* 📄 NUEVO: Interruptor de modo de trabajo - Solo visible en dashboard \*/}\s+{route === ''dashboard'' && \(\s+<div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-4">\s+<WorkModeSwitch[^/]+/>\s+</div>\s+\)}\s+', ''

# Reemplazo 2: Eliminar comentario de migración
$content = $content -replace '{/\* 📄 Banner de progreso de migración - YA NO NECESARIO \(migración completada\) \*/}\s+{/\* <MigrationStatusBanner /> \*/}\s+', ''

# Guardar
Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline

Write-Host "✅ Header actualizado exitosamente" -ForegroundColor Green
