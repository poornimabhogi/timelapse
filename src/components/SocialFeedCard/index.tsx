import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SocialFeedItem } from '../../types/social';

interface SocialFeedCardProps {
  item: SocialFeedItem;
  isFollowed: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}

export const SocialFeedCard: React.FC<SocialFeedCardProps> = ({
  item,
  isFollowed,
  onFollow,
  onUnfollow,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo}>
          <Image
            source={{ uri: item.userAvatar || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timestamp}>
              {item.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followButton, isFollowed && styles.followingButton]}
          onPress={isFollowed ? onUnfollow : onFollow}
        >
          <Text style={[styles.followText, isFollowed && styles.followingText]}>
            {isFollowed ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      {item.mediaUrls.length > 0 && (
        <View style={styles.mediaContainer}>
          {item.mediaUrls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.media}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>❤️</Text>
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>↪️</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#E5E5E5',
  },
  followText: {
    color: '#fff',
    fontWeight: '600',
  },
  followingText: {
    color: '#666',
  },
  content: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
}); 