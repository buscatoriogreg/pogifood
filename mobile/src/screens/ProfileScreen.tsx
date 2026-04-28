import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfileScreen() {
  const { user, logout, login, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      if (user && token) await login({ ...user, ...form }, token);
      setEditing(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {[
          { label: 'Full Name', key: 'name' },
          { label: 'Phone', key: 'phone', keyboard: 'phone-pad' as const },
          { label: 'Delivery Address', key: 'address' },
        ].map(f => (
          <View key={f.key} style={styles.field}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={form[f.key as keyof typeof form]}
                onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                keyboardType={f.keyboard}
              />
            ) : (
              <Text style={styles.fieldValue}>{form[f.key as keyof typeof form] || '—'}</Text>
            )}
          </View>
        ))}

        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪  Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>PogiFood v1.0.0 · MIT107 Project</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#F97316', paddingTop: 64, paddingBottom: 32, alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  editBtn: { fontSize: 14, fontWeight: '600', color: '#F97316' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#374151' },
  fieldInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#6B7280', fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#F97316', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  logoutBtn: { paddingVertical: 4 },
  logoutText: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
  version: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginBottom: 32 },
});
