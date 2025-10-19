/**
 * CONFIGURACIÓN DE MIGRACIÓN AL SISTEMA HÍBRIDO
 * ============================================
 * 
 * Control centralizado de la migración de Firebase legacy → Sistema híbrido
 * 
 * Sistema híbrido:
 * - Firebase: Solo índice ligero (~200 bytes/test)
 * - OneDrive: Datos completos JSON (~5KB/test) GRATIS
 * - IndexedDB: Cache local inteligente (250 tests)
 * 
 * Garantías:
 * ✅ CERO pérdida de datos (sistema dual)
 * ✅ Velocidad mantenida/mejorada
 * ✅ Sin downtime (migración background)
 * ✅ Rollback automático si falla
 */

export const MIGRATION_CONFIG = {
  // ========================================
  // CONTROL DE MIGRACIÓN
  // ========================================
  
  /**
   * Activar sistema híbrido (índice Firebase + datos OneDrive)
   * - true: Usa sistema nuevo
   * - false: Solo sistema legacy (actual)
   */
  USE_HYBRID_SYSTEM: true,
  
  /**
   * Guardar en ambos sistemas durante migración
   * - true: Escribe en legacy Y híbrido (doble seguridad)
   * - false: Solo escribe en híbrido
   * 
   * RECOMENDADO: true durante las primeras 2-4 semanas
   */
  ENABLE_DUAL_WRITE: true,
  
  /**
   * Migrar datos antiguos en background
   * - true: Migra tests legacy → híbrido automáticamente
   * - false: Solo tests nuevos usan híbrido
   */
  ENABLE_BACKGROUND_MIGRATION: false, // ❌ DESACTIVADO temporalmente para evitar errores de MSAL
  
  /**
   * Validar integridad con checksums
   * - true: Valida que datos migrados sean idénticos
   * - false: Migra sin validación (más rápido, menos seguro)
   */
  VALIDATE_DATA_INTEGRITY: true,
  
  // ========================================
  // ROLLBACK AUTOMÁTICO
  // ========================================
  
  /**
   * Revertir automáticamente si detecta errores
   * - true: Elimina índices y vuelve a legacy si falla
   * - false: Mantiene estado parcial
   */
  AUTO_ROLLBACK_ON_ERROR: true,
  
  /**
   * Máximo de errores antes de abortar migración
   * Si excede este número, se detiene y hace rollback
   */
  MAX_MIGRATION_ERRORS: 5,
  
  // ========================================
  // PERFORMANCE
  // ========================================
  
  /**
   * Cantidad de tests a migrar en cada batch
   * Batches pequeños = menos impacto en performance
   * Batches grandes = migración más rápida
   * 
   * RECOMENDADO: 10-20 para no saturar
   */
  MIGRATION_BATCH_SIZE: 10,
  
  /**
   * Espera entre batches (ms)
   * Evita saturar Firebase/OneDrive
   * 
   * RECOMENDADO: 2000-5000ms (2-5 segundos)
   */
  MIGRATION_DELAY_MS: 3000,
  
  /**
   * Reintentos en caso de error temporal
   * Útil para errores de red
   */
  MAX_RETRIES: 3,
  
  /**
   * Tiempo de espera entre reintentos (ms)
   */
  RETRY_DELAY_MS: 1000,
  
  // ========================================
  // CACHE LOCAL
  // ========================================
  
  /**
   * Máximo de tests en cache local (IndexedDB)
   * Aumentado de 50 a 250 para mejor offline
   */
  MAX_LOCAL_TESTS: 250,
  
  /**
   * Tests frecuentemente accedidos a mantener en cache
   * Se priorizan estos sobre los recientes
   */
  FREQUENTLY_ACCESSED_TESTS: 50,
  
  // ========================================
  // COLECCIONES FIREBASE
  // ========================================
  
  /**
   * Colección de índices híbridos (nuevo)
   * Contiene solo campos críticos para queries
   */
  INDEX_COLLECTION: 'resistance_tests_index',
  
  /**
   * Colección legacy (actual)
   * Contiene datos completos
   * NO se elimina (solo se archiva después de migración)
   */
  LEGACY_COLLECTION: 'resistance_tests',
  
  // ========================================
  // ONEDRIVE
  // ========================================
  
  /**
   * Carpeta base en OneDrive para datos JSON
   */
  ONEDRIVE_DATABASE_FOLDER: '/Aquagold_Resistencias/database',
  
  /**
   * Organizar tests por mes
   * - true: /database/tests/2025-10/test-001.json
   * - false: /database/tests/test-001.json
   */
  ORGANIZE_BY_MONTH: true,
  
  // ========================================
  // LOGGING Y DEBUG
  // ========================================
  
  /**
   * Mostrar logs detallados en consola
   */
  ENABLE_VERBOSE_LOGGING: true,
  
  /**
   * Mostrar banner de progreso de migración
   */
  SHOW_MIGRATION_BANNER: true,
  
  /**
   * Intervalo de actualización del banner (ms)
   */
  BANNER_UPDATE_INTERVAL_MS: 5000,
};

