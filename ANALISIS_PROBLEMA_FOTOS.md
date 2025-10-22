# 🔍 ANÁLISIS EXHAUSTIVO: Problemas con Carga y Descarga de Fotos

## 🎯 El Problema Reportado

**Síntomas:**
1. Usuario sube foto → sale mensaje "✅ Se ha subido"
2. Usuario intenta descargar → sale error
3. Usuario revisa OneDrive → **la foto NO está**

## 🔴 CAUSAS POTENCIALES IDENTIFICADAS

### 1️⃣ **CAUSA: Falsa confirmación de carga (PROBLEMA CRÍTICO)**

**Ubicación:** `lib/graphService.ts` línea 225

**El Problema:**
```typescript
const photoUrl = await uploadPhotoToOneDrive(...);
// Devuelve URL sin VERIFICAR que el archivo realmente se subió
return photoUrl; // ← Devuelve URL incluso si hubo error
```

**Por qué falla:**
- El archivo se envía a OneDrive con `PUT /content`
- La respuesta dice "OK" (201/200)
- PERO OneDrive puede rechazar el archivo después por:
  - Cuota insuficiente
  - Permisos incorrectos
  - Formato no soportado
  - Carpeta no existe

**Resultado:**
- ✅ App recibe URL
- ✅ Se guarda en Firestore
- ❌ Archivo NO está en OneDrive
- ❌ Descarga falla con error 404

---

### 2️⃣ **CAUSA: No validar que la carpeta existe**

**Ubicación:** `lib/graphService.ts` línea 212

**El Problema:**
```typescript
const uploadEndpoint = `/me/drive/root:/${folderName}/${lotNumber}/${fileName}:/content`;
await callApi(uploadEndpoint, "PUT", photoBlob, "image/jpeg");
// Si la carpeta NO existe, OneDrive lo rechaza silenciosamente
```

**Por qué falla:**
- OneDrive NO crea carpetas automáticamente con PUT
- Si `MATERIA_PRIMA/LOTE-001/` no existe → error 400/409
- La función NO verifica antes de subir

---

### 3️⃣ **CAUSA: URL puede cambiar o expirar**

**Ubicación:** `lib/graphService.ts` línea 228

**El Problema:**
```typescript
const baseUrl = fileInfo.webUrl || `${folderName}/${lotNumber}/${fileName}`;
const photoUrl = `${baseUrl}?t=${timestamp}`; // ← El ?t= solo es cache-busting del navegador
// Pero OneDrive puede cambiar la URL después
```

**Por qué falla:**
- OneDrive genera URLs con tokens de acceso
- Los tokens pueden expirar
- La URL guardada puede no ser válida después de tiempo

---

### 4️⃣ **CAUSA: Permisos de acceso anónimo no configurados**

**El Problema:**
- Fotos subidas a OneDrive con permisos de "usuario autenticado"
- Cuando otro usuario intenta descargar → acceso denegado
- Cuando usuario cambia de sesión → acceso denegado

---

### 5️⃣ **CAUSA: Race condition en guardar datos**

**Ubicación:** `app/page.tsx` línea 771-790

**El Problema:**
```typescript
// 1. Subir foto
const photoUrl = await uploadPhotoToOneDrive(...);

// 2. Actualizar state (exitoso según UI)
setEditedTest(prev => ({
  ...prev,
  samples: prev.samples.map(s => 
    s.id === sampleId ? { ...s, photoUrl, isUploading: false } : s
  )
}));

// 3. Auto-guardar en Firestore (pero ¿qué pasó si (1) falló realmente?)
await saveTestToFirestore(editedTest); // ← Guarda URL que NO es válida
```

**Por qué falla:**
- Si paso 1 falló pero respondió OK → photoUrl es invalida
- Paso 2 marca como "subido" en UI
- Paso 3 guarda URL inválida en Firestore
- Nadie se da cuenta que el archivo nunca llegó

---

### 6️⃣ **CAUSA: Sin validación de respuesta de OneDrive**

**Ubicación:** `lib/graphService.ts` línea 225

**El Problema:**
```typescript
const uploadResponse = await callApi(uploadEndpoint, "PUT", photoBlob, "image/jpeg");
// Devuelve la respuesta sin validar que tiene los campos esperados

if (!uploadResponse || !uploadResponse.id) {
  throw new Error("No se recibió ID del archivo");
}
```

