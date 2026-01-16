import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { getScreenMeta } from '../constants/screenRegistry';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { currentUser, getAccessibleScreens } = useAuth();

  const menuItems = useMemo(() => {
    const routes = getAccessibleScreens();
    const items = routes
      .map((route) => {
        const meta = getScreenMeta(route);
        if (!meta) return null;
        return { title: meta.title, screen: meta.route, icon: meta.icon, category: meta.category };
      })
      .filter(Boolean);
    
    // Separate Executive Management from other items
    const executiveManagement = items.find(item => item.screen === 'ExecutiveManagement');
    const otherItems = items.filter(item => item.screen !== 'ExecutiveManagement');
    
    // Sort other items alphabetically
    otherItems.sort((a, b) => a.title.localeCompare(b.title));
    
    // Put Executive Management at the end
    return executiveManagement 
      ? [...otherItems, executiveManagement]
      : otherItems;
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
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      {Platform.OS === 'android' && (
        <View style={styles.statusBarSpacer} />
      )}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundPattern}>
          <View style={styles.gridLine1} />
          <View style={styles.gridLine2} />
          <View style={styles.gridLine3} />
        </View>
      </View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MenuModal')}
            style={styles.menuButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            {currentUser && (
              <View style={styles.userInfoContainer}>
                <View style={styles.userDot} />
                <Text style={styles.headerSubtitle}>
                  {currentUser.username} • {currentUser.role === 'supervisor' ? 'Supervisor' : 'Executive'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>
      </View>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No screens assigned yet</Text>
            <Text style={styles.emptySubtitle}>
              Contact a supervisor to assign screens to this executive.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {menuItems.map((item, index) => {
              const isExecutiveManagement = item.screen === 'ExecutiveManagement';
              return (
                <TouchableOpacity
                  key={item.screen}
                  style={[styles.card, isExecutiveManagement && styles.cardFullWidth]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={['#1976D2', '#42A5F5', '#4CAF50']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconGradient}
                      >
                        <MaterialIcons name={item.icon} size={32} color="#fff" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
    backgroundColor: '#dde4eb',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  gridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#1976D2',
    top: '30%',
    opacity: 0.1,
  },
  gridLine2: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#1976D2',
    top: '60%',
    opacity: 0.1,
  },
  gridLine3: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#1976D2',
    top: '90%',
    opacity: 0.1,
  },
  header: {
    padding: 18,
    paddingTop: 18,
    backgroundColor: 'rgba(13, 72, 161, 0.95)',
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
    marginLeft: 12,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#BBDEFB',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  menuButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    opacity: 0.4,
    top: 2,
    left: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 2.5,
    borderColor: '#66BB6A',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    minHeight: 140,
    elevation: 8,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  cardFullWidth: {
    width: '100%',
  },
  cardInner: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D47A1',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  emptyState: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#0D47A1',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64B5F6',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
});

export default DashboardScreen;


