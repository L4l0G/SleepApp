// src/data/routines.js

export function calcPerfil(form) {
  let score = 0;

  const horas = parseFloat(form.horas) || 6;
  if (horas < 5)        score += 3;
  else if (horas < 6.5) score += 2;
  else if (horas < 7.5) score += 1;

  const feelMap = { muy_malo: 3, malo: 2, regular: 1, bueno: 0, excelente: 0 };
  score += feelMap[form.despFeel] ?? 0;

  const cafMap = { noche: 2, tarde: 1, manana: 0, no: 0 };
  score += cafMap[form.cafeina] ?? 0;

  const irrMap = { severo: 2, moderado: 1, leve: 0, no: 0 };
  score += irrMap[form.irregular] ?? 0;

  const estres = parseInt(form.estres) || 5;
  if (estres >= 8) score += 2;
  else if (estres >= 6) score += 1;

  const panMap = { mucho: 1, moderado: 0, poco: 0, no: 0 };
  score += panMap[form.pantallas] ?? 0;

  if (score >= 7) return 'severo';
  if (score >= 3) return 'moderado';
  return 'leve';
}

export const RUTINAS = {
  severo: {
    label: 'Atención urgente',
    color: '#F87171',
    colorSoft: '#3D1010',
    emoji: '🔴',
    desc: 'Tu sueño necesita atención. Comienza con los fundamentos.',
    tip: {
      licenciatura: 'Dormir menos de 6 horas deteriora la memoria de trabajo y la retención. Estas rutinas atacan las causas raíz en 2 semanas.',
      posgrado: 'La presión del posgrado dispara el insomnio crónico. Estas rutinas atacan: estrés acumulado, cafeína tardía y falta de cierre mental.',
    },
    cards: [
      {
        id: 'rmp',
        badge: 'Noche · 20 min',
        badgeColor: '#2DD4A0',
        title: 'Relajación muscular progresiva',
        desc: '45-90 min antes de dormir. Reduce la activación del sistema nervioso simpático.',
        icon: '🌙',
        ejercicios: [
          'Tensión-relajación de pies y pantorrillas · 3 min',
          'Respiración 4-7-8: inhala 4s, retén 7s, exhala 8s · ×6 rondas',
          'Relajación de hombros, cuello y mandíbula · 4 min',
          'Escaneo corporal lento de pies a cabeza · 5 min',
        ],
      },
      {
        id: 'corte',
        badge: 'Hábito nocturno',
        badgeColor: '#F59E0B',
        title: 'Corte de cafeína y pantallas',
        desc: 'La cafeína tiene vida media de 5-6 horas. Las pantallas suprimen melatonina.',
        icon: '📵',
        ejercicios: [
          'Sin cafeína después de las 14:00h',
          'Modo No Molestar activado a tu hora objetivo de sueño',
          'Sustituye scroll nocturno por lectura física 10 min',
          'Temperatura del cuarto: 18-20°C si es posible',
        ],
      },
      {
        id: 'circadiano',
        badge: 'Mañana · 10 min',
        badgeColor: '#4F7EF7',
        title: 'Activación circadiana',
        desc: 'Exponerte a luz brillante en los primeros 30 min ancla tu reloj biológico.',
        icon: '☀️',
        ejercicios: [
          'Sal al exterior o asómate 5-10 min en los primeros 30 min',
          'Desayuno sin pantallas los primeros 15 min',
          'Respiración activadora: 20 inhalaciones rápidas por nariz',
        ],
      },
    ],
  },

  moderado: {
    label: 'Sueño irregular',
    color: '#F59E0B',
    colorSoft: '#3B2506',
    emoji: '🟡',
    desc: 'Tu sueño es irregular. Estas rutinas te ayudarán a estabilizarlo.',
    tip: {
      licenciatura: 'El "sueño de recuperación" del fin de semana desincroniza tu reloj biológico. La clave es consistencia, no cantidad.',
      posgrado: 'Los ritmos irregulares del posgrado fragmentan el ciclo circadiano. Consistencia en hora de dormir > cantidad de horas.',
    },
    cards: [
      {
        id: 'yoga',
        badge: 'Noche · 15 min',
        badgeColor: '#2DD4A0',
        title: 'Yoga suave pre-sueño',
        desc: '30 min antes de acostarte. Activa el sistema nervioso parasimpático.',
        icon: '🧘',
        ejercicios: [
          'Postura del niño (balasana) · 3 min',
          'Piernas en la pared (viparita karani) · 5 min',
          'Mariposa recostada (supta baddha konasana) · 3 min',
          'Savasana con respiración 4-4 · 4 min',
        ],
      },
      {
        id: 'aerobico',
        badge: 'Tarde · 20 min',
        badgeColor: '#4F7EF7',
        title: 'Ejercicio aeróbico ligero',
        desc: 'Al menos 3 horas antes de dormir. Mejora el sueño profundo y reduce cortisol nocturno.',
        icon: '🏃',
        ejercicios: [
          'Caminata rápida o trote ligero · 15 min',
          'Saltar la cuerda o jumping jacks · 5 min',
          'Evitar ejercicio intenso después de las 20:00h',
        ],
      },
      {
        id: 'cierre',
        badge: 'Hábito nocturno',
        badgeColor: '#F59E0B',
        title: 'Ritual de cierre mental',
        desc: 'El cerebro universitario sigue procesando tareas al acostarse. Este ritual vacía la memoria de trabajo.',
        icon: '📓',
        ejercicios: [
          'Escribe 3 pendientes de mañana (cierra bucles abiertos)',
          'Repasa brevemente lo aprendido hoy (consolida memoria)',
          'Té de manzanilla o valeriana',
          'Oscuridad total o antifaz al dormir',
        ],
      },
    ],
  },

  leve: {
    label: 'Optimización',
    color: '#2DD4A0',
    colorSoft: '#0D3D2D',
    emoji: '🟢',
    desc: 'Tu sueño es bueno. Llévalo al siguiente nivel.',
    tip: {
      licenciatura: '¡Excelente base! Pequeños ajustes pueden mejorar tu rendimiento cognitivo, retención y bienestar general.',
      posgrado: '¡Gran punto de partida! El sueño de alta calidad es una ventaja competitiva: mejora síntesis de información compleja y creatividad analítica.',
    },
    cards: [
      {
        id: 'mindfulness',
        badge: 'Noche · 10 min',
        badgeColor: '#2DD4A0',
        title: 'Meditación de atención plena',
        desc: 'Mindfulness para maximizar sueño profundo y reducir microdespertares nocturnos.',
        icon: '🧠',
        ejercicios: [
          'Body scan meditado · 10 min (app: Insight Timer, gratuita)',
          'Diario de gratitud: 3 cosas positivas del día',
          'Visualización de un lugar tranquilo al cerrar los ojos',
        ],
      },
      {
        id: 'matutino',
        badge: 'Mañana · 20 min',
        badgeColor: '#4F7EF7',
        title: 'Movimiento matutino',
        desc: 'El ejercicio matutino regula el cortisol y mejora la arquitectura del sueño nocturno.',
        icon: '🌅',
        ejercicios: [
          'Saludos al sol (surya namaskar) × 5 rondas',
          'Respiración de fuego (kapalabhati) · 2 min',
          'Caminata de 10 min sin auriculares (atención plena)',
        ],
      },
      {
        id: 'higiene',
        badge: 'Diario',
        badgeColor: '#F59E0B',
        title: 'Higiene avanzada del sueño',
        desc: 'Optimiza tu entorno y hábitos para sueño de alta calidad sostenido.',
        icon: '✨',
        ejercicios: [
          'Horario fijo ±15 min, incluyendo fines de semana',
          'Sin cafeína después de las 14:00h',
          'Siesta máx. 20 min antes de las 15:00h si es necesaria',
          'Cena ligera al menos 2h antes de dormir',
        ],
      },
    ],
  },
};
