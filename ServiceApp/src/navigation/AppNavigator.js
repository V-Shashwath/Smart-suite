import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmployeeSalesInvoiceScreen from '../screens/InvoiceScreen';
import CashReceiptsScreen from '../screens/CashReceiptsScreen';
import BankReceiptsScreen from '../screens/BankReceiptsScreen';
import EmployeeReturnScreen from '../screens/EmployeeReturnScreen';
import SalesReturnsScreen from '../screens/SalesReturnsScreen';
import RentalServiceScreen from '../screens/RentalServiceScreen';
import RentalMonthlyBillScreen from '../screens/RentalMonthlyBillScreen';
import MenuModalScreen from '../screens/MenuModalScreen';

const Stack = createStackNavigator();

// Helper function to create header with menu button
const createHeaderOptions = (title) => ({ navigation }) => ({
  headerShown: true,
  title: title,
  headerLeft: () => (
    <TouchableOpacity
      onPress={() => navigation.navigate('MenuModal')}
      style={{ marginLeft: 15 }}
    >
      <Text style={{ fontSize: 24 }}>☰</Text>
    </TouchableOpacity>
  ),
});

// Main Stack Navigator
function MainStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false 
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={createHeaderOptions('Dashboard')}
      />
      <Stack.Screen 
        name="MenuModal" 
        component={MenuModalScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EmployeeSalesInvoice" 
        component={EmployeeSalesInvoiceScreen}
        options={createHeaderOptions('Employee Sale Invoice')}
      />
      <Stack.Screen 
        name="CashReceipts" 
        component={CashReceiptsScreen}
        options={createHeaderOptions('Cash Receipts')}
      />
      <Stack.Screen 
        name="BankReceipts" 
        component={BankReceiptsScreen}
        options={createHeaderOptions('Bank Receipts')}
      />
      <Stack.Screen 
        name="EmployeeReturn" 
        component={EmployeeReturnScreen}
        options={createHeaderOptions('Employee Return')}
      />
      <Stack.Screen 
        name="SalesReturns" 
        component={SalesReturnsScreen}
        options={createHeaderOptions('Sales Returns')}
      />
      <Stack.Screen 
        name="RentalService" 
        component={RentalServiceScreen}
        options={createHeaderOptions('Rental Service')}
      />
      <Stack.Screen 
        name="RentalMonthlyBill" 
        component={RentalMonthlyBillScreen}
        options={createHeaderOptions('Rental Monthly Bill')}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}

