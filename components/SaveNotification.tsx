import React, { useEffect, useState } from 'react';
import { AutoSaveStatus } from '../lib/useAutoSave';

interface SaveNotificationProps {
  status: AutoSaveStatus;
  duration?: number; // Duración de la notificación en ms
}

/**
 * Notificación flotante que aparece cada vez que se guarda
 * Se muestra por 3 segundos y desaparece automáticamente
 */
export const SaveNotification: React.FC<SaveNotificationProps> = ({ 
  status, 
  duration = 3000 
}) => {
  const [show, setShow] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Detectar cuando hay un nuevo guardado exitoso
  useEffect(() => {
    if (status.lastSaved && status.lastSaved !== lastSavedTime) {
      setShow(true);
      setLastSavedTime(status.lastSaved);

      // Ocultar después de la duración especificada
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [status.lastSaved, lastSavedTime, duration]);

  if (!show) return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-EC', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div 
      className="fixed top-20 right-4 z-50 animate-slide-in-right"
      style={{
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-sm">Guardado exitoso</p>
          <p className="text-xs opacity-90">{formatTime(status.lastSaved!)}</p>
        </div>
      </div>
    </div>
  );
};

// Agregar estilos de animación (puedes ponerlo en globals.css también)
const styles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
`;

// Inyectar estilos si no existen
if (typeof document !== 'undefined') {
  const styleId = 'save-notification-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}
