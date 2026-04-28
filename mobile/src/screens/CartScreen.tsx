import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CartItem {
  id: number;
  food_item_id: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  restaurant_id: number;
  restaurant_name: string;
}

export default function CartScreen({ navigation }: any) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const { showToast } = useToast();

  const loadCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadCart(); }, []));

  const updateQty = async (item: CartItem, qty: number) => {
    try {
      if (qty < 1) {
        await api.delete(`/cart/${item.id}`);
        setCart(c => c.filter(i => i.id !== item.id));
      } else {
        await api.put(`/cart/${item.id}`, { quantity: qty });
        setCart(c => c.map(i => i.id === item.id ? { ...i, quantity: qty } : i));
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error updating cart', message: err.response?.data?.message });
    }
  };

  const placeOrder = async () => {
    if (!address.trim()) return showToast({ type: 'error', title: 'Enter your delivery address' });
    if (cart.length === 0) return showToast({ type: 'error', title: 'Your cart is empty' });
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', { delivery_address: address, notes });
      showToast({ type: 'order', title: 'Order Placed!', message: `Order #${data.id} · ₱${Number(data.total_amount).toFixed(2)}` });
      setCart([]);
      setTimeout(() => navigation.navigate('Orders'), 1200);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Could not place order', message: err.response?.data?.message });
    } finally {
      setPlacing(false);
    }
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Browse restaurants and add items to your cart</Text>
        </View>
      ) : (
        <>
          {cart[0]?.restaurant_name && (
            <Text style={styles.restaurantLabel}>🏪 {cart[0].restaurant_name}</Text>
          )}
          {cart.map(item => (
            <View key={item.id} style={styles.itemCard}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.noImage]}><Text style={{ fontSize: 20 }}>🍽️</Text></View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₱{Number(item.price).toFixed(2)}</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item, item.quantity - 1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item, item.quantity + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.orderSection}>
            <Text style={styles.sectionLabel}>Delivery Address</Text>
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter delivery address"
              multiline
            />
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Special instructions..."
              multiline
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₱{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.orderBtn} onPress={placeOrder} disabled={placing}>
              {placing ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderBtnText}>Place Order · ₱{total.toFixed(2)}</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#F97316', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  restaurantLabel: { fontSize: 14, color: '#6B7280', padding: 16, paddingBottom: 8 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImage: { width: 60, height: 60, borderRadius: 10 },
  noImage: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemPrice: { fontSize: 14, color: '#F97316', fontWeight: '700', marginTop: 4 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '600', color: '#374151', lineHeight: 22 },
  qtyText: { fontSize: 16, fontWeight: '600', color: '#111827', minWidth: 20, textAlign: 'center' },
  orderSection: { margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  textInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 14, minHeight: 48,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#F97316' },
  orderBtn: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
