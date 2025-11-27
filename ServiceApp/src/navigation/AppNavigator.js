import React from 'react';
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

const Stack = createStackNavigator();

// Main Stack Navigator
function MainStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false 
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen 
        name="MenuModal" 
        component={MenuModalScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen name="EmployeeSaleInvoice" component={EmployeeSaleInvoiceScreen} />
      <Stack.Screen name="CashReceipts" component={CashReceiptsScreen} />
      <Stack.Screen name="BankReceipts" component={BankReceiptsScreen} />
      <Stack.Screen name="EmployeeReturn" component={EmployeeReturnScreen} />
      <Stack.Screen name="SalesReturns" component={SalesReturnsScreen} />
      <Stack.Screen name="RentalService" component={RentalServiceScreen} />
      <Stack.Screen name="RentalMonthlyBill" component={RentalMonthlyBillScreen} />
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

