/**
 * SCRIPT DE DIAGNÓSTICO: Verificar datos de 0004690-25 en Firebase
 * ==================================================================
 * 
 * Este script se ejecuta en la consola del navegador para verificar
 * si los datos completos de la resistencia 0004690-25 están en Firebase
 */

// Copiar y pegar en la consola del navegador (F12 → Console)

async function diagnosticar0004690() {
  console.log('🔍 DIAGNÓSTICO: Resistencia 0004690-25');
  console.log('='.repeat(60));
  
  try {
    // Importar funciones necesarias
    const { getFirestore, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Obtener Firestore
    const db = getFirestore();
    
    // Buscar por número de lote
    console.log('📡 Buscando en Firebase...');
    const testsRef = collection(db, 'resistance_tests');
    const q = query(testsRef, where('lotNumber', '==', '0004690-25'));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ NO ENCONTRADO en Firebase');
      console.log('   La resistencia 0004690-25 no existe en Firestore');
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log('✅ ENCONTRADO en Firebase');
    console.log('='.repeat(60));
    
    // Analizar estructura
    console.log('📊 INFORMACIÓN GENERAL:');
    console.log('  ID:', doc.id);
    console.log('  Lote:', data.lotNumber);
    console.log('  Tipo:', data.testType);
    console.log('  Fecha:', data.date);
    console.log('  Completada:', data.isCompleted ? 'SÍ' : 'NO');
    console.log('  Responsable:', data.responsable);
    
    console.log('\n📋 SAMPLES (Datos de horas):');
    if (!data.samples || data.samples.length === 0) {
      console.log('  ❌ NO HAY SAMPLES - DATOS PERDIDOS');
      return { found: true, hasSamples: false, data };
    }
    
    console.log('  ✅ Samples encontrados:', data.samples.length, 'horas');
    console.log('\n  Detalle de cada hora:');
    
    data.samples.forEach((sample, index) => {
      console.log(`    Hora ${index + 1}: ${sample.hour}`);
      console.log(`      Vivos: ${sample.vivos}`);
      console.log(`      Moribundos: ${sample.moribundos}`);
      console.log(`      Muertos: ${sample.muertos}`);
      console.log(`      Supervivencia: ${sample.supervivencia}%`);
      console.log(`      Foto: ${sample.photoUrl ? '✅ Sí' : '❌ No'}`);
      
      if (sample.vivos === undefined && sample.moribundos === undefined && sample.muertos === undefined) {
        console.log('      ⚠️ DATOS VACÍOS en esta hora');
      }
    });
    
    console.log('\n📸 FOTOS:');
    const samplesConFoto = data.samples.filter(s => s.photoUrl && s.photoUrl.trim() !== '');
    console.log('  Total con foto:', samplesConFoto.length, 'de', data.samples.length);
    
    if (samplesConFoto.length === 1) {
      console.log('  ⚠️ SOLO 1 FOTO - Confirma el problema reportado');
    }
    
    console.log('\n💾 DATOS COMPLETOS:');
    console.log('  Ver en consola → objeto "data"');
    console.log(data);
    
    console.log('\n📊 DIAGNÓSTICO:');
    const samplesConDatos = data.samples.filter(s => 
      s.vivos !== undefined || s.moribundos !== undefined || s.muertos !== undefined
    );
    
    if (samplesConDatos.length === 0) {
      console.log('  ❌ PROBLEMA CONFIRMADO: No hay datos de vivos/moribundos/muertos');
      console.log('  ✅ SOLUCIÓN: Usar script de recuperación desde Excel');
    } else if (samplesConDatos.length < data.samples.length) {
      console.log('  ⚠️ PROBLEMA PARCIAL: Algunos samples sin datos');
      console.log('  ✅ SOLUCIÓN: Recuperar desde Excel o completar manualmente');
    } else {
      console.log('  ✅ DATOS COMPLETOS: Todos los samples tienen información');
      console.log('  ℹ️ Si el problema persiste, puede ser de visualización');
    }
    
    return { found: true, hasSamples: true, data, samplesConDatos };
    
  } catch (error) {
    console.error('❌ ERROR durante diagnóstico:', error);
    console.error('   Asegúrate de estar en la página de la aplicación');
    return null;
  }
}

// Ejecutar diagnóstico
console.log('🚀 Ejecutando diagnóstico de 0004690-25...');
console.log('⏳ Espera unos segundos...\n');

diagnosticar0004690().then(result => {
  if (!result) {
    console.log('\n❌ No se pudo completar el diagnóstico');
    console.log('💡 Asegúrate de:');
    console.log('   1. Estar en la página de la aplicación (http://localhost:8080)');
    console.log('   2. Haber iniciado sesión');
    console.log('   3. Tener conexión a Internet');
  } else {
    console.log('\n✅ Diagnóstico completado');
    console.log('📋 Ver resultados arriba');
  }
});
