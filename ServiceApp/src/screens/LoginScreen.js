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
} from 'react-native';
import { useAuth } from '../context/AuthContext';

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
      navigation.replace('Dashboard');
    }
  }, [currentUser, navigation]);

  const handleSignIn = async () => {
    setError('');
    try {
      setLoading(true);
      await login({ databaseName, username: userName, password });
      navigation.replace('Dashboard');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.heroContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>SS</Text>
            </View>
            <Text style={styles.heroTitle}>Smart Suite</Text>
            <Text style={styles.heroSubtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.formCard}>
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
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#B71C1C',
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
  errorText: {
    color: '#d50000',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default LoginScreen;



