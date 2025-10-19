import { useEffect, useRef, useState } from 'react';

export interface AutoSaveStatus {
  hasChanges: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
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
}: UseAutoSaveOptions): AutoSaveStatus => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

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
  }, [status, onStatusChange]);

  useEffect(() => {
    // Si está deshabilitado o ya está guardando, no hacer nada
    if (!enabled || isSavingRef.current) {
      return;
    }

    // Convertir datos a string para comparar
    const currentData = JSON.stringify(data);

    // Si es la primera vez, solo guardar referencia
    if (!previousDataRef.current) {
      previousDataRef.current = currentData;
      return;
    }

    // Si NO hay cambios, no hacer nada
    if (currentData === previousDataRef.current) {
      setStatus(prev => ({ ...prev, hasChanges: false }));
      return;
    }

    // HAY CAMBIOS - marcar como pendiente
    setStatus(prev => ({ ...prev, hasChanges: true, error: null }));

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

        await onSave();

        // Actualizar referencia después de guardar exitosamente
        previousDataRef.current = currentData;
        
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
  }, [data, onSave, delay, enabled]);

  return status;
};
