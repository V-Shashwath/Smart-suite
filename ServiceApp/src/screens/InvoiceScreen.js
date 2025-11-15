import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const InvoiceScreen = () => {
  const [activeTab, setActiveTab] = useState('details');

  // Mock data
  const invoiceData = {
    transactionId: 'TXN-2025-001234',
    date: '15 Nov 2025',
    status: 'Completed',
    employee: {
      id: 'EMP-001',
      name: 'John Doe',
      position: 'Sales Executive',
    },
    customer: {
      id: 'CUST-001',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1-555-0123',
    },
    items: [
      {
        id: 1,
        description: 'Professional Services - Consulting',
        quantity: 10,
        unitPrice: 150.00,
        amount: 1500.00,
      },
      {
        id: 2,
        description: 'Software License (Annual)',
        quantity: 5,
        unitPrice: 500.00,
        amount: 2500.00,
      },
      {
        id: 3,
        description: 'Implementation Support',
        quantity: 20,
        unitPrice: 100.00,
        amount: 2000.00,
      },
    ],
    adjustments: [
      { label: 'Discount (10%)', amount: -600.00 },
      { label: 'Tax (18%)', amount: 891.00 },
      { label: 'Shipping', amount: 50.00 },
    ],
    summary: {
      subtotal: 6000.00,
      totalAdjustments: 341.00,
      totalAmount: 6341.00,
    },
    collections: [
      {
        id: 1,
        method: 'Credit Card',
        amount: 4000.00,
        date: '15 Nov 2025',
        status: 'Completed',
      },
      {
        id: 2,
        method: 'Bank Transfer',
        amount: 2341.00,
        date: '16 Nov 2025',
        status: 'Pending',
      },
    ],
    voucher: {
      code: 'VOUCHER2025-ABC123',
      discount: 600.00,
      expiryDate: '31 Dec 2025',
    },
  };

  const renderTransactionDetails = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Transaction Details</Text>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Transaction ID:</Text>
        <Text style={styles.value}>{invoiceData.transactionId}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{invoiceData.date}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Status:</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.statusText}>{invoiceData.status}</Text>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Header Information</Text>
      <View style={styles.headerContainer}>
        <View style={styles.headerBox}>
          <Text style={styles.headerLabel}>Invoice</Text>
          <Text style={styles.headerValue}>{invoiceData.transactionId}</Text>
        </View>
        <View style={styles.headerBox}>
          <Text style={styles.headerLabel}>Date</Text>
          <Text style={styles.headerValue}>{invoiceData.date}</Text>
        </View>
      </View>
    </View>
  );

  const renderVoucher = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Voucher</Text>
      <View style={styles.voucherCard}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Voucher Code:</Text>
          <Text style={[styles.value, { fontWeight: 'bold', color: '#FF6B6B' }]}>
            {invoiceData.voucher.code}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Discount Amount:</Text>
          <Text style={[styles.value, { color: '#4CAF50', fontWeight: 'bold' }]}>
            ₹{invoiceData.voucher.discount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Expiry Date:</Text>
          <Text style={styles.value}>{invoiceData.voucher.expiryDate}</Text>
        </View>
      </View>
    </View>
  );

  const renderCustomerEmployee = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Customer & Employee Info</Text>
      <View style={styles.row}>
        <View style={[styles.infoBox, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.infoTitle}>Employee</Text>
          <Text style={styles.infoValue}>{invoiceData.employee.name}</Text>
          <Text style={styles.infoSubtext}>{invoiceData.employee.position}</Text>
          <Text style={styles.infoSubtext}>ID: {invoiceData.employee.id}</Text>
        </View>
        <View style={[styles.infoBox, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.infoTitle}>Customer</Text>
          <Text style={styles.infoValue}>{invoiceData.customer.name}</Text>
          <Text style={styles.infoSubtext}>{invoiceData.customer.email}</Text>
          <Text style={styles.infoSubtext}>{invoiceData.customer.phone}</Text>
        </View>
      </View>
    </View>
  );

  const renderItemBody = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Items</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Qty</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Rate</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
        </View>
        {invoiceData.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
              ₹{item.unitPrice.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>
              ₹{item.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAdjustmentsBody = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Adjustments</Text>
      {invoiceData.adjustments.map((adjustment, index) => (
        <View key={index} style={styles.adjustmentRow}>
          <Text style={styles.label}>{adjustment.label}:</Text>
          <Text
            style={[
              styles.value,
              {
                color: adjustment.amount < 0 ? '#4CAF50' : '#000',
                fontWeight: 'bold',
              },
            ]}
          >
            {adjustment.amount < 0 ? '' : '+'}₹{adjustment.amount.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>₹{invoiceData.summary.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Adjustments:</Text>
          <Text style={styles.summaryValue}>₹{invoiceData.summary.totalAdjustments.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>₹{invoiceData.summary.totalAmount.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  const renderCollections = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Collections</Text>
      {invoiceData.collections.map((collection) => (
        <View key={collection.id} style={styles.collectionCard}>
          <View style={styles.collectionRow}>
            <View>
              <Text style={styles.collectionMethod}>{collection.method}</Text>
              <Text style={styles.collectionDate}>{collection.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.collectionAmount}>₹{collection.amount.toFixed(2)}</Text>
              <View
                style={[
                  styles.collectionStatus,
                  {
                    backgroundColor:
                      collection.status === 'Completed' ? '#4CAF50' : '#FFC107',
                  },
                ]}
              >
                <Text style={styles.collectionStatusText}>{collection.status}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Employee Sales Invoice</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.activeTab]}
          onPress={() => setActiveTab('items')}
        >
          <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
            Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'details' && (
          <>
            {renderTransactionDetails()}
            {renderHeader()}
            {renderVoucher()}
            {renderCustomerEmployee()}
          </>
        )}
        {activeTab === 'items' && (
          <>
            {renderItemBody()}
            {renderAdjustmentsBody()}
            {renderCollections()}
          </>
        )}
        {activeTab === 'summary' && (
          <>
            {renderSummary()}
            {renderCollections()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  headerBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  headerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  voucherCard: {
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  row: {
    flexDirection: 'row',
  },
  infoBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#666',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
  },
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
    paddingTopVertical: 12,
    marginTopVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  collectionCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  collectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionMethod: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  collectionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  collectionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  collectionStatus: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  collectionStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default InvoiceScreen;

