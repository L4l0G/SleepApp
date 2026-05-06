# SleepApp 🌙
**App de hábitos de sueño para estudiantes universitarios y de posgrado**

---

## Estructura del proyecto

```
SleepApp/
├── App.js                          ← Punto de entrada
├── package.json
├── babel.config.js
└── src/
    ├── screens/
    │   ├── CuestionarioScreen.js   ← Formulario de evaluación
    │   ├── RutinaScreen.js         ← Rutinas personalizadas
    │   └── ProgresoScreen.js       ← Seguimiento 14 días
    ├── navigation/
    │   └── AppNavigator.js         ← Bottom tab navigator
    ├── data/
    │   └── routines.js             ← Datos de rutinas + algoritmo de perfil
    └── utils/
        ├── theme.js                ← Colores, tipografía, espaciado
        └── storage.js              ← AsyncStorage (persistencia)
```

---

## Instalación y ejecución

### Requisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- App **Expo Go** en tu teléfono (iOS o Android)

### Pasos

```bash
# 1. Instalar dependencias
cd SleepApp
npm install

# 2. Iniciar el servidor de desarrollo
npx expo start

# 3. Escanear el QR con Expo Go (mismo WiFi)
```

---

## Funcionalidades

### 📋 Cuestionario
- Nivel académico (licenciatura / posgrado)
- Horas de sueño promedio (slider)
- Calidad al despertar
- Hora de acostarse
- Frecuencia de despertares nocturnos
- Uso de pantallas antes de dormir
- Nivel de estrés académico (slider)
- Consumo de cafeína
- Irregularidad de horario

### 🌙 Rutina personalizada
El algoritmo clasifica al estudiante en 3 perfiles:
- **Severo** (score ≥ 7): Relajación muscular progresiva, corte de cafeína/pantallas, activación circadiana
- **Moderado** (score 3-6): Yoga suave, ejercicio aeróbico, ritual de cierre mental
- **Leve** (score < 3): Meditación mindfulness, movimiento matutino, higiene avanzada

Los textos de cada rutina se adaptan según el nivel (licenciatura vs posgrado).

Cada tarjeta es expandible para ver los ejercicios detallados.

### 📈 Progreso (14 días)
- Calendario de 2 semanas con días marcables
- Gráfica de barras de horas dormidas
- Métricas: días completados, racha actual, promedio de sueño
- Registro diario de horas dormidas
- Persistencia con AsyncStorage (los datos sobreviven al cerrar la app)

---

## Personalización

### Agregar más rutinas
Edita `src/data/routines.js` — cada perfil tiene `cards[]` con:
```js
{
  id: 'id_unico',
  badge: 'Etiqueta · duración',
  badgeColor: '#HEX',
  title: 'Nombre del ejercicio',
  desc: 'Descripción breve',
  icon: '🧘',
  ejercicios: ['paso 1', 'paso 2', ...]
}
```

### Cambiar colores
Edita `src/utils/theme.js` — el tema es oscuro (dark mode) por defecto.

### Extender a 28 días
Cambia `new Array(14)` por `new Array(28)` en `storage.js` y `ProgresoScreen.js`.

---

## Tecnologías
- **React Native** con **Expo** (~50)
- **React Navigation** v6 (bottom tabs)
- **AsyncStorage** para persistencia local
- Sin backend — todo funciona offline
