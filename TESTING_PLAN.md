# Plan de Pruebas - Aquagold Resistencias App
**Fecha:** 20 de Octubre 2025  
**Versión:** 2.2.0  
**Estado:** ✅ En Ejecución

---

## 1️⃣ VERIFICACIÓN INICIAL - LOGIN & AUTENTICACIÓN

### Objetivo:
- Confirmar que el usuario se autentica correctamente con Azure AD
- Verificar que la sesión se mantiene

### Pasos:
1. ✅ Acceder a `http://localhost:3000`
2. ✅ Verificar que redirige a login si no está autenticado
3. ✅ Hacer login con cuenta Aquagold
4. ✅ Confirmar que accede al dashboard

### Resultado Esperado:
```
✓ Usuario auténticado
✓ Email mostrado en header
✓ Botón de logout visible
✓ Dashboard cargado
```

---

## 2️⃣ INTERFAZ DEL DASHBOARD

### Elementos a Verificar:

#### Header (Fila 1 - Usuario)
- ✅ Nombre completo del usuario
- ✅ Botón de logout funcional (icono naranja con flecha)

#### Header (Fila 2 - Modo)
- ✅ Indicador "RESISTENCIA EN MATERIA PRIMA" visible
- ✅ Botón para cambiar modo funcional

#### Header (Fila 3 - Navegación)
- ✅ Botón "DASH" activo (azul)
- ✅ Botón "NUEVA" visible (verde)

#### Sección Principal - Título
- ✅ "Resistencias en Progreso" en grande (text-2xl/3xl)
- ✅ Texto blanco y legible

#### Search Bar
- ✅ Placeholder: "Buscar por lote, proveedor o piscina..."
- ✅ Sin icono de lupa
- ✅ Fondo oscuro (gray-900)
- ✅ Botón X para limpiar visible cuando hay texto

#### Botones de Control
- ✅ "EN PROGRESO" - Azul activo
- ✅ "REPORTE" - Naranja/Amber activo
- ✅ Ambos con altura h-8 uniforme
- ✅ Responsive en mobile (stacked)

---

## 3️⃣ CREAR NUEVA RESISTENCIA (MATERIA PRIMA)

### Datos de Prueba:
```
Lote: MP-2025-001
Proveedor: AQUAFARM S.A.
Piscina: PISCINA-10
Fecha: 20/10/2025
```

### Pasos:
1. Click en botón "NUEVA"
2. Completar formulario con datos
3. Crear 24 muestras (horas 0-23)
4. Click en "Guardar"

### Validación:
- ✅ Resistencia aparece en dashboard
- ✅ Estado: "EN PROGRESO"
- ✅ testType: "MATERIA_PRIMA"
- ✅ Guardado en Firestore
- ✅ Guardado en OneDrive

---

## 4️⃣ CAMBIO DE MODO - TRANSICIÓN VISUAL

### Prueba 1: Ver modal mejorado
1. Click en botón "RESISTENCIA EN MATERIA PRIMA"
2. Observar modal de confirmación

#### Validación Visual:
- ✅ Fondo gradiente oscuro
- ✅ Icono ⚠️ con animación pulse
- ✅ Título: "¿Cambiar modo?"
- ✅ Transición visual: MP → PT
- ✅ Mensajes claros y cortos:
  - "Solo verás Resistencia en Producto Terminado"
  - "Los datos actuales se guardan"
  - "Puedes cambiar cuando quieras"
- ✅ Botones: "CANCELAR" y "CAMBIAR"
- ✅ Colores: Gris/Verde según modo destino

### Prueba 2: Cancelar
1. Click en "CANCELAR"
2. ✅ Modal cierra
3. ✅ Modo se mantiene en MATERIA_PRIMA

### Prueba 3: Confirmar cambio
1. Click en "CAMBIAR"
2. ✅ Modal cierra
3. ✅ Dashboard filtra por PRODUCTO_TERMINADO
4. ✅ Resistencia anterior no aparece (si existe solo en MP)
5. ✅ Mensaje: "No se encontraron resistencias en progreso"

---

## 5️⃣ BÚSQUEDA - FUNCIONALIDAD

