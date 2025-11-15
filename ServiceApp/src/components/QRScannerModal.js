import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const QRScannerModal = ({ isVisible, onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Request camera permissions when modal opens
    if (isVisible && !permission) {
      requestPermission();
    }
  }, [isVisible]);

  useEffect(() => {
    // Reset scanned state when modal is opened
    if (isVisible) {
      setScanned(false);
    }
  }, [isVisible]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      console.log(`QR Code scanned: Type: ${type}, Data: ${data}`);
      onScan(data);
      // Close modal after a short delay to show feedback
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  if (!permission) {
    return (
      <Modal visible={isVisible} animationType="slide" transparent={false}>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>Requesting camera permission...</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={isVisible} animationType="slide" transparent={false}>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>❌ Camera permission denied</Text>
          <Text style={styles.subMessageText}>
            Please enable camera access in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={requestPermission}>
            <Text style={styles.closeButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.closeButton, { marginTop: 10, backgroundColor: '#f5f5f5' }]} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: '#666' }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Camera View */}
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* Overlay */}
          <View style={styles.overlay}>
            {/* Top overlay */}
            <View style={styles.overlayTop}>
              <Text style={styles.title}>Scan QR Code</Text>
              <Text style={styles.subtitle}>Customer Identification</Text>
            </View>

            {/* Middle section with frame */}
            <View style={styles.overlayMiddle}>
              <View style={styles.overlayLeft} />
              
              {/* Scan frame */}
              <View style={styles.scanFrame}>
                {/* Corner indicators */}
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                
                {/* Instruction text */}
                {!scanned && (
                  <View style={styles.instructionContainer}>
                    <Text style={styles.instructionText}>
                      Align QR code within frame
                    </Text>
                  </View>
                )}
                
                {/* Scanned feedback */}
                {scanned && (
                  <View style={styles.scannedContainer}>
                    <Text style={styles.scannedText}>✓ Scanned!</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.overlayRight} />
            </View>

            {/* Bottom overlay */}
            <View style={styles.overlayBottom}>
              <Text style={styles.tipText}>
                💡 Tip: Hold your device steady and ensure good lighting
              </Text>
            </View>
          </View>
        </CameraView>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButtonFloating} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 300,
  },
  overlayLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#2196F3',
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  scannedContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scannedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  closeButtonFloating: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subMessageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});

export default QRScannerModal;

