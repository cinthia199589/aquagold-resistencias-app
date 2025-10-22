'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MsalProvider, useMsal, MsalAuthenticationTemplate } from '@azure/msal-react';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { Home, PlusCircle, LogOut, User, LogIn, ChevronLeft, Camera, Save, Download, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { 
  saveTestToFirestore, 
  getInProgressTests, 
  markTestAsCompleted,
  searchTests,
  deleteTest,
  getAllTests,
  loadTestsHybridDual,
  saveTestHybridDual
} from '../lib/firestoreService';
import { getAllTestsLocally } from '../lib/localStorageService';
import { 
  createLotFolder, 
  saveExcelToOneDrive, 
  uploadPhotoToOneDrive 
} from '../lib/graphService';
import { exportToExcel, generateExcelBlob } from '../lib/excelExport';
import { ResistanceTest, Sample, TestType } from '../lib/types';
import SearchBar from '../components/SearchBar';
import WorkModeSwitch from '../components/WorkModeSwitch';
import { useAutoSave } from '../lib/useAutoSave';
import { AutoSaveIndicator } from '../components/AutoSaveIndicator';
import { SaveNotification } from '../components/SaveNotification';
import { useOnlineStatus, OfflineBanner } from '../lib/offlineDetector';
import { migratePhotoUrls } from '../lib/migratePhotoUrls';

// ⚡ LAZY LOADING - Componentes cargados bajo demanda
const DailyReportModal = dynamic(() => import('../components/DailyReportModal'), {
  loading: () => <div className="text-center p-4">Cargando reporte...</div>,
  ssr: false
});

const DeleteConfirmation = dynamic(
  () => import('../components/DeleteConfirmation').then(mod => ({ default: mod.DeleteConfirmation })),
  {
    loading: () => <div className="text-center p-4">Cargando...</div>,
    ssr: false
  }
);

// Función para obtener la redirect URI correcta
const getRedirectUri = () => {
  if (typeof window === 'undefined') {
    // En servidor, usar variable de entorno
    return process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || 'http://localhost:8080';
  }
  
  // En cliente, detectar el origen correcto
  const protocol = window.location.protocol; // http: o https:
  const hostname = window.location.hostname; // localhost, IP, o dominio
  const port = window.location.port; // puerto si existe
  
  let redirectUri = `${protocol}//${hostname}`;
  
  // Añadir puerto si no es puerto por defecto
  if (port && !((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443'))) {
    redirectUri += `:${port}`;
  }
  
  return redirectUri;
};

// ✅ Función helper para formatear fechas correctamente (sin interpretación UTC)
const formatDateLocal = (dateStr: string): string => {
  // dateStr viene en formato "2025-10-18"
  const [year, month, day] = dateStr.split('-').map(Number);
  // Crear fecha en zona horaria local (NO UTC)
  const date = new Date(year, month - 1, day);
  // Formatear: "18/10/2025"
  return date.toLocaleDateString('es-EC');
};

// Validar variables de entorno críticas
const requiredEnvVars = {
  clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
  tenantId: process.env.NEXT_PUBLIC_MSAL_TENANT_ID,
};

const msalConfig = {
  auth: {
    clientId: requiredEnvVars.clientId || 'bf20eec1-debc-4c81-a275-9de5b6f229aa',
    authority: `https://login.microsoftonline.com/${requiredEnvVars.tenantId || '120c6648-f19f-450e-931f-51a5ff6f2b10'}`,
    redirectUri: getRedirectUri(),
  },
  cache: { cacheLocation: "sessionStorage" as const, storeAuthStateInCookie: false }
};

const loginRequest = { scopes: ["User.Read", "Files.ReadWrite"] };

// Estado para manejar MSAL de forma asíncrona
interface MsalState {
  instance: any | null;
  loading: boolean;
  error: string | null;
}

// Hook personalizado para MSAL
const useMsalInstance = () => {
  const [msalState, setMsalState] = useState<MsalState>({
    instance: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const initMsal = async () => {
      // Solo en el cliente
      if (typeof window === 'undefined') return;

      try {
        // Verificar crypto
        if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
          throw new Error('Crypto API no disponible en este navegador');
        }

        // Importar MSAL dinámicamente
        const { PublicClientApplication } = await import('@azure/msal-browser');
        
        const instance = new PublicClientApplication(msalConfig);
        await instance.initialize();

        setMsalState({
          instance,
          loading: false,
          error: null
        });

      } catch (error: any) {
        console.error('Error inicializando MSAL:', error);
        setMsalState({
          instance: null,
          loading: false,
          error: error.message || 'Error de inicialización'
        });
      }
    };

    initMsal();
  }, []);

  return msalState;
};

// UI Components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`bg-white dark:bg-slate-800 border-2 rounded-lg shadow-sm hover:shadow-md transition-all ${className}`}>{children}</div>;

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <h2 className={`text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h2>;

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <p className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`}>{children}</p>;

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`p-4 sm:p-6 pt-0 ${className}`}>{children}</div>;

interface ButtonProps { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  variant?: 'default' | 'ghost' | 'outline'; 
  type?: 'button' | 'submit' | 'reset'; 
  disabled?: boolean; 
  size?: 'sm' | 'md' | 'lg' | string;
}

