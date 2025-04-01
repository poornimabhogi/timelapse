import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SocialFeedItem } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TimelapseCardProps {
  timelapse: SocialFeedItem;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

const { width } = Dimensions.get('window');

const TimelapseCard: React.FC<TimelapseCardProps> = ({
  timelapse,
  onPress,
  onLike,
  onComment,
}) => {
  const isVideo = timelapse.type === 'video';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Image
          source={{ uri: timelapse.user.profilePicture }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{timelapse.user.username}</Text>
        <Text style={styles.timestamp}>
          {new Date(timelapse.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.mediaContainer}>
        {isVideo ? (
          <View style={styles.videoPlaceholder}>
            <Icon name="play-circle" size={40} color="#fff" />
          </View>
        ) : (
          <Image
            source={{ uri: timelapse.mediaUrls[0] }}
            style={styles.media}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{timelapse.title}</Text>
        {timelapse.description && (
          <Text style={styles.description}>{timelapse.description}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Icon name="heart-outline" size={24} color="#666" />
          <Text style={styles.actionText}>{timelapse.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Icon name="comment-outline" size={24} color="#666" />
          <Text style={styles.actionText}>{timelapse.comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  mediaContainer: {
    width: width - 32,
    height: width - 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
});

export default TimelapseCard; 