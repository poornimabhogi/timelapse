import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  ToastAndroid,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { styles } from './styles';
import { HomeScreenProps, GoalData, ProductData } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
import { useAuth } from '../../contexts/AuthContext';

const HomeScreen: React.FC<HomeScreenProps> = ({
  onChangeScreen,
  wishlistItems,
}) => {
  const [isAndroid15, setIsAndroid15] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    console.log('HomeScreen mounted');
    
    // Check if device is running Android 15
    if (Platform.OS === 'android' && Platform.Version >= 34) {
      setIsAndroid15(true);
      ToastAndroid.show('Running on Android 15 or newer', ToastAndroid.SHORT);
    }
    
    return () => {
      console.log('HomeScreen unmounted');
    };
  }, []);

  // Get display name from user context
  const getDisplayName = () => {
    if (!user) return 'Guest';
    
    // First try to use the user's name
    if (user.name) return user.name;
    
    // Then fall back to username
    if (user.username) return user.username;
    
    // Last resort, use part of the UID
    return `User ${user.uid.substring(0, 5)}`;
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Logout", 
            onPress: async () => {
              await signOut();
              // The AuthProvider will handle redirecting to the login screen
            }
          }
        ]
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const goals: GoalData[] = [
    {
      id: '1',
      title: 'Daily Steps',
      current: 6500,
      target: 10000,
      unit: 'steps',
      progress: 0.65,
      icon: '👣',
    },
    {
      id: '2',
      title: 'Water Intake',
      current: 1200,
      target: 2000,
      unit: 'ml',
      progress: 0.6,
      icon: '💧',
    },
    {
      id: '3',
      title: 'Calories Burned',
      current: 350,
      target: 500,
      unit: 'kcal',
      progress: 0.7,
      icon: '🔥',
    },
  ];

  const renderGoalCard = (goal: GoalData) => (
    <View key={goal.id} style={styles.goalCard}>
      <View style={styles.goalIconContainer}>
        <Text style={styles.goalIcon}>{goal.icon}</Text>
      </View>
      <View style={styles.goalInfo}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.goalProgress}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${goal.progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.goalText}>
            {goal.current} / {goal.target} {goal.unit}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderWishlistItem = ({ item }: { item: ProductData }) => (
    <View style={styles.wishlistItem}>
      <View style={styles.wishlistImageContainer}>
        <View style={styles.wishlistImagePlaceholder}>
          <Text style={styles.wishlistImageText}>{item.title.charAt(0)}</Text>
        </View>
      </View>
      <View style={styles.wishlistItemInfo}>
        <Text style={styles.wishlistItemTitle}>{item.title}</Text>
        <Text style={styles.wishlistItemPrice}>${item.price}</Text>
      </View>
      <TouchableOpacity
        style={styles.viewItemButton}
        onPress={() => onChangeScreen('shop')}
      >
        <Text style={styles.viewItemButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'android' && styles.androidSafeTop,
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {getDisplayName()}!</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.headerRightContainer}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>100</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                console.log('Lucky Draw navigation triggered');
                setTimeout(() => {
                  onChangeScreen('luckyDraw');
                }, 100);
              }}
              style={{
                backgroundColor: '#6B4EFF',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginRight: 12,
              }}
            >
              <Text style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 14,
              }}>Lucky Draw</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Goals</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.goalsContainer}>
            {goals.map(renderGoalCard)}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Wishlist</Text>
            {wishlistItems.length > 0 && (
              <TouchableOpacity onPress={() => onChangeScreen('shop')}>
                <Text style={styles.viewAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {wishlistItems.length > 0 ? (
            <FlatList
              data={wishlistItems}
              renderItem={renderWishlistItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.wishlistContainer}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyWishlistContainer}>
              <Text style={styles.emptyWishlistText}>
                No items in your wishlist yet. Visit the shop to add items!
              </Text>
            </View>
          )}
        </View>
        
        <View style={Platform.OS === 'ios' ? styles.iosSpacer : styles.bottomNavSpacer} />
      </ScrollView>
      
      <BottomTabBar currentScreen="home" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

export default HomeScreen; 