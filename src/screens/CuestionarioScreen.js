// src/screens/CuestionarioScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, Platform,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';
import { calcPerfil } from '../data/routines';
import { saveForm, savePerfil, loadForm, saveStartDate } from '../utils/storage';

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
  // Simulamos slider con botones +/- para compatibilidad máxima
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
      {/* Barra visual */}
      <View style={s.trackBg}>
        <View style={[s.trackFill, { width: `${((value - min) / (max - min)) * 100}%` }]} />
      </View>
    </View>
  );
}

const INITIAL_FORM = {
  nivelAcad: '',
  horas: 6,
  despFeel: '',
  despNoche: '',
  horaAcostarse: '00:00',
  pantallas: '',
  estres: 5,
  cafeina: '',
  irregular: '',
};

export default function CuestionarioScreen({ navigation }) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    loadForm().then(saved => { if (saved) setForm(saved); });
  }, []);

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const required = ['nivelAcad', 'despFeel', 'despNoche', 'pantallas', 'cafeina', 'irregular'];
    const missing = required.filter(k => !form[k]);
    if (missing.length > 0) {
      Alert.alert('Campos incompletos', 'Por favor responde todas las preguntas.');
      return;
    }

    const perfil = calcPerfil(form);
    await saveForm(form);
    await savePerfil(perfil);
    await saveStartDate(new Date().toISOString());
    navigation.navigate('Rutina', { form, perfil });
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Text style={s.heroEmoji}>🌙</Text>
        <Text style={s.heroTitle}>Cuestionario de sueño</Text>
        <Text style={s.heroSub}>Para estudiantes universitarios y de posgrado</Text>
      </View>

      {/* Nivel académico */}
      <SelectGroup
        label="Nivel académico"
        field="nivelAcad"
        options={OPTIONS.nivelAcad}
        value={form.nivelAcad}
        onChange={setField}
      />

      {/* Horas de sueño */}
      <SliderRow
        label="Horas de sueño promedio por noche"
        value={form.horas}
        min={2} max={12} step={0.5}
        format={v => `${parseFloat(v).toFixed(1)} h`}
        onChange={v => setField('horas', v)}
      />

      {/* Cómo te sientes */}
      <SelectGroup
        label="¿Cómo te sientes al despertar?"
        field="despFeel"
        options={OPTIONS.despFeel}
        value={form.despFeel}
        onChange={setField}
      />

      {/* Hora de dormir */}
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

      {/* Despertar nocturno */}
      <SelectGroup
        label="¿Con qué frecuencia te despiertas en la noche?"
        field="despNoche"
        options={OPTIONS.despNoche}
        value={form.despNoche}
        onChange={setField}
      />

      {/* Pantallas */}
      <SelectGroup
        label="Uso de pantallas antes de dormir"
        field="pantallas"
        options={OPTIONS.pantallas}
        value={form.pantallas}
        onChange={setField}
      />

      {/* Estrés */}
      <SliderRow
        label="Nivel de estrés académico"
        value={form.estres}
        min={1} max={10} step={1}
        format={v => `${v} / 10`}
        onChange={v => setField('estres', v)}
      />

      {/* Cafeína */}
      <SelectGroup
        label="¿Consumes cafeína (café, energéticas, etc.)?"
        field="cafeina"
        options={OPTIONS.cafeina}
        value={form.cafeina}
        onChange={setField}
      />

      {/* Irregularidad */}
      <SelectGroup
        label="¿Tienes horario irregular de sueño?"
        field="irregular"
        options={OPTIONS.irregular}
        value={form.irregular}
        onChange={setField}
      />

      <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
        <Text style={s.submitText}>Ver mi rutina personalizada →</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md },

  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  heroSub: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },

  formGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '500' },

  option: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.sm + 4, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard, marginBottom: 6,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.accentGlow },
  optionDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: colors.textMuted, marginRight: 10,
  },
  optionDotSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  optionText: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  optionTextSelected: { color: colors.textPrimary },

  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sliderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  sliderBtnText: { color: colors.textPrimary, fontSize: 20, fontWeight: '300' },
  sliderVal: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, width: 80, textAlign: 'center' },
  trackBg: { height: 6, backgroundColor: colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },

  textInput: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.sm + 4,
    color: colors.textPrimary, fontSize: 15,
  },

  submitBtn: {
    backgroundColor: colors.accent, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
