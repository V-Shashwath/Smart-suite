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
          <Text style={styles.cardTitle}>{item.name || item.username}</Text>
          <Text style={styles.roleBadge}>Executive</Text>
        </View>
        <Text style={styles.cardSubtitle}>Username: {item.username}</Text>
        <Text style={styles.cardSubtitle}>Database: {item.databaseName}</Text>
        <Text style={styles.cardSubtitle}>
          Screens: {assignedLabels.length ? assignedLabels.join(', ') : 'None'}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => confirmDelete(item)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.screenTitle} numberOfLines={1} ellipsizeMode="tail">
            Executive Management
          </Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>
            Manage screen assignments
          </Text>
        </View>
        <View style={styles.navButton}>
          {isRefreshing && <ActivityIndicator size="small" color="#ff7043" />}
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
                        color={formState.assignedScreens.includes(screen.route) ? '#fff' : '#546e7a'} 
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
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eceff1',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffe0d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff7043',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
    textAlign: 'center',
    flexShrink: 1,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#78909c',
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
  },
  cardTags: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    backgroundColor: '#ede7f6',
    color: '#512da8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#546e7a',
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#1976d2',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#455a64',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#78909c',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#546e7a',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: '#263238',
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#78909c',
  },
  screenLabel: {
    marginTop: 4,
  },
  screenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  screenChip: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  screenChipSelected: {
    backgroundColor: '#ff7043',
    borderColor: '#ff7043',
  },
  screenChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  screenChipIcon: {
    marginRight: 0,
  },
  screenChipText: {
    color: '#546e7a',
    fontWeight: '500',
    fontSize: 13,
  },
  screenChipTextSelected: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#eceff1',
  },
  cancelButtonText: {
    color: '#546e7a',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#ff7043',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default withScreenPermission('ExecutiveManagement')(ExecutiveManagementScreen);


