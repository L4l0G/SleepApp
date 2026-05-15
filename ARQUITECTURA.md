# 🏗️ Arquitectura de SleepApp - Diagrama Completo

## Sistema Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                       📱 APP MOBILE (React Native)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  App.js                                                           │
│    ├─→ AuthProvider (contexto de sesión)                        │
│    └─→ RootNavigator (elige entre Login o App)                  │
│                                                                   │
│  ┌─ SIN SESIÓN ────────────────┐  ┌─ CON SESIÓN ────────┐     │
│  │ AuthNavigator               │  │ AppNavigator        │     │
│  ├─ LoginScreen               │  ├─ CuestionarioScreen │     │
│  │  (usuario existente)        │  │ (datos sueño)       │     │
│  └─ RegistroScreen            │  ├─ RutinaScreen      │     │
│     (usuario nuevo)           │  │ (recomendaciones)   │     │
│                               │  ├─ ProgresoScreen    │     │
│                               │  │ (gráficas)         │     │
│                               │  └─ ResumenScreen     │     │
│                               │                        │     │
│                               │ + Botón logout (🚪)   │     │
│                               │                        │     │
│                               └────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
              ↓↑
        ┌─────────────┐
        │  Storage.js │  ← Manejador de datos
        └─────────────┘
        /             \
       ↓               ↓
┌──────────────┐  ┌──────────────────────┐
│ AsyncStorage │  │  Firebase Firestore  │
│ (Caché Local)│  │  (Base datos nube)   │
│              │  │                      │
│ • Rápido     │  │ • Sincronizado       │
│ • Offline    │  │ • Backup             │
│ • Temporal   │  │ • Permanente         │
└──────────────┘  └──────────────────────┘
                           ↓↑
                  ┌────────────────────┐
                  │  Firebase Console  │
                  │  (panel del dev)   │
                  └────────────────────┘
```

---

## Flujo de Datos - Usuario Registrado

```
1. REGISTRO
   └─ Usuario entra email/contraseña
       └─ LoginScreen.js
           └─ useAuth().register()
               └─ Firebase Auth
                   └─ Se crea usuario en Firebase
                       └─ AuthContext detecta cambio
                           └─ App navega a AppNavigator ✓

2. USO DE APP
   └─ Usuario rellena cuestionario
       └─ CuestionarioScreen
           └─ setField() actualiza estado local
               └─ handleSubmit()
                   └─ storage.saveForm()
                       ├─ saveLocal() → AsyncStorage
                       └─ saveToFirebase() → Firestore
                           └─ Datos en nube ✓

3. SIGUIENTE SESIÓN
   └─ Usuario abre app
       └─ AuthContext verifica onAuthStateChanged
           └─ Si ya tiene sesión → AppNavigator
               └─ loadForm() → intenta Firebase primero
                   ├─ Si existe en Firestore → usa ese
                   └─ Si no → usa caché local
                       └─ App carga con datos ✓
```

---

## Estructura Firestore

```
users/
│
├─ user_uid_1/
│  ├─ profile/
│  │  └─ nombre: "Juan"
│  │     email: "juan@email.com"
│  │
│  └─ data/
│     ├─ form/
│     │  ├─ form: { nivelAcad, horas, ... }
│     │  └─ timestamp: 2026-05-13T10:30:00Z
│     │
│     ├─ perfil/
│     │  ├─ perfil: "madrugador"
│     │  └─ timestamp: 2026-05-13T10:32:00Z
│     │
│     ├─ progress/
│     │  ├─ progress: [true, false, true, ...]
│     │  └─ timestamp: 2026-05-13T10:35:00Z
│     │
│     ├─ sleepLog/
│     │  ├─ log: [7.5, 8.0, 6.5, ...]
│     │  └─ timestamp: 2026-05-13T10:36:00Z
│     │
│     └─ startDate/
│        ├─ date: "2026-05-13T00:00:00Z"
│        └─ timestamp: 2026-05-13T10:32:00Z
│
└─ user_uid_2/
   └─ ... (misma estructura)
