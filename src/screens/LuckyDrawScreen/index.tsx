import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import BottomTabBar from '../../components/common/BottomTabBar';
import { styles } from './styles';

interface LuckyDrawScreenProps {
  onChangeScreen: (screen: string) => void;
}

const LuckyDrawScreen: React.FC<LuckyDrawScreenProps> = ({ onChangeScreen }) => {
  return (
    <SafeAreaView style={[
      styles.container,
      Platform.OS === 'android' && styles.androidSafeTop
    ]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onChangeScreen('home')}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <Text style={styles.moneyIcon}>💰</Text> Monthly Prize Pool: $1500.00
          </Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.giftIconContainer}>
            <Text style={styles.giftIcon}>🎁</Text>
          </View>
          
          <Text style={styles.title}>Lucky Draw</Text>
          
          <Text style={styles.description}>
            Get a ticket to enter this month's lucky draw!{'\n'}
            Win a share of our platform's revenue.
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>My Tickets</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>March 2025</Text>
              <Text style={styles.statLabel}>Current Draw</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Past Winners</Text>
            </View>
          </View>
          
          <View style={styles.winCircle}>
            <Text style={styles.winText}>WIN!</Text>
          </View>
          
          <TouchableOpacity style={styles.tryLuckButton}>
            <Text style={styles.tryLuckButtonText}>Try Your Luck ($10)</Text>
          </TouchableOpacity>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>🎟️</Text>
              <Text style={styles.actionButtonText}>My Tickets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>🏆</Text>
              <Text style={styles.actionButtonText}>Past Winners</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Buy a Ticket</Text>
              <Text style={styles.stepDescription}>
                Purchase a ticket by clicking "Try Your Luck" and completing the payment.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Wait for the Draw</Text>
              <Text style={styles.stepDescription}>
                At the end of each month, 30% of our platform's balance is added to the prize pool.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Win Big!</Text>
              <Text style={styles.stepDescription}>
                One lucky winner is randomly selected to receive the entire prize pool.
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Draw</Text>
          
          <View style={styles.drawInfoCard}>
            <View style={styles.drawInfoHeader}>
              <Text style={styles.drawInfoTitle}>Monthly Lucky Draw</Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </View>
            
            <Text style={styles.drawDate}>03/31/2025</Text>
            
            <Text style={styles.drawInfoItem}>Current Prize Pool: $1500.00</Text>
            <Text style={styles.drawInfoItem}>My Tickets: 0</Text>
            
            <Text style={styles.timeRemaining}>Time Remaining: 0 days</Text>
          </View>
        </View>
        
        <View style={Platform.OS === 'ios' ? styles.iosSpacer : styles.bottomNavSpacer} />
      </ScrollView>
      
      <BottomTabBar currentScreen="home" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

export default LuckyDrawScreen; 