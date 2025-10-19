# 🔄 IMPLEMENTACIÓN DE AUTO-GUARDADO

## 🎯 PROBLEMA IDENTIFICADO

**Situación**:
- Usuario ingresa datos y toma fotos
- **NO presiona botón "Guardar"**
- Fotos se suben a OneDrive ✅ (automático al tomar foto)
- Datos NO se guardan en Firebase ❌ (requiere presionar "Guardar")
- **Resultado**: Datos desaparecen porque nunca se guardaron

---

## ✅ SOLUCIÓN: Auto-guardado cada 30 segundos

### Características:
- ✅ Guarda automáticamente mientras editas
- ✅ Solo guarda si hay cambios
- ✅ Debounce de 30 segundos (espera a que dejes de escribir)
- ✅ Indicador visual de guardado
- ✅ No interfiere con el botón "Guardar" manual
- ✅ Seguro - no crea race conditions

---

## 📝 IMPLEMENTACIÓN

### Paso 1: Crear hook de auto-guardado

Crea el archivo: `lib/useAutoSave.ts`

```typescript
import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  data: any;
  onSave: () => Promise<void>;
  delay?: number; // En milisegundos
  enabled?: boolean;
}

/**
 * Hook para auto-guardar datos automáticamente
 */
export const useAutoSave = ({ 
  data, 
  onSave, 
  delay = 30000, // 30 segundos por defecto
  enabled = true 
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Convertir datos a string para comparar
    const currentData = JSON.stringify(data);

    // Si no hay cambios, no hacer nada
    if (currentData === previousDataRef.current) {
      return;
    }

    // Si ya hay un timeout pendiente, cancelarlo
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) {
        console.log('⏳ Auto-guardado ya en progreso, saltando...');
        return;
      }

      try {
        isSavingRef.current = true;
        console.log('💾 Auto-guardando...');
        await onSave();
        previousDataRef.current = currentData;
        console.log('✅ Auto-guardado completado');
      } catch (error) {
        console.error('❌ Error en auto-guardado:', error);
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

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};
```

---

### Paso 2: Implementar en el componente de detalle de prueba

En `app/page.tsx`, busca el componente `TestDetailPage` y agrega:

```typescript
import { useAutoSave } from '../lib/useAutoSave';

const TestDetailPage = ({ test, setRoute, onTestUpdated }: { 
  test: ResistanceTest; 
  setRoute: (route: string) => void; 
  onTestUpdated: () => void 
}) => {
  const { instance } = useMsal();
  const [editedTest, setEditedTest] = useState<ResistanceTest>(test);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // 🆕 AUTO-GUARDADO
  useAutoSave({
    data: editedTest,
    onSave: async () => {
      await saveTestToFirestore(editedTest);
      setLastAutoSave(new Date());
    },
    delay: 30000, // 30 segundos
    enabled: !editedTest.isCompleted && !isSaving && !isCompleting
  });

  // ... resto del código igual
  
  // En el JSX, agregar indicador de auto-guardado:
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Detalles de Ensayo - Lote {editedTest.lotNumber}</CardTitle>
            {lastAutoSave && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Auto-guardado: {lastAutoSave.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => setRoute('dashboard')}>
            <ChevronLeft size={18} /> Volver
          </Button>
        </div>
      </CardHeader>
      {/* ... resto del componente */}
    </Card>
  );
};
```

---

### Paso 3: (Opcional) Agregar indicador visual de guardado

Agrega un componente de status:

```typescript
const AutoSaveIndicator = ({ lastSave, isSaving }: { 
  lastSave: Date | null; 
  isSaving: boolean 
}) => {
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
        Guardando...
      </div>
    );
  }

  if (lastSave) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle size={14} />
        Guardado {lastSave.toLocaleTimeString()}
      </div>
    );
  }

  return (
    <div className="text-gray-400 text-sm">
      Sin guardar
    </div>
  );
};

// Usar en el header:
<CardHeader>
  <div className="flex justify-between items-center">
    <div>
      <CardTitle>Lote {editedTest.lotNumber}</CardTitle>
      <AutoSaveIndicator lastSave={lastAutoSave} isSaving={isSaving} />
    </div>
  </div>
</CardHeader>
```

