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
    backgroundColor: 'rgba(25, 118, 210, 0.8)',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 0,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  arrow: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    padding: 16,
    backgroundColor: '#fff',
  },
});

export default AccordionSection;


