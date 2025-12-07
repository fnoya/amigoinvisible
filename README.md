# Configuración del entorno

## Variables de entorno requeridas

### Para desarrollo local
```bash
export MAILERSEND_API_KEY="tu_api_key_de_mailersend"
```

### Para Firebase Functions
```bash
# Configurar la API key de MailerSend
firebase functions:config:set mailersend.api_key="tu_api_key_de_mailersend"
```

## Configuración de Firebase

1. Crea un proyecto en Firebase Console
2. Habilita Authentication, Firestore y Functions
3. Obtén la configuración del proyecto
4. Actualiza el archivo `public/index.html` con tu configuración real

### Configuración de Authentication
- Habilita el proveedor "Email/Password"

### Configuración de Firestore
- Modo de prueba inicialmente
- Aplicar las reglas de seguridad del archivo `firestore.rules`

### Configuración de Functions
- Instalar dependencias en la carpeta functions
- Configurar la API key de MailerSend

## MailerSend Setup

1. Registrate en MailerSend
2. Verifica tu dominio
3. Genera una API key con permisos de envío
4. Configura webhooks (opcional para tracking avanzado)

### Webhook URL para tracking
```
https://your-project.cloudfunctions.net/mailersendWebhook
```

## Comandos útiles

### Desarrollo local con emuladores
```bash
npm run serve
```

### Deploy a Firebase
```bash
npm run deploy
```

### Ver logs de Functions
```bash
firebase functions:log
```

## Estructura del proyecto
```
amigoinvisible/
├── functions/          # Cloud Functions
│   ├── index.js       # Funciones principales
│   ├── events.js      # Funciones de eventos
│   └── package.json   # Dependencias
├── public/            # Frontend
│   └── index.html     # Aplicación web
├── firebase.json      # Configuración Firebase
├── firestore.rules    # Reglas de seguridad
└── package.json       # Proyecto principal
```