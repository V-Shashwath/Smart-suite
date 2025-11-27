import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { adjustmentsList } from '../data/mockData';

const AddAdjustmentModal = ({ isVisible, onAddAdjustment, onClose }) => {
  const [selectedAccount, setSelectedAccount] = useState(adjustmentsList[0]);
  const [addAmount, setAddAmount] = useState('');
  const [lessAmount, setLessAmount] = useState('');
  const [comments, setComments] = useState('');

  const handleAccountChange = (accountId) => {
    const account = adjustmentsList.find((a) => a.id === accountId);
    if (account) {
      setSelectedAccount(account);
      // Auto-clear amounts based on account type
      if (account.type === 'add') {
        setLessAmount('');
      } else if (account.type === 'less') {
        setAddAmount('');
      }
    }
  };

  const handleAddAmountChange = (value) => {
    setAddAmount(value);
    // Clear less amount if add amount is entered
    if (value) {
      setLessAmount('');
    }
  };

  const handleLessAmountChange = (value) => {
    setLessAmount(value);
    // Clear add amount if less amount is entered
    if (value) {
      setAddAmount('');
    }
  };

  const handleAddAdjustment = () => {
    const add = parseFloat(addAmount) || 0;
    const less = parseFloat(lessAmount) || 0;

    // Validation: at least one amount should be entered
    if (add === 0 && less === 0) {
      alert('Please enter either Add amount or Less amount');
      return;
    }

    const newAdjustment = {
      id: Date.now(), // Unique ID based on timestamp
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      accountType: selectedAccount.type,
      addAmount: add,
      lessAmount: less,
      comments: comments.trim(),
    };

    onAddAdjustment(newAdjustment);
    
    // Reset form
    setSelectedAccount(adjustmentsList[0]);
    setAddAmount('');
    setLessAmount('');
    setComments('');
  };

  return (
    <Modal
      visible={Boolean(isVisible)}
      animationType="slide"
      transparent={Boolean(true)}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={Boolean(false)}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add Adjustment</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Account Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Select Account</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedAccount.id}
                  onValueChange={handleAccountChange}
                  style={styles.picker}
                >
                  {adjustmentsList.map((account) => (
                    <Picker.Item
                      key={account.id}
                      label={`${account.name} (${account.type === 'add' ? '+' : '-'})`}
                      value={account.id}
                    />
                  ))}
                </Picker>
              </View>
              {/* Type indicator */}
              <View style={styles.typeIndicator}>
                <Text style={styles.typeIndicatorText}>
                  Type: {selectedAccount.type === 'add' ? '➕ Add' : '➖ Less'}
                </Text>
              </View>
            </View>

            {/* Add Amount Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Add Amount (+)</Text>
              <TextInput
                style={[
                  styles.input,
                  selectedAccount.type === 'less' && styles.disabledInput,
                ]}
                value={addAmount}
                onChangeText={handleAddAmountChange}
                placeholder="Enter add amount"
                keyboardType="numeric"
                editable={Boolean(selectedAccount.type !== 'less')}
              />
              {selectedAccount.type === 'less' && (
                <Text style={styles.helperText}>
                  (Disabled - This account is for "Less" amounts)
                </Text>
              )}
            </View>

            {/* Less Amount Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Less Amount (-)</Text>
              <TextInput
                style={[
                  styles.input,
                  selectedAccount.type === 'add' && styles.disabledInput,
                ]}
                value={lessAmount}
                onChangeText={handleLessAmountChange}
                placeholder="Enter less amount"
                keyboardType="numeric"
                editable={Boolean(selectedAccount.type !== 'add')}
              />
              {selectedAccount.type === 'add' && (
                <Text style={styles.helperText}>
                  (Disabled - This account is for "Add" amounts)
                </Text>
              )}
            </View>

            {/* Comments Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Comments1</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={comments}
                onChangeText={setComments}
                placeholder="Enter comments (optional)"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>
                  {selectedAccount.name}
                </Text>
                {addAmount ? (
                  <Text style={styles.previewAmount}>
                    + ₹{parseFloat(addAmount || 0).toFixed(2)}
                  </Text>
                ) : lessAmount ? (
                  <Text style={[styles.previewAmount, { color: '#f44336' }]}>
                    - ₹{parseFloat(lessAmount || 0).toFixed(2)}
                  </Text>
                ) : (
                  <Text style={[styles.previewAmount, { color: '#999' }]}>
                    No amount entered
                  </Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAddAdjustment}
              >
                <Text style={styles.addButtonText}>Add Adjustment</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#FF9800',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIconButton: {
    padding: 5,
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  typeIndicator: {
    marginTop: 6,
    backgroundColor: '#e3f2fd',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typeIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  helperText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  previewContainer: {
    marginBottom: 16,
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  previewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  previewAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  addButton: {
    backgroundColor: '#FF9800',
    marginLeft: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AddAdjustmentModal;




