import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import awsConfig from '../services/aws-config';

const { width, height } = Dimensions.get('window');

interface TimelapseViewerProps {
  visible: boolean;
  timelapse: {
    id: string;
    mediaUrl: string;
    likes: number;
    timestamp?: string;
    userId: string;
    description?: string;
    likedBy?: string[];
  };
  onClose: () => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  onLikeUpdated?: (timelapseId: string, newLikeCount: number, userLiked: boolean) => void;
}

const TimelapseViewer: React.FC<TimelapseViewerProps> = ({
  visible,
  timelapse,
  onClose,
  onDelete,
  showDeleteButton = false,
  onLikeUpdated,
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(timelapse.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already liked this timelapse
  useEffect(() => {
    if (user && timelapse.likedBy) {
      setIsLiked(timelapse.likedBy.includes(user.uid));
    }
    setLikeCount(timelapse.likes || 0);
  }, [timelapse, user]);

  const handleLikeToggle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use the appropriate API service function
      const response = isLiked 
        ? await awsConfig.unlikeTimelapseItem(timelapse.id)
        : await awsConfig.likeTimelapseItem(timelapse.id);
      
      // Update state based on response
      const newLikeCount = (response as any).likes || (isLiked ? likeCount - 1 : likeCount + 1);
      const userLiked = !isLiked;
      
      setIsLiked(userLiked);
      setLikeCount(newLikeCount);
      
      // Notify parent component to sync like status
      if (onLikeUpdated) {
        onLikeUpdated(timelapse.id, newLikeCount, userLiked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Fallback for demo - in a real app, you'd handle errors differently
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      if (onLikeUpdated) {
        onLikeUpdated(timelapse.id, isLiked ? likeCount - 1 : likeCount + 1, !isLiked);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || timelapse.userId !== user.uid) return;
    
    setIsLoading(true);
    try {
      // Use the API service for deletion
      await awsConfig.deleteTimelapseItem(timelapse.id);
      
      onClose();
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting timelapse:', error);
      // Call onDelete anyway for demo purposes
      onClose();
      if (onDelete) {
        onDelete();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="black" translucent />
        
        {/* Close button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Main content - the timelapse image/video */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: timelapse.mediaUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        
        {/* Description at the bottom if available */}
        {timelapse.description && (
          <Text style={styles.description}>{timelapse.description}</Text>
        )}
        
        {/* Like and delete buttons on the right side */}
        <View style={styles.actionContainer}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={handleLikeToggle}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.likeIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                  <Text style={styles.likeCount}>{likeCount}</Text>
                </>
              )}
            </TouchableOpacity>
            
            {showDeleteButton && timelapse.userId === user?.uid && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isLoading}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  image: {
    width: width,
    height: height,
    resizeMode: 'contain',
  },
  description: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    color: '#FFF',
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  actionContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 10,
  },
  actionButtonsContainer: {
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  likeIcon: {
    fontSize: 28,
  },
  likeCount: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 28,
  },
});

export default TimelapseViewer; 