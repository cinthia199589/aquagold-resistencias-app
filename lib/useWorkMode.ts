'use client';

import { useState, useEffect } from 'react';
import { TestType } from './types';

const WORK_MODE_KEY = 'aquagold_work_mode';

/**
 * Hook para gestionar el modo de trabajo global
 * Persiste en localStorage y proporciona funciones para cambiar modo
 */
export const useWorkMode = () => {
  const [workMode, setWorkModeState] = useState<TestType>('MATERIA_PRIMA');
  const [isChanging, setIsChanging] = useState(false);

  // Cargar modo desde localStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedMode = localStorage.getItem(WORK_MODE_KEY);
    
    // ⚠️ MIGRACIÓN COMPLETADA: Todos los datos existentes son MATERIA_PRIMA
    // Forzar modo MATERIA_PRIMA si está en PRODUCTO_TERMINADO (por ahora vacío)
    if (savedMode === 'PRODUCTO_TERMINADO') {
      console.log('⚠️ Cambiando de PRODUCTO_TERMINADO a MATERIA_PRIMA (datos migrados)');
      localStorage.setItem(WORK_MODE_KEY, 'MATERIA_PRIMA');
      setWorkModeState('MATERIA_PRIMA');
      console.log('🔄 Modo de trabajo ajustado: MATERIA_PRIMA');
      return;
    }
    
    if (savedMode === 'MATERIA_PRIMA') {
      setWorkModeState(savedMode);
      console.log(`🔄 Modo de trabajo cargado: ${savedMode}`);
    } else {
      // Por defecto: MATERIA_PRIMA
      localStorage.setItem(WORK_MODE_KEY, 'MATERIA_PRIMA');
      console.log('🔄 Modo de trabajo inicializado: MATERIA_PRIMA');
    }
  }, []);

  /**
   * Cambiar modo de trabajo con confirmación
   */
  const setWorkMode = (newMode: TestType) => {
    if (typeof window === 'undefined') return;
    
    setIsChanging(true);
    
    // Guardar en localStorage
    localStorage.setItem(WORK_MODE_KEY, newMode);
    setWorkModeState(newMode);
    
    console.log(`✅ Modo de trabajo cambiado a: ${newMode}`);
    
    // Log para auditoría
    const auditLog = {
      timestamp: new Date().toISOString(),
      previousMode: workMode,
      newMode: newMode,
      user: 'current_user' // Puedes obtener del contexto MSAL
    };
    console.log('📝 Cambio de modo:', auditLog);
    
    setTimeout(() => setIsChanging(false), 500);
  };

  /**
   * Toggle entre modos
   */
  const toggleWorkMode = () => {
    const newMode = workMode === 'MATERIA_PRIMA' ? 'PRODUCTO_TERMINADO' : 'MATERIA_PRIMA';
    setWorkMode(newMode);
  };

  return {
    workMode,
    setWorkMode,
    toggleWorkMode,
    isChanging,
    isMateriaPrima: workMode === 'MATERIA_PRIMA',
    isProductoTerminado: workMode === 'PRODUCTO_TERMINADO'
  };
};
