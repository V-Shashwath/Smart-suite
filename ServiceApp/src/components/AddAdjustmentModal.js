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
import { MaterialIcons } from '@expo/vector-icons';
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
                <MaterialIcons name="close" size={22} color="#fff" />
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
                  Type: {selectedAccount.type === 'add' ? ' ✚ Add' : ' ▬  Less'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#E3F2FD',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
  },
  closeIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgb(63, 61, 61)',
    borderWidth: 1,
    borderColor: '#9e9e9e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#9e9e9e',
    borderRadius: 6,
    backgroundColor: 'rgba(240, 240, 240, 0.86)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  picker: {
    height: 55,
    width: '100%',
  },
  typeIndicator: {
    marginTop: 6,
    backgroundColor: 'rgba(25, 118, 210, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.3)',
  },
  typeIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D47A1',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(240, 240, 240, 0.6)',
    borderWidth: 1,
    borderColor: '#9e9e9e',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  disabledInput: {
    backgroundColor: 'rgba(193, 195, 196, 0.84)',
    borderColor: '#B0B0B0',
    color: '#666',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  helperText: {
    fontSize: 10,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
    fontStyle: 'normal',
  },
  previewContainer: {
    marginBottom: 8,
    backgroundColor: 'rgba(147, 217, 252, 0.3)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(64, 160, 255, 0.6)',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginBottom: 1,
    letterSpacing: 0.3,
  },
  previewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  previewAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4CAF50',
    letterSpacing: 0.3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: 'rgb(89, 87, 87)',
    borderWidth: 1,
    borderColor: '#9e9e9e',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#388E3C',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

export default AddAdjustmentModal;




