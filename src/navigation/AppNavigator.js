// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { colors } from '../utils/theme';

import CuestionarioScreen from '../screens/CuestionarioScreen';
import RutinaScreen       from '../screens/RutinaScreen';
import ProgresoScreen     from '../screens/ProgresoScreen';
import ResumenScreen      from '../screens/ResumenScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        color: focused ? colors.accent : colors.textMuted,
        fontWeight: focused ? '600' : '400',
      }}>
        {label}
      </Text>
    </View>
  );
}

const TAB_OPTS = {
  headerStyle:      { backgroundColor: colors.bg, borderBottomColor: colors.border, borderBottomWidth: 1 },
  headerTitleStyle: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' },
  tabBarStyle: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 76,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabBarShowLabel: false,
};

// Tab principal
function MainTabs() {
  return (
    <Tab.Navigator screenOptions={TAB_OPTS}>
      <Tab.Screen
        name="Cuestionario"
        component={CuestionarioScreen}
        options={{
          title: 'Cuestionario de sueño',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Inicio" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Rutina"
        component={RutinaScreen}
        options={{
          title: 'Mi rutina',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌙" label="Rutina" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Progreso"
        component={ProgresoScreen}
        options={{
          title: 'Progreso — 14 días',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" label="Progreso" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Stack raíz — incluye Resumen como pantalla modal sobre los tabs
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main"    component={MainTabs} />
        <Stack.Screen
          name="Resumen"
          component={ResumenScreen}
          options={{
            headerShown: true,
            headerTitle: 'Resumen del ciclo',
            headerStyle:      { backgroundColor: colors.bg },
            headerTitleStyle: { color: colors.textPrimary, fontSize: 17, fontWeight: '600' },
            headerTintColor:  colors.accent,
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
