# 🗑️ Política de Eliminación de Datos

## ⚠️ Información Importante

Cuando eliminas una resistencia en la aplicación, **se borra TODO permanentemente**:

### ✅ Qué se Borra:

1. **Datos en Firestore** 📊
   - El registro completo de la resistencia
   - Lote número, proveedor, piscina
   - Todas las muestras y sus datos (unidades crudas, cocidas)
   - Observaciones
   - Fecha de creación/actualización
   - URLs de fotos

2. **Fotos en OneDrive** 📷
   - Todas las fotos de las muestras
   - La carpeta completa del lote en `Aquagold_Resistencias/`
   - No se pueden recuperar desde la app

3. **Archivos Excel** 📄
   - El reporte Excel generado
   - Cualquier copia en OneDrive

4. **Base de Datos Firebase** 🔗
   - Todo el historial de cambios
   - Las referencias cruzadas

---

## 🔒 Seguridad Anti-Accidentes

Para evitar eliminaciones accidentales, implementamos:

✅ **Confirmación por Palabra Clave**
- Debes escribir la palabra exacta: **"confirmar"**
- Es sensible a mayúsculas/minúsculas (todo minúsculas)
- El botón de eliminar solo se activa si escribes correctamente

✅ **Doble Confirmación**
1. Primero escribe "confirmar" en el campo
2. Luego haz clic en el botón "🗑️ Eliminar Resistencia"
3. Confirma en el diálogo de advertencia

✅ **Ubicación de Seguridad**
- El botón NO está en la tarjeta del dashboard
- Se encuentra al **final del formulario**, después de observaciones
- Está destacado en rojo con advertencia clara

✅ **Información Clara**
- Zona claramente marcada: "⚠️ Zona de Eliminación"
- Advertencia: "Se borrará TODO (datos + fotos + archivo Excel)"
- Texto del campo guía: "Escribe 'confirmar' para activar eliminación..."

---

## 📝 Pasos para Eliminar:

1. Abre una resistencia (click en la tarjeta del dashboard)
2. Desplázate hasta el final del formulario
3. Busca la sección roja: "⚠️ Zona de Eliminación"
4. Escribe **"confirmar"** en el campo de texto
5. El botón se habilitará (cambiará de gris a rojo)
6. Haz clic en "🗑️ Eliminar Resistencia"
7. Confirma en el diálogo emergente
8. Serás redirigido al dashboard

---

## ⚙️ Datos Técnicos

**Ubicación del código:**
- `app/page.tsx` - Línea ~1125: Sección de eliminación en TestDetailPage
- `lib/firestoreService.ts` - Función `deleteTest()`

**Endpoints afectados:**
- Firebase Firestore: `resistance_tests` collection
- Microsoft Graph: `/drive/root:/Aquagold_Resistencias/{lotNumber}`

**Permisos requeridos:**
- `Files.ReadWrite` - Para eliminar carpetas en OneDrive
- Acceso a Firestore - Para eliminar documentos

---

## 🚨 ¿Qué hacer si eliminas por error?

**Lamentablemente, NO hay forma de recuperar datos eliminados**

Opciones:
1. ✅ Contactar al administrador para verificar backups
2. ✅ Recrear la resistencia manualmente con los datos que recuerdes
3. ✅ Revisar historial de archivos de OneDrive si está habilitado

---

## 📞 Soporte

Si tienes dudas sobre la eliminación de datos:
- Consulta con tu administrador
- Revisa los logs en Firebase Console
- Verifica OneDrive para ver cambios recientes

**Recuerda:** ¡La eliminación es PERMANENTE! Procede con cuidado. ✅

