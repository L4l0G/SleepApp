# 📊 Guía para Acceder a Datos de Usuarios - SleepApp

Como desarrollador, puedes acceder a los datos de todos los usuarios de la app a través de diferentes métodos.

## 1️⃣ **Dashboard de Firebase Console (Más fácil)**

### Ver datos en tiempo real:
1. Abre [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto "SleepApp"
3. Ve a **Firestore Database**
4. Verás la estructura:
```
users/
  ├── user@email.com (UID del usuario)
  │   └── data/
  │       ├── form → Datos del cuestionario inicial
  │       ├── perfil → Perfil del usuario (Madrugador, Normal, etc.)
  │       ├── progress → Progreso semanal (array de 7 días)
  │       ├── sleepLog → Registro de horas dormidas
  │       ├── startDate → Fecha de inicio del ciclo
  │       └── history → Histórico de ciclos anteriores
```

### Exportar datos a CSV/Excel:
1. Firestore Database → Selecciona una colección
2. Click en ⋮ (menú) → Exportar
3. Elige formato JSON
4. Descarga y procesa con Excel/Google Sheets

---

## 2️⃣ **Crear Panel Personalizado (Recomendado)**

Crear un dashboard web con React para ver métricas de usuarios.

### Instalación:
```bash
# Crear app React web
npx create-react-app sleepapp-admin
cd sleepapp-admin
npm install firebase react-firebase-hooks
```

### Código ejemplo (`src/Dashboard.js`):

```javascript
import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Obtener todos los usuarios
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const usersData = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          
          // Obtener datos de cada usuario
          const dataRef = collection(db, `users/${userId}/data`);
          const dataSnapshot = await getDocs(dataRef);
          
          const userData = {
            uid: userId,
            form: null,
            perfil: null,
            progress: null,
            sleepLog: null,
          };
          
          dataSnapshot.forEach(doc => {
            userData[doc.id] = doc.data();
          });
          
          usersData.push(userData);
        }
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Dashboard de SleepApp</h1>
      <table border="1">
        <thead>
          <tr>
            <th>UID Usuario</th>
            <th>Perfil</th>
            <th>Promedio sueño</th>
            <th>Progreso ciclo</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const avgSleep = user.sleepLog?.log
              ? (user.sleepLog.log.filter(h => h).reduce((a, b) => a + b, 0) / 
                 user.sleepLog.log.filter(h => h).length).toFixed(1)
              : '-';
            
            const progress = user.progress?.progress
              ? (user.progress.progress.filter(Boolean).length / 7 * 100).toFixed(0) + '%'
              : '-';

            return (
              <tr key={user.uid}>
                <td>{user.uid}</td>
                <td>{user.perfil?.perfil || '-'}</td>
                <td>{avgSleep}h</td>
                <td>{progress}</td>
                <td>{new Date(user.form?.timestamp?.seconds * 1000).toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 3️⃣ **Scripts Node.js para Análisis**

### Generar reporte de usuarios:

```javascript
// reporteUsuarios.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tu-proyecto-id'
});

const db = admin.firestore();

async function generarReporte() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  const reporte = [];
  
  for (const userDoc of snapshot.docs) {
    const userId = userDoc.id;
    const dataRef = userDoc.ref.collection('data');
    const dataSnapshot = await dataRef.get();
    
    let userData = { uid: userId };
    
    dataSnapshot.forEach(doc => {
      userData[doc.id] = doc.data();
    });
    
    reporte.push(userData);
  }
  
  console.table(reporte);
  
  // Guardar en CSV
  const csv = convertToCSV(reporte);
  require('fs').writeFileSync('reporte_usuarios.csv', csv);
  console.log('✓ Reporte guardado en reporte_usuarios.csv');
}

generarReporte().catch(console.error);
```

---

## 4️⃣ **Métricas que Puedes Analizar**

### Desde los datos de cada usuario:

| Métrica | Ubicación | Formato |
|---------|-----------|---------|
| **Horas promedio de sueño** | `sleepLog.log` | Array de 7 números |
| **Cumplimiento del ciclo** | `progress.progress` | Array de 7 booleanos |
| **Perfil del usuario** | `perfil.perfil` | String (Madrugador, Normal, etc.) |
| **Respuestas del cuestionario** | `form.form` | Objeto con todas las preguntas |
| **Fecha de inicio** | `startDate.date` | ISO string |
| **Histórico de ciclos** | `history.entries` | Array de ciclos anteriores |

### Ejemplo de análisis:

```javascript
// Calcular promedio de sueño de todos los usuarios
const promedioPorUsuario = usuarios.map(user => ({
  uid: user.uid,
  promedio: user.sleepLog?.log
    ? (user.sleepLog.log.filter(h => h).reduce((a,b) => a+b, 0) / user.sleepLog.log.length).toFixed(1)
    : null
}));

console.log('Promedio de sueño por usuario:', promedioPorUsuario);
```

---

## 5️⃣ **Obtener Credenciales de Administrador**

Para scripts automáticos, necesitas una **Service Account**:

1. Firebase Console → Configuración del proyecto
2. **Cuentas de servicio**
3. Click **Generar clave privada nueva**
4. Se descarga `serviceAccountKey.json`
5. **Guarda en lugar seguro** (no versionar en Git)

---

## 🔒 **Consideraciones de Privacidad**

- ✅ Los datos están protegidos por UID en Firestore
- ✅ Solo tú (con credenciales de admin) puedes ver todos los datos
- ✅ Los usuarios solo ven sus propios datos
- ⚠️ Si compartes datos, anonimiza UIDs para privacidad

---

## 📈 **Próximos pasos**

1. Crear panel web con React + Firebase
2. Generar reportes automáticos
3. Integrar gráficos (Chart.js, Recharts)
4. Exportar datos para análisis en SQL

¿Necesitas ayuda con algún paso?
