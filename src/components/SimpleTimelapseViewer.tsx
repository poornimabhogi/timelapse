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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getMediaUrl, likeTimelapseItem, unlikeTimelapseItem } from '../services/aws-config';
import VideoPlayer from './VideoPlayer';
import { logError } from '../utils/errorHandler';

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
    type?: 'photo' | 'video';
  };
  onClose: () => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  onLikeUpdated?: (timelapseId: string, newLikeCount: number, userLiked: boolean) => void;
}

export const TimelapseViewer: React.FC<TimelapseViewerProps> = ({
  visible,
  timelapse,
  onClose,
  onDelete,
  showDeleteButton = false,
  onLikeUpdated,
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(timelapse?.likes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  
  // Fetch media URL and check if timelapse is liked
  useEffect(() => {
    if (!timelapse?.mediaUrl) {
      setIsLoadingMedia(false);
      return;
    }
    
    setIsLoadingMedia(true);
    
    const loadMedia = async () => {
      try {
        // If the mediaUrl is already a complete URL, use it directly
        if (timelapse.mediaUrl.startsWith('http')) {
          setMediaUrl(timelapse.mediaUrl);
        } else {
          // Otherwise, get the URL from S3 or your storage service
          const url = await getMediaUrl(timelapse.mediaUrl);
          setMediaUrl(url);
        }
        
        // Check if the current user has liked this timelapse
        if (user && user.uid && timelapse.likedBy) {
          const userId = String(user.uid);
          setIsLiked(timelapse.likedBy.includes(userId));
        }
        setLikeCount(timelapse.likes || 0);
      } catch (error) {
        logError(error, 'TimelapseViewer.loadMedia');
      } finally {
        setIsLoadingMedia(false);
      }
    };
    
    loadMedia();
  }, [timelapse, user]);
  
  // Handle like/unlike actions
  const handleLike = async () => {
    if (!user || !timelapse.id) return;
    
    try {
      setIsLoading(true);
      
      const newIsLiked = !isLiked;
      const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
      
      // Optimistic update
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
      
      // Update in database
      if (newIsLiked) {
        await likeTimelapseItem(timelapse.id);
      } else {
        await unlikeTimelapseItem(timelapse.id);
      }
      
      // Notify parent component if callback provided
      if (onLikeUpdated) {
        onLikeUpdated(timelapse.id, newLikeCount, newIsLiked);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      logError(error, 'TimelapseViewer.handleLike');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format the timestamp for display
  const formatTimestamp = () => {
    if (!timelapse.timestamp) return '';
    
    try {
      const date = new Date(timelapse.timestamp);
      return date.toLocaleString();
    } catch (error) {
      return '';
    }
  };
  
  // Render media content based on type
  const renderMedia = () => {
    if (isLoadingMedia) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      );
    }
    
    if (!mediaUrl) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load media</Text>
        </View>
      );
    }
    
    if (timelapse.type === 'video') {
      return (
        <VideoPlayer
          uri={mediaUrl}
          style={styles.media}
          resizeMode="contain"
          shouldPlay={true}
          isLooping={true}
        />
      );
    } else {
      return (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.media}
          resizeMode="contain"
        />
      );
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Timelapse</Text>
          
          {showDeleteButton && onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Text style={styles.navButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Media Content */}
        <View style={styles.mediaContainer}>
          {renderMedia()}
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          {/* Like Button */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
            disabled={isLoading}
          >
            <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
              {isLiked ? '❤️' : '♡'}
            </Text>
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>
          
          {/* Timestamp */}
          {timelapse.timestamp && (
            <Text style={styles.timestamp}>{formatTimestamp()}</Text>
          )}
        </View>
        
        {/* Description */}
        {timelapse.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{timelapse.description}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mediaContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
  },
  actionIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  likedIcon: {
    color: '#ff4d6d',
  },
  timestamp: {
    color: '#999999',
    fontSize: 14,
  },
  descriptionContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  description: {
    color: '#ffffff',
    fontSize: 16,
  },
});

// Also export as default for backward compatibility
export default TimelapseViewer; 