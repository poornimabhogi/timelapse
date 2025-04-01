import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { styles } from './styles';
import { HealthScreenProps } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
import { StepIcon, HeartIcon, WaterIcon, WorkoutIcon, MealIcon } from '../../components/common/Icons';

const HealthScreen: React.FC<HealthScreenProps> = ({ onChangeScreen }) => {
  const [waterAmount, setWaterAmount] = useState(600);
  const screenWidth = Dimensions.get('window').width;
  
  useEffect(() => {
    console.log('HealthScreen mounted');
    return () => {
      console.log('HealthScreen unmounted');
    };
  }, []);
  
  const addWater = () => {
    setWaterAmount(prevAmount => prevAmount + 200);
  };

  const renderHealthCard = (
    title: string, 
    value: string | number, 
    unit: string, 
    goal: string, 
    progress: number,
    icon: React.ReactNode
  ) => {
    return (
      <View style={styles.healthCard}>
        <View style={styles.healthCardHeader}>
          <View style={styles.iconContainer}>
            {icon}
          </View>
          <Text style={styles.healthCardTitle}>{title}</Text>
        </View>
        <View style={styles.healthCardContent}>
          <Text style={styles.healthCardValue}>
            {value} <Text style={styles.healthCardUnit}>{unit}</Text>
          </Text>
          <Text style={styles.healthCardGoal}>Goal: {goal}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      Platform.OS === 'android' && styles.androidSafeTop
    ]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health Dashboard</Text>
        </View>
        
        <View style={styles.healthCardsContainer}>
          {renderHealthCard('Steps', '6,543', 'steps', '10,000 steps', 0.65, <StepIcon />)}
          {renderHealthCard('Heart Rate', '72', 'bpm', '60-100 bpm', 0.5, <HeartIcon />)}
          
          <View style={styles.healthCard}>
            <View style={styles.healthCardHeader}>
              <View style={styles.iconContainer}>
                <WaterIcon />
              </View>
              <Text style={styles.healthCardTitle}>Water Intake</Text>
            </View>
            <View style={styles.healthCardContent}>
              <Text style={styles.healthCardValue}>
                {waterAmount} <Text style={styles.healthCardUnit}>ml</Text>
              </Text>
              <Text style={styles.healthCardGoal}>Goal: 2,000 ml</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min((waterAmount / 2000) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <TouchableOpacity 
                style={styles.addWaterButton}
                onPress={addWater}
              >
                <Text style={styles.addWaterButtonText}>Add Water</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Trainer</Text>
          
          <View style={styles.trainerCardContainer}>
            <TouchableOpacity style={styles.trainerCard}>
              <View style={styles.trainerIconContainer}>
                <WorkoutIcon />
              </View>
              <View style={styles.trainerCardContent}>
                <Text style={styles.trainerCardTitle}>Daily Workout</Text>
                <Text style={styles.trainerCardDescription}>
                  20 min full body workout
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.trainerCard}>
              <View style={styles.trainerIconContainer}>
                <MealIcon />
              </View>
              <View style={styles.trainerCardContent}>
                <Text style={styles.trainerCardTitle}>Meal Plan</Text>
                <Text style={styles.trainerCardDescription}>
                  View today's healthy meals
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={Platform.OS === 'ios' ? styles.iosSpacer : styles.bottomNavSpacer} />
      </ScrollView>
      
      <BottomTabBar currentScreen="health" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

export default HealthScreen; 