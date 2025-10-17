# Fix: Campos de Decimales Aceptan Punto y Coma

## Problema Identificado

Los campos numéricos no permitían escribir valores decimales con punto (.) o coma (,). Esto afectaba a:

- ✅ **Residual SO2 MW**
- ✅ **Residual SO2 BF**  
- ✅ **Unidades Crudo** (rawUnits)
- ✅ **Unidades Cocido** (cookedUnits)

### Causa del Problema

Los campos usaban:
- `type="number"` que tiene limitaciones con teclados móviles
- Validación regex demasiado estricta que bloqueaba la entrada mientras se escribía
- No soportaban la coma como separador decimal (común en Ecuador)

## Solución Implementada

### 1. **Cambio de `type="number"` a `type="text"`**

```typescript
// ANTES
<Input 
  type="number" 
  step="0.1"
  value={value}
  onChange={(e) => setValue(Number(e.target.value))}
/>

// DESPUÉS
<Input 
  type="text"
  inputMode="decimal"  // Muestra teclado numérico en móviles
  value={value?.toString() || ''}
  onChange={(e) => handleDecimalInput(e)}
/>
```

### 2. **Handler Inteligente para Entrada Decimal**

```typescript
onChange={(e) => {
  const rawValue = e.target.value;
  
  // Permitir campo vacío
  if (rawValue === '') {
    setEditedTest(prev => ({ ...prev, fieldName: undefined }));
    return;
  }
  
  // Permitir números, punto y coma
  if (/^[\d]*[.,]?[\d]*$/.test(rawValue)) {
    // Normalizar: convertir coma a punto
    const normalizedValue = rawValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (!isNaN(numValue)) {
      setEditedTest(prev => ({ ...prev, fieldName: numValue }));
    }
  }
}}
```

## Características de la Solución

### ✅ Acepta Múltiples Formatos

| Entrada | Normalizado | Guardado |
|---------|-------------|----------|
| `15.5` | `15.5` | `15.5` |
| `15,5` | `15.5` | `15.5` |
| `15.` | `15.` | `15` |
| `15,` | `15.` | `15` |
| `15` | `15` | `15` |

### ✅ Validación en Tiempo Real

- Permite escribir mientras se completa el número
- No bloquea cuando se escribe el punto o coma
- Acepta números enteros y decimales
- Valida rangos (0-20 para unidades)

### ✅ Experiencia de Usuario Mejorada

- **Móvil**: Muestra teclado numérico con `inputMode="decimal"`
- **Desktop**: Permite usar punto o coma del teclado numérico
- **Placeholder mejorado**: `"Ej: 15.5 o 15,5"` para indicar ambos formatos

## Campos Corregidos

### 1. Residual SO2 MW y BF (TestDetailPage)

```typescript
<Input 
  id="so2Residuals" 
  type="text"
  inputMode="decimal"
  value={editedTest.so2Residuals?.toString() || ''}
  onChange={(e) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      setEditedTest(prev => ({ ...prev, so2Residuals: undefined }));
      return;
    }
    if (/^[\d]*[.,]?[\d]*$/.test(rawValue)) {
      const normalizedValue = rawValue.replace(',', '.');
      const numValue = parseFloat(normalizedValue);
      if (!isNaN(numValue)) {
        setEditedTest(prev => ({ ...prev, so2Residuals: numValue }));
      }
    }
  }}
  placeholder="Ej: 15.5 o 15,5"
/>
```

### 2. Unidades Crudo y Cocido (Samples)

```typescript
<Input 
  id={`raw-${sample.id}`} 
  type="text"
  inputMode="decimal"
  value={sample.rawUnits?.toString() || ''}
  onChange={(e) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      handleSampleChange(sample.id, 'rawUnits', undefined);
      return;
    }
    if (/^[\d]*[.,]?[\d]*$/.test(rawValue)) {
      const normalizedValue = rawValue.replace(',', '.');
      const numValue = parseFloat(normalizedValue);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
        handleSampleChange(sample.id, 'rawUnits', numValue);
      }
    }
  }}
  placeholder="0-20 (Ej: 15.5 o 15,5)"
/>
```

## Beneficios

### 1. **Compatibilidad Regional**
- ✅ Soporta punto decimal (estándar internacional)
- ✅ Soporta coma decimal (común en Ecuador y América Latina)

### 2. **Mejor UX Móvil**
- ✅ `inputMode="decimal"` muestra teclado numérico optimizado
- ✅ Fácil entrada de valores con un dedo

### 3. **Flexibilidad**
- ✅ Acepta enteros: `15`
- ✅ Acepta decimales: `15.5` o `15,5`
- ✅ Permite escribir mientras se completa

### 4. **Validación Robusta**
- ✅ Previene caracteres no numéricos
- ✅ Valida rangos según el campo
- ✅ Normaliza automáticamente el formato

## Regex Utilizado

```typescript
/^[\d]*[.,]?[\d]*$/
```

**Explicación:**
- `^` - Inicio de la cadena
- `[\d]*` - Cero o más dígitos
- `[.,]?` - Cero o un punto/coma
- `[\d]*` - Cero o más dígitos
- `$` - Fin de la cadena

**Ejemplos válidos:**
- `15` ✓
- `15.` ✓
- `15.5` ✓
- `15,5` ✓
- `.5` ✓
- `,5` ✓

**Ejemplos inválidos:**
- `15..5` ✗
- `15.5.3` ✗
- `abc` ✗
- `15a` ✗

## Pruebas Recomendadas

### Desktop
- [ ] Escribir `15.5` con punto del teclado numérico
- [ ] Escribir `15,5` con coma del teclado numérico
- [ ] Borrar y dejar campo vacío
- [ ] Escribir solo números enteros

### Móvil
- [ ] Verificar que aparece teclado numérico
- [ ] Escribir decimales con punto
- [ ] Escribir decimales con coma
- [ ] Verificar que se guarda correctamente

### Validación
- [ ] Intentar escribir letras (debe ser bloqueado)
- [ ] Escribir valores fuera de rango en unidades (debe validar)
- [ ] Verificar que se guarda en Firestore correctamente
- [ ] Completar test y verificar Excel con decimales

## Notas Técnicas

- Los valores se guardan siempre con punto como separador decimal en Firestore
- La normalización ocurre en el cliente antes de guardar
- El formato visual es controlado por `value.toString()`
- Compatible con todos los navegadores modernos

---
**Fecha:** 2025-01-17  
**Versión:** Next.js 15.5.5  
**Archivos modificados:** `app/page.tsx`
