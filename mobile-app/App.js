import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Platform, Text } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import api from './src/services/api';
import wsService from './src/services/websocket';
import { COLORS, discoverServer } from './src/utils/constants';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Searching for server...');

  useEffect(() => {
    initApp();
  }, []);

  async function initApp() {
    try {
      // Auto-discover server on the network
      setStatusText('Searching for server...');
      const found = await discoverServer();
      if (found) {
        setStatusText('Server found! Checking auth...');
      } else {
        setStatusText('Server not found. Using default.');
      }

      // Check auth
      const user = await api.getUser();
      const token = await api.getToken();
      if (user && token) {
        setIsLoggedIn(true);
        wsService.connect();
      }
    } catch (err) {
      console.log('Init failed:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email, password) {
    await api.login(email, password);
    setIsLoggedIn(true);
    wsService.connect();
  }

  async function handleLogout() {
    wsService.disconnect();
    await api.logout();
    setIsLoggedIn(false);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingEmoji}>🏥</Text>
        </View>
        <Text style={styles.loadingTitle}>HPMS Mobile</Text>
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 20 }} />
        <Text style={styles.loadingStatus}>{statusText}</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.root}>
        <LoginScreen onLogin={handleLogin} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator onLogout={handleLogout} />
          <StatusBar style="dark" />
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.navyDark || '#0f1b3d',
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingEmoji: { fontSize: 36 },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f0f4f8',
  },
  loadingStatus: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 13,
  },
});
