// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';

const KEYS = {
  FORM:        'sleepapp_form',
  PERFIL:      'sleepapp_perfil',
  PROGRESS:    'sleepapp_progress',
  SLEEP_LOG:   'sleepapp_sleep_log',
  START_DATE:  'sleepapp_start_date',
  PREV_PERFIL: 'sleepapp_prev_perfil',
  HISTORY:     'sleepapp_history',
  NOTIF_ID:    'sleepapp_notif_id',
};

// Ciclo semanal
export const CYCLE_DAYS = 7;

// ─── Utilidades locales (caché offline) ──────────────────────────────────────

async function saveLocal(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Error al guardar localmente:', err);
  }
}

async function loadLocal(key, defaultValue) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.warn('Error al cargar localmente:', err);
    return defaultValue;
  }
}

// ─── Utilidades de Firebase ──────────────────────────────────────────────────

function getUserId() {
  // En contexto real, esto vendría del usuario autenticado
  // De momento retorna un ID genérico
  return 'current_user';
}

async function saveToFirebase(collection, document, data) {
  try {
    const userId = getUserId();
    await db()
      .collection('users')
      .doc(userId)
      .collection(collection)
      .doc(document)
      .set(data, { merge: true });
  } catch (err) {
    console.warn('Error al guardar en Firebase:', err);
  }
}

async function loadFromFirebase(collection, document) {
  try {
    const userId = getUserId();
    const doc = await db()
      .collection('users')
      .doc(userId)
      .collection(collection)
      .doc(document)
      .get();
    return doc.exists ? doc.data() : null;
  } catch (err) {
    console.warn('Error al cargar desde Firebase:', err);
    return null;
  }
}

// ─── Funciones de formulario ──────────────────────────────────────────────────

export async function saveForm(form) {
  await saveLocal(KEYS.FORM, form);
  await saveToFirebase('data', 'form', { form, timestamp: new Date() });
}

export async function loadForm() {
  // Intenta Firebase primero, falla a local
  const remote = await loadFromFirebase('data', 'form');
  if (remote?.form) {
    await saveLocal(KEYS.FORM, remote.form);
    return remote.form;
  }
  return await loadLocal(KEYS.FORM, null);
}

// ─── Funciones de perfil ─────────────────────────────────────────────────────

export async function savePerfil(perfil) {
  await saveLocal(KEYS.PERFIL, perfil);
  await saveToFirebase('data', 'perfil', { perfil, timestamp: new Date() });
}

export async function loadPerfil() {
  const remote = await loadFromFirebase('data', 'perfil');
  if (remote?.perfil) {
    await saveLocal(KEYS.PERFIL, remote.perfil);
    return remote.perfil;
  }
  return await loadLocal(KEYS.PERFIL, null);
}

export async function savePrevPerfil(perfil) {
  await saveLocal(KEYS.PREV_PERFIL, perfil);
  await saveToFirebase('data', 'prevPerfil', { perfil, timestamp: new Date() });
}

export async function loadPrevPerfil() {
  const remote = await loadFromFirebase('data', 'prevPerfil');
  if (remote?.perfil) {
    await saveLocal(KEYS.PREV_PERFIL, remote.perfil);
    return remote.perfil;
  }
  return await loadLocal(KEYS.PREV_PERFIL, null);
}

// ─── Funciones de progreso ───────────────────────────────────────────────────

export async function saveProgress(progress) {
  await saveLocal(KEYS.PROGRESS, progress);
  await saveToFirebase('data', 'progress', { progress, timestamp: new Date() });
}

export async function loadProgress() {
  const remote = await loadFromFirebase('data', 'progress');
  if (remote?.progress) {
    await saveLocal(KEYS.PROGRESS, remote.progress);
    return remote.progress;
  }
  const local = await loadLocal(KEYS.PROGRESS, new Array(CYCLE_DAYS).fill(false));
  return local;
}

// ─── Funciones de registro de sueño ──────────────────────────────────────────

export async function saveSleepLog(log) {
  await saveLocal(KEYS.SLEEP_LOG, log);
  await saveToFirebase('data', 'sleepLog', { log, timestamp: new Date() });
}

export async function loadSleepLog() {
  const remote = await loadFromFirebase('data', 'sleepLog');
  if (remote?.log) {
    await saveLocal(KEYS.SLEEP_LOG, remote.log);
    return remote.log;
  }
  const local = await loadLocal(KEYS.SLEEP_LOG, new Array(CYCLE_DAYS).fill(null));
  return local;
}

// ─── Funciones de fecha de inicio ────────────────────────────────────────────

export async function saveStartDate(date) {
  await saveLocal(KEYS.START_DATE, date);
  await saveToFirebase('data', 'startDate', { date, timestamp: new Date() });
}

export async function loadStartDate() {
  const remote = await loadFromFirebase('data', 'startDate');
  if (remote?.date) {
    await saveLocal(KEYS.START_DATE, remote.date);
    return remote.date;
  }
  return await loadLocal(KEYS.START_DATE, null);
}

// ─── Funciones de notificaciones ─────────────────────────────────────────────

export async function saveNotifId(id) {
  await saveLocal(KEYS.NOTIF_ID, String(id));
  await saveToFirebase('data', 'notifId', { id: String(id), timestamp: new Date() });
}

export async function loadNotifId() {
  const remote = await loadFromFirebase('data', 'notifId');
  if (remote?.id) {
    await saveLocal(KEYS.NOTIF_ID, remote.id);
    return remote.id;
  }
  return await loadLocal(KEYS.NOTIF_ID, null);
}

// ─── Funciones de historial ──────────────────────────────────────────────────

export async function appendHistory(entry) {
  const local = await loadLocal(KEYS.HISTORY, []);
  local.push(entry);
  await saveLocal(KEYS.HISTORY, local);
  
  // Guardar en Firebase como array
  await saveToFirebase('data', 'history', {
    entries: local,
    timestamp: new Date(),
  });
}

export async function loadHistory() {
  const remote = await loadFromFirebase('data', 'history');
  if (remote?.entries) {
    await saveLocal(KEYS.HISTORY, remote.entries);
    return remote.entries;
  }
  return await loadLocal(KEYS.HISTORY, []);
}

// ─── Funciones de limpieza ───────────────────────────────────────────────────

export async function clearCurrentCycle() {
  await AsyncStorage.multiRemove([
    KEYS.PROGRESS,
    KEYS.SLEEP_LOG,
    KEYS.START_DATE,
    KEYS.PERFIL,
  ]);

  // También limpiar en Firebase
  try {
    const userId = getUserId();
    const ref = db().collection('users').doc(userId).collection('data');
    await ref.doc('progress').delete();
    await ref.doc('sleepLog').delete();
    await ref.doc('startDate').delete();
    await ref.doc('perfil').delete();
  } catch (err) {
    console.warn('Error al limpiar Firebase:', err);
  }
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));

  // También limpiar en Firebase
  try {
    const userId = getUserId();
    const ref = db().collection('users').doc(userId).collection('data');
    const docs = await ref.get();
    docs.forEach(doc => doc.ref.delete());
  } catch (err) {
    console.warn('Error al limpiar Firebase:', err);
  }
}

// ─── Función para sincronizar con usuario autenticado ──────────────────────

export function setCurrentUserId(userId) {
  // Este sería llamado cuando el usuario inicia sesión
  // Para poder sincronizar los datos con su UID real
  global.currentUserId = userId;
}

export function getCurrentUserId() {
  return global.currentUserId || 'current_user';
}
