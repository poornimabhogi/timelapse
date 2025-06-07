import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { 
  toggleFollowSeller,
  checkFollowingStatus 
} from '../services/followService';

interface FollowButtonProps {
  sellerId: string;
  sellerName: string;
  onFollowStatusChange?: (isFollowing: boolean, action: 'followed' | 'unfollowed') => void;
  style?: any;
  compact?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  sellerId,
  sellerName,
  onFollowStatusChange,
  style,
  compact = false,
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkCurrentFollowingStatus();
  }, [sellerId, user?.uid]);

  const checkCurrentFollowingStatus = async () => {
    if (!user?.uid || user.uid === sellerId) {
      setCheckingStatus(false);
      return;
    }

    try {
      setCheckingStatus(true);
      const following = await checkFollowingStatus(user.uid, sellerId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking following status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user?.uid) {
      Alert.alert('Authentication Required', 'Please sign in to follow sellers');
      return;
    }

    if (user.uid === sellerId) {
      Alert.alert('Invalid Action', 'You cannot follow yourself');
      return;
    }

    setLoading(true);

    try {
      const result = await toggleFollowSeller(user.uid, sellerId);
      setIsFollowing(result.isFollowing);

      // Show success message based on action
      if (result.action === 'followed') {
        Alert.alert(
          '🎉 Followed!',
          `You're now following ${sellerName}. You'll receive live updates when they add new products or update inventory.`,
          [
            {
              text: 'Great!',
              style: 'default',
            },
          ]
        );
      } else {
        Alert.alert(
          '👋 Unfollowed',
          `You've unfollowed ${sellerName}. You'll no longer receive their live updates.`,
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      }

      // Notify parent component
      onFollowStatusChange?.(result.isFollowing, result.action);

    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for own profile
  if (user?.uid === sellerId) {
    return null;
  }

  // Show loading while checking status
  if (checkingStatus) {
    return (
      <View style={[styles.button, styles.loadingButton, style]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  const buttonStyle = [
    styles.button,
    isFollowing ? styles.followingButton : styles.followButton,
    compact && styles.compactButton,
    style,
  ];

  const textStyle = [
    styles.buttonText,
    isFollowing ? styles.followingText : styles.followText,
    compact && styles.compactText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handleFollowToggle}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? "#666" : "white"} />
      ) : (
        <>
          <Text style={textStyle}>
            {isFollowing ? '✓ Following' : '+ Follow'}
          </Text>
          {isFollowing && !compact && (
            <Text style={styles.liveUpdatesText}>Live Updates</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 100,
  },
  followButton: {
    backgroundColor: '#6B4EFF',
  },
  followingButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  loadingButton: {
    backgroundColor: '#F5F5F5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 14,
  },
  followText: {
    color: 'white',
  },
  followingText: {
    color: '#4CAF50',
  },
  liveUpdatesText: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '500',
  },
});

export default FollowButton; 