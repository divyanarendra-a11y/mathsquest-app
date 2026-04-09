import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../src/lib/api';
import { useStore } from '../src/store/useStore';

export default function LoginScreen() {
  const setAuth = useStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      await SecureStore.setItemAsync('mq_token', res.data.token);
      setAuth(res.data.token, res.data.user.id, res.data.user.name);
      router.replace('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>MathsQuest</Text>
        <Text style={styles.subtitle}>Year 7 Maths Adventure</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#6B7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Log In'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#111827', borderRadius: 24, padding: 28, alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#9CA3AF', fontSize: 13, marginBottom: 28 },
  input: { width: '100%', backgroundColor: '#1F2937', color: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 12, fontSize: 15 },
  error: { color: '#F87171', fontSize: 13, marginBottom: 10 },
  btn: { width: '100%', backgroundColor: '#6C3FEB', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  btnDisabled: { backgroundColor: '#374151' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
