import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const AccordionSection = ({ title, children, defaultExpanded = true }) => {
  // Ensure defaultExpanded is always a boolean
  const expandedValue = (() => {
    if (defaultExpanded === undefined || defaultExpanded === null) return true;
    if (typeof defaultExpanded === 'boolean') return defaultExpanded;
    if (typeof defaultExpanded === 'string') {
      return defaultExpanded.toLowerCase() === 'true' || defaultExpanded === '1';
    }
    return Boolean(defaultExpanded);
  })();
  const [isExpanded, setIsExpanded] = useState(expandedValue);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.arrow}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrow: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 16,
  },
});

export default AccordionSection;


