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
            {/* Mensaje de cambio - Texto grande y directo */}
            <div className="text-center mb-8">
              <p className="text-gray-300 text-sm mb-3">Se cambiará a:</p>
              <h3 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
                {TEST_TYPE_LABELS[nextMode]}
              </h3>
            </div>

            {/* Información rápida */}
            <div className="text-gray-300 text-center text-sm mb-8 space-y-2">
              <p>✓ El modo se guardará cuando cierres la app</p>
              <p>✓ Todos tus datos se mantienen</p>
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
