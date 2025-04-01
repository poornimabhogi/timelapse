import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { API } from 'aws-amplify';
import { listTimelapses } from '../../graphql/queries';
import { onCreateTimelapse } from '../../graphql/subscriptions';
import TimelapseCard from '../../components/TimelapseCard';
import { SocialFeedItem } from '../../types';

const SocialFeedScreen: React.FC = () => {
  const [timelapses, setTimelapses] = useState<SocialFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTimelapses = async () => {
    try {
      const response = await API.graphql({
        query: listTimelapses,
        variables: {
          limit: 20,
        },
      });

      const items = response.data.listTimelapses.items;
      setTimelapses(items);
    } catch (error) {
      console.error('Error fetching timelapses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimelapses();

    // Subscribe to new timelapses
    const subscription = API.graphql({
      query: onCreateTimelapse,
    }).subscribe({
      next: ({ value }: any) => {
        const newTimelapse = value.data.onCreateTimelapse;
        setTimelapses((prev) => [newTimelapse, ...prev]);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTimelapses();
  };

  const handleLike = async (timelapseId: string) => {
    // TODO: Implement like functionality
  };

  const handleComment = async (timelapseId: string) => {
    // TODO: Implement comment functionality
  };

  const handleTimelapsePress = (timelapseId: string) => {
    // TODO: Navigate to timelapse detail screen
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={timelapses}
        renderItem={({ item }) => (
          <TimelapseCard
            timelapse={item}
            onPress={() => handleTimelapsePress(item.id)}
            onLike={() => handleLike(item.id)}
            onComment={() => handleComment(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No timelapses yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SocialFeedScreen; 