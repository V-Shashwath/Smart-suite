import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [databaseName, setDatabaseName] = useState('CrystalCopier');
  const [userName, setUserName] = useState('Supervisor');
  const [password, setPassword] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      // Use setTimeout to ensure navigation is ready after state update
      const timer = setTimeout(() => {
        if (navigation && navigation.replace) {
          navigation.replace('Dashboard');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentUser, navigation]);

  const handleSignIn = async () => {
    setError('');
    
    // Validate database name is always CrystalCopier
    const dbName = 'CrystalCopier';
    if (databaseName.toLowerCase() !== 'crystalcopier') {
      setError('Database name must be "CrystalCopier"');
      return;
    }
    
    try {
      setLoading(true);
      await login({ databaseName: dbName, username: userName, password });
      // Navigation will be handled by useEffect when currentUser changes
      // Don't call navigation.replace here to avoid duplicate navigation
      // Loading will be reset when component unmounts or when navigation happens
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientOverlay} />
        <View style={styles.backgroundPattern}>
          <View style={styles.gridLine1} />
          <View style={styles.gridLine2} />
          <View style={styles.gridLine3} />
        </View>
        <View style={styles.accentCircle1} />
        <View style={styles.accentCircle2} />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {Platform.OS === 'android' && (
          <View style={styles.statusBarSpacer} />
        )}
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoGlow} />
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/applogo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.heroTitle}>Smart Suite</Text>
              <View style={styles.titleUnderline} />
            </View>
            <Text style={styles.heroSubtitle}>Welcome back</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <MaterialIcons name="storage" size={18} color="#1976D2" />
                <Text style={styles.label}>Database</Text>
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.readOnlyInput}
                  value="CrystalCopier"
                  editable={false}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <MaterialIcons name="person" size={18} color="#1976D2" />
                <Text style={styles.label}>Username</Text>
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor="#64B5F6"
                  value={userName}
                  onChangeText={setUserName}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <MaterialIcons name="lock" size={18} color="#1976D2" />
                <Text style={styles.label}>Password</Text>
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#64B5F6"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {!!error && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={18} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <MaterialIcons name="arrow-forward" size={22} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D47A1',
  },
  statusBarSpacer: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D47A1',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1565C0',
    opacity: 0.8,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#fff',
    top: '20%',
    opacity: 0.1,
  },
  gridLine2: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#fff',
    top: '50%',
    opacity: 0.1,
  },
  gridLine3: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#fff',
    top: '80%',
    opacity: 0.1,
  },
  accentCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4CAF50',
    opacity: 0.2,
    top: -50,
    right: -50,
  },
  accentCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#1976D2',
    opacity: 0.6,
    bottom: -30,
    left: -30,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? 10 : 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  logoGlow: {
    position: 'absolute',
    width: 220,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    opacity: 0.3,
    top: 6,
    left: 6,
  },
  logoContainer: {
    width: 220,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: '#E8F5E9',
    overflow: 'hidden',
  },
  logoImage: {
    width: '85%',
    height: '85%',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginTop: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#BBDEFB',
    marginTop: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 26,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  inputWrapper: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1565C0',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputBox: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: '#42aaeb',
  },
  input: {
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 17,
    backgroundColor: '#E3F2FD',
    color: '#0D47A1',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  readOnlyInput: {
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    backgroundColor: '#cfe9ff',
    color: '#0D47A1',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  signInButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    gap: 10,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default LoginScreen;