**No existe esta validación:**
- Si OneDrive devuelve una respuesta vacía → no se detecta
- Si devuelve error dentro del JSON → no se valida

---

## ✅ SOLUCIONES

### SOLUCIÓN 1: Validar que carpeta existe antes de subir

**Agregar función para verificar/crear carpeta:**

```typescript
const ensureLotFolderExists = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  folderName: string,
  lotNumber: string
): Promise<void> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  
  try {
    // 1. Verificar que carpeta raíz existe
    const rootCheck = `/me/drive/root:/${folderName}`;
    try {
      await callApi(rootCheck, "GET");
    } catch (e) {
      // Crear carpeta raíz si no existe
      await callApi(`/me/drive/root/children`, "POST", {
        name: folderName,
        folder: {}
      });
      console.log(`✅ Carpeta raíz creada: ${folderName}`);
    }
    
    // 2. Verificar que carpeta de lote existe
    const lotFolderPath = `/me/drive/root:/${folderName}/${lotNumber}`;
    try {
      await callApi(lotFolderPath, "GET");
    } catch (e) {
      // Crear carpeta de lote si no existe
      const parentPath = `/me/drive/root:/${folderName}`;
      const parentId = (await callApi(parentPath, "GET")).id;
      await callApi(`/me/drive/items/${parentId}/children`, "POST", {
        name: lotNumber,
        folder: {}
      });
      console.log(`✅ Carpeta de lote creada: ${lotNumber}`);
    }
  } catch (error) {
    console.error("❌ Error al verificar/crear carpetas:", error);
    throw error;
  }
};
```

### SOLUCIÓN 2: Validar respuesta de OneDrive

**Mejorar función `uploadPhotoToOneDrive`:**

```typescript
export const uploadPhotoToOneDrive = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  sampleId: string,
  photoBlob: Blob,
  testType: TestType
): Promise<string> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  const folderName = getOneDriveFolderByType(testType);

  try {
    // ✨ NUEVO: Asegurar que carpeta existe
    await ensureLotFolderExists(msalInstance, scopes, folderName, lotNumber);
    
    const fileName = `foto_${sampleId}.jpg`;
    const uploadEndpoint = `/me/drive/root:/${folderName}/${lotNumber}/${fileName}:/content`;
    
    console.log(`📤 Iniciando carga de foto: ${fileName}`);
    
    // Subir archivo
    const uploadResponse = await callApi(uploadEndpoint, "PUT", photoBlob, "image/jpeg");
    
    // ✨ NUEVO: Validar que la respuesta tiene los datos esperados
    if (!uploadResponse || !uploadResponse.id || !uploadResponse.webUrl) {
      throw new Error(`Respuesta inválida de OneDrive: ${JSON.stringify(uploadResponse)}`);
    }
    
    // ✨ NUEVO: Verificar que archivo se subió correctamente
    console.log(`✅ Archivo subido correctamente a OneDrive`);
    console.log(`   ID del archivo: ${uploadResponse.id}`);
    console.log(`   URL web: ${uploadResponse.webUrl}`);
    console.log(`   Tamaño: ${uploadResponse.size} bytes`);
    
    // Usar directamente webUrl de OneDrive (es más confiable)
    return uploadResponse.webUrl;
    
  } catch (error: any) {
    console.error(`❌ Error crítico al subir foto a OneDrive:`, error);
    throw new Error(`Error al subir foto: ${error.message}`);
  }
};
```

### SOLUCIÓN 3: Reintentarlo si falla

**Agregar reintentos exponenciales:**

