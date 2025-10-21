/**
 * Función para migrar URLs de fotos en el navegador
 * Ejecutar desde la consola del navegador con autenticación activa
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ResistanceTest, TestType } from './types';

interface Sample {
  id: string;
  weight?: number;
  photoURL?: string;
  [key: string]: any;
}

export async function migratePhotoUrls() {
  try {
    console.log('🔥 Iniciando migración de URLs...\n');
    
    const testsRef = collection(db, 'resistance_tests');
    const snapshot = await getDocs(testsRef);

    if (snapshot.empty) {
      console.log('⚠️  No hay pruebas para migrar.');
      return { success: false, message: 'No hay pruebas' };
    }

    console.log(`✅ Encontradas ${snapshot.size} pruebas\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let totalUpdated = 0;
    let totalTests = 0;
    let totalPhotos = 0;

    for (const docSnap of snapshot.docs) {
      const test = { id: docSnap.id, ...docSnap.data() } as ResistanceTest;
      totalTests++;

      console.log(`📦 Lote: ${test.lotNumber}`);
      console.log(`   Tipo: ${test.testType === 'MATERIA_PRIMA' ? 'MP ⚗️' : 'PT 📦'}`);

      const folderName = test.testType === 'MATERIA_PRIMA' ? 'Aquagold_MP' : 'Aquagold_PT';
      let updatedSamples = false;
      let photosInTest = 0;

      const samples = test.samples.map((sample: Sample) => {
        if (sample.photoURL && sample.photoURL.includes('Aquagold_Resistencias')) {
          const oldURL = sample.photoURL;
          const newURL = sample.photoURL.replace('Aquagold_Resistencias', folderName);
          
          console.log(`   📸 Muestra ${sample.id}:`);
          console.log(`      ❌ ANTES:   ...${oldURL.substring(oldURL.indexOf('Aquagold'))}`);
          console.log(`      ✅ DESPUÉS: ...${newURL.substring(newURL.indexOf('Aquagold'))}`);
          
          updatedSamples = true;
          photosInTest++;
          totalPhotos++;
          return { ...sample, photoURL: newURL };
        }
        return sample;
      });

      if (updatedSamples) {
        await updateDoc(doc(db, 'resistance_tests', test.id), { samples });
        totalUpdated++;
        console.log(`   ✅ ${photosInTest} foto(s) actualizadas\n`);
      } else {
        console.log(`   ⏭️  Sin fotos antiguas\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 MIGRACIÓN COMPLETADA!\n');
    console.log(`📊 Resumen:`);
    console.log(`   Total de pruebas: ${totalTests}`);
    console.log(`   Pruebas actualizadas: ${totalUpdated}`);
    console.log(`   Fotos migradas: ${totalPhotos}`);
    console.log(`   Sin cambios: ${totalTests - totalUpdated}`);
    console.log('\n✅ Recarga la página para ver los cambios.');

    return {
      success: true,
      totalTests,
      totalUpdated,
      totalPhotos,
      message: 'Migración completada exitosamente'
    };

  } catch (error: any) {
    console.error('❌ Error en la migración:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

// Exponer función globalmente para uso en consola
if (typeof window !== 'undefined') {
  (window as any).migratePhotoUrls = migratePhotoUrls;
}
