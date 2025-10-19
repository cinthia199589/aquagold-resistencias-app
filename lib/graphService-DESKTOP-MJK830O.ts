import { IPublicClientApplication } from '@azure/msal-browser';

const APP_ROOT_FOLDER = 'Aquagold_Resistencias';

/**
 * Obtiene el token de acceso para Microsoft Graph API
 */
export const getAccessToken = async (
  instance: IPublicClientApplication,
  scopes: string[]
): Promise<string> => {
  try {
    const accounts = instance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error('No hay cuentas autenticadas');
    }

    const response = await instance.acquireTokenSilent({
      scopes,
      account: accounts[0]
    });

    return response.accessToken;
  } catch (error: any) {
    console.error('❌ Error al obtener token:', error);
    throw new Error(`Error de autenticación: ${error.message}`);
  }
};

/**
 * Crea una carpeta para un lote específico en OneDrive
 */
export const createLotFolder = async (
  instance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string
): Promise<string> => {
  try {
    const token = await getAccessToken(instance, scopes);
    
    // 1. Verificar/crear carpeta raíz
    const rootResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${APP_ROOT_FOLDER}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    let rootFolderId: string;
    if (!rootResponse.ok) {
      // Crear carpeta raíz si no existe
      const createRootResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/drive/root/children',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: APP_ROOT_FOLDER,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
          })
        }
      );
      const rootData = await createRootResponse.json();
      rootFolderId = rootData.id;
    } else {
      const rootData = await rootResponse.json();
      rootFolderId = rootData.id;
    }

    // 2. Crear carpeta del lote
    const lotFolderResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${rootFolderId}/children`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: lotNumber,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      }
    );

    if (!lotFolderResponse.ok) {
      throw new Error('Error al crear carpeta del lote');
    }

    const lotFolderData = await lotFolderResponse.json();
    console.log(`✅ Carpeta creada en OneDrive: ${APP_ROOT_FOLDER}/${lotNumber}`);
    
    return lotFolderData.webUrl;
  } catch (error: any) {
    console.error('❌ Error al crear carpeta:', error);
    throw new Error(`Error en OneDrive: ${error.message}`);
  }
};

/**
 * Sube un archivo Excel a OneDrive
 */
export const saveExcelToOneDrive = async (
  instance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  excelBlob: Blob
): Promise<string> => {
  try {
    const token = await getAccessToken(instance, scopes);
    const fileName = `${lotNumber}_reporte.xlsx`;
    const filePath = `/${APP_ROOT_FOLDER}/${lotNumber}/${fileName}`;

    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: excelBlob
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error?.message || 'Error al subir Excel');
    }

    const fileData = await uploadResponse.json();
    console.log(`✅ Excel guardado en OneDrive: ${filePath}`);
    
    return fileData.webUrl;
  } catch (error: any) {
    console.error('❌ Error al guardar Excel:', error);
    throw new Error(`Error al guardar Excel: ${error.message}`);
  }
};

/**
 * Sube una foto a OneDrive y retorna la URL
 */
export const uploadPhotoToOneDrive = async (
  instance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  sampleId: string,
  photoBlob: Blob
): Promise<string> => {
  try {
    const token = await getAccessToken(instance, scopes);
    const fileName = `${sampleId}.jpg`;
    const filePath = `/${APP_ROOT_FOLDER}/${lotNumber}/${fileName}`;

    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/jpeg'
        },
        body: photoBlob
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error?.message || 'Error al subir foto');
    }

    const fileData = await uploadResponse.json();
    console.log(`✅ Foto subida a OneDrive: ${filePath}`);
    
    // Retornar URL de visualización
    return fileData.webUrl;
  } catch (error: any) {
    console.error('❌ Error al subir foto:', error);
    throw new Error(`Error al subir foto: ${error.message}`);
  }
};

/**
 * Guarda el reporte diario en OneDrive
 */
export const saveDailyReportToOneDrive = async (
  instance: IPublicClientApplication,
  scopes: string[],
  date: string,
  excelBlob: Blob
): Promise<string> => {
  try {
    const token = await getAccessToken(instance, scopes);
    const fileName = `Reporte_Diario_${date}.xlsx`;
    const filePath = `/${APP_ROOT_FOLDER}/Reportes_Diarios/${fileName}`;

    // Crear carpeta de reportes si no existe
    const folderPath = `/${APP_ROOT_FOLDER}/Reportes_Diarios`;
    await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      }
    );

    // Subir archivo
    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        body: excelBlob
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Error al subir reporte diario');
    }

    const fileData = await uploadResponse.json();
    console.log(`✅ Reporte diario guardado: ${filePath}`);
    
    return fileData.webUrl;
  } catch (error: any) {
    console.error('❌ Error al guardar reporte diario:', error);
    throw new Error(`Error al guardar reporte: ${error.message}`);
  }
};
