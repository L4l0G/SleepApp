// src/screens/CuestionarioScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, Modal,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';
import { calcPerfil } from '../data/routines';
import {
  saveForm, savePerfil, loadForm,
  saveStartDate, CYCLE_DAYS,
} from '../utils/storage';
import {
  scheduleWeeklyNotification,
  scheduleDailyReminders,
  requestNotificationPermissions,
} from '../utils/notifications';

const OPTIONS = {
  nivelAcad: [
    { label: 'Licenciatura', value: 'licenciatura' },
    { label: 'Posgrado (maestría / doctorado)', value: 'posgrado' },
  ],
  despFeel: [
    { label: 'Muy mal — siempre agotado/a', value: 'muy_malo' },
    { label: 'Mal — casi siempre cansado/a', value: 'malo' },
    { label: 'Regular — a veces descansado/a', value: 'regular' },
    { label: 'Bien — generalmente descansado/a', value: 'bueno' },
    { label: 'Excelente — siempre con energía', value: 'excelente' },
  ],
  despNoche: [
    { label: 'Nunca', value: 'nunca' },
    { label: 'Rara vez', value: 'rara' },
    { label: 'Ocasionalmente', value: 'ocasional' },
    { label: 'Frecuente', value: 'frecuente' },
    { label: 'Casi siempre', value: 'siempre' },
  ],
  pantallas: [
    { label: 'No uso pantallas', value: 'no' },
    { label: 'Menos de 30 min', value: 'poco' },
    { label: '30 – 60 min', value: 'moderado' },
    { label: 'Más de 1 hora', value: 'mucho' },
  ],
  cafeina: [
    { label: 'No consumo', value: 'no' },
    { label: 'Solo en la mañana', value: 'manana' },
    { label: 'Hasta la tarde (3-6 pm)', value: 'tarde' },
    { label: 'En la noche o trasnochando', value: 'noche' },
  ],
  irregular: [
    { label: 'No, horario consistente', value: 'no' },
    { label: 'Varía ±1 hora a veces', value: 'leve' },
    { label: 'Varía 2-3 horas frecuentemente', value: 'moderado' },
    { label: 'Trasnochadas / recupero el finde', value: 'severo' },
  ],
};

