# 🔒 GUÍA DE SEGURIDAD - Aquagold Resistencias App

## ⚠️ INFORMACIÓN IMPORTANTE

Este documento contiene información crítica sobre seguridad y manejo de credenciales.

---

## 🚨 NUNCA Publicar en GitHub

### ❌ NO SUBIR:
- `.env.local` - Variables de entorno con credenciales reales
- `firebase-adminsdk-*.json` - Claves de servicio de Firebase
- Credenciales de Azure AD (Client ID, Tenant ID)
- Claves API de Firebase
- Tokens de acceso
- Contraseñas o secrets

### ✅ SÍ SUBIR:
- `.env.example` - Plantilla SIN valores reales
- Código fuente
- Documentación pública
- Archivos de configuración sin credenciales

---

## 🔑 Credenciales Sensibles

### Firebase
Las siguientes variables NO deben publicarse:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Azure AD (MSAL)
Las siguientes variables son sensibles:
```
NEXT_PUBLIC_MSAL_CLIENT_ID
NEXT_PUBLIC_MSAL_TENANT_ID
```

⚠️ **Nota sobre MSAL**: Aunque el Client ID y Tenant ID son "públicos" en el sentido de que aparecen en el código del cliente, **NO DEBEN** publicarse en repositorios públicos de GitHub por las siguientes razones:

1. **Facilita ataques**: Exponer estos IDs facilita intentos de phishing o suplantación
2. **Metadata organizacional**: Revelan información sobre tu organización de Azure AD
3. **Superficie de ataque**: Reducir información pública reduce la superficie de ataque
4. **Mejores prácticas**: Microsoft recomienda no publicar estas credenciales

---

## 🛡️ Configuración de Seguridad

### 1. Archivo .gitignore

Verificar que `.gitignore` incluya:
```
.env*
*.pem
firebase-adminsdk-*.json
```

### 2. Firestore Rules

Configurar reglas de seguridad estrictas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados
    match /resistance_tests/{testId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Azure AD App Registration

Configurar correctamente:
- **Redirect URIs**: Solo dominios autorizados
- **API permissions**: Solo los permisos necesarios (User.Read, Files.ReadWrite)
- **Authentication**: Habilitar solo flujos necesarios

### 4. OneDrive / Microsoft Graph

- Usar permisos delegados (no permisos de aplicación)
- Limitar scopes a lo mínimo necesario
- Revisar tokens periódicamente

---

## 🔄 Qué hacer si se expusieron credenciales

### ⚠️ Pasos Inmediatos:

#### 1. Firebase
```bash
# 1. Ir a Firebase Console
# 2. Project Settings > General
# 3. Regenerar API Keys
# 4. Actualizar .env.local
# 5. Redeploy la aplicación
```

#### 2. Azure AD
```bash
# 1. Ir a Azure Portal
# 2. Azure Active Directory > App registrations
# 3. Tu app > Certificates & secrets
# 4. Rotar secrets si los tienes
# 5. Considerar crear nueva app registration si es necesario
```

#### 3. Git History
```bash
# Si ya hiciste commit con credenciales:

# Opción 1: Revertir commit (si es reciente)
git revert HEAD
git push origin main

# Opción 2: Limpiar historial (CUIDADO: reescribe historia)
# Solo si es absolutamente necesario
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
```

#### 4. GitHub Secrets Scanning
- GitHub automáticamente escanea repositorios públicos
- Si detecta credenciales, recibirás una alerta
- Actúa inmediatamente al recibir la alerta

---

## ✅ Mejores Prácticas

### Desarrollo Local
1. ✅ Usa `.env.local` para desarrollo
2. ✅ Nunca hagas `console.log()` de credenciales
3. ✅ Revisa cambios antes de hacer commit (`git diff`)
4. ✅ Usa variables de entorno en deployment

### Deployment (Vercel/Netlify)
1. ✅ Configura variables de entorno en el dashboard
2. ✅ NO uses valores por defecto en el código
3. ✅ Habilita HTTPS siempre
4. ✅ Configura CORS correctamente

### Equipo
1. ✅ Comparte credenciales por canales seguros (Azure Key Vault, 1Password, etc.)
2. ✅ Nunca por email o Slack
3. ✅ Usa credenciales diferentes para dev/staging/prod
4. ✅ Implementa rotación periódica de credenciales

---

## 📋 Checklist de Seguridad

Antes de cada push a GitHub:

- [ ] Verificar que no hay archivos `.env*` staged
- [ ] Revisar `git status` y `git diff`
- [ ] Buscar patrones sospechosos: `grep -r "API_KEY" .`
- [ ] Verificar que `.gitignore` está actualizado
- [ ] Confirmar que no hay credenciales hardcoded en código

---

## 🔍 Herramientas Útiles

### Detección de Secrets
```bash
# Git-secrets (instalar primero)
git secrets --scan

# Gitleaks
gitleaks detect --source . --verbose

# Manual search
grep -r "FIREBASE_API_KEY" .
grep -r "MSAL_CLIENT_ID" .
```

### Pre-commit Hook
Crear `.git/hooks/pre-commit`:
```bash
#!/bin/sh
if git diff --cached --name-only | grep -q ".env"; then
  echo "⚠️  WARNING: Attempting to commit .env file!"
  exit 1
fi
```

---

## 📞 Contacto en Caso de Incidente

Si detectas una exposición de credenciales:

1. **Inmediato**: Rotar credenciales afectadas
2. **Notificar**: Al equipo de desarrollo
3. **Documentar**: Qué se expuso y cuándo
4. **Revisar**: Logs de acceso para detectar uso no autorizado

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Azure AD Best Practices](https://docs.microsoft.com/en-us/azure/active-directory/develop/identity-platform-integration-checklist)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

---

**Última actualización:** 20 de Octubre, 2025  
**Mantenido por:** Equipo Aquagold
