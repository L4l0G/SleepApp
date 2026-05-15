// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      Alert.alert('Error de inicio de sesión', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Ingresa tu email para restablecer contraseña');
      return;
    }
    // Aquí iría la lógica de reset de contraseña
    Alert.alert('Verificar email', 'Se envió un enlace de recuperación a tu email');
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Text style={s.heroEmoji}>🌙</Text>
        <Text style={s.heroTitle}>SleepApp</Text>
        <Text style={s.heroSub}>Mejora tu sueño, mejora tu vida</Text>
      </View>

      <View style={s.formCard}>
        <Text style={s.formTitle}>Iniciar sesión</Text>

        <View style={s.formGroup}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={s.formGroup}>
          <Text style={s.label}>Contraseña</Text>
          <View style={s.passwordContainer}>
            <TextInput
              style={s.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={s.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[s.loginBtn, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.loginBtnText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetPassword}>
          <Text style={s.forgotPassword}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>¿No tienes cuenta?</Text>
        <View style={s.dividerLine} />
      </View>

      <TouchableOpacity
        style={s.registerBtn}
        onPress={() => navigation.navigate('Registro')}
        activeOpacity={0.85}
      >
        <Text style={s.registerBtnText}>Crear cuenta →</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md },

  hero:      { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.lg },
  heroEmoji: { fontSize: 64, marginBottom: 16 },
  heroTitle: { fontSize: 32, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  heroSub:   { fontSize: 16, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },

  formCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },

  formGroup: { marginBottom: spacing.md },
  label:     { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '500' },
  input: {
    backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    color: colors.textPrimary, fontSize: 15,
  },

  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingRight: spacing.sm },
  passwordInput: { flex: 1, padding: spacing.md, color: colors.textPrimary, fontSize: 15 },
  eyeBtn: { padding: spacing.md, justifyContent: 'center', alignItems: 'center' },
  eyeIcon: { fontSize: 18 },

  loginBtn:  { backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  forgotPassword: { fontSize: 12, color: colors.accent, textAlign: 'center', marginTop: spacing.md, fontWeight: '500' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textMuted, fontSize: 12 },

  registerBtn: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent, padding: spacing.md, alignItems: 'center' },
  registerBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
});
