import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'customer') {
        Alert.alert('Error', 'Please use the web panel for restaurant owners.');
        return;
      }
      await login(data.user, data.token);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🍜</Text>
        <Text style={styles.title}>PogiFood</Text>
        <Text style={styles.subtitle}>Order food from your favorite restaurants</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7ED' },
  inner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32, textAlign: 'center' },
  form: { width: '100%', maxWidth: 360 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, backgroundColor: '#fff', marginBottom: 16,
  },
  button: {
    backgroundColor: '#F97316', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkRow: { alignItems: 'center', marginTop: 20 },
  link: { color: '#6B7280', fontSize: 14 },
  linkBold: { color: '#F97316', fontWeight: '600' },
});
