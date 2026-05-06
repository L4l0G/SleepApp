// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  FORM:        'sleepapp_form',
  PERFIL:      'sleepapp_perfil',
  PROGRESS:    'sleepapp_progress',
  SLEEP_LOG:   'sleepapp_sleep_log',
  START_DATE:  'sleepapp_start_date',
  PREV_PERFIL: 'sleepapp_prev_perfil',
  HISTORY:     'sleepapp_history',
};

export async function saveForm(form) {
  await AsyncStorage.setItem(KEYS.FORM, JSON.stringify(form));
}
export async function loadForm() {
  const raw = await AsyncStorage.getItem(KEYS.FORM);
  return raw ? JSON.parse(raw) : null;
}

export async function savePerfil(perfil) {
  await AsyncStorage.setItem(KEYS.PERFIL, perfil);
}
export async function loadPerfil() {
  return await AsyncStorage.getItem(KEYS.PERFIL);
}

export async function savePrevPerfil(perfil) {
  await AsyncStorage.setItem(KEYS.PREV_PERFIL, perfil);
}
export async function loadPrevPerfil() {
  return await AsyncStorage.getItem(KEYS.PREV_PERFIL);
}

export async function saveProgress(progress) {
  await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
}
export async function loadProgress() {
  const raw = await AsyncStorage.getItem(KEYS.PROGRESS);
  return raw ? JSON.parse(raw) : new Array(14).fill(false);
}

export async function saveSleepLog(log) {
  await AsyncStorage.setItem(KEYS.SLEEP_LOG, JSON.stringify(log));
}
export async function loadSleepLog() {
  const raw = await AsyncStorage.getItem(KEYS.SLEEP_LOG);
  return raw ? JSON.parse(raw) : new Array(14).fill(null);
}

export async function saveStartDate(date) {
  await AsyncStorage.setItem(KEYS.START_DATE, date);
}
export async function loadStartDate() {
  return await AsyncStorage.getItem(KEYS.START_DATE);
}

// Guarda un historial de ciclos anteriores
export async function appendHistory(entry) {
  const raw = await AsyncStorage.getItem(KEYS.HISTORY);
  const hist = raw ? JSON.parse(raw) : [];
  hist.push(entry);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(hist));
}
export async function loadHistory() {
  const raw = await AsyncStorage.getItem(KEYS.HISTORY);
  return raw ? JSON.parse(raw) : [];
}

// Limpia solo el ciclo actual (conserva historial y form)
export async function clearCurrentCycle() {
  await AsyncStorage.multiRemove([
    KEYS.PROGRESS,
    KEYS.SLEEP_LOG,
    KEYS.START_DATE,
    KEYS.PERFIL,
  ]);
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
