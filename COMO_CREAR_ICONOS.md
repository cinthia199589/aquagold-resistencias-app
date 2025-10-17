# 🎨 Instrucciones para Crear los Iconos

## Necesitas crear 2 archivos PNG:

### 1. `icon-192.png` (192x192 píxeles)
### 2. `icon-512.png` (512x512 píxeles)

## Opción A: Crear iconos simples con PowerShell (Temporal)

Ejecuta estos comandos en PowerShell para crear iconos temporales:

```powershell
# Instalar ImageMagick si no lo tienes (necesitas instalar desde https://imagemagick.org/script/download.php)
# O usa esta alternativa simple:

# 1. Abre Paint
# 2. Crea un cuadrado de 512x512
# 3. Pon fondo azul (#2563eb) 
# 4. Escribe una "A" blanca grande en el centro
# 5. Guarda como "icon-512.png" en la carpeta public/
# 6. Redimensiona a 192x192 y guarda como "icon-192.png"
```

## Opción B: Usar un generador online (RECOMENDADO)

### Paso 1: Ir a https://www.pwabuilder.com/imageGenerator

### Paso 2: Subir tu logo o crear uno simple

### Paso 3: Descargar los iconos generados

### Paso 4: Copiar solo estos dos archivos a la carpeta `public/`:
- `icon-192.png`
- `icon-512.png`

## Opción C: Usar tu logo de empresa

Si tienes el logo de Aquagold:

1. Abre el logo en cualquier editor de imágenes (Photoshop, GIMP, Canva, etc.)
2. Redimensiona a 512x512 píxeles (mantén el aspecto cuadrado)
3. Guarda como PNG con fondo transparente o de color
4. Guarda como `public/icon-512.png`
5. Redimensiona a 192x192 píxeles
6. Guarda como `public/icon-192.png`

## ✅ Verificar que funcionó

Después de crear los iconos:

1. Reinicia el servidor: `npm run dev`
2. Abre http://localhost:3000
3. No deberías ver errores 404 para `/icon-192.png`
4. En Chrome móvil, verás la opción "Agregar a pantalla de inicio"

## 🎯 Mientras tanto

La app funciona perfectamente SIN los iconos. Solo no se verá bonita cuando la instales en el celular.

Los iconos solo son necesarios para:
- El ícono en la pantalla del celular después de instalar
- La pantalla splash al abrir la app
- Las notificaciones (si las agregas)

Todo lo demás funciona normalmente.
