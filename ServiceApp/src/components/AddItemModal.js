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
import { products } from '../data/mockData';

const AddItemModal = ({ isVisible, onAddItem, onClose }) => {
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [quantity, setQuantity] = useState('1');

  const handleAddItem = () => {
    const qty = parseInt(quantity) || 1;
    const gross = selectedProduct.rate * qty;
    const net = gross; // For now, net equals gross (no discounts yet)

    const newItem = {
      id: Date.now(), // Unique ID based on timestamp
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qty,
      rate: selectedProduct.rate,
      gross: gross,
      net: net,
    };

    onAddItem(newItem);
    
    // Reset form
    setSelectedProduct(products[0]);
    setQuantity('1');
  };

  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add Item</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Product Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Select Product</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedProduct.id}
                  onValueChange={handleProductChange}
                  style={styles.picker}
                >
                  {products.map((product) => (
                    <Picker.Item
                      key={product.id}
                      label={product.name}
                      value={product.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Quantity Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Enter quantity"
                keyboardType="numeric"
              />
            </View>

            {/* Rate Display */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Rate (per unit)</Text>
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>₹ {selectedProduct.rate.toFixed(2)}</Text>
              </View>
            </View>

            {/* Gross Calculation Preview */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gross Amount</Text>
              <View style={[styles.displayBox, styles.grossBox]}>
                <Text style={styles.grossText}>
                  ₹ {(selectedProduct.rate * (parseInt(quantity) || 0)).toFixed(2)}
                </Text>
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
                onPress={handleAddItem}
              >
                <Text style={styles.addButtonText}>Add Item</Text>
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
    maxHeight: '80%',
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
    borderBottomColor: '#2196F3',
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
  displayBox: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  displayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  grossBox: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  grossText: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
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
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AddItemModal;



