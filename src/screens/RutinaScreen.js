// src/screens/RutinaScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';
import { RUTINAS } from '../data/routines';
import { loadForm, loadPerfil } from '../utils/storage';

function RoutineCard({ card }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      <View style={s.cardHeader}>
        <View style={s.cardLeft}>
          <Text style={s.cardIcon}>{card.icon}</Text>
          <View style={{ flex: 1 }}>
            <View style={[s.badge, { backgroundColor: card.badgeColor + '22' }]}>
              <Text style={[s.badgeText, { color: card.badgeColor }]}>{card.badge}</Text>
            </View>
            <Text style={s.cardTitle}>{card.title}</Text>
          </View>
        </View>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      <Text style={s.cardDesc}>{card.desc}</Text>
      {expanded && (
        <View style={s.ejerciciosList}>
          {card.ejercicios.map((ej, i) => (
            <View key={i} style={s.ejercicioRow}>
              <View style={[s.dot, { backgroundColor: card.badgeColor }]} />
              <Text style={s.ejercicioText}>{ej}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function RutinaScreen({ route, navigation }) {
  const [perfil, setPerfil] = useState(route?.params?.perfil ?? null);
  const [form, setForm] = useState(route?.params?.form ?? null);

  useEffect(() => {
    if (!perfil) {
      Promise.all([loadPerfil(), loadForm()]).then(([p, f]) => {
        setPerfil(p);
        setForm(f);
      });
    }
  }, []);

  if (!perfil || !form) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>🌙</Text>
        <Text style={s.emptyText}>Completa el cuestionario para ver tu rutina</Text>
        <TouchableOpacity
          style={s.emptyBtn}
          onPress={() => navigation.navigate('Cuestionario')}
        >
          <Text style={s.emptyBtnText}>Ir al cuestionario →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rutina = RUTINAS[perfil];
  const nivel = form.nivelAcad === 'posgrado' ? 'posgrado' : 'licenciatura';
  const tip = rutina.tip[nivel];

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={[s.hero, { borderColor: rutina.color + '55' }]}>
        <Text style={s.heroEmoji}>{rutina.emoji}</Text>
        <View style={[s.perfilBadge, { backgroundColor: rutina.colorSoft }]}>
          <Text style={[s.perfilBadgeText, { color: rutina.color }]}>{rutina.label}</Text>
        </View>
        <Text style={s.heroTitle}>{rutina.desc}</Text>
      </View>

      {/* Tip */}
      <View style={s.tipBox}>
        <Text style={s.tipIcon}>💡</Text>
        <Text style={s.tipText}>{tip}</Text>
      </View>

      {/* Cards */}
      <Text style={s.sectionLabel}>Tus rutinas</Text>
      {rutina.cards.map(card => (
        <RoutineCard key={card.id} card={card} />
      ))}

      {/* CTA progreso */}
      <TouchableOpacity
        style={s.ctaBtn}
        onPress={() => navigation.navigate('Progreso')}
        activeOpacity={0.85}
      >
        <Text style={s.ctaText}>Registrar mi progreso →</Text>
      </TouchableOpacity>

      {/* Re-hacer cuestionario */}
      <TouchableOpacity
        style={s.secondaryBtn}
        onPress={() => navigation.navigate('Cuestionario')}
        activeOpacity={0.7}
      >
        <Text style={s.secondaryText}>← Editar cuestionario</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md },

  hero: {
    alignItems: 'center', paddingVertical: spacing.xl,
    borderWidth: 1, borderRadius: radius.xl,
    backgroundColor: colors.bgCard, marginBottom: spacing.md,
  },
  heroEmoji: { fontSize: 48, marginBottom: spacing.sm },
  perfilBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: radius.full, marginBottom: 10 },
  perfilBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },

  tipBox: {
    flexDirection: 'row', backgroundColor: colors.accentGlow,
    borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accentSoft,
  },
  tipIcon: { fontSize: 18, marginRight: 10, marginTop: 1 },
  tipText: { fontSize: 13, color: colors.accent, flex: 1, lineHeight: 20 },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },

  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', flex: 1, gap: 10, alignItems: 'flex-start' },
  cardIcon: { fontSize: 26, marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, marginBottom: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  chevron: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  cardDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 8, lineHeight: 18 },

  ejerciciosList: { marginTop: 12, borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 },
  ejercicioRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: 10, flexShrink: 0 },
  ejercicioText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 },

  ctaBtn: {
    backgroundColor: colors.accent, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  secondaryBtn: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  secondaryText: { color: colors.textSecondary, fontSize: 14 },

  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg },
  emptyBtn: { backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.md, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
