import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, TextInput, ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  image: string | null;
  is_open: number;
}

interface FoodItem {
  id: number;
  name: string;
  price: number;
  image: string | null;
  restaurant_name: string;
  category_name: string;
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRestaurants = async () => {
    try {
      const { data } = await api.get('/restaurants');
      setRestaurants(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadRestaurants(); }, []);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/food-items/search?q=${encodeURIComponent(query)}`);
        setSearchResults(data);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadRestaurants(); }, []);

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Restaurant', { id: item.id, name: item.name })}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}><Text style={{ fontSize: 36 }}>🏪</Text></View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.description ? <Text style={styles.cardSub} numberOfLines={1}>{item.description}</Text> : null}
        {item.address ? <Text style={styles.cardAddr} numberOfLines={1}>📍 {item.address}</Text> : null}
        <View style={styles.openBadge}>
          <Text style={styles.openText}>{item.is_open ? '🟢 Open' : '🔴 Closed'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFoodResult = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity style={styles.foodResult} onPress={() => navigation.navigate('Restaurant', { id: item.restaurant_id, name: item.restaurant_name })}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.foodResultImage} />
      ) : (
        <View style={[styles.foodResultImage, styles.noImage]}><Text style={{ fontSize: 20 }}>🍽️</Text></View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.foodResultName}>{item.name}</Text>
        <Text style={styles.foodResultSub}>{item.restaurant_name} · {item.category_name}</Text>
        <Text style={styles.foodResultPrice}>₱{Number(item.price).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.subGreeting}>What are you craving today?</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search food or restaurant..."
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query ? <TouchableOpacity onPress={() => setQuery('')}><Text style={styles.clearBtn}>✕</Text></TouchableOpacity> : null}
      </View>

      {query.trim() ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searching ? (
            <ActivityIndicator color="#F97316" style={{ marginTop: 24 }} />
          ) : searchResults.length === 0 ? (
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          ) : (
            <FlatList data={searchResults} keyExtractor={i => i.id.toString()} renderItem={renderFoodResult} />
          )}
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={i => i.id.toString()}
          renderItem={renderRestaurant}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Restaurants</Text>}
          ListEmptyComponent={
            loading ? <ActivityIndicator color="#F97316" style={{ marginTop: 40 }} /> :
            <Text style={styles.emptyText}>No restaurants available</Text>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#F97316', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16,
    marginTop: -20, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  clearBtn: { color: '#9CA3AF', fontSize: 16, paddingLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12, paddingTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 140 },
  noImage: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardAddr: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  openBadge: { marginTop: 8 },
  openText: { fontSize: 12, fontWeight: '600' },
  foodResult: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  foodResultImage: { width: 56, height: 56, borderRadius: 10 },
  foodResultName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  foodResultSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  foodResultPrice: { fontSize: 14, fontWeight: '700', color: '#F97316', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
