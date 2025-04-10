import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { uploadToS3 } from '../../utils/s3Upload';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

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

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'timelapses'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data()
      })) as TimeLapseItem[];
      setTimelapseItems(items);
    });

    return () => unsubscribe();
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

                      // Upload to S3
                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      // Add to Firestore
                      await addDoc(collection(db, 'timelapses'), {
                        userId: user?.uid,
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: serverTimestamp(),
                        description: '',
                        likes: 0,
                        comments: [],
                      });
                    });

                    await Promise.all(uploadPromises);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    Alert.alert('Error', 'Failed to upload media. Please try again.');
                  } finally {
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }
              });
            } else {
              // Android implementation remains the same
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

                      // Upload to S3
                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      // Add to Firestore
                      await addDoc(collection(db, 'timelapses'), {
                        userId: user?.uid,
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: serverTimestamp(),
                        description: '',
                        likes: 0,
                        comments: [],
                      });
                    });

                    await Promise.all(uploadPromises);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    Alert.alert('Error', 'Failed to upload media. Please try again.');
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

                      // Upload to S3
                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      // Add to Firestore
                      await addDoc(collection(db, 'timelapses'), {
                        userId: user?.uid,
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: serverTimestamp(),
                        description: '',
                        likes: 0,
                        comments: [],
                      });
                    });

                    await Promise.all(uploadPromises);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    Alert.alert('Error', 'Failed to upload media. Please try again.');
                  } finally {
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }
              });
            } else {
              // Android implementation remains the same
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

                      // Upload to S3
                      const s3Url = await uploadToS3(file, 'timelapses');
                      setUploadProgress(prev => prev + 1);

                      // Add to Firestore
                      await addDoc(collection(db, 'timelapses'), {
                        userId: user?.uid,
                        mediaUrl: s3Url,
                        type: asset.type?.includes('video') ? 'video' : 'photo',
                        createdAt: serverTimestamp(),
                        description: '',
                        likes: 0,
                        comments: [],
                      });
                    });

                    await Promise.all(uploadPromises);
                    Alert.alert('Success', 'Media uploaded successfully!');
                  } catch (error) {
                    console.error('Error uploading media:', error);
                    Alert.alert('Error', 'Failed to upload media. Please try again.');
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