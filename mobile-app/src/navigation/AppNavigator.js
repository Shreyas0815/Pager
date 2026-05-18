import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

import DashboardScreen from '../screens/DashboardScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ReportScreen from '../screens/ReportScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.cardLight },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: 'Dashboard', headerShown: false }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Patient Details' }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: 'Patient Report' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard': iconName = focused ? 'grid' : 'grid-outline'; break;
            case 'Alerts': iconName = focused ? 'notifications' : 'notifications-outline'; break;
            case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
            default: iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.cardLight,
          borderTopColor: COLORS.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Alerts" component={AlertsScreen}
        options={{ headerShown: true, headerTitle: 'Alerts',
          headerStyle: { backgroundColor: COLORS.cardLight },
          headerTintColor: COLORS.primary, headerShadowVisible: false,
        }}
      />
      <Tab.Screen name="Profile"
        options={{ headerShown: true, headerTitle: 'Profile & System',
          headerStyle: { backgroundColor: COLORS.cardLight },
          headerTintColor: COLORS.primary, headerShadowVisible: false,
        }}
      >
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
