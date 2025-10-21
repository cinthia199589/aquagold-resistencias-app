/**
 * SCRIPT DE DIAGNÓSTICO FIRESTORE
 * Ejecutar DENTRO de la aplicación (en la página del dashboard)
 * 
 * INSTRUCCIONES:
 * 1. Abre http://localhost:8080/dashboard
 * 2. Abre DevTools (F12)
 * 3. Ve a la pestaña Console
 * 4. Copia y pega TODO este script
 * 5. Presiona Enter
 */

async function diagnosticarFirestore0004690() {
  console.log('🔍 DIAGNÓSTICO FIRESTORE: Resistencia 0004690-25');
  console.log('='.repeat(60));
  
  try {
    // Importar módulos de Firebase desde el contexto de la aplicación
    const { db } = await import('./lib/firebase');
    const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
    
    console.log('\n✅ Firebase conectado correctamente\n');
    
    // MÉTODO 1: Buscar por ID directo
    console.log('📌 MÉTODO 1: Buscar por ID directo...');
    const docRef = doc(db, 'resistance_tests', '0004690-25');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ ENCONTRADO en Firestore por ID directo');
      console.log('\n📊 RESUMEN DE DATOS:');
      console.log(`  Lote: ${data.numeroLote}`);
      console.log(`  Tipo: ${data.testType}`);
      console.log(`  Estado: ${data.estado}`);
      console.log(`  Fecha: ${data.fecha}`);
      console.log(`  Responsable QC: ${data.responsableQC || 'N/A'}`);
      
      // Analizar horas
      if (data.horas && Array.isArray(data.horas)) {
        console.log(`\n⏱️ HORAS REGISTRADAS: ${data.horas.length}`);
        
        let horasConDatos = 0;
        let horasConFotos = 0;
        
        data.horas.forEach((hora, index) => {
          const tieneDatos = (
            (hora.vivos !== null && hora.vivos !== undefined) ||
            (hora.muertos !== null && hora.muertos !== undefined) ||
            (hora.enfermos !== null && hora.enfermos !== undefined)
          );
          
          const tieneFotos = hora.photoURLs && hora.photoURLs.length > 0;
          
          if (tieneDatos) horasConDatos++;
          if (tieneFotos) horasConFotos++;
          
          if (tieneDatos || tieneFotos) {
            console.log(`\n  📍 Hora ${hora.hora}:`);
            if (tieneDatos) {
              console.log(`     Vivos: ${hora.vivos}, Muertos: ${hora.muertos}, Enfermos: ${hora.enfermos}`);
            }
            if (tieneFotos) {
              console.log(`     Fotos: ${hora.photoURLs.length}`);
              console.log(`     Primera foto: ${hora.photoURLs[0]?.substring(0, 80)}...`);
            }
          }
        });
        
        console.log(`\n📈 RESUMEN:`);
        console.log(`  ✅ Horas con datos numéricos: ${horasConDatos}`);
        console.log(`  📸 Horas con fotos: ${horasConFotos}`);
        
        if (horasConDatos === 0 && horasConFotos === 1) {
          console.log('\n⚠️ CONFIRMADO: Datos perdidos, solo queda 1 foto');
          console.log('💡 RECOMENDACIÓN: Recuperar desde Excel');
        } else if (horasConDatos > 0) {
          console.log('\n✅ Los datos SÍ existen en Firestore');
          console.log('💡 PROBLEMA: Puede ser de visualización o caché');
        }
      }
      
      // Mostrar datos completos
      console.log('\n📄 DATOS COMPLETOS:');
      console.log(JSON.stringify(data, null, 2));
      
      return data;
      
    } else {
      console.log('❌ NO ENCONTRADO por ID directo');
      
      // MÉTODO 2: Buscar por número de lote
      console.log('\n📌 MÉTODO 2: Buscar por número de lote...');
      const q = query(
        collection(db, 'resistance_tests'),
        where('numeroLote', '==', '0004690-25')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('❌ NO ENCONTRADO por número de lote');
        console.log('\n❗ CONCLUSIÓN: La resistencia NO existe en Firestore');
        console.log('💡 SOLUCIÓN: Recuperar desde archivo Excel en OneDrive');
        console.log('📋 Ver: RECUPERACION_0004690-25.md');
        return null;
      } else {
        console.log(`✅ ENCONTRADO ${querySnapshot.size} resultado(s)`);
        querySnapshot.forEach((doc) => {
          console.log(`\n  ID: ${doc.id}`);
          console.log(`  Datos:`, doc.data());
        });
        return querySnapshot.docs[0].data();
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.log('\n💡 POSIBLES CAUSAS:');
    console.log('  1. No estás en la página del dashboard');
    console.log('  2. La aplicación no está cargada completamente');
    console.log('  3. No hay conexión a Firebase');
    console.log('\n🔧 SOLUCIÓN:');
    console.log('  1. Ve a http://localhost:8080/dashboard');
    console.log('  2. Espera que cargue completamente');
    console.log('  3. Ejecuta este script de nuevo');
    return null;
  }
}

// Ejecutar automáticamente
console.log('🚀 Iniciando diagnóstico Firestore...\n');
diagnosticarFirestore0004690().then(result => {
  if (result) {
    console.log('\n✅ Diagnóstico completado');
  } else {
    console.log('\n⚠️ Diagnóstico completado - Datos no encontrados');
  }
}).catch(error => {
  console.error('\n❌ Error en diagnóstico:', error);
});