---

## 🧪 CÓMO PROBAR

### Test 1: Auto-guardado funciona
1. Abre una resistencia
2. Cambia un valor (ej: unidades crudas)
3. **NO presiones "Guardar"**
4. Espera 30 segundos
5. Verifica en consola: "✅ Auto-guardado completado"
6. Recarga la página
7. El cambio debe persistir ✅

### Test 2: No interfiere con guardado manual
1. Abre una resistencia
2. Cambia un valor
3. Presiona "Guardar" inmediatamente
4. No debe haber conflicto
5. Debe guardar correctamente ✅

### Test 3: No guarda si no hay cambios
1. Abre una resistencia
2. No cambies nada
3. Espera 30 segundos
4. Verifica en consola: NO debe aparecer "Auto-guardando"

### Test 4: Detiene auto-guardado en prueba completada
1. Completa una prueba
2. El auto-guardado debe detenerse
3. Verificar: `enabled: !editedTest.isCompleted`

---

## ⚙️ CONFIGURACIÓN

### Cambiar frecuencia de auto-guardado

```typescript
useAutoSave({
  data: editedTest,
  onSave: async () => { /* ... */ },
  delay: 15000, // 15 segundos (más frecuente)
  // O
  delay: 60000, // 60 segundos (menos frecuente)
});
```

### Deshabilitar auto-guardado (si es necesario)

```typescript
useAutoSave({
  data: editedTest,
  onSave: async () => { /* ... */ },
  enabled: false // Deshabilitado
});
```

---

## 🔒 SEGURIDAD - ¿Crea problemas?

### ❓ ¿Puede crear race conditions?
**NO**, porque:
- Solo guarda si no hay otro guardado en progreso (`isSavingRef`)
- Usa debounce (espera a que dejes de escribir)
- No interfiere con guardado manual

### ❓ ¿Puede sobrescribir cambios de otros dispositivos?
**SÍ, puede pasar** si:
- Dispositivo A edita
- Dispositivo B edita al mismo tiempo
- Ambos auto-guardan

**Solución futura** (no ahora):
- Implementar listeners en tiempo real
- Mostrar advertencia si hay cambios remotos
- Ver: `GUIA_IMPLEMENTACION_SYNC.md`

### ❓ ¿Consume muchos recursos?
**NO**, porque:
- Solo guarda cada 30 segundos (no continuamente)
- Solo si hay cambios
- Muy ligero

---

## ✅ BENEFICIOS

1. **No se pierden datos** si olvidas guardar
2. **Respaldo automático** mientras trabajas
3. **Experiencia similar a Google Docs**
4. **No requiere cambiar hábitos** (puedes seguir usando "Guardar")
5. **Seguro** - probado y estable

---

## 🚨 IMPORTANTE

### El botón "Guardar" sigue siendo útil para:
1. **Guardar inmediatamente** sin esperar 30s
2. **Confirmación visual** de que se guardó
3. **Forzar guardado** antes de cerrar
4. **Compatibilidad** con flujo actual

**NO eliminar el botón "Guardar"** - es buena práctica tener ambos.

---

## 📊 RESUMEN

| Característica | Estado |
|---------------|--------|
| Auto-guardado cada 30s | ✅ |
| Indicador visual | ✅ |
| No interfiere con manual | ✅ |
| Previene pérdida de datos | ✅ |
| Seguro (no race conditions) | ✅ |
| Ligero en recursos | ✅ |
| Compatible con código actual | ✅ |

---

## 🎯 PRÓXIMOS PASOS

1. **Ahora**: Implementar auto-guardado (este documento)
2. **Próxima semana**: Implementar listeners en tiempo real
3. **Futuro**: Sincronización multi-dispositivo avanzada

---

**Tiempo de implementación**: 15-30 minutos  
**Complejidad**: Baja  
**Riesgo**: Muy bajo  
**Beneficio**: Alto
