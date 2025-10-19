import { IPublicClientApplication } from "@azure/msal-browser";
import { ResistanceTest } from "./types";

const APP_ROOT_FOLDER = "Aquagold_Resistencias";

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
 * Asegura que existe la carpeta raíz
 */
export const ensureAppFolderExists = async (
  msalInstance: IPublicClientApplication, 
  scopes: string[]
) => {
  const callApi = await getGraphClient(msalInstance, scopes);
  
  try {
    await callApi(`/me/drive/root:/${APP_ROOT_FOLDER}`);
  } catch {
    await callApi(
      "/me/drive/root/children",
      "POST",
      JSON.stringify({
        name: APP_ROOT_FOLDER,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    );
  }
};

/**
 * Crea la carpeta de un lote específico
 */
export const createLotFolder = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string
): Promise<void> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  
  await ensureAppFolderExists(msalInstance, scopes);
  
  try {
    await callApi(
      `/me/drive/root:/${APP_ROOT_FOLDER}:/children`,
      "POST",
      JSON.stringify({
        name: lotNumber,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename" // Si existe, renombra automáticamente
      })
    );
    console.log(`✅ Carpeta ${lotNumber} creada en OneDrive`);
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
  excelBlob: Blob
): Promise<string> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  
  try {
    const fileName = `${lotNumber}_reporte.xlsx`;
    const endpoint = `/me/drive/root:/${APP_ROOT_FOLDER}/${lotNumber}/${fileName}:/content`;
    
    await callApi(endpoint, "PUT", excelBlob, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    console.log(`✅ Excel guardado en OneDrive: ${fileName}`);
    return endpoint;
  } catch (error: any) {
    console.error(`❌ Error al guardar Excel:`, error);
    throw new Error(`Error al guardar Excel: ${error.message}`);
  }
};

/**
 * Sube una foto a OneDrive
 */
export const uploadPhotoToOneDrive = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  sampleId: string,
  photoBlob: Blob
): Promise<string> => {
  const callApi = await getGraphClient(msalInstance, scopes);

  try {
    const fileName = `foto_${sampleId}.jpg`;
    const uploadEndpoint = `/me/drive/root:/${APP_ROOT_FOLDER}/${lotNumber}/${fileName}:/content`;
    
    // Subir la foto
    const uploadResponse = await callApi(uploadEndpoint, "PUT", photoBlob, "image/jpeg");
    
    // Obtener la URL de visualización de OneDrive
    const fileInfoEndpoint = `/me/drive/root:/${APP_ROOT_FOLDER}/${lotNumber}/${fileName}`;
    const fileInfo = await callApi(fileInfoEndpoint, "GET");
    
    const photoUrl = fileInfo.webUrl || `${APP_ROOT_FOLDER}/${lotNumber}/${fileName}`;
    
    console.log(`✅ Foto subida a OneDrive: ${fileName}`);
    console.log(`📎 URL: ${photoUrl}`);
    
    return photoUrl;
  } catch (error: any) {
    console.error(`❌ Error al subir foto a OneDrive:`, error);
    throw new Error(`Error al subir foto: ${error.message}`);
  }
};

/**
 * Genera y guarda el Excel de reporte diario
 */
export const saveDailyReportToOneDrive = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  date: string,
  excelBlob: Blob
): Promise<string> => {
  const callApi = await getGraphClient(msalInstance, scopes);
  
  try {
    await ensureAppFolderExists(msalInstance, scopes);
    
    const fileName = `Reporte_Diario_${date}.xlsx`;
    const endpoint = `/me/drive/root:/${APP_ROOT_FOLDER}/${fileName}:/content`;
    
    await callApi(endpoint, "PUT", excelBlob, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    console.log(`✅ Reporte diario guardado: ${fileName}`);
    return endpoint;
  } catch (error: any) {
    console.error(`❌ Error al guardar reporte diario:`, error);
    throw new Error(`Error al guardar reporte: ${error.message}`);
  }
};