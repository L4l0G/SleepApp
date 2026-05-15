// src/screens/RegistroScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

export default function RegistroScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const validateForm = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await register(email, password, fullName);
    } catch (err) {
      Alert.alert('Error de registro', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Text style={s.heroEmoji}>✨</Text>
        <Text style={s.heroTitle}>Crear cuenta</Text>
        <Text style={s.heroSub}>Únete a SleepApp y mejora tu sueño</Text>
      </View>

      <View style={s.formCard}>
        <View style={s.formGroup}>
          <Text style={s.label}>Nombre completo</Text>
          <TextInput
            style={s.input}
            placeholder="Juan Pérez"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

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

        <View style={s.formGroup}>
          <Text style={s.label}>Confirmar contraseña</Text>
          <View style={s.passwordContainer}>
            <TextInput
              style={s.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={s.eyeBtn}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={s.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[s.registerBtn, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.registerBtnText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>¿Ya tienes cuenta?</Text>
        <View style={s.dividerLine} />
      </View>

      <TouchableOpacity
        style={s.loginBtn}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.85}
      >
        <Text style={s.loginBtnText}>Volver al inicio de sesión</Text>
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

  registerBtn: { backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.sm, color: colors.textMuted, fontSize: 12 },

  loginBtn: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent, padding: spacing.md, alignItems: 'center' },
  loginBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
});
