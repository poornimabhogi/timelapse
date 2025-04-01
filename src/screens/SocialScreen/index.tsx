import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import { SocialScreenProps } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
import { styles } from './styles';

// Mock data for followed users' timelapses and posts
const MOCK_FOLLOWED_USERS = [
  {
    id: '1',
    username: 'john_doe',
    profileImage: 'https://via.placeholder.com/150',
    hasTimelapse: true,
  },
  {
    id: '2',
    username: 'jane_smith',
    profileImage: 'https://via.placeholder.com/150',
    hasTimelapse: true,
  },
  {
    id: '3',
    username: 'mike_jones',
    profileImage: 'https://via.placeholder.com/150',
    hasTimelapse: false,
  },
  {
    id: '4',
    username: 'sarah_lee',
    profileImage: 'https://via.placeholder.com/150',
    hasTimelapse: true,
  },
];

const MOCK_FEATURE_POSTS = [
  {
    id: '1',
    userId: '2',
    username: 'jane_smith',
    userImage: 'https://via.placeholder.com/150',
    text: 'Just finished my morning jog! Feeling great and ready for the day. #fitness #morning',
    image: 'https://via.placeholder.com/400x300',
    time: '2 hours ago',
    likes: 24,
    comments: 5,
    hasVideo: false,
  },
  {
    id: '2',
    userId: '1',
    username: 'john_doe',
    userImage: 'https://via.placeholder.com/150',
    text: 'Check out this amazing view from my hike today!',
    image: 'https://via.placeholder.com/400x300',
    time: '5 hours ago',
    likes: 42,
    comments: 8,
    hasVideo: true,
  },
  {
    id: '3',
    userId: '4',
    username: 'sarah_lee',
    userImage: 'https://via.placeholder.com/150',
    text: 'Made a delicious healthy lunch today. Simple but tasty!',
    image: 'https://via.placeholder.com/400x300',
    time: 'Yesterday',
    likes: 18,
    comments: 3,
    hasVideo: false,
  },
];

const SocialScreen: React.FC<SocialScreenProps> = ({ onChangeScreen }) => {
  // Function to open a user's profile when clicked
  const handleUserProfilePress = (userId: string) => {
    console.log(`View profile of user with ID: ${userId}`);
    // This would navigate to the user's profile in a real app
  };

  // Function to render time capsule item
  const renderTimeCapsuleItem = ({ item }: { item: typeof MOCK_FOLLOWED_USERS[0] }) => (
    <TouchableOpacity 
      style={styles.timeCapsuleItem}
      onPress={() => handleUserProfilePress(item.id)}
    >
      <View style={[
        styles.timeCapsuleImage, 
        item.hasTimelapse ? styles.timeCapsuleActive : {}
      ]}>
        <Image 
          source={{ uri: item.profileImage }}
          style={styles.userImage}
        />
      </View>
      <Text style={styles.timeCapsuleUsername}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  // Function to render feature post
  const renderFeaturePost = ({ item }: { item: typeof MOCK_FEATURE_POSTS[0] }) => (
    <View style={styles.featurePostItem}>
      <View style={styles.postHeader}>
        <TouchableOpacity 
          onPress={() => handleUserProfilePress(item.userId)}
          style={styles.postAuthorContainer}
        >
          <Image 
            source={{ uri: item.userImage }}
            style={styles.postAuthorImage}
          />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{item.username}</Text>
            <Text style={styles.postTime}>{item.time}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreOptions}>
          <Text>•••</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={styles.postText}>{item.text}</Text>
        <View style={styles.postImageContainer}>
          <Image 
            source={{ uri: item.image }}
            style={styles.postImage}
          />
          {item.hasVideo && (
            <View style={styles.videoIndicator}>
              <Text style={styles.videoIndicatorText}>▶️</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.actionIcon}>❤️</Text>
          <Text style={styles.actionText}>{item.likes} Likes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.comments} Comments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.actionIcon}>↪️</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const hasFollowedUsers = MOCK_FOLLOWED_USERS.length > 0;
  const hasFeaturePosts = MOCK_FEATURE_POSTS.length > 0;

  return (
    <SafeAreaView style={[
      styles.container,
      Platform.OS === 'android' && styles.androidSafeTop
    ]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <View style={styles.searchIconContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Today's TimeCapsules */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's TimeCapsules</Text>
          
          {hasFollowedUsers ? (
            <FlatList
              data={MOCK_FOLLOWED_USERS}
              renderItem={renderTimeCapsuleItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeCapsuleList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No time capsules from followed users today
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Feature Posts */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Feature Posts</Text>
          
          {hasFeaturePosts ? (
            <View style={styles.featurePostsList}>
              {MOCK_FEATURE_POSTS.map((post) => (
                <View key={post.id}>
                  {renderFeaturePost({ item: post })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No feature posts available
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTabBar currentScreen="social" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

export default SocialScreen; 