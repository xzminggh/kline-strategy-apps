import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SQLiteProvider } from './shared/database';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import { STRATEGY_CONFIG } from './config/strategy';
import { COLORS } from './theme/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SQLiteProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.background,
              borderTopColor: COLORS.border,
            },
            tabBarActiveTintColor: STRATEGY_CONFIG.color,
            tabBarInactiveTintColor: COLORS.textSecondary,
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '首页' }} />
          <Tab.Screen name="Detail" component={DetailScreen} options={{ tabBarLabel: '详情' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '设置' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}