/**
 * Nombres de colecciones (alias para fácil acceso)
 */
export const COLLECTIONS = {
  INDEX: MIGRATION_CONFIG.INDEX_COLLECTION,
  LEGACY: MIGRATION_CONFIG.LEGACY_COLLECTION,
} as const;

/**
 * Helper: Verificar si sistema híbrido está activo
 */
export const isHybridSystemActive = (): boolean => {
  return MIGRATION_CONFIG.USE_HYBRID_SYSTEM;
};

/**
 * Helper: Verificar si debe guardar en ambos sistemas
 */
export const shouldUseDualWrite = (): boolean => {
  return MIGRATION_CONFIG.USE_HYBRID_SYSTEM && MIGRATION_CONFIG.ENABLE_DUAL_WRITE;
};

/**
 * Helper: Verificar si debe migrar en background
 */
export const shouldMigrateInBackground = (): boolean => {
  return MIGRATION_CONFIG.USE_HYBRID_SYSTEM && MIGRATION_CONFIG.ENABLE_BACKGROUND_MIGRATION;
};

/**
 * Helper: Obtener carpeta OneDrive para un test
 * @param date Fecha del test (formato: YYYY-MM-DD)
 * @returns Ruta completa en OneDrive
 */
export const getOneDriveFolderPath = (date: string): string => {
  const baseFolder = MIGRATION_CONFIG.ONEDRIVE_DATABASE_FOLDER;
  
  if (MIGRATION_CONFIG.ORGANIZE_BY_MONTH) {
    // Extraer año-mes de la fecha
    const [year, month] = date.split('-');
    return `${baseFolder}/tests/${year}-${month}`;
  }
  
  return `${baseFolder}/tests`;
};

/**
 * Helper: Obtener nombre de archivo JSON para un test
 * @param testId ID del test
 * @returns Nombre del archivo
 */
export const getTestFileName = (testId: string): string => {
  return `test-${testId}.json`;
};

/**
 * Helper: Obtener ruta completa OneDrive para un test
 * @param testId ID del test
 * @param date Fecha del test
 * @returns Ruta completa
 */
export const getTestOneDrivePath = (testId: string, date: string): string => {
  const folder = getOneDriveFolderPath(date);
  const fileName = getTestFileName(testId);
  return `${folder}/${fileName}`;
};

/**
 * Logging helper
 */
export const log = {
  info: (...args: any[]) => {
    if (MIGRATION_CONFIG.ENABLE_VERBOSE_LOGGING) {
      console.log('🔄 [MIGRATION]', ...args);
    }
  },
  
  success: (...args: any[]) => {
    if (MIGRATION_CONFIG.ENABLE_VERBOSE_LOGGING) {
      console.log('✅ [MIGRATION]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error('❌ [MIGRATION]', ...args);
  },
  
  warn: (...args: any[]) => {
    console.warn('⚠️ [MIGRATION]', ...args);
  },
};
