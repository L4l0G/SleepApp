// src/screens/ResumenScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';
import { RUTINAS } from '../data/routines';
import {
  loadProgress, loadSleepLog, loadPerfil, loadPrevPerfil,
  savePrevPerfil, clearCurrentCycle, appendHistory,
} from '../utils/storage';

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function StatCard({ emoji, value, label, color }) {
  return (
    <View style={[sc.statCard, { borderColor: color + '55' }]}>
      <Text style={sc.statEmoji}>{emoji}</Text>
      <Text style={[sc.statValue, { color }]}>{value}</Text>
      <Text style={sc.statLabel}>{label}</Text>
    </View>
  );
}

function PerfilChange({ prev, current }) {
  const order  = { severo: 0, moderado: 1, leve: 2 };
  const prevR  = RUTINAS[prev];
  const currR  = RUTINAS[current];
  const improved = order[current] > order[prev];
  const same     = prev === current;
  const worse    = order[current] < order[prev];

  let icon, msg, color;
  if (improved) { icon = '📈'; msg = '¡Tu sueño mejoró!';       color = colors.success; }
  else if (same) { icon = '➡️'; msg = 'Perfil sin cambios';      color = colors.warn;    }
  else           { icon = '📉'; msg = 'Tu sueño necesita más trabajo'; color = colors.danger; }

  return (
    <View style={[sc.perfilChange, { borderColor: color + '44', backgroundColor: color + '11' }]}>
      <Text style={sc.perfilChangeIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[sc.perfilChangeMsg, { color }]}>{msg}</Text>
        <View style={sc.perfilRow}>
          <View style={[sc.perfilBadge, { backgroundColor: prevR.colorSoft }]}>
            <Text style={[sc.perfilBadgeText, { color: prevR.color }]}>
              {prevR.emoji} {prevR.label}
            </Text>
          </View>
          <Text style={sc.arrow}>→</Text>
          <View style={[sc.perfilBadge, { backgroundColor: currR.colorSoft }]}>
            <Text style={[sc.perfilBadgeText, { color: currR.color }]}>
              {currR.emoji} {currR.label}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ResumenScreen({ navigation, route }) {
  const [data, setData] = useState(null);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Promise.all([loadProgress(), loadSleepLog(), loadPerfil(), loadPrevPerfil()])
      .then(([progress, sleepLog, perfil, prevPerfil]) => {
        const done     = progress.filter(Boolean).length;
        const pct      = Math.round((done / 14) * 100);
        const filled   = sleepLog.filter(h => h !== null);
        const avgSleep = filled.length
          ? (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1)
          : null;

        let racha = 0, maxRacha = 0, cur = 0;
        progress.forEach(d => {
          if (d) { cur++; maxRacha = Math.max(maxRacha, cur); }
          else cur = 0;
        });

        setData({ done, pct, avgSleep, maxRacha, perfil, prevPerfil });

        Animated.timing(fadeAnim, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }).start();
      });
  }, []);

  const handleReiniciar = async () => {
    if (!data) return;
    // Guardar en historial antes de limpiar
    await appendHistory({
      fecha: new Date().toISOString(),
      perfil: data.perfil,
      diasCompletados: data.done,
      avgSleep: data.avgSleep,
      maxRacha: data.maxRacha,
    });
    // Guardar perfil actual como "anterior" para comparar en el siguiente ciclo
    await savePrevPerfil(data.perfil);
    // Limpiar ciclo actual
    await clearCurrentCycle();
    // Ir al cuestionario
    navigation.reset({
      index: 0,
      routes: [{ name: 'Cuestionario' }],
    });
  };

  if (!data) {
    return (
      <View style={sc.loading}>
        <Text style={sc.loadingText}>Calculando resultados...</Text>
      </View>
    );
  }

  const rutina = RUTINAS[data.perfil];
  const statusColor = data.pct >= 70 ? colors.success : data.pct >= 40 ? colors.warn : colors.danger;
  const today = new Date();

  return (
    <Animated.ScrollView
      style={[sc.scroll, { opacity: fadeAnim }]}
      contentContainerStyle={sc.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={sc.hero}>
        <Text style={sc.heroEmoji}>
          {data.pct >= 70 ? '🏆' : data.pct >= 40 ? '💪' : '🌱'}
        </Text>
        <Text style={sc.heroTitle}>¡14 días completados!</Text>
        <Text style={sc.heroDate}>
          {today.getDate()} de {MONTHS_ES[today.getMonth()]} {today.getFullYear()}
        </Text>
        <Text style={sc.heroSub}>Aquí está tu resumen del ciclo</Text>
      </View>

      {/* Stats principales */}
      <View style={sc.statsGrid}>
        <StatCard
          emoji="✅" value={`${data.done}/14`}
          label="Días completados" color={statusColor}
        />
        <StatCard
          emoji="😴" value={data.avgSleep ? `${data.avgSleep}h` : '—'}
          label="Promedio de sueño" color={colors.accent}
        />
        <StatCard
          emoji="🔥" value={`${data.maxRacha}`}
          label="Mejor racha" color={colors.warn}
        />
        <StatCard
          emoji="📊" value={`${data.pct}%`}
          label="Cumplimiento" color={statusColor}
        />
      </View>

      {/* Barra de progreso */}
      <View style={sc.progressSection}>
        <View style={sc.progressBg}>
          <View style={[sc.progressFill, { width: `${data.pct}%`, backgroundColor: statusColor }]} />
        </View>
        <Text style={[sc.progressLabel, { color: statusColor }]}>
          {data.pct >= 70
            ? '¡Excelente consistencia! Mantén el hábito.'
            : data.pct >= 40
            ? 'Buen esfuerzo. El siguiente ciclo puede ser mejor.'
            : 'Cada pequeño avance cuenta. ¡Inténtalo de nuevo!'}
        </Text>
      </View>

      {/* Comparación de perfil */}
      {data.prevPerfil && data.prevPerfil !== data.perfil && (
        <>
          <Text style={sc.sectionLabel}>Comparación con ciclo anterior</Text>
          <PerfilChange prev={data.prevPerfil} current={data.perfil} />
        </>
      )}

      {/* Perfil actual */}
      <Text style={sc.sectionLabel}>Tu perfil al finalizar</Text>
      <View style={[sc.perfilCard, { borderColor: rutina.color + '55' }]}>
        <Text style={sc.perfilCardEmoji}>{rutina.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[sc.perfilCardTitle, { color: rutina.color }]}>{rutina.label}</Text>
          <Text style={sc.perfilCardDesc}>{rutina.desc}</Text>
        </View>
      </View>

      {/* Interpretación */}
      <View style={sc.insightCard}>
        <Text style={sc.insightTitle}>📋 Interpretación</Text>
        <Text style={sc.insightText}>
          {data.avgSleep
            ? data.avgSleep >= 7
              ? `Dormiste un promedio de ${data.avgSleep}h — dentro del rango recomendado (7-9h) para universitarios. Completa el cuestionario de nuevo para verificar si tu perfil mejoró.`
              : `Dormiste un promedio de ${data.avgSleep}h — aún por debajo de las 7h recomendadas. El siguiente cuestionario te dará una rutina ajustada para seguir mejorando.`
            : 'No registraste tus horas de sueño. En el próximo ciclo intenta registrar cada día para obtener datos más precisos.'}
        </Text>
      </View>

      {/* CTA reinicio */}
      <View style={sc.ctaSection}>
        <Text style={sc.ctaTitle}>¿Listo para el siguiente ciclo?</Text>
        <Text style={sc.ctaDesc}>
          Responde el cuestionario nuevamente para ver si tu perfil cambió y obtener una rutina actualizada.
        </Text>
        <TouchableOpacity style={sc.ctaBtn} onPress={handleReiniciar} activeOpacity={0.85}>
          <Text style={sc.ctaBtnText}>Iniciar nuevo ciclo →</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </Animated.ScrollView>
  );
}

