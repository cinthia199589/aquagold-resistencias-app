import React from 'react';
import { AutoSaveStatus } from '../lib/useAutoSave';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
}

/**
 * Componente visual que muestra el estado del auto-guardado
 * 
 * Estados:
 * - Cambios pendientes (amarillo)
 * - Guardando... (azul animado)
 * - Guardado exitoso (verde)
 * - Error (rojo)
 */
export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status }) => {
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('es-EC', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Si hay un error
  if (status.error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-600 text-lg">⚠️</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-red-700">Error al guardar</span>
          <span className="text-xs text-red-600">{status.error}</span>
        </div>
      </div>
    );
  }

  // Si está guardando
  if (status.isSaving) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
        <span className="text-blue-600 text-lg">💾</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-blue-700">Guardando...</span>
          <span className="text-xs text-blue-600">Por favor espere</span>
        </div>
      </div>
    );
  }

  // Si hay cambios pendientes
  if (status.hasChanges) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <span className="text-yellow-600 text-lg">⏳</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-yellow-700">Cambios pendientes</span>
          <span className="text-xs text-yellow-600">Guardando en 2 segundos...</span>
        </div>
      </div>
    );
  }

  // Si se guardó exitosamente
  if (status.lastSaved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <span className="text-green-600 text-lg">✅</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-green-700">Auto-guardado</span>
          <span className="text-xs text-green-600">{formatTime(status.lastSaved)}</span>
        </div>
      </div>
    );
  }

  // Estado inicial (sin cambios)
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
      <span className="text-gray-500 text-lg">💾</span>
      <span className="text-xs text-gray-500">Sin cambios</span>
    </div>
  );
};
