import React from 'react';
import { Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export { MaterialIcons, Image };

// Interface for the CustomIcon component props
interface CustomIconProps {
  name: string;
  size?: number;
  color?: string;
}

// If there are specific custom icons needed, they can be added here
export const CustomIcon: React.FC<CustomIconProps> = ({ name, size = 24, color = '#000' }) => {
  return <MaterialIcons name={name} size={size} color={color} />;
}; 