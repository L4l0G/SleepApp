# 🚀 QUICK START - SleepApp con Firebase

## ⏱️ 5 Minutos para tener todo funcionando

### PASO 1: Instalar dependencias (2 min)

```bash
cd SleepApp
npm install
```

Si hay errores con Firebase en Expo, usa:
```bash
npx expo install expo-dev-client
```

---

### PASO 2: Crear proyecto Firebase (2 min)

1. Ve a https://firebase.google.com
2. Click "Ir a la consola"
3. Crea nuevo proyecto "SleepApp"
4. Espera a que se cree (30 segundos)

---

### PASO 3: Configurar Firebase (1 min)

**Autenticación:**
- Firebase Console → Autenticación
- Click "Comenzar"
- Habilitar "Email/Contraseña"

**Base de datos:**
- Firestore Database
- Click "Crear base de datos"
- Modo prueba
- Ubicación: us-central1

**Reglas de seguridad** (copiar y pegar):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

### PASO 4: Obtener credenciales (1 min)

1. Proyecto → Configuración del proyecto
2. Ir a "Apps" → tu proyecto
3. Si ves Android/iOS, descarga `google-services.json`
4. Si solo ves "Agregue una app":
   - Click en Android ➕
   - Copiar el contenido que aparece
   - Reemplazar valores en `src/config/firebase.js`

---

### PASO 5: Actualizar configuración

Abre `src/config/firebase.js` y reemplaza con tus valores:

```javascript
const firebaseConfig = {
  apiKey: "AQUI_TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:xxx",
};
```

---

### PASO 6: ¡Ejecutar!

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## ✅ Lo que verás

1. **Pantalla de Login** → Crear cuenta o iniciar sesión
2. **Registro** → Ingresar email y contraseña
3. **App Principal** → Cuestionario, Rutina, Progreso
4. **Botón logout** → En la esquina superior derecha (🚪)

---

## 📊 Ver datos

1. Abre Firebase Console
2. Ve a Firestore Database
3. Verás carpeta "users"
4. Dentro: tus datos de usuario sincronizados en tiempo real ✨

---

## 🐛 Solucionar errores

**"Firebase not initialized"**
→ Verificar valores en `src/config/firebase.js`

**"Email already in use"**
→ Usar otro email, o borrar el usuario en Firebase Auth

**"Error: undefined is not a function"**
→ Ejecutar `npm install` nuevamente

**Datos no aparecen en Firestore**
→ Revisar reglas de seguridad (paso 3)

---

## 📚 Más información

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Configuración detallada
- [ACCEDER_A_DATOS.md](./ACCEDER_A_DATOS.md) - Ver datos como desarrollador
- [ESTRUCTURA_PROYECTO.md](./ESTRUCTURA_PROYECTO.md) - Qué cambió

---

## 🎯 Próximos pasos (opcional)

1. Crear panel web para ver todos los usuarios
2. Agregar backup automático
3. Generar reportes de sueño
4. Enviar notificaciones desde el servidor

¿Preguntas? Revisar documentos de arriba 👆
