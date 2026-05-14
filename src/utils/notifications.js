// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { saveNotifId, loadNotifId } from './storage';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos de notificación al usuario.
 * Devuelve true si fueron concedidos.
 */
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    // En simulador/emulador no se pueden recibir notificaciones reales
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Canal de Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sleep-reminders', {
      name: 'Recordatorios de sueño',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: true,
    });
  }

  return true;
}

/**
 * Programa una notificación semanal recurrente.
 * Se dispara 7 días después de la fecha de inicio del ciclo,
 * a las 9:00 AM, invitando a repetir el cuestionario.
 *
 * @param {Date} startDate - Fecha de inicio del ciclo actual
 */
export async function scheduleWeeklyNotification(startDate) {
  // Cancelar notificación anterior si existe
  await cancelWeeklyNotification();

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  // Calcular fecha de disparo: 7 días después del inicio a las 9:00 AM
  const triggerDate = new Date(startDate);
  triggerDate.setDate(triggerDate.getDate() + 7);
  triggerDate.setHours(9, 0, 0, 0);

  // Si la fecha ya pasó (ciclo retroactivo), disparar mañana a las 9 AM
  const now = new Date();
  if (triggerDate <= now) {
    triggerDate.setTime(now.getTime());
    triggerDate.setDate(triggerDate.getDate() + 1);
    triggerDate.setHours(9, 0, 0, 0);
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌙 ¡Nueva semana, nueva rutina!',
        body: 'Tu ciclo semanal terminó. Responde el cuestionario para ver si tu sueño mejoró y obtener una rutina actualizada.',
        sound: true,
        data: { screen: 'Resumen' },
      },
      trigger: {
        date: triggerDate,
        channelId: 'sleep-reminders',
      },
    });

    await saveNotifId(id);
    console.log(`Notificación programada para: ${triggerDate.toLocaleString()}`);
    return id;
  } catch (error) {
    console.error('Error al programar notificación:', error);
    return null;
  }
}

/**
 * Programa notificaciones diarias de recordatorio de registro de sueño.
 * Se disparan cada noche a las 9:00 PM durante los 7 días del ciclo.
 *
 * @param {Date} startDate - Fecha de inicio del ciclo actual
 */
export async function scheduleDailyReminders(startDate) {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const ids = [];
  for (let i = 0; i < 7; i++) {
    const triggerDate = new Date(startDate);
    triggerDate.setDate(triggerDate.getDate() + i);
    triggerDate.setHours(21, 0, 0, 0); // 9 PM

    // No programar si ya pasó
    if (triggerDate <= new Date()) continue;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '😴 Hora de registrar tu sueño',
          body: '¿Cuántas horas dormiste? Registra tu progreso de hoy en SleepApp.',
          sound: true,
          data: { screen: 'Progreso' },
        },
        trigger: {
          date: triggerDate,
          channelId: 'sleep-reminders',
        },
      });
      ids.push(id);
    } catch (error) {
      console.error(`Error notificación día ${i + 1}:`, error);
    }
  }
  return ids;
}

/**
 * Cancela la notificación semanal guardada.
 */
export async function cancelWeeklyNotification() {
  const id = await loadNotifId();
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

/**
 * Cancela todas las notificaciones programadas.
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Devuelve lista de notificaciones pendientes (útil para debug).
 */
export async function getPendingNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
