import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

// Bottom tab icons
export const HomeIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill={active ? "#1E88E5" : "#999"} 
      d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"
    />
  </Svg>
);

export const ShopIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill={active ? "#1E88E5" : "#999"} 
      d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z"
    />
  </Svg>
);

export const HealthIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill={active ? "#1E88E5" : "#999"} 
      d="M12,3A9,9 0 0,0 3,12H7.5L10,8H14L16.5,12H21A9,9 0 0,0 12,3M7.5,18A1.5,1.5 0 0,1 6,16.5A1.5,1.5 0 0,1 7.5,15A1.5,1.5 0 0,1 9,16.5A1.5,1.5 0 0,1 7.5,18M16.5,18A1.5,1.5 0 0,1 15,16.5A1.5,1.5 0 0,1 16.5,15A1.5,1.5 0 0,1 18,16.5A1.5,1.5 0 0,1 16.5,18Z"
    />
  </Svg>
);

export const ProfileIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill={active ? "#1E88E5" : "#999"} 
      d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
    />
  </Svg>
);

export const SocialIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill={active ? "#1E88E5" : "#999"} 
      d="M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z"
    />
  </Svg>
);

export const GamesIcon = ({ active = false }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill={active ? "#1E88E5" : "#999"} 
      d="M6,16.5L3,19.44V11H6M11,14.66L9.43,13.32L8,14.64V7H11M16,13L13,16V3H16M18.81,12.81L17,11H22V16L18.81,12.81Z"
    />
  </Svg>
);

// Health screen icons
export const StepIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" stroke="#1E88E5" strokeWidth="2" fill="none" />
    <Circle cx="12" cy="12" r="5" fill="#1E88E5" />
  </Svg>
);

export const HeartIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill="#FF4081" 
      d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
    />
  </Svg>
);

export const WaterIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill="#43A047" 
      d="M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z"
    />
  </Svg>
);

export const WorkoutIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill="#FB8C00" 
      d="M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z"
    />
  </Svg>
);

export const MealIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    <Path 
      fill="#8E24AA" 
      d="M15.5,21L14,8H16.23L15.1,3.46L16.84,3L18.09,8H22L20.5,21H15.5M5,11H10A3,3 0 0,1 13,14H2A3,3 0 0,1 5,11M13,18A3,3 0 0,1 10,21H5A3,3 0 0,1 2,18H13M3,15H8L9.5,16.5L11,15H12A1,1 0 0,1 13,16A1,1 0 0,1 12,17H3A1,1 0 0,1 2,16A1,1 0 0,1 3,15Z"
    />
  </Svg>
); 