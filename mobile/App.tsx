import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import RestaurantScreen from './src/screens/RestaurantScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="Restaurant"
        component={RestaurantScreen}
        options={({ route }: any) => ({
          headerShown: true,
          title: route.params?.name || 'Restaurant',
          headerTintColor: '#F97316',
        })}
      />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={OrdersScreen} />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: true, title: 'Order Details', headerTintColor: '#F97316' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: '#F3F4F6', paddingBottom: 4, height: 60 },
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Cart', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🛒</Text> }} />
      <Tab.Screen name="Orders" component={OrdersStack} options={{ tabBarLabel: 'Orders', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📋</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7ED' }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🍜</Text>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }
  return isAuthenticated ? <MainTabs /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SocketProvider>
    </AuthProvider>
  );
}
