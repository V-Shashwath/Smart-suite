import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { generateInvoicePDF } from '../utils/pdfUtils';

const { width, height } = Dimensions.get('window');

const PDFPreviewModal = ({ isVisible, onClose, invoiceData }) => {
  const [pdfHtml, setPdfHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && invoiceData) {
      generatePDF();
    } else {
      // Clean up when modal closes
      setPdfHtml(null);
      setError(null);
    }
  }, [isVisible, invoiceData]);

  const generatePDF = async () => {
    if (!invoiceData) {
      setError('No invoice data provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Request base64 for preview
      const result = await generateInvoicePDF(invoiceData, true);
      console.log('PDFPreviewModal: PDF generated successfully:', result.uri);
      
      if (result.base64) {
        setPdfHtml(buildPdfViewerHtml(result.base64));
      } else {
        // Fallback: Use HTML directly if base64 is not available
        const { generateInvoiceHTML } = require('../utils/pdfUtils');
        const html = await generateInvoiceHTML(invoiceData);
        setPdfHtml(buildHtmlViewer(html));
      }
    } catch (err) {
      console.error('PDFPreviewModal: Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={Boolean(isVisible)}
      transparent={Boolean(false)}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📄 PDF Preview</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {/* PDF Viewer */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF5722" />
            <Text style={styles.loadingText}>Generating PDF...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity onPress={generatePDF} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {pdfHtml && !loading && !error && (
          <WebView
            source={{ html: pdfHtml }}
            style={styles.pdf}
            originWhitelist={['*']}
            startInLoadingState={Boolean(true)}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5722" />
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
            scalesPageToFit={Boolean(true)}
            showsVerticalScrollIndicator={Boolean(true)}
            showsHorizontalScrollIndicator={Boolean(true)}
            javaScriptEnabled={Boolean(true)}
            domStorageEnabled={Boolean(true)}
            allowsInlineMediaPlayback={Boolean(true)}
            mediaPlaybackRequiresUserAction={Boolean(false)}
            bounces={Boolean(true)}
            scrollEnabled={Boolean(true)}
            nestedScrollEnabled={Boolean(true)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('PDFPreviewModal: WebView error:', nativeEvent);
              setError('Failed to render PDF preview.');
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('PDFPreviewModal: WebView HTTP error:', nativeEvent);
            }}
            onLoadEnd={() => {
              console.log('PDFPreviewModal: PDF loaded successfully');
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FF5722',
    borderBottomWidth: 2,
    borderBottomColor: '#C62828',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#C62828',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#E4E4E4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF5722',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const buildPdfViewerHtml = (base64Data) => {
  if (!base64Data) return '';
  const sanitizedBase64 = base64Data.replace(/(\r\n|\n|\r)/gm, '').replace(/'/g, "\\'");
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=0.5, user-scalable=yes">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
            touch-action: pan-x pan-y pinch-zoom;
            -webkit-overflow-scrolling: touch;
          }
          #pdf-container {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            touch-action: pan-x pan-y pinch-zoom;
            -webkit-overflow-scrolling: touch;
          }
          canvas {
            width: 100% !important;
            height: auto !important;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            background-color: #fff;
            touch-action: pan-x pan-y pinch-zoom;
            -webkit-user-select: none;
            user-select: none;
            max-width: 100%;
            display: block;
            /* High-quality rendering for text */
            image-rendering: -webkit-optimize-contrast;
            image-rendering: auto;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"></script>
      </head>
      <body>
        <div id="pdf-container"></div>
        <script>
          const pdfData = '${sanitizedBase64}';
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          function base64ToUint8Array(base64) {
            const raw = atob(base64);
            const rawLength = raw.length;
            const array = new Uint8Array(new ArrayBuffer(rawLength));
            for (let i = 0; i < rawLength; i++) {
              array[i] = raw.charCodeAt(i);
            }
            return array;
          }

          const container = document.getElementById('pdf-container');
          
          // Get device pixel ratio for high DPI displays (retina, etc.)
          const dpr = window.devicePixelRatio || 2;
          // Use higher scale for better quality - render at 2x-3x for crisp text
          const renderScale = Math.max(2.5, dpr * 1.5);
          // Display scale - how big to show on screen initially
          const displayScale = 1.0;

          pdfjsLib.getDocument({ data: base64ToUint8Array(pdfData) }).promise.then(function(pdf) {
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              pdf.getPage(pageNum).then(function(page) {
                // Get viewport at high resolution for rendering
                const renderViewport = page.getViewport({ scale: renderScale });
                
                // Create canvas element
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                // Set canvas internal resolution (high resolution)
                canvas.width = renderViewport.width;
                canvas.height = renderViewport.height;
                
                // Set canvas display size (normal size, but will look crisp when zoomed)
                // The canvas is rendered at high resolution but displayed at normal size
                // This ensures crisp text when zoomed
                canvas.style.width = (renderViewport.width / renderScale * displayScale) + 'px';
                canvas.style.height = (renderViewport.height / renderScale * displayScale) + 'px';
                
                container.appendChild(canvas);
                
                // Render the page at high resolution
                const renderContext = {
                  canvasContext: context,
                  viewport: renderViewport
                };
                
                page.render(renderContext).promise.then(function() {
                  console.log('Page ' + pageNum + ' rendered at scale ' + renderScale + ' (DPR: ' + dpr + ')');
                }).catch(function(error) {
                  console.error('Error rendering page ' + pageNum + ':', error);
                });
              });
            }
          }).catch(function(error) {
            container.innerHTML = '<p style="color: #f44336; text-align: center;">Failed to render PDF: ' + error.message + '</p>';
          });
        </script>
      </body>
    </html>
  `;
};

// Fallback: Build HTML viewer directly (when base64 is not available)
const buildHtmlViewer = (htmlContent) => {
  const sanitizedHtml = htmlContent.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=0.5, user-scalable=yes">
        <style>
          body {
            margin: 0;
            padding: 8px;
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
            overflow-x: hidden;
            touch-action: pan-x pan-y pinch-zoom;
            -webkit-overflow-scrolling: touch;
          }
          #invoice-content {
            background-color: #fff;
            padding: 8px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            touch-action: pan-x pan-y pinch-zoom;
          }
        </style>
      </head>
      <body>
        <div id="invoice-content">${sanitizedHtml}</div>
      </body>
    </html>
  `;
};

export default PDFPreviewModal;

