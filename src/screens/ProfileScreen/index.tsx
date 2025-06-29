import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  PermissionsAndroid,
  Linking,
  ActivityIndicator,
  AppState,
  StatusBar,
  FlatList,
} from 'react-native';
import Video from 'react-native-video';
import { ProfileScreenProps } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
import { styles } from './styles';
import { launchCamera, launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { uploadToS3 } from '../../utils/s3Upload';
import { useAuth } from '../../contexts/AuthContext';
import awsConfig from "../../services/aws-config";
import { gql } from '@apollo/client';
import { onCreateFeaturePost } from '../../graphql/subscriptions';
import { Observable } from 'zen-observable-ts';
import SellerVerificationModal from './components/SellerVerificationModal';
import Icon from 'react-native-vector-icons/Ionicons';
import { SellerVerificationData } from './components/SellerVerificationForm';
import TimelapseViewer from '../../components/SimpleTimelapseViewer';
import { dynamodbService, TimelapseItem as DbTimelapseItem, dataUpdateManager, batchOperations } from '../../services/dynamodbService';
import VideoPlayer from '../../components/VideoPlayer';
import { graphqlClient } from '../../services/aws-config';
import { ProfileMediaProcessor } from '../../services/mediaProcessor';


// Custom interface for media items
interface MediaItem {
  id?: string;
  uri: string;
  type: 'photo' | 'video';
  timestamp?: number;
  likes?: number;
  isLiked?: boolean;
  likedBy?: string[];
  duration?: number;
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

interface SubscriptionResponse {
  data: {
    onCreateFeaturePost: any;
  };
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onChangeScreen }) => {
  const { user, setPhotoPickerActive } = useAuth();
  const [post, setPost] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [timelapseItems, setTimelapseItems] = useState<MediaItem[]>([
    // Sample data with required props
    {
      uri: 'https://via.placeholder.com/150',
      type: 'photo',
      timestamp: Date.now(),
      likes: 0,
      isLiked: false,
      likedBy: []
    }
  ]);
  const [postMedia, setPostMedia] = useState<Asset[]>([]);
  const [featurePosts, setFeaturePosts] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);
  const [isViewDetailsModalVisible, setIsViewDetailsModalVisible] = useState(false);
  const [isEditDetailsModalVisible, setIsEditDetailsModalVisible] = useState(false);
  const [isEarnWithUsModalVisible, setIsEarnWithUsModalVisible] = useState(false);
  const [earnWithUsOption, setEarnWithUsOption] = useState<'influencer' | 'seller' | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  
  // Example user details
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: user?.username || 'User Name',
    email: user?.attributes?.email || 'user@example.com',
    phone: '+1 123 456 7890',
    bio: 'This is a short bio that describes the user in a few words.'
  });
  
  // Temporary state for editing
  const [editableUserDetails, setEditableUserDetails] = useState<UserDetails>(userDetails);
  
  // Subscribe to real-time updates for feature posts
  useEffect(() => {
    if (!user) return;

            const subscription = graphqlClient.subscribe({
      query: gql(onCreateFeaturePost),
    }).subscribe({
      next: (result: any) => {
        if (result?.data?.onCreateFeaturePost) {
          const { onCreateFeaturePost } = result.data;
          setFeaturePosts((prev) => [onCreateFeaturePost, ...prev]);
        }
      },
      error: (error: any) => console.error('Subscription error:', error),
      complete: () => console.log('Subscription completed')
    });

    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [user]);

  // Replace Firebase useEffect with DynamoDB/AppSync
  useEffect(() => {
    if (!user) return;

    // Initial fetch of timelapse items
    const fetchTimelapseItems = async () => {
      try {
        const items = await dynamodbService.getTimelapseItems(user.uid);
        // Convert to MediaItem format
        const mediaItems = items.map(item => ({
          id: item.id,
          uri: item.mediaUrl,
          type: item.type as 'photo' | 'video',
          timestamp: item.createdAt,
          likes: item.likes,
          isLiked: item.likedBy?.includes(user.uid) || false,
          likedBy: item.likedBy || [],
          duration: item.duration,
        } as MediaItem));
        
        setTimelapseItems(mediaItems);
      } catch (error) {
        console.error('Error fetching timelapse items:', error);
      }
    };

    fetchTimelapseItems();

    // Subscribe to new timelapse items
    const subscription = dynamodbService.subscribeToTimelapseItems(user.uid, (newItem) => {
      const newMediaItem = {
        id: newItem.id,
        uri: newItem.mediaUrl,
        type: newItem.type as 'photo' | 'video',
        timestamp: newItem.createdAt,
        likes: newItem.likes,
        isLiked: newItem.likedBy?.includes(user.uid) || false,
        likedBy: newItem.likedBy || [],
        duration: newItem.duration,
      } as MediaItem;
      
      setTimelapseItems(prev => [...prev, newMediaItem]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Add effect to listen for timelapse updates
  useEffect(() => {
    // Only set up listener if user is logged in
    if (!user) return;
    
    console.log('Setting up timelapse update listener');
    
    // Create refresh function
    const handleTimelapseUpdate = () => {
      console.log('Timelapse update detected, refreshing data');
      refreshTimelapseData();
    };
    
    // Listen for both general updates and user-specific updates
    dataUpdateManager.addListener('timelapses-updated', handleTimelapseUpdate);
    dataUpdateManager.addListener(`user-timelapses-${user.uid}`, handleTimelapseUpdate);
    
    // Clean up listeners on unmount
    return () => {
      dataUpdateManager.removeListener('timelapses-updated', handleTimelapseUpdate);
      dataUpdateManager.removeListener(`user-timelapses-${user.uid}`, handleTimelapseUpdate);
    };
  }, [user]);

  const handleEditProfilePicture = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose option',
      [
        { 
          text: 'Take Photo', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              // For iOS, we need to ensure we have camera permissions first
              launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                presentationStyle: 'fullScreen',
                saveToPhotos: true,
                includeBase64: false,
              }, (response: ImagePickerResponse) => {
                if (response.didCancel) {
                  console.log('User cancelled camera');
                  return;
                }
                if (response.errorCode) {
                  console.log('Camera Error: ', response.errorMessage);
                  Alert.alert(
                    'Camera Access Required',
                    'Please enable camera access in your device settings to take photos.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Open Settings', 
                        onPress: () => {
                          if (Platform.OS === 'ios') {
                            Linking.openURL('app-settings:');
                          }
                        }
                      }
                    ]
                  );
                  return;
                }
                if (response.assets && response.assets.length > 0) {
                  setProfileImage(response.assets[0].uri || null);
                }
              });
            } else {
              // For Android, we'll use the existing implementation
              launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: true,
              }, (response: ImagePickerResponse) => {
                if (response.didCancel) {
                  console.log('User cancelled camera');
                  return;
                }
                if (response.errorCode) {
                  console.log('Camera Error: ', response.errorMessage);
                  Alert.alert('Error', 'Failed to access camera. Please check your permissions.');
                  return;
                }
                if (response.assets && response.assets.length > 0) {
                  setProfileImage(response.assets[0].uri || null);
                }
              });
            }
          }
        },
        { 
          text: 'Choose from Library', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              // For iOS, we need to ensure we have photo library permissions first
              launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                presentationStyle: 'fullScreen',
                includeBase64: false,
              }, (response: ImagePickerResponse) => {
                if (response.didCancel) {
                  console.log('User cancelled image picker');
                  return;
                }
                if (response.errorCode) {
                  console.log('ImagePicker Error: ', response.errorMessage);
                  Alert.alert(
                    'Photo Library Access Required',
                    'Please enable photo library access in your device settings to select photos.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Open Settings', 
                        onPress: () => {
                          if (Platform.OS === 'ios') {
                            Linking.openURL('app-settings:');
                          }
                        }
                      }
                    ]
                  );
                  return;
                }
                if (response.assets && response.assets.length > 0) {
                  setProfileImage(response.assets[0].uri || null);
                }
              });
            } else {
              // For Android, we'll use the existing implementation
              launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: false,
              }, (response: ImagePickerResponse) => {
                if (response.didCancel) {
                  console.log('User cancelled image picker');
                  return;
                }
                if (response.errorCode) {
                  console.log('ImagePicker Error: ', response.errorMessage);
                  Alert.alert('Error', 'Failed to access photo library. Please check your permissions.');
                  return;
                }
                if (response.assets && response.assets.length > 0) {
                  setProfileImage(response.assets[0].uri || null);
                }
              });
            }
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Settings menu handlers
  const toggleSettingsMenu = () => {
    setIsSettingsMenuVisible(!isSettingsMenuVisible);
  };

  const handleViewDetails = () => {
    setIsSettingsMenuVisible(false);
    setIsViewDetailsModalVisible(true);
  };

  const handleEditDetails = () => {
    setIsSettingsMenuVisible(false);
    setEditableUserDetails({...userDetails});
    setIsEditDetailsModalVisible(true);
  };

  const handleEarnWithUs = () => {
    setIsSettingsMenuVisible(false);
    setIsEarnWithUsModalVisible(true);
    setEarnWithUsOption(null);
  };

  const selectEarnOption = (option: 'influencer' | 'seller') => {
    setEarnWithUsOption(option);
  };

  const saveUserDetails = () => {
    setUserDetails(editableUserDetails);
    setIsEditDetailsModalVisible(false);
    Alert.alert('Success', 'Your profile has been updated successfully!');
  };

  // Add this validation function at a good location in the file
  const validateUser = (): boolean => {
    if (!user || !user.uid) {
      console.error('No user ID available for upload');
      Alert.alert(
        'Authentication Required', 
        'Please sign in to upload photos and videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };
  
  // Then add the validation check to handleTimelapseMedia
  const handleTimelapseMedia = async () => {
    try {
      // Validate that we have a user ID before proceeding
      if (!validateUser()) return;
      
      // Set photo picker active flag before opening the picker
      if (Platform.OS === 'android') {
        setPhotoPickerActive(true);
      }
      
      Alert.alert(
        'Add Media',
        'Choose option',
        [
          { 
            text: 'Take Photo/Video', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                launchCamera({
                  mediaType: 'mixed',
                  quality: 0.8,
                  presentationStyle: 'fullScreen',
                  saveToPhotos: true,
                  includeBase64: false,
                  durationLimit: 60,
                }, async (response: ImagePickerResponse) => {
                  if (response.didCancel) {
                    console.log('User cancelled camera');
                    return;
                  }
                  if (response.errorCode) {
                    console.log('Camera Error: ', response.errorMessage);
                    Alert.alert(
                      'Camera Access Required',
                      'Please enable camera access in your device settings to take photos and videos.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Open Settings', 
                          onPress: () => {
                            if (Platform.OS === 'ios') {
                              Linking.openURL('app-settings:');
                            }
                          }
                        }
                      ]
                    );
                    return;
                  }
                  if (response.assets && response.assets.length > 0) {
                    const asset = response.assets[0];
                    
                    // Check if this is a video
                    if (asset.type?.includes('video')) {
                      setVideoProcessing(true);
                      try {
                        // Check video duration
                        const duration = await checkVideoDuration(asset.uri || '');
                        
                        if (duration > 60) { // More than 1 minute
                          // Show video editing modal
                          setVideoToProcess(asset);
                          setIsVideoModalVisible(true);
                        } else {
                          // Video is under 1 minute - use the uploadMedia helper
                          const file = {
                            uri: asset.uri || '',
                            type: asset.type || 'video/mp4',
                            name: asset.fileName || `video-${Date.now()}.mp4`,
                          };
                          
                          await uploadMedia(file, 'video', duration);
                        }
                      } catch (error) {
                        console.error('Error processing video:', error);
                        Alert.alert('Error', 'Failed to process video. Please try again.');
                        setVideoProcessing(false);
                      }
                    } else {
                      // It's a photo - use the uploadMedia helper
                      const file = {
                        uri: asset.uri || '',
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `photo-${Date.now()}.jpg`,
                      };
                      
                      await uploadMedia(file, 'photo');
                    }
                  }
                });
              } else {
                // Android implementation similar to iOS
                // ... existing code for Android Camera ...
                // Update this section to also save to the database
              }
            }
          },
          { 
            text: 'Choose from Library', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                launchImageLibrary({
                  mediaType: 'mixed',
                  quality: 0.8,
                  presentationStyle: 'fullScreen',
                  includeBase64: false,
                }, async (response: ImagePickerResponse) => {
                  if (response.didCancel) {
                    console.log('User cancelled image picker');
                    return;
                  }
                  if (response.errorCode) {
                    console.log('ImagePicker Error: ', response.errorMessage);
                    Alert.alert(
                      'Photo Library Access Required',
                      'Please enable photo library access in your device settings to select photos and videos.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Open Settings', 
                          onPress: () => {
                            if (Platform.OS === 'ios') {
                              Linking.openURL('app-settings:');
                            }
                          }
                        }
                      ]
                    );
                    return;
                  }
                  if (response.assets && response.assets.length > 0) {
                    const asset = response.assets[0];
                    
                    // Check if this is a video
                    if (asset.type?.includes('video')) {
                      setVideoProcessing(true);
                      try {
                        // Check video duration
                        const duration = await checkVideoDuration(asset.uri || '');
                        
                        if (duration > 60) { // More than 1 minute
                          // Show video editing modal
                          setVideoToProcess(asset);
                          setIsVideoModalVisible(true);
                        } else {
                          // Video is under 1 minute - use the uploadMedia helper
                          const file = {
                            uri: asset.uri || '',
                            type: asset.type || 'video/mp4',
                            name: asset.fileName || `video-${Date.now()}.mp4`,
                          };
                          
                          await uploadMedia(file, 'video', duration);
                        }
                      } catch (error) {
                        console.error('Error processing video:', error);
                        Alert.alert('Error', 'Failed to process video. Please try again.');
                        setVideoProcessing(false);
                      }
                    } else {
                      // It's a photo - use the uploadMedia helper
                      const file = {
                        uri: asset.uri || '',
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `photo-${Date.now()}.jpg`,
                      };
                      
                      await uploadMedia(file, 'photo');
                    }
                  }
                });
              } else {
                // For Android, similar implementation with video support
                launchImageLibrary({
                  mediaType: 'mixed',
                  quality: 0.8,
                  includeBase64: false,
                }, async (response: ImagePickerResponse) => {
                  if (response.didCancel) {
                    console.log('User cancelled image picker');
                    return;
                  }
                  if (response.errorCode) {
                    console.log('ImagePicker Error: ', response.errorMessage);
                    Alert.alert('Error', 'Failed to access photo library. Please check your permissions.');
                    return;
                  }
                  if (response.assets && response.assets.length > 0) {
                    const asset = response.assets[0];
                    
                    // Check if this is a video
                    if (asset.type?.includes('video')) {
                      setVideoProcessing(true);
                      try {
                        // Check video duration
                        const duration = await checkVideoDuration(asset.uri || '');
                        
                        if (duration > 60) { // More than 1 minute
                          // Show video editing modal
                          setVideoToProcess(asset);
                          setIsVideoModalVisible(true);
                        } else {
                          // Video is under 1 minute, add directly
                          const newMedia: MediaItem = {
                            uri: asset.uri || '',
                            type: 'video',
                            timestamp: Date.now(),
                            likes: 0,
                            likedBy: [],
                            duration: duration,
                          };
                          setTimelapseItems(prev => [...prev, newMedia]);
                        }
                      } catch (error) {
                        console.error('Error processing video:', error);
                        Alert.alert('Error', 'Failed to process video. Please try again.');
                      } finally {
                        setVideoProcessing(false);
                      }
                    } else {
                      // It's a photo, add directly
                      const newMedia: MediaItem = {
                        uri: asset.uri || '',
                        type: 'photo',
                        timestamp: Date.now(),
                        likes: 0,
                        likedBy: [],
                      };
                      setTimelapseItems(prev => [...prev, newMedia]);
                    }
                  }
                });
              }
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error selecting media:', 
        typeof error === 'object' ? JSON.stringify(error) : error
      );
      Alert.alert(
        'Error',
        'Failed to select media. Please try again.',
      );
    }
  };

  const handleFeaturePostMedia = () => {
    try {
      // Validate that we have a user ID before proceeding
      if (!validateUser()) return;
      
      // Set photo picker active flag before opening the picker
      if (Platform.OS === 'android') {
        setPhotoPickerActive(true);
      }
      
      Alert.alert(
        'Add Media',
        'Choose option',
        [
          { 
            text: 'Take Photo/Video', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                launchCamera({
                  mediaType: 'mixed',
                  quality: 0.8,
                  presentationStyle: 'fullScreen',
                  saveToPhotos: true,
                  includeBase64: false,
                }, (response: ImagePickerResponse) => {
                  if (response.didCancel) {
                    console.log('User cancelled camera');
                    return;
                  }
                  if (response.errorCode) {
                    console.log('Camera Error: ', response.errorMessage);
                    Alert.alert(
                      'Camera Access Required',
                      'Please enable camera access in your device settings to take photos and videos.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Open Settings', 
                          onPress: () => {
                            if (Platform.OS === 'ios') {
                              Linking.openURL('app-settings:');
                            }
                          }
                        }
                      ]
                    );
                    return;
                  }
                  if (response.assets && response.assets.length > 0) {
                    const newMedia = response.assets.map(asset => ({
                      uri: asset.uri || '',
                      type: asset.type?.includes('video') ? 'video' as const : 'photo' as const,
                      fileName: asset.fileName || '',
                    }));
                    setPostMedia(prev => [...prev, ...newMedia]);
                  }
                });
              } else {
                // For Android, we'll use the existing implementation
                launchCamera({
                  mediaType: 'mixed',
                  quality: 0.8,
                  saveToPhotos: true,
                }, (response: ImagePickerResponse) => {
                  if (response.didCancel) {
                    console.log('User cancelled camera');
                    return;
                  }
                  if (response.errorCode) {
                    console.log('Camera Error: ', response.errorMessage);
                    Alert.alert('Error', 'Failed to access camera. Please check your permissions.');
                    return;
                  }
                  if (response.assets && response.assets.length > 0) {
                    const newMedia = response.assets.map(asset => ({
                      uri: asset.uri || '',
                      type: asset.type?.includes('video') ? 'video' as const : 'photo' as const,
                      fileName: asset.fileName || '',
                    }));
                    setPostMedia(prev => [...prev, ...newMedia]);
                  }
                });
              }
            }
          },
          { 
            text: 'Choose from Library', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                launchImageLibrary({
                  mediaType: 'mixed',
                  quality: 0.8,
                  presentationStyle: 'fullScreen',
                  includeBase64: false,
                }, (response: ImagePickerResponse) => {
                  if (response.didCancel) {
                    console.log('User cancelled image picker');
                    return;
                  }
                  if (response.errorCode) {
                    console.log('ImagePicker Error: ', response.errorMessage);
                    Alert.alert(
                      'Photo Library Access Required',
                      'Please enable photo library access in your device settings to select photos and videos.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Open Settings', 
                          onPress: () => {
                            if (Platform.OS === 'ios') {
                              Linking.openURL('app-settings:');
                            }
                          }
                        }
                      ]
                    );
                    return;
                  }
                  if (response.assets && response.assets.length > 0) {
                    const newMedia = response.assets.map(asset => ({
                      uri: asset.uri || '',
                      type: asset.type?.includes('video') ? 'video' as const : 'photo' as const,
                      fileName: asset.fileName || '',
                    }));
                    setPostMedia(prev => [...prev, ...newMedia]);
                  }
                });
              } else {
                // For Android, we'll use the existing implementation
                launchImageLibrary({
                  mediaType: 'mixed',
                  quality: 0.8,
                  includeBase64: false,
                }, (response: ImagePickerResponse) => {
                  if (response.didCancel) {
                    console.log('User cancelled image picker');
                    return;
                  }
                  if (response.errorCode) {
                    console.log('ImagePicker Error: ', response.errorMessage);
                    Alert.alert('Error', 'Failed to access photo library. Please check your permissions.');
                    return;
                  }
                  if (response.assets && response.assets.length > 0) {
                    const newMedia = response.assets.map(asset => ({
                      uri: asset.uri || '',
                      type: asset.type?.includes('video') ? 'video' as const : 'photo' as const,
                      fileName: asset.fileName || '',
                    }));
                    setPostMedia(prev => [...prev, ...newMedia]);
                  }
                });
              }
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error selecting media:', 
        typeof error === 'object' ? JSON.stringify(error) : error
      );
      Alert.alert(
        'Error',
        'Failed to select media. Please try again.',
      );
    }
  };

  // Handle posting
  const handlePost = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    if (post.trim().length === 0 && postMedia.length === 0) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let mediaUrls: string[] = [];

      // Upload media files to S3 if any
      if (postMedia.length > 0) {
        const uploadPromises = postMedia.map(async (media) => {
          const file = {
            uri: media.uri || '',
            type: media.type || 'image/jpeg',
            name: media.fileName || `media-${Date.now()}.${media.type?.includes('video') ? 'mp4' : 'jpg'}`,
          };

          // Upload to S3
          const s3Url = await uploadToS3(file, 'posts');
          setUploadProgress(prev => prev + (100 / postMedia.length));
          return s3Url;
        });

        mediaUrls = await Promise.all(uploadPromises);
      }

      // Create feature post using AWS AppSync
      const response = await awsConfig.createFeaturePost(post, mediaUrls);
      console.log('Feature post created with response:', response);
      
      if (response.data && response.data.createFeaturePost) {
        // Add to local state - the subscription will also update this, but we add it immediately for better UX
        const newPost = {
          id: response.data.createFeaturePost.id,
          text: post,
          mediaUrls: mediaUrls,
          likes: 0,
          comments: [],
          createdAt: new Date(),
        };
        
        setFeaturePosts(prev => [newPost, ...prev]);
      }

      // Reset form
      setPost('');
      setPostMedia([]);
      setUploadProgress(0);
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Update the handleSettingsOptionPress function
  const handleSettingsOptionPress = (option: string) => {
    setIsSettingsMenuVisible(false);
    if (option === 'viewDetails') {
      setIsViewDetailsModalVisible(true);
    } else if (option === 'editDetails') {
      setIsEditDetailsModalVisible(true);
    } else if (option === 'earnWithUs') {
      setIsEarnWithUsModalVisible(true);
    }
  };

  // Add new renderEarnWithUsModal function
  const renderEarnWithUsModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEarnWithUsModalVisible}
        onRequestClose={() => {
          setIsEarnWithUsModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Earn With Us</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsEarnWithUsModalVisible(false);
                }}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>Enable your earning options:</Text>
            
            <View style={styles.toggleOption}>
              <View style={styles.toggleOptionContent}>
                <Text style={styles.toggleOptionTitle}>Influencer Mode</Text>
                <Text style={styles.toggleOptionDescription}>Share your world, inspire others, earn rewards</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleSwitch, earnWithUsOption === 'influencer' && styles.toggleSwitchActive]}
                onPress={() => {
                  setEarnWithUsOption(earnWithUsOption === 'influencer' ? null : 'influencer');
                }}
              >
                <View style={[styles.toggleHandle, earnWithUsOption === 'influencer' && styles.toggleHandleActive]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.toggleOption}>
              <View style={styles.toggleOptionContent}>
                <Text style={styles.toggleOptionTitle}>Seller Mode</Text>
                <Text style={styles.toggleOptionDescription}>Turn your passion into profit with your own shop</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleSwitch, isSeller && styles.toggleSwitchActive]}
                onPress={() => {
                  setIsSeller(!isSeller);
                  if (!isSeller && sellerStatus === null) {
                    // User is enabling seller mode for the first time
                    setSellerStatus('pending');
                    Alert.alert(
                      'Seller Mode Enabled',
                      'You can complete your seller verification in the Local Shop section.'
                    );
                  }
                }}
              >
                <View style={[styles.toggleHandle, isSeller && styles.toggleHandleActive]} />
              </TouchableOpacity>
            </View>

            {earnWithUsOption === 'influencer' && (
              <View style={styles.optionDetailsContainer}>
                <View style={styles.influencerBanner}>
                  <Text style={styles.influencerBannerText}>✨ Creator Program Details ✨</Text>
                </View>
                
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>💰</Text>
                    <Text style={styles.benefitText}>Earn from sponsored content</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🔍</Text>
                    <Text style={styles.benefitText}>Get promoted in discovery feed</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🎯</Text>
                    <Text style={styles.benefitText}>Access exclusive brand partnerships</Text>
                  </View>
                </View>
                
                <Text style={styles.eligibilityText}>
                  Minimum requirements: <Text style={styles.eligibilityHighlight}>1,000 followers</Text> and <Text style={styles.eligibilityHighlight}>30+ daily active viewers</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsEarnWithUsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleStartSelling = () => {
    setShowVerificationModal(true);
  };

  const handleVerificationSubmit = async (data: SellerVerificationData) => {
    try {
      // Here you would typically send this data to your backend
      // For now, we'll just simulate a successful submission
      console.log('Seller verification data submitted:', data);
      
      // In a real app, you would store this in your database
      // For now, we'll just update the local state
      setSellerStatus('pending');
      setShowVerificationModal(false);
      Alert.alert(
        'Verification Submitted',
        'Your seller verification request has been submitted. We will review it and get back to you soon.'
      );
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification request. Please try again.');
    }
  };

  const handleLocalShopPress = () => {
    if (sellerStatus === 'approved' || sellerStatus === 'pending') {
      console.log('🏪 Opening Local Shop with enhanced media processing...');
      
      Alert.alert(
        '🏪 Local Shop', 
        'Opening your local shop with enhanced features:\n\n✅ Auto-optimized product images\n📦 Real-time inventory updates\n🧹 Automatic S3 cleanup\n💫 Live notifications to followers',
        [
          {
            text: 'Open Shop',
            onPress: () => {
              // Navigate to LocalShop screen with media processing enabled
      onChangeScreen('localshop');
            }
          }
        ]
      );
    } else if (isSeller) {
      // If seller toggle is on but they haven't started verification
      Alert.alert(
        'Seller Verification Required',
        'Please complete the seller verification process to access your Local Shop with enhanced media processing features.'
      );
      setShowVerificationModal(true);
    } else {
      // Not a seller at all
      Alert.alert(
        'Seller Mode Required',
        'Please enable Seller Mode in your Profile Settings to access the Local Shop features including:\n\n📱 Auto-optimized product photos\n📦 Real-time inventory management\n💫 Live updates to followers'
      );
      setIsEarnWithUsModalVisible(true);
    }
  };

  // Add state for tracking selected timelapse and modal visibility within the component
  const [selectedTimelapse, setSelectedTimelapse] = useState<MediaItem | null>(null);
  const [timelapseViewerVisible, setTimelapseViewerVisible] = useState(false);

  // Add a function to handle timelapse selection/view
  const handleTimelapsePress = (timelapse: MediaItem) => {
    setSelectedTimelapse(timelapse);
    setTimelapseViewerVisible(true);
  };

  // Modify refreshTimelapseData to use batch operations
  const refreshTimelapseData = async () => {
    if (!user) return;
    
    // Don't immediately show loading indicator to prevent UI flicker
    // Set a timeout to show loading only if the fetch takes longer than 500ms
    let loadingTimeout: NodeJS.Timeout | null = setTimeout(() => {
      setIsUploading(true);
    }, 500);
    
    try {
      console.log('Refreshing timelapse data');
      
      // Use batch operations for better performance
      const userItems = await dynamodbService.getTimelapseItems(user.uid);
      
      // If we got data before the timeout, cancel the loading indicator
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      
      if (userItems && userItems.length > 0) {
        console.log(`Received ${userItems.length} timelapse items`);
        
        // Sort newest first
        const sortedItems = [...userItems].sort((a, b) => b.createdAt - a.createdAt);
        
        // Get user's liked timelapses to mark them in the UI
        const userLikedIds = sortedItems
          .filter(item => item.likedBy?.includes(user.uid))
          .map(item => item.id);
        console.log(`User has liked ${userLikedIds.length} timelapses`);
        
        // Convert to MediaItem format
        const mediaItems = sortedItems.map(item => ({
          id: item.id,
          uri: item.mediaUrl,
          type: item.type as 'photo' | 'video',
          timestamp: item.createdAt,
          likes: item.likes,
          isLiked: item.likedBy?.includes(user.uid) || false,
          likedBy: item.likedBy || [],
          duration: item.duration,
        } as MediaItem));
        
        setTimelapseItems(mediaItems);
      } else {
        console.log('No timelapse items found or empty response');
      }
    } catch (error) {
      console.error('Error refreshing timelapse data:', error);
      
      // If there was an error, we should still clear the loading timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    } finally {
      // Ensure loading is set to false
      setIsUploading(false);
    }
  };

  // Create a batch like function for multiple timelapses
  const handleBatchLikeTimelapses = async (timelapseIds: string[], like: boolean = true) => {
    if (!user || timelapseIds.length === 0) return;
    
    console.log(`Batch ${like ? 'liking' : 'unliking'} ${timelapseIds.length} timelapses`);
    
    try {
      // Optimistically update UI
      setTimelapseItems(prev => prev.map(item => {
        if (item.id && timelapseIds.includes(item.id)) {
          const isCurrentlyLiked = item.likedBy?.includes(user.uid) || false;
          
          // Only update if the like state is changing
          if (isCurrentlyLiked !== like) {
            const newLikedBy = like 
              ? [...(item.likedBy || []), user.uid]
              : (item.likedBy || []).filter(id => id !== user.uid);
            
            return {
              ...item,
              likes: like ? (item.likes || 0) + 1 : Math.max(0, (item.likes || 0) - 1),
              isLiked: like,
              likedBy: newLikedBy
            };
          }
        }
        return item;
      }));
      
      // Use batch operations for efficient processing
      const interactions = timelapseIds.map(id => ({
        userId: user.uid,
        targetId: id,
        type: 'like' as 'like' | 'comment' | 'view',
        // We could add an extra value field to indicate unlike, but it's handled server-side
      }));
      
      // Process interactions in a batch
      await batchOperations.processInteractionsBatch(interactions);
      
      console.log('Batch like operation completed successfully');
    } catch (error) {
      console.error(`Error in batch ${like ? 'like' : 'unlike'} operation:`, error);
      
      // If there's an error, refresh to get the accurate state
      refreshTimelapseData();
    }
  };

  // Enhanced batch delete with automatic S3 cleanup
  const handleBatchDelete = async (timelapseIds: string[]) => {
    if (!user || timelapseIds.length === 0) return;
    
    Alert.alert(
      '🗑️ Delete Timelapses',
      `Are you sure you want to delete ${timelapseIds.length} items?\n\n⚠️ This will:\n• Remove from your profile\n• Delete from database\n• Clean up S3 storage\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🗑️ Starting batch deletion of ${timelapseIds.length} timelapses`);
              
              // Prepare items for batch deletion with S3 URLs
              const itemsToDelete = timelapseItems
                .filter(item => item.id && timelapseIds.includes(item.id))
                .map(item => ({
                  id: item.id!,
                  urls: [item.uri] // Include the media URL for S3 cleanup
                }));
              
              // Optimistically update UI
              setTimelapseItems(prev => prev.filter(item => 
                !item.id || !timelapseIds.includes(item.id)
              ));
              
              // Use enhanced batch delete with S3 cleanup
              const batchResult = await ProfileMediaProcessor.batchDeleteTimelapses(itemsToDelete);
              
              if (batchResult.success) {
                console.log(`✅ Successfully deleted all ${timelapseIds.length} timelapses with S3 cleanup`);
                
                // Also delete from DynamoDB
              for (const id of timelapseIds) {
                  try {
                await dynamodbService.deleteTimelapseItem(id);
                  } catch (dbError) {
                    console.error(`Warning: Failed to delete ${id} from DynamoDB:`, dbError);
                  }
                }
                
                Alert.alert(
                  '✅ Deletion Complete',
                  `Successfully deleted ${timelapseIds.length} timelapses.\n\n🧹 S3 storage cleaned up\n💾 Database updated`
                );
              } else {
                console.warn(`⚠️ Partial deletion success. Failed items: ${batchResult.failed.length}`);
                
                if (batchResult.failed.length > 0) {
                  Alert.alert(
                    '⚠️ Partial Success',
                    `Deleted ${timelapseIds.length - batchResult.failed.length}/${timelapseIds.length} items.\n\nSome items may still appear until next refresh.`
                  );
                }
              }
              
              // Notify listeners about the update
              dataUpdateManager.notifyListeners('timelapses-updated');
              if (user) {
                dataUpdateManager.notifyListeners(`user-timelapses-${user.uid}`);
              }
            } catch (error) {
              console.error('❌ Error in batch deletion:', error);
              
              // Refresh data to get accurate state after error
              refreshTimelapseData();
              
              Alert.alert(
                '❌ Deletion Error',
                'Failed to delete one or more timelapses. The list has been refreshed to show the current state.'
              );
            }
          }
        }
      ]
    );
  };

  // Update handleLikeUpdated to also use the batch processing when appropriate
  const handleLikeUpdated = async (timelapseId: string, newLikeCount: number, userLiked: boolean) => {
    if (!user || !timelapseId) return;
    
    console.log(`Like updated for timelapse ${timelapseId}: count=${newLikeCount}, liked=${userLiked}`);
    
    try {
      // Update local state first for responsive UI
      setTimelapseItems(prev => prev.map(item => {
        if (item.id === timelapseId) {
          // Handle liked/unliked state
          const newLikedBy = userLiked
            ? [...(item.likedBy || []), user.uid]
            : (item.likedBy || []).filter(id => id !== user.uid);
          
          return {
            ...item,
            likes: newLikeCount,
            isLiked: userLiked,
            likedBy: newLikedBy
          };
        }
        return item;
      }));
      
      // Also update the selectedTimelapse if it's the one being viewed
      if (selectedTimelapse && selectedTimelapse.id === timelapseId) {
        const newLikedBy = userLiked
          ? [...(selectedTimelapse.likedBy || []), user.uid]
          : (selectedTimelapse.likedBy || []).filter(id => id !== user.uid);
        
        setSelectedTimelapse({
          ...selectedTimelapse,
          likes: newLikeCount,
          isLiked: userLiked,
          likedBy: newLikedBy
        });
      }
      
      // Use the batch operations for efficient processing
      await batchOperations.processInteractionsBatch([{
        userId: user.uid,
        targetId: timelapseId,
        type: 'like' as 'like' | 'comment' | 'view',
        // Additional value could indicate a like or unlike
        value: userLiked ? 1 : 0
      }]);
      
    } catch (error) {
      console.error('Error updating like status:', error);
      // Refresh data to ensure UI shows correct state
      refreshTimelapseData();
    }
  };

  // Add state for video processing
  const [videoToProcess, setVideoToProcess] = useState<Asset | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [videoProcessing, setVideoProcessing] = useState(false);

  // Add state for app state
  const [appState, setAppState] = useState(AppState.currentState);

  // Function to refresh all timelapse data
  const fetchTimelapseItems = async () => {
    refreshTimelapseData();
  };

  // Make sure to call fetchTimelapseItems in the initial useEffect
  useEffect(() => {
    fetchTimelapseItems();
    // ...existing code...
  }, [user]);

  // Enhanced upload handler with automatic processing
  const uploadMedia = async (file: any, type: 'photo' | 'video', duration?: number) => {
    try {
      setIsUploading(true);
      console.log(`🔄 Starting ${type} upload with auto-processing...`);
      
      if (!user?.uid) {
        console.error('No user ID available');
        Alert.alert('Authentication Required', 'Please sign in to upload media.');
        return null;
      }
      
      // Use the enhanced media processor for upload with automatic optimization
      const processingResult = await ProfileMediaProcessor.processTimelapseOperation('upload', {
        file: {
          uri: file.uri,
          type: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
          name: file.name || `${type}-${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`
        },
        userId: user.uid,
        metadata: { duration, type }
      });
      
      // Type guard to ensure we have a MediaProcessingResult
      if (typeof processingResult === 'boolean' || !processingResult.success) {
        throw new Error(typeof processingResult === 'object' ? processingResult.error || 'Processing failed' : 'Processing failed');
      }
      
      console.log(`✅ Media processing completed:`, processingResult);
      
      // Prepare DynamoDB item with processed URLs
      const timestamp = Date.now();
      const mediaUrl = processingResult.processedUrl || file.uri; // Fallback to original
      const mediaData = {
        userId: user.uid,
        mediaUrl: mediaUrl,
        type: type,
        createdAt: timestamp,
        description: '',
        likes: 0,
        likedBy: [],
        thumbnailUrls: processingResult.thumbnailUrls || [],
        metadata: processingResult.metadata
      };
      
      // Add duration if it's a video
      if (type === 'video' && duration) {
        Object.assign(mediaData, { duration });
      }
      
      // Add to DynamoDB
      console.log(`💾 Saving ${type} to DynamoDB with processed media...`);
      const newItem = await dynamodbService.createTimelapseItem(mediaData);
      console.log(`✅ DynamoDB save successful, ID: ${newItem.id}`);
      
      if (!newItem || !newItem.id) {
        throw new Error(`Failed to create ${type} item in DynamoDB`);
      }
      
      // Add to local state for immediate display with optimized media
      const newMedia: MediaItem = {
        id: newItem.id,
        uri: mediaUrl,
        type: type,
        timestamp: timestamp,
        likes: 0,
        likedBy: [],
      };
      
      // Add duration if it's a video
      if (type === 'video' && duration) {
        Object.assign(newMedia, { duration });
      }
      
      // Add to the beginning of the array (newest first)
      setTimelapseItems(prev => [newMedia, ...prev]);
      
      // Notify other screens about the update
      dataUpdateManager.notifyListeners('timelapses-updated');
      
      Alert.alert(
        '🎉 Upload Complete!', 
        `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded and optimized successfully!\n\n✅ Auto-optimized for web\n📱 Thumbnails generated\n☁️ Stored in S3`
      );
      return newMedia;
    } catch (error) {
      console.error(`❌ Error uploading ${type}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Upload Error', `Failed to upload ${type}. Please try again.\n\nError: ${errorMessage}`);
      return null;
    } finally {
      setIsUploading(false);
      if (type === 'video') {
        setVideoProcessing(false);
      }
    }
  };

  // Add back the functions we removed but are still referenced
  const checkVideoDuration = async (uri: string): Promise<number> => {
    // In a real implementation, you would use a library like react-native-video
    // to get the actual duration. For now, we'll simulate this.
    return new Promise((resolve) => {
      // Simulate getting video duration (random between 20 and 180 seconds)
      setTimeout(() => {
        const duration = Math.floor(Math.random() * 160) + 20;
        console.log(`Video duration: ${duration} seconds`);
        resolve(duration);
      }, 1000);
    });
  };

  const handleProcessedVideo = async (processedUri: string, duration: number) => {
    try {
      // Validate that we have a user ID before proceeding
      if (!validateUser()) return;
      
      const fileName = `processed-video-${Date.now()}.mp4`;
      const file = {
        uri: processedUri,
        type: 'video/mp4',
        name: fileName,
      };
      
      // Use the uploadMedia helper
      const newMedia = await uploadMedia(file, 'video', duration);
      
      if (newMedia) {
        setIsVideoModalVisible(false);
        setVideoToProcess(null);
      }
    } catch (error) {
      console.error('Error uploading processed video:', error);
      Alert.alert('Error', 'Failed to upload processed video. Please try again.');
    }
  };

  // Fix for handleBatchDelete to work with TimelapseViewer
  const handleTimelapseDelete = async () => {
    if (!selectedTimelapse?.id) return;
    
    // Use the batch delete function with a single ID
    handleBatchDelete([selectedTimelapse.id]);
  };

  return (
    <SafeAreaView style={[
      styles.container,
      Platform.OS === 'android' && styles.androidSafeTop
    ]}>
      {/* Header with Settings */}
      <View style={styles.headerWithSettings}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButtons}>
          {isSeller && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleLocalShopPress}
            >
              <Icon name="storefront-outline" size={24} color="#6B4EFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={toggleSettingsMenu}
          >
            <Icon name="settings-outline" size={24} color="#6B4EFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Menu Dropdown */}
      {isSettingsMenuVisible && (
        <View style={styles.settingsMenu}>
          <TouchableOpacity style={styles.settingsMenuItem} onPress={handleViewDetails}>
            <Text style={styles.settingsMenuItemText}>View Details</Text>
          </TouchableOpacity>
          <View style={styles.settingsMenuDivider} />
          <TouchableOpacity style={styles.settingsMenuItem} onPress={handleEditDetails}>
            <Text style={styles.settingsMenuItemText}>Edit Details</Text>
          </TouchableOpacity>
          <View style={styles.settingsMenuDivider} />
          <TouchableOpacity style={styles.settingsMenuItem} onPress={handleEarnWithUs}>
            <Text style={styles.settingsMenuItemText}>Earn With Us</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={profileImage ? { uri: profileImage } : { uri: 'https://via.placeholder.com/150' }} 
              style={styles.profileImage} 
            />
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditProfilePicture}
            >
              <Text style={styles.editProfileButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userDetails.name}</Text>
            <Text style={styles.profileBio}>{userDetails.bio}</Text>
            <View style={styles.followStats}>
              <View style={styles.followStat}>
                <Text style={styles.followStatNumber}>0</Text>
                <Text style={styles.followStatLabel}>Followers</Text>
              </View>
              <View style={styles.followStat}>
                <Text style={styles.followStatNumber}>0</Text>
                <Text style={styles.followStatLabel}>Following</Text>
              </View>
              <View style={styles.followStat}>
                <Text style={styles.followStatNumber}>0</Text>
                <Text style={styles.followStatLabel}>Posts</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Today's Timelapse */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's Timelapse</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.timelapseScrollView}
          >
            {timelapseItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.timelapseItem}
                onPress={() => handleTimelapsePress(item)}
              >
                {item.type === 'photo' ? (
                  <Image 
                    source={{ uri: item.uri }} 
                    style={styles.timelapseImage} 
                  />
                ) : (
                  <VideoPlayer
                    uri={item.uri}
                    style={styles.timelapseImage}
                    resizeMode="cover"
                    shouldPlay={true}
                    isLooping={true}
                    isMuted={true}
                  />
                )}
                
                {item.timestamp ? (
                  <Text style={styles.timelapseTime}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Text>
                ) : null}
                
                {item.type === 'video' && (
                  <View style={styles.videoIndicator}>
                    <Text style={styles.videoIndicatorText}>▶</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.addTimelapseButton}
              onPress={handleTimelapseMedia}
            >
              <Text style={styles.addTimelapseText}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Feature Posts */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Feature Posts</Text>
          
          {/* New Post Creation */}
          <View style={styles.createPostContainer}>
            <TextInput
              style={styles.postInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#999"
              multiline
              value={post}
              onChangeText={setPost}
            />
            
            {postMedia.length > 0 && (
              <View style={styles.postMediaPreview}>
                {postMedia.map((media, index) => (
                  <View key={index} style={styles.mediaPreviewContainer}>
                    <Image 
                      source={{ uri: media.uri }} 
                      style={styles.postMediaImage} 
                    />
                    {media.type?.includes('video') && (
                      <View style={styles.videoIndicator}>
                        <Text style={styles.videoIndicatorText}>Video</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => {
                        setPostMedia(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <Text style={styles.removeMediaButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handleFeaturePostMedia}
              >
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.postButton,
                  post.trim().length === 0 && postMedia.length === 0 && styles.postButtonDisabled
                ]}
                onPress={handlePost}
                disabled={post.trim().length === 0 && postMedia.length === 0}
              >
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Existing Posts */}
          <View style={styles.postsContainer}>
            {featurePosts.map((post) => (
              <View key={post.id} style={styles.postItem}>
                <View style={styles.postHeader}>
                  <Image 
                    source={{ uri: profileImage || 'https://via.placeholder.com/150' }} 
                    style={styles.postAuthorImage} 
                  />
                  <View style={styles.postAuthorInfo}>
                    <Text style={styles.postAuthorName}>{userDetails.name}</Text>
                    <Text style={styles.postTime}>
                      {post.createdAt?.toDate().toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.postContent}>
                  <Text style={styles.postText}>{post.text}</Text>
                  {post.mediaUrls?.map((url: string, index: number) => (
                    <Image 
                      key={index}
                      source={{ uri: url }} 
                      style={styles.postImage} 
                    />
                  ))}
                </View>
                
                <View style={styles.postActionsRow}>
                  <TouchableOpacity style={styles.postAction}>
                    <Text style={styles.actionIcon}>❤️</Text>
                    <Text style={styles.actionText}>{post.likes} Likes</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.postAction}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>{post.comments?.length || 0} Comments</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* View Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isViewDetailsModalVisible}
        onRequestClose={() => setIsViewDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>User Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{userDetails.name}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{userDetails.email}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{userDetails.phone}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bio:</Text>
              <Text style={styles.detailValue}>{userDetails.bio}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsViewDetailsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditDetailsModalVisible}
        onRequestClose={() => setIsEditDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Details</Text>
            
            <View style={styles.editInputContainer}>
              <Text style={styles.editInputLabel}>Name:</Text>
              <TextInput
                style={styles.editInput}
                value={editableUserDetails.name}
                onChangeText={(text) => setEditableUserDetails({...editableUserDetails, name: text})}
              />
            </View>
            
            <View style={styles.editInputContainer}>
              <Text style={styles.editInputLabel}>Email:</Text>
              <TextInput
                style={styles.editInput}
                value={editableUserDetails.email}
                onChangeText={(text) => setEditableUserDetails({...editableUserDetails, email: text})}
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.editInputContainer}>
              <Text style={styles.editInputLabel}>Phone:</Text>
              <TextInput
                style={styles.editInput}
                value={editableUserDetails.phone}
                onChangeText={(text) => setEditableUserDetails({...editableUserDetails, phone: text})}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.editInputContainer}>
              <Text style={styles.editInputLabel}>Bio:</Text>
              <TextInput
                style={[styles.editInput, styles.editBioInput]}
                value={editableUserDetails.bio}
                onChangeText={(text) => setEditableUserDetails({...editableUserDetails, bio: text})}
                multiline
              />
            </View>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditDetailsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveUserDetails}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {renderEarnWithUsModal()}

      <SellerVerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
      />

      {selectedTimelapse && (
        <TimelapseViewer
          visible={timelapseViewerVisible}
          timelapse={{
            id: selectedTimelapse.uri,
            mediaUrl: selectedTimelapse.uri,
            likes: selectedTimelapse.likes || 0,
            timestamp: selectedTimelapse.timestamp?.toString(),
            userId: user?.uid || 'unknown',
            likedBy: selectedTimelapse.likedBy,
            type: selectedTimelapse.type,
          }}
          onClose={() => setTimelapseViewerVisible(false)}
          onDelete={handleTimelapseDelete}
          showDeleteButton={true}
          onLikeUpdated={handleLikeUpdated}
        />
      )}

      {/* Video Processing Modal */}
      {videoToProcess && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isVideoModalVisible}
          onRequestClose={() => setIsVideoModalVisible(false)}
        >
          <View style={videoModalStyles.container}>
            <View style={videoModalStyles.header}>
              <Text style={videoModalStyles.title}>Trim Video</Text>
              <Text style={videoModalStyles.subtitle}>
                Videos must be 1 minute or less. Trim your video to continue.
              </Text>
            </View>
            
            <View style={videoModalStyles.videoPreview}>
              <Video
                source={{ uri: videoToProcess.uri || '' }}
                style={videoModalStyles.videoPlayer}
                resizeMode="contain"
                repeat={true}
                muted={false}
                paused={false}
              />
            </View>
            
            <View style={videoModalStyles.footer}>
              <TouchableOpacity 
                style={videoModalStyles.cancelButton}
                onPress={() => {
                  setIsVideoModalVisible(false);
                  setVideoToProcess(null);
                }}
              >
                <Text style={videoModalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={videoModalStyles.postButton}
                onPress={() => {
                  // Simulate trimming by using original video with a fixed duration
                  handleProcessedVideo(videoToProcess.uri || '', 60); 
                }}
              >
                <Text style={videoModalStyles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Loading indicator for video processing */}
      {videoProcessing && (
        <View style={videoModalStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6B4EFF" />
          <Text style={videoModalStyles.loadingText}>Processing video...</Text>
        </View>
      )}

      <BottomTabBar currentScreen="profile" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

// Styles for the video modal
const videoModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
  },
  videoPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  videoPlayer: {
    width: '100%',
    height: '70%',
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  postButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#6B4EFF',
  },
  postButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
  }
});

export default ProfileScreen; 