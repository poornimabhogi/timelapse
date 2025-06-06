import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidSafeTop: {
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    alignItems: 'center',
    padding: 8,
  },
  searchIconContainer: {
    marginRight: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
    marginVertical: 8,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  timeCapsuleList: {
    paddingVertical: 8,
  },
  timeCapsuleItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  timeCapsuleImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCapsuleActive: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  userImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  timeCapsuleUsername: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    color: '#333',
  },
  featurePostsList: {
    marginTop: 8,
  },
  featurePostItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postAuthorInfo: {
    justifyContent: 'center',
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
  },
  moreOptions: {
    padding: 8,
  },
  postContent: {
    marginBottom: 12,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    color: '#333',
  },
  postImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  videoIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicatorText: {
    fontSize: 14,
    color: 'white',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  feedList: {
    width: '100%',
    paddingHorizontal: 0,
  },
  timelapseScrollView: {
    marginTop: 10,
    paddingHorizontal: 10,
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
    borderRadius: 37,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 