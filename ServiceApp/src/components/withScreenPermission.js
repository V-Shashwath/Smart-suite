import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

const AccessDenied = ({ navigation, routeName }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Access Restricted</Text>
    <Text style={styles.subtitle}>
      You do not have permission to open {routeName}.
    </Text>
    {navigation?.canGoBack?.() && (
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    )}
  </View>
);

const withScreenPermission = (routeName) => (WrappedComponent) => {
  const Guard = (props) => {
    const { hasAccessToScreen, currentUser } = useAuth();

    if (!currentUser) {
      return <AccessDenied navigation={props.navigation} routeName={routeName} />;
    }

    if (!hasAccessToScreen(routeName)) {
      return <AccessDenied navigation={props.navigation} routeName={routeName} />;
    }

    return <WrappedComponent {...props} />;
  };

  return Guard;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#b71c1c',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#ff7043',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default withScreenPermission;


