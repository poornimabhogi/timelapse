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
  AppState,
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
import { dynamodbService, dataUpdateManager, TimelapseItem } from '../../services/dynamodbService';

const client = generateClient();

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface SubscriptionResponse<T> {
  provider: any;
  value: {
    data: T;
  };
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
  const [currentUserTimelapses, setCurrentUserTimelapses] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimelapse, setSelectedTimelapse] = useState<SocialFeedItem | null>(null);
  const [timelapseViewerVisible, setTimelapseViewerVisible] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const convertToSocialFeedItem = (item: any): SocialFeedItem => {
    return {
      id: item.id,
      userId: item.userId,
      username: item.user?.username || 'Unknown User',
      userAvatar: item.user?.avatar || null,
      content: item.description || item.text || '',
      mediaUrls: item.mediaUrl ? [item.mediaUrl] : (item.mediaUrls || []),
      likes: item.likes || 0,
      likedBy: item.likedBy || [],
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
      updatedAt: new Date(item.updatedAt || item.createdAt),
      type: item.type || 'timelapse',
    };
  };

  const fetchFollowingTimelapses = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching timelapses from followed users');
      const items = await dynamodbService.getFollowingTimelapseItems(user.uid);
      
      if (items.length > 0) {
        console.log(`Found ${items.length} timelapses from followed users`);
        const feedItems = items.map(convertToSocialFeedItem);
        setFeedItems(prevItems => {
          // Filter out duplicates based on ID
          const existingIds = new Set(prevItems.map(item => item.id));
          const newItems = feedItems.filter(item => !existingIds.has(item.id));
          return [...prevItems, ...newItems];
        });
        
        // Extract followed users from feed items
        const followingUserIds = [...new Set(items.map(item => item.userId))];
        setFollowedUsers(prev => {
          const newFollowed = [...new Set([...prev, ...followingUserIds])];
          return newFollowed;
        });
      } else {
        console.log('No timelapses found from followed users');
      }
    } catch (error) {
      console.error('Error fetching following timelapses:', error);
    }
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
        setFeedItems(prevItems => {
          // Filter out duplicates based on ID
          const existingIds = new Set(prevItems.map(item => item.id));
          const newItems = items.filter(item => !existingIds.has(item.id));
          return [...prevItems, ...newItems];
        });
      }
    } catch (error) {
      console.error('Error fetching feature posts:', error);
    }
  };

  const refreshAllData = async () => {
    console.log("SocialScreen: Refreshing all data");
    setRefreshing(true);
    
    try {
      // Don't clear existing data before fetching new data
      const userId = user?.uid;
      
      if (!userId) {
        console.log("No user ID, skipping data fetch");
        setRefreshing(false);
        return;
      }
      
      console.log("Fetching data with user ID:", userId);
      
      // Fetch the current user's timelapses
      let currentUserItems: TimelapseItem[] = [];
      try {
        currentUserItems = await dynamodbService.getTimelapseItems(userId);
        console.log(`Found ${currentUserItems.length} timelapses for current user`);
      } catch (error) {
        console.error("Error fetching current user timelapses:", error);
      }
      
      // Fetch following users' timelapses
      let followingItems: TimelapseItem[] = [];
      try {
        followingItems = await dynamodbService.getFollowingTimelapseItems(userId);
        console.log(`Found ${followingItems.length} timelapses from followed users`);
      } catch (error) {
        console.error("Error fetching following timelapses:", error);
      }
      
      // Fetch feature posts
      let featurePostItems: any[] = [];
      try {
        const postsResponse = await client.graphql({
          query: getFeaturePosts,
        }) as GraphQLResponse<{ getFeaturePosts: any[] }>;
        featurePostItems = postsResponse.data?.getFeaturePosts || [];
        console.log(`Found ${featurePostItems.length} feature posts`);
      } catch (error) {
        console.error("Error fetching feature posts:", error);
      }
      
      // Convert current user items to SocialFeedItems
      const currentUserFeedItems = currentUserItems.map(convertToSocialFeedItem);
      
      // Sort by timestamp (newest first)
      const sortedCurrentUserItems = currentUserFeedItems.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      // Update current user timelapses
      setCurrentUserTimelapses(sortedCurrentUserItems);
      
      // Convert all other items to SocialFeedItems
      const otherItems = [
        ...followingItems.map(convertToSocialFeedItem),
        ...featurePostItems.map(convertToSocialFeedItem)
      ];
      
      // Remove duplicates based on ID
      const uniqueOtherItems = Array.from(
        new Map(otherItems.map(item => [item.id, item])).values()
      );
      
      // Sort by timestamp (newest first)
      const sortedOtherItems = uniqueOtherItems.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      // Update the feed items
      setFeedItems(sortedOtherItems);
      
      // Extract followed users
      const followedUserIds = [...new Set(
        followingItems.map(item => item.userId)
      )];
      setFollowedUsers(followedUserIds);
      
      console.log(`Refreshed data: found ${sortedCurrentUserItems.length} current user items and ${sortedOtherItems.length} other items`);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground - refreshing SocialScreen');
        refreshAllData();
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);
  
  useEffect(() => {
    const handleScreenFocus = () => {
      console.log('SocialScreen focused - refreshing data');
      refreshAllData();
    };
    
    handleScreenFocus();
    
    return () => {
      // Clean up if needed
    };
  }, []);

  useEffect(() => {
    if (onChangeScreen.toString().includes('social')) {
      console.log('Detected navigation to SocialScreen');
      refreshAllData();
    }
  }, [onChangeScreen]);

  useEffect(() => {
    // Set up subscriptions
    const timelapseSubscription = (client.graphql({
      query: onCreateTimelapse,
    }) as unknown as Observable<SubscriptionResponse<OnCreateTimelapseSubscription>>).subscribe({
      next: ({ value }) => {
        if (value.data?.onCreateTimelapse) {
          const newItem = convertToSocialFeedItem(value.data.onCreateTimelapse);
          setFeedItems(prevItems => {
            // Check if it already exists
            if (prevItems.some(item => item.id === newItem.id)) {
              return prevItems;
            }
            return [newItem, ...prevItems];
          });
        }
      },
      error: (error: Error) => console.error('Error in timelapse subscription:', error),
    });

    const featurePostSubscription = (client.graphql({
      query: onCreateFeaturePost,
    }) as unknown as Observable<SubscriptionResponse<OnCreateFeaturePostSubscription>>).subscribe({
      next: ({ value }) => {
        if (value.data?.onCreateFeaturePost) {
          const newItem = convertToSocialFeedItem(value.data.onCreateFeaturePost);
          setFeedItems(prevItems => {
            // Check if it already exists
            if (prevItems.some(item => item.id === newItem.id)) {
              return prevItems;
            }
            return [newItem, ...prevItems];
          });
        }
      },
      error: (error: Error) => console.error('Error in feature post subscription:', error),
    });

    // Cleanup subscriptions on unmount
    return () => {
      timelapseSubscription.unsubscribe();
      featurePostSubscription.unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    // Only set up listener if user is logged in
    if (!user) return;
    
    console.log('Setting up timelapse update listener in SocialScreen');
    
    // Create refresh function
    const handleTimelapseUpdate = () => {
      console.log('Timelapse update detected in SocialScreen, refreshing data');
      // Refresh immediately to get new data
      refreshAllData();
    };
    
    // Listen for timelapse updates
    dataUpdateManager.addListener('timelapses-updated', handleTimelapseUpdate);
    
    // Clean up listener on unmount
    return () => {
      dataUpdateManager.removeListener('timelapses-updated', handleTimelapseUpdate);
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshAllData().finally(() => {
      setRefreshing(false);
    });
  };

  // Function to open a user's profile when clicked
  const handleUserProfilePress = (userId: string) => {
    console.log(`View profile of user with ID: ${userId}`);
    // TODO: Navigate to user profile
  };

  const handleFollowUser = async (userId: string) => {
    if (!user) return;
    
    try {
      console.log(`Following user: ${userId}`);
      const success = await dynamodbService.followUser(user.uid, userId);
      
      if (success) {
        // Update local state
        setFollowedUsers(prev => {
          if (prev.includes(userId)) return prev;
          return [...prev, userId];
        });
        
        // Refresh the feed to get the new user's timelapses
        fetchFollowingTimelapses();
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };
  
  const handleUnfollowUser = async (userId: string) => {
    if (!user) return;
    
    try {
      console.log(`Unfollowing user: ${userId}`);
      const success = await dynamodbService.unfollowUser(user.uid, userId);
      
      if (success) {
        // Update local state
        setFollowedUsers(prev => prev.filter(id => id !== userId));
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
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
          const currentLikedBy = item.likedBy || [];
          let updatedLikedBy = [...currentLikedBy];
          
          if (userLiked && user && !updatedLikedBy.includes(user.uid)) {
            // Add user to likedBy if they liked it
            updatedLikedBy.push(user.uid);
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
    
    // Also update currentUserTimelapses if the liked item is there
    setCurrentUserTimelapses(prev => 
      prev.map(item => {
        if (item.id === timelapseId) {
          // Update likedBy array based on action
          const currentLikedBy = item.likedBy || [];
          let updatedLikedBy = [...currentLikedBy];
          
          if (userLiked && user && !updatedLikedBy.includes(user.uid)) {
            updatedLikedBy.push(user.uid);
          } else if (!userLiked && user) {
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
      const currentLikedBy = selectedTimelapse.likedBy || [];
      let updatedLikedBy = [...currentLikedBy];
      
      if (userLiked && user && !updatedLikedBy.includes(user.uid)) {
        updatedLikedBy.push(user.uid);
      } else if (!userLiked && user) {
        updatedLikedBy = updatedLikedBy.filter(id => id !== user.uid);
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

        {/* Current User's Timelapses - Circular Format */}
        {currentUserTimelapses.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Timelapses</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.timelapseScrollView}
            >
              {currentUserTimelapses.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.timelapseItem}
                  onPress={() => handleTimelapsePress(item)}
                >
                  <Image 
                    source={{ uri: item.mediaUrls[0] || 'https://via.placeholder.com/150' }} 
                    style={styles.timelapseImage} 
                  />
                  {item.createdAt ? (
                    <Text style={styles.timelapseTime}>
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Social Feed */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Social Feed</Text>
          
          {feedItems.length > 0 ? (
            <FlatList
              data={feedItems}
              renderItem={({ item }) => (
                <SocialFeedCard
                  item={item}
                  isFollowed={followedUsers.includes(item.userId)}
                  onFollow={() => handleFollowUser(item.userId)}
                  onUnfollow={() => handleUnfollowUser(item.userId)}
                  onPress={() => handleTimelapsePress(item)}
                />
              )}
              keyExtractor={item => item.id}
              style={styles.feedList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No posts yet. Follow users to see their timelapses in your feed!
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
            likedBy: selectedTimelapse.likedBy || [],
            type: selectedTimelapse.type === 'timelapse' ? 'photo' : 'video'
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