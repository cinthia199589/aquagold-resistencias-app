# Fix: Error "No hay una cuenta activa" al subir fotos

## Problema Identificado

El error `❌ Error al subir foto: No hay una cuenta activa.` ocurría cuando:

1. La sesión de autenticación MSAL expiraba o se perdía
2. No había una cuenta activa en la instancia MSAL al momento de subir una foto
3. El token de acceso no se podía renovar silenciosamente

## Cambios Realizados

### 1. Mejoras en `lib/graphService.ts`

**Función `getGraphClient`:**
- ✅ Agregada validación de la instancia MSAL antes de usarla
- ✅ Implementado login interactivo automático (popup) cuando no hay cuenta activa
- ✅ Agregado fallback a token popup cuando falla el token silencioso
- ✅ Manejo robusto de errores de autenticación

```typescript
// Ahora intenta:
// 1. Obtener cuenta activa
// 2. Si no hay cuenta → Login popup automático
// 3. Si hay cuenta → Token silencioso
// 4. Si falla token silencioso → Token popup
```

### 2. Validaciones en `app/page.tsx`

**Función `handlePhotoUpload`:**
- ✅ Validación de instancia MSAL antes de intentar subir
- ✅ Verificación de cuenta activa antes de proceder
- ✅ Mensajes de error más específicos y útiles para el usuario

**Función `handleComplete`:**
- ✅ Validación de instancia MSAL antes de completar test
- ✅ Verificación de cuenta activa antes de generar Excel

**Función `handleSubmit` (NewTestPage):**
- ✅ Validación de instancia MSAL antes de crear test
- ✅ Verificación de cuenta activa antes de crear carpeta OneDrive

## Flujo de Recuperación de Autenticación

```
Usuario intenta subir foto
↓
¿Instancia MSAL disponible?
├─ NO → Error: "Recarga la página"
└─ SÍ → ¿Cuenta activa?
    ├─ NO → Login Popup automático
    │   └─ ¿Login exitoso?
    │       ├─ SÍ → Continuar con upload
    │       └─ NO → Error: "Inicia sesión nuevamente"
    └─ SÍ → ¿Token válido?
        ├─ SÍ → Subir foto
        └─ NO → Renovar token
            ├─ Token silencioso
            └─ Si falla → Token popup
```

## Mensajes de Error Mejorados

| Escenario | Mensaje al Usuario |
|-----------|-------------------|
| Sin instancia MSAL | "La sesión no está activa. Por favor, recarga la página." |
| Sin cuenta activa | "No hay una cuenta activa. Por favor, inicia sesión nuevamente." |
| Error al obtener token | "Error al obtener token de acceso. Por favor, inicia sesión nuevamente." |
| Otros errores | "Error al subir foto: [mensaje específico]" |

## Beneficios

1. **Recuperación Automática**: El sistema intenta recuperar la sesión automáticamente sin perder datos
2. **Mensajes Claros**: Los usuarios saben exactamente qué hacer cuando hay un problema
3. **Prevención de Errores**: Las validaciones previas evitan llamadas fallidas a la API
4. **Experiencia de Usuario**: Menos interrupciones y mejor flujo de trabajo

## Pruebas Recomendadas

- [ ] Subir foto con sesión activa → Debe funcionar normalmente
- [ ] Subir foto después de 30-60 minutos de inactividad → Debe solicitar re-login
- [ ] Completar test con sesión expirada → Debe mostrar mensaje claro
- [ ] Crear test nuevo después de inactividad → Debe validar sesión

## Notas

- El popup de login solo aparece cuando es absolutamente necesario
- Los datos ingresados NO se pierden durante el proceso de re-autenticación
- La validación se hace en el cliente antes de llamar a OneDrive/Graph API
- Los errores se registran en la consola del navegador para debugging

## Comandos para Probar

```powershell
# Desarrollo local
npm run dev

# Build de producción
npm run build
```

---
**Fecha:** 2025-01-17
**Versión:** Next.js 15.5.5
