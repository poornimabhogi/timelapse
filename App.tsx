/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import HealthScreen from './src/screens/HealthScreen';

// Define interfaces for our component types
interface GoalData {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
  icon: React.ReactNode;
}

const HomeScreen: React.FC<{ onChangeScreen: (screen: string) => void }> = ({ onChangeScreen }) => {
  const [isAndroid15, setIsAndroid15] = useState(false);

  useEffect(() => {
    // Check if the device is running Android 15 (API level 35)
    if (Platform.OS === 'android' && Platform.Version >= 35) {
      setIsAndroid15(true);
      
      // Code that only runs on Android 15
      if (Platform.Version === 35) {
        console.log('This is Android 15 specific code');
        // Show a toast notification only on Android 15
        ToastAndroid.show('Running on Android 15', ToastAndroid.SHORT);
      }
    }
  }, []);

  // Mock data for goals
  const goals: GoalData[] = [
    {
      id: '1',
      title: 'Daily Steps',
      current: 6500,
      target: 10000,
      unit: 'steps',
      progress: 0.65,
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="10" stroke="#6B4EFF" strokeWidth="2" fill="none" />
          <Circle cx="12" cy="12" r="5" fill="#6B4EFF" />
        </Svg>
      ),
    },
    {
      id: '2',
      title: 'Water Intake',
      current: 1200,
      target: 2000,
      unit: 'ml',
      progress: 0.6,
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path d="M12,20a6,6 0 0,1 -6,-6c0,-4 6,-10.8 6,-10.8s6,6.8 6,10.8a6,6 0 0,1 -6,6z" fill="#6B4EFF" />
        </Svg>
      ),
    },
    {
      id: '3',
      title: 'Calories Burned',
      current: 350,
      target: 500,
      unit: 'kcal',
      progress: 0.7,
      icon: (
        <Svg width="24" height="24" viewBox="0 0 24 24">
          <Path d="M12,2C10.6,2 9.2,2.8 8.4,4.2C7.6,5.6 7.2,7.6 7,9.8C6.7,12.7 10.8,19 12,19C13.2,19 17.3,12.7 17,9.8C16.8,7.6 16.3,5.6 15.5,4.2C14.7,2.8 13.4,2 12,2Z" fill="#6B4EFF" />
        </Svg>
      ),
    },
  ];

  // Component for rendering goal cards
  const renderGoalCard = (goal: GoalData) => (
    <View key={goal.id} style={styles.goalCard}>
      <View style={styles.goalIconContainer}>
        <View style={styles.goalIcon}>
          {goal.icon}
        </View>
      </View>
      <View style={styles.goalContent}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${goal.progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
        </Text>
      </View>
      {isAndroid15 && (
        <View style={styles.android15Badge}>
          <Text style={styles.android15Text}>Android 15</Text>
        </View>
      )}
    </View>
  );

  // Get device dimensions for responsive design
  const { width, height } = Dimensions.get('window');
  const isSmallDevice = width < 375;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'android' ? '#F5F7FA' : undefined}
        translucent={Platform.OS === 'android'}
      />
      <View style={Platform.OS === 'android' ? styles.androidSafeTop : null} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.pointsBadge}>
            <Svg width="16" height="16" viewBox="0 0 24 24">
              <Circle cx="12" cy="12" r="10" fill="#FFD700" />
              <Circle cx="12" cy="12" r="8" fill="#E8A317" />
            </Svg>
            <Text style={styles.pointsText}>100</Text>
          </View>
          
          <TouchableOpacity style={styles.luckyDrawButton}>
            <Svg width="16" height="16" viewBox="0 0 24 24">
              <Path fill="#6B4EFF" d="M5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z" />
            </Svg>
            <Text style={styles.luckyDrawText}>Lucky Draw</Text>
          </TouchableOpacity>
          
          <TouchableOpacity>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Goals Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Goals</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Goal Cards */}
          {goals.map(renderGoalCard)}
        </View>

        {/* Wishlist Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Wishlist</Text>
          <View style={styles.wishlistCard}>
            <Text style={styles.emptyWishlistText}>
              No items in your wishlist yet. Visit the shop to add items!
            </Text>
          </View>
        </View>
        
        {/* Space for bottom navigation */}
        <View style={[styles.bottomNavSpacer, Platform.OS === 'ios' ? styles.iosSpacer : null]} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#1E88E5" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
          </Svg>
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
          </Svg>
          <Text style={styles.navText}>Shop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z" />
          </Svg>
          <Text style={styles.navText}>Social</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M6,16.5L3,19.44V11H6M11,14.66L9.43,13.32L8,14.64V7H11M16,13L13,16V3H16M18.81,12.81L17,11H22V16L18.81,12.81Z" />
          </Svg>
          <Text style={styles.navText}>Games</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => onChangeScreen('health')}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M12,3A9,9 0 0,0 3,12H7.5L10,8H14L16.5,12H21A9,9 0 0,0 12,3M7.5,18A1.5,1.5 0 0,1 6,16.5A1.5,1.5 0 0,1 7.5,15A1.5,1.5 0 0,1 9,16.5A1.5,1.5 0 0,1 7.5,18M16.5,18A1.5,1.5 0 0,1 15,16.5A1.5,1.5 0 0,1 16.5,15A1.5,1.5 0 0,1 18,16.5A1.5,1.5 0 0,1 16.5,18Z" />
          </Svg>
          <Text style={styles.navText}>Health</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
          </Svg>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const App = (): React.JSX.Element => {
  const [currentScreen, setCurrentScreen] = useState('home');

  const handleChangeScreen = (screen: string) => {
    setCurrentScreen(screen);
  };

  // Render the appropriate screen based on current selection
  const renderScreen = () => {
    switch (currentScreen) {
      case 'health':
        return <HealthScreen onChangeScreen={handleChangeScreen} />;
      case 'home':
      default:
        return <HomeScreen onChangeScreen={handleChangeScreen} />;
    }
  };

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  androidSafeTop: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: '#E8A317',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
  luckyDrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  luckyDrawText: {
    color: '#6B4EFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  logoutText: {
    color: '#333',
    fontSize: 16,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    color: '#6B4EFF',
    fontSize: 16,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  goalIconContainer: {
    marginRight: 15,
  },
  goalIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F0FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#6B4EFF',
    borderRadius: 5,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
  },
  android15Badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  android15Text: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  wishlistCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyWishlistText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomNavSpacer: {
    height: 80,
  },
  iosSpacer: {
    height: 100, // Extra padding for iOS devices with home indicator
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  activeNavText: {
    color: '#1E88E5',
  },
});

export default App;
