/**
 * RECUPERACIÓN DE DATOS DESDE ONEDRIVE
 * =====================================
 * 
 * Script para recuperar datos de resistencias desde archivos Excel
 * cuando se perdieron en Firestore/IndexedDB pero existen en OneDrive
 */

import type { ResistanceTest } from './types';

/**
 * Recuperar datos desde un archivo Excel de OneDrive
 * 
 * NOTA: Esta función requiere que XLSX esté disponible en el navegador.
 * Usa el script en RECUPERACION_0004690-25.md que carga XLSX dinámicamente.
 * 
 * @param excelBlob Blob del archivo Excel descargado de OneDrive
 * @param testId ID del test (para validación)
 * @returns Objeto ResistanceTest recuperado
 */
export const recoverTestFromExcel = async (
  excelBlob: Blob,
  testId: string,
  XLSX: any  // Librería XLSX cargada dinámicamente
): Promise<Partial<ResistanceTest>> => {
  try {
    console.log(`🔄 Recuperando datos del test ${testId} desde Excel...`);
    
    // Leer Excel
    const arrayBuffer = await excelBlob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Obtener hoja "Datos"
    const sheetName = workbook.SheetNames[0]; // Primera hoja
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Extraer información
    const recoveredData: Partial<ResistanceTest> = {
      id: testId,
      samples: []
    };
    
    // Buscar información del header
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      // Buscar "Lote:"
      if (row[0]?.toString().includes('Lote:')) {
        recoveredData.lotNumber = row[1]?.toString() || '';
      }
      
      // Buscar "Tipo:"
      if (row[0]?.toString().includes('Tipo:')) {
        const tipo = row[1]?.toString() || '';
        recoveredData.testType = tipo.includes('Materia Prima') ? 'MATERIA_PRIMA' : 'PRODUCTO_TERMINADO';
      }
      
      // Buscar "Fecha:"
      if (row[0]?.toString().includes('Fecha:')) {
        const fecha = row[1]?.toString() || '';
        // Convertir formato DD/MM/YYYY a YYYY-MM-DD
        const [day, month, year] = fecha.split('/');
        if (day && month && year) {
          recoveredData.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      // Buscar "Responsable QC:"
      if (row[0]?.toString().includes('Responsable')) {
        recoveredData.responsable = row[1]?.toString() || '';
      }
    }
    
    // Buscar tabla de datos (después de la línea "Hora")
    let dataStartRow = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]?.toString() === 'Hora') {
        dataStartRow = i + 1;
        break;
      }
    }
    
    if (dataStartRow === -1) {
      throw new Error('No se encontró la tabla de datos en el Excel');
    }
    
    // Extraer samples
    const samples: any[] = [];
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue; // Fila vacía
      
      const hour = row[0]?.toString();
      if (!hour || hour === 'PROMEDIO') break; // Fin de datos
      
      const sample: any = {
        hour: hour,
        vivos: parseFloat(row[1]?.toString() || '0') || 0,
        moribundos: parseFloat(row[2]?.toString() || '0') || 0,
        muertos: parseFloat(row[3]?.toString() || '0') || 0,
        // Calcular supervivencia
        supervivencia: 0,
        photoUrl: '' // No podemos recuperar esto del Excel
      };
      
      const total = sample.vivos + sample.moribundos + sample.muertos;
      if (total > 0) {
        sample.supervivencia = (sample.vivos / total) * 100;
      }
      
      samples.push(sample);
    }
    
    recoveredData.samples = samples;
    recoveredData.isCompleted = true;
    recoveredData.completedAt = new Date().toISOString();
    
    console.log(`✅ Datos recuperados: ${samples.length} horas de datos`);
    
    return recoveredData;
    
  } catch (error) {
    console.error('❌ Error recuperando datos desde Excel:', error);
    throw error;
  }
};

/**
 * Función helper para uso en consola del navegador
 * 
 * USO:
 * 1. Descarga el Excel de OneDrive manualmente
 * 2. En consola del navegador:
 *    const file = document.createElement('input');
 *    file.type = 'file';
 *    file.accept = '.xlsx';
 *    file.onchange = async (e) => {
 *      const blob = e.target.files[0];
 *      const data = await recoverTestFromExcel(blob, 'ID_DEL_TEST');
 *      console.log('Datos recuperados:', data);
 *      // Ahora puedes guardar con: await saveTestToFirestore({...data, ...otroscampos});
 *    };
 *    file.click();
 */
export const browserRecovery = () => {
  console.log(`
🔧 RECUPERACIÓN DE DATOS DESDE EXCEL
===================================

Para recuperar los datos de una resistencia perdida:

1. Descarga el archivo Excel de OneDrive de la resistencia afectada
   (Ejemplo: Aquagold_MP/0004690-25/Reporte_Resistencia_0004690-25.xlsx)

2. Ejecuta este código en la consola:

const input = document.createElement('input');
input.type = 'file';
input.accept = '.xlsx';
input.onchange = async (e) => {
  const file = e.target.files[0];
  const { recoverTestFromExcel } = await import('./lib/recoverFromOneDrive');
  const { saveTestToFirestore } = await import('./lib/firestoreService');
  
  try {
    // Recuperar datos
    const recoveredData = await recoverTestFromExcel(file, 'ID_DEL_TEST');
    console.log('📊 Datos recuperados:', recoveredData);
    
    // Obtener test actual de Firestore (con fotos)
    const currentTest = await getTestLocally('ID_DEL_TEST');
    
    // Combinar datos recuperados + fotos actuales
    const completeTest = {
      ...recoveredData,
      samples: recoveredData.samples.map((s, i) => ({
        ...s,
        photoUrl: currentTest?.samples?.[i]?.photoUrl || ''
      }))
    };
    
    // Guardar en Firestore
    await saveTestToFirestore(completeTest);
    console.log('✅ Datos restaurados correctamente');
    
    // Recargar página
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
input.click();

3. Selecciona el archivo Excel cuando se abra el selector
4. Los datos se restaurarán automáticamente
  `);
};
