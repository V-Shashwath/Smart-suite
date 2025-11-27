import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [databaseName, setDatabaseName] = useState('CrystalCopier');
  const [userName, setUserName] = useState('Supervisor');
  const [password, setPassword] = useState('Admin');

  const handleSignIn = () => {
    // TODO: Implement actual authentication
    // For now, just navigate to main app
    if (databaseName && userName && password) {
      navigation.replace('Dashboard');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loginCard}>
          {/* Left Section - Illustration Placeholder */}
          <View style={styles.illustrationSection}>
            <View style={styles.illustrationPlaceholder}>
              <Text style={styles.illustrationText}>📊</Text>
              <Text style={styles.illustrationSubtext}>Business Analytics</Text>
            </View>
          </View>

          {/* Right Section - Login Form */}
          <View style={styles.formSection}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>SS</Text>
              </View>
              <Text style={styles.appTitle}>Smart Suite</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Database Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Database Name"
                  value={databaseName}
                  onChangeText={setDatabaseName}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>User Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="User Name"
                  value={userName}
                  onChangeText={setUserName}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignIn}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: width > 768 ? 900 : width - 40,
    maxWidth: 900,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: width > 768 ? 'row' : 'column',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  illustrationSection: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: width > 768 ? 0 : 200,
  },
  illustrationPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationText: {
    fontSize: 80,
    marginBottom: 20,
  },
  illustrationSubtext: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C62828',
  },
  formFields: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;


