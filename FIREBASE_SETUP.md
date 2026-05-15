# SleepApp - Configuración Firebase

## 🚀 Instalación de dependencias

```bash
npm install
```

## 🔥 Configuración de Firebase

### Paso 1: Crear proyecto en Firebase

1. Ir a [firebase.google.com](https://firebase.google.com)
2. Hacer click en "Ir a la consola"
3. Crear nuevo proyecto llamado "SleepApp"
4. Habilitar Google Analytics (opcional)

### Paso 2: Configurar autenticación

1. En Firebase Console → Autenticación
2. Click en "Comenzar"
3. Habilitar "Email/Contraseña"
4. Guardar cambios

### Paso 3: Crear base de datos Firestore

1. En Firebase Console → Firestore Database
2. Click en "Crear base de datos"
3. Elegir "Iniciar en modo prueba"
4. Seleccionar ubicación (recomendado: us-central1)

### Paso 4: Configurar reglas de seguridad

En Firestore → Reglas, reemplazar con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuario solo puede acceder a sus propios datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Paso 5: Obtener credenciales

1. Proyecto → Configuración del proyecto → Apps → iOS/Android
2. Descargar archivo de configuración `google-services.json` (Android)
3. O `GoogleService-Info.plist` (iOS)
4. Guardar en la carpeta raíz del proyecto

### Paso 6: Variables de entorno

Crear archivo `.env` en la raíz:

```env
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id
```

O actualizar directamente en `src/config/firebase.js`

## 📱 Ejecutar la app

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🗄️ Estructura de datos en Firestore

```
users/
  ├── {userId}/
  │   ├── data/
  │   │   ├── form: { form, timestamp }
  │   │   ├── perfil: { perfil, timestamp }
  │   │   ├── progress: { progress, timestamp }
  │   │   ├── sleepLog: { log, timestamp }
  │   │   ├── startDate: { date, timestamp }
  │   │   ├── history: { entries, timestamp }
  │   │   └── notifId: { id, timestamp }
```

## 🔑 Características

✅ Autenticación con email y contraseña  
✅ Sincronización automática de datos a Firebase  
✅ Almacenamiento local para modo offline  
✅ Acceso a datos desde tu panel de Firebase  
✅ Seguridad basada en UID del usuario  

## 📊 Acceder a datos de usuarios

### Desde Firebase Console
1. Firebase Console → Firestore Database → Colección "users"
2. Expandir para ver datos de cada usuario

### Desde código (para análisis personalizado)
```javascript
import { db } from './src/config/firebase';

// Obtener todos los usuarios y sus datos de sueño
const snapshot = await db().collection('users').get();
snapshot.forEach(doc => {
  console.log(doc.id, doc.data());
});
```

## 🚨 Solución de problemas

**Error: "Firebase no inicializado"**  
→ Verificar credenciales en `src/config/firebase.js`

**Datos no se sincronizan**  
→ Verificar conexión a internet  
→ Revisar reglas de Firestore

**Errores de autenticación**  
→ Asegurarse de que Email/Contraseña está habilitado en Firebase Auth
