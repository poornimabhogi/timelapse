import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { HomeIcon, ShopIcon, HealthIcon, ProfileIcon, SocialIcon, GamesIcon } from './Icons';
import { useAppContext } from '../../context/AppContext';

interface BottomTabBarProps {
  currentScreen: string;
  onChangeScreen: (screen: string) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentScreen, onChangeScreen }) => {
  const { cartCount } = useAppContext();
  
  // Wrapped navigation function for debugging
  const handleNavigation = (screen: string) => {
    console.log(`Navigating to: ${screen}`);
    
    // Check if we're already on this screen - if so, we should refresh data
    if (currentScreen === screen) {
      console.log(`Already on ${screen} screen - triggering refresh`);
      
      // Use a different approach - add a timestamp to force refresh
      const refreshToken = `${screen}-refresh-${Date.now()}`;
      onChangeScreen(refreshToken);
      
      // Then navigate back to the same screen after a brief delay
      setTimeout(() => {
        console.log(`Navigating back to ${screen} after refresh trigger`);
        onChangeScreen(screen);
      }, 50);
    } else {
      // Navigate to a different screen
      onChangeScreen(screen);
    }
  };

  return (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity 
        style={styles.navItem} 
        activeOpacity={0.5}
        onPress={() => handleNavigation('home')}
      >
        <HomeIcon active={currentScreen === 'home'} />
        <Text style={[styles.navText, currentScreen === 'home' && styles.activeNavText]}>
          Home
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        activeOpacity={0.5}
        onPress={() => handleNavigation('shop')}
      >
        <ShopIcon active={currentScreen === 'shop'} />
        <Text style={[styles.navText, currentScreen === 'shop' && styles.activeNavText]}>
          Shop
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        activeOpacity={0.5}
        onPress={() => handleNavigation('social')}
      >
        <SocialIcon active={currentScreen === 'social'} />
        <Text style={[styles.navText, currentScreen === 'social' && styles.activeNavText]}>
          Social
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        activeOpacity={0.5}
        onPress={() => handleNavigation('extras')}
      >
        <GamesIcon active={currentScreen === 'extras'} />
        <Text style={[styles.navText, currentScreen === 'extras' && styles.activeNavText]}>
          Extras
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem} 
        activeOpacity={0.5}
        onPress={() => handleNavigation('health')}
      >
        <HealthIcon active={currentScreen === 'health'} />
        <Text style={[styles.navText, currentScreen === 'health' && styles.activeNavText]}>
          Health
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        activeOpacity={0.5}
        onPress={() => handleNavigation('profile')}
      >
        <ProfileIcon active={currentScreen === 'profile'} />
        <Text style={[styles.navText, currentScreen === 'profile' && styles.activeNavText]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 8,
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
    color: '#6B4EFF',
  },
});

export default BottomTabBar; 