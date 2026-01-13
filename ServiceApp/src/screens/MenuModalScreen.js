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
        activeOpacity={0.7}
      >
        <View style={styles.menuIconContainer}>
          <MaterialIcons name="supervisor-account" size={24} color="#fff" />
        </View>
        <Text style={styles.menuLabel}>Executive Management</Text>
      </TouchableOpacity>
    );
  };

  const hasSectionAccess = (routes) => routes.some((route) => hasAccessToScreen(route));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      {Platform.OS === 'android' && (
        <View style={styles.statusBarSpacer} />
      )}
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientOverlay} />
        <View style={styles.backgroundPattern}>
          <View style={styles.gridLine1} />
          <View style={styles.gridLine2} />
          <View style={styles.gridLine3} />
        </View>
        <View style={styles.accentCircle1} />
        <View style={styles.accentCircle2} />
      </View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Smart Suite</Text>
            {currentUser && (
              <View style={styles.userInfoContainer}>
                <View style={styles.userDot} />
                <Text style={styles.headerSubtitle}>
                  {currentUser.username} • {currentUser.role}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.menu}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemFirst]}
          onPress={() => navigateToScreen('Dashboard')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <MaterialIcons name="dashboard" size={24} color="#fff" />
          </View>
          <Text style={styles.menuLabel}>Dashboard</Text>
        </TouchableOpacity>

        {/* Transactions Section */}
        {hasSectionAccess(accessibleRoutes) && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => toggleSection('transactions')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <MaterialIcons name="analytics" size={24} color="#fff" />
            </View>
            <Text style={styles.menuLabel}>Transactions</Text>
            <MaterialIcons 
              name={expandedSections.transactions ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
              size={26} 
              color="#4CAF50" 
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
                  activeOpacity={0.7}
                >
                  <View style={styles.subMenuIconContainer}>
                    <MaterialIcons name="paid" size={20} color="#fff" />
                  </View>
                  <Text style={styles.subMenuLabel}>Cash</Text>
                  <MaterialIcons 
                    name={expandedSections.cash ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={22} 
                    color="#4CAF50" 
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>

                {expandedSections.cash && (
                  <View style={styles.subSubMenu}>
                    <TouchableOpacity
                      style={styles.subSubMenuItem}
                      onPress={() => navigateToScreen('CashReceipts')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subSubMenuLabel}>Cash Receipts</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {hasAccessToScreen('BankReceipts') && (
              <>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => toggleSection('bank')}
                  activeOpacity={0.7}
                >
                  <View style={styles.subMenuIconContainer}>
                    <MaterialIcons name="account-balance" size={20} color="#fff" />
                  </View>
                  <Text style={styles.subMenuLabel}>Bank</Text>
                  <MaterialIcons 
                    name={expandedSections.bank ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={22} 
                    color="#4CAF50" 
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>

                {expandedSections.bank && (
                  <View style={styles.subSubMenu}>
                    <TouchableOpacity
                      style={styles.subSubMenuItem}
                      onPress={() => navigateToScreen('BankReceipts')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subSubMenuLabel}>Bank Receipts</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {hasAccessToScreen('EmployeeSaleInvoice') && (
              <>
                <TouchableOpacity
                  style={styles.subMenuItem}
                  onPress={() => toggleSection('jobWork')}
                  activeOpacity={0.7}
                >
                  <View style={styles.subMenuIconContainer}>
                    <MaterialIcons name="work" size={20} color="#fff" />
                  </View>
                  <Text style={styles.subMenuLabel}>Job Work</Text>
                  <MaterialIcons 
                    name={expandedSections.jobWork ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={22} 
                    color="#4CAF50" 
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>

                {expandedSections.jobWork && (
                  <View style={styles.subSubMenu}>
                    {hasAccessToScreen('EmployeeSaleInvoice') && (
                      <TouchableOpacity
                        style={styles.subSubMenuItem}
                        onPress={() => navigateToScreen('EmployeeSaleInvoice')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.subSubMenuLabel}>Employee Sale Invoice</Text>
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
                  activeOpacity={0.7}
                >
                  <View style={styles.subMenuIconContainer}>
                    <MaterialIcons name="print" size={20} color="#fff" />
                  </View>
                  <Text style={styles.subMenuLabel}>Copier Transactions</Text>
                  <MaterialIcons 
                    name={expandedSections.copierTransactions ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={22} 
                    color="#4CAF50" 
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>

                {expandedSections.copierTransactions && (
                  <View style={styles.subSubMenu}>
                    {hasAccessToScreen('RentalService') && (
                      <TouchableOpacity
                        style={styles.subSubMenuItem}
                        onPress={() => navigateToScreen('RentalService')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.subSubMenuLabel}>Rental Service</Text>
                      </TouchableOpacity>
                    )}
                    {hasAccessToScreen('RentalMonthlyBill') && (
                      <TouchableOpacity
                        style={styles.subSubMenuItem}
                        onPress={() => navigateToScreen('RentalMonthlyBill')}
                        activeOpacity={0.7}
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
                  activeOpacity={0.7}
                >
                  <View style={styles.subMenuIconContainer}>
                    <MaterialIcons name="recycling" size={20} color="#fff" />
                  </View>
                  <Text style={styles.subMenuLabel}>Refurbished</Text>
                  <MaterialIcons 
                    name={expandedSections.refurbished ? 'keyboard-arrow-down' : 'keyboard-arrow-right'} 
                    size={22} 
                    color="#4CAF50" 
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>

                {expandedSections.refurbished && (
                  <View style={styles.subSubMenu}>
                    <TouchableOpacity
                      style={styles.subSubMenuItem}
                      onPress={() => navigateToScreen('SalesReturns')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subSubMenuLabel}>Sales Returns</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {renderExecutiveManagement()}

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconContainer, styles.logoutIconContainer]}>
            <MaterialIcons name="logout" size={22} color="#fff" />
          </View>
          <Text style={[styles.menuLabel, styles.logoutLabel]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D47A1',
  },
  statusBarSpacer: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    backgroundColor: 'transparent',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D47A1',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1565C0',
    opacity: 0.8,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#fff',
    top: '25%',
    opacity: 0.1,
  },
  gridLine2: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#fff',
    top: '50%',
    opacity: 0.1,
  },
  gridLine3: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#fff',
    top: '75%',
    opacity: 0.1,
  },
  accentCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#4CAF50',
    opacity: 0.2,
    top: -40,
    right: -40,
  },
  accentCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1976D2',
    opacity: 0.3,
    bottom: -20,
    left: -20,
  },
  header: {
    padding: 18,
    paddingTop: 18,
    backgroundColor: 'rgba(13, 71, 161, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 10,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#BBDEFB',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  closeButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  menu: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContent: {
    paddingBottom: 16,
    paddingTop: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 14,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 10,
    elevation: 6,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    overflow: 'hidden',
  },
  menuItemFirst: {
    marginTop: 6,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    elevation: 3,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuLabel: {
    fontSize: 15,
    color: '#0D47A1',
    flex: 1,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  arrowIcon: {
    width: 24,
    color: '#4CAF50',
  },
  subMenu: {
    backgroundColor: 'transparent',
    paddingLeft: 44,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    paddingLeft: 22,
    marginVertical: 3,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  subMenuIconContainer: {
    width: 34,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  subMenuLabel: {
    fontSize: 14,
    color: '#023811',
    flex: 1,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  subSubMenu: {
    backgroundColor: 'transparent',
    paddingLeft: 44,
    marginLeft: 16,
    marginRight: 0,
    marginTop: 2,
    marginBottom: 2,
  },
  subSubMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    paddingLeft: 22,
    marginVertical: 3,
    marginHorizontal: 0,
    backgroundColor: '#042b40',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 1.5,
    borderColor: '#455A64',
    borderLeftWidth: 3,
    borderLeftColor: '#66BB6A',
  },
  subSubMenuIcon: {
    marginRight: 12,
  },
  subSubMenuLabel: {
    fontSize: 13,
    color: '#E8E8E8',
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 18,
    marginHorizontal: 14,
    backgroundColor: '#C62828',
    borderRadius: 12,
    borderWidth: 0,
    elevation: 8,
    shadowColor: '#C62828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  logoutLabel: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

export default MenuModalScreen;

