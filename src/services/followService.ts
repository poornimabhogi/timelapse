import { subscriptionClient } from './aws-config';
import { gql } from '@apollo/client';
import {
  followUser,
  unfollowUser,
  getFollowedSellers,
  isFollowing,
  FollowUserMutation,
  UnfollowUserMutation,
  GetFollowedSellersQuery,
  IsFollowingQuery
} from '../graphql/queries';

export interface FollowedSeller {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
}

/**
 * Follow a seller to receive their live updates
 */
export const followSeller = async (followerId: string, sellerId: string): Promise<boolean> => {
  try {
    console.log(`User ${followerId} following seller ${sellerId}`);
    
    const response = await subscriptionClient.mutate({
      mutation: gql`${followUser}`,
      variables: {
        followerId,
        followingId: sellerId
      }
    }) as { data: FollowUserMutation };

    if (response?.data?.followUser) {
      console.log(`✅ Successfully followed seller: ${response.data.followUser.following.username}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error following seller:', error);
    throw error;
  }
};

/**
 * Unfollow a seller to stop receiving their live updates
 */
export const unfollowSeller = async (followerId: string, sellerId: string): Promise<boolean> => {
  try {
    console.log(`User ${followerId} unfollowing seller ${sellerId}`);
    
    const response = await subscriptionClient.mutate({
      mutation: gql`${unfollowUser}`,
      variables: {
        followerId,
        followingId: sellerId
      }
    }) as { data: UnfollowUserMutation };

    if (response?.data?.unfollowUser) {
      console.log(`✅ Successfully unfollowed seller`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error unfollowing seller:', error);
    throw error;
  }
};

/**
 * Get list of all sellers that the user follows
 */
export const getFollowedSellersList = async (userId: string): Promise<FollowedSeller[]> => {
  try {
    const response = await subscriptionClient.query({
      query: gql`${getFollowedSellers}`,
      variables: { userId },
      fetchPolicy: 'no-cache'
    }) as { data: GetFollowedSellersQuery };

    if (response?.data?.getFollowedSellers) {
      return response.data.getFollowedSellers;
    }

    return [];
  } catch (error) {
    console.error('Error fetching followed sellers:', error);
    return [];
  }
};

/**
 * Check if user is following a specific seller
 */
export const checkFollowingStatus = async (followerId: string, sellerId: string): Promise<boolean> => {
  try {
    const response = await subscriptionClient.query({
      query: gql`${isFollowing}`,
      variables: {
        followerId,
        followingId: sellerId
      },
      fetchPolicy: 'no-cache'
    }) as { data: IsFollowingQuery };

    return response?.data?.isFollowing || false;
  } catch (error) {
    console.error('Error checking following status:', error);
    return false;
  }
};

/**
 * Toggle follow status for a seller
 */
export const toggleFollowSeller = async (
  followerId: string, 
  sellerId: string
): Promise<{ isFollowing: boolean; action: 'followed' | 'unfollowed' }> => {
  try {
    const currentlyFollowing = await checkFollowingStatus(followerId, sellerId);
    
    if (currentlyFollowing) {
      await unfollowSeller(followerId, sellerId);
      return { isFollowing: false, action: 'unfollowed' };
    } else {
      await followSeller(followerId, sellerId);
      return { isFollowing: true, action: 'followed' };
    }
  } catch (error) {
    console.error('Error toggling follow status:', error);
    throw error;
  }
};

/**
 * Get followed sellers with verified status
 */
export const getFollowedVerifiedSellers = async (userId: string): Promise<FollowedSeller[]> => {
  try {
    const followedSellers = await getFollowedSellersList(userId);
    
    // Filter for verified sellers only (you might need to add verification status to the query)
    // For now, returning all followed sellers
    return followedSellers;
  } catch (error) {
    console.error('Error fetching followed verified sellers:', error);
    return [];
  }
};

/**
 * Get following statistics for user
 */
export const getFollowingStats = async (userId: string): Promise<{
  followingCount: number;
  followedSellers: FollowedSeller[];
}> => {
  try {
    const followedSellers = await getFollowedSellersList(userId);
    
    return {
      followingCount: followedSellers.length,
      followedSellers
    };
  } catch (error) {
    console.error('Error fetching following stats:', error);
    return {
      followingCount: 0,
      followedSellers: []
    };
  }
}; 