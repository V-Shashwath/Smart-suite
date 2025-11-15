import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import InvoiceScreen from './src/screens/InvoiceScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <InvoiceScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
