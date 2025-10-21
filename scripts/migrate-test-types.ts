/**
 * ⚠️ SCRIPT DE MIGRACIÓN CRÍTICO ⚠️
 * 
 * Este script asigna el campo `testType` a todos los registros existentes
 * de ResistanceTest que no lo tengan.
 * 
 * IMPORTANTE:
 * - Ejecutar UNA SOLA VEZ antes del deployment
 * - Hacer backup de Firestore antes de ejecutar
 * - Por defecto asigna 'MATERIA_PRIMA' a todos los registros existentes
 * - Confirmar con el usuario antes de ejecutar
 * 
 * CÓMO EJECUTAR:
 * 1. Asegúrate de tener las credenciales de Firebase configuradas
 * 2. Ejecuta: npx tsx scripts/migrate-test-types.ts
 * 3. Confirma la operación cuando se te pregunte
 * 4. Verifica los resultados
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  where
} from 'firebase/firestore';

// Configuración de Firebase (misma que en lib/firebase.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = 'resistance_tests';
const DEFAULT_TEST_TYPE = 'MATERIA_PRIMA'; // ⚠️ CAMBIAR SI ES NECESARIO

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
  const testsToMigrate: Array<{ id: string; lotNumber: string; date: string }> = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (!data.testType) {
      testsToMigrate.push({
        id: doc.id,
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
    console.log(`  ${index + 1}. Lote: ${test.lotNumber} | Fecha: ${test.date} | ID: ${test.id}`);
  });
  
  if (testsToMigrate.length > 10) {
    console.log(`  ... y ${testsToMigrate.length - 10} más`);
  }
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  // Paso 4: Solicitar confirmación
  console.log('⚠️  ¿Estás SEGURO de que quieres continuar?');
  console.log('');
  console.log('Esto asignará el tipo', DEFAULT_TEST_TYPE, 'a', testsToMigrate.length, 'registros.');
  console.log('');
  console.log('Para continuar, edita este script y cambia CONFIRMED = false a true');
  console.log('');
  
  const CONFIRMED = false; // ⚠️ CAMBIAR A true PARA EJECUTAR
  
  if (!CONFIRMED) {
    console.log('❌ MIGRACIÓN CANCELADA - CONFIRMED = false');
    console.log('');
    console.log('Si deseas ejecutar la migración:');
    console.log('1. Revisa los registros que se mostrarán arriba');
    console.log('2. Haz backup de Firestore');
    console.log('3. Cambia CONFIRMED = true en este archivo');
    console.log('4. Ejecuta nuevamente el script');
    return;
  }

  // Paso 5: Ejecutar migración
  console.log('🔄 Paso 5: Ejecutando migración...');
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const test of testsToMigrate) {
    try {
      const testRef = doc(db, COLLECTION_NAME, test.id);
      await updateDoc(testRef, {
        testType: DEFAULT_TEST_TYPE
      });
      successCount++;
      console.log(`✅ [${successCount}/${testsToMigrate.length}] Migrado: ${test.lotNumber}`);
    } catch (error: any) {
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
  console.log('🔍 Paso 7: Verificando migración...');
  const verifySnapshot = await getDocs(testsRef);
  let withType = 0;
  let withoutType = 0;

  verifySnapshot.forEach((doc) => {
    const data = doc.data();
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
