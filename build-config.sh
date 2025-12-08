#!/bin/bash

# Script de build para generar configuración de Firebase
# Este script reemplaza las variables del template con valores reales

# Variables de entorno (estas deberían estar en el entorno de deployment)
FIREBASE_API_KEY="${FIREBASE_API_KEY:-AIzaSyCYf-AU9QPNb7hzsmC5NgFgP06WokXe2ZA}"
FIREBASE_AUTH_DOMAIN="${FIREBASE_AUTH_DOMAIN:-amigoinvisible-elmejorgrupo.firebaseapp.com}"
FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID:-amigoinvisible-elmejorgrupo}"
FIREBASE_STORAGE_BUCKET="${FIREBASE_STORAGE_BUCKET:-amigoinvisible-elmejorgrupo.firebasestorage.app}"
FIREBASE_MESSAGING_SENDER_ID="${FIREBASE_MESSAGING_SENDER_ID:-604170061270}"
FIREBASE_APP_ID="${FIREBASE_APP_ID:-1:604170061270:web:7cd3be12c8da0b58151077}"

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