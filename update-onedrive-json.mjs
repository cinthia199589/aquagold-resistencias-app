/**
 * Script para actualizar archivos JSON en OneDrive
 * Agrega el campo testType a todos los archivos existentes
 * 
 * Uso: node update-onedrive-json.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔧 Inicializando Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Token de acceso de OneDrive (deberás obtenerlo manualmente)
const ACCESS_TOKEN = process.env.ONEDRIVE_ACCESS_TOKEN;

async function updateOneDriveJSON() {
  try {
    console.log('\n📥 Cargando tests desde Firestore...');
    const testsRef = collection(db, 'resistance_tests');
    const snapshot = await getDocs(testsRef);
    
    const tests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ ${tests.length} tests cargados desde Firestore\n`);

    if (!ACCESS_TOKEN) {
      console.error('❌ ERROR: Falta la variable de entorno ONEDRIVE_ACCESS_TOKEN');
      console.log('\n📝 Para obtener el token:');
      console.log('1. Ve a: http://localhost:8080/update-onedrive-json');
      console.log('2. Inicia sesión con Microsoft');
      console.log('3. Abre la consola del navegador (F12)');
      console.log('4. Ejecuta: localStorage.getItem("msal.token.keys")');
      console.log('5. Copia el token y agrégalo a .env.local como ONEDRIVE_ACCESS_TOKEN\n');
      process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      try {
        console.log(`🔄 [${i + 1}/${tests.length}] Actualizando ${test.lotNumber}...`);
        
        if (!test.testType) {
          console.log(`   ⚠️  Test sin testType en Firestore, saltando...`);
          errorCount++;
          continue;
        }

        // Ruta del archivo en OneDrive
        const folderPath = `Aquagold_Resistencias/${test.lotNumber}`;
        const fileName = `${test.id}.json`;
        const filePath = `${folderPath}/${fileName}`;

        // Crear contenido JSON
        const jsonContent = JSON.stringify(test, null, 2);

        // Subir a OneDrive
        const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${filePath}:/content`;
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: jsonContent
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }

        console.log(`   ✅ ${test.lotNumber} actualizado (testType: ${test.testType})`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error en ${test.lotNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ACTUALIZACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total: ${tests.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error);
    process.exit(1);
  }
}

// Ejecutar
updateOneDriveJSON();
