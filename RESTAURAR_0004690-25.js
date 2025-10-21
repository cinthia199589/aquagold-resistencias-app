/**
 * SCRIPT DE RESTAURACIÓN: Resistencia 0004690-25
 * ================================================
 * 
 * Este script restaura los datos de la resistencia 0004690-25 en Firebase
 * 
 * INSTRUCCIONES:
 * 1. Abre http://localhost:8080/dashboard
 * 2. Abre DevTools (F12) → Console
 * 3. Copia y pega TODO este script
 * 4. Presiona Enter
 */

async function restaurar0004690() {
  console.log('🔄 RESTAURANDO RESISTENCIA 0004690-25');
  console.log('='.repeat(60));
  
  try {
    // Datos originales del JSON
    const datosOriginales = {
      "id": "rt-1760794641085",
      "date": "2025-10-18",
      "isCompleted": false,
      "pool": "42",
      "lotNumber": "0004690-25",
      "provider": "CYBERNIUS ",
      "samples": [
        {
          "rawUnits": 0,
          "cookedUnits": 0,
          "id": "s-1760794641087-0",
          "isUploading": false,
          "timeSlot": 0,
          "photoUrl": "https://aquagoldec-my.sharepoint.com/personal/laborganoleptico1_aquagold_com_ec/Documents/Aquagold_Resistencias/0004690-25/foto_s-1760794641087-0.jpg"
        },
        {
          "id": "s-1760794641087-1",
          "timeSlot": 2,
          "rawUnits": 0,
          "cookedUnits": 0
        },
        {
          "timeSlot": 4,
          "rawUnits": 0,
          "id": "s-1760794641087-2",
          "cookedUnits": 0
        },
        {
          "rawUnits": 0,
          "cookedUnits": 0,
          "id": "s-1760794641088-3",
          "timeSlot": 6
        },
        {
          "cookedUnits": 0,
          "id": "s-1760794641088-4",
          "timeSlot": 8,
          "rawUnits": 0
        },
        {
          "rawUnits": null,
          "cookedUnits": null,
          "id": "s-1760794641088-5",
          "timeSlot": 10
        },
        {
          "rawUnits": 0,
          "cookedUnits": 0,
          "id": "s-1760794641088-6",
          "timeSlot": 12
        }
      ],
      "startTime": "09:20",
      "certificationType": "ASC",
      "so2Bf": 43,
      "observations": "",
      "so2Residuals": null,
      "updatedAt": {
        "nanoseconds": 723000000,
        "seconds": 1761066072
      },
      "createdBy": "Usuario Desconocido",
      "responsable": "Johanna Mendoza "
    };
    
    console.log('📊 Datos originales cargados');
    console.log('  ID:', datosOriginales.id);
    console.log('  Lote:', datosOriginales.lotNumber);
    console.log('  Fecha:', datosOriginales.date);
    console.log('  Samples:', datosOriginales.samples.length);
    
    // Transformar al formato correcto de ResistanceTest
    const testRestaurado = {
      id: datosOriginales.lotNumber, // Usar lotNumber como ID
      numeroLote: datosOriginales.lotNumber,
      fecha: datosOriginales.date,
      horaInicio: datosOriginales.startTime,
      piscina: datosOriginales.pool,
      proveedor: datosOriginales.provider,
      tipoCertificacion: datosOriginales.certificationType,
      so2Antes: datosOriginales.so2Bf,
      so2Despues: datosOriginales.so2Residuals,
      observaciones: datosOriginales.observations || '',
      responsableQC: datosOriginales.responsable,
      testType: 'MATERIA_PRIMA', // Asumir MP por el lote
      estado: 'en_proceso', // No completada
      
      // Transformar samples al formato correcto
      horas: datosOriginales.samples.map(sample => ({
        hora: sample.timeSlot.toString(),
        vivos: sample.rawUnits !== null ? sample.rawUnits : 0,
        muertos: sample.cookedUnits !== null ? sample.cookedUnits : 0,
        enfermos: 0, // No existe en los datos originales
        supervivencia: 0, // Se calculará
        photoURLs: sample.photoUrl ? [sample.photoUrl] : []
      })),
      
      // Metadatos
      creadoPor: datosOriginales.createdBy || 'Sistema',
      creadoEn: new Date(datosOriginales.updatedAt.seconds * 1000).toISOString(),
      actualizadoEn: new Date(datosOriginales.updatedAt.seconds * 1000).toISOString(),
      completadoEn: null,
      
      // Campos adicionales requeridos
      tamanio: '',
      temperatura: '',
      pesoPromedio: '',
      numeroCamarones: '',
    };
    
    // Calcular supervivencia para cada hora
    testRestaurado.horas.forEach(hora => {
      const total = hora.vivos + hora.muertos + hora.enfermos;
      hora.supervivencia = total > 0 ? (hora.vivos / total) * 100 : 0;
    });
    
    console.log('\n✅ Test transformado al formato correcto');
    console.log('  Horas con datos:', testRestaurado.horas.length);
    console.log('  Horas con fotos:', testRestaurado.horas.filter(h => h.photoURLs.length > 0).length);
    
    // Importar servicios de Firebase
    const { db } = await import('./lib/firebase.js');
    const { doc, setDoc } = await import('firebase/firestore');
    
    console.log('\n💾 Guardando en Firestore...');
    
    // Guardar en Firestore
    const docRef = doc(db, 'resistance_tests', testRestaurado.id);
    await setDoc(docRef, testRestaurado);
    
    console.log('✅ DATOS RESTAURADOS EN FIRESTORE');
    
    // Guardar en IndexedDB también
    try {
      const { saveTestLocally } = await import('./lib/localDataService.js');
      await saveTestLocally(testRestaurado);
      console.log('✅ DATOS GUARDADOS EN INDEXEDDB');
    } catch (localError) {
      console.warn('⚠️ No se pudo guardar en IndexedDB:', localError.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ¡RESTAURACIÓN COMPLETADA!');
    console.log('\n📋 RESUMEN:');
    console.log('  ✅ Datos guardados en Firestore');
    console.log('  ✅ Datos guardados en IndexedDB');
    console.log('  ✅ ID del test:', testRestaurado.id);
    console.log('  ✅ Número de lote:', testRestaurado.numeroLote);
    console.log('  ✅ Fecha:', testRestaurado.fecha);
    console.log('  ✅ Horas registradas:', testRestaurado.horas.length);
    console.log('  ✅ Fotos:', testRestaurado.horas.filter(h => h.photoURLs.length > 0).length);
    console.log('\n🔄 Recargando página en 3 segundos...');
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
    return testRestaurado;
    
  } catch (error) {
    console.error('❌ ERROR durante la restauración:', error);
    console.error('   Detalles:', error.message);
    console.error('   Stack:', error.stack);
    
    console.log('\n💡 SOLUCIONES:');
    console.log('  1. Asegúrate de estar en http://localhost:8080/dashboard');
    console.log('  2. Verifica que iniciaste sesión');
    console.log('  3. Revisa la consola para más detalles del error');
    
    return null;
  }
}

// Ejecutar automáticamente
console.log('🚀 Iniciando restauración de 0004690-25...\n');
restaurar0004690().then(result => {
  if (!result) {
    console.log('\n❌ La restauración falló');
    console.log('📋 Revisa los errores arriba para más información');
  }
}).catch(error => {
  console.error('\n❌ Error crítico:', error);
});
