import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LogoComponent: React.FC<LogoProps> = ({ 
  size = 'medium', 
  color = '#6B4EFF' 
}) => {
  const fontSize = size === 'small' ? 24 : size === 'medium' ? 36 : 48;
  
  return (
    <View style={styles.container}>
      <Text style={[styles.logoText, { fontSize, color }]}>
        Timelapse
      </Text>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
    marginTop: -20,
  },
});

export default LogoComponent; 