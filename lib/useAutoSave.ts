import { useEffect, useRef, useState, useMemo } from 'react';

export interface AutoSaveStatus {
  hasChanges: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export interface AutoSaveReturn {
  status: AutoSaveStatus;
  markAsSaved: (showNotification?: boolean) => void; // Permite marcar manualmente como guardado
}

interface UseAutoSaveOptions {
  data: any;
  onSave: () => Promise<void>;
  delay?: number; // En milisegundos
  enabled?: boolean;
  onStatusChange?: (status: AutoSaveStatus) => void;
}

/**
 * Hook para auto-guardar datos automáticamente
 * 
 * @param data - Los datos a monitorear
 * @param onSave - Función async que guarda los datos
 * @param delay - Tiempo de espera en ms (default: 30000 = 30s)
 * @param enabled - Si el auto-guardado está habilitado (default: true)
 * @param onStatusChange - Callback cuando cambia el estado del auto-guardado
 * 
 * @returns Estado actual del auto-guardado
 * 
 * @example
 * const saveStatus = useAutoSave({
 *   data: editedTest,
 *   onSave: async () => await saveTestToFirestore(editedTest),
 *   delay: 30000, // 30 segundos
 *   enabled: !test.isCompleted
 * });
 */
export const useAutoSave = ({ 
  data, 
  onSave, 
  delay = 2000, // 2 segundos por defecto (GUARDADO INMEDIATO)
  enabled = true,
  onStatusChange
}: UseAutoSaveOptions): AutoSaveReturn => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const statusRef = useRef<AutoSaveStatus | null>(null);
  const onSaveRef = useRef<() => Promise<void>>(onSave);

  const [status, setStatus] = useState<AutoSaveStatus>({
    hasChanges: false,
    isSaving: false,
    lastSaved: null,
    error: null
  });

  // Notificar cambios de estado
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
    // mantener ref sincronizada para evitar setState innecesario en el effect principal
    statusRef.current = status;
  }, [status, onStatusChange]);

  // Mantener referencia estable a onSave para no incluirla en las dependencias
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Serializar data una sola vez por render para evitar recalcular JSON.stringify en cada effect
  const serializedData = useMemo(() => JSON.stringify(data), [data]);

  useEffect(() => {
    // Si está deshabilitado o ya está guardando, no hacer nada
    if (!enabled || isSavingRef.current) {
      return;
    }

    // Si es la primera vez, solo guardar referencia
    if (!previousDataRef.current) {
      previousDataRef.current = serializedData;
      return;
    }

    // Si NO hay cambios, no hacer nada
    if (serializedData === previousDataRef.current) {
      // Evitar llamar setState si el estado ya indica que no hay cambios
      if (!statusRef.current || statusRef.current.hasChanges) {
        setStatus(prev => ({ ...prev, hasChanges: false }));
      }
      return;
    }

    // HAY CAMBIOS - marcar como pendiente (solo si no está ya marcado)
    if (!statusRef.current || !statusRef.current.hasChanges) {
      setStatus(prev => ({ ...prev, hasChanges: true, error: null }));
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timeout para auto-guardar
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;
        setStatus(prev => ({ ...prev, isSaving: true, error: null }));

        // Usar la referencia estable a onSave
        await onSaveRef.current();

        // Actualizar referencia después de guardar exitosamente
        previousDataRef.current = serializedData;
        
        setStatus({
          hasChanges: false,
          isSaving: false,
          lastSaved: new Date(),
          error: null
        });

      } catch (error) {
        console.error('Error en auto-guardado:', error);
        setStatus(prev => ({
          ...prev,
          isSaving: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }));
      } finally {
        isSavingRef.current = false;
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [serializedData, delay, enabled]);

  // Función para marcar manualmente como guardado (útil cuando se guarda con botón manual)
  const markAsSaved = (showNotification: boolean = false) => {
    previousDataRef.current = serializedData;
    
    // Limpiar timeout pendiente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Actualizar estado
    setStatus(prev => ({
      ...prev,
      hasChanges: false,
      isSaving: false,
      error: null,
      // Solo actualizar lastSaved si se quiere mostrar notificación
      lastSaved: showNotification ? new Date() : prev.lastSaved
    }));
  };

  return { status, markAsSaved };
};
