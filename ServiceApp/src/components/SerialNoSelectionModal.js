import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  CheckBox,
  Alert,
} from 'react-native';

const SerialNoSelectionModal = ({ 
  isVisible, 
  onClose, 
  productName,
  issuedProducts = [],
  onConfirm 
}) => {
  const [selectedSerialNos, setSelectedSerialNos] = useState([]);

  const toggleSerialNo = (serialNo) => {
    setSelectedSerialNos(prev => {
      if (prev.includes(serialNo)) {
        return prev.filter(s => s !== serialNo);
      } else {
        return [...prev, serialNo];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedSerialNos.length === 0) {
      Alert.alert('No Selection', 'Please select at least one Serial Number to add.');
      return;
    }
    onConfirm(selectedSerialNos);
    setSelectedSerialNos([]); // Reset selection
  };

  const handleCancel = () => {
    setSelectedSerialNos([]); // Reset selection
    onClose();
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedSerialNos.includes(item.productSerialNo);
    return (
      <TouchableOpacity
        style={[styles.itemRow, isSelected && styles.itemRowSelected]}
        onPress={() => toggleSerialNo(item.productSerialNo)}
      >
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={isSelected}
            onValueChange={() => toggleSerialNo(item.productSerialNo)}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.serialNoText}>{item.productSerialNo}</Text>
          <Text style={styles.quantityText}>
            Qty: {item.quantity} | Voucher: {item.voucherSeries}-{item.voucherNo}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Serial Numbers</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Product Name */}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.instructionText}>
              Select the Serial Numbers that were issued to you:
            </Text>
          </View>

          {/* Serial Numbers List */}
          <FlatList
            data={issuedProducts}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.productSerialNo}-${index}`}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, selectedSerialNos.length === 0 && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={selectedSerialNos.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                Add Selected ({selectedSerialNos.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FF5722',
    borderBottomWidth: 2,
    borderBottomColor: '#C62828',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemRowSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  serialNoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#FF5722',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SerialNoSelectionModal;

