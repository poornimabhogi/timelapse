import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SocialFeedItem } from '../types/social';

interface SocialFeedCardProps {
  item: SocialFeedItem;
  isFollowed: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onPress?: () => void; // Add optional onPress prop
}

export const SocialFeedCard: React.FC<SocialFeedCardProps> = ({
  item,
  isFollowed,
  onFollow,
  onUnfollow,
  onPress,
}) => {
  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Image 
          source={item.userAvatar ? { uri: item.userAvatar } : { uri: 'https://via.placeholder.com/40' }} 
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{timeAgo(item.createdAt)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.followButton, isFollowed && styles.followButtonActive]}
          onPress={isFollowed ? onUnfollow : onFollow}
        >
          <Text style={styles.followButtonText}>
            {isFollowed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {item.content && (
        <Text style={styles.content}>{item.content}</Text>
      )}
      
      {/* Make the media content clickable */}
      {item.mediaUrls && item.mediaUrls.length > 0 && (
        <TouchableOpacity 
          style={styles.mediaContainer}
          onPress={onPress} // Use the onPress prop
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: item.mediaUrls[0] }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          {item.type === 'timelapse' && (
            <View style={styles.timelapseIndicator}>
              <Text style={styles.timelapseIcon}>⏱️</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      
      <View style={styles.interactionBar}>
        <TouchableOpacity style={styles.interactionButton}>
          <Text style={styles.interactionIcon}>💬</Text>
          <Text style={styles.interactionCount}>{item.comments?.length || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.interactionButton}>
          <Text style={styles.interactionIcon}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  followButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonActive: {
    backgroundColor: '#F2F2F2',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  mediaContainer: {
    width: '100%',
    height: 300,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  timelapseIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  timelapseIcon: {
    fontSize: 16,
  },
  interactionBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  interactionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  interactionCount: {
    fontSize: 14,
    color: '#666',
  },
}); 