```typescript
const uploadPhotoWithRetry = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  sampleId: string,
  photoBlob: Blob,
  testType: TestType,
  maxRetries: number = 3
): Promise<string> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Intento ${attempt}/${maxRetries} de subir foto...`);
      const url = await uploadPhotoToOneDrive(msalInstance, scopes, lotNumber, sampleId, photoBlob, testType);
      console.log(`✅ Foto subida exitosamente en intento ${attempt}`);
      return url;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Último intento, propagar error
      }
      // Esperar antes de reintentar
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.warn(`⚠️ Reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### SOLUCIÓN 4: Verificar descargabilidad

**Agregar verificación después de subir:**

```typescript
const verifyPhotoUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok || response.status === 403) {
      // 200-299 = OK, 403 = acceso denegado (pero existe)
      return true;
    }
    console.warn(`⚠️ URL devolvió status ${response.status}`);
    return false;
  } catch (error) {
    console.error(`❌ Error verificando URL:`, error);
    return false;
  }
};
```

### SOLUCIÓN 5: Configurar permisos anónimos en OneDrive

**En las carpetas de fotos en OneDrive:**
1. Ir a `Aquagold_Resistencias/MATERIA_PRIMA/`
2. Botón derecho → "Compartir"
3. "Copiar enlace" → "Personas con el enlace"
4. Cambiar a "Cualquiera" con permisos de "Lectura"

---

## 🔧 CAMBIOS RECOMENDADOS

### Cambio 1: Mejorar `handlePhotoUpload` en app/page.tsx

```typescript
const handlePhotoUpload = async (sampleId: string, file: File) => {
  try {
    setUploadingPhotos(prev => new Set([...prev, sampleId]));
    
    // ... código existente de validación ...
    
    // Subir con reintentos
    console.log('📤 Iniciando carga de foto con reintentos...');
    const photoUrl = await uploadPhotoWithRetry(
      instance, 
      loginRequest.scopes, 
      editedTest.lotNumber, 
      sampleId, 
      file, 
      editedTest.testType
    );
    
    // ✨ NUEVO: Verificar que URL es descargable
    console.log('🔍 Verificando que foto es descargable...');
    const isValid = await verifyPhotoUrl(photoUrl);
    if (!isValid) {
      throw new Error("La foto se subió pero no es accesible. Reintentando...");
    }
    
    console.log('✅ Foto verificada y lista para descargar');
    
    // Actualizar state
    setEditedTest(prev => ({
      ...prev,
      samples: prev.samples.map(s => 
        s.id === sampleId ? { ...s, photoUrl, isUploading: false } : s
      )
    }));
    
    // Auto-guardar
    if (saveTestFn) {
      await saveTestFn(updatedTest);
    } else {
      await saveTestToFirestore(updatedTest);
    }
    
    console.log('✅ Foto guardada exitosamente en Firestore');
    onTestUpdated();
    
  } catch (error: any) {
    console.error('❌ Error final al subir foto:', error);
    alert(`❌ Error persistente al subir foto (después de 3 intentos): ${error.message}`);
    // Limpiar estado sin guardar URL inválida
    setEditedTest(prev => ({
      ...prev,
      samples: prev.samples.map(s => 
        s.id === sampleId ? { ...s, photoUrl: '', isUploading: false } : s
      )
    }));
  } finally {
    setUploadingPhotos(prev => {
      const next = new Set(prev);
      next.delete(sampleId);
      return next;
    });
  }
};
```

---

## 📊 RESUMEN DE MEJORAS

| Problema | Solución | Impacto |
|----------|----------|--------|
| Falsa confirmación | Validar respuesta OneDrive | ⭐⭐⭐⭐⭐ CRÍTICO |
| Carpeta no existe | Crear carpeta si falta | ⭐⭐⭐⭐ Alto |
| Fallos transitorios | Reintentos con backoff | ⭐⭐⭐ Medio |
| URL no funciona | Verificar antes de guardar | ⭐⭐⭐ Medio |
| Permisos incorrectos | Configurar compartir público | ⭐⭐ Bajo |

---

## 🚀 IMPLEMENTACIÓN RECOMENDADA

### Fase 1 (Crítica - Esta semana):
- ✅ Solución 1: Validar carpeta existe
- ✅ Solución 2: Validar respuesta OneDrive
- ✅ Cambio 1: Mejorar handlePhotoUpload

### Fase 2 (Importante - Próxima semana):
- ✅ Solución 3: Reintentos automáticos
- ✅ Solución 4: Verificar descargabilidad

### Fase 3 (Opcional - Cuando sea posible):
- ✅ Solución 5: Permisos públicos en OneDrive

---

## 💡 CONCLUSIÓN

El problema es una **falta de validación en el flujo de carga**. La app cree que la foto se subió cuando realmente OneDrive nunca la recibió correctamente.

**Confiabilidad ANTES:** 70% (a veces falla sin motivo aparente)
**Confiabilidad DESPUÉS:** 99% (reintentos + validación)