```

---

## Componentes Clave

### 1. AuthContext.js
```javascript
Proporciona:
├─ user: { uid, email, displayName, ... }
├─ loading: boolean
├─ error: string
├─ isAuthenticated: boolean
├─ register(email, password, name)
├─ login(email, password)
├─ logout()
└─ resetPassword(email)
```

### 2. storage.js (Actualizado)
```javascript
Funciones de guardado:
├─ saveForm(form) → AsyncStorage + Firebase
├─ savePerfil(perfil) → AsyncStorage + Firebase
├─ saveProgress(progress) → AsyncStorage + Firebase
├─ saveSleepLog(log) → AsyncStorage + Firebase
└─ ...

Funciones de carga:
├─ loadForm() → intenta Firebase, cae a AsyncStorage
├─ loadPerfil()
├─ loadProgress()
├─ loadSleepLog()
└─ ...
```

### 3. AppNavigator.js
```javascript
Cambios:
├─ Se agregó LogoutButton() en header
├─ Muestra botón 🚪 para cerrar sesión
└─ Mantiene todas las pantallas originales
```

---

## Seguridad - Flujo de Autenticación

```
1. Usuario → LoginScreen
   ↓
2. auth().signInWithEmailAndPassword(email, password)
   ↓
3. Firebase valida credenciales
   ├─ ✓ Correcto → Genera JWT token
   ├─ ✗ Incorrecto → error.message
   ↓
4. AuthContext detecta cambio en onAuthStateChanged
   ├─ user ≠ null → Actualiza estado
   └─ Componentes usan useAuth() para acceder
      ↓
5. Usuario autenticado accede a AppNavigator
   ├─ Todos sus datos se sincronizan
   └─ UID se pasa a funciones de storage
```

---

## Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo el usuario autenticado puede acceder a sus datos
    match /users/{userId}/{document=**} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

**Esto significa:**
- Usuario A solo ve datos de userId = request.auth.uid (su ID)
- Usuario A no puede acceder a datos de Usuario B
- Los admins pueden ver todo con credenciales especiales

---

## Sincronización Offline-First

```
APP ABIERTA SIN INTERNET
│
├─ Lee datos locales (AsyncStorage) ✓ Funciona
├─ Intenta sincronizar con Firebase ✗ Espera
│
INTERNET VUELVE
│
├─ Storage.js detecta cambio
├─ Envía cambios pendientes a Firebase
├─ Descarga cambios remotos
└─ Actualiza AsyncStorage
```

---

## Flujo Completo de Uso

```
PRIMER USUARIO
├─ 1. App abre → AuthNavigator
├─ 2. Click "Crear cuenta" → RegistroScreen
├─ 3. Ingresa nombre, email, contraseña
├─ 4. Click "Crear" → Firebase Auth
├─ 5. ✓ Usuario creado → AuthContext actualiza
├─ 6. App navega a AppNavigator
├─ 7. Rellena cuestionario
├─ 8. saveForm() → AsyncStorage + Firestore
└─ 9. Datos sincronizados ✓

SIGUIENTE SESIÓN (MISMO USUARIO)
├─ 1. App abre → AuthContext verifica sesión
├─ 2. ✓ Sesión existe (Firebase la recuerda)
├─ 3. AppNavigator se abre directo
├─ 4. loadForm() intenta Firebase
├─ 5. ✓ Datos encontrados → Carga datos
└─ 6. Usuario ve su progreso anterior ✓

OTRO USUARIO DIFERENTE
├─ 1. Click logout 🚪 → Cierra sesión
├─ 2. AppNavigator desaparece
├─ 3. AuthNavigator aparece
├─ 4. Nuevo usuario puede registrarse
├─ 5. Crea su propia colección en Firestore
└─ 6. Sus datos no interfieren con otros usuarios ✓
```

---

## Ventajas de esta Arquitectura

✅ **Escalabilidad**: Cada usuario con datos separados  
✅ **Seguridad**: Reglas de Firestore por UID  
✅ **Offline-first**: AsyncStorage como fallback  
✅ **Sincronización**: Automática cuando hay conexión  
✅ **Backups**: Datos en la nube, nunca se pierden  
✅ **Acceso desarrollador**: Firebase Console para inspeccionar  