const sc = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: colors.bg },
  container:  { padding: spacing.md },
  loading:    { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText:{ color: colors.textSecondary, fontSize: 15 },

  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  heroEmoji: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  heroDate:  { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  heroSub:   { fontSize: 14, color: colors.textSecondary, marginTop: 6 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    width: '47.5%', backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.md, alignItems: 'center',
  },
  statEmoji: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  progressSection: { marginBottom: spacing.lg },
  progressBg:   { height: 8, backgroundColor: colors.bgElevated, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 8, borderRadius: 4 },
  progressLabel:{ fontSize: 13, textAlign: 'center', fontWeight: '500' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.md },

  perfilChange: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
  },
  perfilChangeIcon: { fontSize: 28 },
  perfilChangeMsg:  { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  perfilRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perfilBadge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  perfilBadgeText:  { fontSize: 12, fontWeight: '600' },
  arrow:            { color: colors.textMuted, fontSize: 16 },

  perfilCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, padding: spacing.md,
  },
  perfilCardEmoji: { fontSize: 36 },
  perfilCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  perfilCardDesc:  { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  insightCard: {
    backgroundColor: colors.bgElevated, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  insightTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  insightText:  { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  ctaSection: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.accentSoft,
    padding: spacing.lg, marginTop: spacing.lg, alignItems: 'center',
  },
  ctaTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  ctaDesc:  { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  ctaBtn:   { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 32 },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
