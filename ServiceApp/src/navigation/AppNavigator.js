import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmployeeSaleInvoiceScreen from '../screens/EmployeeSaleInvoiceScreen';
import CashReceiptsScreen from '../screens/CashReceiptsScreen';
import BankReceiptsScreen from '../screens/BankReceiptsScreen';
import EmployeeReturnScreen from '../screens/EmployeeReturnScreen';
import SalesReturnsScreen from '../screens/SalesReturnsScreen';
import RentalServiceScreen from '../screens/RentalServiceScreen';
import RentalMonthlyBillScreen from '../screens/RentalMonthlyBillScreen';
import MenuModalScreen from '../screens/MenuModalScreen';
import ExecutiveManagementScreen from '../screens/ExecutiveManagementScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

// Main Stack Navigator
function MainStack() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff7043" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={currentUser ? 'app-stack' : 'auth-stack'}
      screenOptions={{
        headerShown: false,
      }}
    >
      {!currentUser ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen
            name="MenuModal"
            component={MenuModalScreen}
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="EmployeeSaleInvoice"
            component={EmployeeSaleInvoiceScreen}
          />
          <Stack.Screen name="CashReceipts" component={CashReceiptsScreen} />
          <Stack.Screen name="BankReceipts" component={BankReceiptsScreen} />
          <Stack.Screen name="EmployeeReturn" component={EmployeeReturnScreen} />
          <Stack.Screen name="SalesReturns" component={SalesReturnsScreen} />
          <Stack.Screen name="RentalService" component={RentalServiceScreen} />
          <Stack.Screen
            name="RentalMonthlyBill"
            component={RentalMonthlyBillScreen}
          />
          <Stack.Screen
            name="ExecutiveManagement"
            component={ExecutiveManagementScreen}
          />
        </>
      )}
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

