import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_ICONS: Record<string, string> = {
  pending: '⏳', confirmed: '✅', preparing: '👨‍🍳', out_for_delivery: '🛵', delivered: '🎉', cancelled: '❌',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed', confirmed: 'Confirmed', preparing: 'Preparing',
  out_for_delivery: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function OrderDetailScreen({ route }: any) {
  const { id } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    api.get(`/orders/my/${id}`).then(({ data }) => setOrder(data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ orderId, status }: { orderId: number; status: string }) => {
      if (orderId === id) {
        setOrder((prev: any) => prev ? { ...prev, status } : prev);
      }
    };
    socket.on('order:status_updated', handler);
    return () => { socket.off('order:status_updated', handler); };
  }, [socket, id]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  if (!order) return <View style={styles.centered}><Text>Order not found</Text></View>;

  const currentStep = order.status === 'cancelled' ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id}</Text>
        <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
        <Text style={styles.date}>{new Date(order.created_at).toLocaleString('en-PH')}</Text>
      </View>

      {order.status !== 'cancelled' ? (
        <View style={styles.tracker}>
          <Text style={styles.trackerTitle}>Order Status</Text>
          {STATUS_STEPS.map((step, idx) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepDot, idx <= currentStep && styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>{idx <= currentStep ? '✓' : ''}</Text>
                </View>
                {idx < STATUS_STEPS.length - 1 && (
                  <View style={[styles.stepLine, idx < currentStep && styles.stepLineActive]} />
                )}
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepIcon}>{STATUS_ICONS[step]}</Text>
                <Text style={[styles.stepLabel, idx <= currentStep && styles.stepLabelActive]}>
                  {STATUS_LABELS[step]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.cancelledBanner}>
          <Text style={styles.cancelledText}>❌ Order Cancelled</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items Ordered</Text>
        {order.items?.map((item: any) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
            <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₱{Number(order.total_amount).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        <Text style={styles.detailLabel}>Address</Text>
        <Text style={styles.detailValue}>{order.delivery_address}</Text>
        {order.notes && <>
          <Text style={[styles.detailLabel, { marginTop: 10 }]}>Notes</Text>
          <Text style={styles.detailValue}>{order.notes}</Text>
        </>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#F97316', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  orderId: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  restaurantName: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  date: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  tracker: { backgroundColor: '#fff', margin: 16, borderRadius: 14, padding: 16 },
  trackerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 52 },
  stepLeft: { alignItems: 'center', width: 32, marginRight: 12 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#F97316' },
  stepDotText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  stepLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  stepLineActive: { backgroundColor: '#F97316' },
  stepInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  stepIcon: { fontSize: 18 },
  stepLabel: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
  stepLabelActive: { color: '#111827', fontWeight: '600' },
  cancelledBanner: { backgroundColor: '#FEE2E2', margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  cancelledText: { fontSize: 16, fontWeight: '700', color: '#991B1B' },
  section: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 14, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { fontSize: 14, color: '#374151', flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#F97316' },
  detailLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#374151' },
});
