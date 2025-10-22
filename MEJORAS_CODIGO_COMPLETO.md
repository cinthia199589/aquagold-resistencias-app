# 🎨 CÓDIGO COMPLETO DE MEJORAS - INGRESO DE DATOS

## 1️⃣ NUEVO COMPONENTE: `SampleDataEntry.tsx`

**Ubicación:** `components/SampleDataEntry.tsx`

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Sample } from '../lib/types';
import { Camera, Trash2 } from 'lucide-react';

interface SampleDataEntryProps {
  sample: Sample;
  startTime: string;
  timeSlot: number;
  isCompleted?: boolean;
  isUploading?: boolean;
  onRawUnitsChange: (value: number | undefined) => void;
  onCookedUnitsChange: (value: number | undefined) => void;
  onPhotoUpload: (file: File) => void;
  onPhotoDelete?: () => void;
  onSampleDelete?: () => void;
  uploadingPhotos?: Set<string>;
}

/**
 * Componente mejorado para entrada de datos de resistencias
 * Con validación en tiempo real, cambios de color y mejor UX
 */
export const SampleDataEntry: React.FC<SampleDataEntryProps> = ({
  sample,
  startTime,
  timeSlot,
  isCompleted = false,
  onRawUnitsChange,
  onCookedUnitsChange,
  onPhotoUpload,
  onPhotoDelete,
  onSampleDelete,
  uploadingPhotos = new Set()
}) => {
  const [rawError, setRawError] = useState('');
  const [cookedError, setCookedError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Formatear hora
  const formatTimeSlot = useCallback((baseTime: string, hours: number) => {
    try {
      const [baseHours, minutes] = baseTime.split(':').map(Number);
      const date = new Date();
      date.setHours(baseHours + hours, minutes, 0, 0);
      return date.toLocaleTimeString('es-EC', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch {
      return `+${hours}h`;
    }
  }, []);

  // Validar número en rango
  const validateNumber = (value: string, setError: (msg: string) => void) => {
    if (value === '') {
      setError('');
      return undefined;
    }

    const normalized = value.replace(',', '.');
    const num = parseFloat(normalized);

    if (isNaN(num)) {
      setError('❌ Solo números permitidos');
      return null;
    }

    if (num < 0 || num > 20) {
      setError('❌ Rango válido: 0-20');
      return null;
    }

    setError('');
    return num;
  };

  // Determinar clase de estado para input
  const getInputStateClass = (value: number | undefined, error: string) => {
    const baseClass = 'w-full h-14 md:h-11 text-center font-bold rounded-lg border-2 transition-all duration-300';
    
    if (error) {
      return `${baseClass} border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200`;
    }
    
    if (value === undefined) {
      return `${baseClass} border-gray-300 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400`;
    }
    
    return `${baseClass} border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200`;
  };

  // Determinar clase de badge
  const getBadgeClass = (value: number | undefined, error: string) => {
    if (error) {
      return 'bg-red-500 text-white';
    }
    if (value === undefined) {
      return 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
    }
    return 'bg-green-500 text-white';
  };

  // Determinar icono de badge
  const getBadgeIcon = (value: number | undefined, error: string) => {
    if (error) return '⚠️';
    if (value === undefined) return '⚪';
    return '✅';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {/* Header con hora y acciones */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white p-4 md:p-3 flex justify-between items-center">
        <div className="flex-1">
          <div className="text-xs font-medium opacity-90">MUESTRA</div>
          <div className="text-2xl md:text-xl font-bold">
            {formatTimeSlot(startTime, timeSlot)}
          </div>
        </div>
        <div className="text-right">
          {/* Badges de estado */}
          <div className="space-y-1">
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${getBadgeClass(sample.rawUnits, rawError)}`}>
              {getBadgeIcon(sample.rawUnits, rawError)} Crudo
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${getBadgeClass(sample.cookedUnits, cookedError)}`}>
              {getBadgeIcon(sample.cookedUnits, cookedError)} Cocido
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${sample.photoUrl ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
              {sample.photoUrl ? '✅' : '⚪'} Foto
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 md:p-3 space-y-4 md:space-y-3">
        {/* Fila de inputs Crudo y Cocido */}
        <div className="grid grid-cols-2 gap-3">
          {/* Input Crudo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
              Unidades Crudo
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={sample.rawUnits !== undefined && sample.rawUnits !== null ? sample.rawUnits.toString() : ''}
              onChange={(e) => {
                const num = validateNumber(e.target.value, setRawError);
                onRawUnitsChange(num === null ? undefined : num);
              }}
              placeholder="0-20"
              disabled={isCompleted}
              className={getInputStateClass(sample.rawUnits, rawError)}
            />
            {rawError && <p className="text-xs text-red-600 font-medium">{rawError}</p>}
          </div>

          {/* Input Cocido */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
              Unidades Cocido
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={sample.cookedUnits !== undefined && sample.cookedUnits !== null ? sample.cookedUnits.toString() : ''}
              onChange={(e) => {
                const num = validateNumber(e.target.value, setCookedError);
                onCookedUnitsChange(num === null ? undefined : num);
              }}
              placeholder="0-20"
              disabled={isCompleted}
              className={getInputStateClass(sample.cookedUnits, cookedError)}
            />
            {cookedError && <p className="text-xs text-red-600 font-medium">{cookedError}</p>}
          </div>
        </div>

        {/* Sección de Foto */}
        <div className="space-y-2 border-t pt-3">
          <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
            Fotografía
          </label>

          {sample.photoUrl && (
            <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img
                src={sample.photoUrl}
                alt={`Muestra ${timeSlot}h`}
                className="w-full h-32 object-cover"
                onClick={() => setShowPreview(true)}
              />
              <button
                type="button"
                onClick={onPhotoDelete}
                className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded"
                disabled={isCompleted}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {/* Inputs de archivo (ocultos) */}
          <input
            type="file"
            id={`camera-${sample.id}`}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPhotoUpload(file);
            }}
            disabled={isCompleted}
          />
          <input
            type="file"
            id={`gallery-${sample.id}`}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPhotoUpload(file);
            }}
            disabled={isCompleted}
          />

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => document.getElementById(`camera-${sample.id}`)?.click()}
              disabled={isCompleted || uploadingPhotos.has(sample.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 md:py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              {uploadingPhotos.has(sample.id) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm">Subiendo...</span>
                </>
              ) : (
                <>
                  <Camera size={18} />
                  <span className="text-sm">Cámara</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => document.getElementById(`gallery-${sample.id}`)?.click()}
              disabled={isCompleted || uploadingPhotos.has(sample.id)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-3 md:py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <span className="text-sm">Galería</span>
            </button>
          </div>
        </div>

        {/* Progreso de muestra */}
        <div className="mt-3 pt-3 border-t space-y-2">
          {(() => {
            let completed = 0;
            if (sample.rawUnits !== undefined && sample.rawUnits !== null) completed++;
            if (sample.cookedUnits !== undefined && sample.cookedUnits !== null) completed++;
            if (sample.photoUrl && sample.photoUrl.trim() !== '') completed++;
            
            const progress = (completed / 3) * 100;
            
            return (
              <>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Progreso</span>
                  <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            );
          })()}
        </div>

        {/* Botón de eliminar muestra */}
        {onSampleDelete && (
          <button
            type="button"
            onClick={onSampleDelete}
            className="w-full text-xs text-red-600 hover:text-red-700 font-medium py-2 border border-red-200 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Eliminar muestra
          </button>
        )}
      </div>
    </div>
  );
};

export default SampleDataEntry;
```

---

## 2️⃣ COMPONENTE CARRUSEL: `SampleCarousel.tsx`

**Ubicación:** `components/SampleCarousel.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import { ResistanceTest, Sample } from '../lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SampleDataEntry from './SampleDataEntry';

interface SampleCarouselProps {
  test: ResistanceTest;
  uploadingPhotos: Set<string>;
  isCompleted?: boolean;
  onSampleChange: (sampleId: string, field: 'rawUnits' | 'cookedUnits', value: number | undefined) => void;
  onPhotoUpload: (sampleId: string, file: File) => void;
  onPhotoDelete: (sampleId: string) => void;
  onSampleDelete: (sampleId: string) => void;
}

/**
 * Carrusel optimizado para móvil
 * Muestra una muestra por pantalla con navegación fácil
 */
export const SampleCarousel: React.FC<SampleCarouselProps> = ({
  test,
  uploadingPhotos,
  isCompleted = false,
  onSampleChange,
  onPhotoUpload,
  onPhotoDelete,
  onSampleDelete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const samples = test.samples || [];

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? samples.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === samples.length - 1 ? 0 : prev + 1));
  };

  if (samples.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay muestras cargadas
      </div>
    );
  }

  const currentSample = samples[currentIndex];

  return (
    <div className="space-y-4">
      {/* Carrusel principal */}
      <div className="relative">
        {/* Muestras */}
        <div className="px-0 md:px-4">
          <SampleDataEntry
            sample={currentSample}
            startTime={test.startTime}
            timeSlot={currentSample.timeSlot}
            isCompleted={isCompleted}
            uploadingPhotos={uploadingPhotos}
            onRawUnitsChange={(value) => onSampleChange(currentSample.id, 'rawUnits', value)}
            onCookedUnitsChange={(value) => onSampleChange(currentSample.id, 'cookedUnits', value)}
            onPhotoUpload={(file) => onPhotoUpload(currentSample.id, file)}
            onPhotoDelete={() => onPhotoDelete(currentSample.id)}
            onSampleDelete={() => onSampleDelete(currentSample.id)}
          />
        </div>

        {/* Botones de navegación - Solo en móvil */}
        {samples.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/3 -translate-y-1/2 md:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/3 -translate-y-1/2 md:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Indicador de página */}
      {samples.length > 1 && (
        <div className="flex justify-center gap-2">
          {samples.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-blue-600'
                  : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              title={`Ir a muestra ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Información de página */}
      {samples.length > 1 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Muestra {currentIndex + 1} de {samples.length}
        </div>
      )}
    </div>
  );
};

export default SampleCarousel;
```

---

## 3️⃣ HOOK DE VALIDACIÓN: `useDataValidation.ts`

**Ubicación:** `lib/useDataValidation.ts`

```typescript
import { useState, useCallback } from 'react';

interface ValidationState {
  isValid: boolean;
  error: string;
  value: number | undefined;
}

/**
 * Hook para validación de números con rango
 */
export const useNumberValidation = (min = 0, max = 20) => {
  const [state, setState] = useState<ValidationState>({
    isValid: true,
    error: '',
    value: undefined
  });

  const validate = useCallback((input: string): number | undefined => {
    // Vacío
    if (input === '') {
      setState({ isValid: true, error: '', value: undefined });
      return undefined;
    }

    // Normalizar entrada
    const normalized = input.replace(',', '.');

    // No es número
    if (!/^-?\d*\.?\d+$/.test(normalized)) {
      setState({
        isValid: false,
        error: '❌ Solo números permitidos',
        value: undefined
      });
      return undefined;
    }

    const num = parseFloat(normalized);

    // Fuera de rango
    if (num < min || num > max) {
      setState({
        isValid: false,
        error: `❌ Rango válido: ${min}-${max}`,
        value: undefined
      });
      return undefined;
    }

    // Válido
    setState({ isValid: true, error: '', value: num });
    return num;
  }, [min, max]);

  const reset = useCallback(() => {
    setState({ isValid: true, error: '', value: undefined });
  }, []);

  return { ...state, validate, reset };
};

/**
 * Hook para validación de archivos de imagen
 */
export const useImageValidation = () => {
  const [state, setState] = useState<ValidationState>({
    isValid: true,
    error: '',
    value: undefined
  });

  const validateFile = useCallback((file: File): boolean => {
    const maxSizeMB = 5;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      setState({
        isValid: false,
        error: '❌ Solo JPG, PNG o WebP permitidos',
        value: undefined
      });
      return false;
    }

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setState({
        isValid: false,
        error: `❌ Máximo ${maxSizeMB}MB`,
        value: undefined
      });
      return false;
    }

    setState({ isValid: true, error: '', value: undefined });
    return true;
  }, []);

  return { ...state, validateFile };
};
```

---

## 4️⃣ ESTILOS GLOBALES: Agregar a `app/globals.css`

```css
/* ========================================
   VALIDACIÓN DE INPUTS - ESTADOS
   ======================================== */

/* Estado: Campo vacío */
.input-field:not(:focus):invalid {
  border-color: #e5e7eb;
  background-color: #ffffff;
  color: #9ca3af;
}

/* Estado: Campo con error */
.input-field.error {
  border-color: #ef4444;
  background-color: #fef2f2;
  color: #7f1d1d;
  animation: shake 0.3s ease-in-out;
}

.dark .input-field.error {
  background-color: rgba(127, 29, 29, 0.2);
  color: #fca5a5;
}

/* Estado: Campo llenado correctamente */
.input-field.success {
  border-color: #22c55e;
  background-color: #f0fdf4;
  color: #15803d;
  font-weight: 600;
}

.dark .input-field.success {
  background-color: rgba(34, 197, 94, 0.1);
  color: #86efac;
}

/* Estado: Campo siendo llenado */
.input-field.pending {
  border-color: #eab308;
  background-color: #fefce8;
  color: #713f12;
}

.dark .input-field.pending {
  background-color: rgba(234, 179, 8, 0.1);
  color: #facc15;
}

/* Animación de error */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

/* Transiciones suaves */
.input-field {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-field:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ========================================
   BADGES DE ESTADO
   ======================================== */

.state-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.state-badge.empty {
  background-color: #e5e7eb;
  color: #374151;
}

.state-badge.valid {
  background-color: #10b981;
  color: #ffffff;
}

.state-badge.error {
  background-color: #ef4444;
  color: #ffffff;
}

/* ========================================
   BARRAS DE PROGRESO
   ======================================== */

.progress-bar {
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar.dark {
  background-color: #374151;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #10b981 100%);
  border-radius: 9999px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ========================================
   RESPONSIVE - MÓVIL
   ======================================== */

@media (max-width: 640px) {
  /* Inputs más grandes en móvil */
  .input-field-mobile {
    font-size: 1rem;
    padding: 0.875rem;
    height: 3.5rem;
  }

  /* Botones más grandes */
  .button-mobile {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    min-height: 2.75rem;
  }

  /* Grid compacto */
  .sample-grid-mobile {
    gap: 0.75rem;
  }

  /* Card compacta */
  .sample-card-mobile {
    padding: 1rem;
  }
}

/* ========================================
   ANIMACIONES
   ======================================== */

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes pulse-success {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
}

.pulse-success {
  animation: pulse-success 2s infinite;
}
```

---

## 5️⃣ INTEGRACIÓN EN `page.tsx`

**Cambios a hacer en `app/page.tsx` línea 1300+:**

```tsx
// IMPORTAR NUEVOS COMPONENTES
import SampleDataEntry from '../components/SampleDataEntry';
import SampleCarousel from '../components/SampleCarousel';

// EN TestDetailPage COMPONENT - Reemplazar sección de muestras (línea 1300):

// ANTES:
const TestDetailPage = ({ test, setRoute, onTestUpdated, saveTestFn }: {...}) => {
  // ...
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full">
      {(editedTest.samples || []).map(sample => (
        <Card key={sample.id} className="w-full">
          {/* ... tarjetas antiguas ... */}
        </Card>
      ))}
    </div>
  );
};

// DESPUÉS - Usar componente mejorado:
const TestDetailPage = ({ test, setRoute, onTestUpdated, saveTestFn }: {...}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('carousel'); // En móvil: carousel

  useEffect(() => {
    // Detectar si es móvil
    const isMobile = window.innerWidth < 768;
    setViewMode(isMobile ? 'carousel' : 'grid');
  }, []);

  return (
    <>
      {/* Vista Carrusel para Móvil */}
      <div className="md:hidden mb-6">
        <SampleCarousel
          test={editedTest}
          uploadingPhotos={uploadingPhotos}
          isCompleted={editedTest.isCompleted}
          onSampleChange={handleSampleChange}
          onPhotoUpload={handlePhotoUpload}
          onPhotoDelete={(sampleId) => {
            const updated = {
              ...editedTest,
              samples: editedTest.samples.map(s =>
                s.id === sampleId ? { ...s, photoUrl: '' } : s
              )
            };
            setEditedTest(updated);
          }}
          onSampleDelete={handleDeleteSample}
        />
      </div>

      {/* Vista Grid para Desktop */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full">
        {(editedTest.samples || []).map(sample => (
          <SampleDataEntry
            key={sample.id}
            sample={sample}
            startTime={test.startTime}
            timeSlot={sample.timeSlot}
            isCompleted={editedTest.isCompleted}
            uploadingPhotos={uploadingPhotos}
            onRawUnitsChange={(value) => handleSampleChange(sample.id, 'rawUnits', value)}
            onCookedUnitsChange={(value) => handleSampleChange(sample.id, 'cookedUnits', value)}
            onPhotoUpload={(file) => handlePhotoUpload(sample.id, file)}
            onPhotoDelete={() => {
              const updated = {
                ...editedTest,
                samples: editedTest.samples.map(s =>
                  s.id === sample.id ? { ...s, photoUrl: '' } : s
                )
              };
              setEditedTest(updated);
            }}
            onSampleDelete={() => handleDeleteSample(sample.id)}
          />
        ))}
      </div>
    </>
  );
};
```

---

## 📊 CAMBIOS DE ESTILO EN GLOBALS.CSS

```css
/* Agregar después de línea 100 en globals.css */

/* ========================================
   MEJORAS DE COLOR POR ESTADO
   ======================================== */

/* Input vacío - gris neutro */
input:not([value]), 
input[value=""] {
  border-color: #d1d5db;
  background-color: #ffffff;
  color: #9ca3af;
}

/* Input lleno - verde */
input[data-filled="true"],
input[data-valid="true"] {
  border-color: #22c55e;
  background-color: #f0fdf4;
  color: #15803d;
  font-weight: 600;
  box-shadow: inset 0 2px 4px rgba(34, 197, 94, 0.1);
}

/* Input con error - rojo */
input[data-error="true"] {
  border-color: #ef4444;
  background-color: #fef2f2;
  color: #991b1b;
  animation: shake 0.3s ease-in-out;
}

/* Input enfocado - azul destacado */
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transform: scale(1.02);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

/* Validación en tiempo real */
@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
}

input[data-valid="true"] {
  animation: pulse-green 2s infinite;
}
```

---

## 🎯 RESUMEN DE CAMBIOS

| Archivo | Cambio |
|---------|--------|
| `components/SampleDataEntry.tsx` | ✅ NUEVO - Componente mejorado |
| `components/SampleCarousel.tsx` | ✅ NUEVO - Carrusel móvil |
| `lib/useDataValidation.ts` | ✅ NUEVO - Hook de validación |
| `app/globals.css` | 📝 AGREGAR estilos de validación |
| `app/page.tsx` | 📝 IMPORTAR y USAR componentes |

---

**Prioridad:** 🔴 ALTA  
**Dificultad:** 🟡 MEDIA  
**Tiempo estimado:** 4-6 horas  
**Impacto UX:** ⭐⭐⭐⭐⭐
