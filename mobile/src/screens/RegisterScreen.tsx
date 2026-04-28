import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'Name, email, and password are required');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      await login(data.user, data.token);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join PogiFood and start ordering!</Text>

        <View style={styles.form}>
          {[
            { label: 'Full Name *', key: 'name', placeholder: 'Juan Dela Cruz' },
            { label: 'Email *', key: 'email', placeholder: 'juan@email.com', keyboard: 'email-address' as const },
            { label: 'Password *', key: 'password', placeholder: '••••••••', secure: true },
            { label: 'Phone', key: 'phone', placeholder: '+63 900 000 0000', keyboard: 'phone-pad' as const },
            { label: 'Delivery Address', key: 'address', placeholder: 'House/Unit No., Street, City' },
          ].map(f => (
            <View key={f.key}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChangeText={val => set(f.key, val)}
                keyboardType={f.keyboard}
                secureTextEntry={f.secure}
                autoCapitalize={f.key === 'email' ? 'none' : 'words'}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkRow}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7ED' },
  inner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 40 },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28, textAlign: 'center' },
  form: { width: '100%', maxWidth: 360 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, backgroundColor: '#fff', marginBottom: 14,
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
