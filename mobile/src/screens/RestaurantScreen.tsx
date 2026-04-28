import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, ScrollView
} from 'react-native';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category_name: string;
  is_available: number;
}

interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  image: string | null;
  is_open: number;
  food_items: FoodItem[];
}

export default function RestaurantScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    api.get(`/restaurants/${id}`).then(({ data }) => setRestaurant(data)).finally(() => setLoading(false));
  }, [id]);

  const addToCart = async (item: FoodItem) => {
    setAddingId(item.id);
    try {
      await api.post('/cart', { food_item_id: item.id, quantity: 1 });
      showToast({ type: 'cart', title: 'Added to Cart!', message: item.name });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Could not add to cart', message: err.response?.data?.message });
    } finally {
      setAddingId(null);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  if (!restaurant) return <View style={styles.centered}><Text>Restaurant not found</Text></View>;

  const byCategory = restaurant.food_items.reduce<Record<string, FoodItem[]>>((acc, item) => {
    const cat = item.category_name || 'Others';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.container}>
      {restaurant.image ? (
        <Image source={{ uri: restaurant.image }} style={styles.banner} />
      ) : (
        <View style={[styles.banner, styles.noImage]}><Text style={{ fontSize: 48 }}>🏪</Text></View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{restaurant.name}</Text>
        {restaurant.description ? <Text style={styles.desc}>{restaurant.description}</Text> : null}
        {restaurant.address ? <Text style={styles.addr}>📍 {restaurant.address}</Text> : null}
        <Text style={[styles.openBadge, { color: restaurant.is_open ? '#16a34a' : '#dc2626' }]}>
          {restaurant.is_open ? '🟢 Open Now' : '🔴 Closed'}
        </Text>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Menu</Text>
        {restaurant.food_items.length === 0 ? (
          <Text style={styles.emptyText}>No items available yet</Text>
        ) : (
          Object.entries(byCategory).map(([category, items]) => (
            <View key={category}>
              <Text style={styles.categoryLabel}>{category}</Text>
              {items.map(item => (
                <View key={item.id} style={styles.itemCard}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, styles.noImage]}><Text style={{ fontSize: 24 }}>🍽️</Text></View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description ? <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text> : null}
                    <Text style={styles.itemPrice}>₱{Number(item.price).toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addBtn, !restaurant.is_open && styles.addBtnDisabled]}
                    onPress={() => addToCart(item)}
                    disabled={addingId === item.id || !restaurant.is_open}
                  >
                    {addingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.addBtnText}>+</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { width: '100%', height: 200 },
  noImage: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  desc: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  addr: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  openBadge: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  menuSection: { padding: 16 },
  menuTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  categoryLabel: { fontSize: 13, fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 8 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImage: { width: 72, height: 72, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#F97316', marginTop: 4 },
  addBtn: {
    backgroundColor: '#F97316', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#D1D5DB' },
  addBtnText: { color: '#fff', fontSize: 24, lineHeight: 28 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 24, fontSize: 15 },
});
