import React, { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getScreenMeta } from '../constants/screenRegistry';
import withScreenPermission from '../components/withScreenPermission';

const emptyForm = {
  name: '',
  username: '',
  password: '',
  databaseName: 'CrystalCopier',
  assignedScreens: [],
};

const ExecutiveManagementScreen = ({ navigation }) => {
  const {
    executives,
    addExecutive,
    updateExecutive,
    deleteExecutive,
    assignableScreens,
    currentUser,
    refreshExecutives,
  } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formState, setFormState] = useState(emptyForm);
  const [editingExecutive, setEditingExecutive] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const assignableScreenMetas = useMemo(
    () => assignableScreens.map((route) => getScreenMeta(route)),
    [assignableScreens]
  );

  // Refresh executives when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser && currentUser.role === 'supervisor') {
        setIsRefreshing(true);
        refreshExecutives().finally(() => {
          setIsRefreshing(false);
        });
      }
    }, [refreshExecutives, currentUser])
  );

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingExecutive(null);
  };

  const openEditModal = (executive) => {
    setEditingExecutive(executive);
    setFormState({
      name: executive.name || executive.employeeName,
      username: executive.username,
      assignedScreens: executive.assignedScreens || [],
    });
    setIsModalVisible(true);
  };

  const toggleScreenSelection = (route) => {
    setFormState((prev) => {
      const current = prev.assignedScreens || [];
      const exists = current.includes(route);
      return {
        ...prev,
        assignedScreens: exists
          ? current.filter((item) => item !== route)
          : [...current, route],
      };
    });
  };

  const handleSubmit = async () => {
    if (!formState.assignedScreens.length) {
      Alert.alert('Assign at least one screen', 'Executives need at least one screen to access.');
      return;
    }

    if (!editingExecutive || !editingExecutive.employeeId) {
      Alert.alert('Error', 'Employee ID is required. Please select an existing employee.');
      return;
    }

      try {
        setIsSubmitting(true);
        await updateExecutive(editingExecutive.id, {
          assignedScreens: formState.assignedScreens,
        });
        // Refresh executives list after update
        await refreshExecutives();
        Alert.alert('Updated', `Screen assignments for ${formState.username || editingExecutive.name} updated successfully.`);
        setIsModalVisible(false);
        resetForm();
      } catch (error) {
        Alert.alert('Unable to save', error.message || 'Please try again.');
      } finally {
        setIsSubmitting(false);
      }
  };

  const confirmDelete = (executive) => {
    Alert.alert(
      'Remove Screen Assignments',
      `Remove all screen assignments for ${executive.username}? They will not be able to access any screens until reassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateExecutive(executive.id, { assignedScreens: [] });
              // Refresh executives list after deletion
              await refreshExecutives();
              Alert.alert('Success', 'Screen assignments removed.');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove assignments.');
            }
          },
        },
      ]
    );
  };

  const renderExecutive = ({ item }) => {
    const assignedLabels =
      item.assignedScreens?.map((route) => getScreenMeta(route)?.title || route) ||
      [];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <MaterialIcons name="person" size={20} color="#1976D2" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>{item.name || item.username}</Text>
          </View>
          <Text style={styles.roleBadge}>Executive</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <MaterialIcons name="account-circle" size={16} color="#666" />
            <Text style={styles.cardSubtitle}>Username: {item.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="storage" size={16} color="#666" />
            <Text style={styles.cardSubtitle}>Database: {item.databaseName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="apps" size={16} color="#666" />
            <Text style={styles.cardSubtitle}>
              Screens: {assignedLabels.length ? assignedLabels.join(', ') : 'None'}
            </Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => confirmDelete(item)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(13, 72, 161, 0.95)" />
      {Platform.OS === 'android' && (
        <View style={styles.statusBarSpacer} />
      )}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.screenTitle} numberOfLines={1} ellipsizeMode="tail">
            EXECUTIVE MANAGEMENT
          </Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>
            Manage screen assignments
          </Text>
        </View>
        <View style={styles.navButton}>
          {isRefreshing && <ActivityIndicator size="small" color="#fff" />}
        </View>
      </View>

      <View style={styles.content}>
        {executives.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No executives yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create an executive and assign screens so they can access Smart Suite.
            </Text>
          </View>
        ) : (
          <FlatList
            data={executives}
            renderItem={renderExecutive}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                Assign Screens to Executive
              </Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={formState.name}
                placeholder="Display name"
                editable={false}
              />

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={formState.username}
                placeholder="Unique username"
                autoCapitalize="none"
                editable={false}
              />

              <Text style={[styles.label, styles.screenLabel]}>Assign Screens</Text>
              <View style={styles.screenGrid}>
                {assignableScreenMetas.map((screen) => (
                  <TouchableOpacity
                    key={screen.route}
                    style={[
                      styles.screenChip,
                      formState.assignedScreens.includes(screen.route) &&
                        styles.screenChipSelected,
                    ]}
                    onPress={() => toggleScreenSelection(screen.route)}
                  >
                    <View style={styles.screenChipContent}>
                      <MaterialIcons 
                        name={screen.icon} 
                        size={18} 
                        color={formState.assignedScreens.includes(screen.route) ? '#fff' : '#1976D2'} 
                        style={styles.screenChipIcon}
                      />
                      <Text
                        style={[
                          styles.screenChipText,
                          formState.assignedScreens.includes(screen.route) &&
                            styles.screenChipTextSelected,
                        ]}
                      >
                        {screen.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsModalVisible(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.saveButtonText}>
                    {isSubmitting ? 'Saving...' : editingExecutive ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarSpacer: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    backgroundColor: 'rgba(13, 72, 161, 0.95)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(13, 72, 161, 0.95)',
    borderBottomWidth: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    flexShrink: 1,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  screenSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0D47A1',
    letterSpacing: 0.5,
    flex: 1,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(25, 118, 210, 0.2)',
    color: '#0D47A1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.3)',
  },
  cardInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#1976D2',
    shadowColor: '#1976D2',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
    shadowColor: '#D32F2F',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0D47A1',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 14,
    padding: 20,
    maxHeight: '95%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D47A1',
    marginBottom: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E3F2FD',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgb(255, 255, 255)',
    borderWidth: 1,
    borderColor: '#9e9e9e',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
    color: '#000',
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  readOnlyInput: {
    backgroundColor: 'rgba(236, 239, 241, 0.85)',
    borderColor: '#B0B0B0',
    color: '#000',
    fontWeight: '700',
  },
  screenLabel: {
    marginTop: 4,
  },
  screenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    marginTop: 8,
  },
  screenChip: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minWidth: 100,
  },
  screenChipSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
    elevation: 5,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    transform: [{ scale: 1.02 }],
  },
  screenChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  screenChipIcon: {
    marginRight: 0,
  },
  screenChipText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  screenChipTextSelected: {
    color: '#fff',
    fontWeight: '900',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#E3F2FD',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#90A4AE',
    shadowColor: '#90A4AE',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

export default withScreenPermission('ExecutiveManagement')(ExecutiveManagementScreen);


