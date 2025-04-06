import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SocialScreenProps } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
import { styles } from './styles';
import { useAuth } from '../../contexts/AuthContext';
import { generateClient } from 'aws-amplify/api';
import { listTimelapses, getFeaturePosts } from '../../graphql/queries';
import { onCreateTimelapse, onCreateFeaturePost } from '../../graphql/subscriptions';
import { OnCreateTimelapseSubscription, OnCreateFeaturePostSubscription } from '../../graphql/subscriptions';
import { SocialFeedItem } from '../../types/social';
import { SocialFeedCard } from '../../components/SocialFeedCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Observable } from 'zen-observable-ts';
import TimelapseViewer from '../../components/TimelapseViewer';

const client = generateClient();

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface SubscriptionResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

const SocialScreen: React.FC<SocialScreenProps> = ({ onChangeScreen }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [feedItems, setFeedItems] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimelapse, setSelectedTimelapse] = useState<SocialFeedItem | null>(null);
  const [timelapseViewerVisible, setTimelapseViewerVisible] = useState(false);

  const convertToSocialFeedItem = (item: any): SocialFeedItem => {
    return {
      id: item.id,
      userId: item.userId,
      username: item.user?.username || 'Unknown User',
      userAvatar: item.user?.avatar || null,
      content: item.description || item.text || '',
      mediaUrls: item.mediaUrls || [],
      likes: item.likes || 0,
      comments: item.comments?.map((comment: any) => ({
        id: comment.id,
        text: comment.text,
        createdAt: new Date(comment.createdAt),
        user: {
          id: comment.user.id,
          username: comment.user.username,
          name: comment.user.name,
          avatar: comment.user.avatar,
        },
      })) || [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      type: item.type || 'timelapse',
    };
  };

  const fetchTimelapses = async () => {
    try {
      const response = await client.graphql({
        query: listTimelapses,
        variables: { limit: 10 },
      }) as GraphQLResponse<{ listTimelapses: { items: any[] } }>;

      if (response.data?.listTimelapses?.items) {
        const items = response.data.listTimelapses.items.map(convertToSocialFeedItem);
        setFeedItems(items);
        
        // Extract followed users from feed items
        const followedUserIds = items
          .map(item => item.userId)
          .filter(id => id !== user?.uid);
        setFollowedUsers(followedUserIds);
      }
    } catch (error) {
      console.error('Error fetching timelapses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFeaturePosts = async () => {
    try {
      const response = await client.graphql({
        query: getFeaturePosts,
      }) as GraphQLResponse<{ getFeaturePosts: any[] }>;

      if (response.data?.getFeaturePosts) {
        const items = response.data.getFeaturePosts.map(convertToSocialFeedItem);
        setFeedItems(prevItems => [...prevItems, ...items]);
      }
    } catch (error) {
      console.error('Error fetching feature posts:', error);
    }
  };

  useEffect(() => {
    fetchTimelapses();
    fetchFeaturePosts();

    // Set up subscriptions
    const timelapseSubscription = (client.graphql({
      query: onCreateTimelapse,
    }) as unknown as Observable<SubscriptionResponse<OnCreateTimelapseSubscription>>).subscribe({
      next: ({ data }) => {
        if (data?.onCreateTimelapse) {
          const newItem = convertToSocialFeedItem(data.onCreateTimelapse);
          setFeedItems(prevItems => [newItem, ...prevItems]);
        }
      },
      error: (error: Error) => console.error('Error in timelapse subscription:', error),
    });

    const featurePostSubscription = (client.graphql({
      query: onCreateFeaturePost,
    }) as unknown as Observable<SubscriptionResponse<OnCreateFeaturePostSubscription>>).subscribe({
      next: ({ data }) => {
        if (data?.onCreateFeaturePost) {
          const newItem = convertToSocialFeedItem(data.onCreateFeaturePost);
          setFeedItems(prevItems => [newItem, ...prevItems]);
        }
      },
      error: (error: Error) => console.error('Error in feature post subscription:', error),
    });

    // Cleanup subscriptions on unmount
    return () => {
      timelapseSubscription.unsubscribe();
      featurePostSubscription.unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimelapses();
    fetchFeaturePosts();
  };

  // Function to open a user's profile when clicked
  const handleUserProfilePress = (userId: string) => {
    console.log(`View profile of user with ID: ${userId}`);
    // TODO: Navigate to user profile
  };

  const handleTimelapsePress = (timelapse: SocialFeedItem) => {
    setSelectedTimelapse(timelapse);
    setTimelapseViewerVisible(true);
  };

  const handleLikeUpdated = (timelapseId: string, newLikeCount: number, userLiked: boolean) => {
    console.log(`Social screen like updated: ${timelapseId}, count: ${newLikeCount}, liked: ${userLiked}`);
    
    // Update feedItems state with the new like count and user like status
    setFeedItems(prev => 
      prev.map(item => {
        if (item.id === timelapseId) {
          // Update likedBy array based on action
          let updatedLikedBy = item.likedBy || [];
          
          if (userLiked && user && !updatedLikedBy.includes(user.uid)) {
            // Add user to likedBy if they liked it
            updatedLikedBy = [...updatedLikedBy, user.uid];
          } else if (!userLiked && user) {
            // Remove user from likedBy if they unliked it
            updatedLikedBy = updatedLikedBy.filter(id => id !== user.uid);
          }
          
          return { 
            ...item, 
            likes: newLikeCount,
            likedBy: updatedLikedBy
          };
        }
        return item;
      })
    );
    
    // Also update the selectedTimelapse state if this is the one being viewed
    if (selectedTimelapse && selectedTimelapse.id === timelapseId) {
      console.log('Updating selected timelapse');
      // Create updated version of the selected timelapse
      const updatedLikedBy = selectedTimelapse.likedBy || [];
      
      if (userLiked && user && !updatedLikedBy.includes(user.uid)) {
        updatedLikedBy.push(user.uid);
      } else if (!userLiked && user) {
        const index = updatedLikedBy.indexOf(user.uid);
        if (index !== -1) {
          updatedLikedBy.splice(index, 1);
        }
      }
      
      setSelectedTimelapse({
        ...selectedTimelapse,
        likes: newLikeCount,
        likedBy: updatedLikedBy
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[
      styles.container,
      Platform.OS === 'android' && styles.androidSafeTop
    ]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Today's TimeCapsules */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's TimeCapsules</Text>
          
          {followedUsers.length > 0 ? (
            <FlatList
              data={followedUsers}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.timeCapsuleItem}
                  onPress={() => handleUserProfilePress(item)}
                >
                  <View style={styles.timeCapsuleImage}>
                    <Image 
                      source={{ uri: item }}
                      style={styles.userImage}
                    />
                  </View>
                  <Text style={styles.timeCapsuleUsername}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
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
          
          {feedItems.length > 0 ? (
            <FlatList
              data={feedItems}
              renderItem={({ item }) => (
                <SocialFeedCard
                  item={item}
                  isFollowed={followedUsers.includes(item.userId)}
                  onFollow={() => {
                    setFollowedUsers(prev => [...prev, item.userId]);
                  }}
                  onUnfollow={() => {
                    setFollowedUsers(prev => prev.filter(id => id !== item.userId));
                  }}
                  onPress={() => handleTimelapsePress(item)}
                />
              )}
              keyExtractor={item => item.id}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No feature posts yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomTabBar currentScreen="social" onChangeScreen={onChangeScreen} />
      {selectedTimelapse && (
        <TimelapseViewer
          visible={timelapseViewerVisible}
          timelapse={{
            id: selectedTimelapse.id,
            mediaUrl: selectedTimelapse.mediaUrls[0] || '',
            likes: selectedTimelapse.likes || 0,
            timestamp: selectedTimelapse.createdAt.toString(),
            userId: selectedTimelapse.userId,
            description: selectedTimelapse.content,
            likedBy: selectedTimelapse.likedBy,
          }}
          onClose={() => setTimelapseViewerVisible(false)}
          showDeleteButton={false}
          onLikeUpdated={handleLikeUpdated}
        />
      )}
    </SafeAreaView>
  );
};

export default SocialScreen; 