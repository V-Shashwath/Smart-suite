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
import { MaterialIcons } from '@expo/vector-icons';
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
        <MaterialIcons name="supervisor-account" size={24} color="#424242" style={styles.menuIcon} />
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
          <MaterialIcons name="dashboard" size={24} color="#424242" style={styles.menuIcon} />
          <Text style={styles.menuLabel}>Dashboard</Text>
        </TouchableOpacity>

        {/* Transactions Section */}
        {hasSectionAccess(accessibleRoutes) && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => toggleSection('transactions')}
          >
            <MaterialIcons name="analytics" size={24} color="#424242" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Transactions</Text>
            <MaterialIcons 
              name={expandedSections.transactions ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
              size={20} 
              color="#666" 
              style={styles.arrowIcon}
            />
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
                  <MaterialIcons name="paid" size={22} color="#424242" style={styles.subMenuIcon} />
                  <Text style={styles.subMenuLabel}>Cash</Text>
                  <MaterialIcons 
                    name={expandedSections.cash ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={18} 
                    color="#666" 
                    style={styles.arrowIcon}
                  />
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
                  <MaterialIcons name="account-balance" size={22} color="#424242" style={styles.subMenuIcon} />
                  <Text style={styles.subMenuLabel}>Bank</Text>
                  <MaterialIcons 
                    name={expandedSections.bank ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={18} 
                    color="#666" 
                    style={styles.arrowIcon}
                  />
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
                  <MaterialIcons name="work" size={22} color="#424242" style={styles.subMenuIcon} />
                  <Text style={styles.subMenuLabel}>Job Work</Text>
                  <MaterialIcons 
                    name={expandedSections.jobWork ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={18} 
                    color="#666" 
                    style={styles.arrowIcon}
                  />
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
                  <MaterialIcons name="print" size={22} color="#424242" style={styles.subMenuIcon} />
                  <Text style={styles.subMenuLabel}>Copier Transactions</Text>
                  <MaterialIcons 
                    name={expandedSections.copierTransactions ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={18} 
                    color="#666" 
                    style={styles.arrowIcon}
                  />
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
                  <MaterialIcons name="recycling" size={22} color="#424242" style={styles.subMenuIcon} />
                  <Text style={styles.subMenuLabel}>Refurbished</Text>
                  <MaterialIcons 
                    name={expandedSections.refurbished ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={18} 
                    color="#666" 
                    style={styles.arrowIcon}
                  />
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
          <MaterialIcons name="logout" size={24} color="#424242" style={styles.menuIcon} />
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
    marginRight: 12,
    width: 24,
  },
  menuLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  arrowIcon: {
    width: 20,
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

