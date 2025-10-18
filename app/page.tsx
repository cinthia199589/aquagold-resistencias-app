'use client';

import React, { useState, useEffect } from 'react';
import { MsalProvider, useMsal, MsalAuthenticationTemplate } from '@azure/msal-react';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { Home, PlusCircle, LogOut, User, LogIn, ChevronLeft, Camera, Save, Download, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { 
  saveTestToFirestore, 
  getInProgressTests, 
  markTestAsCompleted,
  searchTests,
  deleteTest,
  getAllTests
} from '../lib/firestoreService';
import { 
  createLotFolder, 
  saveExcelToOneDrive, 
  uploadPhotoToOneDrive 
} from '../lib/graphService';
import { exportToExcel, generateExcelBlob } from '../lib/excelExport';
import { ResistanceTest, Sample } from '../lib/types';
import SearchBar from '../components/SearchBar';
import DailyReportModal from '../components/DailyReportModal';

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

// Validar variables de entorno críticas
const requiredEnvVars = {
  clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
  tenantId: process.env.NEXT_PUBLIC_MSAL_TENANT_ID,
};

// Debug: Log variables (solo en desarrollo)
if (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) {
  console.log('MSAL Config Debug:', {
    clientId: requiredEnvVars.clientId ? 'SET' : 'MISSING',
    tenantId: requiredEnvVars.tenantId ? 'SET' : 'MISSING',
    redirectUri: getRedirectUri()
  });
}

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
  <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ${className}`}>{children}</div>;

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`p-6 ${className}`}>{children}</div>;

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${className}`}>{children}</h2>;

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>;

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => 
  <div className={`p-6 pt-0 ${className}`}>{children}</div>;

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
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors";
  const sizeClasses = {
    sm: "h-8 px-3 py-1.5 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 py-3 text-base"
  };
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
    ghost: "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
    outline: "border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
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
  <input {...props} className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700" />;

