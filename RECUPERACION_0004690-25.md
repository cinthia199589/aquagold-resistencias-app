# 🆘 Guía de Recuperación - Resistencia 0004690-25

## 🔍 Problema Detectado

**Resistencia:** 0004690-25  
**Síntoma:** Solo aparece 1 foto, sin datos de las horas  
**Estado:** Completada  
**Causa:** Los datos se guardaron en OneDrive pero no en Firestore/IndexedDB

---

## ✅ Verificación Inicial

### Paso 1: Verificar que los datos existen en OneDrive

1. Abre OneDrive en el navegador
2. Busca la carpeta de la resistencia:
   - Si es Materia Prima: `Aquagold_MP/0004690-25/`
   - Si es Producto Terminado: `Aquagold_PT/0004690-25/`

3. Verifica que existe el archivo Excel:
   - `Reporte_Resistencia_0004690-25.xlsx`

4. Verifica que existen las fotos de cada hora

Si todo está ahí, los datos NO se perdieron, solo necesitan restaurarse en la aplicación.

---

## 🔧 Solución 1: Recuperación Automática (RECOMENDADO)

### Opción A: Usando la Consola del Navegador

1. **Abre la aplicación** en el navegador
2. **Abre la consola** (F12 o Click derecho → Inspeccionar → Console)
3. **Descarga el Excel** de OneDrive manualmente a tu computadora
4. **Copia y pega** este código en la consola:

```javascript
// PASO 1: Abrir selector de archivos
const input = document.createElement('input');
input.type = 'file';
input.accept = '.xlsx';

input.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  console.log('📂 Archivo cargado:', file.name);
  
  try {
    // Importar librerías necesarias
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
    
    // Leer Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📊 Datos del Excel:', data);
    
    // Extraer información
    let lotNumber = '';
    let testType = 'MATERIA_PRIMA';
    let date = '';
    let qcResponsible = '';
    
    // Buscar en las primeras filas
    for (let i = 0; i < 20; i++) {
      const row = data[i];
      if (!row) continue;
      
      if (row[0]?.toString().includes('Lote:')) {
        lotNumber = row[1]?.toString() || '';
      }
      if (row[0]?.toString().includes('Tipo:')) {
        testType = row[1]?.toString().includes('Producto') ? 'PRODUCTO_TERMINADO' : 'MATERIA_PRIMA';
      }
      if (row[0]?.toString().includes('Fecha:')) {
        const [day, month, year] = (row[1]?.toString() || '').split('/');
        if (day && month && year) {
          date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      if (row[0]?.toString().includes('Responsable')) {
        qcResponsible = row[1]?.toString() || '';
      }
    }
    
    // Buscar inicio de datos
    let dataStart = data.findIndex(row => row[0]?.toString() === 'Hora');
    if (dataStart === -1) {
      throw new Error('No se encontró la tabla de datos');
    }
    
    // Extraer samples
    const samples = [];
    for (let i = dataStart + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) break;
      
      const hour = row[0]?.toString();
      if (hour === 'PROMEDIO') break;
      
      const vivos = parseFloat(row[1]) || 0;
      const moribundos = parseFloat(row[2]) || 0;
      const muertos = parseFloat(row[3]) || 0;
      const total = vivos + moribundos + muertos;
      
      samples.push({
        hour: hour,
        vivos: vivos,
        moribundos: moribundos,
        muertos: muertos,
        supervivencia: total > 0 ? (vivos / total) * 100 : 0,
        photoUrl: '' // Se recuperará después
      });
    }
    
    console.log('✅ Información recuperada:');
    console.log('  Lote:', lotNumber);
    console.log('  Tipo:', testType);
    console.log('  Fecha:', date);
    console.log('  Samples:', samples.length, 'horas');
    
    // Obtener test actual para conservar fotos
    const { getTestLocally } = await import('./lib/localDataService.js');
    const currentTest = await getTestLocally(lotNumber);
    
    if (currentTest) {
      console.log('📸 Test actual encontrado, recuperando fotos...');
      // Combinar samples recuperados con fotos actuales
      samples.forEach((s, i) => {
        if (currentTest.samples?.[i]?.photoUrl) {
          s.photoUrl = currentTest.samples[i].photoUrl;
        }
      });
    }
    
    // Crear objeto completo
    const recoveredTest = {
      id: currentTest?.id || lotNumber,
      lotNumber: lotNumber,
      testType: testType,
      date: date,
      qcResponsible: qcResponsible,
      samples: samples,
      isCompleted: true,
      completedAt: currentTest?.completedAt || new Date().toISOString(),
      createdAt: currentTest?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('💾 Guardando datos recuperados...');
    
    // Guardar en Firestore
    const { saveTestToFirestore } = await import('./lib/firestoreService.js');
    await saveTestToFirestore(recoveredTest);
    
    console.log('✅ ¡DATOS RESTAURADOS CORRECTAMENTE!');
    console.log('🔄 Recargando página...');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error durante la recuperación:', error);
    console.error('Por favor contacta soporte con esta información');
  }
};

// Abrir selector
input.click();
console.log('📂 Selecciona el archivo Excel de la resistencia...');
```

