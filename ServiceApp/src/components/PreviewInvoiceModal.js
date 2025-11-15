import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const PreviewInvoiceModal = ({
  isVisible,
  onClose,
  transactionDetails,
  voucherDetails,
  customerData,
  items,
  adjustments,
  summary,
  collections,
}) => {
  const formatCurrency = (amount) => {
    return `₹ ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📄 Invoice Preview</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Transaction Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transaction Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transaction ID:</Text>
                <Text style={styles.infoValue}>{transactionDetails?.transactionId || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{formatDate(transactionDetails?.date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>{transactionDetails?.time || 'N/A'}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Voucher Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voucher Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Voucher No:</Text>
                <Text style={styles.infoValue}>{voucherDetails?.voucherNo || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>{voucherDetails?.voucherType || 'N/A'}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Customer Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer ID:</Text>
                <Text style={styles.infoValue}>{customerData?.customerId || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile No:</Text>
                <Text style={styles.infoValue}>{customerData?.mobileNo || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer Type:</Text>
                <Text style={styles.infoValue}>{customerData?.customerType || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>WhatsApp No:</Text>
                <Text style={styles.infoValue}>{customerData?.whatsappNo || 'N/A'}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Items Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items ({items?.length || 0})</Text>
              {items && items.length > 0 ? (
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>No</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Product</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Qty</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Rate</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Amount</Text>
                  </View>
                  {/* Table Rows */}
                  {items.map((item, index) => (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={[styles.tableCellText, { flex: 0.5 }]}>{index + 1}</Text>
                      <Text style={[styles.tableCellText, { flex: 2 }]} numberOfLines={2}>
                        {item.productName}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1 }]}>{item.quantity}</Text>
                      <Text style={[styles.tableCellText, { flex: 1 }]}>
                        {formatCurrency(item.rate)}
                      </Text>
                      <Text style={[styles.tableCellText, { flex: 1 }]}>
                        {formatCurrency(item.net)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No items added</Text>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Adjustments Section */}
            {adjustments && adjustments.length > 0 && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Adjustments ({adjustments?.length || 0})</Text>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>No</Text>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>Account</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1 }]}>Add</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1 }]}>Less</Text>
                    </View>
                    {/* Table Rows */}
                    {adjustments.map((adj, index) => (
                      <View key={adj.id} style={styles.tableRow}>
                        <Text style={[styles.tableCellText, { flex: 0.5 }]}>{index + 1}</Text>
                        <Text style={[styles.tableCellText, { flex: 2 }]} numberOfLines={2}>
                          {adj.accountName}
                        </Text>
                        <Text style={[styles.tableCellText, { flex: 1, color: '#27ae60' }]}>
                          {adj.addAmount > 0 ? formatCurrency(adj.addAmount) : '-'}
                        </Text>
                        <Text style={[styles.tableCellText, { flex: 1, color: '#e74c3c' }]}>
                          {adj.lessAmount > 0 ? formatCurrency(adj.lessAmount) : '-'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.divider} />
              </>
            )}

            {/* Summary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>{summary?.itemCount || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Quantity:</Text>
                <Text style={styles.summaryValue}>{summary?.totalQty || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gross Amount:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(summary?.totalGross)}</Text>
              </View>
              {summary?.totalAdd > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#27ae60' }]}>Total Add:</Text>
                  <Text style={[styles.summaryValue, { color: '#27ae60' }]}>
                    + {formatCurrency(summary?.totalAdd)}
                  </Text>
                </View>
              )}
              {summary?.totalLess > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#e74c3c' }]}>Total Less:</Text>
                  <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>
                    - {formatCurrency(summary?.totalLess)}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Bill Value:</Text>
                <Text style={styles.totalValue}>{formatCurrency(summary?.totalBillValue)}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Collections Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Collections</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cash:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(collections?.cash)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Card:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(collections?.card)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>UPI:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(collections?.upi)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.balanceRow]}>
                <Text style={styles.balanceLabel}>Balance:</Text>
                <Text style={[
                  styles.balanceValue,
                  collections?.balance < 0 ? styles.negativeBalance : styles.positiveBalance
                ]}>
                  {formatCurrency(collections?.balance)}
                </Text>
              </View>
            </View>

            {/* Footer Note */}
            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                ℹ️ This is a preview. Click "Send WhatsApp" to share the invoice.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 40,
    marginBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    paddingLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 10,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#fff',
  },
  tableCellText: {
    fontSize: 11,
    color: '#2c3e50',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#3498db',
    backgroundColor: '#ecf0f1',
    borderRadius: 5,
  },
  totalLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  balanceRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#e67e22',
    backgroundColor: '#fff3e0',
    borderRadius: 5,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#e67e22',
    fontWeight: 'bold',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#27ae60',
  },
  negativeBalance: {
    color: '#e74c3c',
  },
  footerNote: {
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#2980b9',
    lineHeight: 16,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PreviewInvoiceModal;

