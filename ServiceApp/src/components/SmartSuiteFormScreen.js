import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
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
    onClose: () => navigation.goBack(),
    ...actionBarActions,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MenuModal')}
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>CC</Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryActionButton]}
          onPress={defaultActionBarActions.onSave}
        >
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryActionButton]}
          onPress={defaultActionBarActions.onClose}
        >
          <Text style={styles.actionButtonText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={Boolean(true)}>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
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
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    minWidth: 100,
    alignItems: 'center',
    borderRadius: 6,
  },
  primaryActionButton: {
    backgroundColor: '#FF7043',
  },
  secondaryActionButton: {
    backgroundColor: '#90A4AE',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
});

export default SmartSuiteFormScreen;


