/**
 * ⚠️ SCRIPT DE MIGRACIÓN - MODO PREVIEW
 * 
 * Versión simplificada en JavaScript para evitar problemas de tsx
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('🔑 Variables de entorno cargadas');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log('');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = 'resistance_tests';
const DEFAULT_TEST_TYPE = 'MATERIA_PRIMA'; // ⚠️ Confirmado por el usuario
const CONFIRMED = false; // ⚠️ CAMBIAR A true PARA EJECUTAR LA MIGRACIÓN REAL

/**
 * Función principal de migración
 */
async function migrateTestTypes() {
  console.log('🚀 INICIANDO MIGRACIÓN DE TIPOS DE RESISTENCIA');
  console.log('='.repeat(60));
  console.log('');
  console.log(`⚠️  TIPO POR DEFECTO: ${DEFAULT_TEST_TYPE}`);
  console.log('');
  console.log('Este script asignará el tipo por defecto a TODOS los registros');
  console.log('que no tengan el campo testType.');
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  // Paso 1: Obtener todos los documentos
  console.log('📥 Paso 1: Obteniendo todos los registros...');
  const testsRef = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(testsRef);
  
  console.log(`✅ Se encontraron ${snapshot.size} registros en total`);
  console.log('');

  // Paso 2: Filtrar los que NO tienen testType
  console.log('🔍 Paso 2: Identificando registros sin testType...');
  const testsToMigrate = [];
  
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.testType) {
      testsToMigrate.push({
        id: docSnap.id,
        lotNumber: data.lotNumber || 'Sin lote',
        date: data.date || 'Sin fecha'
      });
    }
  });

  console.log(`✅ Se encontraron ${testsToMigrate.length} registros que necesitan migración`);
  console.log('');

  if (testsToMigrate.length === 0) {
    console.log('🎉 ¡No hay registros que migrar! Todos los registros ya tienen testType.');
    return;
  }

  // Paso 3: Mostrar preview de los registros a migrar
  console.log('📋 Registros que se migrarán (primeros 10):');
  console.log('');
  testsToMigrate.slice(0, 10).forEach((test, index) => {
    console.log(`  ${index + 1}. Lote: ${test.lotNumber} | Fecha: ${test.date}`);
  });
  
  if (testsToMigrate.length > 10) {
    console.log(`  ... y ${testsToMigrate.length - 10} más`);
  }
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  // Paso 4: Solicitar confirmación
  if (!CONFIRMED) {
    console.log('⚠️  MODO PREVIEW - NO SE MODIFICARÁN DATOS');
    console.log('');
    console.log(`Esto asignará el tipo ${DEFAULT_TEST_TYPE} a ${testsToMigrate.length} registros.`);
    console.log('');
    console.log('Para ejecutar la migración real:');
    console.log('1. Revisa los registros mostrados arriba');
    console.log('2. Haz backup de Firestore (Firebase Console)');
    console.log('3. Cambia CONFIRMED = false a true en este archivo (línea 26)');
    console.log('4. Ejecuta nuevamente: node scripts/migrate-simple.js');
    console.log('');
    console.log('✅ PREVIEW COMPLETADO');
    console.log('');
    console.log(`📊 Resumen:`);
    console.log(`   - Total de registros: ${snapshot.size}`);
    console.log(`   - Necesitan migración: ${testsToMigrate.length}`);
    console.log(`   - Ya tienen testType: ${snapshot.size - testsToMigrate.length}`);
    console.log('');
    return;
  }

  // Paso 5: Ejecutar migración
  console.log('🔄 Ejecutando migración REAL...');
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const test of testsToMigrate) {
    try {
      const testRef = doc(db, COLLECTION_NAME, test.id);
      await updateDoc(testRef, {
        testType: DEFAULT_TEST_TYPE
      });
      successCount++;
      console.log(`✅ [${successCount}/${testsToMigrate.length}] Migrado: ${test.lotNumber}`);
    } catch (error) {
      errorCount++;
      const errorMsg = error.message || 'Error desconocido';
      errors.push({ id: test.id, error: errorMsg });
      console.error(`❌ [Error] No se pudo migrar ${test.id}: ${errorMsg}`);
    }
  }

  // Paso 6: Resumen
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('');
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores:  ${errorCount}`);
  console.log(`📝 Total:    ${testsToMigrate.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('⚠️  ERRORES ENCONTRADOS:');
    console.log('');
    errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ID: ${err.id}`);
      console.log(`     Error: ${err.error}`);
    });
    console.log('');
  }

  // Paso 7: Verificación
  console.log('🔍 Verificando migración...');
  const verifySnapshot = await getDocs(testsRef);
  let withType = 0;
  let withoutType = 0;

  verifySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.testType) {
      withType++;
    } else {
      withoutType++;
    }
  });

  console.log(`✅ Registros con testType: ${withType}`);
  console.log(`❌ Registros sin testType: ${withoutType}`);
  console.log('');

  if (withoutType === 0) {
    console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
  } else {
    console.log('⚠️  Aún hay registros sin testType. Revisa los errores.');
  }

  console.log('');
  console.log('='.repeat(60));
}

// Ejecutar migración
migrateTestTypes()
  .then(() => {
    console.log('');
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ ERROR FATAL:', error);
    console.error('');
    process.exit(1);
  });
