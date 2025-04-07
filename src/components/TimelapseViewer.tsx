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
import Video from 'react-native-video';  // Changed from expo-av to react-native-video
import { useAuth } from '../contexts/AuthContext';
import { likeTimelapseItem, unlikeTimelapseItem, deleteTimelapseItem } from '../services/aws-config';

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
    type?: 'photo' | 'video';  // Add type to distinguish between photos and videos
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
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Enhance the useEffect hook to properly sync the like state
  useEffect(() => {
    console.log('Timelapse updated:', timelapse);
    console.log('Current like count:', timelapse.likes);
    console.log('Current likedBy:', timelapse.likedBy);
    
    if (user && timelapse.likedBy) {
      setIsLiked(timelapse.likedBy.includes(user.uid));
    }
    setLikeCount(timelapse.likes || 0);
  }, [timelapse, user]);

  const handleLikeToggle = () => {
    // Toggle like state
    const newIsLiked = !isLiked;
    console.log(`Toggling like state from ${isLiked} to ${newIsLiked}`);
    
    // Calculate new count based on like action
    const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    console.log(`Updating like count from ${likeCount} to ${newLikeCount}`);
    
    // Update the state
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    
    // Call the relevant API function based on the action
    if (newIsLiked) {
      console.log('Calling likeTimelapseItem API');
      likeTimelapseItem(timelapse.id);
    } else {
      console.log('Calling unlikeTimelapseItem API');
      unlikeTimelapseItem(timelapse.id);
    }
    
    // Notify parent component about the change
    if (onLikeUpdated) {
      console.log('Notifying parent of like update');
      onLikeUpdated(timelapse.id, newLikeCount, newIsLiked);
    }
  };

  const handleDelete = () => {
    console.log('Delete button pressed, calling onDelete');
    
    // Close the modal
    onClose();
    
    // Call the onDelete callback
    if (onDelete) {
      onDelete();
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
          {/* Conditionally render Image or Video based on type */}
          {!timelapse.type || timelapse.type === 'photo' ? (
            <Image
              source={{ uri: timelapse.mediaUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoContainer}>
              {!isVideoReady && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
              <Video
                source={{ uri: timelapse.mediaUrl }}
                style={styles.video}
                resizeMode="contain"
                repeat={true}
                controls={true}
                paused={false}
                onLoad={() => setIsVideoReady(true)}
                onError={(e) => console.error('Video error:', e.error)}
              />
            </View>
          )}
        </View>
        
        {/* Description at the bottom if available */}
        {timelapse.description && (
          <Text style={styles.description}>{timelapse.description}</Text>
        )}
        
        {/* Like and delete buttons on the right side */}
        <View style={styles.actionContainer}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLikeToggle}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.likeIcon}>
                    {isLiked ? '❤️' : '🤍'}
                  </Text>
                  <Text style={[styles.actionText, isLiked && styles.likedText]}>
                    {likeCount}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {showDeleteButton && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
                activeOpacity={0.7}
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
  videoContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
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
  actionButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    width: 60,
    height: 60,
    justifyContent: 'center',
  },
  likeIcon: {
    fontSize: 28,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  likedText: {
    color: '#FF6B8B', // Light red color that matches the heart
  },
  deleteButtonText: {
    fontSize: 28,
    color: '#FFF', // White trash icon
  },
});

export default TimelapseViewer; 