const Button = ({ children, onClick, className = '', variant = 'default', type = 'button', disabled = false, size = 'md' }: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all shadow-sm";
  const sizeClasses = {
    sm: "h-8 px-3 py-1.5 text-xs",
    md: "h-9 sm:h-10 px-4 py-2",
    lg: "h-11 sm:h-12 px-6 py-3 text-sm sm:text-base"
  };
  const variantClasses = {
    default: "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 border-0",
    ghost: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border-0",
    outline: "border-2 border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
  };
  
  const sizeClass = typeof size === 'string' && size in sizeClasses ? sizeClasses[size as keyof typeof sizeClasses] : sizeClasses.md;
  
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${sizeClass} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

const Progress = ({ value }: { value: number }) => (
  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
    <div className="h-full bg-blue-600 transition-all" style={{ width: `${value || 0}%` }} />
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => 
  <input {...props} className="flex h-8 sm:h-10 w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white shadow-sm transition-all placeholder:text-gray-400" />;

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => 
  <label {...props} className={`text-xs sm:text-sm font-medium leading-tight text-gray-700 dark:text-gray-300 ${props.className || ''}`} />;

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => 
  <select {...props} className="flex h-8 sm:h-10 w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white text-gray-900 px-3 py-2 text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white shadow-sm transition-all">{children}</select>;

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => 
  <textarea {...props} className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700" />;

// Lista de resistencias
const ResistanceTestList = ({ 
  setRoute, 
  tests, 
  isLoading, 
  onRefresh,
  onSearch,
  showAll,
  setShowAll,
  instance,
  accounts,
  visibleCount,
  loadMoreTests,
  showSearchInFirestore,
  searchInFullHistory,
  isSearching
}: { 
  setRoute: (route: string, params?: any) => void; 
  tests: ResistanceTest[]; 
  isLoading: boolean; 
  onRefresh: () => void;
  onSearch: (term: string) => void;
  showAll: boolean;
  setShowAll: (show: boolean) => void;
  instance: any;
  accounts: any[];
  visibleCount: number;
  loadMoreTests: () => void;
  showSearchInFirestore: boolean;
  searchInFullHistory: () => void;
  isSearching: boolean;
}) => {
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ResistanceTest | null>(null);
  const loginRequest = { scopes: ["User.Read", "Files.ReadWrite"] };

  const formatTimeSlot = (baseTime: string, hoursToAdd: number) => {
    try {
      const [hours, minutes] = baseTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours + hoursToAdd, minutes, 0, 0);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return `+${hoursToAdd}h`;
    }
  };

  const calculateProgress = (test: ResistanceTest) => {
    if (!test.samples || test.samples.length === 0) return 0;
    
    let totalFields = 0;
    let completedFields = 0;
    
    test.samples.forEach(sample => {
      // Cada muestra tiene 3 campos: rawUnits, cookedUnits y photoUrl
      totalFields += 3;
      
      // Contar campos completados (un campo está completado si NO es undefined, puede ser 0)
      if (sample.rawUnits !== undefined && sample.rawUnits !== null) completedFields++;
      if (sample.cookedUnits !== undefined && sample.cookedUnits !== null) completedFields++;
      if (sample.photoUrl && sample.photoUrl.trim() !== '') completedFields++;
    });
    
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  };

  const handleDelete = async (test: ResistanceTest) => {
    try {
      await deleteTest(test.id, test.lotNumber, test.testType, instance, loginRequest.scopes);
      alert('✅ Resistencia eliminada exitosamente (incluyendo archivos de OneDrive)');
      onRefresh();
    } catch (error: any) {
      alert(`❌ Error al eliminar: ${error.message}`);
    }
  };

  return (
    <>
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-2.5 dashboard-header">
            {/* Título - Izquierda en desktop */}
            <div className="lg:flex-1">
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold dashboard-title text-white text-center lg:text-left">{showAll ? 'Historial Completo' : 'Resistencias en Progreso'}</CardTitle>
            </div>

            {/* Búsqueda - Centro en desktop */}
            <div className="lg:flex-1 max-w-2xl lg:max-w-md">
              <SearchBar onSearch={onSearch} />
              
              {/* ✅ Botón para buscar en histórico completo de Firestore */}
              {showSearchInFirestore && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                    ℹ️ No se encontraron resultados en las últimas 50 resistencias
                  </p>
                  <Button 
                    onClick={searchInFullHistory}
                    disabled={isSearching}
                    variant="outline"
                    className="w-full gap-2 border-2 border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                  >
                    {isSearching ? '🔄 Buscando...' : '🔍 Buscar en Histórico Completo (Firestore)'}
                  </Button>
                </div>
              )}
            </div>

            {/* Botones de Control - Mejorados */}
            <div className="flex flex-col gap-1 sm:gap-2 w-full sm:flex-row sm:justify-center sm:items-center lg:justify-end dashboard-buttons">
              <Button 
                className={`gap-2 text-xs sm:text-sm lg:text-base px-4 sm:px-6 lg:px-8 py-2 sm:py-2 lg:py-3 w-full sm:w-auto font-semibold rounded-lg transition-all ${
                  showAll 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-md' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }`}
                onClick={() => {
                  setShowAll(!showAll);
                }}
              >
                {showAll ? '📋 HISTORIAL COMPLETO' : '⏳ EN PROGRESO'}
              </Button>
              <Button 
                className={`gap-2 text-xs sm:text-sm lg:text-base px-4 sm:px-6 lg:px-8 py-2 sm:py-2 lg:py-3 w-full sm:w-auto font-semibold rounded-lg transition-all ${
                  true 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                onClick={() => setShowDailyReport(true)}
              >
                <FileText size={18}/> 
                <span>REPORTE</span>
              </Button>
              <Button 
                className="hidden sm:flex gap-2 text-xs sm:text-sm lg:text-base px-4 sm:px-6 lg:px-8 py-2 sm:py-2 lg:py-3 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg border-0 transition-all"
                onClick={() => setRoute('new-test')}
              >
                <PlusCircle size={18}/> 
                <span>Nueva Resistencia</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando resistencias...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron resistencias en progreso.</p>
                </div>
              ) : (
                <>
                  {/* ✅ Mostrar indicador de cantidad */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Mostrando {Math.min(visibleCount, tests.length)} de {tests.length} resistencias
                  </div>
                  
                  {/* ✅ Infinite scroll - Solo mostrar tests visibles */}
                  {tests.slice(0, visibleCount).map(test => (
                <div 
                  key={test.id} 
                  className="border-2 border-gray-600 dark:border-gray-600 rounded p-2 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer relative card-mobile"
                >
                  <div onClick={() => setRoute('test-detail', { id: test.id })}>
                    {/* Header responsive - Compacto */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                          Lote: {test.lotNumber}
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 self-start sm:self-center">
                        {formatDateLocal(test.date)}
                      </div>
                    </div>
                    
                    {/* Info responsive - Compacto */}
                    <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span>Proveedor: <strong>{test.provider}</strong></span>
                        <span>Piscina: <strong>{test.pool}</strong></span>
                      </div>
                    </div>
                    
                    {/* Progress bar responsive - Compacto */}
                    <div className="mt-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Progreso</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{Math.round(calculateProgress(test))}%</span>
                      </div>
                      <Progress value={calculateProgress(test)} />
                      
                      {/* Indicadores de muestras por hora */}
                      <div className="samples-indicator">
                        {(test.samples || []).map((sample) => {
                          const isComplete = sample.photoUrl && sample.photoUrl.trim() !== '' && 
                                           sample.rawUnits !== undefined && sample.rawUnits !== null &&
                                           sample.cookedUnits !== undefined && sample.cookedUnits !== null;
                          const isPending = !isComplete;
                          return (
                            <div 
                              key={sample.id}
                              className={`sample-indicator ${isComplete ? 'completed' : 'pending'}`}
                              title={`Hora ${formatTimeSlot ? formatTimeSlot(test.startTime, sample.timeSlot) : sample.timeSlot}: ${isComplete ? '✓ Completo' : '⏳ Pendiente'}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* ✅ Botón "Cargar más" si hay más tests */}
              {visibleCount < tests.length && (
                <div className="flex justify-center mt-8 mb-4">
                  <Button 
                    onClick={loadMoreTests}
                    className="w-full sm:w-auto gap-2 py-3 px-6 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg rounded-lg border-2 border-blue-500"
                  >
                    ⬇️ Cargar {tests.length - visibleCount} más ({tests.length - visibleCount} {tests.length - visibleCount === 1 ? 'test' : 'tests'} restantes)
                  </Button>
                </div>
              )}
            </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <DailyReportModal isOpen={showDailyReport} onClose={() => setShowDailyReport(false)} />
      
      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500 rounded-lg p-6 max-w-md w-full animate-in">
            <h3 className="text-lg font-bold text-white mb-2">⚠️ Confirmar Eliminación</h3>
            <p className="text-gray-300 mb-4">
              ¿Está seguro de que desea eliminar la resistencia del lote <strong className="text-red-400">{deleteConfirm.lotNumber}</strong>?
            </p>
            <p className="text-sm text-gray-400 mb-6 bg-red-900 bg-opacity-30 border border-red-700 rounded p-3">
              ⚠️ Esta acción <strong>NO se puede deshacer</strong>. Se eliminarán todos los datos asociados (Firestore + OneDrive).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await handleDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors border-2 border-red-500"
              >
                SÍ, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Crear nueva resistencia
const NewTestPage = ({ setRoute, onTestCreated, saveTestFn, workMode }: { setRoute: (route: string) => void; onTestCreated: () => void; saveTestFn?: (test: ResistanceTest) => Promise<void>; workMode: TestType }) => {
  const { instance } = useMsal();
  const [isSaving, setIsSaving] = useState(false);
  const loginRequest = { scopes: ["User.Read", "Files.ReadWrite"] };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Verificar que la instancia MSAL esté disponible
    if (!instance) {
      alert("❌ La sesión no está activa. Por favor, recarga la página.");
      return;
    }

    // Verificar que hay una cuenta activa
    const activeAccount = instance.getActiveAccount();
    const allAccounts = instance.getAllAccounts();
    if (!activeAccount && allAccounts.length === 0) {
      alert("❌ No hay una cuenta activa. Por favor, inicia sesión nuevamente.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const formDataObj = Object.fromEntries(formData.entries());

    const newTest: ResistanceTest = {
      id: `rt-${Date.now()}`,
      date: formDataObj.date as string,
      startTime: formDataObj.startTime as string,
      lotNumber: formDataObj.lotNumber as string,
      provider: formDataObj.provider as string,
      pool: formDataObj.pool as string,
      certificationType: formDataObj.certificationType as 'ASC' | 'CONVENCIONAL',
      testType: workMode,
      responsable: formDataObj.responsable as string,
      so2Residuals: formDataObj.so2Residuals ? Number(formDataObj.so2Residuals) : undefined,
      so2Bf: formDataObj.so2Bf ? Number(formDataObj.so2Bf) : undefined,
      createdBy: instance.getActiveAccount()?.name || "Usuario Desconocido",
      observations: '',
      samples: Array.from({ length: 7 }, (_, i) => ({
        id: `s-${Date.now()}-${i}`,
        timeSlot: i * 2,
        rawUnits: undefined,
        cookedUnits: undefined,
      })),
      isCompleted: false,
    };

    try {
      console.log('🔄 Iniciando creación de resistencia:', newTest.lotNumber);
      
      // Crear carpeta en OneDrive
      try {
        console.log('📁 Intentando crear carpeta en OneDrive:', newTest.lotNumber, 'Tipo:', workMode);
        await createLotFolder(instance, loginRequest.scopes, newTest.lotNumber, workMode);
        console.log('✅ Carpeta creada exitosamente en OneDrive');
      } catch (oneDriveError: any) {
        console.error('⚠️ Error al crear carpeta en OneDrive (continuando):', oneDriveError.message);
        // Continuar incluso si falla OneDrive
      }
      
      // Guardar en Firestore
      if (saveTestFn) {
        await saveTestFn(newTest);
      } else {
        await saveTestToFirestore(newTest);
      }
      
      alert(`✅ Resistencia ${newTest.lotNumber} creada exitosamente.`);
      onTestCreated();
      setRoute('dashboard');
    } catch (error: any) {
      alert(`❌ Error al crear resistencia: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-black">Crear Nueva Resistencia</CardTitle>
```
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="lotNumber" className="text-black text-sm">Número de Lote *</Label>
            <Input name="lotNumber" id="lotNumber" placeholder="Ej: 0003540-25" className="h-10" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-black text-sm">Proveedor *</Label>
            <Input name="provider" id="provider" placeholder="Ej: AquaPro" className="h-10" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pool" className="text-black text-sm">Piscina *</Label>
            <Input name="pool" id="pool" placeholder="Ej: P-05" className="h-10" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable" className="text-black text-sm">Responsable *</Label>
            <Input name="responsable" id="responsable" placeholder="Ej: Juan Pérez" className="h-10" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-black text-sm">Fecha *</Label>
            <Input name="date" id="date" type="date" className="h-10" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-black text-sm">Hora de Inicio *</Label>
            <Input name="startTime" id="startTime" type="time" className="h-10" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certificationType" className="text-black text-sm">Certificación *</Label>
            <Select name="certificationType" id="certificationType" className="h-10" required>
              <option value="ASC">ASC</option>
              <option value="CONVENCIONAL">CONVENCIONAL</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="so2Residuals" className="text-black text-sm">Residual SO2 MW (opcional)</Label>
            <Input name="so2Residuals" id="so2Residuals" type="number" step="0.1" placeholder="Ej: 15.5" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so2Bf" className="text-black text-sm">Residual SO2 BF (opcional)</Label>
            <Input name="so2Bf" id="so2Bf" type="number" step="0.1" placeholder="Ej: 12.3" className="h-10" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setRoute('dashboard')} disabled={isSaving}>
```
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Creando..." : "Crear Resistencia"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Detalle de resistencia
const TestDetailPage = ({ test, setRoute, onTestUpdated, saveTestFn }: { test: ResistanceTest; setRoute: (route: string) => void; onTestUpdated: () => void; saveTestFn?: (test: ResistanceTest) => Promise<void> }) => {
  const { instance } = useMsal();
  
  // Asegurar que test siempre tenga samples array
  const safeTest = {
    ...test,
    samples: test.samples || []
  };
  
  const [editedTest, setEditedTest] = useState<ResistanceTest>(safeTest);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Estados locales para campos de texto que aceptan decimales
  const [so2ResidualsText, setSo2ResidualsText] = useState<string>(test.so2Residuals?.toString() || '');
  const [so2BfText, setSo2BfText] = useState<string>(test.so2Bf?.toString() || '');

  // 🆕 Estado para modal de confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    sampleId: string | null;
    itemName: string;
  }>({
    isOpen: false,
    sampleId: null,
    itemName: ''
  });

  // 🆕 AUTO-GUARDADO con hook profesional (2 segundos)
  const { status: autoSaveStatus, markAsSaved } = useAutoSave({
    data: editedTest,
    onSave: async () => {
      if (saveTestFn) {
        await saveTestFn(editedTest);
      } else {
        await saveTestToFirestore(editedTest);
      }
      onTestUpdated(); // Actualizar lista en dashboard
    },
    delay: 2000, // 2 segundos
    enabled: !test.isCompleted // Solo si NO está completada
  });

  const formatTimeSlot = (baseTime: string, hoursToAdd: number) => {
    try {
      const [hours, minutes] = baseTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours + hoursToAdd, minutes, 0, 0);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return `+${hoursToAdd}h`;
    }
  };

  const handleSampleChange = (sampleId: string, field: 'rawUnits' | 'cookedUnits', value: number | undefined) => {
    const updatedTest = {
      ...editedTest,
      samples: editedTest.samples.map(s => s.id === sampleId ? { ...s, [field]: value } : s)
    };
    setEditedTest(updatedTest);
    // El auto-guardado se encarga del resto (2 segundos)
  };

  const handleObservationsChange = (value: string) => {
    const updatedTest = { ...editedTest, observations: value };
    setEditedTest(updatedTest);
    // El auto-guardado se encarga del resto (2 segundos)
  };

  // 🆕 Función para borrar muestra CON CONFIRMACIÓN
  const handleDeleteSample = (sampleId: string) => {
    const sample = editedTest.samples.find(s => s.id === sampleId);
    const timeSlot = sample ? `Hora ${sample.timeSlot}` : 'Muestra';
    setDeleteConfirm({
      isOpen: true,
      sampleId: sampleId,
      itemName: timeSlot
    });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.sampleId) {
      const updatedTest = {
        ...editedTest,
        samples: editedTest.samples.filter(s => s.id !== deleteConfirm.sampleId)
      };
      setEditedTest(updatedTest);
      
      // Guardar inmediatamente después de borrar
      if (saveTestFn) {
        await saveTestFn(updatedTest);
      } else {
        await saveTestToFirestore(updatedTest);
      }
      
      // 🆕 Marcar como guardado SIN notificación (false) para evitar duplicados
      markAsSaved(false);
      
      onTestUpdated();
    }
    
    setDeleteConfirm({ isOpen: false, sampleId: null, itemName: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, sampleId: null, itemName: '' });
  };

  const [uploadingPhotos, setUploadingPhotos] = useState<Set<string>>(new Set());
  
  const handlePhotoUpload = async (sampleId: string, file: File) => {
    try {
      // Verificar que la instancia MSAL esté disponible
      if (!instance) {
        throw new Error("La sesión no está activa. Por favor, recarga la página.");
      }

      // Verificar que hay una cuenta activa
      const activeAccount = instance.getActiveAccount();
      const allAccounts = instance.getAllAccounts();
      if (!activeAccount && allAccounts.length === 0) {
        throw new Error("No hay una cuenta activa. Por favor, inicia sesión nuevamente.");
      }

      // Marcar como subiendo
      setUploadingPhotos(prev => new Set([...prev, sampleId]));
      
      // Limpiar URL anterior si existe (para evitar cache del navegador)
      const previousSample = editedTest.samples.find(s => s.id === sampleId);
      if (previousSample?.photoUrl) {
        console.log('🔄 Reemplazando foto anterior...');
      }
      
      // Crear vista previa temporal mientras sube
      const tempUrl = URL.createObjectURL(file);
      setEditedTest(prev => ({
        ...prev,
        samples: prev.samples.map(s => s.id === sampleId ? { ...s, photoUrl: tempUrl, isUploading: true } : s)
      }));
      
      // Subir SOLO a OneDrive (esto eliminará la anterior y subirá la nueva)
      const photoUrl = await uploadPhotoToOneDrive(instance, loginRequest.scopes, editedTest.lotNumber, sampleId, file, editedTest.testType);
      
      // Actualizar con URL real y limpiar estado de carga
      const updatedTest = {
        ...editedTest,
        samples: editedTest.samples.map(s => s.id === sampleId ? { ...s, photoUrl, isUploading: false } : s)
      };
      
      setEditedTest(updatedTest);
      
      // 🔥 AUTO-GUARDAR con sistema dual inmediatamente después de subir foto
      try {
        if (saveTestFn) {
          await saveTestFn(updatedTest);
        } else {
          await saveTestToFirestore(updatedTest);
        }
      } catch (saveError: any) {
        // No mostrar error al usuario para no interrumpir el flujo
      }
      
      // Limpiar URL temporal
      URL.revokeObjectURL(tempUrl);
      
      // Mostrar notificación exitosa
    } catch (error: any) {
      
      // Limpiar estado de carga en caso de error
      setEditedTest(prev => ({
        ...prev,
        samples: prev.samples.map(s => s.id === sampleId ? { ...s, photoUrl: '', isUploading: false } : s)
      }));

      // Mostrar mensaje de error más específico
      if (error.message.includes("cuenta activa") || error.message.includes("inicia sesión")) {
        alert("❌ Sesión expirada. Por favor, recarga la página para volver a iniciar sesión.");
      } else if (error.message.includes("MSAL no está disponible")) {
        alert("❌ Error de autenticación. Por favor, recarga la página.");
      } else {
        alert(`❌ Error al subir foto: ${error.message}`);
      }
    } finally {
      // Limpiar estado de carga
      setUploadingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(sampleId);
        return newSet;
      });
    }
  };

  const handleSave = async () => {
    // Guardar INMEDIATAMENTE (sin esperar los 2 segundos del auto-guardado)
    // Útil cuando el usuario quiere asegurarse que los datos se guardaron antes de salir
    
    setIsSaving(true);
    try {
      if (saveTestFn) {
        await saveTestFn(editedTest);
      } else {
        await saveTestToFirestore(editedTest);
      }
      
      // 🆕 Marcar como guardado SIN notificación (false) para evitar duplicados
      // El auto-guardado ya muestra notificación verde automáticamente
      markAsSaved(false);
      
      onTestUpdated();
    } catch (error: any) {
      // Solo mostrar alert en caso de ERROR
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    // Verificar que la instancia MSAL esté disponible
    if (!instance) {
      alert("❌ La sesión no está activa. Por favor, recarga la página.");
      return;
    }

    // Verificar que hay una cuenta activa
    const activeAccount = instance.getActiveAccount();
    const allAccounts = instance.getAllAccounts();
    if (!activeAccount && allAccounts.length === 0) {
      alert("❌ No hay una cuenta activa. Por favor, inicia sesión nuevamente.");
      return;
    }

    // Validar que todas las fotos estén tomadas
    const samplesWithoutPhoto = editedTest.samples.filter(sample => !sample.photoUrl || sample.photoUrl.trim() === '');
    
    if (samplesWithoutPhoto.length > 0) {
      const missingHours = samplesWithoutPhoto.map(sample => 
        formatTimeSlot(editedTest.startTime, sample.timeSlot)
      ).join(', ');
      
      alert(`⚠️ No se puede completar la prueba. Faltan fotos en las siguientes horas:\n${missingHours}\n\nPor favor tome todas las fotos antes de completar.`);
      return;
    }

    if (!confirm('¿Está seguro de marcar esta resistencia como completada? Se generará y guardará el reporte Excel automáticamente.')) {
      return;
    }

    setIsCompleting(true);
    try {
      // Actualizar test con isCompleted = true
      const completedTest = { 
        ...editedTest, 
        isCompleted: true,
        completedAt: new Date().toISOString()
      };
      
      // Guardar con sistema dual
      if (saveTestFn) {
        await saveTestFn(completedTest);
      } else {
        await saveTestToFirestore(completedTest);
      }
      
      // Generar Excel
      const excelBlob = generateExcelBlob(completedTest);
      
      // Guardar Excel en OneDrive
      await saveExcelToOneDrive(instance, loginRequest.scopes, completedTest.lotNumber, excelBlob, completedTest.testType);
      
      // Actualizar estado local
      setEditedTest(completedTest);
      
      alert('✅ Resistencia completada y reporte guardado en OneDrive');
      onTestUpdated();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleExportReport = () => {
    try {
      exportToExcel(editedTest);
    } catch (error: any) {
      alert(`❌ Error al exportar: ${error.message}`);
    }
  };

  return (
    <>
      {/* 🆕 Indicador de estado de auto-guardado */}
      <div className="mb-3">
        <AutoSaveIndicator status={autoSaveStatus} />
      </div>

      {/* 🆕 Notificación flotante de guardado */}
      <SaveNotification status={autoSaveStatus} duration={3000} />

      {/* 🆕 Modal de confirmación de borrado */}
      <DeleteConfirmation
        isOpen={deleteConfirm.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="¿Eliminar muestra?"
        message="Esta acción eliminará permanentemente la muestra."
        itemName={deleteConfirm.itemName}
      />

      <Card>
      <CardHeader className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="p-2 h-auto" onClick={() => setRoute('dashboard')}>
              <ChevronLeft className="h-5 w-5"/>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <CardTitle className="text-lg">Lote {test.lotNumber}</CardTitle>
                {editedTest.isCompleted && (
                  <span className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-2 py-1 rounded w-fit">
                    <CheckCircle size={14} /> Completado
                  </span>
                )}
              </div>
              <CardDescription className="text-sm">
                {test.provider} - Piscina {test.pool} - {formatDateLocal(test.date)}
              </CardDescription>
              {!editedTest.isCompleted && (
                <div className="mt-2 text-xs sm:text-sm space-y-1">
                  {/* Indicador de fotos */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      📷 Fotos: {editedTest.samples.filter(s => s.photoUrl && s.photoUrl.trim() !== '').length}/{editedTest.samples.length}
                    </span>
                    {editedTest.samples.filter(s => s.photoUrl && s.photoUrl.trim() !== '').length === editedTest.samples.length && (
                      <span className="text-green-600 font-medium">✓</span>
                    )}
                  </div>
                  
                  {/* Indicador de datos */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      📊 Datos: {editedTest.samples.filter(s => s.rawUnits !== undefined && s.rawUnits !== null && s.cookedUnits !== undefined && s.cookedUnits !== null).length}/{editedTest.samples.length}
                    </span>
                    {editedTest.samples.filter(s => s.rawUnits !== undefined && s.rawUnits !== null && s.cookedUnits !== undefined && s.cookedUnits !== null).length === editedTest.samples.length && (
                      <span className="text-green-600 font-medium">✓</span>
                    )}
                  </div>
                  
                  {/* Progreso total */}
                  <div className="text-blue-600 font-medium">
                    Progreso: {Math.round((() => {
                      if (!editedTest.samples || editedTest.samples.length === 0) return 0;
                      let totalFields = 0;
                      let completedFields = 0;
                      editedTest.samples.forEach(sample => {
                        totalFields += 3;
                        if (sample.rawUnits !== undefined && sample.rawUnits !== null) completedFields++;
                        if (sample.cookedUnits !== undefined && sample.cookedUnits !== null) completedFields++;
                        if (sample.photoUrl && sample.photoUrl.trim() !== '') completedFields++;
                      });
                      return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
                    })())}%
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-11" onClick={handleExportReport}>
              <Download size={16} className="mr-2"/>
              Excel
            </Button>
            {!editedTest.isCompleted && (
              <>
                <Button variant="outline" className="h-11" onClick={handleSave} disabled={isSaving}>
                  <Save size={16} className="mr-2"/>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
                <div title={editedTest.samples.some(sample => !sample.photoUrl || sample.photoUrl.trim() === '') ? 
                    'Faltan fotos por tomar. Complete todas las fotos para poder finalizar.' : 
                    'Completar prueba y generar reporte Excel'
                  }>
                  <Button 
                    className="h-11 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
                    onClick={handleComplete} 
                    disabled={isCompleting || editedTest.samples.some(sample => !sample.photoUrl || sample.photoUrl.trim() === '')}
                  >
                    <CheckCircle size={16} className="mr-2"/>
                    {isCompleting ? 'Completando...' : 'Completar'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Campos básicos editables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            <Label htmlFor="lotNumber" className="font-semibold text-xs sm:text-sm">Número de Lote *</Label>
            <Input 
              id="lotNumber" 
              value={editedTest.lotNumber}
              onChange={(e) => setEditedTest(prev => ({ ...prev, lotNumber: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="provider" className="font-semibold text-xs sm:text-sm">Proveedor *</Label>
            <Input 
              id="provider" 
              value={editedTest.provider}
              onChange={(e) => setEditedTest(prev => ({ ...prev, provider: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pool" className="font-semibold text-xs sm:text-sm">Piscina *</Label>
            <Input 
              id="pool" 
              value={editedTest.pool}
              onChange={(e) => setEditedTest(prev => ({ ...prev, pool: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="responsable" className="font-semibold text-xs sm:text-sm">Responsable QC *</Label>
            <Input 
              id="responsable" 
              value={editedTest.responsable}
              onChange={(e) => setEditedTest(prev => ({ ...prev, responsable: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="certificationType" className="font-semibold text-xs sm:text-sm">Certificación *</Label>
            <Select 
              id="certificationType" 
              value={editedTest.certificationType}
              onChange={(e) => setEditedTest(prev => ({ ...prev, certificationType: e.target.value as 'ASC' | 'CONVENCIONAL' }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            >
              <option value="ASC">ASC</option>
              <option value="CONVENCIONAL">CONVENCIONAL</option>
            </Select>
          </div>
        </div>

        {/* Campos de SO2 editables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="space-y-1">
            <Label htmlFor="so2Residuals" className="text-black font-semibold text-xs sm:text-sm">Residual SO2 MW *</Label>
            <Input 
              id="so2Residuals" 
              type="text"
              inputMode="decimal"
              value={so2ResidualsText}
              onChange={(e) => {
                const value = e.target.value;
                setSo2ResidualsText(value);
                
                // Convertir a número cuando sea posible (sin bloquear la escritura)
                if (value === '') {
                  setEditedTest(prev => ({ ...prev, so2Residuals: undefined }));
                } else {
                  const normalized = value.replace(',', '.');
                  const num = parseFloat(normalized);
                  if (!isNaN(num)) {
                    setEditedTest(prev => ({ ...prev, so2Residuals: num }));
                  }
                }
              }}
              placeholder="Ej: 15.5 o 15,5"
              disabled={editedTest.isCompleted}
              className="font-medium h-11"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="so2Bf" className="text-black font-semibold text-xs sm:text-sm">Residual SO2 BF *</Label>
            <Input 
              id="so2Bf" 
              type="text"
              inputMode="decimal"
              value={so2BfText}
              onChange={(e) => {
                const value = e.target.value;
                setSo2BfText(value);
                
                // Convertir a número cuando sea posible (sin bloquear la escritura)
                if (value === '') {
                  setEditedTest(prev => ({ ...prev, so2Bf: undefined }));
                } else {
                  const normalized = value.replace(',', '.');
                  const num = parseFloat(normalized);
                  if (!isNaN(num)) {
                    setEditedTest(prev => ({ ...prev, so2Bf: num }));
                  }
                }
              }}
              placeholder="Ej: 12.3 o 12,3"
              disabled={editedTest.isCompleted}
              className="font-medium h-11"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-6 w-full">
          {(editedTest.samples || []).map(sample => {
            // Determinar si la muestra está completa
            const isComplete = sample.rawUnits !== undefined && sample.rawUnits !== null && 
                              sample.cookedUnits !== undefined && sample.cookedUnits !== null && 
                              sample.photoUrl && sample.photoUrl.trim() !== '';
            
            return (
            <Card key={sample.id} className={`w-full border-2 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all rounded-lg ${
              isComplete 
                ? 'border-green-400 dark:border-green-500' 
                : 'border-amber-300 dark:border-amber-500'
            }`}>
              <CardHeader className={`pb-1 p-2 sm:p-3 rounded-t-lg bg-gradient-to-r ${
                isComplete 
                  ? 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700' 
                  : 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700'
              }`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-semibold text-xs sm:text-base">
                    🕐 {formatTimeSlot(test.startTime, sample.timeSlot)}
                  </CardTitle>
                  <span className="text-[10px] sm:text-xs bg-white/20 px-2 py-0.5 rounded-full text-white font-medium">
                    {isComplete ? '✓ Listo' : 'Pendiente'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-2 p-2 sm:p-3">
                {/* Sección Unidades */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`raw-${sample.id}`} className="text-xs sm:text-sm font-medium">Unidades Crudo</Label>
                    {sample.rawUnits !== undefined && sample.rawUnits !== null ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs">⏳</span>
                    )}
                  </div>
                  <Input 
                    id={`raw-${sample.id}`} 
                    type="text"
                    inputMode="decimal"
                    value={sample.rawUnits !== undefined && sample.rawUnits !== null ? sample.rawUnits.toString() : ''}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      
                      if (rawValue === '') {
                        handleSampleChange(sample.id, 'rawUnits', undefined);
                        return;
                      }
                      
                      // Reemplazar coma por punto
                      const normalizedValue = rawValue.replace(',', '.');
                      const numValue = parseFloat(normalizedValue);
                      
                      // Si es un número válido y está en el rango, guardarlo
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
                        handleSampleChange(sample.id, 'rawUnits', numValue);
                      }
                      // Si está escribiendo (ej: "15."), permitir continuar
                    }}
                    onBlur={(e) => {
                      // Al salir del campo, validar y limpiar si está fuera de rango
                      const rawValue = e.target.value;
                      const normalizedValue = rawValue.replace(',', '.');
                      const numValue = parseFloat(normalizedValue);
                      if (isNaN(numValue) || numValue < 0 || numValue > 20) {
                        handleSampleChange(sample.id, 'rawUnits', undefined);
                      }
                    }}
                    placeholder="0-20"
                    disabled={editedTest.isCompleted}
                    className="h-8 sm:h-10 text-xs sm:text-sm font-semibold bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm transition-all placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`cooked-${sample.id}`} className="text-xs sm:text-sm font-medium">Unidades Cocido</Label>
                    {sample.cookedUnits !== undefined && sample.cookedUnits !== null ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs">⏳</span>
                    )}
                  </div>
                  <Input 
                    id={`cooked-${sample.id}`} 
                    type="text"
                    inputMode="decimal"
                    value={sample.cookedUnits !== undefined && sample.cookedUnits !== null ? sample.cookedUnits.toString() : ''}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      
                      if (rawValue === '') {
                        handleSampleChange(sample.id, 'cookedUnits', undefined);
                        return;
                      }
                      
                      // Reemplazar coma por punto
                      const normalizedValue = rawValue.replace(',', '.');
                      const numValue = parseFloat(normalizedValue);
                      
                      // Si es un número válido y está en el rango, guardarlo
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
                        handleSampleChange(sample.id, 'cookedUnits', numValue);
                      }
                      // Si está escribiendo (ej: "12."), permitir continuar
                    }}
                    onBlur={(e) => {
                      // Al salir del campo, validar y limpiar si está fuera de rango
                      const rawValue = e.target.value;
                      const normalizedValue = rawValue.replace(',', '.');
                      const numValue = parseFloat(normalizedValue);
                      if (isNaN(numValue) || numValue < 0 || numValue > 20) {
                        handleSampleChange(sample.id, 'cookedUnits', undefined);
                      }
                    }}
                    placeholder="0-20"
                    disabled={editedTest.isCompleted}
                    className="h-8 sm:h-10 text-xs sm:text-sm font-semibold bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm transition-all placeholder:text-gray-400"
                  />
                </div>
                {/* Separador eliminado para spacing limpio */}
                {/* Sección Foto */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium">Foto</span>
                    {sample.photoUrl && sample.photoUrl.trim() !== '' ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</span>
                    ) : (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs">⏳</span>
                    )}
                  </div>
                  {/* Input para cámara */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id={`photo-camera-${sample.id}`}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(sample.id, file);
                    }}
                    disabled={editedTest.isCompleted}
                  />
                  {/* Input para galería */}
                  <input
                    type="file"
                    accept="image/*"
                    id={`photo-gallery-${sample.id}`}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(sample.id, file);
                    }}
                    disabled={editedTest.isCompleted}
                  />
                  <div className="flex flex-row gap-2 w-full">
                    <Button 
                      className={`flex-1 gap-1.5 h-8 sm:h-9 text-xs sm:text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm border-0 transition-all ${uploadingPhotos.has(sample.id) ? 'opacity-50' : ''}`}
                      onClick={() => document.getElementById(`photo-camera-${sample.id}`)?.click()}
                      disabled={editedTest.isCompleted || uploadingPhotos.has(sample.id)}
                    >
                      {uploadingPhotos.has(sample.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          <span className="text-[10px] sm:text-xs">Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Camera size={14} className="sm:w-4 sm:h-4" />
                          <span>Cámara</span>
                        </>
                      )}
                    </Button>
                    <Button 
                      className="flex-1 gap-1.5 h-8 sm:h-9 text-xs sm:text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm border-0 transition-all"
                      onClick={() => document.getElementById(`photo-gallery-${sample.id}`)?.click()}
                      disabled={editedTest.isCompleted || uploadingPhotos.has(sample.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      <span>Galería</span>
                    </Button>
                  </div>
                  
                  {sample.photoUrl && (
                    <div className="space-y-1 sm:space-y-2">
                      {/* Vista previa de la imagen */}
                      <div className="relative group w-full h-20 sm:h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        <img 
                          src={sample.photoUrl} 
                          alt={`Foto muestra ${formatTimeSlot(test.startTime, sample.timeSlot)}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        {/* Badge de completado */}
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                          ✓
                        </div>
                        {/* Fallback si la imagen no carga */}
                        <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                          <div className="text-center text-gray-500">
                            <Camera size={24} />
                            <p className="text-xs mt-1">Imagen no disponible</p>
                          </div>
                        </div>
                        {/* Overlay con botones */}
                        <div className="absolute top-2 right-2 flex gap-1">
                        </div>
                      </div>
                      
                      {/* Botón de descarga compacto */}
                      <a 
                        href={sample.photoUrl} 
                        download={`${test.lotNumber}-${formatTimeSlot(test.startTime, sample.timeSlot)}.jpg`}
                        className="block"
                      >
                        <Button 
                          className="w-full h-7 gap-1 text-[10px] sm:text-xs bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-sm border-0 transition-all font-medium"
                        >
                          ⬇️ Descargar
                        </Button>
                      </a>
                    </div>
                  )}
                  
                  {!sample.photoUrl && (
                    <div className="w-full h-16 sm:h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <Camera size={20} className="mx-auto mb-1" />
                        <p className="text-[10px] sm:text-xs font-medium">Sin foto</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="observations">Observaciones</Label>
          <Textarea 
            id="observations"
            value={editedTest.observations || ''}
            onChange={(e) => handleObservationsChange(e.target.value)}
            placeholder="Ingrese observaciones relevantes..."
            rows={4}
            disabled={editedTest.isCompleted}
          />
        </div>

        {/* Sección de Eliminación */}
        {(true) && (
          <div className="mt-6 p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">
              ⚠️ Zona de Eliminación - Se borrará TODO (datos + fotos + archivo Excel)
            </p>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Escribe 'confirmar' para activar eliminación..."
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="h-10 text-sm"
              />
              <button
                type="button"
                disabled={deleteConfirmText.toLowerCase() !== 'confirmar'}
                onClick={async () => {
                  if (!confirm(`¿Realmente desea eliminar la resistencia del lote ${editedTest.lotNumber}?\n\n⚠️ Se borrarán TODOS los datos, fotos y archivos. Esta acción NO se puede deshacer.`)) {
                    return;
                  }
                  try {
                    await deleteTest(editedTest.id, editedTest.lotNumber, editedTest.testType, instance, loginRequest.scopes);
                    alert('✅ Resistencia eliminada completamente (Firestore + OneDrive)');
                    onTestUpdated();
                    setRoute('dashboard');
                  } catch (error: any) {
                    alert(`❌ Error: ${error.message}`);
                  }
                  setDeleteConfirmText('');
                }}
                className={`w-full px-3 py-2 text-xs rounded-md font-medium transition-colors ${
                  deleteConfirmText.toLowerCase() === 'confirmar'
                    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                🗑️ Eliminar Resistencia
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};

// Dashboard principal
const DashboardPage = () => {
  const { instance, accounts } = useMsal();
  const [route, setRoute] = useState('dashboard');
  const [routeParams, setRouteParams] = useState<any>(null);
  const [tests, setTests] = useState<ResistanceTest[]>([]);
  const [allTests, setAllTests] = useState<ResistanceTest[]>([]); // Cache de TODOS los tests
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  // 💾 PERSISTENTE: El modo se guarda en localStorage
  const [workMode, setWorkMode] = useState<TestType>('MATERIA_PRIMA');
  const [workModeSaved, setWorkModeSaved] = useState(false);
  
  // ✅ NUEVO: Infinite scroll - Mostrar 30 inicialmente
  const [visibleCount, setVisibleCount] = useState(30);
  const TESTS_PER_LOAD = 30;
  
  // ✅ NUEVO: Búsqueda mejorada con fallback
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [showSearchInFirestore, setShowSearchInFirestore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // 🌐 NUEVO: Detector de conexión offline
  const { isOnline, wasOffline } = useOnlineStatus();

  // Cargar todos los tests UNA SOLA VEZ con sincronización incremental
  // 🌐 OPTIMIZADO: Modo offline - Carga cache local primero, sincroniza solo si hay conexión
  // 🔄 HÍBRIDO: Sistema dual que lee de índice híbrido + Firebase legacy
  const loadAllTests = async () => {
    if (!instance) {
      console.error('No hay sesión MSAL activa');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Mostrar cache local INMEDIATAMENTE (funciona offline)
      const cachedTests = await getAllTestsLocally();
      console.log(`📦 ${cachedTests.length} tests cargados desde cache local`);
      setAllTests(cachedTests);
      filterTests(cachedTests, showAll);
      setIsLoading(false);  // ✅ UI lista de inmediato
      
      // 2. 🌐 Sincronizar cambios SOLO si hay conexión
      if (isOnline) {
        try {
          // 🔄 SISTEMA DUAL: Lee de índice híbrido + Firebase legacy
          const allTestsHybrid = await loadTestsHybridDual(instance, loginRequest.scopes);
          
          setAllTests(allTestsHybrid);
          filterTests(allTestsHybrid, showAll);
          
        } catch (syncError) {
          // Fallback: Seguir con datos locales
        }
      }
      
    } catch (error: any) {
      setIsLoading(false);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // 💾 PERSISTENCIA: Cargar modo guardado y guardar cuando cambie
  useEffect(() => {
    // Al montar: cargar modo guardado
    if (typeof window !== 'undefined' && !workModeSaved) {
      const savedMode = localStorage.getItem('workMode') as TestType | null;
      if (savedMode) {
        setWorkMode(savedMode);
      }
      setWorkModeSaved(true);
    }
  }, [workModeSaved]);

  // Guardar modo cuando cambie
  useEffect(() => {
    if (workModeSaved && typeof window !== 'undefined') {
      localStorage.setItem('workMode', workMode);
    }
  }, [workMode, workModeSaved]);

  // Filtrar tests en memoria (MUY RÁPIDO)
  const filterTests = (testsArray: ResistanceTest[], showCompleted: boolean) => {
    console.log(`📊 Filtrando ${testsArray.length} tests para workMode: ${workMode}`);
    
    let filtered = testsArray;
    
    // 1️⃣ Filtrar por tipo de resistencia (workMode)
    const beforeTypeFilter = filtered.length;
    filtered = filtered.filter(t => t.testType === workMode);
    console.log(`  📌 Después de filtro por tipo: ${filtered.length}/${beforeTypeFilter} (workMode: ${workMode})`);
    
    // Mostrar tipos en allTests para depuración
    const types = testsArray.map(t => t.testType).filter((v, i, a) => a.indexOf(v) === i);
    console.log(`  🔍 Tipos disponibles:`, types);
    
    // 2️⃣ Filtrar por estado (completadas o en progreso)
    if (showCompleted) {
      // Mostrar todas (completadas + en progreso) del tipo actual
    } else {
      // Solo mostrar en progreso del tipo actual
      const beforeCompleteFilter = filtered.length;
      filtered = filtered.filter(t => !t.isCompleted);
      console.log(`  ✅ Después de filtro completadas: ${filtered.length}/${beforeCompleteFilter}`);
    }
    
    setTests(filtered);
    // ✅ Resetear contador de visibles al filtrar
    setVisibleCount(TESTS_PER_LOAD);
    
    console.log(`✅ Resultado final: ${filtered.length} tests visibles`);
  };
  
  // 🔥 CRÍTICO FIX: Ejecutar filterTests cuando workMode cambia
  // Esto previene que los tests "desaparezcan" cuando el usuario cambia entre tipos
  useEffect(() => {
    if (allTests.length > 0 && workModeSaved) {
      console.log(`🔄 Re-filtrando tests porque workMode cambió a: ${workMode}`);
      filterTests(allTests, showAll);
    }
  }, [workMode]); // ← Se ejecuta cada vez que workMode cambia
  
  // 🔄 NUEVO: Función helper para guardado dual (híbrido + legacy)
  const saveTestDual = async (test: ResistanceTest) => {
    if (!instance) {
      console.error('No hay sesión MSAL activa para guardado dual');
      // Fallback a guardado legacy
      await saveTestToFirestore(test);
      return;
    }

    try {
      console.log('🔄 Guardando con sistema dual...');
      const result = await saveTestHybridDual(instance, loginRequest.scopes, test);
      
      if (result.success) {
        console.log('✅ Guardado dual exitoso');
      } else {
        console.warn('⚠️ Guardado dual con advertencias:', result.errors);
      }
    } catch (error) {
      console.error('❌ Error en guardado dual, fallback a legacy:', error);
      // Fallback: Guardar solo en legacy
      await saveTestToFirestore(test);
    }
  };
  
  // 🚀 MIGRACIÓN COMPLETADA - Función ya no necesaria (todos los tests migrados)
  // const handleStartMigration = async () => {
  //   if (!instance || !accounts || accounts.length === 0) {
  //     alert('❌ Debes iniciar sesión primero');
  //     return;
  //   }
  //   
  //   try {
  //     console.log('🚀 Iniciando migración manual...');
  //     await migrationService.startManualMigration(instance, loginRequest.scopes);
  //     console.log('✅ Migración completada');
  //     await loadAllTests();
  //     alert('✅ Migración completada exitosamente');
  //   } catch (error) {
  //     console.error('❌ Error en migración:', error);
  //     alert('Error: ' + (error as any).message);
  //   }
  // };
  
  // ✅ NUEVO: Cargar más tests (infinite scroll)
  const loadMoreTests = () => {
    setVisibleCount(prev => Math.min(prev + TESTS_PER_LOAD, tests.length));
  };

  // ✅ MEJORADO: Búsqueda con fallback a Firestore
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      filterTests(allTests, showAll);
      setShowSearchInFirestore(false);
      setLastSearchTerm('');
      return;
    }
    
    setIsSearching(true);
    setLastSearchTerm(searchTerm);
    
    try {
      // Buscar primero en cache local (funciona offline)
      const results = await searchTests(searchTerm, false);
      setTests(results);
      
      // Si no encuentra nada Y hay conexión, mostrar botón para buscar en Firestore
      if (results.length === 0) {
        if (isOnline) {
          setShowSearchInFirestore(true);
        } else {
          // Si está offline, informar que solo buscó en local
          alert('📴 Sin conexión - Solo se buscó en las últimas 50 resistencias guardadas localmente');
        }
      } else {
        setShowSearchInFirestore(false);
      }
      
      setVisibleCount(TESTS_PER_LOAD); // Resetear contador
    } catch (error: any) {
      alert(`❌ Error en búsqueda: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };
  
  // ✅ NUEVO: Buscar en histórico completo de Firestore
  const searchInFullHistory = async () => {
    if (!lastSearchTerm) return;
    
    // Verificar conexión antes de intentar búsqueda en Firestore
    if (!isOnline) {
      alert('📴 Sin conexión - No se puede buscar en el histórico completo. Conecta a internet para acceder a todos los datos.');
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchTests(lastSearchTerm, true); // ✅ Buscar en Firestore
      setTests(results);
      setShowSearchInFirestore(false);
      
      if (results.length === 0) {
        alert('❌ No se encontraron resistencias con ese criterio en todo el histórico');
      } else {
        alert(`✅ Se encontraron ${results.length} resistencias en el histórico completo`);
      }
      
      setVisibleCount(TESTS_PER_LOAD);
    } catch (error: any) {
      alert(`❌ Error buscando en histórico: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Cargar al inicio UNA SOLA VEZ
  useEffect(() => {
    loadAllTests();
  }, []);

  // 🔄 NUEVO: Iniciar migración en background (no bloquea la app)
  useEffect(() => {
    if (!instance || !isOnline) {
      return; // Esperar a tener sesión y conexión
    }

    // Verificar que hay una cuenta activa MSAL antes de iniciar migración
    if (!accounts || accounts.length === 0) {
      console.log('⏸️ Esperando autenticación MSAL para iniciar migración...');
      return; // No hay cuenta activa todavía
    }

    // ✅ MIGRACIÓN COMPLETADA - Ya no es necesario migrar en background
    // Todos los tests ya están en el sistema híbrido
    // const startMigration = async () => {
    //   try {
    //     console.log('🚀 Iniciando migración en background...');
    //     await migrationService.startBackgroundMigration(instance, loginRequest.scopes);
    //     
    //     console.log('✅ Migración completada - Recargando tests...');
    //     await loadAllTests();
    //   } catch (error) {
    //     console.error('⚠️ Error en migración (datos legacy seguros):', error);
    //   }
    // };
    // const migrationTimer = setTimeout(startMigration, 5000);
    // return () => clearTimeout(migrationTimer);
  }, [instance, isOnline, accounts]);

  // Filtrar cuando cambie showAll o workMode (INSTANTÁNEO, sin llamada a Firestore)
  useEffect(() => {
    filterTests(allTests, showAll);
  }, [showAll, workMode]);

  // 🆕 Sincronizar datos pendientes al iniciar la app (SOLO si hay conexión)
  useEffect(() => {
    const syncOnStartup = async () => {
      if (!isOnline) {
        console.log('📴 Sin conexión - Omitiendo sincronización inicial');
        return;
      }
      
      try {
        const { syncPendingData } = await import('../lib/firestoreService');
        const syncedCount = await syncPendingData();
        if (syncedCount > 0) {
          console.log(`🔄 ${syncedCount} tests sincronizados al inicio`);
          // Recargar tests después de sincronizar
          loadAllTests();
        }
      } catch (error) {
        console.error('❌ Error en sincronización inicial:', error);
      }
    };

    syncOnStartup();
  }, []); // Solo al montar el componente

  // 🌐 NUEVO: Sincronizar cuando vuelva la conexión
  useEffect(() => {
    if (wasOffline) {
      console.log('🔄 Conexión restaurada - Sincronizando datos pendientes...');
      const syncAfterReconnect = async () => {
        try {
          const { syncPendingData } = await import('../lib/firestoreService');
          const syncedCount = await syncPendingData();
          if (syncedCount > 0) {
            console.log(`✅ ${syncedCount} tests sincronizados después de reconectar`);
          }
          // Recargar todos los datos
          loadAllTests();
        } catch (error) {
          console.error('❌ Error en sincronización post-reconexión:', error);
        }
      };
      
      syncAfterReconnect();
    }
  }, [wasOffline]); // Se ejecuta cuando wasOffline cambia a true

  const handleSetRoute = (newRoute: string, params: any = null) => {
    setRoute(newRoute);
    setRouteParams(params);
  };

  const renderContent = () => {
    switch (route) {
      case 'new-test':
        return <NewTestPage setRoute={handleSetRoute} onTestCreated={loadAllTests} saveTestFn={saveTestDual} workMode={workMode} />;
      case 'test-detail':
        const test = tests.find(t => t.id === routeParams.id);
        if (test) return <TestDetailPage test={test} setRoute={handleSetRoute} onTestUpdated={loadAllTests} saveTestFn={saveTestDual} />;
        return <p>Test no encontrado</p>;
      default:
        return <ResistanceTestList setRoute={handleSetRoute} tests={tests} isLoading={isLoading} onRefresh={loadAllTests} onSearch={handleSearch} showAll={showAll} setShowAll={setShowAll} instance={instance} accounts={accounts} visibleCount={visibleCount} loadMoreTests={loadMoreTests} showSearchInFirestore={showSearchInFirestore} searchInFullHistory={searchInFullHistory} isSearching={isSearching} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950">
      {/* 🌐 Banner de estado offline/online */}
      <OfflineBanner isOnline={isOnline} wasOffline={wasOffline} />
      
      {/* 🔄 Banner de progreso de migración - YA NO NECESARIO (migración completada) */}
      {/* <MigrationStatusBanner /> */}
      
      {/* Header universal - Optimizado para móvil */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Fila 1: Usuario y Cerrar Sesión - Ultra compacta */}
          <div className="flex items-center justify-between px-2.5 py-1 border-b dark:border-gray-700">
            <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
              <User className="h-3 w-3" />
              <span className="font-medium truncate max-w-[100px] sm:max-w-none">{accounts[0]?.name?.split(' ')[0] || "Lab"}</span>
            </div>
            <button
              onClick={() => instance.logoutRedirect()}
              className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors p-0.5"
              title="Cerrar Sesión"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
          
          {/* Fila 2: Switch de modo (solo en dashboard) - Con espaciado */}
          {route === 'dashboard' && (
            <div className="flex justify-center px-2 py-2 sm:py-2.5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <WorkModeSwitch 
                currentMode={workMode} 
                onModeChange={setWorkMode}
              />
            </div>
          )}
          
          {/* Fila 3: Navegación - Lado a lado */}
          <div className="flex gap-2 px-2 py-2 sm:py-2.5">
            <button 
              onClick={() => handleSetRoute('dashboard')} 
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                route === 'dashboard' 
                  ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md hover:bg-blue-700 dark:hover:bg-blue-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Dashboard</span>
            </button>
            <button 
              onClick={() => handleSetRoute('new-test')} 
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                route === 'new-test' 
                  ? 'bg-green-600 dark:bg-green-600 text-white shadow-md hover:bg-green-700 dark:hover:bg-green-700' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              <PlusCircle className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">Nueva Resistencia</span>
              <span className="whitespace-nowrap sm:hidden">Nueva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content - Centrado en desktop */}
      <div className="flex flex-col w-full min-w-0 items-center">
        {/* Main content con padding responsive y centrado - Min height solo cuando está vacío */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 w-full min-w-0 max-w-7xl overflow-x-hidden h-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Página de error
const ErrorLoginPage = () => {
  const { instance } = useMsal();
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="max-w-sm w-full">
        <CardHeader className="space-y-4">
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Por favor, inicie sesión con Microsoft para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => instance.loginRedirect(loginRequest)} className="w-full gap-2">
            <LogIn className="h-5 w-5" />
            Iniciar con Microsoft
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

// Componente de carga consistente para evitar errores de hidratación
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando...</p>
    </div>
  </div>
);

// Componente de fallback cuando MSAL no está disponible
const NoMsalFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-red-600">🔒 Error de Autenticación</CardTitle>
        <CardDescription>
          No se puede inicializar el sistema de login de Microsoft.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Soluciones:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Usar <strong>Chrome, Edge o Firefox</strong></li>
            <li>• Habilitar JavaScript completamente</li>
            <li>• Permitir cookies y almacenamiento local</li>
            <li>• Desactivar extensiones bloqueadoras</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🖥️ Alternativa:</h4>
          <p className="text-sm text-blue-700">
            Accede desde la computadora: <br/>
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">http://localhost:8080</code>
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.reload()} 
            className="flex-1"
          >
            🔄 Reintentar
          </Button>
          <Button 
            onClick={() => {
              alert('Contacta al administrador del sistema para obtener ayuda técnica.');
            }}
            variant="outline"
            className="flex-1"
          >
            � Ayuda
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Mock de MSAL para modo de desarrollo
const mockMsalInstance = {
  getActiveAccount: () => ({ name: 'Usuario de Desarrollo', username: 'dev@aquagold.com' }),
  loginRedirect: () => Promise.resolve(),
  logoutRedirect: () => Promise.resolve(),
};

const mockUseMsal = () => ({
  instance: mockMsalInstance,
  accounts: [{ name: 'Usuario de Desarrollo', username: 'dev@aquagold.com' }],
});

// Componente envolvente para modo desarrollo
const DevModeWrapper = ({ children }: { children: React.ReactNode }) => {
  // Simular el contexto de MSAL
  React.useEffect(() => {
    // @ts-ignore - Override temporal para desarrollo
    window.useMsal = mockUseMsal;
  }, []);
  
  return <>{children}</>;
};

// App principal
const App = () => {
  const { instance, loading, error } = useMsalInstance();

  // Exponer función de migración globalmente para uso en consola
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).migratePhotoUrls = migratePhotoUrls;
      console.log('🔧 Función migratePhotoUrls() disponible en consola');
    }
  }, []);

  // Registrar Service Worker para PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('[PWA] Service Worker registrado exitosamente:', registration);
        } catch (error) {
          console.error('[PWA] Error registrando Service Worker:', error);
        }
      });
    }
  }, []);

  // Mostrar loading mientras se inicializa
  if (loading) {
    return <LoadingScreen />;
  }

  // Mostrar error si MSAL falló
  if (error || !instance) {
    return <NoMsalFallback />;
  }

  // MSAL inicializado correctamente
  return (
    <MsalProvider instance={instance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginRequest}
        errorComponent={ErrorLoginPage}
        loadingComponent={LoadingScreen}
      >
        <DashboardPage />
      </MsalAuthenticationTemplate>
    </MsalProvider>
  );
};

export default App;








