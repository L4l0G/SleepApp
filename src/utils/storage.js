// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import {
  collection, doc, setDoc, getDoc, deleteDoc, getDocs
} from 'firebase/firestore';

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

export const CYCLE_DAYS = 7;

// ─── Utilidades locales ───────────────────────────────────────────────────────

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

// ─── Utilidades Firebase (v9 modular) ────────────────────────────────────────

function getUserId() {
  const id = global.currentUserId || 'current_user';
  console.log('🔑 UID actual:', id); // ← temporal para verificar, quitar después
  return id;
}

function userDocRef(col, docId) {
  return doc(db, 'users', getUserId(), col, docId);
}

async function saveToFirebase(col, docId, data) {
  try {
    await setDoc(userDocRef(col, docId), data, { merge: true });
  } catch (err) {
    console.warn('Error al guardar en Firebase:', err);
  }
}

async function loadFromFirebase(col, docId) {
  try {
    const snap = await getDoc(userDocRef(col, docId));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('Error al cargar desde Firebase:', err);
    return null;
  }
}

// ─── Formulario ───────────────────────────────────────────────────────────────

export async function saveForm(form) {
  await saveLocal(KEYS.FORM, form);
  await saveToFirebase('data', 'form', { form, timestamp: new Date() });
}

export async function loadForm() {
  const remote = await loadFromFirebase('data', 'form');
  if (remote?.form) {
    await saveLocal(KEYS.FORM, remote.form);
    return remote.form;
  }
  return await loadLocal(KEYS.FORM, null);
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

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

// ─── Progreso ─────────────────────────────────────────────────────────────────

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
  return await loadLocal(KEYS.PROGRESS, new Array(CYCLE_DAYS).fill(false));
}

// ─── Sleep log ────────────────────────────────────────────────────────────────

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
  return await loadLocal(KEYS.SLEEP_LOG, new Array(CYCLE_DAYS).fill(null));
}

// ─── Fecha de inicio ──────────────────────────────────────────────────────────

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

// ─── Notificaciones ───────────────────────────────────────────────────────────

export async function saveNotifId(id) {
  await saveLocal(KEYS.NOTIF_ID, String(id));
  await saveToFirebase('data', 'notifId', { id: String(id), timestamp: new Date() });
}

export async function loadNotifId() {
  const local = await loadLocal(KEYS.NOTIF_ID, null);
  if (local) return local;

  const remote = await loadFromFirebase('data', 'notifId');
  if (remote?.id) {
    await saveLocal(KEYS.NOTIF_ID, remote.id);
    return remote.id;
  }
  return null;
}

// ─── Historial ────────────────────────────────────────────────────────────────

export async function appendHistory(entry) {
  const local = await loadLocal(KEYS.HISTORY, []);
  local.push(entry);
  await saveLocal(KEYS.HISTORY, local);
  await saveToFirebase('data', 'history', { entries: local, timestamp: new Date() });
}

export async function loadHistory() {
  const remote = await loadFromFirebase('data', 'history');
  if (remote?.entries) {
    await saveLocal(KEYS.HISTORY, remote.entries);
    return remote.entries;
  }
  return await loadLocal(KEYS.HISTORY, []);
}

// ─── Limpieza ─────────────────────────────────────────────────────────────────

export async function clearCurrentCycle() {
  await AsyncStorage.multiRemove([
    KEYS.PROGRESS, KEYS.SLEEP_LOG, KEYS.START_DATE, KEYS.PERFIL,
  ]);
  try {
    const userId = getUserId();
    const dataCol = collection(db, 'users', userId, 'data');
    for (const docId of ['progress', 'sleepLog', 'startDate', 'perfil']) {
      await deleteDoc(doc(dataCol, docId));
    }
  } catch (err) {
    console.warn('Error al limpiar Firebase:', err);
  }
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  try {
    const userId = getUserId();
    const dataCol = collection(db, 'users', userId, 'data');
    const docs = await getDocs(dataCol);
    for (const d of docs.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Error al limpiar Firebase:', err);
  }
}

// storage.js — agregar esta función
export async function clearLocalOnly() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

// ─── Usuario actual ───────────────────────────────────────────────────────────

export function setCurrentUserId(userId) {
  global.currentUserId = userId;
}

export function getCurrentUserId() {
  return global.currentUserId || 'current_user';
}

