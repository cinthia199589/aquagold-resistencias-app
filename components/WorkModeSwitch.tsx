'use client';

import { useState } from 'react';
import { TestType, TEST_TYPE_CONFIG, TEST_TYPE_LABELS } from '@/lib/types';

interface WorkModeSwitchProps {
  currentMode: TestType;
  onModeChange: (mode: TestType) => void;
  isChanging?: boolean;
}

export default function WorkModeSwitch({ currentMode, onModeChange, isChanging = false }: WorkModeSwitchProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleToggleClick = () => {
    setShowConfirmation(true);
  };

  const confirmChange = () => {
    const newMode: TestType = currentMode === 'MATERIA_PRIMA' ? 'PRODUCTO_TERMINADO' : 'MATERIA_PRIMA';
    onModeChange(newMode);
    setShowConfirmation(false);
  };

  const cancelChange = () => {
    setShowConfirmation(false);
  };

  const nextMode: TestType = currentMode === 'MATERIA_PRIMA' ? 'PRODUCTO_TERMINADO' : 'MATERIA_PRIMA';
  const currentConfig = TEST_TYPE_CONFIG[currentMode];
  const nextConfig = TEST_TYPE_CONFIG[nextMode];

  return (
    <>
      {/* Botón compacto y profesional - Optimizado para móvil */}
      <button
        onClick={handleToggleClick}
        disabled={isChanging}
        className={`
          ${currentConfig.badgeClass}
          rounded-lg px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-semibold transition-all
          hover:opacity-90 hover:shadow-md
          ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          inline-flex items-center gap-1 sm:gap-2 whitespace-nowrap
          shadow-sm
        `}
        title={`Cambiar a ${TEST_TYPE_LABELS[nextMode]}`}
      >
        <span className="font-bold uppercase tracking-tight sm:tracking-wide">{TEST_TYPE_LABELS[currentMode]}</span>
        <span className="text-[10px] sm:text-sm opacity-70">🔄</span>
      </button>

      {/* Modal de Confirmación - Mejorado */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-8 border border-gray-700">
            {/* Icono de advertencia */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-pulse">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-1">
                ¿Cambiar modo?
              </h3>
            </div>

            {/* Transición visual */}
            <div className="flex items-center justify-center gap-2 mb-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className={`${currentConfig.badgeClass} px-3 py-2 rounded font-bold text-sm whitespace-nowrap`}>
                {TEST_TYPE_LABELS[currentMode]}
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className={`${nextConfig.badgeClass} px-3 py-2 rounded font-bold text-sm whitespace-nowrap`}>
                {TEST_TYPE_LABELS[nextMode]}
              </div>
            </div>

            {/* Información clara y concisa */}
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mb-8">
              <div className="space-y-2 text-sm text-amber-100">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Solo verás <strong>{TEST_TYPE_LABELS[nextMode]}</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Los datos actuales se guardan</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Puedes cambiar cuando quieras</span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={cancelChange}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg font-semibold transition-colors border border-gray-600"
              >
                CANCELAR
              </button>
              <button
                onClick={confirmChange}
                className={`
                  flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-all transform hover:scale-105
                  ${nextMode === 'MATERIA_PRIMA'
                    ? 'bg-blue-600 hover:bg-blue-700 border border-blue-500'
                    : 'bg-green-600 hover:bg-green-700 border border-green-500'
                  }
                `}
              >
                CAMBIAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
