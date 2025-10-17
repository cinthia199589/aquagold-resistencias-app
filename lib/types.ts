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