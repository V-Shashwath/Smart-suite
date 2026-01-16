import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SerialNoSelectionModal = ({ 
  isVisible, 
  onClose, 
  productName,
  issuedProducts = [],
  existingItems = [],
  onConfirm 
}) => {
  const [selectedSerialNos, setSelectedSerialNos] = useState([]);

  // Get list of serial numbers that are already added to items
  const alreadyAddedSerialNos = useMemo(() => {
    return existingItems
      .filter(item => item.productSerialNo && item.productSerialNo.trim() !== '')
      .map(item => item.productSerialNo.trim());
  }, [existingItems]);

  // Debug: Log when modal opens or data changes
  useEffect(() => {
    if (isVisible) {
      console.log('🔍 SerialNoSelectionModal opened');
      console.log('   Product Name:', productName);
      console.log('   Issued Products Type:', typeof issuedProducts);
      console.log('   Issued Products Is Array:', Array.isArray(issuedProducts));
      console.log('   Issued Products Count:', issuedProducts?.length || 0);
      console.log('   Issued Products:', JSON.stringify(issuedProducts, null, 2));
      
      // Reset selection when modal opens
      setSelectedSerialNos([]);
    }
  }, [isVisible, productName, issuedProducts]);

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
    // Separate new items to add and existing items to remove
    const newSerialNos = selectedSerialNos.filter(
      serialNo => !alreadyAddedSerialNos.includes(serialNo)
    );
    const removeSerialNos = selectedSerialNos.filter(
      serialNo => alreadyAddedSerialNos.includes(serialNo)
    );
    
    if (newSerialNos.length === 0 && removeSerialNos.length === 0) {
      Alert.alert('No Selection', 'Please select at least one Serial Number to add or remove.');
      return;
    }
    onConfirm(newSerialNos, removeSerialNos);
    setSelectedSerialNos([]); // Reset selection
  };

  const handleCancel = () => {
    setSelectedSerialNos([]); // Reset selection
    onClose();
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedSerialNos.includes(item.productSerialNo);
    const isAlreadyAdded = alreadyAddedSerialNos.includes(item.productSerialNo);
    const isSelectedForRemoval = isAlreadyAdded && isSelected;
    
    return (
      <TouchableOpacity
        style={[
          styles.itemRow, 
          isSelected && !isAlreadyAdded && styles.itemRowSelected,
          isAlreadyAdded && !isSelected && styles.itemRowAlreadyAdded,
          isSelectedForRemoval && styles.itemRowSelectedForRemoval
        ]}
        onPress={() => toggleSerialNo(item.productSerialNo)}
      >
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox, 
              isSelected && !isAlreadyAdded && styles.checkboxSelected,
              isAlreadyAdded && !isSelected && styles.checkboxAlreadyAdded,
              isSelectedForRemoval && styles.checkboxSelectedForRemoval
            ]}
            onPress={() => toggleSerialNo(item.productSerialNo)}
          >
            {isSelected && !isAlreadyAdded && (
              <MaterialIcons name="check" size={20} color="#fff" />
            )}
            {isAlreadyAdded && !isSelected && (
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            )}
            {isSelectedForRemoval && (
              <MaterialIcons name="close" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.itemInfo}>
          <View style={styles.serialNoRow}>
            <Text style={[
              styles.serialNoText, 
              isAlreadyAdded && !isSelected && styles.serialNoTextAdded,
              isSelectedForRemoval && styles.serialNoTextRemoved
            ]}>
              {item.productSerialNo}
            </Text>
            {isAlreadyAdded && !isSelected && (
              <Text style={styles.alreadyAddedLabel}>(Already Added)</Text>
            )}
            {isSelectedForRemoval && (
              <Text style={styles.removeLabel}>(Will Remove)</Text>
            )}
          </View>
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
          <View style={styles.listContainer}>
            {issuedProducts && Array.isArray(issuedProducts) && issuedProducts.length > 0 ? (
              <FlatList
                data={issuedProducts}
                renderItem={renderItem}
                keyExtractor={(item, index) => {
                  const key = item?.productSerialNo ? `${item.productSerialNo}-${index}` : `item-${index}`;
                  return key;
                }}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                extraData={selectedSerialNos}
                removeClippedSubviews={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No issued products found</Text>
                <Text style={styles.emptySubtext}>
                  No products with serial numbers were issued to you for this barcode.
                </Text>
                <Text style={styles.debugText}>
                  Debug: Products array length = {issuedProducts?.length || 0}
                </Text>
                <Text style={styles.debugText}>
                  Is Array: {Array.isArray(issuedProducts) ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.debugText}>
                  Type: {typeof issuedProducts}
                </Text>
              </View>
            )}
          </View>

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
                {(() => {
                  const newCount = selectedSerialNos.filter(s => !alreadyAddedSerialNos.includes(s)).length;
                  const removeCount = selectedSerialNos.filter(s => alreadyAddedSerialNos.includes(s)).length;
                  if (newCount > 0 && removeCount > 0) {
                    return `Add ${newCount} / Remove ${removeCount}`;
                  } else if (newCount > 0) {
                    return `Add (${newCount})`;
                  } else if (removeCount > 0) {
                    return `Remove (${removeCount})`;
                  }
                  return 'Confirm';
                })()}
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
    width: '95%',
    maxHeight: '85%',
    height: '77%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#023966',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
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
  listContainer: {
    flex: 1,
    minHeight: 350,
    maxHeight: '100%',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
  },
  itemRowSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  itemRowAlreadyAdded: {
    backgroundColor: '#F1F8E9',
    borderColor: '#81C784',
    borderWidth: 1,
    opacity: 0.7,
  },
  itemRowSelectedForRemoval: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 2,
    opacity: 1,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkboxAlreadyAdded: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  checkboxSelectedForRemoval: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  itemInfo: {
    flex: 1,
  },
  serialNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serialNoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serialNoTextAdded: {
    color: '#4CAF50',
  },
  alreadyAddedLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  removeLabel: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  serialNoTextRemoved: {
    color: '#F44336',
    textDecorationLine: 'line-through',
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
    backgroundColor: '#526670',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#fff',
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

