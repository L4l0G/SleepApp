// src/screens/ProgresoScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../utils/theme';
import {
  loadProgress, saveProgress,
  loadSleepLog, saveSleepLog,
  loadStartDate, saveStartDate,
  loadPerfil, CYCLE_DAYS,
} from '../utils/storage';
import { RUTINAS } from '../data/routines';
import { useAuth } from '../context/AuthContext';

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];
const DAYS_HEAD = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function toKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildCycleDays(startDate) {
  return Array.from({ length: CYCLE_DAYS }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function weekDayIndex(date) {
  return (date.getDay() + 6) % 7;
}

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
      {isDone  && <Text style={s.checkmark}>✓</Text>}
      {isToday && !isDone && <View style={s.todayDot} />}
    </TouchableOpacity>
  );
}

function FinishedBanner({ onVerResumen }) {
  return (
    <View style={s.finishedBanner}>
      <Text style={s.finishedEmoji}>🎉</Text>
      <Text style={s.finishedTitle}>¡Completaste la semana!</Text>
      <Text style={s.finishedSub}>
        Revisa tu resumen, compara tu perfil y comienza una nueva semana con una rutina actualizada.
      </Text>
      <TouchableOpacity style={s.finishedBtn} onPress={onVerResumen} activeOpacity={0.85}>
        <Text style={s.finishedBtnText}>Ver mi resumen y reiniciar →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProgresoScreen({ navigation }) {
  const [progress,  setProgress]  = useState(new Array(CYCLE_DAYS).fill(false));
  const [sleepLog,  setSleepLog]  = useState(new Array(CYCLE_DAYS).fill(null));
  const [perfil,    setPerfil]    = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerHours,   setPickerHours]   = useState(7);
  const [pickerMins,    setPickerMins]    = useState(0);
  const { user } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Resetear estado cuando cambia el usuario (logout / cambio de cuenta)
  useEffect(() => {
    if (!user) {
      setProgress(new Array(CYCLE_DAYS).fill(false));
      setSleepLog(new Array(CYCLE_DAYS).fill(null));
      setPerfil(null);
      setStartDate(null);
    }
  }, [user]);

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

  const cycleDays  = startDate ? buildCycleDays(startDate) : [];
  const todayKey   = toKey(today);
  const lastDay    = cycleDays.length === CYCLE_DAYS ? cycleDays[CYCLE_DAYS - 1] : null;
  const cycleFinished = lastDay ? today > lastDay : false;

  const todayIdx       = cycleDays.findIndex(d => toKey(d) === todayKey);
  const activeTodayIdx = todayIdx === -1 ? null : todayIdx;

  const toggleDay = async (idx) => {
    const updated = [...progress];
    updated[idx] = !updated[idx];
    setProgress(updated);
    await saveProgress(updated);
  };

  const confirmSleep = async () => {
    if (activeTodayIdx === null) {
      Alert.alert('Fuera del período', 'Hoy no está dentro de tu semana de seguimiento.');
      return;
    }
    const h = parseFloat((pickerHours + pickerMins / 60).toFixed(2));
    const updated = [...sleepLog];
    updated[activeTodayIdx] = h;
    setSleepLog(updated);
    await saveSleepLog(updated);
    setPickerVisible(false);
  };

  const done = progress.filter(Boolean).length;
  const pct  = Math.round((done / CYCLE_DAYS) * 100);

  let racha = 0;
  const baseIdx = activeTodayIdx !== null ? activeTodayIdx : CYCLE_DAYS - 1;
  for (let i = baseIdx; i >= 0; i--) { if (progress[i]) racha++; else break; }

  const avgSleep = (() => {
    const filled = sleepLog.filter(h => h !== null);
    if (!filled.length) return null;
    return (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1);
  })();

  const statusColor = pct >= 70 ? colors.success : pct >= 40 ? colors.warn : colors.danger;
  const statusLabel = pct >= 70 ? '¡Excelente semana!' : pct >= 40 ? 'Buen esfuerzo' : 'Apenas iniciando';
  const rutina      = perfil ? RUTINAS[perfil] : null;

  const periodoLabel = (() => {
    if (!startDate || cycleDays.length < CYCLE_DAYS) return '';
    const end = cycleDays[CYCLE_DAYS - 1];
    const sm  = MONTHS_ES[startDate.getMonth()];
    const em  = MONTHS_ES[end.getMonth()];
    if (sm === em) return `${startDate.getDate()} – ${end.getDate()} de ${sm} ${end.getFullYear()}`;
    return `${startDate.getDate()} ${sm} – ${end.getDate()} ${em} ${end.getFullYear()}`;
  })();

  const diaLabel = (() => {
    if (!startDate) return '';
    const diff = Math.floor((today - startDate) / 86400000);
    if (diff < 0)            return 'El período aún no comienza';
    if (diff < CYCLE_DAYS)   return `Semana en curso · Día ${diff + 1} de ${CYCLE_DAYS}`;
    return 'Semana completada ✓';
  })();

  const firstOffset = cycleDays.length > 0 ? weekDayIndex(cycleDays[0]) : 0;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

      {cycleFinished && (
        <FinishedBanner onVerResumen={() => navigation.navigate('Resumen')} />
      )}

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
        <Text style={s.pctSub}>{done} de {CYCLE_DAYS} días completados</Text>
        {diaLabel ? <Text style={s.semanaLabel}>{diaLabel}</Text> : null}
      </View>

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
          <Text style={s.metricVal}>{Math.max(0, CYCLE_DAYS - done)}</Text>
          <Text style={s.metricLabel}>Días{'\n'}restantes</Text>
        </View>
      </View>

      {cycleDays.length > 0 && (
        <>
          <View style={s.calHeader}>
            <Text style={s.sectionLabel}>Esta semana</Text>
            <Text style={s.periodoText}>{periodoLabel}</Text>
          </View>

          <View style={s.weekHead}>
            {DAYS_HEAD.map(d => (
              <Text key={d} style={s.weekHeadText}>{d}</Text>
            ))}
          </View>

          <View style={s.weekGrid}>
            {Array.from({ length: firstOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={s.dayCellEmpty} />
            ))}
            {cycleDays.map((date, idx) => {
              const key      = toKey(date);
              const isToday  = key === todayKey;
              const isFuture = date > today && !isToday;
              return (
                <DayCell
                  key={key} date={date}
                  isToday={isToday} isFuture={isFuture}
                  isDone={progress[idx]}
                  onPress={() => toggleDay(idx)}
                />
              );
            })}
          </View>
        </>
      )}

      <Text style={[s.sectionLabel, { marginTop: spacing.lg }]}>Horas de sueño esta semana</Text>
      <View style={s.chartRow}>
        {sleepLog.map((h, i) => {
          const date     = cycleDays[i];
          const isToday  = date ? toKey(date) === todayKey : false;
          const dayLabel = date
            ? DAYS_HEAD[(date.getDay() + 6) % 7]
            : `D${i + 1}`;
          return <SleepBar key={i} hours={h} isToday={isToday} dayLabel={dayLabel} />;
        })}
      </View>

      {!cycleFinished && (
        <View style={s.logCard}>
          <Text style={s.logTitle}>
            Registrar horas dormidas hoy
            {activeTodayIdx !== null
              ? ` · ${today.getDate()} de ${MONTHS_ES[today.getMonth()]}`
              : ''}
          </Text>

          <TouchableOpacity
            style={s.pickerTrigger}
            onPress={() => {
              if (activeTodayIdx !== null && sleepLog[activeTodayIdx] !== null) {
                const h   = sleepLog[activeTodayIdx];
                const hrs = Math.floor(h);
                const mns = Math.round((h - hrs) * 60);
                setPickerHours(hrs);
                setPickerMins(mns);
              }
              setPickerVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={s.pickerTriggerIcon}>🕐</Text>
            <View>
              <Text style={s.pickerTriggerLabel}>
                {activeTodayIdx !== null && sleepLog[activeTodayIdx] !== null
                  ? `${Math.floor(sleepLog[activeTodayIdx])}h ${Math.round((sleepLog[activeTodayIdx] % 1) * 60)}min`
                  : 'Seleccionar horas'}
              </Text>
              <Text style={s.pickerTriggerSub}>Toca para cambiar</Text>
            </View>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>

          {activeTodayIdx !== null && sleepLog[activeTodayIdx] !== null && (
            <Text style={s.loggedText}>
              ✓ Registrado: {Math.floor(sleepLog[activeTodayIdx])}h {Math.round((sleepLog[activeTodayIdx] % 1) * 60)}min
            </Text>
          )}
        </View>
      )}

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>¿Cuánto dormiste anoche?</Text>

            <View style={s.pickerRow}>
              <View style={s.pickerCol}>
                <Text style={s.pickerColLabel}>Horas</Text>
                <ScrollView
                  style={s.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                >
                  {Array.from({ length: 13 }, (_, i) => i + 1).map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[s.pickerItem, pickerHours === h && s.pickerItemSelected]}
                      onPress={() => setPickerHours(h)}
                    >
                      <Text style={[s.pickerItemText, pickerHours === h && s.pickerItemTextSelected]}>
                        {h}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={s.pickerSep}>:</Text>

              <View style={s.pickerCol}>
                <Text style={s.pickerColLabel}>Minutos</Text>
                <ScrollView
                  style={s.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                >
                  {[0, 15, 30, 45].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[s.pickerItem, pickerMins === m && s.pickerItemSelected]}
                      onPress={() => setPickerMins(m)}
                    >
                      <Text style={[s.pickerItemText, pickerMins === m && s.pickerItemTextSelected]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={s.previewRow}>
              <Text style={s.previewText}>
                {pickerHours}h {String(pickerMins).padStart(2, '0')}min
              </Text>
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalBtnSecondary}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={s.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnPrimary}
                onPress={confirmSleep}
              >
                <Text style={s.modalBtnPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  scroll:    { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md },

  finishedBanner: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.accent + '55',
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
  },
  finishedEmoji:   { fontSize: 48, marginBottom: 8 },
  finishedTitle:   { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  finishedSub:     { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  finishedBtn:     { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 24 },
  finishedBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

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

  metricRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metric:    { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  metricVal:   { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  metricLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2, lineHeight: 15 },

  calHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  periodoText:  { fontSize: 11, color: colors.textSecondary },

  weekHead:     { flexDirection: 'row', marginBottom: 4 },
  weekHeadText: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', color: colors.textMuted },
  weekGrid:     { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  dayCellEmpty: { width: '14.28%', aspectRatio: 1 },

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

  chartRow: { flexDirection: 'row', height: 100, alignItems: 'flex-end', marginBottom: spacing.sm },

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

  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    padding: spacing.md,
  },
  pickerTriggerIcon:  { fontSize: 28 },
  pickerTriggerLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  pickerTriggerSub:   { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pickerChevron:      { fontSize: 24, color: colors.textMuted, marginLeft: 'auto' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl, padding: spacing.lg,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 17, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.lg,
  },

  pickerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  pickerCol:     { alignItems: 'center', width: 110 },
  pickerColLabel:{ fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  pickerScroll:  { height: 200, width: '100%' },
  pickerItem: {
    paddingVertical: 12, alignItems: 'center',
    borderRadius: radius.md, marginBottom: 4,
  },
  pickerItemSelected:  { backgroundColor: colors.accentGlow, borderWidth: 1, borderColor: colors.accent },
  pickerItemText:      { fontSize: 20, color: colors.textSecondary, fontWeight: '400' },
  pickerItemTextSelected: { color: colors.accent, fontWeight: '700' },
  pickerSep:     { fontSize: 28, color: colors.textMuted, marginTop: 28 },

  previewRow:  { alignItems: 'center', marginVertical: spacing.md },
  previewText: { fontSize: 32, fontWeight: '700', color: colors.textPrimary },

  modalBtns:          { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalBtnSecondary:  { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.bgElevated, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  modalBtnSecondaryText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },
  modalBtnPrimary:    { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: 'center' },
  modalBtnPrimaryText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});