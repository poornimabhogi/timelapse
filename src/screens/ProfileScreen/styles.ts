import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  androidSafeTop: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Header with Settings
  headerWithSettings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  
  // Settings Menu
  settingsMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    width: 180,
    paddingVertical: 8,
  },
  settingsMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingsMenuItemText: {
    fontSize: 16,
    color: '#333',
  },
  settingsMenuDivider: {
    height: 1,
    backgroundColor: '#EFEFEF',
  },
  
  // Profile Header
  profileHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6B4EFF',
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: screenWidth / 2 - 70, // Position it on the edge of the image
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editProfileButtonText: {
    fontSize: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  followStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingTop: 16,
  },
  followStat: {
    alignItems: 'center',
  },
  followStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  followStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  
  // Today's Timelapse
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  timelapseContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  addTimelapseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#6B4EFF',
    borderStyle: 'dashed',
  },
  addTimelapseButtonText: {
    fontSize: 32,
    color: '#6B4EFF',
  },
  timelapseItem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#6B4EFF',
  },
  timelapseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 37, // Account for border width
  },
  timelapseTime: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#FFFFFF',
    fontSize: 10,
    padding: 4,
    textAlign: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 25,
    right: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicatorText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  
  // Feature Posts
  createPostContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  postInput: {
    minHeight: 80,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  mediaButton: {
    padding: 8,
  },
  mediaButtonText: {
    fontSize: 24,
  },
  postButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  postMediaPreview: {
    position: 'relative',
    marginTop: 12,
  },
  postMediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Posts
  postsContainer: {
    marginTop: 8,
  },
  postItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  postAuthorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postContent: {
    padding: 12,
    paddingTop: 0,
  },
  postText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  postActionsRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },

  // Earn With Us options
  earnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  earnOptionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earnOptionIcon: {
    fontSize: 24,
  },
  earnOptionContent: {
    flex: 1,
  },
  earnOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  earnOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  earnOptionArrow: {
    fontSize: 24,
    color: '#6B4EFF',
  },
  
  // Influencer specific
  influencerBanner: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  influencerBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  
  // Seller specific
  sellerBanner: {
    backgroundColor: '#6FCF97',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sellerBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  
  // Common for both options
  eligibilityText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eligibilityHighlight: {
    fontWeight: '700',
    color: '#333',
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#6B4EFF',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 80,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  modalButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#F2F2F2',
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  editInputContainer: {
    marginBottom: 16,
  },
  editInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  editBioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  earnWithUsDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  benefitContainer: {
    marginBottom: 16,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  benefitBullet: {
    fontSize: 16,
    color: '#6B4EFF',
    width: 20,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  applyButton: {
    backgroundColor: '#6B4EFF',
  },
  learnMoreButton: {
    backgroundColor: '#F2F2F2',
    marginTop: 8,
  },
  learnMoreButtonText: {
    color: '#333',
  },

  // Additional modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#666',
    paddingHorizontal: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  
  // Benefits list styles
  benefitsList: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  timelapseScrollView: {
    marginTop: 8,
  },
  addTimelapseText: {
    fontSize: 24,
    color: '#6B4EFF',
    fontWeight: 'bold',
  },
  mediaPreviewContainer: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  cameraButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  cameraIcon: {
    fontSize: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  sellerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  sellerStatusText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  startSellingButton: {
    backgroundColor: '#6B4EFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  startSellingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Toggle styles for Earn With Us
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  toggleOptionContent: {
    flex: 1,
  },
  toggleOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toggleOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 3,
  },
  toggleSwitchActive: {
    backgroundColor: '#6B4EFF',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleHandleActive: {
    transform: [{ translateX: 20 }],
  },
  optionDetailsContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },

  // Like indicators for timelapses
  likeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
  },
  likeCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 