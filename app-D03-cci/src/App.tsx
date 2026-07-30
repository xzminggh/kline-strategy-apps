import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SQLiteProvider } from 'kline-shared';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import { STRATEGY_CONFIG } from './config/strategy';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SQLiteProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#0a0a0f',
              borderTopColor: '#1e293b',
            },
            tabBarActiveTintColor: STRATEGY_CONFIG.color,
            tabBarInactiveTintColor: '#94a3b8',
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ tabBarLabel: '首页' }}
          />
          <Tab.Screen 
            name="Detail" 
            component={DetailScreen}
            options={{ tabBarLabel: '详情' }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ tabBarLabel: '设置' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}
