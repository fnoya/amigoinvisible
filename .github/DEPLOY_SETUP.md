# GitHub Actions Setup

Para que el workflow de deploy automático funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub:

## 📋 Secrets Requeridos

### 1. MAILERSEND_API_KEY

- **Valor**: Tu API key de MailerSend
- **Ejemplo**: `mlsn.721f2be7d5febe651bea6096e31b4d921421c293539464f2acee7805eb832694`

### 2. FIREBASE_SERVICE_ACCOUNT_AMIGOINVISIBLE_ELMEJORGRUPO

- **Valor**: JSON de la cuenta de servicio de Firebase
- **Cómo obtenerlo**:
  1. Ve a Firebase Console → Project Settings → Service Accounts
  2. Click en "Generate new private key"
  3. Descarga el archivo JSON
  4. Copia todo el contenido del archivo JSON

### 3. FIREBASE_TOKEN (Alternativa)

- **Valor**: Token de CI para Firebase CLI
- **Cómo obtenerlo**:

  ```bash
  firebase login:ci
  ```

  Copia el token que se genera

## 🔧 Configuración en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click en "New repository secret"
4. Agrega cada secret con su nombre exacto y valor correspondiente

## 🚀 Configuración del Workflow

El workflow se ejecuta automáticamente cuando:

- ✅ Haces push a la rama `main`
- ✅ Se abre un Pull Request hacia `main`

### Pasos del deploy

1. 📦 Instala dependencias
2. 🔧 Configura variables de entorno
3. 🏗️ Construye las funciones
4. 🚀 Despliega hosting, functions y firestore
5. 💬 Comenta en PRs con el estado del deploy

## 🔍 Troubleshooting

### Error: "Permission denied"

- Verifica que el service account tenga permisos de Firebase Admin
- Revisa que el project ID sea correcto: `amigoinvisible-elmejorgrupo`

### Error: "Invalid token"

- Regenera el FIREBASE_TOKEN con `firebase login:ci`
- Asegúrate de que el token no tenga espacios extra

### Error: "MailerSend API key"

- Verifica que el secret MAILERSEND_API_KEY esté configurado
- Confirma que la API key sea válida en MailerSend

## 🎯 Deploy Manual de Emergencia

Si necesitas hacer deploy manual:

```bash
firebase deploy --project amigoinvisible-elmejorgrupo
```
