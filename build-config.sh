#!/bin/bash

# Script de build para generar configuración de Firebase
# Este script reemplaza las variables del template con valores reales

# Debug: Mostrar estado inicial
echo "🔍 Debug: FIREBASE_API_KEY inicial = ${FIREBASE_API_KEY:0:20}..."
echo "🔍 Debug: .env.local existe? $([ -f ".env.local" ] && echo "Sí" || echo "No")"

# Cargar variables de .env.local solo si las variables no están ya definidas (para desarrollo local)
if [ -f ".env.local" ] && [ -z "$FIREBASE_API_KEY" ]; then
    echo "🔧 Cargando variables desde .env.local (desarrollo local)..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "🔧 Usando variables de entorno existentes (CI/CD o producción)..."
fi

echo "🔍 Debug: FIREBASE_API_KEY después de load = ${FIREBASE_API_KEY:0:20}..."

# Validar que las variables requeridas estén definidas
if [ -z "$FIREBASE_API_KEY" ] || [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ Error: Variables de Firebase no están definidas"
    echo "   Define FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc. en .env.local o en el entorno"
    exit 1
fi

# Variables de entorno (ya cargadas desde .env.local o desde el entorno de CI/CD)
FIREBASE_API_KEY="${FIREBASE_API_KEY}"
FIREBASE_AUTH_DOMAIN="${FIREBASE_AUTH_DOMAIN}"
FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID}"
FIREBASE_STORAGE_BUCKET="${FIREBASE_STORAGE_BUCKET}"
FIREBASE_MESSAGING_SENDER_ID="${FIREBASE_MESSAGING_SENDER_ID}"
FIREBASE_APP_ID="${FIREBASE_APP_ID}"

# Generar config.js desde el template
echo "🔧 Generando configuración de Firebase..."

# Verificar que el template existe
if [ ! -f "public/config.template.js" ]; then
    echo "❌ Error: public/config.template.js no encontrado"
    exit 1
fi

# Crear config.js reemplazando variables
sed -e "s/{{FIREBASE_API_KEY}}/$FIREBASE_API_KEY/g" \
    -e "s/{{FIREBASE_AUTH_DOMAIN}}/$FIREBASE_AUTH_DOMAIN/g" \
    -e "s/{{FIREBASE_PROJECT_ID}}/$FIREBASE_PROJECT_ID/g" \
    -e "s/{{FIREBASE_STORAGE_BUCKET}}/$FIREBASE_STORAGE_BUCKET/g" \
    -e "s/{{FIREBASE_MESSAGING_SENDER_ID}}/$FIREBASE_MESSAGING_SENDER_ID/g" \
    -e "s/{{FIREBASE_APP_ID}}/$FIREBASE_APP_ID/g" \
    public/config.template.js > public/config.js

echo "✅ Configuración generada en public/config.js"
echo "🚀 Listo para deployment"