import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface HealthScreenProps {
  onChangeScreen: (screen: string) => void;
}

const HealthScreen: React.FC<HealthScreenProps> = ({ onChangeScreen }) => {
  const [waterAmount, setWaterAmount] = useState(0);

  const addWater = () => {
    // Add 200ml of water with each tap
    setWaterAmount(prevAmount => prevAmount + 200);
  };

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
        <Text style={styles.headerTitle}>Health Dashboard</Text>
        
        {/* Steps Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12,3.5c5.5,0,10,4.5,10,10s-4.5,10-10,10s-10-4.5-10-10S6.5,3.5,12,3.5 M12,2C5.9,2,1,6.9,1,13s4.9,11,11,11s11-4.9,11-11
                  S18.1,2,12,2L12,2z M19.9,11.5H15c-0.4-1.7-1.8-3-3.7-3c-2.1,0-3.7,1.7-3.7,3.7c0,0.5,0.1,1,0.2,1.5l-1.8,0.7
                  c-0.2-0.7-0.4-1.4-0.4-2.2c0-3.5,2.8-6.3,6.3-6.3c2.7,0,5.1,1.7,6,4.1h2c0.4,0,0.7,0.3,0.7,0.7S20.3,11.5,19.9,11.5z"
                  fill="#6B4EFF"
                />
              </Svg>
            </View>
            <Text style={styles.cardTitle}>Steps</Text>
          </View>
          <Text style={styles.metricValue}>0</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '0%' }]} />
          </View>
          <Text style={styles.goalText}>Goal: 10,000 steps</Text>
        </View>
        
        {/* Heart Rate Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                  fill="#FF6B6B"
                />
              </Svg>
            </View>
            <Text style={styles.cardTitle}>Heart Rate</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricValue}>72</Text>
            <Text style={styles.metricUnit}>BPM</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.goalText}>Normal Range</Text>
        </View>
        
        {/* Water Intake Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M12,20C8.69,20 6,17.31 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14C18,17.31 15.31,20 12,20Z"
                  fill="#4FC3F7"
                />
              </Svg>
            </View>
            <Text style={styles.cardTitle}>Water Intake</Text>
            <TouchableOpacity style={styles.addButton} onPress={addWater}>
              <Text style={styles.addButtonText}>Add Water</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricValue}>{waterAmount}</Text>
            <Text style={styles.metricUnit}>ml</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((waterAmount / 2000) * 100, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.goalText}>Daily Goal: 2000ml</Text>
        </View>
        
        {/* Personal Trainer Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Svg width="24" height="24" viewBox="0 0 24 24">
                <Path
                  d="M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z"
                  fill="#8E44AD"
                />
              </Svg>
            </View>
            <Text style={styles.sectionTitle}>Personal Trainer</Text>
          </View>
          
          <View style={styles.cardsRow}>
            <TouchableOpacity style={styles.smallCard}>
              <Text style={styles.smallCardTitle}>Daily Workout</Text>
              <Text style={styles.smallCardSubtitle}>20 min routine</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.smallCard}>
              <Text style={styles.smallCardTitle}>Meal Plan</Text>
              <Text style={styles.smallCardSubtitle}>View today's meals</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Space for bottom navigation */}
        <View style={styles.bottomNavSpacer} />
      </ScrollView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => onChangeScreen('home')}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
          </Svg>
          <Text style={styles.navText}>Home</Text>
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
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#1E88E5" d="M12,3A9,9 0 0,0 3,12H7.5L10,8H14L16.5,12H21A9,9 0 0,0 12,3M7.5,18A1.5,1.5 0 0,1 6,16.5A1.5,1.5 0 0,1 7.5,15A1.5,1.5 0 0,1 9,16.5A1.5,1.5 0 0,1 7.5,18M16.5,18A1.5,1.5 0 0,1 15,16.5A1.5,1.5 0 0,1 16.5,15A1.5,1.5 0 0,1 18,16.5A1.5,1.5 0 0,1 16.5,18Z" />
          </Svg>
          <Text style={[styles.navText, styles.activeNavText]}>Health</Text>
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
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  metricValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  metricUnit: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  progressFill: {
    height: 10,
    backgroundColor: '#6B4EFF',
    borderRadius: 5,
  },
  goalText: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginTop: 10,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '48%',
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
  smallCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  smallCardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  bottomNavSpacer: {
    height: 80,
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

export default HealthScreen; 