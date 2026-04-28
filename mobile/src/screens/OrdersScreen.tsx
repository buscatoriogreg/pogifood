import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

interface Order {
  id: number;
  restaurant_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: { name: string; quantity: number; price: number }[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF9C3', text: '#854D0E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  preparing: { bg: '#F3E8FF', text: '#6B21A8' },
  out_for_delivery: { bg: '#E0E7FF', text: '#3730A3' },
  delivered: { bg: '#DCFCE7', text: '#166534' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳', confirmed: '✅', preparing: '👨‍🍳',
  out_for_delivery: '🛵', delivered: '🎉', cancelled: '❌',
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadOrders(); }, []));

  const onRefresh = () => { setRefreshing(true); loadOrders(); };

  const renderOrder = ({ item }: { item: Order }) => {
    const colors = STATUS_COLORS[item.status] || { bg: '#F3F4F6', text: '#374151' };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.restaurantName}>{item.restaurant_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {STATUS_ICONS[item.status]} {item.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsList}>
          {item.items?.slice(0, 2).map((i, idx) => (
            <Text key={idx} style={styles.itemText}>{i.name} x{i.quantity}</Text>
          ))}
          {(item.items?.length || 0) > 2 && (
            <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={styles.total}>₱{Number(item.total_amount).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={i => i.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Start ordering from your favorite restaurants!</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#F97316', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: '700', color: '#111827' },
  restaurantName: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  itemsList: {},
  itemText: { fontSize: 13, color: '#374151', marginBottom: 2 },
  moreItems: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  date: { fontSize: 12, color: '#9CA3AF' },
  total: { fontSize: 16, fontWeight: '700', color: '#F97316' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
