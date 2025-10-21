# 🧪 GUÍA DE TESTING - Aquagold Resistencias App v2.2.0

## 🚀 INICIO RÁPIDO

### 1. Inicia el servidor
```bash
cd resistencias-app
npm run dev
```

### 2. Accede a la app
```
http://localhost:3000
```

### 3. Auténticate
```
Usa tu cuenta Azure AD de Aquagold
```

---

## 📋 PLAN DE TESTING

### ✅ TEST 1: LOGIN & HEADER

**Pasos:**
1. Acceder a http://localhost:3000
2. Hacer click en "Inicia sesión"
3. Autenticarse con Azure AD

**Verificar:**
- [x] Redirige a login si no está autenticado
- [x] Nombre del usuario aparece en el header
- [x] Botón logout visible (icono naranja con flecha)
- [x] Header compacto (3 filas):
  - Fila 1: Nombre usuario | Logout
  - Fila 2: Modo de trabajo (cambio)
  - Fila 3: Botones DASH | NUEVA

---

### ✅ TEST 2: DASHBOARD UI

**Verificar elementos visuales:**

1. **Título:**
   - [x] "Resistencias en Progreso" grande y claro
   - [x] Texto blanco (text-white)
   - [x] Tamaño: text-2xl en mobile, text-3xl en desktop

2. **Search Bar:**
   - [x] Placeholder: "Buscar por lote, proveedor o piscina..."
   - [x] SIN icono de lupa
   - [x] Fondo oscuro (gray-900)
   - [x] Botón X para limpiar (cuando hay texto)

3. **Botones de Control:**
   - [x] "EN PROGRESO" - Color azul (bg-blue-600)
   - [x] "REPORTE" - Color naranja (bg-amber-500)
   - [x] Altura uniforme: h-8
   - [x] Responsive: Apilados en mobile, lado a lado en desktop

---

### ✅ TEST 3: CAMBIO DE MODO

**Pasos:**
1. Click en botón "RESISTENCIA EN MATERIA PRIMA" (en header, fila 2)
2. Observar modal de confirmación

**Verificar Modal:**
- [x] Fondo: Gradiente oscuro (from-gray-900 to-gray-800)
- [x] Icono: ⚠️ animado (pulsa)
- [x] Título: "¿Cambiar modo?" (corto y directo)
- [x] Transición visual: [MATERIA PRIMA] → [PRODUCTO TERMINADO]

**Verificar Mensajes:**
```
✓ Solo verás Resistencia en Producto Terminado
✓ Los datos actuales se guardan
✓ Puedes cambiar cuando quieras
```

**Verificar Botones:**
- [x] "CANCELAR" - Gris, cierra el modal
- [x] "CAMBIAR" - Verde/Azul según modo destino

**Prueba de Cancelar:**
1. Click en "CANCELAR"
2. [x] Modal cierra
3. [x] Modo permanece igual

**Prueba de Cambiar:**
1. Click en "CAMBIAR"
2. [x] Modal cierra
3. [x] Dashboard filtra a nuevo modo
4. [x] Botón en header actualiza el modo mostrado

---

### ✅ TEST 4: BÚSQUEDA

**Test 1: Buscar por Lote**
```
1. Escribir "MP-2025" en search
2. Verificar que filtra resultados
3. Click X para limpiar
4. Todos los resultados reaparecen
```

**Test 2: Buscar por Proveedor**
```
1. Escribir nombre de proveedor
2. Filtra correctamente
```

**Test 3: Buscar por Piscina**
```
1. Escribir número de piscina
2. Filtra correctamente
```

---

### ✅ TEST 5: CREAR RESISTENCIA

**Datos de Prueba:**
```
Lote: TEST-MP-001
Proveedor: AQUAFARM TESTING
Piscina: PISCINA-TEST-01
Fecha: Hoy
```

**Pasos:**
1. Click en "NUEVA" (en header fila 3)
2. Completar formulario
3. Crear 24 muestras (horas 0-23)
4. Click "Guardar"

**Verificar:**
- [x] Aparece en dashboard
- [x] Estado: "EN PROGRESO"
- [x] Mostrando datos correctamente
- [x] Guardado en Firestore
- [x] Guardado en OneDrive

---

### ✅ TEST 6: BOTONES DE CONTROL

