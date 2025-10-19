export interface Sample {
  id: string;
  timeSlot: number;
  rawUnits?: number; // Ahora opcional para distinguir entre "no completado" y "realmente 0"
  cookedUnits?: number; // Ahora opcional para distinguir entre "no completado" y "realmente 0"
  photoUrl?: string;
}

export interface ResistanceTest {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  startTime: string; // HH:mm format
  lotNumber: string;
  provider: string;
  pool: string;
  certificationType: 'ASC' | 'CONVENCIONAL';
  so2Residuals?: number; // Ahora opcional
  so2Bf?: number; // Ahora opcional
  createdBy: string;
  responsable: string; // Nuevo campo
  observations?: string;
  samples: Sample[];
  isCompleted: boolean;
  completedAt?: string;
  updatedAt?: string;
  excelUrl?: string; // URL del Excel en OneDrive
  isLocked?: boolean; // Para bloquear edición después de guardar
}

export interface DailyReport {
  date: string;
  tests: ResistanceTest[];
  totalTests: number;
  completedTests: number;
}

// ============================================
// SISTEMA HÍBRIDO - INTERFACES
// ============================================

/**
 * Índice ligero para Firebase (solo campos críticos para queries)
 * Tamaño: ~200 bytes (vs ~5KB del ResistanceTest completo)
 * 
 * Propósito: Queries rápidas y baratas en Firebase
 * Datos completos: Almacenados en OneDrive (gratis)
 */
export interface ResistanceTestIndex {
  id: string;
  lotNumber: string;
  date: string;
  isCompleted: boolean;
  updatedAt: any; // Firestore Timestamp
  
  // Campos adicionales para sistema híbrido
  oneDrivePath?: string; // Ruta al JSON completo en OneDrive
  migratedAt?: any; // Timestamp de cuándo se migró
  legacyChecksum?: string; // Hash para validar integridad
}

/**
 * Resultado de operación de guardado dual
 */
export interface DualSaveResult {
  success: boolean;
  errors: string[];
  savedToLocal: boolean;
  savedToLegacy: boolean;
  savedToHybrid: boolean;
}