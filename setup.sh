#!/bin/bash

echo "🚀 Inicializando proyecto Amigo Invisible..."

# Verificar dependencias
echo "📦 Verificando dependencias..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias del proyecto principal..."
    npm install
fi

if [ ! -d "functions/node_modules" ]; then
    echo "📥 Instalando dependencias de Cloud Functions..."
    cd functions && npm install --cache /tmp/.npm && cd ..
fi

echo "✅ Setup completado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Crea un proyecto en Firebase Console"
echo "2. Habilita Authentication, Firestore y Functions"
echo "3. Copia .env.example a .env y completa las variables"
echo "4. Actualiza la configuración de Firebase en public/index.html"
echo "5. Ejecuta 'npm run serve' para iniciar los emuladores"
echo ""
echo "📚 Para más información, lee el README.md"