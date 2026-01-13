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
                  idx === 0 && styles.firstColumn,
                ]}
              >
                <Text style={styles.headerText}>
                  {column.label}
                  {column.required && <Text style={styles.required}>*</Text>}
                </Text>
              </View>
            ))}
            {onDeleteRow && (
              <View style={[styles.headerCell, { width: 75 }]}>
                <Text style={styles.headerText}>Actions</Text>
              </View>
            )}
          </View>

          {/* Table Rows */}
          {currentData.map((row, rowIndex) => (
            <View 
              key={rowIndex} 
              style={[
                styles.tableRow,
                rowIndex % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
              ]}
            >
              {columns.map((column, colIndex) => (
                <View
                  key={colIndex}
                  style={[
                    styles.cellContainer,
                    { width: column.width || 120 },
                    colIndex === 0 && styles.firstColumn,
                  ]}
                >
                  {renderCell(row, column, rowIndex)}
                </View>
              ))}
              {onDeleteRow && (
                <View style={[styles.cellContainer, { width: 75 }]}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDeleteRow(startIndex + rowIndex)}
                  >
                    <MaterialIcons name="delete" size={22} color="#D32F2F" />
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
            <Picker.Item label="        5" value={5} style={styles.pageSizePickerItem} />
            <Picker.Item label="        10" value={10} style={styles.pageSizePickerItem} />
            <Picker.Item label="        20" value={20} style={styles.pageSizePickerItem} />
            <Picker.Item label="        50" value={50} style={styles.pageSizePickerItem} />
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
    borderRadius: 0,
    padding: 0,
    marginBottom: 0,
  },
  addButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  addButton: {
    backgroundColor: '#30302d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: '#0D47A1',
    borderTopWidth: 1,
    borderTopColor: '#0D47A1',
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#0D47A1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0D47A1',
    letterSpacing: 1,
    textAlign: 'center',
  },
  firstColumn: {
    borderLeftWidth: 1,
    borderLeftColor: '#0D47A1',
  },
  required: {
    color: '#FFEB3B',
    fontWeight: '900',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#0D47A1',
    backgroundColor: '#fff',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#fff',
  },
  cellContainer: {
    borderRightWidth: 1,
    borderRightColor: '#0D47A1',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  cell: {
    padding: 4,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  cellInput: {
    padding: 6,
    fontSize: 12,
    color: '#0D47A1',
    minHeight: 50,
    fontWeight: '700',
    letterSpacing: 0.3,
    backgroundColor: 'transparent',
    textAlign: 'center',
    width: '100%',
  },
  picker: {
    height: 60,
    width: '100%',
    backgroundColor: 'transparent',
  },
  pickerItem: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '600',
    textAlign: 'center',
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
    paddingHorizontal: 2,
    borderTopWidth: 1.5,
    borderTopColor: '#E3F2FD',
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paginationText: {
    fontSize: 11,
    color: '#0D47A1',
    fontWeight: '700',
  },
  pageSizePicker: {
    width: 35,
    height: 30,
    backgroundColor: 'rgba(234, 233, 233, 0.8)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  pageSizePickerItem: {
    fontSize: 15,
    color: '#0D47A1',
  },
  paginationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  paginationButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '700',
  },
});

export default ItemTable;