const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => 
  <label {...props} className={`text-sm font-medium leading-none text-gray-900 dark:text-gray-100 ${props.className || ''}`} />;

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => 
  <select {...props} className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700">{children}</select>;

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
  instance
}: { 
  setRoute: (route: string, params?: any) => void; 
  tests: ResistanceTest[]; 
  isLoading: boolean; 
  onRefresh: () => void;
  onSearch: (term: string) => void;
  showAll: boolean;
  setShowAll: (show: boolean) => void;
  instance: any;
}) => {
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; lotNumber: string } | null>(null);

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

  const handleDelete = async (testId: string, lotNumber: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se abra el detalle al hacer clic en eliminar
    
    if (!confirm(`¿Está seguro de eliminar la resistencia del lote ${lotNumber}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteTest(testId);
      alert('✅ Resistencia eliminada exitosamente');
      onRefresh();
    } catch (error: any) {
      alert(`❌ Error al eliminar: ${error.message}`);
    }
  };

  return (
    <>
      <Card className="w-full max-w-full">
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col gap-3 dashboard-header">
            {/* Título y Descripción - Desktop / Mobile */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <CardTitle className="text-lg sm:text-xl dashboard-title">{showAll ? 'Historial Completo' : 'Resistencias en Progreso'}</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {showAll ? 'Todas las resistencias guardadas' : 'Resistencias activas almacenadas en Firestore'}
                </CardDescription>
              </div>
            </div>

            {/* Búsqueda - En su propia sección */}
            <div className="w-full">
              <SearchBar onSearch={onSearch} />
            </div>

            {/* Botones de Control - Desktop: Centrados, Mobile: Column */}
            <div className="flex flex-col gap-2 w-full sm:flex-row sm:gap-3 sm:justify-center dashboard-buttons">
              <Button 
                variant="outline" 
                className="gap-2 text-xs sm:text-sm w-full sm:w-auto btn-mobile border-2 border-white text-white hover:bg-white hover:text-gray-900" 
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? '📋 En Progreso' : '🗂️ Historial Completo'}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 text-xs sm:text-sm w-full sm:w-auto btn-mobile border-2 border-white text-white hover:bg-white hover:text-gray-900" 
                onClick={() => setShowDailyReport(true)}
              >
                <FileText size={16}/> 
                <span className="hidden sm:inline">Reporte </span>Diario
              </Button>
              <Button 
                className="gap-2 text-xs sm:text-sm w-full sm:w-auto h-10 btn-mobile" 
                onClick={() => setRoute('new-test')}
              >
                <PlusCircle size={16}/> 
                <span className="sm:hidden">Nueva</span>
                <span className="hidden sm:inline">Nueva Resistencia</span>
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
              ) : tests.map(test => (
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
                        {test.isCompleted && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-1 py-0.5 rounded w-fit">
                            <CheckCircle size={12} /> Completado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 self-start sm:self-center">
                        {new Date(test.date).toLocaleDateString('es-EC')}
                      </div>
                    </div>
                    
                    {/* Info responsive - Compacto */}
                    <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span>Proveedor: <strong>{test.provider}</strong></span>
                        <span className="hidden sm:inline">|</span>
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
                        {test.samples.map((sample) => {
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
              ⚠️ Esta acción <strong>NO se puede deshacer</strong>. Se eliminarán todos los datos asociados.
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
                  await handleDelete(deleteConfirm.id, deleteConfirm.lotNumber, { stopPropagation: () => {} } as any);
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
const NewTestPage = ({ setRoute, onTestCreated }: { setRoute: (route: string) => void; onTestCreated: () => void }) => {
  const { instance } = useMsal();
  const [isSaving, setIsSaving] = useState(false);

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
      console.log('📁 Creando carpeta en OneDrive...');
      try {
        await createLotFolder(instance, loginRequest.scopes, newTest.lotNumber);
        console.log('✅ Carpeta lista en OneDrive');
      } catch (oneDriveError: any) {
        console.error('⚠️ Error en OneDrive (continuando):', oneDriveError);
        // Continuar incluso si falla OneDrive
      }
      
      // Guardar en Firestore
      console.log('💾 Guardando en Firestore...');
      await saveTestToFirestore(newTest);
      console.log('✅ Guardado en Firestore exitoso');
      
      alert(`✅ Resistencia ${newTest.lotNumber} creada exitosamente.`);
      onTestCreated();
      setRoute('dashboard');
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Stack:', error.stack);
      alert(`❌ Error al crear resistencia: ${error.message}\n\nRevisa la consola para más detalles.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-black">Crear Nueva Resistencia</CardTitle>
```
        <CardDescription className="text-gray-700">Los datos se guardarán en Firestore y OneDrive</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="lotNumber" className="text-black">Número de Lote *</Label>
            <Input name="lotNumber" id="lotNumber" placeholder="Ej: 0003540-25" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-black">Proveedor *</Label>
            <Input name="provider" id="provider" placeholder="Ej: AquaPro" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pool" className="text-black">Piscina *</Label>
            <Input name="pool" id="pool" placeholder="Ej: P-05" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable" className="text-black">Responsable *</Label>
            <Input name="responsable" id="responsable" placeholder="Ej: Juan Pérez" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-black">Fecha *</Label>
            <Input name="date" id="date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-black">Hora de Inicio *</Label>
            <Input name="startTime" id="startTime" type="time" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certificationType" className="text-black">Certificación *</Label>
            <Select name="certificationType" id="certificationType" required>
              <option value="ASC">ASC</option>
              <option value="CONVENCIONAL">CONVENCIONAL</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="so2Residuals" className="text-black">Residual SO2 MW (opcional)</Label>
            <Input name="so2Residuals" id="so2Residuals" type="number" step="0.1" placeholder="Ej: 15.5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so2Bf" className="text-black">Residual SO2 BF (opcional)</Label>
            <Input name="so2Bf" id="so2Bf" type="number" step="0.1" placeholder="Ej: 12.3" />
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
const TestDetailPage = ({ test, setRoute, onTestUpdated }: { test: ResistanceTest; setRoute: (route: string) => void; onTestUpdated: () => void }) => {
  const { instance } = useMsal();
  const [editedTest, setEditedTest] = useState<ResistanceTest>(test);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Estados locales para campos de texto que aceptan decimales
  const [so2ResidualsText, setSo2ResidualsText] = useState<string>(test.so2Residuals?.toString() || '');
  const [so2BfText, setSo2BfText] = useState<string>(test.so2Bf?.toString() || '');

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
    
    // Log para debug del progreso
    console.log(`🔄 Campo ${field} actualizado con valor:`, value, 'para muestra:', sampleId);
    
    // Guardar inmediatamente después de cambio de datos importantes
    setTimeout(async () => {
      try {
        await saveTestToFirestore(updatedTest);
        console.log('💾 Datos guardados automáticamente');
        
        // Mostrar notificación visual
        const notification = document.createElement('div');
        notification.className = 'auto-save-notification';
        notification.textContent = '💾 Guardado automáticamente';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 2000);
      } catch (error: any) {
        console.error('⚠️ Error guardando datos:', error);
      }
    }, 500);
  };

  const handleObservationsChange = (value: string) => {
    const updatedTest = { ...editedTest, observations: value };
    setEditedTest(updatedTest);
    
    // Auto-guardar observaciones después de 1 segundo
    setTimeout(async () => {
      try {
        await saveTestToFirestore(updatedTest);
        console.log('📝 Observaciones guardadas automáticamente');
      } catch (error: any) {
        console.error('⚠️ Error guardando observaciones:', error);
      }
    }, 1000);
  };

  const [uploadingPhotos, setUploadingPhotos] = useState<Set<string>>(new Set());
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Auto-guardar con debounce cuando cambian los datos (excepto cuando se está subiendo foto)
  useEffect(() => {
    // No auto-guardar si hay fotos subiendo para evitar conflictos
    if (uploadingPhotos.size > 0) return;
    
    // Limpiar timeout anterior
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Configurar nuevo auto-guardado después de 2 segundos de inactividad
    const newTimeout = setTimeout(async () => {
      try {
        console.log('🔄 Iniciando auto-guardado...');
        await saveTestToFirestore(editedTest);
        console.log('✅ Auto-guardado exitoso');
        
        // Mostrar notificación visual temporal
        const notification = document.createElement('div');
        notification.innerHTML = '💾 Guardado automáticamente';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          z-index: 9999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 2000);
        
      } catch (error: any) {
        console.error('⚠️ Error en auto-guardado:', error);
        
        // Mostrar notificación de error
        const errorNotification = document.createElement('div');
        errorNotification.innerHTML = '❌ Error al guardar automáticamente';
        errorNotification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          z-index: 9999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(errorNotification);
        setTimeout(() => {
          document.body.removeChild(errorNotification);
        }, 3000);
      }
    }, 2000);
    
    setAutoSaveTimeout(newTimeout);
    
    // Cleanup
    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [editedTest, uploadingPhotos.size]);
  
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
      
      // Crear vista previa temporal mientras sube
      const tempUrl = URL.createObjectURL(file);
      setEditedTest(prev => ({
        ...prev,
        samples: prev.samples.map(s => s.id === sampleId ? { ...s, photoUrl: tempUrl, isUploading: true } : s)
      }));
      
      // Subir SOLO a OneDrive (no a Firebase Storage)
      const photoUrl = await uploadPhotoToOneDrive(instance, loginRequest.scopes, editedTest.lotNumber, sampleId, file);
      
      // Actualizar con URL real y limpiar estado de carga
      const updatedTest = {
        ...editedTest,
        samples: editedTest.samples.map(s => s.id === sampleId ? { ...s, photoUrl, isUploading: false } : s)
      };
      
      setEditedTest(updatedTest);
      
      // 🔥 AUTO-GUARDAR en Firestore inmediatamente después de subir foto
      try {
        await saveTestToFirestore(updatedTest);
        console.log('✅ Foto subida y guardada automáticamente en Firestore');
      } catch (saveError: any) {
        console.error('⚠️ Error al auto-guardar en Firestore:', saveError);
        // No mostrar error al usuario para no interrumpir el flujo
      }
      
      // Limpiar URL temporal
      URL.revokeObjectURL(tempUrl);
      
      // Mostrar notificación exitosa más sutil
      console.log('✅ Foto subida exitosamente');
    } catch (error: any) {
      console.error(`❌ Error al subir foto: ${error.message}`);
      
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
    // Permitir guardar sin validar SO2 residuals para mayor flexibilidad
    // Los usuarios pueden guardar el progreso aunque no hayan completado estos campos
    
    setIsSaving(true);
    try {
      await saveTestToFirestore(editedTest);
      alert('✅ Cambios guardados exitosamente.');
      onTestUpdated();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
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
      // Marcar como completada en Firestore
      await markTestAsCompleted(editedTest.id);
      
      // Generar Excel
      const excelBlob = generateExcelBlob(editedTest);
      
      // Guardar Excel en OneDrive
      await saveExcelToOneDrive(instance, loginRequest.scopes, editedTest.lotNumber, excelBlob);
      
      // Actualizar estado local
      setEditedTest(prev => ({ ...prev, isCompleted: true }));
      
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
                {test.provider} - Piscina {test.pool} - {new Date(test.date).toLocaleDateString('es-EC')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="lotNumber" className="font-semibold">Número de Lote *</Label>
            <Input 
              id="lotNumber" 
              value={editedTest.lotNumber}
              onChange={(e) => setEditedTest(prev => ({ ...prev, lotNumber: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider" className="font-semibold">Proveedor *</Label>
            <Input 
              id="provider" 
              value={editedTest.provider}
              onChange={(e) => setEditedTest(prev => ({ ...prev, provider: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pool" className="font-semibold">Piscina *</Label>
            <Input 
              id="pool" 
              value={editedTest.pool}
              onChange={(e) => setEditedTest(prev => ({ ...prev, pool: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable" className="font-semibold">Responsable QC *</Label>
            <Input 
              id="responsable" 
              value={editedTest.responsable}
              onChange={(e) => setEditedTest(prev => ({ ...prev, responsable: e.target.value }))}
              disabled={editedTest.isCompleted}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="certificationType" className="font-semibold">Certificación *</Label>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <Label htmlFor="so2Residuals" className="text-black font-semibold">Residual SO2 MW *</Label>
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
          <div className="space-y-2">
            <Label htmlFor="so2Bf" className="text-black font-semibold">Residual SO2 BF *</Label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full">
          {editedTest.samples.map(sample => (
            <Card key={sample.id} className="w-full">
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-base">Hora: {formatTimeSlot(test.startTime, sample.timeSlot)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`raw-${sample.id}`} className="text-sm font-medium">Unidades Crudo</Label>
                    {sample.rawUnits !== undefined && sample.rawUnits !== null ? (
                      <span className="text-green-500 font-bold text-lg">✓</span>
                    ) : (
                      <span className="text-yellow-500 font-bold text-lg">⏳</span>
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
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`cooked-${sample.id}`} className="text-sm font-medium">Unidades Cocido</Label>
                    {sample.cookedUnits !== undefined && sample.cookedUnits !== null ? (
                      <span className="text-green-500 font-bold text-lg">✓</span>
                    ) : (
                      <span className="text-yellow-500 font-bold text-lg">⏳</span>
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
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Foto</span>
                    {sample.photoUrl && sample.photoUrl.trim() !== '' ? (
                      <span className="text-green-500 font-bold text-lg">✓</span>
                    ) : (
                      <span className="text-yellow-500 font-bold text-lg">⏳</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id={`photo-${sample.id}`}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(sample.id, file);
                    }}
                    disabled={editedTest.isCompleted}
                  />
                  <Button 
                    variant="outline" 
                    className={`w-full gap-2 h-11 text-sm font-medium ${uploadingPhotos.has(sample.id) ? 'bg-blue-50 border-blue-300' : ''}`}
                    onClick={() => document.getElementById(`photo-${sample.id}`)?.click()}
                    disabled={editedTest.isCompleted || uploadingPhotos.has(sample.id)}
                  >
                    {uploadingPhotos.has(sample.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={16} />
                        <span>{sample.photoUrl ? "Cambiar Foto" : "Tomar Foto"}</span>
                      </>
                    )}
                  </Button>
                  
                  {sample.photoUrl && (
                    <div className="space-y-1 sm:space-y-2">
                      {/* Vista previa de la imagen */}
                      <div className="relative w-full h-28 sm:h-32 bg-gray-100 rounded-lg overflow-hidden border">
                        <img 
                          src={sample.photoUrl} 
                          alt={`Foto muestra ${formatTimeSlot(test.startTime, sample.timeSlot)}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(sample.photoUrl, '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback si la imagen no carga */}
                        <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                          <div className="text-center text-gray-500">
                            <Camera size={24} />
                            <p className="text-xs mt-1">Imagen no disponible</p>
                          </div>
                        </div>
                        {/* Overlay con botones */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {/* Ícono de lupa removido - usar solo botón VER */}
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 gap-1 text-xs border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900"
                          onClick={() => window.open(sample.photoUrl, '_blank')}
                        >
                          �️ Ver
                        </Button>
                        <a 
                          href={sample.photoUrl} 
                          download={`${test.lotNumber}-${formatTimeSlot(test.startTime, sample.timeSlot)}.jpg`}
                          className="flex-1"
                        >
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full gap-1 text-xs border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900"
                          >
                            ⬇️ Descargar
                          </Button>
                        </a>
                      </div>
                      
                      {/* Indicador de estado */}
                      <div className="text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Foto cargada
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!sample.photoUrl && (
                    <div className="text-center py-4">
                      <div className="w-full h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400">
                          <Camera size={24} className="mx-auto mb-1" />
                          <p className="text-xs">Sin foto</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
                    await deleteTest(editedTest.id);
                    alert('✅ Resistencia eliminada completamente');
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
  );
};

// Dashboard principal
const DashboardPage = () => {
  const { instance, accounts } = useMsal();
  const [route, setRoute] = useState('dashboard');
  const [routeParams, setRouteParams] = useState<any>(null);
  const [tests, setTests] = useState<ResistanceTest[]>([]);
  const [allTests, setAllTests] = useState<ResistanceTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false); // Toggle para mostrar todo o solo en progreso

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const testsFromFirestore = showAll ? await getAllTests() : await getInProgressTests();
      setTests(testsFromFirestore);
      setAllTests(testsFromFirestore);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setTests(allTests);
      return;
    }
    
    try {
      const results = await searchTests(searchTerm);
      setTests(results);
    } catch (error: any) {
      alert(`❌ Error en búsqueda: ${error.message}`);
    }
  };

  useEffect(() => {
    loadTests();
  }, [showAll]); // Recargar cuando cambie showAll

  const handleSetRoute = (newRoute: string, params: any = null) => {
    setRoute(newRoute);
    setRouteParams(params);
  };

  const renderContent = () => {
    switch (route) {
      case 'new-test':
        return <NewTestPage setRoute={handleSetRoute} onTestCreated={loadTests} />;
      case 'test-detail':
        const test = tests.find(t => t.id === routeParams.id);
        if (test) return <TestDetailPage test={test} setRoute={handleSetRoute} onTestUpdated={loadTests} />;
        return <p>Test no encontrado</p>;
      default:
        return <ResistanceTestList setRoute={handleSetRoute} tests={tests} isLoading={isLoading} onRefresh={loadTests} onSearch={handleSearch} showAll={showAll} setShowAll={setShowAll} instance={instance} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-950">
      {/* Header universal - Siempre visible */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
            <Button 
              onClick={() => instance.logoutRedirect()} 
              variant="outline"
              className="text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-900 dark:text-gray-100" />
            <span className="text-gray-900 dark:text-gray-100">{accounts[0]?.name?.split(' ')[0] || "Usuario"}</span>
          </div>
        </div>
        
        {/* Navegación universal - Forzar rebuild */}
        <div className="flex border-t dark:border-gray-700">
          <button 
            onClick={() => handleSetRoute('dashboard')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              route === 'dashboard' 
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>
          <button 
            onClick={() => handleSetRoute('new-test')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              route === 'new-test' 
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Nueva Resistencia
          </button>
        </div>
      </div>

      {/* Main content - Full width siempre */}
      <div className="flex flex-col w-full min-w-0">
        {/* Main content con padding responsive */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 w-full min-w-0 max-w-full overflow-x-hidden">
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


