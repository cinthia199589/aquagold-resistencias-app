#!/bin/bash
# Script de instalación para Vercel con resolución de conflictos React 19 vs MSAL

echo "🔧 Configurando npm para resolver conflictos de dependencias..."

# Configurar npm para resolver conflictos
npm config set legacy-peer-deps true
npm config set strict-peer-deps false
npm config set auto-install-peers true

echo "📦 Instalando dependencias con resolución de conflictos..."

# Limpiar cache de npm
npm cache clean --force

# Instalar dependencias con flags específicos
npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error

echo "✅ Instalación completada exitosamente"