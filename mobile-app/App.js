import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Platform, Text } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import api from './src/services/api';
import wsService from './src/services/websocket';
import { COLORS } from './src/utils/constants';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await api.getUser();
      const token = await api.getToken();
      if (user && token) {
        setIsLoggedIn(true);
        wsService.connect();
      }
    } catch (err) {
      console.log('Auth check failed:', err.message);
      setError(err.message);
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
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>Loading...</Text>
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
    backgroundColor: COLORS.primary,
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
});