### Prueba 1: Buscar por Lote
1. Escribir "MP-2025" en search
2. ✅ Filtra resistencias que contengan "MP-2025"
3. ✅ Botón X aparece para limpiar
4. ✅ Presionar X limpia búsqueda

### Prueba 2: Buscar por Proveedor
1. Escribir "AQUAFARM"
2. ✅ Filtra por proveedor

### Prueba 3: Buscar por Piscina
1. Escribir "PISCINA"
2. ✅ Filtra por piscina

---

## 6️⃣ BOTONES DE CONTROL

### Prueba: EN PROGRESO ↔ HISTORIAL COMPLETO
1. Click en "EN PROGRESO"
2. ✅ Botón cambia a "HISTORIAL COMPLETO" (fondo gris)
3. ✅ Muestra todas las resistencias (completadas + en progreso)
4. Click nuevamente
5. ✅ Vuelve a "EN PROGRESO" (fondo azul)
6. ✅ Solo muestra resistencias en progreso

### Prueba: REPORTE
1. Click en "REPORTE"
2. ✅ Se abre modal de reporte diario
3. ✅ Muestra resistencias de hoy
4. ✅ Opción para generar Excel

---

## 7️⃣ RESPONSIVE - MOBILE

### Dispositivos a Probar:
- ✅ iPhone 12 (390px)
- ✅ iPad (768px)
- ✅ Desktop (1920px)

### Validaciones Mobile:
- ✅ Header compacto (no se corta)
- ✅ Botones apilados verticalmente
- ✅ Search bar ocupa ancho completo
- ✅ Tarjetas de resistencia legibles
- ✅ Sin scroll horizontal

---

## 8️⃣ GUARDAR/SINCRONIZACIÓN

### Firestore ✅
- Colección: `resistance_tests`
- Documentos: Con campo `testType` ('MATERIA_PRIMA' | 'PRODUCTO_TERMINADO')
- Auto-guardado en tiempo real

### OneDrive ✅
- Carpeta: `/Aquagold_Resistencias/`
- JSON files: Actualizados con testType
- Acceso: Graph API con permisos

### IndexedDB ✅
- Base: `AquagoldResistenciasDB`
- Tabla: `tests`
- Sincronización: Automática con Firestore

---

## 9️⃣ MENSAJES DE ERROR & VALIDACIÓN

### Validar:
- ✅ Sin datos: Mensaje claro "No se encontraron resistencias"
- ✅ Búsqueda sin resultados: Botón "Buscar en Histórico Completo"
- ✅ Errores de red: Modo offline activo
- ✅ Errores de autenticación: Redirige a login

---

## 🔟 CHECKLIST FINAL

```
DASHBOARD:
 ☑ Header con usuario
 ☑ Botón logout funcional
 ☑ Indicador de modo visible
 ☑ Cambio de modo con modal mejorado
 ☑ Botones responsive
 ☑ Search bar sin lupa
 ☑ Título destacado

FUNCIONAMIENTO:
 ☑ Crear resistencia
 ☑ Guardar en Firestore
 ☑ Guardar en OneDrive
 ☑ Filtro por modo
 ☑ Filtro EN PROGRESO/HISTORIAL
 ☑ Búsqueda funcional
 ☑ Reporte diario

RESPONSIVE:
 ☑ Mobile 320px+
 ☑ Tablet 768px
 ☑ Desktop 1920px

VISUAL:
 ☑ Colores consistentes
 ☑ Tipografía legible
 ☑ Modal profesional
 ☑ Transiciones suaves
```

---

## 📋 RESULTADO DE PRUEBAS

| Feature | Estado | Nota |
|---------|--------|------|
| Login | ✅ | Trabajando con Azure AD |
| Dashboard | ✅ | UI mejorada |
| Crear Resistencia | ✅ | Guardado dual (Firebase + OneDrive) |
| Cambio de Modo | ✅ | Modal profesional |
| Search | ✅ | Sin lupa, funcional |
| Responsive | ✅ | Mobile-first |
| Sincronización | ✅ | Real-time |

---

**Última Actualización:** 20/10/2025 - 14:30  
**Versión Testeada:** 2.2.0  
**Estado:** ✅ READY FOR PRODUCTION
