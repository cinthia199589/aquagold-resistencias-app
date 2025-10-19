/**
 * BANNER DE ESTADO DE MIGRACIÓN
 * =============================
 * 
 * Muestra el progreso de la migración de Firebase legacy → Sistema híbrido
 * - Barra de progreso visual
 * - Estadísticas en tiempo real
 * - Botón para pausar migración
 * - Auto-oculta cuando completa
 */

'use client';

import { useState, useEffect } from 'react';
import { migrationService, MigrationStatus } from '@/lib/migrationService';
import { MIGRATION_CONFIG } from '@/lib/migrationConfig';

export const MigrationStatusBanner = () => {
  const [status, setStatus] = useState<MigrationStatus>(
    migrationService.getStatus()
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Actualizar estado según configuración
    const updateInterval = MIGRATION_CONFIG.BANNER_UPDATE_INTERVAL_MS;
    
    const interval = setInterval(() => {
      const currentStatus = migrationService.getStatus();
      setStatus(currentStatus);

      // Mostrar banner si hay migración en progreso o pendiente
      const shouldShow = 
        currentStatus.isRunning || 
        (currentStatus.pendingTests > 0 && currentStatus.totalTests > 0);
      
      setIsVisible(shouldShow && MIGRATION_CONFIG.SHOW_MIGRATION_BANNER);
    }, updateInterval);

    return () => clearInterval(interval);
  }, []);

  // Auto-ocultar después de 10 segundos si completó
  useEffect(() => {
    if (status.progress === 100 && !status.isRunning) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // 10 segundos
      return () => clearTimeout(timer);
    }
  }, [status.progress, status.isRunning]);

  if (!isVisible) return null;

  const handleAbort = () => {
    if (confirm('¿Estás segura que deseas pausar la migración? Se puede reanudar más tarde.')) {
      migrationService.abortCurrentMigration();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Determinar color según estado
  const getStatusColor = () => {
    if (status.errors.length > 0) return 'bg-yellow-500';
    if (status.progress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    if (status.progress === 100) return '✅';
    if (status.errors.length > 0) return '⚠️';
    return '🔄';
  };

  const getStatusText = () => {
    if (status.progress === 100) {
      return 'Migración completada';
    }
    if (status.isRunning) {
      return 'Migrando al sistema optimizado...';
    }
    return 'Migración pausada';
  };

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 ${getStatusColor()} text-white shadow-lg transition-all duration-300`}
    >
      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Icono y texto */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {status.isRunning && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white flex-shrink-0"></div>
            )}
            {!status.isRunning && (
              <span className="text-xl flex-shrink-0">{getStatusIcon()}</span>
            )}
            
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm sm:text-base truncate">
                {getStatusText()}
              </div>
              <div className="text-xs sm:text-sm text-white/90">
                {status.migratedTests} / {status.totalTests} resistencias
                {status.errors.length > 0 && (
                  <span className="ml-2">
                    • {status.errors.length} errores
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            <div className="w-48 bg-white/30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${status.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium w-12 text-right">
              {status.progress}%
            </span>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botón expandir/contraer */}
            <button
              onClick={handleToggleExpand}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Botón pausar (solo si está corriendo) */}
            {status.isRunning && (
              <button
                onClick={handleAbort}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
                title="Pausar migración"
              >
                ⏸️ Pausar
              </button>
            )}

            {/* Botón cerrar (solo si completó) */}
            {status.progress === 100 && (
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso móvil */}
        <div className="sm:hidden mt-2 flex items-center gap-3">
          <div className="flex-1 bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <span className="text-sm font-medium w-12 text-right">
            {status.progress}%
          </span>
        </div>

        {/* Detalles expandibles */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/20 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-white/70 text-xs">Migrados</div>
                <div className="font-medium">{status.migratedTests}</div>
              </div>
              <div>
                <div className="text-white/70 text-xs">Pendientes</div>
                <div className="font-medium">{status.pendingTests}</div>
              </div>
              <div>
                <div className="text-white/70 text-xs">Errores</div>
                <div className="font-medium">{status.errors.length}</div>
              </div>
              <div>
                <div className="text-white/70 text-xs">Estado</div>
                <div className="font-medium">
                  {status.isRunning ? 'En progreso' : 'Pausado'}
                </div>
              </div>
            </div>

            {/* Mostrar errores si los hay */}
            {status.errors.length > 0 && isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="text-xs text-white/90 mb-2">
                  ⚠️ Últimos errores (datos legacy están seguros):
                </div>
                <div className="max-h-20 overflow-y-auto text-xs space-y-1">
                  {status.errors.slice(-3).map((err, index) => (
                    <div
                      key={index}
                      className="bg-white/10 rounded px-2 py-1"
                    >
                      <span className="font-mono">{err.testId}</span>: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje de tranquilidad */}
            <div className="mt-3 text-xs text-white/80 bg-white/10 rounded px-3 py-2">
              💡 <strong>Nota:</strong> La migración no afecta el funcionamiento de
              la app. Tus datos legacy están seguros y seguirán visibles durante
              todo el proceso.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