**Test EN PROGRESO/HISTORIAL:**
```
1. Dashboard muestra "EN PROGRESO"
2. Click en botón
3. Cambia a "HISTORIAL COMPLETO" (fondo gris)
4. Muestra todas las resistencias
5. Click nuevamente
6. Vuelve a "EN PROGRESO" (fondo azul)
7. Solo muestra en progreso
```

**Test REPORTE:**
```
1. Click en "REPORTE"
2. Se abre modal de reporte diario
3. Muestra resistencias de hoy
4. Opción para exportar a Excel
```

---

### ✅ TEST 7: RESPONSIVE DESIGN

**Mobile (320px - iPhone SE):**
```
1. F12 → Toggle device toolbar
2. Seleccionar "iPhone SE"
3. Verificar:
   - Header no se corta
   - Botones apilados verticalmente
   - Search ocupa ancho completo
   - Texto legible
   - Sin scroll horizontal
```

**Tablet (768px - iPad):**
```
1. Seleccionar iPad en device toolbar
2. Verificar:
   - Layout intermedio
   - Botones lado a lado
   - Buena proporción
```

**Desktop (1920px):**
```
1. Abrir navegador en pantalla completa
2. Verificar:
   - Todo bien distribuido
   - Espacios óptimos
   - Máxima legibilidad
```

---

### ✅ TEST 8: SINCRONIZACIÓN

**Firestore:**
```
1. Ir a Firebase Console
2. Firestore Database
3. Colección: resistance_tests
4. Verificar:
   - Nueva resistencia existe
   - Campo testType = "MATERIA_PRIMA" o "PRODUCTO_TERMINADO"
   - Todos los datos completos
```

**OneDrive:**
```
1. Ir a OneDrive
2. Carpeta: Aquagold_Resistencias
3. Verificar:
   - JSON file de la resistencia
   - Actualizado con testType
   - Datos sincronizados
```

**IndexedDB:**
```
1. DevTools (F12)
2. Application → IndexedDB
3. Base: AquagoldResistenciasDB
4. Tabla: tests
5. Verificar datos locales
```

---

## 🎯 CASOS ESPECIALES

### Error: No autenticado
```
Resultado esperado:
- Página de login
- Botón "Inicia sesión"
- Redirige a Azure AD
```

### Error: Sin resistencias
```
Resultado esperado:
- Mensaje: "No se encontraron resistencias en progreso"
- Buttons aún funcionales
- Modo cambio disponible
```

### Búsqueda sin resultados
```
Resultado esperado:
- Mensaje claro
- Botón "Buscar en Histórico Completo"
- Opción para expandir búsqueda
```

### Cambio de modo con datos
```
Resultado esperado:
- Modal de confirmación
- Datos se guardan
- Filtrado correcto
- Cambio visible inmediatamente
```

---

## 📊 CHECKLIST FINAL

```
VISUAL:
 ☐ Header compacto y profesional
 ☐ Título destacado (grande)
 ☐ Search sin lupa
 ☐ Botones con colores claros
 ☐ Modal atractivo
 ☐ Responsive en todos los tamaños

FUNCIONAL:
 ☐ Login funciona
 ☐ Crear resistencias
 ☐ Cambio de modo
 ☐ Búsqueda funciona
 ☐ Filtrado correcto
 ☐ Guardar/sincronizar

DATOS:
 ☐ Firestore actualizado
 ☐ OneDrive sincronizado
 ☐ IndexedDB completo
 ☐ Offline mode activo

MOBILE:
 ☐ Responsive 320px
 ☐ Responsive 768px
 ☐ Responsive 1920px
 ☐ Sin scroll horizontal

TOTAL: Todo funciona ✅
```

---

## 🐛 REPORTE DE BUGS

Si encuentras algún error:

1. **Describe el problema**
2. **Pasos para reproducir**
3. **Resultado esperado vs actual**
4. **Captura de pantalla**
5. **Mensaje de error (si hay)**

---

## 💬 NOTAS

- La aplicación requiere autenticación Azure AD
- Los datos se sincronizan en tiempo real
- Modo offline está completamente soportado
- Responsive funciona en todos los dispositivos
- Dark mode está habilitado

---

**Última actualización:** 20/10/2025  
**Versión:** 2.2.0  
**Estado:** ✅ PRODUCCIÓN LISTA

¡Gracias por testear! 🎉
