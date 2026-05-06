// src/screens/ProgresoScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../utils/theme';
import {
  loadProgress, saveProgress,
  loadSleepLog, saveSleepLog,
  loadStartDate, saveStartDate,
  loadPerfil,
} from '../utils/storage';
import { RUTINAS } from '../data/routines';

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DAYS_HEAD = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

function build14Days(startDate) {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function weekDayIndex(date) {
  return (date.getDay() + 6) % 7;
}

// ─── Barra de sueño ──────────────────────────────────────────────────────────

function SleepBar({ hours, isToday, dayLabel }) {
  const maxH = 10;
  const pct  = hours ? Math.min(hours / maxH, 1) : 0;
  return (
    <View style={bar.wrap}>
      <View style={bar.track}>
        <View style={[
          bar.fill,
          { height: `${pct * 100}%`, backgroundColor: isToday ? colors.accent : colors.accentSoft },
        ]} />
      </View>
      <Text style={bar.label}>{hours ? `${hours}h` : '—'}</Text>
      <Text style={[bar.dayLabel, isToday && { color: colors.accent }]}>{dayLabel}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  wrap:     { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  track:    { width: '100%', height: 72, backgroundColor: colors.bgElevated, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  fill:     { width: '100%', borderRadius: 4 },
  label:    { fontSize: 9,  color: colors.textMuted, marginTop: 3 },
  dayLabel: { fontSize: 8,  color: colors.textMuted, marginTop: 1 },
});

// ─── Celda de día ────────────────────────────────────────────────────────────

function DayCell({ date, isToday, isFuture, isDone, onPress }) {
  return (
    <TouchableOpacity
      style={[
        s.dayCell,
        isDone   && s.dayCellDone,
        isToday  && s.dayCellToday,
        isFuture && s.dayCellFuture,
      ]}
      onPress={!isFuture ? onPress : undefined}
      activeOpacity={isFuture ? 1 : 0.7}
    >
      <Text style={[s.dayNum, isDone && s.dayNumDone, isFuture && s.dayNumFuture]}>
        {date.getDate()}
      </Text>
      {isDone   && <Text style={s.checkmark}>✓</Text>}
      {isToday  && !isDone && <View style={s.todayDot} />}
    </TouchableOpacity>
  );
}

// ─── Fila de semana ───────────────────────────────────────────────────────────

function WeekRow({ days14, weekIdx, today, progress, onToggle }) {
  const startSlice  = weekIdx * 7;
  const slice       = days14.slice(startSlice, startSlice + 7);
  const todayKey    = toKey(today);
  const firstOffset = weekIdx === 0 ? weekDayIndex(slice[0]) : 0;

  return (
    <View>
      <View style={s.weekHead}>
        {DAYS_HEAD.map(d => (
          <Text key={d} style={s.weekHeadText}>{d}</Text>
        ))}
      </View>
      <View style={s.weekGrid}>
        {Array.from({ length: firstOffset }).map((_, i) => (
          <View key={`e-${i}`} style={s.dayCellEmpty} />
        ))}
        {slice.map((date, i) => {
          const key     = toKey(date);
          const isToday = key === todayKey;
          const isFuture= date > today && !isToday;
          const idx     = startSlice + i;
          return (
            <DayCell
              key={key} date={date}
              isToday={isToday} isFuture={isFuture}
              isDone={progress[idx]}
              onPress={() => onToggle(idx)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Banner: período finalizado ───────────────────────────────────────────────

function FinishedBanner({ onVerResumen }) {
  return (
    <View style={s.finishedBanner}>
      <Text style={s.finishedEmoji}>🎉</Text>
      <Text style={s.finishedTitle}>¡Completaste los 14 días!</Text>
      <Text style={s.finishedSub}>
        Revisa tu resumen, compara tu perfil y comienza un nuevo ciclo con una rutina actualizada.
      </Text>
      <TouchableOpacity style={s.finishedBtn} onPress={onVerResumen} activeOpacity={0.85}>
        <Text style={s.finishedBtnText}>Ver mi resumen y reiniciar →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ProgresoScreen({ navigation }) {
  const [progress,  setProgress]  = useState(new Array(14).fill(false));
  const [sleepLog,  setSleepLog]  = useState(new Array(14).fill(null));
  const [perfil,    setPerfil]    = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [logInput,  setLogInput]  = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadProgress(), loadSleepLog(), loadStartDate(), loadPerfil()])
        .then(async ([prog, log, start, perf]) => {
          setProgress(prog);
          setSleepLog(log);
          setPerfil(perf);
          if (start) {
            const d = new Date(start);
            d.setHours(0, 0, 0, 0);
            setStartDate(d);
          } else {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            await saveStartDate(now.toISOString());
            setStartDate(now);
          }
        });
    }, [])
  );

  const days14   = startDate ? build14Days(startDate) : [];
  const todayKey = toKey(today);

  // ¿Terminaron los 14 días? (hoy es posterior al último día)
  const lastDay      = days14.length === 14 ? days14[13] : null;
  const cycleFinished= lastDay ? today > lastDay : false;

  const todayIdx       = days14.findIndex(d => toKey(d) === todayKey);
  const activeTodayIdx = todayIdx === -1 ? null : todayIdx;

  const toggleDay = async (idx) => {
    const updated = [...progress];
    updated[idx] = !updated[idx];
    setProgress(updated);
    await saveProgress(updated);
  };

  const logSleep = async () => {
    const h = parseFloat(logInput);
    if (!h || h <= 0 || h > 14) {
      Alert.alert('Valor inválido', 'Ingresa un número entre 1 y 14.');
      return;
    }
    if (activeTodayIdx === null) {
      Alert.alert('Fuera del período', 'Hoy no está dentro de tus 14 días.');
      return;
    }
    const updated = [...sleepLog];
    updated[activeTodayIdx] = h;
    setSleepLog(updated);
    await saveSleepLog(updated);
    setLogInput('');
  };

  // Métricas
  const done = progress.filter(Boolean).length;
  const pct  = Math.round((done / 14) * 100);

  let racha = 0;
  const baseIdx = activeTodayIdx !== null ? activeTodayIdx : 13;
  for (let i = baseIdx; i >= 0; i--) { if (progress[i]) racha++; else break; }

  const avgSleep = (() => {
    const filled = sleepLog.filter(h => h !== null);
    if (!filled.length) return null;
    return (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1);
  })();

  const statusColor = pct >= 70 ? colors.success : pct >= 40 ? colors.warn : colors.danger;
  const statusLabel = pct >= 70 ? '¡Excelente progreso!' : pct >= 40 ? 'Buen esfuerzo' : 'Apenas iniciando';
  const rutina      = perfil ? RUTINAS[perfil] : null;

  const periodoLabel = (() => {
    if (!startDate || days14.length < 14) return '';
    const end = days14[13];
    const sm  = MONTHS_ES[startDate.getMonth()];
    const em  = MONTHS_ES[end.getMonth()];
    if (sm === em) return `${startDate.getDate()} – ${end.getDate()} de ${sm} ${end.getFullYear()}`;
    return `${startDate.getDate()} ${sm} – ${end.getDate()} ${em} ${end.getFullYear()}`;
  })();

  const semanaLabel = (() => {
    if (!startDate) return '';
    const diffDays = Math.floor((today - startDate) / 86400000);
    if (diffDays < 0)  return 'El período aún no comienza';
    if (diffDays < 7)  return `Semana 1 · Día ${diffDays + 1}`;
    if (diffDays < 14) return `Semana 2 · Día ${diffDays + 1}`;
    return 'Período de 14 días completado ✓';
  })();

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

      {/* Banner de ciclo finalizado */}
      {cycleFinished && (
        <FinishedBanner onVerResumen={() => navigation.navigate('Resumen')} />
      )}

      {/* Resumen */}
      <View style={s.summaryCard}>
        <View style={[s.statusPill, { backgroundColor: statusColor + '22' }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {rutina && <Text style={s.perfilText}>Perfil: {rutina.label} {rutina.emoji}</Text>}
        <Text style={s.pctBig}>{pct}%</Text>
        <View style={s.trackBg}>
          <View style={[s.trackFill, { width: `${pct}%`, backgroundColor: statusColor }]} />
        </View>
        <Text style={s.pctSub}>{done} de 14 días completados</Text>
        {semanaLabel ? <Text style={s.semanaLabel}>{semanaLabel}</Text> : null}
      </View>

      {/* Métricas */}
      <View style={s.metricRow}>
        <View style={s.metric}>
          <Text style={s.metricVal}>{racha}</Text>
          <Text style={s.metricLabel}>Racha{'\n'}(días)</Text>
        </View>
        <View style={s.metric}>
          <Text style={s.metricVal}>{avgSleep ?? '—'}</Text>
          <Text style={s.metricLabel}>Promedio{'\n'}sueño (h)</Text>
        </View>
        <View style={s.metric}>
          <Text style={s.metricVal}>{Math.max(0, 14 - done)}</Text>
          <Text style={s.metricLabel}>Días{'\n'}restantes</Text>
        </View>
      </View>

      {/* Calendario */}
      {days14.length > 0 && (
        <>
          <View style={s.calHeader}>
            <Text style={s.sectionLabel}>Calendario</Text>
            <Text style={s.periodoText}>{periodoLabel}</Text>
          </View>

          <Text style={s.weekTitle}>Semana 1</Text>
          <WeekRow days14={days14} weekIdx={0} today={today} progress={progress} onToggle={toggleDay} />

          <Text style={[s.weekTitle, { marginTop: spacing.md }]}>Semana 2</Text>
          <WeekRow days14={days14} weekIdx={1} today={today} progress={progress} onToggle={toggleDay} />
        </>
      )}

      {/* Gráfica */}
      <Text style={[s.sectionLabel, { marginTop: spacing.lg }]}>Horas de sueño registradas</Text>
      <View style={s.chartRow}>
        {sleepLog.map((h, i) => {
          const date    = days14[i];
          const isToday = date ? toKey(date) === todayKey : false;
          const dayLabel= date ? `${date.getDate()}/${date.getMonth() + 1}` : `D${i + 1}`;
          return <SleepBar key={i} hours={h} isToday={isToday} dayLabel={dayLabel} />;
        })}
      </View>

      {/* Registro diario — oculto si el ciclo terminó */}
      {!cycleFinished && (
        <View style={s.logCard}>
          <Text style={s.logTitle}>
            Registrar horas dormidas hoy
            {activeTodayIdx !== null ? ` · ${today.getDate()} de ${MONTHS_ES[today.getMonth()]}` : ''}
          </Text>
          <View style={s.logRow}>
            <TextInput
              style={s.logInput}
              value={logInput}
              onChangeText={setLogInput}
              placeholder="ej. 7.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={s.logBtn} onPress={logSleep} activeOpacity={0.85}>
              <Text style={s.logBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          {activeTodayIdx !== null && sleepLog[activeTodayIdx] !== null && (
            <Text style={s.loggedText}>✓ Registrado hoy: {sleepLog[activeTodayIdx]}h</Text>
          )}
        </View>
      )}

      {/* Botón resumen siempre visible si ciclo terminó */}
      {cycleFinished && (
        <TouchableOpacity
          style={s.resumenBtn}
          onPress={() => navigation.navigate('Resumen')}
          activeOpacity={0.85}
        >
          <Text style={s.resumenBtnText}>🏆 Ver resumen completo →</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: colors.bg },
  container:  { padding: spacing.md },

  finishedBanner: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.accent + '55',
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
  },
  finishedEmoji: { fontSize: 48, marginBottom: 8 },
  finishedTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  finishedSub:   { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  finishedBtn:   { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 24 },
  finishedBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  summaryCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
  },
  statusPill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, marginBottom: 8 },
  statusDot:   { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  perfilText:  { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  pctBig:      { fontSize: 48, fontWeight: '700', color: colors.textPrimary },
  trackBg:     { width: '100%', height: 6, backgroundColor: colors.bgElevated, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  trackFill:   { height: 6, borderRadius: 3 },
  pctSub:      { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  semanaLabel: { fontSize: 12, color: colors.accent, marginTop: 6, fontWeight: '500' },

  metricRow:   { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metric:      { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  metricVal:   { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  metricLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2, lineHeight: 15 },

  calHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionLabel:{ fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  periodoText: { fontSize: 11, color: colors.textSecondary },
  weekTitle:   { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },

  weekHead:    { flexDirection: 'row', marginBottom: 4 },
  weekHeadText:{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', color: colors.textMuted },
  weekGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty:{ width: '14.28%', aspectRatio: 1 },

  dayCell: {
    width: '14.28%', aspectRatio: 1, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center', padding: 2,
  },
  dayCellDone:   { backgroundColor: colors.successSoft, borderColor: colors.success },
  dayCellToday:  { borderWidth: 2, borderColor: colors.accent },
  dayCellFuture: { opacity: 0.35 },
  dayNum:        { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  dayNumDone:    { color: colors.success },
  dayNumFuture:  { color: colors.textMuted },
  checkmark:     { fontSize: 9, color: colors.success },
  todayDot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 1 },

  chartRow:    { flexDirection: 'row', height: 100, alignItems: 'flex-end', marginBottom: spacing.sm },

  logCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginTop: spacing.lg,
  },
  logTitle:   { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  logRow:     { flexDirection: 'row', gap: spacing.sm },
  logInput: {
    flex: 1, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.sm + 2, color: colors.textPrimary, fontSize: 16,
  },
  logBtn:     { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  logBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  loggedText: { fontSize: 12, color: colors.success, marginTop: spacing.sm },

  resumenBtn: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.accent,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  resumenBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
});
