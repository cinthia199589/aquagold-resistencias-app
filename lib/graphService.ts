import { IPublicClientApplication } from "@azure/msal-browser";
import { ResistanceTest, TestType } from "./types";

// Función para obtener la carpeta según el tipo de test
const getOneDriveFolderByType = (testType: TestType): string => {
  return testType === 'MATERIA_PRIMA' ? 'Aquagold_MP' : 'Aquagold_PT';
};

const getGraphClient = async (msalInstance: IPublicClientApplication, scopes: string[]) => {
  // Verificar que la instancia MSAL esté disponible
  if (!msalInstance) {
    throw new Error("La instancia de MSAL no está disponible. Por favor, vuelve a cargar la página.");
  }

  let account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  let tokenResponse;

  if (!account) {
    // Intentar hacer login interactivo si no hay cuenta
    try {
      const loginResponse = await msalInstance.loginPopup({ scopes });
      if (!loginResponse.account) {
        throw new Error("No se pudo obtener una cuenta después del login.");
      }
      account = loginResponse.account;
      tokenResponse = loginResponse;
    } catch (loginError: any) {
      throw new Error("No hay una cuenta activa. Por favor, inicia sesión nuevamente.");
    }
  } else {
    // Obtener token para la cuenta existente
    try {
      tokenResponse = await msalInstance.acquireTokenSilent({ scopes, account });
    } catch (silentError: any) {
      // Si falla el token silencioso, intentar interactivo
      try {
        tokenResponse = await msalInstance.acquireTokenPopup({ scopes, account });
      } catch (popupError: any) {
        throw new Error("Error al obtener token de acceso. Por favor, inicia sesión nuevamente.");
      }
    }
  }

  return async (endpoint: string, method = "GET", body: any = null, contentType = "application/json") => {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${tokenResponse.accessToken}`);
    if (contentType && contentType !== 'none') headers.append("Content-Type", contentType);

    const options: RequestInit = { method, headers };
    if (body) options.body = body;

    const fetchResponse = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, options);

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error.message || `Error ${fetchResponse.status}`);
      } catch {
        throw new Error(`Error del servidor: ${fetchResponse.status}`);
      }
    }

    if (fetchResponse.status === 204 || fetchResponse.headers.get('content-length') === '0') {
      return {};
    }

    try {
      return await fetchResponse.json();
    } catch {
      return {};
    }
  };
};

/**
 * Asegura que existe la carpeta del tipo de test (MP o PT)
 */
export const ensureTypeFolderExists = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  testType: TestType
) => {
  const callApi = await getGraphClient(msalInstance, scopes);
  const folderName = getOneDriveFolderByType(testType);
  
  try {
    await callApi(`/me/drive/root:/${folderName}`);
    console.log(`✅ Carpeta ${folderName} existe`);
  } catch {
    console.log(`📁 Creando carpeta ${folderName}...`);
    await callApi(
      "/me/drive/root/children",
      "POST",
      JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    );
    console.log(`✅ Carpeta ${folderName} creada exitosamente`);
  }
};

/**
 * Crea la carpeta de un lote específico
 */
export const createLotFolder = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  testType: TestType
): Promise<void> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  const folderName = getOneDriveFolderByType(testType);
  
  // Asegurar que existe la carpeta raíz del tipo
  await ensureTypeFolderExists(msalInstance, scopes, testType);
  
  try {
    await callApi(
      `/me/drive/root:/${folderName}:/children`,
      "POST",
      JSON.stringify({
        name: lotNumber,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename" // Si existe, renombra automáticamente
      })
    );
    console.log(`✅ Carpeta ${lotNumber} creada en OneDrive (${folderName})`);
  } catch (error: any) {
    // Si ya existe (409), no es un error crítico
    if (error.message.includes("nameAlreadyExists") || error.message.includes("409")) {
      console.log(`ℹ️ Carpeta ${lotNumber} ya existe, se usará la existente`);
      return;
    }
    console.error(`❌ Error al crear carpeta en OneDrive:`, error);
    throw error;
  }
};

/**
 * Guarda el Excel automáticamente cuando se completa una prueba
 */
export const saveExcelToOneDrive = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  excelBlob: Blob,
  testType: TestType
): Promise<string> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  const folderName = getOneDriveFolderByType(testType);
  
  try {
    const fileName = `${lotNumber}_reporte.xlsx`;
    const endpoint = `/me/drive/root:/${folderName}/${lotNumber}/${fileName}:/content`;
    
    await callApi(endpoint, "PUT", excelBlob, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    console.log(`✅ Excel guardado en OneDrive (${folderName}): ${fileName}`);
    return endpoint;
  } catch (error: any) {
    console.error(`❌ Error al guardar Excel:`, error);
    throw new Error(`Error al guardar Excel: ${error.message}`);
  }
};

/**
 * Guarda un respaldo JSON de la prueba en OneDrive
 * Estructura: Aquagold_MP(o PT)/database/tests/2025-10/test-id.json
 */
export const saveTestBackupJSON = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  test: ResistanceTest
): Promise<{ jsonPath: string; success: boolean }> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  const folderName = getOneDriveFolderByType(test.testType);
  const month = test.date.substring(0, 7); // "2025-10"
  
  try {
    // 1. Asegurar que existe la estructura de carpetas
    const databasePath = `${folderName}/database`;
    const testsPath = `${databasePath}/tests`;
    const monthPath = `${testsPath}/${month}`;
    
    // Crear carpeta "database" si no existe
    try {
      await callApi(`/me/drive/root:/${databasePath}`);
    } catch {
      console.log(`📁 Creando carpeta ${databasePath}...`);
      await callApi(
        `/me/drive/root:/${folderName}:/children`,
        "POST",
        JSON.stringify({
          name: "database",
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename"
        })
      );
    }
    
    // Crear carpeta "tests" si no existe
    try {
      await callApi(`/me/drive/root:/${testsPath}`);
    } catch {
      console.log(`📁 Creando carpeta tests...`);
      await callApi(
        `/me/drive/root:/${databasePath}:/children`,
        "POST",
        JSON.stringify({
          name: "tests",
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename"
        })
      );
    }
    
    // Crear carpeta del mes si no existe
    try {
      await callApi(`/me/drive/root:/${monthPath}`);
    } catch {
      console.log(`📁 Creando carpeta ${month}...`);
      await callApi(
        `/me/drive/root:/${testsPath}:/children`,
        "POST",
        JSON.stringify({
          name: month,
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename"
        })
      );
    }
    
    // 2. Guardar el JSON con los datos actualizados
    const fileName = `${test.id}.json`;
    const jsonPath = `${monthPath}/${fileName}`;
    const endpoint = `/me/drive/root:/${jsonPath}:/content`;
    
    // Crear contenido JSON con todos los datos actualizados
    const jsonContent = JSON.stringify(test, null, 2);
    
    await callApi(endpoint, "PUT", jsonContent, "application/json");
    
    console.log(`✅ JSON de respaldo guardado: ${jsonPath}`);
    
    return {
      jsonPath,
      success: true
    };
  } catch (error: any) {
    console.error(`❌ Error al guardar JSON de respaldo:`, error);
    return {
      jsonPath: "",
      success: false
    };
  }
};

/**
 * Lee un archivo JSON de respaldo desde OneDrive
 * Usado para cargar datos desde el archivo JSON en lugar de Firebase
 */
export const loadTestFromJSON = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  jsonPath: string
): Promise<any> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  
  try {
    console.log(`📖 Cargando JSON desde OneDrive: ${jsonPath}`);
    
    // Convertir ruta de OneDrive a endpoint de API
    const endpoint = `/me/drive/root:/${jsonPath}:/content`;
    
    const response = await callApi(endpoint, "GET");
    
    if (!response || Object.keys(response).length === 0) {
      throw new Error("JSON vacío en OneDrive");
    }
    
    console.log(`✅ JSON cargado exitosamente desde: ${jsonPath}`);
    return response;
    
  } catch (error: any) {
    console.error(`❌ Error cargando JSON desde OneDrive:`, error);
    throw new Error(`Error cargando JSON: ${error.message}`);
  }
};

/**
 * Sube una foto a OneDrive
 */
/**
 * Verifica y crea las carpetas necesarias para subir fotos
 */
const ensureLotFolderExists = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  folderName: string,
  lotNumber: string
): Promise<void> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  
  try {
    console.log(`🔍 Verificando estructura de carpetas para: ${folderName}/${lotNumber}`);
    
    // 1. Verificar que la carpeta raíz existe (MATERIA_PRIMA o PRODUCTO_TERMINADO)
    try {
      await callApi(`/me/drive/root:/${folderName}`, "GET");
      console.log(`✅ Carpeta raíz existe: ${folderName}`);
    } catch (e: any) {
      if (e.message?.includes("404") || e.message?.includes("itemNotFound")) {
        console.log(`📁 Creando carpeta raíz: ${folderName}`);
        const createFolderBody = {
          name: folderName,
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename"
        };
        await callApi(`/me/drive/root/children`, "POST", createFolderBody);
        console.log(`✅ Carpeta raíz creada: ${folderName}`);
      } else {
        throw e;
      }
    }
    
    // 2. Verificar que carpeta de lote existe
    try {
      await callApi(`/me/drive/root:/${folderName}/${lotNumber}`, "GET");
      console.log(`✅ Carpeta de lote existe: ${lotNumber}`);
    } catch (e: any) {
      if (e.message?.includes("404") || e.message?.includes("itemNotFound")) {
        console.log(`📁 Creando carpeta de lote: ${lotNumber}`);
        // Obtener ID de carpeta raíz
        const rootFolder = await callApi(`/me/drive/root:/${folderName}`, "GET");
        const createFolderBody = {
          name: lotNumber,
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename"
        };
        await callApi(`/me/drive/items/${rootFolder.id}/children`, "POST", createFolderBody);
        console.log(`✅ Carpeta de lote creada: ${lotNumber}`);
      } else {
        throw e;
      }
    }
  } catch (error: any) {
    console.error(`❌ Error al verificar/crear carpetas:`, error);
    throw new Error(`No se pudieron crear las carpetas necesarias: ${error.message}`);
  }
};

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
    // ✨ FASE 1 FIX: Asegurar que carpetas existen antes de subir
    await ensureLotFolderExists(msalInstance, scopes, folderName, lotNumber);
    
    const fileName = `foto_${sampleId}.jpg`;
    const uploadEndpoint = `/me/drive/root:/${folderName}/${lotNumber}/${fileName}:/content`;
    
    console.log(`📤 Iniciando carga de foto: ${fileName}`);
    
    // INTENTAR ELIMINAR LA FOTO ANTERIOR si existe (para forzar reemplazo)
    try {
      const deleteEndpoint = `/me/drive/root:/${folderName}/${lotNumber}/${fileName}`;
      await callApi(deleteEndpoint, "DELETE");
      console.log(`🗑️ Foto anterior eliminada: ${fileName}`);
    } catch (deleteError) {
      // Si no existe, continuar normalmente (404 es esperado en primera subida)
      console.log(`ℹ️ No había foto anterior o no se pudo eliminar (normal en primera subida)`);
    }
    
    // Subir la nueva foto
    const uploadResponse = await callApi(uploadEndpoint, "PUT", photoBlob, "image/jpeg");
    
    // ✨ FASE 1 FIX: Validar que la respuesta tiene los datos esperados
    if (!uploadResponse || !uploadResponse.id) {
      console.error(`❌ Respuesta inválida de OneDrive:`, uploadResponse);
      throw new Error(`OneDrive devolvió respuesta inválida (sin ID de archivo)`);
    }
    
    if (!uploadResponse.webUrl) {
      console.error(`❌ OneDrive no devolvió webUrl:`, uploadResponse);
      throw new Error(`OneDrive no devolvió URL válida`);
    }
    
    console.log(`✅ Archivo subido correctamente a OneDrive`);
    console.log(`   ID: ${uploadResponse.id}`);
    console.log(`   URL: ${uploadResponse.webUrl}`);
    console.log(`   Tamaño: ${uploadResponse.size} bytes`);
    
    // Usar directamente webUrl de OneDrive (es más confiable que construirla)
    const photoUrl = uploadResponse.webUrl;
    
    console.log(`✅ Foto lista para descargar: ${photoUrl}`);
    
    return photoUrl;
  } catch (error: any) {
    console.error(`❌ Error al subir foto a OneDrive:`, error);
    throw new Error(`Error al subir foto: ${error.message}`);
  }
};

/**
 * Genera y guarda el Excel de reporte diario separado por tipo (MP y PT)
 */
export const saveDailyReportToOneDrive = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  date: string,
  excelBlob: Blob,
  testType: TestType
): Promise<string> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  const folderName = getOneDriveFolderByType(testType);
  
  try {
    // Asegurar que existe la carpeta del tipo
    await ensureTypeFolderExists(msalInstance, scopes, testType);
    
    // Crear subcarpeta "reportes_diarios" si no existe
    const reportsFolderPath = `${folderName}/reportes_diarios`;
    try {
      await callApi(`/me/drive/root:/${reportsFolderPath}`);
      console.log(`✅ Carpeta ${reportsFolderPath} existe`);
    } catch {
      console.log(`📁 Creando carpeta ${reportsFolderPath}...`);
      await callApi(
        `/me/drive/root:/${folderName}:/children`,
        "POST",
        JSON.stringify({
          name: "reportes_diarios",
          folder: {},
          "@microsoft.graph.conflictBehavior": "rename"
        })
      );
    }
    
    const typeLabel = testType === 'MATERIA_PRIMA' ? 'MP' : 'PT';
    const fileName = `Reporte_Diario_${typeLabel}_${date}.xlsx`;
    const endpoint = `/me/drive/root:/${reportsFolderPath}/${fileName}:/content`;
    
    await callApi(endpoint, "PUT", excelBlob, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    console.log(`✅ Reporte diario guardado en ${reportsFolderPath}: ${fileName}`);
    return endpoint;
  } catch (error: any) {
    console.error(`❌ Error al guardar reporte diario:`, error);
    throw new Error(`Error al guardar reporte: ${error.message}`);
  }
};

/**
 * Elimina la carpeta completa de un lote en OneDrive (fotos + Excel)
 */
export const deleteLotFolderFromOneDrive = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  testType: TestType
): Promise<void> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  const folderName = getOneDriveFolderByType(testType);
  
  try {
    const deleteEndpoint = `/me/drive/root:/${folderName}/${lotNumber}`;
    await callApi(deleteEndpoint, "DELETE");
    console.log(`🗑️ Carpeta ${lotNumber} eliminada de OneDrive (${folderName})`);
  } catch (error: any) {
    // Si no existe (404), no es un error crítico
    if (error.message.includes("404") || error.message.includes("itemNotFound")) {
      console.log(`ℹ️ Carpeta ${lotNumber} no existía en OneDrive`);
      return;
    }
    console.error(`❌ Error al eliminar carpeta de OneDrive:`, error);
    throw new Error(`Error al eliminar carpeta: ${error.message}`);
  }
};