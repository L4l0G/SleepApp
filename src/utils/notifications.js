// src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { saveNotifId, loadNotifId } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // ✅ reemplaza shouldShowAlert
    shouldShowList: true,    // ✅ nuevo requerido
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

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

export async function scheduleWeeklyNotification(startDate) {
  await cancelWeeklyNotification();

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  const triggerDate = new Date(startDate);
  triggerDate.setDate(triggerDate.getDate() + 7);
  triggerDate.setHours(9, 0, 0, 0);

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
        body: 'Tu ciclo semanal terminó. Responde el cuestionario para ver si tu sueño mejoró.',
        sound: true,
        data: { screen: 'Resumen' },
      },
      trigger: { date: triggerDate, channelId: 'sleep-reminders' },
    });

    await saveNotifId(id);
    console.log(`Notificación programada para: ${triggerDate.toLocaleString()}`);
    return id;
  } catch (error) {
    console.error('Error al programar notificación:', error);
    return null;
  }
}

export async function scheduleDailyReminders(startDate) {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const ids = [];
  for (let i = 0; i < 7; i++) {
    const triggerDate = new Date(startDate);
    triggerDate.setDate(triggerDate.getDate() + i);
    triggerDate.setHours(21, 0, 0, 0);

    if (triggerDate <= new Date()) continue;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '😴 Hora de registrar tu sueño',
          body: '¿Cuántas horas dormiste? Registra tu progreso de hoy.',
          sound: true,
          data: { screen: 'Progreso' },
        },
        trigger: { date: triggerDate, channelId: 'sleep-reminders' },
      });
      ids.push(id);
    } catch (error) {
      console.error(`Error notificación día ${i + 1}:`, error);
    }
  }
  return ids;
}

export async function cancelWeeklyNotification() {
  const id = await loadNotifId();
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getPendingNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}