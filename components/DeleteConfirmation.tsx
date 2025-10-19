import React, { useState } from 'react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  itemName?: string;
}

/**
 * Modal de confirmación para eliminar datos
 * Aparece cuando el usuario intenta borrar algo importante
 */
export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "¿Eliminar dato?",
  message = "Esta acción no se puede deshacer.",
  itemName = "este dato"
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <h3 className="text-lg font-bold text-red-800">{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-2">{message}</p>
          <p className="text-sm text-gray-600">
            Estás a punto de eliminar: <strong className="text-red-600">{itemName}</strong>
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Sí, eliminar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Agregar animación de escala
const styles = `
  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .animate-scale-in {
    animation: scaleIn 0.2s ease-out;
  }
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined') {
  const styleId = 'delete-confirmation-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}
