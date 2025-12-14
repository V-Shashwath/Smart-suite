import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const ItemTable = ({
  columns,
  data,
  onAddRow,
  onDeleteRow,
  onCellChange,
  itemsPerPage = 5,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageState, setItemsPerPageState] = useState(itemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPageState);
  const startIndex = (currentPage - 1) * itemsPerPageState;
  const endIndex = startIndex + itemsPerPageState;
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderCell = (row, column, rowIndex) => {
    const cellValue = row[column.key] || '';
    const actualRowIndex = startIndex + rowIndex;

    if (column.type === 'dropdown') {
      return (
        <View style={styles.cell}>
          <Picker
            selectedValue={cellValue || ''}
            onValueChange={(value) =>
              onCellChange(actualRowIndex, column.key, value)
            }
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Select" value="" />
            {column.options?.map((option, idx) => (
              <Picker.Item
                key={idx}
                label={String(option.label || option)}
                value={option.value || option}
              />
            ))}
          </Picker>
        </View>
      );
    }

    return (
      <TextInput
        style={styles.cellInput}
        value={String(cellValue)}
        onChangeText={(text) =>
          onCellChange(actualRowIndex, column.key, text)
        }
        placeholder={column.placeholder || ''}
        keyboardType={column.keyboardType || 'default'}
        editable={(() => {
          if (column.editable === undefined || column.editable === null) return true;
          if (typeof column.editable === 'boolean') return column.editable;
          if (typeof column.editable === 'string') {
            return column.editable.toLowerCase() === 'true' || column.editable === '1';
          }
          return Boolean(column.editable);
        })()}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Add Button */}
      {onAddRow && (
        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={onAddRow}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Table Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={Boolean(true)}>
        <View>
          <View style={styles.tableHeader}>
            {columns.map((column, idx) => (
              <View
                key={idx}
                style={[
                  styles.headerCell,
                  { width: column.width || 120 },
                ]}
              >
                <Text style={styles.headerText}>
                  {column.label}
                  {column.required && <Text style={styles.required}>*</Text>}
                </Text>
              </View>
            ))}
            {onDeleteRow && (
              <View style={[styles.headerCell, { width: 60 }]}>
                <Text style={styles.headerText}>Actions</Text>
              </View>
            )}
          </View>

          {/* Table Rows */}
          {currentData.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {columns.map((column, colIndex) => (
                <View
                  key={colIndex}
                  style={[
                    styles.cellContainer,
                    { width: column.width || 120 },
                  ]}
                >
                  {renderCell(row, column, rowIndex)}
                </View>
              ))}
              {onDeleteRow && (
                <View style={[styles.cellContainer, { width: 60 }]}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDeleteRow(startIndex + rowIndex)}
                  >
                    <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Pagination */}
      <View style={styles.pagination}>
        <View style={styles.paginationLeft}>
          <Text style={styles.paginationText}>Items per page:</Text>
          <Picker
            selectedValue={itemsPerPageState}
            onValueChange={(value) => {
              setItemsPerPageState(value);
              setCurrentPage(1);
            }}
            style={styles.pageSizePicker}
          >
            <Picker.Item label="5" value={5} />
            <Picker.Item label="10" value={10} />
            <Picker.Item label="20" value={20} />
            <Picker.Item label="50" value={50} />
          </Picker>
        </View>

        <View style={styles.paginationRight}>
          <Text style={styles.paginationText}>
            {startIndex + 1} - {Math.min(endIndex, data.length)} of {data.length}
          </Text>
          <View style={styles.paginationButtons}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled,
              ]}
              onPress={() => handlePageChange(1)}
              disabled={Boolean(currentPage === 1)}
            >
              <Text style={styles.paginationButtonText}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled,
              ]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={Boolean(currentPage === 1)}
            >
              <Text style={styles.paginationButtonText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled,
              ]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={Boolean(currentPage === totalPages)}
            >
              <Text style={styles.paginationButtonText}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled,
              ]}
              onPress={() => handlePageChange(totalPages)}
              disabled={Boolean(currentPage === totalPages)}
            >
              <Text style={styles.paginationButtonText}>⏭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#f44336',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cellContainer: {
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    minHeight: 50,
    justifyContent: 'center',
  },
  cell: {
    padding: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  cellInput: {
    padding: 8,
    fontSize: 13,
    color: '#333',
    minHeight: 40,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationText: {
    fontSize: 12,
    color: '#666',
  },
  pageSizePicker: {
    width: 60,
    height: 30,
  },
  paginationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  paginationButton: {
    padding: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ItemTable;


