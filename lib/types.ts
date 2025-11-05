// ============================================
// TIPOS DE RESISTENCIA (NUEVO)
// ============================================

/**
 * Tipo de resistencia según el contexto de trabajo
 */
export type TestType = 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO';

/**
 * Etiquetas amigables para mostrar en UI
 */
export const TEST_TYPE_LABELS: Record<TestType, string> = {
  MATERIA_PRIMA: 'Resistencia en Materia Prima',
  PRODUCTO_TERMINADO: 'Resistencia en Producto Terminado'
};

/**
 * Configuración visual por tipo
 */
export const TEST_TYPE_CONFIG = {
  MATERIA_PRIMA: {
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-300 dark:border-blue-700',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: '',
    shortLabel: 'MP'
  },
  PRODUCTO_TERMINADO: {
    color: 'green',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-300 dark:border-green-700',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: '',
    shortLabel: 'PT'
  }
} as const;

export interface Sample {
  id: string;
  timeSlot: number;
  rawUnits?: number; // Ahora opcional para distinguir entre "no completado" y "realmente 0"
  cookedUnits?: number; // Ahora opcional para distinguir entre "no completado" y "realmente 0"
  photoUrl?: string;
  rotation?: number; // 🆕 Rotación de la foto: 0, 90, 180, 270 grados
}

export interface ResistanceTest {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  startTime: string; // HH:mm format
  lotNumber: string;
  provider: string;
  pool: string;
  certificationType: 'ASC' | 'CONVENCIONAL';
  testType: TestType; // 🆕 NUEVO CAMPO CRÍTICO
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