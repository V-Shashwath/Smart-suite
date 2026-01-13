import React, { useMemo } from 'react';
import { Image } from 'react-native';

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
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AccordionSection from './AccordionSection';

const SmartSuiteFormScreen = ({
  title,
  sections = [],
  actionBarActions = {},
  summaryFields = [],
  footerContent = null,
  onPreview,
  onWhatsApp,
  onSMS,
  children,
  isSaving = false,
}) => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();

  const initials = useMemo(() => {
    if (!currentUser?.username) return 'SS';
    return currentUser.username
      .split(' ')
      .map((chunk) => chunk[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser]);

  const defaultActionBarActions = {
    onSave: () => console.log('Save'),
    onClose: () => navigation.goBack(),
    ...actionBarActions,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      {Platform.OS === 'android' && (
        <View style={styles.statusBarSpacer} />
      )}
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MenuModal')}
          style={styles.menuButton}
          activeOpacity={0.8}
        >
          <MaterialIcons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.primaryActionButton,
            isSaving && styles.disabledActionButton,
          ]}
          onPress={defaultActionBarActions.onSave}
          disabled={isSaving}
        >
          <Text style={styles.actionButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
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

        {(onPreview || onWhatsApp || onSMS) && (
          <View style={styles.footerActionWrapper}>
            {/* First Row: Preview Invoice (Full Width) */}
            {onPreview && (
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonFullWidth, styles.previewFooterButton]}
                onPress={onPreview}
              >
                <View style={styles.footerButtonContent}>
                  <Image 
                    source={require('../../assets/pdf.png')} 
                    style={styles.pdfIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.footerButtonText}>Preview Invoice</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {/* Second Row: WhatsApp and SMS (Side by Side) */}
            {(onWhatsApp || onSMS) && (
              <View style={styles.footerButtonsRow}>
                {onWhatsApp && (
                  <TouchableOpacity
                    style={[styles.footerButton, styles.whatsappFooterButton]}
                    onPress={onWhatsApp}
                  >
                    <View style={styles.footerButtonContent}>
                      <Image 
                        source={require('../../assets/whatsapp.png')} 
                        style={styles.whatsappIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.footerButtonText}>WhatsApp</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {onSMS && (
                  <TouchableOpacity
                    style={[styles.footerButton, styles.smsFooterButton]}
                    onPress={onSMS}
                  >
                    <View style={styles.footerButtonContent}>
                      <Image 
                        source={require('../../assets/sms.png')} 
                        style={styles.smsIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.footerButtonText}>SMS</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Footer Logo */}
        <View style={styles.footer}>
          <Image 
            source={require('../../assets/applogo.png')} 
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>Smart Suite</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarSpacer: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    backgroundColor: 'rgba(13, 71, 161, 0.7)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(13, 72, 161, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    opacity: 0.4,
    top: 2,
    left: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 2.5,
    borderColor: '#66BB6A',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'flex-end',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    padding: 10,
    minWidth: 100,
    alignItems: 'center',
    borderRadius: 6,
  },
  primaryActionButton: {
    backgroundColor: '#4CAF50',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  secondaryActionButton: {
    backgroundColor: '#526670',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  disabledActionButton: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#2A3B4D',
    margin: 12,
    padding: 0,
    borderRadius: 10,
    borderWidth: 0,
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 0,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(25, 118, 210, 0.9)',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 11,
    backgroundColor: 'rgba(22, 92, 150, 0.51)',
    borderColor: 'rgba(25, 65, 98, 0.6)',
    borderWidth: 1.5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  summaryField: {
    width: '48%',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  summaryInput: {
    borderWidth: 1,
    borderColor: 'rgb(10, 62, 104)',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'rgba(125, 185, 254, 0.41)',
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  footerLogo: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    paddingHorizontal: 40,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  footerActionWrapper: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 32,
    gap: 12,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  footerButtonFullWidth: {
    flex: 0,
    width: '100%',
  },
  previewFooterButton: {
    backgroundColor: '#d14600',
    shadowColor: '#d14600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  whatsappFooterButton: {
    backgroundColor: '#06c74e',
    shadowColor: '#06c74e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  smsFooterButton: {
    backgroundColor: '#e0bd0d',
    shadowColor: '#e0bd0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  pdfIcon: {
    width: 26,
    height: 26,
    tintColor: '#fff',
  },
  whatsappIcon: {
    width: 26,
    height: 26,
    tintColor: '#fff',
  },
  smsIcon: {
    width: 26,
    height: 26,
    tintColor: '#fff',
  },



  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  footerButtonIcon: {
    fontSize: 18,
    color: '#fff',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default SmartSuiteFormScreen;


