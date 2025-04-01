import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { ProfileScreenProps } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
import { styles } from './styles';
import { launchCamera, launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';

// Custom interface for media items
interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  timestamp?: string;
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onChangeScreen }) => {
  const [post, setPost] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [timelapseItems, setTimelapseItems] = useState<MediaItem[]>([]);
  const [postMedia, setPostMedia] = useState<string | null>(null);
  const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);
  const [isViewDetailsModalVisible, setIsViewDetailsModalVisible] = useState(false);
  const [isEditDetailsModalVisible, setIsEditDetailsModalVisible] = useState(false);
  const [isEarnWithUsModalVisible, setIsEarnWithUsModalVisible] = useState(false);
  const [earnWithUsOption, setEarnWithUsOption] = useState<'influencer' | 'seller' | null>(null);
  const [selectedEarnOption, setSelectedEarnOption] = useState<string | null>(null);
  
  // Example user details
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: 'User Name',
    email: 'user@example.com',
    phone: '+1 123 456 7890',
    bio: 'This is a short bio that describes the user in a few words.'
  });
  
  // Temporary state for editing
  const [editableUserDetails, setEditableUserDetails] = useState<UserDetails>(userDetails);
  
  const handleEditProfilePicture = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose option',
      [
        { 
          text: 'Take Photo', 
          onPress: () => {
            launchCamera({
              mediaType: 'photo',
              quality: 0.8,
            }, (response: ImagePickerResponse) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
              } else if (response.assets && response.assets.length > 0) {
                setProfileImage(response.assets[0].uri || null);
              }
            });
          }
        },
        { 
          text: 'Choose from Library', 
          onPress: () => {
            launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
            }, (response: ImagePickerResponse) => {
              if (response.didCancel) {
                console.log('User cancelled image picker');
              } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
              } else if (response.assets && response.assets.length > 0) {
                setProfileImage(response.assets[0].uri || null);
              }
            });
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

  // Handle adding a timelapse item
  const handleAddTimelapse = () => {
    Alert.alert(
      'Add to Today\'s Timelapse',
      'Choose option',
      [
        { 
          text: 'Take Photo', 
          onPress: () => {
            launchCamera({
              mediaType: 'mixed',
              quality: 0.8,
            }, (response: ImagePickerResponse) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
              } else if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                const newItem: MediaItem = {
                  uri: asset.uri || '',
                  type: asset.type?.includes('video') ? 'video' : 'image',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setTimelapseItems([...timelapseItems, newItem]);
              }
            });
          }
        },
        { 
          text: 'Choose from Library', 
          onPress: () => {
            launchImageLibrary({
              mediaType: 'mixed',
              quality: 0.8,
            }, (response: ImagePickerResponse) => {
              if (response.didCancel) {
                console.log('User cancelled image picker');
              } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
              } else if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                const newItem: MediaItem = {
                  uri: asset.uri || '',
                  type: asset.type?.includes('video') ? 'video' : 'image',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setTimelapseItems([...timelapseItems, newItem]);
              }
            });
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle adding media to post
  const handleAddMedia = () => {
    Alert.alert(
      'Add Media',
      'Choose option',
      [
        { 
          text: 'Take Photo', 
          onPress: () => {
            launchCamera({
              mediaType: 'photo',
              quality: 0.8,
            }, (response: ImagePickerResponse) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                console.log('Camera Error: ', response.errorMessage);
              } else if (response.assets && response.assets.length > 0) {
                setPostMedia(response.assets[0].uri || null);
              }
            });
          }
        },
        { 
          text: 'Choose from Library', 
          onPress: () => {
            launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
            }, (response: ImagePickerResponse) => {
              if (response.didCancel) {
                console.log('User cancelled image picker');
              } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
              } else if (response.assets && response.assets.length > 0) {
                setPostMedia(response.assets[0].uri || null);
              }
            });
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle posting
  const handlePost = () => {
    if (post.trim().length > 0 || postMedia) {
      // Here you would normally send the post to a server
      console.log('Posting:', { text: post, media: postMedia });
      
      // Reset the form
      setPost('');
      setPostMedia(null);
      
      // Show confirmation
      Alert.alert('Success', 'Your post has been shared!');
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
          setEarnWithUsOption(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {earnWithUsOption 
                  ? earnWithUsOption === 'influencer' 
                    ? 'Become an Influencer' 
                    : 'Become a Seller'
                  : 'Earn With Us'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsEarnWithUsModalVisible(false);
                  setEarnWithUsOption(null);
                }}
              >
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {!earnWithUsOption ? (
              <>
                <Text style={styles.modalText}>Choose your earning path:</Text>
                
                <TouchableOpacity 
                  style={styles.earnOption}
                  onPress={() => setEarnWithUsOption('influencer')}
                >
                  <View style={styles.earnOptionIconContainer}>
                    <Text style={styles.earnOptionIcon}>🎬</Text>
                  </View>
                  <View style={styles.earnOptionContent}>
                    <Text style={styles.earnOptionTitle}>Become an Influencer</Text>
                    <Text style={styles.earnOptionDescription}>Share your world, inspire others, earn rewards</Text>
                  </View>
                  <Text style={styles.earnOptionArrow}>›</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.earnOption}
                  onPress={() => setEarnWithUsOption('seller')}
                >
                  <View style={styles.earnOptionIconContainer}>
                    <Text style={styles.earnOptionIcon}>💼</Text>
                  </View>
                  <View style={styles.earnOptionContent}>
                    <Text style={styles.earnOptionTitle}>Become a Seller</Text>
                    <Text style={styles.earnOptionDescription}>Turn your passion into profit with your own shop</Text>
                  </View>
                  <Text style={styles.earnOptionArrow}>›</Text>
                </TouchableOpacity>
              </>
            ) : earnWithUsOption === 'influencer' ? (
              <>
                <View style={styles.influencerBanner}>
                  <Text style={styles.influencerBannerText}>✨ Join Our Creator Program ✨</Text>
                </View>
                
                <Text style={styles.modalText}>As an influencer, you'll enjoy:</Text>
                
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
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>📊</Text>
                    <Text style={styles.benefitText}>Detailed analytics and insights</Text>
                  </View>
                </View>
                
                <Text style={styles.eligibilityText}>
                  Minimum requirements: <Text style={styles.eligibilityHighlight}>1,000 followers</Text> and <Text style={styles.eligibilityHighlight}>30+ daily active viewers</Text>
                </Text>
                
                <TouchableOpacity style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Apply Now</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setEarnWithUsOption(null)}
                >
                  <Text style={styles.backButtonText}>← Back to options</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.sellerBanner}>
                  <Text style={styles.sellerBannerText}>🛍️ Launch Your Shop Today 🛍️</Text>
                </View>
                
                <Text style={styles.modalText}>As a seller, you'll benefit from:</Text>
                
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🏪</Text>
                    <Text style={styles.benefitText}>Your own branded storefront</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>💳</Text>
                    <Text style={styles.benefitText}>Secure payment processing</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>📦</Text>
                    <Text style={styles.benefitText}>Integrated shipping solutions</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>🔔</Text>
                    <Text style={styles.benefitText}>Promotion to relevant customers</Text>
                  </View>
                </View>
                
                <Text style={styles.eligibilityText}>
                  <Text style={styles.eligibilityHighlight}>No minimum follower count required!</Text> Anyone can become a seller and start earning.
                </Text>
                
                <TouchableOpacity style={styles.modalButton}>
                  <Text style={styles.modalButtonText}>Start Selling</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setEarnWithUsOption(null)}
                >
                  <Text style={styles.backButtonText}>← Back to options</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container,
      Platform.OS === 'android' && styles.androidSafeTop
    ]}>
      {/* Header with Settings */}
      <View style={styles.headerWithSettings}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={toggleSettingsMenu}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
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
            contentContainerStyle={styles.timelapseContainer}
          >
            <TouchableOpacity 
              style={styles.addTimelapseButton}
              onPress={handleAddTimelapse}
            >
              <Text style={styles.addTimelapseButtonText}>+</Text>
            </TouchableOpacity>
            
            {timelapseItems.map((item, index) => (
              <View key={index} style={styles.timelapseItem}>
                <Image 
                  source={{ uri: item.uri }} 
                  style={styles.timelapseImage} 
                />
                <Text style={styles.timelapseTime}>{item.timestamp}</Text>
                {item.type === 'video' && (
                  <View style={styles.videoIndicator}>
                    <Text style={styles.videoIndicatorText}>▶️</Text>
                  </View>
                )}
              </View>
            ))}
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
            
            {postMedia && (
              <View style={styles.postMediaPreview}>
                <Image source={{ uri: postMedia }} style={styles.postMediaImage} />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => setPostMedia(null)}
                >
                  <Text style={styles.removeMediaButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.mediaButton}
                onPress={handleAddMedia}
              >
                <Text style={styles.mediaButtonText}>📷</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.postButton,
                  post.trim().length === 0 && !postMedia && styles.postButtonDisabled
                ]}
                onPress={handlePost}
                disabled={post.trim().length === 0 && !postMedia}
              >
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Existing Posts */}
          <View style={styles.postsContainer}>
            <View style={styles.postItem}>
              <View style={styles.postHeader}>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/150' }} 
                  style={styles.postAuthorImage} 
                />
                <View style={styles.postAuthorInfo}>
                  <Text style={styles.postAuthorName}>{userDetails.name}</Text>
                  <Text style={styles.postTime}>Yesterday at 3:45 PM</Text>
                </View>
              </View>
              
              <View style={styles.postContent}>
                <Text style={styles.postText}>
                  This is an example post showing how feature posts will look like in the profile.
                </Text>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/400x300' }} 
                  style={styles.postImage} 
                />
              </View>
              
              <View style={styles.postActionsRow}>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>0 Likes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>0 Comments</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.postItem}>
              <View style={styles.postHeader}>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/150' }} 
                  style={styles.postAuthorImage} 
                />
                <View style={styles.postAuthorInfo}>
                  <Text style={styles.postAuthorName}>{userDetails.name}</Text>
                  <Text style={styles.postTime}>Last week</Text>
                </View>
              </View>
              
              <View style={styles.postContent}>
                <Text style={styles.postText}>
                  Another example post without an image.
                </Text>
              </View>
              
              <View style={styles.postActionsRow}>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.actionIcon}>❤️</Text>
                  <Text style={styles.actionText}>0 Likes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>0 Comments</Text>
                </TouchableOpacity>
              </View>
            </View>
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

      <BottomTabBar currentScreen="profile" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

export default ProfileScreen; 