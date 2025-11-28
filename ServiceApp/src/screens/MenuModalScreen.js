import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getScreenMeta } from '../constants/screenRegistry';

const MenuModalScreen = ({ navigation }) => {
  const [expandedSections, setExpandedSections] = useState({
    transactions: true,
    cash: false,
    bank: false,
    jobWork: false,
    copierTransactions: false,
    refurbished: false,
  });
  const { currentUser, hasAccessToScreen, logout, getAccessibleScreens } = useAuth();

  const accessibleRoutes = useMemo(() => getAccessibleScreens(), [getAccessibleScreens]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const navigateToScreen = (screenName) => {
    if (!hasAccessToScreen(screenName)) {
      Alert.alert('No access', 'Please contact a supervisor for access to this screen.');
      return;
    }
    navigation.goBack();
    requestAnimationFrame(() => {
      navigation.navigate(screenName);
    });
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const renderExecutiveManagement = () => {
    if (currentUser?.role !== 'supervisor') return null;
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigateToScreen('ExecutiveManagement')}
      >
        <Text style={styles.menuIcon}>🧑‍💼</Text>
        <Text style={styles.menuLabel}>Executive Management</Text>
      </TouchableOpacity>
    );
  };

  const hasSectionAccess = (routes) => routes.some((route) => hasAccessToScreen(route));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Smart Suite</Text>
          {currentUser && (
            <Text style={styles.headerSubtitle}>
              {currentUser.username} • {currentUser.role}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigateToScreen('Dashboard')}
        >
          <Text style={styles.menuIcon}>🏠</Text>
          <Text style={styles.menuLabel}>Dashboard</Text>
        </TouchableOpacity>

        {/* Transactions Section */}
        {hasSectionAccess(accessibleRoutes) && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => toggleSection('transactions')}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuLabel}>Transactions</Text>
            <Text style={styles.arrowIcon}>
              {expandedSections.transactions ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
        )}

        {expandedSections.transactions && (
          <View style={styles.subMenu}>
            {hasAccessToScreen('CashReceipts') && (
              <>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => toggleSection('cash')}
                >
                  <Text style={styles.subMenuIcon}>💰</Text>
                  <Text style={styles.subMenuLabel}>Cash</Text>
                  <Text style={styles.arrowIcon}>
                    {expandedSections.cash ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedSections.cash && (
                  <TouchableOpacity
                    style={styles.subSubMenuItem}
                    onPress={() => navigateToScreen('CashReceipts')}
                  >
                    <Text style={styles.subSubMenuLabel}>Cash Receipts</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {hasAccessToScreen('BankReceipts') && (
              <>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => toggleSection('bank')}
                >
                  <Text style={styles.subMenuIcon}>🏦</Text>
                  <Text style={styles.subMenuLabel}>Bank</Text>
                  <Text style={styles.arrowIcon}>
                    {expandedSections.bank ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedSections.bank && (
                  <TouchableOpacity
                    style={styles.subSubMenuItem}
                    onPress={() => navigateToScreen('BankReceipts')}
                  >
                    <Text style={styles.subSubMenuLabel}>Bank Receipts</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {(hasAccessToScreen('EmployeeSaleInvoice') ||
              hasAccessToScreen('EmployeeReturn')) && (
              <>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => toggleSection('jobWork')}
                >
                  <Text style={styles.subMenuIcon}>💼</Text>
                  <Text style={styles.subMenuLabel}>Job Work</Text>
                  <Text style={styles.arrowIcon}>
                    {expandedSections.jobWork ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedSections.jobWork && (
                  <View style={styles.subSubMenu}>
                    {hasAccessToScreen('EmployeeSaleInvoice') && (
                      <TouchableOpacity
                        style={styles.subSubMenuItem}
                        onPress={() => navigateToScreen('EmployeeSaleInvoice')}
                      >
                        <Text style={styles.subSubMenuLabel}>Employee Sale Invoice</Text>
                      </TouchableOpacity>
                    )}
                    {hasAccessToScreen('EmployeeReturn') && (
                      <TouchableOpacity
                        style={styles.subSubMenuItem}
                        onPress={() => navigateToScreen('EmployeeReturn')}
                      >
                        <Text style={styles.subSubMenuLabel}>Employee Return</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}

            {(hasAccessToScreen('RentalService') ||
              hasAccessToScreen('RentalMonthlyBill')) && (
              <>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => toggleSection('copierTransactions')}
                >
                  <Text style={styles.subMenuIcon}>🖨️</Text>
                  <Text style={styles.subMenuLabel}>Copier Transactions</Text>
                  <Text style={styles.arrowIcon}>
                    {expandedSections.copierTransactions ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedSections.copierTransactions && (
                  <View style={styles.subSubMenu}>
                    {hasAccessToScreen('RentalService') && (
                      <TouchableOpacity
                        style={styles.subSubMenuItem}
                        onPress={() => navigateToScreen('RentalService')}
                      >
                        <Text style={styles.subSubMenuLabel}>Rental Service</Text>
                      </TouchableOpacity>
                    )}
                    {hasAccessToScreen('RentalMonthlyBill') && (
                      <TouchableOpacity
                        style={styles.subSubMenuItem}
                        onPress={() => navigateToScreen('RentalMonthlyBill')}
                      >
                        <Text style={styles.subSubMenuLabel}>Rental Monthly Bill</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}

            {hasAccessToScreen('SalesReturns') && (
              <>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => toggleSection('refurbished')}
                >
                  <Text style={styles.subMenuIcon}>♻️</Text>
                  <Text style={styles.subMenuLabel}>Refurbished</Text>
                  <Text style={styles.arrowIcon}>
                    {expandedSections.refurbished ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedSections.refurbished && (
                  <TouchableOpacity
                    style={styles.subSubMenuItem}
                    onPress={() => navigateToScreen('SalesReturns')}
                  >
                    <Text style={styles.subSubMenuLabel}>Sales Returns</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {renderExecutiveManagement()}

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={styles.menuLabel}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#78909c',
    marginTop: 4,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  arrowIcon: {
    fontSize: 12,
    color: '#666',
  },
  subMenu: {
    backgroundColor: '#fafafa',
    paddingLeft: 20,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  subMenuIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  subMenuLabel: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  subSubMenu: {
    backgroundColor: '#f0f0f0',
    paddingLeft: 20,
  },
  subSubMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  subSubMenuLabel: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#ffebee',
  },
});

export default MenuModalScreen;

