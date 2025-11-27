import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AccordionSection from './AccordionSection';

const SmartSuiteFormScreen = ({
  title,
  sections = [],
  actionBarActions = {},
  summaryFields = [],
  footerContent = null,
  children,
}) => {
  const navigation = useNavigation();

  const defaultActionBarActions = {
    onSave: () => console.log('Save'),
    onComment: () => console.log('Comment'),
    onWhatsApp: () => console.log('WhatsApp'),
    onSettings: () => console.log('Settings'),
    onUpload: () => console.log('Upload'),
    onPrint: () => console.log('Print'),
    onGrid: () => console.log('Grid'),
    onClose: () => navigation.goBack(),
    ...actionBarActions,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MenuModal')}
            style={styles.menuButton}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SS</Text>
            </View>
            <Text style={styles.logoTitle}>Smart Suite</Text>
          </View>
        </View>

        <View style={styles.headerCenter}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#999"
            />
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>CC</Text>
            </View>
            <View>
              <Text style={styles.userName}>CrystalCopier</Text>
              <Text style={styles.userRole}>Supervisor</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onSave}
        >
          <Text style={styles.actionIcon}>💾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onComment}
        >
          <Text style={styles.actionIcon}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onWhatsApp}
        >
          <Text style={styles.actionIcon}>📱</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onSettings}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onUpload}
        >
          <Text style={styles.actionIcon}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onPrint}
        >
          <Text style={styles.actionIcon}>🖨️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onGrid}
        >
          <Text style={styles.actionIcon}>⊞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={defaultActionBarActions.onClose}
        >
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={Boolean(true)}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Custom Sections or Children */}
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <AccordionSection
              key={index}
              title={section.title}
              defaultExpanded={(() => {
                const value = section.defaultExpanded;
                if (value === undefined || value === null) return true;
                if (typeof value === 'boolean') return value;
                if (typeof value === 'string') {
                  return value.toLowerCase() === 'true' || value === '1';
                }
                return Boolean(value);
              })()}
            >
              {section.content}
            </AccordionSection>
          ))
        ) : (
          children
        )}

        {/* Summary Section */}
        {summaryFields.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>SUMMARY</Text>
            <View style={styles.summaryGrid}>
              {summaryFields.map((field, index) => (
                <View key={index} style={styles.summaryField}>
                  <Text style={styles.summaryLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.summaryInput}
                    value={String(field.value || '0')}
                    editable={(() => {
                      if (field.editable === undefined || field.editable === null) return true;
                      if (typeof field.editable === 'boolean') return field.editable;
                      if (typeof field.editable === 'string') {
                        return field.editable.toLowerCase() === 'true' || field.editable === '1';
                      }
                      return Boolean(field.editable);
                    })()}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Custom Footer Content */}
        {footerContent}

        {/* Footer Logo */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLogoText}>SS</Text>
          </View>
          <Text style={styles.footerText}>Smart Suite</Text>
        </View>
      </ScrollView>

      {/* Floating Settings Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={defaultActionBarActions.onSettings}
      >
        <Text style={styles.floatingButtonIcon}>⚙️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#333',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerCenter: {
    flex: 2,
    paddingHorizontal: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  searchIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  userRole: {
    fontSize: 10,
    color: '#666',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00BCD4',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryField: {
    width: '48%',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  summaryInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerLogoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingButtonIcon: {
    fontSize: 24,
    color: '#fff',
  },
});

export default SmartSuiteFormScreen;