5. **Selecciona el archivo Excel** que descargaste
6. **Espera** a que termine el proceso (2-3 segundos)
7. La página se **recargará automáticamente** con los datos restaurados

---

## 🔧 Solución 2: Recuperación Manual

Si la solución automática no funciona:

### Paso 1: Descargar datos desde OneDrive

1. Descarga el Excel: `Reporte_Resistencia_0004690-25.xlsx`
2. Ábrelo en Excel
3. Copia todos los datos de cada hora (vivos, moribundos, muertos)

### Paso 2: Re-ingresar en la aplicación

1. Busca la resistencia 0004690-25 en el historial
2. Haz clic en "Editar"
3. Re-ingresa los datos de cada hora manualmente
4. Las fotos deberían estar ahí
5. Guarda los cambios

---

## 🛡️ Prevención: Activar Respaldo JSON

Para evitar que esto vuelva a pasar:

**✅ YA ACTIVADO:** El sistema `ENABLE_DUAL_WRITE: true` está activo.

Ahora cada vez que guardes o completes una resistencia:
1. Se guarda en Firestore (base de datos principal)
2. Se guarda en IndexedDB (caché local)
3. **Se guarda en OneDrive** (respaldo JSON) ← NUEVO

Estructura de respaldos:
```
Aquagold_MP/
├── 0004690-25/
│   ├── Reporte_Resistencia_0004690-25.xlsx
│   └── fotos/
└── database/
    └── tests/
        └── 2025-10/
            └── test-0004690-25.json  ← NUEVO RESPALDO
```

---

## 📊 Diagnóstico del Problema Original

**¿Por qué pasó esto?**

1. Cuando se completó la resistencia, se generó el Excel y se guardó en OneDrive ✅
2. Las fotos se subieron correctamente a OneDrive ✅
3. **PERO** los datos de las muestras NO se guardaron en Firestore/IndexedDB ❌

**Posibles causas:**
- Error de red al momento de guardar en Firestore
- Navegador cerrado antes de completar la sincronización
- Caché del navegador borrada
- El auto-guardado no funcionó correctamente

**Solución implementada:**
- ✅ Sistema de respaldo JSON activado (`ENABLE_DUAL_WRITE: true`)
- ✅ Triple respaldo: Firestore + IndexedDB + OneDrive JSON
- ✅ Script de recuperación automática desde Excel

---

## ✅ Verificación Post-Recuperación

Después de recuperar los datos:

1. [ ] Busca la resistencia 0004690-25 en el dashboard
2. [ ] Verifica que aparecen TODOS los datos de las horas
3. [ ] Verifica que las fotos están presentes
4. [ ] Verifica que el estado es "Completada"
5. [ ] Descarga el Excel y verifica que está correcto

---

## 🆘 Si la Recuperación Falla

Si la recuperación automática no funciona:

1. **Toma captura de pantalla** de la consola del navegador con los errores
2. **Verifica** que el archivo Excel se descargó correctamente de OneDrive
3. **Contacta soporte** con esta información:
   - Número de lote: 0004690-25
   - Tipo de resistencia (MP o PT)
   - Captura de consola
   - Archivo Excel

---

## 📞 Resumen

**Estado actual:**
- ✅ Respaldo JSON activado
- ✅ Script de recuperación listo
- 🔄 Pendiente: Ejecutar recuperación de 0004690-25

**Próximo paso:**
Ejecuta la **Solución 1** (script en consola) para recuperar los datos de la resistencia 0004690-25.
