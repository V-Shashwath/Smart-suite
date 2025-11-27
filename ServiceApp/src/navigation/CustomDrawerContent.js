import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';

const CustomDrawerContent = (props) => {
  const [expandedSections, setExpandedSections] = useState({
    transactions: true,
    cash: false,
    bank: true,
    jobWork: true,
    copierTransactions: true,
    refurbished: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const navigateToScreen = (screenName) => {
    props.navigation.navigate(screenName);
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView {...props} style={styles.drawer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Smart Suite</Text>
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigateToScreen('Dashboard')}
      >
        <Text style={styles.menuIcon}>🏠</Text>
        <Text style={styles.menuLabel}>Dashboard</Text>
      </TouchableOpacity>

      {/* Transactions Section */}
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

      {expandedSections.transactions && (
        <View style={styles.subMenu}>
          {/* Cash Sub-Section */}
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

          {/* Bank Sub-Section */}
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

          {/* Job Work Sub-Section */}
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
              <TouchableOpacity
                style={styles.subSubMenuItem}
                onPress={() => navigateToScreen('EmployeeSalesInvoice')}
              >
                <Text style={styles.subSubMenuLabel}>Employee Sale Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.subSubMenuItem}
                onPress={() => navigateToScreen('EmployeeReturn')}
              >
                <Text style={styles.subSubMenuLabel}>Employee Return</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Copier Transactions Sub-Section */}
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
              <TouchableOpacity
                style={styles.subSubMenuItem}
                onPress={() => navigateToScreen('RentalService')}
              >
                <Text style={styles.subSubMenuLabel}>Rental Service</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.subSubMenuItem}
                onPress={() => navigateToScreen('RentalMonthlyBill')}
              >
                <Text style={styles.subSubMenuLabel}>Rental Monthly Bill</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Refurbished Sub-Section */}
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
        </View>
      )}

      <TouchableOpacity
        style={[styles.menuItem, styles.logoutButton]}
        onPress={() => {
          props.navigation.navigate('Login');
        }}
      >
        <Text style={styles.menuIcon}>🚪</Text>
        <Text style={styles.menuLabel}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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

export default CustomDrawerContent;