function SelectGroup({ label, field, options, value, onChange }) {
  return (
    <View style={s.formGroup}>
      <Text style={s.label}>{label}</Text>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[s.option, value === opt.value && s.optionSelected]}
          onPress={() => onChange(field, opt.value)}
          activeOpacity={0.7}
        >
          <View style={[s.optionDot, value === opt.value && s.optionDotSelected]} />
          <Text style={[s.optionText, value === opt.value && s.optionTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SliderRow({ label, value, min, max, step, format, onChange }) {
  const decrement = () => onChange(Math.max(min, parseFloat((value - step).toFixed(1))));
  const increment = () => onChange(Math.min(max, parseFloat((value + step).toFixed(1))));
  return (
    <View style={s.formGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={s.sliderRow}>
        <TouchableOpacity style={s.sliderBtn} onPress={decrement}>
          <Text style={s.sliderBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.sliderVal}>{format(value)}</Text>
        <TouchableOpacity style={s.sliderBtn} onPress={increment}>
          <Text style={s.sliderBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={s.trackBg}>
        <View style={[s.trackFill, { width: `${((value - min) / (max - min)) * 100}%` }]} />
      </View>
    </View>
  );
}

const INITIAL_FORM = {
  nivelAcad:      '',
  horas:          6,
  despFeel:       '',
  despNoche:      '',
  horaAcostarse:  '00:00',
  pantallas:      '',
  estres:         5,
  cafeina:        '',
  irregular:      '',
};

export default function CuestionarioScreen({ navigation }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerHours, setPickerHours] = useState(6);
  const [pickerMins, setPickerMins] = useState(0);

  useEffect(() => {
    loadForm().then(saved => { if (saved) setForm(saved); });
  }, []);

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const openSleepPicker = () => {
    const h = form.horas;
    const hrs = Math.floor(h);
    const mns = Math.round((h - hrs) * 60);
    setPickerHours(hrs);
    setPickerMins(mns);
    setPickerVisible(true);
  };

  const confirmSleepHours = () => {
    const h = parseFloat((pickerHours + pickerMins / 60).toFixed(2));
    setField('horas', h);
    setPickerVisible(false);
  };

  const handleSubmit = async () => {
    const required = ['nivelAcad', 'despFeel', 'despNoche', 'pantallas', 'cafeina', 'irregular'];
    const missing  = required.filter(k => !form[k]);
    if (missing.length > 0) {
      Alert.alert('Campos incompletos', 'Por favor responde todas las preguntas.');
      return;
    }

    const perfil   = calcPerfil(form);
    const now      = new Date();
    now.setHours(0, 0, 0, 0);

    await saveForm(form);
    await savePerfil(perfil);
    await saveStartDate(now.toISOString());

    // Solicitar permisos y programar notificaciones del ciclo
    const granted = await requestNotificationPermissions();
    if (granted) {
      await scheduleWeeklyNotification(now);
      await scheduleDailyReminders(now);
    }

    navigation.navigate('Rutina', { form, perfil });
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Text style={s.heroEmoji}>🌙</Text>
        <Text style={s.heroTitle}>Cuestionario de sueño</Text>
        <Text style={s.heroSub}>Para estudiantes universitarios y de posgrado</Text>
        <View style={s.cycleBadge}>
          <Text style={s.cycleBadgeText}>🔄 Ciclo semanal · {CYCLE_DAYS} días</Text>
        </View>
      </View>

      <SelectGroup label="Nivel académico" field="nivelAcad" options={OPTIONS.nivelAcad} value={form.nivelAcad} onChange={setField} />

      <View style={s.formGroup}>
        <Text style={s.label}>Horas de sueño promedio por noche</Text>
        <TouchableOpacity
          style={s.pickerTrigger}
          onPress={openSleepPicker}
          activeOpacity={0.8}
        >
          <Text style={s.pickerTriggerIcon}>🕐</Text>
          <View>
            <Text style={s.pickerTriggerLabel}>
              {Math.floor(form.horas)}h {Math.round((form.horas % 1) * 60)}min
            </Text>
            <Text style={s.pickerTriggerSub}>Toca para cambiar</Text>
          </View>
          <Text style={s.pickerChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <SelectGroup label="¿Cómo te sientes al despertar?" field="despFeel" options={OPTIONS.despFeel} value={form.despFeel} onChange={setField} />

      <View style={s.formGroup}>
        <Text style={s.label}>Hora aproximada a la que te duermes</Text>
        <TextInput
          style={s.textInput}
          value={form.horaAcostarse}
          onChangeText={v => setField('horaAcostarse', v)}
          placeholder="ej. 23:30 o 01:00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      <SelectGroup label="¿Con qué frecuencia te despiertas en la noche?" field="despNoche" options={OPTIONS.despNoche} value={form.despNoche} onChange={setField} />
      <SelectGroup label="Uso de pantallas antes de dormir" field="pantallas" options={OPTIONS.pantallas} value={form.pantallas} onChange={setField} />

      <SliderRow
        label="Nivel de estrés académico"
        value={form.estres} min={1} max={10} step={1}
        format={v => `${v} / 10`}
        onChange={v => setField('estres', v)}
      />

      <SelectGroup label="¿Consumes cafeína (café, energéticas, etc.)?" field="cafeina" options={OPTIONS.cafeina} value={form.cafeina} onChange={setField} />
      <SelectGroup label="¿Tienes horario irregular de sueño?" field="irregular" options={OPTIONS.irregular} value={form.irregular} onChange={setField} />

      {/* Modal picker de horas de sueño */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>¿Cuántas horas duermes?</Text>

            <View style={s.pickerRow}>
              {/* Columna horas */}
              <View style={s.pickerCol}>
                <Text style={s.pickerColLabel}>Horas</Text>
                <ScrollView
                  style={s.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
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

              {/* Separador */}
              <Text style={s.pickerSep}>:</Text>

              {/* Columna minutos */}
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

            {/* Previsualización */}
            <View style={s.previewRow}>
              <Text style={s.previewText}>
                {pickerHours}h {String(pickerMins).padStart(2, '0')}min
              </Text>
            </View>

            {/* Botones */}
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalBtnSecondary}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={s.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnPrimary}
                onPress={confirmSleepHours}
              >
                <Text style={s.modalBtnPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
        <Text style={s.submitText}>Ver mi rutina personalizada →</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md },

  hero:      { alignItems: 'center', paddingVertical: spacing.xl },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  heroSub:   { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  cycleBadge:     { marginTop: 12, backgroundColor: colors.accentGlow, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 5, borderWidth: 1, borderColor: colors.accentSoft },
  cycleBadgeText: { fontSize: 12, color: colors.accent, fontWeight: '600' },

  formGroup: { marginBottom: spacing.lg },
  label:     { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '500' },

  option: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.sm + 4, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard, marginBottom: 6,
  },
  optionSelected:     { borderColor: colors.accent, backgroundColor: colors.accentGlow },
  optionDot:          { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.textMuted, marginRight: 10 },
  optionDotSelected:  { borderColor: colors.accent, backgroundColor: colors.accent },
  optionText:         { fontSize: 14, color: colors.textSecondary, flex: 1 },
  optionTextSelected: { color: colors.textPrimary },

  sliderRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sliderBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  sliderBtnText: { color: colors.textPrimary, fontSize: 20, fontWeight: '300' },
  sliderVal:     { fontSize: 22, fontWeight: '600', color: colors.textPrimary, width: 80, textAlign: 'center' },
  trackBg:       { height: 6, backgroundColor: colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  trackFill:     { height: 6, backgroundColor: colors.accent, borderRadius: 3 },

  textInput: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.sm + 4,
    color: colors.textPrimary, fontSize: 15,
  },

  submitBtn:  { backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Picker de horas
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
