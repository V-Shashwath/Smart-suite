import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getScreenMeta } from '../constants/screenRegistry';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { currentUser, getAccessibleScreens } = useAuth();

  const menuItems = useMemo(() => {
    const routes = getAccessibleScreens();
    return routes
      .map((route) => {
        const meta = getScreenMeta(route);
        if (!meta) return null;
        return { title: meta.title, screen: meta.route, icon: meta.icon, category: meta.category };
      })
      .filter(Boolean);
  }, [getAccessibleScreens]);

  const initials = useMemo(() => {
    if (!currentUser?.username) return 'SS';
    return currentUser.username
      .split(' ')
      .map((chunk) => chunk[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MenuModal')}
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          {currentUser && (
            <Text style={styles.roleText}>
              {currentUser.role === 'supervisor' ? 'Supervisor' : 'Executive'}
            </Text>
          )}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
      <ScrollView style={styles.content}>
        {menuItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No screens assigned yet</Text>
            <Text style={styles.emptySubtitle}>
              Contact a supervisor to assign screens to this executive.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.screen}
                style={styles.card}
                onPress={() => navigation.navigate(item.screen)}
              >
                <MaterialIcons name={item.icon} size={40} color="#FF7043" />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  roleText: {
    fontSize: 12,
    color: '#78909c',
    marginTop: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#455a64',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#90a4ae',
    textAlign: 'center',
  },
});

export default DashboardScreen;


