import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { uploadToS3 } from '../../utils/s3Upload';
import { useAuth } from '../../contexts/AuthContext';
import { dynamodbService, TimelapseItem as DbTimelapseItem } from '../../services/dynamodbService';

interface TimeLapseItem {
  id: string;
  userId: string;
  mediaUrl: string;
  type: 'photo' | 'video';
  createdAt: any;
  description: string;
  likes: number;
  comments: any[];
}

interface TimeLapseScreenProps {
  navigation: any;
}

const TimeLapseScreen: React.FC<TimeLapseScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [timelapseItems, setTimelapseItems] = useState<TimeLapseItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchTimelapseItems = async () => {
      try {
        const items = await dynamodbService.getTimelapseItems(user.uid);
        const formattedItems = items.map(item => ({
          id: item.id || '',
          userId: item.userId,
          mediaUrl: item.mediaUrl,
          type: item.type as 'photo' | 'video',
          createdAt: new Date(item.createdAt),
          description: item.description || '',
          likes: item.likes,
          comments: []
        } as TimeLapseItem));
        
        setTimelapseItems(formattedItems);
      } catch (error) {
        console.error('Error fetching timelapse items:', error);
      }
    };

    fetchTimelapseItems();

    const subscription = dynamodbService.subscribeToTimelapseItems(user.uid, (newItem) => {
      const formattedItem = {
        id: newItem.id || '',
        userId: newItem.userId,
        mediaUrl: newItem.mediaUrl,
        type: newItem.type as 'photo' | 'video',
        createdAt: new Date(newItem.createdAt),
        description: newItem.description || '',
        likes: newItem.likes,
        comments: []
      } as TimeLapseItem;
      
      setTimelapseItems(prev => [formattedItem, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleTimelapseMedia = async () => {
    Alert.alert(
      'Add Media',
      'Choose option',
      [
        { 
          text: 'Take Photo/Video', 
          onPress: async () => {
            if (Platform.OS === 'ios') {
              launchCamera({
                mediaType: 'mixed',
                quality: 0.8,
                presentationStyle: 'fullScreen',
                saveToPhotos: true,
                includeBase64: false,
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
                  try {
                    setIsUploading(true);
                    setUploadProgress(0);

                    const uploadPromises = response.assets.map(async (asset) => {
                      const file = {
                        uri: asset.uri || '',
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `media-${Date.now()}.${asset.type?.includes('video') ? 'mp4' : 'jpg'}`,
                      };

                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      const timestamp = Date.now();
                      const newItem = await dynamodbService.createTimelapseItem({
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: timestamp,
                        description: '',
                        likes: 0,
                        likedBy: []
                      });
                      
                      if (!newItem || !newItem.id) {
                        console.error('Failed to create timelapse item in DynamoDB, got:', newItem);
                        throw new Error('Failed to save media data to database');
                      }
                      
                      console.log('Successfully created timelapse item with ID:', newItem.id);
                      
                      return {
                        id: newItem.id || '',
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: new Date(),
                        description: '',
                        likes: 0,
                        comments: []
                      } as TimeLapseItem;
                    });

                    const newItems = await Promise.all(uploadPromises);
                    setTimelapseItems(prev => [...newItems, ...prev]);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    let errorMessage = 'Failed to upload media. Please try again.';
                    
                    if (error instanceof Error) {
                      console.error('Error details:', error.message);
                      if (error.message.includes('network') || error.message.includes('Network')) {
                        errorMessage = 'Network error. Please check your internet connection and try again.';
                      } else if (error.message.includes('permission')) {
                        errorMessage = 'Permission denied. Please check your app permissions.';
                      } else if (error.message.includes('database')) {
                        errorMessage = 'Could not save to database. Please try again later.';
                      }
                    }
                    
                    Alert.alert('Error', errorMessage);
                  } finally {
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }
              });
            } else {
              launchCamera({
                mediaType: 'mixed',
                quality: 0.8,
                saveToPhotos: true,
              }, async (response: ImagePickerResponse) => {
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
                  try {
                    setIsUploading(true);
                    setUploadProgress(0);

                    const uploadPromises = response.assets.map(async (asset) => {
                      const file = {
                        uri: asset.uri || '',
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `media-${Date.now()}.${asset.type?.includes('video') ? 'mp4' : 'jpg'}`,
                      };

                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      const timestamp = Date.now();
                      const newItem = await dynamodbService.createTimelapseItem({
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: timestamp,
                        description: '',
                        likes: 0,
                        likedBy: []
                      });
                      
                      if (!newItem || !newItem.id) {
                        console.error('Failed to create timelapse item in DynamoDB, got:', newItem);
                        throw new Error('Failed to save media data to database');
                      }
                      
                      console.log('Successfully created timelapse item with ID:', newItem.id);
                      
                      return {
                        id: newItem.id || '',
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: new Date(),
                        description: '',
                        likes: 0,
                        comments: []
                      } as TimeLapseItem;
                    });

                    const newItems = await Promise.all(uploadPromises);
                    setTimelapseItems(prev => [...newItems, ...prev]);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    let errorMessage = 'Failed to upload media. Please try again.';
                    
                    if (error instanceof Error) {
                      console.error('Error details:', error.message);
                      if (error.message.includes('network') || error.message.includes('Network')) {
                        errorMessage = 'Network error. Please check your internet connection and try again.';
                      } else if (error.message.includes('permission')) {
                        errorMessage = 'Permission denied. Please check your app permissions.';
                      } else if (error.message.includes('database')) {
                        errorMessage = 'Could not save to database. Please try again later.';
                      }
                    }
                    
                    Alert.alert('Error', errorMessage);
                  } finally {
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }
              });
            }
          }
        },
        { 
          text: 'Choose from Library', 
          onPress: async () => {
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
                  try {
                    setIsUploading(true);
                    setUploadProgress(0);

                    const uploadPromises = response.assets.map(async (asset) => {
                      const file = {
                        uri: asset.uri || '',
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `media-${Date.now()}.${asset.type?.includes('video') ? 'mp4' : 'jpg'}`,
                      };

                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      const timestamp = Date.now();
                      const newItem = await dynamodbService.createTimelapseItem({
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: timestamp,
                        description: '',
                        likes: 0,
                        likedBy: []
                      });
                      
                      if (!newItem || !newItem.id) {
                        console.error('Failed to create timelapse item in DynamoDB, got:', newItem);
                        throw new Error('Failed to save media data to database');
                      }
                      
                      console.log('Successfully created timelapse item with ID:', newItem.id);
                      
                      return {
                        id: newItem.id || '',
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: new Date(),
                        description: '',
                        likes: 0,
                        comments: []
                      } as TimeLapseItem;
                    });

                    const newItems = await Promise.all(uploadPromises);
                    setTimelapseItems(prev => [...newItems, ...prev]);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    let errorMessage = 'Failed to upload media. Please try again.';
                    
                    if (error instanceof Error) {
                      console.error('Error details:', error.message);
                      if (error.message.includes('network') || error.message.includes('Network')) {
                        errorMessage = 'Network error. Please check your internet connection and try again.';
                      } else if (error.message.includes('permission')) {
                        errorMessage = 'Permission denied. Please check your app permissions.';
                      } else if (error.message.includes('database')) {
                        errorMessage = 'Could not save to database. Please try again later.';
                      }
                    }
                    
                    Alert.alert('Error', errorMessage);
                  } finally {
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }
              });
            } else {
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
                  try {
                    setIsUploading(true);
                    setUploadProgress(0);

                    const uploadPromises = response.assets.map(async (asset) => {
                      const file = {
                        uri: asset.uri || '',
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `media-${Date.now()}.${asset.type?.includes('video') ? 'mp4' : 'jpg'}`,
                      };

                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      const timestamp = Date.now();
                      const newItem = await dynamodbService.createTimelapseItem({
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: timestamp,
                        description: '',
                        likes: 0,
                        likedBy: []
                      });
                      
                      if (!newItem || !newItem.id) {
                        console.error('Failed to create timelapse item in DynamoDB, got:', newItem);
                        throw new Error('Failed to save media data to database');
                      }
                      
                      console.log('Successfully created timelapse item with ID:', newItem.id);
                      
                      return {
                        id: newItem.id || '',
                        userId: user?.uid || '',
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: new Date(),
                        description: '',
                        likes: 0,
                        comments: []
                      } as TimeLapseItem;
                    });

                    const newItems = await Promise.all(uploadPromises);
                    setTimelapseItems(prev => [...newItems, ...prev]);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    let errorMessage = 'Failed to upload media. Please try again.';
                    
                    if (error instanceof Error) {
                      console.error('Error details:', error.message);
                      if (error.message.includes('network') || error.message.includes('Network')) {
                        errorMessage = 'Network error. Please check your internet connection and try again.';
                      } else if (error.message.includes('permission')) {
                        errorMessage = 'Permission denied. Please check your app permissions.';
                      } else if (error.message.includes('database')) {
                        errorMessage = 'Could not save to database. Please try again later.';
                      }
                    }
                    
                    Alert.alert('Error', errorMessage);
                  } finally {
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }
              });
            }
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isUploading && (
        <View style={styles.uploadProgressContainer}>
          <Text style={styles.uploadProgressText}>
            Uploading... {uploadProgress}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  uploadProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadProgressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TimeLapseScreen; 